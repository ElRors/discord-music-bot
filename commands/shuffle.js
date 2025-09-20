const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Activa o desactiva la reproducción aleatoria'),

    async execute(interaction) {
        const queue = interaction.client.musicQueues?.get(interaction.guild.id);

        if (!queue || queue.length === 0) {
            return await interaction.reply('❌ No hay canciones en la cola para mezclar.');
        }

        // Inicializar configuración del servidor si no existe
        if (!interaction.client.guildSettings) {
            interaction.client.guildSettings = new Map();
        }

        let guildSettings = interaction.client.guildSettings.get(interaction.guild.id) || {};
        
        // Alternar shuffle
        guildSettings.shuffle = !guildSettings.shuffle;
        interaction.client.guildSettings.set(interaction.guild.id, guildSettings);

        const embed = new EmbedBuilder()
            .setColor(guildSettings.shuffle ? '#1DB954' : '#FF6B35')
            .setTitle('🔀 Shuffle')
            .setTimestamp();

        if (guildSettings.shuffle) {
            // Activar shuffle - mezclar la cola
            this.shuffleArray(queue);
            
            embed.setDescription('✅ **Shuffle ACTIVADO**\nLa cola ha sido mezclada aleatoriamente.')
                .addFields(
                    { name: '🎲 Estado', value: '🔀 Activado', inline: true },
                    { name: '📊 Canciones mezcladas', value: queue.length.toString(), inline: true }
                );
        } else {
            // Desactivar shuffle
            embed.setDescription('❌ **Shuffle DESACTIVADO**\nLas nuevas canciones se reproducirán en orden.')
                .addFields(
                    { name: '🎲 Estado', value: '➡️ Desactivado', inline: true },
                    { name: '📊 Canciones en cola', value: queue.length.toString(), inline: true }
                );
        }

        embed.setFooter({ 
            text: 'Usa /shuffle nuevamente para cambiar el estado • /queue para ver la cola actual'
        });

        await interaction.reply({ embeds: [embed] });

        console.log(`🔀 Shuffle ${guildSettings.shuffle ? 'activado' : 'desactivado'} en ${interaction.guild.name}`);
    },

    shuffleArray(array) {
        // Algoritmo Fisher-Yates para mezclar array
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
};