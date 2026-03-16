/**
 * AgentCore 任务匹配 & 路由系统
 */

const expertsIndex = require('./index');
const { ALL_EXPERTS, generateAllExperts } = require('./generator');

// ============== 任务分析器 ==============
class TaskAnalyzer {
  // 只做投资领域 - 所有相关关键词都映射到 finance
  static CATEGORY_KEYWORDS = {
    finance: [
      // ===== 全球股票 =====
      // 中国
      '股票', 'A股', '港股', '美股', '上证', '深证', '创业板', '科创板', '北交所',
      '00700', '腾讯', '阿里', '百度', '美团', '拼多多', '京东', '网易', '小米',
      '茅台', '宁德', '比亚迪', '招商银行', '工商银行', '建设银行',
      // 美国
      '苹果', '特斯拉', '微软', '英伟达', 'AMD', 'Intel', 'Google', 'Meta', 'Amazon',
      'Netflix', 'Uber', 'Lyft', 'Airbnb', 'Snowflake', 'Palantir',
      'SPY', 'QQQ', 'DIA', 'IWM',  // ETF
      '纳斯达克', '道琼斯', '标普', 'S&P500', 'NASDAQ', 'DowJones',
      // 日本
      '索尼', '丰田', '任天堂', '软银', '孙正义', '日经', 'Nikkei',
      // 欧洲
      'SAP', 'LV', 'BMW', '大众', '西门子', '阿斯麦', 'ASML',
      'FTSE', 'DAX', 'CAC', 'Euro Stoxx',
      // 韩国
      '三星', 'SK海力士', 'LG', '现代', '起亚', 'KOSPI',
      // 印度
      '印度股市', 'BSE', 'Nifty', 'Reliance', 'TCS',
      // 股票通用
      '股价', '涨停', '跌停', '市值', '估值', '市盈率', 'PE', 'PB',
      '会涨', '会跌', '走势', '行情', '大盘', '指数', '点位',
      
      // ===== 基金 =====
      '基金', 'ETF', 'LOF', 'REITs', '私募', '公募', '信托',
      'FOF', '货币基金', '债券基金', '股票基金', '混合基金', '指数基金',
      '场内基金', '场外基金', '分级基金', 'QDII', 'ETF基金',
      
      // ===== 投资 =====
      '投资', '理财', '资产配置', '分散', '持仓', '仓位',
      '买入', '卖出', '建仓', '清仓', '加仓', '减仓', '止损', '止盈',
      '配置', '资产', '财富', '钱', '资金', '本金', '收益', '回报',
      
      // ===== 加密货币 =====
      'BTC', '比特币', 'ETH', '以太坊', 'BNB', 'Solana', 'SOL', 
      'XRP', 'ADA', 'DOGE', 'DOT', 'AVAX', 'MATIC', 'LINK',
      'UNI', 'ATOM', 'LTC', 'BCH', 'XLM', 'ALGO', 'VET',
      '加密货币', '虚拟币', '数字货币', 'Web3', 'DeFi', 'NFT',
      '币圈', '链上', 'Gas费', '挖矿', ' staking', '空投',
      '交易所', 'Coinbase', 'Binance', 'OKX', 'Kraken', 'FTX',
      '合约', '期货', '永续', '杠杆', '做多', '做空',
      
      // ===== 财务分析 =====
      '财报', '年报', '半年报', '季报', '营收', '利润', 'ROE', 'EPS',
      '毛利率', '净利率', '资产负债', '现金流', '股息', '分红', '红利',
      '商誉', '存货', '应收账款', '应付账款',
      
      // ===== 技术分析 =====
      'K线', '均线', 'MACD', 'KDJ', 'RSI', 'BOLL', 'WR', '技术面',
      '基本面', '趋势', '支撑', '阻力', '突破', '回踩', '形态',
      '头肩顶', '双顶', '双底', '三角形', '旗形',
      
      // ===== 投资策略 =====
      '价值投资', '成长股', '白马股', '黑马股', '蓝筹股', '垃圾股',
      '长线', '短线', '波段', '日内', 'T+0', '打新', 'IPO',
      '定投', '网格', '轮动', '对冲', '套利',
      
      // ===== 风险 =====
      '风险', '风控', '回撤', '波动', '最大回撤', '夏普比率', '波动率',
      'VaR', '黑天鹅', '灰犀牛', '流动性', '系统性风险',
      
      // ===== 房产 =====
      '房产', '房价', '首付', '贷款', '房贷', '利率', 'LPR',
      '租金', '回报率', '租售比', '泡沫', '房地产', 'REITs',
      
      // ===== 其他 =====
      '黄金', '白银', '原油', '大宗商品', '美元', '欧元', '日元', '汇率',
      '国债', '债券', '理财', '信托', '保险', '年金'
    ]
  };

