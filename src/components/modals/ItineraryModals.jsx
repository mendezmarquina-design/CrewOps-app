import React from 'react';
import { Plane, X, Search, AlertTriangle } from 'lucide-react';
// Importamos TimePickerModal desde tu directorio de modales
import TimePickerModal from '../modals/TimePickerModal';

export { TimePickerModal };

export function TailNumberModal({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  aircrafts,
  onSelectTail
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-bgCard border border-borderCard w-full max-w-sm rounded-2xl p-4 space-y-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyberCyan font-extrabold text-xs uppercase tracking-wider">
            <Plane className="w-4 h-4" />
            <span>Seleccionar Matrícula</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-textSub hover:text-textMain p-1 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-bgInput border border-borderCard rounded-xl px-3 h-9 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-cyberCyan shrink-0" />
          <input
            type="text"
            placeholder="Buscar matrícula, modelo o notas..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent text-xs text-textMain w-full focus:outline-none placeholder:text-textSub"
            autoFocus
          />
        </div>

        <div className="space-y-1.5 max-h-[250px] overflow-y-auto scrollbar-none pr-1">
          {aircrafts.map((ac, idx) => (
            <div
              key={ac.id || ac.tailNumber || idx}
              onClick={() => onSelectTail(ac.tailNumber)}
              className="bg-bgInput/40 border border-borderCard rounded-xl p-2.5 cursor-pointer hover:border-cyberCyan/50 hover:bg-bgCardHeader transition-all space-y-0.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-cyberCyan font-extrabold text-xs font-mono">
                  {ac.tailNumber}
                </span>
                {ac.model && (
                  <span className="bg-cyberCyan/10 text-cyberCyan border border-cyberCyan/20 text-[9px] font-bold px-1.5 py-0.5 rounded-md font-mono">
                    {ac.model}
                  </span>
                )}
              </div>
              {ac.notes && (
                <p className="text-[10px] text-textSub italic flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-cyberCyan"></span>
                  {ac.notes}
                </p>
              )}
            </div>
          ))}

          {aircrafts.length === 0 && (
            <p className="text-center text-xs text-textSub italic py-3">
              No se encontraron matrículas.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function DeleteConfirmationModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-bgCard border border-rose-500/40 w-full max-w-xs rounded-2xl p-5 shadow-2xl space-y-4 text-center animate-in zoom-in-95">
        <div className="w-10 h-10 rounded-full bg-bgInput border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <AlertTriangle className="w-5 h-5" />
        </div>

        <div>
          <h3 className="text-xs font-black uppercase text-textMain tracking-wider">
            ¿Eliminar Vuelo?
          </h3>
          <p className="text-xs text-textSub mt-1 leading-relaxed">
            Esta acción borrará permanentemente este vuelo del itinerario.
          </p>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-bgInput hover:bg-bgCardHeader border border-borderCard text-textSub font-bold py-2 rounded-xl text-xs cursor-pointer transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-xl text-xs transition-all cursor-pointer shadow-xs uppercase tracking-wider"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}