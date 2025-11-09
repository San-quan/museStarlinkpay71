// src/utils/crypto-utils.js
// 加密/签名工具集（示例）
const crypto = require('crypto');

module.exports = {
 sha256(input) {
 return crypto.createHash('sha256').update(input).digest('hex');
 }
};