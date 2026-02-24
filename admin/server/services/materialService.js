'use strict';

const { Op } = require('sequelize');
const Material = require('../models/material');

const materialService = {
  async getList({ keyword, type, is_enabled, page = 1, pageSize = 20 } = {}) {
    const where = {};
    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { remark: { [Op.like]: `%${keyword}%` } }
      ];
    }
    if (type) where.type = type;
    if (is_enabled !== undefined && is_enabled !== '') {
      where.is_enabled = Number(is_enabled);
    }
    const { count, rows } = await Material.findAndCountAll({
      where,
      order: [['sort', 'DESC'], ['published_at', 'DESC']],
      limit: Number(pageSize),
      offset: (Number(page) - 1) * Number(pageSize)
    });
    return { total: count, list: rows, page: Number(page), pageSize: Number(pageSize) };
  },

  async create({ type = 'text', title, content, file_url, remark, published_at, metadata }) {
    return Material.create({ type, title, content, file_url, remark, published_at, metadata });
  },

  async update(id, { type, title, content, file_url, remark, is_enabled, sort, published_at }) {
    const record = await Material.findByPk(id);
    if (!record) throw new Error('素材不存在');
    const allowed = { type, title, content, file_url, remark, is_enabled, sort, published_at };
    const updates = {};
    for (const [k, v] of Object.entries(allowed)) {
      if (v !== undefined) updates[k] = v;
    }
    await record.update(updates);
    return record;
  },

  async delete(id) {
    const record = await Material.findByPk(id);
    if (!record) throw new Error('素材不存在');
    await record.destroy();
  }
};

module.exports = materialService;
