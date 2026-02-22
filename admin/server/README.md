# 后台管理系统后端

基于 Koa、MySQL、Sequelize 实现的通用后台管理系统后端。

## 技术栈

- Koa 3
- MySQL
- Sequelize ORM
- JWT 认证
- log4js 日志

## 功能特性

- 用户认证（登录、注册）
- 用户管理（增删改查）
- 角色管理
- 菜单管理
- 权限管理
- 文件上传
- 操作日志记录

## 项目结构

```
server/
├── config/          # 配置文件
├── controllers/     # 控制器
├── middleware/      # 中间件
├── models/          # 数据模型
├── routes/          # 路由
├── utils/           # 工具类
├── uploads/         # 上传文件
├── temp/            # 临时文件
├── logs/            # 日志文件
├── index.js         # 应用入口
├── package.json     # 项目配置
└── README.md        # 项目说明
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置数据库

修改 `config/database.js` 文件中的数据库连接信息：

```javascript
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'your_password',
  database: 'admin_system',
  logging: false,
  define: {
    timestamps: true,
    underscored: true
  }
});
```

### 3. 启动服务器

```bash
node index.js
```

服务器将在 `http://localhost:3000` 上运行。

### 4. 初始化数据

服务器启动时会自动：
- 创建数据库表结构
- 初始化默认角色（管理员、普通用户）
- 初始化默认菜单
- 初始化默认权限
- 创建默认管理员用户（用户名：admin，密码：admin123）

## API 接口

### 认证接口

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册

### 用户管理接口

- `GET /api/user/info` - 获取当前用户信息
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 更新用户信息
- `DELETE /api/users/:id` - 删除用户

### 文件上传接口

- `POST /api/upload` - 上传文件
- `GET /api/files` - 获取文件列表
- `DELETE /api/files/:fileName` - 删除文件

## 前端项目搭建

### 1. 创建 Vue 3 项目

```bash
# 安装 Vue CLI
npm install -g @vue/cli

# 创建项目
vue create ../client

# 选择 Vue 3 + TypeScript
```

### 2. 安装依赖

```bash
cd ../client
npm install vue-router@4 pinia element-plus axios
```

### 3. 项目结构

```
client/
├── public/          # 静态资源
├── src/
│   ├── assets/      # 资源文件
│   ├── components/  # 组件
│   ├── views/       # 页面
│   ├── router/      # 路由
│   ├── store/       # 状态管理
│   ├── api/         # API 接口
│   ├── utils/       # 工具类
│   ├── App.vue      # 根组件
│   └── main.js      # 入口文件
├── package.json     # 项目配置
└── vue.config.js    # Vue 配置
```

### 4. 配置跨域

修改 `vue.config.js` 文件：

```javascript
module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/api'
        }
      }
    }
  }
};
```

### 5. 实现登录功能

```vue
<!-- src/views/Login.vue -->
<template>
  <el-form :model="loginForm" @submit.prevent="handleLogin">
    <el-form-item label="用户名" prop="username">
      <el-input v-model="loginForm.username"></el-input>
    </el-form-item>
    <el-form-item label="密码" prop="password">
      <el-input v-model="loginForm.password" type="password"></el-input>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" native-type="submit">登录</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const loginForm = ref({
  username: '',
  password: ''
});

const handleLogin = async () => {
  try {
    const response = await axios.post('/api/auth/login', loginForm.value);
    if (response.data.code === 200) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      router.push('/');
    }
  } catch (error) {
    console.error('登录失败:', error);
  }
};
</script>
```

### 6. 实现路由守卫

```javascript
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/',
    component: () => import('../views/Home.vue'),
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      next({ path: '/login' });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
```

### 7. 配置 Axios 拦截器

```javascript
// src/utils/request.js
import axios from 'axios';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
});

// 请求拦截器
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default request;
```

## 注意事项

1. 请确保 MySQL 服务已启动，并且创建了名为 `admin_system` 的数据库。
2. 首次启动时，系统会自动创建表结构和默认数据。
3. 默认管理员账号：admin，密码：admin123。
4. 上传文件的大小限制为 10MB。
5. 日志文件会保存在 `logs/` 目录下，最大日志文件大小为 10MB，最多保留 3 个备份。

## 许可证

MIT