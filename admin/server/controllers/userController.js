const User = require('../models/user');
const Role = require('../models/role');
const Permission = require('../models/sysPermission');
const RolePermission = require('../models/rolePermission');
const UserRole = require('../models/userRole');
const Log = require('../models/log');
const { generateToken } = require('../utils/jwt');
const { logger, errorLogger } = require('../utils/logger');

const userController = {
  async login(ctx) {
    const { username, password } = ctx.request.body;
    try {
      const user = await User.findOne({ where: { username } });
      if (!user || user.status === 0) {
        ctx.status = 401;
        ctx.body = {
          code: 401,
          message: '用户名或密码错误'
        };
        return;
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        ctx.status = 401;
        ctx.body = {
          code: 401,
          message: '用户名或密码错误'
        };
        return;
      }

      const token = generateToken({ id: user.id, username: user.username });

      await Log.create({
        user_id: user.id,
        username: user.username,
        action: '登录',
        module: '用户管理',
        ip: ctx.request.ip,
        result: 1,
        message: '登录成功'
      });

      ctx.body = {
        code: 200,
        message: '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            nickname: user.nickname,
            email: user.email
          }
        }
      };
    } catch (error) {
      errorLogger.error('登录失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  },

  async register(ctx) {
    const { username, password, nickname, email } = ctx.request.body;
    try {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '用户名已存在'
        };
        return;
      }

      const defaultRole = await Role.findOne({ where: { role_code: 'user' } });

      const user = await User.create({
        username,
        password,
        nickname: nickname || username,
        email,
        status: 1
      });

      if (defaultRole) {
        await UserRole.create({
          user_id: user.id,
          role_id: defaultRole.id
        });
      }

      ctx.body = {
        code: 200,
        message: '注册成功',
        data: {
          id: user.id,
          username: user.username
        }
      };
    } catch (error) {
      errorLogger.error('注册失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  },

  async getUserInfo(ctx) {
    try {
      const user = await User.findByPk(ctx.user.id);

      const userRoles = await UserRole.findAll({
        where: { user_id: user.id },
        include: [{ model: Role, as: 'role' }]
      });

      let roles = userRoles.map(ur => ur.role).filter(Boolean);
      if (roles.length === 0) {
        const defaultRole = await Role.findOne({ where: { role_code: 'user' } });
        if (defaultRole) {
          roles = [defaultRole];
        }
      }

      let permissions = [];
      let menus = [];

      if (roles.length > 0) {
        const roleIds = roles.map(r => r.id);

        const rolePermissions = await RolePermission.findAll({
          where: { role_id: roleIds }
        });

        const permissionIds = [...new Set(rolePermissions.map(rp => rp.permission_id))];

        if (permissionIds.length > 0) {
          permissions = await Permission.findAll({
            where: { id: permissionIds, status: 1 }
          });

          menus = permissions.filter(p => p.type === 1);
        }
      }

      ctx.body = {
        code: 200,
        message: '获取用户信息成功',
        data: {
          ...user.toJSON(),
          roles,
          permissions,
          menus
        }
      };
    } catch (error) {
      errorLogger.error('获取用户信息失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  },

  async getUsers(ctx) {
    try {
      const users = await User.findAll({
        attributes: ['id', 'username', 'nickname', 'email', 'status', 'createdAt'],
        order: [['id', 'ASC']]
      });

      const userList = [];
      for (const user of users) {
        const userRoles = await UserRole.findAll({
          where: { user_id: user.id },
          include: [{ model: Role, as: 'role' }]
        });
        const roles = userRoles.map(ur => ur.role).filter(Boolean);
        userList.push({
          ...user.toJSON(),
          roles: roles.map(r => ({ id: r.id, role_name: r.role_name, role_code: r.role_code }))
        });
      }

      ctx.body = {
        code: 200,
        message: '获取用户列表成功',
        data: userList
      };
    } catch (error) {
      errorLogger.error('获取用户列表失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  },

  async updateUser(ctx) {
    const { id, username, password, nickname, email, role_ids, status } = ctx.request.body;
    try {
      if (id) {
        const user = await User.findByPk(id);
        if (!user) {
          ctx.status = 404;
          ctx.body = {
            code: 404,
            message: '用户不存在'
          };
          return;
        }

        const updateData = { nickname, email, status };
        if (password) {
          updateData.password = password;
        }

        await user.update(updateData);

        if (role_ids && role_ids.length > 0) {
          await UserRole.destroy({ where: { user_id: id } });
          const userRoles = role_ids.map(role_id => ({ user_id: id, role_id }));
          await UserRole.bulkCreate(userRoles);
        }

        await Log.create({
          user_id: ctx.user.id,
          username: ctx.user.username,
          action: '更新用户',
          module: '用户管理',
          ip: ctx.request.ip,
          result: 1,
          message: `更新用户 ${user.username} 成功`
        });

        ctx.body = {
          code: 200,
          message: '更新用户成功',
          data: user
        };
      } else {
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
          ctx.status = 400;
          ctx.body = {
            code: 400,
            message: '用户名已存在'
          };
          return;
        }

        const user = await User.create({
          username,
          password,
          nickname,
          email,
          status
        });

        if (role_ids && role_ids.length > 0) {
          const userRoles = role_ids.map(role_id => ({ user_id: user.id, role_id }));
          await UserRole.bulkCreate(userRoles);
        } else {
          const defaultRole = await Role.findOne({ where: { role_code: 'user' } });
          if (defaultRole) {
            await UserRole.create({ user_id: user.id, role_id: defaultRole.id });
          }
        }

        await Log.create({
          user_id: ctx.user.id,
          username: ctx.user.username,
          action: '创建用户',
          module: '用户管理',
          ip: ctx.request.ip,
          result: 1,
          message: `创建用户 ${username} 成功`
        });

        ctx.body = {
          code: 200,
          message: '创建用户成功',
          data: user
        };
      }
    } catch (error) {
      errorLogger.error('更新用户失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  },

  async deleteUser(ctx) {
    const { id } = ctx.params;
    try {
      const user = await User.findByPk(id);
      if (!user) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '用户不存在'
        };
        return;
      }

      await UserRole.destroy({ where: { user_id: id } });
      await user.destroy();

      ctx.body = {
        code: 200,
        message: '删除用户成功'
      };
    } catch (error) {
      errorLogger.error('删除用户失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
};

module.exports = userController;
