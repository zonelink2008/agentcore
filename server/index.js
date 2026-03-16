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
  host: process.env.MYSQL_HOST || '43.128.75.190',
  port: process.env.MYSQL_PORT || 31377,
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
        parent_task_id VARCHAR(36),
        result TEXT,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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

    // 数据购买表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS data_purchases (
        id VARCHAR(36) PRIMARY KEY,
        data_id VARCHAR(36),
        buyer_id VARCHAR(36),
        seller_id VARCHAR(36),
        price INT,
        status VARCHAR(255) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 算力出租表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS compute_listings (
        id VARCHAR(36) PRIMARY KEY,
        provider_id VARCHAR(36),
        provider_name VARCHAR(255),
        gpu_type VARCHAR(255),
        gpu_count INT,
        price_per_hour INT,
        status VARCHAR(255) DEFAULT 'available',
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
        [uuidv4(), 'test@example.com', '0x1234567890abcdef', 10000]
      );

      // ===== 系统预设 Agents (冷启动) =====
      // 通用型
      await connection.execute(
        'INSERT INTO agents (id, user_id, name, type, description, core_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), null, 'GeneralHelper', 'general', '通用助手，处理各种任务', 500, 'active']
      );
      
      // 数据处理型
      await connection.execute(
        'INSERT INTO agents (id, user_id, name, type, description, core_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), null, 'DataCollector', 'data', '专门收集和处理数据的Agent', 500, 'active']
      );
      await connection.execute(
        'INSERT INTO agents (id, user_id, name, type, description, core_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), null, 'DataCleaner', 'data', '数据清洗与预处理', 300, 'active']
      );
      
      // 机器学习型
      await connection.execute(
        'INSERT INTO agents (id, user_id, name, type, description, core_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), null, 'ModelTrainer', 'ml', '机器学习模型训练Agent', 800, 'active']
      );
      await connection.execute(
        'INSERT INTO agents (id, user_id, name, type, description, core_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), null, 'MLEngineer', 'ml', '模型调参与优化', 600, 'active']
      );
      
      // 任务执行型
      await connection.execute(
        'INSERT INTO agents (id, user_id, name, type, description, core_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), null, 'TaskExecutor', 'task', '执行各种任务的Agent', 300, 'active']
      );
      
      // 创意型
      await connection.execute(
        'INSERT INTO agents (id, user_id, name, type, description, core_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), null, 'CreativeWriter', 'creative', '文案创作与内容生成', 400, 'active']
      );
      await connection.execute(
        'INSERT INTO agents (id, user_id, name, type, description, core_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), null, 'ImageGenerator', 'creative', 'AI图像生成', 500, 'active']
      );
      
      // 金融型 (股票)
      await connection.execute(
        'INSERT INTO agents (id, user_id, name, type, description, core_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), null, 'StockAnalyzer', 'stock', '股票数据分析与走势预测', 1000, 'active']
      );
      await connection.execute(
        'INSERT INTO agents (id, user_id, name, type, description, core_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), null, 'StockTrader', 'stock', '自动交易策略执行', 1500, 'active']
      );
      
      // 金融型 (数字货币)
      await connection.execute(
        'INSERT INTO agents (id, user_id, name, type, description, core_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), null, 'CryptoAnalyzer', 'crypto', '数字货币行情分析', 800, 'active']
      );
      await connection.execute(
        'INSERT INTO agents (id, user_id, name, type, description, core_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), null, 'DeFiStrategist', 'crypto', 'DeFi 策略分析', 1200, 'active']
      );

      // ===== 系统预设任务 (让 Agent 有事可做) =====
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
      await connection.execute(
        'INSERT INTO tasks (id, title, description, reward, category, status) VALUES (?, ?, ?, ?, ?, ?)',
        ['task-4', '分析苹果股票走势', '分析AAPL股票最近30天走势', 80, 'stock', 'open']
      );
      await connection.execute(
        'INSERT INTO tasks (id, title, description, reward, category, status) VALUES (?, ?, ?, ?, ?, ?)',
        ['task-5', '比特币价格预测', '基于历史数据预测BTC未来走势', 150, 'crypto', 'open']
      );
      await connection.execute(
        'INSERT INTO tasks (id, title, description, reward, category, status) VALUES (?, ?, ?, ?, ?, ?)',
        ['task-6', '撰写产品文案', '为新品撰写营销文案', 40, 'creative', 'open']
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

// 任务市场 API

// 任务分类
const TASK_CATEGORIES = ['data', 'ml', 'creative', 'tool', 'task', 'translation', 'writing', 'analysis'];

// 发布任务
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, reward, category, publisher_id, requirements, deadline } = req.body;

    if (!title || !reward) {
      return res.status(400).json({ error: 'title and reward are required' });
    }

    const id = 'task-' + uuidv4().substring(0, 8);
    await query(
      'INSERT INTO tasks (id, publisher_id, title, description, reward, category, status, requirements, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, publisher_id || null, title, description, reward, category || 'task', 'open', requirements || null, deadline || null]
    );

    const tasks = await query('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json({ success: true, task: tasks[0] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 获取任务列表（支持筛选）
app.get('/api/tasks', async (req, res) => {
  try {
    const { status, category, publisher_id, limit = 50 } = req.query;

    let sql = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (publisher_id) {
      sql += ' AND publisher_id = ?';
      params.push(publisher_id);
    }

    sql += ' ORDER BY created_at DESC LIMIT ' + parseInt(limit);

    const tasks = await query(sql, params);
    res.json(tasks);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 获取开放任务
app.get('/api/tasks/open', async (req, res) => {
  try {
    const { category, limit = 50 } = req.query;

    let sql = "SELECT * FROM tasks WHERE status = 'open'";
    const params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' ORDER BY created_at DESC LIMIT ' + parseInt(limit);

    const tasks = await query(sql, params);
    res.json(tasks);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 接取任务
app.post('/api/tasks/:id/claim', async (req, res) => {
  try {
    const { agent_id } = req.body;
    const taskId = req.params.id;

    // 检查任务状态
    const [task] = await query("SELECT * FROM tasks WHERE id = ? AND status = 'open'", [taskId]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found or already claimed' });
    }

    // 检查接单者余额
    const [agent] = await query('SELECT * FROM agents WHERE id = ?', [agent_id]);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // 更新任务状态
    await query(
      "UPDATE tasks SET status = 'claimed', agent_id = ?, claimed_at = NOW() WHERE id = ?",
      [agent_id, taskId]
    );

    const tasks = await query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    res.json({ success: true, task: tasks[0] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 提交任务（交付）
app.post('/api/tasks/:id/submit', async (req, res) => {
  try {
    const { agent_id, result, notes } = req.body;
    const taskId = req.params.id;

    // 检查任务状态
    const [task] = await query("SELECT * FROM tasks WHERE id = ? AND status = 'claimed' AND agent_id = ?", [taskId, agent_id]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found or not claimed by you' });
    }

    // 更新任务状态
    await query(
      "UPDATE tasks SET status = 'submitted', result = ?, notes = ?, submitted_at = NOW() WHERE id = ?",
      [result || null, notes || null, taskId]
    );

    res.json({ success: true, message: 'Task submitted for review' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 验收任务（甲方确认）
app.post('/api/tasks/:id/complete', async (req, res) => {
  try {
    const { publisher_id, rating = 5 } = req.body;
    const taskId = req.params.id;

    // 检查任务
    const [task] = await query("SELECT * FROM tasks WHERE id = ? AND status = 'submitted'", [taskId]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found or not submitted' });
    }

    // 验证甲方
    if (task.publisher_id && task.publisher_id !== publisher_id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // 结算 Core（扣除甲方，付给乙方）
    const reward = task.reward;
    const platformFee = Math.floor(reward * 0.05); // 5% 手续费
    const agentEarn = reward - platformFee;

    // 扣除甲方（如果publisher是agent）
    if (task.publisher_id) {
      await query('UPDATE agents SET core_balance = core_balance - ? WHERE id = ?', [reward, task.publisher_id]);
    }

    // 支付乙方
    if (task.agent_id) {
      await query('UPDATE agents SET core_balance = core_balance + ?, completed_tasks = COALESCE(completed_tasks, 0) + 1 WHERE id = ?', [agentEarn, task.agent_id]);
    }

    // 更新任务状态
    await query(
      "UPDATE tasks SET status = 'completed', completed_at = NOW(), rating = ? WHERE id = ?",
      [rating, taskId]
    );

    res.json({
      success: true,
      message: 'Task completed',
      reward: reward,
      agentEarn: agentEarn,
      platformFee: platformFee
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 拒绝/争议任务
app.post('/api/tasks/:id/reject', async (req, res) => {
  try {
    const { publisher_id, reason } = req.body;
    const taskId = req.params.id;

    const [task] = await query("SELECT * FROM tasks WHERE id = ? AND status = 'submitted'", [taskId]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // 任务重置为 open，退还甲方 Core
    if (task.publisher_id && task.reward) {
      await query('UPDATE agents SET core_balance = core_balance + ? WHERE id = ?', [task.reward, task.publisher_id]);
    }

    await query(
      "UPDATE tasks SET status = 'open', agent_id = NULL, result = NULL WHERE id = ?",
      [taskId]
    );

    res.json({ success: true, message: 'Task rejected and reopened', reason: reason });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 获取我的任务（作为甲方/乙方）
app.get('/api/tasks/my', async (req, res) => {
  try {
    const { agent_id, role } = req.query;

    let tasks = [];
    if (role === 'publisher') {
      tasks = await query('SELECT * FROM tasks WHERE publisher_id = ? ORDER BY created_at DESC', [agent_id]);
    } else if (role === 'worker') {
      tasks = await query('SELECT * FROM tasks WHERE agent_id = ? ORDER BY created_at DESC', [agent_id]);
    } else {
      tasks = await query('SELECT * FROM tasks WHERE publisher_id = ? OR agent_id = ? ORDER BY created_at DESC', [agent_id, agent_id]);
    }

    res.json(tasks);
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

// 购买数据
app.post('/api/data/buy', async (req, res) => {
  try {
    const { data_id, buyer_id } = req.body;

    const [data] = await query('SELECT * FROM data_market WHERE id = ?', [data_id]);
    if (!data) {
      return res.status(404).json({ error: 'Data not found' });
    }

    const [buyer] = await query('SELECT * FROM agents WHERE id = ?', [buyer_id]);
    if (!buyer || buyer.core_balance < data.price) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // 扣款
    await query('UPDATE agents SET core_balance = core_balance - ? WHERE id = ?', [data.price, buyer_id]);

    // 给卖家付款
    if (data.seller_id) {
      await query('UPDATE agents SET core_balance = core_balance + ? WHERE id = ?', [data.price, data.seller_id]);
    }

    // 记录购买
    await query(
      'INSERT INTO data_purchases (data_id, buyer_id, seller_id, price) VALUES (?, ?, ?, ?)',
      [data_id, buyer_id, data.seller_id, data.price]
    );

    // 更新销量
    await query('UPDATE data_market SET sales = sales + 1 WHERE id = ?', [data_id]);

    res.json({ success: true, remainingBalance: buyer.core_balance - data.price });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 下载数据
app.get('/api/data/download/:id', async (req, res) => {
  try {
    const dataId = req.params.id;
    const buyerId = req.query.buyer_id;

    // 检查是否已购买
    const [purchase] = await query(
      'SELECT * FROM data_purchases WHERE data_id = ? AND buyer_id = ? AND status = ?',
      [dataId, buyerId, 'completed']
    );

    if (!purchase) {
      return res.status(403).json({ error: 'Please purchase first' });
    }

    const [data] = await query('SELECT * FROM data_market WHERE id = ?', [dataId]);
    if (!data) {
      return res.status(404).json({ error: 'Data not found' });
    }

    res.json({
      name: data.name,
      content: data.content,
      data_type: data.data_type,
      purchased_at: purchase.created_at
    });
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

// 出租算力（发布算力）
app.post('/api/compute/lease', async (req, res) => {
  try {
    const { provider_id, provider_name, gpu_type, gpu_count, price_per_hour } = req.body;

    const id = uuidv4();
    await query(
      'INSERT INTO compute_listings (id, provider_id, provider_name, gpu_type, gpu_count, price_per_hour, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, provider_id, provider_name, gpu_type, gpu_count, price_per_hour, 'available']
    );

    res.json({ success: true, id, message: '算力上架成功' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 获取算力出租列表
app.get('/api/compute/listings', async (req, res) => {
  try {
    const listings = await query("SELECT * FROM compute_listings WHERE status = 'available' ORDER BY created_at DESC");
    res.json(listings);
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

// ===== 信用评级系统 =====

// 获取 Agent 信用信息
app.get('/api/agents/:id/credit', async (req, res) => {
  try {
    const { id } = req.params;
    const [agent] = await query(
      'SELECT id, name, credit_score, total_tasks, success_rate, avg_rating, core_balance FROM agents WHERE id = ?',
      [id]
    );

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // 计算信用等级
    let creditLevel = 'D';
    if (agent.credit_score >= 90) creditLevel = 'A+';
    else if (agent.credit_score >= 80) creditLevel = 'A';
    else if (agent.credit_score >= 70) creditLevel = 'B';
    else if (agent.credit_score >= 60) creditLevel = 'C';

    res.json({
      agent_id: id,
      name: agent.name,
      credit_score: agent.credit_score || 100,
      credit_level: creditLevel,
      total_tasks: agent.total_tasks || 0,
      success_rate: agent.success_rate || 0,
      avg_rating: agent.avg_rating || 5.0,
      balance: agent.core_balance
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 更新信用评分（完成任务时调用）
app.post('/api/agents/:id/credit/update', async (req, res) => {
  try {
    const { id } = req.params;
    const { task_success, rating, task_reward } = req.body;

    const [agent] = await query('SELECT * FROM agents WHERE id = ?', [id]);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    let creditChange = 0;
    let newRating = rating || 5;

    // 根据任务成功与否调整信用分
    if (task_success) {
      creditChange = Math.min(5, Math.floor(task_reward / 20)); // 最多+5
      newRating = ((agent.avg_rating || 5) * (agent.total_tasks || 0) + rating) / ((agent.total_tasks || 0) + 1);
    } else {
      creditChange = -10; // 任务失败扣10分
    }

    const newScore = Math.max(0, Math.min(100, (agent.credit_score || 100) + creditChange));
    const newTasks = (agent.total_tasks || 0) + 1;
    const successRate = task_success ? ((agent.total_tasks || 0) * (agent.success_rate || 0) + 100) / newTasks : ((agent.total_tasks || 0) * (agent.success_rate || 0)) / newTasks;

    await query(
      'UPDATE agents SET credit_score = ?, total_tasks = ?, success_rate = ?, avg_rating = ? WHERE id = ?',
      [newScore, newTasks, successRate, newRating, id]
    );

    res.json({
      success: true,
      credit_score: newScore,
      credit_change: creditChange,
      avg_rating: newRating,
      total_tasks: newTasks
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 信用排行榜
app.get('/api/credit/leaderboard', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const agents = await query(
      'SELECT id, name, credit_score, total_tasks, avg_rating, core_balance FROM agents ORDER BY credit_score DESC LIMIT ?',
      [parseInt(limit)]
    );

    res.json(agents.map((a, i) => ({
      rank: i + 1,
      agent_id: a.id,
      name: a.name,
      credit_score: a.credit_score || 100,
      total_tasks: a.total_tasks || 0,
      avg_rating: a.avg_rating || 5.0,
      balance: a.core_balance
    })));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===== 任务分解与外包系统 =====

// 任务分解 - 将复杂任务拆分为子任务
app.post('/api/tasks/decompose', async (req, res) => {
  try {
    const { task_id, description, budget } = req.body;

    // 智能任务分解逻辑
    const subtasks = [];

    // 简单规则分解（实际可以用 AI 分析）
    if (description.includes('数据') || description.includes('分析')) {
      subtasks.push({
        type: 'data',
        title: '数据收集与清洗',
        description: '收集和处理原始数据',
        estimated_reward: Math.floor(budget * 0.2),
        required_agent_type: 'data'
      });
    }

    if (description.includes('模型') || description.includes('训练')) {
      subtasks.push({
        type: 'ml',
        title: '模型训练',
        description: '训练机器学习模型',
        estimated_reward: Math.floor(budget * 0.4),
        required_agent_type: 'ml'
      });
    }

    if (description.includes('图像') || description.includes('图片')) {
      subtasks.push({
        type: 'creative',
        title: '图像处理',
        description: '图像生成或处理',
        estimated_reward: Math.floor(budget * 0.3),
        required_agent_type: 'creative'
      });
    }

    if (description.includes('文本') || description.includes('写作')) {
      subtasks.push({
        type: 'task',
        title: '文本内容生成',
        description: '生成文本内容',
        estimated_reward: Math.floor(budget * 0.2),
        required_agent_type: 'task'
      });
    }

    // 如果没有匹配到任何类型，创建一个通用任务
    if (subtasks.length === 0) {
      subtasks.push({
        type: 'task',
        title: '任务执行',
        description: description,
        estimated_reward: budget,
        required_agent_type: 'general'
      });
    }

    res.json({
      success: true,
      parent_task_id: task_id,
      subtasks: subtasks,
      total_budget: budget,
      message: `已分解为 ${subtasks.length} 个子任务`
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 发布子任务到市场
app.post('/api/tasks/decompose/publish', async (req, res) => {
  try {
    const { parent_task_id, subtasks, main_agent_id, total_budget } = req.body;

    const publishedSubtasks = [];

    for (const subtask of subtasks) {
      const subtaskId = uuidv4();
      await query(
        'INSERT INTO tasks (id, publisher_id, title, description, reward, category, status, parent_task_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [subtaskId, main_agent_id, subtask.title, subtask.description, subtask.estimated_reward, subtask.type, 'open', parent_task_id]
      );

      publishedSubtasks.push({
        id: subtaskId,
        ...subtask
      });
    }

    res.json({
      success: true,
      parent_task_id,
      subtasks: publishedSubtasks,
      message: `已发布 ${publishedSubtasks.length} 个子任务到市场`
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 获取子任务状态
app.get('/api/tasks/:id/subtasks', async (req, res) => {
  try {
    const parentTaskId = req.params.id;

    const subtasks = await query(
      'SELECT * FROM tasks WHERE parent_task_id = ? ORDER BY created_at',
      [parentTaskId]
    );

    const completed = subtasks.filter(t => t.status === 'completed').length;
    const total = subtasks.length;

    res.json({
      parent_task_id: parentTaskId,
      subtasks: subtasks,
      progress: {
        completed,
        total,
        percentage: total > 0 ? Math.floor((completed / total) * 100) : 0
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 聚合子任务结果
app.post('/api/tasks/:id/aggregate', async (req, res) => {
  try {
    const parentTaskId = req.params.id;
    const { main_agent_id } = req.body;

    // 获取所有已完成子任务
    const subtasks = await query(
      "SELECT * FROM tasks WHERE parent_task_id = ? AND status = 'completed'",
      [parentTaskId]
    );

    if (subtasks.length === 0) {
      return res.status(400).json({ error: 'No completed subtasks to aggregate' });
    }

    // 聚合结果
    const results = subtasks.map(t => ({
      title: t.title,
      description: t.description,
      result: t.result || 'No result',
      completed_at: t.completed_at
    }));

    // 计算总成本
    const totalCost = subtasks.reduce((sum, t) => sum + t.reward, 0);

    res.json({
      success: true,
      parent_task_id: parentTaskId,
      subtask_count: subtasks.length,
      total_cost: totalCost,
      aggregated_results: results,
      message: `已聚合 ${subtasks.length} 个子任务结果`
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 智能推荐 Agent
app.get('/api/agents/recommend', async (req, res) => {
  try {
    const { task_type, category, budget } = req.query;

    let agents = await query('SELECT * FROM agents WHERE status = ?', ['active']);

    // 按类型过滤
    if (task_type) {
      agents = agents.filter(a => a.type === task_type);
    }

    // 按分类评分排序
    agents = agents.sort((a, b) => (b.core_balance || 0) - (a.core_balance || 0));

    // 推荐前5个
    const recommendations = agents.slice(0, 5).map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      core_balance: a.core_balance,
      credit_score: a.credit_score || 100,
      success_rate: a.success_rate || 0,
      recommendation_reason: a.type === category ? '类型匹配' : '高余额推荐'
    }));

    res.json({
      task_type,
      budget: parseInt(budget) || 0,
      recommendations
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===== Agent 路由执行 =====
app.post('/api/agents/route', async (req, res) => {
  try {
    const { task, task_type, budget, caller_id } = req.body;
    
    // 1. 智能匹配最佳 Agent
    let agents = await query("SELECT * FROM agents WHERE status = 'active'");
    
    if (task_type) {
      agents = agents.filter(a => a.type === task_type);
    }
    
    // 2. 如果没有指定类型，根据任务关键词智能判断
    if (!task_type && task) {
      const taskLower = task.toLowerCase();
      if (taskLower.includes('股票') || taskLower.includes('stock')) {
        agents = agents.filter(a => a.type === 'stock');
      } else if (taskLower.includes('币') || taskLower.includes('crypto') || taskLower.includes('比特币')) {
        agents = agents.filter(a => a.type === 'crypto');
      } else if (taskLower.includes('模型') || taskLower.includes('训练') || taskLower.includes('ml')) {
        agents = agents.filter(a => a.type === 'ml');
      } else if (taskLower.includes('数据') || taskLower.includes('清洗')) {
        agents = agents.filter(a => a.type === 'data');
      } else if (taskLower.includes('文案') || taskLower.includes('创作') || taskLower.includes('图片')) {
        agents = agents.filter(a => a.type === 'creative');
      }
    }
    
    // 3. 按余额排序，选最优
    agents = agents.sort((a, b) => (b.core_balance || 0) - (a.core_balance || 0));
    const bestAgent = agents[0];
    
    if (!bestAgent) {
      return res.json({
        success: false,
        message: '没有找到合适的 Agent',
        recommendations: []
      });
    }
    
    // 4. 检查预算
    const actualBudget = budget || 50;
    if (bestAgent.core_balance < actualBudget) {
      return res.json({
        success: false,
        message: '预算不足',
        agent: bestAgent,
        required: actualBudget,
        available: bestAgent.core_balance
      });
    }
    
    // 5. 返回匹配结果
    res.json({
      success: true,
      matched_agent: {
        id: bestAgent.id,
        name: bestAgent.name,
        type: bestAgent.type,
        description: bestAgent.description
      },
      task: task,
      estimated_cost: actualBudget,
      message: `已智能匹配 Agent: ${bestAgent.name}`
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===== 多Agent协作执行 =====
app.post('/api/agents/collaborate', async (req, res) => {
  try {
    const { main_agent_id, task, subtasks } = req.body;
    
    if (!subtasks || subtasks.length === 0) {
      return res.status(400).json({ error: 'No subtasks provided' });
    }
    
    // 为每个子任务匹配最佳 Agent
    const results = [];
    const allAgents = await query("SELECT * FROM agents WHERE status = 'active'");
    
    for (const subtask of subtasks) {
      // 根据类型匹配
      let matchedAgents = allAgents.filter(a => a.type === subtask.required_agent_type);
      if (matchedAgents.length === 0) {
        matchedAgents = allAgents;
      }
      // 按余额排序
      matchedAgents.sort((a, b) => (b.core_balance || 0) - (a.core_balance || 0));
      
      const assigned = matchedAgents[0];
      
      if (assigned) {
        results.push({
          subtask: subtask.title,
          agent_id: assigned.id,
          agent_name: assigned.name,
          agent_type: assigned.type,
          estimated_reward: subtask.estimated_reward,
          status: 'assigned'
        });
      }
    }
    
    res.json({
      success: true,
      main_agent_id,
      task,
      subtask_count: subtasks.length,
      assigned_agents: results,
      message: `已为 ${subtasks.length} 个子任务分配 Agent`
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===== Agent 调用其他 Agent 的技能 =====
app.post('/api/agents/call-skill', async (req, res) => {
  try {
    const { caller_id, skill_id, input } = req.body;
    
    // 获取技能信息
    const [skills] = await query('SELECT * FROM skills WHERE id = ?', [skill_id]);
    if (!skills.length) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    const skill = skills[0];
    
    // 获取调用者
    const [callers] = await query('SELECT * FROM agents WHERE id = ?', [caller_id]);
    if (!callers.length) {
      return res.status(404).json({ error: 'Caller agent not found' });
    }
    
    const caller = callers[0];
    
    // 检查余额
    if (caller.core_balance < skill.price) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // 扣除费用
    await query('UPDATE agents SET core_balance = core_balance - ? WHERE id = ?', [skill.price, caller_id]);
    
    // 给技能拥有者加余额
    await query('UPDATE agents SET core_balance = core_balance + ? WHERE id = ?', [skill.price, skill.agent_id]);
    
    // 记录调用
    const logId = uuidv4();
    await query(
      'INSERT INTO skill_calls (id, skill_id, caller_id, input, price) VALUES (?, ?, ?, ?, ?)',
      [logId, skill_id, caller_id, JSON.stringify(input), skill.price]
    );
    
    // 更新调用次数
    await query('UPDATE skills SET call_count = call_count + 1 WHERE id = ?', [skill_id]);
    
    res.json({
      success: true,
      skill_name: skill.name,
      caller: caller.name,
      cost: skill.price,
      remaining_balance: caller.core_balance - skill.price,
      result: {
        message: `Skill ${skill.name} executed successfully`,
        input,
        output: 'Mock result - actual execution would happen here'
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`AgentCore API running on port ${PORT}`);
});

// ============== Expert API ==============
const experts = require('./experts/dispatch');

// 获取所有专家
app.get('/api/experts', (req, res) => {
  const { EXPERTS } = experts;
  const list = Object.values(EXPERTS).map(e => ({
    id: e.id,
    name: e.name,
    category: e.category,
    subcategories: e.subcategories,
    tags: e.tags,
    description: e.description,
    basePrice: e.basePrice
  }));
  res.json({ success: true, experts: list });
});

// 获取单个专家
app.get('/api/experts/:id', (req, res) => {
  const { EXPERTS } = experts;
  const expert = Object.values(EXPERTS).find(e => e.name === req.params.id);
  if (!expert) {
    return res.status(404).json({ error: 'Expert not found' });
  }
  res.json({ success: true, expert: { ...expert, systemPrompt: '[HIDDEN]' } });
});

// 分发任务到专家
app.post('/api/experts/dispatch', async (req, res) => {
  const { description, category, budget } = req.body;
  
  if (!description) {
    return res.status(400).json({ error: 'description is required' });
  }
  
  try {
    // 简单任务分析
    const task = { description, budget: budget || { min: 0.05, max: 0.20 } };
    
    // 调用 Expert 框架
    const result = await experts.dispatchTask(task);
    
    if (result.success) {
      res.json({
        success: true,
        expert: result.expert,
        result: result.result,
        cost: result.cost,
        price: result.price
      });
    } else {
      res.status(500).json({ error: result.error || 'Task execution failed' });
    }
  } catch (error) {
    console.error('Expert dispatch error:', error);
    res.status(500).json({ error: error.message });
  }
});
