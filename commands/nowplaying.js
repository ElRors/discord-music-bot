const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Muestra la canción que se está reproduciendo actualmente'),

    async execute(interaction) {
        const voiceConnection = interaction.client.voiceConnections.get(interaction.guild.id);

        if (!voiceConnection || !voiceConnection.currentSong) {
            return await interaction.reply('❌ No hay música reproduciéndose actualmente.');
        }

        const song = voiceConnection.currentSong;

        await interaction.reply({
            content: `🎵 **Reproduciendo ahora:**\n**Título:** ${song.title}\n**Solicitado por:** ${song.requester}\n**URL:** ${song.url}`
        });
    },
};
