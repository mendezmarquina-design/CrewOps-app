// src/components/flight-itinerary/FlightSelector.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Pin,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Configuración del gesto de swipe
const SWIPE_THRESHOLD = 50;
const SWIPE_MAX_TIME = 300;

export default function FlightSelector({
  selectedFlight,
  selectedDate,
  dayFlights = [],
  pinnedFlightId,
  onDateChange,
  onSelectFlight,
  onTogglePin,
  onNewFlight,
  onDoubleClickFlight // ✅ NUEVA PROP: para ir a Gestión de Itinerarios
}) {
  const currentDateStr = selectedDate || new Date().toISOString().split('T')[0];
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const [y, m] = currentDateStr.split('-').map(Number);
    return new Date(y, m - 1, 1);
  });
  const calendarRef = useRef(null);
  const flightListRef = useRef(null);
  const touchStartRef = useRef(null);
  const [swipeDirection, setSwipeDirection] = useState(null);

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

  const handleCardTouchStart = useCallback((e) => {
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
    if (!touchStartRef.current) return;
    if (isCalendarOpen) return;
    const { x: startX, y: startY, time: startTime } = touchStartRef.current;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    const timeDiff = Date.now() - startTime;
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
    const isFastEnough = timeDiff < SWIPE_MAX_TIME;
    const isLongEnough = Math.abs(deltaX) > SWIPE_THRESHOLD;
    if (isHorizontal && isFastEnough && isLongEnough) {
      const direction = deltaX < 0 ? 'left' : 'right';
      setSwipeDirection(direction);
      setTimeout(() => setSwipeDirection(null), 200);
      if (deltaX < 0) {
        handleDayShift(1);
      } else {
        handleDayShift(-1);
      }
    }
  }, [currentDateStr, onDateChange, isCalendarOpen]);

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

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // ✅ Handler para doble click en un vuelo
  const handleDoubleClickFlight = useCallback((flight) => {
    if (onDoubleClickFlight) {
      onDoubleClickFlight(flight);
    }
  }, [onDoubleClickFlight]);

  return (
    <>
      <div
        className={`bg-bgCard border border-borderCard rounded-2xl p-3.5 space-y-3 shadow-sm max-w-md mx-auto transition-all duration-200 ${
          swipeDirection === 'left' ? 'translate-x-1 opacity-80' :
          swipeDirection === 'right' ? '-translate-x-1 opacity-80' : ''
        }`}
        onTouchStart={handleCardTouchStart}
        onTouchEnd={handleCardTouchEnd}
      >
        {/* Contenedor de Fecha */}
        <div className="flex items-center justify-between gap-2 flex-1 relative" ref={calendarRef}>
          <button
            type="button"
            onClick={() => handleDayShift(-1)}
            title="Día anterior"
            className="h-11 w-11 flex items-center justify-center rounded-xl bg-bgInput border border-borderCard text-textSub hover:text-cyberCyan hover:border-cyberCyan/40 active:scale-95 transition-all shrink-0 cursor-pointer shadow-xs"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

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
                  <span key={d} className="text-[10px] font-bold text-textSub uppercase">{d}</span>
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

          <button
            type="button"
            onClick={() => handleDayShift(1)}
            title="Día siguiente"
            className="h-11 w-11 flex items-center justify-center rounded-xl bg-bgInput border border-borderCard text-textSub hover:text-cyberCyan hover:border-cyberCyan/40 active:scale-95 transition-all shrink-0 cursor-pointer shadow-xs"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="sm:hidden flex justify-center -mt-1">
          <span className="text-[9px] text-textSub/60 font-mono flex items-center gap-1 select-none">
            <ChevronLeft className="w-2.5 h-2.5" />
            desliza para cambiar día
            <ChevronRight className="w-2.5 h-2.5" />
          </span>
        </div>

        {/* Listado de Vuelos del Día */}
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
                  {/* ✅ Botón con click simple y doble click */}
                  <button
                    type="button"
                    onClick={() => onSelectFlight(f)}
                    onDoubleClick={() => handleDoubleClickFlight(f)}
                    title="Click: seleccionar · Doble click: abrir en Gestión de Itinerarios"
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
    </>
  );
}