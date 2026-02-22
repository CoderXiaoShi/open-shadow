const { verifyToken } = require('../utils/jwt');
const User = require('../models/user');

const authMiddleware = async (ctx, next) => {
  const token = ctx.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    ctx.status = 401;
    ctx.body = {
      code: 401,
      message: '未授权，请先登录'
    };
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    ctx.status = 401;
    ctx.body = {
      code: 401,
      message: 'Token 无效或已过期'
    };
    return;
  }

  const user = await User.findByPk(decoded.id);
  if (!user || user.status === 0) {
    ctx.status = 401;
    ctx.body = {
      code: 401,
      message: '用户不存在或已被禁用'
    };
    return;
  }

  ctx.user = user;
  await next();
};

module.exports = authMiddleware;