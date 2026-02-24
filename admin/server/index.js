const Koa = require('koa');
const koaBody = require('koa-body').koaBody;
const static = require('koa-static');
const path = require('path');
const sequelize = require('./config/database');
const router = require('./routes');
const { logger, errorLogger } = require('./utils/logger');

// 预加载所有模型（触发模型间关联的定义）
require('./models/user');
require('./models/role');
require('./models/userRole');
require('./models/sysPermission');
require('./models/rolePermission');
require('./models/log');
require('./models/material');
require('./models/persona');
require('./models/aiConfig');

const app = new Koa();
const port = 3000;

app.use(koaBody({
  multipart: true,
  formidable: {
    uploadDir: path.join(__dirname, 'temp'),
    keepExtensions: true,
    maxFieldsSize: 10 * 1024 * 1024
  }
}));

// 静态文件：将 /uploads/* 请求映射到 uploads 目录
app.use(async (ctx, next) => {
  if (ctx.path.startsWith('/uploads/')) {
    ctx.path = ctx.path.slice('/uploads'.length);
  }
  await next();
});
app.use(static(path.join(__dirname, 'uploads')));

const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });
    logger.info('数据库表结构同步成功');

    app.use(router.routes()).use(router.allowedMethods());

    app.listen(port, () => {
      logger.info(`服务器启动成功，监听端口 ${port}`);
      logger.info('提示：首次部署请先执行 node scripts/init.js 初始化基础数据');
    });
  } catch (error) {
    errorLogger.error('服务器启动失败:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
