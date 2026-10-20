import React, { useState, useMemo, memo } from 'react';
import { Heart, BookOpen, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import SpndModal from '../modals/SpndModal';

// ✅ Subcomponente memoizado para cada badge vertical (expandido)
const SpndBadgeVertical = memo(function SpndBadgeVertical({ code, count }) {
  return (
    <div className="flex flex-col items-center justify-center min-w-[46px] px-2.5 py-1.5 rounded-xl bg-bgInput border border-borderCard shadow-sm select-none hover:border-cyberCyan/40 transition-all">
      <span className="text-[10px] font-mono font-black text-cyberCyan tracking-wider leading-none">
        {code}
      </span>
      <span className="text-xs font-mono font-black text-cyberYellow leading-none pt-1">
        {count}
      </span>
    </div>
  );
});

// ✨ PILLS CRÍTICOS MÁS GRANDES Y VISIBLES (WCH / UM)
const SpndCriticalPill = memo(function SpndCriticalPill({ code, count }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-cyberCyan/05 text-cyberYellow px-3 py-1.5 rounded-sm text-sm font-mono font-black leading-none animate-pulse">
      <span className="text-sm tracking-wide">{code}</span>
      <span className="text-base font-black text-textInverseDark bg-cyberYellow px-2 py-1 rounded-lg leading-none">
        {count}
      </span>
    </span>
  );
});

function SpndCard({
  spndList = [],
  onSaveSpnd,
  readOnly = false,
  collapsible = true,
  defaultOpen = true
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isSpndModalOpen, setIsSpndModalOpen] = useState(false);

  // ✅ Memoizado: total general + códigos críticos (WCH y UM)
  const { totalCount, criticalSpnds } = useMemo(() => {
    const list = spndList || [];
    const total = list.reduce((acc, item) => acc + (Number(item.count) || 0), 0);
    
    // Solo extraer WCH y UM (los operacionalmente críticos)
    const critical = list
      .filter((item) => {
        const code = (item.code || '').toUpperCase();
        return (code === 'WCH' || code === 'UM') && Number(item.count) > 0;
      })
      .map((item) => ({ code: item.code.toUpperCase(), count: Number(item.count) }));
    
    return { totalCount: total, criticalSpnds: critical };
  }, [spndList]);

  const hasCriticalSpnds = criticalSpnds.length > 0;

  return (
    <>
      <div className="bg-bgCard border border-borderCard rounded-2xl p-3.5 space-y-3 shadow-sm transition-all">
        {/* Encabezado principal */}
        <div className="flex items-center justify-between gap-2">
          <div
            onClick={() => collapsible && setIsOpen(!isOpen)}
            className={`flex items-center gap-2 min-w-0 ${collapsible ? 'cursor-pointer select-none group' : ''}`}
          >
            <div className="p-1 rounded-lg bg-cyberCyan/10 border border-cyberCyan/20 shrink-0">
              <Heart className="w-3.5 h-3.5 text-cyberCyan shrink-0 group-hover:scale-110 transition-transform" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-wider text-textPrincipal truncate">
              SPND
            </h4>
            {/* Badge del total (solo si hay SPNDs) */}
            {totalCount > 0 && (
              <span className="bg-cyberCyan/15 border border-cyberCyan/30 text-cyberCyan text-[10px] font-mono font-black px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(0,229,255,0.15)]">
                {totalCount}
              </span>
            )}
            {collapsible && (
              <div className="text-textSub group-hover:text-textMain transition-colors ml-0.5">
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            )}
          </div>

          {/* ✨ LADO DERECHO: Pills críticos (WCH/UM) + botones de acción */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Pills críticos solo visibles cuando está plegado Y hay WCH/UM */}
            {!isOpen && hasCriticalSpnds && (
              <div className="flex items-center gap-2">
                {criticalSpnds.map((item) => (
                  <SpndCriticalPill
                    key={item.code}
                    code={item.code}
                    count={item.count}
                  />
                ))}
              </div>
            )}

            {/* Botones de acción (solo visibles cuando está expandido) */}
            {isOpen && (
              <>
                <button
                  type="button"
                  onClick={() => setIsGlossaryOpen(!isGlossaryOpen)}
                  className="bg-cyberYellow/10 hover:bg-cyberYellow/20 border border-cyberYellow/30 text-cyberYellow px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <BookOpen className="w-3.5 h-3.5 text-cyberYellow" />
                  <span className="hidden min-[400px]:inline">Glosario</span>
                  <span className="min-[400px]:hidden">Glos.</span>
                </button>
                {!readOnly && onSaveSpnd && (
                  <button
                    type="button"
                    onClick={() => setIsSpndModalOpen(true)}
                    className="hover:bg-cyberPurple/80 border border-cyberPurpleBorder text-textMain px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-cyberCyan" />
                    <span className="hidden min-[400px]:inline">Gestionar SPND</span>
                    <span className="min-[400px]:hidden">Gestionar</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Contenido Desplegable */}
        {isOpen && (
          <>
            {isGlossaryOpen && (
              <div className="bg-bgInput border border-cyberYellow/30 rounded-xl p-3 text-[11px] text-textMain space-y-1 font-mono">
                <p className="font-bold border-b border-borderCard pb-1 text-cyberYellow text-[10px] tracking-wider uppercase">
                  Códigos SPND Comunes
                </p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1.5 text-[10px] text-textSub">
                  <span>• <strong className="text-textMain">WCHC:</strong> Silla cabina</span>
                  <span>• <strong className="text-textMain">WCHR:</strong> Silla rampa</span>
                  <span>• <strong className="text-textMain">UM:</strong> Menor no acom.</span>
                  <span>• <strong className="text-textMain">PETC:</strong> Mascota cabina</span>
                  <span>• <strong className="text-textMain">SVAN:</strong> Perro asist.</span>
                  <span>• <strong className="text-textMain">BLND/DEAF:</strong> Sensorial</span>
                </div>
              </div>
            )}
            {spndList.length === 0 ? (
              <div className="bg-bgCardHeader/40 border border-borderCard/60 rounded-xl py-3 text-center">
                <p className="text-xs font-medium text-textSub italic">
                  Sin necesidades especiales ingresadas
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {spndList.map((item, index) => (
                  <SpndBadgeVertical
                    key={item.code || index}
                    code={item.code}
                    count={item.count}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {!readOnly && onSaveSpnd && (
        <SpndModal
          isOpen={isSpndModalOpen}
          onClose={() => setIsSpndModalOpen(false)}
          spndList={spndList}
          onSave={onSaveSpnd}
        />
      )}
    </>
  );
}

// ✅ Componente principal memoizado
export default memo(SpndCard);