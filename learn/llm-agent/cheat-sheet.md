# 从 LLM 到 AI Agent · 一页复习（可打印 A4）

## 9 章路径

| # | 主题 | 一句话 |
|---|------|--------|
| ① | LLM | 预测下一个 token |
| ② | RAG | 先查再答 |
| ③ | Agent Core | ReAct + 工具 |
| ④ | Retrieval | BM25 + 混合 + 重排 |
| ⑤ | LangChain/LangGraph | 先选型再实现 + 记忆 |
| ⑥ | MCP/A2A | 工具协议 + 智能体协议 |
| ⑦ | OpenClaw/Hermes | 自托管 Agent 栈 |
| ⑧ | Multi-agent/KG | 协作 + 图谱 |
| ⑨ | Multimodal | 视觉/语音/合成 |

Hub：`present-hub.html` · 评估：`course-full-eval.html`

## 演化链

```
传统 AI:  输入 → 输出
LLM:      输入 → 推理 → 生成
Agent:    目标 → 规划 → 行动 → 反馈 → 迭代
```

## 核心公式

| 名称 | 公式 |
|------|------|
| 语言模型 | $P(s_1\ldots s_n)=\prod_j P(s_j\mid s_{<j})$ |
| Attention | $\mathrm{softmax}(QK^\top/\sqrt{d_k})V$ |
| 预训练 Loss | $\mathcal{L}=-\sum_t \log P(x_t\mid x_{<t})$ |
| RLHF | $\max\mathbb{E}[r_\phi]-\beta D_{\mathrm{KL}}(\pi_\theta\|\pi_{\mathrm{SFT}})$ |
| Agent | LLM + Memory + Planning + Tools + Environment |

## 选型速查

| 需求 | 选 |
|------|-----|
| 固定 RAG 管道 | LangChain |
| 工具循环 + 断点续聊 | LangGraph + SqliteSaver |
| 跨会话用户偏好 | LangGraph Store |
| IDE/桌面工具插件 | MCP |
| 跨公司 Agent 委托 | A2A |
| 个人自托管助手 | Hermes + OpenClaw |

## 评估速查

| 症状 | 层 | 章 |
|------|-----|-----|
| 检索不到文档 | Retrieval | ④ |
| 文档对答案错 | Generation | ② |
| 工具选错 | Agent routing | ③ |
| 忘记上一轮 | Memory | ⑤ |
| 多跳关系漏 | KG | ⑧ |
