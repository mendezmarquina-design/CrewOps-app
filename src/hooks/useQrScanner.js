// src/hooks/useQrScanner.js
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { decodeFromQR } from '../utils/qrEngine';

export function useQrScanner(isOpen, qrRegionId, onDecoded) {
  const scannerRef = useRef(null);
  const [scanError, setScanError] = useState(null);

  const stopScanner = async () => {
    if (scannerRef.current) {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      try {
        if (scanner.isScanning) await scanner.stop();
        await scanner.clear();
      } catch (e) {
        console.error("Error al detener cámara:", e);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    let timer = null;

    if (isOpen) {
      setScanError(null);
      timer = setTimeout(() => {
        if (!document.getElementById(qrRegionId)) return;
        stopScanner();

        const html5QrcodeScanner = new Html5Qrcode(qrRegionId);
        scannerRef.current = html5QrcodeScanner;

        const config = { 
          fps: 15,
          aspectRatio: 1.0, // Forzar vista cuadrada 1:1 para evitar deformaciones
          qrbox: (w, h) => {
            // Calcula un recuadro de lectura cuadrado proporcional (75% de la menor dimensión)
            const minEdge = Math.min(w, h);
            const size = Math.floor(minEdge * 0.75);
            return { width: size, height: size };
          }
        };

        const handleSuccess = (text) => {
          if (!isMounted) return;
          const result = decodeFromQR(text);
          onDecoded(result ? result.data : text);
          stopScanner();
        };

        html5QrcodeScanner.start({ facingMode: "environment" }, config, handleSuccess, () => {})
          .catch(() => {
            html5QrcodeScanner.start({ facingMode: "user" }, config, handleSuccess, () => {})
              .catch(() => isMounted && setScanError("No se pudo activar la cámara. Revisa los permisos."));
          });
      }, 200);
    } else {
      stopScanner();
    }

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  return { scanError, stopScanner };
}