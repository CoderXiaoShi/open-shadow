# 智影 · Open Shadow Admin

企业级后台管理系统，基于 Koa2 + Vue3 + Element Plus + Sequelize + MySQL。

---

## 目录结构

```
admin/
├── server/                 # 后端（Koa2 + Sequelize）
│   ├── config/             # 数据库配置
│   ├── controllers/        # 控制器
│   ├── middleware/         # 中间件（auth、permission）
│   ├── models/             # Sequelize 模型
│   ├── routes/             # 路由
│   ├── scripts/            # 工具脚本
│   │   ├── init.js         # ⭐ 数据初始化脚本（首次部署必须执行）
│   │   └── reset-password.js  # 重置用户密码
│   └── index.js            # 服务入口
└── server-client/          # 前端（Vue3 + Element Plus）
    └── src/
        ├── api/            # 接口封装
        ├── components/     # 公共组件
        ├── router/         # 路由 + 路由守卫
        ├── stores/         # Pinia 状态管理
        └── views/          # 页面
```

---

## 快速开始

### 环境要求

| 依赖 | 版本要求 |
|------|----------|
| Node.js | >= 18 |
| MySQL | >= 8.0 |

### 1. 配置数据库

在 MySQL 中创建数据库：

```sql
CREATE DATABASE openShadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

修改数据库连接配置 `server/config/database.js`：

```js
const sequelize = new Sequelize({
  dialect:  'mysql',
  host:     'localhost',
  port:     3306,
  username: 'root',       // 数据库用户名
  password: '12345678',   // 数据库密码
  database: 'openShadow'
});
```

### 2. 安装依赖

```bash
# 后端
cd server
cnpm install

# 前端
cd ../server-client
cnpm install
```

### 3. ⭐ 初始化基础数据（首次部署必须执行）

```bash
cd server
npm run init
```

执行成功后输出：

```
✔ 数据库连接成功
✔ 数据库表结构同步完成

▸ 初始化角色
  [admin] 已创建
  [user]  已创建

▸ 初始化菜单权限
  [home]        已创建
  [system]      已创建
  ...

▸ 初始化按钮权限
  [system:user:add] 已创建
  ...

▸ 绑定角色权限
  [admin] 共 18 个权限，本次新增绑定 18 个

▸ 初始化管理员用户
  用户 [admin] 已创建，初始密码: admin123

▸ 绑定用户角色
  [admin] ↔ [admin] 绑定成功

────────────────────────────────────────
✅  初始化完成！
    登录账号: admin
    初始密码: admin123
    首次登录后请及时修改密码
────────────────────────────────────────
```

> **注意**：init 脚本是幂等的，重复执行不会产生重复数据，可安全多次运行。

### 4. 启动服务

```bash
# 后端（开发模式，nodemon 自动重启）
cd server
npm run dev

# 前端
cd server-client
npm run dev
```

访问地址：`http://localhost:5173`

---

## 默认账号

| 字段 | 值 |
|------|----|
| 账号 | `admin` |
| 密码 | `admin123` |

> 首次登录后请修改密码。

---

## 权限设计

### 角色

| role_code | 说明 |
|-----------|------|
| `admin`   | 管理员，拥有全部权限 |
| `user`    | 普通用户，无预设权限，按需在后台分配 |

### 菜单权限（type=1）

| permission_code | 路由 | 说明 |
|-----------------|------|------|
| `home`          | `/home`        | 首页 |
| `system`        | `/system`      | 系统管理（父菜单） |
| `system:user`   | `/system/user` | 用户管理 |
| `system:role`   | `/system/role` | 角色管理 |
| `system:menu`   | `/system/menu` | 菜单管理 |
| `file`          | `/file`        | 文件管理 |

### 按钮权限（type=2）

| permission_code       | 说明 |
|-----------------------|------|
| `system:user:add`     | 新增用户 |
| `system:user:edit`    | 编辑用户 |
| `system:user:delete`  | 删除用户 |
| `system:role:add`     | 新增角色 |
| `system:role:edit`    | 编辑角色 |
| `system:role:delete`  | 删除角色 |
| `system:role:assign`  | 分配权限 |
| `system:menu:add`     | 新增菜单 |
| `system:menu:edit`    | 编辑菜单 |
| `system:menu:delete`  | 删除菜单 |
| `file:upload`         | 上传文件 |
| `file:delete`         | 删除文件 |

---

## 工具脚本

### 重置用户密码

```bash
cd server
node scripts/reset-password.js <用户名> <新密码>

# 示例
node scripts/reset-password.js admin admin123
```

### 重新初始化数据

若需要重置所有基础数据，清空相关表后重新执行：

```sql
-- 谨慎操作！仅在开发环境使用
TRUNCATE TABLE sys_role_permission;
TRUNCATE TABLE sys_user_role;
TRUNCATE TABLE sys_permission;
TRUNCATE TABLE sys_role;
DELETE FROM sys_user WHERE username = 'admin';
```

```bash
npm run init
```

---

## 开发说明

### 新增菜单

1. 在 `scripts/init.js` 的 `MENUS` 数组中追加菜单定义
2. 在 `scripts/init.js` 的 `ROLE_PERMISSIONS.admin` 中追加对应 permission_code
3. 在前端 `router/index.js` 中添加路由
4. 新建对应的 Vue 页面组件
5. 执行 `npm run init` 写入数据库

### 新增按钮权限

1. 在 `scripts/init.js` 的 `BUTTONS` 数组中追加权限定义
2. 在 `ROLE_PERMISSIONS.admin` 中追加
3. 在后端路由 `routes/index.js` 中加 `checkPermission('your:code')`
4. 在对应 Vue 页面按钮上加 `v-if="userStore.hasPermission('your:code')"`
5. 执行 `npm run init`
