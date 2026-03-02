<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'

const API_BASE = 'http://localhost:3000'

interface Message {
  role: 'user' | 'assistant'
  content: string
  pending?: boolean
}

const messages = ref<Message[]>([])
const input = ref('')
const isStreaming = ref(false)
const listEl = ref<HTMLElement>()

async function scrollToBottom() {
  await nextTick()
  if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight
}

async function streamReply(triggerText: string, showUserMsg = true) {
  if (isStreaming.value) return

  if (showUserMsg) {
    messages.value.push({ role: 'user', content: triggerText })
  }

  messages.value.push({ role: 'assistant', content: '', pending: true })
  const replyIdx = messages.value.length - 1
  isStreaming.value = true
  await scrollToBottom()

  const token = localStorage.getItem('guestToken')
  const history = messages.value.slice(0, showUserMsg ? -2 : -1).map(({ role, content }) => ({ role, content }))

  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ message: triggerText, history })
    })

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const raw = trimmed.slice(5).trim()
        try {
          const parsed = JSON.parse(raw)
          if (parsed.type === 'delta') {
            messages.value[replyIdx].content += parsed.text
            messages.value[replyIdx].pending = false
            await scrollToBottom()
          } else if (parsed.type === 'error') {
            messages.value[replyIdx].content = parsed.message || '出错了'
            messages.value[replyIdx].pending = false
          }
        } catch (_) {}
      }
    }
  } catch {
    messages.value[replyIdx].content = '连接失败，请检查服务是否已启动'
    messages.value[replyIdx].pending = false
  } finally {
    isStreaming.value = false
  }
}

async function send() {
  const text = input.value.trim()
  if (!text) return
  input.value = ''
  await streamReply(text, true)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

onMounted(() => {
  streamReply('请主动向用户打招呼，简短友好地介绍自己', false)
})
</script>

<template>
  <div class="chat-panel">
    <div class="titlebar">
      <span class="title">智影</span>
      <button class="close-btn" @click="window.ipcRenderer.send('close-chat-window')">✕</button>
    </div>
    <div class="messages" ref="listEl">
      <div v-for="(msg, i) in messages" :key="i" :class="['msg', msg.role]">
        <div class="bubble">
          <span v-if="msg.pending" class="pending">···</span>
          <span v-else>{{ msg.content }}</span>
        </div>
      </div>
    </div>
    <div class="input-area">
      <textarea
        v-model="input"
        @keydown="onKeydown"
        placeholder="输入消息，Enter 发送…"
        rows="2"
      />
      <button @click="send" :disabled="isStreaming">发送</button>
    </div>
  </div>
</template>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.titlebar {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 40px;
  background: #f5f5f5;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
  -webkit-app-region: drag;
}

.title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  user-select: none;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #999;
  font-size: 14px;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-app-region: no-drag;
}

.close-btn:hover {
  background: #e0e0e0;
  color: #333;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.msg {
  display: flex;
}

.msg.user {
  justify-content: flex-end;
}

.msg.assistant {
  justify-content: flex-start;
}

.bubble {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
}

.msg.user .bubble {
  background: #4f7cff;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.msg.assistant .bubble {
  background: #f0f0f0;
  color: #333;
  border-bottom-left-radius: 4px;
}

.pending {
  color: #aaa;
  letter-spacing: 2px;
}

.input-area {
  display: flex;
  gap: 6px;
  padding: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

textarea {
  flex: 1;
  resize: none;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 13px;
  outline: none;
  font-family: inherit;
}

textarea:focus {
  border-color: #4f7cff;
}

button {
  padding: 0 14px;
  background: #4f7cff;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
