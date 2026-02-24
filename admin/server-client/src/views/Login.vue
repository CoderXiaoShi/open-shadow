<template>
  <div class="login-page">
    <!-- 背景粒子 -->
    <div class="particles">
      <span v-for="i in 20" :key="i" class="particle" :style="particleStyle(i)" />
    </div>

    <!-- 背景光晕 -->
    <div class="glow glow-1" />
    <div class="glow glow-2" />

    <div class="login-wrapper">
      <!-- 品牌区 -->
      <div class="brand">
        <div class="brand-logo">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 4C13 4 4 13 4 24s9 20 20 20 20-9 20-20S35 4 24 4z" fill="url(#g1)" opacity="0.15"/>
            <path d="M24 10c-7.7 0-14 6.3-14 14s6.3 14 14 14 14-6.3 14-14S31.7 10 24 10z" fill="url(#g2)" opacity="0.25"/>
            <ellipse cx="24" cy="24" rx="7" ry="10" fill="url(#g3)"/>
            <ellipse cx="24" cy="24" rx="3" ry="4" fill="#fff" opacity="0.9"/>
            <path d="M10 24c0-7.7 6.3-14 14-14" stroke="url(#g4)" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M38 24c0 7.7-6.3 14-14 14" stroke="url(#g4)" stroke-width="1.5" stroke-linecap="round"/>
            <defs>
              <linearGradient id="g1" x1="4" y1="4" x2="44" y2="44">
                <stop offset="0%" stop-color="#a78bfa"/>
                <stop offset="100%" stop-color="#38bdf8"/>
              </linearGradient>
              <linearGradient id="g2" x1="10" y1="10" x2="38" y2="38">
                <stop offset="0%" stop-color="#7c3aed"/>
                <stop offset="100%" stop-color="#0ea5e9"/>
              </linearGradient>
              <linearGradient id="g3" x1="17" y1="14" x2="31" y2="34">
                <stop offset="0%" stop-color="#c4b5fd"/>
                <stop offset="100%" stop-color="#38bdf8"/>
              </linearGradient>
              <linearGradient id="g4" x1="0" y1="0" x2="48" y2="0">
                <stop offset="0%" stop-color="#a78bfa"/>
                <stop offset="100%" stop-color="#38bdf8"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="brand-text">
          <h1 class="brand-name">智影</h1>
          <p class="brand-en">Open Shadow</p>
        </div>
        <p class="brand-desc">企业级智能管理平台</p>
      </div>

      <!-- 登录卡片 -->
      <div class="login-card">
        <h2 class="card-title">欢迎回来</h2>
        <p class="card-sub">请登录您的账号以继续</p>

        <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handleLogin" class="login-form">
          <el-form-item prop="username">
            <div class="input-wrapper">
              <span class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <el-input
                v-model="form.username"
                placeholder="用户名"
                class="custom-input"
              />
            </div>
          </el-form-item>

          <el-form-item prop="password">
            <div class="input-wrapper">
              <span class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <el-input
                v-model="form.password"
                type="password"
                placeholder="密码"
                show-password
                class="custom-input"
                @keyup.enter="handleLogin"
              />
            </div>
          </el-form-item>

          <el-button
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            <span v-if="!loading" class="btn-content">
              <span>登 录</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </span>
            <span v-else>登录中...</span>
          </el-button>
        </el-form>
      </div>

      <p class="footer-text">© 2026 Open Shadow · 智影管理系统</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { ElMessage } from 'element-plus';

const router = useRouter();
const userStore = useUserStore();

const formRef = ref(null);
const loading = ref(false);

const form = reactive({ username: '', password: '' });

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
};

const handleLogin = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        await userStore.login(form.username, form.password);
        ElMessage.success('登录成功');
        router.push('/');
      } catch (e) {
        ElMessage.error(e.message || '登录失败');
      } finally {
        loading.value = false;
      }
    }
  });
};

const particleStyle = (i) => {
  const size = Math.random() * 3 + 1;
  const x = (i * 5.3) % 100;
  const delay = (i * 0.37) % 8;
  const duration = 8 + (i * 1.1) % 12;
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${x}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    opacity: Math.random() * 0.5 + 0.2
  };
};
</script>

<style scoped>
/* ── 全局容器 ── */
.login-page {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #07090f;
  overflow: hidden;
}

