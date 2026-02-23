const Koa = require('koa');
const koaBody = require('koa-body').koaBody;
const static = require('koa-static');
const path = require('path');
const sequelize = require('./config/database');
const router = require('./routes');
const { logger, errorLogger } = require('./utils/logger');

const User = require('./models/user');
const Role = require('./models/role');
const UserRole = require('./models/userRole');
const Permission = require('./models/sysPermission');
const RolePermission = require('./models/rolePermission');
const Log = require('./models/log');

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

app.use(static(path.join(__dirname, 'uploads')));

const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });
    logger.info('数据库表结构同步成功');

    const adminRole = await Role.findOne({ where: { role_code: 'admin' } });
    if (!adminRole) {
      await Role.create({
        role_name: '管理员',
        role_code: 'admin',
        description: '系统管理员',
        status: 1
      });
      logger.info('已创建默认管理员角色');
    }

    const userRole = await Role.findOne({ where: { role_code: 'user' } });
    if (!userRole) {
      await Role.create({
        role_name: '普通用户',
        role_code: 'user',
        description: '普通用户',
        status: 1
      });
      logger.info('已创建默认普通用户角色');
    }

    const adminPermissions = [
      { parent_id: 0, permission_name: '首页', permission_code: 'home', type: 1, path: '/home', component: 'Home.vue', icon: 'HomeFilled', sort: 1, status: 1 },
      { parent_id: 0, permission_name: '系统管理', permission_code: 'system', type: 1, path: '/system', component: '', icon: 'Setting', sort: 2, status: 1 },
      { parent_id: 2, permission_name: '用户管理', permission_code: 'system:user', type: 1, path: '/system/user', component: 'User.vue', icon: 'User', sort: 1, status: 1 },
      { parent_id: 2, permission_name: '角色管理', permission_code: 'system:role', type: 1, path: '/system/role', component: 'Role.vue', icon: 'UserFilled', sort: 2, status: 1 },
      { parent_id: 2, permission_name: '菜单管理', permission_code: 'system:menu', type: 1, path: '/system/menu', component: 'Menu.vue', icon: 'Menu', sort: 3, status: 1 },
      { parent_id: 0, permission_name: '文件管理', permission_code: 'file', type: 1, path: '/file', component: 'File.vue', icon: 'Folder', sort: 3, status: 1 }
    ];

    const permissionCount = await Permission.count();
    if (permissionCount === 0) {
      await Permission.bulkCreate(adminPermissions);
      logger.info('已创建默认权限数据');

      const adminRole = await Role.findOne({ where: { role_code: 'admin' } });
      const permissions = await Permission.findAll();
      const rolePermissions = permissions.map(p => ({
        role_id: adminRole.id,
        permission_id: p.id
      }));
      await RolePermission.bulkCreate(rolePermissions);
      logger.info('已为管理员角色分配所有权限');
    }

    logger.info('数据库初始化完成');

    app.use(router.routes()).use(router.allowedMethods());

    app.listen(port, () => {
      logger.info(`服务器启动成功，监听端口 ${port}`);
    });
  } catch (error) {
    errorLogger.error('服务器启动失败:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
