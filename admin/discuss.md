# 讨论记录

---

## [2026-02-24] 博主 Agent 功能设计

### 功能描述

用户提供一个博主主页链接（如抖音、B站），系统采集该博主的近期作品、简介以及博主与粉丝的互动内容，构建一个「博主 Agent」，支持文本对话，以第一人称模拟博主与粉丝聊天。

---

### 核心设计决策

#### 1. 支持平台

- 当前计划：**抖音 + B站**
- 先实现 B站（抓取友好），再攻抖音（反爬强）
- 后续可扩展：小红书、微博、YouTube 等

**抖音 vs B站 抓取难度对比：**

| 维度 | 抖音 | B站 |
|------|------|-----|
| 反爬力度 | ★★★★★ | ★★ |
| 可用 API | 几乎没有 | 有大量稳定非官方 API |
| 维护成本 | 高，接口随时失效 | 低，较稳定 |

#### 2. 插件化 Adapter 架构（核心架构决策）

每个平台是一个独立 Adapter，对外暴露统一接口：

```
interface PlatformAdapter {
  name: string           // 'bilibili' | 'douyin'
  displayName: string    // 'B站' | '抖音'
  urlPattern: RegExp     // 判断 URL 所属平台

  extractUserId(url): string
  fetchProfile(userId): BloggerProfile
  fetchPosts(userId, since: Date): Post[]
  fetchBloggerReplies(postId): Comment[]
}
```

**统一数据结构：**

```
BloggerProfile  { username, bio, followerCount, avatarUrl }
Post            { title, description, publishedAt, tags[] }
Comment         { content, isFromBlogger, publishedAt }
```

> `isFromBlogger: true` 的评论（博主回复粉丝）是最有价值的数据，代表博主真实说话方式，是构建人格的核心锚点。

**好处：**
- 新增平台只需新建一个 Adapter 文件
- 主流程完全不感知平台差异
- 各平台 rate limit、重试策略独立配置

#### 3. 数据时间范围

- **默认采集：最近 3 个月**
- **可选范围：最近 1 个月 / 3 个月 / 1 年**
- 数据量与技术方案的关系：

| 时间范围 | 预估量 | 技术方案 |
|---------|--------|---------|
| 1 个月 | ~几百 KB | Context Stuffing（直接塞进上下文）|
| 3 个月 | ~1-2 MB | Context Stuffing 或 RAG |
| 1 年 | ~几 MB | RAG（检索增强生成）|

MVP 阶段默认 1-3 个月 + Context Stuffing，后续数据量大了再引入 RAG。

#### 4. Agent 人格模式

- **当前决策：第一人称**，模拟博主本人与粉丝对话
- 不暴露自己是 AI
- 用博主真实的评论回复作为语气锚点

**System Prompt 模板思路：**

```
你是 {博主昵称}，一位 {简介描述} 的创作者。

你的内容风格：{从作品文案提炼的关键词}

你最近的作品：
- {作品1}: {描述}
- {作品2}: {描述}

你和粉丝互动的典型风格：
- "{真实回复1}"
- "{真实回复2}"

你正在和粉丝聊天，用你一贯的语气回复。
```

---

### 系统架构（三层）

```
数据采集层（Adapter 插件）
    ↓
知识库构建层（Context Stuffing / RAG）
    ↓
对话 Agent 层（LLM + Chat UI）
```

#### 新增数据库表（概要）

```
agents           - Agent 基本信息（url、平台、状态、人格设定、时间范围）
agent_contents   - 采集内容（作品文案、博主评论、简介，按 type 区分）
agent_sessions   - 对话会话（关联 agent + user）
agent_messages   - 对话消息（role: user/assistant）
crawl_tasks      - 采集任务队列（支持异步、状态追踪、重试）
```

#### 新增前端页面

```
├── Agent 管理
│   ├── 列表（状态：采集中/就绪/失败）
│   ├── 新建（输入链接、选平台、设时间范围）
│   └── 详情（查看采集数据、编辑人格设定）
└── 对话中心
    ├── 选择 Agent
    └── 聊天界面
```

---

### 待定决策

- [ ] LLM 选型：Claude API（优先）还是其他？
- [ ] 向量数据库：pgvector / Chroma / 暂时不用（先 Context Stuffing）
- [ ] 抖音采集方案：Puppeteer + stealth 还是接入第三方数据服务？
- [ ] 数据刷新策略：手动重采集，还是定时任务？
- [ ] 是否需要支持视频字幕提取（后期）？

---

## [2026-02-24] 采集方式 + 页面结构补充设计

### 采集方式：自动 + 手动并存

采集程序本质脆弱（接口随时失效），**手动提交是必要的兜底方案**，不是可选的。

**手动提交内容类型：**

| 提交内容 | 输入方式 |
|---------|---------|
| 博主简介 | 文本框直接填写 |
| 单篇作品 | 填标题 + 文案 + 发布日期 |
| 博主评论回复 | 粘贴文本，勾选"博主本人发言" |
| 批量导入 | 上传 JSON / CSV（进阶功能）|

**关键设计：自动采集和手动提交写入同一张内容表**，通过 `source` 字段区分（`auto_crawl` / `manual`），Agent 构建时不区分来源。

### 采集任务状态机

```
自动采集：触发 → pending → crawling → done
                                  ↘ failed（可手动重试）

手动提交：填表提交 → 直接入库（不经过任务队列）
```

