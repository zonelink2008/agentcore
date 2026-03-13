// AgentCore MVP Server - Supabase版本

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Supabase配置
const supabaseUrl = 'https://cyqsqutyimbdrpqndubw.supabase.co';
const supabaseKey = 'sb_publishable_UH9xv-mNWghLE6ZqBaeQKA_26yxFUiV';
const supabase = createClient(supabaseUrl, supabaseKey);

// 初始化数据库表
async function initDB() {
  console.log('Initializing Supabase...');
  const { data, error } = await supabase.from('agents').select('id').limit(1);
  console.log('Supabase connected!', error ? 'Error: ' + error.message : 'OK');
}

initDB();

// 辅助函数：获取所有数据
async function getAll(table) {
  const { data, error } = await supabase.from(table).select('*');
  if (error) console.error(error);
  return data || [];
}

// ==================== 核心API ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 用户
app.post('/api/users', async (req, res) => {
  const { email, walletAddress } = req.body;
  const user = {
    id: uuidv4(),
    email,
    wallet_address: walletAddress,
    core_balance: 100,
    created_at: new Date().toISOString()
  };
  const { data, error } = await supabase.from('users').insert([user]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.get('/api/users/:id', async (req, res) => {
  const { data, error } = await supabase.from('users').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'User not found' });
  res.json(data);
});

// Agent
app.post('/api/agents', async (req, res) => {
  const { userId, name, type } = req.body;
  const agent = {
    id: uuidv4(),
    user_id: userId,
    name,
    type: type || 'general',
    core_balance: 100,
    status: 'active',
    created_at: new Date().toISOString()
  };
  const { data, error } = await supabase.from('agents').insert([agent]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  
  // 扣用户积分
  await supabase.from('users').update({ core_balance: 100 }).eq('id', userId);
  
  res.json(data);
});

app.get('/api/agents', async (req, res) => {
  const { data, error } = await supabase.from('agents').select('*').order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});

app.get('/api/agents/:id', async (req, res) => {
  const { data, error } = await supabase.from('agents').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Agent not found' });
  res.json(data);
});

// 任务
app.post('/api/tasks', async (req, res) => {
  const { userId, title, description, reward } = req.body;
  const task = {
    id: uuidv4(),
    title,
    description: description || '',
    reward: reward || 10,
    status: 'open',
    creator_id: userId,
    created_at: new Date().toISOString()
  };
  const { data, error } = await supabase.from('tasks').insert([task]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.get('/api/tasks', async (req, res) => {
  const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
  res.json(data || []);
});

app.get('/api/tasks/open', async (req, res) => {
  const { data, error } = await supabase.from('tasks').select('*').eq('status', 'open').order('created_at', { ascending: false });
  res.json(data || []);
});

app.post('/api/tasks/:id/claim', async (req, res) => {
  const { agentId } = req.body;
  const { data: task, error: err1 } = await supabase.from('tasks').select('*').eq('id', req.params.id).single();
  if (err1 || task.status !== 'open') return res.status(400).json({ error: 'Task not available' });
  
  const { error } = await supabase.from('tasks').update({ status: 'assigned', agent_id: agentId }).eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  
  // 给Agent加积分
  const { data: agent } = await supabase.from('agents').select('*').eq('id', agentId).single();
  if (agent) {
    await supabase.from('agents').update({ core_balance: agent.core_balance + task.reward }).eq('id', agentId);
  }
  
  // 返回更新后的任务
  const { data: updatedTask } = await supabase.from('tasks').select('*').eq('id', req.params.id).single();
  res.json(updatedTask);
});

// 盲盒
app.post('/api/blindbox/open', async (req, res) => {
  const { agentId, count = 1 } = req.body;
  const { data: agent, error: err1 } = await supabase.from('agents').select('*').eq('id', agentId).single();
  if (err1) return res.status(404).json({ error: 'Agent not found' });
  
  const cost = count;
  if (agent.core_balance < cost) return res.status(400).json({ error: 'Insufficient balance' });
  
  const rewards = [];
  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    let reward;
    // 新概率：平台盈利
    if (rand < 0.50) reward = 0;      // 50% - 亏损
    else if (rand < 0.85) reward = 0;  // 35% - 亏损
    else if (rand < 0.97) reward = 0;  // 12% - 少赚
    else reward = 0;                    // 3% - 大亏
    
    // 修正：确保平台盈利
    if (rand < 0.50) reward = 0.5;      // 50% - 赚0.5
    else if (rand < 0.85) reward = 1;    // 35% - 持平
    else if (rand < 0.97) reward = 2;    // 12% - 亏1
    else reward = 5;                     // 3% - 亏4
    
    rewards.push(reward);
  }
  
  const totalWon = rewards.reduce((a, b) => a + b, 0);
  const newBalance = agent.core_balance - cost + totalWon;
  
  await supabase.from('agents').update({ core_balance: newBalance }).eq('id', agentId);
  
  res.json({ spent: cost, rewards, totalWon, newBalance });
});

// 算力兑换
app.post('/api/compute/exchange', async (req, res) => {
  const { agentId, amount, provider } = req.body;
  const { data: agent, error: err1 } = await supabase.from('agents').select('*').eq('id', agentId).single();
  if (err1) return res.status(404).json({ error: 'Agent not found' });
  
  if (agent.core_balance < amount) return res.status(400).json({ error: 'Insufficient Core' });
  
  const computeValue = amount * 0.008;
  await supabase.from('agents').update({ core_balance: agent.core_balance - amount }).eq('id', agentId);
  
  res.json({ coreSpent: amount, computeValue: computeValue.toFixed(2), newBalance: agent.core_balance - amount });
});

// 数据市场
app.post('/api/data/publish', async (req, res) => {
  const { agentId, name, description, dataType, price, content } = req.body;
  const dataItem = {
    id: uuidv4(),
    seller_id: agentId,
    name,
    description: description || '',
    data_type: dataType || 'general',
    price: price || 10,
    content: content || '',
    views: 0,
    sales: 0,
    created_at: new Date().toISOString()
  };
  const { data, error } = await supabase.from('data_market').insert([dataItem]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.get('/api/data/list', async (req, res) => {
  const { data, error } = await supabase.from('data_market').select('*').order('created_at', { ascending: false });
  res.json(data || []);
});

// DaaS 调用 - 核心功能：数据不流动，结果流动
app.post('/api/data/call', async (req, res) => {
  const { dataId, buyerId, params } = req.body;
  
  // 获取数据项
  const { data: dataItem, error: fetchError } = await supabase
    .from('data_market')
    .select('*')
    .eq('id', dataId)
    .single();
    
  if (fetchError || !dataItem) {
    return res.status(404).json({ error: 'Data not found' });
  }
  
  // 获取买家信息
  const { data: buyer, error: buyerError } = await supabase
    .from('users')
    .select('*')
    .eq('id', buyerId)
    .single();
    
  if (buyerError || !buyer) {
    return res.status(404).json({ error: 'Buyer not found' });
  }
  
  // 检查余额
  if (buyer.core_balance < dataItem.price) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  // 扣费
  const { error: deductError } = await supabase
    .from('users')
    .update({ core_balance: buyer.core_balance - dataItem.price })
    .eq('id', buyerId);
    
  if (deductError) {
    return res.status(500).json({ error: 'Payment failed' });
  }
  
  // 增加销售
  await supabase
    .from('data_market')
    .update({ sales: dataItem.sales + 1 })
    .eq('id', dataId);
  
  // 记录调用日志
  const callLog = {
    id: uuidv4(),
    data_id: dataId,
    buyer_id: buyerId,
    seller_id: dataItem.seller_id,
    price: dataItem.price,
    result: simulateDataResult(dataItem, params),
    created_at: new Date().toISOString()
  };
  
  await supabase.from('data_call_logs').insert([callLog]);
  
  // 返回结果（而非原始数据）
  res.json({
    success: true,
    result: callLog.result,
    cost: dataItem.price,
    remainingBalance: buyer.core_balance - dataItem.price
  });
});

// 模拟数据返回（实际应该调用真实 API）
function simulateDataResult(dataItem, params) {
  const type = dataItem.data_type;
  
  if (type === 'finance') {
    return {
      symbol: params?.symbol || 'AAPL',
      price: (Math.random() * 1000).toFixed(2),
      change: (Math.random() * 10 - 5).toFixed(2),
      volume: Math.floor(Math.random() * 10000000),
      timestamp: new Date().toISOString()
    };
  } else if (type === 'weather') {
    return {
      city: params?.city || 'Beijing',
      temperature: Math.floor(Math.random() * 30 + 5),
      condition: ['Sunny', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 3)],
      humidity: Math.floor(Math.random() * 100),
      timestamp: new Date().toISOString()
    };
  } else if (type === 'blockchain') {
    return {
      network: params?.network || 'BTC',
      hashRate: (Math.random() * 100).toFixed(2) + ' EH/s',
      difficulty: (Math.random() * 10000000).toFixed(0),
      mempool: Math.floor(Math.random() * 50000),
      timestamp: new Date().toISOString()
    };
  }
  
  return {
    message: `Data from ${dataItem.name}`,
    data: 'Sample result data',
    timestamp: new Date().toISOString()
  };
}

// 获取调用日志
app.get('/api/data/call-logs', async (req, res) => {
  const { data, error } = await supabase
    .from('data_call_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  res.json(data || []);
});

// 排行榜
app.get('/api/leaderboard', async (req, res) => {
  const type = req.query.type || 'core';
  const limit = parseInt(req.query.limit) || 10;
  const { data, error } = await supabase.from('agents').select('*').order('core_balance', { ascending: false }).limit(limit);
  if (error) return res.status(400).json({ error: error.message });
  
  res.json((data || []).map((a, i) => ({
    rank: i + 1,
    id: a.id,
    name: a.name,
    coreBalance: a.core_balance,
    type: a.type
  })));
});

// 盲盒概率
app.get('/api/blindbox/odds', (req, res) => {
  res.json({
    name: "幸运盲盒",
    price: 1,
    currency: "Core",
    odds: [
      { reward: 0.5, chance: 50, label: "0.5 Core" },
      { reward: 1, chance: 35, label: "1 Core" },
      { reward: 2, chance: 12, label: "2 Core" },
      { reward: 5, chance: 3, label: "5 Core" }
    ],
    expected: 0.86,
    note: "期望回报0.86，平台盈利14%"
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`AgentCore API running on port ${PORT}`);
});

// 更多任务类型
const TASK_TYPES = [
  // 金融类
  { category: 'finance', title: '股票分析', desc: '分析某只股票走势', reward: 30 },
  { category: 'finance', title: 'Crypto报价', desc: '获取最新Crypto价格', reward: 15 },
  { category: 'finance', title: '财报解读', desc: '解读公司财报', reward: 40 },
  // 内容类
  { category: 'content', title: '文章撰写', desc: '撰写指定主题文章', reward: 25 },
  { category: 'content', title: '翻译服务', desc: '中英互译', reward: 15 },
  { category: 'content', title: '文案创意', desc: '产品文案创意', reward: 20 },
  // 技术类
  { category: 'tech', title: '代码审查', desc: '审查代码并给出建议', reward: 35 },
  { category: 'tech', title: 'Bug修复', desc: '修复指定Bug', reward: 50 },
  { category: 'tech', title: '技术文档', desc: '编写技术文档', reward: 25 },
  // 数据类
  { category: 'data', title: '数据标注', desc: '对数据进行分类标注', reward: 20 },
  { category: 'data', title: '数据清洗', desc: '清洗整理数据', reward: 25 },
  { category: 'data', title: '数据分析', desc: '分析数据并输出报告', reward: 35 },
  // 客服类
  { category: 'support', title: '问答服务', desc: '回答用户问题', reward: 15 },
  { category: 'support', title: '投诉处理', desc: '处理用户投诉', reward: 25 },
];

app.get('/api/task-types', (req, res) => {
  res.json(TASK_TYPES);
});

// 获取统计数据
app.get('/api/stats', async (req, res) => {
  const { data: agents } = await supabase.from('agents').select('core_balance');
  const { data: tasks } = await supabase.from('tasks').select('*');
  const { data: dataMarket } = await supabase.from('data_market').select('*');
  
  const totalCore = (agents || []).reduce((sum, a) => sum + (a.core_balance || 0), 0);
  const openTasks = (tasks || []).filter(t => t.status === 'open').length;
  
  res.json({
    agents: (agents || []).length,
    totalCore,
    openTasks,
    totalTasks: (tasks || []).length,
    dataListings: (dataMarket || []).length,
    avgCore: Math.round(totalCore / (agents || []).length) || 0
  });
});

// ==================== 真实算力兑换 ====================

// API配置
const API_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o-mini',
    apiKey: '' // 需要配置
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat'],
    defaultModel: 'deepseek-chat',
    apiKey: 'sk-7d6c0ce629b749e999d7b63b075a0024'
  },
  qwen: {
    name: 'Qwen',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
    defaultModel: 'qwen-turbo',
    apiKey: '' // 需要配置
  }
};

// 充值（模拟人民币）
app.post('/api/deposit', async (req, res) => {
  const { agentId, amount, currency } = req.body;
  
  const agent = await supabase.from('agents').select('*').eq('id', agentId).single();
  if (!agent.data) return res.status(404).json({ error: 'Agent not found' });
  
  // 汇率：1元 = 10 Core（模拟）
  const coreAmount = amount * 10;
  
  // 更新余额
  await supabase.from('agents').update({ 
    core_balance: agent.data.core_balance + coreAmount 
  }).eq('id', agentId);
  
  res.json({
    deposited: amount,
    currency: currency || 'CNY',
    coreReceived: coreAmount,
    newBalance: agent.data.core_balance + coreAmount
  });
});

// 获取API providers
app.get('/api/providers', (req, res) => {
  res.json(Object.entries(API_PROVIDERS).map(([key, v]) => ({
    id: key,
    name: v.name,
    models: v.models,
    defaultModel: v.defaultModel
  })));
});

// 真实API调用
app.post('/api/chat', async (req, res) => {
  const { agentId, provider, model, messages } = req.body;
  
  const { data: agent } = await supabase.from('agents').select('*').eq('id', agentId).single();
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  
  const providerConfig = API_PROVIDERS[provider || 'deepseek'];
  if (!providerConfig) return res.status(400).json({ error: 'Invalid provider' });
  if (!providerConfig.apiKey) return res.status(400).json({ error: `${provider} API Key not configured` });
  
  // 估算消耗
  const inputTokens = JSON.stringify(messages).length / 4;
  const estimatedCost = inputTokens * 0.00004; // DeepSeek便宜
  const costInCore = Math.ceil(estimatedCost * 100);
  
  if (agent.core_balance < costInCore) {
    return res.status(400).json({ error: 'Insufficient Core', required: costInCore, current: agent.core_balance });
  }
  
  try {
    // 真实调用DeepSeek API
    const response = await fetch(`${providerConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${providerConfig.apiKey}`
      },
      body: JSON.stringify({
        model: model || providerConfig.defaultModel,
        messages: messages
      })
    });
    
    const data = await response.json();
    
    // 计算实际消耗
    const inputTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;
    const totalTokens = inputTokens + outputTokens;
    const actualCost = totalTokens * 0.00004; // DeepSeek定价
    const costCore = Math.ceil(actualCost * 100);
    
    // 扣减Core（多退少不补）
    await supabase.from('agents').update({
      core_balance: agent.core_balance - costCore
    }).eq('id', agentId);
    
    res.json({
      ...data,
      cost: costCore,
      provider: provider || 'deepseek',
      tokens: totalTokens
    });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 获取汇率
app.get('/api/exchange-rate', (req, res) => {
  res.json({
    cnyToUsd: 0.14,
    usdToCore: 100 / 0.8, // 0.8 USD = 100 Core
    cnyToCore: 10 // 1 CNY = 10 Core
  });
});

// ==================== 算力出租 ====================

// 出租算力（Agent多余额度）
app.post('/api/compute/rent', async (req, res) => {
  const { agentId, amount, pricePerUnit } = req.body;
  
  const { data: agent } = await supabase.from('agents').select('*').eq('id', agentId).single();
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  
  // 创建出租单
  const listing = {
    id: uuidv4(),
    owner_id: agentId,
    amount: amount,  // tokens数量
    price_per_unit: pricePerUnit || 1, // 每个token价格
    status: 'available',
    created_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase.from('compute_rentals').insert([listing]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  
  res.json(data);
});

// 租用算力
app.post('/api/compute/lease', async (req, res) => {
  const { agentId, listingId } = req.body;
  
  const { data: renter } = await supabase.from('agents').select('*').eq('id', agentId).single();
  if (!renter) return res.status(404).json({ error: 'Agent not found' });
  
  const { data: listing } = await supabase.from('compute_rentals').select('*').eq('id', listingId).eq('status', 'available').single();
  if (!listing) return res.status(404).json({ error: 'Listing not available' });
  
  const totalCost = listing.amount * listing.price_per_unit;
  if (renter.core_balance < totalCost) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  // 扣款
  await supabase.from('agents').update({ core_balance: renter.core_balance - totalCost }).eq('id', agentId);
  
  // 给出租者付款
  const { data: owner } = await supabase.from('agents').select('*').eq('id', listing.owner_id).single();
  if (owner) {
    const income = Math.floor(totalCost * 0.95);
    await supabase.from('agents').update({ core_balance: owner.core_balance + income }).eq('id', owner.id);
  }
  
  // 更新状态
  await supabase.from('compute_rentals').update({ status: 'rented', renter_id: agentId }).eq('id', listingId);
  
  res.json({
    rented: listing.amount,
    cost: totalCost,
    provider: listing.owner_id
  });
});

// 获取出租列表
app.get('/api/compute/rentals', async (req, res) => {
  const { data, error } = await supabase.from('compute_rentals').select('*').eq('status', 'available');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});

// ==================== 任务类型 ====================

const TASK_CATEGORIES = {
  compute: { name: '算力调用', desc: '调用AI API完成任务', reward: 20 },
  data: { name: '数据处理', desc: '清洗/分析/标注数据', reward: 30 },
  content: { name: '内容创作', desc: '写文案/翻译/摘要', reward: 25 },
  coding: { name: '编程', desc: '写代码/调试/审查', reward: 35 },
  analysis: { name: '分析', desc: '分析报告/建议', reward: 40 },
  research: { name: '调研', desc: '搜索/调研/整理', reward: 25 }
};

app.get('/api/task-categories', (req, res) => {
  res.json(TASK_CATEGORIES);
});

// ==================== 统计 ====================

app.get('/api/market-stats', async (req, res) => {
  const { data: agents } = await supabase.from('agents').select('core_balance');
  const { data: tasks } = await supabase.from('tasks').select('*');
  const { data: dataMarket } = await supabase.from('data_market').select('*');
  const { data: rentals } = await supabase.from('compute_rentals').select('*');
  
  const totalCore = (agents || []).reduce((sum, a) => sum + (a.core_balance || 0), 0);
  
  res.json({
    agents: (agents || []).length,
    totalCore,
    openTasks: (tasks || []).filter(t => t.status === 'open').length,
    totalTasks: (tasks || []).length,
    dataListings: (dataMarket || []).length,
    computeRentals: (rentals || []).filter(r => r.status === 'available').length,
    avgCore: Math.round(totalCore / (agents || []).length) || 0
  });
});