/* ── 背景光晕 ── */
.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
}
.glow-1 {
  width: 600px;
  height: 600px;
  top: -150px;
  left: -150px;
  background: radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%);
  animation: glowPulse 6s ease-in-out infinite alternate;
}
.glow-2 {
  width: 500px;
  height: 500px;
  bottom: -120px;
  right: -100px;
  background: radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%);
  animation: glowPulse 8s ease-in-out infinite alternate-reverse;
}
@keyframes glowPulse {
  from { transform: scale(1); opacity: 0.7; }
  to   { transform: scale(1.15); opacity: 1; }
}

/* ── 粒子 ── */
.particles { position: absolute; inset: 0; pointer-events: none; }
.particle {
  position: absolute;
  bottom: -10px;
  border-radius: 50%;
  background: rgba(167, 139, 250, 0.6);
  animation: floatUp linear infinite;
}
@keyframes floatUp {
  0%   { transform: translateY(0) scale(1);   opacity: var(--op, 0.4); }
  80%  { opacity: var(--op, 0.4); }
  100% { transform: translateY(-105vh) scale(0.3); opacity: 0; }
}

/* ── 内容包裹 ── */
.login-wrapper {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  animation: fadeInUp 0.7s ease both;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── 品牌区 ── */
.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.brand-logo {
  width: 64px;
  height: 64px;
  margin-bottom: 4px;
  filter: drop-shadow(0 0 16px rgba(124,58,237,0.7));
  animation: logoBob 4s ease-in-out infinite;
}
@keyframes logoBob {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-6px); }
}
.brand-text {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.brand-name {
  font-size: 36px;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #c4b5fd 0%, #38bdf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 4px;
}
.brand-en {
  font-size: 13px;
  color: rgba(167,139,250,0.7);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 2px;
  margin: 0;
}
.brand-desc {
  font-size: 13px;
  color: rgba(148,163,184,0.6);
  margin: 0;
  letter-spacing: 1px;
}

/* ── 登录卡片 ── */
.login-card {
  width: 400px;
  padding: 40px 36px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  backdrop-filter: blur(20px);
  box-shadow:
    0 0 0 1px rgba(124,58,237,0.1),
    0 24px 64px rgba(0,0,0,0.6),
    inset 0 1px 0 rgba(255,255,255,0.08);
}
.card-title {
  font-size: 22px;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 6px;
}
.card-sub {
  font-size: 13px;
  color: rgba(148,163,184,0.7);
  margin: 0 0 28px;
}

/* ── 表单 ── */
.login-form :deep(.el-form-item) {
  margin-bottom: 18px;
}
.login-form :deep(.el-form-item__error) {
  color: #f87171;
  font-size: 12px;
}

.input-wrapper {
  position: relative;
  width: 100%;
}
.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: rgba(148,163,184,0.5);
  z-index: 1;
  pointer-events: none;
  display: flex;
  align-items: center;
}
.input-icon svg { width: 18px; height: 18px; }

.custom-input :deep(.el-input__wrapper) {
  background: rgba(255,255,255,0.05) !important;
  border: 1px solid rgba(255,255,255,0.1) !important;
  border-radius: 10px !important;
  box-shadow: none !important;
  padding-left: 42px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.custom-input :deep(.el-input__wrapper):hover {
  border-color: rgba(124,58,237,0.5) !important;
}
.custom-input :deep(.el-input__wrapper.is-focus) {
  border-color: rgba(124,58,237,0.8) !important;
  box-shadow: 0 0 0 3px rgba(124,58,237,0.15) !important;
}
.custom-input :deep(.el-input__inner) {
  color: #e2e8f0 !important;
  font-size: 14px;
  height: 44px;
  background: transparent !important;
}
.custom-input :deep(.el-input__inner::placeholder) {
  color: rgba(148,163,184,0.4);
}
.custom-input :deep(.el-input__suffix) {
  color: rgba(148,163,184,0.5);
}

/* ── 登录按钮 ── */
.login-btn {
  width: 100%;
  height: 46px;
  margin-top: 8px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%);
  color: #fff;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
  box-shadow: 0 4px 20px rgba(124,58,237,0.4);
  letter-spacing: 1px;
}
.login-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 8px 28px rgba(124,58,237,0.55);
}
.login-btn:active:not(:disabled) {
  transform: translateY(0);
}
.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-content svg {
  width: 16px;
  height: 16px;
  transition: transform 0.2s;
}
.login-btn:hover .btn-content svg {
  transform: translateX(3px);
}

/* ── 页脚 ── */
.footer-text {
  font-size: 12px;
  color: rgba(100,116,139,0.5);
  margin: 0;
  letter-spacing: 0.5px;
}
</style>
