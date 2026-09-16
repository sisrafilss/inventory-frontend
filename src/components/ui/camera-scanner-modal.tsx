'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, RefreshCw, Barcode, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcodeValue: string) => void;
  title?: string;
}

export function CameraScannerModal({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Product Barcode',
}: CameraScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const scanningRef = useRef<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setErrorMsg(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment', // preference for back camera on phones
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      scanningRef.current = true;
      initBarcodeDetection(videoRef.current);
    } catch (err: any) {
      setErrorMsg(
        'Camera access denied or unavailable. You can type the barcode manually below.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    scanningRef.current = false;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const initBarcodeDetection = (videoEl: HTMLVideoElement | null) => {
    if (!videoEl) return;

    // Check native BarcodeDetector API support
    if ('BarcodeDetector' in window) {
      try {
        const detector = new (window as any).BarcodeDetector({
          formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'upc_e'],
        });

        const detectFrame = async () => {
          if (!scanningRef.current || !videoEl) return;
          try {
            const barcodes = await detector.detect(videoEl);
            if (barcodes && barcodes.length > 0) {
              const detectedVal = barcodes[0].rawValue;
              if (detectedVal) {
                onScan(detectedVal);
                toast.success(`Scanned: ${detectedVal}`);
                stopCamera();
                onClose();
                return;
              }
            }
          } catch {
            // ignore frame errors
          }
          if (scanningRef.current) {
            requestAnimationFrame(detectFrame);
          }
        };

        detectFrame();
      } catch {
        // BarcodeDetector failed, fallback
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;
    onScan(manualBarcode.trim());
    toast.success(`Entered Barcode: ${manualBarcode.trim()}`);
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#f0f4f8] dark:bg-slate-900 border border-[#004d00] dark:border-emerald-900 rounded-xs shadow-2xl w-full max-w-md flex flex-col overflow-hidden select-none">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#006400] dark:bg-emerald-950 text-white border-b border-[#004d00]">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-white" />
            <h2 className="text-xs font-bold tracking-wide uppercase">{title}</h2>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 rounded hover:bg-white/10 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Viewport */}
        <div className="p-4 space-y-3">
          <div className="relative w-full h-56 bg-slate-950 rounded-xs border-2 border-dashed border-emerald-600 overflow-hidden flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
            />

            {/* Target Reticle Overlay */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-56 h-28 border-2 border-emerald-400 rounded-sm bg-emerald-500/10 shadow-lg relative flex items-center justify-center">
                  <div className="w-full h-0.5 bg-red-500/80 animate-pulse shadow-md" />
                </div>
                <p className="text-[10px] text-white bg-black/60 px-2 py-0.5 rounded mt-2 font-mono">
                  Align Barcode inside frame
                </p>
              </div>
            )}

            {!cameraActive && (
              <div className="p-4 text-center text-slate-300 flex flex-col items-center gap-2">
                <Camera className="w-8 h-8 text-slate-500" />
                <p className="text-xs">{errorMsg || 'Initializing camera...'}</p>
                {errorMsg && (
                  <button
                    onClick={startCamera}
                    className="mt-1 px-3 py-1 bg-emerald-700 text-white text-xs font-bold rounded-xs hover:bg-emerald-800"
                  >
                    Retry Camera
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Manual Entry Fallback */}
          <form onSubmit={handleManualSubmit} className="space-y-2 pt-1 border-t border-neutral-300 dark:border-slate-800">
            <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Manual Barcode Input:
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Barcode className="w-4 h-4 text-neutral-400 absolute left-2 top-2" />
                <input
                  type="text"
                  placeholder="Enter or scan barcode here..."
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-700 rounded-xs text-xs font-mono font-bold"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="h-8 px-3 bg-[#006400] hover:bg-[#004d00] text-white font-bold text-xs rounded-xs shadow-xs cursor-pointer"
              >
                Submit
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#b0c8de] dark:bg-slate-800 border-t border-[#9fbcd6] dark:border-slate-700 flex justify-end">
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="h-6 px-3 bg-white text-neutral-800 border border-neutral-400 rounded-xs font-bold text-xs hover:bg-neutral-100 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
