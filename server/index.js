// AgentCore MVP Server
// Simple Express server for Agent registration and Core economy

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// In-memory storage (replace with database later)
const users = new Map();
const agents = new Map();
const tasks = new Map();
const transactions = [];
const dataMarket = []; // 数据市场
const computeProviders = []; // 算力提供商

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json());

// Initialize with some test data
function init() {
  // Create a test user
  const userId = uuidv4();
  users.set(userId, {
    id: userId,
    email: 'test@agentcore.ai',
    coreBalance: 1000,
    createdAt: new Date().toISOString()
  });
  
  console.log('Test user created:', userId);
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// User routes
app.post('/api/users', (req, res) => {
  const { email, walletAddress, name, type } = req.body;
  const isObserver = type === 'observer';
  const user = {
    id: uuidv4(),
    email,
    walletAddress,
    name,
    type, // 'human', 'agent', or 'observer'
    coreBalance: isObserver ? 0 : 100, // No bonus for observers
    createdAt: new Date().toISOString()
  };
  users.set(user.id, user);
  res.json(user);
});

app.get('/api/users/:id', (req, res) => {
  const user = users.get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Agent routes
app.post('/api/agents', (req, res) => {
  const { userId, name, type } = req.body;
  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const agent = {
    id: uuidv4(),
    userId,
    name,
    type: type || 'general',
    coreBalance: 100, // New agent bonus
    status: 'active',
    createdAt: new Date().toISOString()
  };
  agents.set(agent.id, agent);
  
  // Deduct from user balance
  user.coreBalance -= 100;
  users.set(user.id, user);
  
  res.json(agent);
});

app.get('/api/agents', (req, res) => {
  res.json(Array.from(agents.values()));
});

app.get('/api/agents/:id', (req, res) => {
  const agent = agents.get(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json(agent);
});

// Task routes
app.post('/api/tasks', (req, res) => {
  const { userId, title, description, reward } = req.body;
  const task = {
    id: uuidv4(),
    title,
    description,
    reward: reward || 10,
    status: 'open',
    creatorId: userId,
    agentId: null,
    createdAt: new Date().toISOString()
  };
  tasks.set(task.id, task);
  res.json(task);
});

app.get('/api/tasks', (req, res) => {
  res.json(Array.from(tasks.values()));
});

app.get('/api/tasks/open', (req, res) => {
  const openTasks = Array.from(tasks.values()).filter(t => t.status === 'open');
  res.json(openTasks);
});

app.post('/api/tasks/:id/claim', (req, res) => {
  const { agentId } = req.body;
  const task = tasks.get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.status !== 'open') return res.status(400).json({ error: 'Task not available' });
  
  const agent = agents.get(agentId);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  
  task.status = 'assigned';
  task.agentId = agentId;
  tasks.set(task.id, task);
  
  res.json(task);
});

// Transaction routes
app.post('/api/transactions', (req, res) => {
  const { fromAgentId, toAgentId, amount, type } = req.body;
  
  const fromAgent = fromAgentId ? agents.get(fromAgentId) : null;
  const toAgent = toAgentId ? agents.get(toAgentId) : null;
  
  if (fromAgent && fromAgent.coreBalance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  // Deduct from sender
  if (fromAgent) {
    fromAgent.coreBalance -= amount;
    agents.set(fromAgent.id, fromAgent);
  }
  
  // Add to recipient
  if (toAgent) {
    toAgent.coreBalance += amount;
    agents.set(toAgent.id, toAgent);
  }
  
  const transaction = {
    id: uuidv4(),
    fromAgentId,
    toAgentId,
    amount,
    type,
    createdAt: new Date().toISOString()
  };
  transactions.push(transaction);
  
  res.json(transaction);
});

app.get('/api/transactions', (req, res) => {
  res.json(transactions);
});

// Blind box
app.post('/api/blindbox/open', (req, res) => {
  const { agentId, count = 1 } = req.body;
  const agent = agents.get(agentId);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  
  const cost = count; // 1 Core per box
  if (agent.coreBalance < cost) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  agent.coreBalance -= cost;
  
  // Random rewards
  const rewards = [];
  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    let reward;
    if (rand < 0.5) reward = 1;       // 50%: 1 Core
    else if (rand < 0.8) reward = 2;  // 30%: 2 Core
    else if (rand < 0.95) reward = 5; // 15%: 5 Core
    else reward = 10;                  // 5%: 10 Core
    
    rewards.push(reward);
    agent.coreBalance += reward;
  }
  
  agents.set(agent.id, agent);
  
  res.json({
    spent: cost,
    rewards,
    totalWon: rewards.reduce((a, b) => a + b, 0),
    newBalance: agent.coreBalance
  });
});

// Core exchange (simulated)
app.post('/api/exchange/to-compute', (req, res) => {
  const { agentId, amount } = req.body;
  const agent = agents.get(agentId);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  
  if (agent.coreBalance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  // 100 Core = $0.80 compute (20% platform fee)
  const computeValue = amount * 0.008;
  
  agent.coreBalance -= amount;
  agents.set(agent.id, agent);
  
  res.json({
    coreSpent: amount,
    computeValue: computeValue.toFixed(2),
    newBalance: agent.coreBalance
  });
});

const PORT = process.env.PORT || 3001;
init();
// ==================== 数据市场 ====================

// 发布数据到市场
app.post('/api/data/publish', (req, res) => {
  const { agentId, name, description, dataType, price, content } = req.body;
  
  const agent = agents.get(agentId);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  
  const dataItem = {
    id: uuidv4(),
    sellerId: agentId,
    name,
    description,
    dataType: dataType || 'general',
    price: price || 10,
    content: content || '',
    views: 0,
    sales: 0,
    createdAt: new Date().toISOString()
  };
  
  dataMarket.push(dataItem);
  res.json(dataItem);
});

// 获取市场数据列表
app.get('/api/data/list', (req, res) => {
  const { type, limit = 20 } = req.query;
  let list = [...dataMarket].reverse();
  if (type) list = list.filter(d => d.dataType === type);
  res.json(list.slice(0, parseInt(limit)));
});

// 购买数据
app.post('/api/data/buy', (req, res) => {
  const { agentId, dataId } = req.body;
  
  const buyer = agents.get(agentId);
  if (!buyer) return res.status(404).json({ error: 'Buyer not found' });
  
  const dataItem = dataMarket.find(d => d.id === dataId);
  if (!dataItem) return res.status(404).json({ error: 'Data not found' });
  
  if (buyer.coreBalance < dataItem.price) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  const seller = agents.get(dataItem.sellerId);
  
  // 扣款
  buyer.coreBalance -= dataItem.price;
  agents.set(buyer.id, buyer);
  
  // 给卖家付款（平台抽5%）
  const sellerAmount = Math.floor(dataItem.price * 0.95);
  if (seller) {
    seller.coreBalance += sellerAmount;
    agents.set(seller.id, seller);
  }
  
  // 更新销售
  dataItem.sales += 1;
  dataItem.views += 1;
  
  // 记录交易
  transactions.push({
    id: uuidv4(),
    fromAgentId: agentId,
    toAgentId: dataItem.sellerId,
    amount: dataItem.price,
    type: 'data_purchase',
    createdAt: new Date().toISOString()
  });
  
  res.json({
    data: dataItem,
    spent: dataItem.price,
    newBalance: buyer.coreBalance
  });
});

// ==================== 算力兑换 ====================

// 兑换算力（模拟）
app.post('/api/compute/exchange', (req, res) => {
  const { agentId, amount, provider } = req.body;
  
  const agent = agents.get(agentId);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  
  // 100 Core = $0.80 算力
  const computeValue = amount * 0.008;
  
  if (agent.coreBalance < amount) {
    return res.status(400).json({ error: 'Insufficient Core' });
  }
  
  agent.coreBalance -= amount;
  agents.set(agent.id, agent);
  
  // 记录
  transactions.push({
    id: uuidv4(),
    fromAgentId: agentId,
    toAgentId: 'platform',
    amount: amount,
    type: 'compute_exchange',
    provider: provider || 'openai',
    computeValue: computeValue,
    createdAt: new Date().toISOString()
  });
  
  res.json({
    coreSpent: amount,
    computeValue: computeValue.toFixed(2),
    provider: provider || 'openai',
    newBalance: agent.coreBalance
  });
});

// 获取算力提供商
app.get('/api/compute/providers', (req, res) => {
  res.json([
    { id: 'openai', name: 'OpenAI', models: ['gpt-4', 'gpt-3.5-turbo'] },
    { id: 'minimax', name: 'MiniMax', models: ['M2.5', 'M2'] },
    { id: 'anthropic', name: 'Anthropic', models: ['claude-3'] }
  ]);
});

// ==================== 盲盒公示 ====================

// 获取盲盒概率
app.get('/api/blindbox/odds', (req, res) => {
  res.json({
    name: "幸运盲盒",
    price: 1,
    currency: "Core",
    odds: [
      { reward: 1, chance: 50, label: "谢谢参与" },
      { reward: 2, chance: 30, label: "普通奖励" },
      { reward: 5, chance: 15, label: "中奖" },
      { reward: 10, chance: 5, label: "大奖!" }
    ],
    totalSpent: transactions.filter(t => t.type === 'blindbox').reduce((sum, t) => sum + t.amount, 0),
    totalRewarded: transactions.filter(t => t.type === 'blindbox').reduce((sum, t) => sum + (t.reward || 0), 0)
  });
});

// ==================== 排行榜 ====================

// 获取排行榜
app.get('/api/leaderboard', (req, res) => {
  const type = req.query.type || 'core';
  const limit = parseInt(req.query.limit) || 10;
  const agentList = Array.from(agents.values());
  
  if (type === 'core') {
    // Core余额排行
    const sorted = [...agentList].sort((a, b) => (b.coreBalance || 0) - (a.coreBalance || 0));
    return res.json(sorted.slice(0, limit).map((a, i) => ({
      rank: i + 1,
      id: a.id,
      name: a.name,
      coreBalance: a.coreBalance,
      type: a.type
    })));
  }
  
  if (type === 'earned') {
    // 赚取Core排行
    const sorted = [...agentList].sort((a, b) => (b.totalEarned || 0) - (a.totalEarned || 0));
    return res.json(sorted.slice(0, limit).map((a, i) => ({
      rank: i + 1,
      id: a.id,
      name: a.name,
      totalEarned: a.totalEarned || 0,
      type: a.type
    })));
  }
  
  if (type === 'tasks') {
    // 完成任务排行
    const sorted = [...agentList].sort((a, b) => (b.tasksCompleted || 0) - (a.tasksCompleted || 0));
    return res.json(sorted.slice(0, limit).map((a, i) => ({
      rank: i + 1,
      id: a.id,
      name: a.name,
      tasksCompleted: a.tasksCompleted || 0,
      type: a.type
    })));
  }
  
  res.json({ error: 'Invalid type' });
});

// 全局统计
app.get('/api/stats', (req, res) => {
  const agentList = Array.from(agents.values());
  const totalCore = agentList.reduce((sum, a) => sum + (a.coreBalance || 0), 0);
  const totalTx = transactions.length;
  const totalData = dataMarket.length;
  
  res.json({
    agents: agentList.length,
    totalCore,
    transactions: totalTx,
    dataListings: totalData,
    avgCore: Math.round(totalCore / agentList.length) || 0
  });
});

// ==================== 数据评分 ====================

// 评分数据
app.post('/api/data/rate', (req, res) => {
  const { agentId, dataId, rating, comment } = req.body;
  
  const buyer = agents.get(agentId);
  if (!buyer) return res.status(404).json({ error: 'Agent not found' });
  
  const dataItem = dataMarket.find(d => d.id === dataId);
  if (!dataItem) return res.status(404).json({ error: 'Data not found' });
  
  // 初始化评分数组
  if (!dataItem.ratings) dataItem.ratings = [];
  
  // 检查是否已经评分
  const existingRating = dataItem.ratings.find(r => r.agentId === agentId);
  if (existingRating) {
    return res.status(400).json({ error: 'Already rated' });
  }
  
  // 添加评分
  const newRating = {
    agentId,
    rating: Math.min(5, Math.max(1, rating)), // 1-5星
    comment: comment || '',
    createdAt: new Date().toISOString()
  };
  dataItem.ratings.push(newRating);
  
  // 计算平均分
  const totalRating = dataItem.ratings.reduce((sum, r) => sum + r.rating, 0);
  dataItem.avgRating = Math.round(totalRating / dataItem.ratings.length * 10) / 10;
  
  res.json({
    dataId,
    avgRating: dataItem.avgRating,
    totalRatings: dataItem.ratings.length,
    yourRating: newRating
  });
});

// 获取数据详情（含评分）
app.get('/api/data/:id', (req, res) => {
  const dataItem = dataMarket.find(d => d.id === req.params.id);
  if (!dataItem) return res.status(404).json({ error: 'Data not found' });
  res.json(dataItem);
});

// ==================== 算力出租 ====================

// 出租算力
app.post('/api/compute/rent', (req, res) => {
  const { agentId, amount, pricePerUnit, duration } = req.body;
  
  const agent = agents.get(agentId);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  
  if (agent.coreBalance < amount) {
    return res.status(400).json({ error: 'Insufficient Core to rent' });
  }
  
  // 创建出租单
  const listing = {
    id: uuidv4(),
    ownerId: agentId,
    amount, // 出租的算力额度
    pricePerUnit: pricePerUnit || 1, // 每单位Core价格
    duration: duration || 30, // 天数
    status: 'available',
    createdAt: new Date().toISOString()
  };
  
  // 冻结算力
  agent.coreBalance -= amount;
  agent.frozenBalance = (agent.frozenBalance || 0) + amount;
  agents.set(agent.id, agent);
  
  // 保存出租信息
  if (!computeRentals) computeRentals = [];
  computeRentals.push(listing);
  
  res.json(listing);
});

// 租用算力
app.post('/api/compute/lease', (req, res) => {
  const { agentId, listingId } = req.body;
  
  const renter = agents.get(agentId);
  if (!renter) return res.status(404).json({ error: 'Agent not found' });
  
  const listing = computeRentals?.find(l => l.id === listingId);
  if (!listing || listing.status !== 'available') {
    return res.status(404).json({ error: 'Listing not available' });
  }
  
  const totalCost = listing.amount * listing.pricePerUnit;
  if (renter.coreBalance < totalCost) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  // 扣款
  renter.coreBalance -= totalCost;
  agents.set(renter.id, renter);
  
  // 给出租者付款
  const owner = agents.get(listing.ownerId);
  if (owner) {
    owner.frozenBalance = (owner.frozenBalance || 0) - listing.amount;
    owner.coreBalance += totalCost;
    agents.set(owner.id, owner);
  }
  
  // 更新状态
  listing.status = 'rented';
  listing.renterId = agentId;
  
  res.json({
    rented: listing.amount,
    cost: totalCost,
    duration: listing.duration
  });
});

// 获取出租列表
app.get('/api/compute/rentals', (req, res) => {
  if (!computeRentals) return res.json([]);
  const available = computeRentals.filter(l => l.status === 'available');
  res.json(available);
});

// ==================== DaaS 数据调用（核心功能）====================

// 数据调用日志（链上记录）
const dataCallLogs = [];

// DaaS 模式：调用数据 API，返回结果而非数据本身
app.post('/api/data/call', async (req, res) => {
  const { agentId: buyerAgentId, dataId, params = {} } = req.body;
  
  // 验证买家
  const buyer = agents.get(buyerAgentId);
  if (!buyer) return res.status(404).json({ error: 'Agent not found' });
  
  // 查找数据
  const dataItem = dataMarket.find(d => d.id === dataId);
  if (!dataItem) return res.status(404).json({ error: 'Data not found' });
  
  // 检查是否已购买（订阅制或已购买）
  const hasAccess = buyer.purchasedData?.includes(dataId) || 
                    buyer.subscriptions?.some(s => s.dataId === dataId && new Date(s.expireAt) > new Date());
  if (!hasAccess) return res.status(403).json({ error: 'Not purchased or subscription expired' });
  
  // 计费（按调用次数）
  const callCost = dataItem.pricePerCall || 1;
  if (buyer.coreBalance < callCost) {
    return res.status(400).json({ error: 'Insufficient balance for API call' });
  }
  
  // 扣款
  buyer.coreBalance -= callCost;
  agents.set(buyer.id, buyer);
  
  // 返回模拟结果（实际应该调用卖家 API）
  const result = {
    success: true,
    data: dataItem.sampleData || { message: 'Data result from ' + dataItem.name },
    timestamp: new Date().toISOString()
  };
  
  // 链上记录（可追溯）
  const callLog = {
    id: uuidv4(),
    dataId,
    buyerAgentId,
    sellerAgentId: dataItem.sellerId,
    cost: callCost,
    params,
    result: result.data,
    createdAt: new Date().toISOString()
  };
  dataCallLogs.push(callLog);
  
  // 给卖家分成（95%）
  const seller = agents.get(dataItem.sellerId);
  if (seller) {
    const sellerIncome = Math.floor(callCost * 0.95);
    seller.coreBalance += sellerIncome;
    agents.set(seller.id, seller);
  }
  
  // 平台收 5%
  // ...
  
  res.json({
    ...result,
    cost: callCost,
    newBalance: buyer.coreBalance,
    callId: callLog.id
  });
});

// 获取调用记录（链上可追溯）
app.get('/api/data/call-logs', (req, res) => {
  const { agentId, dataId } = req.query;
  let logs = [...dataCallLogs].reverse();
  
  if (agentId) logs = logs.filter(l => l.buyerAgentId === agentId || l.sellerAgentId === agentId);
  if (dataId) logs = logs.filter(l => l.dataId === dataId);
  
  res.json(logs);
});

// ==================== 激励机制 ====================

// 新手礼包检查
app.get('/api/bonus/newcomer', (req, res) => {
  const { agentId } = req.query;
  const agent = agents.get(agentId);
  
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  
  // 检查是否已领取
  if (agent.bonusClaimed?.newcomer) {
    return res.json({ claimed: true, bonus: 0 });
  }
  
  // 首次上架数据奖励
  res.json({ 
    claimed: false, 
    bonus: 100,
    type: 'data_seller_bonus',
    message: '首次上架数据可获得 100 Core'
  });
});

// 领取新手礼包
app.post('/api/bonus/claim', (req, res) => {
  const { agentId, bonusType } = req.body;
  const agent = agents.get(agentId);
  
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  
  const bonusAmounts = {
    'data_seller_bonus': 100,  // 首次上架数据
    'data_buyer_bonus': 50,    // 首次购买数据
    'invite_bonus': 20          // 邀请奖励
  };
  
  const bonus = bonusAmounts[bonusType] || 0;
  if (bonus === 0) return res.status(400).json({ error: 'Invalid bonus type' });
  
  // 检查是否已领取
  if (agent.bonusClaimed?.[bonusType]) {
    return res.status(400).json({ error: 'Bonus already claimed' });
  }
  
  // 发放奖励
  agent.coreBalance += bonus;
  agent.bonusClaimed = agent.bonusClaimed || {};
  agent.bonusClaimed[bonusType] = true;
  agents.set(agent.id, agent);
  
  res.json({
    success: true,
    bonus,
    newBalance: agent.coreBalance
  });
});

// 获取 Agent 统计
app.get('/api/agent/stats', (req, res) => {
  const { agentId } = req.query;
  const agent = agents.get(agentId);
  
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  
  // 计算数据销售量
  const sales = dataMarket.filter(d => d.sellerId === agentId).reduce((sum, d) => sum + (d.sales || 0), 0);
  
  // 计算调用收入
  const callIncome = dataCallLogs
    .filter(l => l.sellerAgentId === agentId)
    .reduce((sum, l) => sum + Math.floor(l.cost * 0.95), 0);
  
  // 获取信用评分
  const ratings = [];
  dataMarket.forEach(d => {
    if (d.ratings) {
      d.ratings.forEach(r => ratings.push(r.rating));
    }
  });
  const avgRating = ratings.length > 0 
    ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length * 10) / 10 
    : 0;
  
  res.json({
    agentId,
    coreBalance: agent.coreBalance,
    dataSales: sales,
    callIncome,
    totalIncome: sales + callIncome,
    avgRating,
    purchasedDataCount: agent.purchasedData?.length || 0,
    subscriptionsCount: agent.subscriptions?.length || 0
  });
});

// ==================== 启动 ====================

app.listen(PORT, () => {
  console.log(`AgentCore API running on port ${PORT}`);
});

init();
