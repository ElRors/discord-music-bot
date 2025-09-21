const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const musicState = require('./utils/musicState');
require('dotenv').config();

// Cargar librería de encriptación para audio
try {
    require('libsodium-wrappers');
    console.log('✅ Librería de encriptación cargada');
} catch (error) {
    console.log('⚠️ Advertencia: No se pudo cargar libsodium-wrappers');
}

// Cargar codec de audio Opus
try {
    require('@discordjs/opus');
    console.log('✅ Codec Opus cargado');
} catch (error) {
    console.log('⚠️ Advertencia: No se pudo cargar @discordjs/opus');
}

// Crear cliente de Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// Colección para comandos
client.commands = new Collection();

// Map para almacenar conexiones de voz
client.voiceConnections = new Map();

// Variables globales para auto-desconexión por inactividad
global.inactivityTimeout = null;
global.INACTIVITY_LIMIT = 45000; // 45 segundos en milisegundos

// Variables globales para modo radio/autoplay
global.radioMode = false; // Si está activado el modo radio
global.lastPlayedSongs = []; // Historial de canciones para recomendaciones
global.MAX_HISTORY = 10; // Máximo de canciones en el historial

// Funciones globales para manejar auto-desconexión por inactividad
global.startInactivityTimer = function() {
    // Cancelar timer existente si hay uno
    if (global.inactivityTimeout) {
        clearTimeout(global.inactivityTimeout);
    }
    
    console.log('⏰ Iniciando timer de inactividad (45 segundos)');
    global.inactivityTimeout = setTimeout(() => {
        global.disconnectFromVoice();
    }, global.INACTIVITY_LIMIT);
};

global.cancelInactivityTimer = function() {
    if (global.inactivityTimeout) {
        clearTimeout(global.inactivityTimeout);
        global.inactivityTimeout = null;
        console.log('✅ Timer de inactividad cancelado');
    }
};

global.disconnectFromVoice = function() {
    try {
        console.log('🚶 Desconectando por inactividad...');
        
        // Limpiar la cola
        global.musicQueue = [];
        
        // Detener el reproductor global si existe
        if (global.audioPlayer) {
            global.audioPlayer.stop();
            global.audioPlayer = null;
        }
        
        // Desconectar del canal de voz
        if (global.currentConnection) {
            global.currentConnection.destroy();
            global.currentConnection = null;
        }
        
        // Limpiar referencias globales
        global.lastVoiceChannel = null;
        global.currentSong = null;
        global.inactivityTimeout = null;
        
        // Enviar mensaje de desconexión si hay canal de texto
        if (global.lastTextChannel) {
            global.lastTextChannel.send('🚶 **Bot desconectado por inactividad** (45 segundos sin música)')
                .catch(err => console.log('No se pudo enviar mensaje de desconexión:', err));
            global.lastTextChannel = null;
        }
        
        console.log('✅ Desconectado exitosamente por inactividad');
    } catch (error) {
        console.error('❌ Error al desconectar por inactividad:', error);
    }
};

// Cargar comandos
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
}

// Función helper para crear controles de música
function createMusicControls() {
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('music_skip')
                .setLabel('⏭️ Skip')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('music_pause')
                .setLabel('⏸️ Pause')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('music_resume')
                .setLabel('▶️ Resume')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('music_queue')
                .setLabel('📊 Queue')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('music_stop')
                .setLabel('⏹️ Stop')
                .setStyle(ButtonStyle.Danger)
        );
}

// Función helper para mostrar controles automáticamente después de acciones
async function showControlsAfterAction(channel, message) {
    try {
        if (!channel) return;
        
        await channel.send({
            content: message,
            components: [createMusicControls()]
        });
        
        console.log('✅ Controles automáticos enviados después de acción');
    } catch (error) {
        console.error('❌ Error enviando controles después de acción:', error);
    }
}

// Evento cuando el bot está listo
client.once('ready', () => {
    console.log(`✅ Bot conectado como ${client.user.tag}!`);
    console.log(`🎵 Bot de música listo para usar en ${client.guilds.cache.size} servidores`);
});

// Manejar comandos
client.on('interactionCreate', async interaction => {
    console.log(`🔍 Interacción recibida: ${interaction.commandName || interaction.customId || 'sin comando'}`);
    
    // Manejar botones de música
    if (interaction.isButton()) {
        const { customId } = interaction;
        
        if (customId.startsWith('music_')) {
            await handleMusicButton(interaction, customId);
            return;
        }
    }
    
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.log(`❌ Comando no encontrado: ${interaction.commandName}`);
        return;
    }

    try {
        console.log(`⚡ Ejecutando comando: ${interaction.commandName}`);
        await command.execute(interaction);
        console.log(`✅ Comando ejecutado exitosamente: ${interaction.commandName}`);
    } catch (error) {
        console.error('Error ejecutando comando:', error);
        await interaction.reply({ 
            content: '❌ Hubo un error al ejecutar este comando!', 
            ephemeral: true 
        });
    }
});

