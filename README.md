# 🎵 Bot de Música para Discord

Un bot completo de Discord que puede reproducir música de YouTube y Spotify con comandos slash.

## ✨ Características

- 🎵 Reproducción de música desde YouTube
- 🎧 Integración con Spotify (búsqueda y reproducción)
- ⏯️ Comandos de control (play, stop, nowplaying)
- 🎮 Comandos slash interactivos
- 🔊 Soporte para canales de voz
- 📱 Respuestas con embeds elegantes

## 🚀 Instalación

### Prerequisitos

1. **Node.js** (versión 16 o superior)
   - Descarga desde: https://nodejs.org/
   - Verifica la instalación: `node --version`

2. **FFmpeg** (requerido para reproducir audio)
   - Descarga desde: https://ffmpeg.org/download.html
   - Asegúrate de agregarlo al PATH del sistema

### Configuración del Bot

1. **Crear aplicación en Discord Developer Portal:**
   - Ve a https://discord.com/developers/applications
   - Crea una nueva aplicación
   - Ve a la sección "Bot" y crea un bot
   - Copia el token del bot

2. **Configurar Spotify API (opcional):**
   - Ve a https://developer.spotify.com/dashboard
   - Crea una nueva aplicación
   - Copia el Client ID y Client Secret

3. **Configurar variables de entorno:**
   ```bash
   # Copia el archivo de ejemplo
   cp .env.example .env
   ```
   
   Edita el archivo `.env` con tus credenciales:
   ```
   DISCORD_TOKEN=tu_token_de_discord_aqui
   CLIENT_ID=tu_client_id_de_discord_aqui
   SPOTIFY_CLIENT_ID=tu_spotify_client_id_aqui
   SPOTIFY_CLIENT_SECRET=tu_spotify_client_secret_aqui
   ```

4. **Instalar dependencias:**
   ```bash
   npm install
   ```

5. **Registrar comandos slash:**
   ```bash
   node deploy-commands.js
   ```

6. **Ejecutar el bot:**
   ```bash
   npm start
   ```

## 🎮 Comandos Disponibles

| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `/play <canción>` | Reproduce música de YouTube | `/play Bohemian Rhapsody` |
| `/spotify <búsqueda>` | Reproduce música de Spotify | `/spotify The Beatles Yesterday` |
| `/stop` | Detiene la música y desconecta el bot | `/stop` |
| `/nowplaying` | Muestra la canción actual | `/nowplaying` |
| `/help` | Muestra todos los comandos | `/help` |

## 📁 Estructura del Proyecto

```
bot/
├── commands/          # Comandos del bot
│   ├── help.js       # Comando de ayuda
│   ├── play.js       # Reproducir YouTube
│   ├── spotify.js    # Reproducir Spotify
│   ├── stop.js       # Detener música
│   └── nowplaying.js # Canción actual
├── config/           # Archivos de configuración
├── utils/            # Utilidades
├── .env.example      # Variables de entorno ejemplo
├── deploy-commands.js # Registrar comandos slash
├── index.js          # Archivo principal
└── package.json      # Dependencias
```

## 🔧 Configuración en VS Code

El proyecto incluye tareas preconfiguradas:

- **Instalar dependencias**: `Ctrl+Shift+P` → "Tasks: Run Task" → "Instalar dependencias"
- **Ejecutar bot**: `Ctrl+Shift+P` → "Tasks: Run Task" → "Ejecutar bot"

## 🔒 Permisos del Bot

El bot necesita los siguientes permisos en Discord:

- `Send Messages` - Enviar mensajes
- `Use Slash Commands` - Usar comandos slash  
- `Connect` - Conectarse a canales de voz
- `Speak` - Hablar en canales de voz
- `Use Voice Activity` - Usar activación por voz

## 📝 Notas Importantes

1. **FFmpeg requerido**: Es esencial para la reproducción de audio
2. **Spotify es opcional**: El bot funcionará solo con YouTube si no configuras Spotify
3. **Token de Discord**: Mantén tu token seguro y nunca lo compartas
4. **Límites de API**: YouTube y Spotify tienen límites de uso diario

## 🛠️ Solución de Problemas

### Error: "node/npm no se reconoce"
- Instala Node.js desde https://nodejs.org/
- Reinicia VS Code después de la instalación

### Error de reproducción de audio
- Verifica que FFmpeg esté instalado
- Asegúrate de que el bot tenga permisos en el canal de voz

### Error de conexión a Discord
- Verifica que el token en `.env` sea correcto
- Asegúrate de que el bot esté invitado al servidor

## 🔗 Enlaces Útiles

- [Discord.js Documentation](https://discord.js.org/)
- [Discord Developer Portal](https://discord.com/developers/)
- [Spotify Web API](https://developer.spotify.com/)
- [FFmpeg Download](https://ffmpeg.org/download.html)

## 📄 Licencia

MIT License - puedes usar este código libremente.

---

¡Disfruta de tu bot de música! 🎵
