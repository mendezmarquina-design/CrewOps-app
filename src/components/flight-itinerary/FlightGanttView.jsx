import React from 'react';
import { useFlightGantt } from '../../hooks/useFlightGantt';
import BackButton from '../common/BackButton';
import StickyFlightBar from '../common/StickyFlightBar';
import { Search, X, Sparkles, RotateCcw } from 'lucide-react';

const AIRCRAFT_TYPES = ['A320', 'A321', 'A320neo', 'A321neo', 'B787'];
const FLIGHT_TYPES = ['DOM', 'INT'];
const TAT_OPTIONS = [30, 35, 40, 45, 50, 60];

export default function FlightGanttView({ flight, onBack, onUpdateFlight }) {
  const { state, actions } = useFlightGantt(flight, onUpdateFlight);

  const {
    selectedRoute,
    selectedAircraft,
    selectedFlightType,
    selectedTAT,
    selectedTemplateOriginId,
    selectedTemplateDestId,
    originReason,
    destReason,
    searchTerm,
    activeTab,
    displayEtd,
    displayEta,
    displayArriboAvionTime,
    groundTimeCalculated,
    cierrePuertasHito,
    availableTemplates,
    filteredMilestones
  } = state;

  const handleBackAndSave = async () => {
    await actions.syncChangesToParent();
    if (onBack) onBack();
  };

  return (
    <div className="bg-bgApp text-textMain min-h-screen p-3 sm:p-5 font-sans">
      <div className="max-w-md mx-auto space-y-3">

        {/* BARRA PEGAJOSA DE FLIGHT INFO */}
        <StickyFlightBar flight={flight} />
        
        <BackButton onClick={handleBackAndSave} title="Volver a Control de Vuelos" />

        {/* CARD PRINCIPAL CON CONTROLES */}
        <div className="bg-bgCard border-borderCard rounded-3xl p-4 border shadow-sm space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-textSub text-[10px] font-black uppercase tracking-wider block mb-1">VUELO</span>
              <div className="bg-bgInput border-borderCard rounded-2xl py-2 px-1 flex items-center justify-center border">
                <span className="text-cyberCoral text-sm font-black italic">
                  {flight?.flightNumber || 'LA310'}
                </span>
              </div>
            </div>

            {/* RUTA / TRAMO CARGADA AUTOMÁTICAMENTE DESDE FLIGHT */}
            <div>
              <span className="text-textSub text-[10px] font-black uppercase tracking-wider block mb-1">RUTA / TRAMO</span>
              <div className="bg-bgInput border-borderCard rounded-2xl py-2 px-1 flex items-center justify-center border">
                <span className="text-cyberCyan text-sm font-black font-mono tracking-wider">
                  {selectedRoute}
                </span>
              </div>
            </div>

            <div>
              <span className="text-textSub text-[10px] font-black uppercase tracking-wider block mb-1">CIERRE PUERTAS</span>
              <div className="bg-bgInput border-borderCard rounded-2xl py-2 px-1 flex items-center justify-center border">
                <span className="text-cyberCoral text-sm font-black font-mono">
                  {cierrePuertasHito?.calculatedTime || '--:--'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1 items-stretch">
            <div className="bg-bgCardHeader border-borderCard rounded-2xl p-2 flex flex-col justify-between space-y-1.5 border">
              <div>
                <span className="text-textSub text-[8px] font-black uppercase block mb-1">ARRIBO AVIÓN</span>
                <div className="bg-bgInput border-borderCard rounded-xl py-1 border">
                  <span className="text-cyberGreen text-xs font-black font-mono">{displayArriboAvionTime}</span>
                </div>
              </div>
              <div>
                <span className="text-textSub text-[8px] font-black uppercase block mb-1">TIPO DE AVIÓN</span>
                <select
                  value={selectedAircraft}
                  onChange={actions.handleAircraftChange}
                  className="bg-bgInput border-borderCard text-textMain w-full border font-black text-xs rounded-xl py-1 text-center outline-none cursor-pointer"
                >
                  {AIRCRAFT_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-bgCardHeader border-borderCard rounded-2xl p-2 flex flex-col justify-between space-y-1.5 border">
              <div>
                <span className="text-textSub text-[8px] font-black uppercase block mb-1">GROUND TIME</span>
                <div className="bg-bgInput border-borderCard rounded-xl py-1 border">
                  <span className="text-cyberYellow text-xs font-black font-mono">{groundTimeCalculated}</span>
                </div>
              </div>
              <div>
                <span className="text-textSub text-[8px] font-black uppercase block mb-1">TAT</span>
                <select
                  value={selectedTAT}
                  onChange={actions.handleTATChange}
                  className="bg-bgInput border-borderCard text-cyberGreen w-full border font-black text-xs rounded-xl py-1 text-center outline-none font-mono cursor-pointer"
                >
                  {TAT_OPTIONS.map((tat) => (
                    <option key={tat} value={tat}>{tat} MIN</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-bgCardHeader border-borderCard rounded-2xl p-2 flex flex-col justify-between space-y-1.5 border">
              <div>
                <span className="text-textSub text-[8px] font-black uppercase block mb-1">DEPARTURE (ETD)</span>
                <div className="bg-bgInput border-borderCard rounded-xl py-1 border">
                  <span className="text-cyberGreen text-xs font-black font-mono">{displayEtd}</span>
                </div>
              </div>
              <div>
                <span className="text-textSub text-[8px] font-black uppercase block mb-1">TIPO VUELO</span>
                <select
                  value={selectedFlightType}
                  onChange={actions.handleFlightTypeChange}
                  className="bg-bgInput border-borderCard text-cyberYellow w-full border font-black text-xs rounded-xl py-1 text-center outline-none font-mono cursor-pointer"
                >
                  {FLIGHT_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* COMBOBOXES DE CARTAS GANTT (ORIGEN Y DESTINO) */}
          <div className="space-y-2 pt-1">
            {/* ORIGEN */}
            <div className="bg-bgCardHeader border-borderCard rounded-2xl p-2.5 space-y-1 border">
              <label className="text-cyberCyan text-[10px] font-black uppercase block text-center">
                1. GANTT ORIGEN (SALIDA ETD: {displayEtd})
              </label>
              <select
                value={selectedTemplateOriginId}
                onChange={actions.handleTemplateOriginChange}
                className="bg-bgInput border-borderCard text-textMain w-full border font-bold text-xs rounded-xl p-2 text-center outline-none cursor-pointer"
              >
                {availableTemplates.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.name} ({tmpl.tat} min TAT)
                  </option>
                ))}
              </select>

              <div className="flex items-center justify-center gap-1 text-[9px] text-textSub font-medium pt-0.5">
                <Sparkles className="w-2.5 h-2.5 text-cyberCyan" />
                <span>{originReason}</span>
              </div>
            </div>

            {/* DESTINO */}
            <div className="bg-bgCardHeader border-borderCard rounded-2xl p-2.5 space-y-1 border">
              <label className="text-cyberYellow text-[10px] font-black uppercase block text-center">
                2. GANTT DESTINO (LLEGADA ETA: {displayEta})
              </label>
              <select
                value={selectedTemplateDestId}
                onChange={actions.handleTemplateDestChange}
                className="bg-bgInput border-borderCard text-textMain w-full border font-bold text-xs rounded-xl p-2 text-center outline-none cursor-pointer"
              >
                {availableTemplates.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.name} ({tmpl.tat} min TAT)
                  </option>
                ))}
              </select>

              <div className="flex items-center justify-center gap-1 text-[9px] text-textSub font-medium pt-0.5">
                <Sparkles className="w-2.5 h-2.5 text-cyberYellow" />
                <span>{destReason}</span>
              </div>
            </div>
          </div>

          {/* BOTÓN DE REESTABLECER GANTT */}
          <button
            type="button"
            onClick={actions.handleResetGantt}
            className="w-full py-2 px-3 bg-bgInput hover:bg-bgCardHeader border border-borderCard rounded-xl text-textSub hover:text-textMain font-bold text-[11px] flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyberCyan" />
            <span>Restablecer Gantt Automática</span>
          </button>
        </div>

        {/* BOTÓN DE GUARDAR FUERA DE LA CARD */}
        <button
          type="button"
          onClick={handleBackAndSave}
          className="bg-accentGreen hover:bg-emerald-500 text-textInverseDark font-black text-xs w-full py-3.5 px-4 rounded-2xl shadow-md uppercase transition-all active:scale-95 cursor-pointer border border-emerald-400/30"
        >
          Guardar y Sincronizar Vuelo
        </button>

        {/* SECCIÓN DE HITOS */}
        <div className="bg-bgCard border-borderCard rounded-3xl p-4 border shadow-sm space-y-3">
          
          {/* BUSCADOR DE HITOS */}
          <div className="relative">
            <Search className="w-4 h-4 text-textSub absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => actions.setSearchTerm(e.target.value)}
              placeholder="Buscar hito..."
              className="bg-bgInput border-borderCard text-textMain w-full border font-semibold text-xs rounded-2xl py-2.5 pl-9 pr-9 outline-none focus:border-cyberCyan transition-colors placeholder:text-textSub/60"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => actions.setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-textSub hover:text-textMain transition-colors p-0.5 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* TABS DE FILTRADO */}
          <div className="bg-bgInput p-1 rounded-xl flex gap-1 text-[11px]">
            {['ALL', 'ORIGEN', 'DESTINO', 'TC', 'SAB'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => actions.setActiveTab(tab)}
                className={`flex-1 py-1.5 font-black rounded-lg transition-all cursor-pointer ${
                  activeTab === tab ? 'bg-accentBlue text-textInverseDark shadow' : 'text-textSub'
                }`}
              >
                {tab === 'ALL' ? 'Todos' : tab}
              </button>
            ))}
          </div>

          {/* LISTA DE HITOS FILTRADOS */}
          <div className="space-y-2 pt-1">
            {filteredMilestones.length > 0 ? (
              filteredMilestones.map((m, index) => {
                const titleText = m.title || m.label || '';
                const isArribo = titleText.toLowerCase().includes('llegada del avion') || titleText.toLowerCase().includes('arribo');
                const itemTime = isArribo ? displayArriboAvionTime : m.calculatedTime;

                return (
                  <div key={`${m.id}-${index}`} className="p-3 rounded-2xl border border-borderCard bg-bgInput flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                          m.phase === 'ORIGEN' ? 'bg-cyberCyan/20 text-cyberCyan' : 'bg-cyberYellow/20 text-cyberYellow'
                        }`}>
                          {m.phase}
                        </span>
                        <h4 className="text-xs font-bold text-textMain">{titleText}</h4>
                      </div>
                      {m.duration > 0 && <span className="text-textSub text-[10px] font-semibold">{m.duration} min</span>}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black font-mono text-cyberGreen">{itemTime}</span>
                      <span className="text-textSub text-[10px] font-bold block font-mono">{m.offsetLabel} min</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-textSub text-xs font-bold bg-bgInput border border-borderCard rounded-2xl">
                No se encontraron hitos para "{searchTerm}"
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}