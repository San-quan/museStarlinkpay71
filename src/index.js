/**
 * Entry point for museStarlinkpay71
 * This file provides a minimal example and export for unit tests.
 */

export function greet (name = 'world') {
  return `Hello, ${name}! This repo integrates with Starlink.`
}

// Demo run
console.log(greet(process.env.USER || 'operator'))