  // 投资子类关键词
  static SUBCATEGORY_KEYWORDS = {
    stock_analysis: ['股票', '股价', '分析', '00700', '腾讯', '苹果'],
    fund_selection: ['基金', 'ETF', 'REITs', '私募', '公募'],
    crypto_trading: ['BTC', '比特币', 'ETH', '加密货币', '虚拟币'],
    portfolio: ['资产配置', '分散', '持仓', '仓位'],
    risk_management: ['风险', '风控', '止损', '回撤'],
    financial_report: ['财报', '年报', '营收', '利润', 'ROE'],
    investment_strategy: ['投资', '策略', '价值投资', '成长股'],
    technical_analysis: ['K线', '均线', 'MACD', '技术面'],
    fundamental_analysis: ['基本面', '市盈率', '估值', 'PE'],
    estate_planning: ['房产', '首付', '贷款', '租金']
  };

  /**
   * 分析任务
   */
  analyze(task) {
    const { description } = task;
    const desc = description.toLowerCase();

    // 1. 类别识别
    const category = this.detectCategory(desc);
    
    // 2. 子类识别
    const subcategory = this.detectSubcategory(desc, category);
    
    // 3. 需求提取 (关键词)
    const requirements = this.extractRequirements(desc);
    
    // 4. 难度评估
    const difficulty = this.detectDifficulty(desc);
    
    // 5. 语言检测
    const language = this.detectLanguage(description);

    return {
      category,
      subcategory,
      requirements,
      difficulty,
      language,
      description
    };
  }

  /**
   * 检测类别
   */
  detectCategory(desc) {
    for (const [category, keywords] of Object.entries(TaskAnalyzer.CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (desc.includes(keyword.toLowerCase())) {
          return category;
        }
      }
    }
    return 'finance'; // 默认投资
  }

  /**
   * 检测子类
   */
  detectSubcategory(desc, category) {
    const subKeywords = TaskAnalyzer.SUBCATEGORY_KEYWORDS;
    
    for (const [sub, keywords] of Object.entries(subKeywords)) {
      for (const keyword of keywords) {
        if (desc.includes(keyword)) {
          return sub;
        }
      }
    }
    return null;
  }

  /**
   * 提取需求
   */
  extractRequirements(desc) {
    const requirements = [];
    const keywords = [
      'api', 'web', '网站', 'app', '登录', '注册', '数据库',
      '分析', '图表', '可视化', '报告',
      '翻译', '校对', '润色',
      '视频', '剪辑', '配音',
      '投资建议', '风险', '收益'
    ];
    
    for (const kw of keywords) {
      if (desc.includes(kw)) {
        requirements.push(kw);
      }
    }
    
    return requirements.length > 0 ? requirements : ['通用'];
  }

  /**
   * 检测难度
   */
  detectDifficulty(desc) {
    const complexWords = ['复杂', '系统', '架构', '高并发', '企业级', '大规模', '高级'];
    const simpleWords = ['简单', '基础', '示例', '入门', '初级'];
    
    for (const w of complexWords) {
      if (desc.includes(w)) return 'complex';
    }
    for (const w of simpleWords) {
      if (desc.includes(w)) return 'simple';
    }
    return 'intermediate';
  }

  /**
   * 检测语言
   */
  detectLanguage(description) {
    // 简单检测
    if (/[\u4e00-\u9fa5]/.test(description)) return 'zh';
    return 'en';
  }
}

// ============== 专家索引 ==============
class ExpertIndex {
  constructor(experts = null) {
    this.index = {};
    this.experts = experts || ALL_EXPERTS;
    this.buildIndex();
  }

  /**
   * 构建索引
   */
  buildIndex() {
    const allExperts = Object.values(this.experts);
    
    for (const expert of allExperts) {
      // 按类别索引
      if (!this.index[expert.category]) {
        this.index[expert.category] = [];
      }
      this.index[expert.category].push(expert);
      
      // 存储引用
      this.experts[expert.id] = expert;
    }
    
    console.log(`📦 Indexed ${Object.keys(this.experts).length} experts`);
  }

  /**
   * 按类别查询
   */
  queryByCategory(category) {
    return this.index[category] || [];
  }

  /**
   * 按子类查询
   */
  queryBySubcategory(category, subcategory) {
    const experts = this.index[category] || [];
    if (!subcategory) return experts;
    
    return experts.filter(e => 
      e.subcategories.includes(subcategory)
    );
  }

  /**
   * 获取所有专家
   */
  getAll() {
    return Object.values(this.experts);
  }
}

// ============== 路由器 ==============
class Router {
  constructor() {
    this.analyzer = new TaskAnalyzer();
    this.index = new ExpertIndex();
  }

