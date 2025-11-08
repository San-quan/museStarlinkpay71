/**
 * Utility functions for museStarlinkpay71
 */

function isValidIPv4 (ip) {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (typeof ip !== 'string' || !ipv4Regex.test(ip)) return false

  const parts = ip.split('.')
  return parts.every(part => {
    if (!/^\d+$/.test(part)) return false
    const num = Number(part)
    return Number.isInteger(num) && num >= 0 && num <= 255
  })
}

function greet (name = 'world') {
  return `Hello, ${name}! This repo integrates with Starlink.`
}

module.exports = {
  isValidIPv4,
  greet
}
