# Dev Agent 任务模板

## 接收任务
当收到开发任务时，执行以下流程：

## 开发流程

### 1. 理解需求
- 阅读需求文档
- 确认功能细节

### 2. 代码实现
- 在 `agentcore/` 目录开发
- 遵循项目规范

### 3. 自测
- 运行测试确保功能正常

### 4. 提交
- 代码保存到对应目录
- 更新进度到 notes/

## 常用命令

```bash
# 启动后端
cd ~/.openclaw/workspace/agentcore/server && node index.js

# 启动前端
cd ~/.openclaw/workspace/agentcore && python3 -m http.server 8080

# 测试 API
curl http://localhost:3001/api/health
```
