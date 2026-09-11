export const AIRLINES = {
  'GIA': { name: 'Garuda Indonesia',   flag: '🇮🇩' },
  'BTK': { name: 'Batik Air',          flag: '🇮🇩' },
  'LNI': { name: 'Lion Air',           flag: '🇮🇩' },
  'SJY': { name: 'Sriwijaya Air',      flag: '🇮🇩' },
  'AWQ': { name: 'AirAsia Indonesia',  flag: '🇮🇩' },
  'CTV': { name: 'Citilink',           flag: '🇮🇩' },
  'WIN': { name: 'Wings Air',          flag: '🇮🇩' },
  'TGN': { name: 'Trigana Air',        flag: '🇮🇩' },
  'SCS': { name: 'Susi Air',           flag: '🇮🇩' },
  'XNN': { name: 'TransNusa',          flag: '🇮🇩' },
  'INX': { name: 'Airfast Indonesia',  flag: '🇮🇩' },
  'SIA': { name: 'Singapore Airlines', flag: '🇸🇬' },
  'SLK': { name: 'Silkair',            flag: '🇸🇬' },
  'MAS': { name: 'Malaysia Airlines',  flag: '🇲🇾' },
  'AXM': { name: 'AirAsia',            flag: '🇲🇾' },
  'THA': { name: 'Thai Airways',       flag: '🇹🇭' },
  'CPA': { name: 'Cathay Pacific',     flag: '🇭🇰' },
  'UAE': { name: 'Emirates',           flag: '🇦🇪' },
  'QFA': { name: 'Qantas',             flag: '🇦🇺' },
  'VOZ': { name: 'Virgin Australia',   flag: '🇦🇺' },
  'KLM': { name: 'KLM',               flag: '🇳🇱' },
  'BAW': { name: 'British Airways',    flag: '🇬🇧' },
  'CES': { name: 'China Eastern',      flag: '🇨🇳' },
  'CSN': { name: 'China Southern',     flag: '🇨🇳' },
  'CCA': { name: 'Air China',          flag: '🇨🇳' },
  'EVA': { name: 'EVA Air',            flag: '🇹🇼' },
  'JAL': { name: 'Japan Airlines',     flag: '🇯🇵' },
  'ANA': { name: 'ANA',               flag: '🇯🇵' },
  'KAL': { name: 'Korean Air',         flag: '🇰🇷' },
  'AAR': { name: 'Asiana Airlines',    flag: '🇰🇷' },
  'TLM': { name: 'Tigerair',           flag: '🇸🇬' },
  'QTR': { name: 'Qatar Airways',      flag: '🇶🇦' },
  'ETD': { name: 'Etihad Airways',     flag: '🇦🇪' },
  'SVA': { name: 'Saudia',             flag: '🇸🇦' },
}

export function getAirline(callsign) {
  if (!callsign) return null
  const code = callsign.trim().replace(/[0-9\s]/g, '').substring(0, 3).toUpperCase()
  return AIRLINES[code] || null
}

export function getVerticalTrend(vr) {
  if (!vr || Math.abs(vr) < 0.5) return { icon: '→', label: 'Level', color: '#94a3b8' }
  if (vr > 3)  return { icon: '↑↑', label: 'Climbing fast', color: '#10b981' }
  if (vr > 0.5) return { icon: '↑', label: 'Climbing',      color: '#10b981' }
  if (vr < -3) return { icon: '↓↓', label: 'Descending fast', color: '#f43f5e' }
  return { icon: '↓', label: 'Descending', color: '#f59e0b' }
}

export function getNavStatus(code) {
  const map = {
    0: 'Underway (engine)', 1: 'At anchor', 2: 'Not under command',
    3: 'Restricted manoeuvrability', 5: 'Moored', 7: 'Fishing', 8: 'Sailing',
  }
  return map[code] || 'Unknown'
}
