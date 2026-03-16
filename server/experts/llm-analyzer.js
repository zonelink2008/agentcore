/**
 * LLM 任务分析器
 * 用 LLM 理解用户任务，提取结构化信息
 */

const API_KEY = process.env.OPENROUTER_API_KEY || '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';

// 分析提示词
const ANALYSIS_PROMPT = `你是一个投资任务分析器。请分析用户的投资相关问题，提取结构化信息。

支持的领域：
- 股票：A股、港股、美股、日本、欧洲、韩国、印度等全球股市
- 基金：ETF、公募、私募、REITs、QDII等
- 加密货币：BTC、ETH、Solana等
- 资产配置、风险理财、房产投资等

请严格按以下JSON格式输出（只输出JSON，不要其他内容）：
{
  "intent": "分析|推荐|咨询|交易|配置|学习",
  "category": "股票|基金|加密货币|房产|综合",
  "entities": {
    "symbols": ["股票代码如00700、AAPL、NVDA"],
    "amount": "金额如有",
    "timeframe": "时间框架如短期、中期、长期"
  },
  "requirements": ["需要的分析类型如风险评估、收益预测、投资建议"],
  "sentiment": "保守|激进|中性",
  "urgency": "high|normal|low"
}

注意：
- 只输出JSON，不要有其他文字
- 如果无法确定，用"unknown"
- category必须是: 股票|基金|加密货币|房产|综合
- intent必须是: 分析|推荐|咨询|交易|配置|学习`;

/**
 * 用 LLM 分析任务 (使用 fetch)
 */
async function analyzeWithLLM(taskDescription) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': 'https://agentcore.ai',
        'X-Title': 'AgentCore'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          { role: 'system', content: ANALYSIS_PROMPT },
          { role: 'user', content: taskDescription }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    const content = data.choices[0]?.message?.content?.trim();
    
    // 清理 JSON (去除 markdown 代码块)
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // 解析 JSON
    const result = JSON.parse(cleanContent);
    
    return {
      success: true,
      ...result,
      raw: content
    };
  } catch (error) {
    console.error('LLM分析失败:', error.message);
    return {
      success: false,
      error: error.message,
      fallback: true
    };
  }
}

/**
 * 综合分析：先 LLM
 */
async function analyze(taskDescription) {
  const llmResult = await analyzeWithLLM(taskDescription);
  
  if (llmResult.success) {
    return {
      ...llmResult,
      method: 'llm'
    };
  }
  
  return {
    success: false,
    method: 'fallback',
    ...llmResult
  };
}

module.exports = {
  analyzeWithLLM,
  analyze,
  ANALYSIS_PROMPT
};
