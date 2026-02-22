<template>
  <div class="home">
    <h2>欢迎使用管理系统</h2>
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">{{ stats.userCount }}</div>
        <div class="stat-label">用户总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.fileCount }}</div>
        <div class="stat-label">文件数量</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { user, upload } from '../api';

const stats = ref({
  userCount: 0,
  fileCount: 0
});

const loadStats = async () => {
  try {
    const [userRes, fileRes] = await Promise.all([
      user.getUsers(),
      upload.getFiles()
    ]);
    if (userRes.code === 200) {
      stats.value.userCount = userRes.data?.length || 0;
    }
    if (fileRes.code === 200) {
      stats.value.fileCount = fileRes.data?.length || 0;
    }
  } catch (e) {
    console.error('加载统计失败', e);
  }
};

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
.home h2 {
  margin-bottom: 20px;
}

.stats {
  display: flex;
  gap: 20px;
}

.stat-card {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 200px;
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 10px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}
</style>
