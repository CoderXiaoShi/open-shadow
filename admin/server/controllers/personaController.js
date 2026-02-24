'use strict';

const personaService = require('../services/personaService');

const personaController = {
  async get(ctx) {
    const data = await personaService.get();
    ctx.body = { code: 200, data };
  },

  async save(ctx) {
    const data = await personaService.save(ctx.request.body);
    ctx.body = { code: 200, data, message: '保存成功' };
  },

  async buildPrompt(ctx) {
    const data = await personaService.get();
    const system_prompt = personaService.buildSystemPrompt(data);
    ctx.body = { code: 200, data: { system_prompt } };
  }
};

module.exports = personaController;
