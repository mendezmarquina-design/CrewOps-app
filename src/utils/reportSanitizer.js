// src/utils/reportSanitizer.js

export const DEFAULT_KIT = {
  id: 1,
  tipoKit: 'EMK',
  estadoFinal: 'Operativo',
  insumos: '',
  selloRetirado: 'Verde',
  selloColocado: 'Amarillo',
  nroSelloRetirado: '',
  nroSelloColocado: ''
};

export const DEFAULT_MEDICAL_DATA = {
  paxNombre: '',
  paxAsiento: '',
  paxId: '',
  paxTelefono: '',
  paxEmail: '',
  paxAcompanante: '',
  sintomas: '',
  signosVitales: '',
  enfermedadesBase: '',
  accionesTC: '',
  existeMedico: false,
  docNombre: '',
  docApellido: '',
  docAsiento: '',
  docProfesion: '',
  docRegMedico: '',
  docDiagnostico: '',
  docTratamiento: '',
  abrioBotiquin: false,
  kits: [DEFAULT_KIT]
};

export const DEFAULT_REPORT = {
  id: '',
  category: 'Solicitud PAX',
  titulo: '',
  asiento: '',
  pasajero: '',
  observacion: '',
  realizaCUS: false,
  tipoCUS: 'Informativo',
  flightNumber: '',
  route: '',
  atencionMedica: DEFAULT_MEDICAL_DATA
};

export const sanitizeReport = (data = {}) => ({
  ...DEFAULT_REPORT,
  ...data,
  category: data?.category || 'Solicitud PAX',
  atencionMedica: {
    ...DEFAULT_MEDICAL_DATA,
    ...(data?.atencionMedica || {}),
    kits: (data?.atencionMedica?.kits && data.atencionMedica.kits.length > 0)
      ? data.atencionMedica.kits
      : [DEFAULT_KIT]
  }
});