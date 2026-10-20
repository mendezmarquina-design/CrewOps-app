// src/utils/pdfExtractor.js
import * as pdfjsLib from 'pdfjs-dist';

// Configurar el worker como un Web Worker nativo de Vite (100% Offline)
pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(
  new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url),
  { type: 'module' }
);

/**
 * Extrae texto de un PDF con soporte para cancelación
 * @param {File} file - Archivo PDF
 * @param {AbortSignal} [signal] - Señal de cancelación (opcional)
 * @returns {Promise<{pagesData: Array, totalPages: number}>}
 */
export const extractTextFromPDF = async (file, signal) => {
  try {
    // Verificar si ya fue cancelado antes de empezar
    if (signal?.aborted) {
      throw new DOMException('Procesamiento cancelado', 'AbortError');
    }

    const arrayBuffer = await file.arrayBuffer();

    // Verificar cancelación después de leer el archivo
    if (signal?.aborted) {
      throw new DOMException('Procesamiento cancelado', 'AbortError');
    }

    // Carga del documento PDF
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    
    // Si hay signal, configurar cancelación en el loadingTask
    if (signal) {
      loadingTask.onProgress = (progressData) => {
        if (signal.aborted) {
          loadingTask.cancel();
        }
      };
    }

    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    const pagesData = [];

    // Recorrer cada página y extraer el texto
    for (let i = 1; i <= totalPages; i++) {
      // Verificar cancelación en cada página
      if (signal?.aborted) {
        throw new DOMException('Procesamiento cancelado', 'AbortError');
      }

      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(' ');
      
      pagesData.push({
        pageNumber: i,
        content: pageText
      });
    }

    return { pagesData, totalPages };
  } catch (error) {
    // Si es un error de cancelación, lo propagamos
    if (error.name === 'AbortError') {
      throw error;
    }
    
    console.error('Error detallado al extraer PDF:', error);
    throw error;
  }
};