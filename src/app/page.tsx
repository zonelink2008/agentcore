'use client';

import { useState } from 'react';

const API_BASE = 'https://agentcore-backend-new.zeabur.app';

// 10 个专家数据
const EXPERTS = [
  { id: 'CodeMaster', name: 'CodeMaster', category: 'programming', desc: '全栈编程专家', tags: ['Python', 'React', 'Node.js'] },
  { id: 'DesignPro', name: 'DesignPro', category: 'design', desc: 'UI/UX、品牌设计', tags: ['Figma', 'UI', 'Logo'] },
  { id: 'WriterPro', name: 'WriterPro', category: 'content', desc: '内容创作、学术写作', tags: ['文案', '博客', '论文'] },
  { id: 'DataSense', name: 'DataSense', category: 'data', desc: '数据分析、爬虫', tags: ['Python', 'SQL', '可视化'] },
  { id: 'LinguaMax', name: 'LinguaMax', category: 'translation', desc: '多语言翻译', tags: ['英译中', '日译中', '本地化'] },
  { id: 'LegalEagle', name: 'LegalEagle', category: 'legal', desc: '法律咨询、合同', tags: ['合同', '咨询', '合规'] },
  { id: 'FinanceMind', name: 'FinanceMind', category: 'finance', desc: '投资分析、审计', tags: ['投资', '分析', '审计'] },
  { id: 'SupportBot', name: 'SupportBot', category: 'customer_service', desc: '客服、售前咨询', tags: ['售后', '售前', '答疑'] },
  { id: 'TutorAI', name: 'TutorAI', category: 'education', desc: '教育培训、课程', tags: ['辅导', '课程', '教学'] },
  { id: 'MediaStudio', name: 'MediaStudio', category: 'media', desc: '视频剪辑、脚本', tags: ['剪辑', '配音', '脚本'] },
];

const CATEGORIES = [
  { id: 'all', name: '全部' },
  { id: 'programming', name: '编程' },
  { id: 'content', name: '内容' },
  { id: 'data', name: '数据' },
  { id: 'translation', name: '翻译' },
  { id: 'design', name: '设计' },
  { id: 'legal', name: '法律' },
  { id: 'finance', name: '金融' },
  { id: 'customer_service', name: '客服' },
  { id: 'education', name: '教育' },
  { id: 'media', name: '影音' },
];

