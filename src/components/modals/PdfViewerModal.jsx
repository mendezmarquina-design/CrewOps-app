import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { X, ChevronLeft, ChevronRight, Loader2, FileText, ZoomIn, ZoomOut, Maximize2, RotateCw, Target } from 'lucide-react';

// 🛑 DESACTIVAR WORKERS
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

export default function PdfViewerModal({ pdfFile, initialPage, title, onClose }) {
  const canvasRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(initialPage || 1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [isLandscape, setIsLandscape] = useState(false);

  // Cargar PDF
  useEffect(() => {
    let active = true;
    const loadPdf = async () => {
      setLoading(true);
      try {
        const arrayBuffer = await pdfFile.arrayBuffer();
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
        console.error('Error al cargar el PDF:', error);
        setLoading(false);
      }
    };
    if (pdfFile) loadPdf();
    return () => { active = false; };
  }, [pdfFile]);

  // Renderizar página con zoom aplicado al viewport de PDF.js
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let renderTask = null;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const unscaledViewport = page.getViewport({ scale: 1.0 });

        // Calcular escala base según orientación
        const container = scrollContainerRef.current;
        const containerWidth = container ? container.clientWidth - 32 : 800;
        const containerHeight = container ? container.clientHeight - 32 : 600;

        let baseScale;
        if (isLandscape) {
          // Horizontal: ajustar al alto del contenedor
          baseScale = containerHeight / unscaledViewport.height;
        } else {
          // Vertical: ajustar al ancho del contenedor
          baseScale = containerWidth / unscaledViewport.width;
        }

        // Aplicar zoom del usuario sobre la escala base
        const finalScale = baseScale * scale;
        const viewport = page.getViewport({ scale: Math.max(finalScale, 0.5) });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;

        // ✨ NUEVO: Centrar la vista después de renderizar
        if (scale > 1 && container) {
          const scrollLeft = (canvas.width - container.clientWidth) / 2;
          const scrollTop = (canvas.height - container.clientHeight) / 2;
          container.scrollLeft = Math.max(0, scrollLeft);
          container.scrollTop = Math.max(0, scrollTop);
        }
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
  }, [pdfDoc, currentPage, scale, isLandscape]);

  // Resetear zoom al cambiar de página
  useEffect(() => {
    setScale(1);
  }, [currentPage]);

  // Handlers de zoom
  const handleZoomIn = () => setScale(s => Math.min(3, +(s + 0.25).toFixed(2)));
  const handleZoomOut = () => setScale(s => Math.max(0.5, +(s - 0.25).toFixed(2)));
  const handleResetZoom = () => setScale(1);
  const handleToggleOrientation = () => setIsLandscape(l => !l);

  // ✨ NUEVO: Centrar la vista
  const handleCenterView = useCallback(() => {
    const container = scrollContainerRef.current;
    const canvas = canvasRef.current;
    if (container && canvas) {
      container.scrollTo({
        left: (canvas.width - container.clientWidth) / 2,
        top: (canvas.height - container.clientHeight) / 2,
        behavior: 'smooth'
      });
    }
  }, []);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' && currentPage > 1) setCurrentPage(p => p - 1);
      if (e.key === 'ArrowRight' && currentPage < totalPages) setCurrentPage(p => p + 1);
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
      if (e.key === '0') handleResetZoom();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, scale]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col animate-fadeIn">
      {/* BARRA SUPERIOR */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-borderCard bg-bgInput shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-cyberCyan shrink-0" />
          <span className="text-xs font-bold text-textMain font-mono truncate max-w-[130px] sm:max-w-xs">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Navegación de páginas */}
          <div className="flex items-center gap-1.5 bg-bgCard border border-borderCard/80 rounded-xl px-2 py-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-1 hover:bg-bgInput rounded-lg text-textMain disabled:opacity-30 cursor-pointer"
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
              className="p-1 hover:bg-bgInput rounded-lg text-textMain disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Controles de zoom */}
          <div className="flex items-center gap-1 bg-bgCard border border-borderCard/80 rounded-xl px-2 py-1">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="p-1 hover:bg-bgInput rounded-lg text-textMain disabled:opacity-30 cursor-pointer"
              title="Reducir zoom (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono font-bold text-cyberCyan px-1 min-w-[40px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= 3}
              className="p-1 hover:bg-bgInput rounded-lg text-textMain disabled:opacity-30 cursor-pointer"
              title="Aumentar zoom (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {scale !== 1 && (
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-1 hover:bg-bgInput rounded-lg text-textMain cursor-pointer"
                title="Resetear zoom (0)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* ✨ NUEVO: Botón centrar (solo visible con zoom) */}
          {scale > 1 && (
            <button
              type="button"
              onClick={handleCenterView}
              className="p-1.5 bg-bgCard border border-borderCard/80 rounded-xl hover:bg-bgInput text-cyberYellow cursor-pointer"
              title="Centrar vista"
            >
              <Target className="w-4 h-4" />
            </button>
          )}

          {/* ✨ NUEVO: Botón rotar orientación */}
          <button
            type="button"
            onClick={handleToggleOrientation}
            className={`p-1.5 border rounded-xl cursor-pointer transition-colors ${
              isLandscape
                ? 'bg-cyberCyan/20 border-cyberCyan/40 text-cyberCyan'
                : 'bg-bgCard border-borderCard/80 hover:bg-bgInput text-textMain'
            }`}
            title={isLandscape ? 'Vista vertical' : 'Vista horizontal'}
          >
            <RotateCw className="w-4 h-4" />
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

      {/* ✨ ÁREA DE VISUALIZACIÓN CON SCROLL NATIVO */}
      <div
        ref={scrollContainerRef}
        className="flex-1 bg-zinc-950 overflow-auto p-4 flex justify-center items-start"
        style={{ touchAction: 'pan-x pan-y' }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-2 text-cyberCyan">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-xs font-mono">Cargando página {initialPage}...</span>
          </div>
        ) : (
          <div className="shadow-2xl rounded-lg overflow-hidden border border-borderCard/40 my-auto">
            <canvas ref={canvasRef} className="block" />
          </div>
        )}
      </div>

      {/* Indicador de orientación */}
      {isLandscape && !loading && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-mono px-3 py-1.5 rounded-full opacity-70 pointer-events-none">
          📐 Vista horizontal · Scroll para desplazar
        </div>
      )}
    </div>
  );
}