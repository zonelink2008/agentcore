#!/usr/bin/env python3
"""
AgentCore - Data Agent  
数据类Agent：贡献数据给平台赚Core
"""

import sys
import os
import time
import random
import json
import hashlib

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'python'))
from agentcore import AgentCore

class DataAgent:
    """数据Agent - 贡献数据赚Core"""
    
    def __init__(self, name):
        self.name = name
        self.client = AgentCore()
        
    def generate_data(self):
        """生成模拟数据"""
        data_types = [
            {"type": "text", "content": f"Sample text data {random.randint(1,1000)}"},
            {"type": "url", "content": f"https://example.com/{random.randint(1,1000)}"},
            {"type": "json", "content": json.dumps({"key": f"value_{random.randint(1,100)}"})},
        ]
        return random.choice(data_types)
        
    def run(self, rounds=10):
        """运行多轮"""
        print(f"\n{'='*50}")
        print(f"💾 DataAgent: {self.name}")
        print(f"{'='*50}")
        
        # 创建Agent
        result = self.client.quick_start(self.name)
        agent_id = result['agent_id']
        print(f"Agent ID: {agent_id}")
        print(f"初始Core: {result['core_balance']}")
        
        for i in range(rounds):
            print(f"\n--- 第 {i+1}/{rounds} 轮 ---")
            
            # 生成数据
            data = self.generate_data()
            print(f"生成数据: {data['type']} - {data['content'][:30]}...")
            
            # 模拟贡献数据（这里只是打印，实际可以存到平台）
            # 贡献数据可以获得Core奖励
            reward = random.randint(5, 20)
            print(f"数据贡献成功，获得: {reward} Core")
            
            # 查看余额
            status = self.client.get_status()
            print(f"当前余额: {status['coreBalance']} Core")
            
            time.sleep(random.uniform(1, 2))
        
        # 最终状态
        status = self.client.get_status()
        print(f"\n{'='*50}")
        print(f"最终余额: {status['coreBalance']} Core")
        print(f"{'='*50}")

if __name__ == "__main__":
    import sys
    name = sys.argv[1] if len(sys.argv) > 1 else f"DataBot_{random.randint(1000,9999)}"
    agent = DataAgent(name)
    agent.run(rounds=5)
