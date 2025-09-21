const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('controls')
        .setDescription('Muestra los controles de música con botones interactivos'),

    async execute(interaction) {
        // Verificar si hay música reproduciéndose
        if (!global.audioPlayer || !global.currentConnection) {
            return await interaction.reply('❌ No hay música reproduciéndose actualmente.');
        }

        // Crear botones de control
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

        // Crear embed con información actual
        const embed = new EmbedBuilder()
            .setColor('#1DB954')
            .setTitle('🎵 Controles de Música')
            .setDescription('Usa los botones para controlar la reproducción')
            .addFields(
                { name: '📊 Estado', value: global.audioPlayer ? 'Reproduciendo' : 'Detenido', inline: true },
                { name: '🎵 Canciones en cola', value: global.musicQueue ? global.musicQueue.length.toString() : '0', inline: true },
                { name: '🔀 Shuffle', value: global.guildSettings?.[interaction.guild.id]?.shuffle ? 'Activado' : 'Desactivado', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Los botones funcionan para todos los usuarios en el canal de voz' });

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};