/**
 * AgentCore 任务分发 & 配对引擎
 */

const { EXPERTS, handleTask, MODELS, MODEL_COSTS } = require('./index');

/**
 * 任务分析器 - 解析任务请求
 */
function analyzeTask(task) {
  const { description, requirements, budget, category } = task;
  
  // 1. 意图识别 - 简单关键词匹配
  const keywords = {
    programming: ['code', 'python', 'js', '写', '函数', 'bug', '编程', '开发', '前端', '后端'],
    content: ['写', '文章', '文案', '博客', '内容', '创作', '写作'],
    design: ['设计', 'ui', 'logo', '品牌', '图'],
    data: ['分析', '数据', '爬虫', 'python', 'sql', '统计'],
    translation: ['翻译', 'translate', '英文', '中文'],
    legal: ['法律', '合同', '法'],
    finance: ['投资', '金融', '财务', '审计'],
    customer_service: ['客服', '售后', '咨询', '问题'],
    education: ['教学', '课程', '辅导', '学习', '教程'],
    media: ['视频', '剪辑', '配音', '脚本', '媒体']
  };
  
  // 2. 类别匹配
  let detectedCategory = category || 'programming';
  for (const [cat, words] of Object.entries(keywords)) {
    for (const word of words) {
      if (description.toLowerCase().includes(word.toLowerCase())) {
        detectedCategory = cat;
        break;
      }
    }
  }
  
  // 3. 难度评估 (简单规则)
  const difficulty = detectDifficulty(description, requirements);
  
  // 4. 预算匹配
  const budgetRange = budget || { min: 0.05, max: 0.20 };
  
  return {
    category: detectedCategory,
    difficulty,
    budget: budgetRange,
    description,
    requirements: requirements || []
  };
}

/**
 * 难度检测
 */
function detectDifficulty(description, requirements) {
  const complexKeywords = ['复杂', '系统', '架构', '高并发', '安全', '企业级', 'advanced', 'complex'];
  const simpleKeywords = ['简单', '基础', '入门', '示例', '简单', 'basic'];
  
  const desc = description.toLowerCase();
  
  for (const word of complexKeywords) {
    if (desc.includes(word)) return 'complex';
  }
  for (const word of simpleKeywords) {
    if (desc.includes(word)) return 'simple';
  }
  
  return 'intermediate';
}

/**
 * 找到匹配的专家
 */
function matchExperts(taskAnalysis, limit = 3) {
  const { category, budget } = taskAnalysis;
  
  // 按类别筛选
  const candidates = Object.values(EXPERTS).filter(e => 
    e.category === category
  );
  
  // 评分排序 (简单版本)
  const scored = candidates.map(e => ({
    expert: e,
    score: calculateScore(e, taskAnalysis)
  }));
  
  // 按分数排序
  scored.sort((a, b) => b.score - a.score);
  
  return scored.slice(0, limit);
}

/**
 * 计算专家匹配分数
 */
function calculateScore(expert, task) {
  let score = 50; // 基础分
  
  // 1. 类别匹配 (30分)
  if (expert.category === task.category) score += 30;
  
  // 2. 难度匹配 (10分)
  // 简化：假设所有专家都能处理 intermediate
  
  // 3. 价格匹配 (10分)
  if (task.budget && expert.basePrice <= task.budget.max) {
    score += 10;
  }
  
  return score;
}

/**
 * 执行任务 - 分发给最佳专家
 */
async function dispatchTask(task) {
  // 1. 分析任务
  const analysis = analyzeTask(task);
  console.log('📋 Task Analysis:', analysis);
  
  // 2. 匹配专家
  const matches = matchExperts(analysis, 3);
  console.log('🎯 Matched Experts:', matches.map(m => `${m.expert.name} (${m.score})`));
  
  if (matches.length === 0) {
    return { error: 'No matching expert found' };
  }
  
  // 3. 选择最佳专家执行
  const bestMatch = matches[0];
  const expertName = bestMatch.expert.name;  // 用 name 而不是 id
  console.log('🚀 Executing with:', expertName);
  
  try {
    const result = await handleTask(expertName, {
      description: task.description,
      requirements: task.requirements
    });
    
    return {
      success: true,
      task: analysis,
      expert: bestMatch.expert.name,
      result: result.result,
      cost: result.cost,
      price: result.price
    };
  } catch (e) {
    return {
      success: false,
      error: e.message,
      task: analysis
    };
  }
}

// ============== 测试 ==============
async function test() {
  console.log('=== AgentCore Task Dispatch Test ===\n');
  
  const testTasks = [
    {
      description: '用Python写一个计算斐波那契数列的函数',
      budget: { min: 0.05, max: 0.20 }
    },
    {
      description: '帮我写一段营销文案',
      budget: { min: 0.05, max: 0.15 }
    },
    {
      description: '翻译这段英文: Hello world',
      budget: { min: 0.01, max: 0.10 }
    }
  ];
  
  for (const task of testTasks) {
    console.log('\n---');
    const result = await dispatchTask(task);
    console.log('Result:', result.success ? '✅ Success' : '❌ Failed');
    if (result.result) {
      console.log('Output:', result.result.substring(0, 150) + '...');
    }
    if (result.cost) {
      console.log('Cost: $' + result.cost.total.toFixed(4));
    }
  }
}

// 导出
module.exports = {
  analyzeTask,
  matchExperts,
  dispatchTask
};

// 如果直接运行，执行测试
if (require.main === module) {
  test().catch(console.error);
}
