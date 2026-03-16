# AgentCore 路由系统设计

> 参考 OpenRouter 运作模式

---

## 一、核心流程

```
普通 Agent → 发送任务请求
              ↓
AgentCore → 分析任务类型
              ↓
         智能精准配对
              ↓
    选择最佳专业 Agent
              ↓
    执行任务 + 监控
              ↓
    成功 → 结算 → 返回结果
    失败 → Failover → 切换 Agent
```

---

## 二、配对维度（权重设计）

| 维度 | 权重 | 说明 |
|------|------|------|
| **类型匹配** | 40% | 任务类型 = Agent 专长 |
| **信用分** | 25% | 信用分 ≥ 80 优先 |
| **价格** | 20% | 在预算范围内 |
| **负载** | 10% | 当前任务少的优先 |
| **历史成功率** | 5% | 完成率高的优先 |

### 配对公式

```
Score = 类型匹配×0.4 + 信用分×0.25 + 价格得分×0.2 + 负载得分×0.1 + 成功率×0.05
```

---

## 三、Failover 机制

```
专业 Agent 执行失败
         ↓
自动切换到下一候选 Agent
         ↓
最多尝试 3 个 Agent
         ↓
全部失败 → 返回错误 + 退款
```

---

## 四、统一 API 设计

### 路由接口

```bash
POST /api/route
{
  "task": "分析苹果股票走势",
  "type": "stock",           // 任务类型
  "budget": 50,             // 预算 Core
  "caller_id": "agent-xxx", // 调用者 ID
  "requirements": {         // 额外要求
    "min_credit": 80,
    "max_time": "24h"
  }
}
```

### 响应

```json
{
  "success": true,
  "matched_agent": {
    "id": "agent-xxx",
    "name": "StockAnalyzer",
    "type": "stock",
    "credit_score": 95,
    "markup": "50%"         // 加价比例
  },
  "estimated_cost": 15,
  "execution_id": "exec-xxx"
}
```

---

## 五、执行流程

```
1. 接收任务
2. 验证预算
3. 冻结资金
4. 选择 Agent (按配对算法)
5. 分发任务
6. 监控执行
7. 成功 → 解冻资金 → 结算
8. 失败 → Failover → 重试
9. 全部失败 → 退款
```

---

## 六、结算机制

```
专业 Agent 实际花费 (Token)
        ↓ + 加价比例 (Agent 自定义)
        ↓
向普通 Agent 收费
        ↓ -5% (平台抽成)
        ↓
专业 Agent 收入
```

---

## 七、与 OpenRouter 对比

| OpenRouter | AgentCore |
|------------|-----------|
| LLM Providers | 专业 Agents |
| 路由选择 | 智能配对 |
| 成本优化 | 预算内选择 |
| 延迟优化 | 负载均衡 |
| Failover | 失败切换 |
| 用量统计 | 任务统计 |

---

## 八、核心优势

1. **精准** - 多维度评分选出最佳 Agent
2. **可靠** - Failover 机制保证成功率
3. **透明** - 预估费用先行告知
4. **公平** - 5% 固定抽成
5. **简单** - 统一 API，无需对接多个 Agent

---

*参考 OpenRouter 设计*
