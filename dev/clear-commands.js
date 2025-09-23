const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function clearCommands() {
    try {
        console.log('🔄 Limpiando comandos obsoletos...');

        // Limpiar comandos globales
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
        console.log('✅ Comandos globales limpiados');

        // Limpiar comandos de servidor si existe GUILD_ID
        if (process.env.GUILD_ID) {
            await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: [] });
            console.log('✅ Comandos de servidor limpiados');
        }

        console.log('✅ Comandos limpiados exitosamente!');
        console.log('⏳ Espera unos segundos antes de registrar los nuevos comandos...');
        
    } catch (error) {
        console.error('❌ Error al limpiar comandos:', error);
    }
}

clearCommands();