const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const musicState = require('../utils/musicState');

// ID de usuario autorizado (ElRors#9414)
const AUTHORIZED_USER_ID = '348607763674914816';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('exclusive-status')
        .setDescription('[EXCLUSIVO ElRors] Ver estado detallado del modo exclusivo')
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Ver información detallada del estado actual'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('debug')
                .setDescription('Ver información de depuración completa'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('history')
                .setDescription('Ver historial de canciones reproducidas')),

    async execute(interaction) {
        // Verificar que solo ElRors pueda usar este comando
        if (interaction.user.id !== AUTHORIZED_USER_ID) {
            return await interaction.reply({
                content: '🚫 **Acceso Denegado** - Este comando es exclusivo para ElRors.',
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'info':
                await handleInfo(interaction);
                break;
            case 'debug':
                await handleDebug(interaction);
                break;
            case 'history':
                await handleHistory(interaction);
                break;
        }
    },
};

async function handleInfo(interaction) {
    const currentSong = musicState.getCurrentSong();
    const playerStatus = musicState.getPlayerStatus();
    const queueLength = musicState.getQueueLength();

    const embed = new EmbedBuilder()
        .setColor('#1DB954')
        .setTitle('🎵 Estado Exclusivo - ElRors')
        .setTimestamp();

    if (currentSong) {
        embed.addFields(
            { name: '🎵 Canción Actual', value: currentSong.title, inline: false },
            { name: '🎤 Artista', value: currentSong.artist || 'Desconocido', inline: true },
            { name: '📊 Estado', value: playerStatus, inline: true },
            { name: '🔗 Fuente', value: currentSong.source || 'Desconocida', inline: true }
        );

        if (currentSong.album) {
            embed.addFields({ name: '💿 Álbum', value: currentSong.album, inline: true });
        }

        if (currentSong.duration) {
            const duration = formatDuration(currentSong.duration * 1000);
            embed.addFields({ name: '⏱️ Duración', value: duration, inline: true });
        }

        if (currentSong.popularity) {
            embed.addFields({ name: '📈 Popularidad', value: `${currentSong.popularity}/100`, inline: true });
        }

        if (currentSong.spotifyUrl) {
            embed.addFields({ name: '🔗 Spotify URL', value: `[Abrir en Spotify](${currentSong.spotifyUrl})`, inline: false });
        }
    } else {
        embed.setDescription('❌ No hay música reproduciéndose actualmente');
    }

    embed.addFields(
        { name: '📋 Canciones en Cola', value: queueLength.toString(), inline: true },
        { name: '🔐 Modo Exclusivo', value: '✅ Activo', inline: true }
    );

    await interaction.reply({ embeds: [embed] });
}

async function handleDebug(interaction) {
    const debugInfo = musicState.getStateDebugInfo();
    
    const embed = new EmbedBuilder()
        .setColor('#FF5733')
        .setTitle('🔍 Debug Info - Modo Exclusivo')
        .setTimestamp();

    let debugText = '';
    for (const [key, value] of Object.entries(debugInfo)) {
        debugText += `**${key}:** ${typeof value === 'object' ? JSON.stringify(value) : value}\n`;
    }

    // Agregar información adicional
    debugText += '\n**Variables Globales:**\n';
    debugText += `**global.currentConnection:** ${global.currentConnection ? '✅ Conectado' : '❌ No conectado'}\n`;
    debugText += `**global.lastVoiceChannel:** ${global.lastVoiceChannel ? global.lastVoiceChannel.name : 'Ninguno'}\n`;
    debugText += `**global.lastTextChannel:** ${global.lastTextChannel ? global.lastTextChannel.name : 'Ninguno'}\n`;
    debugText += `**global.pendingSong:** ${global.pendingSong ? global.pendingSong.title : 'Ninguna'}\n`;
    debugText += `**global.musicQueue length:** ${global.musicQueue ? global.musicQueue.length : 0}\n`;

    embed.setDescription(debugText);
    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleHistory(interaction) {
    const history = global.lastPlayedSongs || [];
    
    const embed = new EmbedBuilder()
        .setColor('#1DB954')
        .setTitle('📜 Historial de Reproducción - ElRors')
        .setTimestamp();

    if (history.length === 0) {
        embed.setDescription('❌ No hay historial de canciones');
    } else {
        let historyText = '';
        const recentHistory = history.slice(-10).reverse(); // Últimas 10, más reciente primero
        
        recentHistory.forEach((song, index) => {
            historyText += `**${index + 1}.** ${song}\n`;
        });

        embed.setDescription(historyText);
        embed.setFooter({ text: `Mostrando últimas ${recentHistory.length} de ${history.length} canciones` });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}