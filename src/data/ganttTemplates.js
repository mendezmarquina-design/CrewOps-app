// src/data/ganttTemplates.js
import ganttData from './ganttTemplates.json';

export const GANTT_VERSION = ganttData.version || '1.0.0';
export const GANTT_TEMPLATES = ganttData.templates || [];

export const getTemplateById = (templateId) => {
  return GANTT_TEMPLATES.find((template) => template.id === templateId) || null;
};

// Suma o resta minutos a una hora HH:MM manteniendo ciclo 24h
const addMinutesToTime = (timeStr, minsToAdd) => {
  if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) return '--:--';
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return '--:--';

  let totalMins = h * 60 + m + Number(minsToAdd);
  totalMins = (totalMins % 1440 + 1440) % 1440;

  const hours = String(Math.floor(totalMins / 60)).padStart(2, '0');
  const minutes = String(totalMins % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Calcula las horas HH:MM exactas según la ETD dada
 */
export const calculateMilestoneTimes = (etdString, milestones = []) => {
  if (!etdString || !etdString.includes(':')) return [];

  return milestones.map((m) => {
    const startTimeStr = addMinutesToTime(etdString, m.offset);
    const endOffset = m.offset + (m.duration || 0);
    const endTimeStr = addMinutesToTime(etdString, endOffset);

    return {
      ...m,
      calculatedTime: startTimeStr,
      calculatedEndTime: endTimeStr,
      offsetLabel: m.offset > 0 ? `+${m.offset}` : `${m.offset}`
    };
  });
};