// src/hooks/useQrScanner.js
import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { decodeFromQR } from '../utils/qrEngine';

// ---------------------------------------------------------------------------
// 1. CONSTANTES (fuera del hook, no se recrean)
// ---------------------------------------------------------------------------
const QR_CONFIG = {
  fps: 15,
  aspectRatio: 1.0, // Vista cuadrada 1:1 para evitar deformaciones
  qrbox: (w, h) => {
    const minEdge = Math.min(w, h);
    const size = Math.floor(minEdge * 0.75);
    return { width: size, height: size };
  }
};

// Mensajes de error específicos
const ERROR_MESSAGES = {
  PERMISSION: 'Permiso de cámara denegado. Habilita el acceso en la configuración del navegador.',
  NOT_FOUND: 'No se encontró ninguna cámara disponible en este dispositivo.',
  GENERIC: 'No se pudo activar la cámara. Revisa los permisos o intenta de nuevo.'
};

// ---------------------------------------------------------------------------
// 2. HOOK PRINCIPAL
// ---------------------------------------------------------------------------
export function useQrScanner(isOpen, qrRegionId, onDecoded) {
  const scannerRef = useRef(null);
  const onDecodedRef = useRef(onDecoded); // Ref para evitar closures obsoletos
  const [scanError, setScanError] = useState(null);

  // Mantener onDecodedRef siempre actualizado sin recrear el efecto
  useEffect(() => {
    onDecodedRef.current = onDecoded;
  }, [onDecoded]);

  // ---------------------------------------------------------------------------
  // 2.1 FUNCIÓN PARA DETENER EL ESCÁNER (memoizada)
  // ---------------------------------------------------------------------------
  const stopScanner = useCallback(async () => {
    if (!scannerRef.current) return;
    
    const scanner = scannerRef.current;
    scannerRef.current = null;

    try {
      // Verificar si está escaneando antes de detener
      if (scanner.isScanning) {
        await scanner.stop();
      }
      scanner.clear();
    } catch (e) {
      console.error('Error al detener cámara:', e);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // 2.2 FUNCIÓN PARA CLASIFICAR ERRORES
  // ---------------------------------------------------------------------------
  const classifyError = useCallback((error) => {
    const errorMessage = error?.message || error?.name || '';
    
    if (errorMessage.includes('NotAllowedError') || errorMessage.includes('Permission')) {
      return ERROR_MESSAGES.PERMISSION;
    }
    if (errorMessage.includes('NotFoundError') || errorMessage.includes('DevicesNotFound')) {
      return ERROR_MESSAGES.NOT_FOUND;
    }
    return ERROR_MESSAGES.GENERIC;
  }, []);

  // ---------------------------------------------------------------------------
  // 2.3 FUNCIÓN PARA INICIAR EL ESCÁNER
  // ---------------------------------------------------------------------------
  const startScanner = useCallback(async () => {
    // Verificar que el elemento DOM exista
    const element = document.getElementById(qrRegionId);
    if (!element) {
      console.warn(`Elemento con id "${qrRegionId}" no encontrado.`);
      return;
    }

    // Detener cualquier escáner anterior
    await stopScanner();

    try {
      const html5QrcodeScanner = new Html5Qrcode(qrRegionId);
      scannerRef.current = html5QrcodeScanner;

      // Handler de éxito
      const handleSuccess = (text) => {
        // Verificar que el callback exista antes de llamarlo
        if (onDecodedRef.current) {
          const result = decodeFromQR(text);
          onDecodedRef.current(result ? result.data : text);
        }
        // Detener el escáner después de un escaneo exitoso
        stopScanner();
      };

      // Handler de error de frame (se ignora, es normal durante el escaneo)
      const handleFrameError = () => {};

      // Intentar con cámara trasera primero
      try {
        await html5QrcodeScanner.start(
          { facingMode: 'environment' },
          QR_CONFIG,
          handleSuccess,
          handleFrameError
        );
      } catch (backCameraError) {
        // Fallback a cámara frontal
        try {
          await html5QrcodeScanner.start(
            { facingMode: 'user' },
            QR_CONFIG,
            handleSuccess,
            handleFrameError
          );
        } catch (frontCameraError) {
          const errorMessage = classifyError(frontCameraError);
          setScanError(errorMessage);
          await stopScanner();
        }
      }
    } catch (error) {
      const errorMessage = classifyError(error);
      setScanError(errorMessage);
      await stopScanner();
    }
  }, [qrRegionId, stopScanner, classifyError]);

  // ---------------------------------------------------------------------------
  // 2.4 EFECTO PRINCIPAL (con dependencias completas)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    let animationFrameId = null;

    if (isOpen) {
      setScanError(null);

      // Usar requestAnimationFrame en lugar de setTimeout para mayor precisión
      const waitForElement = () => {
        if (!isMounted) return;
        
        const element = document.getElementById(qrRegionId);
        if (element) {
          startScanner();
        } else {
          // Si el elemento aún no existe, intentar en el siguiente frame
          animationFrameId = requestAnimationFrame(waitForElement);
        }
      };

      animationFrameId = requestAnimationFrame(waitForElement);
    } else {
      stopScanner();
    }

    // Cleanup
    return () => {
      isMounted = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      stopScanner();
    };
  }, [isOpen, qrRegionId, startScanner, stopScanner]);

  // ---------------------------------------------------------------------------
  // 2.5 RETURN
  // ---------------------------------------------------------------------------
  return {
    scanError,
    stopScanner
  };
}