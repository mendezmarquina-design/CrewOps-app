// src/components/cards/CreateReportCard.jsx
import React, { useState, useCallback, memo } from 'react';
import {
  User,
  AlertTriangle,
  Stethoscope,
  Shield,
  FileText,
  Layers,
  MessageSquare,
  Trash2,
  Edit3,
  FilePlus2,
  Maximize2
} from 'lucide-react';
import { NewReportModal, EditReportModal } from '../reports';
import ExpandedTextareaModal from '../common/ExpandedTextareaModal';

// ✅ Array de reportes FUERA del componente (no se recrea en cada render)
const REPORT_TYPES = [
  { label: 'Solicitud PAX', icon: User, color: 'border-cyberCyan/40 text-cyberCyan hover:bg-cyberCyan/10 hover:border-cyberCyan' },
  { label: 'Quiebre PAX', icon: AlertTriangle, color: 'border-cyberYellow/40 text-cyberYellow hover:bg-cyberYellow/10 hover:border-cyberYellow' },
  { label: 'Atención Médica', icon: Stethoscope, color: 'border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500' },
  { label: 'Reporte Seguridad', icon: Shield, color: 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500' },
  { label: 'Reporte Operativo', icon: FileText, color: 'border-cyberPurpleBorder text-cyberPurple hover:bg-cyberPurple/10 hover:border-cyberPurple' },
  { label: 'Quiebre Servicio', icon: Layers, color: 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500' },
];

// ✅ Función pura FUERA del componente (no se recrea en cada render)
const getCategoryStyles = (category) => {
  switch (category) {
    case 'Solicitud PAX':
      return {
        cardBorder: 'border-cyberCyan/60 hover:border-cyberCyan',
        badge: 'bg-cyberCyan/10 text-cyberCyan border-cyberCyan/30'
      };
    case 'Quiebre PAX':
      return {
        cardBorder: 'border-cyberYellow/60 hover:border-cyberYellow',
        badge: 'bg-cyberYellow/10 text-cyberYellow border-cyberYellow/30'
      };
    case 'Atención Médica':
      return {
        cardBorder: 'border-red-500/60 hover:border-red-500',
        badge: 'bg-red-500/10 text-red-400 border-red-500/30'
      };
    case 'Reporte Seguridad':
      return {
        cardBorder: 'border-emerald-500/60 hover:border-emerald-500',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      };
    case 'Reporte Operativo':
      return {
        cardBorder: 'border-cyberPurpleBorder hover:border-cyberPurple',
        badge: 'bg-cyberPurple/10 text-cyberPurple border-cyberPurpleBorder'
      };
    case 'Quiebre Servicio':
    case 'Quiebre de Servicio':
      return {
        cardBorder: 'border-amber-500/60 hover:border-amber-500',
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      };
    default:
      return {
        cardBorder: 'border-borderCard hover:border-cyberCyan/50',
        badge: 'bg-cyberCyan/10 text-cyberCyan border-cyberCyan/20'
      };
  }
};

// ✅ Subcomponente memoizado para cada item de reporte adjunto
const ReportListItem = memo(function ReportListItem({ report, index, onEdit, onDelete }) {
  const reportTitle = report.titulo || report.category || 'Reporte Sin Título';
  const detailText =
    (report.pasajero ? `PAX: ${report.pasajero} (${report.asiento || 'S/A'}) — ` : '') +
    (report.observacion || report.atencionMedica?.accionesTC || 'Sin observación registrada');
  const { cardBorder, badge } = getCategoryStyles(report.category);

  return (
    <div
      className={`flex items-center justify-between gap-2 bg-bgInput border ${cardBorder} px-3 py-2 rounded-xl text-xs transition-colors group cursor-pointer shadow-sm`}
      onClick={() => onEdit(report, index)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-textPrincipal text-[11px] font-black uppercase truncate group-hover:text-cyberCyan transition-colors">
            {reportTitle}
          </span>
          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 uppercase ${badge}`}>
            {report.category || 'General'}
          </span>
        </div>
        <p className="text-textSub truncate text-[10px] font-medium mt-0.5">
          {detailText}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onEdit(report, index)}
          title="Editar reporte"
          className="p-1 text-textSub hover:text-cyberCyan hover:bg-cyberCyan/10 rounded-lg transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(index)}
          title="Eliminar reporte"
          className="p-1 text-textSub hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});

function CreateReportCard({ flightData, onUpdateFlight, onDeleteReport }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [isExpandedModalOpen, setIsExpandedModalOpen] = useState(false);

  // ✅ Handlers memoizados
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

  const handleOpenEditModal = useCallback((report, index) => {
    setEditingReport({
      ...report,
      flightNumber: flightData?.flightNumber || 'N/A',
      route: flightData?.route || 'N/A'
    });
    setEditingIndex(index);
  }, [flightData?.flightNumber, flightData?.route]);

  const handleSaveEditedReport = useCallback((updatedReport) => {
    setEditingIndex((currentIdx) => {
      if (currentIdx === null) return null;
      const currentReports = [...(flightData?.reports || [])];
      currentReports[currentIdx] = updatedReport;
      onUpdateFlight('reports', currentReports);
      return null;
    });
    setEditingReport(null);
  }, [flightData?.reports, onUpdateFlight]);

  const handleDeleteFromEditModal = useCallback(() => {
    setEditingIndex((currentIdx) => {
      if (currentIdx !== null && onDeleteReport) {
        onDeleteReport(currentIdx);
      }
      return null;
    });
    setEditingReport(null);
  }, [onDeleteReport]);

  const handleCloseEditModal = useCallback(() => {
    setEditingReport(null);
    setEditingIndex(null);
  }, []);

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

  const reportCount = flightData?.reports?.length || 0;

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

        {/* Grilla de Botones (usa REPORT_TYPES del módulo) */}
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

        {/* Lista de reportes adjuntos (con subcomponente memoizado) */}
        {reportCount > 0 && (
          <div className="space-y-2 pt-2 border-t border-borderCard">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-cyberCyan uppercase tracking-widest block">
                Reportes adjuntos
              </span>
              <span className="bg-cyberCyan/15 border border-cyberCyan/30 text-cyberCyan text-[10px] font-mono font-black px-2 py-0.5 rounded-full">
                {reportCount}
              </span>
            </div>
            <div className="space-y-1.5">
              {flightData.reports.map((report, idx) => (
                <ReportListItem
                  key={report.id || idx}
                  report={report}
                  index={idx}
                  onEdit={handleOpenEditModal}
                  onDelete={onDeleteReport}
                />
              ))}
            </div>
          </div>
        )}
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

      {/* Modal de Edición */}
      <EditReportModal
        isOpen={!!editingReport}
        initialData={editingReport}
        onClose={handleCloseEditModal}
        onSave={handleSaveEditedReport}
        onDelete={handleDeleteFromEditModal}
      />
    </>
  );
}

// ✅ Componente principal memoizado
export default memo(CreateReportCard);