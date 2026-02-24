'use strict';

const chatService = require('../services/chatService');

const chatController = {
  async chat(ctx) {
    const { message, material_ids = [], history = [] } = ctx.request.body;
    if (!message || !message.trim()) {
      ctx.body = { code: 400, message: '消息不能为空' };
      return;
    }
    try {
      const result = await chatService.chat({
        message: message.trim(),
        material_ids,
        history
      });
      ctx.body = { code: 200, message: 'success', data: result };
    } catch (e) {
      ctx.body = { code: 500, message: e.message || '调用失败' };
    }
  }
};

module.exports = chatController;
