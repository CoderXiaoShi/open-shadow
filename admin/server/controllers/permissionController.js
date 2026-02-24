const Permission = require('../models/sysPermission');
const RolePermission = require('../models/rolePermission');
const { logger, errorLogger } = require('../utils/logger');

const permissionController = {
  async getPermissions(ctx) {
    try {
      const permissions = await Permission.findAll({
        order: [['sort', 'ASC'], ['id', 'ASC']]
      });

      ctx.body = {
        code: 200,
        message: '获取权限列表成功',
        data: permissions
      };
    } catch (error) {
      errorLogger.error('获取权限列表失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  },

  async getPermissionTree(ctx) {
    try {
      const permissions = await Permission.findAll({
        order: [['sort', 'ASC'], ['id', 'ASC']]
      });

      const buildTree = (parentId = 0) => {
        return permissions
          .filter(p => p.parent_id === parentId)
          .map(p => ({
            ...p.toJSON(),
            children: buildTree(p.id)
          }));
      };

      const tree = buildTree(0);

      ctx.body = {
        code: 200,
        message: '获取权限树成功',
        data: tree
      };
    } catch (error) {
      errorLogger.error('获取权限树失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  },

  async getPermission(ctx) {
    try {
      const { id } = ctx.params;
      const permission = await Permission.findByPk(id);

      if (!permission) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '权限不存在'
        };
        return;
      }

      ctx.body = {
        code: 200,
        message: '获取权限成功',
        data: permission
      };
    } catch (error) {
      errorLogger.error('获取权限失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  },

  async createPermission(ctx) {
    try {
      const { parent_id, permission_name, permission_code, type, path, component, icon, sort, status } = ctx.request.body;

      const permission = await Permission.create({
        parent_id: parent_id || 0,
        permission_name,
        permission_code,
        type: type || 1,
        path,
        component,
        icon,
        sort: sort || 0,
        status: status || 1
      });

      ctx.body = {
        code: 200,
        message: '创建权限成功',
        data: permission
      };
    } catch (error) {
      errorLogger.error('创建权限失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  },

  async updatePermission(ctx) {
    try {
      const { id } = ctx.params;
      const { parent_id, permission_name, permission_code, type, path, component, icon, sort, status } = ctx.request.body;

      const permission = await Permission.findByPk(id);
      if (!permission) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '权限不存在'
        };
        return;
      }

      await permission.update({
        parent_id,
        permission_name,
        permission_code,
        type,
        path,
        component,
        icon,
        sort,
        status
      });

      ctx.body = {
        code: 200,
        message: '更新权限成功',
        data: permission
      };
    } catch (error) {
      errorLogger.error('更新权限失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  },

  async deletePermission(ctx) {
    try {
      const { id } = ctx.params;

      const children = await Permission.findAll({ where: { parent_id: id } });
      if (children.length > 0) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '请先删除子权限'
        };
        return;
      }

      await RolePermission.destroy({ where: { permission_id: id } });

      const permission = await Permission.findByPk(id);
      if (!permission) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '权限不存在'
        };
        return;
      }

      await permission.destroy();

      ctx.body = {
        code: 200,
        message: '删除权限成功'
      };
    } catch (error) {
      errorLogger.error('删除权限失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
};

module.exports = permissionController;
