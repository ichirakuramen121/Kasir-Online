import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
  onResult: (result: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onResult, onClose }: BarcodeScannerProps) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.0 },
      false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear();
        onResult(decodedText);
      },
      (errorMessage) => {
        // Handle scan error (ignored usually)
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [onResult]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl overflow-hidden w-full max-w-sm flex flex-col shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 flex justify-between items-center bg-emerald-600 text-white shrink-0">
          <h3 className="font-bold text-lg">Scan Barcode</h3>
          <button 
            onClick={onClose}
            className="text-emerald-100 hover:text-white bg-emerald-700/50 rounded-full p-1.5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 bg-slate-100 flex flex-col items-center">
          <p className="text-xs text-slate-500 text-center mb-4 font-medium px-4">
            Arahkan kamera ke barcode kemasan produk (EAN/UPC/QR)
          </p>
          <div id="reader" className="w-full h-full min-h-[300px] bg-black rounded-2xl overflow-hidden border-2 border-slate-200"></div>
        </div>
      </div>
    </div>
  );
}
