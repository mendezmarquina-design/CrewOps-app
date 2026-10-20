// src/components/reports/MedicalSection.jsx
import React, { useState } from 'react';
import { Stethoscope, ChevronUp, ChevronDown, Plus, Trash2 } from 'lucide-react';

const DEFAULT_MEDICAL_DATA = {
  paxId: '',
  paxPhone: '',
  paxEmail: '',
  paxAcompanante: '',
  sintomas: '',
  signosVitales: '',
  enfermedadesBase: '',
  tieneAtencionMedica: false,
  medicoNombre: '',
  medicoApellido: '',
  medicoAsiento: '',
  medicoProfesion: '',
  medicoReg: '',
  medicoDiagnostico: '',
  medicoTratamiento: '',
  abrioBotiquin: false,
  kits: []
};

export function MedicalSection({ data, onChange }) {
  const [openSec1, setOpenSec1] = useState(false);
  
  const am = { ...DEFAULT_MEDICAL_DATA, ...data };

  const handleMedicaChange = (field, value) => {
    onChange({
      ...am,
      [field]: value
    });
  };

  const handleAddKit = () => {
    const currentKits = am.kits || [];
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
    const currentKits = am.kits || [];
    handleMedicaChange(
      'kits',
      currentKits.map((k) => (k.id === id ? { ...k, [field]: value } : k))
    );
  };

  const handleRemoveKit = (id) => {
    const currentKits = am.kits || [];
    handleMedicaChange(
      'kits',
      currentKits.filter((k) => k.id !== id)
    );
  };

  return (
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

      {/* SECCIÓN 2: ATENCIÓN MÉDICA / PROFESIONAL */}
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

      {/* SECCIÓN 3: BOTIQUINES / KITS */}
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
  );
}