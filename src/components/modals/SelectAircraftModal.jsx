import React, { memo, useState, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { AIRCRAFTS_SEED } from '../../data/aircraftsSeed';
import { Search, X, Plane, Info } from 'lucide-react';

function SelectAircraftModal({ isOpen, onClose, onSelect }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Consulta reactiva a IndexedDB con fallback a AIRCRAFTS_SEED
  const dbAircrafts = useLiveQuery(async () => {
    try {
      if (!db.aircrafts) return AIRCRAFTS_SEED;
      const count = await db.aircrafts.count();
      if (count === 0) {
        // Si está vacía, insertar seed
        await db.aircrafts.bulkAdd(AIRCRAFTS_SEED);
      }
      const list = await db.aircrafts.toArray();
      return list && list.length > 0 ? list : AIRCRAFTS_SEED;
    } catch (err) {
      console.error('Error cargando matrículas:', err);
      return AIRCRAFTS_SEED;
    }
  }, []);

  // ✅ Fallback robusto
  const aircrafts = useMemo(() => {
    if (!dbAircrafts || dbAircrafts.length === 0) return AIRCRAFTS_SEED;
    return dbAircrafts;
  }, [dbAircrafts]);

  // Filtrado y ordenamiento memoizados
  const filteredAircrafts = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return aircrafts;
    
    return aircrafts
      .filter((ac) => {
        return (
          ac.tailNumber?.toLowerCase().includes(query) ||
          ac.model?.toLowerCase().includes(query) ||
          (ac.notes && ac.notes.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => (a.tailNumber || '').localeCompare(b.tailNumber || ''));
  }, [aircrafts, searchTerm]);

  const handleSelect = useCallback((aircraft) => {
    onSelect(aircraft);
    setSearchTerm('');
    onClose();
  }, [onSelect, onClose]);

  const handleClose = useCallback(() => {
    setSearchTerm('');
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3">
      <div className="bg-bgCard border border-borderCard w-full max-w-sm rounded-xl p-3.5 shadow-2xl space-y-2.5 animate-in fade-in zoom-in duration-150 text-textPrincipal">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-borderCard pb-2">
          <div className="flex items-center gap-1.5 text-cyberCyan">
            <Plane className="w-4 h-4" />
            <h3 className="text-[11px] font-black uppercase tracking-wider text-textPrincipal">
              Seleccionar Matrícula
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
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
          {filteredAircrafts.length > 0 ? (
            filteredAircrafts.map((ac, idx) => (
              <button
                key={ac.id || ac.tailNumber || idx}
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
            ))
          ) : (
            <div className="text-center py-5 space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-bgInput border border-borderCard flex items-center justify-center">
                <Plane className="w-5 h-5 text-textSub" />
              </div>
              <p className="text-xs text-textSub italic">
                {searchTerm 
                  ? `No se encontraron matrículas para "${searchTerm}"`
                  : 'No hay matrículas registradas'}
              </p>
            </div>
          )}
        </div>

        {/* Footer con contador */}
        <div className="pt-2 border-t border-borderCard flex items-center justify-between text-[10px] text-textSub">
          <span>{filteredAircrafts.length} matrícula{filteredAircrafts.length !== 1 ? 's' : ''}</span>
          <button
            type="button"
            onClick={handleClose}
            className="text-cyberCyan hover:text-cyberCyan/80 font-bold uppercase tracking-wider"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(SelectAircraftModal);