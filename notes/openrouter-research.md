# OpenRouter 研究报告

> 作为 AgentCore 项目的参考
> 研究日期: 2026-03-16

---

## 1. OpenRouter 概述

**是什么**: 一个统一的 AI 模型 API 聚合平台，让开发者通过单一端点访问 400+  AI 模型。

**规模**:
- 500万+ 开发者
- 400+ 模型
- 60+ 模型供应商

---

## 2. 商业模式

### 收入模式

| 模式 | 说明 |
|------|------|
| **平台费** | 模型原价的 5% 加成 (用户消费 $100, OpenRouter 赚 $5) |
| **BYOK (自带密钥)** | 每月首 1MB 免费，后续收 5% |
| **企业定价** | 大客户可谈批量价格 |

### 盈利逻辑

```
用户支付 $100 (模型费用) 
→ OpenRouter 收 $5 (平台费)
→ 供应商收 $95
```

**关键**: OpenRouter 不持有模型，通过聚合赚钱。

---

## 3. 核心技术

### 3.1 智能路由 (Intelligent Routing)

```javascript
// 请求示例
{
  "model": "openai/gpt-4o",
  // OpenRouter 自动选择最优供应商
}
```

**路由策略**:
- **负载均衡**: 按价格分配请求到多个供应商
- **自动 failover**: 主模型失败自动切换备选
- **功能匹配**: 根据请求需求(工具调用、图像理解等)筛选模型

### 3.2 Fallback 机制

```javascript
// 如果 GPT-4 失败，自动尝试 Claude
{
  "model": ["openai/gpt-4o", "anthropic/claude-3.5-sonnet"]
}
```

### 3.3 统一 API

- **OpenAI 兼容**: 使用 OpenAI SDK 即可接入
- **单一端点**: `https://openrouter.ai/api/v1/chat/completions`

---

## 4. 功能特性

### 4.1 使用追踪 (Usage Accounting)

API 响应中直接返回 token 消耗和费用:

```json
{
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 50,
    "total_tokens": 150
  },
  "cost": "0.0025"
}
```

### 4.2 API Key 管理

- 支持设置 credit limits
- 支持子 Key (给不同应用)
- 支持 OAuth 集成

### 4.3 免费模型路由

```javascript
{
  "model": "openrouter/free"  // 自动选免费模型
}
```

---

## 5. 对 AgentCore 的参考价值

### 5.1 可以借鉴

| 功能 | AgentCore 如何做 |
|------|------------------|
| 统一 API | 统一的 Expert 调用接口 |
| 5% 平台费 | AgentCore 抽成机制 |
| Fallback | 专家失败自动切换 |
| 使用追踪 | 任务成本实时计算 |

### 5.2 差异化方向

| OpenRouter | AgentCore |
|------------|-----------|
| 聚合模型供应商 | 聚合 AI Agent 专家 |
| 通用模型调用 | 任务分发 + 配对 |
| 技术中间件 | 任务交易市场 |

---

## 6. 技术架构参考

### 请求流程

```
用户请求 
  ↓
OpenRouter API (统一入口)
  ↓
路由层 (选择供应商/模型)
  ↓
调用目标模型
  ↓
返回结果 + 费用计算
```

### 关键组件

1. **API Gateway**: 统一入口，认证
2. **Router**: 智能路由，负载均衡
3. **Fallback Manager**: 失败自动切换
4. **Usage Tracker**: 成本计算
5. **Provider Adapter**: 适配各模型 API

---

## 7. 定价参考

### OpenRouter 定价

| 模型 | Input ($/1M) | Output ($/1M) |
|------|----------------|-----------------|
| GPT-4o | $2.50 | $10.00 |
| Claude 3.5 Sonnet | $3.00 | $15.00 |
| Gemini 1.5 Pro | $1.25 | $5.00 |

### AgentCore 可参考定价

```
平台抽成: 5%
专家定价: 成本 × 1.5
```

---

## 8. 结论

**OpenRouter 核心成功要素**:
1. ✅ 统一 API (降低接入成本)
2. ✅ 智能路由 (提高可靠性)
3. ✅ 透明定价 (使用追踪)
4. ✅ 5% 合理抽成 (双赢)

**AgentCore 可复制**:
- 统一的 Expert 调用 API
- 任务分发 + 配对算法
- 5% 平台抽成
- 透明的使用追踪

---

*End of Report*
