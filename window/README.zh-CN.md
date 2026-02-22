# electron-vite-vue

🥳 非常简单的 `Electron` + `Vue` + `Vite` 样板项目。

<!-- [![awesome-vite](https://awesome.re/mentioned-badge.svg)](https://github.com/vitejs/awesome-vite) -->
<!-- [![Netlify Status](https://api.netlify.com/api/v1/badges/ae3863e3-1aec-4eb1-8f9f-1890af56929d/deploy-status)](https://app.netlify.com/sites/electron-vite/deploys) -->
<!-- [![GitHub license](https://img.shields.io/github/license/caoxiemeihao/electron-vite-vue)](https://github.com/electron-vite/electron-vite-vue/blob/main/LICENSE) -->
<!-- [![GitHub stars](https://img.shields.io/github/stars/caoxiemeihao/electron-vite-vue?color=fa6470)](https://github.com/electron-vite/electron-vite-vue) -->
<!-- [![GitHub forks](https://img.shields.io/github/forks/caoxiemeihao/electron-vite-vue)](https://github.com/electron-vite/electron-vite-vue) -->
[![GitHub Build](https://github.com/electron-vite/electron-vite-vue/actions/workflows/build.yml/badge.svg)](https://github.com/electron-vite/electron-vite-vue/actions/workflows/build.yml)
[![GitHub Discord](https://img.shields.io/badge/chat-discord-blue?logo=discord)](https://discord.gg/sRqjYpEAUK)

## 特性

📦 开箱即用  
🎯 基于官方 [template-vue-ts](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-vue-ts)，侵入性小  
🌱 可扩展，非常简洁的目录结构  
💪 支持在 Electron-Renderer 中使用 Node.js API  
🔩 支持 C/C++ 原生插件  
🖥 易于实现多窗口  

## 快速开始

```sh
# 克隆项目
git clone https://github.com/electron-vite/electron-vite-vue.git

# 进入项目目录
cd electron-vite-vue

# 安装依赖
npm install

# 开发模式
npm run dev
```

## 调试

![electron-vite-react-debug.gif](https://github.com/electron-vite/electron-vite-react/blob/main/electron-vite-react-debug.gif?raw=true)

## 目录结构

```diff
+ ├─┬ electron
+ │ ├─┬ main
+ │ │ └── index.ts    Electron-Main 入口
+ │ └─┬ preload
+ │   └── index.ts    Preload-Scripts 入口
  ├─┬ src
  │ └── main.ts       Electron-Renderer 入口
  ├── index.html
  ├── package.json
  └── vite.config.ts
```

<!--
## 注意事项

🚨 默认情况下，此模板在渲染进程中集成了 Node.js。如果你不需要它，只需删除下面的选项即可。[因为它会修改 Vite 的默认配置](https://github.com/electron-vite/vite-plugin-electron-renderer#config-presets-opinionated)。

```diff
# vite.config.ts

export default {
  plugins: [
-   // 在渲染进程中使用 Node.js API
-   renderer({
-     nodeIntegration: true,
-   }),
  ],
}
```
-->

## 常见问题

- [C/C++ 插件、Node.js 模块 - 预打包](https://github.com/electron-vite/vite-plugin-electron-renderer#dependency-pre-bundling)
- [dependencies vs devDependencies](https://github.com/electron-vite/vite-plugin-electron-renderer#dependencies-vs-devdependencies)
