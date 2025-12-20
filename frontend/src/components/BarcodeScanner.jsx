import { useEffect } from "react";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";

export default function BarcodeScanner({ onScan, onClose }) {
  useEffect(() => {
    const scanner = new Html5Qrcode("barcode-reader");

    scanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 320, height: 120 },

        // ✅ ONLY CODE-128
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
        ],
      },
      (decodedText) => {
        console.log("CODE-128 SCANNED:", decodedText);
        onScan(decodedText);
        scanner.stop().then(() => scanner.clear());
      },
      () => {}
    ).catch((err) => {
      console.error("Camera error:", err);
    });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg w-[340px]">
        <p className="text-xs text-gray-500 text-center mb-2">
          Scan CODE-128 barcode
        </p>

        <div id="barcode-reader" />

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full text-sm text-red-500"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
