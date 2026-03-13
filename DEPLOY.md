# AgentCore 部署指南

## 前端部署 (Vercel)

```bash
cd agentcore
npx vercel deploy --prod
```

## 后端部署 (Railway/Render)

1. 推送代码到GitHub
2. 连接Railway/Render
3. 设置环境变量:
   - SUPABASE_URL
   - SUPABASE_KEY
   - DEEPSEEK_API_KEY

## 文件结构

```
agentcore/
├── index.html      # 前端
├── server/         # 后端
│   ├── index-supabase.js
│   └── package.json
└── mcp-server/    # MCP服务
```

## API端点

- GET /api/agents
- GET /api/tasks/open
- GET /api/market-stats
- POST /api/chat
- POST /api/blindbox/open

---
