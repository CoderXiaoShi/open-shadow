'use strict';

const axios = require('axios');
const personaService  = require('./personaService');
const aiConfigService = require('./aiConfigService');

async function _prepare({ message, history = [] }) {
  // 使用 role_definition 作为系统提示词，fallback 到 system_prompt
  const persona = await personaService.get();
  const systemPrompt = persona.role_definition || persona.system_prompt || '';

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
