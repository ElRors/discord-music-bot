const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Muestra la cola de reproducción actual'),

    async execute(interaction) {
        const queue = interaction.client.musicQueues?.get(interaction.guild.id);

        if (!queue || queue.length === 0) {
            return await interaction.reply('❌ No hay canciones en la cola.');
        }

        const currentSong = interaction.client.voiceConnections.get(interaction.guild.id)?.currentSong;
        
        let queueText = '';
        if (currentSong) {
            queueText += `🎵 **Reproduciendo ahora:** ${currentSong.title}\n\n`;
        }

        queueText += '**🔄 Cola de reproducción:**\n';
        queue.slice(0, 10).forEach((song, index) => {
            queueText += `${index + 1}. ${song.name} - ${song.artist}\n`;
        });

        if (queue.length > 10) {
            queueText += `\n... y ${queue.length - 10} canciones más`;
        }

        await interaction.reply({
            content: queueText,
            ephemeral: true
        });
    },
};