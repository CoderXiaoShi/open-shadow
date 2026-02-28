<template>
  <div class="persona-page">

    <!-- 基础信息 -->
    <el-card shadow="never" class="section-card">
      <template #header><span class="section-title">基础信息</span></template>
      <div class="basic-info">
        <!-- 头像 -->
        <div class="avatar-wrap">
          <el-avatar :size="96" :src="form.avatar_url" class="avatar">
            {{ form.name?.charAt(0) || '？' }}
          </el-avatar>
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            :on-change="handleAvatarChange"
          >
            <el-button size="small" style="margin-top:8px">更换头像</el-button>
          </el-upload>
        </div>
        <!-- 名称 + 简介 -->
        <el-form :model="form" label-width="72px" style="flex:1">
          <el-form-item label="博主名称">
            <el-input v-model="form.name" placeholder="如：刘润" />
          </el-form-item>
          <el-form-item label="一句话简介">
            <el-input v-model="form.bio" placeholder="如：商业顾问，前微软中国COO" />
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 保存 -->
    <div class="footer">
      <el-button type="primary" size="large" :loading="saving" @click="handleSave">保存</el-button>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { persona as personaApi } from '../api/index.js';

const saving = ref(false);

const form = reactive({
  name:       '',
  avatar_url: '',
  bio:        ''
});

const load = async () => {
  try {
    const res = await personaApi.get();
    const d = res.data;
    Object.assign(form, {
      name:       d.name       || '',
      avatar_url: d.avatar_url || '',
      bio:        d.bio        || ''
    });
  } catch (e) {
    ElMessage.error(e.message || '加载失败');
  }
};

const handleAvatarChange = async (uploadFile) => {
  try {
    const fd = new FormData();
    fd.append('file', uploadFile.raw);
    const res = await personaApi.uploadAvatar(fd);
    form.avatar_url = res.data.file_url;
    ElMessage.success('头像已更新，记得点保存');
  } catch (e) {
    ElMessage.error(e.message || '上传失败');
  }
};

const handleSave = async () => {
  saving.value = true;
  try {
    await personaApi.save({ ...form });
    ElMessage.success('保存成功');
  } catch (e) {
    ElMessage.error(e.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

onMounted(load);
</script>

<style scoped>
.persona-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 900px;
}

.section-card { border-radius: 8px; }
.section-title { font-size: 15px; font-weight: 600; color: #1e293b; }

.basic-info {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}
.avatar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}
.avatar {
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  font-size: 36px;
  font-weight: 700;
}

.footer {
  display: flex;
  justify-content: flex-end;
  padding-bottom: 24px;
}
</style>
