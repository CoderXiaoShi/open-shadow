const User = require('../models/user');
const Role = require('../models/role');
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
      
      // 记录登录日志
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
            email: user.email,
            role_id: user.role_id
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
    const { username, password, nickname, email, role_id } = ctx.request.body;
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

      const user = await User.create({
        username,
        password,
        nickname,
        email,
        role_id
      });

      // 记录注册日志
      await Log.create({
        user_id: user.id,
        username: user.username,
        action: '注册',
        module: '用户管理',
        ip: ctx.request.ip,
        result: 1,
        message: '注册成功'
      });

      ctx.body = {
        code: 200,
        message: '注册成功',
        data: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          email: user.email,
          role_id: user.role_id
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
      const user = await User.findByPk(ctx.user.id, {
        include: [{
          model: Role,
          as: 'role',
          attributes: ['id', 'name']
        }]
      });

      ctx.body = {
        code: 200,
        message: '获取用户信息成功',
        data: user
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
        include: [{
          model: Role,
          as: 'role',
          attributes: ['id', 'name']
        }]
      });

      ctx.body = {
        code: 200,
        message: '获取用户列表成功',
        data: users
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
    const { id, nickname, email, role_id, status } = ctx.request.body;
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

      await user.update({
        nickname,
        email,
        role_id,
        status
      });

      // 记录更新日志
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

      await user.destroy();

      // 记录删除日志
      await Log.create({
        user_id: ctx.user.id,
        username: ctx.user.username,
        action: '删除用户',
        module: '用户管理',
        ip: ctx.request.ip,
        result: 1,
        message: `删除用户 ${user.username} 成功`
      });

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