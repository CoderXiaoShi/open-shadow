const { verifyToken } = require('../utils/jwt');
const User = require('../models/user');
const UserRole = require('../models/userRole');
const RolePermission = require('../models/rolePermission');
const Permission = require('../models/sysPermission');

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

  const userRoles = await UserRole.findAll({ where: { user_id: user.id } });
  const roleIds = userRoles.map(ur => ur.role_id);
  const rolePermissions = roleIds.length
    ? await RolePermission.findAll({ where: { role_id: roleIds } })
    : [];
  const permissionIds = [...new Set(rolePermissions.map(rp => rp.permission_id))];
  const permissions = permissionIds.length
    ? await Permission.findAll({ where: { id: permissionIds, status: 1 } })
    : [];
  ctx.user.permissionCodes = permissions.map(p => p.permission_code);

  await next();
};

module.exports = authMiddleware;