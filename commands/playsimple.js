const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const ytdl = require('@distube/ytdl-core');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playsimple')
        .setDescription('Reproducir una canción simple para probar autoplay')
        .addStringOption(option =>
            option.setName('cancion')
                .setDescription('Elige una canción de prueba')
                .setRequired(true)
                .addChoices(
                    { name: '🎵 Canción Test 1 (30 seg)', value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
                    { name: '🎶 Canción Test 2 (45 seg)', value: 'https://www.youtube.com/watch?v=ScM5LQaHTPQ' },
                    { name: '🎸 Rock Test (1 min)', value: 'https://www.youtube.com/watch?v=ZnHmskwqCCQ' }
                )),

    async execute(interaction) {
        const url = interaction.options.getString('cancion');
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return await interaction.reply('❌ Debes estar en un canal de voz!');
        }

        // Respuesta inmediata
        await interaction.reply('🎵 Reproduciendo canción de prueba...');

        try {
            console.log(`🎵 [SIMPLE] Iniciando reproducción de URL: ${url}`);
            
            // Conectar al canal de voz
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                selfDeaf: true,
            });

            // Configurar variables globales
            global.currentConnection = connection;
            global.lastVoiceChannel = voiceChannel;
            global.lastTextChannel = interaction.channel;
            global.musicQueue = []; // Asegurar que la cola esté vacía para probar autoplay

            // Obtener info del video
            const videoInfo = await ytdl.getInfo(url);
            const song = {
                title: videoInfo.videoDetails.title,
                url: url,
                source: 'YT-SIMPLE',
                requestedBy: interaction.user.tag,
                isAutoplay: false
            };

            global.currentSong = song;

            // Agregar al historial para que el autoplay tenga datos
            if (!global.lastPlayedSongs) global.lastPlayedSongs = [];
            global.lastPlayedSongs.push(song.title);
            if (global.lastPlayedSongs.length > 10) {
                global.lastPlayedSongs.shift();
            }

            console.log(`🎵 [SIMPLE] Canción: ${song.title}`);
            console.log(`📻 [SIMPLE] Modo radio: ${global.radioMode}`);
            console.log(`📝 [SIMPLE] Historial actual: ${global.lastPlayedSongs.join(', ')}`);

            // Crear stream de audio
            const stream = ytdl(url, {
                filter: 'audioonly',
                quality: 'highestaudio'
            });
            const resource = createAudioResource(stream);

            // Usar reproductor global
            if (!global.audioPlayer) {
                console.log('🎵 [SIMPLE] Creando reproductor global...');
                global.audioPlayer = createAudioPlayer();
                
                // El evento Idle ya está configurado en play.js, así que debería funcionar
                global.audioPlayer.on('error', error => {
                    console.error('❌ [SIMPLE] Error reproductor:', error);
                });
            }

            // Reproducir
            global.audioPlayer.play(resource);
            connection.subscribe(global.audioPlayer);

            await interaction.editReply(`🎵 **Reproduciendo:** ${song.title}\n📻 **Modo Radio:** ${global.radioMode ? 'ACTIVADO' : 'DESACTIVADO'}\n\n⏰ Cuando termine esta canción, ${global.radioMode ? 'se activará el autoplay automáticamente' : 'NO se activará el autoplay (modo desactivado)'}`);

            console.log(`✅ [SIMPLE] Reproducción iniciada. Autoplay: ${global.radioMode ? 'ACTIVADO' : 'DESACTIVADO'}`);

        } catch (error) {
            console.error('❌ [SIMPLE] Error:', error);
            await interaction.editReply('❌ Error al reproducir la canción de prueba.');
        }
    },
};