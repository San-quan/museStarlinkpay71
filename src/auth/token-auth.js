/**
 * Token Authentication Module
 * Handles token-based authentication
 */

class TokenAuth {
  constructor (secretKey) {
    this.secretKey = secretKey
    this.tokens = new Map()
  }

  generateToken (userId) {
    const token = Buffer.from(`${userId}-${Date.now()}`).toString('base64')
    this.tokens.set(token, { userId, createdAt: Date.now() })
    return token
  }

  validateToken (token) {
    return this.tokens.has(token)
  }

  revokeToken (token) {
    return this.tokens.delete(token)
  }
}

module.exports = { TokenAuth }
