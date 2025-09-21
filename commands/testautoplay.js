const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('testautoplay')
        .setDescription('Probar el sistema de autoplay manualmente'),

    async execute(interaction) {
        await interaction.reply('🧪 Probando sistema de autoplay...');
        
        // Simular que hay una canción en el historial
        if (!global.lastPlayedSongs) {
            global.lastPlayedSongs = [];
        }
        
        // Agregar canciones de prueba al historial
        global.lastPlayedSongs.push("Tool - Sober");
        global.lastPlayedSongs.push("System of a Down - Chop Suey");
        
        console.log(`🧪 [TEST] Historial simulado: ${JSON.stringify(global.lastPlayedSongs)}`);
        console.log(`🧪 [TEST] Modo radio: ${global.radioMode}`);
        
        // Simular canción actual
        global.currentSong = {
            title: "Test Song",
            isAutoplay: false
        };
        
        // Simular que se terminó la canción y no hay cola
        global.musicQueue = [];
        
        // Asignar canales de prueba
        global.lastTextChannel = interaction.channel;
        global.lastVoiceChannel = interaction.member.voice.channel;
        
        if (!global.lastVoiceChannel) {
            return await interaction.followUp('❌ Debes estar en un canal de voz para probar!');
        }
        
        console.log(`🧪 [TEST] Canales asignados - Voz: ${global.lastVoiceChannel.name}, Texto: ${global.lastTextChannel.name}`);
        
        // Importar la función de recomendación directamente
        try {
            const playModule = require('./play.js');
            
            // Llamar a la función de autoplay manualmente
            console.log('🧪 [TEST] Simulando evento AudioPlayerStatus.Idle...');
            
            // Simular el evento Idle
            setTimeout(async () => {
                console.log('🎵 [TEST] Canción terminada, verificando siguiente...');
                console.log(`🎵 [TEST] Modo radio activo: ${global.radioMode}`);
                console.log(`🎵 [TEST] Canción actual: ${global.currentSong ? global.currentSong.title : 'NO'}`);
                
                // Agregar canción actual al historial si no es autoplay
                if (global.currentSong && !global.currentSong.isAutoplay) {
                    console.log(`🎵 [TEST] Agregando al historial: ${global.currentSong.title}`);
                    // Simular addToHistory
                    global.lastPlayedSongs.push(global.currentSong.title);
                    if (global.lastPlayedSongs.length > 10) {
                        global.lastPlayedSongs.shift();
                    }
                }
                
                console.log(`📝 [TEST] Canciones restantes en cola: ${global.musicQueue ? global.musicQueue.length : 0}`);
                console.log(`📝 [TEST] Historial actual: [${global.lastPlayedSongs ? global.lastPlayedSongs.join(', ') : 'VACÍO'}]`);
                
                // Verificar si hay más canciones o si activar autoplay
                if (!global.musicQueue || global.musicQueue.length === 0) {
                    console.log('⏰ [TEST] No hay más canciones en la cola');
                    
                    // Si está activado el modo radio, buscar recomendación
                    if (global.radioMode) {
                        console.log('📻 [TEST] Modo radio activado, buscando recomendación...');
                        
                        // Simular búsqueda de recomendación
                        await interaction.followUp('📻 **Modo Radio:** Buscando recomendación automática...');
                        
                        // Simular recomendación encontrada
                        const fakeRecommendation = {
                            title: "Recommended Song - Similar to " + global.lastPlayedSongs[global.lastPlayedSongs.length - 1],
                            url: "https://www.youtube.com/watch?v=fake",
                            source: 'AUTOPLAY-YT',
                            requestedBy: 'Radio Bot',
                            isAutoplay: true
                        };
                        
                        console.log(`🤖 [TEST] Recomendación simulada: ${fakeRecommendation.title}`);
                        
                        await interaction.followUp(`📻 **Modo Radio:** Reproduciendo automáticamente **${fakeRecommendation.title}**`);
                        
                    } else {
                        console.log('📻 [TEST] Modo radio NO está activado');
                        await interaction.followUp('⏰ Modo radio desactivado - iniciando timer de inactividad');
                    }
                }
                
            }, 2000);
            
            await interaction.followUp('🧪 Test de autoplay iniciado. Revisa los logs en la consola.');
            
        } catch (error) {
            console.error('❌ [TEST] Error en test de autoplay:', error);
            await interaction.followUp('❌ Error en el test de autoplay: ' + error.message);
        }
    },
};