const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Elimina una canción específica de la cola')
        .addIntegerOption(option =>
            option.setName('posicion')
                .setDescription('Número de posición de la canción a eliminar')
                .setRequired(true)
                .setMinValue(1)),

    async execute(interaction) {
        const position = interaction.options.getInteger('posicion');
        const queue = interaction.client.musicQueues?.get(interaction.guild.id);

        if (!queue || queue.length === 0) {
            return await interaction.reply('❌ No hay canciones en la cola.');
        }

        if (position > queue.length) {
            return await interaction.reply(`❌ Posición no válida. La cola tiene ${queue.length} canciones.`);
        }

        try {
            // Remover la canción en la posición especificada
            const removedSong = queue.splice(position - 1, 1)[0];

            const embed = new EmbedBuilder()
                .setColor('#FF6B35')
                .setTitle('🗑️ Canción Eliminada')
                .addFields(
                    { name: '❌ Eliminada', value: removedSong.title || removedSong.searchQuery, inline: false },
                    { name: '📍 Posición', value: position.toString(), inline: true },
                    { name: '📊 Canciones restantes', value: queue.length.toString(), inline: true }
                )
                .setTimestamp();

            if (queue.length === 0) {
                embed.addFields({ name: '⚠️ Nota', value: 'La cola está ahora vacía', inline: false });
                // Limpiar cola vacía
                interaction.client.musicQueues.delete(interaction.guild.id);
            }

            embed.setFooter({ 
                text: 'Usa /queue para ver la cola actualizada • /remove posicion:<número> para eliminar más'
            });

            await interaction.reply({ embeds: [embed] });

            console.log(`🗑️ Eliminada canción posición ${position}: ${removedSong.title || removedSong.searchQuery}`);

        } catch (error) {
            console.error('Error al eliminar canción:', error);
            await interaction.reply('❌ Hubo un error al intentar eliminar la canción.');
        }
    },
};