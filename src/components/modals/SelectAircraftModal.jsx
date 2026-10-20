import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Search, X, Plane, Info } from 'lucide-react';

export default function SelectAircraftModal({ isOpen, onClose, onSelect }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Fallback seguro en caso de que db.aircrafts esté vacío al inicio
  const defaultAircrafts = [
    { id: '1', tailNumber: 'CC-BBA', model: '787-9', notes: 'Crew Rest Modificado' },
    { id: '2', tailNumber: 'CC-BER', model: 'A321', notes: 'Air Berlin' },
    { id: '3', tailNumber: 'CC-BHZ', model: 'A320', notes: 'A320-NEO, Nueva Cabina' },
  ];

  // Consulta reactiva a IndexedDB con fallback
  const dbAircrafts = useLiveQuery(async () => {
    if (!db.aircrafts) return defaultAircrafts;
    const list = await db.aircrafts.toArray();
    return list && list.length > 0 ? list : defaultAircrafts;
  }, []);

  const aircrafts = dbAircrafts || defaultAircrafts;

  if (!isOpen) return null;

  // Filtrado y ordenamiento alfabético por matrícula
  const filteredAircrafts = aircrafts
    .filter((ac) => {
      const query = searchTerm.toLowerCase();
      return (
        ac.tailNumber?.toLowerCase().includes(query) ||
        ac.model?.toLowerCase().includes(query) ||
        (ac.notes && ac.notes.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => (a.tailNumber || '').localeCompare(b.tailNumber || ''));

  const handleSelect = (aircraft) => {
    onSelect(aircraft);
    setSearchTerm('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3">
      <div className="bg-bgCard border border-borderCard w-full max-w-sm rounded-xl p-3.5 shadow-2xl space-y-2.5 animate-in fade-in zoom-in duration-150 text-textPrincipal">
        
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between border-b border-borderCard pb-2">
          <div className="flex items-center gap-1.5 text-cyberCyan">
            <Plane className="w-4 h-4" />
            <h3 className="text-[11px] font-black uppercase tracking-wider text-textPrincipal">
              Seleccionar Matrícula
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              onClose();
            }}
            className="text-textSub hover:text-textPrincipal p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-textSub" />
          <input
            type="text"
            autoFocus
            placeholder="Buscar matrícula, modelo o nota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bgInput border border-borderCard rounded-lg pl-8 pr-2.5 h-8 text-xs text-textPrincipal placeholder:text-textSub/50 focus:outline-none focus:border-cyberCyan/50"
          />
        </div>

        {/* Listado de Matrículas */}
        <div className="max-h-56 overflow-y-auto space-y-1 pr-0.5 custom-scrollbar">
          {filteredAircrafts.map((ac) => (
            <button
              key={ac.id || ac.tailNumber}
              type="button"
              onClick={() => handleSelect(ac)}
              className="w-full bg-bgInput hover:bg-cyberCyan/10 border border-borderCard hover:border-cyberCyan/50 rounded-lg p-2 flex items-center justify-between transition-all cursor-pointer text-left group"
            >
              <div className="space-y-0.5 w-full">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black font-mono text-cyberCyan group-hover:text-cyberCyan/80 tracking-wider">
                    {ac.tailNumber}
                  </span>
                  {ac.model && (
                    <span className="text-[9px] font-extrabold bg-cyberCyan/10 text-cyberCyan border border-cyberCyan/30 px-1.5 py-0.5 rounded font-mono">
                      {ac.model}
                    </span>
                  )}
                </div>
                {ac.notes && (
                  <div className="flex items-center gap-1 text-[10px] text-textSub italic">
                    <Info className="w-3 h-3 text-textSub shrink-0" />
                    <span className="truncate max-w-[220px]">{ac.notes}</span>
                  </div>
                )}
              </div>
            </button>
          ))}

          {filteredAircrafts.length === 0 && (
            <div className="text-center py-5 text-xs text-textSub italic">
              No se encontraron matrículas registradas.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}