/**
 * Vercel：部署后访问 /api/health 检查环境变量是否生效（不返回任何密钥）。
 */
import { getChatHealthSnapshot } from '../server/chat-handler.mjs';

export default function handler(_req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(getChatHealthSnapshot());
}
