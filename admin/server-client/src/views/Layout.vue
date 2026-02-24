<template>
  <el-container class="layout-container">
    <!-- 左侧导航栏 -->
    <el-aside :width="isCollapsed ? '64px' : '220px'" class="sidebar">
      <!-- Logo -->
      <div class="logo" :class="{ collapsed: isCollapsed }">
        <div class="logo-icon">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="24" cy="24" rx="7" ry="10" fill="url(#lg1)"/>
            <ellipse cx="24" cy="24" rx="3" ry="4" fill="#fff" opacity="0.9"/>
            <path d="M10 24c0-7.7 6.3-14 14-14" stroke="url(#lg2)" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M38 24c0 7.7-6.3 14-14 14" stroke="url(#lg2)" stroke-width="1.5" stroke-linecap="round"/>
            <defs>
              <linearGradient id="lg1" x1="17" y1="14" x2="31" y2="34">
                <stop offset="0%" stop-color="#c4b5fd"/>
                <stop offset="100%" stop-color="#38bdf8"/>
              </linearGradient>
              <linearGradient id="lg2" x1="0" y1="0" x2="48" y2="0">
                <stop offset="0%" stop-color="#a78bfa"/>
                <stop offset="100%" stop-color="#38bdf8"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span v-show="!isCollapsed" class="logo-text">智影</span>
      </div>

      <!-- 导航菜单 -->
      <el-scrollbar class="menu-scrollbar">
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapsed"
          :collapse-transition="false"
          class="sidebar-menu"
          router
        >
          <NavMenuItem
            v-for="menu in menuTree"
            :key="menu.id"
            :item="menu"
          />
        </el-menu>
      </el-scrollbar>
    </el-aside>

    <!-- 右侧主区域 -->
    <el-container class="main-container">
      <!-- 顶部 Header -->
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="isCollapsed = !isCollapsed">
            <Fold v-if="!isCollapsed" />
            <Expand v-else />
          </el-icon>
          <!-- 面包屑 -->
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentMenu">{{ currentMenu }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" class="avatar">
                {{ username.charAt(0).toUpperCase() }}
              </el-avatar>
              <span class="username">{{ username }}</span>
              <span class="role-tag">{{ roleNames }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '../stores/user';
import { ElMessageBox } from 'element-plus';
import NavMenuItem from '../components/NavMenuItem.vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const isCollapsed = ref(false);

const username = computed(() => userStore.userInfo?.username || 'Admin');
const roleNames = computed(() => {
  const roles = userStore.userInfo?.roles || [];
  return roles.map(r => r.role_name).join(', ');
});

const activeMenu = computed(() => route.path);

const currentMenu = computed(() => {
  const flat = flattenMenus(menuTree.value);
  const matched = flat.find(m => m.path === route.path);
  return matched?.permission_name || '';
});

// 将后端返回的扁平菜单列表构建成树
const menuTree = computed(() => buildTree(userStore.menus || []));

const buildTree = (list) => {
  const map = {};
  list.forEach(item => { map[item.id] = { ...item, children: [] }; });
  const roots = [];
  list.forEach(item => {
    if (item.parent_id === 0) {
      roots.push(map[item.id]);
    } else if (map[item.parent_id]) {
      map[item.parent_id].children.push(map[item.id]);
    }
  });
  return roots;
};

const flattenMenus = (tree) => {
  const result = [];
  const walk = (nodes) => nodes.forEach(n => { result.push(n); if (n.children?.length) walk(n.children); });
  walk(tree);
  return result;
};

const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout();
      router.push('/login');
    }).catch(() => {});
  }
};
</script>

<style scoped>
.layout-container {
  height: 100vh;
  background: #f0f2f5;
}

/* ── 侧边栏 ── */
.sidebar {
  background: #0f172a;
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease;
  overflow: hidden;
  box-shadow: 2px 0 8px rgba(0,0,0,0.2);
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 18px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
  overflow: hidden;
  white-space: nowrap;
}
.logo.collapsed {
  padding: 0;
  justify-content: center;
}
.logo-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}
.logo-icon svg { width: 100%; height: 100%; }
.logo-text {
  font-size: 20px;
  font-weight: 800;
  background: linear-gradient(135deg, #c4b5fd, #38bdf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 3px;
}

.menu-scrollbar {
  flex: 1;
  overflow: hidden;
}

.sidebar-menu {
  border: none !important;
  background-color: transparent !important;
  --el-menu-bg-color: transparent;
  --el-menu-text-color: #94a3b8;
  --el-menu-active-color: #a78bfa;
  --el-menu-hover-bg-color: rgba(167,139,250,0.08);
  --el-menu-item-height: 48px;
  --el-menu-sub-item-height: 44px;
}

/* 子菜单背景 */
.sidebar-menu :deep(.el-sub-menu__title) {
  background-color: transparent !important;
  color: #94a3b8;
}
.sidebar-menu :deep(.el-sub-menu__title:hover) {
  background-color: rgba(167,139,250,0.08) !important;
  color: #c4b5fd;
}
.sidebar-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, rgba(124,58,237,0.25), transparent) !important;
  color: #a78bfa !important;
  border-right: 2px solid #a78bfa;
}
.sidebar-menu :deep(.el-menu-item:hover) {
  color: #c4b5fd !important;
}
/* 折叠时 tooltip 弹出层背景 */
.sidebar-menu :deep(.el-menu--popup) {
  background: #1e293b !important;
  --el-menu-bg-color: #1e293b;
  --el-menu-text-color: #94a3b8;
  --el-menu-hover-bg-color: rgba(167,139,250,0.12);
}

/* ── Header ── */
.main-container {
  overflow: hidden;
}
.header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  z-index: 10;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #64748b;
  transition: color 0.2s;
}
.collapse-btn:hover { color: #7c3aed; }

.header-right { display: flex; align-items: center; }
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}
.user-info:hover { background: #f1f5f9; }

.avatar {
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  color: white;
  font-weight: 600;
  font-size: 14px;
}
.username {
  font-size: 14px;
  font-weight: 500;
  color: #334155;
}
.role-tag {
  font-size: 12px;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 1px 8px;
  border-radius: 999px;
}

/* ── 内容区 ── */
.main-content {
  background: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
