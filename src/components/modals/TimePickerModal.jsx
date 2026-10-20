import React, { useState, useEffect, useRef } from 'react';
import { X, Clock } from 'lucide-react';

export default function TimePickerModal({ isOpen, title, initialValue, onClose, onSave }) {
  const [hours, setHours] = useState('09');
  const [minutes, setMinutes] = useState('00');

  const hoursRef = useRef(null);
  const minutesRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const isValidValue = initialValue && initialValue !== '--:--' && initialValue !== '--: --';
      const timeToUse = isValidValue ? initialValue : getCurrentTime();
      const [h, m] = timeToUse.split(':');
      
      setHours(h || '00');
      setMinutes(m || '00');

      // Auto-enfocar el campo de horas al abrir
      setTimeout(() => hoursRef.current?.focus(), 50);
    }
  }, [isOpen, initialValue]);

  const getCurrentTime = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  const handleHoursChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); // Solo números
    if (val.length > 2) val = val.slice(-2); // Limitar a 2 dígitos

    if (Number(val) > 23) val = '23';

    setHours(val);

    // Salto automático a minutos si se ingresan 2 dígitos
    if (val.length === 2) {
      minutesRef.current?.focus();
      minutesRef.current?.select();
    }
  };

  const handleMinutesChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); // Solo números
    if (val.length > 2) val = val.slice(-2); // Limitar a 2 dígitos

    if (Number(val) > 59) val = '59';

    setMinutes(val);
  };

  const handleBlurHours = () => {
    setHours((prev) => prev.padStart(2, '0'));
  };

  const handleBlurMinutes = () => {
    setMinutes((prev) => prev.padStart(2, '0'));
  };

  const handleSave = () => {
    const formattedH = hours.padStart(2, '0');
    const formattedM = minutes.padStart(2, '0');
    onSave(`${formattedH}:${formattedM}`);
  };

  const handleSetCurrentTime = () => {
    const [h, m] = getCurrentTime().split(':');
    setHours(h);
    setMinutes(m);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-bgCard border border-borderCard w-full max-w-xs rounded-2xl p-4 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-borderCard pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1 rounded-lg bg-cyberCyan/10 border border-cyberCyan/20">
              <Clock className="w-3.5 h-3.5 text-cyberCyan shrink-0" />
            </div>
            <h3 className="text-xs font-black text-textMain uppercase tracking-wider truncate">
              {title}
            </h3>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 text-textSub hover:text-textMain rounded-lg hover:bg-bgInput transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Entrada Textual Directa (Teclado Numérico) */}
        <div className="bg-bgInput border border-borderCard rounded-xl py-3 px-4 flex justify-center items-center gap-1 shadow-inner focus-within:border-cyberCyan/60 transition-colors">
          <input
            ref={hoursRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={hours}
            onFocus={(e) => e.target.select()}
            onChange={handleHoursChange}
            onBlur={handleBlurHours}
            placeholder="00"
            className="w-16 bg-transparent text-cyberYellow font-black text-3xl text-center focus:outline-none tracking-wider font-mono"
          />
          <span className="text-cyberYellow font-black text-3xl font-mono -mt-1">:</span>
          <input
            ref={minutesRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={minutes}
            onFocus={(e) => e.target.select()}
            onChange={handleMinutesChange}
            onBlur={handleBlurMinutes}
            placeholder="00"
            className="w-16 bg-transparent text-cyberYellow font-black text-3xl text-center focus:outline-none tracking-wider font-mono"
          />
        </div>

        {/* Botón Hora Actual */}
        <button
          type="button"
          onClick={handleSetCurrentTime}
          className="w-full bg-bgInput hover:border-cyberCyan/40 border border-borderCard text-textMain font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer active:scale-95 hover:bg-cyberCyan/5"
        >
          Usar Hora Actual
        </button>

        {/* Acciones */}
        <div className="border-t border-borderCard pt-3 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-bgInput hover:bg-bgCardHeader/50 text-textSub border border-borderCard font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer active:scale-95"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 bg-cyberPurple hover:brightness-110 border border-cyberPurpleBorder text-white font-bold py-2.5 rounded-xl text-xs shadow-lg transition-all cursor-pointer active:scale-95"
          >
            Guardar
          </button>
        </div>

      </div>
    </div>
  );
}