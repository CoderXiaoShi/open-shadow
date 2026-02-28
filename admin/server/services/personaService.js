'use strict';

const Persona = require('../models/persona');

const SINGLETON_ID = 1;

const personaService = {
  async get() {
    const [record] = await Persona.findOrCreate({
      where: { id: SINGLETON_ID },
      defaults: { id: SINGLETON_ID }
    });
    return record;
  },

  async save(data) {
    const [record] = await Persona.findOrCreate({
      where: { id: SINGLETON_ID },
      defaults: { id: SINGLETON_ID }
    });
    const fields = ['name', 'avatar_url', 'bio', 'personality', 'speech_style', 'background', 'example_qa', 'system_prompt', 'role_definition'];
    const updates = {};
    for (const f of fields) {
      if (data[f] !== undefined) updates[f] = data[f];
    }
    await record.update(updates);
    return record;
  },

  buildSystemPrompt({ name, bio, personality, speech_style, background, example_qa }) {
    const parts = [];
    parts.push(`你是${name || '一位博主'}。${bio || ''}`);
    if (personality)   parts.push(`\n\n【性格特征】\n${personality}`);
    if (speech_style)  parts.push(`\n\n【说话风格】\n${speech_style}`);
    if (background)    parts.push(`\n\n【背景经历】\n${background}`);
    if (example_qa?.length) {
      const qaText = example_qa.map(({ q, a }) => `Q: ${q}\nA: ${a}`).join('\n\n');
      parts.push(`\n\n【对话示例】\n${qaText}`);
    }
    parts.push('\n\n请严格以上述角色的身份与用户对话，不要暴露你是AI模型。每轮对话会动态补充相关素材作为参考。');
    return parts.join('');
  }
};

module.exports = personaService;
