const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Muestra la cola de reproducción actual')
        .addIntegerOption(option =>
            option.setName('pagina')
                .setDescription('Número de página (cada página muestra 10 canciones)')
                .setMinValue(1)),

    async execute(interaction) {
        const page = interaction.options.getInteger('pagina') || 1;

        // Usar la cola global
        if (!global.musicQueue || global.musicQueue.length === 0) {
            return await interaction.reply('❌ No hay canciones en la cola.');
        }

        const itemsPerPage = 10;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const totalPages = Math.ceil(global.musicQueue.length / itemsPerPage);

        if (page > totalPages) {
            return await interaction.reply(`❌ Página no válida. Hay ${totalPages} páginas disponibles.`);
        }

        const embed = new EmbedBuilder()
            .setColor('#1DB954')
            .setTitle('🎵 Cola de Reproducción')
            .setTimestamp();

        // Información general
        embed.addFields({
            name: '📊 Información de la Cola',
            value: `**Canciones en cola:** ${global.musicQueue.length}\n**Estado:** ${global.audioPlayer ? 'Reproduciendo' : 'Detenido'}`,
            inline: false
        });

        // Lista de la cola
        const queueSlice = global.musicQueue.slice(startIndex, endIndex);
        let queueText = '';
        
        queueSlice.forEach((song, index) => {
            const position = startIndex + index + 1;
            const title = song.title || 'Título desconocido';
            const artist = song.artist ? ` por **${song.artist}**` : '';
            const source = song.isSpotify ? '[SPOTIFY→YT]' : '[YOUTUBE]';
            queueText += `**${position}.** ${title}${artist} ${source}\n`;
        });

        if (queueText) {
            embed.addFields({
                name: `🔄 Próximas Canciones (Página ${page}/${totalPages})`,
                value: queueText,
                inline: false
            });
        }

        // Información adicional
        const shuffleStatus = global.guildSettings?.[interaction.guild.id]?.shuffle ? '🔀 Activado' : '➡️ Desactivado';
        
        embed.addFields(
            { name: '📊 Total de Canciones', value: global.musicQueue.length.toString(), inline: true },
            { name: '🔀 Shuffle', value: shuffleStatus, inline: true },
            { name: '📄 Páginas', value: `${page}/${totalPages}`, inline: true }
        );

        embed.setFooter({ 
            text: `Usa /queue pagina:<número> para ver más • /skip para siguiente • /skipto posicion:<número> para saltar`
        });

        await interaction.reply({ embeds: [embed] });
    },
};