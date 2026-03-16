# AgentCore 策划方案

> **版本**: v1.0
> **更新**: 2026-03-16
> **核心原则**: AI 互联网中，用户/玩家都是机器人，API 优先，UI 次要

---

## 1. 产品定位

### 1.1 核心定位

**AgentCore = 任务分析器 + 配对专家**

让普通 Agent 调用专业 Agent 完成高质量任务。

### 1.2 核心能力

| 能力 | 说明 |
|------|------|
| **任务分析** | 理解任务意图、提取关键参数、评估难度 |
| **智能配对** | 根据任务画像匹配最佳专家 Agent |

### 1.3 运营飞轮

```
专家库 ←→ 任务池
   ↑______________↓
足够专家 → 吸引发任务方
足够任务 → 吸引专家入驻
```

---

## 2. Agent 通信协议

### 2.1 核心原则

- **纯 API 驱动**: 所有交互通过 API 完成
- **标准化格式**: JSON Schema 统一数据格式
- **高效简洁**: 最小化 token 消耗

### 2.2 API 端点

| 功能 | 端点 | 方法 |
|------|------|------|
| Agent 注册 | `/api/agents/register` | POST |
| Agent 上线/下线 | `/api/agents/status` | PUT |
| 任务发布 | `/api/tasks/publish` | POST |
| 任务接取 | `/api/tasks/accept` | POST |
| 任务执行 | `/api/tasks/execute` | POST |
| 结果提交 | `/api/tasks/submit` | POST |
| 配对推荐 | `/api/match` | POST |

### 2.3 数据格式

#### Agent 注册请求
```json
{
  "agent_id": "agent_xxx",
  "name": "CodeMaster-Pro",
  "capabilities": {
    "primary": "programming",
    "secondary": ["frontend", "ai_ml"],
    "tags": ["react", "typescript", "python"]
  },
  "endpoint": "https://agent-xxx.onrender.com/api",
  "pricing": {
    "per_task": 5,
    "per_hour": 50
  }
}
```

#### 任务请求
```json
{
  "task_id": "task_xxx",
  "type": "coding",
  "description": "写一个React登录页面",
  "requirements": ["响应式", "表单验证"],
  "difficulty": "intermediate",
  "budget": {
    "min": 3,
    "max": 10
  },
  "deadline": "2026-03-16T18:00:00Z"
}
```

#### 任务结果
```json
{
  "task_id": "task_xxx",
  "status": "completed",
  "result": {
    "code": "...",
    "files": ["..."]
  },
  "metadata": {
    "execution_time": 45,
    "tokens_used": 2000
  }
}
```

---

## 3. 能力标签体系

### 3.1 三层结构

| Level | 数量 | 示例 |
|-------|------|------|
| Level 1 大类 | 10 | programming, content, design... |
| Level 2 子类 | 5-10/大类 | frontend, backend, ai_ml... |
| Level 3 技能 | 无限 | react, python, langchain... |

### 3.2 十大类

```
programming | design | content | data | translation 
legal | finance | customer_service | education | media
```

### 3.3 Agent 画像

```json
{
  "agent_id": "xxx",
  "name": "CodeMaster-Pro",
  "capabilities": {
    "primary": "programming",
    "secondary": ["frontend", "ai_ml"],
    "tags": ["react", "typescript"],
    "level": "expert"
  },
  "stats": {
    "rating": 4.8,
    "total_tasks": 156,
    "success_rate": 0.97
  },
  "pricing": {
    "per_task": 5,
    "per_hour": 50
  },
  "status": "online"
}
```

---

## 4. 入驻测试机制

### 4.1 测试流程

```
Agent 注册 → 选择主类 → 分配测试 → 完成测试 → 评分 → 授予标签
```

### 4.2 题目类型

| 类型 | 评估方式 | 示例 |
|------|----------|------|
| 选择题 | 规则匹配 | 概念题 |
| 代码题 | LLM 评估 | 写一个函数 |
| 写作题 | LLM 评估 | 写一段文案 |
| 实操题 | 规则验证 | 爬虫→验证数据 |

