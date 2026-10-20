// src/utils/doorCloseAlarm.js
let LocalNotifications = null;

const loadCapacitorNotifications = async () => {
  if (!LocalNotifications) {
    try {
      // Solo cargar Capacitor si estamos en entorno móvil
      if (typeof window !== 'undefined' && window.Capacitor) {
        const mod = await import('@capacitor/local-notifications');
        LocalNotifications = mod.LocalNotifications;
        
        // ✅ NUEVO: Escuchar cuando el usuario hace clic en la notificación
        LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
          console.log('🔔 Click en notificación:', notification);
          window.dispatchEvent(new CustomEvent('alarmNotificationClick', {
            detail: { notification }
          }));
        });
      }
    } catch (error) {
      console.warn('Capacitor LocalNotifications no disponible, usando modo navegador');
    }
  }
  return LocalNotifications;
};

const getAlarmId = (flightId, minutesBefore) => {
  const numericId = parseInt(String(flightId).replace(/\D/g, '').slice(0, 6), 10);
  return (numericId || 100000) + (minutesBefore * 1000);
};

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

const vibrateDevice = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200, 100, 200, 300, 500, 100, 500, 100, 500, 300, 200, 100, 200, 100, 200]);
  }
};

export const requestNotificationPermissions = async () => {
  try {
    const LocalNotif = await loadCapacitorNotifications();
    if (LocalNotif) {
      const result = await LocalNotif.requestPermissions();
      return result.display === 'granted';
    }
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

export const scheduleDoorCloseAlarm = async (flightId, cierrePuertasTime, flightNumber, minutesBefore = 5) => {
  if (!cierrePuertasTime || cierrePuertasTime === '--:--' || !flightId) return null;
  
  try {
    const alarmId = getAlarmId(flightId, minutesBefore);
    const LocalNotif = await loadCapacitorNotifications();

    if (LocalNotif) {
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
          extra: { flightId, cierrePuertasTime, minutesBefore } // Datos para recuperar al hacer click
        }],
      });
      console.log(`✅ Alarma programada: ${flightNumber} - ${minutesBefore} min antes de ${cierrePuertasTime}`);
    } else {
      console.log(`🌐 Modo navegador: alarma ${minutesBefore}min para ${flightNumber} registrada`);
    }
    return alarmId;
  } catch (error) {
    console.error('Error programando alarma:', error);
    return null;
  }
};

export const scheduleMultipleAlarms = async (flightId, cierrePuertasTime, flightNumber, minutesList = [5]) => {
  const alarmIds = [];
  for (const minutes of minutesList) {
    const id = await scheduleDoorCloseAlarm(flightId, cierrePuertasTime, flightNumber, minutes);
    if (id) alarmIds.push(id);
  }
  return alarmIds;
};

export const triggerImmediateAlarm = () => {
  playAlarmSound();
  vibrateDevice();
};

export const cancelFlightAlarms = async (flightId, minutesList = [2, 5, 10, 15]) => {
  if (!flightId) return;
  try {
    const LocalNotif = await loadCapacitorNotifications();
    if (LocalNotif) {
      const alarmIds = minutesList.map(min => getAlarmId(flightId, min));
      const notifications = alarmIds.map(id => ({ id }));
      await LocalNotif.cancel({ notifications });
    }
  } catch (error) {
    console.error('Error cancelando alarmas:', error);
  }
};

export const cancelAllAlarms = async () => {
  try {
    const LocalNotif = await loadCapacitorNotifications();
    if (LocalNotif) {
      await LocalNotif.cancelAll();
    }
  } catch (error) {
    console.error('Error cancelando todas las alarmas:', error);
  }
};