import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { X, ChevronLeft, ChevronRight, Loader2, FileText } from 'lucide-react';

// 🛑 DESACTIVAR WORKERS:
// Al asignar un string vacío o nulo, PDF.js procesa el archivo en el hilo principal sin hacer NINGUNA petición a la red/servidor.
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

export default function PdfViewerModal({ pdfFile, initialPage, title, onClose }) {
  const canvasRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(initialPage || 1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadPdf = async () => {
      setLoading(true);
      try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        // disableWorker: true fuerza el procesamiento 100% local en memoria
        const loadedPdf = await pdfjsLib.getDocument({ 
          data: arrayBuffer,
          disableWorker: true 
        }).promise;
        
        if (active) {
          setPdfDoc(loadedPdf);
          setTotalPages(loadedPdf.numPages);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error al cargar el PDF en Canvas:', error);
        setLoading(false);
      }
    };

    if (pdfFile) loadPdf();

    return () => { active = false; };
  }, [pdfFile]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let renderTask = null;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        const containerWidth = canvas.parentElement.clientWidth - 24;
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const scale = containerWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale: Math.max(scale, 1.2) });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (err) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('Error al renderizar página:', err);
        }
      }
    };

    renderPage();

    return () => {
      if (renderTask) renderTask.cancel();
    };
  }, [pdfDoc, currentPage]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-2 sm:p-4 animate-fadeIn">
      <div className="bg-bgCard border border-borderCard rounded-2xl flex flex-col h-full overflow-hidden shadow-2xl">
        
        {/* BARRA SUPERIOR CON CONTROLES */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-borderCard bg-bgInput shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-cyberCyan shrink-0" />
            <span className="text-xs font-bold text-textMain font-mono truncate max-w-[130px] sm:max-w-xs">{title}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-bgCard border border-borderCard/80 rounded-xl px-2 py-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-1 hover:bg-bgInput rounded-lg text-textMain disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-[11px] font-mono font-bold text-cyberCyan px-1">
              {currentPage} / {totalPages || '--'}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-1 hover:bg-bgInput rounded-lg text-textMain disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-textSub hover:text-textMain hover:bg-bgCardHeader transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ÁREA DE VISUALIZACIÓN EN CANVAS */}
        <div className="flex-1 bg-zinc-950 overflow-auto p-2 flex justify-center items-start">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-2 text-cyberCyan">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-mono">Cargando página {initialPage}...</span>
            </div>
          ) : (
            <div className="shadow-2xl rounded-lg overflow-hidden my-auto border border-borderCard/40">
              <canvas ref={canvasRef} className="block max-w-full h-auto" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}