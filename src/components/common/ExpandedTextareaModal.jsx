import React, { useState } from 'react';
import { Edit, X, Copy, Check } from 'lucide-react';

export default function ExpandedTextareaModal({
  isOpen,
  onClose,
  title = 'EDITAR TEXTO',
  value = '',
  onChange,
  maxLength = 1000
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!value.trim()) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      {/* Se eliminó 'border border-cyberCyan/60' del contenedor para quitar el borde exterior */}
      <div className="bg-bgCard rounded-2xl w-full h-[92vh] max-w-3xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* Encabezado */}
        <div className="px-4 py-3 border-b border-borderCard flex items-center justify-between bg-bgInput shrink-0">
          <div className="flex items-center gap-2">
            <Edit className="w-4 h-4 text-cyberCyan" />
            <h3 className="text-xs sm:text-sm font-black text-cyberCyan uppercase tracking-wider">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-textSub hover:text-textMain transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Área de Escritura */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col space-y-2 overflow-hidden bg-bgInput/50">
          <textarea
            maxLength={maxLength}
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Escriba aquí..."
            className="w-full flex-1 bg-bgInput border-cyberCyan/30 focus:border-cyberCyan rounded-xl p-4 sm:p-5 text-base sm:text-lg text-textMain outline-none resize-none leading-relaxed font-sans shadow-inner tracking-wide"
          />

          <div className="flex justify-between items-center text-xs font-mono text-textSub px-2 shrink-0">
            <span className="font-bold text-cyberCyan">PANTALLA COMPLETA</span>
            <span className="font-bold">{value.length}/{maxLength} CARACTERES</span>
          </div>
        </div>

        {/* Acciones Inferiores Equitativas */}
        <div className="p-3 border-t border-borderCard bg-bgInput flex gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!value.trim()}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer active:scale-98 ${
              copied
                ? 'bg-cyberGreen text-textInverseDark'
                : 'bg-cyberYellow hover:brightness-110 text-textInverseDark disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>¡COPIADO!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>COPIAR</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-bgCard border border-borderCard hover:border-cyberCyan/40 text-textMain py-3 px-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer active:scale-98"
          >
            LISTO
          </button>
        </div>

      </div>
    </div>
  );
}