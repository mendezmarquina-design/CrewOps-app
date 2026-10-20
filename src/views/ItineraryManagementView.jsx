// src/views/ItineraryManagementView.jsx
import React, { useRef } from 'react';
import { 
  PlusCircle, 
  Calendar, 
  Search, 
  Trash2, 
  Plus,
  Edit3,
  Save,
  RotateCcw,
  Clock
} from 'lucide-react';
import BackButton from '../components/common/BackButton';
import { useItineraryManagement, formatDateDDMMYYYY } from '../hooks/useItineraryManagement';
import { TailNumberModal, DeleteConfirmationModal, TimePickerModal } from '../components/modals/ItineraryModals';

export default function ItineraryManagementView({ onBack }) {
  const {
    formData,
    setFormData,
    editingFlightId,
    flightToDeleteId,
    setFlightToDeleteId,
    isTailModalOpen,
    setIsTailModalOpen,
    tailSearchQuery,
    setTailSearchQuery,
    timePickerConfig,
    handleOpenTimePicker,
    handleSaveTime,
    handleCloseTimePicker,
    filterMode,
    setFilterMode,
    filterDay,
    setFilterDay,
    filterMonth,
    setFilterMonth,
    filterYear,
    setFilterYear,
    filterFlight,
    setFilterFlight,
    flights,
    filteredAircrafts,
    handleFlightNumberChange,
    handleRouteChange,
    handleSelectFlight,
    handleCancelEdit,
    handleSubmit,
    confirmDeleteFlight
  } = useItineraryManagement();

  // Referencias para forzar despliegue de selectores al presionar cualquier punto
  const formDateRef = useRef(null);
  const filterDayRef = useRef(null);
  const filterMonthRef = useRef(null);

  const openPicker = (ref) => {
    if (ref.current) {
      if ('showPicker' in HTMLInputElement.prototype) {
        ref.current.showPicker();
      } else {
        ref.current.click();
      }
    }
  };

  // Helper para formato de mes MM-YYYY
  const formatMMYYYY = (monthStr) => {
    if (!monthStr) return '-- / ----';
    const [yyyy, mm] = monthStr.split('-');
    return `${mm}-${yyyy}`;
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-10 text-textPrincipal font-sans transition-colors duration-200">
      
      {/* Botón Volver Reutilizable */}
      <BackButton onClick={onBack} />

      {/* FORMULARIO DE EDICIÓN Y CREACIÓN */}
      <div className={`bg-bgCard border ${editingFlightId ? 'border-cyberYellow/80' : 'border-borderCard'} rounded-2xl p-4 space-y-4 shadow-md transition-all`}>
        <div className={`flex items-center gap-2 font-extrabold text-xs tracking-wider uppercase ${editingFlightId ? 'text-cyberYellow' : 'text-cyberCyan'}`}>
          {editingFlightId ? <Edit3 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
          <span>{editingFlightId ? 'Editar Vuelo Seleccionado' : 'Agregar Nuevo Vuelo al Itinerario'}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {/* Fecha de Vuelo */}
          <div className="space-y-1">
            <label className="text-[9px] font-extrabold text-textSub uppercase tracking-wider block">
              Fecha de Vuelo
            </label>
            <button
              type="button"
              onClick={() => openPicker(formDateRef)}
              className="relative w-full bg-bgInput border border-borderCard hover:border-cyberCyan/40 rounded-2xl px-3 h-11 flex items-center justify-center gap-2 focus-within:border-cyberCyan/50 transition-all cursor-pointer active:scale-98"
            >
              <Calendar className="w-4 h-4 text-cyberCyan shrink-0 pointer-events-none" />
              <span className="text-xs text-textPrincipal font-bold font-mono tracking-wider pointer-events-none">
                {formatDateDDMMYYYY(formData.date) || 'DD-MM-YYYY'}
              </span>
              <input
                ref={formDateRef}
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </button>
          </div>

          {/* Grid 3 Columnas: N° Vuelo / Ruta / Matrícula */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[9px] font-extrabold text-textSub uppercase tracking-wider block mb-1 text-center">
                N° Vuelo
              </label>
              <div className="bg-bgInput border border-borderCard rounded-2xl h-11 flex items-center justify-center px-2 focus-within:border-cyberCyan/50">
                <input
                  type="text"
                  placeholder="LA777"
                  value={formData.flightNumber}
                  onChange={(e) => handleFlightNumberChange(e.target.value)}
                  className="bg-transparent text-cyberYellow font-extrabold italic text-xs text-center w-full focus:outline-none tracking-wider"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-extrabold text-textSub uppercase tracking-wider block mb-1 text-center">
                Ruta / Tramo
              </label>
              <input
                type="text"
                placeholder="GIG-SCL"
                value={formData.route}
                onChange={(e) => handleRouteChange(e.target.value)}
                maxLength={7}
                className="bg-bgInput border border-borderCard rounded-2xl h-11 text-center text-cyberCyan font-extrabold text-xs tracking-wider w-full focus:outline-none focus:border-cyberCyan/50 px-2 placeholder:text-textSub placeholder:font-bold"
              />
            </div>

            <div>
              <label className="text-[9px] font-extrabold text-textSub uppercase tracking-wider block mb-1 text-center">
                Matrícula
              </label>
              <button
                type="button"
                onClick={() => setIsTailModalOpen(true)}
                className="bg-bgInput border border-borderCard rounded-2xl h-11 flex items-center justify-center text-center text-cyberGreen font-extrabold text-xs tracking-wider w-full focus:outline-none focus:border-cyberCyan/50 hover:bg-bgCardHeader transition-all truncate px-2 cursor-pointer"
              >
                {formData.tailNumber || 'CC-XXX'}
              </button>
            </div>
          </div>

          {/* ETD / ETA con botones TimePickerModal */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-extrabold text-textSub uppercase tracking-wider block mb-1 text-center">
                ETD (Hora Salida)
              </label>
              <button
                type="button"
                onClick={() => handleOpenTimePicker('etd', 'Seleccionar ETD')}
                className="bg-bgInput border border-borderCard hover:border-cyberCyan/50 rounded-2xl h-11 w-full flex items-center justify-center gap-2 text-cyberGreen font-bold text-xs font-mono transition-all cursor-pointer active:scale-98"
              >
                <Clock className="w-4 h-4 text-cyberGreen/70" />
                <span>{formData.etd || '-- : --'}</span>
              </button>
            </div>

            <div>
              <label className="text-[9px] font-extrabold text-textSub uppercase tracking-wider block mb-1 text-center">
                ETA (Hora Llegada)
              </label>
              <button
                type="button"
                onClick={() => handleOpenTimePicker('eta', 'Seleccionar ETA')}
                className="bg-bgInput border border-borderCard hover:border-cyberCyan/50 rounded-2xl h-11 w-full flex items-center justify-center gap-2 text-cyberYellow font-bold text-xs font-mono transition-all cursor-pointer active:scale-98"
              >
                <Clock className="w-4 h-4 text-cyberYellow/70" />
                <span>{formData.eta || '-- : --'}</span>
              </button>
            </div>
          </div>

          {/* Botones de Acción */}
          {editingFlightId ? (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="w-full bg-bgInput hover:bg-bgCardHeader border border-borderCard text-textSub font-bold h-11 rounded-2xl text-xs flex items-center justify-center gap-1 transition-all active:scale-98 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Cancelar</span>
              </button>
              <button
                type="submit"
                className="w-full bg-cyberYellow/20 hover:bg-cyberYellow/30 border border-cyberYellow/50 text-cyberYellow font-bold h-11 rounded-2xl text-xs flex items-center justify-center gap-1 transition-all shadow-xs active:scale-98 cursor-pointer uppercase"
              >
                <Save className="w-4 h-4" />
                <span>Actualizar</span>
              </button>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full bg-cyberPurple hover:opacity-90 text-white font-extrabold h-11 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 cursor-pointer tracking-wider border-cyberPurpleBorder"
            >
              <Plus className="w-4 h-4" />
              <span>Guardar Vuelo</span>
            </button>
          )}

        </form>
      </div>

      {/* VUELOS PROGRAMADOS */}
      <div className="bg-bgCard border border-borderCard rounded-2xl p-4 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyberCyan font-extrabold text-xs tracking-wider uppercase">
            <Calendar className="w-4 h-4" />
            <span>Vuelos Programados ({flights.length})</span>
          </div>
        </div>

        {/* Selector de Filtro de Modo */}
        <div className="flex bg-bgInput border border-borderCard rounded-xl p-1 gap-1 text-[10px] font-bold">
          {['day', 'month', 'year', 'all'].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilterMode(mode)}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer capitalize ${
                filterMode === mode
                  ? 'bg-cyberCyan/20 text-cyberCyan border border-cyberCyan/40'
                  : 'text-textSub hover:text-textPrincipal'
              }`}
            >
              {mode === 'day' ? 'Día' : mode === 'month' ? 'Mes' : mode === 'year' ? 'Año' : 'Todos'}
            </button>
          ))}
        </div>

        {/* Inputs de Filtro */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[9px] font-extrabold text-textSub uppercase tracking-wider block text-center">
              Filtro de Fecha
            </span>

            {filterMode === 'day' && (
              <button
                type="button"
                onClick={() => openPicker(filterDayRef)}
                className="relative w-full bg-bgInput border border-borderCard hover:border-cyberCyan/40 rounded-2xl px-3 h-10 flex items-center justify-center transition-all cursor-pointer active:scale-98"
              >
                <span className="text-xs text-textPrincipal font-mono font-bold pointer-events-none">
                  {formatDateDDMMYYYY(filterDay) || 'DD-MM-YYYY'}
                </span>
                <input
                  ref={filterDayRef}
                  type="date"
                  value={filterDay}
                  onChange={(e) => setFilterDay(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </button>
            )}

            {filterMode === 'month' && (
              <button
                type="button"
                onClick={() => openPicker(filterMonthRef)}
                className="relative w-full bg-bgInput border border-borderCard hover:border-cyberCyan/40 rounded-2xl px-3 h-10 flex items-center justify-center transition-all cursor-pointer active:scale-98"
              >
                <span className="text-xs text-textPrincipal font-mono font-bold pointer-events-none">
                  {formatMMYYYY(filterMonth)}
                </span>
                <input
                  ref={filterMonthRef}
                  type="month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </button>
            )}

            {filterMode === 'year' && (
              <div className="bg-bgInput border border-borderCard rounded-2xl px-3 h-10 flex items-center justify-center focus-within:border-cyberCyan/50">
                <input
                  type="number"
                  min="2020"
                  max="2035"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="bg-transparent text-center text-xs text-textPrincipal font-mono font-bold w-full focus:outline-none"
                />
              </div>
            )}

            {filterMode === 'all' && (
              <div className="bg-bgInput/50 border border-borderCard rounded-2xl px-3 h-10 flex items-center justify-center text-xs text-textPrincipal font-bold font-mono select-none">
                Todos los Vuelos
              </div>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-extrabold text-textSub uppercase tracking-wider block text-center">
              N° Vuelo
            </span>
            <div className="bg-bgInput border border-borderCard rounded-2xl px-3 h-10 flex items-center justify-center gap-2 focus-within:border-cyberCyan/50">
              <Search className="w-3.5 h-3.5 text-textSub shrink-0" />
              <input
                type="text"
                placeholder="Ej. 777"
                value={filterFlight}
                onChange={(e) => setFilterFlight(e.target.value)}
                className="bg-transparent text-xs text-center text-textPrincipal font-bold w-full focus:outline-none placeholder:text-textSub"
              />
            </div>
          </div>
        </div>

        {/* Lista de Vuelos */}
        <div className="space-y-2 pt-1 max-h-[300px] overflow-y-auto scrollbar-none">
          {flights.map((f) => {
            const isSelected = editingFlightId === f.id;
            return (
              <div
                key={f.id}
                onClick={() => handleSelectFlight(f)}
                className={`border rounded-2xl p-3 flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyberYellow/10 border-cyberYellow/80 shadow-xs ring-1 ring-cyberYellow/50'
                    : 'bg-bgInput/40 border-borderCard hover:border-cyberCyan/40 hover:bg-bgCardHeader'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-extrabold text-cyberCyan font-mono block tracking-wide">
                    {formatDateDDMMYYYY(f.date)}
                  </span>

                  <div className="text-xs font-bold flex items-center gap-2 flex-wrap">
                    <span className="text-cyberYellow italic font-black text-xs">
                      {f.flightNumber}
                    </span>
                    <span className="text-textPrincipal font-black tracking-wider text-xs">
                      {f.route}
                    </span>
                    {f.tailNumber && (
                      <span className="text-cyberGreen text-xs font-mono font-bold">
                        ({f.tailNumber})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFlightToDeleteId(f.id);
                    }}
                    className="p-1.5 text-textSub hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                    title="Eliminar Vuelo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {flights.length === 0 && (
            <p className="text-center text-xs text-textSub italic py-4">
              No hay vuelos que coincidan con el filtro seleccionado.
            </p>
          )}
        </div>
      </div>

      {/* MODALES */}
      <TailNumberModal
        isOpen={isTailModalOpen}
        onClose={() => setIsTailModalOpen(false)}
        searchQuery={tailSearchQuery}
        onSearchChange={setTailSearchQuery}
        aircrafts={filteredAircrafts}
        onSelectTail={(tailNumber) => {
          setFormData((prev) => ({ ...prev, tailNumber }));
          setIsTailModalOpen(false);
          setTailSearchQuery('');
        }}
      />

      <DeleteConfirmationModal
        isOpen={Boolean(flightToDeleteId)}
        onClose={() => setFlightToDeleteId(null)}
        onConfirm={confirmDeleteFlight}
      />

      <TimePickerModal
        isOpen={timePickerConfig.isOpen}
        title={timePickerConfig.title}
        initialValue={
          timePickerConfig.field ? formData[timePickerConfig.field] : '00:00'
        }
        onClose={handleCloseTimePicker}
        onSave={handleSaveTime}
      />

    </div>
  );
}