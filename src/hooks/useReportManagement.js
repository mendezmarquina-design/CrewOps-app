import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import jsQR from 'jsqr';
import { db } from '../db';
import { decodeFromQR } from '../utils/qrEngine';

// ---------------------------------------------------------------------------
// 1. CONSTANTES Y UTILIDADES (fuera del hook, no se recrean)
// ---------------------------------------------------------------------------
const getCategoryColor = (category) => {
  switch (category) {
    case 'Solicitud PAX':
      return { border: 'border-cyberCyan/60', text: 'text-cyberCyan', bg: 'bg-cyberCyan/10' };
    case 'Quiebre PAX':
      return { border: 'border-cyberYellow/60', text: 'text-cyberYellow', bg: 'bg-cyberYellow/10' };
    case 'Atención Médica':
      return { border: 'border-red-500/60', text: 'text-red-400', bg: 'bg-red-500/10' };
    case 'Reporte Seguridad':
      return { border: 'border-emerald-500/60', text: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    case 'Reporte Operativo':
      return { border: 'border-cyberPurpleBorder', text: 'text-cyberPurple', bg: 'bg-cyberPurple/10' };
    case 'Quiebre de Servicio':
      return { border: 'border-amber-500/60', text: 'text-amber-400', bg: 'bg-amber-500/10' };
    default:
      return { border: 'border-borderCard', text: 'text-cyberCyan', bg: 'bg-cyberCyan/10' };
  }
};

// Helper para limpiar campos internos de un reporte
const cleanReportData = (report) => {
  const { flightId, originalIndex, flightDate, rawFlightDate, internalId, ...cleanReport } = report;
  return cleanReport;
};

// Helper para formatear fecha
const formatFlightDate = (rawDate) => {
  if (!rawDate) return 'S/F';
  return rawDate.split('-').reverse().join('/');
};

// ---------------------------------------------------------------------------
// 2. HOOK PRINCIPAL
// ---------------------------------------------------------------------------
export function useReportManagement() {
  // ---------------------------------------------------------------------------
  // 2.1 ESTADOS
  // ---------------------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modales y estados de flujo
  const [selectedReport, setSelectedReport] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [qrModalReport, setQrModalReport] = useState(null);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [manualJson, setManualJson] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [mailReport, setMailReport] = useState(null);
  const [targetEmail, setTargetEmail] = useState('control@empresa.com');

  // Refs para cámara
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const animationFrameRef = useRef(null);

  // ---------------------------------------------------------------------------
  // 2.2 CONSULTA EN VIVO A DEXIE
  // ---------------------------------------------------------------------------
  const flights = useLiveQuery(() => db.flights.toArray(), []) || [];

  // ---------------------------------------------------------------------------
  // 2.3 MAPEO DE REPORTES (memoizado)
  // ---------------------------------------------------------------------------
  const allReports = useMemo(() => {
    return flights.flatMap((flight) => {
      const flightReports = flight.reports || [];
      return flightReports.map((rep, idx) => {
        const rawDate = flight.date || rep.createdAt?.split('T')[0] || '';
        return {
          ...rep,
          flightId: flight.id,
          originalIndex: idx,
          flightNumber: flight.flightNumber || flight.number || 'N/A',
          aircraft: flight.registration || flight.aircraft || flight.tailNumber || 'N/A',
          route: `${flight.departure || flight.origin || '---'} ➔ ${flight.arrival || flight.destination || '---'}`,
          flightDate: formatFlightDate(rawDate),
          rawFlightDate: rawDate,
          internalId: rep.id || `${flight.id}_rep_${idx}`
        };
      });
    });
  }, [flights]);

  // ---------------------------------------------------------------------------
  // 2.4 FILTRADO MEMOIZADO
  // ---------------------------------------------------------------------------
  const filteredReports = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return allReports.filter((rep) => {
      // Búsqueda por texto
      const matchesSearch =
        !query ||
        rep.titulo?.toLowerCase().includes(query) ||
        rep.category?.toLowerCase().includes(query) ||
        rep.pasajero?.toLowerCase().includes(query) ||
        rep.flightNumber?.toLowerCase().includes(query) ||
        rep.aircraft?.toLowerCase().includes(query) ||
        rep.observacion?.toLowerCase().includes(query);

      // Filtro por fecha
      const matchesDate = !selectedDate || rep.rawFlightDate === selectedDate;

      // Filtro por categoría
      const matchesCategory = selectedCategory === 'ALL' || rep.category === selectedCategory;

      return matchesSearch && matchesDate && matchesCategory;
    });
  }, [allReports, searchQuery, selectedDate, selectedCategory]);

  // ---------------------------------------------------------------------------
  // 2.5 FUNCIÓN PARA CERRAR CÁMARA (memoizada, usada en cleanup)
  // ---------------------------------------------------------------------------
  const closeCameraModal = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCameraScanner(false);
    setManualJson('');
  }, []);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      closeCameraModal();
    };
  }, [closeCameraModal]);

  // ---------------------------------------------------------------------------
  // 2.6 HANDLERS MEMOIZADOS
  // ---------------------------------------------------------------------------
  const handleOpenDetail = useCallback((report) => {
    setSelectedReport(report);
    setIsEditModalOpen(true);
  }, []);

  const handleSaveChanges = useCallback(async (updatedPayload) => {
    try {
      const flight = flights.find((f) => f.id === updatedPayload.flightId);
      if (!flight) return;

      const updatedReports = [...(flight.reports || [])];
      const cleanReport = cleanReportData(updatedPayload);
      
      // Actualizar por índice (verificando que exista)
      if (updatedPayload.originalIndex >= 0 && updatedPayload.originalIndex < updatedReports.length) {
        updatedReports[updatedPayload.originalIndex] = cleanReport;
      } else {
        // Si el índice no es válido, buscar por ID o agregar al final
        const existingIdx = updatedReports.findIndex((r) => r.id === cleanReport.id);
        if (existingIdx >= 0) {
          updatedReports[existingIdx] = cleanReport;
        } else {
          updatedReports.push(cleanReport);
        }
      }

      await db.flights.update(flight.id, { reports: updatedReports, synced: false });
      setIsEditModalOpen(false);
      setSelectedReport(null);
      setStatusMessage({ type: 'success', text: 'Reporte actualizado correctamente.' });
    } catch (error) {
      console.error('Error al actualizar reporte:', error);
      setStatusMessage({ type: 'error', text: 'Error al actualizar el reporte.' });
    }
  }, [flights]);

  const onRequestDelete = useCallback((e, report) => {
    if (e) e.stopPropagation();
    setReportToDelete(report);
  }, []);

  const confirmDeleteReport = useCallback(async () => {
    if (!reportToDelete) return;

    try {
      const flight = flights.find((f) => f.id === reportToDelete.flightId);
      if (flight) {
        const updatedReports = (flight.reports || []).filter(
          (_, idx) => idx !== reportToDelete.originalIndex
        );
        await db.flights.update(flight.id, { reports: updatedReports, synced: false });
        setStatusMessage({ type: 'success', text: 'Reporte eliminado con éxito.' });
      }
    } catch (error) {
      console.error('Error al eliminar reporte:', error);
      setStatusMessage({ type: 'error', text: 'Error al eliminar el reporte.' });
    } finally {
      setReportToDelete(null);
      setIsEditModalOpen(false);
      setSelectedReport(null);
    }
  }, [reportToDelete, flights]);

  const processImportData = useCallback(async (rawString) => {
    try {
      let dataToImport = rawString;

      // Decodificar la cadena obtenida
      if (typeof rawString === 'string') {
        const decodedPackage = decodeFromQR(rawString);
        dataToImport = decodedPackage ? decodedPackage.data : JSON.parse(rawString);
      }

      if (Array.isArray(dataToImport)) {
        dataToImport = dataToImport[0];
      }

      // Extracción de metadatos del reporte
      const flightNum = dataToImport.flightNumber || dataToImport.fn || 'N/A';
      const reportDate = dataToImport.date || dataToImport.flightDate || '';
      const category = dataToImport.category || dataToImport.c || 'Solicitud PAX';
      const titulo = dataToImport.titulo || dataToImport.t || `Reporte PAX ${dataToImport.pasajero || dataToImport.p || ''}`;

      // Buscar el vuelo coincidente por número Y fecha (más preciso)
      let targetFlight = flights.find(
        (f) => f.flightNumber === flightNum && (!reportDate || f.date === reportDate)
      );
      
      // Si no se encuentra por número y fecha, buscar solo por número
      if (!targetFlight) {
        targetFlight = flights.find((f) => f.flightNumber === flightNum);
      }
      
      // Último fallback: usar el primer vuelo
      if (!targetFlight) {
        targetFlight = flights[0];
      }

      if (!targetFlight) {
        setStatusMessage({ type: 'error', text: 'No hay itinerarios registrados para asociar este reporte.' });
        return;
      }

      const finalReport = {
        ...dataToImport,
        category,
        titulo,
        flightNumber: targetFlight.flightNumber || flightNum,
        aircraft: targetFlight.registration || targetFlight.aircraft || dataToImport.aircraft || 'N/A',
        importedAt: new Date().toISOString()
      };

      const updatedReports = [...(targetFlight.reports || []), finalReport];
      await db.flights.update(targetFlight.id, { reports: updatedReports, synced: false });
      setStatusMessage({ type: 'success', text: `¡Reporte (${titulo}) importado con éxito!` });
      closeCameraModal();
    } catch (e) {
      console.error('Error al procesar la importación:', e);
      setStatusMessage({ type: 'error', text: 'Error al interpretar los datos del reporte. Verifica el formato JSON.' });
    }
  }, [flights, closeCameraModal]);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      processImportData(evt.target.result);
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [processImportData]);

  const downloadReportJson = useCallback((report) => {
    const cleanReport = cleanReportData(report);
    const blob = new Blob([JSON.stringify(cleanReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_${report.flightNumber}_${report.category || 'General'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const copyReportJson = useCallback((report) => {
    const cleanReport = cleanReportData(report);
    navigator.clipboard.writeText(JSON.stringify(cleanReport));
    setStatusMessage({ type: 'success', text: 'JSON del reporte copiado al portapapeles.' });
  }, []);

  // ---------------------------------------------------------------------------
  // 2.7 ESCÁNER QR (con requestAnimationFrame)
  // ---------------------------------------------------------------------------
  const scanQrCode = useCallback(() => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data) {
        processImportData(code.data);
        return;
      }
    }
    animationFrameRef.current = requestAnimationFrame(scanQrCode);
  }, [processImportData]);

  const startCamera = useCallback(async () => {
    setShowCameraScanner(true);
    setStatusMessage(null);

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: 'environment' } }
        });
      } catch (fallbackErr) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        animationFrameRef.current = requestAnimationFrame(scanQrCode);
      }
    } catch (err) {
      console.error('Error accediendo a la cámara:', err);
      setStatusMessage({
        type: 'error',
        text: 'No se pudo acceder a la cámara. Revisa permisos o utiliza HTTPS si estás accediendo desde la red local.'
      });
    }
  }, [scanQrCode]);

  const executeSendMail = useCallback(() => {
    if (!mailReport || !targetEmail.trim()) return;

    const reportTitle = mailReport.titulo || mailReport.category || 'Reporte de Vuelo';
    const cleanReport = cleanReportData(mailReport);
    const jsonString = JSON.stringify(cleanReport);

    const subject = encodeURIComponent(`[REPORTE] ${reportTitle} - Vuelo ${mailReport.flightNumber}`);
    const body = encodeURIComponent(
      `DETALLES DEL REPORTE:\n` +
        `---------------------\n` +
        `Título / Asunto: ${reportTitle}\n` +
        `Categoría: ${mailReport.category || 'General'}\n` +
        `Vuelo: ${mailReport.flightNumber} (${mailReport.route})\n` +
        `Matrícula: ${mailReport.aircraft}\n` +
        `Fecha: ${mailReport.flightDate}\n` +
        `Pasajero: ${mailReport.pasajero || 'N/A'} (Asiento: ${mailReport.asiento || 'N/A'})\n\n` +
        `Observaciones / Detalle:\n${mailReport.observacion || mailReport.atencionMedica?.accionesTC || 'Sin especificación'}\n\n` +
        `---------------------\n` +
        `JSON DE IMPORTACIÓN DIRECTA (Copiar y Pegar en la App):\n` +
        `${jsonString}`
    );

    window.location.href = `mailto:${targetEmail.trim()}?subject=${subject}&body=${body}`;
    setMailReport(null);
  }, [mailReport, targetEmail]);

  // ---------------------------------------------------------------------------
  // 2.8 RETURN
  // ---------------------------------------------------------------------------
  return {
    searchQuery,
    setSearchQuery,
    selectedDate,
    setSelectedDate,
    selectedCategory,
    setSelectedCategory,
    selectedReport,
    setSelectedReport,
    isEditModalOpen,
    setIsEditModalOpen,
    qrModalReport,
    setQrModalReport,
    showCameraScanner,
    manualJson,
    setManualJson,
    statusMessage,
    setStatusMessage,
    reportToDelete,
    setReportToDelete,
    mailReport,
    setMailReport,
    targetEmail,
    setTargetEmail,
    videoRef,
    fileInputRef,
    filteredReports,
    getCategoryColor,
    handleOpenDetail,
    handleSaveChanges,
    onRequestDelete,
    confirmDeleteReport,
    processImportData,
    handleFileUpload,
    downloadReportJson,
    copyReportJson,
    startCamera,
    closeCameraModal,
    executeSendMail
  };
}