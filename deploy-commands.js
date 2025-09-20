const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Cargar todos los comandos
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    commands.push(command.data.toJSON());
}

// Configurar REST
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// Función para registrar comandos
async function deployCommands() {
    try {
        console.log(`🔄 Registrando ${commands.length} comandos de aplicación...`);

        // Registrar comandos para servidor específico (instantáneo)
        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );

        console.log(`✅ ${data.length} comandos registrados exitosamente!`);
    } catch (error) {
        console.error('❌ Error al registrar comandos:', error);
    }
}

deployCommands();
