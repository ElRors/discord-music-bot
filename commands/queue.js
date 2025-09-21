const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Muestra la cola de reproducción actual')
        .addIntegerOption(option =>
            option.setName('pagina')
                .setDescription('Número de página (cada página muestra 25 canciones)')
                .setMinValue(1))
        .addBooleanOption(option =>
            option.setName('completa')
                .setDescription('Mostrar toda la cola sin paginación')),

    async execute(interaction) {
        const page = interaction.options.getInteger('pagina') || 1;
        const showComplete = interaction.options.getBoolean('completa') || false;

        // Usar la cola global
        if (!global.musicQueue || global.musicQueue.length === 0) {
            return await interaction.reply('❌ No hay canciones en la cola.');
        }

        const embed = new EmbedBuilder()
            .setColor('#1DB954')
            .setTitle('🎵 Cola de Reproducción')
            .setTimestamp();

        // Información general
        const currentSong = global.currentSong;
        const currentInfo = currentSong ? 
            `**Reproduciendo:** ${currentSong.title}${currentSong.artist ? ` por ${currentSong.artist}` : ''}\n` : '';
        
        embed.addFields({
            name: '📊 Información de la Cola',
            value: `${currentInfo}**Canciones en cola:** ${global.musicQueue.length}\n**Estado:** ${global.audioPlayer ? 'Reproduciendo' : 'Detenido'}`,
            inline: false
        });

        if (showComplete) {
            // Mostrar toda la cola (máximo 50 para evitar límites de Discord)
            const maxSongs = Math.min(global.musicQueue.length, 50);
            let queueText = '';
            
            for (let i = 0; i < maxSongs; i++) {
                const song = global.musicQueue[i];
                const position = i + 1;
                const title = song.title || 'Título desconocido';
                const artist = song.artist ? ` por **${song.artist}**` : '';
                const source = song.isSpotify ? '[SPOTIFY→YT]' : '[YOUTUBE]';
                queueText += `**${position}.** ${title}${artist} ${source}\n`;
                
                // Dividir en chunks si es muy largo
                if (queueText.length > 1800 && i < maxSongs - 1) {
                    embed.addFields({
                        name: i === 0 ? `🔄 Próximas Canciones (1-${i+1})` : `🔄 Continuación (${Math.max(1, i-24)}-${i+1})`,
                        value: queueText,
                        inline: false
                    });
                    queueText = '';
                }
            }
            
            if (queueText) {
                embed.addFields({
                    name: maxSongs === global.musicQueue.length ? 
                        `🔄 Próximas Canciones (Completa)` : 
                        `🔄 Próximas Canciones (Mostrando 1-${maxSongs})`,
                    value: queueText,
                    inline: false
                });
            }
            
            if (global.musicQueue.length > 50) {
                embed.addFields({
                    name: '⚠️ Nota',
                    value: `Solo se muestran las primeras 50 canciones. Total: ${global.musicQueue.length}`,
                    inline: false
                });
            }
            
        } else {
            // Paginación normal con más canciones por página
            const itemsPerPage = 25; // Aumentado de 10 a 25
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const totalPages = Math.ceil(global.musicQueue.length / itemsPerPage);

            if (page > totalPages) {
                return await interaction.reply(`❌ Página no válida. Hay ${totalPages} páginas disponibles.`);
            }

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
            
            embed.addFields({
                name: '💡 Tip',
                value: 'Usa `/queue completa:true` para ver toda la cola',
                inline: false
            });
        }

        // Información adicional
        const shuffleStatus = global.guildSettings?.[interaction.guild.id]?.shuffle ? '🔀 Activado' : '➡️ Desactivado';
        
        embed.addFields(
            { name: '📊 Total de Canciones', value: global.musicQueue.length.toString(), inline: true },
            { name: '🔀 Shuffle', value: shuffleStatus, inline: true },
            { name: '📄 Páginas', value: showComplete ? 'Completa' : `${page}/${Math.ceil(global.musicQueue.length / 25)}`, inline: true }
        );

        embed.setFooter({ 
            text: showComplete ? 
                'Usa /queue para ver con paginación • /skip para siguiente' :
                'Usa /queue pagina:<número> para ver más • /queue completa:true para ver todo'
        });

        await interaction.reply({ embeds: [embed] });
    },
};