const { SlashCommandBuilder } = require('discord.js');

// ID de usuario autorizado (ElRors)
const AUTHORIZED_USER_ID = '422500968262008842';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('restart')
        .setDescription('[EXCLUSIVO ElRors] Reiniciar el bot de música completamente'),

    async execute(interaction) {
        // Verificar que solo ElRors pueda usar este comando
        if (interaction.user.id !== AUTHORIZED_USER_ID) {
            return await interaction.reply({
                content: '🚫 **Acceso Denegado** - Este comando es exclusivo para ElRors.',
                ephemeral: true
            });
        }

        // Respuesta inmediata
        await interaction.reply('🔄 **Reiniciando bot...** El bot se desconectará y volverá a conectarse en unos segundos.');

        try {
            console.log('🔄 [RESTART] Comando de reinicio ejecutado por ElRors');
            console.log('🔄 [RESTART] Iniciando secuencia de reinicio...');

            // Limpiar estado de música
            if (global.audioPlayer) {
                console.log('🔄 [RESTART] Deteniendo reproductor de audio...');
                global.audioPlayer.stop();
            }

            // Desconectar de canales de voz
            if (global.currentConnection) {
                console.log('🔄 [RESTART] Desconectando de canal de voz...');
                global.currentConnection.destroy();
            }

            // Limpiar variables globales
            console.log('🔄 [RESTART] Limpiando estado global...');
            global.currentSong = null;
            global.musicQueue = [];
            global.currentConnection = null;
            global.audioPlayer = null;
            global.lastVoiceChannel = null;
            global.lastTextChannel = null;
            global.pendingSong = null;

            // Notificar en el canal antes del reinicio
            setTimeout(async () => {
                try {
                    await interaction.followUp('🤖 **Bot reiniciado exitosamente!** Todos los comandos están listos para usar.');
                } catch (error) {
                    console.log('⚠️ [RESTART] No se pudo enviar mensaje de confirmación (normal durante reinicio)');
                }
            }, 1000);

            // Programar el reinicio del proceso
            setTimeout(() => {
                console.log('🔄 [RESTART] Ejecutando reinicio del proceso...');
                console.log('🔄 [RESTART] ¡Nos vemos en un momento!');
                
                // Salir del proceso - el script de inicio debe reiniciarlo automáticamente
                process.exit(0);
            }, 2000);

        } catch (error) {
            console.error('❌ [RESTART] Error durante el reinicio:', error);
            try {
                await interaction.followUp('❌ **Error durante el reinicio:** ' + error.message);
            } catch (followUpError) {
                console.error('❌ [RESTART] No se pudo enviar mensaje de error:', followUpError);
            }
        }
    },
};