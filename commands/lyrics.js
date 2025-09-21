const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription('Mostrar las letras de la canción actual o buscar una canción específica')
        .addStringOption(option =>
            option.setName('cancion')
                .setDescription('Buscar letras de una canción específica (opcional)')
                .setRequired(false)),
    
    async execute(interaction) {
        await interaction.deferReply();
        
        let songTitle;
        const customSong = interaction.options.getString('cancion');
        
        if (customSong) {
            songTitle = customSong;
        } else {
            // Usar la canción actual
            if (!global.currentSong) {
                return await interaction.editReply('❌ No hay ninguna canción reproduciéndose actualmente.\nUsa `/lyrics [nombre de canción]` para buscar letras específicas.');
            }
            songTitle = global.currentSong.title;
        }
        
        console.log(`🔍 Buscando letras para: ${songTitle}`);
        
        try {
            const lyrics = await searchLyrics(songTitle);
            
            if (!lyrics) {
                return await interaction.editReply(`❌ No se encontraron letras para: **${songTitle}**\n\n💡 Intenta con un nombre más específico o con formato: "artista - canción"`);
            }
            
            // Crear embed para mostrar las letras
            const embed = new EmbedBuilder()
                .setTitle(`🎵 ${lyrics.title}`)
                .setDescription(lyrics.lyrics.length > 4000 ? 
                    lyrics.lyrics.substring(0, 4000) + '...\n\n*[Letras truncadas - demasiado largas]*' : 
                    lyrics.lyrics)
                .setColor(0x1DB954) // Verde Spotify
                .setFooter({ 
                    text: `🎤 ${lyrics.artist} • Powered by lyrics API`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            console.error('❌ Error buscando letras:', error);
            await interaction.editReply(`❌ Error al buscar las letras de: **${songTitle}**\n\n🔧 Inténtalo de nuevo más tarde o verifica el nombre de la canción.`);
        }
    },
};

// Función para buscar letras usando API pública
async function searchLyrics(songTitle) {
    try {
        // Limpiar el título de la canción
        const cleanTitle = cleanSongTitle(songTitle);
        console.log(`🧹 Título limpio: ${cleanTitle}`);
        
        // Usar API de lyrics.ovh (gratuita y sin autenticación)
        const response = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(cleanTitle)}`);
        
        if (!response.ok) {
            // Si falla, intentar con diferentes APIs
            return await tryAlternativeLyricsAPIs(cleanTitle);
        }
        
        const data = await response.json();
        
        if (data.lyrics) {
            return {
                title: cleanTitle,
                artist: extractArtist(songTitle),
                lyrics: data.lyrics.trim()
            };
        }
        
        return null;
        
    } catch (error) {
        console.error('❌ Error en búsqueda de letras:', error);
        return await tryAlternativeLyricsAPIs(cleanTitle);
    }
}

// APIs alternativas para letras
async function tryAlternativeLyricsAPIs(songTitle) {
    try {
        // API alternativa: lyricsfreak (simulado)
        console.log('🔄 Intentando con API alternativa...');
        
        // Separar artista y canción si es posible
        const { artist, song } = parseArtistAndSong(songTitle);
        
        if (artist && song) {
            // Usar API con artista y canción separados
            const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`;
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                if (data.lyrics) {
                    return {
                        title: `${artist} - ${song}`,
                        artist: artist,
                        lyrics: data.lyrics.trim()
                    };
                }
            }
        }
        
        return null;
        
    } catch (error) {
        console.error('❌ Error en APIs alternativas:', error);
        return null;
    }
}

// Función para limpiar el título de la canción
function cleanSongTitle(title) {
    return title
        .replace(/\[(.*?)\]/g, '') // Remover texto entre corchetes [Official Video]
        .replace(/\((.*?)\)/g, '') // Remover texto entre paréntesis (feat. Artist)
        .replace(/【.*?】/g, '') // Remover texto japonés entre símbolos
        .replace(/official|video|audio|lyric|music|mv|hd|4k/gi, '') // Remover palabras comunes
        .replace(/\s+/g, ' ') // Normalizar espacios
        .trim();
}

// Función para extraer el artista del título
function extractArtist(title) {
    // Buscar patrones comunes: "Artist - Song" o "Song by Artist"
    if (title.includes(' - ')) {
        return title.split(' - ')[0].trim();
    }
    if (title.includes(' by ')) {
        return title.split(' by ')[1].trim();
    }
    return 'Artista desconocido';
}

// Función para separar artista y canción
function parseArtistAndSong(title) {
    let artist = '';
    let song = '';
    
    if (title.includes(' - ')) {
        const parts = title.split(' - ');
        artist = parts[0].trim();
        song = parts.slice(1).join(' - ').trim();
    } else if (title.includes(' by ')) {
        const parts = title.split(' by ');
        song = parts[0].trim();
        artist = parts[1].trim();
    } else {
        // Si no se puede separar, usar todo como canción
        song = title;
        artist = '';
    }
    
    return { artist, song };
}