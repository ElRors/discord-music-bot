const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Muestra la canción que se está reproduciendo actualmente'),

    async execute(interaction) {
        // Verificar si hay música reproduciéndose usando las variables globales
        if (!global.audioPlayer || !global.currentSong) {
            return await interaction.reply('❌ No hay música reproduciéndose actualmente.');
        }

        const song = global.currentSong;
        
        // Crear información más detallada
        const title = song.title || 'Título desconocido';
        const artist = song.artist ? ` por **${song.artist}**` : '';
        const source = song.isSpotify ? '[SPOTIFY→YT]' : '[YOUTUBE]';
        const queueCount = global.musicQueue ? global.musicQueue.length : 0;

        await interaction.reply({
            content: `🎵 **Reproduciendo ahora:**\n` +
                    `**${title}**${artist} ${source}\n` +
                    `🔗 **URL:** ${song.url}\n` +
                    `📊 **Canciones en cola:** ${queueCount}`
        });
    },
};
