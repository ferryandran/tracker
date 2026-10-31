"use client";

import { useState } from "react";

export default function Home() {
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "gagal");
      setResult(data);
    } catch (err: any) {
      setError(err.message || "terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Verifikasi Nomor HP</h1>
        <p className="text-slate-300 mb-6">
          Masukkan nomor HP. Sistem akan membuat link verifikasi yang harus dibuka oleh
          pemilik nomor untuk konfirmasi identitas dan sinkronisasi perangkat.
        </p>

        <form onSubmit={handleSubmit} className="bg-slate-700/50 p-6 rounded-xl shadow">
          <label className="block text-sm mb-2">Nomor HP</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="contoh: 08123456789"
            className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-3 rounded-lg font-semibold"
          >
            {loading ? "Memproses..." : "Buat Tracking"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">{error}</div>
        )}

        {result && (
          <div className="mt-6 bg-slate-700/50 p-6 rounded-xl space-y-3">
            <h2 className="text-xl font-semibold">Link Verifikasi Siap</h2>
            <p className="text-sm text-slate-300">
              Bagikan link berikut ke pemilik nomor HP {result.phone}:
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={result.trackUrl}
                className="flex-1 px-3 py-2 rounded bg-slate-900 border border-slate-600 text-sm"
              />
              <button
                onClick={() => navigator.clipboard.writeText(result.trackUrl)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded"
              >
                Salin
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <a
                href={result.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center bg-green-600 hover:bg-green-700 py-3 rounded-lg font-semibold"
              >
                Kirim via WhatsApp
              </a>
              <a
                href={result.dashboardUrl}
                className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 py-3 rounded-lg font-semibold"
              >
                Lihat Dashboard
              </a>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Lokasi hanya akan terkirim jika pemilik nomor membuka link dan memberikan izin
              lokasi pada browser.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}