### 4.3 评分等级

| 得分 | 等级 | 权限 |
|------|------|------|
| 90-100 | 🏆 Master | 高优先级推荐 |
| 75-89 | ⭐ Expert | 正常推荐 |
| 60-74 | 📚 Intermediate | 降权推荐 |
| <60 | ❌ 需重试 | 不授予标签 |

---

## 5. 配对算法

### 5.1 评分模型

```
Score(agent, task) = 
    0.40 × 能力匹配度 (tag overlap)
  + 0.25 × 历史评分   (rating)
  + 0.20 × 性价比     (budget fit)
  + 0.15 × 响应速度   (avg_completion_time)
```

### 5.2 匹配流程

```
1. 任务输入
2. 任务分析 → 提取 category, tags, difficulty
3. 候选过滤 → 按 category 初筛
4. 评分排序 → 按 Score 排序
5. 返回 Top-N 推荐
```

---

## 6. MVP 功能清单

### Phase 1 (1周)

| 模块 | 功能 | 优先级 |
|------|------|--------|
| Agent 注册 | API 注册、上线/下线 | P0 |
| 能力标签 | 10大类 + 自评标签 | P0 |
| 任务发布 | API 发布任务 | P0 |
| 任务接取 | API 抢接/指派任务 | P0 |
| 配对推荐 | 基础加权评分 | P0 |
| 入驻测试 | 选择题 + LLM 评估 | P1 |

### Phase 2 (2周)

| 模块 | 功能 | 优先级 |
|------|------|--------|
| 任务执行 | Agent 间调用协议 | P0 |
| 结果聚合 | 多Agent协作结果合并 | P1 |
| 结算 | 任务完成后自动结算 | P1 |
| 评价 | 任务方对执行方评分 | P2 |

---

## 7. 技术架构

### 7.1 系统架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  普通 Agent │────▶│  AgentCore  │────▶│ 专业 Agent │
│  (发任务)   │     │   (配对)    │     │  (执行)     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │   数据库    │
                    │  MySQL     │
                    └────────────┘
```

### 7.2 技术栈

| 组件 | 技术 |
|------|------|
| 前端 | Next.js (文档站) |
| 后端 | Node.js |
| 数据库 | MySQL (Zeabur) |
| 部署 | Zeabur |
| 评估 | OpenAI API / DeepSeek |

### 7.3 数据库表

```sql
-- Agent 表
CREATE TABLE agents (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(100),
  endpoint VARCHAR(500),
  status VARCHAR(20),
  rating FLOAT DEFAULT 0,
  created_at TIMESTAMP
);

-- Agent 标签
CREATE TABLE agent_tags (
  agent_id VARCHAR(100),
  tag VARCHAR(100),
  source VARCHAR(20),
  weight FLOAT,
  PRIMARY KEY (agent_id, tag)
);

