import React, { useState } from 'react';
import { 
  FileCheck, 
  Plus, 
  Trash2, 
  CheckSquare, 
  Square, 
  ChevronDown, 
  ChevronUp, 
  User, 
  FileText 
} from 'lucide-react';

export const GceCard = ({ gceList = [], onSaveGce, onDeleteGce }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bp: '',
    strengths: '',
    improvements: '',
    qrhReviewed: false,
    qrhNotes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.bp.trim()) return;

    onSaveGce(formData);

    setFormData({
      name: '',
      bp: '',
      strengths: '',
      improvements: '',
      qrhReviewed: false,
      qrhNotes: ''
    });
    setIsFormOpen(false);
  };

  return (
    <div className="bg-bgCard border border-borderCard rounded-xl p-4 my-4 shadow-xl text-textMain font-sans">
      {/* Cabecera de la Sección */}
      <div className="flex justify-between items-center pb-3 border-b border-borderCard/60 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileCheck className="w-4 h-4 text-cyberCyan shrink-0" />
          <h3 className="font-black text-xs uppercase tracking-wider text-cyberCyan truncate">
            EVALUACIONES GCE
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setIsFormOpen((prev) => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider bg-bgInput hover:bg-bgCardHeader text-cyberCyan border border-borderCard rounded-xl transition-all shrink-0 cursor-pointer shadow-sm"
        >
          {isFormOpen ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" /> CANCELAR
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" /> NUEVA GCE
            </>
          )}
        </button>
      </div>

      {/* Formulario Desplegable */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mt-4 p-3.5 bg-bgInput/50 rounded-xl border border-borderCard space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-cyberCyan">
            REGISTRAR EVALUACIÓN A TRIPULANTE
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-textSub uppercase tracking-wider mb-1">
                NOMBRE DEL TRIPULANTE *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-textSub absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej. Alfredo Mendez"
                  className="w-full bg-bgInput border border-borderCard focus:border-cyberCyan rounded-xl h-9 pl-9 pr-3 text-xs font-bold text-textMain outline-none transition-colors placeholder:text-textSub/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-textSub uppercase tracking-wider mb-1">
                BP (NÚMERO DE FICHA) *
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-textSub absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={formData.bp}
                  onChange={(e) => setFormData({ ...formData, bp: e.target.value })}
                  placeholder="Ej. 4372718"
                  className="w-full bg-bgInput border border-borderCard focus:border-cyberCyan rounded-xl h-9 pl-9 pr-3 text-xs font-mono font-bold text-cyberYellow outline-none transition-colors placeholder:text-textSub/40"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-textSub mb-1">
              <label>FORTALEZAS</label>
              <span className="text-textSub font-mono">{formData.strengths.length}/1000</span>
            </div>
            <textarea
              maxLength={1000}
              rows={2}
              value={formData.strengths}
              onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
              placeholder="Describa las fortalezas observadas..."
              className="w-full bg-bgInput border border-borderCard focus:border-cyberCyan rounded-xl p-2.5 text-xs text-textMain outline-none resize-none transition-colors placeholder:text-textSub/40"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-textSub mb-1">
              <label>OPORTUNIDADES DE MEJORA</label>
              <span className="text-textSub font-mono">{formData.improvements.length}/1000</span>
            </div>
            <textarea
              maxLength={1000}
              rows={2}
              value={formData.improvements}
              onChange={(e) => setFormData({ ...formData, improvements: e.target.value })}
              placeholder="Describa las oportunidades de mejora..."
              className="w-full bg-bgInput border border-borderCard focus:border-cyberCyan rounded-xl p-2.5 text-xs text-textMain outline-none resize-none transition-colors placeholder:text-textSub/40"
            />
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, qrhReviewed: !formData.qrhReviewed })}
              className="flex items-center gap-2 text-xs font-bold text-textMain hover:text-cyberCyan transition-colors cursor-pointer"
            >
              {formData.qrhReviewed ? (
                <CheckSquare className="w-4 h-4 text-cyberYellow" />
              ) : (
                <Square className="w-4 h-4 text-textSub" />
              )}
              <span>Revisión de QRH</span>
            </button>
          </div>

          {formData.qrhReviewed && (
            <div className="p-3 bg-bgInput border border-borderCard rounded-xl space-y-1">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                <label className="text-cyberYellow">OBSERVACIONES QRH</label>
                <span className="text-textSub font-mono">{formData.qrhNotes.length}/1000</span>
              </div>
              <textarea
                maxLength={1000}
                rows={2}
                value={formData.qrhNotes}
                onChange={(e) => setFormData({ ...formData, qrhNotes: e.target.value })}
                placeholder="Detalle los puntos de la revisión del QRH..."
                className="w-full bg-bgCard border border-borderCard focus:border-cyberCyan rounded-lg p-2 text-xs text-textMain outline-none resize-none transition-colors placeholder:text-textSub/40"
              />
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-cyberCyan hover:brightness-110 text-textInverseDark font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>GUARDAR EVALUACIÓN GCE</span>
            </button>
          </div>
        </form>
      )}

      {/* Lista de Registros */}
      <div className="mt-3 space-y-2">
        {gceList.length === 0 ? (
          <p className="text-xs text-textSub italic text-center py-4 border border-dashed border-borderCard rounded-xl">
            No hay evaluaciones GCE registradas para este vuelo.
          </p>
        ) : (
          gceList.map((item) => (
            <div
              key={item.id}
              className="bg-bgInput border border-borderCard hover:border-cyberCyan/40 rounded-xl p-3 transition-colors space-y-1.5"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-textMain">
                    {item.name}
                  </span>
                  <span className="text-[11px] text-textPrincipal font-mono">
                    (BP: {item.bp})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {item.qrhReviewed && (
                    <span className="text-[9px] bg-catRtms/10 text-catRtms border border-catRtms/30 px-2 py-0.5 rounded font-black">
                      QRH
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteGce(item.id)}
                    className="p-1 text-textSub hover:text-red-400 transition-colors cursor-pointer"
                    title="Eliminar registro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {item.strengths && (
                <div className="border-t border-borderCard/40 pt-1.5 text-[11px] text-textSub truncate">
                  <strong className="text-textMain font-medium">Fortalezas:</strong> {item.strengths}
                </div>
              )}

              {item.improvements && (
                <div className="text-[11px] text-textSub truncate">
                  <strong className="text-cyberYellow font-medium">Oportunidades de Mejora:</strong> {item.improvements}
                </div>
              )}

              {item.qrhReviewed && item.qrhNotes && (
                <div className="text-[11px] text-textSub bg-bgCard p-2 rounded-lg border border-borderCard mt-1">
                  <strong className="text-catRtms font-medium">Obs. QRH:</strong> {item.qrhNotes}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};