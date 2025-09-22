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

// Función para manejar playlists de Spotify
async function handleSpotifyPlaylist(playlistId) {
    try {
        await authenticateSpotify();
        
        // Obtener información de la playlist
        const playlist = await spotify.getPlaylist(playlistId);
        const playlistData = playlist.body;

        console.log(`🎵 [PLAY] Procesando playlist: ${playlistData.name} (${playlistData.tracks.total} canciones)`);

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
                        const searchResults = await YouTubeSearchAPI.GetListByKeyword(searchQuery, false, 1);

                        if (searchResults.items && searchResults.items.length > 0) {
                            const youtubeUrl = `https://www.youtube.com/watch?v=${searchResults.items[0].id}`;

                            tracks.push({
                                url: youtubeUrl,
                                title: `${track.artists[0].name} - ${track.name}`,
                                artist: track.artists[0].name,
                                duration: Math.floor(track.duration_ms / 1000),
                                isSpotify: true,
                                source: 'SPOTIFY→YT',
                                requestedBy: 'Usuario'
                            });
                        }
                    } catch (error) {
                        console.warn(`⚠️ [PLAY] No se pudo procesar: ${track.name} - ${error.message}`);
                    }
                }
            }

            offset += limit;
            if (tracksData.length < limit) break; // No hay más páginas
        }

        if (tracks.length === 0) {
            throw new Error('No se pudieron procesar las canciones de la playlist');
        }

        // Retornar información de la playlist con todas las canciones
        return {
            playlistInfo: {
                name: playlistData.name,
                totalTracks: tracks.length,
                description: playlistData.description,
                owner: playlistData.owner.display_name
            },
            tracks: tracks
        };
    } catch (error) {
        console.error('Error al procesar playlist de Spotify:', error);
        throw error;
    }
}

