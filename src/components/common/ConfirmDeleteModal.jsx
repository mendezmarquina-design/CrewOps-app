import React from 'react';
import { Trash2, AlertCircle } from 'lucide-react';

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "¿ELIMINAR REGISTRO?",
  description = "Esta acción no se podrá deshacer.",
  itemName = "",
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  iconType = "trash" // "trash" | "warning"
}) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-bgCard border border-borderCard text-textMain rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center space-y-4 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ícono superior circular adaptado al tema */}
        <div className="w-16 h-16 rounded-full bg-cyberCoral/10 border border-cyberCoral/20 flex items-center justify-center text-cyberCoral shadow-sm">
          {iconType === 'trash' ? (
            <Trash2 className="w-8 h-8 stroke-[1.75]" />
          ) : (
            <AlertCircle className="w-8 h-8 stroke-[1.75]" />
          )}
        </div>

        {/* Textos Informativos adaptados */}
        <div className="space-y-1.5">
          <h3 className="text-base font-black text-cyberCyan uppercase tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-textSub font-medium leading-relaxed">
            {description}{' '}
            {itemName && <strong className="text-textMain font-bold">{itemName}</strong>}
          </p>
        </div>

        {/* Botones de Acción adaptados */}
        <div className="flex items-center gap-3 w-full pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-bgInput hover:bg-bgCardHeader border border-borderCard text-textSub hover:text-textMain font-bold text-xs py-3 px-4 rounded-2xl transition-all cursor-pointer active:scale-95"
          >
            {cancelText}
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 bg-cyberCoral hover:brightness-110 text-white font-bold text-xs py-3 px-4 rounded-2xl transition-all shadow-md shadow-cyberCoral/20 cursor-pointer active:scale-95"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}