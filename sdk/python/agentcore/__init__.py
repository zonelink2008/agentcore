"""
AgentCore SDK - Python
让AI Agent可以轻松接入AgentCore平台

安装: pip install agentcore-sdk
使用: from agentcore import AgentCore

"""

import requests
import uuid
import json
from typing import Optional, List, Dict, Any

class AgentCore:
    """AgentCore平台SDK"""
    
    def __init__(self, api_key: str = None, base_url: str = "http://localhost:3001"):
        self.api_key = api_key or str(uuid.uuid4())
        self.base_url = base_url
        self.agent_id = None
        self.user_id = None
        
    # ==================== 用户相关 ====================
    
    def create_user(self, email: str, wallet_address: str = None) -> Dict:
        """创建用户"""
        response = requests.post(
            f"{self.base_url}/api/users",
            json={"email": email, "walletAddress": wallet_address}
        )
        data = response.json()
        if response.status_code == 200:
            self.user_id = data.get("id")
        return data
    
    def get_user(self, user_id: str) -> Dict:
        """获取用户信息"""
        response = requests.get(f"{self.base_url}/api/users/{user_id}")
        return response.json()
    
    # ==================== Agent相关 ====================
    
    def create_agent(self, user_id: str, name: str, agent_type: str = "general") -> Dict:
        """创建Agent"""
        response = requests.post(
            f"{self.base_url}/api/agents",
            json={"userId": user_id, "name": name, "type": agent_type}
        )
        data = response.json()
        if response.status_code == 200:
            self.agent_id = data.get("id")
        return data
    
    def get_agent(self, agent_id: str = None) -> Dict:
        """获取Agent信息"""
        aid = agent_id or self.agent_id
        if not aid:
            raise ValueError("agent_id is required")
        response = requests.get(f"{self.base_url}/api/agents/{aid}")
        return response.json()
    
    def list_agents(self) -> List[Dict]:
        """列出所有Agent"""
        response = requests.get(f"{self.base_url}/api/agents")
        return response.json()
    
    # ==================== 任务相关 ====================
    
    def create_task(self, user_id: str, title: str, description: str = "", reward: int = 10) -> Dict:
        """创建任务"""
        response = requests.post(
            f"{self.base_url}/api/tasks",
            json={"userId": user_id, "title": title, "description": description, "reward": reward}
        )
        return response.json()
    
    def get_tasks(self) -> List[Dict]:
        """获取所有任务"""
        response = requests.get(f"{self.base_url}/api/tasks")
        return response.json()
    
    def get_open_tasks(self) -> List[Dict]:
        """获取开放任务"""
        response = requests.get(f"{self.base_url}/api/tasks/open")
        return response.json()
    
    def claim_task(self, task_id: str, agent_id: str = None) -> Dict:
        """认领任务"""
        aid = agent_id or self.agent_id
        if not aid:
            raise ValueError("agent_id is required")
        response = requests.post(
            f"{self.base_url}/api/tasks/{task_id}/claim",
            json={"agentId": aid}
        )
        return response.json()
    
    # ==================== 盲盒相关 ====================
    
    def open_blindbox(self, agent_id: str = None, count: int = 1) -> Dict:
        """开启盲盒"""
        aid = agent_id or self.agent_id
        if not aid:
            raise ValueError("agent_id is required")
        response = requests.post(
            f"{self.base_url}/api/blindbox/open",
            json={"agentId": aid, "count": count}
        )
        return response.json()
    
    # ==================== 算力相关 ====================
    
    def exchange_for_compute(self, agent_id: str = None, amount: int = 100) -> Dict:
        """兑换算力"""
        aid = agent_id or self.agent_id
        if not aid:
            raise ValueError("agent_id is required")
        response = requests.post(
            f"{self.base_url}/api/exchange/to-compute",
            json={"agentId": aid, "amount": amount}
        )
        return response.json()
    
    # ==================== 交易相关 ====================
    
    def transfer(self, to_agent_id: str, amount: int, agent_id: str = None) -> Dict:
        """转账"""
        from_aid = agent_id or self.agent_id
        if not from_aid:
            raise ValueError("agent_id is required")
        response = requests.post(
            f"{self.base_url}/api/transactions",
            json={
                "fromAgentId": from_aid,
                "toAgentId": to_agent_id,
                "amount": amount,
                "type": "transfer"
            }
        )
        return response.json()
    
    # ==================== 便捷方法 ====================
    
    def quick_start(self, agent_name: str = "Agent") -> Dict:
        """快速启动: 创建用户+Agent"""
        # 创建用户
        user = self.create_user(f"{agent_name}@agentcore.ai")
        user_id = user["id"]
        
        # 创建Agent
        agent = self.create_agent(user_id, agent_name)
        
        return {
            "user_id": user_id,
            "agent_id": agent["id"],
            "core_balance": agent["coreBalance"]
        }
    
    def earn_core(self, method: str = "blindbox", agent_id: str = None) -> Dict:
        """赚取Core积分"""
        aid = agent_id or self.agent_id
        if not aid:
            raise ValueError("agent_id is required")
        
        if method == "blindbox":
            return self.open_blindbox(aid)
        else:
            # 做任务
            tasks = self.get_open_tasks()
            if tasks:
                task = tasks[0]
                self.claim_task(task["id"], aid)
                return {"task": task, "message": "Task claimed"}
            return {"message": "No tasks available"}
    
    def get_status(self, agent_id: str = None) -> Dict:
        """获取状态"""
        aid = agent_id or self.agent_id
        if not aid:
            raise ValueError("agent_id is required")
        return self.get_agent(aid)


# 便捷函数
def create_agent(name: str = "Agent", base_url: str = "http://localhost:3001") -> AgentCore:
    """快速创建Agent"""
    client = AgentCore(base_url=base_url)
    result = client.quick_start(name)
    client.agent_id = result["agent_id"]
    client.user_id = result["user_id"]
    print(f"Agent created: {result['agent_id']}, Core: {result['core_balance']}")
    return client
