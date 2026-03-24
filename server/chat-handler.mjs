/**
 * 共享：本地 chat-proxy 与 Vercel api/chat 共用，只读 process.env（Vercel 在控制台注入变量）。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getEnvConfig() {
  return {
    API_KEY: (process.env.OPENCLAW_API_KEY || '').trim(),
    CHAT_URL: (process.env.OPENCLAW_CHAT_URL || '').trim(),
    MODE: (process.env.OPENCLAW_MODE || '').toLowerCase().trim(),
    MODEL: (process.env.OPENCLAW_MODEL || process.env.ARK_MODEL || '').trim(),
    SYSTEM_PROMPT:
      process.env.OPENCLAW_SYSTEM_PROMPT ||
      '你是 Bella，代表 Vienne 回答访客。简洁、专业，涉及 AI Agent、教育产品与项目管理时可展开。',
  };
}

function loadOwnerFacts() {
  const fromEnv = (process.env.OPENCLAW_OWNER_FACTS || '').trim();
  if (fromEnv) return fromEnv;
  const factsFile = path.join(__dirname, 'owner-facts.txt');
  try {
    if (fs.existsSync(factsFile)) {
      return fs.readFileSync(factsFile, 'utf8').trim();
    }
  } catch {
    /* ignore */
  }
  return '';
}

function buildFullSystemPrompt(cfg) {
  const facts = loadOwnerFacts();
  const factBlock = facts
    ? `【以下为主人/网站公开信息，须如实转述；未列出的不要编造】\n${facts}`
    : '';
  return [String(cfg.SYSTEM_PROMPT).trim(), factBlock].filter(Boolean).join('\n\n');
}

function detectMode(cfg) {
  const { MODE, CHAT_URL, MODEL } = cfg;
  if (MODE === 'simple' || MODE === 'raw') return 'simple';
  if (MODE === 'responses') return 'responses';
  const url = String(CHAT_URL || '');
  if (/\/responses(\?|$|\/)/i.test(url)) return 'responses';

  if (MODE === 'doubao' || MODE === 'openai' || MODE === 'ark' || MODE === 'volcengine') {
    return 'openai';
  }
  if (/chat\/completions|\/v3\/chat/i.test(url)) return 'openai';
  if (MODEL && /^ep-/i.test(MODEL)) return 'openai';
  return 'simple';
}

function extractReply(data) {
  if (data == null) return null;
  return (
    data.reply ??
    data.text ??
    data.content ??
    data.message ??
    data.data?.reply ??
    data.data?.text ??
    data.result?.content ??
    data.choices?.[0]?.message?.content ??
    data.choices?.[0]?.delta?.content ??
    data.output?.text ??
    (typeof data === 'string' ? data : null)
  );
}

function extractResponsesReply(data) {
  if (data == null) return null;
  if (typeof data.output_text === 'string' && data.output_text) return data.output_text;

  const out = data.output;
  if (Array.isArray(out)) {
    const parts = [];
    for (const block of out) {
      if (block?.content && Array.isArray(block.content)) {
        for (const c of block.content) {
          if (c?.type === 'output_text' && c.text) parts.push(String(c.text));
          else if (c?.type === 'text' && c.text) parts.push(String(c.text));
          else if (typeof c?.text === 'string') parts.push(c.text);
        }
      }
      if (typeof block?.text === 'string') parts.push(block.text);
    }
    if (parts.length) return parts.join('\n').trim();
  }

  if (typeof data.text === 'string') return data.text;
  return extractReply(data);
}

const ENV_FILE = path.resolve(__dirname, '..', '.env');

/**
 * @param {object} body - { message?: string }
 * @returns {Promise<{ status: number, json: object }>}
 */
