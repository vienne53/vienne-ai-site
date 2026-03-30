# vienne-ai-site
个人主页静态站 +「AI 分身」对话（Vercel Serverless / 本地代理）。

## 项目背景与定位

目标是打造一个融合工程背景与 AI Agent 落地实践的个人品牌网站：

- **深空科技风 + 3D 视觉**：土星旋转、霓虹光效、玻璃拟态
- **作品集**：展示 AI Agent / 项目管理 / 教育产品等项目
- **学习笔记页**：`notes.html` 可持续更新内容
- **可点击联系方式**：电话/微信/GitHub/邮箱等
- **AI 分身**：访客在网页内直接对话（不把密钥放前端）

## 技术栈 / 框架

这是一个 **纯静态站点 + 少量 Node Serverless 接口** 的组合：

- **HTML5**：页面结构（`index.html`、`notes.html`）
- **Tailwind CSS（CDN）**：响应式布局与视觉风格
- **原生 JavaScript**：3D/交互（动画、弹窗、语言切换、AI 对话等）
- **GitHub Pages**：静态站部署（无需服务器）
- **Vercel**：部署 `api/chat` 让 AI 分身在线可用

开发工具:

- **Kimi / Cursor**：协助写页面结构、样式与交互逻辑
- **GitHub**：版本管理与发布

## 功能

- **静态主页**：`index.html`、`notes.html`、`images/`、`docs/`
- **AI 分身（前端）**：网页内置对话组件，线上默认请求同域 `POST /api/chat`
- **AI 分身（后端）**：
  - **线上**：Vercel Serverless Functions（`api/chat.js`、`api/health.js`）
  - **本地**：Express 代理（`npm run chat-proxy`，`POST http://127.0.0.1:8790/chat`）
- **境外链接提示**：点击外链时弹窗提醒（可用 `data-no-abroad-warn` 跳过）
- **多语言**：zh/en（`localStorage` key：`vienne-lang`）

## 目录结构

```
.
├─ index.html                 # 主页面（含 i18n、AI 分身、外链提示等脚本）
├─ notes.html                 # 笔记页
├─ images/                    # 图片资源
├─ docs/                      # 文档
├─ api/
│  ├─ chat.js                 # Vercel：POST /api/chat
│  └─ health.js               # Vercel：GET  /api/health（自检）
├─ server/
│  ├─ chat-handler.mjs        # 与上游模型交互的共享逻辑（本地/线上共用）
│  ├─ chat-proxy.mjs          # 本地代理（Express）
│  ├─ verify-chat-config.mjs  # 本地配置自检脚本
│  └─ owner-facts.example.txt # 公开信息示例（勿把隐私直接提交）
├─ vercel.json                # Vercel 配置（framework=null + 函数超时）
├─ package.json
└─ .env.example               # 环境变量示例（复制为 .env 仅本地用）
```

## 本地开发

### 1) 安装依赖

```bash
npm install
```

### 2) 配置环境变量（仅本地）

把 `.env.example` 复制为 `.env`（不要提交 Git）并填写：

```bash
OPENCLAW_API_KEY=...
OPENCLAW_CHAT_URL=https://.../api/v3/responses  # 或 .../chat/completions
OPENCLAW_MODEL=...                              # responses/openai 模式需要
OPENCLAW_MODE=responses                         # 可选：也可自动推断
```

可选变量：

- `OPENCLAW_SYSTEM_PROMPT`
- `OPENCLAW_OWNER_FACTS`（或放在 `server/owner-facts.txt`，该文件应被 gitignore）
- `OPENCLAW_MAX_TOKENS`
- `CHAT_PROXY_PORT`（默认 8790）

### 3) 启动本地聊天代理

```bash
npm run chat-proxy
```

健康检查：打开 `http://127.0.0.1:8790/health`

### 4) 启动本地静态站

```bash
npm run site
```

默认端口：`http://127.0.0.1:8765`

本地访问主页时，AI 分身会自动请求 `http://127.0.0.1:8790/chat`。

### 配置自检（可选）

```bash
npm run verify-chat
```

## 部署到 Vercel（确保 AI 分身可用）

### 0) 部署前先确认两件事（1 分钟）

1. 你的代码要推送到 GitHub 的 `main` 分支（Vercel 默认看 `main`）
2. GitHub 仓库里能看到这些路径（在仓库页面左侧/文件列表能打开即可）
   - `api/chat.js`
   - `api/health.js`
   - `server/chat-handler.mjs`
   - `vercel.json`
   - `package.json`

如果你在 GitHub 页面看到“`node_modules`”（根目录下出现 node_modules），请尽快移除并提交一次（`node_modules` 不应在 GitHub 上出现）。

### 1) 导入项目（Vercel 网页操作）

1. 打开 Vercel → 点 **Add New** → **Project**
2. 选择 **Import Git Repository**
3. 选你的仓库：`vienne53/vienne-ai-site`
4. 分支（Branch）建议选 `main`
5. Application Preset：选择 `Other`（不要选 FastAPI、Django、Next 等）
6. Root Directory：保持 `./` 或 `/`（你的仓库是根目录包含 `index.html`）
7. 看到 Build and Output Settings 时一般不用改；主要是下面的环境变量要填好

