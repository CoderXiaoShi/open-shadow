<script setup lang="ts">
import { onMounted, ref } from 'vue'
import defaultImg from '../assets/img.png'

const API_BASE = 'http://localhost:3000'

const avatarSrc = ref(defaultImg)

function randomStr() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

async function login(username: string, password: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  const data = await res.json()
  if (data.code !== 200) {
    console.error('[guest] login failed:', data.message)
    return false
  }
  localStorage.setItem('guestUserId', data.data.user.id)
  localStorage.setItem('guestToken', data.data.token)
  return true
}

onMounted(async () => {
  const savedUsername = localStorage.getItem('guestUsername')
  const savedPassword = localStorage.getItem('guestPassword')

  try {
    if (savedUsername && savedPassword) {
      await login(savedUsername, savedPassword)
      return
    }

    const username = `guest_${randomStr()}`
    const password = randomStr()

    const regRes = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, is_guest: true })
    })
    const regData = await regRes.json()
    if (regData.code !== 200) {
      console.error('[guest] register failed:', regData.message)
      return
    }

    const ok = await login(username, password)
    if (ok) {
      localStorage.setItem('guestUsername', username)
      localStorage.setItem('guestPassword', password)
    }
  } catch (e) {
    console.error('[guest] init failed:', e)
  }

  try {
    const persona = await window.ipcRenderer.invoke('get-persona')
    if (persona?.avatar_url) {
      const url = persona.avatar_url.startsWith('http')
        ? persona.avatar_url
        : `${API_BASE}${persona.avatar_url}`
      avatarSrc.value = url
    }
  } catch (e) {
    console.error('[persona] fetch failed:', e)
  }
})

function openChat() {
  window.ipcRenderer.send('open-chat-window')
}

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  window.ipcRenderer.send('start-drag')
}

function onPointerUp(e: PointerEvent) {
  ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  window.ipcRenderer.send('stop-drag')
}

const persona = ref({
  name: '智影',
  avatar_url: defaultImg
})

onMounted(async () => {
  try {
    const data = await window.ipcRenderer.invoke('get-persona')
    console.log('[persona] fetch:', data)
    persona.value.avatar_url = `${API_BASE}${data.avatar_url}`
    // if (persona?.name) persona.value.name = persona.name
    // if (persona?.avatar_url) {
    //   const url = persona.avatar_url.startsWith('http')
    //     ? persona.avatar_url
    //     : `${API_BASE}${persona.avatar_url}`
    //   persona.value.avatar_url = url
    // }
  } catch (e) {
    console.error('[persona] fetch failed:', e)
  }
})

</script>

<template>
  <div
    class="wrapper"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
    @dblclick="openChat"
  >
    <img class="avatar-img" :src="persona.avatar_url" alt="avatar" />
  </div>
</template>

<style scoped>
.wrapper {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.avatar-img {
  width: 90%;
  height: 90%;
  border-radius: 50%;
  border: 5px solid rgb(0, 153, 255);
  pointer-events: none;
}
</style>
