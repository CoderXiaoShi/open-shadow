'use strict';

const fs = require('fs');
const path = require('path');
const materialService = require('../services/materialService');

const uploadDir = path.join(__dirname, '../uploads');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const VIDEO_EXTS = new Set(['.mp4', '.mov', '.avi', '.mkv', '.webm']);
const TEXT_EXTS  = new Set(['.txt', '.md']);

const materialController = {
  async getList(ctx) {
    const { keyword, type, is_enabled, page, pageSize } = ctx.query;
    const data = await materialService.getList({ keyword, type, is_enabled, page, pageSize });
    ctx.body = { code: 200, data };
  },

  async create(ctx) {
    const { type = 'text', title, content, file_url, remark, published_at, metadata } = ctx.request.body;
    if (type === 'text' && !content) {
      ctx.body = { code: 400, message: '文本素材的内容不能为空' };
      return;
    }
    if ((type === 'image' || type === 'video') && !file_url) {
      ctx.body = { code: 400, message: '请先上传文件' };
      return;
    }
    const record = await materialService.create({ type, title, content, file_url, remark, published_at, metadata });
    ctx.body = { code: 200, data: record, message: '创建成功' };
  },

  async update(ctx) {
    const { id } = ctx.params;
    const { type, title, content, file_url, remark, is_enabled, sort, published_at } = ctx.request.body;
    const record = await materialService.update(id, { type, title, content, file_url, remark, is_enabled, sort, published_at });
    ctx.body = { code: 200, data: record, message: '更新成功' };
  },

  async delete(ctx) {
    const { id } = ctx.params;
    await materialService.delete(id);
    ctx.body = { code: 200, message: '删除成功' };
  },

  /**
   * 文件上传接口
   * - image / video：保存文件，返回 file_url
   * - document (.txt/.md)：保存文件 + 提取文本内容，返回 file_url + content
   */
  async upload(ctx) {
    const file = ctx.request.files?.file;
    if (!file) {
      ctx.body = { code: 400, message: '请选择文件' };
      return;
    }

    const fileData = Array.isArray(file) ? file[0] : file;
    const originalName = fileData.originalFilename || fileData.name || '';
    const ext = path.extname(originalName).toLowerCase();

    let type;
    if (IMAGE_EXTS.has(ext))     type = 'image';
    else if (VIDEO_EXTS.has(ext)) type = 'video';
    else if (TEXT_EXTS.has(ext))  type = 'document';
    else {
      ctx.body = { code: 400, message: `不支持的文件类型 ${ext}，支持：图片/视频/txt/md` };
      return;
    }

    const fileName = `material_${Date.now()}_${Math.random().toString(36).substr(2, 6)}${ext}`;
    const destPath = path.join(uploadDir, fileName);
    fs.writeFileSync(destPath, fs.readFileSync(fileData.filepath));

    const result = {
      type,
      file_url: `/uploads/${fileName}`,
      original_name: originalName
    };

    if (type === 'document') {
      result.content = fs.readFileSync(fileData.filepath, 'utf-8');
    }

    ctx.body = { code: 200, data: result, message: '上传成功' };
  }
};

module.exports = materialController;
