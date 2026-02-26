'use strict';

const axios = require('axios');
const { Op } = require('sequelize');
const Material = require('../models/material');
const personaService  = require('./personaService');
const aiConfigService = require('./aiConfigService');

/**
 * 公共准备：加载人设 + 素材 + AI配置，返回请求所需的全部参数
 */
async function _prepare({ message, material_ids = [], history = [] }) {
  // 1. 人设 system_prompt
  const persona = await personaService.get();
  let systemPrompt = persona.system_prompt || '';

  // 2. 选中素材注入
  if (material_ids.length > 0) {
    const materials = await Material.findAll({
      where: { id: { [Op.in]: material_ids }, is_enabled: 1 },
      order: [['sort', 'DESC'], ['published_at', 'DESC']]
    });
    if (materials.length > 0) {
      const ctx = materials.map((m, i) => {
        const title = m.title ? `【${m.title}】` : `【素材${i + 1}】`;
        return `${title}\n${m.content || ''}`;
      }).join('\n\n');
      systemPrompt += `\n\n---\n以下是相关参考资料，请结合这些内容回答用户：\n\n${ctx}`;
    }
  }

  // 3. AI 配置
  const config = await aiConfigService.get();
  if (!config.api_key) throw new Error('尚未配置 API Key，请先前往 AI配置 页面设置');

  const baseURL = config.base_url ||
    (config.provider === 'anthropic'
      ? 'https://api.anthropic.com'
      : 'https://api.openai.com');

  const model       = config.model       || 'gpt-4o';
  const maxTokens   = config.max_tokens  || 2000;
  const temperature = config.temperature ?? 0.7;

  const messages = [
    ...history.map(({ role, content }) => ({ role, content })),
    { role: 'user', content: message }
  ];

  return { config, systemPrompt, messages, baseURL, model, maxTokens, temperature };
}

const chatService = {
  /** 非流式（保留备用） */
  async chat(params) {
    const { config, systemPrompt, messages, baseURL, model, maxTokens, temperature } = await _prepare(params);

    if (config.provider === 'anthropic') {
      const res = await axios.post(
        `${baseURL}/v1/messages`,
        { model, max_tokens: maxTokens, temperature, system: systemPrompt, messages },
        {
          headers: { 'x-api-key': config.api_key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
          timeout: 60000
        }
      );
      return { reply: res.data?.content?.[0]?.text || '', usage: res.data?.usage || {} };
    } else {
      const msgs = systemPrompt ? [{ role: 'system', content: systemPrompt }, ...messages] : messages;
      const res = await axios.post(
        `${baseURL}/v1/chat/completions`,
        { model, max_tokens: maxTokens, temperature, messages: msgs },
        {
          headers: { Authorization: `Bearer ${config.api_key}`, 'content-type': 'application/json' },
          timeout: 60000
        }
      );
      return { reply: res.data?.choices?.[0]?.message?.content || '', usage: res.data?.usage || {} };
    }
  },

  /**
   * 流式调用：返回 { stream: IncomingMessage, provider: string }
   * 调用方负责读取 stream 并解析 SSE 格式
   */
  async chatStream(params) {
    const { config, systemPrompt, messages, baseURL, model, maxTokens, temperature } = await _prepare(params);

    if (config.provider === 'anthropic') {
      const res = await axios.post(
        `${baseURL}/v1/messages`,
        { model, max_tokens: maxTokens, temperature, system: systemPrompt, messages, stream: true },
        {
          headers: { 'x-api-key': config.api_key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
          responseType: 'stream',
          timeout: 60000
        }
      );
      return { stream: res.data, provider: 'anthropic' };
    } else {
      const msgs = systemPrompt ? [{ role: 'system', content: systemPrompt }, ...messages] : messages;
      const res = await axios.post(
        `${baseURL}/v1/chat/completions`,
        { model, max_tokens: maxTokens, temperature, messages: msgs, stream: true },
        {
          headers: { Authorization: `Bearer ${config.api_key}`, 'content-type': 'application/json' },
          responseType: 'stream',
          timeout: 60000
        }
      );
      return { stream: res.data, provider: 'openai' };
    }
  }
};

module.exports = chatService;
