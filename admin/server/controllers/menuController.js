const Menu = require('../models/menu');
const { logger, errorLogger } = require('../utils/logger');

const menuController = {
  async getMenus(ctx) {
    try {
      const menus = await Menu.findAll({
        order: [['order', 'ASC']]
      });

      ctx.body = {
        code: 200,
        message: '获取菜单列表成功',
        data: menus
      };
    } catch (error) {
      errorLogger.error('获取菜单列表失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  },

  async getMenuTree(ctx) {
    try {
      const menus = await Menu.findAll({
        order: [['order', 'ASC']]
      });

      const buildTree = (parentId = 0) => {
        return menus
          .filter(m => m.parent_id === parentId)
          .map(m => ({
            ...m.toJSON(),
            children: buildTree(m.id)
          }));
      };

      const tree = buildTree(0);

      ctx.body = {
        code: 200,
        message: '获取菜单树成功',
        data: tree
      };
    } catch (error) {
      errorLogger.error('获取菜单树失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  },

  async getMenu(ctx) {
    try {
      const { id } = ctx.params;
      const menu = await Menu.findByPk(id);

      if (!menu) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '菜单不存在'
        };
        return;
      }

      ctx.body = {
        code: 200,
        message: '获取菜单成功',
        data: menu
      };
    } catch (error) {
      errorLogger.error('获取菜单失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  },

  async createMenu(ctx) {
    try {
      const { name, path, component, icon, parent_id, order, status } = ctx.request.body;

      const menu = await Menu.create({
        name,
        path,
        component,
        icon,
        parent_id: parent_id || 0,
        order: order || 0,
        status: status || 1
      });

      ctx.body = {
        code: 200,
        message: '创建菜单成功',
        data: menu
      };
    } catch (error) {
      errorLogger.error('创建菜单失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  },

  async updateMenu(ctx) {
    try {
      const { id } = ctx.params;
      const { name, path, component, icon, parent_id, order, status } = ctx.request.body;

      const menu = await Menu.findByPk(id);
      if (!menu) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '菜单不存在'
        };
        return;
      }

      await menu.update({
        name,
        path,
        component,
        icon,
        parent_id,
        order,
        status
      });

      ctx.body = {
        code: 200,
        message: '更新菜单成功',
        data: menu
      };
    } catch (error) {
      errorLogger.error('更新菜单失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  },

  async deleteMenu(ctx) {
    try {
      const { id } = ctx.params;

      const children = await Menu.findAll({ where: { parent_id: id } });
      if (children.length > 0) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '请先删除子菜单'
        };
        return;
      }

      const menu = await Menu.findByPk(id);
      if (!menu) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '菜单不存在'
        };
        return;
      }

      await menu.destroy();

      ctx.body = {
        code: 200,
        message: '删除菜单成功'
      };
    } catch (error) {
      errorLogger.error('删除菜单失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
};

module.exports = menuController;
