/**
 * Configuration Manager
 * Handles application configuration management
 */

class ConfigManager {
  constructor () {
    this.config = {}
  }

  load (config) {
    this.config = { ...this.config, ...config }
    return this
  }

  get (key) {
    return this.config[key]
  }

  set (key, value) {
    this.config[key] = value
    return this
  }
}

module.exports = { ConfigManager }
