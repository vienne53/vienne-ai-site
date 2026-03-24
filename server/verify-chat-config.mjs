/**
 * 自检：不调用上游、不泄露完整密钥
 * npm run verify-chat
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const key = process.env.OPENCLAW_API_KEY;
const url = process.env.OPENCLAW_CHAT_URL;
const model = process.env.OPENCLAW_MODEL || process.env.ARK_MODEL;
const modeEnv = (process.env.OPENCLAW_MODE || '').toLowerCase().trim();

function mask(s) {
  if (!s || s.length < 8) return s ? '***' : '(空)';
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

function detectMode() {
  if (modeEnv === 'simple' || modeEnv === 'raw') return 'simple';
  if (modeEnv === 'responses') return 'responses';
  const u = String(url || '');
  if (/\/responses(\?|$|\/)/i.test(u)) return 'responses';
  if (modeEnv === 'doubao' || modeEnv === 'openai' || modeEnv === 'ark' || modeEnv === 'volcengine') {
    return 'openai';
  }
  if (/chat\/completions|\/v3\/chat/i.test(u)) return 'openai';
  if (model && /^ep-/i.test(model)) return 'openai';
  return 'simple';
}

console.log('—— AI 聊天代理配置自检 ——');
console.log('OPENCLAW_API_KEY:', key ? mask(key) : '(未设置)');
console.log('OPENCLAW_CHAT_URL:', url || '(未设置)');
if (url && !/^https?:\/\//i.test(String(url).trim())) {
  console.log('  ⚠ URL 必须以 http:// 或 https:// 开头');
}
if (url) {
  try {
    const u = new URL(String(url).trim());
    console.log('  解析 host:', u.host, 'path:', u.pathname);
  } catch {
    console.log('  ⚠ 不是合法 URL');
  }
}
console.log('OPENCLAW_MODEL:', model || '(未设置)');
console.log('OPENCLAW_MODE:', modeEnv || '(自动推断)');

const inferred = detectMode();
console.log('推断模式:', inferred);

if ((inferred === 'openai' || inferred === 'responses') && !model) {
  if (inferred === 'responses') {
    console.log('\n⚠ /responses 接口需要 OPENCLAW_MODEL=控制台 curl 里的 model（如 doubao-seed-xxx）');
  } else {
    console.log('\n⚠ chat/completions 需要 OPENCLAW_MODEL（常为 ep-xxxx 接入点）');
  }
}

if (!key || !url) {
  console.log('\n⚠ 缺少 OPENCLAW_API_KEY 或 OPENCLAW_CHAT_URL');
  process.exit(1);
}

console.log('\n✓ 最低配置齐全。运行: npm run chat-proxy');
process.exit(0);
