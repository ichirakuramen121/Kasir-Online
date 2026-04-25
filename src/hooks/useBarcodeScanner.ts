import { useEffect, useRef } from 'react';

type UseBarcodeScannerProps = {
  onScan: (barcode: string) => void;
  isActive?: boolean;
};

export function useBarcodeScanner({ onScan, isActive = true }: UseBarcodeScannerProps) {
  const buffer = useRef<string>('');
  const lastKeyTime = useRef<number>(Date.now());

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Input from physical barcode scanners come in very fast
      // Usually < 30ms between keystrokes.
      
      // Ignore if typing in textareas or inputs where we want normal typing
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA') return;
      
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime.current;

      // If it's been more than 50ms since last key, it's probably human typing
      // Reset the buffer
      if (timeDiff > 50) {
        buffer.current = '';
      }

      lastKeyTime.current = currentTime;

      // If Enter is pressed, check if we have a valid barcode in buffer
      if (e.key === 'Enter') {
        if (buffer.current.length >= 3) { // Arbitrary minimum length for a barcode
          onScan(buffer.current);
          buffer.current = '';
          
          // Optionally prevent form submission if this was a fast scan
          if (timeDiff <= 50) {
             e.preventDefault();
          }
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Collect the character
        buffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, onScan]);
}
