const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function clearCommands() {
    try {
        console.log('🔄 Limpiando comandos obsoletos...');

        // Limpiar comandos globales
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });

        console.log('✅ Comandos limpiados exitosamente!');
        console.log('⏳ Espera unos segundos antes de registrar los nuevos comandos...');
        
    } catch (error) {
        console.error('❌ Error al limpiar comandos:', error);
    }
}

clearCommands();