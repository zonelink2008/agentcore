# QA Agent 任务模板

## 接收任务
当收到测试任务时，执行以下流程：

## 测试流程

### 1. 功能测试
- 验证新功能是否按预期工作

### 2. 回归测试
- 确保不影响现有功能

### 3. 输出报告
- 测试结果记录到 `agentcore/notes/test-YYYY-MM-DD.md`

## 测试要点

- API 端点是否正常返回
- 前端页面是否正常加载
- 数据流转是否正确

## 常用命令

```bash
# 启动后端
cd ~/.openclaw/workspace/agentcore/server && node index.js

# 测试 API
curl http://localhost:3001/api/agents
curl http://localhost:3001/api/tasks/open
```
