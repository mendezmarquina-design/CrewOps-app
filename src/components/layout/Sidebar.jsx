// src/components/layout/Sidebar.jsx
import React from 'react';
import { 
  X, 
  Plane, 
  FileText, 
  CheckSquare, 
  RefreshCw, 
  Settings, 
  Calendar, 
  ClipboardList, 
  FileCheck,
  BookOpen
} from 'lucide-react';
import ThemeSelector from './ThemeSelector';

export default function Sidebar({ isOpen, onClose, currentTab, setCurrentTab }) {
  if (!isOpen) return null;

  const navItems = [
    { id: 'flights', label: 'Vuelos del Día', icon: Plane },
    { id: 'itinerary', label: 'Gestión de Itinerarios', icon: Calendar },
    { id: 'reports', label: 'Gestión de Reportes', icon: ClipboardList },
    { id: 'gce', label: 'Gestión GCE', icon: FileCheck },
    { id: 'documents', label: 'Buscador de Manuales', icon: BookOpen },
    { id: 'aircrafts', label: 'Gestión de Matrículas', icon: Settings },
    { id: 'briefing', label: 'Briefing y Documentos', icon: FileText },
    { id: 'checklist', label: 'Listas de Chequeo', icon: CheckSquare },
    { id: 'sync', label: 'Estado de Sincronización', icon: RefreshCw },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-fadeIn" 
        onClick={onClose}
      />

      {/* Contenedor Lateral táctico */}
      <div className="relative w-72 bg-bgCard border-r border-borderCard h-full p-4 flex flex-col justify-between z-10 shadow-2xl transition-all transform animate-slideInLeft">
        <div className="space-y-6">
          
          {/* Header del Sidebar */}
          <div className="flex items-center justify-between border-b border-borderCard pb-3.5">
            <div className="flex items-center gap-2.5">
              <img src="/favicon.svg" alt="CabinOps Logo" className="w-6 h-6 shrink-0" />
              <span className="font-black text-xs tracking-widest text-textPrincipal uppercase">
                Menú Principal
              </span>
            </div>
            
            <button 
              type="button"
              onClick={onClose}
              aria-label="Cerrar menú"
              className="p-1.5 rounded-lg text-textSub hover:text-textMain hover:bg-bgInput transition-colors cursor-pointer active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navegación Principal */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setCurrentTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-[0.98] group ${
                    isActive 
                      ? 'bg-cyberCyan text-textInverseDark font-black shadow-lg shadow-cyberCyan/20' 
                      : 'text-textSub hover:bg-bgInput hover:text-textMain'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-textInverseDark stroke-[2.5]' : 'text-cyberCyan'
                    }`} />
                    <span>{item.label}</span>
                  </div>

                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Pie con Selector de Tema */}
        <div className="border-t border-borderCard pt-4 mt-auto space-y-2.5">
          <span className="text-[10px] font-black uppercase tracking-wider block px-1 text-textSub">
            Tema de Interfaz
          </span>
          <div className="bg-bgInput/50 border border-borderCard p-1 rounded-xl">
            <ThemeSelector />
          </div>
        </div>

      </div>
    </div>
  );
}