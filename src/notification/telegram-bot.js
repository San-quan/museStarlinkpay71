// src/notification/telegram-bot.js
// Telegram bot 通知骨架（不含凭据）
module.exports = {
 async send(chatId, message) {
 // TODO: 使用 Telegram API 发送消息（保持凭据安全）
 console.log(`[telegram] to ${chatId}: ${message}`);
 }
};