const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Muestra todos los comandos disponibles del bot'),

    async execute(interaction) {
        const helpEmbed = {
            color: 0x0099ff,
            title: '🎵 Bot de Música - Comandos Disponibles',
            description: 'Aquí tienes todos los comandos que puedes usar:',
            fields: [
                {
                    name: '🎵 `/play <canción/URL>`',
                    value: '**Reproduce música de múltiples fuentes:**\n• YouTube: URLs individuales o playlists\n• Spotify: URLs de canciones/playlists (busca en YouTube)\n• Búsqueda: Cualquier nombre de canción\n• Crea cola automática para playlists',
                    inline: false
                },
                {
                    name: '⏹️ `/stop`',
                    value: 'Detiene la música actual y desconecta el bot del canal de voz.',
                    inline: false
                },
                {
                    name: '⏭️ `/skip`',
                    value: 'Salta a la siguiente canción en la cola (solo para playlists).',
                    inline: false
                },
                {
                    name: '📋 `/nowplaying`',
                    value: 'Muestra información sobre la canción que se está reproduciendo actualmente.',
                    inline: false
                },
                {
                    name: '🔄 `/queue`',
                    value: 'Muestra la cola de reproducción actual.',
                    inline: false
                },
                {
                    name: '❓ `/help`',
                    value: 'Muestra este mensaje de ayuda.',
                    inline: false
                }
            ],
            footer: {
                text: 'Bot de Música v1.0 | Desarrollado con Discord.js'
            },
            timestamp: new Date()
        };

        await interaction.reply({ embeds: [helpEmbed] });
    },
};
