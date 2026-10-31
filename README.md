# Tracking Lokasi via Nomor HP

Aplikasi full-stack (Next.js + React + TypeScript + Tailwind) untuk melacak lokasi
berdasarkan nomor HP. Pemilik nomor harus membuka link tracking dan memberikan izin
lokasi pada browser; lokasi dikirim secara berkala ke server dan ditampilkan di
dashboard.

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:3000

## Alur

1. Masukkan nomor HP di halaman utama.
2. Sistem membuat link tracking dan dashboard.
3. Bagikan link (via WhatsApp) ke pemilik nomor.
4. Pemilik nomor membuka link dan mengizinkan lokasi.
5. Buka dashboard untuk melihat lokasi terakhir dan riwayat pada peta.

## Catatan

- Data lokasi disimpan di `data/locations.json`.
- Tracking hanya aktif selama halaman tracking tetap terbuka.
- Izin lokasi wajib diberikan oleh pengguna target (browser geolocation).