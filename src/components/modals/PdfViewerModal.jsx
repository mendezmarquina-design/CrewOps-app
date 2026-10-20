import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { X, ChevronLeft, ChevronRight, Loader2, FileText, ZoomIn, ZoomOut } from 'lucide-react';

// 🛑 DESACTIVAR WORKERS:
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

export default function PdfViewerModal({ pdfFile, initialPage, title, onClose }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(initialPage || 1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para zoom y gestos táctiles
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  
  // Refs para tracking de gestos
  const touchStartRef = useRef({ x: 0, y: 0, distance: 0, time: 0 });
  const lastPositionRef = useRef({ x: 0, y: 0 });

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
        console.error('Error al cargar el PDF en Canvas:', error);
        setLoading(false);
      }
    };
    if (pdfFile) loadPdf();
    return () => { active = false; };
  }, [pdfFile]);

  // Renderizar página
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

  // Resetear zoom al cambiar de página
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsZoomed(false);
  }, [currentPage]);

  // Handlers de gestos táctiles
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Pinch zoom - dos dedos
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartRef.current.distance = Math.sqrt(dx * dx + dy * dy);
      touchStartRef.current.scale = scale;
    } else if (e.touches.length === 1) {
      // Swipe o pan - un dedo
      touchStartRef.current.x = e.touches[0].clientX;
      touchStartRef.current.y = e.touches[0].clientY;
      touchStartRef.current.time = Date.now();
      lastPositionRef.current = { ...position };
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    
    if (e.touches.length === 2) {
      // Pinch zoom en progreso
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const scaleChange = distance / touchStartRef.current.distance;
      const newScale = Math.max(1, Math.min(3, touchStartRef.current.scale * scaleChange));
      setScale(newScale);
      setIsZoomed(newScale > 1);
    } else if (e.touches.length === 1 && isZoomed) {
      // Pan cuando está zoomed
      const deltaX = e.touches[0].clientX - touchStartRef.current.x;
      const deltaY = e.touches[0].clientY - touchStartRef.current.y;
      setPosition({
        x: lastPositionRef.current.x + deltaX,
        y: lastPositionRef.current.y + deltaY
      });
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length === 0 && !isZoomed) {
      // Swipe para cambiar página (solo cuando NO hay zoom)
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartRef.current.x;
      const deltaY = touchEndY - touchStartRef.current.y;
      const timeDiff = Date.now() - touchStartRef.current.time;
      
      // Detectar swipe horizontal (umbral: 50px, tiempo máximo: 300ms)
      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) && timeDiff < 300) {
        if (deltaX > 0 && currentPage > 1) {
          // Swipe derecha - página anterior
          setCurrentPage(p => Math.max(1, p - 1));
        } else if (deltaX < 0 && currentPage < totalPages) {
          // Swipe izquierda - página siguiente
          setCurrentPage(p => Math.min(totalPages, p + 1));
        }
      }
    }
    
    // Resetear si no hay dedos
    if (e.touches.length < 2) {
      touchStartRef.current.distance = 0;
    }
  };

  // Controles de zoom con botones
  const handleZoomIn = () => {
    const newScale = Math.min(3, scale + 0.5);
    setScale(newScale);
    setIsZoomed(newScale > 1);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(1, scale - 0.5);
    setScale(newScale);
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 });
      setIsZoomed(false);
    }
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsZoomed(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-2 sm:p-4 animate-fadeIn">
      <div className="bg-bgCard border border-borderCard rounded-2xl flex flex-col h-full overflow-hidden shadow-2xl">
        {/* BARRA SUPERIOR CON CONTROLES */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-borderCard bg-bgInput shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-cyberCyan shrink-0" />
            <span className="text-xs font-bold text-textMain font-mono truncate max-w-[130px] sm:max-w-xs">{title}</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            {/* Controles de navegación */}
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

            {/* Controles de zoom */}
            <div className="flex items-center gap-1 bg-bgCard border border-borderCard/80 rounded-xl px-2 py-1">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={scale <= 1}
                className="p-1 hover:bg-bgInput rounded-lg text-textMain disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                title="Reducir zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono font-bold text-cyberCyan px-1 min-w-[32px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={scale >= 3}
                className="p-1 hover:bg-bgInput rounded-lg text-textMain disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                title="Aumentar zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              {isZoomed && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1 hover:bg-bgInput rounded-lg text-textMain cursor-pointer ml-1"
                  title="Resetear zoom"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-textSub hover:text-textMain hover:bg-bgCardHeader transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ÁREA DE VISUALIZACIÓN CON GESTOS TÁCTILES */}
        <div 
          ref={containerRef}
          className="flex-1 bg-zinc-950 overflow-hidden p-2 flex justify-center items-start relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: isZoomed ? 'pan-x pan-y' : 'pan-x' }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-2 text-cyberCyan">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-mono">Cargando página {initialPage}...</span>
            </div>
          ) : (
            <div 
              className="shadow-2xl rounded-lg overflow-hidden my-auto border border-borderCard/40 transition-transform duration-100"
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transformOrigin: 'center center'
              }}
            >
              <canvas ref={canvasRef} className="block max-w-full h-auto" />
            </div>
          )}

          {/* Indicador de gestos (solo en móvil) */}
          {!loading && !isZoomed && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-mono px-3 py-1.5 rounded-full opacity-70 pointer-events-none">
              ← Desliza para cambiar página →
            </div>
          )}
        </div>
      </div>
    </div>
  );
}