'use strict';

const puppeteer = require('puppeteer');
const axios     = require('axios');
const fs        = require('fs');
const path      = require('path');
const aiConfigService = require('./aiConfigService');

const TEMPLATE       = fs.readFileSync(path.join(__dirname, '../roleTemplate.md'), 'utf-8');
const MAX_TEXT_LEN   = 15000; // innerText 截断阈值（字符数）
const UPLOADS_DIR    = path.join(__dirname, '../uploads');
const PROFILE_DIR    = path.join(__dirname, '../puppeteer-profile'); // 持久化登录状态

let browser = null;

// ── Puppeteer 抓取页面 innerText + 截图 + 头像 ───────────────
async function fetchPageContent(url, onProgress) {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  if (!browser) {
    browser = await puppeteer.launch({
      headless: false,  // 弹出可视窗口，方便用户手动操作
      userDataDir: PROFILE_DIR,  // 持久化 Cookie / 登录状态
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
  }

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/120.0.0.0 Safari/537.36'
    );

    // 导航失败（如 networkidle2 超时）不终止流程，继续处理已加载内容
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    } catch (navErr) {
      console.warn('[aiAgent] navigation warning:', navErr.message);
    }

    // 等待初始渲染
    await new Promise(r => setTimeout(r, 2500));

    // 快速检测：内容太少可能是登录墙，给用户时间手动操作
    let text = '';
    try {
      text = await page.evaluate(() => document.body?.innerText || '');
    } catch (_) {}

    if (text.trim().length < 300) {
      onProgress(1, '浏览器已打开，如页面需要登录请在弹出窗口中手动完成，将等待 20 秒后自动继续...');
      await new Promise(r => setTimeout(r, 20000));
    }

    // 重新提取文本（可能已登录）
    try {
      text = await page.evaluate(() => document.body?.innerText || '');
    } catch (_) {}

    // 截图（失败不影响主流程）
    let screenshotUrl = null;
    try {
      const filename = `screenshot_${Date.now()}.jpg`;
      const filepath = path.join(UPLOADS_DIR, filename);
      await page.screenshot({ path: filepath, type: 'jpeg', quality: 75 });
      screenshotUrl = `/uploads/${filename}`;
    } catch (e) {
      console.warn('[aiAgent] screenshot failed:', e.message);
    }

    // 提取头像 URL（失败不影响主流程）
    let avatarUrl = null;
    try {
      avatarUrl = await page.evaluate(() => {
        const selectors = [
          '.bili-avatar img', '.up-info .avatar img', '.up-info img',
          '[class*="avatar"] img', '[class*="Avatar"] img',
          'img[class*="avatar"]', 'img[class*="Avatar"]',
          'img[alt*="头像"]', 'img[alt*="avatar"]', 'img[alt*="Avatar"]',
          '.profile img', 'header img'
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el?.src && el.src.startsWith('http')) return el.src;
        }
        return null;
      });
    } catch (_) {}

    return { text: text.slice(0, MAX_TEXT_LEN), screenshotUrl, avatarUrl };
  } finally {
    await page.close();
    // 将来可以优化成, 保留最近10个
    // await browser.close();
  }
}

// ── 统一 LLM 调用（OpenAI compatible + Anthropic）────────────
async function callLLM(config, systemPrompt, userContent, maxTokens = 2000) {
  const baseURL = config.base_url ||
    (config.provider === 'anthropic'
      ? 'https://api.anthropic.com'
      : 'https://api.openai.com');
  const model = config.model || 'gpt-4o';

  if (config.provider === 'anthropic') {
    const res = await axios.post(
      `${baseURL}/v1/messages`,
      { model, max_tokens: maxTokens, temperature: 0.7, system: systemPrompt,
        messages: [{ role: 'user', content: userContent }] },
      { headers: { 'x-api-key': config.api_key, 'anthropic-version': '2023-06-01',
          'content-type': 'application/json' }, timeout: 120000 }
    );
    return res.data?.content?.[0]?.text || '';
  } else {
    const res = await axios.post(
      `${baseURL}/v1/chat/completions`,
      { model, max_tokens: maxTokens, temperature: 0.7,
        messages: [{ role: 'system', content: systemPrompt },
                   { role: 'user',   content: userContent }] },
      { headers: { Authorization: `Bearer ${config.api_key}`,
          'content-type': 'application/json' }, timeout: 120000 }
    );
    return res.data?.choices?.[0]?.message?.content || '';
  }
}

