<template>
  <div class="file-page">
    <div class="toolbar">
      <h2>文件管理</h2>
      <div>
        <input type="file" ref="fileInput" @change="handleFileChange" style="display: none" />
        <button @click="$refs.fileInput.click()">上传文件</button>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>文件名</th>
          <th>大小</th>
          <th>上传时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in files" :key="item.fileName">
          <td>{{ item.fileName }}</td>
          <td>{{ formatSize(item.size) }}</td>
          <td>{{ formatDate(item.createdAt) }}</td>
          <td>
            <a class="btn-download" :href="item.filePath" target="_blank">下载</a>
            <button class="btn-delete" @click="handleDelete(item.fileName)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { upload } from '../api';

const files = ref([]);
const fileInput = ref(null);

const loadFiles = async () => {
  const res = await upload.getFiles();
  if (res.code === 200) {
    files.value = res.data || [];
  }
};

const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    await upload.uploadFile(formData);
    loadFiles();
    event.target.value = '';
  } catch (e) {
    alert('上传失败: ' + e.message);
  }
};

const handleDelete = async (filename) => {
  if (!confirm('确定要删除该文件吗？')) return;
  try {
    await upload.deleteFile(filename);
    loadFiles();
  } catch (e) {
    alert(e.message);
  }
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
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar button {
  padding: 10px 20px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.table {
  width: 100%;
  background: white;
  border-collapse: collapse;
  border-radius: 8px;
  overflow: hidden;
}

.table th,
.table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.table th {
  background: #f5f7fa;
  font-weight: bold;
}

.btn-download,
.btn-delete {
  padding: 5px 10px;
  margin-right: 5px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-download {
  background: #67c23a;
  color: white;
  text-decoration: none;
}

.btn-delete {
  background: #ff4444;
  color: white;
}
</style>
