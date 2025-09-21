const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('get-my-id')
        .setDescription('Obtener tu Discord User ID (temporal)'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const username = interaction.user.username;
        const discriminator = interaction.user.discriminator;
        
        await interaction.reply({
            content: `🆔 **Tu información:**\n**User ID:** \`${userId}\`\n**Username:** ${username}#${discriminator}`,
            ephemeral: true
        });
    },
};