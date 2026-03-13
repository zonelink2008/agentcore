#!/usr/bin/env python3
"""
AgentCore MCP Server - 简化版
让Agent可以通过MCP协议发现并接入AgentCore平台

用法:
  pip install requests
  python server.py
"""

import json
import sys
import requests

AGENTCORE_API = "http://localhost:3001/api"

def handle_request(data):
    """处理MCP请求"""
    method = data.get("method")
    params = data.get("params", {})
    request_id = data.get("id")
    
    result = None
    
    if method == "tools/list":
        result = {
            "tools": [
                {"name": "get_market_stats", "description": "获取市场统计"},
                {"name": "get_agents", "description": "获取Agent列表"},
                {"name": "get_tasks", "description": "获取开放任务"},
                {"name": "create_agent", "description": "创建Agent"},
                {"name": "claim_task", "description": "认领任务"},
                {"name": "call_ai", "description": "调用AI算力"},
                {"name": "open_blindbox", "description": "开启盲盒"}
            ]
        }
    
    elif method == "tools/call":
        tool = params.get("name")
        args = params.get("arguments", {})
        
        if tool == "get_market_stats":
            r = requests.get(f"{AGENTCORE_API}/market-stats")
            result = r.json()
        
        elif tool == "get_agents":
            r = requests.get(f"{AGENTCORE_API}/agents")
            result = r.json()[:args.get("limit", 10)]
        
        elif tool == "get_tasks":
            r = requests.get(f"{AGENTCORE_API}/tasks/open")
            result = r.json()
        
        elif tool == "create_agent":
            user_r = requests.post(f"{AGENTCORE_API}/users", json={
                "email": args.get("user_email", "mcp@agentcore.ai"),
                "wallet_address": "0xmcp0000"
            })
            user_id = user_r.json()["id"]
            agent_r = requests.post(f"{AGENTCORE_API}/agents", json={
                "userId": user_id,
                "name": args.get("name", "MCP_Agent"),
                "type": "mcp"
            })
            result = agent_r.json()
        
        elif tool == "claim_task":
            r = requests.post(
                f"{AGENTCORE_API}/tasks/{args['task_id']}/claim",
                json={"agentId": args["agent_id"]}
            )
            result = r.json()
        
        elif tool == "call_ai":
            r = requests.post(f"{AGENTCORE_API}/chat", json={
                "agentId": args["agent_id"],
                "provider": args.get("provider", "deepseek"),
                "messages": [{"role": "user", "content": args["message"]}]
            })
            result = r.json()
        
        elif tool == "open_blindbox":
            r = requests.post(f"{AGENTCORE_API}/blindbox/open", json={
                "agentId": args["agent_id"],
                "count": args.get("count", 1)
            })
            result = r.json()
        
        else:
            result = {"error": f"Unknown tool: {tool}"}
    
    else:
        result = {"error": f"Unknown method: {method}"}
    
    return {
        "jsonrpc": "2.0",
        "id": request_id,
        "result": result
    }

def main():
    """MCP Server主循环"""
    print("AgentCore MCP Server running...", file=sys.stderr)
    
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        
        try:
            data = json.loads(line)
            response = handle_request(data)
            print(json.dumps(response), flush=True)
        except Exception as e:
            error = {"jsonrpc": "2.0", "error": {"code": -32600, "message": str(e)}}
            print(json.dumps(error), flush=True)

if __name__ == "__main__":
    main()
