// src/config/manager.js
// 配置管理器骨架（支持本地 env / JSON /远程配置）
const defaultConfig = {
 env: process.env.NODE_ENV || 'development',
 port: process.env.PORT || 3000
};

module.exports = Object.assign({}, defaultConfig);