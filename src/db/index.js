import Dexie from 'dexie';

export const db = new Dexie('FlightControlDB');

// Esquema Base (Versión 1)
db.version(1).stores({
  flights: 'id, date, flightNumber, route, tailNumber, synced',
  aircrafts: '++id, tailNumber, model'
});

// Esquema Definitivo (Versión 2) - Una sola tabla "gces"
db.version(2).stores({
  flights: 'id, date, flightNumber, route, tailNumber, synced',
  aircrafts: '++id, tailNumber, model',
  gces: '++id, flightId, flightNumber, date, name, bp, qrhReviewed',
  documents: '++id, title, category, updatedAt'
}).upgrade(tx => {
  return tx.table('flights').toCollection().modify(flight => {
    if (!flight.gceList) flight.gceList = [];
  });
});

// Datos iniciales
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

  db.aircrafts.bulkAdd([
    { tailNumber: 'CC-BBA', model: '787-9', notes: 'Crew Rest Modificado' },
    { tailNumber: 'CC-BER', model: 'A321', notes: 'Air Berlin' },
    { tailNumber: 'CC-BHZ', model: 'A320', notes: 'A320-NEO, Nueva Cabina' },
  ]);
});