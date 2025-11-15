/**
 * Small network helper utilities (examples)
 */

export function isValidIPv4 (ip) {
  if (typeof ip !== 'string') return false
  const parts = ip.split('.')
  if (parts.length !== 4) return false
  return parts.every(p => {
    const n = Number(p)
    return Number.isInteger(n) && n >= 0 && n <= 255 && String(n) === p
  })
}
