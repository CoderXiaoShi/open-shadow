'use strict';

const axios = require('axios');
const AiConfig = require('../models/aiConfig');

const SINGLETON_ID = 1;
const MASK = '********';

const aiConfigService = {
  async get() {
    const [record] = await AiConfig.findOrCreate({
      where: { id: SINGLETON_ID },
      defaults: { id: SINGLETON_ID }
    });
    return record;
  },

  // GET 时脱敏 api_key
  mask(record) {
    const data = record.toJSON();
    if (data.api_key) {
      const k = data.api_key;
      data.api_key = k.length > 8
        ? `${k.slice(0, 4)}${MASK}${k.slice(-4)}`
        : MASK;
      data.has_key = true;
    } else {
      data.has_key = false;
    }
    return data;
  },

  async save({ provider, api_key, base_url, model, temperature, max_tokens }) {
    const record = await this.get();
    const updates = {};
    if (provider    !== undefined) updates.provider    = provider;
    if (base_url    !== undefined) updates.base_url    = base_url;
    if (model       !== undefined) updates.model       = model;
    if (temperature !== undefined) updates.temperature = temperature;
    if (max_tokens  !== undefined) updates.max_tokens  = max_tokens;
    // 只有发来的不是脱敏占位符才更新 key
    if (api_key !== undefined && !api_key.includes(MASK)) {
      updates.api_key = api_key;
    }
    await record.update(updates);
    return record;
  },

  async test() {
    const record = await this.get();
    if (!record.api_key) throw new Error('尚未配置 API Key');

    const baseURL = record.base_url ||
      (record.provider === 'anthropic'
        ? 'https://api.anthropic.com'
        : 'https://api.openai.com');

    const start = Date.now();

    if (record.provider === 'anthropic') {
      const res = await axios.post(
        `${baseURL}/v1/messages`,
        {
          model: record.model || 'claude-haiku-4-5-20251001',
          max_tokens: 16,
          messages: [{ role: 'user', content: 'Hi' }]
        },
        {
          headers: {
            'x-api-key': record.api_key,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          timeout: 15000
        }
      );
      return {
        ok: true,
        latency: Date.now() - start,
        reply: res.data?.content?.[0]?.text || ''
      };
    } else {
      // OpenAI compatible
      const res = await axios.post(
        `${baseURL}/v1/chat/completions`,
        {
          model: record.model || 'gpt-4o',
          max_tokens: 16,
          messages: [{ role: 'user', content: 'Hi' }]
        },
        {
          headers: {
            Authorization: `Bearer ${record.api_key}`,
            'content-type': 'application/json'
          },
          timeout: 15000
        }
      );
      return {
        ok: true,
        latency: Date.now() - start,
        reply: res.data?.choices?.[0]?.message?.content || ''
      };
    }
  }
};

module.exports = aiConfigService;
