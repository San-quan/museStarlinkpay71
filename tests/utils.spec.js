import { isValidIPv4 } from '../src/utils.js'

describe('isValidIPv4', () => {
  test('valid addresses', () => {
    expect(isValidIPv4('127.0.0.1')).toBe(true)
    expect(isValidIPv4('192.168.1.1')).toBe(true)
  })

  test('invalid addresses', () => {
    expect(isValidIPv4('256.1.1.1')).toBe(false)
    expect(isValidIPv4('abc')).toBe(false)
    expect(isValidIPv4('127.0.0')).toBe(false)
    expect(isValidIPv4('01.02.03.04')).toBe(false)
  })
})
