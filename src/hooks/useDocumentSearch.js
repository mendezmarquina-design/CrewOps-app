// src/hooks/useDocumentSearch.js
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import MiniSearch from 'minisearch';
import { db } from '../db/index';
import { extractTextFromPDF, createChunksFromPages } from '../utils/pdfExtractor';

// ---------------------------------------------------------------------------
// 1. SINÓNIMOS EXPANDIDOS
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
// 2. HOOK PRINCIPAL
// ---------------------------------------------------------------------------
export function useDocumentSearch() {
  // ---------------------------------------------------------------------------
  // 2.1 ESTADOS
  // ---------------------------------------------------------------------------
  const [documents, setDocuments] = useState([]);
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isIndexing, setIsIndexing] = useState(false);

  // ---------------------------------------------------------------------------
  // 2.2 MINISEARCH INSTANCE
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

  const processingAbortRef = useRef(null);
  const indexedDocIdsRef = useRef(new Set()); // Track qué docs ya están indexados

  // ---------------------------------------------------------------------------
  // 2.3 CARGAR ÍNDICE PERSISTENTE DESDE INDEXEDDB
  // ---------------------------------------------------------------------------
  const loadPersistedIndex = useCallback(async () => {
    try {
      const savedIndex = await db.documentIndexes.get('main');
      if (savedIndex && savedIndex.data) {
        miniSearchRef.current = MiniSearch.loadJSON(savedIndex.data, {
          fields: ['title', 'content'],
          storeFields: ['title', 'category', 'docId', 'pageNumber', 'content'],
          searchOptions: {
            fuzzy: (term) => (term.length > 3 ? 0.2 : false),
            prefix: true,
            combineWith: 'AND'
          }
        });
        indexedDocIdsRef.current = new Set(savedIndex.indexedDocIds || []);
        console.log(`✅ Índice cargado desde IndexedDB (${indexedDocIdsRef.current.size} docs)`);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error cargando índice persistente:', err);
      return false;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // 2.4 GUARDAR ÍNDICE EN INDEXEDDB
  // ---------------------------------------------------------------------------
  const savePersistedIndex = useCallback(async () => {
    try {
      const serializedIndex = miniSearchRef.current.toJSON();
      await db.documentIndexes.put({
        id: 'main',
        data: serializedIndex,
        indexedDocIds: Array.from(indexedDocIdsRef.current),
        updatedAt: new Date().toISOString()
      });
      console.log('💾 Índice guardado en IndexedDB');
    } catch (err) {
      console.error('Error guardando índice:', err);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // 2.5 CARGA E INDEXACIÓN INCREMENTAL
  // ---------------------------------------------------------------------------
  const loadAndIndexDocs = useCallback(async () => {
    setIsIndexing(true);
    setError(null);
    
    try {
      if (!db.documents) return;
      
      const storedDocs = await db.documents.toArray();
      setDocuments(storedDocs);
      
      // Cargar índice persistente si existe
      const hasPersistedIndex = await loadPersistedIndex();
      
      // Identificar docs nuevos o modificados
      const docsToIndex = storedDocs.filter(doc => 
        !indexedDocIdsRef.current.has(doc.id) || 
        doc.updatedAt > (indexedDocIdsRef.current.get(doc.id) || '1970-01-01')
      );
      
      console.log(`📊 ${docsToIndex.length} docs nuevos/modificados de ${storedDocs.length} total`);
      
      const chunkIndexList = [];
      
      // Indexar solo los docs nuevos/modificados
      for (const doc of docsToIndex) {
        const pageList = doc.pages || doc.pagesData || [];
        
        for (const page of pageList) {
          const pageNum = page.pageNumber || page.page || (pageList.indexOf(page) + 1);
          const pageContent = page.content || page.text || (typeof page === 'string' ? page : '');
          
          if (!pageContent || pageContent.length < 50) continue;
          
          // Usar chunking inteligente
          const chunks = createChunksFromPages([{ pageNumber: pageNum, content: pageContent }], doc.id);
          
          chunks.forEach((chunk) => {
            chunkIndexList.push({
              ...chunk,
              title: doc.title,
              category: doc.category || 'Otros'
            });
          });
        }
        
        // Marcar como indexado
        indexedDocIdsRef.current.add(doc.id);
      }
      
      // Si no hay índice persistente, reconstruir todo
      if (!hasPersistedIndex && chunkIndexList.length > 0) {
        miniSearchRef.current.removeAll();
        miniSearchRef.current.addAll(chunkIndexList);
      } else if (chunkIndexList.length > 0) {
        // Indexación incremental: solo agregar los nuevos chunks
        miniSearchRef.current.addAll(chunkIndexList);
      }
      
      // Guardar índice actualizado
      await savePersistedIndex();
      
      console.log(`✅ Indexación completa: ${miniSearchRef.current.documentCount} documentos en índice`);
    } catch (err) {
      console.error('Error al cargar e indexar documentos:', err);
      setError('Error al indexar la base de datos local.');
    } finally {
      setIsIndexing(false);
    }
  }, [loadPersistedIndex, savePersistedIndex]);

  useEffect(() => {
    loadAndIndexDocs();
  }, [loadAndIndexDocs]);

  // ---------------------------------------------------------------------------
  // 2.6 BÚSQUEDA CON DEBOUNCE Y SINÓNIMOS
  // ---------------------------------------------------------------------------
  const handleSearch = useCallback((text, catFilter = selectedCategory) => {
    setQuery(text);
    
    if (!text || text.trim().length === 0) {
      setResults([]);
      return;
    }

    const trimmedText = text.trim();
    const lower = trimmedText.toLowerCase();
    
    // Expansión de sinónimos
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
    }, 300);
  }, [handleSearch]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // 2.7 PROCESAMIENTO DE PDF
  // ---------------------------------------------------------------------------
  const processAndSaveDocument = useCallback(async ({
    file,
    fileHandle,
    existingDocId,
    uploadCategory,
    storePdfInDb
  }) => {
    if (!file || file.type !== 'application/pdf') {
      setError('El archivo debe ser un PDF válido.');
      return { success: false, error: 'Archivo no válido' };
    }

    setIsProcessing(true);
    setError(null);

    const abortController = new AbortController();
    processingAbortRef.current = abortController;

    try {
      const extracted = await extractTextFromPDF(file, abortController.signal);

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
        pdfBlob: storePdfInDb ? file : null, // ⚠️ Solo guardar si el usuario lo solicita
        isStoredLocally: !storePdfInDb,
        updatedAt: new Date().toISOString()
      };

      if (existingDocId) {
        await db.documents.update(existingDocId, docData);
        // Remover del índice para re-indexar
        indexedDocIdsRef.current.delete(existingDocId);
      } else {
        await db.documents.add(docData);
      }

      // Re-indexar el documento actualizado
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

  const cancelProcessing = useCallback(() => {
    if (processingAbortRef.current) {
      processingAbortRef.current.abort();
    }
  }, []);

  // ---------------------------------------------------------------------------
  // 2.8 ELIMINACIÓN CON ACTUALIZACIÓN DEL ÍNDICE
  // ---------------------------------------------------------------------------
  const deleteDocument = useCallback(async (docId) => {
    try {
      await db.documents.delete(docId);
      
      // Remover del índice
      indexedDocIdsRef.current.delete(docId);
      
      // Re-indexar (rápido porque solo falta un doc)
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
  // 2.9 CATEGORÍAS DISPONIBLES
  // ---------------------------------------------------------------------------
  const availableCategories = useMemo(() => {
    const categories = new Set(documents.map((doc) => doc.category || 'Otros'));
    return ['TODAS', ...Array.from(categories).sort()];
  }, [documents]);

  // ---------------------------------------------------------------------------
  // 2.10 RETURN
  // ---------------------------------------------------------------------------
  return {
    documents,
    results,
    query,
    selectedCategory,
    isProcessing,
    isIndexing,
    error,
    availableCategories,
    setSelectedCategory,
    handleSearch,
    handleSearchDebounced,
    processAndSaveDocument,
    deleteDocument,
    cancelProcessing,
    loadAndIndexDocs
  };
}