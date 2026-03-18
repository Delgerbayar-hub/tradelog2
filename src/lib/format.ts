// Compact money formatter
// $1,111,111,111 → $1.1B
// $5,400,000     → $5.4M
// $12,500        → $12500
// $999           → $999

export function fmtPnl(value: number, showSign = true, dashOnZero = true): string {
  if (dashOnZero && value === 0) return '—'
  const abs = Math.abs(value)
  const sign = showSign ? (value >= 0 ? '+' : '-') : value < 0 ? '-' : ''
  let str: string
  if (abs >= 1_000_000_000) str = '$' + (abs / 1_000_000_000).toFixed(1) + 'B'
  else if (abs >= 1_000_000) str = '$' + (abs / 1_000_000).toFixed(1) + 'M'
  else                       str = '$' + abs.toFixed(2)
  return sign + str
}

// Exact balance display with comma separators (no compact abbreviation)
export function fmtBalance(value: number): string {
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtCompact(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return sign + (abs / 1_000_000_000).toFixed(1) + 'B'
  if (abs >= 1_000_000)     return sign + (abs / 1_000_000).toFixed(1) + 'M'
  return String(value)
}
