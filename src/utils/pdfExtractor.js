// src/utils/pdfExtractor.js
import * as pdfjsLib from 'pdfjs-dist';

// Configurar el worker como un Web Worker nativo de Vite (100% Offline)
pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(
  new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url),
  { type: 'module' }
);

export const extractTextFromPDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Carga del documento PDF
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const totalPages = pdf.numPages;
    const pagesData = [];

    // Recorrer cada página y extraer el texto
    for (let i = 1; i <= totalPages; i++) {
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
    console.error('Error detallado al extraer PDF:', error);
    throw error;
  }
};