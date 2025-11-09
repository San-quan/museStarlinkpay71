// src/notification/logger.js
// 简单 logger 封装
module.exports = {
 info(...args) { console.log('[info]', ...args); },
 warn(...args) { console.warn('[warn]', ...args); },
 error(...args) { console.error('[error]', ...args); }
};