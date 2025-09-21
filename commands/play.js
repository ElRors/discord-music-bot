const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('@distube/ytdl-core');
const YouTubeSearchAPI = require('youtube-search-api');
const SpotifyWebApi = require('spotify-web-api-node');
const musicState = require('../utils/musicState');

// Configurar Spotify API
const spotify = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

// Función auxiliar para autenticar Spotify
async function authenticateSpotify() {
    try {
        const data = await spotify.clientCredentialsGrant();
        spotify.setAccessToken(data.body['access_token']);
    } catch (error) {
        console.error('Error al autenticar con Spotify:', error);
        throw error;
    }
}

// Función auxiliar para detectar URLs de Spotify
function isSpotifyUrl(url) {
    return url.includes('spotify.com') || url.includes('open.spotify.com');
}

// Función auxiliar para extraer ID de Spotify
function extractSpotifyId(url) {
    const match = url.match(/(?:track|playlist|album)\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}

// Función para manejar tracks de Spotify
async function handleSpotifyTrack(trackId) {
    try {
        await authenticateSpotify();
        const track = await spotify.getTrack(trackId);
        const trackData = track.body;
        
        // Buscar en YouTube usando metadatos de Spotify
        const searchQuery = `${trackData.artists[0].name} ${trackData.name}`;
        console.log(`🔍 [PLAY] Buscando en YouTube: ${searchQuery}`);
        const searchResults = await YouTubeSearchAPI.GetListByKeyword(searchQuery, false, 1);
        
        if (searchResults.items && searchResults.items.length > 0) {
            const youtubeUrl = `https://www.youtube.com/watch?v=${searchResults.items[0].id}`;
            
            return {
                url: youtubeUrl,
                title: `${trackData.artists[0].name} - ${trackData.name}`,
                artist: trackData.artists[0].name,
                duration: Math.floor(trackData.duration_ms / 1000),
                isSpotify: true,
                source: 'SPOTIFY→YT',
                requestedBy: 'Usuario'
            };
        }
        
        throw new Error('No se encontró el track en YouTube');
    } catch (error) {
        console.error('Error al procesar track de Spotify:', error);
        throw error;
    }
}

// Función auxiliar para manejar búsquedas de YouTube por texto
async function handleYouTubeSearch(searchQuery) {
    try {
        console.log(`🔍 [PLAY] Buscando en YouTube: ${searchQuery}`);
        const searchResults = await YouTubeSearchAPI.GetListByKeyword(searchQuery, false, 1);
        
        if (searchResults.items && searchResults.items.length > 0) {
            const video = searchResults.items[0];
            const youtubeUrl = `https://www.youtube.com/watch?v=${video.id}`;
            
            return {
                url: youtubeUrl,
                title: video.title,
                source: 'YT-SEARCH',
                requestedBy: 'Usuario'
            };
        }
        
        throw new Error('No se encontraron resultados para la búsqueda');
    } catch (error) {
        console.error('Error al buscar en YouTube:', error);
        throw error;
    }
}

// Función auxiliar para crear stream de audio con respaldo
async function createAudioStream(url) {
    try {
        // Intentar primero con ytdl-core
        console.log('🎵 [PLAY] Intentando con ytdl-core...');
        const stream = ytdl(url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            }
        });
        
        return createAudioResource(stream);
    } catch (error) {
        console.log('❌ [PLAY] ytdl-core falló, intentando con play-dl...');
        try {
            const play = require('play-dl');
            const stream = await play.stream(url, { 
                quality: 2 // alta calidad
            });
            return createAudioResource(stream.stream, {
                inputType: stream.type
            });
        } catch (playDlError) {
            console.error('❌ [PLAY] Ambos métodos fallaron:', playDlError);
            throw playDlError;
        }
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Reproduce música desde Spotify, YouTube o búsqueda por texto')
        .addStringOption(option =>
            option.setName('cancion')
                .setDescription('URL de Spotify/YouTube o nombre de la canción')
                .setRequired(true)),

    async execute(interaction) {
        const query = interaction.options.getString('cancion');
        const voiceChannel = interaction.member.voice.channel;

        console.log(`🎵 [PLAY] Iniciando comando con: ${query}`);

        if (!voiceChannel) {
            return await interaction.reply('❌ Debes estar en un canal de voz!');
        }

        // Responder inmediatamente para evitar timeout
        await interaction.reply('🎵 Procesando canción...');

        try {
            let song;

            // Procesar según el tipo de URL
            if (isSpotifyUrl(query)) {
                console.log('🎧 [PLAY] Detectada URL de Spotify');
                const spotifyId = extractSpotifyId(query);
                
                if (!spotifyId) {
                    return await interaction.editReply('❌ URL de Spotify inválida.');
                }
                
                if (query.includes('/track/')) {
                    await interaction.editReply('🎧 Procesando track de Spotify...');
                    song = await handleSpotifyTrack(spotifyId);
                } else {
                    return await interaction.editReply('❌ Solo se soportan tracks individuales en este comando.');
                }
                
            } else if (ytdl.validateURL(query)) {
                console.log('🎵 [PLAY] URL de YouTube detectada');
                await interaction.editReply('🎵 Procesando video de YouTube...');
                const videoInfo = await ytdl.getInfo(query);
                song = {
                    title: videoInfo.videoDetails.title,
                    url: query,
                    source: 'YT',
                    requestedBy: interaction.user.tag
                };
            } else {
                // Búsqueda por texto en YouTube
                console.log('🔍 [PLAY] Búsqueda por texto detectada');
                await interaction.editReply('🔍 Buscando en YouTube...');
                song = await handleYouTubeSearch(query);
            }

            console.log(`🎵 [PLAY] Canción procesada: ${song.title}`);

            // Inicializar cola si no existe
            if (!global.musicQueue) {
                global.musicQueue = [];
            }

            global.musicQueue.push(song);

            await interaction.editReply(`✅ **${song.title}** agregada a la cola.`);

            // Si no hay nada reproduciéndose, empezar reproducción
            if (!global.currentConnection) {
                console.log(`🎵 [PLAY] Iniciando reproducción directa...`);
                await startPlayback(voiceChannel, interaction.channel, song);
            }

        } catch (error) {
            console.error('❌ [PLAY] Error:', error);
            await interaction.editReply('❌ Error al procesar la música: ' + error.message);
        }
    },
};

