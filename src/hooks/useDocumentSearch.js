// src/hooks/useDocumentSearch.js
import { useState, useEffect, useRef, useCallback } from 'react';
import MiniSearch from 'minisearch';
import { db } from '../db/index';
import { extractTextFromPDF } from '../utils/pdfExtractor';

const SYNONYMS = {
  umnr: 'menor no acompañado',
  rtm: 'revision tecnica mantenimiento',
  rta: 'autorizacion tecnica',
  jsb: 'jefe de servicio a bordo',
  tc: 'tripulante de cabina',
  pil: 'passenger information list'
};

export function useDocumentSearch() {
  const [documents, setDocuments] = useState([]);
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const miniSearchRef = useRef(
    new MiniSearch({
      fields: ['title', 'content'],
      storeFields: ['title', 'category', 'docId', 'pageNumber', 'content'],
      searchOptions: {
        fuzzy: (term) => (term.length > 3 ? 0.2 : false),
        prefix: true,
        combineWith: 'AND'
      }
    })
  );

  // Carga e indexación en MiniSearch
  const loadAndIndexDocs = useCallback(async () => {
    try {
      if (!db.documents) return;
      const storedDocs = await db.documents.toArray();
      setDocuments(storedDocs);

      const chunkIndexList = [];
      storedDocs.forEach((doc) => {
        const pageList = doc.pages || doc.pagesData || [];

        pageList.forEach((page, pageIdx) => {
          const pageNum = page.pageNumber || page.page || (pageIdx + 1);
          const pageContent = page.content || page.text || (typeof page === 'string' ? page : '');

          if (!pageContent) return;

          const rawParagraphs = pageContent.split(/\n\s*\n|\n(?=[A-Z0-9]\.\d|a\)|b\)|c\))/g);
          
          rawParagraphs.forEach((paragraph, idx) => {
            const cleanText = paragraph.replace(/\s+/g, ' ').trim();
            if (cleanText.length > 15) {
              chunkIndexList.push({
                id: `${doc.id}-p${pageNum}-c${idx}`,
                docId: doc.id,
                title: doc.title,
                category: doc.category || 'Otros',
                pageNumber: pageNum,
                content: cleanText
              });
            }
          });
        });
      });

      miniSearchRef.current.removeAll();
      if (chunkIndexList.length > 0) {
        miniSearchRef.current.addAll(chunkIndexList);
      }
    } catch (err) {
      console.error('Error al cargar e indexar documentos:', err);
      setError('Error al indexar la base de datos local.');
    }
  }, []);

  useEffect(() => {
    loadAndIndexDocs();
  }, [loadAndIndexDocs]);

  // Búsqueda
  const handleSearch = useCallback((text, catFilter = selectedCategory) => {
    setQuery(text);
    if (!text || text.trim().length === 0) {
      setResults([]);
      return;
    }

    let expandedText = text.trim();
    const lower = text.toLowerCase().trim();
    if (SYNONYMS[lower]) {
      expandedText = `${text} ${SYNONYMS[lower]}`;
    }

    let searchResults = miniSearchRef.current.search(expandedText);
    if (catFilter !== 'TODAS') {
      searchResults = searchResults.filter((item) => item.category === catFilter);
    }

    setResults(searchResults);
  }, [selectedCategory]);

  // Procesar e indexar PDF
  const processAndSaveDocument = async ({ file, fileHandle, existingDocId, uploadCategory, storePdfInDb }) => {
    setIsProcessing(true);
    setError(null);

    try {
      const extracted = await extractTextFromPDF(file);
      
      const pagesData = extracted.pagesData || extracted.pages || (Array.isArray(extracted) ? extracted : []);
      const totalPages = extracted.totalPages || pagesData.length || 1;

      if (!pagesData || pagesData.length === 0) {
        throw new Error('No se pudo extraer texto del PDF. Asegúrate de que no sea un escaneo o PDF protegido.');
      }

      const docData = {
        title: file.name.replace(/\.pdf$/i, ''),
        category: uploadCategory,
        totalPages,
        pages: pagesData,
        fileHandle: fileHandle || null,
        pdfBlob: storePdfInDb ? file : null,
        isStoredLocally: !storePdfInDb,
        updatedAt: new Date().toISOString()
      };

      if (existingDocId) {
        await db.documents.update(existingDocId, docData);
      } else {
        await db.documents.add(docData);
      }

      await loadAndIndexDocs();
      if (query) handleSearch(query, selectedCategory);

      return { success: true, title: docData.title };
    } catch (err) {
      console.error('Error procesando PDF:', err);
      setError(err.message || 'Error al procesar el archivo PDF');
      return { success: false, error: err.message };
    } finally {
      setIsProcessing(false);
    }
  };

  // Eliminar
  const deleteDocument = async (docId) => {
    try {
      await db.documents.delete(docId);
      await loadAndIndexDocs();
      if (query.trim().length > 0) handleSearch(query, selectedCategory);
    } catch (err) {
      console.error('Error al eliminar documento:', err);
      setError('No se pudo eliminar el documento.');
    }
  };

  return {
    documents,
    results,
    query,
    selectedCategory,
    isProcessing,
    error,
    setSelectedCategory,
    handleSearch,
    processAndSaveDocument,
    deleteDocument,
    loadAndIndexDocs
  };
}