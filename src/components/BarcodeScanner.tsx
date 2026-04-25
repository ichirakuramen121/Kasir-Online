import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, AlertCircle } from 'lucide-react';

interface BarcodeScannerProps {
  onResult: (result: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onResult, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let html5QrCode: Html5Qrcode | null = null;
    let isScanning = false;

    // Menunggu sedikit agar DOM id="reader" siap sepenuhnya sebelum initialize kamera
    const timer = setTimeout(() => {
      if (!isMounted) return;
      
      try {
        html5QrCode = new Html5Qrcode("reader");

        // Memulai kamera belakang (facingMode: environment)
        html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            if (isMounted && isScanning) {
              isScanning = false;
              html5QrCode?.stop()
                .then(() => onResult(decodedText))
                .catch(console.error);
            }
          },
          (errorMessage) => {
            // Abaikan peringatan sementara selama scanning (seperti barcode tidak fokus)
          }
        ).then(() => {
          isScanning = true;
        }).catch((err: any) => {
          if (isMounted) {
            console.error("Terjadi masalah akses kamera:", err);
            setError(err?.message || "Gagal mengakses kamera. Berikan izin kamera pada browser Anda.");
          }
        });
      } catch (err: any) {
         if (isMounted) {
            setError("Kamera tidak didukung oleh browser ini.");
         }
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (isScanning && html5QrCode) {
        html5QrCode.stop().catch(console.error);
      }
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
          {error ? (
            <div className="w-full flex flex-col items-center justify-center p-6 bg-red-50 border border-red-200 rounded-2xl text-center gap-3">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 mb-1">Akses Kamera Gagal</p>
                <p className="text-xs text-slate-600 font-medium">{error}</p>
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 text-xs font-bold text-red-600 hover:text-red-700"
              >
                Muat Ulang Halaman
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500 text-center mb-4 font-medium px-4">
                Arahkan kamera belakang ke barcode kemasan produk (EAN/UPC/QR)
              </p>
              <div id="reader" className="w-full min-h-[300px] bg-slate-800 rounded-2xl overflow-hidden border-4 border-slate-200 relative flex items-center justify-center text-slate-400">
                Lading Camera...
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
