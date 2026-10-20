import React, { useState } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import BackButton from '../components/common/BackButton';
import PdfViewerModal from '../components/modals/PdfViewerModal';
import {
  BookOpen, FileText, Search, Filter, Eye, Calendar,
  ChevronDown, ChevronUp, FolderOpen
} from 'lucide-react';

const CATEGORIES = ['Manuales', 'RTMs', 'RTAs', 'Comunicados', 'Boletines', 'Otros'];

const CATEGORY_COLORS = {
  'Manuales': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  'RTMs': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  'RTAs': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  'Comunicados': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  'Boletines': 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  'Otros': 'bg-slate-500/10 text-slate-400 border-slate-500/30'
};

export default function DocumentsLibraryView({ onBack }) {
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState(null);
  
  // Visor PDF
  const [activePdf, setActivePdf] = useState(null);
  const [activePage, setActivePage] = useState(1);
  const [activeTitle, setActiveTitle] = useState('');

  // Consulta reactiva de documentos
  const documents = useLiveQuery(async () => {
    const docs = await db.documents.toArray();
    return docs.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }, []);

  // Filtrar por categoría y búsqueda
  const filteredDocs = (documents || []).filter(doc => {
    const matchCategory = selectedCategory === 'TODAS' || doc.category === selectedCategory;
    const matchSearch = !searchQuery.trim() ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Agrupar por categoría
  const docsByCategory = filteredDocs.reduce((acc, doc) => {
    const cat = doc.category || 'Otros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {});

  const handleOpenDocument = async (doc) => {
    try {
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
      if (file) {
        setActivePdf(file);
        setActivePage(1);
        setActiveTitle(doc.title);
      } else {
        alert(`No se puede abrir "${doc.title}". El archivo PDF original no está disponible en el dispositivo.`);
      }
    } catch (err) {
      console.error('Error al abrir documento:', err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-CL', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto p-3 sm:p-4 font-sans space-y-3" style={{ color: 'var(--text-main)' }}>
      <BackButton onClick={onBack} title="Volver a Control de Vuelos" />

      {/* HEADER */}
      <div className="bg-bgCard border border-borderCard rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-cyberCyan/10 border border-cyberCyan/20">
            <FolderOpen className="w-5 h-5 text-cyberCyan" />
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-black uppercase tracking-wide text-textPrincipal">
              Biblioteca de Documentos
            </h1>
            <p className="text-[11px] text-textSub mt-0.5">
              {filteredDocs.length} documento{filteredDocs.length !== 1 ? 's' : ''} disponible{filteredDocs.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textSub" />
          <input
            type="text"
            placeholder="Buscar por título o categoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bgInput border border-borderCard rounded-xl pl-9 pr-4 py-2.5 text-xs text-textMain focus:outline-none focus:border-cyberCyan/60 transition-colors"
          />
        </div>

        {/* Filtros de categoría */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('TODAS')}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'TODAS'
                ? 'bg-cyberCyan text-bgApp border-cyberCyan'
                : 'bg-bgInput text-textSub border-borderCard hover:border-cyberCyan/40'
            }`}
          >
            TODAS
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyberCyan text-bgApp border-cyberCyan'
                  : 'bg-bgInput text-textSub border-borderCard hover:border-cyberCyan/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA DE DOCUMENTOS AGRUPADA */}
      <div className="space-y-2">
        {Object.keys(docsByCategory).length === 0 ? (
          <div className="bg-bgCard border border-borderCard rounded-2xl p-8 text-center">
            <FileText className="w-10 h-10 text-textSub/30 mx-auto mb-2" />
            <p className="text-xs text-textSub">
              {searchQuery
                ? `No hay documentos que coincidan con "${searchQuery}"`
                : 'No hay documentos en esta categoría'}
            </p>
          </div>
        ) : (
          Object.entries(docsByCategory).map(([category, docs]) => {
            const isExpanded = expandedCategory === category || selectedCategory !== 'TODAS';
            const colorClass = CATEGORY_COLORS[category] || CATEGORY_COLORS['Otros'];

            return (
              <div key={category} className="bg-bgCard border border-borderCard rounded-2xl overflow-hidden shadow-sm">
                {/* Header de categoría (clickeable para expandir/colapsar) */}
                <button
                  type="button"
                  onClick={() => setExpandedCategory(isExpanded ? null : category)}
                  className="w-full flex items-center justify-between p-3 hover:bg-bgCardHeader/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${colorClass}`}>
                      {category}
                    </span>
                    <span className="text-xs font-bold text-textMain">
                      {docs.length} documento{docs.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-textSub" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-textSub" />
                  )}
                </button>

                {/* Lista de documentos */}
                {isExpanded && (
                  <div className="border-t border-borderCard/50 divide-y divide-borderCard/30">
                    {docs.map(doc => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => handleOpenDocument(doc)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-bgInput/50 transition-colors text-left group"
                      >
                        <div className="p-2 rounded-lg bg-cyberCyan/10 border border-cyberCyan/20 shrink-0 group-hover:bg-cyberCyan/20 transition-colors">
                          <FileText className="w-4 h-4 text-cyberCyan" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-textMain truncate group-hover:text-cyberCyan transition-colors">
                            {doc.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-textSub flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {formatDate(doc.updatedAt)}
                            </span>
                            <span className="text-[10px] text-textSub">
                              · {doc.totalPages || '?'} págs
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 p-2 rounded-lg bg-cyberCyan/10 border border-cyberCyan/20 group-hover:bg-cyberCyan group-hover:text-bgApp transition-all">
                          <Eye className="w-4 h-4 text-cyberCyan group-hover:text-bgApp" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* VISOR PDF */}
      {activePdf && (
        <PdfViewerModal
          pdfFile={activePdf}
          initialPage={activePage}
          title={activeTitle}
          onClose={() => {
            setActivePdf(null);
            setActivePage(1);
            setActiveTitle('');
          }}
        />
      )}
    </div>
  );
}