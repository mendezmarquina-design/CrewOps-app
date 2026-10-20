// src/views/ReportManagementView.jsx
import React from 'react';
import { 
  Search, Calendar, Mail, QrCode, 
  Download, Camera, X, CheckCircle2, AlertCircle, FileText,
  Trash2, Inbox, Upload
} from 'lucide-react';
import BackButton from '../components/common/BackButton';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';

import { 
  EditReportModal,
  ImportReportModal, 
  QrCodeReportModal, 
  EmailReportModal
} from '../components/reports';

import { useReportManagement } from '../hooks/useReportManagement';

// Helper exacto traído de CreateReportCard para bordes y insignias (badges)
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

export default function ReportManagementView({ onBack }) {
  const {
    searchQuery,
    setSearchQuery,
    selectedDate,
    setSelectedDate,
    selectedCategory,
    setSelectedCategory,
    selectedReport,
    setSelectedReport,
    isEditModalOpen,
    setIsEditModalOpen,
    qrModalReport,
    setQrModalReport,
    showCameraScanner,
    manualJson,
    setManualJson,
    statusMessage,
    setStatusMessage,
    reportToDelete,
    setReportToDelete,
    mailReport,
    setMailReport,
    targetEmail,
    setTargetEmail,
    fileInputRef,
    filteredReports,
    handleOpenDetail,
    handleSaveChanges,
    onRequestDelete,
    confirmDeleteReport,
    processImportData,
    handleFileUpload,
    downloadReportJson,
    copyReportJson,
    startCamera,
    closeCameraModal,
    executeSendMail
  } = useReportManagement();

  return (
    <div className="max-w-md mx-auto space-y-4 pb-12 text-textMain font-sans transition-colors duration-200">
      
      {/* Botón Superior Volver */}
      <BackButton onClick={onBack} />

      {/* Alerta de Estado */}
      {statusMessage && (
        <div
          className={`p-3 rounded-2xl border text-xs font-medium flex items-center justify-between shadow-xs transition-all ${
            statusMessage.type === 'success'
              ? 'bg-cyberGreen/10 border-cyberGreen/40 text-cyberGreen'
              : 'bg-cyberCoral/10 border-cyberCoral/40 text-cyberCoral'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-textSub hover:text-textMain cursor-pointer p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TARJETA PRINCIPAL */}
      <div className="bg-bgCard border border-borderCard rounded-3xl p-5 space-y-4 shadow-sm transition-colors">
        
        {/* Header con Título + Botón Importar */}
        <div className="flex items-center justify-between border-b border-borderCard/60 pb-3">
          <div className="flex items-center gap-2 text-textPrincipal font-black text-sm tracking-wide uppercase">
            <FileText className="w-5 h-5 text-cyberCyan" />
            <span>Gestión de Reportes</span>
          </div>
          <button
            type="button"
            onClick={startCamera}
            className="bg-bgInput hover:bg-borderCard/40 border border-borderCard text-textMain px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <Upload className="w-3.5 h-3.5 text-cyberCyan" />
            <span>Importar</span>
          </button>
        </div>

        {/* CONTROLES Y FILTROS */}
        <div className="space-y-2.5">
          {/* Tipo de Reporte */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-textSub uppercase tracking-wider block">
              Tipo de Reporte
            </label>
            <div className="bg-bgInput border border-borderCard rounded-xl px-3 h-10 flex items-center">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-transparent text-xs text-textMain font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-bgCard text-textMain">Todos los Tipos</option>
                <option value="Solicitud PAX" className="bg-bgCard text-textMain">Solicitud PAX</option>
                <option value="Quiebre PAX" className="bg-bgCard text-textMain">Quiebre PAX</option>
                <option value="Atención Médica" className="bg-bgCard text-textMain">Atención Médica</option>
                <option value="Reporte Seguridad" className="bg-bgCard text-textMain">Reporte Seguridad</option>
                <option value="Reporte Operativo" className="bg-bgCard text-textMain">Reporte Operativo</option>
                <option value="Quiebre de Servicio" className="bg-bgCard text-textMain">Quiebre de Servicio</option>
              </select>
            </div>
          </div>

          {/* Grid Fecha + Buscador */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-textSub uppercase tracking-wider block">
                Fecha Vuelo
              </label>
              <div className="bg-bgInput border border-borderCard rounded-xl px-2.5 h-10 flex items-center">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-transparent text-xs text-textMain font-bold font-mono focus:outline-none cursor-pointer text-center"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-textSub uppercase tracking-wider block">
                Buscador
              </label>
              <div className="bg-bgInput border border-borderCard rounded-xl px-3 h-10 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-textSub/60 shrink-0" />
                <input
                  type="text"
                  placeholder="PAX, Vuelo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-textMain font-bold placeholder:text-textSub/40 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* LISTA DE REPORTES */}
        <div className="space-y-2.5 pt-1">
          {filteredReports.length === 0 ? (
            <div className="text-center py-8 space-y-2 bg-bgInput/40 rounded-2xl border border-dashed border-borderCard">
              <Inbox className="w-8 h-8 text-textSub/40 mx-auto" />
              <p className="text-xs text-textSub italic font-medium">
                No se encontraron reportes registrados.
              </p>
            </div>
          ) : (
            filteredReports.map((report) => {
              const displayTitle = report.titulo || report.category || 'Reporte Sin Título';
              const { cardBorder, badge } = getCategoryStyles(report.category);

              return (
                <div
                  key={report.internalId}
                  onClick={() => handleOpenDetail(report)}
                  className={`group bg-bgInput/40 hover:bg-bgInput/80 border ${cardBorder} rounded-2xl p-3.5 space-y-2.5 transition-all cursor-pointer`}
                >
                  {/* Fila Superior: Datos Vuelo + Pill de Categoría */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-textMain font-mono">
                      <span>{report.flightNumber || 'FLT'}</span>
                      <span className="text-cyberYellow font-extrabold">
                        {report.aircraft ? `(${report.aircraft})` : ''}
                      </span>
                    </div>

                    {/* Badge con los estilos idénticos a CreateReportCard */}
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 uppercase tracking-wide ${badge}`}>
                      {report.category || 'General'}
                    </span>
                  </div>

                  {/* Fila Central: Título y PAX */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="text-xs font-extrabold text-textMain uppercase tracking-wide truncate">
                        {displayTitle}
                      </div>
                      <div className="text-[11px] text-textSub truncate leading-snug">
                        {report.pasajero ? (
                          <span className="text-textMain font-medium">
                            PAX: {report.pasajero} ({report.asiento || 'S/A'}) —{' '}
                          </span>
                        ) : null}
                        {report.observacion || report.atencionMedica?.accionesTC || 'Sin detalles'}
                      </div>
                    </div>
                  </div>

                  {/* Fila Inferior: Fecha + Acciones */}
                  <div
                    className="flex items-center justify-between pt-2 border-t border-borderCard/40 text-[10px] text-textSub font-mono"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>{report.flightDate}</span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => downloadReportJson(report)}
                        title="Descargar JSON"
                        className="p-1.5 rounded-lg text-textSub hover:text-textMain hover:bg-borderCard/40 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setMailReport(report)}
                        title="Enviar por Correo"
                        className="p-1.5 rounded-lg text-textSub hover:text-textMain hover:bg-borderCard/40 transition-all cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setQrModalReport(report)}
                        title="Generar QR"
                        className="p-1.5 rounded-lg text-textSub hover:text-cyberCyan hover:bg-borderCard/40 transition-all cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => onRequestDelete(e, report)}
                        title="Eliminar Reporte"
                        className="p-1.5 rounded-lg text-textSub hover:text-cyberCoral hover:bg-cyberCoral/10 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* MODALES */}
      <ImportReportModal
        isOpen={showCameraScanner}
        onClose={closeCameraModal}
        fileInputRef={fileInputRef}
        onFileUpload={handleFileUpload}
        manualJson={manualJson}
        onManualJsonChange={setManualJson}
        onProcessJson={processImportData}
      />

      <QrCodeReportModal
        report={qrModalReport}
        onClose={() => setQrModalReport(null)}
        onCopyJson={copyReportJson}
      />

      <EmailReportModal
        report={mailReport}
        onClose={() => setMailReport(null)}
        targetEmail={targetEmail}
        onEmailChange={setTargetEmail}
        onSend={executeSendMail}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(reportToDelete)}
        onClose={() => setReportToDelete(null)}
        onConfirm={confirmDeleteReport}
        title="¿ELIMINAR REPORTE?"
        description="Esta acción eliminará de forma permanente el reporte del itinerario"
        itemName={reportToDelete ? `${reportToDelete.flightNumber || ''} (${reportToDelete.category || 'General'}).` : ''}
        iconType="warning"
      />

      <EditReportModal
        isOpen={isEditModalOpen}
        initialData={selectedReport}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedReport(null);
        }}
        onSave={handleSaveChanges}
        onDelete={(report) => onRequestDelete(null, report)}
      />

    </div>
  );
}