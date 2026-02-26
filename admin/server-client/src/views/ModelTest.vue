<template>
  <div class="model-test-page">

    <!-- 左侧：素材选择 -->
    <div class="sidebar">
      <div class="sidebar-title">参考素材</div>
      <el-input
        v-model="keyword"
        placeholder="搜索标题/备注"
        clearable
        size="small"
        style="margin-bottom:10px"
        @input="fetchMaterials"
      />
      <div class="material-list">
        <div
          v-for="m in materials"
          :key="m.id"
          class="material-item"
          :class="{ selected: selectedIds.includes(m.id) }"
          @click="toggleMaterial(m.id)"
        >
          <el-tag size="small" :type="typeTagType(m.type)" style="flex-shrink:0">{{ typeLabel(m.type) }}</el-tag>
          <span class="material-title">{{ m.title || m.remark || ('素材 #' + m.id) }}</span>
          <el-icon v-if="selectedIds.includes(m.id)" class="check-icon"><Select /></el-icon>
        </div>
        <div v-if="materials.length === 0" class="empty-hint">暂无素材</div>
      </div>
      <div class="sidebar-footer">
        已选 <b>{{ selectedIds.length }}</b> 条素材作为上下文
        <el-button link size="small" @click="selectedIds = []">清除</el-button>
      </div>
    </div>

    <!-- 右侧：对话区域 -->
    <div class="chat-area">

      <!-- System Prompt 折叠 -->
      <el-collapse v-model="openPanels" class="info-collapse">
        <el-collapse-item name="prompt" title="系统提示词（Persona）">
          <pre class="prompt-preview">{{ systemPrompt || '（未配置人设，请前往 角色人设 页面设置）' }}</pre>
        </el-collapse-item>
      </el-collapse>

      <!-- 消息列表 -->
      <div class="messages" ref="messagesEl">
        <div v-if="messages.length === 0" class="empty-chat">
          选择参考素材，输入消息，测试模型输出效果
        </div>
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          class="message-row"
          :class="msg.role"
        >
          <div class="bubble">
            <div class="bubble-role">{{ msg.role === 'user' ? '我' : '模型' }}</div>
            <div class="bubble-content">{{ msg.content }}<span v-if="msg.streaming" class="cursor">|</span></div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
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
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { Select } from '@element-plus/icons-vue';
import { material as materialApi, persona as personaApi } from '../api/index.js';

// ── 素材侧边栏 ────────────────────────────────────────────
const keyword     = ref('');
const materials   = ref([]);
const selectedIds = ref([]);

const typeLabel   = (t) => ({ text: '文本', image: '图片', video: '视频', document: '文档' }[t] || t);
const typeTagType = (t) => ({ text: '', image: 'success', video: 'warning', document: 'info' }[t] || '');

const fetchMaterials = async () => {
  try {
    const res = await materialApi.getList({ keyword: keyword.value, pageSize: 100 });
    materials.value = res.data?.list || [];
  } catch (e) {
    ElMessage.error(e.message || '加载素材失败');
  }
};

const toggleMaterial = (id) => {
  const idx = selectedIds.value.indexOf(id);
  if (idx === -1) selectedIds.value.push(id);
  else selectedIds.value.splice(idx, 1);
};

// ── 人设提示词 ────────────────────────────────────────────
const systemPrompt = ref('');
const openPanels   = ref([]);

const loadPersona = async () => {
  try {
    const res = await personaApi.get();
    systemPrompt.value = res.data?.system_prompt || '';
  } catch { /* 静默 */ }
};

// ── 对话 ─────────────────────────────────────────────────
const messages   = ref([]);   // [{role, content, streaming?}]
const inputText  = ref('');
const loading    = ref(false);
const messagesEl = ref(null);

const scrollBottom = async () => {
  await nextTick();
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
  }
};

const handleSend = async () => {
  const text = inputText.value.trim();
  if (!text || loading.value) return;

  // 推入用户消息 + 占位助手消息
  messages.value.push({ role: 'user', content: text });
  messages.value.push({ role: 'assistant', content: '', streaming: true });
  inputText.value = '';
  loading.value   = true;
  await scrollBottom();

  // 历史不含最后两条（刚推入的）
  const history = messages.value.slice(0, -2).map(({ role, content }) => ({ role, content }));

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/chat', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message:      text,
        material_ids: selectedIds.value,
        history
      })
    });

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      throw new Error(json.message || `HTTP ${response.status}`);
    }

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let   buf     = '';

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop(); // 保留未完整行

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const raw = line.slice(5).trim();
        try {
          const parsed = JSON.parse(raw);
          if (parsed.type === 'delta') {
            const last = messages.value[messages.value.length - 1];
            last.content += parsed.text;
            await scrollBottom();
          } else if (parsed.type === 'error') {
            throw new Error(parsed.message || '模型返回错误');
          }
          // type === 'done' 直接忽略，while 循环结束后统一收尾
        } catch (parseErr) {
          // JSON 解析失败 = 非 JSON 行，跳过
          if (!(parseErr instanceof SyntaxError)) throw parseErr;
        }
      }
    }

    // 流结束，移除打字游标
    const last = messages.value[messages.value.length - 1];
    if (last?.role === 'assistant') last.streaming = false;

  } catch (e) {
    ElMessage.error(e.message || '请求失败');
    // 移除占位助手消息；若助手消息已有内容则保留（仅标记非流）
    const last = messages.value[messages.value.length - 1];
    if (last?.role === 'assistant') {
      if (!last.content) {
        messages.value.pop();  // 空消息 → 连同用户消息一起移除
        messages.value.pop();
      } else {
        last.streaming = false;
      }
    }
  } finally {
    loading.value = false;
    await scrollBottom();
  }
};

const clearChat = () => {
  messages.value  = [];
  inputText.value = '';
};

onMounted(() => {
  fetchMaterials();
  loadPersona();
});
</script>

<style scoped>
.model-test-page {
  display: flex;
  height: calc(100vh - 120px);
  padding: 16px;
  box-sizing: border-box;
  gap: 12px;
}

/* ── 左侧边栏 ─────────────────────────────────────── */
.sidebar {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  background: #fff;
  overflow: hidden;
}
.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 10px;
}
.material-list {
  flex: 1;
  overflow-y: auto;
}
.material-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #475569;
  transition: background .15s;
}
.material-item:hover    { background: #f1f5f9; }
.material-item.selected { background: #eff6ff; color: #1d4ed8; }
.material-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.check-icon  { color: #2563eb; font-size: 14px; flex-shrink: 0; }
.empty-hint  { color: #94a3b8; font-size: 13px; text-align: center; padding: 20px 0; }
.sidebar-footer {
  font-size: 12px;
  color: #64748b;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ── 右侧对话区 ───────────────────────────────────── */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
  min-width: 0;
}

.info-collapse { flex-shrink: 0; border-bottom: 1px solid #f1f5f9; }
.prompt-preview {
  margin: 0;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  color: #475569;
  max-height: 200px;
  overflow-y: auto;
}

/* 消息列表 */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px;
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

.message-row          { display: flex; }
.message-row.user     { justify-content: flex-end; }
.message-row.assistant { justify-content: flex-start; }

.bubble { max-width: 75%; }
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

/* 打字游标闪烁 */
.cursor {
  display: inline-block;
  margin-left: 1px;
  color: #94a3b8;
  animation: blink-cursor .7s step-end infinite;
}
@keyframes blink-cursor {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

/* 输入区 */
.input-area {
  padding: 12px;
  border-top: 1px solid #f1f5f9;
  flex-shrink: 0;
}
.input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
</style>
