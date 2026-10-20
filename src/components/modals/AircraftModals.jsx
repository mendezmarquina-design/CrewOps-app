import React from 'react';
import { Edit3, Trash2, AlertTriangle, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';

export function UpdateAircraftModal({ isOpen, aircraft, onClose, onConfirm }) {
  if (!isOpen || !aircraft) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-bgCard border border-cyberYellow/40 w-full max-w-xs rounded-2xl p-5 shadow-xl space-y-4 text-center text-textPrincipal animate-in zoom-in-95">
        <div className="w-11 h-11 rounded-full bg-bgInput border border-cyberYellow/30 flex items-center justify-center mx-auto text-cyberYellow">
          <Edit3 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xs font-extrabold uppercase text-textPrincipal tracking-wider">¿Actualizar Matrícula?</h3>
          <p className="text-xs text-textSub mt-1 leading-relaxed">
            Se guardarán los cambios para la aeronave <span className="text-cyberYellow font-mono font-bold">{aircraft.tailNumber}</span>.
          </p>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 bg-bgInput hover:bg-bgCardHeader border border-borderCard text-textSub hover:text-textPrincipal font-semibold py-2 rounded-xl text-xs cursor-pointer transition-colors">Cancelar</button>
          <button type="button" onClick={onConfirm} className="flex-1 bg-cyberYellow text-textInverseDark font-semibold py-2 rounded-xl text-xs transition-all cursor-pointer shadow-xs">Confirmar</button>
        </div>
      </div>
    </div>
  );
}

export function DeleteAircraftModal({ target, onClose, onConfirm }) {
  if (!target) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-bgCard border border-rose-500/30 w-full max-w-xs rounded-2xl p-5 shadow-xl space-y-4 text-center text-textPrincipal animate-in zoom-in-95">
        <div className="w-11 h-11 rounded-full bg-bgInput border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
          <Trash2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xs font-extrabold uppercase text-textPrincipal tracking-wider">¿Eliminar Matrícula?</h3>
          <p className="text-xs text-textSub mt-1">
            Vas a eliminar <span className="text-cyberCyan font-mono font-bold">{target.tailNumber}</span> ({target.model}).
          </p>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 bg-bgInput hover:bg-bgCardHeader border border-borderCard text-textSub hover:text-textPrincipal font-semibold py-2 rounded-xl text-xs cursor-pointer transition-colors">Cancelar</button>
          <button type="button" onClick={onConfirm} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold py-2 rounded-xl text-xs transition-all cursor-pointer shadow-xs">Eliminar</button>
        </div>
      </div>
    </div>
  );
}

