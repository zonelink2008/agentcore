/**
 * AgentCore Expert Framework
 * 自建专家 Agent 框架
 */

const https = require('https');

// ============== OpenRouter 配置 ==============
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

// OpenRouter 模型映射
// 格式: openrouter 模型名 -> { inputCost, outputCost, provider }
// 价格参考 OpenRouter 官网
const MODEL_COSTS = {
  'openai/gpt-4o': { input: 2.50, output: 10.00 },
  'openai/gpt-4o-mini': { input: 0.15, output: 0.60 },
  'anthropic/claude-3.5-sonnet': { input: 3.00, output: 15.00 },
  'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
  'google/gemini-pro-1.5': { input: 1.25, output: 5.00 },
  'meta-llama/llama-3.1-70b-instruct': { input: 0.65, output: 2.75 },
  'deepseek/deepseek-chat': { input: 0.14, output: 0.28 },
  'mistralai/mistral-7b-instruct': { input: 0.24, output: 0.24 },
  // 别名
  'deepseek-chat': { input: 0.14, output: 0.28 }
};

// 简化的模型选择 (用可用的)
const MODELS = {
  'gpt-4o': 'deepseek/deepseek-chat',    // 主力
  'claude-sonnet': 'deepseek/deepseek-chat',
  'gemini-pro': 'deepseek/deepseek-chat',
  'llama-70b': 'meta-llama/llama-3.1-70b-instruct',
  'deepseek': 'deepseek/deepseek-chat',
  'deepseek-chat': 'deepseek/deepseek-chat'  // 别名
};
const SYSTEM_PROMPTS = {
  programming: `你是一个专业的编程专家。你的职责：
1. 根据用户需求编写高质量代码
2. 代码要符合最佳实践，简洁优雅
3. 必须考虑错误处理和安全性
4. 完成后解释你的解决方案

输出格式：
- 代码文件（如有）
- 实现思路
- 使用说明`,

  design: `你是一个专业的设计师。你的职责：
1. 理解用户的设计需求
2. 提供清晰的设计方案描述
3. 可以生成 UI 描述、配色方案、布局建议
4. 解释设计决策背后的逻辑

输出格式：
- 设计方案描述
- 视觉元素建议
- 实现指导`,

  content: `你是一个专业的内容创作者。你的职责：
1. 根据用户需求创作高质量内容
2. 内容要符合目标受众和场景
3. 保持一致的语调和风格
4. 确保内容有价值和吸引力

输出格式：
- 创作内容
- 核心要点说明`,

  data: `你是一个专业的数据分析师。你的职责：
1. 理解用户的数据处理需求
2. 提供 Python/代码 解决方案
3. 解释数据处理逻辑
4. 确保代码可运行且高效

输出格式：
- Python/代码
- 数据处理思路
- 使用说明`,

  translation: `你是一个专业的翻译专家。你的职责：
1. 准确翻译用户提供的文本
2. 保持原文的语气和风格
3. 考虑目标语言的本地化
4. 提供多种翻译方案（如需要）

输出格式：
- 翻译结果
- 备注说明`,

  legal: `你是一个专业的法律顾问。你的职责：
1. 回答用户的法律问题
2. 提供准确、有依据的法律建议
3. 指出相关法律条款和风险
4. 建议咨询专业律师（如需）

输出格式：
- 法律分析
- 建议和风险提示
- 相关法律条款`,

  finance: `你是一个专业的金融顾问。你的职责：
1. 分析用户的金融需求
2. 提供专业的金融建议
3. 解释投资逻辑和风险
4. 提供数据分析支持

输出格式：
- 分析结果
- 建议
- 风险提示`,

  customer_service: `你是一个专业的客服专家。你的职责：
1. 友好、专业地回复客户
2. 准确理解客户问题
3. 提供清晰的解决方案
4. 引导客户完成操作

输出格式：
- 回复内容
- 行动建议（如有）`,

  education: `你是一个专业的教育专家。你的职责：
1. 根据学习者情况制定教学方案
2. 解释概念要通俗易懂
3. 提供练习和反馈
4. 鼓励学习者

输出格式：
- 教学内容的要点
- 练习题（如有）
- 学习建议`,

  media: `你是一个专业的影音制作专家。你的职责：
1. 理解用户的影音制作需求
2. 提供脚本、剪辑方案
3. 提供创意建议
4. 输出可执行的制作指南

输出格式：
- 制作方案/脚本
- 技术建议
- 执行步骤`
};

