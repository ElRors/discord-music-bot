const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Detiene la música y desconecta el bot del canal de voz'),

    async execute(interaction) {
        // Verificar si hay una conexión activa
        if (!global.currentConnection && !global.audioPlayer) {
            return await interaction.reply('❌ No hay música reproduciéndose actualmente.');
        }

        try {
            // Limpiar la cola
            global.musicQueue = [];
            
            // Detener el reproductor global si existe
            if (global.audioPlayer) {
                global.audioPlayer.stop();
                global.audioPlayer = null;
            }
            
            // Desconectar del canal de voz
            if (global.currentConnection) {
                global.currentConnection.destroy();
                global.currentConnection = null;
            }
            
            // Limpiar referencias globales
            global.lastVoiceChannel = null;
            global.lastTextChannel = null;

            await interaction.reply('⏹️ **Música detenida** y desconectado del canal de voz.');

        } catch (error) {
            console.error('Error al detener música:', error);
            await interaction.reply('❌ Error al detener la música.');
        }
    },
};
