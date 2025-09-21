const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const musicState = require('../utils/musicState');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Detiene la música y desconecta el bot del canal de voz'),

    async execute(interaction) {
        // Verificar si hay música para detener
        if (!musicState.hasActiveMusic()) {
            return await interaction.reply('❌ No hay música reproduciéndose actualmente.');
        }

        try {
            // Usar la función centralizada para limpiar el estado
            musicState.clearMusicState();
            
            await interaction.reply('⏹️ **Música detenida** y desconectado del canal de voz.');

        } catch (error) {
            console.error('Error al detener música:', error);
            await interaction.reply('❌ Error al detener la música, pero se intentó limpiar el estado.');
        }
    },
};