// Función para manejar álbumes de Spotify
async function handleSpotifyAlbum(albumId) {
    try {
        await authenticateSpotify();
        
        // Obtener información del álbum
        const album = await spotify.getAlbum(albumId);
        const albumData = album.body;

        console.log(`🎵 [PLAY] Procesando álbum: ${albumData.name} por ${albumData.artists[0].name}`);

        const tracks = [];
        
        for (const track of albumData.tracks.items) {
            try {
                // Buscar equivalente en YouTube para cada track
                const searchQuery = `${albumData.artists[0].name} ${track.name}`;
                const searchResults = await YouTubeSearchAPI.GetListByKeyword(searchQuery, false, 1);

                if (searchResults.items && searchResults.items.length > 0) {
                    const youtubeUrl = `https://www.youtube.com/watch?v=${searchResults.items[0].id}`;

                    tracks.push({
                        url: youtubeUrl,
                        title: `${albumData.artists[0].name} - ${track.name}`,
                        artist: albumData.artists[0].name,
                        duration: Math.floor(track.duration_ms / 1000),
                        isSpotify: true,
                        source: 'SPOTIFY→YT',
                        requestedBy: 'Usuario'
                    });
                }
            } catch (error) {
                console.warn(`⚠️ [PLAY] No se pudo procesar: ${track.name} - ${error.message}`);
            }
        }

        if (tracks.length === 0) {
            throw new Error('No se pudieron procesar las canciones del álbum');
        }

        return {
            albumInfo: {
                name: albumData.name,
                artist: albumData.artists[0].name,
                totalTracks: tracks.length,
                releaseDate: albumData.release_date
            },
            tracks: tracks
        };
    } catch (error) {
        console.error('Error al procesar álbum de Spotify:', error);
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

// Función auxiliar para crear stream con reintentos automáticos
async function createAudioStreamWithRetry(url, title = 'Canción', maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 [PLAY] Intento ${attempt}/${maxRetries} para: ${title}`);
            const resource = await createAudioStream(url);
            console.log(`✅ [PLAY] Stream creado exitosamente en intento ${attempt}`);
            return resource;
        } catch (error) {
            console.log(`❌ [PLAY] Intento ${attempt} falló:`, error.message);
            
            if (attempt === maxRetries) {
                // Si todos los intentos fallaron, buscar video alternativo
                console.log('🔍 [PLAY] Buscando video alternativo...');
                try {
                    const searchQuery = title.replace(/[^\w\s]/gi, '').trim();
                    const YouTubeSearchAPI = require('youtube-search-api');
                    const searchResults = await YouTubeSearchAPI.GetListByKeyword(searchQuery, false, 3);
                    
                    if (searchResults.items && searchResults.items.length > 0) {
                        // Intentar con los resultados alternativos
                        for (let i = 0; i < Math.min(2, searchResults.items.length); i++) {
                            const alternativeUrl = `https://www.youtube.com/watch?v=${searchResults.items[i].id}`;
                            if (alternativeUrl !== url) {
                                console.log(`🔄 [PLAY] Probando video alternativo ${i + 1}: ${searchResults.items[i].title}`);
                                try {
                                    return await createAudioStream(alternativeUrl);
                                } catch (altError) {
                                    console.log(`❌ [PLAY] Video alternativo ${i + 1} falló:`, altError.message);
                                }
                            }
                        }
                    }
                } catch (searchError) {
                    console.log('❌ [PLAY] Error buscando alternativas:', searchError.message);
                }
                throw new Error(`No se pudo crear stream después de ${maxRetries} intentos y búsqueda de alternativas`);
            }
            
            // Esperar antes del siguiente intento (delay progresivo)
            const delay = attempt * 1500;
            console.log(`⏳ [PLAY] Esperando ${delay}ms antes del siguiente intento...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Función auxiliar para crear stream de audio con play-dl como método principal
async function createAudioStream(url) {
    console.log('🎵 [PLAY] Creando stream de audio...');
    
    // Método 1: play-dl (más estable)
    try {
        console.log('🎵 [PLAY] Intentando con play-dl (método principal)...');
        const play = require('play-dl');
        
        // Verificar si es una URL válida
        const info = await play.video_info(url).catch(() => null);
        if (!info) throw new Error('URL no válida para play-dl');
        
        const stream = await play.stream(url, { 
            quality: 2, // alta calidad
            discordPlayerCompatibility: true // Optimizado para Discord
        });
        
        console.log('✅ [PLAY] Stream creado exitosamente con play-dl');
        return createAudioResource(stream.stream, {
            inputType: stream.type,
            inlineVolume: true
        });
    } catch (playDlError) {
        console.log('⚠️ [PLAY] play-dl falló, intentando con ytdl-core...');
        
        // Método 2: ytdl-core (fallback)
        try {
            console.log('🎵 [PLAY] Intentando con ytdl-core...');
            const stream = ytdl(url, {
                filter: 'audioonly',
                quality: 'highestaudio',
                requestOptions: {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                },
                highWaterMark: 1 << 25 // Buffer más grande para estabilidad
            });
            
            console.log('✅ [PLAY] Stream creado con ytdl-core (fallback)');
            return createAudioResource(stream, {
                inlineVolume: true
            });
        } catch (ytdlError) {
            console.error('❌ [PLAY] Ambos métodos fallaron:');
            console.error('  - play-dl:', playDlError.message);
            console.error('  - ytdl-core:', ytdlError.message);
            throw new Error('No se pudo crear el stream de audio con ningún método');
        }
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Reproduce música desde Spotify (tracks/playlists/álbumes), YouTube o búsqueda por texto')
        .addStringOption(option =>
            option.setName('cancion')
                .setDescription('URL de Spotify/YouTube, nombre de canción, artista o álbum')
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
            let songs = []; // Array para manejar múltiples canciones

            // Procesar según el tipo de URL
            if (isSpotifyUrl(query)) {
                console.log('🎧 [PLAY] Detectada URL de Spotify');
                const spotifyId = extractSpotifyId(query);
                
                if (!spotifyId) {
                    return await interaction.editReply('❌ URL de Spotify inválida.');
                }
                
                if (query.includes('/track/')) {
                    await interaction.editReply('🎧 Procesando track de Spotify...');
                    const song = await handleSpotifyTrack(spotifyId);
                    songs = [song];
                } else if (query.includes('/playlist/')) {
                    await interaction.editReply('🎧 Procesando playlist de Spotify...');
                    const playlistResult = await handleSpotifyPlaylist(spotifyId);
                    songs = playlistResult.tracks;
                    
                    // Actualizar el mensaje con información de la playlist
                    await interaction.editReply(`🎵 **Playlist agregada:** ${playlistResult.playlistInfo.name}\n📋 **${playlistResult.playlistInfo.totalTracks} canciones** agregadas a la cola`);
                } else if (query.includes('/album/')) {
                    await interaction.editReply('🎧 Procesando álbum de Spotify...');
                    const albumResult = await handleSpotifyAlbum(spotifyId);
                    songs = albumResult.tracks;
                    
                    // Actualizar el mensaje con información del álbum
                    await interaction.editReply(`🎵 **Álbum agregado:** ${albumResult.albumInfo.name} por ${albumResult.albumInfo.artist}\n📋 **${albumResult.albumInfo.totalTracks} canciones** agregadas a la cola`);
                } else {
                    return await interaction.editReply('❌ Tipo de URL de Spotify no soportado. Use tracks, playlists o álbumes.');
                }
                
            } else if (ytdl.validateURL(query)) {
                console.log('🎵 [PLAY] URL de YouTube detectada');
                await interaction.editReply('🎵 Procesando video de YouTube...');
                const videoInfo = await ytdl.getInfo(query);
                const song = {
                    title: videoInfo.videoDetails.title,
                    url: query,
                    source: 'YT',
                    requestedBy: interaction.user.tag
                };
                songs = [song];
            } else {
                // Búsqueda por texto mejorada
                console.log('🔍 [PLAY] Búsqueda por texto detectada');
                await interaction.editReply('🔍 Buscando música...');
                
                // Intentar primero buscar en Spotify para mejores resultados
                try {
                    await authenticateSpotify();
                    const searchResults = await spotify.searchTracks(query, { limit: 1 });
                    
                    if (searchResults.body.tracks.items && searchResults.body.tracks.items.length > 0) {
                        const track = searchResults.body.tracks.items[0];
                        const searchQuery = `${track.artists[0].name} ${track.name}`;
                        console.log(`🎧 [PLAY] Spotify encontrado, buscando en YouTube: ${searchQuery}`);
                        
                        const youtubeResults = await YouTubeSearchAPI.GetListByKeyword(searchQuery, false, 1);
                        if (youtubeResults.items && youtubeResults.items.length > 0) {
                            const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeResults.items[0].id}`;
                            const song = {
                                url: youtubeUrl,
                                title: `${track.artists[0].name} - ${track.name}`,
                                artist: track.artists[0].name,
                                source: 'SPOTIFY→YT',
                                requestedBy: interaction.user.tag
                            };
                            songs = [song];
                        } else {
                            throw new Error('No se encontró en YouTube');
                        }
                    } else {
                        throw new Error('No se encontró en Spotify');
                    }
                } catch (spotifyError) {
                    // Si falla Spotify, buscar directamente en YouTube
                    console.log('🔍 [PLAY] Spotify falló, buscando directamente en YouTube...');
                    const song = await handleYouTubeSearch(query);
                    songs = [song];
                }
            }

            // Inicializar cola si no existe
            if (!global.musicQueue) {
                global.musicQueue = [];
            }

            // Agregar canciones a la cola
            let isFirstSong = !musicState.hasActiveMusic();
            
            for (const song of songs) {
                global.musicQueue.push(song);
            }

            // Responder según la cantidad de canciones
            if (songs.length === 1) {
                if (!isFirstSong) {
                    await interaction.editReply(`✅ **${songs[0].title}** agregada a la cola.`);
                }
            } else if (songs.length > 1) {
                // Ya se respondió arriba para playlists y álbumes
            }

            // Si no hay nada reproduciéndose, empezar reproducción
            if (isFirstSong) {
                console.log(`🎵 [PLAY] Iniciando reproducción directa...`);
                const firstSong = global.musicQueue.shift(); // Tomar la primera canción de la cola
                
                // Marcar que hay una interacción pendiente para evitar mensaje duplicado
                global.pendingInteraction = interaction;
                await startPlayback(voiceChannel, interaction.channel, firstSong);
                global.pendingInteraction = null;
                
                // Siempre mostrar el mensaje de la primera canción, sea individual o parte de una colección
                const embedResponse = musicState.createMusicEmbed(firstSong, '🎵 Reproduciendo');
                await interaction.editReply(embedResponse);
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
        // Validar que la canción existe
        if (!song) {
            console.error('❌ [PLAY] Error: No se proporcionó canción para reproducir');
            return;
        }

        if (!song.url) {
            console.error('❌ [PLAY] Error: La canción no tiene URL válida');
            return;
        }

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
        const resource = await createAudioStreamWithRetry(song.url, song.title);

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
                    
                    // Validar que tenemos los canales y la siguiente canción
                    if (global.lastVoiceChannel && global.lastTextChannel && nextSong) {
                        await startPlayback(global.lastVoiceChannel, global.lastTextChannel, nextSong);
                    } else {
                        console.log('⚠️ [PLAY] Error: Faltan datos para reproducir siguiente canción');
                        if (!nextSong) console.log('❌ [PLAY] nextSong es undefined');
                        if (!global.lastVoiceChannel) console.log('❌ [PLAY] lastVoiceChannel es undefined'); 
                        if (!global.lastTextChannel) console.log('❌ [PLAY] lastTextChannel es undefined');
                    }
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
                    
                    // Reiniciar contador de errores al reproducir exitosamente
                    global.consecutiveErrors = 0;
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
                
                // Inicializar contador de errores si no existe
                if (!global.consecutiveErrors) {
                    global.consecutiveErrors = 0;
                }
                
                // Detectar tipo de error específico
                const errorMessage = error.message || '';
                const isAbortedError = errorMessage.includes('aborted') || error.code === 'ECONNRESET';
                const is403Error = errorMessage.includes('Status code: 403');
                const isNetworkError = errorMessage.includes('network') || errorMessage.includes('timeout');
                
                if (isAbortedError) {
                    console.log('🔄 [PLAY] Error de conexión detectado (aborted) - reintentando automáticamente...');
                    // Para errores aborted, reintentar inmediatamente sin contar como error grave
                } else if (is403Error) {
                    console.log('⚠️ [PLAY] Error 403 detectado - Video no disponible para descarga');
                    global.consecutiveErrors++;
                } else if (isNetworkError) {
                    console.log('🌐 [PLAY] Error de red detectado - reintentando con delay...');
                } else {
                    console.log('❌ [PLAY] Error desconocido - contabilizando como error grave');
                    global.consecutiveErrors++;
                }
                
                // Límite de 7 errores consecutivos (solo errores graves)
                if (global.consecutiveErrors >= 7) {
                    console.log('⚠️ [PLAY] Demasiados errores graves consecutivos, deteniendo reproducción');
                    if (global.lastTextChannel) {
                        global.lastTextChannel.send('❌ **Reproducción detenida**: Demasiadas canciones no disponibles consecutivamente. Intenta con otra playlist o álbum.');
                    }
                    global.consecutiveErrors = 0;
                    return;
                }
                
                // Intentar reproducir la siguiente canción si hay alguna
                if (global.musicQueue && global.musicQueue.length > 0) {
                    const retryDelay = isAbortedError ? 1000 : (isNetworkError ? 3000 : 2000);
                    console.log(`🔄 [PLAY] Intentando siguiente canción en ${retryDelay}ms (${global.consecutiveErrors}/7 errores graves)`);
                    
                    setTimeout(() => {
                        if (global.lastVoiceChannel && global.lastTextChannel) {
                            const nextSong = global.musicQueue.shift();
                            startPlayback(global.lastVoiceChannel, global.lastTextChannel, nextSong);
                        }
                    }, retryDelay);
                } else {
                    // Si no hay más canciones, reiniciar contador
                    global.consecutiveErrors = 0;
                }
            });
        }

        console.log(`▶️ [PLAY] Iniciando reproducción...`);
        global.audioPlayer.play(resource);
        connection.subscribe(global.audioPlayer);
        
        // Solo enviar mensaje si no hay una interacción pendiente (para canciones de la cola)
        if (!global.pendingInteraction) {
            const embedResponse = musicState.createMusicEmbed(song, '🎵 Reproduciendo');
            await textChannel.send(embedResponse);
        }
        console.log(`✅ [PLAY] Reproducción iniciada exitosamente`);

    } catch (error) {
        console.error('❌ [PLAY] Error en reproducción:', error);
        throw error;
    }
}