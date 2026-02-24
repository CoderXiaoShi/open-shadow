<template>
  <div class="ai-config-page">

    <!-- Provider + Key -->
    <el-card shadow="never" class="section-card">
      <template #header><span class="section-title">服务商 & 密钥</span></template>
      <el-form :model="form" label-width="100px">

        <el-form-item label="服务商">
          <el-radio-group v-model="form.provider">
            <el-radio-button value="openai">OpenAI</el-radio-button>
            <el-radio-button value="anthropic">Anthropic</el-radio-button>
            <el-radio-button value="custom">自定义</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="API Key">
          <el-input
            v-model="form.api_key"
            :type="showKey ? 'text' : 'password'"
            placeholder="输入 API Key（留空则不更新）"
            style="max-width:480px"
          >
            <template #suffix>
              <el-icon style="cursor:pointer" @click="showKey = !showKey">
                <View v-if="!showKey" /><Hide v-else />
              </el-icon>
            </template>
          </el-input>
          <div v-if="form.has_key" class="key-hint">已配置密钥，输入新值可替换</div>
        </el-form-item>

        <el-form-item label="Base URL">
          <el-input
            v-model="form.base_url"
            placeholder="留空使用默认端点；自定义/代理填写完整 URL"
            style="max-width:480px"
          />
          <div class="key-hint">
            默认：openai → https://api.openai.com，anthropic → https://api.anthropic.com
          </div>
        </el-form-item>

      </el-form>
    </el-card>

    <!-- 模型参数 -->
    <el-card shadow="never" class="section-card">
      <template #header><span class="section-title">模型参数</span></template>
      <el-form :model="form" label-width="100px">

        <el-form-item label="模型">
          <el-select
            v-model="form.model"
            filterable
            allow-create
            placeholder="选择或输入模型名"
            style="width:320px"
          >
            <el-option-group label="OpenAI">
              <el-option value="gpt-4o"          label="gpt-4o" />
              <el-option value="gpt-4o-mini"     label="gpt-4o-mini" />
              <el-option value="gpt-4-turbo"     label="gpt-4-turbo" />
            </el-option-group>
            <el-option-group label="Anthropic">
              <el-option value="claude-opus-4-6"           label="claude-opus-4-6" />
              <el-option value="claude-sonnet-4-6"         label="claude-sonnet-4-6" />
              <el-option value="claude-haiku-4-5-20251001" label="claude-haiku-4-5" />
            </el-option-group>
          </el-select>
        </el-form-item>

        <el-form-item label="Temperature">
          <div class="slider-row">
            <el-slider v-model="form.temperature" :min="0" :max="2" :step="0.1" style="width:240px" />
            <el-input-number
              v-model="form.temperature"
              :min="0" :max="2" :step="0.1" :precision="1"
              controls-position="right"
              style="width:100px"
            />
          </div>
          <div class="key-hint">越低越稳定（0~1），越高越发散（1~2）</div>
        </el-form-item>

        <el-form-item label="Max Tokens">
          <el-input-number
            v-model="form.max_tokens"
            :min="256" :max="16000" :step="256"
            controls-position="right"
            style="width:160px"
          />
        </el-form-item>

      </el-form>
    </el-card>

    <!-- 测试连接结果 -->
    <el-alert
      v-if="testResult"
      :type="testResult.ok ? 'success' : 'error'"
      :title="testResult.message"
      :description="testResult.ok ? `模型回复：${testResult.reply}` : ''"
      show-icon
      closable
      @close="testResult = null"
    />

    <!-- 底部操作 -->
    <div class="footer">
      <el-button :loading="testing" @click="handleTest">测试连接</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">保存配置</el-button>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { View, Hide } from '@element-plus/icons-vue';
import { aiConfig as aiConfigApi } from '../api/index.js';

const saving  = ref(false);
const testing = ref(false);
const showKey = ref(false);
const testResult = ref(null);

const form = reactive({
  provider:    'openai',
  api_key:     '',
  base_url:    '',
  model:       'gpt-4o',
  temperature: 0.7,
  max_tokens:  2000,
  has_key:     false
});

const load = async () => {
  try {
    const res = await aiConfigApi.get();
    Object.assign(form, res.data);
  } catch (e) {
    ElMessage.error(e.message || '加载失败');
  }
};

const handleSave = async () => {
  saving.value = true;
  try {
    const res = await aiConfigApi.save({ ...form });
    Object.assign(form, res.data);
    ElMessage.success('保存成功');
  } catch (e) {
    ElMessage.error(e.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

const handleTest = async () => {
  testing.value = true;
  testResult.value = null;
  try {
    // 先保存再测试，确保用最新配置
    await aiConfigApi.save({ ...form });
    const res = await aiConfigApi.test();
    testResult.value = {
      ok: true,
      message: res.message,
      reply: res.data?.reply || ''
    };
  } catch (e) {
    testResult.value = {
      ok: false,
      message: e.message || '连接失败'
    };
  } finally {
    testing.value = false;
  }
};

onMounted(load);
</script>

<style scoped>
.ai-config-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 800px;
}

.section-card  { border-radius: 8px; }
.section-title { font-size: 15px; font-weight: 600; color: #1e293b; }

.key-hint {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-bottom: 24px;
}
</style>
