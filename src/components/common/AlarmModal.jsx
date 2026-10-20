import React, { useState, useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { X, Bell, BellOff, Plus, Trash2, Clock, Volume2 } from 'lucide-react';
import {
  requestNotificationPermissions,
  scheduleMultipleAlarms,
  cancelFlightAlarms,
  triggerImmediateAlarm
} from '../../utils/doorCloseAlarm';

const AVAILABLE_MINUTES = [2, 5, 10, 15, 20, 30];

function AlarmModal({ isOpen, flight, cierrePuertasTime, onClose }) {
  const [alarmEnabled, setAlarmEnabled] = useState(() => {
    return localStorage.getItem('doorCloseAlarm') === 'true';
  });
  const [alarmMinutes, setAlarmMinutes] = useState(() => {
    const saved = localStorage.getItem('alarmMinutesList');
    return saved ? JSON.parse(saved) : [5, 15];
  });

  useEffect(() => {
    if (isOpen && alarmEnabled) requestNotificationPermissions();
  }, [isOpen, alarmEnabled]);

  useEffect(() => {
    if (!isOpen || !flight?.id) return;
    if (!alarmEnabled || !cierrePuertasTime || cierrePuertasTime === '--:--') {
      cancelFlightAlarms(flight.id, AVAILABLE_MINUTES);
      return;
    }
    scheduleMultipleAlarms(flight.id, cierrePuertasTime, flight?.flightNumber || 'LA---', alarmMinutes);
  }, [isOpen, alarmEnabled, alarmMinutes, cierrePuertasTime, flight?.id, flight?.flightNumber]);

  const handleToggleAlarm = useCallback(() => {
    const newValue = !alarmEnabled;
    setAlarmEnabled(newValue);
    localStorage.setItem('doorCloseAlarm', newValue);
    if (newValue) requestNotificationPermissions();
    else cancelFlightAlarms(flight?.id, AVAILABLE_MINUTES);
  }, [alarmEnabled, flight?.id]);

  const handleAddMinute = useCallback((minute) => {
    if (!alarmMinutes.includes(minute)) {
      const newMinutes = [...alarmMinutes, minute].sort((a, b) => a - b);
      setAlarmMinutes(newMinutes);
      localStorage.setItem('alarmMinutesList', JSON.stringify(newMinutes));
    }
  }, [alarmMinutes]);

  const handleRemoveMinute = useCallback((minute) => {
    const newMinutes = alarmMinutes.filter(m => m !== minute);
    setAlarmMinutes(newMinutes);
    localStorage.setItem('alarmMinutesList', JSON.stringify(newMinutes));
  }, [alarmMinutes]);

  const handleTestAlarm = useCallback(() => triggerImmediateAlarm(), []);

  if (!isOpen) return null;

  // ✅ createPortal renderiza el modal DIRECTAMENTE en el body (fuera de cualquier z-index padre)
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-bgCard border border-borderCard rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-bgInput border-b border-borderCard p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyberYellow/10 border border-cyberYellow/30">
              {alarmEnabled ? <Bell className="w-4 h-4 text-cyberYellow" /> : <BellOff className="w-4 h-4 text-textSub" />}
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-textPrincipal">Alarmas de Vuelo</h3>
              <p className="text-[10px] text-textSub font-mono">{flight?.flightNumber || 'LA---'} • {cierrePuertasTime || '--:--'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg bg-bgCard hover:bg-bgCardHeader text-textSub hover:text-textMain transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between bg-bgInput border border-borderCard rounded-xl p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyberCyan" />
              <span className="text-xs font-bold text-textMain">Alarmas activas</span>
            </div>
            <button type="button" onClick={handleToggleAlarm} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${alarmEnabled ? 'bg-cyberYellow' : 'bg-bgCardHeader'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${alarmEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {alarmEnabled && (
            <>
              <div>
                <span className="text-[10px] font-bold text-textSub uppercase block mb-2">Alarmas programadas:</span>
                <div className="space-y-1.5">
                  {alarmMinutes.map(min => (
                    <div key={min} className="flex items-center justify-between bg-cyberYellow/10 border border-cyberYellow/30 rounded-lg px-3 py-2">
                      <span className="text-xs font-mono font-black text-cyberYellow">{min} minutos antes</span>
                      <button type="button" onClick={() => handleRemoveMinute(min)} className="text-cyberYellow hover:text-red-400 transition-colors cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {alarmMinutes.length === 0 && <p className="text-[10px] text-textSub italic text-center py-2">Sin alarmas configuradas</p>}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-textSub uppercase block mb-2">Agregar alarma:</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {AVAILABLE_MINUTES.filter(m => !alarmMinutes.includes(m)).map(min => (
                    <button key={min} type="button" onClick={() => handleAddMinute(min)} className="flex items-center justify-center gap-1 bg-bgInput border border-borderCard hover:border-cyberCyan/50 rounded-lg px-2 py-1.5 transition-all cursor-pointer">
                      <Plus className="w-3 h-3 text-cyberCyan" />
                      <span className="text-xs font-mono font-bold text-textMain">{min} min</span>
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" onClick={handleTestAlarm} className="w-full bg-bgInput hover:bg-bgCardHeader border border-borderCard text-textSub hover:text-cyberYellow text-xs font-bold py-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2">
                <Volume2 className="w-3.5 h-3.5" />
                Probar sonido de alarma
              </button>
            </>
          )}
        </div>

        <div className="bg-bgInput border-t border-borderCard p-3">
          <button type="button" onClick={onClose} className="w-full bg-cyberCyan/20 hover:bg-cyberCyan/30 border border-cyberCyan/40 text-textMain font-bold text-xs py-2.5 rounded-lg transition-all cursor-pointer">
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default memo(AlarmModal);