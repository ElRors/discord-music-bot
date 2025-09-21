const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const musicState = require('../utils/musicState');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Muestra la canción que se está reproduciendo actualmente'),

    async execute(interaction) {
        // Agregar debug temporal para investigar el problema
        console.log(`🔍 [NOWPLAYING] Debug - musicState.isPlaying(): ${musicState.isPlaying()}`);
        console.log(`🔍 [NOWPLAYING] Debug - musicState.getCurrentSong():`, musicState.getCurrentSong());
        console.log(`🔍 [NOWPLAYING] Debug - musicState.getStateDebugInfo():`, musicState.getStateDebugInfo());
        
        // Verificar si hay música reproduciéndose usando las funciones centralizadas
        if (!musicState.isPlaying()) {
            return await interaction.reply('❌ No hay música reproduciéndose actualmente.');
        }

        const song = musicState.getCurrentSong();
        
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
