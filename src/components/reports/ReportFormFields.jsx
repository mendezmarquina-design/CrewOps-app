// src/components/reports/ReportFormFields.jsx
import React, { useState, useCallback } from 'react';
import {
  Stethoscope, ShieldAlert, ChevronDown, ChevronUp,
  Plus, Trash2
} from 'lucide-react';
import { DEFAULT_MEDICAL_DATA } from '../../utils/reportSanitizer';

export default function ReportFormFields({ formData, setFormData }) {
  const [openSec1, setOpenSec1] = useState(true);

  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, [setFormData]);

  const handleMedicaChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      atencionMedica: {
        ...(prev.atencionMedica || DEFAULT_MEDICAL_DATA),
        [field]: value
      }
    }));
  }, [setFormData]);

  const handleAddKit = useCallback(() => {
    setFormData((prev) => {
      const currentKits = prev.atencionMedica?.kits || [];
      return {
        ...prev,
        atencionMedica: {
          ...(prev.atencionMedica || DEFAULT_MEDICAL_DATA),
          kits: [
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
          ]
        }
      };
    });
  }, [setFormData]);

  const handleUpdateKit = useCallback((id, field, value) => {
    setFormData((prev) => {
      const currentKits = prev.atencionMedica?.kits || [];
      return {
        ...prev,
        atencionMedica: {
          ...(prev.atencionMedica || DEFAULT_MEDICAL_DATA),
          kits: currentKits.map((k) => (k.id === id ? { ...k, [field]: value } : k))
        }
      };
    });
  }, [setFormData]);

  const handleRemoveKit = useCallback((id) => {
    setFormData((prev) => {
      const currentKits = prev.atencionMedica?.kits || [];
      return {
        ...prev,
        atencionMedica: {
          ...(prev.atencionMedica || DEFAULT_MEDICAL_DATA),
          kits: currentKits.filter((k) => k.id !== id)
        }
      };
    });
  }, [setFormData]);

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

      {/* PASAJERO Y ASIENTO */}
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

      {/* OBSERVACIONES */}
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