// ============== 专家定义 ==============
const EXPERTS = {
  // 1. 编程专家
  CodeMaster: {
    id: 'expert_codemaster',
    name: 'CodeMaster',
    category: 'programming',
    subcategories: ['frontend', 'backend', 'ai_ml', 'mobile', 'devops'],
    tags: ['react', 'vue', 'nodejs', 'python', 'typescript', 'langchain'],
    model: 'gpt-4o',
    systemPrompt: SYSTEM_PROMPTS.programming,
    basePrice: 0.10,  // 基础价格 ($)
    description: '全栈编程专家，擅长前端、后端、AI开发'
  },

  // 2. 设计专家
  DesignPro: {
    id: 'expert_designpro',
    name: 'DesignPro',
    category: 'design',
    subcategories: ['ui_ux', 'graphic', 'brand', 'product'],
    tags: ['figma', 'ui', 'logo', 'branding', 'product-design'],
    model: 'gpt-4o',
    systemPrompt: SYSTEM_PROMPTS.design,
    basePrice: 0.15,
    description: 'UI/UX、品牌设计专家'
  },

  // 3. 内容专家
  WriterPro: {
    id: 'expert_writerpro',
    name: 'WriterPro',
    category: 'content',
    subcategories: ['writing', 'copywriter', 'academic', 'social_media'],
    tags: ['blog', 'copywriting', 'article', 'social-media'],
    model: 'claude-sonnet',
    systemPrompt: SYSTEM_PROMPTS.content,
    basePrice: 0.08,
    description: '内容创作、学术写作、营销文案专家'
  },

  // 4. 数据专家
  DataSense: {
    id: 'expert_datasense',
    name: 'DataSense',
    category: 'data',
    subcategories: ['analysis', 'visualization', 'crawling', 'engineering'],
    tags: ['python', 'pandas', 'sql', 'scrapy', 'tableau'],
    model: 'gpt-4o',
    systemPrompt: SYSTEM_PROMPTS.data,
    basePrice: 0.12,
    description: '数据分析、爬虫、可视化专家'
  },

  // 5. 翻译专家
  LinguaMax: {
    id: 'expert_linguamax',
    name: 'LinguaMax',
    category: 'translation',
    subcategories: ['document', 'localization', 'legal', 'technical'],
    tags: ['en-zh', 'zh-en', 'japanese', 'localization'],
    model: 'deepseek-chat',
    systemPrompt: SYSTEM_PROMPTS.translation,
    basePrice: 0.05,
    description: '多语言翻译、本地化专家'
  },

  // 6. 法律专家
  LegalEagle: {
    id: 'expert_legaleagle',
    name: 'LegalEagle',
    category: 'legal',
    subcategories: ['contract', 'consulting', 'ip'],
    tags: ['contract', 'law', 'ip', 'compliance'],
    model: 'gpt-4o',
    systemPrompt: SYSTEM_PROMPTS.legal,
    basePrice: 0.20,
    description: '法律咨询、合同审核专家'
  },

  // 7. 金融专家
  FinanceMind: {
    id: 'expert_financemind',
    name: 'FinanceMind',
    category: 'finance',
    subcategories: ['investment', 'audit', 'analysis'],
    tags: ['investment', 'audit', 'analysis', 'stocks'],
    model: 'gpt-4o',
    systemPrompt: SYSTEM_PROMPTS.finance,
    basePrice: 0.18,
    description: '投资分析、财务审计专家'
  },

  // 8. 客服专家
  SupportBot: {
    id: 'expert_supportbot',
    name: 'SupportBot',
    category: 'customer_service',
    subcategories: ['support', 'sales'],
    tags: ['support', 'customer-service', 'sales'],
    model: 'gpt-4o',
    systemPrompt: SYSTEM_PROMPTS.customer_service,
    basePrice: 0.05,
    description: '客服、售前咨询专家'
  },

  // 9. 教育专家
  TutorAI: {
    id: 'expert_tutorai',
    name: 'TutorAI',
    category: 'education',
    subcategories: ['tutoring', 'course'],
    tags: ['teaching', 'tutoring', 'course-design'],
    model: 'claude-sonnet',
    systemPrompt: SYSTEM_PROMPTS.education,
    basePrice: 0.10,
    description: '教育培训、课程设计专家'
  },

  // 10. 影音专家
  MediaStudio: {
    id: 'expert_mediastudio',
    name: 'MediaStudio',
    category: 'media',
    subcategories: ['video', 'audio', 'script'],
    tags: ['video-editing', 'script', 'voiceover', 'short-video'],
    model: 'gpt-4o',
    systemPrompt: SYSTEM_PROMPTS.media,
    basePrice: 0.12,
    description: '视频剪辑、脚本、配音专家'
  }
};

// ============== API 调用 (OpenRouter) ==============
async function callModel(modelName, messages) {
  const orModel = MODELS[modelName];
  if (!orModel) {
    throw new Error(`Unknown model: ${modelName}`);
  }

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: orModel,
      messages: messages,
      temperature: 0.7
    });

    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://agentcore.io',
        'X-Title': 'AgentCore'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.error) {
            reject(new Error(result.error.message));
            return;
          }
          resolve({
            content: result.choices[0].message.content,
            usage: result.usage,
            model: result.model
          });
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ============== 专家执行任务 ==============
async function handleTask(expertId, task) {
  const expert = EXPERTS[expertId];
  if (!expert) {
    throw new Error(`Unknown expert: ${expertId}`);
  }

  const messages = [
    { role: 'system', content: expert.systemPrompt },
    { role: 'user', content: task.description }
  ];

  // 调用模型
  const result = await callModel(expert.model, messages);

  // 计算成本
  const orModel = MODELS[expert.model];
  const costs = MODEL_COSTS[orModel] || { input: 1, output: 1 };
  const inputCost = (result.usage.prompt_tokens / 1000000) * costs.input;
  const outputCost = (result.usage.completion_tokens / 1000000) * costs.output;
  const totalCost = inputCost + outputCost;

  // 计算定价 (成本 × 1.5)
  const price = totalCost * 1.5;

  return {
    expert: expertId,
    result: result.content,
    cost: {
      input: inputCost,
      output: outputCost,
      total: totalCost
    },
    price: price,
    usage: result.usage
  };
}

// ============== 导出 ==============
module.exports = {
  EXPERTS,
  MODELS,
  MODEL_COSTS,
  SYSTEM_PROMPTS,
  callModel,
  handleTask
};
