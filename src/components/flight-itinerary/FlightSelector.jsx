// src/components/flight-itinerary/FlightSelector.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { db } from '../../db';
import {
  Calendar as CalendarIcon,
  Upload,
  Plus,
  Pin,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { parseRosterIcs } from '../../utils/flightUtils';

// Configuración del gesto de swipe
const SWIPE_THRESHOLD = 50; // px mínimos para considerar un swipe válido
const SWIPE_MAX_TIME = 300; // ms máximos para que el gesto sea considerado rápido

export default function FlightSelector({
  selectedFlight,
  selectedDate,
  dayFlights = [],
  pinnedFlightId,
  onDateChange,
  onSelectFlight,
  onTogglePin,
  onNewFlight
}) {
  const currentDateStr = selectedDate || new Date().toISOString().split('T')[0];
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Estado para el mes/año visible en el calendario flotante
  const [viewDate, setViewDate] = useState(() => {
    const [y, m] = currentDateStr.split('-').map(Number);
    return new Date(y, m - 1, 1);
  });

  const calendarRef = useRef(null);

  // ✨ Refs para el gesto de swipe
  const flightListRef = useRef(null); // Ref de la lista de vuelos (para excluirla del swipe)
  const touchStartRef = useRef(null);
  const [swipeDirection, setSwipeDirection] = useState(null);

  // Modal para alertas de importación .ics
  const [importModal, setImportModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  // Cerrar el calendario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCalendarOpen]);

  const formatDateToDDMMYY = (dateString) => {
    if (!dateString) return '';
    const [yyyy, mm, dd] = dateString.split('-');
    if (!yyyy || !mm || !dd) return dateString;
    return `${dd}-${mm}-${yyyy}`;
  };

  const handleDayShift = (days) => {
    const [year, month, day] = currentDateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    dateObj.setDate(dateObj.getDate() + days);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const newDateStr = `${yyyy}-${mm}-${dd}`;
    if (onDateChange) onDateChange(newDateStr);
    setViewDate(new Date(yyyy, dateObj.getMonth(), 1));
  };

  // ✨ GESTOS DE SWIPE EN TODA LA CARD (excepto en la lista de vuelos)
  const handleCardTouchStart = useCallback((e) => {
    // Si el toque inicia en la lista de vuelos, no aplicar swipe (permitir scroll normal)
    if (flightListRef.current && flightListRef.current.contains(e.target)) {
      touchStartRef.current = null;
      return;
    }

    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  }, []);

  const handleCardTouchEnd = useCallback((e) => {
    // Si el touch inició en la lista de vuelos, no hacer nada
    if (!touchStartRef.current) return;

    // Si el calendario está abierto, no aplicar swipe (evitar cambios accidentales)
    if (isCalendarOpen) return;

    const { x: startX, y: startY, time: startTime } = touchStartRef.current;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    const timeDiff = Date.now() - startTime;

    // Debe ser un gesto rápido, más horizontal que vertical, y con distancia suficiente
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
    const isFastEnough = timeDiff < SWIPE_MAX_TIME;
    const isLongEnough = Math.abs(deltaX) > SWIPE_THRESHOLD;

    if (isHorizontal && isFastEnough && isLongEnough) {
      const direction = deltaX < 0 ? 'left' : 'right';
      setSwipeDirection(direction);
      setTimeout(() => setSwipeDirection(null), 200);

      // Swipe izquierda → día siguiente | Swipe derecha → día anterior
      if (deltaX < 0) {
        handleDayShift(1);
      } else {
        handleDayShift(-1);
      }
    }
  }, [currentDateStr, onDateChange, isCalendarOpen]);

  const handleIcsUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsedFlights = parseRosterIcs(text);
      if (parsedFlights.length > 0) {
        await db.flights.bulkPut(parsedFlights);
        setImportModal({
          isOpen: true,
          title: 'IMPORTACIÓN EXITOSA',
          message: `¡Éxito! Se importaron ${parsedFlights.length} tramos de vuelo correctamente.`,
          type: 'success'
        });
      } else {
        setImportModal({
          isOpen: true,
          title: 'SIN RESULTADOS',
          message: 'No se encontraron tramos de vuelo válidos en el archivo seleccionado.',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Error al procesar .ics:', err);
      setImportModal({
        isOpen: true,
        title: 'ERROR AL IMPORTAR',
        message: 'Ocurrió un error al leer el archivo .ics.',
        type: 'error'
      });
    }
    e.target.value = '';
  };

  const closeImportModal = useCallback(() => {
    setImportModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // --- LÓGICA DEL CALENDARIO PERSONALIZADO ---
  const handleMonthChange = (offset) => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const handleSelectDay = (day) => {
    const yyyy = viewDate.getFullYear();
    const mm = String(viewDate.getMonth() + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const newDateStr = `${yyyy}-${mm}-${dd}`;
    if (onDateChange) onDateChange(newDateStr);
    setIsCalendarOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const newDateStr = `${yyyy}-${mm}-${dd}`;
    setViewDate(new Date(yyyy, today.getMonth(), 1));
    if (onDateChange) onDateChange(newDateStr);
    setIsCalendarOpen(false);
  };

  // Matriz de días del mes
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Lunes = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <>
      {/* ✨ CARD PRINCIPAL CON GESTOS DE SWIPE */}
      <div
        className={`bg-bgCard border border-borderCard rounded-2xl p-3.5 space-y-3 shadow-sm max-w-md mx-auto transition-all duration-200 ${
          swipeDirection === 'left'
            ? 'translate-x-1 opacity-80'
            : swipeDirection === 'right'
            ? '-translate-x-1 opacity-80'
            : ''
        }`}
        onTouchStart={handleCardTouchStart}
        onTouchEnd={handleCardTouchEnd}
      >
        {/* Contenedor de Fecha e Importador */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center justify-between gap-2 flex-1 relative" ref={calendarRef}>
            {/* Día Anterior */}
            <button
              type="button"
              onClick={() => handleDayShift(-1)}
              title="Día anterior"
              className="h-11 w-11 flex items-center justify-center rounded-xl bg-bgInput border border-borderCard text-textSub hover:text-cyberCyan hover:border-cyberCyan/40 active:scale-95 transition-all shrink-0 cursor-pointer shadow-xs"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* BOTÓN CALENDARIO */}
            <button
              type="button"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className={`flex-1 h-11 bg-bgInput border rounded-xl px-3 flex items-center justify-center gap-2 transition-all cursor-pointer select-none active:scale-95 ${
                isCalendarOpen
                  ? 'border-cyberCyan shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                  : 'border-borderCard hover:border-cyberCyan/40'
              }`}
            >
              <CalendarIcon className="w-4 h-4 text-cyberCyan shrink-0" />
              <span className="text-sm font-bold font-mono text-textPrincipal tracking-wider">
                {formatDateToDDMMYY(currentDateStr)}
              </span>
            </button>

            {/* POPUP / MODAL DEL CALENDARIO DARK THEME */}
            {isCalendarOpen && (
              <div className="absolute top-13 left-1/2 -translate-x-1/2 z-50 w-72 bg-bgCard border border-borderCard rounded-2xl p-4 shadow-2xl animate-scaleUp">
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => handleMonthChange(-1)}
                    className="p-1 rounded-lg bg-bgInput border border-borderCard text-textSub hover:text-cyberCyan transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-textPrincipal uppercase tracking-wide">
                    {monthNames[month]} {year}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleMonthChange(1)}
                    className="p-1 rounded-lg bg-bgInput border border-borderCard text-textSub hover:text-cyberCyan transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map((d) => (
                    <span key={d} className="text-[10px] font-bold text-textSub uppercase">
                      {d}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNumber = i + 1;
                    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                    const isSelected = dayStr === currentDateStr;
                    const today = new Date();
                    const isToday =
                      today.getFullYear() === year &&
                      today.getMonth() === month &&
                      today.getDate() === dayNumber;
                    return (
                      <button
                        key={dayNumber}
                        type="button"
                        onClick={() => handleSelectDay(dayNumber)}
                        className={`h-8 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center ${
                          isSelected
                            ? 'bg-cyberCyan text-black font-black shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                            : isToday
                            ? 'border border-cyberCyan text-cyberCyan bg-cyberCyan/10'
                            : 'text-textMain hover:bg-bgInput hover:text-cyberCyan'
                        }`}
                      >
                        {dayNumber}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 pt-2 border-t border-borderCard/50 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={handleSelectToday}
                    className="text-[10px] font-bold text-cyberCyan hover:underline cursor-pointer uppercase tracking-wider"
                  >
                    Ir a Hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(false)}
                    className="text-[10px] font-bold text-textSub hover:text-textMain cursor-pointer uppercase tracking-wider"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}

            {/* Día Siguiente */}
            <button
              type="button"
              onClick={() => handleDayShift(1)}
              title="Día siguiente"
              className="h-11 w-11 flex items-center justify-center rounded-xl bg-bgInput border border-borderCard text-textSub hover:text-cyberCyan hover:border-cyberCyan/40 active:scale-95 transition-all shrink-0 cursor-pointer shadow-xs"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Importar .ics */}
          <label className="h-11 bg-cyberCyan/10 hover:bg-cyberCyan/20 border border-cyberCyan/30 text-cyberCyan px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0 shadow-xs w-full sm:w-auto">
            <Upload className="w-4 h-4 text-cyberCyan" />
            <span>Importar .ics</span>
            <input
              type="file"
              accept=".ics"
              onChange={handleIcsUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Hint visual de swipe (solo en móvil) */}
        <div className="sm:hidden flex justify-center -mt-1">
          <span className="text-[9px] text-textSub/60 font-mono flex items-center gap-1 select-none">
            <ChevronLeft className="w-2.5 h-2.5" />
            desliza para cambiar día
            <ChevronRight className="w-2.5 h-2.5" />
          </span>
        </div>

        {/* Listado de Vuelos del Día (EXCLUIDO del swipe para permitir scroll) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-textPrincipal uppercase tracking-wider block">
              VUELOS DEL DÍA ({dayFlights.length})
            </span>
            {pinnedFlightId && (
              <span className="text-[9px] font-bold text-cyberYellow flex items-center gap-1">
                <Pin className="w-2.5 h-2.5 fill-cyberYellow" /> Vuelo anclado
              </span>
            )}
          </div>
          {/* ✨ Ref en la lista de vuelos para excluirla del swipe */}
          <div
            ref={flightListRef}
            className="flex items-center gap-2 overflow-x-auto px-2 py-1 scrollbar-none flex-nowrap"
          >
            {dayFlights.map((f) => {
              const isSelected = String(selectedFlight?.id) === String(f.id);
              const isPinned = String(pinnedFlightId) === String(f.id);
              const formattedFlightNumber = (f.flightNumber || '').replace(/\s+/g, '');
              return (
                <div key={f.id} className="relative group shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectFlight(f)}
                    className={`px-3.5 py-1.5 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 border min-w-[75px] ${
                      isSelected
                        ? 'bg-bgInput border-cyberCyan shadow-[0_0_12px_rgba(6,182,212,0.2)] ring-1 ring-cyberCyan/40'
                        : 'bg-bgCardHeader/40 border-borderCard hover:border-cyberCyan/40 hover:bg-bgInput/50 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <span className={`text-sm font-bold italic tracking-tight flex items-center gap-1 ${
                      isSelected ? 'text-textPrincipal' : 'text-textMain'
                    }`}>
                      {formattedFlightNumber}
                      {isPinned && <Pin className="w-2.5 h-2.5 fill-cyberYellow text-cyberYellow" />}
                    </span>
                    <span className={`text-[9px] font-bold font-mono tracking-wider ${
                      isSelected ? 'text-cyberCyan' : 'text-textSub'
                    }`}>
                      {f.route}
                    </span>
                  </button>
                  {isSelected && onTogglePin && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(f.id);
                      }}
                      title={isPinned ? 'Desfijar vuelo' : 'Fijar vuelo'}
                      className={`absolute -top-1 -right-1 p-1 rounded-full border transition-all cursor-pointer ${
                        isPinned
                          ? 'bg-cyberYellow text-black border-cyberYellow shadow-md'
                          : 'bg-bgCard border-borderCard text-textSub hover:text-cyberYellow'
                      }`}
                    >
                      <Pin className={`w-2.5 h-2.5 ${isPinned ? 'fill-black' : ''}`} />
                    </button>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              onClick={onNewFlight}
              className="px-3.5 py-1.5 rounded-xl flex flex-col items-center justify-center border border-dashed border-borderCard hover:border-cyberCyan/60 bg-bgCardHeader/20 hover:bg-bgInput/50 text-textSub hover:text-cyberCyan transition-all cursor-pointer active:scale-95 shrink-0 min-w-[65px] h-[42px]"
              title="Agregar vuelo manualmente"
            >
              <Plus className="w-4 h-4 mb-0.5" />
              <span className="text-[8px] font-bold uppercase tracking-tight">Nuevo</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL PERSONALIZADO DE IMPORTACIÓN */}
      {importModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
          onClick={closeImportModal}
        >
          <div
            className="bg-bgCard border border-borderCard text-textMain rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center space-y-4 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-sm border ${
              importModal.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-cyberCoral/10 border-cyberCoral/20 text-cyberCoral'
            }`}>
              {importModal.type === 'success' ? (
                <CheckCircle2 className="w-8 h-8 stroke-[1.75]" />
              ) : (
                <AlertCircle className="w-8 h-8 stroke-[1.75]" />
              )}
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-cyberCyan uppercase tracking-tight">
                {importModal.title}
              </h3>
              <p className="text-xs text-textSub font-medium leading-relaxed">
                {importModal.message}
              </p>
            </div>
            <div className="w-full pt-2">
              <button
                type="button"
                onClick={closeImportModal}
                className="w-full bg-cyberCyan/20 hover:bg-cyberCyan/30 border border-cyberCyan/40 text-textMain font-bold text-xs py-3 px-4 rounded-2xl transition-all cursor-pointer active:scale-95"
              >
                ACEPTAR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}