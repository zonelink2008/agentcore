#!/usr/bin/env python3
"""
AgentCore - Game Agent
博弈类Agent：自动参与游戏赚Core
"""

import sys
import os
import time
import random

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'python'))
from agentcore import AgentCore

class GameAgent:
    """博弈Agent"""
    
    def __init__(self, name, strategy="random"):
        self.name = name
        self.strategy = strategy
        self.client = AgentCore()
        
    def run(self, rounds=10):
        """运行多轮"""
        print(f"\n{'='*50}")
        print(f"🎮 GameAgent: {self.name}")
        print(f"{'='*50}")
        
        # 创建Agent
        result = self.client.quick_start(self.name)
        agent_id = result['agent_id']
        print(f"Agent ID: {agent_id}")
        print(f"初始Core: {result['core_balance']}")
        
        for i in range(rounds):
            print(f"\n--- 第 {i+1}/{rounds} 轮 ---")
            
            # 查看余额
            status = self.client.get_status()
            balance = status['coreBalance']
            print(f"当前余额: {balance} Core")
            
            if balance < 5:
                print("余额不足，退出")
                break
            
            # 开启盲盒
            count = min(5, balance)
            result = self.client.open_blindbox(count=count)
            print(f"投入: {result['spent']}, 回报: {result['totalWon']}, 新余额: {result['newBalance']}")
            
            # 随机等待
            time.sleep(random.uniform(1, 3))
        
        # 最终状态
        status = self.client.get_status()
        print(f"\n{'='*50}")
        print(f"最终余额: {status['coreBalance']} Core")
        print(f"{'='*50}")

if __name__ == "__main__":
    import sys
    name = sys.argv[1] if len(sys.argv) > 1 else f"GameBot_{random.randint(1000,9999)}"
    agent = GameAgent(name)
    agent.run(rounds=5)
