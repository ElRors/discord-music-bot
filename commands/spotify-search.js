const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const SpotifyWebApi = require('spotify-web-api-node');

// ID de usuario autorizado (ElRors#9414)
const AUTHORIZED_USER_ID = '348607763674914816';

// Configurar Spotify API
const spotify = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spotify-search')
        .setDescription('[EXCLUSIVO ElRors] Buscar y explorar música en Spotify')
        .addSubcommand(subcommand =>
            subcommand
                .setName('track')
                .setDescription('Buscar canciones en Spotify')
                .addStringOption(option =>
                    option.setName('query')
                        .setDescription('Nombre de la canción o artista')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('limit')
                        .setDescription('Número de resultados (1-10)')
                        .setMinValue(1)
                        .setMaxValue(10)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('artist')
                .setDescription('Buscar artistas en Spotify')
                .addStringOption(option =>
                    option.setName('query')
                        .setDescription('Nombre del artista')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('album')
                .setDescription('Buscar álbumes en Spotify')
                .addStringOption(option =>
                    option.setName('query')
                        .setDescription('Nombre del álbum')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('top-tracks')
                .setDescription('Ver las canciones más populares de un artista')
                .addStringOption(option =>
                    option.setName('artist')
                        .setDescription('Nombre del artista')
                        .setRequired(true))),

    async execute(interaction) {
        // Verificar que solo ElRors pueda usar este comando
        if (interaction.user.id !== AUTHORIZED_USER_ID) {
            return await interaction.reply({
                content: '🚫 **Acceso Denegado** - Este comando es exclusivo para ElRors.',
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();
        
        await interaction.deferReply();

        try {
            // Autenticar con Spotify
            await authenticateSpotify();

            switch (subcommand) {
                case 'track':
                    await handleTrackSearch(interaction);
                    break;
                case 'artist':
                    await handleArtistSearch(interaction);
                    break;
                case 'album':
                    await handleAlbumSearch(interaction);
                    break;
                case 'top-tracks':
                    await handleTopTracks(interaction);
                    break;
            }

        } catch (error) {
            console.error('❌ [SPOTIFY-SEARCH] Error:', error);
            await interaction.editReply(`❌ **Error:** ${error.message}`);
        }
    },
};

async function authenticateSpotify() {
    try {
        const data = await spotify.clientCredentialsGrant();
        spotify.setAccessToken(data.body['access_token']);
        console.log('✅ [SPOTIFY-SEARCH] Autenticado con Spotify');
    } catch (error) {
        throw new Error('No se pudo autenticar con Spotify');
    }
}

async function handleTrackSearch(interaction) {
    const query = interaction.options.getString('query');
    const limit = interaction.options.getInteger('limit') || 5;

    const results = await spotify.searchTracks(query, { limit });
    const tracks = results.body.tracks.items;

    if (tracks.length === 0) {
        return await interaction.editReply('❌ No se encontraron canciones.');
    }

    const embed = new EmbedBuilder()
        .setColor('#1DB954')
        .setTitle(`🎵 Resultados de Spotify: "${query}"`)
        .setFooter({ text: 'Usa /spotify-exclusive con la URL para reproducir' });

    let description = '';
    tracks.forEach((track, index) => {
        const artists = track.artists.map(artist => artist.name).join(', ');
        const duration = formatDuration(track.duration_ms);
        description += `**${index + 1}.** ${track.name} - ${artists}\n`;
        description += `🎵 Álbum: ${track.album.name} | ⏱️ ${duration}\n`;
        description += `🔗 [Spotify](${track.external_urls.spotify})\n\n`;
    });

    embed.setDescription(description);
    await interaction.editReply({ embeds: [embed] });
}

async function handleArtistSearch(interaction) {
    const query = interaction.options.getString('query');

    const results = await spotify.searchArtists(query, { limit: 5 });
    const artists = results.body.artists.items;

    if (artists.length === 0) {
        return await interaction.editReply('❌ No se encontraron artistas.');
    }

    const embed = new EmbedBuilder()
        .setColor('#1DB954')
        .setTitle(`🎤 Artistas en Spotify: "${query}"`);

    let description = '';
    artists.forEach((artist, index) => {
        description += `**${index + 1}.** ${artist.name}\n`;
        description += `👥 Seguidores: ${artist.followers.total.toLocaleString()}\n`;
        description += `📊 Popularidad: ${artist.popularity}/100\n`;
        if (artist.genres.length > 0) {
            description += `🎵 Géneros: ${artist.genres.slice(0, 3).join(', ')}\n`;
        }
        description += `🔗 [Spotify](${artist.external_urls.spotify})\n\n`;
    });

    embed.setDescription(description);
    await interaction.editReply({ embeds: [embed] });
}

async function handleAlbumSearch(interaction) {
    const query = interaction.options.getString('query');

    const results = await spotify.searchAlbums(query, { limit: 5 });
    const albums = results.body.albums.items;

    if (albums.length === 0) {
        return await interaction.editReply('❌ No se encontraron álbumes.');
    }

    const embed = new EmbedBuilder()
        .setColor('#1DB954')
        .setTitle(`💿 Álbumes en Spotify: "${query}"`);

    let description = '';
    albums.forEach((album, index) => {
        const artists = album.artists.map(artist => artist.name).join(', ');
        description += `**${index + 1}.** ${album.name} - ${artists}\n`;
        description += `📅 Año: ${album.release_date.split('-')[0]} | 🎵 ${album.total_tracks} canciones\n`;
        description += `🔗 [Spotify](${album.external_urls.spotify})\n\n`;
    });

    embed.setDescription(description);
    await interaction.editReply({ embeds: [embed] });
}

async function handleTopTracks(interaction) {
    const artistQuery = interaction.options.getString('artist');

    // Buscar el artista primero
    const artistResults = await spotify.searchArtists(artistQuery, { limit: 1 });
    const artists = artistResults.body.artists.items;

    if (artists.length === 0) {
        return await interaction.editReply('❌ No se encontró el artista.');
    }

    const artist = artists[0];
    
    // Obtener top tracks del artista
    const topTracks = await spotify.getArtistTopTracks(artist.id, 'US');
    const tracks = topTracks.body.tracks;

    const embed = new EmbedBuilder()
        .setColor('#1DB954')
        .setTitle(`🔥 Top Canciones de ${artist.name}`)
        .setThumbnail(artist.images[0]?.url);

    let description = '';
    tracks.slice(0, 10).forEach((track, index) => {
        const duration = formatDuration(track.duration_ms);
        description += `**${index + 1}.** ${track.name}\n`;
        description += `💿 ${track.album.name} | ⏱️ ${duration} | 📊 ${track.popularity}/100\n`;
        description += `🔗 [Spotify](${track.external_urls.spotify})\n\n`;
    });

    embed.setDescription(description);
    await interaction.editReply({ embeds: [embed] });
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}