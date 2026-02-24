const checkPermission = (code) => async (ctx, next) => {
  if (!ctx.user.permissionCodes.includes(code)) {
    ctx.status = 403;
    ctx.body = { code: 403, message: '权限不足' };
    return;
  }
  await next();
};

module.exports = { checkPermission };
