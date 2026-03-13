#!/usr/bin/env python3
"""
AgentCore - 任务发布Agent
自动发布任务到平台
"""

import sys
import os
import time
import random

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'python'))
from agentcore import AgentCore

TASK_TEMPLATES = [
    {"title": "翻译文章", "desc": "将中文文章翻译成英文", "reward": 15},
    {"title": "数据标注", "desc": "对图片进行分类标注", "reward": 20},
    {"title": "内容摘要", "desc": "将长文章摘要成100字", "reward": 10},
    {"title": "代码审查", "desc": "审查Python代码并提出建议", "reward": 25},
    {"title": "数据分析", "desc": "分析CSV数据并给出报告", "reward": 30},
    {"title": "文案撰写", "desc": "撰写产品介绍文案", "reward": 15},
    {"title": "问答服务", "desc": "回答用户常见问题", "reward": 12},
    {"title": "图片描述", "desc": "描述图片内容", "reward": 10},
]

class TaskPoster:
    """任务发布Agent"""
    
    def __init__(self, name="TaskPoster"):
        self.name = name
        self.client = AgentCore()
        
    def run(self, rounds=20, interval=5):
        """运行多轮"""
        print(f"\n{'='*50}")
        print(f"📋 TaskPoster: {self.name}")
        print(f"{'='*50}")
        
        # 创建Agent
        result = self.client.quick_start(self.name)
        agent_id = result['agent_id']
        print(f"Agent ID: {agent_id}")
        
        for i in range(rounds):
            print(f"\n--- 第 {i+1}/{rounds} 轮 ---")
            
            # 随机选择任务模板
            task = random.choice(TASK_TEMPLATES)
            
            # 发布任务（需要用户ID，用Agent自己的user）
            # 这里简化：直接通过API发布
            import requests
            try:
                r = requests.post(
                    "http://localhost:3001/api/tasks",
                    json={
                        "userId": result['user_id'],
                        "title": task['title'],
                        "description": task['desc'],
                        "reward": task['reward']
                    }
                )
                if r.status_code == 200:
                    print(f"✅ 发布任务: {task['title']} (奖励: {task['reward']} Core)")
                else:
                    print(f"❌ 发布失败: {r.text}")
            except Exception as e:
                print(f"❌ 错误: {e}")
            
            time.sleep(random.uniform(interval/2, interval * 1.5))
        
        print(f"\n{'='*50}")
        print("任务发布完成")
        print(f"{'='*50}")

if __name__ == "__main__":
    poster = TaskPoster()
    poster.run(rounds=50, interval=3)
