const { AudioPlayerStatus } = require('@discordjs/voice');

/**
 * Utilidades centralizadas para el manejo del estado de música
 * Todas las verificaciones de estado deben usar estas funciones
 */

/**
 * Verifica si hay música activa en cualquier estado (reproduciendo, pausada, etc.)
 * @returns {boolean} True si hay música activa
 */
function hasActiveMusic() {
    const hasConnection = global.currentConnection && !global.currentConnection.destroyed;
    const hasPlayer = global.audioPlayer && (
        global.audioPlayer.state.status === AudioPlayerStatus.Playing ||
        global.audioPlayer.state.status === AudioPlayerStatus.Paused ||
        global.audioPlayer.state.status === AudioPlayerStatus.Buffering ||
        global.audioPlayer.state.status === AudioPlayerStatus.AutoPaused
    );
    const hasQueue = global.musicQueue && global.musicQueue.length > 0;
    const hasCurrent = global.currentSong !== null && global.currentSong !== undefined;
    
    return hasConnection || hasPlayer || hasQueue || hasCurrent;
}

/**
 * Verifica si hay música reproduciéndose actualmente
 * @returns {boolean} True si hay música reproduciéndose
 */
function isPlaying() {
    return global.audioPlayer && 
           global.audioPlayer.state.status === AudioPlayerStatus.Playing &&
           global.currentSong !== null;
}

/**
 * Verifica si la música está pausada
 * @returns {boolean} True si la música está pausada
 */
function isPaused() {
    return global.audioPlayer && 
           global.audioPlayer.state.status === AudioPlayerStatus.Paused &&
           global.currentSong !== null;
}

/**
 * Obtiene el estado actual del reproductor
 * @returns {string} Estado del reproductor
 */
function getPlayerStatus() {
    if (!global.audioPlayer) return 'No disponible';
    return global.audioPlayer.state.status;
}

/**
 * Obtiene información de la canción actual
 * @returns {Object|null} Información de la canción actual o null
 */
function getCurrentSong() {
    return global.currentSong || null;
}

/**
 * Obtiene el número de canciones en cola
 * @returns {number} Número de canciones en cola
 */
function getQueueLength() {
    return (global.musicQueue && global.musicQueue.length) || 0;
}

/**
 * Limpia completamente el estado de música
 */
function clearMusicState() {
    console.log('🧹 [MUSIC_STATE] Limpiando estado completo...');
    
    // Cancelar timer de inactividad
    if (typeof global.cancelInactivityTimer === 'function') {
        global.cancelInactivityTimer();
    }

    // Limpiar la cola
    global.musicQueue = [];
    
    // Detener el reproductor
    if (global.audioPlayer) {
        try {
            global.audioPlayer.stop();
        } catch (e) {
            console.log('⚠️ [MUSIC_STATE] AudioPlayer ya estaba detenido');
        }
        global.audioPlayer = null;
    }
    
    // Desconectar del canal de voz
    if (global.currentConnection) {
        try {
            global.currentConnection.destroy();
        } catch (e) {
            console.log('⚠️ [MUSIC_STATE] Conexión ya estaba destruida');
        }
        global.currentConnection = null;
    }
    
    // Limpiar referencias globales
    global.lastVoiceChannel = null;
    global.lastTextChannel = null;
    global.currentSong = null;
    
    console.log('✅ [MUSIC_STATE] Estado limpiado correctamente');
}

/**
 * Obtiene un resumen completo del estado actual
 * @returns {Object} Resumen del estado
 */
function getStateDebugInfo() {
    return {
        hasConnection: global.currentConnection && !global.currentConnection.destroyed,
        hasPlayer: !!global.audioPlayer,
        playerStatus: global.audioPlayer ? global.audioPlayer.state.status : 'No player',
        currentSong: global.currentSong ? global.currentSong.title : 'No song',
        queueLength: getQueueLength(),
        hasActiveMusic: hasActiveMusic(),
        isPlaying: isPlaying(),
        isPaused: isPaused()
    };
}

module.exports = {
    hasActiveMusic,
    isPlaying,
    isPaused,
    getPlayerStatus,
    getCurrentSong,
    getQueueLength,
    clearMusicState,
    getStateDebugInfo
};