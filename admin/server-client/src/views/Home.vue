<template>
  <div class="home">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic title="用户总数" :value="stats.userCount">
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic title="文件数量" :value="stats.fileCount">
            <template #prefix>
              <el-icon><Folder /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic title="角色数量" :value="stats.roleCount">
            <template #prefix>
              <el-icon><UserFilled /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px">
      <template #header>
        <span>欢迎使用管理系统</span>
      </template>
      <div class="welcome">
        <p>当前登录用户：{{ username }}</p>
        <p>角色：{{ roleName }}</p>
        <p>欢迎使用本系统，请从左侧菜单选择功能。</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { user, upload, role } from '../api';
import { useUserStore } from '../stores/user';
import { User, Folder, UserFilled } from '@element-plus/icons-vue';

const userStore = useUserStore();

const stats = ref({
  userCount: 0,
  fileCount: 0,
  roleCount: 0
});

const username = computed(() => userStore.userInfo?.username || '-');
const roleName = computed(() => userStore.userInfo?.role?.name || '-');

const loadStats = async () => {
  try {
    const [userRes, fileRes, roleRes] = await Promise.all([
      user.getUsers(),
      upload.getFiles(),
      role.getRoles()
    ]);
    if (userRes.code === 200) {
      stats.value.userCount = userRes.data?.length || 0;
    }
    if (fileRes.code === 200) {
      stats.value.fileCount = fileRes.data?.length || 0;
    }
    if (roleRes.code === 200) {
      stats.value.roleCount = roleRes.data?.length || 0;
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
.welcome {
  color: #666;
  line-height: 2;
}
</style>
