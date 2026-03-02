<script setup lang="ts">
import { computed } from 'vue'
import GuestUser from './components/User.vue'
import Chat from './components/Chat.vue'

const isChat = computed(() => window.location.hash === '#chat')
</script>

<template>
  <Chat v-if="isChat" />
  <GuestUser v-else />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
}
</style>
