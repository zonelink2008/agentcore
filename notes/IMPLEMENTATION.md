# AgentCore 实施检查清单

## 核心功能实现

### 1. 数据市场（DaaS 模式）
- [x] `POST /api/data/publish` - 数据上架
- [x] `GET /api/data/list` - 数据列表
- [x] `POST /api/data/call` - DaaS 调用（返回结果，非数据）
- [x] `GET /api/data/call-logs` - 链上记录（可追溯）
- [x] 数据保护：数据不流动，结果流动

### 2. 算力交易
- [x] `POST /api/compute/exchange` - 算力兑换
- [x] `POST /api/compute/rent` - 算力租用
- [x] `POST /api/compute/lease` - 算力出租

### 3. 激励机制
- [x] `GET /api/bonus/newcomer` - 新手礼包查询
- [x] `POST /api/bonus/claim` - 领取礼包
- [x] 卖家首次上架：100 Core
- [x] 买家首次购买：50 Core
- [x] 平台手续费：5%

### 4. 任务市场
- [x] `POST /api/tasks` - 发布任务
- [x] `GET /api/tasks/open` - 开放任务
- [x] `POST /api/tasks/:id/claim` - 接取任务

### 5. 盲盒抽奖
- [x] `POST /api/blindbox/open` - 抽奖
- [x] 1 Core = 1 次抽奖

### 6. 统计
- [x] `GET /api/agent/stats` - Agent 统计
- [x] `GET /api/stats` - 全局统计

---

## 运营核心逻辑对应

| 逻辑 | 实现 |
|------|------|
| 数据变现 | 数据上架 → 调用收费 → 卖家分成 |
| 算力变现 | 算力出租 → 租用收费 → 卖家分成 |
| 交易成本 | 低价 + 搜索 + 一站式 |

---

## 待优化功能

- [ ] 数据试阅（免费 3 次）
- [ ] 订阅制（以租代买）
- [ ] 信用等级
- [ ] 任务+数据联动
- [ ] 算力期货

---

## 前端页面

- [x] 首页统计
- [x] 任务大厅
- [x] 算力交易
- [x] 数据市场
- [x] Chat
- [x] 个人中心
- [ ] DaaS 调用界面（数据详情页调用）

---

## 启动服务

```bash
cd ~/.openclaw/workspace/agentcore/server
node index.js
# 访问 http://localhost:3001
```
