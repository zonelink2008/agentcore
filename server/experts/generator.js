/**
 * AgentCore 投资专家生成器
 * 专注投资领域，50个专家 (1-50级)
 * 价格模式: 实际token花费 × (1 + 浮动比例)
 */

const LEVELS = Array.from({ length: 50 }, (_, i) => i + 1);

// 专家配置 - 专注投资领域
const VARIANTS = {
  finance: {
    subcategories: [
      'stock_analysis',    // 股票分析
      'fund_selection',    // 基金选择
      'crypto_trading',    // 加密货币
      'portfolio',         // 资产配置
      'risk_management',   // 风险管理
      'financial_report',  // 财务报告
      'investment_strategy', // 投资策略
      'technical_analysis',  // 技术分析
      'fundamental_analysis', // 基本面分析
      'estate_planning'    // 房产规划
    ],
    tags: [
      // 全球股票
      'A股', '港股', '美股', '纳斯达克', '道琼斯', '标普500',
      '腾讯', '阿里', '苹果', '特斯拉', '微软', '英伟达', 'AMD',
      '茅台', '比亚迪', '三星', '索尼', '丰田', '任天堂',
      'ETF', 'SPY', 'QQQ', 'QDII',
      // 加密货币
      'BTC', '比特币', 'ETH', '以太坊', 'BNB', 'Solana', 'DOGE',
      '币圈', '合约', 'DeFi', 'Web3', '交易所', 'Binance',
      // 投资分析
      '价值投资', '成长股', '基本面', '技术面', 'K线', 'MACD',
      '财报', 'ROE', 'PE', 'EPS', '营收', '利润',
      // 风险
      '风控', '回撤', '仓位', '止损', '分散',
      // 其他
      '基金', '房产', '黄金', '原油', '美元'
    ],
    model: ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'deepseek/deepseek-chat']
  }
};

// 根据级别计算浮动比例: 1级=0%, 50级=200%
function getMarkupByLevel(level) {
  return ((level - 1) / 49) * 2;
}

// 获取专家最终收费比例
function getFinalMarkup(expert) {
  return expert.markup;
}

// 生成专家 ID
function generateExpertId(index) {
  return `INV${String(index).padStart(4, '0')}`;  // INV = Investment
}

// 生成专家
function generateExpert(variant, index) {
  const level = LEVELS[(index - 1) % 50];
  const subcats = variant.subcategories;
  const tags = variant.tags.slice(0, 10 + Math.floor(Math.random() * 10));
  const model = variant.model[Math.floor(Math.random() * variant.model.length)];
  const markup = getMarkupByLevel(level);
  
  return {
    id: generateExpertId(index),
    name: `Investor_Lv${level}_${index}`,
    category: 'finance',
    level,
    subcategories: subcats.slice(0, 2 + Math.floor(Math.random() * 3)),
    tags,
    description: `Lv.${level} 投资专家。擅长: ${tags.slice(0, 3).join(', ')}`,
    markup,
    customMarkup: null,
    model,
    stats: {
      rating: 3.0 + (level / 50) * 2,
      completedTasks: level * 10,
      avgCompletionTime: Math.max(20, 120 - level * 2),
      successRate: 0.6 + (level / 50) * 0.4
    },
    createdAt: new Date().toISOString()
  };
}

// 生成全部 50 个投资专家
function generateAllExperts() {
  const experts = {};
  const variant = VARIANTS.finance;
  
  for (let i = 1; i <= 50; i++) {
    const expert = generateExpert(variant, i);
    experts[expert.id] = expert;
  }
  
  return experts;
}

// 生成并导出
const ALL_EXPERTS = generateAllExperts();

console.log(`✅ Generated ${Object.keys(ALL_EXPERTS).length} investment experts`);

// 按级别统计
const levelStats = {};
for (const expert of Object.values(ALL_EXPERTS)) {
  if (!levelStats[expert.level]) levelStats[expert.level] = 0;
  levelStats[expert.level]++;
}

console.log('\n📊 Level Distribution:');
[1, 10, 25, 40, 50].forEach(lv => {
  const e = Object.values(ALL_EXPERTS).find(ex => ex.level === lv);
  console.log(`  Lv.${lv}: +${(e.markup * 100).toFixed(0)}% | Rating: ${e.stats.rating.toFixed(1)}`);
});

// 导出
module.exports = {
  VARIANTS,
  generateExpert,
  generateAllExperts,
  getMarkupByLevel,
  getFinalMarkup,
  ALL_EXPERTS
};

// ============== 升级系统 ==============

/**
 * 积分规则
 * - 完成任务: +10 分
 * - 获得好评: +5 分  
 * - 评分 × 10 分
 * - 失败: -5 分
 */

function calculateTaskPoints(success, rating) {
  if (success) {
    return 10 + rating * 10 + 5;
  } else {
    return -5;
  }
}

function getPointsToNextLevel(currentLevel) {
  return currentLevel * 100;
}

function calculateLevel(totalPoints) {
  let level = 1;
  let accumulatedPoints = 0;
  
  while (level < 50) {
    const needed = getPointsToNextLevel(level);
    if (accumulatedPoints + needed > totalPoints) break;
    accumulatedPoints += needed;
    level++;
  }
  
  return {
    level,
    currentPoints: totalPoints - accumulatedPoints,
    pointsToNext: getPointsToNextLevel(level) - (totalPoints - accumulatedPoints)
  };
}

function simulateUpgrade(tasksCompleted, avgRating) {
  const totalPoints = tasksCompleted * (10 + avgRating * 10 + 5);
  return calculateLevel(totalPoints);
}

// 测试
console.log('\n=== 升级模拟 ===');
console.log('10任务, 4.0评分:', simulateUpgrade(10, 4.0));
console.log('50任务, 4.5评分:', simulateUpgrade(50, 4.5));
console.log('200任务, 4.8评分:', simulateUpgrade(200, 4.8));
