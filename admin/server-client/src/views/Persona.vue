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

    <!-- 人格设定 -->
    <el-card shadow="never" class="section-card">
      <template #header><span class="section-title">人格设定</span></template>
      <el-form :model="form" label-width="72px">
        <el-form-item label="性格特征">
          <el-input
            v-model="form.personality"
            type="textarea" :rows="3"
            placeholder="如：理性、克制、善用商业类比，说话有条理，不喜欢废话"
          />
        </el-form-item>
        <el-form-item label="说话风格">
          <el-input
            v-model="form.speech_style"
            type="textarea" :rows="3"
            placeholder="如：习惯用&quot;本质上&quot;、&quot;底层逻辑&quot;开头，喜欢举具体数字和案例"
          />
        </el-form-item>
        <el-form-item label="背景经历">
          <el-input
            v-model="form.background"
            type="textarea" :rows="4"
            placeholder="详细的人物背景、经历、代表作等"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 示例问答 -->
    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="section-header">
          <span class="section-title">示例问答 <span class="hint">（Few-shot，帮助模型快速对齐风格）</span></span>
          <el-button size="small" type="primary" plain @click="addQA">+ 添加</el-button>
        </div>
      </template>

      <div v-if="form.example_qa.length === 0" class="empty-qa">暂无示例，点击"添加"新增一组问答</div>

      <div v-for="(item, idx) in form.example_qa" :key="idx" class="qa-item">
        <div class="qa-index">{{ idx + 1 }}</div>
        <div class="qa-fields">
          <el-input v-model="item.q" placeholder="问题（用户侧）" style="margin-bottom:6px" />
          <el-input v-model="item.a" type="textarea" :rows="2" placeholder="回答（博主侧）" />
        </div>
        <el-button link type="danger" @click="removeQA(idx)">删除</el-button>
      </div>
    </el-card>

    <!-- System Prompt -->
    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="section-header">
          <span class="section-title">
            System Prompt
            <span class="hint">（最终发送给 LLM 的系统提示词，可手动覆盖）</span>
          </span>
          <el-button size="small" @click="handleBuildPrompt" :loading="building">自动生成</el-button>
        </div>
      </template>
      <el-input
        v-model="form.system_prompt"
        type="textarea"
        :rows="12"
        placeholder="点击'自动生成'根据上方字段组装，或直接在此手动编写"
        style="font-family: monospace; font-size: 13px"
      />
    </el-card>

    <!-- 保存 -->
    <div class="footer">
      <el-button type="primary" size="large" :loading="saving" @click="handleSave">保存人设</el-button>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { persona as personaApi } from '../api/index.js';

const saving   = ref(false);
const building = ref(false);

const form = reactive({
  name:         '',
  avatar_url:   '',
  bio:          '',
  personality:  '',
  speech_style: '',
  background:   '',
  example_qa:   [],
  system_prompt: ''
});

// ── 加载 ────────────────────────────────────────────────────
const load = async () => {
  try {
    const res = await personaApi.get();
    const d = res.data;
    Object.assign(form, {
      name:          d.name          || '',
      avatar_url:    d.avatar_url    || '',
      bio:           d.bio           || '',
      personality:   d.personality   || '',
      speech_style:  d.speech_style  || '',
      background:    d.background    || '',
      example_qa:    d.example_qa    || [],
      system_prompt: d.system_prompt || ''
    });
  } catch (e) {
    ElMessage.error(e.message || '加载失败');
  }
};

// ── 头像上传 ─────────────────────────────────────────────────
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

// ── 示例问答 ─────────────────────────────────────────────────
const addQA    = () => form.example_qa.push({ q: '', a: '' });
const removeQA = (idx) => form.example_qa.splice(idx, 1);

// ── 自动生成 System Prompt ───────────────────────────────────
const handleBuildPrompt = async () => {
  building.value = true;
  try {
    // 先用本地数据生成（无需保存）
    await handleSave(true);
    const res = await personaApi.buildPrompt();
    form.system_prompt = res.data.system_prompt;
    ElMessage.success('已生成，可继续手动调整');
  } catch (e) {
    ElMessage.error(e.message || '生成失败');
  } finally {
    building.value = false;
  }
};

// ── 保存 ────────────────────────────────────────────────────
const handleSave = async (silent = false) => {
  saving.value = true;
  try {
    await personaApi.save({ ...form });
    if (!silent) ElMessage.success('保存成功');
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
.section-header { display: flex; justify-content: space-between; align-items: center; }
.hint { font-size: 12px; font-weight: 400; color: #94a3b8; margin-left: 6px; }

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

.empty-qa {
  color: #94a3b8;
  font-size: 13px;
  text-align: center;
  padding: 16px 0;
}
.qa-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}
.qa-item:last-child { border-bottom: none; margin-bottom: 0; }
.qa-index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #64748b;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 6px;
}
.qa-fields { flex: 1; }

.footer {
  display: flex;
  justify-content: flex-end;
  padding-bottom: 24px;
}
</style>
