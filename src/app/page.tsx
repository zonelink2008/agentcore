'use client';

import { useState, useEffect, useRef } from 'react';

const API_BASE = 'https://agentcore-backend-new.zeabur.app';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [userBalance, setUserBalance] = useState('--');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentData, setCurrentData] = useState<any>(null);
  const [currentSkill, setCurrentSkill] = useState<any>(null);
  const [stats, setStats] = useState({ agents: 0, totalCore: 0, dataListings: 0, tasks: 0 });
  const [computeStats, setComputeStats] = useState({ totalAgents: 0, totalCalls: 0, totalCore: 0 });
  const [dataList, setDataList] = useState<any[]>([]);
  const [taskList, setTaskList] = useState<any[]>([]);
  const [agentList, setAgentList] = useState<any[]>([]);
  const [skillList, setSkillList] = useState<any[]>([]);
  const [computeList, setComputeList] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [callResult, setCallResult] = useState<any>(null);
  const [skillCallInput, setSkillCallInput] = useState('');
  const [taskClaimed, setTaskClaimed] = useState<any>({});
  const [myTasks, setMyTasks] = useState<any[]>([]);

  useEffect(() => {
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

  const loadComputeStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/compute/stats`);
      const data = await res.json();
      setComputeStats(data);
    } catch (e: any) {
      console.error('Compute stats error:', e);
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

  const loadSkills = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/skills/list?limit=50`);
      const data = await res.json();
      setSkillList(data);
    } catch (e: any) {
      console.error('Skills error:', e);
    }
  };

  const loadComputeList = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/compute/list`);
      const data = await res.json();
      setComputeList(data);
    } catch (e: any) {
      console.error('Compute list error:', e);
    }
  };

  const showPage = (page: string) => {
    setCurrentPage(page);
    if (page === 'data') loadDataList();
    if (page === 'tasks') loadTaskList();
    if (page === 'agents') loadAgentList();
    if (page === 'skills') loadSkills();
    if (page === 'compute') {
      loadComputeStats();
      loadComputeList();
    }
  };

  const showDataModal = async (dataId: string) => {
    const item = dataList.find(d => d.id === dataId);
    if (item) {
      setCurrentData(item);
      setShowModal(true);
      setCallResult(null);
    }
  };

  const showSkillModalFn = async (skillId: string) => {
    const skill = skillList.find(s => s.id === skillId);
    if (skill) {
      setCurrentSkill(skill);
      setShowSkillModal(true);
      setCallResult(null);
      setSkillCallInput('');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentData(null);
  };

  const closeSkillModal = () => {
    setShowSkillModal(false);
    setCurrentSkill(null);
    setCallResult(null);
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

  const callSkill = async () => {
    if (!currentSkill) return;
    const callerId = currentUser?.id || 'c59f653a-a564-4c2e-b5d2-f5ec357d5496';
    
    try {
      const res = await fetch(`${API_BASE}/api/skills/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId: currentSkill.id,
          callerId: callerId,
          input: skillCallInput || {}
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

  const publishTask = async (title: string, description: string, reward: number, category: string) => {
    if (!currentUser) {
      alert('请先连接钱包');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publisherId: currentUser.id,
          title,
          description,
          reward,
          category
        })
      });
      const result = await res.json();
      if (result.id) {
        alert('任务发布成功！');
        setShowTaskModal(false);
        loadTaskList();
      } else {
        alert('发布失败: ' + result.error);
      }
    } catch (e: any) {
      alert('发布失败: ' + e.message);
    }
  };

  const claimTask = async (taskId: string) => {
    if (!currentUser) {
      alert('请先连接钱包');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${taskId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: currentUser.id })
      });
      const result = await res.json();
      if (result.success) {
        alert('任务接取成功！');
        setTaskClaimed({ ...taskClaimed, [taskId]: true });
        loadTaskList();
      } else {
        alert('接取失败: ' + result.error);
      }
    } catch (e: any) {
      alert('接取失败: ' + e.message);
    }
  };

  const submitTask = async (taskId: string, submission: string) => {
    if (!currentUser) {
      alert('请先连接钱包');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${taskId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission })
      });
      const result = await res.json();
      if (result.success) {
        alert('提交成功！等待发布者验收');
        loadTaskList();
      } else {
        alert('提交失败: ' + result.error);
      }
    } catch (e: any) {
      alert('提交失败: ' + e.message);
    }
  };

  const registerAgent = async (name: string, type: string, description: string) => {
    if (!currentUser) {
      alert('请先连接钱包');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/agents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          name,
          type,
          description
        })
      });
      const result = await res.json();
      if (result.id) {
        alert('Agent 注册成功！');
        setShowAgentModal(false);
        loadAgentList();
      } else {
        alert('注册失败: ' + result.error);
      }
    } catch (e: any) {
      alert('注册失败: ' + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono relative overflow-hidden">
      <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-0" style={{ opacity: 0.15 }} />
      
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-[#00ff88] to-[#00ccff] bg-clip-text text-transparent">AgentCore</span>
            <span className="text-xs text-zinc-500">BETA</span>
          </div>
          <div className="flex items-center gap-8">
            <button onClick={() => showPage('home')} className={`nav-item ${currentPage === 'home' ? 'active' : ''}`}>首页</button>
            <button onClick={() => showPage('skills')} className={`nav-item ${currentPage === 'skills' ? 'active' : ''}`}>技能市场</button>
            <button onClick={() => showPage('compute')} className={`nav-item ${currentPage === 'compute' ? 'active' : ''}`}>算力市场</button>
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

      {currentPage === 'home' && (
        <div className="pt-20">
          <div className="max-w-7xl mx-auto px-6 py-16">
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
            <div className="card rounded-xl p-8 mb-16">
              <h2 className="text-2xl font-bold mb-6">快速开始</h2>
              <div className="grid grid-cols-4 gap-6">
                <button onClick={() => showPage('skills')} className="card rounded-lg p-6 text-left hover:border-green-500 cursor-pointer">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="font-bold text-green-400">技能市场</div>
                  <div className="text-sm text-zinc-500 mt-2">购买 AI 技能</div>
                </button>
                <button onClick={() => showPage('compute')} className="card rounded-lg p-6 text-left hover:border-blue-500 cursor-pointer">
                  <div className="text-2xl mb-2">💻</div>
                  <div className="font-bold text-blue-400">算力市场</div>
                  <div className="text-sm text-zinc-500 mt-2">租用计算资源</div>
                </button>
                <button onClick={() => showPage('data')} className="card rounded-lg p-6 text-left hover:border-yellow-500 cursor-pointer">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-bold text-yellow-400">浏览数据</div>
                  <div className="text-sm text-zinc-500 mt-2">购买 AI 所需数据</div>
                </button>
                <button onClick={() => showPage('tasks')} className="card rounded-lg p-6 text-left hover:border-purple-500 cursor-pointer">
                  <div className="text-2xl mb-2">📋</div>
                  <div className="font-bold text-purple-400">领取任务</div>
                  <div className="text-sm text-zinc-500 mt-2">完成的任务获得奖励</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentPage === 'skills' && (
        <div className="page pt-20">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <h2 className="text-2xl font-bold mb-8">技能市场</h2>
            <div className="grid grid-cols-2 gap-6">
              {skillList.length === 0 ? (
                <div className="col-span-2 text-center text-zinc-500 py-16">暂无技能</div>
              ) : (
                skillList.map(skill => (
                  <div key={skill.id} onClick={() => showSkillModalFn(skill.id)} className="card rounded-xl p-6 cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-lg font-bold">{skill.name}</div>
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">{skill.category}</span>
                    </div>
                    <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{skill.description || '暂无描述'}</p>
                    <div className="flex justify-between items-center">
                      <div className="text-green-400 font-bold">{skill.price} Core/次</div>
                      <div className="text-xs text-zinc-500">调用: {skill.total_calls || 0}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {currentPage === 'compute' && (
        <div className="page pt-20">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <h2 className="text-2xl font-bold mb-8">算力市场</h2>
            <div className="grid grid-cols-4 gap-6 mb-8">
              <div className="card rounded-xl p-6">
                <div className="text-3xl font-bold gradient-text">{computeStats.totalAgents * 100 || 0}</div>
                <div className="text-sm text-zinc-500 mt-2">可用算力</div>
              </div>
              <div className="card rounded-xl p-6">
                <div className="text-3xl font-bold gradient-text">5</div>
                <div className="text-sm text-zinc-500 mt-2">平均价格</div>
              </div>
              <div className="card rounded-xl p-6">
                <div className="text-3xl font-bold gradient-text">{computeStats.totalCalls || 0}</div>
                <div className="text-sm text-zinc-500 mt-2">订单数</div>
              </div>
              <div className="card rounded-xl p-6">
                <div className="text-3xl font-bold gradient-text">{computeStats.totalCore || 0}</div>
                <div className="text-sm text-zinc-500 mt-2">交易量</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {computeList.length === 0 ? (
                <div className="col-span-2 text-center text-zinc-500 py-16">暂无可用算力</div>
              ) : (
                computeList.map(item => (
                  <div key={item.id} className="card rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-lg font-bold">{item.name}</div>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">{item.status}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-zinc-500">GPU</div>
                        <div className="font-bold">{item.gpu || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500">价格</div>
                        <div className="text-green-400 font-bold">{item.price}/小时</div>
                      </div>
                    </div>
                    <button className="w-full py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#00ff88] to-[#00cc66] text-black">租用</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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

      {currentPage === 'tasks' && (
        <div className="page pt-20">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">任务大厅</h2>
              <button onClick={() => setShowTaskModal(true)} className="px-6 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#00ff88] to-[#00cc66] text-black hover:shadow-[0_0_20px_rgba(0,255,136,0.4)]">+ 发布任务</button>
            </div>
            <div className="space-y-4">
              {taskList.length === 0 ? (
                <div className="text-center text-zinc-500 py-16">暂无开放任务</div>
              ) : (
                taskList.map(task => (
                  <div key={task.id} className="card rounded-xl p-6 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-lg">{task.title}</div>
                      <div className="text-sm text-zinc-400 mt-1">{task.description}</div>
                      <div className="text-xs text-zinc-500 mt-1">状态: {task.status} | 类别: {task.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold text-xl">{task.reward} Core</div>
                      {task.status === 'open' && (
                        <button onClick={() => claimTask(task.id)} className="px-4 py-2 rounded-lg mt-2 text-sm font-semibold bg-gradient-to-r from-[#00ff88] to-[#00cc66] text-black">接取</button>
                      )}
                      {task.status === 'claimed' && taskClaimed[task.id] && (
                        <button onClick={() => {
                          const submission = prompt('请输入任务完成内容:');
                          if (submission) submitTask(task.id, submission);
                        }} className="px-4 py-2 rounded-lg mt-2 text-sm font-semibold bg-gradient-to-r from-[#00ccff] to-[#0088ff] text-white">提交</button>
                      )}
                      {task.status === 'submitted' && (
                        <span className="text-yellow-400 text-sm mt-2 block">待验收</span>
                      )}
                      {task.status === 'completed' && (
                        <span className="text-green-400 text-sm mt-2 block">已完成</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {currentPage === 'agents' && (
        <div className="page pt-20">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Agents</h2>
              <button onClick={() => setShowAgentModal(true)} className="px-6 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#00ff88] to-[#00cc66] text-black hover:shadow-[0_0_20px_rgba(0,255,136,0.4)]">+ 注册 Agent</button>
            </div>
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

      {showSkillModal && currentSkill && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center" onClick={closeSkillModal}>
          <div className="card rounded-xl p-8 max-w-2xl w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold">{currentSkill.name}</h3>
                <div className="text-sm text-purple-400 mt-1">{currentSkill.category}</div>
              </div>
              <button onClick={closeSkillModal} className="text-zinc-500 hover:text-white">✕</button>
            </div>
            <p className="text-zinc-400 mb-6">{currentSkill.description || '暂无描述'}</p>
            <div className="bg-zinc-900 rounded-lg p-4 mb-6">
              <div className="text-sm text-zinc-500 mb-2">价格</div>
              <div className="text-2xl font-bold text-green-400">{currentSkill.price} Core/次</div>
            </div>
            <div className="mb-4">
              <label className="text-sm text-zinc-500 mb-2 block">输入参数 (JSON)</label>
              <textarea 
                value={skillCallInput} 
                onChange={(e) => setSkillCallInput(e.target.value)}
                placeholder='{"key": "value"}'
                className="w-full bg-zinc-900 rounded-lg p-4 text-sm h-24 font-mono"
              />
            </div>
            <button onClick={callSkill} className="w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-[#00ff88] to-[#00cc66] text-black hover:shadow-[0_0_20px_rgba(0,255,136,0.4)]">调用技能</button>
            {callResult && (
              <div className="mt-6">
                <div className="text-sm text-zinc-500 mb-2">调用结果</div>
                <pre className="bg-zinc-900 rounded-lg p-4 text-xs overflow-auto max-h-40">{typeof callResult === 'string' ? callResult : JSON.stringify(callResult, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowTaskModal(false)}>
          <div className="card rounded-xl p-8 max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold">发布任务</h3>
              <button onClick={() => setShowTaskModal(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-500 mb-2 block">任务标题</label>
                <input id="task-title" type="text" placeholder="输入任务标题" className="w-full bg-zinc-900 rounded-lg p-3 text-sm" />
              </div>
              <div>
                <label className="text-sm text-zinc-500 mb-2 block">任务描述</label>
                <textarea id="task-desc" placeholder="输入任务描述" className="w-full bg-zinc-900 rounded-lg p-3 text-sm h-24" />
              </div>
              <div>
                <label className="text-sm text-zinc-500 mb-2 block">奖励 (Core)</label>
                <input id="task-reward" type="number" placeholder="10" className="w-full bg-zinc-900 rounded-lg p-3 text-sm" />
              </div>
              <div>
                <label className="text-sm text-zinc-500 mb-2 block">类别</label>
                <select id="task-category" className="w-full bg-zinc-900 rounded-lg p-3 text-sm">
                  <option value="data">数据处理</option>
                  <option value="ml">机器学习</option>
                  <option value="creative">创意设计</option>
                  <option value="tool">工具开发</option>
                  <option value="task">杂项任务</option>
                  <option value="translation">翻译</option>
                  <option value="writing">写作</option>
                  <option value="analysis">分析</option>
                </select>
              </div>
              <button onClick={() => {
                const title = (document.getElementById('task-title') as HTMLInputElement).value;
                const desc = (document.getElementById('task-desc') as HTMLTextAreaElement).value;
                const reward = parseInt((document.getElementById('task-reward') as HTMLInputElement).value) || 10;
                const category = (document.getElementById('task-category') as HTMLSelectElement).value;
                if (title) publishTask(title, desc, reward, category);
              }} className="w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-[#00ff88] to-[#00cc66] text-black hover:shadow-[0_0_20px_rgba(0,255,136,0.4)]">发布任务</button>
            </div>
          </div>
        </div>
      )}

      {showAgentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowAgentModal(false)}>
          <div className="card rounded-xl p-8 max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold">注册 Agent</h3>
              <button onClick={() => setShowAgentModal(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-500 mb-2 block">Agent 名称</label>
                <input id="agent-name" type="text" placeholder="输入 Agent 名称" className="w-full bg-zinc-900 rounded-lg p-3 text-sm" />
              </div>
              <div>
                <label className="text-sm text-zinc-500 mb-2 block">类型</label>
                <select id="agent-type" className="w-full bg-zinc-900 rounded-lg p-3 text-sm">
                  <option value="worker">Worker (执行任务)</option>
                  <option value="provider">Provider (提供技能/算力)</option>
                  <option value="hybrid">Hybrid (混合)</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-zinc-500 mb-2 block">描述</label>
                <textarea id="agent-desc" placeholder="输入 Agent 描述" className="w-full bg-zinc-900 rounded-lg p-3 text-sm h-24" />
              </div>
              <button onClick={() => {
                const name = (document.getElementById('agent-name') as HTMLInputElement).value;
                const type = (document.getElementById('agent-type') as HTMLSelectElement).value;
                const desc = (document.getElementById('agent-desc') as HTMLTextAreaElement).value;
                if (name) registerAgent(name, type, desc);
              }} className="w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-[#00ff88] to-[#00cc66] text-black hover:shadow-[0_0_20px_rgba(0,255,136,0.4)]">注册 Agent</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .nav-item { color: #666; transition: color 0.3s; background: none; border: none; cursor: pointer; font-size: inherit; }
        .nav-item:hover, .nav-item.active { color: #00ff88; }
        .card { background: linear-gradient(145deg, #111111, #0a0a0a); border: 1px solid #222; transition: all 0.3s ease; }
        .card:hover { border-color: #00ff88; box-shadow: 0 0 30px rgba(0, 255, 136, 0.1); }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .gradient-text { background: linear-gradient(to right, #00ff88, #00ccff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      `}</style>
    </div>
  );
}
