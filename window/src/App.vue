<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const seconds = ref(new Date().getSeconds())
let timer: ReturnType<typeof setInterval>

onMounted(() => {
  timer = setInterval(() => {
    seconds.value = new Date().getSeconds()
  }, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})

const handDeg = () => seconds.value * 6 - 90
</script>

<template>
  <div class="container">
    <span class="char">智</span>
    <svg class="clock" viewBox="0 0 200 200">
      <line
        class="second-hand"
        x1="100"
        y1="100"
        :x2="100 + 80 * Math.cos((handDeg() * Math.PI) / 180)"
        :y2="100 + 80 * Math.sin((handDeg() * Math.PI) / 180)"
      />
    </svg>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  width: 200px;
  height: 200px;
  overflow: hidden;
  background: transparent;
}

.container {
  position: relative;
  width: 200px;
  height: 200px;
  background: #1a1a2e;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-app-region: drag;
}

.char {
  font-size: 72px;
  font-weight: bold;
  color: #fff;
  user-select: none;
}

.clock {
  position: absolute;
  top: 0;
  left: 0;
  width: 200px;
  height: 200px;
  pointer-events: none;
}

.second-hand {
  stroke: #ff3b3b;
  stroke-width: 2;
  stroke-linecap: round;
}
</style>
