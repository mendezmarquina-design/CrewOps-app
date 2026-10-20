import React, { useState } from 'react';
import { 
  FileCheck, Plus, Search, Trash2, User, FileText, 
  CheckSquare, Square, XCircle, Save, Edit, Plane, 
  AlertCircle, Copy, Check, Maximize2 
} from 'lucide-react';
import BackButton from '../components/common/BackButton';
import ExpandedTextareaModal from '../components/common/ExpandedTextareaModal';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';
import { useGceManagement } from '../hooks/useGceManagement';

export default function GceManagementView({ activeFlight = null, onBack }) {
  const {
    isFlightContext,
    copiedField,
    activeModalField,
    setActiveModalField,
    editingId,
    formData,
    setFormData,
    filterType,
    setFilterType,
    searchTerm,
    setSearchTerm,
    dayFilter,
    setDayFilter,
    monthFilter,
    setMonthFilter,
    yearFilter,
    setYearFilter,
    filteredGces,
    copyToClipboard,
    resetForm,
    handleSelectForEdit,
    handleSubmit,
    handleDeleteGce
  } = useGceManagement(activeFlight);

  // Estado local para controlar el modal de confirmación
  const [itemToDelete, setItemToDelete] = useState(null);

  const formatDateDDMMYYYY = (dateStr) => {
    if (!dateStr) return 'Hoy';
    const parts = dateStr.split('-');
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateStr;
  };

  const formattedFlightNumber = (() => {
    if (!activeFlight) return 'N/A';
    const rawNumber = activeFlight.flightNumber || activeFlight.number || '';
    if (rawNumber) {
      return rawNumber.startsWith('LA') ? rawNumber : `LA${rawNumber}`;
    }
    const prefix = activeFlight.flightPrefix || activeFlight.prefix || 'LA';
    const numOnly = activeFlight.flightNumberOnly || '';
    return `${prefix}${numOnly}`;
  })();

  const getModalTitle = () => {
    switch (activeModalField) {
      case 'strengths': return 'FORTALEZAS';
      case 'improvements': return 'OPORTUNIDADES DE MEJORA';
      case 'qrhNotes': return 'OBSERVACIONES QRH';
      default: return '';
    }
  };

  const onRequestDelete = (e, item) => {
    e.stopPropagation();
    setItemToDelete(item);
  };

  const onConfirmDelete = () => {
    if (itemToDelete) {
      handleDeleteGce(null, itemToDelete.id);
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto p-2 sm:p-4 font-sans text-textMain pb-12">
      
      {/* BARRA SUPERIOR CON BOTÓN VOLVER */}
      <div className="flex items-center justify-between gap-2">
        <BackButton 
          onClick={onBack} 
          label={isFlightContext ? "VOLVER AL VUELO" : "VOLVER A CONTROL DE VUELO"} 
        />
      </div>

      {/* BANNER CONTEXTO DE VUELO */}
      {isFlightContext && (
        <div className="bg-bgCard border border-borderCard rounded-2xl p-3.5 shadow-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-cyberCyan/10 border border-cyberCyan/30 flex items-center justify-center shrink-0 text-cyberCyan">
              <Plane className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black uppercase tracking-wider text-textPrincipal truncate">
                GCE´s
              </h2>
              <p className="text-[11px] font-mono text-cyberCyan font-bold mt-0.5">
                Vuelo: <span className="text-cyberYellow">{formattedFlightNumber}</span>
                <span className="text-textSub mx-1.5">•</span>
                <span className="text-textSub">{formatDateDDMMYYYY(activeFlight.date)}</span>
              </p>
            </div>
          </div>
          <div className="bg-bgInput border border-cyberCyan/30 px-3 py-1.5 rounded-xl shrink-0 text-right">
            <span className="text-[10px] font-black font-mono uppercase tracking-wider text-cyberCyan block">
              {filteredGces.length} {filteredGces.length === 1 ? 'TRIPULANTE' : 'TRIPULANTES'}
            </span>
          </div>
        </div>
      )}

      {!isFlightContext && !editingId && (
        <div className="bg-bgCard border border-borderCard rounded-xl p-4 flex items-center gap-3 shadow-md">
          <AlertCircle className="w-5 h-5 text-cyberYellow shrink-0" />
          <p className="text-xs font-medium text-textSub">
            Nuevas evaluaciones GCE solo pueden ser creadas dentro de un <strong className="text-textMain">Vuelo Activo</strong>. Selecciona un registro del listado para editar.
          </p>
        </div>
      )}

      {/* FORMULARIO GCE */}
      {(isFlightContext || editingId) && (
        <div className={`bg-bgCard border rounded-2xl p-4 space-y-4 shadow-md transition-colors ${
          editingId ? 'border-cyberYellow' : 'border-borderCard'
        }`}>
          <div className="border-b border-borderCard pb-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              {editingId ? <Edit className="w-4 h-4 text-cyberYellow" /> : <Plus className="w-4 h-4 text-cyberCyan" />}
              <h3 className={`text-xs font-black uppercase tracking-wider ${editingId ? 'text-cyberYellow' : 'text-cyberCyan'}`}>
                {editingId ? 'EDITAR EVALUACIÓN SELECCIONADA' : 'REGISTRAR NUEVA EVALUACIÓN GCE'}
              </h3>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-[10px] font-bold text-textSub hover:text-textMain uppercase tracking-wider cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-textSub uppercase tracking-wider block mb-1">
                  NOMBRE DEL TRIPULANTE *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-textSub absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Alfredo Mendez"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-bgInput border border-borderCard focus:border-cyberCyan rounded-xl h-10 pl-9 pr-3 text-xs font-bold text-textMain outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-textSub uppercase tracking-wider block mb-1">
                  BP (NÚMERO DE FICHA) *
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-textSub absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. 4372718"
                    value={formData.bp}
                    onChange={(e) => setFormData({ ...formData, bp: e.target.value })}
                    className="w-full bg-bgInput border border-borderCard focus:border-cyberCyan rounded-xl h-10 pl-9 pr-3 text-xs font-mono font-bold text-cyberYellow outline-none"
                  />
                </div>
              </div>
            </div>

            {/* FORTALEZAS */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-cyberCyan">FORTALEZAS</label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(formData.strengths, 'strengths')}
                    disabled={!formData.strengths.trim()}
                    title="Copiar contenido"
                    className={`p-1 rounded-md transition-all cursor-pointer ${
                      copiedField === 'strengths'
                        ? 'text-cyberGreen bg-cyberGreen/10'
                        : 'text-textSub hover:text-cyberYellow disabled:opacity-30 disabled:cursor-not-allowed'
                    }`}
                  >
                    {copiedField === 'strengths' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-[10px] text-textSub font-mono">{formData.strengths.length}/1000</span>
              </div>

              <div className="relative group cursor-pointer" onClick={() => setActiveModalField('strengths')}>
                <textarea
                  readOnly
                  rows={4}
                  value={formData.strengths}
                  placeholder="Presione para escribir o editar en pantalla completa..."
                  className="w-full bg-bgInput border border-borderCard group-hover:border-cyberCyan rounded-xl p-3 text-xs text-textMain outline-none resize-none leading-relaxed cursor-pointer transition-colors"
                />
                <div className="absolute right-3 bottom-3 text-textSub group-hover:text-cyberCyan transition-colors pointer-events-none">
                  <Maximize2 className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                </div>
              </div>
            </div>

            {/* OPORTUNIDADES DE MEJORA */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-cyberCyan">OPORTUNIDADES DE MEJORA</label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(formData.improvements, 'improvements')}
                    disabled={!formData.improvements.trim()}
                    title="Copiar contenido"
                    className={`p-1 rounded-md transition-all cursor-pointer ${
                      copiedField === 'improvements'
                        ? 'text-cyberGreen bg-cyberGreen/10'
                        : 'text-textSub hover:text-cyberYellow disabled:opacity-30 disabled:cursor-not-allowed'
                    }`}
                  >
                    {copiedField === 'improvements' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-[10px] text-textSub font-mono">{formData.improvements.length}/1000</span>
              </div>

              <div className="relative group cursor-pointer" onClick={() => setActiveModalField('improvements')}>
                <textarea
                  readOnly
                  rows={4}
                  value={formData.improvements}
                  placeholder="Presione para escribir o editar en pantalla completa..."
                  className="w-full bg-bgInput border border-borderCard group-hover:border-cyberCyan rounded-xl p-3 text-xs text-textMain outline-none resize-none leading-relaxed cursor-pointer transition-colors"
                />
                <div className="absolute right-3 bottom-3 text-textSub group-hover:text-cyberCyan transition-colors pointer-events-none">
                  <Maximize2 className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                </div>
              </div>
            </div>

            {/* CHECKBOX QRH */}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, qrhReviewed: !formData.qrhReviewed })}
              className="flex items-center gap-2 text-xs font-bold text-textPrincipal hover:text-cyberCyan cursor-pointer py-1"
            >
              {formData.qrhReviewed ? <CheckSquare className="w-5 h-5 text-cyberYellow shrink-0" /> : <Square className="w-5 h-5 text-textSub shrink-0" />}
              <span>Revisión de QRH</span>
            </button>

            {/* OBSERVACIONES QRH */}
            {formData.qrhReviewed && (
              <div className="p-3 bg-bgInput border border-borderCard rounded-xl space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-cyberYellow">
                  <div className="flex items-center gap-2">
                    <label>OBSERVACIONES QRH</label>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formData.qrhNotes, 'qrhNotes')}
                      disabled={!formData.qrhNotes.trim()}
                      title="Copiar contenido"
                      className={`p-1 rounded-md transition-all cursor-pointer ${
                        copiedField === 'qrhNotes'
                          ? 'text-cyberGreen bg-cyberGreen/10'
                          : 'text-textSub hover:text-cyberYellow disabled:opacity-30 disabled:cursor-not-allowed'
                      }`}
                    >
                      {copiedField === 'qrhNotes' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-textSub font-mono">{formData.qrhNotes.length}/1000</span>
                </div>

                <div className="relative group cursor-pointer" onClick={() => setActiveModalField('qrhNotes')}>
                  <textarea
                    readOnly
                    rows={2}
                    value={formData.qrhNotes}
                    placeholder="Presione para detallar observaciones..."
                    className="w-full bg-bgCard border border-borderCard group-hover:border-cyberYellow rounded-lg p-2.5 text-xs text-textMain outline-none resize-none leading-relaxed cursor-pointer transition-colors"
                  />
                  <div className="absolute right-2.5 bottom-2.5 text-textSub group-hover:text-cyberYellow transition-colors pointer-events-none">
                    <Maximize2 className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                  </div>
                </div>
              </div>
            )}

            {/* BOTONES ACCIÓN */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-bgInput border border-borderCard text-textSub hover:text-cyberCoral py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-[0.98]"
              >
                <XCircle className="w-4 h-4 shrink-0" />
                <span>CANCELAR</span>
              </button>
              
              <button
                type="submit"
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-[0.98] ${
                  editingId 
                    ? 'bg-cyberYellow border border-cyberYellow text-textInverseDark hover:brightness-110' 
                    : 'bg-cyberPurple hover:brightness-125 border border-cyberPurpleBorder text-white'
                }`}
              >
                {editingId ? <Save className="w-4 h-4 shrink-0" /> : <Plus className="w-4 h-4 shrink-0" />}
                <span>{editingId ? 'ACTUALIZAR GCE' : 'GUARDAR GCE'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* HISTÓRICO GCE */}
      <div className="bg-bgCard border border-borderCard rounded-2xl p-4 shadow-md space-y-4">
        <div className="flex items-center gap-2 border-b border-borderCard pb-3">
          <FileCheck className="w-4 h-4 text-cyberCyan" />
          <h4 className="text-xs font-black uppercase tracking-wider text-cyberCyan">
            {isFlightContext ? 'EVALUACIONES DEL VUELO' : 'CATÁLOGO HISTÓRICO GCE'} ({filteredGces.length})
          </h4>
        </div>

        {!isFlightContext && (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-1 bg-bgInput p-1 rounded-xl border border-borderCard text-center">
              {['Día', 'Mes', 'Año', 'Todos'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterType(tab)}
                  className={`py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    filterType === tab ? 'bg-bgCardHeader text-cyberCyan border border-cyberCyan/40' : 'text-textSub hover:text-textMain'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filterType === 'Día' && (
                <input
                  type="date"
                  value={dayFilter}
                  onChange={(e) => setDayFilter(e.target.value)}
                  className="w-full bg-bgInput border border-borderCard rounded-xl h-10 px-3 text-xs font-mono text-textMain"
                />
              )}
              {filterType === 'Mes' && (
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="w-full bg-bgInput border border-borderCard rounded-xl h-10 px-3 text-xs font-mono text-textMain"
                />
              )}
              {filterType === 'Año' && (
                <input
                  type="number"
                  min="2020"
                  max="2035"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full bg-bgInput border border-borderCard rounded-xl h-10 px-3 text-xs font-mono text-textMain"
                />
              )}
              <div className="relative">
                <Search className="w-4 h-4 text-textSub absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Nombre, BP o Vuelo"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-bgInput border border-borderCard focus:border-cyberCyan rounded-xl h-10 pl-9 pr-3 text-xs text-textMain"
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2 pt-1">
          {filteredGces.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-borderCard rounded-xl text-textSub text-xs">
              No se encontraron evaluaciones registradas.
            </div>
          ) : (
            filteredGces.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectForEdit(item)}
                className={`border rounded-xl p-3 transition-colors cursor-pointer bg-bgInput ${
                  editingId === item.id ? 'border-cyberYellow bg-cyberYellow/5' : 'border-borderCard hover:border-cyberCyan/40'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-cyberCyan font-mono font-bold">{formatDateDDMMYYYY(item.date)}</span>
                      <span className="text-[10px] bg-bgCard border border-borderCard text-cyberYellow font-mono px-1.5 py-0.2 rounded font-bold">
                        Vuelo: {item.flightNumber || formattedFlightNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-textMain">{item.name}</span>
                      <span className="text-[11px] text-textSub font-mono">(BP: {item.bp})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {Boolean(item.qrhReviewed) && (
                      <span className="text-[9px] bg-cyberGreen/10 text-cyberGreen border border-cyberGreen/30 px-2 py-0.5 rounded font-black">
                        QRH Revisado
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => onRequestDelete(e, item)}
                      className="p-1 text-textSub hover:text-cyberCoral transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL EXTENDIDO TEXTAREA */}
      <ExpandedTextareaModal
        isOpen={Boolean(activeModalField)}
        onClose={() => setActiveModalField(null)}
        title={`EDITAR ${getModalTitle()}`}
        value={activeModalField ? formData[activeModalField] : ''}
        onChange={(newValue) => setFormData({ ...formData, [activeModalField]: newValue })}
      />

      {/* MODAL COMÚN DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <ConfirmDeleteModal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={onConfirmDelete}
        title="¿ELIMINAR REGISTRO GCE?"
        description="Vas a eliminar la evaluación de"
        itemName={itemToDelete ? `${itemToDelete.name} (BP: ${itemToDelete.bp}).` : ''}
        iconType="trash"
      />

    </div>
  );
}