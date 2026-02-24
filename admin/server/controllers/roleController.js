const Role = require('../models/role');
const Permission = require('../models/sysPermission');
const RolePermission = require('../models/rolePermission');
const { logger, errorLogger } = require('../utils/logger');

const roleController = {
  async getRoles(ctx) {
    try {
      const roles = await Role.findAll({
        order: [['id', 'ASC']]
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
      const role = await Role.findByPk(id);

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
      const { role_name, role_code, description, status } = ctx.request.body;

      const existingRole = await Role.findOne({ where: { role_code } });
      if (existingRole) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '角色编码已存在'
        };
        return;
      }

      const role = await Role.create({ role_name, role_code, description, status });

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
      const { role_name, role_code, description, status } = ctx.request.body;

      const role = await Role.findByPk(id);
      if (!role) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '角色不存在'
        };
        return;
      }

      await role.update({ role_name, role_code, description, status });

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

      if (Number(id) === 1) {
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

      await RolePermission.destroy({ where: { role_id: id } });
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

  async getRolePermissions(ctx) {
    try {
      const { id } = ctx.params;

      const rolePermissions = await RolePermission.findAll({
        where: { role_id: id }
      });

      ctx.body = {
        code: 200,
        message: '获取角色权限成功',
        data: rolePermissions.map(rp => rp.permission_id)
      };
    } catch (error) {
      errorLogger.error('获取角色权限失败:', error);
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
      const { permission_ids } = ctx.request.body;

      const role = await Role.findByPk(id);
      if (!role) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '角色不存在'
        };
        return;
      }

      await RolePermission.destroy({ where: { role_id: id } });

      if (permission_ids && permission_ids.length > 0) {
        const rolePermissions = permission_ids.map(permission_id => ({
          role_id: id,
          permission_id
        }));
        await RolePermission.bulkCreate(rolePermissions);
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
  }
};

module.exports = roleController;
