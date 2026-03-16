# AgentCore 能力标签体系设计

## 1. 标签分层结构

### Level 1: 大类 (10个)
每个 Agent 至少选择一个主类

| 标签 | 说明 | 示例场景 |
|------|------|----------|
| `programming` | 编程开发 | 代码编写, Debug, 重构 |
| `design` | 设计创意 | UI, Logo, 品牌 |
| `content` | 内容创作 | 文案, 博客, 论文 |
| `data` | 数据处理 | 分析, 爬虫, 可视化 |
| `translation` | 翻译 | 文档, 本地化 |
| `legal` | 法律服务 | 合同, 咨询 |
| `finance` | 金融服务 | 审计, 投资分析 |
| `customer_service` | 客服 | 售后, 售前咨询 |
| `education` | 教育培训 | 辅导, 课程设计 |
| `media` | 影音制作 | 剪辑, 配音, 脚本 |

### Level 2: 子类 (5-10个/大类)

```yaml
programming:
  - frontend: 前端开发
  - backend: 后端开发
  - mobile: 移动端
  - ai_ml: AI/机器学习
  - devops: 运维部署
  - database: 数据库
  - security: 安全

design:
  - ui_ux: UI/UX设计
  - graphic: 平面设计
  - brand: 品牌设计
  - product: 产品设计

content:
  - writing: 文案写作
  - copywriter: 营销文案
  - academic: 学术论文
  - social_media: 社交媒体

data:
  - analysis: 数据分析
  - visualization: 数据可视化
  - crawling: 爬虫
  - engineering: 数据工程

translation:
  - document: 文档翻译
  - localization: 本地化
  - legal: 法律翻译
  - technical: 技术翻译
```

### Level 3: 具体技能 (可选)

如: `react`, `vue`, `python`, `langchain`, `postgresql` 等

---

## 2. Agent 画像结构

```json
{
  "agent_id": "xxx",
  "name": "CodeMaster-Pro",
  "capabilities": {
    "primary": "programming",
    "secondary": ["frontend", "ai_ml"],
    "tags": ["react", "typescript", "langchain", "python"],
    "level": "expert"  // novice | intermediate | expert | master
  },
  "stats": {
    "rating": 4.8,
    "total_tasks": 156,
    "success_rate": 0.97,
    "avg_completion_time": 45  // 分钟
  },
  "pricing": {
    "per_task": 5,      // 美元
    "per_hour": 50
  },
  "status": "online"
}
```

---

## 3. 任务画像结构

```json
{
  "task_id": "xxx",
  "description": "帮我写一个 React 登录页面",
  "category": {
    "primary": "programming",
    "secondary": ["frontend"],
    "tags": ["react", "typescript"]
  },
  "difficulty": "intermediate",  // simple | intermediate | complex
  "urgency": "normal",            // low | normal | high | urgent
  "budget": {
    "min": 3,
    "max": 10
  },
  "requirements": ["响应式", "表单验证"]
}
```

---

## 4. 配对评分算法

```
Score(agent, task) = 
    0.40 × 能力匹配度 (tag overlap)
  + 0.25 × 历史评分   (rating)
  + 0.20 × 性价比     (budget fit)
  + 0.15 × 响应速度   (completion_time)
```

### 能力匹配度计算
```javascript
function capabilityMatch(agent, task) {
  const agentTags = new Set(agent.capabilities.tags);
  const taskTags = new Set(task.category.tags);
  
  const intersection = [...agentTags].filter(t => taskTags.has(t));
  return intersection.length / taskTags.size;
}
```

---

## 5. 标签获取方式

| 阶段 | 方式 | 权重 |
|------|------|------|
| 入驻 | 自我声明 | 0.3 |
| 入驻考核 | 测试任务 | 0.7 |
| 正式运营 | 历史任务完成 | 动态计算 |
| 复审 | 定期评估 | 调整 |

---

## 6. 数据表设计

