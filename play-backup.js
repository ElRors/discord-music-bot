const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
    try {
        // Intentar primero con ytdl-core
        console.log('🎵 Intentando con ytdl-core...');
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
        console.log('❌ ytdl-core falló, intentando con play-dl...');
        try {
            const stream = await play.stream(url, { 
                quality: 2 // alta calidad
            });
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

// Función auxiliar para detectar playlists especiales de Spotify
function isSpotifySpecialPlaylist(playlistId) {
    // Playlists de Spotify que empiezan con 37i9dQZF1 suelen ser especiales
    return playlistId.startsWith('37i9dQZF1');
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
        console.log(`🔍 Intentando procesar playlist ID: ${playlistId}`);
        await authenticateSpotify();
        console.log('✅ Autenticación de Spotify exitosa');
        
        const playlist = await spotify.getPlaylist(playlistId);
        const playlistData = playlist.body;
        console.log(`📋 Playlist obtenida: ${playlistData.name}`);
        
        const tracks = [];
        const items = playlistData.tracks.items;
        
        console.log(`🎧 Procesando playlist de Spotify: ${playlistData.name} (${items.length} canciones)`);
        
        for (let i = 0; i < Math.min(items.length, 50); i++) { // Límite de 50 canciones
            const track = items[i].track;
            if (track && track.type === 'track') {
                try {
                    const searchQuery = `${track.artists[0].name} ${track.name}`;
                    console.log(`🔍 Buscando: ${searchQuery}`);
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
                        console.log(`✅ Track ${i + 1} procesado: ${track.name}`);
                    } else {
                        console.log(`❌ No se encontró en YouTube: ${searchQuery}`);
                    }
                } catch (error) {
                    console.error(`❌ Error al procesar track ${i + 1} (${track.name}):`, error.message);
                }
            }
        }
        
        console.log(`✅ Procesamiento completado: ${tracks.length} tracks exitosos de ${items.length} totales`);
        return {
            tracks,
            playlistName: playlistData.name,
            playlistUrl: playlistData.external_urls.spotify
        };
    } catch (error) {
        console.error('❌ Error detallado al procesar playlist de Spotify:', error);
        if (error.statusCode === 404) {
            throw new Error('Playlist no encontrada o es privada');
        } else if (error.statusCode === 401) {
            throw new Error('Error de autenticación con Spotify');
        } else if (error.statusCode === 429) {
            throw new Error('Límite de tasa excedido, intenta de nuevo en un momento');
        } else {
            throw new Error(`Error de Spotify: ${error.message || 'Error desconocido'}`);
        }
    }
}

// Función para manejar álbumes de Spotify
async function handleSpotifyAlbum(albumId) {
    try {
        await authenticateSpotify();
        const album = await spotify.getAlbum(albumId);
        const albumData = album.body;
        
        const tracks = [];
        const items = albumData.tracks.items;
        
        console.log(`💿 Procesando álbum de Spotify: ${albumData.name} por ${albumData.artists[0].name} (${items.length} canciones)`);
        
        for (let i = 0; i < items.length; i++) { // Procesar todas las canciones del álbum
            const track = items[i];
            if (track && track.type === 'track') {
                try {
                    const searchQuery = `${albumData.artists[0].name} ${track.name}`;
                    const searchResults = await YouTubeSearchAPI.GetListByKeyword(searchQuery, false, 1);
                    
                    if (searchResults.items && searchResults.items.length > 0) {
                        const youtubeUrl = `https://www.youtube.com/watch?v=${searchResults.items[0].id}`;
                        
                        tracks.push({
                            url: youtubeUrl,
                            title: track.name,
                            artist: albumData.artists[0].name,
                            duration: Math.floor(track.duration_ms / 1000),
                            isSpotify: true,
                            thumbnailUrl: albumData.images[0]?.url
                        });
                    }
                } catch (error) {
                    console.error(`Error al procesar track ${i + 1} del álbum:`, error);
                }
            }
        }
        
        return {
            tracks,
            albumName: albumData.name,
            artistName: albumData.artists[0].name,
            albumUrl: albumData.external_urls.spotify
        };
    } catch (error) {
        console.error('Error al procesar álbum de Spotify:', error);
        throw error;
    }
}

