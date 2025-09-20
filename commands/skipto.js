const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createAudioResource } = require('@discordjs/voice');
const ytdl = require('@distube/ytdl-core');
const YouTubeSearchAPI = require('youtube-search-api');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skipto')
        .setDescription('Salta a una canción específica en la cola')
        .addIntegerOption(option =>
            option.setName('posicion')
                .setDescription('Número de posición de la canción en la cola')
                .setRequired(true)
                .setMinValue(1)),

    async execute(interaction) {
        const position = interaction.options.getInteger('posicion');
        const voiceConnection = interaction.client.voiceConnections.get(interaction.guild.id);
        const queue = interaction.client.musicQueues?.get(interaction.guild.id);

        if (!voiceConnection) {
            return await interaction.reply('❌ No hay música reproduciéndose actualmente.');
        }

        if (!queue || queue.length === 0) {
            return await interaction.reply('❌ No hay canciones en la cola.');
        }

        if (position > queue.length) {
            return await interaction.reply(`❌ Posición no válida. La cola tiene ${queue.length} canciones.`);
        }

        await interaction.deferReply();

        try {
            const targetSong = queue[position - 1];
            const currentSong = voiceConnection.currentSong;
            
            // Remover todas las canciones antes de la posición objetivo
            const removedSongs = queue.splice(0, position - 1);
            
            const embed = new EmbedBuilder()
                .setColor('#FF6B35')
                .setTitle('⏭️ Saltando a Canción Específica')
                .addFields(
                    { name: '⏹️ Canción actual', value: currentSong?.title || 'Desconocida', inline: false },
                    { name: '🎯 Saltando a', value: `**${position}.** ${targetSong.title || targetSong.searchQuery}`, inline: false },
                    { name: '🗑️ Canciones saltadas', value: removedSongs.length.toString(), inline: true },
                    { name: '📊 Canciones restantes', value: queue.length.toString(), inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            // Buscar y reproducir la canción objetivo
            await this.playTargetSong(interaction, targetSong, voiceConnection);

        } catch (error) {
            console.error('Error al saltar a canción específica:', error);
            await interaction.editReply('❌ Hubo un error al intentar saltar a esa canción.');
        }
    },

    async playTargetSong(interaction, targetSong, voiceConnection) {
        try {
            // Buscar la canción en YouTube
            const searchResults = await YouTubeSearchAPI.GetListByKeyword(targetSong.searchQuery, false, 1);
            
            if (!searchResults.items || searchResults.items.length === 0) {
                console.error(`No se encontró: ${targetSong.searchQuery}`);
                return;
            }

            const videoUrl = `https://www.youtube.com/watch?v=${searchResults.items[0].id}`;
            const title = searchResults.items[0].title;
            
            // Crear nuevo recurso de audio
            const stream = ytdl(videoUrl, {
                filter: 'audioonly',
                quality: 'highestaudio'
            });
            
            const resource = createAudioResource(stream);
            
            // Reproducir la nueva canción
            voiceConnection.player.play(resource);
            
            // Actualizar información de la canción actual
            voiceConnection.currentSong = {
                title: title,
                url: videoUrl,
                requester: 'Skipto'
            };

            console.log(`⏭️ Saltando a: ${title}`);

        } catch (error) {
            console.error('Error reproduciendo canción objetivo:', error);
            
            // Si falla, intentar con la siguiente en la cola
            const queue = interaction.client.musicQueues?.get(interaction.guild.id);
            if (queue && queue.length > 1) {
                queue.shift(); // Remover la canción que falló
                voiceConnection.player.stop(); // Esto activará la reproducción de la siguiente
            }
        }
    }
};