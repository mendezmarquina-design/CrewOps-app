import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Minus, Trash2 } from 'lucide-react';

const DEFAULT_CODES = ['BDAY', 'CHD', 'INF', 'UM', 'WCH', 'YPTA'];
const AUTOCOMPLETE_SUGGESTIONS = [
  'AVIH',
  'BLND',
  'CPAP',
  'DEAF',
  'PETC',
  'POC',
  'SPML',
  'WCHC',
  'WCHR',
  'WCHS'
];

export default function SpndModal({ isOpen, onClose, spndList = [], onSave }) {
  if (!isOpen) return null;

  const [counts, setCounts] = useState(() => {
    const initialMap = {};
    DEFAULT_CODES.forEach((code) => { initialMap[code] = 0; });
    spndList.forEach((item) => {
      if (item.code) initialMap[item.code.toUpperCase()] = item.count || 0;
    });
    return initialMap;
  });

  const [customList, setCustomList] = useState(() => {
    return spndList.filter((item) => !DEFAULT_CODES.includes(item.code?.toUpperCase()));
  });

  const [inputCode, setInputCode] = useState('');
  const [inputCountText, setInputCountText] = useState('1');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const filteredSuggestions = AUTOCOMPLETE_SUGGESTIONS.filter((sug) =>
    sug.toLowerCase().includes(inputCode.toLowerCase())
  );

  const updateDefaultCount = (code, delta) => {
    setCounts((prev) => ({
      ...prev,
      [code]: Math.max(0, (prev[code] || 0) + delta)
    }));
  };

  const handleDefaultInputChange = (code, val) => {
    if (val === '' || /^\d+$/.test(val)) {
      const parsed = parseInt(val, 10);
      setCounts((prev) => ({
        ...prev,
        [code]: isNaN(parsed) ? 0 : parsed
      }));
    }
  };

  const handleCountTextChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^[1-9]\d*$/.test(val)) {
      setInputCountText(val);
    }
  };

  const handleAddCustom = (e) => {
    e?.preventDefault();
    const cleanCode = inputCode.trim().toUpperCase();
    const parsedCount = parseInt(inputCountText || '1', 10);

    if (!cleanCode || isNaN(parsedCount) || parsedCount <= 0) return;

    if (DEFAULT_CODES.includes(cleanCode)) {
      updateDefaultCount(cleanCode, parsedCount);
    } else {
      setCustomList((prev) => {
        const existingIndex = prev.findIndex((i) => i.code === cleanCode);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex].count += parsedCount;
          return updated;
        }
        return [...prev, { code: cleanCode, count: parsedCount }];
      });
    }

    setInputCode('');
    setInputCountText('1');
    setIsDropdownOpen(false);
  };

  const selectSuggestion = (code) => {
    setInputCode(code);
    setIsDropdownOpen(false);
  };

  const removeCustom = (codeToRemove) => {
    setCustomList((prev) => prev.filter((item) => item.code !== codeToRemove));
  };

  const handleSaveAndClose = () => {
    const finalDefaults = DEFAULT_CODES
      .filter((code) => counts[code] > 0)
      .map((code) => ({ code, count: counts[code] }));

    onSave([...finalDefaults, ...customList]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-bgCard border border-borderCard w-full max-w-sm sm:max-w-md max-h-[85vh] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4 text-textMain transition-all">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-borderCard shrink-0">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-textPrincipal">
              PASAJEROS SPND
            </h3>
            <p className="text-xs text-textSub font-medium mt-0.5">Selección rápida de necesidades especiales</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-textSub hover:text-textMain p-1.5 rounded-xl hover:bg-bgInput transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LISTA CÓDIGOS FRECUENTES */}
        <div className="space-y-2 overflow-y-auto pr-1 max-h-[380px] custom-scrollbar grow">
          {DEFAULT_CODES.map((code) => {
            const currentVal = counts[code] || 0;
            const isActive = currentVal > 0;

            return (
              <div
                key={code}
                className={`flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-cyberCyan/10 border border-cyberCyan/40'
                    : 'bg-bgInput border border-borderCard/40'
                }`}
              >
                <span className={`text-xs font-mono font-black ${isActive ? 'text-cyberCyan' : 'text-textSub'}`}>
                  {code}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateDefaultCount(code, -1)}
                    disabled={currentVal === 0}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      currentVal > 0 
                        ? 'bg-bgCard border border-borderCard hover:bg-bgInput text-textMain active:scale-95' 
                        : 'text-textSub opacity-30 cursor-not-allowed'
                    }`}
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    inputMode="numeric"
                    value={currentVal}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleDefaultInputChange(code, e.target.value)}
                    className={`w-8 text-center bg-transparent font-mono text-sm font-black focus:outline-none ${
                      isActive ? 'text-cyberYellow' : 'text-textSub'
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => updateDefaultCount(code, 1)}
                    className="w-8 h-8 rounded-xl bg-bgCard border border-borderCard hover:border-cyberCyan/50 text-textSub hover:text-cyberCyan flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* INPUT OTROS CÓDIGOS */}
        <div className="pt-3 border-t border-borderCard space-y-2.5 relative shrink-0" ref={dropdownRef}>
          <form onSubmit={handleAddCustom} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="CÓDIGO (EJ: BLND)"
                value={inputCode}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setInputCode(e.target.value.toUpperCase());
                  setIsDropdownOpen(true);
                }}
                className="w-full bg-bgInput border border-borderCard focus:border-cyberCyan rounded-2xl px-3.5 py-2.5 text-xs font-mono font-bold text-textMain placeholder:text-textSub/50 focus:outline-none uppercase transition-all"
              />

              {/* DESPLEGABLE AUTOCOMPLETADO */}
              {isDropdownOpen && filteredSuggestions.length > 0 && (
                <div className="absolute bottom-full mb-1 left-0 w-full bg-bgCard border border-cyberCyan/30 rounded-2xl shadow-2xl max-h-40 overflow-y-auto z-50 custom-scrollbar">
                  {filteredSuggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => selectSuggestion(sug)}
                      className="w-full text-left px-3.5 py-2.5 text-xs font-mono font-bold text-textSub hover:bg-cyberCyan/20 hover:text-cyberCyan transition-colors border-b border-borderCard last:border-0 cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* CAMPO NUMÉRICO OPTIMIZADO */}
            <input
              type="text"
              inputMode="numeric"
              placeholder="1"
              value={inputCountText}
              onFocus={(e) => {
                e.target.select();
                if (inputCountText === '1') setInputCountText('');
              }}
              onBlur={() => {
                if (!inputCountText || parseInt(inputCountText, 10) <= 0) {
                  setInputCountText('1');
                }
              }}
              onChange={handleCountTextChange}
              className="w-12 bg-bgInput border border-borderCard focus:border-cyberCyan rounded-2xl text-center text-xs font-mono font-bold text-cyberYellow focus:outline-none transition-all"
            />

            <button
              type="submit"
              className="bg-cyberCyan/20 hover:bg-cyberCyan/30 border border-cyberCyan/40 text-cyberCyan px-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-center active:scale-95 shadow-md"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {/* CÓDIGOS PERSONALIZADOS AGREGADOS */}
          {customList.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 max-h-24 overflow-y-auto custom-scrollbar">
              {customList.map((item) => (
                <span
                  key={item.code}
                  className="bg-cyberCyan/10 border border-cyberCyan/40 text-cyberCyan px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2"
                >
                  {item.code} <span className="text-cyberYellow font-black">x{item.count}</span>
                  <button
                    type="button"
                    onClick={() => removeCustom(item.code)}
                    className="text-textSub hover:text-red-400 cursor-pointer transition-colors ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* BOTÓN GUARDAR */}
        <button
          type="button"
          onClick={handleSaveAndClose}
          className="w-full bg-cyberPurple border border-cyberPurpleBorder hover:brightness-110 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer active:scale-[0.98] shrink-0"
        >
          Guardar Selección
        </button>

      </div>
    </div>
  );
}