// Función para crear botones de control de música
function createMusicControls() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('music_skip')
                .setLabel('⏭️ Skip')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('music_pause')
                .setLabel('⏸️ Pausar')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('music_resume')
                .setLabel('▶️ Reanudar')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('music_queue')
                .setLabel('📋 Cola')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('music_stop')
                .setLabel('⏹️ Detener')
                .setStyle(ButtonStyle.Danger)
        );
}

// Función para reproducir la siguiente canción de la cola
async function playNextSong(voiceChannel, textChannel) {
    if (!global.musicQueue || global.musicQueue.length === 0) {
        console.log('❌ No hay canciones en la cola');
        
        // Verificar si está activado el modo radio
        if (global.radioMode) {
            console.log('📻 Modo radio activado, buscando recomendación...');
            const autoplaySong = await getAutoplayRecommendation();
            
            if (autoplaySong) {
                console.log(`🤖 Agregando recomendación: ${autoplaySong.title}`);
                if (!global.musicQueue) {
                    global.musicQueue = [];
                }
                global.musicQueue.push(autoplaySong);
                
                // Enviar mensaje de autoplay
                await textChannel.send(`📻 **Modo Radio:** Reproduciendo automáticamente **${autoplaySong.title}**`);
                
                // Continuar con la reproducción
            } else {
                console.log('❌ No se pudo obtener recomendación de autoplay');
                global.currentConnection = null;
                return;
            }
        } else {
            global.currentConnection = null;
            return;
        }
    }

    const song = global.musicQueue.shift();
    global.currentSong = song; // Actualizar la canción actual inmediatamente
    
    try {
        console.log(`🎵 Reproduciendo: ${song.title}`);
        console.log(`🔗 URL: ${song.url}`);
        
        console.log('🔌 Conectando al canal de voz...');
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: true, // Agregamos esto para mejor compatibilidad
        });

        global.currentConnection = connection;
        console.log('✅ Conectado al canal de voz');

        // Usar reproductor global o crear uno nuevo
        if (!global.audioPlayer) {
            console.log('🎵 Creando reproductor global...');
            global.audioPlayer = createAudioPlayer();
            
            // Configurar eventos una sola vez
            global.audioPlayer.on(AudioPlayerStatus.Idle, async () => {
                console.log('🎵 [AUTOPLAY DEBUG] Canción terminada, verificando siguiente...');
                console.log(`🎵 [AUTOPLAY DEBUG] Modo radio activo: ${global.radioMode}`);
                console.log(`🎵 [AUTOPLAY DEBUG] Canción actual: ${global.currentSong ? global.currentSong.title : 'NO'}`);
                
                // Agregar canción actual al historial si no es autoplay
                if (global.currentSong && !global.currentSong.isAutoplay) {
                    console.log(`🎵 [AUTOPLAY DEBUG] Agregando al historial: ${global.currentSong.title}`);
                    addToHistory(global.currentSong.title);
                } else {
                    console.log(`🎵 [AUTOPLAY DEBUG] No se agrega al historial (es autoplay o no hay canción)`);
                }
                
                console.log(`📝 [AUTOPLAY DEBUG] Canciones restantes en cola: ${global.musicQueue ? global.musicQueue.length : 0}`);
                console.log(`📝 [AUTOPLAY DEBUG] Historial actual: [${global.lastPlayedSongs ? global.lastPlayedSongs.join(', ') : 'VACÍO'}]`);
                
                // Pequeña pausa para evitar problemas de timing
                setTimeout(async () => {
                    // Verificar si hay más canciones o si activar autoplay
                    if (!global.musicQueue || global.musicQueue.length === 0) {
                        console.log('⏰ [AUTOPLAY DEBUG] No hay más canciones en la cola');
                        
                        // Si está activado el modo radio, buscar recomendación
                        if (global.radioMode) {
                            console.log('📻 [AUTOPLAY DEBUG] Modo radio activado, buscando recomendación...');
                            console.log(`📻 [AUTOPLAY DEBUG] LastVoiceChannel: ${global.lastVoiceChannel ? 'SÍ' : 'NO'}`);
                            console.log(`📻 [AUTOPLAY DEBUG] LastTextChannel: ${global.lastTextChannel ? 'SÍ' : 'NO'}`);
                            
                            const autoplaySong = await getAutoplayRecommendation();
                            
                            if (autoplaySong) {
                                console.log(`🤖 [AUTOPLAY DEBUG] Recomendación encontrada: ${autoplaySong.title}`);
                                if (!global.musicQueue) {
                                    global.musicQueue = [];
                                }
                                global.musicQueue.push(autoplaySong);
                                
                                // Enviar mensaje de autoplay
                                if (global.lastTextChannel) {
                                    try {
                                        await global.lastTextChannel.send(`📻 **Modo Radio:** Reproduciendo automáticamente **${autoplaySong.title}**`);
                                        console.log(`📻 [AUTOPLAY DEBUG] Mensaje de autoplay enviado`);
                                    } catch (error) {
                                        console.error('❌ [AUTOPLAY DEBUG] Error enviando mensaje de autoplay:', error);
                                    }
                                }
                                
                                // Continuar con la reproducción inmediatamente
                                if (global.lastVoiceChannel && global.lastTextChannel) {
                                    console.log('🔄 [AUTOPLAY DEBUG] Iniciando reproducción de autoplay...');
                                    playNextSong(global.lastVoiceChannel, global.lastTextChannel);
                                } else {
                                    console.log('❌ [AUTOPLAY DEBUG] No se puede reproducir - faltan referencias de canales');
                                }
                                return;
                            } else {
                                console.log('❌ [AUTOPLAY DEBUG] No se pudo obtener recomendación de autoplay');
                            }
                        } else {
                            console.log('📻 [AUTOPLAY DEBUG] Modo radio NO está activado');
                        }
                        
                        // Si no hay autoplay o no se pudo obtener recomendación, iniciar timer de inactividad
                        console.log('⏰ [AUTOPLAY DEBUG] Iniciando timer de inactividad');
                        if (typeof global.startInactivityTimer === 'function') {
                            global.startInactivityTimer();
                        }
                    } else {
                        // Hay más canciones, reproducir la siguiente
                        console.log('▶️ [AUTOPLAY DEBUG] Reproduciendo siguiente canción de la cola...');
                        if (global.lastVoiceChannel && global.lastTextChannel) {
                            playNextSong(global.lastVoiceChannel, global.lastTextChannel);
                        }
                    }
                }, 1500); // Pausa de 1.5 segundos
            });

            global.audioPlayer.on(AudioPlayerStatus.Playing, () => {
                console.log('▶️ Estado: Reproduciendo');
                
                // Cancelar timer de inactividad cuando se está reproduciendo
                if (typeof global.cancelInactivityTimer === 'function') {
                    global.cancelInactivityTimer();
                }
                
                // Mostrar controles solo si no se han mostrado recientemente
                if (!global.lastControlsShown || Date.now() - global.lastControlsShown > 10000) {
                    if (global.lastTextChannel && global.currentSong) {
                        showMusicControls(global.lastTextChannel, global.currentSong);
                        global.lastControlsShown = Date.now();
                    }
                }
            });

            global.audioPlayer.on('error', error => {
                console.error('❌ Error reproductor:', error);
                console.error('Tipo de error:', error.name);
                console.error('Mensaje:', error.message);
                
                // Intentar recuperarse de errores de stream interrumpido
                if (error.message && error.message.includes('aborted') && global.currentSong) {
                    // Incrementar contador de reintentos para esta canción
                    if (!global.currentSong.retryCount) {
                        global.currentSong.retryCount = 0;
                    }
                    global.currentSong.retryCount++;
                    
                    console.log(`🔄 Stream interrumpido, intento ${global.currentSong.retryCount}/3 para: ${global.currentSong.title}`);
                    
                    // Máximo 3 intentos antes de saltar a la siguiente canción
                    if (global.currentSong.retryCount <= 3) {
                        console.log('⏳ Reintentando reproducir la canción...');
                        setTimeout(() => {
                            if (global.lastVoiceChannel && global.lastTextChannel && global.currentSong) {
                                // Reintentar la misma canción
                                playSong(global.lastVoiceChannel, global.lastTextChannel, global.currentSong);
                            }
                        }, 2000);
                        return;
                    } else {
                        console.log('❌ Máximo de reintentos alcanzado, saltando a la siguiente canción');
                        global.lastTextChannel.send('⚠️ No se pudo reproducir la canción después de varios intentos, saltando a la siguiente...');
                    }
                }
                
                // Para otros errores o después de agotar reintentos, saltar a la siguiente canción
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
        global.currentSong = song; // Guardar la canción actual

        console.log('🎵 Creando stream de audio...');
        // Usar la nueva función de stream con respaldo
        const resource = await createAudioStream(song.url);
        console.log('✅ Stream de audio creado');

        console.log('▶️ Iniciando reproducción...');
        global.audioPlayer.play(resource);
        connection.subscribe(global.audioPlayer);
        console.log('✅ Reproductor conectado');

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

        console.log(`🎵 [PLAY DEBUG] Iniciando comando con query: ${query}`);
        console.log(`🎵 [PLAY DEBUG] Usuario en canal de voz: ${voiceChannel ? voiceChannel.name : 'NO'}`);

        if (!voiceChannel) {
            return await interaction.reply('❌ Debes estar en un canal de voz!');
        }

        console.log(`🎵 [PLAY DEBUG] Enviando deferReply...`);
        
        try {
            await interaction.deferReply();
            console.log(`🎵 [PLAY DEBUG] DeferReply enviado exitosamente`);
        } catch (deferError) {
            console.error('❌ [PLAY DEBUG] Error en deferReply:', deferError);
            return;
        }

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
                
                // Verificar si es una playlist especial de Spotify
                if (query.includes('/playlist/') && isSpotifySpecialPlaylist(spotifyId)) {
                    return await interaction.editReply('❌ Esta playlist de Spotify (Daily Mix, Discover Weekly, etc.) no está disponible a través de la API pública. Prueba con una playlist de usuario normal o un álbum.');
                }
                
                // Verificar si es playlist o track
                if (query.includes('/playlist/')) {
                    console.log('📝 Procesando playlist de Spotify...');
                    await interaction.editReply('🎧 Procesando playlist de Spotify...');
                    
                    try {
                        const playlistData = await handleSpotifyPlaylist(spotifyId);
                        
                        if (playlistData.tracks.length === 0) {
                            return await interaction.editReply('❌ No se encontraron canciones válidas en la playlist. Puede que sea privada o las canciones no estén disponibles.');
                        }
                        
                        // Inicializar o obtener la cola
                        if (!global.musicQueue) {
                            global.musicQueue = [];
                            global.guildSettings = global.guildSettings || {};
                            global.guildSettings[interaction.guild.id] = { shuffle: false };
                        }
                        
                        // Agregar todas las canciones a la cola
                        global.musicQueue.push(...playlistData.tracks);
                        
                        await interaction.editReply({
                            content: `✅ Agregadas ${playlistData.tracks.length} canciones de la playlist **${playlistData.playlistName}** a la cola.`
                        });
                        
                        // Si no hay nada reproduciéndose, empezar
                        if (!global.currentConnection) {
                            playNextSong(voiceChannel, interaction.channel);
                        }
                        
                        return;
                        
                    } catch (error) {
                        console.error('❌ Error específico de playlist:', error);
                        return await interaction.editReply(`❌ Error al procesar playlist de Spotify: ${error.message}`);
                    }
                    
                } else if (query.includes('/album/')) {
                    console.log('💿 Procesando álbum de Spotify...');
                    await interaction.editReply('💿 Procesando álbum de Spotify...');
                    
                    const albumData = await handleSpotifyAlbum(spotifyId);
                    
                    if (albumData.tracks.length === 0) {
                        return await interaction.editReply('❌ No se pudo procesar el álbum.');
                    }
                    
                    // Inicializar o obtener la cola
                    if (!global.musicQueue) {
                        global.musicQueue = [];
                        global.guildSettings = global.guildSettings || {};
                        global.guildSettings[interaction.guild.id] = { shuffle: false };
                    }
                    
                    // Agregar todas las canciones a la cola
                    global.musicQueue.push(...albumData.tracks);
                    
                    await interaction.editReply({
                        content: `✅ Agregadas ${albumData.tracks.length} canciones del álbum **${albumData.albumName}** por **${albumData.artistName}** a la cola.`
                    });
                    
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
                    
                    await interaction.editReply({
                        content: `✅ **${trackData.title}** por **${trackData.artist}** agregada a la cola.`
                    });
                    
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

            // Crear objeto de canción
            const song = {
                title: videoTitle,
                url: videoUrl,
                source: 'YT',
                requestedBy: interaction.user.tag
            };

            // Inicializar cola si no existe
            if (!global.musicQueue) {
                global.musicQueue = [];
                global.guildSettings = global.guildSettings || {};
                global.guildSettings[interaction.guild.id] = { shuffle: false };
            }

            global.musicQueue.push(song);

            await interaction.editReply({
                content: `✅ **${videoTitle}** agregada a la cola.`
            });

            // Si no hay nada reproduciéndose, empezar
            if (!global.currentConnection) {
                playNextSong(voiceChannel, interaction.channel);
            }

        } catch (error) {
            console.error('❌ Error general:', error);
            await interaction.editReply('❌ Error al reproducir música.');
        }
    },
};

// Función helper para mostrar controles automáticamente
async function showMusicControls(textChannel, songInfo = null) {
    try {
        if (!textChannel) {
            console.log('❌ No hay canal de texto para mostrar controles');
            return;
        }

        let message = '🎵 **Controles de Música**';
        
        if (songInfo) {
            const title = songInfo.title || 'Título desconocido';
            const artist = songInfo.artist ? ` por **${songInfo.artist}**` : '';
            const source = songInfo.isSpotify ? '[SPOTIFY→YT]' : '[YOUTUBE]';
            message = `🎵 **Reproduciendo:** ${title}${artist} ${source}`;
        }

        await textChannel.send({
            content: message,
            components: [createMusicControls()]
        });
        
        console.log('✅ Controles automáticos enviados');
    } catch (error) {
        console.error('❌ Error enviando controles automáticos:', error);
    }
}

// Función para obtener recomendaciones automáticas (autoplay)
async function getAutoplayRecommendation() {
    console.log(`🤖 [RECOMENDACIÓN DEBUG] Iniciando búsqueda de recomendación...`);
    console.log(`🤖 [RECOMENDACIÓN DEBUG] Historial: ${global.lastPlayedSongs ? JSON.stringify(global.lastPlayedSongs) : 'NO HAY'}`);
    
    if (!global.lastPlayedSongs || global.lastPlayedSongs.length === 0) {
        console.log(`🤖 [RECOMENDACIÓN DEBUG] No hay historial de canciones`);
        return null;
    }
    
    try {
        // Obtener la última canción reproducida
        const lastSong = global.lastPlayedSongs[global.lastPlayedSongs.length - 1];
        console.log(`🤖 [RECOMENDACIÓN DEBUG] Buscando recomendación basada en: ${lastSong}`);
        
        // Extraer artista y términos clave del título
        let searchQuery;
        const songParts = lastSong.split('-');
        
        if (songParts.length >= 2) {
            // Formato "Artista - Canción"
            const artist = songParts[0].trim();
            const songName = songParts.slice(1).join('-').trim();
            
            // Crear múltiples queries posibles
            const possibleQueries = [
                `${artist} songs`,  // Más canciones del mismo artista
                `${artist} similar artists`,  // Artistas similares
                `${songName} cover`,  // Versiones de la misma canción
                `${artist} best songs`,  // Mejores canciones del artista
                `similar to ${artist}`  // Similar al artista
            ];
            
            // Elegir query aleatorio para variedad
            searchQuery = possibleQueries[Math.floor(Math.random() * possibleQueries.length)];
        } else {
            // Si no se puede parsear, usar términos generales
            const words = lastSong.split(' ').filter(word => word.length > 2);
            if (words.length > 0) {
                const keyword = words[Math.floor(Math.random() * words.length)];
                searchQuery = `${keyword} music`;
            } else {
                searchQuery = lastSong;
            }
        }
        
        console.log(`🤖 [RECOMENDACIÓN DEBUG] Query de búsqueda: ${searchQuery}`);
        
        // Buscar en YouTube con límite mayor para más opciones
        console.log(`🤖 [RECOMENDACIÓN DEBUG] Buscando en YouTube...`);
        const searchResults = await YouTubeSearchAPI.GetListByKeyword(searchQuery, false, 20);
        
        console.log(`🤖 [RECOMENDACIÓN DEBUG] Resultados encontrados: ${searchResults.items ? searchResults.items.length : 0}`);
        
        if (!searchResults.items || searchResults.items.length === 0) {
            console.log(`🤖 [RECOMENDACIÓN DEBUG] No se encontraron resultados, intentando búsqueda genérica...`);
            
            // Fallback: búsqueda más genérica
            const fallbackQuery = "popular music 2024";
            const fallbackResults = await YouTubeSearchAPI.GetListByKeyword(fallbackQuery, false, 10);
            
            if (!fallbackResults.items || fallbackResults.items.length === 0) {
                console.log(`🤖 [RECOMENDACIÓN DEBUG] Búsqueda fallback también falló`);
                return null;
            }
            
            searchResults.items = fallbackResults.items;
        }
        
        // Filtrar canciones que ya se reprodujeron recientemente (filtro más estricto)
        const availableResults = searchResults.items.filter(item => {
            const title = item.title.toLowerCase();
            
            // Verificar que no sea exactamente la misma canción
            if (global.lastPlayedSongs.some(played => {
                const playedLower = played.toLowerCase();
                return title === playedLower || 
                       title.includes(playedLower) || 
                       playedLower.includes(title) ||
                       // Calcular similitud por palabras
                       calculateSimilarity(title, playedLower) > 0.7;
            })) {
                return false;
            }
            
            // Filtrar videos muy cortos (menos de 1 minuto) o muy largos (más de 15 minutos)
            if (item.length) {
                const duration = parseDuration(item.length.simpleText);
                if (duration < 60 || duration > 900) {
                    return false;
                }
            }
            
            // Filtrar contenido obviamente no musical
            const nonMusicKeywords = ['tutorial', 'review', 'reaction', 'gameplay', 'podcast'];
            if (nonMusicKeywords.some(keyword => title.includes(keyword))) {
                return false;
            }
            
            return true;
        });
        
        console.log(`🤖 [RECOMENDACIÓN DEBUG] Resultados después de filtrar: ${availableResults.length}`);
        
        if (availableResults.length === 0) {
            console.log(`🤖 [RECOMENDACIÓN DEBUG] Todos los resultados fueron filtrados, usando resultados originales...`);
            
            // Si no hay resultados después del filtro, usar los primeros 3 originales
            const backupResults = searchResults.items.slice(0, 3);
            const randomIndex = Math.floor(Math.random() * backupResults.length);
            const selectedSong = backupResults[randomIndex];
            
            const autoplaySong = {
                title: selectedSong.title,
                url: `https://www.youtube.com/watch?v=${selectedSong.id}`,
                source: 'AUTOPLAY-YT',
                requestedBy: 'Radio Bot',
                isAutoplay: true
            };
            
            console.log(`🎯 [RECOMENDACIÓN DEBUG] Recomendación backup: ${autoplaySong.title}`);
            return autoplaySong;
        }
        
        // Seleccionar una canción aleatoria de los primeros 8 resultados filtrados
        const randomIndex = Math.floor(Math.random() * Math.min(availableResults.length, 8));
        const selectedSong = availableResults[randomIndex];
        
        const autoplaySong = {
            title: selectedSong.title,
            url: `https://www.youtube.com/watch?v=${selectedSong.id}`,
            source: 'AUTOPLAY-YT',
            requestedBy: 'Radio Bot',
            isAutoplay: true
        };
        
        console.log(`🎯 [RECOMENDACIÓN DEBUG] Recomendación seleccionada: ${autoplaySong.title}`);
        console.log(`🎯 [RECOMENDACIÓN DEBUG] URL: ${autoplaySong.url}`);
        return autoplaySong;
        
    } catch (error) {
        console.error('❌ [RECOMENDACIÓN DEBUG] Error obteniendo recomendación de autoplay:', error);
        return null;
    }
}

// Función auxiliar para calcular similitud entre títulos
function calculateSimilarity(str1, str2) {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
}

// Función auxiliar para parsear duración de YouTube
function parseDuration(durationText) {
    if (!durationText) return 0;
    
    const parts = durationText.split(':').map(part => parseInt(part));
    if (parts.length === 2) {
        return parts[0] * 60 + parts[1]; // MM:SS
    } else if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
    }
    return 0;
}

// Función para agregar canción al historial
function addToHistory(songTitle) {
    if (!global.lastPlayedSongs) {
        global.lastPlayedSongs = [];
    }
    
    // Agregar al historial
    global.lastPlayedSongs.push(songTitle);
    
    // Mantener solo las últimas MAX_HISTORY canciones
    if (global.lastPlayedSongs.length > global.MAX_HISTORY) {
        global.lastPlayedSongs.shift();
    }
    
    console.log(`📝 Agregado al historial: ${songTitle} (Total: ${global.lastPlayedSongs.length})`);
}