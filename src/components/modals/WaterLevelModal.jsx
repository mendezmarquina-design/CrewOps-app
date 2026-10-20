import React, { useState, useEffect } from 'react';
import { Droplet, X, Minus, Plus, Check } from 'lucide-react';

export default function WaterLevelModal({ isOpen, initialData, onClose, onSave }) {
  const [inicio, setInicio] = useState(100);
  const [fin, setFin] = useState(100);

  useEffect(() => {
    if (isOpen) {
      setInicio(initialData?.waterLevelInicio ?? 100);
      setFin(initialData?.waterLevelFin ?? 100);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // Formatea 0% a "E", 100% a "F" y los demás como porcentaje
  const formatLevel = (val) => {
    if (val === 0) return 'E';
    if (val === 100) return 'F';
    return `${val}%`;
  };

  const stepValue = (currentVal, delta) => {
    const nextVal = Math.min(100, Math.max(0, currentVal + delta));
    return Math.round(nextVal * 10) / 10;
  };

  const handleSave = () => {
    onSave({ waterLevelInicio: inicio, waterLevelFin: fin });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm bg-bgCard border border-borderCard rounded-2xl p-5 shadow-2xl space-y-5">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-borderCard pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-cyberCyan/10 border border-cyberCyan/20">
              <Droplet className="w-4 h-4 text-cyberCyan" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-wider text-textPrincipal">
              Control Nivel de Agua
            </h4>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-textSub hover:text-textMain transition-colors p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sliders */}
        <div className="space-y-3.5">
          {/* Slider Inicio de Vuelo */}
          <div className="bg-bgInput border border-borderCard rounded-xl p-3.5 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
              <span className="text-textSub">Inicio de Vuelo</span>
              <span className="text-cyberYellow font-mono font-black text-sm">{formatLevel(inicio)}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setInicio(stepValue(inicio, -12.5))}
                className="w-8 h-8 rounded-lg bg-bgCard border border-borderCard flex items-center justify-center text-cyberCyan hover:bg-cyberCyan/10 active:scale-95 transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="range"
                min="0"
                max="100"
                step="12.5"
                value={inicio}
                onChange={(e) => setInicio(parseFloat(e.target.value))}
                className="w-full accent-cyberCyan h-1.5 bg-borderCard rounded-lg cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setInicio(stepValue(inicio, 12.5))}
                className="w-8 h-8 rounded-lg bg-bgCard border border-borderCard flex items-center justify-center text-cyberCyan hover:bg-cyberCyan/10 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Slider Fin de Vuelo */}
          <div className="bg-bgInput border border-borderCard rounded-xl p-3.5 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
              <span className="text-textSub">Fin de Vuelo</span>
              <span className="text-cyberYellow font-mono font-black text-sm">{formatLevel(fin)}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFin(stepValue(fin, -12.5))}
                className="w-8 h-8 rounded-lg bg-bgCard border border-borderCard flex items-center justify-center text-cyberCyan hover:bg-cyberCyan/10 active:scale-95 transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="range"
                min="0"
                max="100"
                step="12.5"
                value={fin}
                onChange={(e) => setFin(parseFloat(e.target.value))}
                className="w-full accent-cyberCyan h-1.5 bg-borderCard rounded-lg cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setFin(stepValue(fin, 12.5))}
                className="w-8 h-8 rounded-lg bg-bgCard border border-borderCard flex items-center justify-center text-cyberCyan hover:bg-cyberCyan/10 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 rounded-xl border border-borderCard bg-bgInput text-textSub hover:text-textMain font-bold text-xs transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="py-2.5 rounded-xl bg-cyberCyan hover:bg-cyberCyan/90 text-textInverseDark font-black text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            Guardar
          </button>
        </div>

      </div>
    </div>
  );
}