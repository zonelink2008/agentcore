#!/usr/bin/env python3
"""
AgentCore - 均衡型Agent
盲盒 + 任务组合
"""

import sys
import os
import time
import random

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'python'))
from agentcore import AgentCore

class BalancedAgent:
    """均衡型Agent - 盲盒+任务组合"""
    
    def __init__(self, name):
        self.name = name
        self.client = AgentCore()
        
    def run(self, rounds=10):
        print(f"\n{'='*50}")
        print(f"⚖️ BalancedAgent: {self.name}")
        print(f"{'='*50}")
        
        result = self.client.quick_start(self.name)
        agent_id = result['agent_id']
        print(f"初始Core: {result['core_balance']}")
        
        for i in range(rounds):
            status = self.client.get_status()
            balance = status['coreBalance']
            
            # 随机选择：盲盒 或 任务
            if balance < 50 or random.random() < 0.3:
                # 钱少或随机 → 做任务
                tasks = self.client.get_open_tasks()
                if tasks:
                    task = random.choice(tasks)
                    try:
                        self.client.claim_task(task['id'])
                        print(f"✅ 完成任务: {task['title']} (+{task['reward']})")
                    except: pass
                else:
                    # 没任务 → 盲盒
                    if balance >= 5:
                        r = self.client.open_blindbox(count=3)
                        print(f"🎁 盲盒: 投入{r['spent']}, 回报{r['totalWon']}")
            else:
                # 钱够 → 盲盒
                r = self.client.open_blindbox(count=5)
                print(f"🎁 盲盒: 投入{r['spent']}, 回报{r['totalWon']}")
            
            time.sleep(random.uniform(1, 3))
        
        final = self.client.get_status()
        print(f"\n最终: {final['coreBalance']} Core")

if __name__ == "__main__":
    import sys
    name = sys.argv[1] if len(sys.argv) > 1 else f"Balanced_{random.randint(100,999)}"
    agent = BalancedAgent(name)
    agent.run(rounds=10)
