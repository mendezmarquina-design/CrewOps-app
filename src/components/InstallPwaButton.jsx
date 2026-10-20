// src/components/InstallPwaButton.jsx
import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (!deferredPrompt) return null;

  return (
    <button
      type="button"
      onClick={handleInstallClick}
      className="bg-cyberCyan text-black font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg hover:brightness-110 cursor-pointer transition-all"
    >
      <Download className="w-4 h-4" />
      <span>Instalar App</span>
    </button>
  );
}