import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { X, ChevronLeft, ChevronRight, Loader2, FileText, ZoomIn, ZoomOut, RotateCw, Target } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = '';

export default function PdfViewerModal({ pdfFile, initialPage, title, onClose }) {
  const canvasRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(initialPage || 1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [loading, setLoading] = useState(true);
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

  // Renderizar página
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let renderTask = null;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const unscaledViewport = page.getViewport({ scale: 1.0 });

        // Escala base según orientación
        const containerWidth = window.innerWidth - 64;
        const containerHeight = window.innerHeight - 120;
        const baseScale = isLandscape
          ? containerHeight / unscaledViewport.height
          : containerWidth / unscaledViewport.width;

        const viewport = page.getViewport({ scale: Math.max(baseScale, 1) });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;
      } catch (err) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('Error al renderizar página:', err);
        }
      }
    };

    renderPage();
    return () => { if (renderTask) renderTask.cancel(); };
  }, [pdfDoc, currentPage, isLandscape]);

  useEffect(() => { setCurrentPage(initialPage || 1); }, [initialPage]);

  const handleToggleOrientation = () => setIsLandscape(l => !l);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' && currentPage > 1) setCurrentPage(p => p - 1);
      if (e.key === 'ArrowRight' && currentPage < totalPages) setCurrentPage(p => p + 1);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, onClose]);

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
          {/* Navegación */}
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

          {/* Orientación */}
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

      {/* ✅ ÁREA CON REACT-ZOOM-PAN-PINCH */}
      <div className="flex-1 bg-zinc-950 overflow-hidden relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-2 text-cyberCyan">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-xs font-mono">Cargando página {initialPage}...</span>
          </div>
        ) : (
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={4}
            centerOnInit={true}
            limitToBounds={false}
            wheel={{ step: 0.1 }}
            pinch={{ step: 5 }}
            doubleClick={{ disabled: false, step: 0.7 }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                {/* Controles flotantes de zoom */}
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => zoomIn()}
                    className="p-2 bg-bgCard border border-borderCard rounded-xl hover:bg-bgInput text-textMain cursor-pointer shadow-lg"
                    title="Acercar"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => zoomOut()}
                    className="p-2 bg-bgCard border border-borderCard rounded-xl hover:bg-bgInput text-textMain cursor-pointer shadow-lg"
                    title="Alejar"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => resetTransform()}
                    className="p-2 bg-bgCard border border-borderCard rounded-xl hover:bg-bgInput text-cyberYellow cursor-pointer shadow-lg"
                    title="Centrar vista"
                  >
                    <Target className="w-4 h-4" />
                  </button>
                </div>

                {/* Canvas con gestos */}
                <TransformComponent
                  wrapperClass="!w-full !h-full"
                  contentClass="!w-full !h-full flex items-center justify-center"
                >
                  <div className="shadow-2xl rounded-lg overflow-hidden border border-borderCard/40">
                    <canvas ref={canvasRef} className="block" />
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        )}

        {/* Indicador de gestos */}
        {!loading && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-mono px-3 py-1.5 rounded-full opacity-70 pointer-events-none">
            Pellizca para zoom · Arrastra para mover · Rueda para zoom
          </div>
        )}
      </div>
    </div>
  );
}