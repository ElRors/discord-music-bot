const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Salta a la siguiente canción en la cola'),

    async execute(interaction) {
        // Verificar si hay música reproduciéndose
        if (!global.audioPlayer || !global.currentConnection) {
            return await interaction.reply('❌ No hay música reproduciéndose actualmente.');
        }

        // Verificar si hay más canciones en la cola
        if (!global.musicQueue || global.musicQueue.length === 0) {
            return await interaction.reply('❌ No hay más canciones en la cola para saltar.');
        }

        try {
            const nextSong = global.musicQueue[0]; // La siguiente canción
            
            // Detener la canción actual (esto activará el evento 'idle' que reproduce la siguiente)
            global.audioPlayer.stop();
            
            const embed = new EmbedBuilder()
                .setColor('#FF6B35')
                .setTitle('⏭️ Canción Saltada')
                .addFields(
                    { name: '⏭️ Saltando a', value: nextSong?.title || 'Canción desconocida', inline: false },
                    { name: '📊 Canciones restantes', value: global.musicQueue.length.toString(), inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al saltar canción:', error);
            await interaction.reply('❌ Hubo un error al intentar saltar la canción.');
        }
    },
};