import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('../views/Layout.vue'),
    redirect: '/home',
    children: [
      {
        path: '/home',
        name: 'Home',
        component: () => import('../views/Home.vue')
      },
      {
        path: '/system/user',
        name: 'SystemUser',
        component: () => import('../views/User.vue')
      },
      {
        path: '/system/role',
        name: 'SystemRole',
        component: () => import('../views/Role.vue')
      },
      {
        path: '/system/menu',
        name: 'SystemMenu',
        component: () => import('../views/Menu.vue')
      },
      {
        path: '/file',
        name: 'File',
        component: () => import('../views/File.vue')
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
