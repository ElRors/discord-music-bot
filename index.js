const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

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

// Cargar comandos
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
}

// Evento cuando el bot está listo
client.once('ready', () => {
    console.log(`✅ Bot conectado como ${client.user.tag}!`);
    console.log(`🎵 Bot de música listo para usar en ${client.guilds.cache.size} servidores`);
});

// Manejar comandos
client.on('interactionCreate', async interaction => {
    console.log(`🔍 Interacción recibida: ${interaction.commandName || 'sin comando'}`);
    
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

// Manejar errores
client.on('error', error => {
    console.error('Error del cliente Discord:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Iniciar el bot
client.login(process.env.DISCORD_TOKEN);
