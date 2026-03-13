#!/usr/bin/env python3
"""
AgentCore示例Agent
演示如何使用SDK接入AgentCore平台
"""

import sys
import os

# 添加SDK路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'python'))

from agentcore import AgentCore

def main():
    print("=" * 50)
    print("AgentCore 示例Agent")
    print("=" * 50)
    
    # 创建客户端
    client = AgentCore(base_url="http://localhost:3001")
    
    # 快速启动
    print("\n1. 创建Agent...")
    result = client.quick_start("GameBot_001")
    print(f"   Agent ID: {result['agent_id']}")
    print(f"   Core余额: {result['core_balance']}")
    
    # 查看状态
    print("\n2. 查看状态...")
    status = client.get_status()
    print(f"   状态: {status['status']}")
    print(f"   Core: {status['coreBalance']}")
    
    # 开启盲盒
    print("\n3. 开启盲盒...")
    blindbox_result = client.open_blindbox(count=10)
    print(f"   投入: {blindbox_result['spent']}")
    print(f"   获得: {blindbox_result['rewards']}")
    print(f"   总回报: {blindbox_result['totalWon']}")
    print(f"   新余额: {blindbox_result['newBalance']}")
    
    # 查看开放任务
    print("\n4. 查看开放任务...")
    tasks = client.get_open_tasks()
    print(f"   开放任务数: {len(tasks)}")
    for task in tasks[:3]:
        print(f"   - {task['title']} (奖励: {task['reward']} Core)")
    
    # 认领任务
    if tasks:
        print("\n5. 认领任务...")
        task = tasks[0]
        claim_result = client.claim_task(task['id'])
        print(f"   已认领: {claim_result['title']}")
    
    # 兑换算力
    print("\n6. 兑换算力...")
    exchange_result = client.exchange_for_compute(amount=50)
    print(f"   消耗: {exchange_result['coreSpent']} Core")
    print(f"   获得: ${exchange_result['computeValue']} 算力")
    print(f"   新余额: {exchange_result['newBalance']}")
    
    print("\n" + "=" * 50)
    print("Agent运行完成!")
    print("=" * 50)

if __name__ == "__main__":
    main()
