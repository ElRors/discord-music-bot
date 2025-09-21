const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const SpotifyWebApi = require('spotify-web-api-node');
const ytdl = require('@distube/ytdl-core');
const YouTubeSearchAPI = require('youtube-search-api');
const musicState = require('../utils/musicState');

// Configurar Spotify API
const spotify = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

// ID de usuario autorizado (ElRors#9414)
const AUTHORIZED_USER_ID = '348607763674914816'; // Tu Discord User ID

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spotify-exclusive')
        .setDescription('[EXCLUSIVO ElRors] Reproducir música usando la API completa de Spotify')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('URL de Spotify o nombre de canción/artista')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('queue')
                .setDescription('Agregar a la cola en lugar de reproducir inmediatamente')
                .setRequired(false)),

    async execute(interaction) {
        // Verificar que solo ElRors pueda usar este comando
        if (interaction.user.id !== AUTHORIZED_USER_ID) {
            return await interaction.reply({
                content: '🚫 **Acceso Denegado** - Este comando es exclusivo para ElRors.',
                ephemeral: true
            });
        }

        const query = interaction.options.getString('query');
        const addToQueue = interaction.options.getBoolean('queue') || false;

        // Respuesta inmediata
        await interaction.reply(`🎵 **[SPOTIFY EXCLUSIVE]** Procesando: \`${query}\``);

        try {
            // Verificar si el usuario está en un canal de voz
            const voiceChannel = interaction.member.voice.channel;
            if (!voiceChannel) {
                return await interaction.editReply('❌ Debes estar en un canal de voz para usar este comando.');
            }

            // Autenticar con Spotify
            await authenticateSpotify();
            
            let song;
            
            if (query.includes('spotify.com')) {
                // Es una URL de Spotify
                song = await processSpotifyUrl(query);
            } else {
                // Es una búsqueda de texto
                song = await searchSpotifyTrack(query);
            }

            song.requestedBy = 'ElRors (Exclusive Mode)';

            if (addToQueue && musicState.hasActiveMusic()) {
                // Agregar a la cola
                if (!global.musicQueue) {
                    global.musicQueue = [];
                }
                global.musicQueue.push(song);
                
                const embed = new EmbedBuilder()
                    .setColor('#1DB954')
                    .setTitle('✅ Agregado a la Cola (Exclusive)')
                    .setDescription(`**${song.title}**${song.artist ? ` por ${song.artist}` : ''}`)
                    .addFields(
                        { name: '🎵 Fuente', value: '[SPOTIFY EXCLUSIVE]', inline: true },
                        { name: '📋 Posición en cola', value: global.musicQueue.length.toString(), inline: true }
                    )
                    .setTimestamp();

                await interaction.editReply({ content: '', embeds: [embed] });
            } else {
                // Reproducir inmediatamente
                await startExclusivePlayback(voiceChannel, interaction.channel, song);
                
                const embed = new EmbedBuilder()
                    .setColor('#1DB954')
                    .setTitle('🎵 Reproduciendo (Spotify Exclusive)')
                    .setDescription(`**${song.title}**${song.artist ? ` por ${song.artist}` : ''}`)
                    .addFields(
                        { name: '🎵 Fuente', value: '[SPOTIFY EXCLUSIVE]', inline: true },
                        { name: '🔗 URL', value: song.spotifyUrl || 'N/A', inline: true }
                    );

                // Si viene de una playlist, agregar información adicional
                if (song.playlistInfo) {
                    embed.addFields(
                        { name: '📋 Playlist', value: song.playlistInfo.name, inline: true },
                        { name: '🎵 Total de canciones', value: `${song.playlistInfo.totalTracks} (${song.playlistInfo.totalTracks - 1} agregadas a la cola)`, inline: true },
                        { name: '👤 Creador', value: song.playlistInfo.owner, inline: true }
                    );
                }

                embed.setTimestamp()
                    .setFooter({ text: 'Modo exclusivo activo - ElRors' });

                await interaction.editReply({ content: '', embeds: [embed] });
            }

        } catch (error) {
            console.error('❌ [SPOTIFY-EXCLUSIVE] Error:', error);
            await interaction.editReply(`❌ **Error en modo exclusivo:** ${error.message}`);
        }
    },
};

// Función para autenticar con Spotify
async function authenticateSpotify() {
    try {
        const data = await spotify.clientCredentialsGrant();
        spotify.setAccessToken(data.body['access_token']);
        console.log('✅ [SPOTIFY-EXCLUSIVE] Autenticado con Spotify');
    } catch (error) {
        console.error('❌ [SPOTIFY-EXCLUSIVE] Error autenticando Spotify:', error);
        throw new Error('No se pudo autenticar con Spotify');
    }
}

