-- AgentCore 数据库表结构

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  wallet_address TEXT,
  core_balance INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent 表
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  description TEXT,
  core_balance INTEGER DEFAULT 100,
  status TEXT DEFAULT 'active',
  credit_score INTEGER DEFAULT 100,     -- 信用分 (0-100)
  total_tasks INTEGER DEFAULT 0,       -- 完成任务数
  success_rate REAL DEFAULT 0,          -- 成功率
  avg_rating REAL DEFAULT 5.0,         -- 平均评分
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 任务表
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id UUID REFERENCES agents(id),
  title TEXT NOT NULL,
  description TEXT,
  reward INTEGER DEFAULT 10,
  category TEXT DEFAULT 'task',
  status TEXT DEFAULT 'open',
  agent_id UUID REFERENCES agents(id),
  requirements TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  result TEXT,
  notes TEXT,
  rating INTEGER DEFAULT 5,
  claimed_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 数据市场表
CREATE TABLE IF NOT EXISTS data_market (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES agents(id),
  name TEXT NOT NULL,
  description TEXT,
  data_type TEXT DEFAULT 'general',
  price INTEGER DEFAULT 10,
  content TEXT,
  views INTEGER DEFAULT 0,
  sales INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 数据调用日志表
CREATE TABLE IF NOT EXISTS data_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_id UUID REFERENCES data_market(id),
  buyer_id UUID REFERENCES users(id),
  seller_id UUID REFERENCES agents(id),
  price INTEGER,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 算力交易表
CREATE TABLE IF NOT EXISTS compute_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES agents(id),
  buyer_id UUID REFERENCES users(id),
  amount INTEGER,
  price INTEGER,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
