'use strict';

const aiConfigService = require('../services/aiConfigService');

const aiConfigController = {
  async get(ctx) {
    const record = await aiConfigService.get();
    ctx.body = { code: 200, data: aiConfigService.mask(record) };
  },

  async save(ctx) {
    const record = await aiConfigService.save(ctx.request.body);
    ctx.body = { code: 200, data: aiConfigService.mask(record), message: '保存成功' };
  },

  async test(ctx) {
    try {
      const result = await aiConfigService.test();
      ctx.body = { code: 200, data: result, message: `连接成功，延迟 ${result.latency}ms` };
    } catch (e) {
      const msg = e.response?.data?.error?.message || e.message || '连接失败';
      ctx.body = { code: 500, message: msg };
    }
  }
};

module.exports = aiConfigController;
