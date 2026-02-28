/**
 * 智影 Open Shadow — 数据初始化脚本
 *
 * 功能：一键初始化角色、菜单权限、按钮权限、管理员用户及全部关联关系
 * 特点：幂等 —— 已存在的数据不会重复创建，可安全重复执行
 * 用法：node scripts/init.js
 */

'use strict';

const sequelize  = require('../config/database');
const User       = require('../models/user');
const Role       = require('../models/role');
const UserRole   = require('../models/userRole');
const Permission = require('../models/sysPermission');
const RolePermission = require('../models/rolePermission');

// ─────────────────────────────────────────────────────────────
// 数据定义（在此处统一维护，不散落在业务代码里）
// ─────────────────────────────────────────────────────────────

/** 角色列表 */
const ROLES = [
  { role_code: 'admin', role_name: '管理员',  description: '系统管理员，拥有全部权限', status: 1 },
  { role_code: 'user',  role_name: '普通用户', description: '普通用户，仅限基础功能',   status: 1 }
];

/**
 * 菜单权限 type=1
 * parent_code: null 表示根节点，否则指向父菜单的 permission_code
 * 顺序必须保证父节点先于子节点
 */
const MENUS = [
  { permission_code: 'home',        permission_name: '首页',     parent_code: null,      path: '/home',        component: 'Home.vue',  icon: 'HomeFilled', sort: 1 },
  { permission_code: 'system',      permission_name: '系统管理', parent_code: null,      path: '/system',      component: '',          icon: 'Setting',    sort: 2 },
  { permission_code: 'system:user', permission_name: '用户管理', parent_code: 'system',  path: '/system/user', component: 'User.vue',  icon: 'User',       sort: 1 },
  { permission_code: 'system:role', permission_name: '角色管理', parent_code: 'system',  path: '/system/role', component: 'Role.vue',  icon: 'UserFilled', sort: 2 },
  { permission_code: 'system:menu', permission_name: '菜单管理', parent_code: 'system',  path: '/system/menu', component: 'Menu.vue',  icon: 'Menu',       sort: 3 },
  { permission_code: 'file',        permission_name: '文件管理', parent_code: null,      path: '/file',        component: 'File.vue',  icon: 'Folder',     sort: 3 },
  { permission_code: 'persona',     permission_name: '角色人设', parent_code: null,      path: '/persona',     component: 'Persona.vue',   icon: 'UserFilled', sort: 20 },
  { permission_code: 'ai-config',   permission_name: 'AI配置',   parent_code: null,      path: '/ai-config',   component: 'AiConfig.vue',  icon: 'Setting',    sort: 25 },
  { permission_code: 'material',    permission_name: '素材管理', parent_code: null,      path: '/material',    component: 'Material/index.vue', icon: 'Collection', sort: 30 },
  { permission_code: 'model-test',  permission_name: '模型测试', parent_code: null,      path: '/model-test',  component: 'ModelTest.vue',      icon: 'ChatDotRound', sort: 35 },
  { permission_code: 'ai-agent',    permission_name: 'AI角色构建', parent_code: null,    path: '/ai-agent',    component: 'AiAgent.vue',        icon: 'MagicStick',   sort: 40 }
];

/**
 * 按钮/接口权限 type=2
 * parent_code 指向所属菜单的 permission_code
 */
const BUTTONS = [
  { permission_code: 'system:user:add',    permission_name: '新增用户', parent_code: 'system:user', sort: 1 },
  { permission_code: 'system:user:edit',   permission_name: '编辑用户', parent_code: 'system:user', sort: 2 },
  { permission_code: 'system:user:delete', permission_name: '删除用户', parent_code: 'system:user', sort: 3 },
  { permission_code: 'system:role:add',    permission_name: '新增角色', parent_code: 'system:role', sort: 1 },
  { permission_code: 'system:role:edit',   permission_name: '编辑角色', parent_code: 'system:role', sort: 2 },
  { permission_code: 'system:role:delete', permission_name: '删除角色', parent_code: 'system:role', sort: 3 },
  { permission_code: 'system:role:assign', permission_name: '分配权限', parent_code: 'system:role', sort: 4 },
  { permission_code: 'system:menu:add',    permission_name: '新增菜单', parent_code: 'system:menu', sort: 1 },
  { permission_code: 'system:menu:edit',   permission_name: '编辑菜单', parent_code: 'system:menu', sort: 2 },
  { permission_code: 'system:menu:delete', permission_name: '删除菜单', parent_code: 'system:menu', sort: 3 },
  { permission_code: 'file:upload',        permission_name: '上传文件', parent_code: 'file',        sort: 1 },
  { permission_code: 'file:delete',        permission_name: '删除文件', parent_code: 'file',        sort: 2 },
  { permission_code: 'material:add',    permission_name: '新增素材', parent_code: 'material', sort: 1 },
  { permission_code: 'material:edit',   permission_name: '编辑素材', parent_code: 'material', sort: 2 },
  { permission_code: 'material:delete', permission_name: '删除素材', parent_code: 'material', sort: 3 }
];

