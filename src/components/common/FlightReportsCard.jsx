import React, { memo, useState } from 'react';
import { CheckCircle2, Circle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const getCategoryStyles = (category) => {
  switch (category) {
    case 'Solicitud PAX': return { cardBorder: 'border-cyberCyan/60', badge: 'bg-cyberCyan/10 text-cyberCyan border-cyberCyan/30' };
    case 'Quiebre PAX': return { cardBorder: 'border-cyberYellow/60', badge: 'bg-cyberYellow/10 text-cyberYellow border-cyberYellow/30' };
    case 'Atención Médica': return { cardBorder: 'border-red-500/60', badge: 'bg-red-500/10 text-red-400 border-red-500/30' };
    case 'Reporte Seguridad': return { cardBorder: 'border-emerald-500/60', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    case 'Reporte Operativo': return { cardBorder: 'border-cyberPurpleBorder', badge: 'bg-cyberPurple/10 text-cyberPurple border-cyberPurpleBorder' };
    case 'Quiebre Servicio':
    case 'Quiebre de Servicio': return { cardBorder: 'border-amber-500/60', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    default: return { cardBorder: 'border-borderCard', badge: 'bg-cyberCyan/10 text-cyberCyan border-cyberCyan/20' };
  }
};

function FlightReportsCard({ reports = [], onToggleComplete, onEditReport, onDeleteReport, defaultOpen = true }) {
  const [isExpanded, setIsExpanded] = useState(defaultOpen);

  if (!reports || reports.length === 0) return null;

  const completedCount = reports.filter(r => r.completed).length;
  const pendingCount = reports.length - completedCount;

  return (
    <div className="bg-bgCard border border-borderCard rounded-2xl shadow-sm overflow-hidden">
      {/* Header clickeable (ACORDEÓN) */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3.5 hover:bg-bgCardHeader/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-cyberCyan">
            Reportes, Notas y Solicitudes
          </h4>
          <span className="bg-cyberCyan/15 border border-cyberCyan/30 text-cyberCyan text-[10px] font-mono font-black px-2 py-0.5 rounded-full">
            {completedCount}/{reports.length}
          </span>
          {pendingCount > 0 && (
            <span className="bg-cyberYellow/15 border border-cyberYellow/30 text-cyberYellow text-[10px] font-mono font-black px-2 py-0.5 rounded-full">
              {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="text-textSub">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Contenido expandible */}
      {isExpanded && (
        <div className="px-3.5 pb-3.5 space-y-1.5 border-t border-borderCard/50 pt-2">
          {reports.map((report, idx) => {
            const reportTitle = report.titulo || report.category || 'Reporte Sin Título';
            const detailText =
              (report.pasajero ? `PAX: ${report.pasajero} (${report.asiento || 'S/A'}) — ` : '') +
              (report.observacion || report.atencionMedica?.accionesTC || 'Sin observación registrada');
            const { cardBorder, badge } = getCategoryStyles(report.category);
            const isCompleted = report.completed || false;

            return (
              <div
                key={report.id || idx}
                className={`flex items-center gap-2 bg-bgInput border ${cardBorder} px-3 py-2 rounded-xl text-xs transition-all group cursor-pointer shadow-sm ${
                  !isCompleted ? 'animate-pulse' : 'opacity-75'
                }`}
                onClick={() => onEditReport && onEditReport(report, idx)}
              >
                {/* Checklist */}
                {onToggleComplete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleComplete(idx);
                    }}
                    className="shrink-0 p-0.5 hover:scale-110 transition-transform"
                    title={isCompleted ? 'Marcar como pendiente' : 'Marcar como completado'}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-cyberGreen" />
                    ) : (
                      <Circle className="w-5 h-5 text-textSub group-hover:text-cyberYellow" />
                    )}
                  </button>
                )}

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-black uppercase truncate ${
                      isCompleted ? 'line-through text-textSub' : 'text-textPrincipal group-hover:text-cyberCyan'
                    }`}>
                      {reportTitle}
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 uppercase ${badge}`}>
                      {report.category || 'General'}
                    </span>
                  </div>
                  <p className={`text-[10px] font-medium mt-0.5 truncate ${
                    isCompleted ? 'text-textSub/50' : 'text-textSub'
                  }`}>
                    {detailText}
                  </p>
                </div>

                {/* Botón eliminar */}
                {onDeleteReport && (
                  <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onDeleteReport(idx)}
                      title="Eliminar reporte"
                      className="p-1 text-textSub hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default memo(FlightReportsCard);