export function ImportAnalysisModal({
  pendingImport,
  showReplaceConfirm,
  showNewList,
  setShowNewList,
  showExistingList,
  setShowExistingList,
  onExecuteImport,
  onShowReplaceConfirm,
  onCancel
}) {
  if (!pendingImport || showReplaceConfirm) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-bgCard border border-borderCard w-full max-w-xs rounded-2xl p-5 shadow-xl space-y-4 text-textPrincipal animate-in zoom-in-95">
        <div className="flex items-center gap-2 text-cyberYellow border-b border-borderCard pb-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-textPrincipal">Análisis de Importación</h3>
        </div>

        <div className="space-y-2 text-xs">
          <div className="bg-bgInput rounded-xl border border-borderCard overflow-hidden">
            <button type="button" onClick={() => setShowNewList(!showNewList)} className="w-full p-2.5 flex justify-between items-center cursor-pointer hover:bg-bgCardHeader transition-all">
              <span className="text-textSub font-medium">Matrículas nuevas:</span>
              <div className="flex items-center gap-1.5">
                <span className="text-cyberGreen font-bold font-mono">+{pendingImport.newItems.length}</span>
                {showNewList ? <ChevronUp className="w-3.5 h-3.5 text-textSub" /> : <ChevronDown className="w-3.5 h-3.5 text-textSub" />}
              </div>
            </button>
            {showNewList && (
              <div className="px-2.5 pb-2.5 max-h-32 overflow-y-auto space-y-1 border-t border-borderCard pt-2 custom-scrollbar">
                {pendingImport.newItems.length > 0 ? (
                  pendingImport.newItems.map((item) => (
                    <div key={item.tailNumber} className="flex justify-between text-[11px] font-mono">
                      <span className="text-cyberGreen font-bold">{item.tailNumber}</span>
                      <span className="text-textSub">({item.model})</span>
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] text-textSub italic">No hay nuevas matrículas.</div>
                )}
              </div>
            )}
          </div>

          <div className="bg-bgInput rounded-xl border border-borderCard overflow-hidden">
            <button type="button" onClick={() => setShowExistingList(!showExistingList)} className="w-full p-2.5 flex justify-between items-center cursor-pointer hover:bg-bgCardHeader transition-all">
              <span className="text-textSub font-medium">Matrículas a actualizar:</span>
              <div className="flex items-center gap-1.5">
                <span className="text-cyberYellow font-bold font-mono">{pendingImport.existingItems.length}</span>
                {showExistingList ? <ChevronUp className="w-3.5 h-3.5 text-textSub" /> : <ChevronDown className="w-3.5 h-3.5 text-textSub" />}
              </div>
            </button>
            {showExistingList && (
              <div className="px-2.5 pb-2.5 max-h-32 overflow-y-auto space-y-1 border-t border-borderCard pt-2 custom-scrollbar">
                {pendingImport.existingItems.length > 0 ? (
                  pendingImport.existingItems.map((item) => (
                    <div key={item.tailNumber} className="flex justify-between text-[11px] font-mono">
                      <span className="text-cyberYellow font-bold">{item.tailNumber}</span>
                      <span className="text-textSub">({item.model})</span>
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] text-textSub italic">No hay matrículas a actualizar.</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <button type="button" onClick={() => onExecuteImport(pendingImport.allData, 'merge')} className="w-full bg-cyberPurple hover:opacity-90 border border-cyberPurpleBorder text-textInverseLigth font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Mezclar y Actualizar</span>
          </button>
          <button type="button" onClick={onShowReplaceConfirm} className="w-full bg-bgInput hover:bg-bgCardHeader border border-rose-500/30 text-rose-400 font-semibold py-2.5 rounded-xl text-xs transition-all cursor-pointer">
            Reemplazar Todo
          </button>
          <button type="button" onClick={onCancel} className="w-full bg-bgInput hover:bg-bgCardHeader border border-borderCard text-textSub hover:text-textPrincipal font-semibold py-2 rounded-xl text-xs cursor-pointer transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReplaceConfirmModal({ isOpen, pendingImport, totalAircrafts, onClose, onConfirm }) {
  if (!isOpen || !pendingImport) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-bgCard border border-rose-500/40 w-full max-w-xs rounded-2xl p-5 shadow-xl space-y-4 text-center text-textPrincipal animate-in zoom-in-95">
        <div className="w-11 h-11 rounded-full bg-bgInput border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xs font-extrabold uppercase text-rose-400 tracking-wider">¿Reemplazar Todo el Listado?</h3>
          <p className="text-xs text-textSub mt-2 leading-relaxed">
            Se <span className="text-rose-400 font-bold">eliminarán todas</span> las matrículas actuales ({totalAircrafts}) y se cargarán las <span className="text-cyberCyan font-mono font-bold">{pendingImport.allData.length}</span> del archivo.
          </p>
          <p className="text-[10px] text-textSub/70 mt-1.5 italic">Esta acción es irreversible.</p>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 bg-bgInput hover:bg-bgCardHeader border border-borderCard text-textSub hover:text-textPrincipal font-semibold py-2.5 rounded-xl text-xs cursor-pointer transition-colors">Volver</button>
          <button type="button" onClick={() => onConfirm(pendingImport.allData, 'replace')} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-xs">Sí, Reemplazar</button>
        </div>
      </div>
    </div>
  );
}