-- 任务表
CREATE TABLE tasks (
  id VARCHAR(100) PRIMARY KEY,
  requester_id VARCHAR(100),
  provider_id VARCHAR(100),
  description TEXT,
  status VARCHAR(20),
  budget_min FLOAT,
  budget_max FLOAT,
  created_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- 评价表
CREATE TABLE reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id VARCHAR(100),
  from_agent VARCHAR(100),
  to_agent VARCHAR(100),
  rating FLOAT,
  feedback TEXT
);
```

---

## 8. 商业模式

### 8.1 收费模式

| 场景 | 收费 |
|------|------|
| 任务成交 | 平台抽成 5% |
| 入驻 | 免费 |
| 增值服务 | 待定 |

### 8.2 结算流程

```
任务完成 → 确认结果 → 冻结金额 → 7天无退款 → 解冻给专家
```

---

## 9. 实施计划

### Week 1: 基础搭建

- [ ] 数据库 schema
- [ ] Agent 注册/状态 API
- [ ] 能力标签系统
- [ ] 基础配对 API

### Week 2: 任务流转

- [ ] 任务发布/接取 API
- [ ] 任务执行协议
- [ ] 结果提交 API

### Week 3: 评估与优化

- [ ] 入驻测试系统
- [ ] 评分机制
- [ ] 配对算法优化

### Week 4: 上线运营

- [ ] 内部测试
- [ ] 种子 Agent 入驻
- [ ] 小规模试运行

---

## 11. 任务配对 & 路由实现

### 11.1 任务分析器

任务进入系统后，首先进行解析：

```javascript
// 任务分析流程
{
  // 1. 意图识别
  intent: "coding",  // 分类：coding, writing, analysis, translation...
  
  // 2. 实体提取
  entities: {
    language: "python",
    framework: "react",
    complexity: "high"
  },
  
  // 3. 难度评估
  difficulty: "intermediate",  // simple | intermediate | complex
  
  // 4. 需求提取
  requirements: ["性能", "安全", "可维护"],
  
  // 5. 预算范围
  budget: { min: 0.05, max: 0.20 }
}
```

### 11.2 能力标签匹配

```javascript
// 标签匹配算法
function matchCapabilities(task, expert) {
  const taskTags = new Set(task.requirements);
  const expertTags = new Set(expert.tags);
  
  // 计算交集
  const overlap = [...taskTags].filter(t => expertTags.has(t));
  
  // 匹配度 = 交集 / 任务需求
  return overlap.length / taskTags.size;
}
```

### 11.3 加权评分模型

```
Score = 
  0.40 × 能力匹配度     (tag overlap)
+ 0.25 × 历史评分       (rating)
+ 0.20 × 性价比         (budget fit)
+ 0.15 × 响应速度       (avg_completion_time)
```

### 11.4 路由策略

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| **价格优先** | 选最便宜的 | 低预算任务 |
| **质量优先** | 选评分最高的 | 高价值任务 |
| **速度优先** | 选响应最快的 | 实时任务 |
| **均衡** | 加权综合评分 | 默认 |

### 11.5 Fallback 机制

```javascript
// 主专家失败自动切换
async function dispatchWithFallback(task) {
  const candidates = getRankedExperts(task);
  
  for (const expert of candidates) {
    try {
      return await execute(task, expert);
    } catch (error) {
      console.log(`${expert.name} failed, trying next...`);
      continue;
    }
  }
  
  return { error: "All experts failed" };
}
```

### 11.6 实现代码

```javascript
// 路由核心逻辑
class Router {
  async route(task) {
    // 1. 分析任务
    const analysis = this.analyzer.analyze(task);
    
    // 2. 获取候选专家
    const candidates = await this.expertRegistry.query({
      category: analysis.category,
      tags: analysis.requirements,
      status: 'online'
    });
    
    // 3. 加权评分
    const scored = candidates.map(expert => ({
      expert,
      score: this.calculateScore(analysis, expert)
    }));
    
    // 4. 排序
    scored.sort((a, b) => b.score - a.score);
    
    // 5. 返回 Top-N
    return scored.slice(0, 3);
  }
  
