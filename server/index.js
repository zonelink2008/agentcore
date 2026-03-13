// AgentCore MVP Server - MySQL版本

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL配置 - 从环境变量读取
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

initDB();

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
    const { name, description, dataType, price, content, sellerId } = req.body;
    const id = uuidv4();
    await query(
      'INSERT INTO data_market (id, seller_id, name, description, data_type, price, content) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, sellerId, name, description, dataType, price, content]
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

// 算力交易
app.post('/api/compute/exchange', async (req, res) => {
  try {
    const { providerId, buyerId, amount, price } = req.body;
    const id = uuidv4();
    await query(
      'INSERT INTO compute_orders (id, provider_id, buyer_id, amount, price, status) VALUES (?, ?, ?, ?, ?, ?)',
      [id, providerId, buyerId, amount, price, 'completed']
    );
    res.json({ success: true, orderId: id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`AgentCore API running on port ${PORT}`);
});
