// src/utils/health-check.js
// 健康检查工具
module.exports = {
 async check() {
 // TODO: 对关键依赖做健康探测
 return { ok: true, timestamp: Date.now() };
 }
};