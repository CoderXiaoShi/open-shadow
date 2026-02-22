const Koa = require('koa');
const koaBody = require('koa-body').koaBody;
const static = require('koa-static');
const path = require('path');
const sequelize = require('./config/database');
const router = require('./routes');
const { logger, errorLogger } = require('./utils/logger');

// 导入模型，自动创建表结构
const User = require('./models/user');
const Role = require('./models/role');
const Menu = require('./models/menu');
const Permission = require('./models/permission');
const Log = require('./models/log');

User.associate({ Role, Menu, Permission, Log });
Role.associate({ User });

const app = new Koa();
const port = 3000;

// 配置中间件
app.use(koaBody({
  multipart: true,
  formidable: {
    uploadDir: path.join(__dirname, 'temp'),
    keepExtensions: true,
    maxFieldsSize: 10 * 1024 * 1024 // 10MB
  }
}));

// 静态文件服务
app.use(static(path.join(__dirname, 'uploads')));

// 错误处理中间件
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    errorLogger.error('服务器错误:', error);
    ctx.status = 500;
    ctx.body = {
      code: 500,
      message: '服务器内部错误'
    };
  }
});

// 加载路由
app.use(router.routes()).use(router.allowedMethods());

// 初始化数据库
async function initDatabase() {
  try {
    // 自动创建表结构
    await sequelize.sync({ alter: true });
    logger.info('数据库表结构同步成功');

    // 初始化默认角色
    const adminRole = await Role.findOrCreate({
      where: { id: 1 },
      defaults: {
        name: '管理员',
        description: '系统管理员',
        status: 1
      }
    });

    const userRole = await Role.findOrCreate({
      where: { id: 2 },
      defaults: {
        name: '普通用户',
        description: '普通用户',
        status: 1
      }
    });

    // 初始化默认菜单
    const menus = [
      { id: 1, name: '首页', path: '/', component: 'Home', icon: 'home', parent_id: 0, order: 1, status: 1 },
      { id: 2, name: '用户管理', path: '/user', component: 'User', icon: 'user', parent_id: 0, order: 2, status: 1 },
      { id: 3, name: '角色管理', path: '/role', component: 'Role', icon: 'role', parent_id: 0, order: 3, status: 1 },
      { id: 4, name: '菜单管理', path: '/menu', component: 'Menu', icon: 'menu', parent_id: 0, order: 4, status: 1 },
      { id: 5, name: '文件管理', path: '/file', component: 'File', icon: 'file', parent_id: 0, order: 5, status: 1 },
      { id: 6, name: '日志管理', path: '/log', component: 'Log', icon: 'log', parent_id: 0, order: 6, status: 1 }
    ];

    for (const menu of menus) {
      await Menu.findOrCreate({
        where: { id: menu.id },
        defaults: menu
      });
    }

    // 初始化管理员权限（所有菜单）
    const allMenus = await Menu.findAll();
    for (const menu of allMenus) {
      await Permission.findOrCreate({
        where: { role_id: 1, menu_id: menu.id },
        defaults: { role_id: 1, menu_id: menu.id }
      });
    }

    // 初始化普通用户权限（仅首页和文件管理）
    const userMenus = await Menu.findAll({ where: { id: [1, 5] } });
    for (const menu of userMenus) {
      await Permission.findOrCreate({
        where: { role_id: 2, menu_id: menu.id },
        defaults: { role_id: 2, menu_id: menu.id }
      });
    }

    // 初始化默认管理员用户
    const adminUser = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        password: 'admin123',
        nickname: '系统管理员',
        email: 'admin@example.com',
        role_id: 1,
        status: 1
      }
    });

    logger.info('数据库初始化完成');
  } catch (error) {
    errorLogger.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

// 启动服务器
async function startServer() {
  try {
    await initDatabase();
    
    app.listen(port, () => {
      logger.info(`服务器启动成功，监听端口 ${port}`);
    });
  } catch (error) {
    errorLogger.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();