// Función para procesar URL de Spotify
async function processSpotifyUrl(url) {
    try {
        // Determinar si es una playlist o un track
        if (url.includes('/playlist/')) {
            return await processSpotifyPlaylist(url);
        } else if (url.includes('/track/')) {
            return await processSpotifyTrack(url);
        } else {
            throw new Error('URL de Spotify no válida (debe ser track o playlist)');
        }
    } catch (error) {
        console.error('❌ [SPOTIFY-EXCLUSIVE] Error procesando URL:', error);
        throw error;
    }
}

// Función para procesar track individual de Spotify
async function processSpotifyTrack(url) {
    try {
        const trackId = extractSpotifyTrackId(url);
        if (!trackId) {
            throw new Error('URL de track de Spotify no válida');
        }

        const track = await spotify.getTrack(trackId);
        const trackData = track.body;

        // Buscar el equivalente en YouTube
        const searchQuery = `${trackData.artists[0].name} ${trackData.name}`;
        const youtubeUrl = await findYouTubeEquivalent(searchQuery);

        return {
            title: trackData.name,
            artist: trackData.artists.map(artist => artist.name).join(', '),
            url: youtubeUrl,
            spotifyUrl: url,
            source: 'SPOTIFY-EXCLUSIVE',
            isSpotify: true,
            album: trackData.album.name,
            duration: Math.floor(trackData.duration_ms / 1000),
            popularity: trackData.popularity
        };
    } catch (error) {
        console.error('❌ [SPOTIFY-EXCLUSIVE] Error procesando track:', error);
        throw error;
    }
}

// Función para procesar playlist de Spotify
async function processSpotifyPlaylist(url) {
    try {
        const playlistId = extractSpotifyPlaylistId(url);
        if (!playlistId) {
            throw new Error('URL de playlist de Spotify no válida');
        }

        // Obtener información de la playlist
        const playlist = await spotify.getPlaylist(playlistId);
        const playlistData = playlist.body;

        // Obtener todas las pistas de la playlist
        const tracks = [];
        let offset = 0;
        const limit = 50; // Límite por solicitud de la API

        while (true) {
            const playlistTracks = await spotify.getPlaylistTracks(playlistId, {
                offset: offset,
                limit: limit
            });

            const tracksData = playlistTracks.body.items;
            if (tracksData.length === 0) break;

            for (const item of tracksData) {
                if (item.track && item.track.type === 'track') {
                    const track = item.track;
                    try {
                        // Buscar equivalente en YouTube para cada track
                        const searchQuery = `${track.artists[0].name} ${track.name}`;
                        const youtubeUrl = await findYouTubeEquivalent(searchQuery);

                        tracks.push({
                            title: track.name,
                            artist: track.artists.map(artist => artist.name).join(', '),
                            url: youtubeUrl,
                            spotifyUrl: track.external_urls.spotify,
                            source: 'SPOTIFY-EXCLUSIVE',
                            isSpotify: true,
                            album: track.album.name,
                            duration: Math.floor(track.duration_ms / 1000),
                            popularity: track.popularity
                        });
                    } catch (error) {
                        console.warn(`⚠️ [SPOTIFY-EXCLUSIVE] No se pudo procesar: ${track.name} - ${error.message}`);
                    }
                }
            }

            offset += limit;
            if (tracksData.length < limit) break; // No hay más páginas
        }

        if (tracks.length === 0) {
            throw new Error('No se pudieron procesar las canciones de la playlist');
        }

        // Retornar la primera canción y agregar el resto a la cola
        const firstTrack = tracks[0];
        const remainingTracks = tracks.slice(1);

        // Agregar las canciones restantes a la cola global
        if (!global.musicQueue) {
            global.musicQueue = [];
        }
        global.musicQueue.push(...remainingTracks);

        // Agregar información de la playlist al primer track
        firstTrack.playlistInfo = {
            name: playlistData.name,
            totalTracks: tracks.length,
            description: playlistData.description,
            owner: playlistData.owner.display_name
        };

        return firstTrack;
    } catch (error) {
        console.error('❌ [SPOTIFY-EXCLUSIVE] Error procesando playlist:', error);
        throw error;
    }
}