// Función simplificada para iniciar reproducción
async function startPlayback(voiceChannel, textChannel, song) {
    try {
        console.log(`🎵 [PLAY] Conectando al canal de voz: ${voiceChannel.name}`);
        
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: true,
        });

        global.currentConnection = connection;
        global.lastVoiceChannel = voiceChannel;
        global.lastTextChannel = textChannel;
        // Guardar la canción que se va a reproducir en una variable global temporal
        global.pendingSong = song;

        console.log(`🎵 [PLAY] Creando stream de audio...`);
        const resource = await createAudioStream(song.url);

        // Usar reproductor global o crear uno nuevo
        if (!global.audioPlayer) {
            console.log('🎵 [PLAY] Creando reproductor global...');
            global.audioPlayer = createAudioPlayer();
            
            // Configurar eventos una sola vez
            global.audioPlayer.on(AudioPlayerStatus.Idle, async () => {
                console.log('🎵 [PLAY] Canción terminada, verificando siguiente...');
                
                // Reproducir siguiente canción de la cola si hay alguna
                if (global.musicQueue && global.musicQueue.length > 0) {
                    console.log('▶️ [PLAY] Reproduciendo siguiente de la cola...');
                    const nextSong = global.musicQueue.shift();
                    // No actualizar currentSong aquí - se actualizará en el evento Playing
                    await startPlayback(voiceChannel, textChannel, nextSong);
                } else {
                    console.log('⏰ [PLAY] No hay más canciones - iniciando timer inactividad');
                    global.currentSong = null;
                    if (typeof global.startInactivityTimer === 'function') {
                        global.startInactivityTimer();
                    }
                }
            });

            global.audioPlayer.on(AudioPlayerStatus.Playing, () => {
                // Usar la canción pendiente en lugar de la variable del closure
                if (global.pendingSong) {
                    global.currentSong = global.pendingSong;
                    console.log(`▶️ [PLAY] Reproduciendo: ${global.currentSong.title}`);
                    console.log(`🎵 [PLAY] Estado actualizado - currentSong: ${global.currentSong.title}`);
                    console.log(`🎵 [PLAY] Fuente: ${global.currentSong.source}`);
                    // Limpiar la canción pendiente ya que se asignó a currentSong
                    global.pendingSong = null;
                } else {
                    console.log(`⚠️ [PLAY] No hay canción pendiente cuando empezó a reproducir`);
                }
                
                // Cancelar timer de inactividad cuando se está reproduciendo
                if (typeof global.cancelInactivityTimer === 'function') {
                    global.cancelInactivityTimer();
                }
            });

            global.audioPlayer.on('error', error => {
                console.error('❌ [PLAY] Error reproductor:', error);
                
                // Intentar reproducir la siguiente canción si hay alguna
                if (global.musicQueue && global.musicQueue.length > 0) {
                    setTimeout(() => {
                        if (global.lastVoiceChannel && global.lastTextChannel) {
                            const nextSong = global.musicQueue.shift();
                            // No actualizar currentSong aquí - se actualizará en el evento Playing
                            startPlayback(global.lastVoiceChannel, global.lastTextChannel, nextSong);
                        }
                    }, 2000);
                }
            });
        }

        console.log(`▶️ [PLAY] Iniciando reproducción...`);
        global.audioPlayer.play(resource);
        connection.subscribe(global.audioPlayer);
        
        await textChannel.send(`🎵 **Reproduciendo:** ${song.title}`);
        console.log(`✅ [PLAY] Reproducción iniciada exitosamente`);

    } catch (error) {
        console.error('❌ [PLAY] Error en reproducción:', error);
        throw error;
    }
}