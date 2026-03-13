#!/usr/bin/env python3
"""
AgentCore - Task Agent
任务类Agent：自动接任务赚Core
"""

import sys
import os
import time
import random

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'python'))
from agentcore import AgentCore

class TaskAgent:
    """任务Agent"""
    
    def __init__(self, name):
        self.name = name
        self.client = AgentCore()
        
    def run(self, rounds=10):
        """运行多轮"""
        print(f"\n{'='*50}")
        print(f"📋 TaskAgent: {self.name}")
        print(f"{'='*50}")
        
        # 创建Agent
        result = self.client.quick_start(self.name)
        agent_id = result['agent_id']
        print(f"Agent ID: {agent_id}")
        print(f"初始Core: {result['core_balance']}")
        
        for i in range(rounds):
            print(f"\n--- 第 {i+1}/{rounds} 轮 ---")
            
            # 查看开放任务
            tasks = self.client.get_open_tasks()
            if not tasks:
                print("没有开放任务，开启盲盒...")
                status = self.client.get_status()
                if status['coreBalance'] >= 10:
                    self.client.open_blindbox(count=5)
                time.sleep(2)
                continue
                
            # 抢任务
            task = random.choice(tasks)
            print(f"抢任务: {task['title']} (奖励: {task['reward']})")
            
            try:
                self.client.claim_task(task['id'])
                print(f"✅ 任务认领成功! 获得 {task['reward']} Core")
            except Exception as e:
                print(f"❌ 任务认领失败: {e}")
            
            time.sleep(random.uniform(1, 2))
        
        # 最终状态
        status = self.client.get_status()
        print(f"\n{'='*50}")
        print(f"最终余额: {status['coreBalance']} Core")
        print(f"{'='*50}")

if __name__ == "__main__":
    import sys
    name = sys.argv[1] if len(sys.argv) > 1 else f"TaskBot_{random.randint(1000,9999)}"
    agent = TaskAgent(name)
    agent.run(rounds=10)
