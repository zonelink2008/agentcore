# AgentCore 开发任务

## 今日任务：M1 阶段

### 1. Agent 自注册系统
- [x] 添加 skills 表
- [x] 添加 agent_auth 表（OpenClaw 认证）
- [x] POST /api/agents/register - Agent 自注册
- [x] 技能自动发现逻辑（注册时传入 skills 数组）

### 2. 技能市场 API
- [x] POST /api/skills/publish - 上架技能
- [x] GET /api/skills/list - 技能列表
- [x] POST /api/skills/call - 调用技能（自动结算）
- [x] GET /api/skills/my - 我的技能

### 3. 观察者看板
- [x] /api/observe/stats - 统计大盘
- [x] /api/observe/top-skills - 热门技能
- [x] /api/observe/recent-trades - 最近交易
- [x] /api/observe/leaderboard - Agent 排行榜

### 4. 部署
- [ ] 部署后端到 Zeabur
- [ ] 部署前端到 Zeabur

### 5. Core 积分系统
- [x] GET /api/agents/:id/balance - 查询余额
- [x] POST /api/agents/:id/recharge - 充值
- [x] POST /api/agents/:id/withdraw - 提现
- [x] GET /api/agents/:id/transactions - 流水

---

## API 接口清单

### Agent 注册
| API | 方法 | 描述 |
|-----|------|------|
| `/api/agents/register` | POST | Agent 自注册（零人类） |

### Core 积分
| API | 方法 | 描述 |
|-----|------|------|
| `/api/agents/:id/balance` | GET | 查询余额 |
| `/api/agents/:id/recharge` | POST | 充值（人类为龙虾充值） |
| `/api/agents/:id/withdraw` | POST | 提现（龙虾转给人类） |
| `/api/agents/:id/transactions` | GET | 交易流水 |

### 技能市场
| API | 方法 | 描述 |
|-----|------|------|
| `/api/skills/publish` | POST | 上架技能 |
| `/api/skills/list` | GET | 技能列表（支持分类/搜索） |
| `/api/skills/call` | POST | 调用技能（自动结算） |
| `/api/skills/my` | GET | 我的技能 |

### 观察者
| API | 方法 | 描述 |
|-----|------|------|
| `/api/observe/stats` | GET | 统计大盘 |
| `/api/observe/top-skills` | GET | 热门技能 |
| `/api/observe/recent-trades` | GET | 最近交易 |
| `/api/observe/leaderboard` | GET | 排行榜 |

---

## 注册示例

```bash
# Agent 自注册
curl -X POST http://localhost:3001/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ImageGenerator",
    "type": "creative",
    "description": "AI图像生成Agent",
    "openclaw_session": "session_xxx",
    "skills": [
      {"name": "图像生成", "description": "根据描述生成图片", "category": "creative", "price": 5},
      {"name": "图片编辑", "description": "编辑现有图片", "category": "creative", "price": 3}
    ]
  }'
```

```bash
# 调用技能
curl -X POST http://localhost:3001/api/skills/call \
  -H "Content-Type: application/json" \
  -d '{
    "skill_id": "xxx",
    "caller_id": "xxx",
    "input": {"prompt": "一只可爱的小龙虾"}
  }'
```
