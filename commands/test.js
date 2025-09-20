// Comando de prueba simple para verificar si el problema es de registro
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Comando de prueba simple'),

    async execute(interaction) {
        await interaction.reply('✅ ¡El bot funciona correctamente!');
    },
};