<template>
  <el-container class="layout-container">
    <el-aside width="200px">
      <div class="logo">Admin System</div>
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        router
      >
        <template v-for="menu in menus">
          <el-sub-menu v-if="menu.children && menu.children.length" :key="menu.id" :index="String(menu.id)">
            <template #title>
              <span>{{ menu.permission_name }}</span>
            </template>
            <el-menu-item v-for="child in menu.children" :key="child.id" :index="child.path">
              {{ child.permission_name }}
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :key="menu.id" :index="menu.path">
            <span>{{ menu.permission_name }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header>
        <div class="header-title">管理系统</div>
        <div class="header-user">
          <span>{{ username }} ({{ roleNames }})</span>
          <el-button type="danger" size="small" @click="handleLogout">退出</el-button>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '../stores/user';
import { ElMessageBox } from 'element-plus';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const username = computed(() => userStore.userInfo?.username || 'Admin');
const roleNames = computed(() => {
  const roles = userStore.userInfo?.roles || [];
  return roles.map(r => r.role_name).join(', ');
});

const menus = computed(() => {
  const rawMenus = userStore.menus || [];
  return buildMenuTree(rawMenus);
});

const activeMenu = computed(() => route.path);

const buildMenuTree = (list) => {
  const map = {};
  const roots = [];
  list.forEach(item => {
    map[item.id] = { ...item, children: [] };
  });
  list.forEach(item => {
    if (item.parent_id === 0) {
      roots.push(map[item.id]);
    } else if (map[item.parent_id]) {
      map[item.parent_id].children.push(map[item.id]);
    }
  });
  return roots;
};

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logout();
    router.push('/login');
  }).catch(() => {});
};
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.el-aside {
  background-color: #304156;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: white;
  border-bottom: 1px solid #3d4d5e;
}

.el-menu-vertical {
  border: none;
}

.el-header {
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.header-title {
  font-size: 18px;
  font-weight: bold;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 15px;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>
