import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function QrScanner({ onScanSuccess, onClose }) {
  const qrRef = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const startScanner = async () => {
      const html5QrCode = new Html5Qrcode("qr-reader");
      qrRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" }, // back camera
        {
          fps: 10,
          qrbox: 250, // square box
        },
        (decodedText) => {
          onScanSuccess(decodedText);
          stopScanner();
        }
      );

      startedRef.current = true;
    };

    const stopScanner = async () => {
      if (qrRef.current && startedRef.current) {
        try {
          await qrRef.current.stop();
          await qrRef.current.clear();
        } catch {}
      }
      qrRef.current = null;
      startedRef.current = false;
      onClose();
    };

    startScanner().catch(err => {
      console.error("Scanner start failed:", err);
      onClose();
    });

    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="mt-4 border rounded-lg p-2 bg-gray-50">
      <p className="text-sm text-gray-600 mb-2">
        Align QR code inside the box
      </p>

      {/* ⚠️ DO NOT set height */}
      <div
        id="qr-reader"
        style={{ width: "100%" }}
      />

      <button
        type="button"
        onClick={onClose}
        className="mt-2 text-sm text-red-600"
      >
        Stop Scan
      </button>
    </div>
  );
}