  /**
   * 路由: 分析任务 → 匹配专家 → 返回候选
   */
  async route(task, options = {}) {
    const { limit = 3, strategy = 'optimal' } = options;
    
    // 1. 任务分析
    const analysis = this.analyzer.analyze(task);
    console.log('📋 Task Analysis:', analysis);
    
    // 2. 获取候选专家
    let candidates = this.index.queryBySubcategory(
      analysis.category, 
      analysis.subcategory
    );
    
    // 如果没有子类匹配，返回类别下所有专家
    if (candidates.length === 0) {
      candidates = this.index.queryByCategory(analysis.category);
    }
    
    // 3. 评分排序
    const scored = candidates.map(expert => ({
      expert,
      score: this.calculateScore(analysis, expert),
      analysis
    }));
    
    // 4. 排序
    scored.sort((a, b) => b.score.total - a.score.total);
    
    // 5. 返回 Top-N
    const results = scored.slice(0, limit).map(s => ({
      expert: {
        name: s.expert.name,
        id: s.expert.id,
        category: s.expert.category,
        description: s.expert.description,
        markup: s.expert.markup,
        model: s.expert.model,
        level: s.expert.level
      },
      score: s.score,
      reason: this.explainScore(s.score, analysis)
    }));
    
    return {
      analysis,
      candidates: results,
      strategy
    };
  }

  /**
   * 计算评分
   */
  calculateScore(taskAnalysis, expert) {
    // 1. 能力匹配 (50%)
    const capability = this.capabilityScore(taskAnalysis, expert);
    
    // 2. 历史评分 (30%)
    const history = this.historyScore(expert);
    
    // 3. 响应速度 (20%)
    const speed = this.speedScore(expert);
    
    const total = capability * 0.50 + history * 0.30 + speed * 0.20;
    
    return {
      capability,
      history,
      speed,
      total: Math.round(total * 100) / 100
    };
  }

  /**
   * 能力匹配分
   */
  capabilityScore(taskAnalysis, expert) {
    const taskTags = new Set([
      taskAnalysis.category,
      taskAnalysis.subcategory,
      ...taskAnalysis.requirements
    ].filter(Boolean));
    
    const expertTags = new Set([
      ...expert.subcategories,
      ...expert.tags
    ]);
    
    // 计算交集
    const intersection = [...taskTags].filter(t => 
      expertTags.has(t.toLowerCase()) || 
      expertTags.has(t)
    );
    
    // 基础分 + 匹配加分
    let score = 0.5; // 基础分
    
    // 类别匹配 +20%
    if (expert.category === taskAnalysis.category) {
      score += 0.2;
    }
    
    // 子类匹配 +15%
    if (taskAnalysis.subcategory && 
        expert.subcategories.includes(taskAnalysis.subcategory)) {
      score += 0.15;
    }
    
    // 标签匹配 +15%
    if (intersection.length > 0) {
      score += Math.min(0.15, intersection.length * 0.05);
    }
    
    return Math.min(1, score);
  }

  /**
   * 历史评分分
   */
  historyScore(expert) {
    // 新专家默认高分，鼓励接单
    if (!expert.stats) return 0.8;
    return Math.min(1, expert.stats.rating / 5);
  }

  /**
   * 响应速度分
   */
  speedScore(expert) {
    // 假设平均响应时间 60s 为基准
    const avgTime = expert.avgTime || 60;
    if (avgTime < 30) return 1;
    if (avgTime < 60) return 0.8;
    if (avgTime < 120) return 0.6;
    return 0.4;
  }

  /**
   * 解释评分
   */
  explainScore(score, analysis) {
    const reasons = [];
    
    if (score.capability > 0.7) {
      reasons.push('能力匹配度高');
    }
    if (score.history > 0.8) {
      reasons.push('历史评分优秀');
    }
    if (score.speed > 0.8) {
      reasons.push('响应速度快');
    }
    
    return reasons.length > 0 ? reasons.join('，') : '综合评分';
  }

  /**
   * 执行任务 (带 Fallback)
   */
  async execute(task) {
    const routeResult = await this.route(task);
    const { candidates } = routeResult;
    
    if (candidates.length === 0) {
      return { error: 'No matching expert found' };
    }
    
    // 尝试每个候选
    for (const candidate of candidates) {
      try {
        const result = await expertsIndex.handleTask(
          candidate.expert.name, 
          task
        );
        
        return {
          success: true,
          expert: candidate.expert.name,
          result: result.result,
          cost: result.cost,
          price: result.price,
          analysis: routeResult.analysis
        };
      } catch (error) {
        console.log(`⚠️ ${candidate.expert.name} failed, trying next...`);
        continue;
      }
    }
    
    return { error: 'All experts failed' };
  }
}

// ============== 导出 ==============
module.exports = {
  TaskAnalyzer,
  ExpertIndex,
  Router
};
