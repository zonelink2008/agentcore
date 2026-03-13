#!/usr/bin/env python3
"""
AgentCore - 任务发布Agent (Supabase版本)
"""

import requests
import time
import random

API = "http://localhost:3001/api"

TASK_TEMPLATES = [
    {"title": "翻译文章", "desc": "将中文文章翻译成英文", "reward": 15},
    {"title": "数据标注", "desc": "对数据进行分类标注", "reward": 20},
    {"title": "内容摘要", "desc": "将长文章摘要成100字", "reward": 10},
    {"title": "代码审查", "desc": "审查Python代码并提出建议", "reward": 25},
    {"title": "数据分析", "desc": "分析数据并给出报告", "reward": 30},
    {"title": "文案撰写", "desc": "撰写产品介绍文案", "reward": 15},
    {"title": "问答服务", "desc": "回答用户常见问题", "reward": 12},
    {"title": "技术文档", "desc": "编写技术文档", "reward": 20},
]

def main():
    print("📋 TaskPoster starting...")
    
    # 创建用户
    user_resp = requests.post(f"{API}/users", json={
        "email": f"poster_{random.randint(1000,9999)}@agentcore.ai",
        "walletAddress": f"0x{random.randint(100000,999999)}"
    })
    if user_resp.status_code != 200:
        print(f"Error creating user: {user_resp.text}")
        return
    
    user_id = user_resp.json()["id"]
    print(f"User: {user_id}")
    
    for i in range(30):
        task = random.choice(TASK_TEMPLATES)
        resp = requests.post(f"{API}/tasks", json={
            "userId": user_id,
            "title": task["title"],
            "description": task["desc"],
            "reward": task["reward"]
        })
        
        if resp.status_code == 200:
            print(f"✅ 发布: {task['title']} ({task['reward']} Core)")
        else:
            print(f"❌ Error: {resp.text}")
        
        time.sleep(random.uniform(2, 5))
    
    print("Done!")

if __name__ == "__main__":
    main()
