/**
 * Utility functions for museStarlinkpay71
 */

function isValidIPv4 (ip) {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (!ipv4Regex.test(ip)) return false

  const parts = ip.split('.')
  return parts.every(part => {
    const num = parseInt(part, 10)
    return num >= 0 && num <= 255
  })
}

function greet (name = 'world') {
  return `Hello, ${name}! This repo integrates with Starlink.`
}

module.exports = {
  isValidIPv4,
  greet
}
