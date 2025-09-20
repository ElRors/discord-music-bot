const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Detiene la música y desconecta el bot del canal de voz'),

    async execute(interaction) {
        const voiceConnection = interaction.client.voiceConnections.get(interaction.guild.id);

        if (!voiceConnection) {
            return await interaction.reply('❌ No hay música reproduciéndose actualmente.');
        }

        try {
            // Detener el reproductor
            voiceConnection.player.stop();
            
            // Desconectar del canal de voz
            voiceConnection.connection.destroy();
            
            // Limpiar la información almacenada
            interaction.client.voiceConnections.delete(interaction.guild.id);

            await interaction.reply('⏹️ Música detenida y desconectado del canal de voz.');

        } catch (error) {
            console.error('Error al detener música:', error);
            await interaction.reply('❌ Hubo un error al intentar detener la música.');
        }
    },
};
