<template>
  <div class="model-test-page">

    <!-- 角色定义折叠展示 -->
    <el-collapse v-model="openPanels" class="role-collapse">
      <el-collapse-item name="role">
        <template #title>
          <span class="collapse-title">当前角色定义</span>
          <span v-if="!roleDefinition" class="no-role-hint">（未配置，请先前往 AI角色构建 生成）</span>
        </template>
        <pre class="role-preview">{{ roleDefinition || '暂无角色定义' }}</pre>
      </el-collapse-item>
    </el-collapse>

    <!-- 消息列表 -->
    <div class="messages" ref="messagesEl">
      <div v-if="messages.length === 0" class="empty-chat">
        基于当前角色定义开始对话测试
      </div>
      <div
        v-for="(msg, idx) in messages"
        :key="idx"
        class="message-row"
        :class="msg.role"
      >
        <div class="bubble">
          <div class="bubble-role">{{ msg.role === 'user' ? '我' : '角色' }}</div>
          <div class="bubble-content">
            {{ msg.content }}<span v-if="msg.streaming" class="cursor">|</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="input-area">
      <el-input
        v-model="inputText"
        type="textarea"
        :rows="3"
        placeholder="输入测试消息，Enter 发送，Shift+Enter 换行"
        resize="none"
        :disabled="loading"
        @keydown.enter.exact.prevent="handleSend"
      />
      <div class="input-actions">
        <el-button @click="clearChat" :disabled="loading">清空对话</el-button>
        <el-button type="primary" :loading="loading" @click="handleSend">发 送</el-button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { aiAgent as aiAgentApi } from '../api/index.js';

const roleDefinition = ref('');
const openPanels     = ref([]);
const messages       = ref([]);
const inputText      = ref('');
const loading        = ref(false);
const messagesEl     = ref(null);

const scrollBottom = async () => {
  await nextTick();
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
};

onMounted(async () => {
  try {
    const res = await aiAgentApi.get();
    roleDefinition.value = res.data?.role_definition || '';
  } catch { /* 静默 */ }
});

const handleSend = async () => {
  const text = inputText.value.trim();
  if (!text || loading.value) return;

  messages.value.push({ role: 'user', content: text });
  messages.value.push({ role: 'assistant', content: '', streaming: true });
  inputText.value = '';
  loading.value   = true;
  await scrollBottom();

  const history = messages.value.slice(0, -2).map(({ role, content }) => ({ role, content }));

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/chat', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ message: text, history })
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
          if (parsed.type === 'delta') {
            messages.value[messages.value.length - 1].content += parsed.text;
            await scrollBottom();
          } else if (parsed.type === 'error') {
            throw new Error(parsed.message);
          }
        } catch (e) {
          if (!(e instanceof SyntaxError)) throw e;
        }
      }
    }

    messages.value[messages.value.length - 1].streaming = false;
  } catch (e) {
    ElMessage.error(e.message || '请求失败');
    const last = messages.value[messages.value.length - 1];
    if (last?.role === 'assistant') {
      if (!last.content) { messages.value.pop(); messages.value.pop(); }
      else last.streaming = false;
    }
  } finally {
    loading.value = false;
    await scrollBottom();
  }
};

const clearChat = () => { messages.value = []; inputText.value = ''; };
</script>

<style scoped>
.model-test-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  padding: 16px;
  box-sizing: border-box;
  gap: 0;
}

/* 角色定义折叠 */
.role-collapse {
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
  border: 1px solid #e2e8f0;
}
.collapse-title  { font-size: 14px; font-weight: 600; color: #1e293b; }
.no-role-hint    { font-size: 12px; color: #f59e0b; margin-left: 8px; font-weight: 400; }
.role-preview {
  margin: 0;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  color: #475569;
  max-height: 240px;
  overflow-y: auto;
  padding: 4px 0;
}

/* 消息列表 */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.empty-chat {
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
  margin: auto;
}

.message-row           { display: flex; }
.message-row.user      { justify-content: flex-end; }
.message-row.assistant { justify-content: flex-start; }

.bubble { max-width: 72%; }
.bubble-role {
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 4px;
}
.message-row.user .bubble-role { text-align: right; }

.bubble-content {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
}
.message-row.user .bubble-content {
  background: #2563eb;
  color: #fff;
  border-bottom-right-radius: 4px;
}
.message-row.assistant .bubble-content {
  background: #f1f5f9;
  color: #1e293b;
  border-bottom-left-radius: 4px;
}

/* 游标 */
.cursor {
  display: inline-block;
  margin-left: 1px;
  color: #94a3b8;
  animation: blink .7s step-end infinite;
}
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

/* 输入区 */
.input-area {
  flex-shrink: 0;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}
.input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
</style>
