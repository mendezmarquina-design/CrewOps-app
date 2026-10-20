import { useState, useMemo, useEffect, useCallback } from 'react';
import { db } from '../db';
import { GANTT_TEMPLATES, calculateMilestoneTimes } from '../utils/ganttTemplates';
import { resolveGanttTemplateWithReason } from '../utils/ganttMatcher';
import { addMinutesToTime, calculateMinutesDifference, createFlightUpdatePayload } from '../utils/flightUtils';

export function useFlightGantt(flight, onUpdateFlight) {
  // ---------------------------------------------------------------------------
  // 1. VALORES DERIVADOS DE LA RUTA (sin estado innecesario)
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
  // 2. ESTADOS DE INTERFAZ (solo para inputs del usuario)
  // ---------------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  // ---------------------------------------------------------------------------
  // 3. VALORES DERIVADOS DE TIEMPOS
  // ---------------------------------------------------------------------------
  const displayEtd = flight?.etd || flight?.std || flight?.departureTime || '12:00';
  const displayEta = flight?.eta || flight?.sta || flight?.arrivalTime || '14:00';

  // ---------------------------------------------------------------------------
  // 4. TEMPLATES DISPONIBLES
  // ---------------------------------------------------------------------------
  const selectedAircraft = flight?.aircraftType || 'A320';
  const selectedFlightType = flight?.flightType || 'DOM';

  const availableTemplates = useMemo(() => {
    const filtered = GANTT_TEMPLATES.filter(
      (t) => t.aircraftType?.toUpperCase() === selectedAircraft.toUpperCase()
    );
    return filtered.length > 0 ? filtered : GANTT_TEMPLATES;
  }, [selectedAircraft]);

  // ---------------------------------------------------------------------------
  // 5. MATCHERS DE TEMPLATES (Origen y Destino)
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
      tat: flight?.tat || 35,
      time: displayEtd
    }, availableTemplates);
  }, [selectedOrigin, selectedAircraft, selectedFlightType, displayEtd, flight, availableTemplates]);

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
      tat: flight?.tat || 35,
      time: displayEta
    }, availableTemplates);
  }, [selectedDestination, selectedAircraft, selectedFlightType, displayEta, flight, availableTemplates]);

  // ---------------------------------------------------------------------------
  // 6. TEMPLATES ACTUALES (derivados directamente, sin useState)
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

  const selectedTAT = flight?.tat || currentOriginTemplate.tat || 35;

  // ---------------------------------------------------------------------------
  // 7. CÁLCULO DE MILESTONES
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
  // 8. FILTRADO DE MILESTONES
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
  // 9. SINCRONIZACIÓN A LA BASE DE DATOS (con useCallback)
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
  // 10. HANDLERS DE EVENTOS
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
  // 11. RETURN
  // ---------------------------------------------------------------------------
  return {
    state: {
      selectedRoute,
      selectedOrigin,
      selectedDestination,
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