/** 默认管理员账号 */
const ADMIN_USER = {
  username: 'admin',
  password: 'admin123',
  nickname: '超级管理员',
  status: 1
};

/**
 * 角色-权限映射
 * key: role_code，value: permission_code[]
 * admin 默认获得全部权限；user 角色目前无预设权限（按需在后台分配）
 */
const ROLE_PERMISSIONS = {
  admin: [...MENUS, ...BUTTONS].map(p => p.permission_code)
};

// ─────────────────────────────────────────────────────────────
// 初始化执行
// ─────────────────────────────────────────────────────────────

const log = (msg) => console.log(`  ${msg}`);
const section = (title) => console.log(`\n▸ ${title}`);

(async () => {
  try {
    await sequelize.authenticate();
    console.log('\n✔ 数据库连接成功');

    await sequelize.sync({ alter: true });
    console.log('✔ 数据库表结构同步完成\n');

    // ── Step 1: 角色 ────────────────────────────────────────
    section('初始化角色');
    const roleMap = {};
    for (const r of ROLES) {
      const [role, created] = await Role.findOrCreate({
        where:    { role_code: r.role_code },
        defaults: r
      });
      roleMap[r.role_code] = role;
      log(`[${r.role_code}] ${created ? '已创建' : '已存在，跳过'}`);
    }

    // ── Step 2: 菜单权限 ──────────────────────────────────
    section('初始化菜单权限');
    const permMap = {};
    for (const m of MENUS) {
      const parentId = m.parent_code ? (permMap[m.parent_code]?.id ?? 0) : 0;
      const defaults = {
        parent_id:       parentId,
        permission_name: m.permission_name,
        permission_code: m.permission_code,
        type:            1,
        path:            m.path      || null,
        component:       m.component || null,
        icon:            m.icon      || null,
        sort:            m.sort,
        status:          1
      };
      let perm = await Permission.findOne({ where: { permission_code: m.permission_code } });
      if (!perm) {
        perm = await Permission.create(defaults);
        log(`[${m.permission_code}] 已创建`);
      } else {
        await perm.update(defaults);
        log(`[${m.permission_code}] 已更新`);
      }
      permMap[m.permission_code] = perm;
    }

    // ── Step 3: 按钮权限 ──────────────────────────────────
    section('初始化按钮权限');
    for (const b of BUTTONS) {
      const parentId = permMap[b.parent_code]?.id ?? 0;
      const defaults = {
        parent_id:       parentId,
        permission_name: b.permission_name,
        permission_code: b.permission_code,
        type:            2,
        sort:            b.sort,
        status:          1
      };
      let perm = await Permission.findOne({ where: { permission_code: b.permission_code } });
      if (!perm) {
        perm = await Permission.create(defaults);
        log(`[${b.permission_code}] 已创建`);
      } else {
        await perm.update(defaults);
        log(`[${b.permission_code}] 已更新`);
      }
      permMap[b.permission_code] = perm;
    }

    // ── Step 4: 角色-权限关联 ─────────────────────────────
    section('绑定角色权限');
    for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSIONS)) {
      const role = roleMap[roleCode];
      if (!role) continue;
      let bound = 0;
      for (const code of permCodes) {
        const perm = permMap[code];
        if (!perm) continue;
        const [, created] = await RolePermission.findOrCreate({
          where: { role_id: role.id, permission_id: perm.id }
        });
        if (created) bound++;
      }
      log(`[${roleCode}] 共 ${permCodes.length} 个权限，本次新增绑定 ${bound} 个`);
    }

    // ── Step 5: 管理员用户 ────────────────────────────────
    section('初始化管理员用户');
    let adminUser = await User.findOne({ where: { username: ADMIN_USER.username } });
    if (!adminUser) {
      adminUser = await User.create(ADMIN_USER);
      log(`用户 [${ADMIN_USER.username}] 已创建，初始密码: ${ADMIN_USER.password}`);
    } else {
      log(`用户 [${ADMIN_USER.username}] 已存在，跳过创建`);
    }

    // ── Step 6: 用户-角色关联 ─────────────────────────────
    section('绑定用户角色');
    const [, created] = await UserRole.findOrCreate({
      where: { user_id: adminUser.id, role_id: roleMap['admin'].id }
    });
    log(`[${ADMIN_USER.username}] ↔ [admin] ${created ? '绑定成功' : '已存在，跳过'}`);

    // ── 完成 ──────────────────────────────────────────────
    console.log('\n' + '─'.repeat(40));
    console.log('✅  初始化完成！');
    console.log(`    登录账号: ${ADMIN_USER.username}`);
    console.log(`    初始密码: ${ADMIN_USER.password}`);
    console.log('    首次登录后请及时修改密码');
    console.log('─'.repeat(40) + '\n');

  } catch (err) {
    console.error('\n❌ 初始化失败:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
})();
