/**
 * 本地 AI 聊天代理：密钥在 .env，不进入前端。
 *
 * OPENCLAW_MODE（可显式设置，否则按 URL 推断）：
 * - responses：方舟 /api/v3/responses（input + input_text，见控制台 curl）
 * - doubao / openai / ark：/api/v3/chat/completions（messages + model，接入点常为 ep-xxxx）
 * - simple：POST 仅 { "message" }
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { runChatPost, getChatHealthSnapshot } from './chat-handler.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_FILE = path.resolve(__dirname, '..', '.env');
const envResult = dotenv.config({ path: ENV_FILE });
if (envResult.error) {
  console.warn('[chat-proxy] 未读取到', ENV_FILE, '（请把 .env 放在项目根目录，与 package.json 同级）');
} else {
  console.log('[chat-proxy] 已加载', ENV_FILE);
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const PORT = Number(process.env.CHAT_PROXY_PORT || 8790);

app.post('/chat', async (req, res) => {
  const out = await runChatPost(req.body);
  res.status(out.status).json(out.json);
});

app.get('/health', (_req, res) => {
  res.json(getChatHealthSnapshot());
});

app.get('/', (_req, res) => {
  res.type('html').send(`<!DOCTYPE html><meta charset="utf-8"><title>chat-proxy</title>
<pre style="font-family:system-ui;padding:1rem">
AI 聊天代理已运行。

• 对话：<strong>POST /chat</strong>，JSON: {"message":"你好"}
• 自检：<a href="/health">/health</a>

用「AI 分身」在站点页面发消息。
</pre>`);
});

app.listen(PORT, () => {
  const snap = getChatHealthSnapshot();
  console.log(`Chat proxy http://127.0.0.1:${PORT}  (POST /chat)`);
  console.log(`Health   http://127.0.0.1:${PORT}/health`);
  console.log(
    `[chat-proxy] 模式: ${snap.mode}` +
      (snap.mode === 'openai' || snap.mode === 'responses'
        ? `  model=${process.env.OPENCLAW_MODEL || process.env.ARK_MODEL || '(未设置)'}`
        : '')
  );
  if (!snap.configured) {
    console.warn('[chat-proxy] OPENCLAW_API_KEY 或 OPENCLAW_CHAT_URL 仍为空，请检查:', ENV_FILE);
  }
});