export async function runChatPost(body) {
  const message = (body && body.message) || '';
  if (!message.trim()) {
    return { status: 400, json: { error: 'message is required' } };
  }

  const cfg = getEnvConfig();
  const { API_KEY, CHAT_URL, MODEL } = cfg;

  if (!API_KEY || !CHAT_URL) {
    const vercelHint =
      '在 Vercel：Project → Settings → Environment Variables 添加 OPENCLAW_API_KEY、OPENCLAW_CHAT_URL（及 OPENCLAW_MODEL 等），Production/Preview 都勾选后重新 Deploy。';
    const localHint = `代理未读到密钥或 URL。请确认存在 ${ENV_FILE}（与 package.json 同级），变量名无错别字；Windows 勿保存成 .env.txt。改完后重启 npm run chat-proxy。`;
    return {
      status: 503,
      json: {
        error: 'Server not configured',
        hint: process.env.VERCEL ? vercelHint : localHint,
      },
    };
  }

  const url = String(CHAT_URL).trim();
  if (!/^https?:\/\//i.test(url)) {
    const compact = url.replace(/\s/g, '');
    const looksB64 =
      compact.length > 24 && /^[A-Za-z0-9+/]+=*$/.test(compact) && !compact.includes('.');
    console.error('[chat-handler] OPENCLAW_CHAT_URL 必须是 https:// 开头');
    return {
      status: 503,
      json: {
        error: 'Invalid OPENCLAW_CHAT_URL',
        hint: looksB64
          ? '这一串像 Base64，通常是 Secret，不能当 URL。应填 https://ark.../api/v3/responses 或 …/chat/completions'
          : 'CHAT_URL 必须是控制台给出的 https:// 完整地址。',
        preview: compact.slice(0, 48) + (compact.length > 48 ? '…' : ''),
      },
    };
  }

  const mode = detectMode(cfg);
  if ((mode === 'openai' || mode === 'responses') && !MODEL) {
    const hint =
      mode === 'responses'
        ? '设置 OPENCLAW_MODEL=控制台 curl 里的 model 名（如 doubao-seed-1-8-251228）'
        : '设置 OPENCLAW_MODEL=接入点 ep-xxxx 或模型名（与 chat/completions 文档一致）';
    console.error('[chat-handler] 缺少 OPENCLAW_MODEL');
    return { status: 503, json: { error: 'Missing OPENCLAW_MODEL', hint } };
  }

  let reqBody;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  };

  const fullSystem = buildFullSystemPrompt(cfg);

  if (mode === 'responses') {
    const userText = fullSystem
      ? `【角色与知识】${fullSystem}\n\n【访客问题】${message}`
      : message;
    reqBody = JSON.stringify({
      model: MODEL,
      input: [
        {
          role: 'user',
          content: [{ type: 'input_text', text: userText }],
        },
      ],
    });
  } else if (mode === 'openai') {
    const messages = [];
    if (fullSystem) {
      messages.push({ role: 'system', content: fullSystem });
    }
    messages.push({ role: 'user', content: message });
    reqBody = JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: Math.min(Number(process.env.OPENCLAW_MAX_TOKENS) || 1024, 4096),
    });
  } else {
    reqBody = JSON.stringify({ message });
  }

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers,
      body: reqBody,
    });

    const text = await upstream.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      console.error('[chat-handler] upstream non-JSON', upstream.status, text.slice(0, 400));
      return {
        status: 502,
        json: {
          error: 'Upstream returned non-JSON',
          status: upstream.status,
          raw: text.slice(0, 800),
        },
      };
    }

    if (!upstream.ok) {
      console.error('[chat-handler] upstream HTTP', upstream.status, JSON.stringify(data).slice(0, 800));
      return {
        status: 502,
        json: {
          error: 'Upstream HTTP error',
          status: upstream.status,
          detail: data,
        },
      };
    }

    const reply = mode === 'responses' ? extractResponsesReply(data) : extractReply(data);
    if (reply == null || reply === '') {
      console.error('[chat-handler] 无法解析回复:', JSON.stringify(data).slice(0, 800));
      return {
        status: 502,
        json: {
          error: 'Upstream OK but unknown response shape',
          hint: '若控制台换过接口版本，把返回 JSON 对照 server/chat-handler.mjs 里的 extractResponsesReply',
          sample: data,
        },
      };
    }

    return { status: 200, json: { reply: String(reply) } };
  } catch (e) {
    console.error('[chat-handler]', e);
    return { status: 500, json: { error: String(e && e.message ? e.message : e) } };
  }
}

/** 供 /health 与自检使用（不暴露密钥） */
export function getChatHealthSnapshot() {
  const cfg = getEnvConfig();
  const mode = cfg.API_KEY && cfg.CHAT_URL ? detectMode(cfg) : null;
  return {
    ok: true,
    configured: Boolean(cfg.API_KEY && cfg.CHAT_URL),
    mode: mode || 'n/a',
    modelSet: Boolean(cfg.MODEL),
    chatUrlHost: cfg.CHAT_URL
      ? (() => {
          try {
            return new URL(String(cfg.CHAT_URL).trim()).host;
          } catch {
            return 'invalid-url';
          }
        })()
      : null,
  };
}
