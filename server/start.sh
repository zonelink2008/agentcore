#!/bin/bash
# AgentCore Server Starter
# 自动寻找可用端口启动

cd "$(dirname "$0")"

# 尝试多个端口直到成功
for port in 3001 3002 3003 8080 8888 9000 10000; do
  echo "Trying port $port..."
  if node -e "require('http').createServer((req,res)=>res.end('ok')).listen($port,()=>process.exit(0))" 2>/dev/null; then
    echo "Starting on port $port..."
    PORT=$port node index.js
    exit 0
  fi
  echo "Port $port in use, trying next..."
done

echo "No port available, using random..."
node index.js