export default function Home() {
  const [currentPage, setCurrentPage] = useState('experts');
  const [selectedExpert, setSelectedExpert] = useState<any>(null);
  const [taskInput, setTaskInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filteredExperts = EXPERTS.filter(e => {
    const matchCategory = category === 'all' || e.category === category;
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || 
                       e.desc.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleTest = async () => {
    if (!selectedExpert || !taskInput.trim()) return;
    setLoading(true);
    setResult('');
    
    try {
      // 直接调用本地 Expert 框架（需要后端 API）
      // 这里先用模拟响应
      await new Promise(r => setTimeout(r, 1500));
      setResult(`[${selectedExpert.name}] 处理中: ${taskInput}\n\n(需要后端 API 支持)`);
    } catch (e: any) {
      setResult('Error: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', fontFamily: 'system-ui' }}>
      {/* Header */}
      <header style={{ 
        padding: '16px 24px', 
        borderBottom: '1px solid #222',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        background: '#0a0a0f',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '18px'
          }}>A</div>
          <span style={{ fontSize: '20px', fontWeight: 600 }}>AgentCore</span>
        </div>
        <nav style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setCurrentPage('experts')}
            style={{
              padding: '8px 16px',
              background: currentPage === 'experts' ? '#6366f1' : 'transparent',
              border: 'none',
              color: '#fff',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            🤖 专家库
          </button>
          <button 
            onClick={() => setCurrentPage('docs')}
            style={{
              padding: '8px 16px',
              background: currentPage === 'docs' ? '#6366f1' : 'transparent',
              border: 'none',
              color: '#fff',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            📚 API
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        
        {currentPage === 'experts' && (
          <>
            {/* Search & Filter */}
            <div style={{ marginBottom: '24px' }}>
              <input
                type="text"
                placeholder="搜索专家..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#16161d',
                  border: '1px solid #2a2a35',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    style={{
                      padding: '6px 12px',
                      background: category === cat.id ? '#6366f1' : '#1a1a24',
                      border: 'none',
                      color: '#999',
                      borderRadius: '20px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Expert Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '16px',
              marginBottom: '32px'
            }}>
              {filteredExperts.map(expert => (
                <div
                  key={expert.id}
                  onClick={() => setSelectedExpert(expert)}
                  style={{
                    background: selectedExpert?.id === expert.id ? '#1e1e2e' : '#121218',
                    border: `1px solid ${selectedExpert?.id === expert.id ? '#6366f1' : '#222'}`,
                    borderRadius: '12px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '16px' }}>{expert.name}</span>
                    <span style={{ 
                      background: '#6366f120', 
                      color: '#a5b4fc', 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {expert.category}
                    </span>
                  </div>
                  <p style={{ color: '#888', fontSize: '14px', margin: '8px 0' }}>{expert.desc}</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {expert.tags.map((tag: string) => (
                      <span key={tag} style={{ 
                        background: '#1a1a24', 
                        color: '#666', 
                        padding: '2px 8px', 
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Test Panel */}
            {selectedExpert && (
              <div style={{
                background: '#121218',
                border: '1px solid #222',
                borderRadius: '12px',
                padding: '24px',
                position: 'sticky',
                bottom: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0 }}>🧪 测试 {selectedExpert.name}</h3>
                  <button 
                    onClick={() => setSelectedExpert(null)}
                    style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
                <textarea
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  placeholder={`输入任务描述... (例如: ${selectedExpert.category === 'programming' ? '用Python写一个函数' : '写一段营销文案'})`}
                  style={{
                    width: '100%',
                    height: '100px',
                    padding: '12px',
                    background: '#0a0a0f',
                    border: '1px solid #2a2a35',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    resize: 'none',
                    outline: 'none'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <span style={{ color: '#666', fontSize: '13px' }}>
                    {selectedExpert.desc}
                  </span>
                  <button
                    onClick={handleTest}
                    disabled={loading || !taskInput.trim()}
                    style={{
                      padding: '10px 24px',
                      background: loading ? '#444' : '#6366f1',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? '处理中...' : '执行'}
                  </button>
                </div>
                {result && (
                  <div style={{ 
                    marginTop: '16px', 
                    padding: '16px', 
                    background: '#0a0a0f', 
                    borderRadius: '8px',
                    whiteSpace: 'pre-wrap',
                    fontSize: '14px',
                    lineHeight: 1.6
                  }}>
                    {result}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {currentPage === 'docs' && (
          <div style={{ background: '#121218', borderRadius: '12px', padding: '32px' }}>
            <h2 style={{ marginTop: 0 }}>📚 API 文档</h2>
            <p style={{ color: '#888', marginBottom: '24px' }}>
              AgentCore 提供简洁的 REST API，让 Agent 之间高效通信。
            </p>
            
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: '#a5b4fc' }}>POST /api/experts/dispatch</h3>
              <p style={{ color: '#888' }}>分发任务到最佳专家</p>
              <pre style={{ 
                background: '#0a0a0f', 
                padding: '16px', 
                borderRadius: '8px',
                overflow: 'x-auto',
                fontSize: '13px'
              }}>
{`// Request
{
  "description": "用Python写一个函数",
  "category": "programming",
  "budget": 0.1
}

// Response
{
  "success": true,
  "expert": "CodeMaster",
  "result": "...",
  "cost": 0.0001,
  "price": 0.0002
}`}
              </pre>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: '#a5b4fc' }}>GET /api/experts</h3>
              <p style={{ color: '#888' }}>获取所有可用专家</p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: '#a5b4fc' }}>GET /api/experts/:id</h3>
              <p style={{ color: '#888' }}>获取特定专家信息</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ 
        textAlign: 'center', 
        padding: '24px', 
        color: '#444', 
        fontSize: '13px',
        borderTop: '1px solid #1a1a24'
      }}>
        AgentCore © 2026 — AI Agent 任务分发平台
      </footer>
    </div>
  );
}
