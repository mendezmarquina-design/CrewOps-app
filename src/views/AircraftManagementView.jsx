import React from 'react';
import { Upload, Plus, Search, Trash2, AlertTriangle, Edit3, X, Plane, Info } from 'lucide-react';
import BackButton from '../components/common/BackButton';
import { useAircraftManagement, FLEET_MODELS } from '../hooks/useAircraftManagement';
import { 
  UpdateAircraftModal, 
  DeleteAircraftModal, 
  ImportAnalysisModal, 
  ReplaceConfirmModal 
} from '../components/modals/AircraftModals';

export default function AircraftManagementView({ onBackToFlights }) {
  const {
    newTail, setNewTail,
    newModel, setNewModel,
    newNotes, setNewNotes,
    editingAircraft,
    showUpdateModal, setShowUpdateModal,
    searchTerm, setSearchTerm,
    deleteTarget, setDeleteTarget,
    pendingImport, setPendingImport,
    showReplaceConfirm, setShowReplaceConfirm,
    errorMessage,
    showNewList, setShowNewList,
    showExistingList, setShowExistingList,
    aircrafts,
    filteredAndSortedAircrafts,
    handleSelectForEdit,
    handleCancelEdit,
    handleSubmit,
    confirmUpdate,
    confirmDelete,
    handleFileUpload,
    executeImport
  } = useAircraftManagement();

  return (
    <div className="space-y-3 max-w-md mx-auto font-sans text-textPrincipal transition-colors duration-200">
      
      {/* Botón Reutilizable Volver */}
      <BackButton onClick={onBackToFlights} />

      {/* Contenedor Principal */}
      <div className="bg-bgCard border border-borderCard rounded-2xl p-4 space-y-4 shadow-sm transition-colors duration-200">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-borderCard pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-bgInput rounded-xl text-cyberCyan border border-borderCard">
              <Plane className="w-4 h-4" />
            </div>
            <span className="text-textPrincipal font-bold text-xs tracking-wide uppercase">
              Gestión de Matrículas
            </span>
          </div>

          <label className="bg-bgInput hover:bg-bgCardHeader border border-borderCard text-textSub hover:text-textPrincipal font-medium px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1.5 transition-all cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-cyberCyan" />
            <span>Cargar JSON</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Formulario Manual */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {editingAircraft && (
            <div className="flex items-center justify-between bg-bgInput border border-cyberYellow px-3 py-2 rounded-xl text-cyberYellow text-[11px]">
              <span className="font-semibold flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5" />
                Editando: <strong className="font-mono text-textPrincipal">{editingAircraft.tailNumber}</strong>
              </span>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-textSub hover:text-textPrincipal p-0.5 rounded-md transition-colors cursor-pointer"
                title="Cancelar Edición"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-textSub uppercase mb-1 tracking-wider">
                Matrícula
              </label>
              <input
                type="text"
                placeholder="CC-COO"
                value={newTail}
                onChange={(e) => setNewTail(e.target.value.toUpperCase())}
                className="w-full bg-bgInput border border-borderCard rounded-xl px-3 py-2 text-xs font-mono font-bold text-textPrincipal placeholder:text-textSub/50 focus:outline-none focus:border-cyberCyan uppercase transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-textSub uppercase mb-1 tracking-wider">
                Modelo / Flota
              </label>
              <select
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                className="w-full bg-bgInput border border-borderCard rounded-xl px-3 py-2 text-xs font-semibold text-textPrincipal focus:outline-none focus:border-cyberCyan cursor-pointer transition-all"
              >
                {FLEET_MODELS.map((model) => (
                  <option key={model} value={model} className="bg-bgCard text-textPrincipal">
                    {model}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-textSub uppercase mb-1 tracking-wider">
              Notas / Características
            </label>
            <input
              type="text"
              placeholder="Ej: A320-NEO, SpaceFlex..."
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full bg-bgInput border border-borderCard rounded-xl px-3 py-2 text-xs text-textPrincipal placeholder:text-textSub/50 focus:outline-none focus:border-cyberCyan transition-all"
            />
          </div>

          <button
            type="submit"
            className={`w-full font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] border ${
              editingAircraft
                ? 'bg-cyberYellow text-textInverseDark border-cyberYellow'
                : 'bg-cyberPurple hover:opacity-90 text-white border-cyberPurpleBorder'
            }`}
          >
            {editingAircraft ? (
              <>
                <Edit3 className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Agregar a la Flota</span>
              </>
            )}
          </button>
        </form>

        {errorMessage && (
          <div className="bg-bgInput border border-rose-500/50 text-rose-400 p-3 rounded-xl text-[11px] flex items-center gap-2.5 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Buscador */}
        <div className="relative pt-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-textSub" />
          <input
            type="text"
            placeholder="Buscar por matrícula, modelo o nota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bgInput border border-borderCard rounded-xl pl-9 pr-3 py-2 text-xs text-textPrincipal placeholder:text-textSub/50 focus:outline-none focus:border-cyberCyan transition-all"
          />
        </div>

        {/* Lista de Matrículas */}
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {filteredAndSortedAircrafts.map((ac) => {
            const isSelected = editingAircraft?.id === ac.id;
            return (
              <div 
                key={ac.id || ac.tailNumber}
                onClick={() => handleSelectForEdit(ac)}
                className={`group border rounded-xl px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-bgCardHeader border-cyberYellow text-textPrincipal ring-1 ring-cyberYellow/30'
                    : 'bg-bgInput/50 border-borderCard hover:border-textSub/30 hover:bg-bgCardHeader'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black font-mono tracking-wider text-cyberCyan">
                      {ac.tailNumber}
                    </span>
                    <span className="text-[10px] font-extrabold bg-bgCardHeader text-cyberYellow border border-borderCard px-1.5 py-0.5 rounded-md">
                      {ac.model}
                    </span>
                  </div>
                  {ac.notes && (
                    <div className="flex items-center gap-1.5 text-[11px] text-textSub">
                      <Info className="w-3 h-3 text-cyberCyan/80 shrink-0" />
                      <span className="line-clamp-1">{ac.notes}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(ac);
                  }}
                  className="text-textSub hover:text-rose-400 p-1.5 rounded-lg hover:bg-bgCardHeader transition-colors cursor-pointer"
                  title="Eliminar matrícula"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          {filteredAndSortedAircrafts.length === 0 && (
            <div className="text-center py-8 text-xs text-textSub bg-bgInput/30 border border-dashed border-borderCard rounded-xl">
              No se encontraron matrículas registradas.
            </div>
          )}
        </div>

      </div>

      {/* Modales desacoplados */}
      <UpdateAircraftModal
        isOpen={showUpdateModal}
        aircraft={editingAircraft}
        onClose={() => setShowUpdateModal(false)}
        onConfirm={confirmUpdate}
      />

      <DeleteAircraftModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <ImportAnalysisModal
        pendingImport={pendingImport}
        showReplaceConfirm={showReplaceConfirm}
        showNewList={showNewList}
        setShowNewList={setShowNewList}
        showExistingList={showExistingList}
        setShowExistingList={setShowExistingList}
        onExecuteImport={executeImport}
        onShowReplaceConfirm={() => setShowReplaceConfirm(true)}
        onCancel={() => setPendingImport(null)}
      />

      <ReplaceConfirmModal
        isOpen={showReplaceConfirm}
        pendingImport={pendingImport}
        totalAircrafts={aircrafts.length}
        onClose={() => setShowReplaceConfirm(false)}
        onConfirm={executeImport}
      />

    </div>
  );
}