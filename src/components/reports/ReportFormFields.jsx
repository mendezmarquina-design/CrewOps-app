// src/components/reports/ReportFormFields.jsx
import React, { useState } from 'react';
import { ShieldAlert, User, ChevronUp, ChevronDown, Maximize2 } from 'lucide-react';
import { MedicalSection } from './MedicalSection';
import ExpandedTextareaModal from '../common/ExpandedTextareaModal';

export function ReportFormFields({ formData, setFormData }) {
  const [openPaxSection, setOpenPaxSection] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isMedical = formData.category === 'Atención Médica';

  // Renderiza los campos usando bg-bgCard dentro del acordeón y bg-bgInput fuera de él
  const renderPaxFields = (inAccordion = false) => {
    const inputBgClass = inAccordion ? 'bg-bgCard' : 'bg-bgInput';

    return (
      <div className="space-y-3">
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
              className={`w-full ${inputBgClass} border border-borderCard rounded-xl p-2.5 text-xs text-textMain focus:outline-none focus:border-cyberCyan`}
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
              className={`w-full ${inputBgClass} border border-borderCard rounded-xl p-2.5 text-xs font-mono text-textMain focus:outline-none focus:border-cyberCyan`}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-extrabold text-textSub uppercase tracking-wider">
              Observaciones
            </label>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-cyberCyan hover:text-white flex items-center gap-1 text-[10px] font-bold cursor-pointer"
            >
              <Maximize2 className="w-3 h-3" /> Expandir
            </button>
          </div>
          <textarea
            rows={3}
            value={formData.observacion || ''}
            onClick={() => setIsModalOpen(true)}
            onChange={(e) => handleChange('observacion', e.target.value)}
            placeholder="Toca para expandir e ingresar observaciones..."
            className={`w-full ${inputBgClass} border border-borderCard rounded-xl p-2.5 text-xs text-textMain focus:outline-none focus:border-cyberCyan resize-none cursor-pointer`}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3.5">
      {/* Categoría */}
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

      {/* Título / Asunto */}
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

      {/* Quiebre PAX - CUS */}
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

      {/* RENDER CONDICIONAL DEL BLOQUE PAX */}
      {isMedical ? (
        <div className="border border-cyberCyan/40 rounded-xl overflow-hidden bg-bgInput/40">
          <button
            type="button"
            onClick={() => setOpenPaxSection(!openPaxSection)}
            className="w-full p-2.5 bg-cyberCyan/10 text-cyberCyan text-xs font-black uppercase tracking-wider flex items-center justify-between border-b border-cyberCyan/20 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <User className="w-4 h-4" /> Datos de Pasajero y Observaciones
            </span>
            {openPaxSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {openPaxSection && <div className="p-3">{renderPaxFields(true)}</div>}
        </div>
      ) : (
        renderPaxFields(false)
      )}

      {/* Sección Médica Adicional */}
      {isMedical && (
        <MedicalSection
          data={formData.atencionMedica}
          onChange={(medData) => handleChange('atencionMedica', medData)}
        />
      )}

      {/* MODAL EXPANDIBLE */}
      {isModalOpen && (
        <ExpandedTextareaModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Observaciones"
          value={formData.observacion || ''}
          onChange={(val) => handleChange('observacion', val)}
        />
      )}
    </div>
  );
}