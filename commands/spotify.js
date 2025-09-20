const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const SpotifyWebApi = require('spotify-web-api-node');

// Configurar Spotify API
const spotify = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spotify')
        .setDescription('Información detallada de Spotify')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('URL de Spotify (canción, álbum o playlist)')
                .setRequired(true)),

    async execute(interaction) {
        const spotifyUrl = interaction.options.getString('url');

        if (!spotifyUrl.includes('spotify.com/')) {
            return await interaction.reply('❌ Debes proporcionar una URL válida de Spotify.');
        }

        await interaction.deferReply();

        try {
            // Autenticar con Spotify
            await this.authenticateSpotify();
            
            if (spotifyUrl.includes('/track/')) {
                await this.showTrackInfo(interaction, spotifyUrl);
            } else if (spotifyUrl.includes('/playlist/')) {
                await this.showPlaylistInfo(interaction, spotifyUrl);
            } else if (spotifyUrl.includes('/album/')) {
                await this.showAlbumInfo(interaction, spotifyUrl);
            } else {
                await interaction.editReply('❌ URL de Spotify no reconocida. Usa URLs de canciones, álbumes o playlists.');
            }

        } catch (error) {
            console.error('Error obteniendo información de Spotify:', error);
            await interaction.editReply('❌ Error al obtener información de Spotify.');
        }
    },

    async authenticateSpotify() {
        try {
            const data = await spotify.clientCredentialsGrant();
            spotify.setAccessToken(data.body['access_token']);
        } catch (error) {
            console.error('Error autenticando Spotify:', error);
            throw error;
        }
    },

    async showTrackInfo(interaction, trackUrl) {
        try {
            const trackId = this.extractSpotifyId(trackUrl);
            const track = await spotify.getTrack(trackId);
            
            const trackData = track.body;
            const artist = trackData.artists[0].name;
            const songName = trackData.name;
            const album = trackData.album.name;
            const duration = this.formatDuration(trackData.duration_ms);
            const popularity = trackData.popularity;
            const releaseDate = trackData.album.release_date;
            
            const embed = new EmbedBuilder()
                .setColor('#1DB954') // Color verde de Spotify
                .setTitle(`🎵 ${songName}`)
                .setDescription(`**Artista:** ${artist}\n**Álbum:** ${album}`)
                .addFields(
                    { name: '⏱️ Duración', value: duration, inline: true },
                    { name: '📊 Popularidad', value: `${popularity}/100`, inline: true },
                    { name: '📅 Fecha de lanzamiento', value: releaseDate, inline: true }
                )
                .setThumbnail(trackData.album.images[0]?.url)
                .setFooter({ text: 'Spotify', iconURL: 'https://i.imgur.com/vw8gMNh.png' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error obteniendo información del track:', error);
            throw error;
        }
    },

    async showPlaylistInfo(interaction, playlistUrl) {
        try {
            const playlistId = this.extractSpotifyId(playlistUrl);
            const playlist = await spotify.getPlaylist(playlistId);
            
            const playlistData = playlist.body;
            const name = playlistData.name;
            const description = playlistData.description || 'Sin descripción';
            const owner = playlistData.owner.display_name;
            const trackCount = playlistData.tracks.total;
            const followers = playlistData.followers.total;
            
            // Obtener algunas canciones para mostrar
            const tracks = playlistData.tracks.items.slice(0, 5);
            const trackList = tracks.map((item, index) => {
                const track = item.track;
                return `${index + 1}. **${track.name}** - ${track.artists[0].name}`;
            }).join('\n');

            const embed = new EmbedBuilder()
                .setColor('#1DB954')
                .setTitle(`📋 ${name}`)
                .setDescription(description.length > 100 ? description.substring(0, 100) + '...' : description)
                .addFields(
                    { name: '👤 Creador', value: owner, inline: true },
                    { name: '🎵 Canciones', value: trackCount.toString(), inline: true },
                    { name: '👥 Seguidores', value: followers.toString(), inline: true },
                    { name: '🎼 Primeras canciones', value: trackList || 'No hay canciones' }
                )
                .setThumbnail(playlistData.images[0]?.url)
                .setFooter({ text: 'Spotify Playlist', iconURL: 'https://i.imgur.com/vw8gMNh.png' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error obteniendo información de la playlist:', error);
            throw error;
        }
    },

    async showAlbumInfo(interaction, albumUrl) {
        try {
            const albumId = this.extractSpotifyId(albumUrl);
            const album = await spotify.getAlbum(albumId);
            
            const albumData = album.body;
            const name = albumData.name;
            const artist = albumData.artists[0].name;
            const releaseDate = albumData.release_date;
            const trackCount = albumData.total_tracks;
            const popularity = albumData.popularity;
            const albumType = albumData.album_type;
            
            // Obtener algunas canciones para mostrar
            const tracks = albumData.tracks.items.slice(0, 5);
            const trackList = tracks.map((track, index) => {
                const duration = this.formatDuration(track.duration_ms);
                return `${index + 1}. **${track.name}** (${duration})`;
            }).join('\n');

            const embed = new EmbedBuilder()
                .setColor('#1DB954')
                .setTitle(`💿 ${name}`)
                .setDescription(`**Artista:** ${artist}`)
                .addFields(
                    { name: '📅 Fecha de lanzamiento', value: releaseDate, inline: true },
                    { name: '🎵 Canciones', value: trackCount.toString(), inline: true },
                    { name: '📊 Popularidad', value: `${popularity}/100`, inline: true },
                    { name: '📀 Tipo', value: albumType, inline: true },
                    { name: '🎼 Canciones del álbum', value: trackList }
                )
                .setThumbnail(albumData.images[0]?.url)
                .setFooter({ text: 'Spotify Album', iconURL: 'https://i.imgur.com/vw8gMNh.png' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error obteniendo información del álbum:', error);
            throw error;
        }
    },

    extractSpotifyId(url) {
        const match = url.match(/\/([a-zA-Z0-9]{22})/);
        return match ? match[1] : null;
    },

    formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return `${minutes}:${seconds.padStart(2, '0')}`;
    }
};