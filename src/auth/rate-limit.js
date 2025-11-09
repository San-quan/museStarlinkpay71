// src/auth/rate-limit.js
// 简单速率限制器骨架
class RateLimiter {
 constructor() {
 this.map = new Map();
 }
 allow(key) {
 // TODO: implement rate limiting
 return true;
 }
}
module.exports = RateLimiter;