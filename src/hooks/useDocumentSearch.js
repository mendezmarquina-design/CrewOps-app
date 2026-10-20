// src/hooks/useDocumentSearch.js
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import MiniSearch from 'minisearch';
import { db } from '../db/index';
import { extractTextFromPDF } from '../utils/pdfExtractor';

// ---------------------------------------------------------------------------
// 1. SINÓSIMOS EXPANDIDOS (más robustos)
// ---------------------------------------------------------------------------
const SYNONYMS = {
  umnr: 'menor no acompañado',
  'menor no acompañado': 'umnr',
  rtm: 'revision tecnica mantenimiento',
  'revision tecnica mantenimiento': 'rtm',
  rta: 'autorizacion tecnica',
  'autorizacion tecnica': 'rta',
  jsb: 'jefe de servicio a bordo',
  'jefe de servicio a bordo': 'jsb',
  tc: 'tripulante de cabina',
  'tripulante de cabina': 'tc',
  pil: 'passenger information list',
  'passenger information list': 'pil'
};

// ---------------------------------------------------------------------------
// 2. UTILIDADES DE CHUNKING (fuera del hook para no recrearlas)
// ---------------------------------------------------------------------------
const chunkPageContent = (pageContent, docId, pageNum) => {
  if (!pageContent || typeof pageContent !== 'string') return [];
  
  const rawParagraphs = pageContent.split(/\n\s*\n|\n(?=[A-Z0-9]\.\d|a\)|b\)|c\))/g);
  
  return rawParagraphs
    .map((paragraph, idx) => {
      const cleanText = paragraph.replace(/\s+/g, ' ').trim();
      if (cleanText.length < 15) return null;
      
      return {
        id: `${docId}-p${pageNum}-c${idx}`,
        docId,
        pageNumber: pageNum,
        content: cleanText
      };
    })
    .filter(Boolean);
};

// ---------------------------------------------------------------------------
// 3. HOOK PRINCIPAL
// ---------------------------------------------------------------------------
export function useDocumentSearch() {
  // ---------------------------------------------------------------------------
  // 3.1 ESTADOS AGRUPADOS
  // ---------------------------------------------------------------------------
  const [documents, setDocuments] = useState([]);
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // ---------------------------------------------------------------------------
  // 3.2 MINISEARCH INSTANCE (persiste entre renders)
  // ---------------------------------------------------------------------------
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

  // Ref para cancelar procesamiento de PDF
  const processingAbortRef = useRef(null);

  // ---------------------------------------------------------------------------
  // 3.3 CARGA E INDEXACIÓN (optimizada)
  // ---------------------------------------------------------------------------
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
          
          const chunks = chunkPageContent(pageContent, doc.id, pageNum);
          
          chunks.forEach((chunk) => {
            chunkIndexList.push({
              ...chunk,
              title: doc.title,
              category: doc.category || 'Otros'
            });
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

  // ---------------------------------------------------------------------------
  // 3.4 BÚSQUEDA (con debounce y sinónimos mejorados)
  // ---------------------------------------------------------------------------
  const handleSearch = useCallback((text, catFilter = selectedCategory) => {
    setQuery(text);
    
    if (!text || text.trim().length === 0) {
      setResults([]);
      return;
    }

    const trimmedText = text.trim();
    const lower = trimmedText.toLowerCase();
    
    // Expansión de sinónimos mejorada
    let expandedText = trimmedText;
    const synonymExpansion = SYNONYMS[lower];
    if (synonymExpansion) {
      expandedText = `${trimmedText} ${synonymExpansion}`;
    }

    let searchResults = miniSearchRef.current.search(expandedText);

    // Filtrado por categoría
    if (catFilter !== 'TODAS') {
      searchResults = searchResults.filter((item) => item.category === catFilter);
    }

    setResults(searchResults);
  }, [selectedCategory]);

  // Debounce para búsqueda en tiempo real
  const debounceTimerRef = useRef(null);
  const handleSearchDebounced = useCallback((text) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      handleSearch(text);
    }, 300); // 300ms de debounce
  }, [handleSearch]);

  // Cleanup del debounce al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // 3.5 PROCESAMIENTO DE PDF (con cancelación)
  // ---------------------------------------------------------------------------
  const processAndSaveDocument = useCallback(async ({ 
    file, 
    fileHandle, 
    existingDocId, 
    uploadCategory, 
    storePdfInDb 
  }) => {
    // Validación de archivo
    if (!file || file.type !== 'application/pdf') {
      setError('El archivo debe ser un PDF válido.');
      return { success: false, error: 'Archivo no válido' };
    }

    setIsProcessing(true);
    setError(null);

    // Crear señal de cancelación
    const abortController = new AbortController();
    processingAbortRef.current = abortController;

    try {
      const extracted = await extractTextFromPDF(file, abortController.signal);
      
      // Verificar si fue cancelado
      if (abortController.signal.aborted) {
        return { success: false, error: 'Procesamiento cancelado' };
      }

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
      
      if (query) {
        handleSearch(query, selectedCategory);
      }

      return { success: true, title: docData.title };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'Procesamiento cancelado' };
      }
      
      console.error('Error procesando PDF:', err);
      setError(err.message || 'Error al procesar el archivo PDF');
      return { success: false, error: err.message };
    } finally {
      setIsProcessing(false);
      processingAbortRef.current = null;
    }
  }, [loadAndIndexDocs, query, selectedCategory, handleSearch]);

  // Función para cancelar procesamiento
  const cancelProcessing = useCallback(() => {
    if (processingAbortRef.current) {
      processingAbortRef.current.abort();
    }
  }, []);

  // ---------------------------------------------------------------------------
  // 3.6 ELIMINACIÓN (memoizada)
  // ---------------------------------------------------------------------------
  const deleteDocument = useCallback(async (docId) => {
    try {
      await db.documents.delete(docId);
      await loadAndIndexDocs();
      
      if (query.trim().length > 0) {
        handleSearch(query, selectedCategory);
      }
    } catch (err) {
      console.error('Error al eliminar documento:', err);
      setError('No se pudo eliminar el documento.');
    }
  }, [loadAndIndexDocs, query, selectedCategory, handleSearch]);

  // ---------------------------------------------------------------------------
  // 3.7 CATEGORÍAS DISPONIBLES (memoizadas)
  // ---------------------------------------------------------------------------
  const availableCategories = useMemo(() => {
    const categories = new Set(documents.map((doc) => doc.category || 'Otros'));
    return ['TODAS', ...Array.from(categories).sort()];
  }, [documents]);

  // ---------------------------------------------------------------------------
  // 3.8 RETURN
  // ---------------------------------------------------------------------------
  return {
    documents,
    results,
    query,
    selectedCategory,
    isProcessing,
    error,
    availableCategories,
    
    // Actions
    setSelectedCategory,
    handleSearch,
    handleSearchDebounced, // Nueva: para búsqueda en tiempo real
    processAndSaveDocument,
    deleteDocument,
    cancelProcessing, // Nueva: para cancelar procesamiento
    loadAndIndexDocs
  };
}