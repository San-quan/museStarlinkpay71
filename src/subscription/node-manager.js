// src/subscription/node-manager.js
// 节点管理：管理订阅节点、健康检查、重连等
class NodeManager {
 constructor() {
 this.nodes = [];
 }

 add(node) { this.nodes.push(node); }
 list() { return this.nodes; }
}

module.exports = NodeManager;