// src/utils/doorCloseAlarm.js
// ✅ Versión segura para navegador (localhost) Y Capacitor (APK Android)

// Importación LAZY de Capacitor - solo se carga si está disponible
let LocalNotifications = null;

const loadCapacitorNotifications = async () => {
  if (!LocalNotifications) {
    try {
      // Solo intentar cargar en entorno Capacitor
      if (typeof window !== 'undefined' && window.Capacitor) {
        const mod = await import('@capacitor/local-notifications');
        LocalNotifications = mod.LocalNotifications;
      }
    } catch (error) {
      console.warn('Capacitor LocalNotifications no disponible, usando modo navegador');
    }
  }
  return LocalNotifications;
};

// Genera un ID único basado en flightId + minutos antes
const getAlarmId = (flightId, minutesBefore) => {
  const numericId = parseInt(String(flightId).replace(/\D/g, '').slice(0, 6), 10);
  return (numericId || 100000) + (minutesBefore * 1000);
};

// Sonido de alarma (beep de 3 tonos estilo avión) - FUNCIONA EN NAVEGADOR
const playAlarmSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const playBeep = (startTime, frequency, duration) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.5, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    const now = audioContext.currentTime;
    playBeep(now, 880, 0.2);
    playBeep(now + 0.25, 880, 0.2);
    playBeep(now + 0.5, 1320, 0.4);
    setTimeout(() => {
      const now2 = audioContext.currentTime;
      playBeep(now2, 880, 0.2);
      playBeep(now2 + 0.25, 880, 0.2);
      playBeep(now2 + 0.5, 1320, 0.4);
    }, 1000);
  } catch (error) {
    console.error('Error al reproducir alarma:', error);
  }
};

// Vibración - FUNCIONA EN NAVEGADOR Y MÓVIL
const vibrateDevice = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200, 100, 200, 300, 500, 100, 500, 100, 500, 300, 200, 100, 200, 100, 200]);
  }
};

// Solicitar permisos - SEGURO EN NAVEGADOR Y CAPACITOR
export const requestNotificationPermissions = async () => {
  try {
    const LocalNotif = await loadCapacitorNotifications();
    if (LocalNotif) {
      const result = await LocalNotif.requestPermissions();
      return result.display === 'granted';
    }
    // En navegador, pedir permiso de Notification API
    if ('Notification' in window && Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      return result === 'granted';
    }
    return true;
  } catch (error) {
    console.error('Error solicitando permisos:', error);
    return false;
  }
};

// Programa UNA alarma específica - SEGURO EN NAVEGADOR Y CAPACITOR
export const scheduleDoorCloseAlarm = async (flightId, cierrePuertasTime, flightNumber, minutesBefore = 5) => {
  if (!cierrePuertasTime || cierrePuertasTime === '--:--' || !flightId) return null;
  
  try {
    const alarmId = getAlarmId(flightId, minutesBefore);
    const LocalNotif = await loadCapacitorNotifications();

    if (LocalNotif) {
      // Cancelar SOLO esta alarma específica
      await LocalNotif.cancel({ notifications: [{ id: alarmId }] });

      const [hours, minutes] = cierrePuertasTime.split(':').map(Number);
      const alarmTime = new Date();
      alarmTime.setHours(hours, minutes - minutesBefore, 0, 0);

      if (alarmTime.getTime() <= Date.now()) {
        console.log(`⏰ Alarma para ${flightNumber} (${minutesBefore} min) ya pasó`);
        return null;
      }

      const alertText = minutesBefore >= 10
        ? `Faltan ${minutesBefore} minutos para cierre de puertas`
        : `¡ÚLTIMA ALERTA! ${minutesBefore} minutos para cierre de puertas`;

      await LocalNotif.schedule({
        notifications: [{
          id: alarmId,
          title: `⚠️ Vuelo ${flightNumber}`,
          body: alertText,
          sound: 'default',
          schedule: { at: alarmTime, allowWhileIdle: true },
        }],
      });
      console.log(`✅ Alarma programada: ${flightNumber} - ${minutesBefore} min antes de ${cierrePuertasTime}`);
    } else {
      console.log(`🌐 Modo navegador: alarma ${minutesBefore}min para ${flightNumber} registrada (sin notificación nativa)`);
    }
    return alarmId;
  } catch (error) {
    console.error('Error programando alarma:', error);
    return null;
  }
};

// Programa MÚLTIPLES alarmas para un vuelo
export const scheduleMultipleAlarms = async (flightId, cierrePuertasTime, flightNumber, minutesList = [5]) => {
  const alarmIds = [];
  for (const minutes of minutesList) {
    const id = await scheduleDoorCloseAlarm(flightId, cierrePuertasTime, flightNumber, minutes);
    if (id) alarmIds.push(id);
  }
  return alarmIds;
};

// Dispara la alarma visual y sonora de pantalla completa - FUNCIONA EN NAVEGADOR
export const triggerImmediateAlarm = () => {
  playAlarmSound();
  vibrateDevice();
};

// Cancela TODAS las alarmas de un vuelo específico - SEGURO EN NAVEGADOR
export const cancelFlightAlarms = async (flightId, minutesList = [2, 5, 10, 15]) => {
  if (!flightId) return;
  try {
    const LocalNotif = await loadCapacitorNotifications();
    if (LocalNotif) {
      const alarmIds = minutesList.map(min => getAlarmId(flightId, min));
      const notifications = alarmIds.map(id => ({ id }));
      await LocalNotif.cancel({ notifications });
      console.log(`️ Alarmas canceladas para vuelo ${flightId}`);
    }
  } catch (error) {
    console.error('Error cancelando alarmas:', error);
  }
};

// Cancela todas las alarmas del sistema
export const cancelAllAlarms = async () => {
  try {
    const LocalNotif = await loadCapacitorNotifications();
    if (LocalNotif) {
      await LocalNotif.cancelAll();
      console.log('️ Todas las alarmas canceladas');
    }
  } catch (error) {
    console.error('Error cancelando todas las alarmas:', error);
  }
};