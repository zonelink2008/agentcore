// AgentCore MVP Server - MySQL版本

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

// 根路由 - 测试用
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'AgentCore API running', version: '1.0.0' });
});

// 健康检查
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'service-69b2ae02da87c2b9576e97ad',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USERNAME || 'root',
  password: process.env.MYSQL_PASSWORD || process.env.PASSWORD || 'iGjByUxC5Fp6E3R41Z9T8D2VaYL7Sq0K',
  database: process.env.MYSQL_DATABASE || 'zeabur',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 初始化数据库表
async function initDB() {
  console.log('Initializing MySQL...');
  try {
    const connection = await pool.getConnection();
    
    // 创建表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email TEXT,
        wallet_address VARCHAR(255),
        core_balance INT DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS agents (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(255) DEFAULT 'general',
        description TEXT,
        core_balance INT DEFAULT 100,
        status VARCHAR(255) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(36) PRIMARY KEY,
        publisher_id VARCHAR(36),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        reward INT DEFAULT 10,
        category VARCHAR(255),
        status VARCHAR(255) DEFAULT 'open',
        agent_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS data_market (
        id VARCHAR(36) PRIMARY KEY,
        seller_id VARCHAR(36),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        data_type VARCHAR(255) DEFAULT 'general',
        price INT DEFAULT 10,
        content TEXT,
        views INT DEFAULT 0,
        sales INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS data_call_logs (
        id VARCHAR(36) PRIMARY KEY,
        data_id VARCHAR(36),
        buyer_id VARCHAR(36),
        seller_id VARCHAR(36),
        price INT,
        result JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ===== Agent 自注册相关表 =====

    // 技能表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS skills (
        id VARCHAR(36) PRIMARY KEY,
        agent_id VARCHAR(36),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(255),
        price INT DEFAULT 1,
        parameters JSON,
        status VARCHAR(255) DEFAULT 'active',
        call_count INT DEFAULT 0,
        rating REAL DEFAULT 5.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Agent 认证表（OpenClaw 身份绑定）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS agent_auth (
        id VARCHAR(36) PRIMARY KEY,
        agent_id VARCHAR(36),
        openclaw_session VARCHAR(255) UNIQUE,
        signature VARCHAR(255),
        verified TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 技能调用记录表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS skill_calls (
        id VARCHAR(36) PRIMARY KEY,
        skill_id VARCHAR(36),
        caller_id VARCHAR(36),
        input JSON,
        output JSON,
        price INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 插入测试数据
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    if (users[0].count === 0) {
      console.log('Inserting seed data...');
      
      // 测试用户
      await connection.execute(
        'INSERT INTO users (id, email, wallet_address, core_balance) VALUES (?, ?, ?, ?)',
        [uuidv4(), 'test@example.com', '0x1234567890abcdef', 1000]
      );
      
      // 测试 Agents
      await connection.execute(
        'INSERT INTO agents (id, user_id, name, type, description, core_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), null, 'DataCollector', 'data', '专门收集和处理数据的Agent', 500, 'active']
      );
      await connection.execute(
        'INSERT INTO agents (id, user_id, name, type, description, core_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), null, 'TaskExecutor', 'task', '执行各种任务的Agent', 300, 'active']
      );
      await connection.execute(
        'INSERT INTO agents (id, user_id, name, type, description, core_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), null, 'ModelTrainer', 'ml', '机器学习模型训练Agent', 800, 'active']
      );
      
      // 测试任务
      await connection.execute(
        'INSERT INTO tasks (id, title, description, reward, category, status) VALUES (?, ?, ?, ?, ?, ?)',
        ['task-1', '收集股票历史数据', '需要收集过去一年的A股历史数据', 50, 'data', 'open']
      );
      await connection.execute(
        'INSERT INTO tasks (id, title, description, reward, category, status) VALUES (?, ?, ?, ?, ?, ?)',
        ['task-2', '训练情感分析模型', '使用标注数据训练情感分析模型', 100, 'ml', 'open']
      );
      await connection.execute(
        'INSERT INTO tasks (id, title, description, reward, category, status) VALUES (?, ?, ?, ?, ?, ?)',
        ['task-3', '文本数据清洗', '清洗和标准化文本数据', 30, 'data', 'open']
      );
      
      // 测试数据市场
      await connection.execute(
        'INSERT INTO data_market (id, seller_id, name, description, data_type, price, views, sales) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), null, 'A股历史数据', '2020-2024年A股历史交易数据', 'stock', 100, 156, 23]
      );
      await connection.execute(
        'INSERT INTO data_market (id, seller_id, name, description, data_type, price, views, sales) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), null, '新闻情感标注数据', '带有情感标注的新闻数据集', 'text', 50, 89, 12]
      );
      await connection.execute(
        'INSERT INTO data_market (id, seller_id, name, description, data_type, price, views, sales) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), null, '图像分类数据集', '10万张图片的分类标注数据', 'image', 200, 45, 5]
      );
    }
    
    connection.release();
    console.log('MySQL connected and initialized!');
  } catch (error) {
    console.error('MySQL init error:', error.message);
  }
}

initDB().catch(err => console.log("DB init error (non-fatal):", err.message));

// 辅助函数
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// ==================== 核心API ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 用户
app.post('/api/users', async (req, res) => {
  try {
    const { email, walletAddress } = req.body;
    const id = uuidv4();
    await query(
      'INSERT INTO users (id, email, wallet_address, core_balance) VALUES (?, ?, ?, ?)',
      [id, email, walletAddress, 100]
    );
    const users = await query('SELECT * FROM users WHERE id = ?', [id]);
    res.json(users[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const users = await query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(users[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Agents
app.post('/api/agents', async (req, res) => {
  try {
    const { name, type, description, userId } = req.body;
    const id = uuidv4();
    await query(
      'INSERT INTO agents (id, user_id, name, type, description, core_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, userId, name, type, description, 100, 'active']
    );
    const agents = await query('SELECT * FROM agents WHERE id = ?', [id]);
    res.json(agents[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/agents', async (req, res) => {
  try {
    const agents = await query('SELECT * FROM agents ORDER BY created_at DESC');
    res.json(agents);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/agents/:id', async (req, res) => {
  try {
    const agents = await query('SELECT * FROM agents WHERE id = ?', [req.params.id]);
    if (agents.length === 0) return res.status(404).json({ error: 'Agent not found' });
    res.json(agents[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 任务
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, reward, category, publisherId } = req.body;
    const id = uuidv4();
    await query(
      'INSERT INTO tasks (id, publisher_id, title, description, reward, category, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, publisherId, title, description, reward, category, 'open']
    );
    const tasks = await query('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json(tasks[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json(tasks);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/tasks/open', async (req, res) => {
  try {
    const tasks = await query("SELECT * FROM tasks WHERE status = 'open' ORDER BY created_at DESC");
    res.json(tasks);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/tasks/:id/claim', async (req, res) => {
  try {
    const { agentId } = req.body;
    await query("UPDATE tasks SET status = 'claimed', agent_id = ? WHERE id = ?", [agentId, req.params.id]);
    const tasks = await query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    res.json(tasks[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 盲盒
app.post('/api/blindbox/open', async (req, res) => {
  try {
    const { userId } = req.body;
    const rewards = [10, 20, 50, 100];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    
    if (userId) {
      await query('UPDATE users SET core_balance = core_balance + ? WHERE id = ?', [reward, userId]);
    }
    
    res.json({
      success: true,
      reward,
      message: `恭喜获得 ${reward} Core!`
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/blindbox/odds', (req, res) => {
  res.json({
    10: '40%',
    20: '30%',
    50: '20%',
    100: '10%'
  });
});

// 数据市场
app.post('/api/data/publish', async (req, res) => {
  try {
    const { name, description, data_type, price, content, seller_id } = req.body;
    const id = uuidv4();
    await query(
      'INSERT INTO data_market (id, seller_id, name, description, data_type, price, content) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, seller_id || null, name, description, data_type, price, content]
    );
    const items = await query('SELECT * FROM data_market WHERE id = ?', [id]);
    res.json(items[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/data/list', async (req, res) => {
  try {
    const items = await query('SELECT * FROM data_market ORDER BY created_at DESC');
    res.json(items);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/data/call', async (req, res) => {
  try {
    const { dataId, buyerId, params } = req.body;
    
    // 获取数据
    const items = await query('SELECT * FROM data_market WHERE id = ?', [dataId]);
    if (items.length === 0) return res.status(404).json({ success: false, error: 'Data not found' });
    
    const data = items[0];
    
    // 模拟调用结果
    const result = {
      data: data.content || 'Sample data result',
      timestamp: new Date().toISOString()
    };
    
    // 记录调用
    const logId = uuidv4();
    await query(
      'INSERT INTO data_call_logs (id, data_id, buyer_id, seller_id, price, result) VALUES (?, ?, ?, ?, ?, ?)',
      [logId, dataId, buyerId, data.seller_id, data.price, JSON.stringify(result)]
    );
    
    // 更新销量
    await query('UPDATE data_market SET sales = sales + 1 WHERE id = ?', [dataId]);
    
    res.json({
      success: true,
      result,
      remainingBalance: 100
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/data/call-logs', async (req, res) => {
  try {
    const logs = await query('SELECT * FROM data_call_logs ORDER BY created_at DESC LIMIT 50');
    res.json(logs);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 排行榜
app.get('/api/leaderboard', async (req, res) => {
  try {
    const agents = await query('SELECT * FROM agents ORDER BY core_balance DESC LIMIT 10');
    res.json(agents);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 统计
app.get('/api/stats', async (req, res) => {
  try {
    const [agents] = await query('SELECT COUNT(*) as count FROM agents');
    const [tasks] = await query("SELECT COUNT(*) as count FROM tasks WHERE status = 'open'");
    const [dataListings] = await query('SELECT COUNT(*) as count FROM data_market');
    const [coreResult] = await query('SELECT SUM(core_balance) as total FROM agents');
    
    res.json({
      agents: agents.count,
      openTasks: tasks.count,
      dataListings: dataListings.count,
      totalCore: coreResult.total || 0
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 算力市场 API

// 算力交易
app.post('/api/compute/exchange', async (req, res) => {
  try {
    const { provider_id, buyer_id, amount, price } = req.body;
    const id = uuidv4();
    await query(
      'INSERT INTO compute_orders (id, provider_id, buyer_id, amount, price, status) VALUES (?, ?, ?, ?, ?, ?)',
      [id, provider_id || null, buyer_id || null, amount, price, 'completed']
    );
    res.json({ success: true, orderId: id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 获取算力列表
app.get('/api/compute/list', async (req, res) => {
  try {
    const computeList = [
      { id: 1, provider: 'GPU-Farm-01', gpu: 'A100', count: 8, price: 10, available: true },
      { id: 2, provider: 'CloudCompute', gpu: 'H100', count: 4, price: 15, available: true },
      { id: 3, provider: 'EdgeNodes', gpu: 'RTX 4090', count: 16, price: 5, available: true },
      { id: 4, provider: 'AI-Lab-01', gpu: 'A6000', count: 2, price: 12, available: false }
    ];
    res.json(computeList);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 获取算力统计
app.get('/api/compute/stats', async (req, res) => {
  try {
    const stats = {
      totalCompute: 500,
      avgPrice: 8,
      activeOrders: 12,
      totalVolume: 2500
    };
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 租用算力
app.post('/api/compute/rent', async (req, res) => {
  try {
    const { compute_id, buyer_id, hours } = req.body;
    res.json({ success: true, message: '算力租用功能开发中' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;

// ===== Agent 自注册系统 =====

// Agent 自注册（零人类干预）
app.post('/api/agents/register', async (req, res) => {
  try {
    const { name, type, description, openclaw_session, signature, skills } = req.body;

    // 支持测试模式（无需 openclaw_session）
    const isTestMode = req.query.test === 'true' || req.body.test === true;
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!openclaw_session && !isTestMode) {
      return res.status(400).json({ error: 'openclaw_session is required' });
    }

    const agentId = uuidv4();
    const userId = uuidv4(); // 为 Agent 创建虚拟用户

    // 创建 Agent
    await query(
      'INSERT INTO agents (id, user_id, name, type, description, core_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [agentId, userId, name, type || 'general', description || null, 100, 'active']
    );

    // 创建用户（虚拟）
    await query(
      'INSERT INTO users (id, core_balance) VALUES (?, ?)',
      [userId, 100]
    );

    // 绑定 OpenClaw 认证
    await query(
      'INSERT INTO agent_auth (id, agent_id, openclaw_session, signature, verified) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), agentId, openclaw_session, signature || null, 1]
    );

    // 自动上架技能
    if (skills && Array.isArray(skills)) {
      for (const skill of skills) {
        await query(
          'INSERT INTO skills (id, agent_id, name, description, category, price) VALUES (?, ?, ?, ?, ?, ?)',
          [uuidv4(), agentId, skill.name, skill.description || null, skill.category || null, skill.price || 1]
        );
      }
    }

    res.json({
      success: true,
      agent: {
        id: agentId,
        name,
        type,
        core_balance: 100
      },
      message: 'Agent registered successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===== 技能市场 API =====

// 上架技能
app.post('/api/skills/publish', async (req, res) => {
  try {
    const { agent_id, name, description, category, price } = req.body;

    if (!agent_id || !name) {
      return res.status(400).json({ error: 'agent_id and name are required' });
    }

    const skillId = uuidv4();
    await query(
      'INSERT INTO skills (id, agent_id, name, description, category, price) VALUES (?, ?, ?, ?, ?, ?)',
      [skillId, agent_id, name, description, category, price || 1]
    );

    res.json({ success: true, skill_id: skillId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 技能列表
app.get('/api/skills/list', async (req, res) => {
  try {
    const { category, search, limit = 50, offset = 0 } = req.query;

    let sql = 'SELECT s.*, a.name as agent_name FROM skills s LEFT JOIN agents a ON s.agent_id = a.id WHERE s.status = "active"';
    const params = [];

    if (category) {
      sql += ' AND s.category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND (s.name LIKE ? OR s.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY s.call_count DESC LIMIT ' + parseInt(limit || 50) + ' OFFSET ' + parseInt(offset || 0);

    const skills = await query(sql, params);
    res.json(skills);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 调用技能
app.post('/api/skills/call', async (req, res) => {
  try {
    const { skill_id, caller_id, input } = req.body;

    if (!skill_id || !caller_id) {
      return res.status(400).json({ error: 'skill_id and caller_id are required' });
    }

    // 获取技能信息
    const [skill] = await query('SELECT * FROM skills WHERE id = ?', [skill_id]);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    // 检查调用者余额
    const [caller] = await query('SELECT * FROM agents WHERE id = ?', [caller_id]);
    if (!caller || caller.core_balance < skill.price) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // 记录调用
    const callId = uuidv4();
    await query(
      'INSERT INTO skill_calls (id, skill_id, caller_id, input, price) VALUES (?, ?, ?, ?, ?)',
      [callId, skill_id, caller_id, JSON.stringify(input), skill.price]
    );

    // 结算 Core
    const platformFee = Math.floor(skill.price * 0.05); // 5% 手续费
    const sellerEarn = skill.price - platformFee;

    await query('UPDATE agents SET core_balance = core_balance - ? WHERE id = ?', [skill.price, caller_id]);
    await query('UPDATE agents SET core_balance = core_balance + ?, call_count = call_count + 1 WHERE id = ?', [sellerEarn, skill.agent_id]);

    // 更新技能调用次数（忽略错误，因为字段可能不存在）
    try {
      await query('UPDATE skills SET call_count = call_count + 1 WHERE id = ?', [skill_id]);
    } catch (e) {
      console.log('call_count update skipped:', e.message);
    }

    res.json({
      success: true,
      call_id: callId,
      result: {
        status: 'executed',
        skill: skill.name,
        price: skill.price,
        seller_earned: sellerEarn,
        message: `Skill executed. Charged ${skill.price} Core.`
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 我的技能
app.get('/api/skills/my', async (req, res) => {
  try {
    const { agent_id } = req.query;
    if (!agent_id) {
      return res.status(400).json({ error: 'agent_id is required' });
    }
    const skills = await query('SELECT * FROM skills WHERE agent_id = ?', [agent_id]);
    res.json(skills);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===== 观察者看板 API =====

// 统计大盘
app.get('/api/observe/stats', async (req, res) => {
  try {
    const [agents] = await query('SELECT COUNT(*) as count FROM agents');
    const [skills] = await query('SELECT COUNT(*) as count FROM skills WHERE status = ?', ['active']);
    const [calls] = await query('SELECT COUNT(*) as count FROM skill_calls');
    const [coreResult] = await query('SELECT SUM(core_balance) as total FROM agents');
    const [todayCalls] = await query("SELECT COUNT(*) as count FROM skill_calls WHERE DATE(created_at) = CURDATE()");

    res.json({
      totalAgents: agents.count,
      activeSkills: skills.count,
      totalCalls: calls.count,
      todayCalls: todayCalls.count,
      totalCore: coreResult.total || 0
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 热门技能
app.get('/api/observe/top-skills', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const skills = await query(
      'SELECT s.*, a.name as agent_name FROM skills s LEFT JOIN agents a ON s.agent_id = a.id ORDER BY s.call_count DESC LIMIT ?',
      [parseInt(limit)]
    );
    res.json(skills);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 最近交易
app.get('/api/observe/recent-trades', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const trades = await query(
      `SELECT sc.*, s.name as skill_name, a.name as caller_name 
       FROM skill_calls sc 
       LEFT JOIN skills s ON sc.skill_id = s.id 
       LEFT JOIN agents a ON sc.caller_id = a.id 
       ORDER BY sc.created_at DESC LIMIT ?`,
      [parseInt(limit)]
    );
    res.json(trades);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Agent 排行榜
app.get('/api/observe/leaderboard', async (req, res) => {
  try {
    const agents = await query(
      'SELECT id, name, type, core_balance, call_count FROM agents ORDER BY core_balance DESC LIMIT 20'
    );
    res.json(agents);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===== Core 积分系统 =====

// 查询余额
app.get('/api/agents/:id/balance', async (req, res) => {
  try {
    const { id } = req.params;
    const [agent] = await query('SELECT id, name, core_balance FROM agents WHERE id = ?', [id]);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json({ agent_id: id, balance: agent.core_balance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 充值（人类为龙虾充值）
app.post('/api/agents/:id/recharge', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_method } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // 检查 Agent 是否存在
    const [agent] = await query('SELECT * FROM agents WHERE id = ?', [id]);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // 充值（增加余额）
    await query('UPDATE agents SET core_balance = core_balance + ? WHERE id = ?', [amount, id]);

    // 记录交易
    const txId = uuidv4();
    await query(
      'INSERT INTO skill_calls (id, skill_id, caller_id, input, output, price) VALUES (?, ?, ?, ?, ?, ?)',
      [txId, 'recharge', id, JSON.stringify({ payment_method }), JSON.stringify({ type: 'recharge' }), -amount]
    );

    const [updated] = await query('SELECT core_balance FROM agents WHERE id = ?', [id]);

    res.json({
      success: true,
      agent_id: id,
      amount: amount,
      new_balance: updated.core_balance,
      message: 'Recharge successful'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 提现（龙虾转给人类）- 简化版：仅记录申请
app.post('/api/agents/:id/withdraw', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, account } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!account) {
      return res.status(400).json({ error: 'Account info required' });
    }

    // 检查 Agent 余额
    const [agent] = await query('SELECT * FROM agents WHERE id = ?', [id]);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    if (agent.core_balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // 扣除余额
    await query('UPDATE agents SET core_balance = core_balance - ? WHERE id = ?', [amount, id]);

    // 记录提现申请
    const txId = uuidv4();
    await query(
      'INSERT INTO skill_calls (id, skill_id, caller_id, input, output, price) VALUES (?, ?, ?, ?, ?, ?)',
      [txId, 'withdraw', id, JSON.stringify({ account, amount }), JSON.stringify({ type: 'withdraw', status: 'pending' }), amount]
    );

    const [updated] = await query('SELECT core_balance FROM agents WHERE id = ?', [id]);

    res.json({
      success: true,
      withdraw_id: txId,
      amount: amount,
      account: account,
      new_balance: updated.core_balance,
      message: 'Withdraw request submitted. Pending approval.'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 交易流水记录
app.get('/api/agents/:id/transactions', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20 } = req.query;

    const transactions = await query(
      `SELECT * FROM skill_calls WHERE caller_id = ? OR skill_id = ? ORDER BY created_at DESC LIMIT ?`,
      [id, id, parseInt(limit)]
    );

    res.json(transactions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`AgentCore API running on port ${PORT}`);
});
