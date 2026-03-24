# AI 分身接入大模型（配置说明）

本文档说明：**如何把网页里的「AI 分身」接到 OpenClaw / 火山方舟（豆包）等 API**，以及密钥应该写在哪里。

---

## 1. 密钥写在哪里？

| 写法 | 是否推荐 | 说明 |
|------|----------|------|
| 写进 `index.html` 或前端 JS | 否 | 任何人打开网站按 F12 都能看到，会盗刷你的额度。 |
| 写进本机 `.env` + 本地小服务 | 本机自用可以 | 密钥只在你的电脑进程里，**不要把 `.env` 提交到 Git**。 |
| 云平台「环境变量」+ 无服务器函数 | 网站公开访问时推荐 | 访客只看到你自己的接口地址，看不到厂商 key。 |

**结论：**  
- 只在自己电脑调试：用下面「本机代理」即可，**不必**先上云。  
- 网站要给别人长期访问：再部署同一套逻辑到云函数 / 小服务器。

---

## 2. 本机最小流程（推荐你先按这个做）

### 步骤 A：复制环境变量模板

在项目根目录复制一份配置（**不要**把真实 key 写进仓库里的文件）：

```bash
copy .env.example .env
```

用记事本打开 `.env`，按 **`.env.example` 里的注释**填写。若曾在聊天里发过 key，请先在控制台**轮换**再写入 `.env`。

**接火山方舟 / 豆包（OpenAI 兼容）时**必须同时配置：

- `OPENCLAW_CHAT_URL`：`https://ark.<地域>.volces.com/api/v3/chat/completions`（以控制台为准）
- `OPENCLAW_MODE=openai`
- `OPENCLAW_MODEL=ep-xxxx`（接入点 ID，不是模型昵称）

配置好后可在项目根目录执行 **`npm run verify-chat`**：只检查是否漏项、URL 是否像网址，**不会**调用大模型、也不会打印完整密钥。

### 步骤 B：安装并启动本地代理（仓库已带示例）

`server/chat-proxy.mjs` 会根据 URL / 环境变量**自动推断** `simple`（只发 `{message}`）或 `openai`（发 `messages` + `model`）。也可显式设置 `OPENCLAW_MODE`。

终端执行（需 Node 18+，自带 `fetch`）：

**需要开两个终端窗口**（或一个前台一个后台）：

```bash
cd d:\vienne-site
npm install
```

**终端 1 — 聊天代理（一直开着）：**

```bash
npm run chat-proxy
```

**终端 2 — 打开你的网站（看终端里打印的地址）：**

```bash
npm run site
```

浏览器里打开终端里显示的那一行，一般是：

**`http://localhost:8765`**（`npm run site` 固定端口，会自动打开 `index.html`）

然后点页面上的 **「AI 分身」** 发消息即可。

代理默认 **`http://127.0.0.1:8790`**。自检：浏览器打开 `http://127.0.0.1:8790/health` 应看到 `ok: true` 等 JSON。

### 步骤 C：前端指向本机代理

在 `index.html` 里，聊天发送时改为：

```js
fetch('http://127.0.0.1:8787/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: userText })
})
```

**注意：** 若用 `file://` 打开 HTML，浏览器可能拦截跨域；请用本地静态服务打开站点，例如：

```bash
npx serve .
```

---

## 3. 和「云平台」的关系

- **不是必须用 Vercel。**  
- 任何能跑一段后端代码、且能配置**环境变量**的地方都可以：腾讯云函数、阿里云 FC、自建 VPS、Cloudflare Workers 等。  
- 上线时把本地 `chat-proxy` 的逻辑部署上去，把前端里的 `http://127.0.0.1:8787` 改成你的线上地址（如 `https://你的域名/api/chat`）。

---

## 4. 安全提醒

- 曾在公开聊天中发送过的 key，视为已泄露，请在控制台**轮换（作废再新建）**。  
- `.env` 已加入 `.gitignore`，请勿手动从 Git 里移除该忽略规则。  
- 仓库内只保留 `.env.example` 里的**占位符**，不要提交真实密钥。

---

## 5. 让 AI 分身回答「怎么联系你」（不是训练模型）

大模型**不用训练**。做法是：在每次对话里附带一段**固定文字**（系统提示 + 主人公开信息），模型按指令如实回答。

- 在 `.env` 里增加 **`OPENCLAW_OWNER_FACTS=`**（一行内写电话、微信、邮箱等），或  
- 复制 **`server/owner-facts.example.txt`** 为 **`server/owner-facts.txt`** 填写多行（该文件默认不提交 Git）。

改完后**重启** `npm run chat-proxy`。访客问面试官怎么联系、电话多少等，就会按你写的事实回答。

若信息很长或常改，再考虑 **RAG / 知识库**；个人站点用上面两种方式足够。

---

## 6. 下一步（可选）

若你提供 OpenClaw 或火山方舟文档中的 **聊天接口 URL + 请求示例 JSON**，可以在本仓库里再增加一个可直接运行的 `server/chat-proxy.mjs` 模板（仍不包含你的真实 key）。
