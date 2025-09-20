const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('@distube/ytdl-core');
const YouTubeSearchAPI = require('youtube-search-api');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Reproduce música de YouTube')
        .addStringOption(option =>
            option.setName('cancion')
                .setDescription('Nombre de canción o URL de YouTube')
                .setRequired(true)),

    async execute(interaction) {
        const query = interaction.options.getString('cancion');
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return await interaction.reply('❌ Debes estar en un canal de voz!');
        }

        await interaction.deferReply();

        try {
            console.log(`🎵 Comando recibido: ${query}`);
            
            let videoUrl = query;

            // Si no es URL de YouTube, buscar
            if (!ytdl.validateURL(query)) {
                console.log('🔍 Buscando en YouTube...');
                const searchResults = await YouTubeSearchAPI.GetListByKeyword(query, false, 1);
                
                if (!searchResults.items || searchResults.items.length === 0) {
                    return await interaction.editReply('❌ No encontré nada.');
                }
                
                videoUrl = `https://www.youtube.com/watch?v=${searchResults.items[0].id}`;
                console.log(`✅ Encontrado: ${videoUrl}`);
            }

            // Validar URL
            if (!ytdl.validateURL(videoUrl)) {
                return await interaction.editReply('❌ URL no válida.');
            }

            console.log(`🎵 Obteniendo info del video...`);
            const videoInfo = await ytdl.getInfo(videoUrl);
            const videoTitle = videoInfo.videoDetails.title;

            console.log(`🎵 Conectando a canal de voz...`);
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            console.log(`🎵 Creando reproductor...`);
            const player = createAudioPlayer();
            
            const stream = ytdl(videoUrl, {
                filter: 'audioonly',
                quality: 'highestaudio'
            });
            
            const resource = createAudioResource(stream);

            console.log(`🎵 Iniciando reproducción...`);
            player.play(resource);
            connection.subscribe(player);

            player.on(AudioPlayerStatus.Playing, () => {
                console.log(`▶️ Reproduciendo: ${videoTitle}`);
            });

            player.on('error', error => {
                console.error('❌ Error reproductor:', error);
            });

            await interaction.editReply(`🎵 **Reproduciendo:** ${videoTitle}`);

        } catch (error) {
            console.error('❌ Error general:', error);
            await interaction.editReply('❌ Error al reproducir música.');
        }
    },
};