// Función para buscar en Spotify
async function searchSpotifyTrack(query) {
    try {
        const searchResults = await spotify.searchTracks(query, { limit: 1 });
        
        if (!searchResults.body.tracks.items || searchResults.body.tracks.items.length === 0) {
            throw new Error('No se encontraron resultados en Spotify');
        }

        const track = searchResults.body.tracks.items[0];
        
        // Buscar el equivalente en YouTube
        const searchQuery = `${track.artists[0].name} ${track.name}`;
        const youtubeUrl = await findYouTubeEquivalent(searchQuery);

        return {
            title: track.name,
            artist: track.artists.map(artist => artist.name).join(', '),
            url: youtubeUrl,
            spotifyUrl: track.external_urls.spotify,
            source: 'SPOTIFY-EXCLUSIVE',
            isSpotify: true,
            album: track.album.name,
            duration: Math.floor(track.duration_ms / 1000),
            popularity: track.popularity
        };
    } catch (error) {
        console.error('❌ [SPOTIFY-EXCLUSIVE] Error buscando en Spotify:', error);
        throw error;
    }
}

// Función para encontrar equivalente en YouTube
async function findYouTubeEquivalent(searchQuery) {
    try {
        console.log(`🔍 [SPOTIFY-EXCLUSIVE] Buscando en YouTube: ${searchQuery}`);
        const searchResults = await YouTubeSearchAPI.GetListByKeyword(searchQuery, false, 5);
        
        if (!searchResults.items || searchResults.items.length === 0) {
            throw new Error('No se encontró equivalente en YouTube');
        }

        // Buscar el mejor match (preferir videos de música oficiales)
        let bestMatch = searchResults.items[0];
        
        for (const item of searchResults.items) {
            const title = item.title.toLowerCase();
            if (title.includes('official') || title.includes('music video') || title.includes('lyric')) {
                bestMatch = item;
                break;
            }
        }

        const youtubeUrl = `https://www.youtube.com/watch?v=${bestMatch.id}`;
        console.log(`✅ [SPOTIFY-EXCLUSIVE] YouTube encontrado: ${bestMatch.title}`);
        return youtubeUrl;
    } catch (error) {
        console.error('❌ [SPOTIFY-EXCLUSIVE] Error buscando YouTube:', error);
        throw error;
    }
}

// Función para extraer ID de track de Spotify
function extractSpotifyTrackId(url) {
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}

// Función para extraer ID de playlist de Spotify
function extractSpotifyPlaylistId(url) {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}

// Función para iniciar reproducción exclusiva
async function startExclusivePlayback(voiceChannel, textChannel, song) {
    try {
        console.log(`🎵 [SPOTIFY-EXCLUSIVE] Iniciando reproducción: ${song.title}`);
        
        // Conectar al canal de voz
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        // Actualizar variables globales
        global.currentConnection = connection;
        global.lastVoiceChannel = voiceChannel;
        global.lastTextChannel = textChannel;
        global.pendingSong = song;

        // Crear stream de audio
        console.log(`🎵 [SPOTIFY-EXCLUSIVE] Creando stream de audio...`);
        const stream = ytdl(song.url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25
        });

        const resource = createAudioResource(stream, {
            inputType: 'arbitrary',
            inlineVolume: true
        });

        // Crear o usar reproductor global
        if (!global.audioPlayer) {
            console.log('🎵 [SPOTIFY-EXCLUSIVE] Creando reproductor...');
            global.audioPlayer = createAudioPlayer();
            
            global.audioPlayer.on(AudioPlayerStatus.Playing, () => {
                if (global.pendingSong) {
                    global.currentSong = global.pendingSong;
                    console.log(`▶️ [SPOTIFY-EXCLUSIVE] Reproduciendo: ${global.currentSong.title}`);
                    global.pendingSong = null;
                }
            });

            global.audioPlayer.on(AudioPlayerStatus.Idle, async () => {
                console.log('🎵 [SPOTIFY-EXCLUSIVE] Canción terminada');
                if (global.musicQueue && global.musicQueue.length > 0) {
                    const nextSong = global.musicQueue.shift();
                    await startExclusivePlayback(voiceChannel, textChannel, nextSong);
                } else {
                    global.currentSong = null;
                }
            });

            global.audioPlayer.on('error', error => {
                console.error('❌ [SPOTIFY-EXCLUSIVE] Error reproductor:', error);
            });
        }

        // Iniciar reproducción
        global.audioPlayer.play(resource);
        connection.subscribe(global.audioPlayer);
        
        console.log(`✅ [SPOTIFY-EXCLUSIVE] Reproducción iniciada exitosamente`);
    } catch (error) {
        console.error('❌ [SPOTIFY-EXCLUSIVE] Error en reproducción:', error);
        throw error;
    }
}