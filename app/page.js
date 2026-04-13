'use client';

import { useState, useEffect } from 'react';
import { parseStdout } from '@/lib/parser';

export default function Home() {
  const [tab, setTab] = useState('prompts');
  const [prompts, setPrompts] = useState([]);
  const [suites, setSuites] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [executionResult, setExecutionResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Forms
  const [newPrompt, setNewPrompt] = useState({ title: '', content: '' });
  const [nextVersionContent, setNextVersionContent] = useState('');
  const [execConfig, setExecConfig] = useState({ promptId: '', versionId: '', model: 'llama-3.3-70b-versatile', input: '' });
  const [dbStatus, setDbStatus] = useState('Checking...');
  const [mounted, setMounted] = useState(false);



  const checkHealth = async () => {
    try {
        const res = await fetch('/api/health');
        const { status } = await res.json();
        setDbStatus(status === 'connected' ? 'MONGODB ACTIVE' : 'LOCAL STORAGE MODE');
    } catch(e) {
        setDbStatus('LOCAL STORAGE MODE');
    }
  };

  const fetchPrompts = async () => {
    try {
      const res = await fetch('/api/prompts');
      const data = await res.json();
      if (Array.isArray(data)) setPrompts(data);
    } catch(e) {}
  };

  const fetchSuites = async () => {
    try {
      const res = await fetch('/api/suites');
      const data = await res.json();
      if (Array.isArray(data)) setSuites(data);
    } catch(e) {}
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      if (Array.isArray(data)) setTemplates(data);
    } catch(e) {}
  };

  useEffect(() => {
    setMounted(true);
    fetchPrompts();
    fetchSuites();
    fetchTemplates();
    checkHealth();
  }, [tab]);

  if (!mounted) return null;

  const createPrompt = async () => {
    if (!newPrompt.title || !newPrompt.content) return;
    setLoading(true);
    await fetch('/api/prompts', {
      method: 'POST',
      body: JSON.stringify(newPrompt)
    });
    setNewPrompt({ title: '', content: '' });
    await fetchPrompts();
    setLoading(false);
  };

  const openPrompt = async (id) => {
    const res = await fetch(`/api/prompts/${id}`);
    const data = await res.json();
    setCurrentPrompt(data);
    setNextVersionContent(data.versions[data.versions.length - 1].content);
    setExecConfig(prev => ({ ...prev, promptId: id }));
  };

  const addVersion = async () => {
    if (!nextVersionContent) return;
    const res = await fetch(`/api/prompts/${currentPrompt.id}/version`, {
      method: 'POST',
      body: JSON.stringify({ content: nextVersionContent })
    });
    const data = await res.json();
    setCurrentPrompt(data);
    fetchPrompts();
  };

  const runPipeline = async () => {
    if (!execConfig.input) {
        alert("Please enter a test input first.");
        return;
    }
    setLoading(true);
    setExecutionResult(null);
    try {
        const res = await fetch('/api/run', {
          method: 'POST',
          body: JSON.stringify(execConfig)
        });
        const data = await res.json();
        if (data.error) {
            alert("Execution Error: " + data.details);
        } else {
            setExecutionResult(parseStdout(data.raw));
        }
    } catch (e) {
        alert("Pipeline failed: " + e.message);
    }
    setLoading(false);
  };

  const selectedPromptData = prompts.find(p => p.id === execConfig.promptId);

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-dark)' }}>
      {/* Sidebar - Refined with more understandable icons */}
      <aside style={{ width: 300, borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', background: 'rgba(5, 5, 5, 0.95)', backdropFilter: 'blur(40px)', zIndex: 100 }}>
        <div style={{ padding: '48px 32px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.04em' }}>
            FOURMINDS.PROMPT
          </div>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.2em' }}>NEXT-GEN ENGINE v3.5</div>
        </div>
        
        <nav style={{ padding: '0 20px', flex: 1 }}>
          {[
            { id: 'prompts', label: '1. Create Prompts', icon: '✍️', desc: 'Manage variants & versions' },
            { id: 'execute', label: '2. Run Benchmarks', icon: '🚀', desc: 'Test with real AI models' },
            { id: 'templates', label: '3. Best Variants', icon: '🏆', desc: 'Curated golden prompts' }
          ].map(item => (
            <div 
              key={item.id}
              onClick={() => { setTab(item.id); setExecutionResult(null); }}
              style={{ 
                padding: '18px 24px', cursor: 'pointer', transition: '0.3s', borderRadius: 20, marginBottom: 12,
                color: tab === item.id ? 'var(--text-main)' : 'var(--text-muted)',
                background: tab === item.id ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                border: tab === item.id ? '1px solid var(--glass-border)' : '1px solid transparent',
                display: 'flex', alignItems: 'center', gap: 16
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>{item.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.label}</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: 2 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </nav>
        
        <div style={{ padding: '32px', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, background: dbStatus === 'MONGODB ACTIVE' ? 'var(--success)' : '#f59e0b', borderRadius: '50%', boxShadow: dbStatus === 'MONGODB ACTIVE' ? '0 0 10px var(--success)' : '0 0 10px #f59e0b' }}></div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{dbStatus}</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>GROQ-ENGINE: v3.3.70B</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '60px 100px', scrollBehavior: 'smooth' }}>
        
        {tab === 'prompts' && (
          <div style={{ animation: 'slideUp 0.5s ease' }}>
            <div style={{ marginBottom: 48 }}>
                <h1 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: 12 }}>Design Your Prompts</h1>
                <p style={{ color: 'var(--text-muted)', maxWidth: '600px' }}>Start by creating a "Prompt Cluster". Every edit you make will be saved as a new version, allowing you to backtrack or compare iterations later.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 40, alignItems: 'start' }}>
              <div className="glass-card" style={{ padding: '40px' }}>
                <label style={{ marginBottom: 20, display: 'block', fontSize: '0.9rem' }}>✨ Create New Cluster</label>
                <div style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: '0.7rem', opacity: 0.6 }}>What is this prompt for?</label>
                    <input 
                      value={newPrompt.title} 
                      onChange={e => setNewPrompt({...newPrompt, title: e.target.value})}
                      placeholder="e.g., Marketing Email Generator" 
                    />
                </div>
                <div style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: '0.7rem', opacity: 0.6 }}>Initial Prompt Instructions</label>
                    <textarea 
                      value={newPrompt.content}
                      onChange={e => setNewPrompt({...newPrompt, content: e.target.value})}
                      rows="6" 
                      placeholder="Write your instructions here. Example: You are a professional copywriter..." 
                    />
                </div>
                <button className="btn btn-primary" style={{ width: '100%', padding: '18px' }} onClick={createPrompt} disabled={loading}>
                  {loading ? 'Generating AI Classification...' : 'Initialize & Classify with AI'}
                </button>
              </div>

              <div>
                <label style={{ marginBottom: 20, display: 'block', fontSize: '0.9rem' }}>📂 Your Prompt Clusters</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {prompts.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '40px', borderStyle: 'dashed' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No prompts yet. Create your first one on the left!</p>
                    </div>
                  ) : prompts.map(p => (
                    <div 
                      key={p.id} 
                      className="glass-card" 
                      style={{ 
                        padding: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        background: currentPrompt?.id === p.id ? 'rgba(129, 140, 248, 0.1)' : 'rgba(255,255,255,0.02)',
                        borderColor: currentPrompt?.id === p.id ? 'var(--accent-primary)' : 'var(--glass-border)'
                      }} 
                      onClick={() => openPrompt(p.id)}
                    >
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 6 }}>{p.title}</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                           <span className="badge badge-accent" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--accent-primary)' }}>{p.category}</span>
                           <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', alignSelf: 'center' }}>• {p.versionCount} versions</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '1.2rem' }}>➡️</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {currentPrompt && (
              <div id="editor-nexus" className="glass-card" style={{ marginTop: 40, animation: 'slideUp 0.4s ease', borderLeft: '6px solid var(--accent-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32, alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>Editor: {currentPrompt.title}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Refine your prompt. Every save creates a new version for comparison.</p>
                  </div>
                  <button className="btn btn-outline" onClick={() => setCurrentPrompt(null)}>Close Editor</button>
                </div>
                
                <textarea 
                  value={nextVersionContent}
                  onChange={e => setNextVersionContent(e.target.value)}
                  rows="8"
                  style={{ background: 'rgba(0,0,0,0.5)', fontSize: '1.1rem', padding: '24px', lineHeight: '1.6' }}
                />
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
                   <button className="btn btn-primary" style={{ padding: '16px 40px' }} onClick={addVersion}>Save as v{currentPrompt.versions.length + 1}</button>
                </div>
                
                <div style={{ marginTop: 50, borderTop: '1px solid var(--glass-border)', paddingTop: 40 }}>
                  <label style={{ fontSize: '1rem', marginBottom: 24 }}>⏮️ Version History (Reverse Chronological)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                    {[...currentPrompt.versions].reverse().map((v, i) => (
                      <div key={i} className="glass-card" style={{ padding: '24px', background: 'rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
                           <span className="badge badge-accent" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>{v.version}</span>
                           <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(v.createdAt).toLocaleString()}</span>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{v.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'execute' && (
          <div style={{ animation: 'slideUp 0.5s ease' }}>
            <div style={{ marginBottom: 48 }}>
                <h1 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: 12 }}>Run AI Benchmarks</h1>
                <p style={{ color: 'var(--text-muted)', maxWidth: '600px' }}>Inland pipeline for real-time testing. Compare your prompt variants against real-world data to see which one scores highest.</p>
            </div>

            <div className="glass-card" style={{ padding: '48px', borderBottom: '4px solid var(--accent-primary)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 32 }}>
                <div>
                   <label style={{ marginBottom: 12, display: 'block' }}>1. Choose a Prompt Cluster</label>
                   <select value={execConfig.promptId} onChange={e => setExecConfig({...execConfig, promptId: e.target.value, versionId: ''})}>
                      <option value="">-- Manual/Demo Mode --</option>
                      {prompts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                   </select>
                </div>
                <div>
                   <label style={{ marginBottom: 12, display: 'block' }}>2. Select Version to Test</label>
                   <select value={execConfig.versionId} onChange={e => setExecConfig({...execConfig, versionId: e.target.value})}>
                      <option value="">Run All Versions (Comparison Mode)</option>
                      {selectedPromptData && Array.from({length: selectedPromptData.versionCount}, (_, i) => `v${i+1}`).map(v => (
                        <option key={v} value={v}>Test Only {v}</option>
                      ))}
                   </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 32 }}>
                <div>
                  <label style={{ marginBottom: 12, display: 'block' }}>3. Real Data / Example Input</label>
                  <input value={execConfig.input} onChange={e => setExecConfig({...execConfig, input: e.target.value})} placeholder="What should the AI process? e.g., 'Write a summary of quantum mechanics'" />
                </div>
                <div>
                  <label style={{ marginBottom: 12, display: 'block' }}>4. Intelligence Model</label>
                  <select value={execConfig.model} onChange={e => setExecConfig({...execConfig, model: e.target.value})}>
                    <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Smartest / Best)</option>
                    <option value="llama-3.1-8b-instant">Llama 3.1 8B (Fastest)</option>
                    <option value="mixtral-8x7b-32768">Mixtral 8x7B (Solid Production)</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', padding: '24px', fontSize: '1.1rem', letterSpacing: '0.02em' }} onClick={runPipeline} disabled={loading}>
                {loading ? '🚀 AI IS THINKING... PLEASE WAIT' : '⚡ EXECUTE PIPELINE & SCORE VARIANTS'}
              </button>
            </div>

            {executionResult && (
              <div id="results-anchor" style={{ marginTop: 80, animation: 'fadeIn 0.8s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48, background: 'rgba(255,255,255,0.03)', padding: '24px 32px', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
                   <div>
                      <h3 style={{ fontSize: '1.6rem', fontWeight: 900 }}>Benchmark Results</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Input Analyzed: "{executionResult.inputText}"</p>
                   </div>
                   {executionResult.bestVer && (
                       <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--success)', marginBottom: 4 }}>RECOMENDED VARIANT</div>
                          <div className="badge badge-success" style={{ padding: '10px 20px', fontSize: '1rem' }}>🏆 {executionResult.bestVer}</div>
                       </div>
                   )}
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 40 }}>
                  {executionResult.executions.map((e, idx) => (
                    <div key={idx} className="glass-card" style={{ 
                      display: 'flex', flexDirection: 'column',
                      borderLeft: `8px solid ${executionResult.bestVer === e.version ? 'var(--success)' : 'var(--accent-primary)'}`,
                      background: executionResult.bestVer === e.version ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.01)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28, alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white', marginRight: 12 }}>{e.version}</span>
                          <span className="badge badge-accent" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontSize: '0.6rem' }}>LATENCY: {e.meta.latency}ms</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: executionResult.bestVer === e.version ? 'var(--success)' : 'white' }}>{e.scores.totalScore}<span style={{ fontSize: '0.9rem', opacity: 0.4 }}>/15</span></div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800 }}>TOTAL EFFICIENCY</div>
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>AI RESPONSE OUTPUT</div>
                      <div className="output-quote" style={{ flex: 1, maxHeight: '300px', overflowY: 'auto' }}>{e.outputText}</div>
                      
                      <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, borderTop: '1px solid var(--glass-border)', paddingTop: 24 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 4 }}>KEYWORDS</div>
                            <div style={{ fontWeight: 800 }}>{e.scores.keywordScore}/5</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 4 }}>STRUCTURE</div>
                            <div style={{ fontWeight: 800 }}>{e.scores.lengthScore}/5</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 4 }}>QUALITY</div>
                            <div style={{ fontWeight: 800 }}>{e.scores.manualScore}/5</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'templates' && (
          <div style={{ animation: 'slideUp 0.5s ease' }}>
             <div style={{ marginBottom: 48 }}>
                <h1 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: 12 }}>Golden Standard Library</h1>
                <p style={{ color: 'var(--text-muted)', maxWidth: '600px' }}>Your highest-scoring prompts are archived here. These are the optimized instructions ready for use in your real apps.</p>
             </div>
             
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 32 }}>
                {templates.length === 0 ? (
                    <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px', borderStyle: 'dashed' }}>
                        <p style={{ color: 'var(--text-muted)' }}>No prompts have been optimized yet. Run a benchmark to find your winners!</p>
                    </div>
                ) : (
                  templates.map((t, idx) => (
                    <div key={idx} className="glass-card" style={{ borderTop: '4px solid var(--success)' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
                          <strong style={{ fontSize: '1.2rem', fontWeight: 900 }}>{t.title}</strong>
                          <span className="badge badge-success" style={{ padding: '6px 14px' }}>🏆 {t.versionId}</span>
                       </div>
                       <div className="output-quote" style={{ fontSize: '0.95rem', background: 'rgba(0,0,0,0.5)' }}>{t.content}</div>
                       <div style={{ marginTop: 24, fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>SAVED ON: {new Date(t.savedAt).toLocaleDateString()}</span>
                          <span>SCORE: {t.averageScore}/15</span>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