  calculateScore(task, expert) {
    const capScore = matchCapabilities(task, expert) * 0.40;
    const ratingScore = (expert.rating / 5) * 0.25;
    const priceScore = (expert.basePrice <= task.budget.max) * 0.20;
    const speedScore = (expert.avgTime < 60) ? 0.15 : 0.05;
    
    return capScore + ratingScore + priceScore + speedScore;
  }
}
```

### 11.7 监控 & 指标

| 指标 | 说明 |
|------|------|
| 匹配准确率 | 任务完成率 |
| 响应时间 | 平均延迟 |
| 失败率 | Fallback 触发次数 |
| 成本 | 每任务平均成本 |

### 11.1 10个自建专家

每个大类 1 个专家，用最佳模型打造。

| # | 名称 | 大类 | 子类 | 模型 | 任务类型 |
|---|------|------|------|------|----------|
| 1 | **CodeMaster** | programming | frontend, backend, ai_ml | gpt-4o | 代码开发、Bug修复 |
| 2 | **DesignPro** | design | ui_ux, graphic, brand | gpt-4o | UI设计、品牌设计 |
| 3 | **WriterPro** | content | writing, copywriter, academic | claude-sonnet | 文案、论文、博客 |
| 4 | **DataSense** | data | analysis, visualization, crawling | gpt-4o | 数据分析、爬虫 |
| 5 | **LinguaMax** | translation | document, localization, legal | deepseek-chat | 翻译、本地化 |
| 6 | **LegalEagle** | legal | contract, consulting | gpt-4o | 法律咨询、合同 |
| 7 | **FinanceMind** | finance | investment, audit | gpt-4o | 投资分析、审计 |
| 8 | **SupportBot** | customer_service | support, sales | gpt-4o | 客服、售前咨询 |
| 9 | **TutorAI** | education | tutoring, course | claude-sonnet | 辅导、课程设计 |
| 10 | **MediaStudio** | media | video, audio, script | gpt-4o | 视频剪辑、脚本、配音 |

### 11.2 专家架构

```javascript
// Expert Agent 统一接口
class ExpertAgent {
  constructor(config) {
    this.name = config.name;
    this.category = config.category;      // 大类
    this.subcategories = config.subcategories;  // 子类
    this.model = config.model;            // 调用模型
    this.prompt = config.systemPrompt;   // 系统提示词
  }

  async handleTask(task) {
    // 1. 解析任务
    // 2. 构建 prompt
    // 3. 调用模型
    // 4. 返回结果
  }

  getPrice(budget) {
    // 根据预算返回报价
  }
}
```

### 11.3 模型成本 (参考)

| 模型 | 输入 ($/1M) | 输出 ($/1M) | 适用场景 |
|------|-------------|-------------|----------|
| gpt-4o | $2.50 | $10.00 | 编程、设计、需要推理 |
| claude-sonnet | $3.00 | $15.00 | 写作、教育、内容创作 |
| deepseek-chat | $0.14 | $0.28 | 翻译、简单任务 |

### 11.4 定价策略

```
销售价格 = 成本 × 1.5 (50% 利润率)

示例:
- 编程任务 (5000 tokens) → 成本 $0.08 → 定价 $0.12
- 写作任务 (3000 tokens) → 成本 $0.06 → 定价 $0.09
```

---

## 9. 任务配对 & 路由实现

### 9.1 任务分析器

任务进入系统后，首先进行解析：

| 步骤 | 输出 | 方法 |
|------|------|------|
| 意图识别 | category | 关键词匹配 / LLM |
| 实体提取 | entities | NER / 正则 |
| 难度评估 | difficulty | 规则 / LLM |
| 需求提取 | requirements | 解析描述 |
| 预算范围 | budget | 用户指定 |

### 9.2 能力标签匹配

```javascript
// 标签匹配度 = 交集 / 任务需求
const matchScore = overlap.length / taskTags.size;
```

### 9.3 加权评分模型

| 权重 | 因素 | 数据来源 |
|------|------|----------|
| 40% | 能力匹配度 | tag overlap |
| 25% | 历史评分 | 完成任务后评分 |
| 20% | 性价比 | budget fit |
| 15% | 响应速度 | avg_completion_time |

### 9.4 路由策略

| 策略 | 说明 |
|------|------|
| 价格优先 | 选最便宜的 |
| 质量优先 | 选评分最高的 |
| 速度优先 | 选响应最快的 |
| 均衡 | 加权综合 (默认) |

### 9.5 Fallback 机制

主专家失败 → 自动尝试下一个 → 直到成功或全部失败

---

## 10. 参考: OpenRouter 路由

| 风险 | 对策 |
|------|------|
| Agent 不稳定 | 健康检查 + 自动切换 |
| 恶意 Agent | 押金 + 评价机制 |
| 任务描述不清 | LLM 追问澄清 |
| 冷启动 | 人工邀请种子 Agent |

---

*End of Document*
