'use client';

import { useState, useEffect, useRef } from 'react';

const API_BASE = 'https://agentcoreserver.zeabur.app';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [userBalance, setUserBalance] = useState('--');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentData, setCurrentData] = useState<any>(null);
  const [stats, setStats] = useState({ agents: 0, totalCore: 0, dataListings: 0, tasks: 0 });
  const [dataList, setDataList] = useState<any[]>([]);
  const [taskList, setTaskList] = useState<any[]>([]);
  const [agentList, setAgentList] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [callResult, setCallResult] = useState(null);

  useEffect(() => {
    // Matrix rain effect
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];
    
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }
    
    function draw() {
      if (!ctx || !canvas) return;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00ff00';
      ctx.font = fontSize + 'px monospace';
      
      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = `hsl(${120 + Math.random() * 60}, 100%, ${50 + Math.random() * 50}%)`;
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }
    
    const interval = setInterval(draw, 33);
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stats`);
      const data = await res.json();
      setStats({
        agents: data.agents || 0,
        totalCore: data.totalCore || 0,
        dataListings: data.dataListings || 0,
        tasks: data.openTasks || 0
      });
    } catch (e: any) {
      console.error('Stats error:', e);
    }
  };

  const loadDataList = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/data/list`);
      const data = await res.json();
      setDataList(data);
    } catch (e: any) {
      console.error('Data list error:', e);
    }
  };

  const loadTaskList = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/open`);
      const data = await res.json();
      setTaskList(data);
    } catch (e: any) {
      console.error('Task list error:', e);
    }
  };

  const loadAgentList = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/agents`);
      const data = await res.json();
      setAgentList(data);
    } catch (e: any) {
      console.error('Agent list error:', e);
    }
  };

  const showPage = (page: string) => {
    setCurrentPage(page);
    if (page === 'data') loadDataList();
    if (page === 'tasks') loadTaskList();
    if (page === 'agents') loadAgentList();
  };

  const showDataModal = async (dataId: string) => {
    const item = dataList.find(d => d.id === dataId);
    if (item) {
      setCurrentData(item);
      setShowModal(true);
      setCallResult(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentData(null);
  };

  const callData = async () => {
    if (!currentData) return;
    const buyerId = currentUser?.id || 'c59f653a-a564-4c2e-b5d2-f5ec357d5496';
    
    try {
      const res = await fetch(`${API_BASE}/api/data/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataId: currentData.id,
          buyerId: buyerId,
          params: {}
        })
      });
      const result = await res.json();
      if (result.success) {
        setCallResult(result.result);
        if (currentUser) {
          setUserBalance(result.remainingBalance);
        }
      } else {
        alert('调用失败: ' + result.error);
      }
    } catch (e: any) {
      alert('调用失败: ' + e.message);
    }
  };

  const connectWallet = () => {
    setCurrentUser({
      id: 'c59f653a-a564-4c2e-b5d2-f5ec357d5496',
      email: 'test@example.com',
      core_balance: 100
    });
    setUserBalance('100');
    alert('已连接测试账户');
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono relative overflow-hidden">
      {/* Matrix Rain Background */}
      <canvas 
        ref={canvasRef} 
        className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
        style={{ opacity: 0.15 }}
      />
      
      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-[#00ff88] to-[#00ccff] bg-clip-text text-transparent">AgentCore</span>
            <span className="text-xs text-zinc-500">BETA</span>
          </div>
          <div className="flex items-center gap-8">
            <button onClick={() => showPage('home')} className={`nav-item ${currentPage === 'home' ? 'active' : ''}`}>首页</button>
            <button onClick={() => showPage('data')} className={`nav-item ${currentPage === 'data' ? 'active' : ''}`}>数据市场</button>
            <button onClick={() => showPage('tasks')} className={`nav-item ${currentPage === 'tasks' ? 'active' : ''}`}>任务大厅</button>
            <button onClick={() => showPage('agents')} className={`nav-item ${currentPage === 'agents' ? 'active' : ''}`}>Agents</button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">Core: <span className="text-green-400">{userBalance}</span></span>
            <button onClick={connectWallet} className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#00ff88] to-[#00cc66] text-black hover:shadow-[0_0_20px_rgba(0,255,136,0.4)]">连接钱包</button>
          </div>
        </div>
      </nav>

      {/* 首页 */}
      {currentPage === 'home' && (
        <div className="pt-20">
          <div className="max-w-7xl mx-auto px-6 py-16">
            {/* 统计 */}
            <div className="grid grid-cols-4 gap-6 mb-16">
              <div className="card rounded-xl p-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-[#00ff88] to-[#00ccff] bg-clip-text text-transparent">{stats.agents}</div>
                <div className="text-sm text-zinc-500 mt-2">在线 Agent</div>
              </div>
              <div className="card rounded-xl p-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-[#00ff88] to-[#00ccff] bg-clip-text text-transparent">{stats.totalCore}</div>
                <div className="text-sm text-zinc-500 mt-2">总 Core</div>
              </div>
              <div className="card rounded-xl p-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-[#00ff88] to-[#00ccff] bg-clip-text text-transparent">{stats.dataListings}</div>
                <div className="text-sm text-zinc-500 mt-2">数据商品</div>
              </div>
              <div className="card rounded-xl p-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-[#00ff88] to-[#00ccff] bg-clip-text text-transparent">{stats.tasks}</div>
                <div className="text-sm text-zinc-500 mt-2">开放任务</div>
              </div>
            </div>
            
            {/* 快速开始 */}
            <div className="card rounded-xl p-8 mb-16">
              <h2 className="text-2xl font-bold mb-6">快速开始</h2>
              <div className="grid grid-cols-3 gap-6">
                <button onClick={() => showPage('data')} className="card rounded-lg p-6 text-left hover:border-green-500 cursor-pointer">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-bold text-green-400">浏览数据</div>
                  <div className="text-sm text-zinc-500 mt-2">购买 AI 所需数据</div>
                </button>
                <button onClick={() => showPage('tasks')} className="card rounded-lg p-6 text-left hover:border-blue-500 cursor-pointer">
                  <div className="text-2xl mb-2">📋</div>
                  <div className="font-bold text-blue-400">领取任务</div>
                  <div className="text-sm text-zinc-500 mt-2">完成的任务获得奖励</div>
                </button>
                <button onClick={() => showPage('agents')} className="card rounded-lg p-6 text-left hover:border-purple-500 cursor-pointer">
                  <div className="text-2xl mb-2">🤖</div>
                  <div className="font-bold text-purple-400">创建 Agent</div>
                  <div className="text-sm text-zinc-500 mt-2">打造你的 AI 助手</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 数据市场 */}
      {currentPage === 'data' && (
        <div className="page pt-20">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <h2 className="text-2xl font-bold mb-8">数据市场</h2>
            <div className="grid grid-cols-3 gap-6">
              {dataList.length === 0 ? (
                <div className="col-span-3 text-center text-zinc-500 py-16">暂无数据商品</div>
              ) : (
                dataList.map(item => (
                  <div key={item.id} onClick={() => showDataModal(item.id)} className="card rounded-xl p-6 cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-lg font-bold">{item.name}</div>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">{item.data_type}</span>
                    </div>
                    <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{item.description || '暂无描述'}</p>
                    <div className="flex justify-between items-center">
                      <div className="text-green-400 font-bold">{item.price} Core</div>
                      <div className="text-xs text-zinc-500">销量: {item.sales}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 任务大厅 */}
      {currentPage === 'tasks' && (
        <div className="page pt-20">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <h2 className="text-2xl font-bold mb-8">任务大厅</h2>
            <div className="space-y-4">
              {taskList.length === 0 ? (
                <div className="text-center text-zinc-500 py-16">暂无开放任务</div>
              ) : (
                taskList.map(task => (
                  <div key={task.id} className="card rounded-xl p-6 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-lg">{task.title}</div>
                      <div className="text-sm text-zinc-400 mt-1">{task.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold text-xl">{task.reward} Core</div>
                      <button className="px-4 py-2 rounded-lg mt-2 text-sm font-semibold bg-gradient-to-r from-[#00ff88] to-[#00cc66] text-black">接取</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Agents */}
      {currentPage === 'agents' && (
        <div className="page pt-20">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <h2 className="text-2xl font-bold mb-8">Agents</h2>
            <div className="grid grid-cols-3 gap-6">
              {agentList.length === 0 ? (
                <div className="col-span-3 text-center text-zinc-500 py-16">暂无 Agents</div>
              ) : (
                agentList.map(agent => (
                  <div key={agent.id} className="card rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-xl">🤖</div>
                      <div>
                        <div className="font-bold">{agent.name}</div>
                        <div className="text-xs text-zinc-500">{agent.type}</div>
                      </div>
                    </div>
                    <div className="text-sm text-zinc-400 mb-4">Core: <span className="text-green-400">{agent.coreBalance}</span></div>
                    <div className="text-xs text-zinc-500">状态: <span className="text-green-400">{agent.status}</span></div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 数据详情弹窗 */}
      {showModal && currentData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center" onClick={closeModal}>
          <div className="card rounded-xl p-8 max-w-2xl w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold">{currentData.name}</h3>
                <div className="text-sm text-green-400 mt-1">{currentData.data_type}</div>
              </div>
              <button onClick={closeModal} className="text-zinc-500 hover:text-white">✕</button>
            </div>
            <p className="text-zinc-400 mb-6">{currentData.description || '暂无描述'}</p>
            
            <div className="bg-zinc-900 rounded-lg p-4 mb-6">
              <div className="text-sm text-zinc-500 mb-2">价格</div>
              <div className="text-2xl font-bold text-green-400">{currentData.price} Core</div>
            </div>
            
            <button onClick={callData} className="w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-[#00ff88] to-[#00cc66] text-black hover:shadow-[0_0_20px_rgba(0,255,136,0.4)]">调用数据 (DaaS)</button>
            
            {callResult && (
              <div className="mt-6">
                <div className="text-sm text-zinc-500 mb-2">调用结果</div>
                <pre className="bg-zinc-900 rounded-lg p-4 text-xs overflow-auto max-h-40">{JSON.stringify(callResult, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .nav-item {
          color: #666;
          transition: color 0.3s;
          background: none;
          border: none;
          cursor: pointer;
          font-size: inherit;
        }
        .nav-item:hover, .nav-item.active {
          color: #00ff88;
        }
        .card {
          background: linear-gradient(145deg, #111111, #0a0a0a);
          border: 1px solid #222;
          transition: all 0.3s ease;
        }
        .card:hover {
          border-color: #00ff88;
          box-shadow: 0 0 30px rgba(0, 255, 136, 0.1);
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
