// src/index.js
// 应用入口（项目骨架）
// TODO: 根据需要引导各个模块并启动服务

const config = require('./config/manager');

function start() {
 console.log('Starting museStarlinkpay71 (skeleton) ...');
 console.log('Loaded config:', Object.keys(config));
 // TODO: 初始化 router, auth, notification 等模块
}

module.exports = { start };

if (require.main === module) {
 start();
}