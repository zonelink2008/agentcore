/**
 * Expert 测试示例
 */

const { EXPERTS, handleTask } = require('./index');

// 测试任务
const testTasks = {
  CodeMaster: {
    description: '用 Python 写一个函数，计算斐波那契数列的第 n 项，要求使用缓存优化'
  },
  WriterPro: {
    description: '为一篇关于 AI 时代的博客文章写一个开头段落，200字左右'
  },
  DataSense: {
    description: '用 Python 写一个函数，计算一组数字的均值、中位数、标准差'
  },
  LinguaMax: {
    description: '翻译这段话：Artificial intelligence is transforming the way we work and live.'
  }
};

async function testExpert(expertName, task) {
  console.log(`\n=== Testing ${expertName} ===`);
  console.log(`Task: ${task.description}`);
  
  try {
    const result = await handleTask(expertName, task);
    console.log(`\nResult:\n${result.result.substring(0, 500)}...`);
    console.log(`\nCost: $${result.cost.total.toFixed(4)}`);
    console.log(`Price: $${result.price.toFixed(4)}`);
  } catch (e) {
    console.error(`Error: ${e.message}`);
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  console.log('AgentCore Expert Framework Test');
  console.log('================================');
  
  // 测试所有专家
  testExpert('CodeMaster', testTasks.CodeMaster);
}

// 列出所有专家
console.log('\n=== Available Experts ===');
Object.values(EXPERTS).forEach(e => {
  console.log(`- ${e.name} (${e.category}) - $${e.basePrice}/task`);
});
