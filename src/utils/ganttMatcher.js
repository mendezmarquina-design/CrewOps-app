import ganttRules from '../data/ganttRules.json';
import ganttTemplatesData from '../data/ganttTemplates.json';

const GANTT_TEMPLATES = ganttTemplatesData.templates || [];

/**
 * Normaliza textos para comparaciones seguras.
 */
const normalize = (val) => (val ? String(val).trim().toUpperCase() : '');

/**
 * Convierte un string de hora "HH:MM" a minutos desde el inicio del día (0 - 1439).
 */
export function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

/**
 * Verifica si un tiempo en minutos está dentro de un rango [start, end].
 */
export function isTimeInRange(timeStr, startStr, endStr) {
  const current = timeToMinutes(timeStr);
  const start = timeToMinutes(startStr);
  const end = timeToMinutes(endStr);

  if (current === null || start === null || end === null) return false;

  if (start <= end) {
    return current >= start && current <= end;
  } else {
    return current >= start || current <= end;
  }
}

/**
 * Evalúa si el contexto del vuelo cumple con las condiciones definidas en una regla de JSON.
 */
function matchRuleConditions(conditions = {}, context = {}) {
  const ctxOrigin = normalize(context.origin);
  const ctxDest = normalize(context.destination);
  const ctxAircraft = normalize(context.aircraftType);
  const ctxFlightType = normalize(context.flightType);
  const ctxPosition = normalize(context.positionType);
  const ctxTat = context.tat !== undefined && context.tat !== null ? Number(context.tat) : null;
  const ctxTime = context.time;

  if (conditions.origin && !conditions.origin.map(normalize).includes(ctxOrigin)) return false;
  if (conditions.destination && !conditions.destination.map(normalize).includes(ctxDest)) return false;
  if (conditions.aircraftType && !conditions.aircraftType.map(normalize).includes(ctxAircraft)) return false;
  if (conditions.flightType && !conditions.flightType.map(normalize).includes(ctxFlightType)) return false;
  if (conditions.positionType && !conditions.positionType.map(normalize).includes(ctxPosition)) return false;

  if (conditions.tat && ctxTat !== null && !conditions.tat.includes(ctxTat)) return false;
  if (conditions.minTat !== undefined && (ctxTat === null || ctxTat < conditions.minTat)) return false;
  if (conditions.maxTat !== undefined && (ctxTat === null || ctxTat > conditions.maxTat)) return false;

  if (conditions.isTatMinNotified !== undefined) {
    if (Boolean(context.isTatMinNotified) !== Boolean(conditions.isTatMinNotified)) return false;
  }

  if (conditions.timeRange && ctxTime) {
    const { start, end } = conditions.timeRange;
    if (!isTimeInRange(ctxTime, start, end)) return false;
  }

  return true;
}

/**
 * Evalúa las reglas de una plantilla por puntuación cuando no hay reglas explícitas coincidentes.
 */
export function evaluateTemplateScore(template, context = {}) {
  let score = 0;

  const ctxOrigin = normalize(context.origin || context.destination);
  const ctxAircraft = normalize(context.aircraftType);
  const ctxFlightType = normalize(context.flightType);
  const ctxTat = context.tat ? Number(context.tat) : null;
  const ctxTime = context.time;

  const tmplAircraft = normalize(template.aircraftType);
  if (tmplAircraft) {
    if (tmplAircraft === ctxAircraft || tmplAircraft.includes(ctxAircraft)) {
      score += 100;
    } else {
      return -1;
    }
  }

  if (template.timeRange && ctxTime) {
    const { start, end } = template.timeRange;
    if (isTimeInRange(ctxTime, start, end)) {
      score += 40;
    }
  }

  if (template.airports && Array.isArray(template.airports)) {
    if (template.airports.map(normalize).includes(ctxOrigin)) {
      score += 30;
    }
  } else if (template.origin && normalize(template.origin) === ctxOrigin) {
    score += 30;
  }

  const tmplFlightType = normalize(template.flightType);
  if (tmplFlightType && tmplFlightType === ctxFlightType) {
    score += 20;
  }

  if (template.tat && ctxTat && Number(template.tat) === ctxTat) {
    score += 10;
  }

  if (template.isDefault) {
    score += 1;
  }

  return score;
}

/**
 * Resuelve la mejor plantilla Gantt y devuelve su ID junto con el motivo del match.
 */
export function resolveGanttTemplateWithReason(
  context = {},
  templatesList = GANTT_TEMPLATES,
  rules = ganttRules
) {
  // 1. Prioridad: Evaluación de reglas (ganttRules.json)
  if (rules && Array.isArray(rules)) {
    for (const rule of rules) {
      if (matchRuleConditions(rule.conditions, context)) {
        return {
          templateId: rule.templateId,
          reason: `Regla aplicada: ${rule.description} (${rule.id})`
        };
      }
    }
  }

  // 2. Fallback: Puntuación directa sobre las plantillas
  if (templatesList && templatesList.length > 0) {
    let bestMatch = null;
    let highestScore = -1;

    for (const template of templatesList) {
      const score = evaluateTemplateScore(template, context);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = template;
      }
    }

    if (bestMatch && highestScore >= 0) {
      return {
        templateId: bestMatch.id,
        reason: `Plantilla asignada por coincidencia general (${bestMatch.name})`
      };
    }
  }

  // 3. Fallback final por defecto
  const defaultTemplate = templatesList.find((t) => t.isDefault) || templatesList[0];
  return {
    templateId: defaultTemplate ? defaultTemplate.id : 'la_dom_a320_35',
    reason: 'Plantilla por defecto (sin reglas ni coincidencias directas)'
  };
}

export function resolveGanttTemplateId(
  context = {},
  templatesList = GANTT_TEMPLATES,
  rules = ganttRules
) {
  return resolveGanttTemplateWithReason(context, templatesList, rules).templateId;
}