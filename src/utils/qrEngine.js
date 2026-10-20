// src/utils/qrEngine.js

const cleanPayload = (obj) => {
  if (Array.isArray(obj)) {
    const arr = obj.map(i => typeof i === 'object' && i !== null ? cleanPayload(i) : i)
                   .filter(i => i !== undefined && i !== null && i !== '');
    return arr.length > 0 ? arr : undefined;
  }
  if (typeof obj === 'object' && obj !== null) {
    const res = {};
    let has = false;
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined || v === null || v === '' || v === false) continue;
      if (typeof v === 'object') {
        const child = cleanPayload(v);
        if (child !== undefined) { res[k] = child; has = true; }
      } else {
        res[k] = v; has = true;
      }
    }
    return has ? res : undefined;
  }
  return obj;
};

export const encodeToQR = (type, payload) => {
  if (!payload) return '';
  
  // Si ya es una cadena limpia o JSON directo
  const cleaned = cleanPayload(payload);
  
  // Guardamos un mapa compacto para reducir el tamaño del QR
  const compactPacket = {
    i: cleaned.id,
    c: cleaned.category,
    t: cleaned.titulo,
    p: cleaned.pasajero,
    a: cleaned.asiento,
    o: cleaned.observacion,
    d: cleaned.createdAt,
    fn: cleaned.flightNumber,
    ac: cleaned.aircraft,
    rt: cleaned.route,
    rc: cleaned.realizaCUS ? 1 : undefined,
    tc: cleaned.tipoCUS,
    m: cleaned.atencionMedica ? {
      pn: cleaned.atencionMedica.paxNombre,
      pa: cleaned.atencionMedica.paxAsiento,
      pi: cleaned.atencionMedica.paxId,
      pt: cleaned.atencionMedica.paxTelefono,
      pe: cleaned.atencionMedica.paxEmail,
      pm: cleaned.atencionMedica.paxAcompanante,
      s: cleaned.atencionMedica.sintomas,
      sv: cleaned.atencionMedica.signosVitales,
      eb: cleaned.atencionMedica.enfermedadesBase,
      atc: cleaned.atencionMedica.accionesTC,
      em: cleaned.atencionMedica.existeMedico ? 1 : undefined,
      dn: cleaned.atencionMedica.docNombre,
      da: cleaned.atencionMedica.docApellido,
      das: cleaned.atencionMedica.docAsiento,
      dp: cleaned.atencionMedica.docProfesion,
      dr: cleaned.atencionMedica.docRegMedico,
      dd: cleaned.atencionMedica.docDiagnostico,
      dt: cleaned.atencionMedica.docTratamiento,
      ab: cleaned.atencionMedica.abrioBotiquin ? 1 : undefined,
      k: cleaned.atencionMedica.kits?.map(k => [
        k.id, k.tipoKit, k.estadoFinal, k.insumos, k.selloRetirado, k.selloColocado, k.nroSelloRetirado, k.nroSelloColocado
      ])
    } : undefined
  };

  return JSON.stringify(cleanPayload(compactPacket));
};

export const decodeFromQR = (qrString) => {
  if (!qrString || typeof qrString !== 'string') return null;

  try {
    let clean = qrString.trim().replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
    let p = JSON.parse(clean);
    if (typeof p === 'string') p = JSON.parse(p);

    // CASO 1: Si ya es un JSON completo sin abreviar (como el que copiaste)
    if (p.pasajero || p.atencionMedica || p.category) {
      return { type: 'REPORT', data: p };
    }

    // CASO 2: Si viene abreviado desde el QR compactado
    const data = {
      id: p.i || `rep_${Date.now()}`,
      category: p.c || 'Solicitud PAX',
      titulo: p.t || '',
      pasajero: p.p || '',
      asiento: p.a || '',
      observacion: p.o || '',
      createdAt: p.d || new Date().toISOString(),
      flightNumber: p.fn || '',
      aircraft: p.ac || '',
      route: p.rt || '--- ➔ ---',
      realizaCUS: Boolean(p.rc),
      tipoCUS: p.tc || 'Informativo',
      importedAt: new Date().toISOString(),
      atencionMedica: p.m ? {
        paxNombre: p.m.pn || p.p || '',
        paxAsiento: p.m.pa || p.a || '',
        paxId: p.m.pi || '',
        paxTelefono: p.m.pt || '',
        paxEmail: p.m.pe || '',
        paxAcompanante: p.m.pm || '',
        sintomas: p.m.s || '',
        signosVitales: p.m.sv || '',
        enfermedadesBase: p.m.eb || '',
        accionesTC: p.m.atc || '',
        existeMedico: Boolean(p.m.em),
        docNombre: p.m.dn || '',
        docApellido: p.m.da || '',
        docAsiento: p.m.das || '',
        docProfesion: p.m.dp || '',
        docRegMedico: p.m.dr || '',
        docDiagnostico: p.m.dd || '',
        docTratamiento: p.m.dt || '',
        abrioBotiquin: Boolean(p.m.ab),
        kits: p.m.k ? p.m.k.map(k => ({
          id: k[0] || 1,
          tipoKit: k[1] || 'EMK',
          estadoFinal: k[2] || 'Operativo',
          insumos: k[3] || '',
          selloRetirado: k[4] || '',
          selloColocado: k[5] || '',
          nroSelloRetirado: k[6] || '',
          nroSelloColocado: k[7] || ''
        })) : []
      } : null
    };

    return { type: 'REPORT', data };
  } catch (e) {
    console.error("Error al decodificar QR:", e);
    return null;
  }
};