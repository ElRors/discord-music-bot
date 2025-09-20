const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('@distube/ytdl-core');
const YouTubeSearchAPI = require('youtube-search-api');
const SpotifyWebApi = require('spotify-web-api-node');
const play = require('play-dl');

// Configurar Spotify API
const spotify = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

// Función auxiliar para crear stream de audio con respaldo
async function createAudioStream(url) {
    console.log('🎵 Intentando con ytdl-core...');
    
    // Primero verificar si la URL es válida para ytdl
    if (!ytdl.validateURL(url)) {
        console.log('❌ URL no válida para ytdl-core, usando play-dl...');
        const stream = await play.stream(url, { 
            quality: 2 // alta calidad
        });
        return createAudioResource(stream.stream, {
            inputType: stream.type
        });
    }

    try {
        const stream = ytdl(url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            }
        });
        
        console.log('✅ Stream de ytdl-core creado');
        return createAudioResource(stream);
    } catch (error) {
        console.log('❌ ytdl-core falló, intentando con play-dl...');
        try {
            const stream = await play.stream(url, { 
                quality: 2 // alta calidad
            });
            console.log('✅ Stream de play-dl creado');
            return createAudioResource(stream.stream, {
                inputType: stream.type
            });
        } catch (playDlError) {
            console.error('❌ Ambos métodos fallaron:', playDlError);
            throw playDlError;
        }
    }
}

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
        const searchResults = await YouTubeSearchAPI.GetListByKeyword(searchQuery, false, 1);
        
        if (searchResults.items && searchResults.items.length > 0) {
            const youtubeUrl = `https://www.youtube.com/watch?v=${searchResults.items[0].id}`;
            
            return {
                url: youtubeUrl,
                title: trackData.name,
                artist: trackData.artists[0].name,
                duration: Math.floor(trackData.duration_ms / 1000),
                isSpotify: true,
                thumbnailUrl: trackData.album.images[0]?.url
            };
        }
        
        throw new Error('No se encontró el track en YouTube');
    } catch (error) {
        console.error('Error al procesar track de Spotify:', error);
        throw error;
    }
}

// Función para manejar playlists de Spotify
async function handleSpotifyPlaylist(playlistId) {
    try {
        await authenticateSpotify();
        const playlist = await spotify.getPlaylist(playlistId);
        const playlistData = playlist.body;
        
        const tracks = [];
        const items = playlistData.tracks.items;
        
        console.log(`🎧 Procesando playlist de Spotify: ${playlistData.name} (${items.length} canciones)`);
        
        for (let i = 0; i < Math.min(items.length, 50); i++) { // Límite de 50 canciones
            const track = items[i].track;
            if (track && track.type === 'track') {
                try {
                    const searchQuery = `${track.artists[0].name} ${track.name}`;
                    const searchResults = await YouTubeSearchAPI.GetListByKeyword(searchQuery, false, 1);
                    
                    if (searchResults.items && searchResults.items.length > 0) {
                        const youtubeUrl = `https://www.youtube.com/watch?v=${searchResults.items[0].id}`;
                        
                        tracks.push({
                            url: youtubeUrl,
                            title: track.name,
                            artist: track.artists[0].name,
                            duration: Math.floor(track.duration_ms / 1000),
                            isSpotify: true,
                            thumbnailUrl: track.album.images[0]?.url
                        });
                    }
                } catch (error) {
                    console.error(`Error al procesar track ${i + 1}:`, error);
                }
            }
        }
        
        return {
            tracks,
            playlistName: playlistData.name,
            playlistUrl: playlistData.external_urls.spotify
        };
    } catch (error) {
        console.error('Error al procesar playlist de Spotify:', error);
        throw error;
    }
}

