// src/components/flight-itinerary/CreateReportCard.jsx
import React, { useState, useCallback, memo } from 'react';
import {
  User,
  AlertTriangle,
  Stethoscope,
  Shield,
  FileText,
  Layers,
  MessageSquare,
  FilePlus2,
  Maximize2
} from 'lucide-react';
import { NewReportModal } from '../reports';
import ExpandedTextareaModal from '../common/ExpandedTextareaModal';

// Array de reportes FUERA del componente
const REPORT_TYPES = [
  { label: 'Solicitud PAX', icon: User, color: 'border-cyberCyan/40 text-cyberCyan hover:bg-cyberCyan/10 hover:border-cyberCyan' },
  { label: 'Quiebre PAX', icon: AlertTriangle, color: 'border-cyberYellow/40 text-cyberYellow hover:bg-cyberYellow/10 hover:border-cyberYellow' },
  { label: 'Atención Médica', icon: Stethoscope, color: 'border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500' },
  { label: 'Reporte Seguridad', icon: Shield, color: 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500' },
  { label: 'Reporte Operativo', icon: FileText, color: 'border-cyberPurpleBorder text-cyberPurple hover:bg-cyberPurple/10 hover:border-cyberPurple' },
  { label: 'Quiebre Servicio', icon: Layers, color: 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500' },
];

function CreateReportCard({ flightData, onUpdateFlight, onDeleteReport }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isExpandedModalOpen, setIsExpandedModalOpen] = useState(false);

  const handleOpenNewModal = useCallback((categoryLabel) => {
    setSelectedCategory(categoryLabel);
    setIsNewModalOpen(true);
  }, []);

  const handleCloseNewModal = useCallback(() => {
    setIsNewModalOpen(false);
  }, []);

  const handleSaveNewReport = useCallback((newReport) => {
    const existingReports = flightData?.reports || [];
    onUpdateFlight('reports', [...existingReports, newReport]);
  }, [flightData?.reports, onUpdateFlight]);

  const handleOpenExpandedModal = useCallback(() => {
    setIsExpandedModalOpen(true);
  }, []);

  const handleCloseExpandedModal = useCallback(() => {
    setIsExpandedModalOpen(false);
  }, []);

  const handleObservacionesChange = useCallback((e) => {
    onUpdateFlight('observacionesCabina', e.target.value);
  }, [onUpdateFlight]);

  const handleExpandedChange = useCallback((val) => {
    onUpdateFlight('observacionesCabina', val);
  }, [onUpdateFlight]);

  return (
    <>
      <div className="bg-bgCard border border-borderCard rounded-2xl p-3.5 space-y-4 shadow-sm transition-all">
        {/* Cabecera */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-cyberCyan/10 border border-cyberCyan/20">
            <FilePlus2 className="w-3.5 h-3.5 text-cyberCyan shrink-0" />
          </div>
          <h4 className="text-xs font-black uppercase tracking-wider text-textPrincipal truncate">
            Crear Nuevo Reporte
          </h4>
        </div>

        {/* Grilla de Botones */}
        <div className="grid grid-cols-3 gap-2">
          {REPORT_TYPES.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleOpenNewModal(item.label)}
                className={`relative flex items-center justify-between p-2.5 rounded-xl border bg-bgInput transition-all active:scale-95 group overflow-hidden ${item.color}`}
              >
                <span className="text-[11px] font-black leading-tight z-10 text-left uppercase tracking-tight">
                  {item.label}
                </span>
                <IconComponent className="w-8 h-8 opacity-15 absolute -right-1 -bottom-1 pointer-events-none group-hover:opacity-30 group-hover:scale-110 transition-all" />
              </button>
            );
          })}
        </div>

        {/* Observaciones del Vuelo */}
        <div className="space-y-2 pt-2 border-t border-borderCard">
          <div className="flex items-center justify-between text-cyberCyan font-bold text-xs uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Observaciones del Vuelo</span>
            </div>
            <button
              type="button"
              onClick={handleOpenExpandedModal}
              className="p-1 hover:bg-cyberCyan/10 rounded-lg text-textSub hover:text-cyberCyan transition-colors cursor-pointer"
              title="Expandir a pantalla completa"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <textarea
            rows={6}
            placeholder="Observaciones de cabina..."
            value={flightData?.observacionesCabina || ''}
            onChange={handleObservacionesChange}
            className="w-full bg-bgInput border border-borderCard rounded-xl p-2.5 text-xs text-textMain placeholder:text-textSub/50 focus:outline-none focus:border-cyberCyan/60 resize-none transition-colors"
          />
        </div>
      </div>

      {/* Modal de área de texto expandida */}
      <ExpandedTextareaModal
        isOpen={isExpandedModalOpen}
        onClose={handleCloseExpandedModal}
        title="OBSERVACIONES DEL VUELO"
        value={flightData?.observacionesCabina || ''}
        onChange={handleExpandedChange}
        maxLength={2000}
      />

      {/* Modal de Creación */}
      <NewReportModal
        isOpen={isNewModalOpen}
        initialCategory={selectedCategory}
        onClose={handleCloseNewModal}
        onSave={handleSaveNewReport}
      />
    </>
  );
}

export default memo(CreateReportCard);