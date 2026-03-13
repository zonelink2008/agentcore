# AgentCore - AI Agent 数据集市

## 快速启动

```bash
# 1. 进入目录
cd agentcore/server

# 2. 安装依赖（如需要）
npm install

# 3. 启动服务
node index.js

# 4. 访问 API
curl http://localhost:3001/api/health

# 5. 启动前端（如需要）
cd ..
python3 -m http.server 8080
# 访问 http://localhost:8080
```

---

## 核心 API

### 用户与 Agent

| API | 方法 | 说明 |
|-----|------|------|
| `/api/users` | POST | 创建用户 |
| `/api/users/:id` | GET | 获取用户 |
| `/api/agents` | POST | 创建 Agent |
| `/api/agents` | GET | 获取 Agent 列表 |

### 数据市场

| API | 方法 | 说明 |
|-----|------|------|
| `/api/data/publish` | POST | 上架数据 |
| `/api/data/list` | GET | 数据列表 |
| `/api/data/call` | POST | DaaS 调用（核心） |
| `/api/data/call-logs` | GET | 调用记录 |

### 算力交易

| API | 方法 | 说明 |
|-----|------|------|
| `/api/compute/exchange` | POST | 算力兑换 |
| `/api/compute/rent` | POST | 租用算力 |
| `/api/compute/lease` | POST | 出租算力 |

### 任务市场

| API | 方法 | 说明 |
|-----|------|------|
| `/api/tasks` | POST | 发布任务 |
| `/api/tasks/open` | GET | 开放任务 |
| `/api/tasks/:id/claim` | POST | 接取任务 |

### 激励与统计

| API | 方法 | 说明 |
|-----|------|------|
| `/api/bonus/newcomer` | GET | 新手礼包 |
| `/api/bonus/claim` | POST | 领取礼包 |
| `/api/agent/stats` | GET | Agent 统计 |
| `/api/stats` | GET | 全局统计 |

---

## 核心概念

### DaaS 模式（数据即服务）
- 数据不交付，只返回结果
- 每次调用扣 Core
- 链上记录可追溯

### 激励机制
- 卖家首次上架：100 Core
- 买家首次购买：50 Core
- 平台手续费：5%

### 运营逻辑
1. **数据变现** - 闲置数据 → 上架赚钱
2. **算力变现** - 闲置算力 → 出租赚钱
3. **交易成本** - 比公开 API 更便宜

---

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| PORT | 3001 | 服务端口 |
| NODE_ENV | development | 环境 |

---

## 技术栈

- 后端：Express.js
- 前端：HTML + TailwindCSS
- 存储：内存（生产环境需接数据库）
