const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Salta a la siguiente canción en la cola'),

    async execute(interaction) {
        const voiceConnection = interaction.client.voiceConnections.get(interaction.guild.id);
        const queue = interaction.client.musicQueues?.get(interaction.guild.id);

        if (!voiceConnection) {
            return await interaction.reply('❌ No hay música reproduciéndose actualmente.');
        }

        if (!queue || queue.length <= 1) {
            return await interaction.reply('❌ No hay más canciones en la cola para saltar.');
        }

        try {
            // Detener la canción actual (esto activará el evento 'idle' que reproduce la siguiente)
            voiceConnection.player.stop();
            
            await interaction.reply('⏭️ Saltando a la siguiente canción...');

        } catch (error) {
            console.error('Error al saltar canción:', error);
            await interaction.reply('❌ Hubo un error al intentar saltar la canción.');
        }
    },
};