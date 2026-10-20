import { useState, useMemo, useEffect, useCallback } from 'react';
import { db } from '../db';
import { GANTT_TEMPLATES, calculateMilestoneTimes } from '../utils/ganttTemplates';
import { resolveGanttTemplateWithReason } from '../utils/ganttMatcher';
import { addMinutesToTime, calculateMinutesDifference, createFlightUpdatePayload } from '../utils/flightUtils';
import { determineFlightType } from '../utils/airports'; // ← NUEVO

// Opciones disponibles de TAT
const TAT_OPTIONS = [30, 35, 40, 45, 50, 60];

// Función para encontrar el TAT más cercano e inferior al ground time
const findClosestLowerTAT = (groundTimeMinutes) => {
  if (!groundTimeMinutes || groundTimeMinutes <= 0) return 30;
  const validTATs = TAT_OPTIONS.filter(tat => tat <= groundTimeMinutes);
  if (validTATs.length === 0) return TAT_OPTIONS[0];
  return Math.max(...validTATs);
};

export function useFlightGantt(flight, onUpdateFlight) {
  // ---------------------------------------------------------------------------
  // 1. VALORES DERIVADOS DE LA RUTA
  // ---------------------------------------------------------------------------
  const selectedRoute = useMemo(() => {
    if (flight?.route) return flight.route.trim();
    if (flight?.origin && flight?.destination) {
      return `${flight.origin.trim()}-${flight.destination.trim()}`;
    }
    return 'SCL-ANF';
  }, [flight]);

  const { origin: selectedOrigin, destination: selectedDestination } = useMemo(() => {
    const routeStr = selectedRoute || '';
    const parts = routeStr.split('-');
    const rawOrigin = parts[0] ? parts[0].trim().slice(0, 3) : '';
    const rawDest = parts[1] ? parts[1].trim().slice(-3) : '';
    return {
      origin: rawOrigin || flight?.origin || 'SCL',
      destination: rawDest || flight?.destination || 'ANF'
    };
  }, [selectedRoute, flight]);

  // ---------------------------------------------------------------------------
  // 2. ESTADOS DE INTERFAZ
  // ---------------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  // ---------------------------------------------------------------------------
  // 3. VALORES DERIVADOS DE TIEMPOS
  // ---------------------------------------------------------------------------
  const displayEtd = flight?.etd || flight?.std || flight?.departureTime || '12:00';
  const displayEta = flight?.eta || flight?.sta || flight?.arrivalTime || '14:00';

  // ---------------------------------------------------------------------------
  // 4. TIPO DE AVIÓN FILTRADO POR MATRÍCULA
  // ---------------------------------------------------------------------------
  const [availableAircraftTypes, setAvailableAircraftTypes] = useState(['A320', 'A321', 'A320neo', 'A321neo', 'B787']);

  useEffect(() => {
    const filterAircraftByTail = async () => {
      if (!flight?.tailNumber) {
        setAvailableAircraftTypes(['A320', 'A321', 'A320neo', 'A321neo', 'B787']);
        return;
      }
      try {
        const aircraft = await db.aircrafts.where('tailNumber').equals(flight.tailNumber).first();
        if (aircraft && aircraft.model) {
          const model = aircraft.model.toUpperCase();
          const filtered = GANTT_TEMPLATES
            .filter(t => t.aircraftType?.toUpperCase() === model)
            .map(t => t.aircraftType);
          const unique = [...new Set(filtered)];
          if (unique.length > 0) {
            setAvailableAircraftTypes(unique);
          } else {
            setAvailableAircraftTypes(['A320', 'A321', 'A320neo', 'A321neo', 'B787']);
          }
        } else {
          setAvailableAircraftTypes(['A320', 'A321', 'A320neo', 'A321neo', 'B787']);
        }
      } catch (error) {
        console.error('Error filtrando tipos de avión:', error);
        setAvailableAircraftTypes(['A320', 'A321', 'A320neo', 'A321neo', 'B787']);
      }
    };
    filterAircraftByTail();
  }, [flight?.tailNumber]);

  // ---------------------------------------------------------------------------
  // 5. TIPO DE VUELO AUTOMÁTICO (DOM/INT)
  // ---------------------------------------------------------------------------
  const selectedAircraft = flight?.aircraftType || 'A320';
  
  // ✅ NUEVO: Determinar automáticamente el tipo de vuelo
  // Si el vuelo ya tiene un flightType definido manualmente, respetarlo
  const selectedFlightType = useMemo(() => {
    if (flight?.flightType) return flight.flightType;
    return determineFlightType(selectedOrigin, selectedDestination);
  }, [flight?.flightType, selectedOrigin, selectedDestination]);

  const availableTemplates = useMemo(() => {
    const filtered = GANTT_TEMPLATES.filter(
      (t) => t.aircraftType?.toUpperCase() === selectedAircraft.toUpperCase()
    );
    return filtered.length > 0 ? filtered : GANTT_TEMPLATES;
  }, [selectedAircraft]);

  // ---------------------------------------------------------------------------
  // 6. CÁLCULO AUTOMÁTICO DE TAT BASADO EN GROUND TIME
  // ---------------------------------------------------------------------------
  const calculatedTAT = useMemo(() => {
    if (!flight?.arriboAvion || flight.arriboAvion === '--:--') {
      return flight?.tat || 35;
    }
    const groundTimeMinutes = calculateMinutesDifference(flight.arriboAvion, displayEtd);
    if (groundTimeMinutes === null || groundTimeMinutes < 0) {
      return flight?.tat || 35;
    }
    const autoTAT = findClosestLowerTAT(groundTimeMinutes);
    return flight?.tat || autoTAT;
  }, [flight?.arriboAvion, flight?.tat, displayEtd]);

  // ---------------------------------------------------------------------------
  // 7. MATCHERS DE TEMPLATES
  // ---------------------------------------------------------------------------
  const originMatch = useMemo(() => {
    if (flight?.ganttTemplateOriginId || flight?.ganttTemplateId) {
      return {
        templateId: flight.ganttTemplateOriginId || flight.ganttTemplateId,
        reason: 'Selección manual previa'
      };
    }
    return resolveGanttTemplateWithReason({
      origin: selectedOrigin,
      aircraftType: selectedAircraft,
      flightType: selectedFlightType,
      positionType: flight?.positionType || 'MANGA',
      tat: calculatedTAT,
      time: displayEtd
    }, availableTemplates);
  }, [selectedOrigin, selectedAircraft, selectedFlightType, calculatedTAT, displayEtd, flight, availableTemplates]);

  const destMatch = useMemo(() => {
    if (flight?.ganttTemplateDestId) {
      return {
        templateId: flight.ganttTemplateDestId,
        reason: 'Selección manual previa'
      };
    }
    return resolveGanttTemplateWithReason({
      origin: selectedDestination,
      destination: selectedDestination,
      aircraftType: selectedAircraft,
      flightType: selectedFlightType,
      positionType: flight?.positionType || 'MANGA',
      tat: calculatedTAT,
      time: displayEta
    }, availableTemplates);
  }, [selectedDestination, selectedAircraft, selectedFlightType, calculatedTAT, displayEta, flight, availableTemplates]);

  // ---------------------------------------------------------------------------
  // 8. TEMPLATES ACTUALES
  // ---------------------------------------------------------------------------
  const selectedTemplateOriginId = flight?.ganttTemplateOriginId || flight?.ganttTemplateId || originMatch.templateId;
  const selectedTemplateDestId = flight?.ganttTemplateDestId || destMatch.templateId;
  const originReason = flight?.ganttTemplateOriginId || flight?.ganttTemplateId ? 'Selección manual previa' : originMatch.reason;
  const destReason = flight?.ganttTemplateDestId ? 'Selección manual previa' : destMatch.reason;

  const currentOriginTemplate = useMemo(() => {
    return availableTemplates.find((t) => t.id === selectedTemplateOriginId) || availableTemplates[0] || GANTT_TEMPLATES[0];
  }, [selectedTemplateOriginId, availableTemplates]);

  const currentDestTemplate = useMemo(() => {
    return availableTemplates.find((t) => t.id === selectedTemplateDestId) || availableTemplates[0] || GANTT_TEMPLATES[0];
  }, [selectedTemplateDestId, availableTemplates]);

  const selectedTAT = flight?.tat || currentOriginTemplate.tat || calculatedTAT;

  // ---------------------------------------------------------------------------
  // 9. CÁLCULO DE MILESTONES
  // ---------------------------------------------------------------------------
  const calculatedOriginMilestones = useMemo(() => {
    return calculateMilestoneTimes(displayEtd, currentOriginTemplate.milestones);
  }, [displayEtd, currentOriginTemplate]);

  const calculatedDestMilestones = useMemo(() => {
    const destTatMinutes = currentDestTemplate.tat || 0;
    const baseEtaWithTat = addMinutesToTime(displayEta, destTatMinutes);
    return calculateMilestoneTimes(baseEtaWithTat, currentDestTemplate.milestones);
  }, [displayEta, currentDestTemplate]);

  const llegadaAvionHito = calculatedOriginMilestones.find((m) => {
    const text = (m.title || m.label || '').toLowerCase();
    return text.includes('llegada del avion') || text.includes('arribo');
  });

  const displayArriboAvionTime =
    (flight?.arriboAvion && flight.arriboAvion !== '--:--' ? flight.arriboAvion : null) ||
    flight?.llegadaAvionTime ||
    llegadaAvionHito?.calculatedTime ||
    addMinutesToTime(displayEtd, -(selectedTAT || 35));

  const groundTimeCalculated = useMemo(() => {
    if (!flight?.arriboAvion || flight.arriboAvion === '--:--') {
      return '--';
    }
    const diff = calculateMinutesDifference(flight.arriboAvion, displayEtd);
    return diff !== null && diff >= 0 ? `${diff} min` : '--';
  }, [flight?.arriboAvion, displayEtd]);

  const cierrePuertasHito = calculatedOriginMilestones.find((m) => {
    const key = (m.key || '').toLowerCase();
    return key === 'cierre_puertas' || m.title?.toLowerCase().includes('cierre puertas');
  });

  // ---------------------------------------------------------------------------
  // 10. FILTRADO DE MILESTONES
  // ---------------------------------------------------------------------------
  const filteredMilestones = useMemo(() => {
    let result = [
      ...calculatedOriginMilestones.map((m) => ({ ...m, phase: 'ORIGEN' })),
      ...calculatedDestMilestones.map((m) => ({ ...m, phase: 'DESTINO' }))
    ];
    if (activeTab === 'ORIGEN') result = result.filter((m) => m.phase === 'ORIGEN');
    else if (activeTab === 'DESTINO') result = result.filter((m) => m.phase === 'DESTINO');
    else if (activeTab === 'TC') result = result.filter((m) => m.category === 'TC');
    else if (activeTab === 'SAB') result = result.filter((m) => m.category === 'SAB');
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter((m) => {
        const title = (m.title || m.label || '').toLowerCase();
        const key = (m.key || '').toLowerCase();
        return title.includes(term) || key.includes(term);
      });
    }
    return result;
  }, [calculatedOriginMilestones, calculatedDestMilestones, activeTab, searchTerm]);

  // ---------------------------------------------------------------------------
  // 11. SINCRONIZACIÓN A LA BASE DE DATOS
  // ---------------------------------------------------------------------------
  const syncChangesToParent = useCallback(async (updatedFields = {}) => {
    const tmplOriginId = updatedFields.ganttTemplateOriginId ?? selectedTemplateOriginId;
    const tmplDestId = updatedFields.ganttTemplateDestId ?? selectedTemplateDestId;
    const templateOriginToUse = GANTT_TEMPLATES.find((t) => t.id === tmplOriginId) || currentOriginTemplate;
    const timesOrigin = calculateMilestoneTimes(displayEtd, templateOriginToUse.milestones);
    const cpTime = timesOrigin.find((m) => m.key === 'cierre_puertas')?.calculatedTime || addMinutesToTime(displayEtd, -8);
    const payload = createFlightUpdatePayload({
      ...flight,
      route: selectedRoute,
      origin: selectedOrigin,
      destination: selectedDestination,
      aircraftType: updatedFields.aircraftType ?? selectedAircraft,
      flightType: updatedFields.flightType ?? selectedFlightType,
      ganttTemplateId: tmplOriginId,
      ganttTemplateOriginId: tmplOriginId,
      ganttTemplateDestId: tmplDestId,
      tat: updatedFields.tat ?? selectedTAT,
      cierrePuertasTime: cpTime,
      cierrePuerta: cpTime,
      etd: displayEtd,
      eta: displayEta,
      ...updatedFields
    });
    if (flight?.id) {
      try {
        await db.flights.update(flight.id, payload);
      } catch (err) {
        console.error('Error actualizando Dexie desde Gantt:', err);
      }
    }
    if (onUpdateFlight) onUpdateFlight(payload);
  }, [
    flight, selectedRoute, selectedOrigin, selectedDestination,
    selectedAircraft, selectedFlightType, selectedTAT,
    selectedTemplateOriginId, selectedTemplateDestId, currentOriginTemplate,
    displayEtd, onUpdateFlight
  ]);

  // ---------------------------------------------------------------------------
  // 12. HANDLERS DE EVENTOS
  // ---------------------------------------------------------------------------
  const handleAircraftChange = (e) => {
    const newAircraft = e.target.value;
    const matchingTemplates = GANTT_TEMPLATES.filter(
      (t) => t.aircraftType?.toUpperCase() === newAircraft.toUpperCase()
    );
    const originRes = resolveGanttTemplateWithReason({
      origin: selectedOrigin,
      aircraftType: newAircraft,
      flightType: selectedFlightType,
      positionType: flight?.positionType || 'MANGA',
      tat: selectedTAT,
      time: displayEtd
    }, matchingTemplates);
    const destRes = resolveGanttTemplateWithReason({
      origin: selectedDestination,
      destination: selectedDestination,
      aircraftType: newAircraft,
      flightType: selectedFlightType,
      positionType: flight?.positionType || 'MANGA',
      tat: selectedTAT,
      time: displayEta
    }, matchingTemplates);
    const originTmpl = GANTT_TEMPLATES.find((t) => t.id === originRes.templateId);
    syncChangesToParent({
      aircraftType: newAircraft,
      ganttTemplateOriginId: originRes.templateId,
      ganttTemplateDestId: destRes.templateId,
      tat: originTmpl ? originTmpl.tat : selectedTAT
    });
  };

  const handleTemplateOriginChange = (e) => {
    const newId = e.target.value;
    syncChangesToParent({ ganttTemplateOriginId: newId });
  };

  const handleTemplateDestChange = (e) => {
    const newId = e.target.value;
    syncChangesToParent({ ganttTemplateDestId: newId });
  };

  const handleResetGantt = () => {
    syncChangesToParent({
      ganttTemplateId: null,
      ganttTemplateOriginId: null,
      ganttTemplateDestId: null
    });
  };

  const handleTATChange = (e) => {
    const newTAT = Number(e.target.value);
    syncChangesToParent({ tat: newTAT });
  };

  const handleFlightTypeChange = (e) => {
    const newFlightType = e.target.value;
    syncChangesToParent({ flightType: newFlightType });
  };

  // ---------------------------------------------------------------------------
  // 13. RETURN
  // ---------------------------------------------------------------------------
  return {
    state: {
      selectedRoute,
      selectedOrigin,
      selectedDestination,
      selectedAircraft,
      selectedFlightType,
      selectedTAT,
      calculatedTAT,
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
      availableAircraftTypes,
      filteredMilestones
    },
    actions: {
      setSearchTerm,
      setActiveTab,
      handleAircraftChange,
      handleTemplateOriginChange,
      handleTemplateDestChange,
      handleResetGantt,
      handleTATChange,
      handleFlightTypeChange,
      syncChangesToParent
    }
  };
}