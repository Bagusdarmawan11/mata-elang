/**
 * Vercel Serverless Function — /api/flights
 * Proxy ke adsb.lol dari server (menghindari CORS browser).
 * 3 query untuk cover seluruh Indonesia (max radius 250nm per query).
 */

// Indonesia dibagi 3 zona biar coverage penuh
const QUERIES = [
  // Barat: Sumatera, Jawa, Kalimantan Barat
  { lat:  1.0, lon: 106.0, dist: 250, label: 'Indo-Barat' },
  // Tengah: Kalimantan, Sulawesi, Bali, NTT
  { lat: -2.0, lon: 118.0, dist: 250, label: 'Indo-Tengah' },
  // Timur: Maluku, Papua
  { lat: -3.0, lon: 133.0, dist: 250, label: 'Indo-Timur' },
]

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30')

  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  try {
    const results = await Promise.all(
      QUERIES.map(q =>
        fetch(`https://api.adsb.lol/v2/lat/${q.lat}/lon/${q.lon}/dist/${q.dist}`, {
          headers: { 'User-Agent': 'MataElang-Indonesia/1.0' },
          signal: AbortSignal.timeout(8000),
        })
          .then(r => r.ok ? r.json() : { ac: [] })
          .catch(() => ({ ac: [] }))
      )
    )

    // Merge + deduplicate by ICAO hex
    const seen = new Set()
    const ac = []
    results.forEach(r => {
      ;(r.ac || []).forEach(a => {
        if (a.hex && !seen.has(a.hex)) {
          ac.push(a)
          seen.add(a.hex)
        }
      })
    })

    res.status(200).json({
      ac,
      total:  ac.length,
      ts:     Date.now(),
      source: 'adsb.lol',
    })
  } catch (e) {
    res.status(500).json({ error: e.message, ac: [], total: 0 })
  }
}