### 2) 设置环境变量（Vercel 控制台）

在新建页面的下方（你截图的位置）有一块 **Environment Variables**，在这里添加：

1. 点 **Add More** 添加多行（或直接填一行一行）
2. 至少要添加下面 3 个（Key 必须一模一样，注意大小写）
   - `OPENCLAW_API_KEY`
   - `OPENCLAW_CHAT_URL`
   - `OPENCLAW_MODEL`
3. 可选但建议也添加（能让行为更稳定）
   - `OPENCLAW_MODE`（比如 `responses` 或 `doubao`，不填也会按 URL 推断）
   - `OPENCLAW_SYSTEM_PROMPT`
   - `OPENCLAW_OWNER_FACTS`
   - `OPENCLAW_MAX_TOKENS`

填法小抄（按你控制台 curl 来）：

- `OPENCLAW_CHAT_URL`：必须是一个完整的 `https://...` URL
- `OPENCLAW_API_KEY`：填 Bearer 后面的那串
- `OPENCLAW_MODEL`：
  - 如果你的 `OPENCLAW_CHAT_URL` 是 `/api/v3/responses`：填 curl 里 `-d '{ "model": "xxx" ... }'` 的 `xxx`
  - 如果你的 `OPENCLAW_CHAT_URL` 是 `/api/v3/chat/completions`：填 `ep-xxxx` 或文档里的对应 model 值

保存勾选环境：

1. 勾选 **Production**
2. 需要测试的话也勾选 **Preview**

注意：

- **不要**把 `.env` 提交 Git
- **改完环境变量要 Redeploy 才生效**

### 3) 部署

1. 页面最下面点 **Deploy**
2. 部署完成后回到项目详情页
3. 如果你之前已经部署过，现在只是改了环境变量，也要点该 deployment 的 **Redeploy**

### 4) 部署后自检（必须做，2 分钟）

1. 打开：
   - `https://你的域名/api/health`
2. 期望看到 JSON 中：
   - `configured: true`
3. 若你使用需要 model 的模式，最好看到：
   - `modelSet: true`

然后再打开主页测试 AI 分身对话：
1. 点击页面里的“AI 分身”输入一句话
2. 如果对话报错（503/502），不要猜，直接把页面上报错内容（或控制台网络返回的 JSON）发我

## 本地与线上请求的对应关系（帮助你理解）

- 本地：主页会对 `http://127.0.0.1:8790/chat` 发请求（你运行 `npm run chat-proxy`）
- 线上：主页（非 localhost）会对同域的 `/api/chat` 发请求
- 因此线上必须部署 `api/chat.js`，并在 Vercel 环境变量正确注入 `OPENCLAW_*`

## 安全与注意事项

- **不要提交**：`.env`、`node_modules/`、`server/owner-facts.txt`（如含隐私）
- 若你曾在截图/日志中暴露过 key，建议到控制台 **立即轮换（rotate）密钥**

## 常见问题

- **Vercel 报 FastAPI entrypoint**：确认 Application Preset 选 `Other`，并且 `vercel.json` 已推送到 GitHub `main`
- **`The pattern "api/chat.js" ... doesn't match any Serverless Functions`**：说明 GitHub 的 `api/chat.js` 没有在 `main` 分支里，请检查 GitHub 文件列表是否真的有 `api/chat.js`
- **`/api/chat` 返回 503**：通常是环境变量没配全（去 `/api/health` 看 configured 是否为 true）
- **`/api/chat` 返回 502**：通常是上游 `OPENCLAW_CHAT_URL` 或 `OPENCLAW_MODEL` 不匹配，或者上游返回的 JSON 结构变化

---

## GitHub Pages 部署（静态站上线：index + notes）

如果你只想先把网站“页面上线”，而不先接 AI 分身，用 GitHub Pages 最简单。

### Step 1：准备本地文件（Windows 示例）

1. 在本地创建目录（示例）：`D:\vienne-site`
2. 确保至少有两个核心文件：
   - `index.html`：主页
   - `notes.html`：学习笔记页

建议你也把资源准备好：

- `images/`：头像/项目配图
- `docs/`：说明文档
- `README.md`：项目介绍（就是本文件）

### Step 1.5：添加图片（头像 / 项目图 / favicon）——按这一步做不容易踩坑

#### A. 把图片放进 `images/` 目录

