import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '../stores/user';

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
      },
      {
        path: '/persona',
        name: 'Persona',
        component: () => import('../views/Persona.vue')
      },
      {
        path: '/ai-config',
        name: 'AiConfig',
        component: () => import('../views/AiConfig.vue')
      },
      {
        path: '/material',
        name: 'Material',
        component: () => import('../views/Material/index.vue')
      },
      {
        path: '/model-test',
        name: 'ModelTest',
        component: () => import('../views/ModelTest.vue')
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to) => {
  const userStore = useUserStore();

  if (!userStore.token) {
    return to.path === '/login' ? true : '/login';
  }

  if (to.path === '/login') return '/home';

  if (!userStore.userInfo) {
    try {
      await userStore.getUserInfo();
    } catch {
      userStore.logout();
      return '/login';
    }
  }

  const allowedPaths = userStore.menus.map(m => m.path).filter(Boolean);
  if (to.path !== '/home' && !allowedPaths.includes(to.path)) {
    return '/home';
  }

  return true;
});

export default router;
