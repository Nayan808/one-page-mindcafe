"use client";

import { useEffect, useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import jsQR from "jsqr";

// Camera-based QR reader for the staff dashboard — pure client-side decode
// (jsQR against video frames drawn to an offscreen canvas), no network
// dependency and no paid scanning SDK. Falls back gracefully: if the
// camera can't be opened (permission denied, no camera, non-HTTPS origin),
// the parent still has the manual code-entry field.
export function QrScanner({ onDecode }: { onDecode: (text: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isActive) return;

    let stream: MediaStream | null = null;
    let frameId: number;
    let stopped = false;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (stopped || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        tick();
      } catch {
        setError("Couldn't access the camera — use manual entry below instead.");
        setIsActive(false);
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || stopped) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code?.data) {
            onDecode(code.data);
            setIsActive(false);
            return;
          }
        }
      }
      frameId = requestAnimationFrame(tick);
    }

    void start();

    return () => {
      stopped = true;
      cancelAnimationFrame(frameId);
      stream?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  if (!isActive) {
    return (
      <button
        type="button"
        onClick={() => {
          setError(null);
          setIsActive(true);
        }}
        className="pill-btn-outline w-full gap-1.5"
      >
        <ScanLine className="h-4 w-4" aria-hidden />
        scan qr code
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-ink/15 bg-black">
        <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
      </div>
      <canvas ref={canvasRef} className="hidden" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="button" onClick={() => setIsActive(false)} className="pill-btn-outline w-full">
        cancel scan
      </button>
    </div>
  );
}
