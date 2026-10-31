import Dexie from 'dexie';

export const db = new Dexie('FlightControlDB');

db.version(1).stores({
  flights: 'id, date, flightNumber, route, tailNumber, synced',
  aircrafts: '++id, tailNumber, model'
});

db.version(2).stores({
  flights: 'id, date, flightNumber, route, tailNumber, synced, flightType, origin, destination',
  aircrafts: '++id, tailNumber, model',
  gces: '++id, flightId, flightNumber, date, name, bp, qrhReviewed',
  documents: '++id, title, category, updatedAt'
}).upgrade(tx => {
  return tx.table('flights').toCollection().modify(flight => {
    if (!flight.gceList) flight.gceList = [];
  });
});

// ✨ NUEVO: Datos semilla de matrículas (siempre disponibles)
export const SEED_AIRCRAFTS = [
  { tailNumber: 'CC-BBA', model: '787-9', notes: 'Crew Rest Modificado' },
  { tailNumber: 'CC-BER', model: 'A321', notes: 'Air Berlin' },
  { tailNumber: 'CC-BHZ', model: 'A320', notes: 'A320-NEO, Nueva Cabina' },
];

// ✨ NUEVO: Función para asegurar que existan matrículas en la DB
export async function ensureAircraftsSeed() {
  try {
    const count = await db.aircrafts.count();
    if (count === 0) {
      console.log('🌱 Seed: Insertando matrículas por defecto...');
      await db.aircrafts.bulkAdd(SEED_AIRCRAFTS);
    }
  } catch (err) {
    console.error('Error al seedear matrículas:', err);
  }
}

// Datos iniciales de vuelos (solo primera vez)
db.on('populate', () => {
  db.flights.add({
    id: 'flt-777',
    flightNumber: '777',
    prefix: 'LA',
    date: '2026-09-01',
    route: 'LEW-W',
    tailNumber: 'PS-LAA',
    etd: '19:25',
    atd: '--:--',
    eta: '23:30',
    ata: '--:--',
    onPista: '--:--',
    totalPax: 0,
    synced: false,
    briefingNotes: '',
    spndList: [],
    gceList: []
  });
});