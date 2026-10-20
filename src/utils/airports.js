// Lista de códigos IATA de aeropuertos nacionales de Chile
export const CHILEAN_AIRPORTS = new Set([
  // Zona Norte
  'ARI',  // Arica
  'IQQ',  // Iquique
  'ANF',  // Antofagasta
  'CJC',  // Calama (El Loa)
  'TOQ',  // Tocopilla
  'ESR',  // El Salvador
  'CPO',  // Copiapó
  'LSC',  // La Serena (La Florida)
  'SCL',  // Santiago (Arturo Merino Benítez)
  
  // Zona Sur
  'KNA',  // Viña del Mar (Rodelillo)
  'QRC',  // Rancagua
  'TLX',  // Talca
  'CCP',  // Concepción (Carriel Sur)
  'ZCO',  // Temuco (Maquehue)
  'ZAL',  // Valdivia (Pichoy)
  'ZOS',  // Osorno (Canal Bajo)
  'WCA',  // Castro (Gamboa)
  'WCH',  // Chaitén
  'WAP',  // Alto Palena
  'PMC',  // Puerto Montt (El Tepual)
  'ZPC',  // Pucón
  'GXQ',  // Coyhaique (Balmaceda)
  'BBA',  // Balmaceda
  'WPA',  // Puerto Aysén
  'PNT',  // Puerto Natales
  'PUQ',  // Punta Arenas (Presidente Ibáñez)
  'WPU',  // Puerto Williams
  'WPR',  // Porvenir
  'MHC',  // Balmaceda (código alternativo)
]);

/**
 * Determina si un vuelo es doméstico (DOM) o internacional (INT)
 * @param {string} origin - Código IATA de origen
 * @param {string} destination - Código IATA de destino
 * @returns {'DOM' | 'INT'}
 */
export const determineFlightType = (origin, destination) => {
  if (!origin || !destination) return 'DOM'; // Por defecto
  
  const originCode = origin.trim().toUpperCase();
  const destCode = destination.trim().toUpperCase();
  
  const isOriginChilean = CHILEAN_AIRPORTS.has(originCode);
  const isDestChilean = CHILEAN_AIRPORTS.has(destCode);
  
  // Si ambos aeropuertos están en Chile → DOM
  // Si alguno es extranjero → INT
  return (isOriginChilean && isDestChilean) ? 'DOM' : 'INT';
};

/**
 * Verifica si un aeropuerto es chileno
 */
export const isChileanAirport = (airportCode) => {
  if (!airportCode) return false;
  return CHILEAN_AIRPORTS.has(airportCode.trim().toUpperCase());
};