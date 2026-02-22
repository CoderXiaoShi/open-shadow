const Role = require('../models/role');
const Permission = require('../models/permission');
const Menu = require('../models/menu');
const { logger, errorLogger } = require('../utils/logger');

const roleController = {
  async getRoles(ctx) {
    try {
      const roles = await Role.findAll({
        include: [{
          model: Permission,
          as: 'permissions',
          include: [{ model: Menu, as: 'menu', attributes: ['id', 'name'] }]
        }]
      });

      ctx.body = {
        code: 200,
        message: '获取角色列表成功',
        data: roles
      };
    } catch (error) {
      errorLogger.error('获取角色列表失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  },

  async getRole(ctx) {
    try {
      const { id } = ctx.params;
      const role = await Role.findByPk(id, {
        include: [{
          model: Permission,
          as: 'permissions'
        }]
      });

      if (!role) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '角色不存在'
        };
        return;
      }

      ctx.body = {
        code: 200,
        message: '获取角色成功',
        data: role
      };
    } catch (error) {
      errorLogger.error('获取角色失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  },

  async createRole(ctx) {
    try {
      const { name, description, status } = ctx.request.body;

      const existingRole = await Role.findOne({ where: { name } });
      if (existingRole) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '角色名称已存在'
        };
        return;
      }

      const role = await Role.create({ name, description, status });

      ctx.body = {
        code: 200,
        message: '创建角色成功',
        data: role
      };
    } catch (error) {
      errorLogger.error('创建角色失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  },

  async updateRole(ctx) {
    try {
      const { id } = ctx.params;
      const { name, description, status } = ctx.request.body;

      const role = await Role.findByPk(id);
      if (!role) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '角色不存在'
        };
        return;
      }

      await role.update({ name, description, status });

      ctx.body = {
        code: 200,
        message: '更新角色成功',
        data: role
      };
    } catch (error) {
      errorLogger.error('更新角色失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  },

  async deleteRole(ctx) {
    try {
      const { id } = ctx.params;

      if (id === 1) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '不能删除管理员角色'
        };
        return;
      }

      const role = await Role.findByPk(id);
      if (!role) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '角色不存在'
        };
        return;
      }

      await Permission.destroy({ where: { role_id: id } });
      await role.destroy();

      ctx.body = {
        code: 200,
        message: '删除角色成功'
      };
    } catch (error) {
      errorLogger.error('删除角色失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  },

  async assignPermissions(ctx) {
    try {
      const { id } = ctx.params;
      const { menu_ids } = ctx.request.body;

      const role = await Role.findByPk(id);
      if (!role) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '角色不存在'
        };
        return;
      }

      await Permission.destroy({ where: { role_id: id } });

      if (menu_ids && menu_ids.length > 0) {
        const permissions = menu_ids.map(menu_id => ({
          role_id: id,
          menu_id
        }));
        await Permission.bulkCreate(permissions);
      }

      ctx.body = {
        code: 200,
        message: '分配权限成功'
      };
    } catch (error) {
      errorLogger.error('分配权限失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  },

  async getRolePermissions(ctx) {
    try {
      const { id } = ctx.params;

      const permissions = await Permission.findAll({
        where: { role_id: id }
      });

      ctx.body = {
        code: 200,
        message: '获取角色权限成功',
        data: permissions.map(p => p.menu_id)
      };
    } catch (error) {
      errorLogger.error('获取角色权限失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
};

module.exports = roleController;
