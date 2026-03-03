<script setup lang="ts">
import { onMounted } from 'vue'
import img from '../assets/img.png'

const API_BASE = 'http://localhost:3000'

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
})

function openChat() {
  window.ipcRenderer.send('open-chat-window')
}
</script>

<template>
  <div class="wrapper">
    <img class="avatar-img" :src="img" @dblclick="openChat" />
  </div>
</template>

<style scoped>
.wrapper {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-app-region: drag;
}

.avatar-img {
  width: 90%;
  height: 90%;
  border-radius: 50%;
  border: 5px solid red;
  cursor: pointer;
  -webkit-app-region: no-drag;
}
</style>
