<template>
  <div class="file-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>文件管理</span>
          <el-upload
            v-if="userStore.hasPermission('file:upload')"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :before-upload="beforeUpload"
          >
            <el-button type="primary">上传文件</el-button>
          </el-upload>
        </div>
      </template>

      <el-table :data="files" stripe>
        <el-table-column prop="fileName" label="文件名" />
        <el-table-column prop="size" label="大小" width="120">
          <template #default="{ row }">
            {{ formatSize(row.size) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="上传时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleDownload(row.filePath)">下载</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row.fileName)" v-if="userStore.hasPermission('file:delete')">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { upload } from '../api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '../stores/user';

const userStore = useUserStore();

const files = ref([]);

const uploadUrl = '/api/upload';
const uploadHeaders = {
  Authorization: `Bearer ${localStorage.getItem('token')}`
};

const loadFiles = async () => {
  const res = await upload.getFiles();
  if (res.code === 200) {
    files.value = res.data || [];
  }
};

const beforeUpload = (file) => {
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB');
    return false;
  }
  return true;
};

const handleUploadSuccess = () => {
  ElMessage.success('上传成功');
  loadFiles();
};

const handleDownload = (filePath) => {
  window.open(filePath, '_blank');
};

const handleDelete = (fileName) => {
  ElMessageBox.confirm('确定要删除该文件吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await upload.deleteFile(fileName);
      ElMessage.success('删除成功');
      loadFiles();
    } catch (e) {
      ElMessage.error(e.message);
    }
  }).catch(() => {});
};

const formatSize = (bytes) => {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
};

onMounted(() => {
  loadFiles();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
