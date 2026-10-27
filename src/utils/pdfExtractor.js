// src/utils/pdfExtractor.js
import * as pdfjsLib from 'pdfjs-dist';

// Configurar el worker como un Web Worker nativo de Vite (100% Offline)
pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(
  new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url),
  { type: 'module' }
);

/**
 * Divide el texto en chunks de tamaño fijo con overlap
 * @param {string} text - Texto completo
 * @param {number} docId - ID del documento
 * @param {number} pageNum - Número de página
 * @param {number} [chunkSize=500] - Tamaño máximo del chunk en caracteres
 * @param {number} [overlap=100] - Overlap entre chunks
 * @returns {Array} Array de chunks
 */
const chunkTextBySize = (text, docId, pageNum, chunkSize = 500, overlap = 100) => {
  if (!text || typeof text !== 'string') return [];
  
  const cleanText = text.replace(/\s+/g, ' ').trim();
  if (cleanText.length < 50) return []; // Descartar texto muy corto
  
  const chunks = [];
  let startIndex = 0;
  let chunkIndex = 0;
  
  while (startIndex < cleanText.length) {
    const endIndex = Math.min(startIndex + chunkSize, cleanText.length);
    const chunk = cleanText.slice(startIndex, endIndex);
    
    // Solo agregar si tiene contenido significativo
    if (chunk.length >= 50) {
      chunks.push({
        id: `${docId}-p${pageNum}-c${chunkIndex}`,
        docId,
        pageNumber: pageNum,
        content: chunk,
        chunkIndex
      });
      chunkIndex++;
    }
    
    // Avanzar con overlap
    startIndex = endIndex - overlap;
    
    // Si llegamos al final, salir
    if (endIndex >= cleanText.length) break;
  }
  
  return chunks;
};

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

/**
 * Convierte páginas de PDF en chunks optimizados para búsqueda
 * @param {Array} pagesData - Array de páginas con content
 * @param {string} docId - ID del documento
 * @returns {Array} Array de chunks
 */
export const createChunksFromPages = (pagesData, docId) => {
  const allChunks = [];
  
  pagesData.forEach((page) => {
    const pageNum = page.pageNumber || page.page;
    const content = page.content || page.text || (typeof page === 'string' ? page : '');
    
    if (content && content.length > 50) {
      const chunks = chunkTextBySize(content, docId, pageNum);
      allChunks.push(...chunks);
    }
  });
  
  return allChunks;
};