### 页面结构（已定）

```
素材管理
├── B站素材        /material/bilibili     ← 增删改查 + 触发采集 + 手动提交
├── 抖音素材        /material/douyin       ← 增删改查 + 触发采集 + 手动提交
└── 全平台汇总      /material/summary      ← 只读，跨平台检索，无编辑操作

Agent 管理
├── Agent 列表     /agent
└── 对话中心       /agent/chat
```

**汇总页设计原则：**
- 跨平台统一视图，支持筛选（平台 / 博主 / 内容类型 / 时间）
- **只读**，无编辑/删除按钮
- 点击内容条目 → 提示跳转到对应平台页处理
- 防止误操作，也让各平台页保持"单一职责"

### 菜单导航结构（整合进现有系统）

```
现有菜单
├── 系统管理
│   ├── 用户管理
│   ├── 角色管理
│   └── 权限管理
├── 文件管理
↓ 新增
├── 素材管理
│   ├── B站素材
│   ├── 抖音素材
│   └── 全平台汇总（只读）
└── Agent 管理
    ├── Agent 列表
    └── 对话中心
```

素材管理和 Agent 管理分开：素材是原始数据，Agent 是基于素材构建的产物，生命周期不同。

### 数据库表调整

`agent_contents` 完整字段设计：

```
agent_contents {
  id
  agent_id        - 关联哪个 Agent（博主）
  platform        - 'bilibili' | 'douyin'
  content_type    - 'profile' | 'post' | 'blogger_reply' | 'fan_comment'
  content         - 文本内容
  source          - 'auto_crawl' | 'manual'
  is_enabled      - 是否启用（默认 true；禁用则不参与 Agent 上下文构建）
  sort            - 排序值（越大越优先，默认 0；同时影响 UI 显示顺序和上下文构建优先级）
  published_at    - 原始发布时间
  metadata        - JSON（点赞数、作品ID等平台附加信息）
  created_at
}
```

**列表默认排序：** `sort DESC, published_at DESC`

**is_enabled 的作用：**
- 构建 Agent 上下文时只取 `is_enabled = true` 的记录
- 允许用户禁用低质/不相关内容（如广告软文）而不删除
- 列表行内可直接切换开关，无需进详情页

**sort 的双重作用：**
1. 控制管理页面的显示顺序
2. Token 有上限时，sort 值高的内容优先进入 Agent 上下文，防止重要内容被截断

---

## [2026-02-24] 实施决策

- **首期实现平台：B站（bilibili）**，跑通完整链路后再接入抖音
- 抖音暂时只支持手动提交素材
- 架构按插件化设计，B站 adapter 是第一个实现

---

### 核心原则：单一入库入口

无论数据来自哪个平台的采集器，还是用户手动提交，都通过同一个方法写库：

```
手动提交  ─────┐
               ↓
B站 Adapter ──→  materialService.addContent()  →  agent_contents
               ↑
抖音 Adapter ──┘
               ↑
未来平台 N ────┘
```

`materialService` 是核心，**不感知数据来源**，采集层是可插拔的外壳。

### 目录结构

```
server/
├── crawlers/                    ← 整个目录可以为空，系统照常运行
│   ├── index.js                 ← CrawlerRegistry（注册中心）
│   ├── base.js                  ← BaseCrawler 抽象接口
│   ├── bilibili/
│   │   ├── index.js             ← BilibiliAdapter
│   │   └── parser.js
│   └── douyin/
│       ├── index.js             ← DouyinAdapter
│       └── parser.js
├── services/
│   ├── materialService.js       ← 核心，唯一内容入库入口
│   ├── agentService.js
│   └── crawlTaskService.js      ← 任务队列
└── controllers/
    └── materialController.js
```

### 关键接口

**BaseCrawler（每个平台必须实现）：**
```
validateUrl(url)
extractUserId(url)
fetchProfile(userId)          → BloggerProfile
fetchPosts(userId, since)     → Post[]
fetchBloggerReplies(postId)   → Comment[]
```

**CrawlerRegistry（注册中心）：**
```
register(adapter)       注册平台
get(platformName)       获取 adapter
list()                  列出所有可用平台
detectPlatform(url)     从 URL 识别平台
isSupported(url)        是否支持
```

**条件加载（解耦关键）：**
```js
// crawlers/index.js
for (const path of ['./bilibili', './douyin']) {
  try { registry.register(require(path)); }
  catch (e) { logger.warn(`Crawler ${path} unavailable`); }
}
```
某个 adapter 加载失败，其余平台和手动功能不受影响。

### 三种运行模式（同一套代码）

| 模式 | 说明 |
|------|------|
| 纯手动 | crawlers/ 为空，只能手动上传，完全可用 |
| 半自动 | 仅 B站 adapter，抖音只能手动 |
| 全自动 | 所有 adapter 注册，自动采集 + 手动兜底 |

前端"触发采集"按钮在 `registry.isSupported(url) === false` 时不显示，只显示手动上传入口。

### 完整数据流

```
触发采集 → crawlTaskService 建任务（pending）
              ↓
         CrawlerRegistry.get(platform) → Adapter
              ↓
         fetchProfile / fetchPosts / fetchBloggerReplies
              ↓
         标准化数据 { content, content_type, source:'auto_crawl', ... }
              ↓
         materialService.addContent()   ← 与手动提交同一方法
              ↓
         写入 agent_contents
```

---