// Función para reproducir la siguiente canción de la cola
async function playNextSong(voiceChannel, textChannel) {
    if (!global.musicQueue || global.musicQueue.length === 0) {
        console.log('❌ No hay canciones en la cola');
        global.currentConnection = null;
        return;
    }

    const song = global.musicQueue.shift();
    
    try {
        console.log(`🎵 Reproduciendo: ${song.title}`);
        console.log(`🔗 URL: ${song.url}`);
        
        console.log('🔌 Conectando al canal de voz...');
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        global.currentConnection = connection;
        console.log('✅ Conectado al canal de voz');

        // Usar reproductor global o crear uno nuevo
        if (!global.audioPlayer) {
            console.log('🎵 Creando reproductor global...');
            global.audioPlayer = createAudioPlayer();
            
            // Configurar eventos una sola vez
            global.audioPlayer.on(AudioPlayerStatus.Idle, () => {
                console.log('🎵 Canción terminada, reproduciendo siguiente...');
                console.log(`📝 Canciones restantes en cola: ${global.musicQueue ? global.musicQueue.length : 0}`);
                setTimeout(() => {
                    if (global.lastVoiceChannel && global.lastTextChannel) {
                        playNextSong(global.lastVoiceChannel, global.lastTextChannel);
                    }
                }, 1000);
            });

            global.audioPlayer.on(AudioPlayerStatus.Playing, () => {
                console.log('▶️ Estado: Reproduciendo');
            });

            global.audioPlayer.on('error', error => {
                console.error('❌ Error reproductor:', error);
                setTimeout(() => {
                    if (global.lastVoiceChannel && global.lastTextChannel) {
                        playNextSong(global.lastVoiceChannel, global.lastTextChannel);
                    }
                }, 1000);
            });
        }

        // Guardar referencias para los callbacks
        global.lastVoiceChannel = voiceChannel;
        global.lastTextChannel = textChannel;

        console.log('🎵 Creando stream de audio...');
        // Usar la nueva función de stream con respaldo
        const resource = await createAudioStream(song.url);
        console.log('✅ Stream de audio creado');

        console.log('▶️ Iniciando reproducción...');
        global.audioPlayer.play(resource);
        connection.subscribe(global.audioPlayer);
        console.log('✅ Reproductor conectado');

        if (textChannel) {
            const artist = song.artist ? ` por **${song.artist}**` : '';
            textChannel.send(`🎵 **Reproduciendo:** ${song.title}${artist}`);
        }

    } catch (error) {
        console.error('❌ Error al reproducir:', error);
        setTimeout(() => {
            playNextSong(voiceChannel, textChannel);
        }, 1000);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Reproduce música de YouTube o Spotify')
        .addStringOption(option =>
            option.setName('cancion')
                .setDescription('Nombre de canción, URL de YouTube o URL de Spotify')
                .setRequired(true)),

    async execute(interaction) {
        const query = interaction.options.getString('cancion');
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return await interaction.reply('❌ Debes estar en un canal de voz!');
        }

        await interaction.deferReply();

        try {
            console.log(`🎵 Comando recibido: ${query}`);
            console.log(`🔍 Verificando si es URL de Spotify: ${isSpotifyUrl(query)}`);
            
            // Detectar si es una URL de Spotify
            if (isSpotifyUrl(query)) {
                console.log('🎧 Detectada URL de Spotify');
                const spotifyId = extractSpotifyId(query);
                
                if (!spotifyId) {
                    return await interaction.editReply('❌ URL de Spotify inválida.');
                }
                
                // Verificar si es playlist o track
                if (query.includes('/playlist/')) {
                    console.log('📝 Procesando playlist de Spotify...');
                    await interaction.editReply('🎧 Procesando playlist de Spotify...');
                    
                    const playlistData = await handleSpotifyPlaylist(spotifyId);
                    
                    if (playlistData.tracks.length === 0) {
                        return await interaction.editReply('❌ No se pudo procesar la playlist.');
                    }
                    
                    // Inicializar o obtener la cola
                    if (!global.musicQueue) {
                        global.musicQueue = [];
                        global.guildSettings = global.guildSettings || {};
                        global.guildSettings[interaction.guild.id] = { shuffle: false };
                    }
                    
                    // Agregar todas las canciones a la cola
                    global.musicQueue.push(...playlistData.tracks);
                    
                    await interaction.editReply(`✅ Agregadas ${playlistData.tracks.length} canciones de la playlist **${playlistData.playlistName}** a la cola.`);
                    
                    // Si no hay nada reproduciéndose, empezar
                    if (!global.currentConnection) {
                        playNextSong(voiceChannel, interaction.channel);
                    }
                    
                    return;
                    
                } else if (query.includes('/track/')) {
                    console.log('🎵 Procesando track de Spotify...');
                    await interaction.editReply('🎧 Procesando track de Spotify...');
                    
                    const trackData = await handleSpotifyTrack(spotifyId);
                    
                    // Inicializar cola si no existe
                    if (!global.musicQueue) {
                        global.musicQueue = [];
                        global.guildSettings = global.guildSettings || {};
                        global.guildSettings[interaction.guild.id] = { shuffle: false };
                    }
                    
                    global.musicQueue.push(trackData);
                    
                    await interaction.editReply(`✅ **${trackData.title}** por **${trackData.artist}** agregada a la cola.`);
                    
                    // Si no hay nada reproduciéndose, empezar
                    if (!global.currentConnection) {
                        playNextSong(voiceChannel, interaction.channel);
                    }
                    
                    return;
                }
            }
            
            // Lógica original para YouTube
            let videoUrl = query;

            // Si no es URL de YouTube, buscar
            if (!ytdl.validateURL(query)) {
                console.log('🔍 Buscando en YouTube...');
                const searchResults = await YouTubeSearchAPI.GetListByKeyword(query, false, 1);
                
                if (!searchResults.items || searchResults.items.length === 0) {
                    return await interaction.editReply('❌ No encontré nada.');
                }
                
                videoUrl = `https://www.youtube.com/watch?v=${searchResults.items[0].id}`;
                console.log(`✅ Encontrado: ${videoUrl}`);
            }

            // Validar URL
            if (!ytdl.validateURL(videoUrl)) {
                return await interaction.editReply('❌ URL no válida.');
            }

            console.log(`🎵 Obteniendo info del video...`);
            const videoInfo = await ytdl.getInfo(videoUrl);
            const videoTitle = videoInfo.videoDetails.title;

            console.log(`🎵 Conectando a canal de voz...`);
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            console.log(`🎵 Creando reproductor...`);
            const player = createAudioPlayer();
            
            // Usar la nueva función de stream con respaldo
            const resource = await createAudioStream(videoUrl);

            console.log(`🎵 Iniciando reproducción...`);
            player.play(resource);
            connection.subscribe(player);

            player.on(AudioPlayerStatus.Playing, () => {
                console.log(`▶️ Reproduciendo: ${videoTitle}`);
            });

            player.on('error', error => {
                console.error('❌ Error reproductor:', error);
            });

            await interaction.editReply(`🎵 **Reproduciendo:** ${videoTitle}`);

        } catch (error) {
            console.error('❌ Error general:', error);
            await interaction.editReply('❌ Error al reproducir música.');
        }
    },
};