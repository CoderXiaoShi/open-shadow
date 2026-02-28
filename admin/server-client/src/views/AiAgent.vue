<template>
  <div class="ai-agent-page">

    <!-- URL 输入 + 进度区 -->
    <el-card shadow="never" class="section-card">
      <template #header><span class="section-title">博主主页分析</span></template>

      <div class="url-row">
        <el-input
          v-model="url"
          placeholder="输入博主主页 URL，如 https://space.bilibili.com/xxxxx"
          clearable
          :disabled="running"
          style="flex:1"
          @keydown.enter="handleBuild"
        />
        <el-button
          type="primary"
          :loading="running"
          :disabled="!url.trim()"
          @click="handleBuild"
        >
          {{ running ? '分析中...' : '开始分析' }}
        </el-button>
      </div>

      <!-- 进度 + 缩略图 -->
      <div v-if="running || anyStepStarted" class="progress-area">

        <!-- 左：缩略图 -->
        <div class="screenshot-wrap">
          <div v-if="!screenshotUrl" class="screenshot-placeholder">
            <span class="spinner-lg" v-if="running && steps[0].active" />
            <span v-else-if="!running && !screenshotUrl" class="placeholder-text">等待截图...</span>
          </div>
          <el-image
            v-else
            :src="screenshotUrl"
            fit="cover"
            class="screenshot-img"
            :preview-src-list="[screenshotUrl]"
            preview-teleported
          />
        </div>

        <!-- 右：步骤 -->
        <div class="steps">
          <div
            v-for="s in steps"
            :key="s.index"
            class="step-item"
            :class="{ active: s.active, done: s.done }"
          >
            <div class="step-icon">
              <el-icon v-if="s.done" color="#16a34a"><CircleCheck /></el-icon>
              <span v-else-if="s.active" class="spinner" />
              <span v-else class="step-num">{{ s.index }}</span>
            </div>
            <div class="step-text">
              <span class="step-label">{{ s.label }}</span>
              <span v-if="s.active" class="step-msg">{{ s.message }}</span>
            </div>
          </div>

          <!-- 自动保存提示 -->
          <div v-if="autoSaved" class="autosave-hint">
            <el-icon color="#16a34a"><CircleCheck /></el-icon>
            已自动保存
          </div>
        </div>

      </div>
    </el-card>

    <!-- 角色定义编辑器 -->
    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="section-header">
          <span class="section-title">
            角色定义
            <span class="hint">（Markdown 格式，可直接编辑）</span>
          </span>
          <el-button type="primary" :loading="saving" :disabled="!content" @click="handleSave">
            保存
          </el-button>
        </div>
      </template>

      <el-input
        v-model="content"
        type="textarea"
        :rows="30"
        placeholder="点击「开始分析」后，生成的角色定义将显示在这里，可直接编辑后保存"
        style="font-family: monospace; font-size: 13px; line-height: 1.7"
        resize="none"
      />
    </el-card>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { CircleCheck } from '@element-plus/icons-vue';
import { aiAgent as aiAgentApi } from '../api/index.js';

const url           = ref('');
const content       = ref('');
const running       = ref(false);
const saving        = ref(false);
const screenshotUrl = ref('');
const autoSaved     = ref(false);

// 进度步骤
const STEP_LABELS = ['抓取页面内容', '提取博主信息', '生成角色定义'];
const makeSteps = () => STEP_LABELS.map((label, i) => ({
  index: i + 1, label, message: '', active: false, done: false
}));
const steps = ref(makeSteps());

const anyStepStarted = computed(() => steps.value.some(s => s.active || s.done));

const resetSteps = () => {
  steps.value  = makeSteps();
  autoSaved.value = false;
  screenshotUrl.value = '';
};

const setStep = (stepNum, message) => {
  steps.value.forEach((s, i) => {
    s.done    = i + 1 < stepNum;
    s.active  = i + 1 === stepNum;
    s.message = i + 1 === stepNum ? message : s.message;
  });
};

const finishSteps = () => {
  steps.value.forEach(s => { s.done = true; s.active = false; });
};

// ── 加载已保存内容 ───────────────────────────────────────
onMounted(async () => {
  try {
    const res = await aiAgentApi.get();
    content.value = res.data?.role_definition || '';
  } catch { /* 静默 */ }
});

// ── 开始分析 ─────────────────────────────────────────────
const handleBuild = async () => {
  if (!url.value.trim() || running.value) return;
  running.value = true;
  resetSteps();

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/ai-agent/build', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ url: url.value.trim() })
    });

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      throw new Error(json.message || `HTTP ${response.status}`);
    }

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let   buf     = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        try {
          const parsed = JSON.parse(line.slice(5).trim());
          if (parsed.type === 'progress') {
            setStep(parsed.step, parsed.message);
            if (parsed.screenshotUrl) screenshotUrl.value = parsed.screenshotUrl;
          } else if (parsed.type === 'done') {
            finishSteps();
            content.value       = parsed.data?.role_definition || '';
            if (parsed.data?.screenshotUrl) screenshotUrl.value = parsed.data.screenshotUrl;
            autoSaved.value     = true;
            ElMessage.success('角色定义已生成并自动保存');
          } else if (parsed.type === 'error') {
            throw new Error(parsed.message);
          }
        } catch (parseErr) {
          if (!(parseErr instanceof SyntaxError)) throw parseErr;
        }
      }
    }
  } catch (e) {
    ElMessage.error(e.message || '分析失败');
    resetSteps();
  } finally {
    running.value = false;
  }
};

// ── 手动保存 ─────────────────────────────────────────────
const handleSave = async () => {
  saving.value = true;
  try {
    await aiAgentApi.save({ role_definition: content.value });
    ElMessage.success('保存成功');
  } catch (e) {
    ElMessage.error(e.message || '保存失败');
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.ai-agent-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 960px;
}
.section-card   { border-radius: 8px; }
.section-title  { font-size: 15px; font-weight: 600; color: #1e293b; }
.section-header { display: flex; justify-content: space-between; align-items: center; }
.hint { font-size: 12px; font-weight: 400; color: #94a3b8; margin-left: 6px; }

/* URL 行 */
.url-row { display: flex; gap: 12px; align-items: center; }

/* 进度区：左截图 + 右步骤 */
.progress-area {
  display: flex;
  gap: 20px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
  align-items: flex-start;
}

/* 截图缩略图 */
.screenshot-wrap {
  flex-shrink: 0;
  width: 240px;
  height: 135px; /* 16:9 */
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}
.screenshot-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.placeholder-text { font-size: 12px; color: #94a3b8; }
.screenshot-img   { width: 100%; height: 100%; cursor: zoom-in; }

/* 步骤列表 */
.steps {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  justify-content: center;
}
.step-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #94a3b8;
  transition: color .25s;
}
.step-item.active { color: #2563eb; }
.step-item.done   { color: #16a34a; }

.step-icon {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}
.step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #64748b;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.step-text  { display: flex; flex-direction: column; gap: 2px; }
.step-label { font-size: 14px; font-weight: 500; }
.step-msg   { font-size: 12px; color: #60a5fa; }

/* 自动保存提示 */
.autosave-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #16a34a;
  margin-top: 4px;
}

/* 旋转圈 */
.spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid #bfdbfe;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
.spinner-lg {
  display: inline-block;
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #94a3b8;
  border-radius: 50%;
  animation: spin .9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
