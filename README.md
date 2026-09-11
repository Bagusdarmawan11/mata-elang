# 👁 Mata Elang — Indonesia Intelligence Dashboard
> React + Vite · Powered by PT Catindo Bagus Perkasa

## Jalankan Lokal
```bash
npm install
npm run dev
```
Buka `http://localhost:5173`

## Deploy ke Vercel
1. Upload folder ini ke GitHub (repo baru)
2. Buka [vercel.com](https://vercel.com) → **Add New Project** → import repo
3. Framework: **Vite** (auto-detected)
4. Klik **Deploy** → dapat URL publik!

## Struktur Project
```
src/
├── App.jsx                 # State utama
├── components/
│   ├── MapView.jsx         # Peta Leaflet + semua layer
│   ├── Header.jsx          # Top bar + stats
│   ├── Sidebar.jsx         # Layer controls
│   └── UI.jsx              # InfoPanel, Footer, Modals, Toast
├── hooks/
│   └── useIntelData.js     # Custom hooks data fetching
└── data/
    └── cctv.js             # Database 25 kamera CCTV
```

## API Keys (opsional)
Masukkan di **⚙ API KEYS** dalam app:
| Key | Fitur | Daftar di |
|-----|-------|-----------|
| NASA FIRMS | Titik api live | [firms.modaps.eosdis.nasa.gov](https://firms.modaps.eosdis.nasa.gov/api/map_key/) |
| TomTom | Traffic live | [developer.tomtom.com](https://developer.tomtom.com) |