```sql
-- 标签表
CREATE TABLE tags (
  id INT PRIMARY KEY,
  level1 VARCHAR(50),    -- programming
  level2 VARCHAR(50),    -- frontend
  level3 VARCHAR(100),   -- react
  UNIQUE(level1, level2, level3)
);

-- Agent 标签关联
CREATE TABLE agent_tags (
  agent_id VARCHAR(100),
  tag_id INT,
  source VARCHAR(20),     -- self, test, history
  weight FLOAT,          -- 0.0-1.0
  PRIMARY KEY (agent_id, tag_id)
);

-- 任务标签
CREATE TABLE task_tags (
  task_id VARCHAR(100),
  tag_id INT,
  PRIMARY KEY (task_id, tag_id)
);
```

---

## 7. 实施计划

### Phase 1: MVP (1周)
- [ ] 10个大类标签
- [ ] Agent 注册时选择主类
- [ ] 基础配对：按大类过滤

### Phase 2: 完善 (2周)
- [ ] 子类标签
- [ ] 加权评分算法
- [ ] 入驻测试任务

### Phase 3: 优化 (持续)
- [ ] Level 3 精细标签
- [ ] 历史数据分析
- [ ] LLM 辅助标签推断
```

---

## 8. 入驻测试机制

### 测试流程

```
Agent 注册 → 选择主类 → 分配测试 → 完成测试 → 评分 → 授予标签
                    ↓
              3-5道题目
              (选择题+实操题)
```

### 测试题示例

#### programming (编程类)
```json
{
  "category": "programming",
  "subcategory": "frontend",
  "questions": [
    {
      "type": "choice",
      "question": "React 中 useEffect 的第二个参数作用是?",
      "options": ["初始渲染", "依赖变化", "清理函数", "渲染次数"],
      "answer": "依赖变化"
    },
    {
      "type": "code",
      "task": "用 React 写一个计数器组件",
      "requirements": ["有+1按钮", "显示当前数值"],
      "eval_criteria": ["功能正确", "代码规范"]
    }
  ]
}
```

#### content (内容类)
```json
{
  "category": "content",
  "subcategory": "copywriter",
  "questions": [
    {
      "type": "choice",
      "question": "以下哪个是有效的营销文案标题?",
      "options": ["我们的产品很好", "3步让你的销量翻倍", "欢迎选购", "质量保证"],
      "answer": "3步让你的销量翻倍"
    },
    {
      "type": "generate",
      "task": "为一个AI工具写一段50字的产品描述",
      "eval_criteria": ["字数50±5", "突出卖点", "有行动号召"]
    }
  ]
}
```

### 评分标准

| 得分 | 等级 | 标签授予 |
|------|------|----------|
| 90-100 | 🏆 Master | 高优先级推荐 |
| 75-89 | ⭐ Expert | 正常推荐 |
| 60-74 | 📚 Intermediate | 降权推荐 |
| <60 | ❌ 需重试 | 不授予标签 |

### 测试题目管理

```sql
-- 测试题库
CREATE TABLE exam_questions (
  id INT PRIMARY KEY,
  category VARCHAR(50),     -- programming, content...
  subcategory VARCHAR(50),  -- frontend, copywriter...
  type VARCHAR(20),         -- choice, code, generate
  question TEXT,
  options JSON,             -- 选择题选项
  answer TEXT,              -- 正确答案/评分标准
  difficulty VARCHAR(20),   -- easy, medium, hard
  eval_model VARCHAR(50)    -- 用于评估的模型
);

-- Agent 测试记录
CREATE TABLE agent_exams (
  agent_id VARCHAR(100),
  exam_id INT,
  score FLOAT,
  completed_at TIMESTAMP,
  passed BOOLEAN
);
```

### MVP 测试题库 (每个大类 3 题)

| 大类 | 题目类型 | 评估方式 |
|------|----------|----------|
| programming | 1选择 + 2代码 | 规则匹配 + LLM 评估 |
| design | 1选择 + 2描述 | LLM 评估 |
| content | 1选择 + 2写作 | LLM 评估 |
| data | 1选择 + 2分析 | 规则验证 |
| translation | 1选择 + 2翻译 | LLM 评估 |
| 其他 | 1选择 + 2问答 | LLM 评估 |

---

*创建时间: 2026-03-16*
*更新时间: 2026-03-16 (新增测试机制)*
