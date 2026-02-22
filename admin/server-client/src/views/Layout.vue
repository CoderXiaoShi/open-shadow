<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="logo">Admin System</div>
      <nav class="menu">
        <router-link to="/home" class="menu-item">
          <span>首页</span>
        </router-link>
        <router-link to="/user" class="menu-item">
          <span>用户管理</span>
        </router-link>
        <router-link to="/file" class="menu-item">
          <span>文件管理</span>
        </router-link>
      </nav>
    </aside>
    <div class="main">
      <header class="header">
        <div class="header-title">管理系统</div>
        <div class="header-user">
          <span>{{ username }}</span>
          <button @click="handleLogout">退出</button>
        </div>
      </header>
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();

const username = computed(() => userStore.userInfo?.username || 'Admin');

const handleLogout = () => {
  userStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 200px;
  background: #304156;
  color: white;
  display: flex;
  flex-direction: column;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #3d4d5e;
}

.menu {
  flex: 1;
  padding: 10px 0;
}

.menu-item {
  display: block;
  padding: 15px 20px;
  color: #bfcbd9;
  text-decoration: none;
  transition: all 0.3s;
}

.menu-item:hover,
.menu-item.router-link-active {
  background: #263445;
  color: #409eff;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  height: 60px;
  background: white;
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

.header-user button {
  padding: 6px 15px;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.content {
  flex: 1;
  padding: 20px;
  background: #f0f2f5;
  overflow-y: auto;
}
</style>
