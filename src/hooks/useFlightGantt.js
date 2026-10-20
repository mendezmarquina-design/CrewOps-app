import { useState, useMemo, useEffect } from 'react';
import { db } from '../db';
import { GANTT_TEMPLATES, calculateMilestoneTimes } from '../utils/ganttTemplates';
import { resolveGanttTemplateWithReason } from '../utils/ganttMatcher';
import { addMinutesToTime, calculateMinutesDifference, createFlightUpdatePayload } from '../utils/flightUtils';

export function useFlightGantt(flight, onUpdateFlight) {
  // Carga dinámica de la ruta (Ej: "SCL-ANF")
  const selectedRoute = useMemo(() => {
    if (flight?.route) return flight.route.trim();
    if (flight?.origin && flight?.destination) {
      return `${flight.origin.trim()}-${flight.destination.trim()}`;
    }
    return 'SCL-ANF';
  }, [flight]);

  // Extrae los primeros 3 caracteres como Origen y los últimos 3 como Destino
  const { origin: selectedOrigin, destination: selectedDestination } = useMemo(() => {
    const routeStr = selectedRoute || '';
    const parts = routeStr.split('-');

    // Si viene en formato "SCL-ANF" extrae directamente
    const rawOrigin = parts[0] ? parts[0].trim().slice(0, 3) : '';
    const rawDest = parts[1] ? parts[1].trim().slice(-3) : '';

    return {
      origin: rawOrigin || flight?.origin || 'SCL',
      destination: rawDest || flight?.destination || 'ANF'
    };
  }, [selectedRoute, flight]);

  const [selectedAircraft, setSelectedAircraft] = useState(flight?.aircraftType || 'A320');
  const [selectedFlightType, setSelectedFlightType] = useState(flight?.flightType || 'DOM');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  const displayEtd = flight?.etd || flight?.std || flight?.departureTime || '12:00';
  const displayEta = flight?.eta || flight?.sta || flight?.arrivalTime || '14:00';

  const availableTemplates = useMemo(() => {
    const filtered = GANTT_TEMPLATES.filter(
      (t) => t.aircraftType?.toUpperCase() === selectedAircraft.toUpperCase()
    );
    return filtered.length > 0 ? filtered : GANTT_TEMPLATES;
  }, [selectedAircraft]);

  // Matcher Origen (Utiliza Origen de 3 letras)
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

  // Matcher Destino (Utiliza Destino de 3 letras)
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

  const [selectedTemplateOriginId, setSelectedTemplateOriginId] = useState(originMatch.templateId);
  const [selectedTemplateDestId, setSelectedTemplateDestId] = useState(destMatch.templateId);
  const [originReason, setOriginReason] = useState(originMatch.reason);
  const [destReason, setDestReason] = useState(destMatch.reason);

  const currentOriginTemplate = useMemo(() => {
    return availableTemplates.find((t) => t.id === selectedTemplateOriginId) || availableTemplates[0] || GANTT_TEMPLATES[0];
  }, [selectedTemplateOriginId, availableTemplates]);

  const currentDestTemplate = useMemo(() => {
    return availableTemplates.find((t) => t.id === selectedTemplateDestId) || availableTemplates[0] || GANTT_TEMPLATES[0];
  }, [selectedTemplateDestId, availableTemplates]);

  const [selectedTAT, setSelectedTAT] = useState(flight?.tat || currentOriginTemplate.tat || 35);

  useEffect(() => {
    if (flight) {
      if (flight.aircraftType) setSelectedAircraft(flight.aircraftType);
      if (flight.flightType) setSelectedFlightType(flight.flightType);
      if (flight.tat) setSelectedTAT(flight.tat);

      setSelectedTemplateOriginId(flight.ganttTemplateOriginId || flight.ganttTemplateId || originMatch.templateId);
      setSelectedTemplateDestId(flight.ganttTemplateDestId || destMatch.templateId);
      setOriginReason(originMatch.reason);
      setDestReason(destMatch.reason);
    }
  }, [flight, originMatch, destMatch]);

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

  const syncChangesToParent = async (updatedFields = {}) => {
    const tmplOriginId = updatedFields.ganttTemplateOriginId || selectedTemplateOriginId;
    const tmplDestId = updatedFields.ganttTemplateDestId || selectedTemplateDestId;
    const templateOriginToUse = GANTT_TEMPLATES.find((t) => t.id === tmplOriginId) || currentOriginTemplate;
    const timesOrigin = calculateMilestoneTimes(displayEtd, templateOriginToUse.milestones);
    const cpTime = timesOrigin.find((m) => m.key === 'cierre_puertas')?.calculatedTime || addMinutesToTime(displayEtd, -8);

    const payload = createFlightUpdatePayload({
      ...flight,
      route: selectedRoute,
      origin: selectedOrigin,
      destination: selectedDestination,
      aircraftType: updatedFields.aircraftType || selectedAircraft,
      flightType: updatedFields.flightType || selectedFlightType,
      ganttTemplateId: tmplOriginId,
      ganttTemplateOriginId: tmplOriginId,
      ganttTemplateDestId: tmplDestId,
      tat: updatedFields.tat !== undefined ? updatedFields.tat : selectedTAT,
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
  };

  const handleAircraftChange = (e) => {
    const newAircraft = e.target.value;
    setSelectedAircraft(newAircraft);

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

    setSelectedTemplateOriginId(originRes.templateId);
    setSelectedTemplateDestId(destRes.templateId);
    setOriginReason(originRes.reason);
    setDestReason(destRes.reason);

    if (originTmpl) {
      setSelectedTAT(originTmpl.tat);
    }

    syncChangesToParent({
      aircraftType: newAircraft,
      ganttTemplateOriginId: originRes.templateId,
      ganttTemplateDestId: destRes.templateId,
      tat: originTmpl ? originTmpl.tat : selectedTAT
    });
  };

  const handleTemplateOriginChange = (e) => {
    const newId = e.target.value;
    setSelectedTemplateOriginId(newId);
    setOriginReason('Selección manual previa');
    syncChangesToParent({ ganttTemplateOriginId: newId });
  };

  const handleTemplateDestChange = (e) => {
    const newId = e.target.value;
    setSelectedTemplateDestId(newId);
    setDestReason('Selección manual previa');
    syncChangesToParent({ ganttTemplateDestId: newId });
  };

  const handleResetGantt = () => {
    const originRes = resolveGanttTemplateWithReason({
      origin: selectedOrigin,
      aircraftType: selectedAircraft,
      flightType: selectedFlightType,
      positionType: flight?.positionType || 'MANGA',
      tat: selectedTAT,
      time: displayEtd
    }, availableTemplates);

    const destRes = resolveGanttTemplateWithReason({
      origin: selectedDestination,
      destination: selectedDestination,
      aircraftType: selectedAircraft,
      flightType: selectedFlightType,
      positionType: flight?.positionType || 'MANGA',
      tat: selectedTAT,
      time: displayEta
    }, availableTemplates);

    setSelectedTemplateOriginId(originRes.templateId);
    setSelectedTemplateDestId(destRes.templateId);
    setOriginReason(originRes.reason);
    setDestReason(destRes.reason);

    syncChangesToParent({
      ganttTemplateId: null,
      ganttTemplateOriginId: null,
      ganttTemplateDestId: null
    });
  };

  const handleTATChange = (e) => {
    const newTAT = Number(e.target.value);
    setSelectedTAT(newTAT);
    syncChangesToParent({ tat: newTAT });
  };

  const handleFlightTypeChange = (e) => {
    const newFlightType = e.target.value;
    setSelectedFlightType(newFlightType);
    syncChangesToParent({ flightType: newFlightType });
  };

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
      setSelectedAircraft,
      setSelectedFlightType,
      setSelectedTAT,
      setSearchTerm,
      setActiveTab,
      setSelectedTemplateOriginId,
      setSelectedTemplateDestId,
      handleAircraftChange,
      handleTemplateOriginChange,
      handleTemplateDestChange,
      handleResetGantt,
      handleTATChange,
      handleFlightTypeChange,
      syncChangesToParent
    }
  };
}// ultima funcional