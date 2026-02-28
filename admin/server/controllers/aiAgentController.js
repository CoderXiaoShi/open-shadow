'use strict';

const aiAgentService = require('../services/aiAgentService');
const personaService = require('../services/personaService');

const aiAgentController = {
  /** SSE 流式进度 + 截图 + 完成后自动保存 */
  async build(ctx) {
    const { url } = ctx.request.body;
    if (!url || !url.trim()) {
      ctx.body = { code: 400, message: 'URL 不能为空' };
      return;
    }

    ctx.set({
      'Content-Type':      'text/event-stream; charset=utf-8',
      'Cache-Control':     'no-cache',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    ctx.status  = 200;
    ctx.respond = false;
    const res   = ctx.res;

    const send = (obj) => {
      try { res.write(`data: ${JSON.stringify(obj)}\n\n`); } catch (_) {}
    };

    try {
      const { bloggerName, avatarUrl, roleDefinition, screenshotUrl } = await aiAgentService.build(
        url.trim(),
        (step, message, extra = {}) => {
          send({ type: 'progress', step, message, ...extra });
        }
      );

      // 自动保存：role_definition、name（有时）、avatar_url（有时）
      const saveData = { role_definition: roleDefinition };
      if (bloggerName) saveData.name = bloggerName;
      if (avatarUrl)   saveData.avatar_url = avatarUrl;
      await personaService.save(saveData);

      send({ type: 'done', data: { role_definition: roleDefinition, screenshotUrl, name: bloggerName, avatar_url: avatarUrl } });
    } catch (e) {
      send({ type: 'error', message: e.message || '分析失败' });
    } finally {
      res.end();
    }
  },

  /** 加载已保存的 role_definition */
  async get(ctx) {
    try {
      const record = await personaService.get();
      ctx.body = { code: 200, message: 'success', data: { role_definition: record.role_definition || '' } };
    } catch (e) {
      ctx.body = { code: 500, message: e.message || '获取失败' };
    }
  },

  /** 手动保存（编辑后） */
  async save(ctx) {
    const { role_definition } = ctx.request.body;
    try {
      await personaService.save({ role_definition });
      ctx.body = { code: 200, message: '保存成功' };
    } catch (e) {
      ctx.body = { code: 500, message: e.message || '保存失败' };
    }
  }
};

module.exports = aiAgentController;
