'use strict';

const chatService = require('../services/chatService');

const chatController = {
  /** 流式对话（SSE） */
  async chatStream(ctx) {
    const { message, material_ids = [], history = [] } = ctx.request.body;

    if (!message || !message.trim()) {
      ctx.body = { code: 400, message: '消息不能为空' };
      return;
    }

    // 设置 SSE 响应头，接管原生 response
    ctx.set({
      'Content-Type':      'text/event-stream; charset=utf-8',
      'Cache-Control':     'no-cache',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no'  // 禁止 nginx 缓冲
    });
    ctx.status   = 200;
    ctx.respond  = false; // 由我们直接操作 ctx.res

    const res = ctx.res;

    /** 向客户端写一条 SSE 事件 */
    const send = (obj) => {
      try { res.write(`data: ${JSON.stringify(obj)}\n\n`); } catch (_) {}
    };

    let llmStream = null;

    // 客户端断开时销毁上游流，避免资源泄漏
    ctx.req.on('close', () => { llmStream?.destroy(); });

    try {
      const { stream, provider } = await chatService.chatStream({
        message:      message.trim(),
        material_ids,
        history
      });
      llmStream = stream;

      let buffer = '';

      stream.on('data', (chunk) => {
        buffer += chunk.toString();
        // SSE 行以 \n\n 分隔；按 \n 逐行处理，保留未完成的片段
        const lines = buffer.split('\n');
        buffer = lines.pop(); // 最后一行可能不完整，留到下次

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const raw = trimmed.slice(5).trim();
          if (raw === '[DONE]') continue;

          try {
            const parsed = JSON.parse(raw);
            let text = '';
            if (provider === 'anthropic') {
              // Anthropic: event=content_block_delta, delta.type=text_delta
              if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
                text = parsed.delta.text || '';
              }
            } else {
              // OpenAI compatible
              text = parsed.choices?.[0]?.delta?.content || '';
            }
            if (text) send({ type: 'delta', text });
          } catch (_) { /* 忽略无法解析的行 */ }
        }
      });

      stream.on('end', () => {
        send({ type: 'done' });
        res.end();
      });

      stream.on('error', (err) => {
        send({ type: 'error', message: err.message || '流读取失败' });
        res.end();
      });

    } catch (e) {
      send({ type: 'error', message: e.message || '调用失败' });
      res.end();
    }
  }
};

module.exports = chatController;
