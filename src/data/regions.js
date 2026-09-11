// [minLon, minLat, maxLon, maxLat]
const PROVINCES = [
  { name: 'Aceh',                bounds: [94.9, 2.0,  98.6, 5.9]  },
  { name: 'Sumatera Utara',      bounds: [97.5, 1.0,  100.1,4.1]  },
  { name: 'Sumatera Barat',      bounds: [98.4,-3.2,  101.0,0.6]  },
  { name: 'Riau',                bounds: [100.1,-0.8, 103.0,2.5]  },
  { name: 'Kepulauan Riau',      bounds: [103.4,0.2,  109.1,4.0]  },
  { name: 'Jambi',               bounds: [101.0,-3.2, 105.0,0.1]  },
  { name: 'Bengkulu',            bounds: [101.1,-5.3, 103.0,-1.8] },
  { name: 'Sumatera Selatan',    bounds: [102.0,-5.6, 107.0,-1.6] },
  { name: 'Bangka Belitung',     bounds: [105.0,-4.1, 109.0,-1.1] },
  { name: 'Lampung',             bounds: [103.5,-6.1, 106.2,-3.4] },
  { name: 'DKI Jakarta',         bounds: [106.4,-6.4, 107.0,-5.9] },
  { name: 'Jawa Barat',          bounds: [105.1,-7.9, 108.8,-5.8] },
  { name: 'Banten',              bounds: [105.0,-7.1, 106.8,-5.7] },
  { name: 'Jawa Tengah',         bounds: [108.4,-8.1, 111.6,-5.9] },
  { name: 'DI Yogyakarta',       bounds: [109.9,-8.2, 110.9,-7.5] },
  { name: 'Jawa Timur',          bounds: [110.9,-8.8, 115.1,-6.8] },
  { name: 'Kalimantan Barat',    bounds: [107.9,-3.6, 118.1,2.6]  },
  { name: 'Kalimantan Tengah',   bounds: [110.0,-5.1, 116.1,0.1]  },
  { name: 'Kalimantan Selatan',  bounds: [114.3,-4.6, 117.6,-0.9] },
  { name: 'Kalimantan Timur',    bounds: [113.9,-3.6, 119.1,4.1]  },
  { name: 'Kalimantan Utara',    bounds: [114.9,2.4,  119.1,4.6]  },
  { name: 'Bali',                bounds: [114.4,-8.9, 115.8,-7.9] },
  { name: 'Nusa Tenggara Barat', bounds: [115.6,-9.1, 119.6,-7.9] },
  { name: 'Nusa Tenggara Timur', bounds: [118.4,-11.1,125.6,-7.9] },
  { name: 'Sulawesi Utara',      bounds: [122.9,-0.1, 127.1,4.1]  },
  { name: 'Gorontalo',           bounds: [121.4,0.3,  123.6,1.1]  },
  { name: 'Sulawesi Tengah',     bounds: [119.4,-3.6, 124.6,1.6]  },
  { name: 'Sulawesi Barat',      bounds: [118.4,-4.1, 120.1,-0.4] },
  { name: 'Sulawesi Selatan',    bounds: [118.9,-7.1, 121.6,-1.9] },
  { name: 'Sulawesi Tenggara',   bounds: [120.4,-6.1, 124.6,-2.9] },
  { name: 'Maluku',              bounds: [123.9,-9.1, 132.1,1.1]  },
  { name: 'Maluku Utara',        bounds: [125.9,-2.1, 130.1,3.1]  },
  { name: 'Papua Barat',         bounds: [129.9,-5.1, 135.1,-0.4] },
  { name: 'Papua',               bounds: [134.9,-9.1, 141.1,-0.4] },
]

export function getRegion(lat, lon) {
  for (const p of PROVINCES) {
    const [minLon, minLat, maxLon, maxLat] = p.bounds
    if (lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat) return p.name
  }
  return 'Indonesia'
}

// Major cities with coordinates for weather layer
export const WEATHER_CITIES = [
  { name: 'Jakarta',    lat: -6.2088, lon: 106.8456, adm: '31' },
  { name: 'Surabaya',   lat: -7.2575, lon: 112.7521, adm: '35' },
  { name: 'Bandung',    lat: -6.9175, lon: 107.6191, adm: '32' },
  { name: 'Medan',      lat:  3.5952, lon:  98.6722, adm: '12' },
  { name: 'Semarang',   lat: -6.9932, lon: 110.4203, adm: '33' },
  { name: 'Makassar',   lat: -5.1477, lon: 119.4327, adm: '73' },
  { name: 'Palembang',  lat: -2.9761, lon: 104.7754, adm: '16' },
  { name: 'Denpasar',   lat: -8.6705, lon: 115.2126, adm: '51' },
  { name: 'Pontianak',  lat:  0.0263, lon: 109.3425, adm: '61' },
  { name: 'Manado',     lat:  1.4748, lon: 124.8421, adm: '71' },
  { name: 'Jayapura',   lat: -2.5337, lon: 140.7181, adm: '91' },
  { name: 'Balikpapan', lat: -1.2379, lon: 116.8529, adm: '64' },
  { name: 'Yogyakarta', lat: -7.7956, lon: 110.3695, adm: '34' },
  { name: 'Pekanbaru',  lat:  0.5335, lon: 101.4474, adm: '14' },
]
