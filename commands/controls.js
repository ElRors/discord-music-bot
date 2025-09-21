const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const musicState = require('../utils/musicState');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('controls')
        .setDescription('Muestra los controles de música con botones interactivos'),

    async execute(interaction) {
        if (!musicState.hasActiveMusic()) {
            return await interaction.reply('❌ No hay música reproduciéndose actualmente.');
        }

        const row = new ActionRowBuilder()
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

        const playerStatus = musicState.getPlayerStatus();
        const currentSong = musicState.getCurrentSong();
        const currentSongInfo = currentSong ? currentSong.title : 'Ninguna';
        
        const embed = new EmbedBuilder()
            .setColor('#1DB954')
            .setTitle('🎵 Controles de Música')
            .setDescription('Usa los botones para controlar la reproducción')
            .addFields(
                { name: '📊 Estado del Reproductor', value: playerStatus, inline: true },
                { name: '🎵 Canción Actual', value: currentSongInfo, inline: true },
                { name: '📋 Canciones en cola', value: musicState.getQueueLength().toString(), inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Los botones funcionan para todos los usuarios en el canal de voz' });

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};