// Función para manejar botones de música
async function handleMusicButton(interaction, customId) {
    try {
        // Verificar que el usuario esté en un canal de voz
        if (!interaction.member.voice.channel) {
            return await interaction.reply({ 
                content: '❌ Debes estar en un canal de voz para usar los controles!', 
                ephemeral: true 
            });
        }

        switch (customId) {
            case 'music_skip':
                // Verificar si hay música para saltar
                if (!musicState.hasActiveMusic()) {
                    return await interaction.reply({ 
                        content: '❌ No hay música reproduciéndose actualmente.', 
                        ephemeral: true 
                    });
                }

                // Verificar si hay más canciones en la cola
                if (musicState.getQueueLength() === 0) {
                    return await interaction.reply({ 
                        content: '❌ No hay más canciones en la cola para saltar.', 
                        ephemeral: true 
                    });
                }

                global.audioPlayer.stop();
                await interaction.reply('⏭️ **Canción saltada** por ' + interaction.user.displayName);
                break;

            case 'music_pause':
                if (!musicState.isPlaying()) {
                    return await interaction.reply({ 
                        content: '❌ No hay música reproduciéndose actualmente o ya está pausada.', 
                        ephemeral: true 
                    });
                }

                global.audioPlayer.pause();
                
                // Iniciar timer de inactividad cuando se pausa
                global.startInactivityTimer();
                
                await interaction.reply('⏸️ **Música pausada** por ' + interaction.user.displayName);
                break;

            case 'music_resume':
                if (!musicState.isPaused()) {
                    return await interaction.reply({ 
                        content: '❌ No hay música pausada para reanudar.', 
                        ephemeral: true 
                    });
                }

                global.audioPlayer.unpause();
                
                // Cancelar timer de inactividad cuando se reanuda
                global.cancelInactivityTimer();
                
                await interaction.reply('▶️ **Música reanudada** por ' + interaction.user.displayName);
                break;

            case 'music_queue':
                // Mostrar la cola de música usando funciones centralizadas
                if (!musicState.hasActiveMusic() || musicState.getQueueLength() === 0) {
                    return await interaction.reply({ 
                        content: '❌ No hay canciones en la cola.', 
                        ephemeral: true 
                    });
                }

                const { EmbedBuilder } = require('discord.js');
                const itemsPerPage = 10;
                const totalPages = Math.ceil(musicState.getQueueLength() / itemsPerPage);
                const queueSlice = global.musicQueue.slice(0, itemsPerPage); // Mostrar primera página

                const currentSong = musicState.getCurrentSong();
                const currentInfo = currentSong ? `**🎵 Reproduciendo:** ${currentSong.title}\n\n` : '';

                const embed = new EmbedBuilder()
                    .setColor('#1DB954')
                    .setTitle('🎵 Cola de Reproducción')
                    .setDescription(currentInfo)
                    .addFields(
                        { name: '📊 Estado', value: musicState.getPlayerStatus(), inline: true },
                        { name: '🎵 Canciones en cola', value: musicState.getQueueLength().toString(), inline: true },
                        { name: '🔀 Shuffle', value: global.guildSettings?.[interaction.guild.id]?.shuffle ? 'Activado' : 'Desactivado', inline: true }
                    )
                    .setTimestamp();

                let queueText = '';
                queueSlice.forEach((song, index) => {
                    const position = index + 1;
                    const title = song.title || 'Título desconocido';
                    const artist = song.artist ? ` por **${song.artist}**` : '';
                    const source = song.isSpotify ? '[SPOTIFY→YT]' : '[YOUTUBE]';
                    queueText += `**${position}.** ${title}${artist} ${source}\n`;
                });

                if (queueText) {
                    embed.addFields({
                        name: `🔄 Próximas Canciones (Página 1/${totalPages})`,
                        value: queueText,
                        inline: false
                    });
                }

                embed.setFooter({ 
                    text: `Usa /queue para ver la cola completa con paginación`
                });

                await interaction.reply({ embeds: [embed], ephemeral: true });
                break;

            case 'music_stop':
                // Usar la función centralizada para verificar y limpiar estado
                if (!musicState.hasActiveMusic()) {
                    return await interaction.reply({ 
                        content: '❌ No hay música reproduciéndose actualmente.', 
                        ephemeral: true 
                    });
                }

                try {
                    musicState.clearMusicState();
                    await interaction.reply('⏹️ **Música detenida** por ' + interaction.user.displayName);
                } catch (error) {
                    console.error('❌ Error en botón detener:', error);
                    await interaction.reply({ 
                        content: '❌ Error al detener la música, pero se intentó limpiar el estado.', 
                        ephemeral: true 
                    });
                }
                break;

            default:
                await interaction.reply({ 
                    content: '❌ Botón no reconocido.', 
                    ephemeral: true 
                });
        }
    } catch (error) {
        console.error('Error manejando botón de música:', error);
        await interaction.reply({ 
            content: '❌ Error al procesar el control de música.', 
            ephemeral: true 
        });
    }
}

// Manejar errores
client.on('error', error => {
    console.error('Error del cliente Discord:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Iniciar el bot
client.login(process.env.DISCORD_TOKEN);
