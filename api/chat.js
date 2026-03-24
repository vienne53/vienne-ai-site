/**
 * Vercel Serverless：与本地 chat-proxy 的 POST /chat 行为一致。
 * 线上 index.html 在非 localhost 时使用 fetch('/api/chat', …)。
 */
import { runChatPost } from '../server/chat-handler.mjs';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const out = await runChatPost(req.body);
  return res.status(out.status).json(out.json);
}
