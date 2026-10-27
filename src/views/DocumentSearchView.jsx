// src/views/DocumentSearchView.jsx
import React, { useState, useRef, useEffect } from 'react';
import { db } from '../db/index';
import BackButton from '../components/common/BackButton';
import { useDocumentSearch } from '../hooks/useDocumentSearch';
import PdfViewerModal from '../components/modals/PdfViewerModal';
import {
  Search, FileText, Upload, BookOpen, Loader2, Eye,
  Trash2, RefreshCw, Settings2, Filter, HardDrive, Database, X
} from 'lucide-react';

const CATEGORIES = ['Manuales', 'RTMs', 'RTAs', 'Comunicados', 'Boletines', 'Otros'];
const PAGE_SIZE = 20; // Cargar de 20 en 20

export default function DocumentSearchView({ onBackToFlights }) {
  const {
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
  } = useDocumentSearch();

  const [uploadCategory, setUploadCategory] = useState('Manuales');
  const [showManager, setShowManager] = useState(false);
  
  // Estados para lazy loading
  const [visibleDocs, setVisibleDocs] = useState({});
  const observerRef = useRef(null);
  const lastDocRef = useRef(null);

  // Modales
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingFileHandle, setPendingFileHandle] = useState(null);
  const [pendingDocId, setPendingDocId] = useState(null);
  const [showStorageModal, setShowStorageModal] = useState(false);

  // Visor PDF
  const [activePdfFile, setActivePdfFile] = useState(null);
  const [targetPage, setTargetPage] = useState(1);
  const [pdfTitle, setPdfTitle] = useState('');

  // Inicializar docs visibles cuando cambian los documentos
  useEffect(() => {
    const initialVisible = {};
    const docsByCategory = (documents || []).reduce((acc, doc) => {
      const cat = doc.category || 'Otros';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(doc);
      return acc;
    }, {});
    
    Object.keys(docsByCategory).forEach(cat => {
      initialVisible[cat] = PAGE_SIZE;
    });
    setVisibleDocs(initialVisible);
  }, [documents]);

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && lastDocRef.current) {
          const category = lastDocRef.current.dataset.category;
          setVisibleDocs(prev => ({
            ...prev,
            [category]: (prev[category] || PAGE_SIZE) + PAGE_SIZE
          }));
        }
      },
      { threshold: 0.1 }
    );

    if (lastDocRef.current) {
      observerRef.current.observe(lastDocRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [visibleDocs, documents]);

  const selectFileFallback = () => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/pdf';
      input.onchange = (e) => resolve(e.target.files[0] || null);
      input.click();
    });
  };

  const handleSelectAndIndex = async (existingDocId = null) => {
    try {
      let file = null;
      let fileHandle = null;

      if ('showOpenFilePicker' in window) {
        try {
          [fileHandle] = await window.showOpenFilePicker({
            types: [{ description: 'Documentos PDF', accept: { 'application/pdf': ['.pdf'] } }],
            multiple: false
          });
          file = await fileHandle.getFile();
        } catch (pickerErr) {
          if (pickerErr.name === 'AbortError') return;
          file = await selectFileFallback();
        }
      } else {
        file = await selectFileFallback();
      }

      if (!file) return;

      // Validación de PDF
      if (file.type !== 'application/pdf') {
        alert('El archivo debe ser un PDF válido.');
        return;
      }

      setPendingFile(file);
      setPendingFileHandle(fileHandle);
      setPendingDocId(existingDocId);
      setShowStorageModal(true);
    } catch (err) {
      console.error('Error al seleccionar el archivo:', err);
    }
  };

  const handleConfirmSave = async (storePdfInDb) => {
    setShowStorageModal(false);
    const res = await processAndSaveDocument({
      file: pendingFile,
      fileHandle: pendingFileHandle,
      existingDocId: pendingDocId,
      uploadCategory,
      storePdfInDb
    });
    if (res.success) {
      alert(`¡Documento "${res.title}" indexado correctamente!`);
    } else {
      alert(`Error: ${res.error}`);
    }
    setPendingFile(null);
    setPendingFileHandle(null);
    setPendingDocId(null);
  };

  const handleOpenDocument = async (docId, pageNumber) => {
    try {
      const doc = await db.documents.get(docId);
      if (!doc) return;

      let file = doc.pdfBlob;
      if (!file && doc.fileHandle) {
        try {
          const options = { mode: 'read' };
          if ((await doc.fileHandle.queryPermission(options)) === 'granted' ||
              (await doc.fileHandle.requestPermission(options)) === 'granted') {
            file = await doc.fileHandle.getFile();
          }
        } catch (e) {
          console.warn('Acceso al archivo no disponible:', e);
        }
      }

      if (!file) {
        alert(`Para ver la página ${pageNumber}, selecciona el archivo PDF original ("${doc.title}.pdf").`);
        file = await selectFileFallback();
      }

      if (file) {
        setActivePdfFile(file);
        setTargetPage(pageNumber);
        setPdfTitle(doc.title);
      }
    } catch (err) {
      console.error('Error al abrir el PDF:', err);
    }
  };

  const renderHighlightedParagraph = (text, searchTerm) => {
    if (!text || !searchTerm.trim()) return text;

    const terms = searchTerm.trim().split(/\s+/).filter(t => t.length > 0);
    const regexPattern = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(regexPattern);

    return (
      <span>
        {parts.map((part, index) =>
          terms.some(t => t.toLowerCase() === part.toLowerCase()) ? (
            <mark
              key={index}
              style={{ backgroundColor: 'var(--color-accentGreen)', color: 'var(--text-inverse-dark)' }}
              className="font-bold px-1 rounded"
            >
              {part}
            </mark>
          ) : (
            <React.Fragment key={index}>{part}</React.Fragment>
          )
        )}
      </span>
    );
  };

  // Agrupar documentos por categoría
  const docsByCategory = (documents || []).reduce((acc, doc) => {
    const cat = doc.category || 'Otros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {});

  return (
    <div className="w-full max-w-xl mx-auto p-3 sm:p-4 font-sans space-y-3" style={{ color: 'var(--text-main)' }}>
      {/* Botón Reutilizable Volver */}
      <BackButton onClick={onBackToFlights} />

      {/* Tarjeta Principal */}
      <div
        className="rounded-3xl p-5 sm:p-6 shadow-xl border space-y-5"
        style={{
          backgroundColor: 'var(--color-bgCard)',
          borderColor: 'var(--border-color)'
        }}
      >
        {/* Banner de error */}
        {error && (
          <div className="p-3 border rounded-2xl text-xs flex justify-between items-center bg-rose-500/10 border-rose-500/30 text-rose-500">
            <span>{error}</span>
            <button
              onClick={() => window.location.reload()}
              className="text-[10px] font-bold underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Header con Título e Ícono */}
        <div className="flex items-start justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div
              className="p-3 rounded-2xl border shrink-0"
              style={{
                backgroundColor: 'var(--accent-bg)',
                borderColor: 'var(--accent-border)',
                color: 'var(--color-accentBlue)'
              }}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'var(--text-principal)' }}>
                Buscador Técnico Operativo
              </h1>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-sub)' }}>
                Manuales, RTMs, RTAs y Comunicados
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowManager(!showManager)}
            className="font-bold px-3 py-1.5 rounded-xl text-[11px] transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border"
            style={{
              backgroundColor: 'var(--color-bgInput)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-main)'
            }}
          >
            <Settings2 className="w-3.5 h-3.5" style={{ color: 'var(--text-sub)' }} />
            <span>{showManager ? 'Buscador' : 'Gestionar'}</span>
          </button>
        </div>

        {/* Sección de Carga / Indexación */}
        <div
          className="p-3.5 rounded-2xl border flex flex-col gap-2.5"
          style={{
            backgroundColor: 'var(--color-bgInput)',
            borderColor: 'var(--border-color)'
          }}
        >
          <label className="text-xs font-bold px-0.5 tracking-wide" style={{ color: 'var(--text-main)' }}>
            Categoría a Indexar:
          </label>
          <div className="flex items-center gap-2">
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="border text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer flex-1 min-w-0"
              style={{
                backgroundColor: 'var(--color-bgCard)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-main)'
              }}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => handleSelectAndIndex(null)}
              disabled={isProcessing}
              className="font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              style={{
                backgroundColor: 'var(--color-accentGreen)',
                color: 'var(--text-inverse-dark)'
              }}
            >
              {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span>{isProcessing ? 'Procesando...' : 'Indexar PDF'}</span>
            </button>
          </div>
        </div>

        {/* Filtros de Categorías */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-0.5" style={{ color: 'var(--text-sub)' }}>
            <Filter className="w-3 h-3" />
            <span>Filtrar por tipo</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 touch-pan-x no-scrollbar">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('TODAS');
                if (query) handleSearch(query, 'TODAS');
              }}
              className="text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all shrink-0 cursor-pointer"
              style={selectedCategory === 'TODAS' ? {
                backgroundColor: 'var(--color-accentBlue)',
                color: '#FFFFFF',
                borderColor: 'var(--color-accentBlue)'
              } : {
                backgroundColor: 'var(--color-bgInput)',
                color: 'var(--text-sub)',
                borderColor: 'transparent'
              }}
            >
              TODAS
            </button>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    if (query) handleSearch(query, cat);
                  }}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all shrink-0 cursor-pointer"
                  style={isSelected ? {
                    backgroundColor: 'var(--color-accentBlue)',
                    color: '#FFFFFF',
                    borderColor: 'var(--color-accentBlue)'
                  } : {
                    backgroundColor: 'var(--color-bgInput)',
                    color: 'var(--text-sub)',
                    borderColor: 'transparent'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Input de Búsqueda */}
        {!showManager && (
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3" style={{ color: 'var(--text-sub)' }} />
            <input
              type="text"
              placeholder="Buscar término o código (ej: UMNR, RTM, Menor)..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full border rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none transition-all font-medium"
              style={{
                backgroundColor: 'var(--color-bgInput)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-main)'
              }}
            />
          </div>
        )}

        {/* PANEL DE GESTIÓN */}
        {showManager && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-xs font-black uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-principal)' }}>
                <Settings2 className="w-3.5 h-3.5" />
                Documentos Guardados ({documents.length})
              </h2>
              <button
                type="button"
                onClick={loadAndIndexDocs}
                className="text-[11px] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                style={{ color: 'var(--color-accentGreen)' }}
              >
                <RefreshCw className="w-3 h-3" />
                Actualizar lista
              </button>
            </div>
            {documents.length === 0 ? (
              <p className="text-xs text-center py-6" style={{ color: 'var(--text-sub)' }}>No hay documentos guardados en el sistema.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all"
                    style={{
                      backgroundColor: 'var(--color-bgInput)',
                      borderColor: 'var(--border-color)'
                    }}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase"
                          style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--color-accentBlue)' }}
                        >
                          {doc.category || 'Otros'}
                        </span>
                        <span className="text-[10px] font-semibold" style={{ color: 'var(--text-sub)' }}>
                          {doc.pdfBlob ? 'DB Completa' : 'Solo Índice'}
                        </span>
                      </div>
                      <p className="text-xs font-bold truncate" style={{ color: 'var(--text-main)' }}>{doc.title}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-sub)' }}>
                        {doc.totalPages} págs · {new Date(doc.updatedAt || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSelectAndIndex(doc.id)}
                        disabled={isProcessing}
                        className="p-1.5 rounded-xl transition-all cursor-pointer"
                        style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--color-accentBlue)' }}
                        title="Re-indexar"
                      >
                        <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('¿Eliminar documento?')) deleteDocument(doc.id);
                        }}
                        className="p-1.5 rounded-xl transition-all cursor-pointer hover:bg-rose-500/20 text-rose-500"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RESULTADOS DE BÚSQUEDA CON LAZY LOADING */}
        {!showManager && (
          <div className="space-y-3 pt-1">
            {query.trim().length > 0 && (
              <div className="text-[10px] uppercase font-bold tracking-wider px-1" style={{ color: 'var(--text-sub)' }}>
                Coincidencias encontradas: <strong style={{ color: 'var(--text-principal)' }}>{results.length}</strong>
              </div>
            )}
            {results.map((res, idx) => {
              const isLast = idx === results.length - 1;
              return (
                <div
                  key={res.id}
                  ref={isLast ? lastDocRef : null}
                  className="border rounded-2xl p-4 space-y-2.5 transition-all shadow-sm"
                  style={{
                    backgroundColor: 'var(--color-bgInput)',
                    borderColor: 'var(--border-color)'
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase"
                      style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--color-accentYellow)' }}
                    >
                      {res.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenDocument(res.docId, res.pageNumber)}
                      className="text-[11px] px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0"
                      style={{
                        backgroundColor: 'var(--color-accentBlue)',
                        color: '#FFFFFF'
                      }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Pág. {res.pageNumber}</span>
                    </button>
                  </div>
                  <div
                    className="text-xs p-3 rounded-xl border font-mono leading-relaxed break-words whitespace-pre-line"
                    style={{
                      backgroundColor: 'var(--color-bgCard)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-main)'
                    }}
                  >
                    {renderHighlightedParagraph(res.content, query)}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-sub)' }}>
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      Fuente: <strong style={{ color: 'var(--text-main)' }}>{res.title}</strong> (Pág. {res.pageNumber})
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Indicador de carga */}
            {results.length > 0 && (
              <div className="p-4 text-center">
                <Loader2 className="w-5 h-5 animate-spin text-cyberCyan mx-auto" />
                <p className="text-[10px] text-textSub mt-1">Cargando más resultados...</p>
              </div>
            )}

            {query.trim().length > 0 && results.length === 0 && (
              <div
                className="p-8 text-center text-xs rounded-2xl border"
                style={{
                  backgroundColor: 'var(--color-bgInput)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-sub)'
                }}
              >
                No se encontraron coincidencias para "{query}".
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL ALMACENAMIENTO */}
      {showStorageModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border"
            style={{
              backgroundColor: 'var(--color-bgCard)',
              borderColor: 'var(--border-color)'
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="text-xs font-black uppercase flex items-center gap-2" style={{ color: 'var(--text-principal)' }}>
                <Settings2 className="w-4 h-4" />
                Modo de Almacenamiento
              </h3>
              <button
                type="button"
                onClick={() => setShowStorageModal(false)}
                className="cursor-pointer"
                style={{ color: 'var(--text-sub)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-sub)' }}>
              Elige cómo deseas guardar <strong style={{ color: 'var(--text-main)' }}>{pendingFile?.name}</strong>:
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleConfirmSave(false)}
                className="w-full border p-3 rounded-2xl flex items-start gap-3 text-left transition-all cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-bgInput)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <HardDrive className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--color-accentBlue)' }} />
                <div>
                  <div className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>Carpeta Local (Liviano)</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-sub)' }}>Guarda solo el índice. La base de datos se mantiene ligera.</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleConfirmSave(true)}
                className="w-full border p-3 rounded-2xl flex items-start gap-3 text-left transition-all cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent-bg)',
                  borderColor: 'var(--accent-border)'
                }}
              >
                <Database className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--color-accentBlue)' }} />
                <div>
                  <div className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>Base de Datos (Completo)</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-sub)' }}>Guarda el índice y el PDF en IndexedDB para lectura inmediata sin pedir archivo.</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VISOR MODAL EN CANVAS */}
      {activePdfFile && (
        <PdfViewerModal
          pdfFile={activePdfFile}
          initialPage={targetPage}
          title={pdfTitle}
          onClose={() => setActivePdfFile(null)}
        />
      )}
    </div>
  );
}