// ── 第一步 System Prompt：提取博主信息 ───────────────────────
const EXTRACT_SYSTEM = `你是一个专业的信息提取专家。用户会给你一段自媒体博主主页的网页文本内容（可能来自 B站、抖音、YouTube 等平台）。

请从中提取博主信息，以 JSON 格式返回（只输出纯 JSON，不要 markdown 代码块，不要任何前言后语）：

{
  "name": "博主的显示名称（原样提取，如找不到填 null）",
  "summary": "结构化中文摘要，2000字以内，信息密度要高"
}

summary 字段包含（有则写，无则跳过，不要臆造）：
- 基本身份：昵称、认证标签、平台分区
- 职业与背景：学历、从业经历、专业领域
- 内容主题：主要做什么类型的内容，选题偏好
- 价值观与立场：明确表达过的观点、信念、态度
- 表达风格：语气（严肃/幽默/犀利/温暖）、句式习惯、口头禅、金句
- 互动风格：对粉丝/用户的称呼、互动方式
- 明确反对的事物：公开批评或回避的话题、行为、观念
- 代表性作品或观点：标志性视频标题、系列名称、核心论点`;

// ── 第二步 System Prompt：生成角色定义 ───────────────────────
const GENERATE_SYSTEM = `你是一个专业的 AI 角色编写者。你的任务是根据博主信息，写出一份让 AI 能真正"成为"这个人的提示词。

**核心原则：**
- 这份提示词不是介绍文档，而是角色行为指令。读完之后，AI 要知道怎么说话、怎么反应、有什么习惯，而不只是知道这个人是谁。
- 用叙述性语言写，像在给 AI 讲"你就是这个人，你平时是这样的"。不要用清单罗列，不要写"擅长领域：xxx"这样的字段式表达。
- 写具体、有细节。"你说话直接，喜欢举身边的真实例子" 比 "风格直接" 好十倍。
- 无论用户怎么追问，这个 AI 永远不承认自己是 AI，这一点必须写进角色设定里。

**参照以下结构输出（直接输出正文，不要加任何前言）：**

${TEMPLATE}

**填写说明：**
- 把模板里的 [占位说明] 替换为真实内容，保留 ## 标题和 --- 分隔线
- 每个段落都要有血有肉，不要空洞套话
- 对话示例要真正体现这个人的口吻，不是示范"如何介绍自己"，而是展示说话的质感
- 信息不足的地方，基于整体风格合理推断，保持人物一致性`;

// ── 主入口 ───────────────────────────────────────────────────
const aiAgentService = {
  /**
   * @param {string}   url        博主主页 URL
   * @param {Function} onProgress (step: 1|2|3, message: string) => void
   * @returns {{ bloggerInfo: string, roleDefinition: string }}
   */
  async build(url, onProgress) {
    const config = await aiConfigService.get();
    if (!config.api_key) throw new Error('尚未配置 API Key，请先前往 AI配置 页面设置');

    // Step 1: 抓取页面 + 截图 + 头像
    onProgress(1, '正在启动浏览器，抓取页面内容...');
    const { text: pageText, screenshotUrl, avatarUrl } = await fetchPageContent(url, onProgress);
    if (!pageText.trim()) throw new Error('页面内容为空，请检查 URL 是否正确');
    onProgress(1, '页面抓取完成', { screenshotUrl });

    // Step 2: 提取博主信息（JSON 格式，含 name + summary）
    onProgress(2, 'AI 正在分析页面，提取博主信息...');
    const rawInfo = await callLLM(
      config,
      EXTRACT_SYSTEM,
      `以下是博主主页的网页文本内容：\n\n${pageText}`,
      2000
    );

    // 解析 JSON，提取博主名称和摘要
    let bloggerName = null;
    let bloggerSummary = rawInfo;
    try {
      const parsed = JSON.parse(rawInfo);
      bloggerName   = parsed.name    || null;
      bloggerSummary = parsed.summary || rawInfo;
    } catch (_) {
      // LLM 未严格输出 JSON 时，降级处理：当作纯文本摘要
    }

    // Step 3: 生成角色定义
    onProgress(3, 'AI 正在生成角色定义文档...');
    const roleDefinition = await callLLM(
      config,
      GENERATE_SYSTEM,
      `请根据以下博主信息，填写角色定义模板：\n\n${bloggerSummary}`,
      4000
    );

    return { bloggerName, avatarUrl, roleDefinition, screenshotUrl };
  }
};

module.exports = aiAgentService;
