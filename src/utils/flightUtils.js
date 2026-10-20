// src/utils/flightUtils.js

// ---------------------------------------------------------------------------
// 1. OPERACIONES Y CÁLCULOS DE TIEMPO REUTILIZABLES
// ---------------------------------------------------------------------------

export const addMinutesToTime = (timeStr, minutesToAdd) => {
  if (!timeStr || timeStr === '--:--' || isNaN(minutesToAdd)) return '--:--';
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return '--:--';

  let totalMins = h * 60 + m + Number(minutesToAdd);
  totalMins = (totalMins + 1440) % 1440;

  const hours = String(Math.floor(totalMins / 60)).padStart(2, '0');
  const mins = String(totalMins % 60).padStart(2, '0');
  return `${hours}:${mins}`;
};

export const timeToMinutes = (timeStr) => {
  if (!timeStr || timeStr === '--:--' || !timeStr.includes(':')) return null;
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
};

export const calculateMinutesDifference = (startTimeStr, endTimeStr) => {
  if (!startTimeStr || !endTimeStr || startTimeStr === '--:--' || endTimeStr === '--:--') return null;
  const [sH, sM] = startTimeStr.split(':').map(Number);
  const [eH, eM] = endTimeStr.split(':').map(Number);
  if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return null;

  let startMins = sH * 60 + sM;
  let endMins = eH * 60 + eM;
  if (endMins < startMins) endMins += 24 * 60; // Soporta cruce de medianoche

  return endMins - startMins;
};

export const calculateDelay = (scheduled, real) => {
  if (!scheduled || !real || scheduled === '--:--' || real === '--:--' || real === '--: --') return null;
  const [sH, sM] = scheduled.split(':').map(Number);
  const [rH, rM] = real.split(':').map(Number);
  if (isNaN(sH) || isNaN(sM) || isNaN(rH) || isNaN(rM)) return null;

  const scheduledMinutes = sH * 60 + sM;
  const realMinutes = rH * 60 + rM;
  return realMinutes - scheduledMinutes;
};

export const calculateDuration = (startTime, endTime) => {
  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  if (startMins === null || endMins === null) return null;

  let diffMinutes = endMins - startMins;
  if (diffMinutes < 0) diffMinutes += 24 * 60;

  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
};

// ---------------------------------------------------------------------------
// 2. ESTRUCTURACIÓN DE PAYLOADS DE PERSISTENCIA Y SELECCIÓN DE VUELOS
// ---------------------------------------------------------------------------

export const createFlightUpdatePayload = (updates = {}) => ({
  ...updates,
  synced: false,
  updatedAt: new Date().toISOString()
});

export const buildBriefingPayload = (briefingNotes, spndList) => createFlightUpdatePayload({
  briefingNotes: (briefingNotes || '').trim(),
  spndList: spndList || []
});

export const resolveActiveFlight = (dayFlights = [], selectedId = null, pinnedId = null, currentTimeStr = '00:00') => {
  if (!dayFlights || dayFlights.length === 0) return null;

  if (selectedId !== null && selectedId !== undefined) {
    const match = dayFlights.find((f) => String(f.id) === String(selectedId));
    if (match) return match;
  }

  if (pinnedId !== null && pinnedId !== undefined) {
    const match = dayFlights.find((f) => String(f.id) === String(pinnedId));
    if (match) return match;
  }

  return dayFlights.find((f) => (f.etd || '00:00') >= currentTimeStr) || dayFlights[dayFlights.length - 1];
};

// ---------------------------------------------------------------------------
// 3. PARSEO DE ITINERARIOS / ROSTER (ICS)
// ---------------------------------------------------------------------------

export const parseRosterIcs = (icsText) => {
  const flights = [];
  const unfoldedText = icsText.replace(/\r?\n[ \t]/g, '');
  const events = unfoldedText.split('BEGIN:VEVENT');

  events.slice(1).forEach((eventBlock) => {
    const summaryMatch = eventBlock.match(/SUMMARY:(.*)/);
    const dtStartMatch = eventBlock.match(/DTSTART(?:;VALUE=DATE)?:(.*)/);
    const dtEndMatch = eventBlock.match(/DTEND:(.*)/);

    if (!summaryMatch || !dtStartMatch) return;

    const summary = summaryMatch[1].trim();
    const dtStart = dtStartMatch[1].trim();
    const dtEnd = dtEndMatch ? dtEndMatch[1].trim() : '';

    if (
      summary.startsWith('Report time:') ||
      summary.startsWith('DO -') ||
      summary.startsWith('SICK -') ||
      summary.startsWith('B -')
    ) {
      return;
    }

    const flightPattern = /^(LA\s*\d+)\s+([A-Z]{3})\s*-\s*([A-Z]{3})/;
    const match = summary.match(flightPattern);

    if (match) {
      const flightNumber = match[1].replace(/\s+/g, '');
      const origin = match[2];
      const destination = match[3];
      const route = `${origin}-${destination}`;

      const date = `${dtStart.substring(0, 4)}-${dtStart.substring(4, 6)}-${dtStart.substring(6, 8)}`;
      const etd = dtStart.includes('T') ? `${dtStart.substring(9, 11)}:${dtStart.substring(11, 13)}` : '00:00';
      const eta = dtEnd.includes('T') ? `${dtEnd.substring(9, 11)}:${dtEnd.substring(11, 13)}` : '00:00';

      const uniqueId = `${flightNumber}_${date}_${route}_${etd}`;

      flights.push({
        id: uniqueId,
        flightNumber,
        date,
        route,
        tailNumber: '',
        etd,
        eta,
        atd: '',
        ata: '',
        onPista: '',
        totalPax: 0,
        synced: false
      });
    }
  });

  return flights;
};