// src/components/ReportModals.jsx
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Camera, Upload, Download, Copy, Mail, Send,
  X, PlusCircle, CheckCircle, Stethoscope,
  Trash2, Edit3, ShieldAlert, ChevronDown, ChevronUp, Plus, CheckCircle2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { encodeToQR, decodeFromQR } from '../../utils/qrEngine';
import { useQrScanner } from '../../hooks/useQrScanner';
import { sanitizeReport, DEFAULT_MEDICAL_DATA } from '../../utils/reportSanitizer';

/* ========================================================
   COMPONENTES AUXILIARES PARA FORMULARIOS DEDICADOS
   ======================================================== */
function ReportFormFields({ formData, setFormData }) {
  const [openSec1, setOpenSec1] = useState(true);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMedicaChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      atencionMedica: {
        ...(prev.atencionMedica || DEFAULT_MEDICAL_DATA),
        [field]: value
      }
    }));
  };

  const handleAddKit = () => {
    const currentKits = formData.atencionMedica?.kits || [];
    handleMedicaChange('kits', [
      ...currentKits,
      {
        id: Date.now(),
        tipoKit: 'EMK',
        estadoFinal: 'Operativo',
        insumos: '',
        selloRetirado: 'Verde',
        selloColocado: 'Amarillo',
        numSelloRetirado: '',
        numSelloColocado: ''
      }
    ]);
  };

  const handleUpdateKit = (id, field, value) => {
    const currentKits = formData.atencionMedica?.kits || [];
    handleMedicaChange(
      'kits',
      currentKits.map((k) => (k.id === id ? { ...k, [field]: value } : k))
    );
  };

  const handleRemoveKit = (id) => {
    const currentKits = formData.atencionMedica?.kits || [];
    handleMedicaChange('kits', currentKits.filter((k) => k.id !== id));
  };

  const am = formData.atencionMedica || DEFAULT_MEDICAL_DATA;

  return (
    <div className="space-y-3.5">
      {/* CATEGORÍA */}
      <div>
        <label className="text-[10px] font-extrabold text-textSub uppercase tracking-wider block mb-1">
          Categoría
        </label>
        <select
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
          className="w-full bg-bgInput border border-cyberCyan/40 text-cyberCyan font-bold text-xs rounded-xl p-2.5 focus:outline-none focus:border-cyberCyan cursor-pointer"
        >
          <option value="Solicitud PAX">Solicitud PAX</option>
          <option value="Quiebre PAX">Quiebre PAX</option>
          <option value="Atención Médica">Atención Médica</option>
          <option value="Reporte Seguridad">Reporte Seguridad</option>
          <option value="Reporte Operativo">Reporte Operativo</option>
          <option value="Quiebre de Servicio">Quiebre de Servicio</option>
        </select>
      </div>

      {/* TÍTULO */}
      <div>
        <label className="text-[10px] font-extrabold text-textSub uppercase tracking-wider block mb-1">
          Título / Asunto *
        </label>
        <input
          type="text"
          required
          value={formData.titulo || ''}
          onChange={(e) => handleChange('titulo', e.target.value)}
          placeholder="Ej: Cambio de asiento / Molestia..."
          className="w-full bg-bgInput border border-borderCard rounded-xl p-2.5 text-xs text-textMain focus:outline-none focus:border-cyberCyan"
        />
      </div>

      {/* DATOS ESTÁNDAR: PASAJERO Y ASIENTO */}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label className="text-[10px] font-extrabold text-textSub uppercase tracking-wider block mb-1">
            Pasajero (Opcional)
          </label>
          <input
            type="text"
            value={formData.pasajero || ''}
            onChange={(e) => handleChange('pasajero', e.target.value)}
            placeholder="Nombre del PAX"
            className="w-full bg-bgInput border border-borderCard rounded-xl p-2.5 text-xs text-textMain focus:outline-none focus:border-cyberCyan"
          />
        </div>
        <div>
          <label className="text-[10px] font-extrabold text-textSub uppercase tracking-wider block mb-1">
            Asiento
          </label>
          <input
            type="text"
            value={formData.asiento || ''}
            onChange={(e) => handleChange('asiento', e.target.value)}
            placeholder="12A"
            className="w-full bg-bgInput border border-borderCard rounded-xl p-2.5 text-xs font-mono text-textMain focus:outline-none focus:border-cyberCyan"
          />
        </div>
      </div>

      {/* CUS CONDICIONAL (SÓLO QUIEBRE PAX) */}
      {formData.category === 'Quiebre PAX' && (
        <div className="bg-bgInput/80 border border-cyberCoral/40 rounded-xl p-3 space-y-2.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={Boolean(formData.realizaCus)}
              onChange={(e) => handleChange('realizaCus', e.target.checked)}
              className="w-4 h-4 rounded border-cyberCoral text-cyberCoral focus:ring-0 cursor-pointer accent-cyberCoral"
            />
            <span className="text-xs font-black text-cyberCoral uppercase tracking-wide flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> Realiza Reporte CUS
            </span>
          </label>
          {formData.realizaCus && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleChange('cusTipo', 'Informativo')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  (formData.cusTipo || 'Informativo') === 'Informativo'
                    ? 'bg-cyberCyan text-black border border-cyberCyan shadow-sm'
                    : 'bg-bgCard text-textSub border border-borderCard'
                }`}
              >
                Informativo
              </button>
              <button
                type="button"
                onClick={() => handleChange('cusTipo', 'Reclamo')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  formData.cusTipo === 'Reclamo'
                    ? 'bg-cyberCoral text-black border border-cyberCoral shadow-sm'
                    : 'bg-bgCard text-textSub border border-borderCard'
                }`}
              >
                Reclamo
              </button>
            </div>
          )}
        </div>
      )}

      {/* CAMPOS ESPECÍFICOS DE ATENCIÓN MÉDICA */}
      {formData.category === 'Atención Médica' && (
        <div className="space-y-3">
          {/* SECCIÓN 1: EVALUACIÓN MÉDICA DEL PASAJERO */}
          <div className="border border-cyberCoral/50 rounded-xl overflow-hidden bg-bgInput/40">
            <button
              type="button"
              onClick={() => setOpenSec1(!openSec1)}
              className="w-full p-2.5 bg-cyberCoral/10 text-cyberCoral text-xs font-black uppercase tracking-wider flex items-center justify-between border-b border-cyberCoral/20 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4" /> Datos personales y evaluación PAX
              </span>
              {openSec1 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {openSec1 && (
              <div className="p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="ID / Rut / Pasaporte"
                    value={am.paxId || ''}
                    onChange={(e) => handleMedicaChange('paxId', e.target.value)}
                    className="bg-bgCard border border-borderCard text-xs text-textMain rounded-xl px-3 h-9 focus:border-cyberCyan"
                  />
                  <input
                    type="text"
                    placeholder="Teléfono Contacto"
                    value={am.paxPhone || ''}
                    onChange={(e) => handleMedicaChange('paxPhone', e.target.value)}
                    className="bg-bgCard border border-borderCard text-xs text-textMain rounded-xl px-3 h-9 focus:border-cyberCyan"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Email"
                  value={am.paxEmail || ''}
                  onChange={(e) => handleMedicaChange('paxEmail', e.target.value)}
                  className="w-full bg-bgCard border border-borderCard text-xs text-textMain rounded-xl px-3 h-9 focus:border-cyberCyan"
                />
                <input
                  type="text"
                  placeholder="Acompañante"
                  value={am.paxAcompanante || ''}
                  onChange={(e) => handleMedicaChange('paxAcompanante', e.target.value)}
                  className="w-full bg-bgCard border border-borderCard text-xs text-textMain rounded-xl px-3 h-9 focus:border-cyberCyan"
                />
                <input
                  type="text"
                  placeholder="Síntomas..."
                  value={am.sintomas || ''}
                  onChange={(e) => handleMedicaChange('sintomas', e.target.value)}
                  className="w-full bg-bgCard border border-borderCard text-xs text-textMain rounded-xl px-3 h-9 focus:border-cyberCyan"
                />
                <input
                  type="text"
                  placeholder="Signos Vitales..."
                  value={am.signosVitales || ''}
                  onChange={(e) => handleMedicaChange('signosVitales', e.target.value)}
                  className="w-full bg-bgCard border border-borderCard text-xs text-textMain rounded-xl px-3 h-9 focus:border-cyberCyan"
                />
                <input
                  type="text"
                  placeholder="Enfermedades Base..."
                  value={am.enfermedadesBase || ''}
                  onChange={(e) => handleMedicaChange('enfermedadesBase', e.target.value)}
                  className="w-full bg-bgCard border border-borderCard text-xs text-textMain rounded-xl px-3 h-9 focus:border-cyberCyan"
                />
              </div>
            )}
          </div>

          {/* SWITCH MÉDICO / PROFESIONAL DE LA SALUD */}
          <div className="bg-bgInput/80 border border-cyberGreen/30 rounded-xl p-3 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(am.tieneAtencionMedica)}
                onChange={(e) => handleMedicaChange('tieneAtencionMedica', e.target.checked)}
                className="w-4 h-4 rounded border-cyberGreen text-cyberGreen accent-cyberGreen cursor-pointer"
              />
              <span className="text-[11px] font-black text-cyberGreen uppercase tracking-wide">
                ¿Existe atención por médico/profesional?
              </span>
            </label>
            {am.tieneAtencionMedica && (
              <div className="space-y-2 pt-2 border-t border-cyberGreen/20">
                <span className="text-[9px] font-black text-cyberGreen uppercase tracking-widest block">
                  Datos del Médico / Profesional
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nombre Dr."
                    value={am.medicoNombre || ''}
                    onChange={(e) => handleMedicaChange('medicoNombre', e.target.value)}
                    className="bg-bgCard border border-borderCard text-xs text-textMain rounded-xl px-3 h-9"
                  />
                  <input
                    type="text"
                    placeholder="Apellido Dr."
                    value={am.medicoApellido || ''}
                    onChange={(e) => handleMedicaChange('medicoApellido', e.target.value)}
                    className="bg-bgCard border border-borderCard text-xs text-textMain rounded-xl px-3 h-9"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="ASIENTO"
                    value={am.medicoAsiento || ''}
                    onChange={(e) => handleMedicaChange('medicoAsiento', e.target.value)}
                    className="bg-bgCard border border-borderCard text-xs font-mono text-textMain rounded-xl px-3 h-9"
                  />
                  <input
                    type="text"
                    placeholder="Profesión"
                    value={am.medicoProfesion || ''}
                    onChange={(e) => handleMedicaChange('medicoProfesion', e.target.value)}
                    className="bg-bgCard border border-borderCard text-xs text-textMain rounded-xl px-3 h-9"
                  />
                  <input
                    type="text"
                    placeholder="N° Reg. Médico"
                    value={am.medicoReg || ''}
                    onChange={(e) => handleMedicaChange('medicoReg', e.target.value)}
                    className="bg-bgCard border border-borderCard text-xs text-textMain rounded-xl px-3 h-9"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Diagnóstico"
                  value={am.medicoDiagnostico || ''}
                  onChange={(e) => handleMedicaChange('medicoDiagnostico', e.target.value)}
                  className="w-full bg-bgCard border border-borderCard text-xs text-textMain rounded-xl px-3 h-9"
                />
                <input
                  type="text"
                  placeholder="Tratamiento"
                  value={am.medicoTratamiento || ''}
                  onChange={(e) => handleMedicaChange('medicoTratamiento', e.target.value)}
                  className="w-full bg-bgCard border border-borderCard text-xs text-textMain rounded-xl px-3 h-9"
                />
              </div>
            )}
          </div>

          {/* SWITCH BOTIQUÍN / KITS */}
          <div className="bg-bgInput/80 border border-cyberYellow/30 rounded-xl p-3 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(am.abrioBotiquin)}
                onChange={(e) => handleMedicaChange('abrioBotiquin', e.target.checked)}
                className="w-4 h-4 rounded border-cyberYellow text-cyberYellow accent-cyberYellow cursor-pointer"
              />
              <span className="text-[11px] font-black text-cyberYellow uppercase tracking-wide">
                ¿Se abrió algún botiquín de emergencia?
              </span>
            </label>
            {am.abrioBotiquin && (
              <div className="space-y-3 pt-2 border-t border-cyberYellow/20">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-cyberYellow uppercase">
                    Kits / Botiquines Utilizados
                  </span>
                  <button
                    type="button"
                    onClick={handleAddKit}
                    className="bg-cyberYellow text-black font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 hover:brightness-110 active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Kit
                  </button>
                </div>
                {(am.kits || []).map((kit) => (
                  <div key={kit.id} className="bg-bgCard border border-borderCard/80 rounded-xl p-3 space-y-2 relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveKit(kit.id)}
                      className="absolute top-2 right-2 text-cyberCoral hover:text-red-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-2 gap-2 pr-6">
                      <div>
                        <label className="text-[8px] font-bold text-textSub uppercase block">Tipo Kit</label>
                        <select
                          value={kit.tipoKit}
                          onChange={(e) => handleUpdateKit(kit.id, 'tipoKit', e.target.value)}
                          className="w-full bg-bgInput border border-borderCard text-cyberYellow text-xs rounded-lg h-8 font-bold px-2"
                        >
                          <option value="EMK">EMK</option>
                          <option value="First Aid Kit">First Aid Kit</option>
                          <option value="UPK">UPK</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[8px] font-bold text-textSub uppercase block">Estado Final</label>
                        <select
                          value={kit.estadoFinal}
                          onChange={(e) => handleUpdateKit(kit.id, 'estadoFinal', e.target.value)}
                          className="w-full bg-bgInput border border-borderCard text-xs text-textMain rounded-lg h-8 px-2 font-bold"
                        >
                          <option value="Operativo">Operativo</option>
                          <option value="Inoperativo">Inoperativo</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[8px] font-bold text-textSub uppercase block">Insumos Utilizados</label>
                      <input
                        type="text"
                        placeholder="Ej. Garrote, tijeras..."
                        value={kit.insumos || ''}
                        onChange={(e) => handleUpdateKit(kit.id, 'insumos', e.target.value)}
                        className="w-full bg-bgInput border border-borderCard text-xs text-textMain rounded-lg px-2.5 h-8"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] font-bold text-textSub uppercase block">Sello Retirado</label>
                        <select
                          value={kit.selloRetirado}
                          onChange={(e) => handleUpdateKit(kit.id, 'selloRetirado', e.target.value)}
                          className="w-full bg-bgInput border border-borderCard text-xs text-cyberGreen font-bold rounded-lg h-8 px-2"
                        >
                          <option value="Verde">Verde</option>
                          <option value="Amarillo">Amarillo</option>
                          <option value="Rojo">Rojo</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[8px] font-bold text-textSub uppercase block">Sello Colocado</label>
                        <select
                          value={kit.selloColocado}
                          onChange={(e) => handleUpdateKit(kit.id, 'selloColocado', e.target.value)}
                          className="w-full bg-bgInput border border-borderCard text-xs text-cyberYellow font-bold rounded-lg h-8 px-2"
                        >
                          <option value="Verde">Verde</option>
                          <option value="Amarillo">Amarillo</option>
                          <option value="Rojo">Rojo</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="N° Sello Retirado"
                        value={kit.numSelloRetirado || ''}
                        onChange={(e) => handleUpdateKit(kit.id, 'numSelloRetirado', e.target.value)}
                        className="bg-bgInput border border-borderCard text-xs font-mono text-textMain rounded-lg px-2.5 h-8"
                      />
                      <input
                        type="text"
                        placeholder="N° Sello Colocado"
                        value={kit.numSelloColocado || ''}
                        onChange={(e) => handleUpdateKit(kit.id, 'numSelloColocado', e.target.value)}
                        className="bg-bgInput border border-borderCard text-xs font-mono text-textMain rounded-lg px-2.5 h-8"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* OBSERVACIONES (SIEMPRE VISIBLE AL FINAL) */}
      <div>
        <label className="text-[10px] font-extrabold text-textSub uppercase tracking-wider block mb-1">
          Observaciones
        </label>
        <textarea
          rows={3}
          value={formData.observacion || ''}
          onChange={(e) => handleChange('observacion', e.target.value)}
          placeholder="Detalle de la situación o acciones tomadas por la TC..."
          className="w-full bg-bgInput border border-borderCard rounded-xl p-2.5 text-xs text-textMain focus:outline-none focus:border-cyberCyan resize-none"
        />
      </div>
    </div>
  );
}

/* ========================================================
   MODAL DE CREACIÓN DE REPORTES
   ======================================================== */
export const NewReportModal = memo(function NewReportModal({
  isOpen,
  onClose,
  onSave,
  initialCategory = 'Solicitud PAX'
}) {
  const [formData, setFormData] = useState(() => sanitizeReport({ category: initialCategory }));

  useEffect(() => {
    if (isOpen) {
      setFormData(sanitizeReport({ category: initialCategory || 'Solicitud PAX' }));
    }
  }, [isOpen, initialCategory]);

  // ✅ Handler memoizado
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!formData.titulo?.trim()) return;
    onSave({
      ...formData,
      id: formData.id || `rep_${Date.now()}`,
      createdAt: formData.createdAt || new Date().toISOString()
    });
    onClose();
  }, [formData, onSave, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-bgCard border border-cyberCyan/40 rounded-2xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl text-textMain">
        <div className="flex items-center justify-between border-b border-borderCard pb-3">
          <h3 className="text-xs font-black text-cyberCyan uppercase tracking-wider flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> Nuevo Reporte de Vuelo
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-textSub hover:text-textMain p-1 rounded-lg bg-bgInput transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ReportFormFields formData={formData} setFormData={setFormData} />
          <div className="flex gap-2 pt-2 border-t border-borderCard/40">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-bgInput text-xs font-bold text-textSub rounded-xl border border-borderCard hover:bg-bgCardHeader transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-cyberCyan hover:bg-cyberCyan/80 text-black text-xs font-black rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" /> Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

/* ========================================================
   MODAL DE EDICIÓN DE REPORTES
   ======================================================== */
export const EditReportModal = memo(function EditReportModal({
  isOpen,
  initialData,
  onClose,
  onSave,
  onDelete
}) {
  const [formData, setFormData] = useState(() => sanitizeReport(initialData));

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData(sanitizeReport(initialData));
    }
  }, [isOpen, initialData]);

  // ✅ Handler memoizado
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  }, [formData, onSave, onClose]);

  // ✅ Handler de eliminación memoizado
  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(formData);
      onClose();
    }
  }, [onDelete, formData, onClose]);

  if (!isOpen || !initialData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-bgCard border border-cyberCyan/40 rounded-2xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl text-textMain">
        <div className="flex items-center justify-between border-b border-borderCard pb-3">
          <h3 className="text-xs font-black text-cyberCyan uppercase tracking-wider flex items-center gap-2">
            <Edit3 className="w-4 h-4" /> Editar Reporte
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-textSub hover:text-textMain p-1 rounded-lg bg-bgInput transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ReportFormFields formData={formData} setFormData={setFormData} />
          <div className="flex gap-2 pt-2 border-t border-borderCard/40">
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-2.5 bg-cyberCoral/10 text-cyberCoral hover:bg-cyberCoral/20 border border-cyberCoral/30 rounded-xl cursor-pointer"
                title="Eliminar Reporte"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-bgInput text-xs font-bold text-textSub rounded-xl border border-borderCard hover:bg-bgCardHeader transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-cyberCyan hover:bg-cyberCyan/80 text-black text-xs font-black rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

/* ========================================================
   MODAL DE IMPORTACIÓN (QR / JSON / MANUAL)
   ======================================================== */
export const ImportReportModal = memo(function ImportReportModal({
  isOpen,
  onClose,
  fileInputRef,
  onFileUpload,
  manualJson,
  onManualJsonChange,
  onProcessJson
}) {
  const qrRegionId = 'html5qr-code-full-region';

  // ✅ Callback memoizado para evitar recrear el scanner
  const handleQrDecoded = useCallback((decodedData) => {
    onManualJsonChange(
      typeof decodedData === 'object' ? JSON.stringify(decodedData, null, 2) : decodedData
    );
  }, [onManualJsonChange]);

  const { scanError, stopScanner } = useQrScanner(isOpen, qrRegionId, handleQrDecoded);

  // ✅ Handler memoizado
  const handleProcessText = useCallback(async () => {
    if (!manualJson || !manualJson.trim()) return;
    const result = decodeFromQR(manualJson);
    await stopScanner();
    onProcessJson(result ? JSON.stringify(result.data) : manualJson.trim());
  }, [manualJson, stopScanner, onProcessJson]);

  // ✅ Handler para abrir el selector de archivos
  const handleOpenFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  // ✅ Handler para cerrar deteniendo el scanner
  const handleCloseWithStop = useCallback(async () => {
    await stopScanner();
    onClose();
  }, [stopScanner, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-bgCard border border-emerald-500/30 rounded-2xl p-4 max-w-sm w-full space-y-4 relative text-textMain shadow-2xl">
        <button
          type="button"
          onClick={handleCloseWithStop}
          className="absolute top-3 right-3 p-1 text-textSub hover:text-textMain bg-bgInput rounded-xl cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xs font-black text-emerald-400 uppercase text-center flex items-center justify-center gap-1.5">
          <Camera className="w-4 h-4" /> Importar / Escanear QR
        </h3>

        <button
          type="button"
          onClick={handleOpenFilePicker}
          className="w-full py-2.5 bg-bgInput border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-bgCardHeader"
        >
          <Upload className="w-3.5 h-3.5" /> Subir JSON
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          onChange={onFileUpload}
          className="hidden"
        />

        <div className="relative aspect-square bg-black rounded-xl overflow-hidden border border-emerald-500/20 flex items-center justify-center">
          <div id={qrRegionId} className="w-full h-full" />
          {scanError && (
            <p className="absolute inset-0 p-4 text-xs text-cyberCoral flex items-center justify-center text-center bg-black/90">
              {scanError}
            </p>
          )}
        </div>

        <textarea
          rows={3}
          placeholder="Pegar datos aquí..."
          value={manualJson || ''}
          onChange={(e) => onManualJsonChange(e.target.value)}
          className="w-full bg-bgInput border border-borderCard rounded-xl p-2.5 text-xs font-mono resize-none"
        />

        <button
          type="button"
          onClick={handleProcessText}
          className="w-full py-2.5 bg-emerald-600 text-xs font-bold text-white rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
        >
          <Download className="w-3.5 h-3.5" /> Procesar
        </button>
      </div>
    </div>
  );
});

/* ========================================================
   MODAL DE CÓDIGO QR (EXPORTACIÓN)
   ======================================================== */
export const QrCodeReportModal = memo(function QrCodeReportModal({ report, onClose, onCopyJson }) {
  // ✅ useMemo para no recalcular el string del QR en cada render
  const qrString = useMemo(() => {
    if (!report) return '';
    return encodeToQR('REPORT', report);
  }, [report]);

  if (!report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-bgCard border border-cyberCyan/30 rounded-2xl p-5 max-w-xs w-full text-center space-y-4 shadow-2xl">
        <h3 className="text-xs font-black text-cyberCyan uppercase tracking-wider">
          Código QR
        </h3>
        <div className="bg-white p-4 rounded-xl inline-block shadow-lg">
          <QRCodeSVG value={qrString} size={200} level="L" includeMargin />
        </div>
        <button
          type="button"
          onClick={() => onCopyJson(report)}
          className="w-full py-2.5 bg-cyberCyan/10 text-cyberCyan text-xs font-bold rounded-xl border border-cyberCyan/30 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-cyberCyan/20"
        >
          <Copy className="w-3.5 h-3.5" /> Copiar JSON
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 bg-bgInput text-xs text-textSub rounded-xl cursor-pointer hover:bg-bgCardHeader"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
});

/* ========================================================
   MODAL DE ENVÍO POR CORREO
   ======================================================== */
export const EmailReportModal = memo(function EmailReportModal({
  report,
  onClose,
  targetEmail,
  onEmailChange,
  onSend
}) {
  if (!report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-bgCard border border-cyberCyan/30 rounded-2xl p-4 max-w-xs w-full space-y-3 shadow-2xl">
        <div className="flex items-center justify-between border-b border-borderCard pb-2">
          <h3 className="text-xs font-black text-cyberCyan uppercase flex items-center gap-1.5">
            <Mail className="w-4 h-4" /> Enviar Correo
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-textSub hover:text-textMain cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <input
          type="email"
          value={targetEmail || ''}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="correo@empresa.com"
          className="w-full bg-bgInput border border-borderCard rounded-xl p-2.5 text-xs text-textMain"
        />

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 bg-bgInput text-xs text-textSub rounded-xl border border-borderCard cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSend}
            className="flex-1 py-2 bg-cyberCyan text-black font-black text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-md"
          >
            <Send className="w-3.5 h-3.5" /> Enviar
          </button>
        </div>
      </div>
    </div>
  );
});