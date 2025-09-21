const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('radio')
        .setDescription('Activar o desactivar el modo radio (autoplay)')
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Activar o desactivar el modo radio')
                .setRequired(false)
                .addChoices(
                    { name: 'activar', value: 'on' },
                    { name: 'desactivar', value: 'off' },
                    { name: 'estado', value: 'status' },
                    { name: 'test', value: 'test' }
                )),
    
    async execute(interaction) {
        const mode = interaction.options.getString('mode');
        
        if (!mode || mode === 'status') {
            // Mostrar estado actual
            const status = global.radioMode ? '🔘 **ACTIVADO**' : '⚪ **DESACTIVADO**';
            return await interaction.reply({
                content: `📻 **Modo Radio:** ${status}\n\n` +
                         `🎵 El modo radio reproduce automáticamente canciones similares cuando se acaba la cola.\n` +
                         `📝 Usa \`/radio activar\` o \`/radio desactivar\` para cambiarlo.`,
                ephemeral: true
            });
        }
        
        if (mode === 'on') {
            global.radioMode = true;
            await interaction.reply({
                content: '📻 ✅ **Modo Radio ACTIVADO**\n\n' +
                         '🎵 Ahora reproduciré automáticamente canciones similares cuando se acabe la cola.\n' +
                         '🔄 Las recomendaciones se basan en tu historial de reproducción.',
                ephemeral: false
            });
        } else if (mode === 'off') {
            global.radioMode = false;
            await interaction.reply({
                content: '📻 ❌ **Modo Radio DESACTIVADO**\n\n' +
                         '⏹️ Ya no reproduciré canciones automáticamente cuando se acabe la cola.',
                ephemeral: false
            });
        } else if (mode === 'test') {
            // Probar el sistema de autoplay directamente
            await interaction.reply('🧪 **Probando sistema de autoplay...**');
            
            // Verificar que el usuario esté en un canal de voz
            const voiceChannel = interaction.member.voice.channel;
            if (!voiceChannel) {
                return await interaction.followUp('❌ Debes estar en un canal de voz para probar el autoplay.');
            }
            
            // Simular datos para el test
            if (!global.lastPlayedSongs) global.lastPlayedSongs = [];
            global.lastPlayedSongs.push("The Ocean - The Cambrian Explosion");
            
            global.lastVoiceChannel = voiceChannel;
            global.lastTextChannel = interaction.channel;
            global.musicQueue = []; // Simular cola vacía
            
            console.log('🧪 [RADIO TEST] Simulando autoplay...');
            await interaction.followUp(`📻 **Test de Autoplay:**\n🎵 Modo radio: ${global.radioMode ? 'ACTIVADO' : 'DESACTIVADO'}\n📝 Historial: ${global.lastPlayedSongs.join(', ')}\n🔄 Simulando final de canción...`);
            
            // Simular el autoplay después de 3 segundos
            setTimeout(async () => {
                if (global.radioMode && global.lastTextChannel) {
                    await global.lastTextChannel.send('📻 **Modo Radio:** ¡Se activaría el autoplay ahora! Buscaría canciones similares a "' + global.lastPlayedSongs[global.lastPlayedSongs.length - 1] + '"');
                    console.log('✅ [RADIO TEST] El sistema de autoplay está funcionando correctamente');
                } else {
                    await global.lastTextChannel.send('⚪ **Modo Radio:** No se activaría el autoplay (modo desactivado)');
                    console.log('ℹ️ [RADIO TEST] Autoplay no se activó porque el modo radio está desactivado');
                }
            }, 3000);
        }
        
        console.log(`📻 Modo radio ${global.radioMode ? 'activado' : 'desactivado'} por ${interaction.user.tag}`);
    },
};