1. 在 `D:\vienne-site\images\` 里放入你的图片文件，例如：
   - `images/vienne.png`（主页头像）
   - `images/bella.png`（AI 分身头像）
   - `images/project-xxx.png`（项目配图）
   - `images/favicon-v.svg`（站点图标，可选）
2. 文件名建议只用 **英文/数字/短横线**，避免空格与中文造成 URL 编码问题：
   - 推荐：`my-photo.png`、`typhoon-demo.jpg`
   - 不推荐：`我的头像 1.png`

#### B. 在 HTML 里用“相对路径”引用（GitHub Pages 必须这样）

在 `index.html` 或 `notes.html` 里引用图片时，使用相对路径：

```html
<img src="images/vienne.png" alt="Vienne" />
```

如果图片和 html 在同一层级，**不要**写成 Windows 盘符路径（例如 `D:\...`），也不要写成本机绝对路径。

#### C. 在 GitHub Pages 上验证图片是否能打开（快速定位路径问题）

部署到 Pages 后，直接访问图片地址测试，例如：

- `https://<你的用户名>.github.io/<仓库名>/images/vienne.png`

如果这个地址能打开，说明图片路径没问题；如果 404，通常是：

- 文件没 push 到 GitHub（本地有，远端没有）
- `src="images/xxx.png"` 拼错了（大小写、后缀名）
- 图片不在 `images/` 下

#### D. 设置网站图标（favicon，可选）

把图标文件放到 `images/`（例如 `images/favicon-v.svg`），并在 `index.html` 的 `<head>` 里加：

```html
<link rel="icon" href="images/favicon-v.svg" />
```

（也可以用 `.png`：`<link rel="icon" href="images/favicon.png" />`）

#### E. 提交并推送（图片也要一起）

```powershell
cd D:\vienne-site
git add images
git commit -m "assets: add images"
git push origin main
```

等 1–2 分钟再刷新 Pages。

### Step 2：把代码推送到 GitHub（推荐用 git，不用网页上传）

网页上传有“单次文件数限制”，而且容易把仓库搞乱；建议用 git。

在 PowerShell 执行：

```powershell
cd D:\vienne-site

# 第一次用：初始化仓库
git init
git branch -M main

# 忽略不该提交的文件（尤其是 .env 与 node_modules）
@"
node_modules/
.env
.env.txt
server/owner-facts.txt
"@ | Out-File -Encoding utf8 .gitignore

git add .
git commit -m "init: add site"

# 绑定远端仓库（先在 GitHub 创建一个空仓库）
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

> 如果你已经有仓库了，只需要 `git add .` → `git commit` → `git push`。

### Step 3：在 GitHub 上开启 Pages

1. 打开你的仓库页面 → **Settings**
2. 左侧菜单 → **Pages**
3. 在 “Build and deployment” 里设置：
   - **Source**：`Deploy from a branch`
   - **Branch**：`main`
   - **Folder**：`/(root)`

保存后等 1–2 分钟，GitHub 会给你一个访问地址，通常形如：

- `https://<你的用户名>.github.io/<仓库名>/`

### Step 4：确保「学习笔记」能跳转到 notes.html

在 `index.html` 中，所有指向学习笔记的链接都应指向 `notes.html`，例如：

- 导航栏：`href="notes.html"`
- 按钮：`href="notes.html"`

提交后 Pages 会自动更新。

### Step 5：notes.html 基础模板（可直接用）

如果你的 `notes.html` 还很空，可以先用一个与主页风格统一的基本模板，然后再持续填内容。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>AI Agent 实战 · 学习笔记大纲</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-black text-slate-200 font-sans antialiased">
  <nav class="w-full border-b border-white/10 bg-black/70 backdrop-blur fixed top-0 z-40">
    <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
      <a href="index.html#about" class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center font-bold text-black text-sm">V</div>
        <span class="font-bold tracking-wide">Vienne.AI</span>
      </a>
      <a href="index.html" class="text-sm text-gray-400 hover:text-cyan-400 transition">返回主页</a>
    </div>
  </nav>

  <main class="max-w-5xl mx-auto px-4 pt-24 pb-16 space-y-8">
    <div class="text-center space-y-4">
      <h1 class="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">AI Agent 实战学习笔记</h1>
      <p class="text-gray-400">从 0 到 1 掌握 AI Agent 搭建与落地</p>
    </div>

    <section class="space-y-4 border-l-4 border-cyan-400 pl-4">
      <h2 class="text-2xl font-semibold">一、AI Agent 基础认知</h2>
      <p>核心概念、技术架构、应用场景梳理</p>
      <p class="text-gray-500 italic">内容更新中，敬请期待。</p>
    </section>

    <section class="space-y-4 border-l-4 border-cyan-400 pl-4">
      <h2 class="text-2xl font-semibold">二、实战项目：智能问答 Agent</h2>
      <p>环境搭建、核心代码、部署上线全流程</p>
      <p class="text-gray-500 italic">内容更新中，敬请期待。</p>
    </section>
  </main>
</body>
</html>
```

### Step 6：如果 notes.html 打开 404（强制触发 Pages 重建）

偶尔 GitHub Pages 缓存/构建延迟会导致刚更新的文件短时间 404。解决方式：

1. 随便改一下 `index.html`（比如加一行注释 `<!-- trigger github pages rebuild -->`）
2. 提交（commit）到 `main`
3. 等 1–2 分钟再刷新 `notes.html`

