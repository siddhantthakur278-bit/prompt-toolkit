'use client';

import { useState, useEffect } from 'react';
import { parseStdout } from '@/lib/parser';

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
  const [tab, setTab] = useState('prompts');
  const [prompts, setPrompts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [executionResult, setExecutionResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Forms
  const [newPrompt, setNewPrompt] = useState({ title: '', content: '' });
  const [nextVersionContent, setNextVersionContent] = useState('');
  const [execConfig, setExecConfig] = useState({ promptId: '', versionId: '', model: 'llama-3.3-70b-versatile', input: '', multiModel: false });
  const [dbStatus, setDbStatus] = useState('SYNCING...');
  const [mounted, setMounted] = useState(false);

  // Bulk Input State
  const [bulkInputs, setBulkInputs] = useState('');
  const [bulkResults, setBulkResults] = useState([]);

  const getSDKCode = (lang) => {
    const p = currentPrompt || { title: 'TEMPLATE', versions: [{ content: 'PASTE_PROMPT_HERE' }] };
    const content = p.versions?.[p.versions.length-1]?.content || '';
    if (lang === 'python') {
        return `import groq\n\nclient = groq.Client(api_key="YOUR_KEY")\n\n# Fantastic Signal: ${p.title}\nprompt = """${content}"""\n\nresponse = client.chat.completions.create(\n    messages=[{"role": "user", "content": prompt}],\n    model="llama-3.3-70b-versatile"\n)\nprint(response.choices[0].message.content)`;
    }
    return `const { Groq } = require("groq-sdk");\n\nconst groq = new Groq({ apiKey: "YOUR_KEY" });\n\n// Fantastic Signal: ${p.title}\nconst prompt = \`${content}\`;\n\nasync function main() {\n  const chat = await groq.chat.completions.create({\n    messages: [{ role: "user", content: prompt }],\n    model: "llama-3.3-70b-versatile",\n  });\n  console.log(chat.choices[0].message.content);\n}\nmain();`;
  };

  const checkHealth = async () => {
    try {
        const res = await fetch('/api/health');
        const { status } = await res.json();
        setDbStatus(status === 'connected' ? 'QUANTUM-LINK ACTIVE' : 'LOCAL-CORE-MODE');
    } catch(e) {
        setDbStatus('LOCAL-CORE-MODE');
    }
  };

  const fetchPrompts = async () => {
    try {
      const res = await fetch('/api/prompts');
      const data = await res.json();
      if (Array.isArray(data)) setPrompts(data);
    } catch(e) {}
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      if (Array.isArray(data)) setTemplates(data);
    } catch(e) {}
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      setAnalytics(data);
    } catch(e) {}
  };

  useEffect(() => {
    setMounted(true);
    fetchPrompts();
    fetchTemplates();
    fetchAnalytics();
    checkHealth();
    const timer = setTimeout(() => setShowIntro(false), 3800);
    return () => clearTimeout(timer);
  }, [tab]);

  if (!mounted) return null;

  const createPrompt = async (autoOptimize = false) => {
    if (!newPrompt.title || !newPrompt.content) return;
    setLoading(true);
    await fetch('/api/prompts', {
      method: 'POST',
      body: JSON.stringify({ ...newPrompt, autoOptimize })
    });
    setNewPrompt({ title: '', content: '' });
    await fetchPrompts();
    setLoading(false);
  };

  const openPrompt = async (id) => {
    const res = await fetch(`/api/prompts/${id}`);
    const data = await res.json();
    setCurrentPrompt(data);
    setNextVersionContent(data?.versions?.[data?.versions?.length - 1]?.content || "");
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
    if (!execConfig.input) return;
    setLoading(true);
    setExecutionResult(null);
    try {
        const res = await fetch('/api/run', {
          method: 'POST',
          body: JSON.stringify(execConfig)
        });
        const data = await res.json();
        if (!data.error) {
            setExecutionResult(parseStdout(data.raw));
            fetchAnalytics();
        }
    } catch (e) {}
    setLoading(false);
  };

  const runBulkTest = async () => {
    const lines = bulkInputs.split('\n').filter(l => l.trim());
    if (lines.length === 0 || !execConfig.promptId) return;
    setLoading(true);
    setBulkResults([]);
    for (let line of lines) {
        try {
            const res = await fetch('/api/run', {
              method: 'POST',
              body: JSON.stringify({ ...execConfig, input: line, versionId: 'v1' })
            });
            const data = await res.json();
            const parsed = parseStdout(data.raw);
            setBulkResults(prev => [...prev, { input: line, score: parsed.executions[0]?.scores.totalScore || 0 }]);
        } catch(e) {}
    }
    setLoading(false);
    setTab('analytics');
  };

  const selectedPromptData = prompts.find(p => p.id === execConfig.promptId);

  return (
    <div style={{ display: 'flex', height: '100vh', position: 'relative' }}>
      
      {/* Glow Points for Atmosphere */}
      <div className="glow-point" style={{ top: '10%', left: '10%' }}></div>
      <div className="glow-point" style={{ bottom: '10%', right: '10%', background: 'radial-gradient(circle, var(--accent-secondary) 0%, transparent 70%)' }}></div>

      {/* Intro Overlay - Fantastic Mode */}
      {showIntro && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeOut 0.6s ease 3.3s forwards' }}>
            <div style={{ textAlign: 'center' }}>
                <img src="/logo_quantum.png" style={{ width: 160, marginBottom: 20, animation: 'logoPop 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) both' }} />
                <h1 style={{ fontSize: '4rem', background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'fadeInUp 1s ease 0.6s both' }}>QUANTUM.PROMPT</h1>
                <div style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.8em', fontSize: '0.75rem', fontWeight: 900, marginTop: 10, animation: 'fadeInUp 1s ease 1s both' }}>ELITE STARTUP PROTOCOL v9.0</div>
            </div>
        </div>
      )}

      {/* Fantastic Glass Sidebar */}
      <aside style={{ width: 340, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(100px)', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
        <div style={{ padding: '60px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, background: 'var(--gradient-main)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: '1.5rem', boxShadow: 'var(--glow-shadow)' }}>Q</div>
              <div style={{ fontWeight: 950, letterSpacing: '-0.04em', fontSize: '1.8rem', textShadow: '0 0 20px rgba(255,255,255,0.1)' }}>QUANTUM</div>
          </div>
          <p style={{ fontSize: '0.65rem', color: 'var(--accent-primary)', fontWeight: 900, letterSpacing: '0.3em', opacity: 0.8 }}>FANTASTIC COMMAND CORE</p>
        </div>
        
        <nav style={{ flex: 1, padding: '0 24px' }}>
          {[
            { id: 'prompts', label: 'Neural Forge', icon: '🌀' },
            { id: 'execute', label: 'Matrix Benchmark', icon: '🛰️' },
            { id: 'bulk', label: 'Bulk Pulse', icon: '☢️' },
            { id: 'templates', label: 'Golden Signals', icon: '💎' },
            { id: 'sdk', label: 'SDK Manifest', icon: '🧬' },
            { id: 'analytics', label: 'Intelligence Hub', icon: '📊' }
          ].map(item => (
            <div 
              key={item.id}
              onClick={() => { setTab(item.id); setExecutionResult(null); }}
              className={`nav-item ${tab === item.id ? 'active' : ''}`}
              style={{ padding: '20px 28px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 18 }}
            >
              <span style={{ fontSize: '1.4rem', opacity: tab === item.id ? 1 : 0.4, filter: tab === item.id ? 'drop-shadow(0 0 5px white)' : 'none' }}>{item.icon}</span>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>{item.label}</span>
            </div>
          ))}
        </nav>
        
        <div style={{ padding: '40px' }}>
            <div className="glass-card" style={{ padding: '20px', borderRadius: '24px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <div className="live-indicator" style={{ width: 10, height: 10, background: 'var(--success)', borderRadius: '50%', boxShadow: 'var(--glow-success)' }}></div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 950, color: 'white', letterSpacing: '0.05em' }}>{dbStatus}</span>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '100px 140px', scrollBehavior: 'smooth' }}>
        
        {tab === 'prompts' && (
          <div style={{ animation: 'slideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
            <h1 style={{ background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Neural Forge</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.3rem', marginBottom: 60, fontWeight: 500 }}>Architect the future of neural communication in high-fidelity.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 0.65fr', gap: 60 }}>
              <div className="glass-card" style={{ padding: '60px', borderBottom: '6px solid var(--accent-primary)' }}>
                <div style={{ marginBottom: 40 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--accent-primary)', marginBottom: 15, display: 'block', letterSpacing: '0.2em' }}>SIGNAL CORE IDENTITY</label>
                    <input value={newPrompt.title} onChange={e => setNewPrompt({...newPrompt, title: e.target.value})} placeholder="e.g. Adaptive Financial Analyst" />
                </div>
                <div style={{ marginBottom: 50 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--accent-primary)', marginBottom: 15, display: 'block', letterSpacing: '0.2em' }}>NEURAL SEED LOGIC</label>
                    <textarea value={newPrompt.content} onChange={e => setNewPrompt({...newPrompt, content: e.target.value})} rows="10" placeholder="Construct your base architecture..." />
                </div>
                <div style={{ display: 'flex', gap: 24 }}>
                    <button className="btn btn-primary" style={{ flex: 2, padding: '28px', fontSize: '1.1rem' }} onClick={() => createPrompt(true)}>🚀 Turbo-Evolve Signal</button>
                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => createPrompt(false)}>Init Core</button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: 30, display: 'block', letterSpacing: '0.2em' }}>🛰️ ACTIVE INVENTORY HUB</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {prompts.map(p => (
                    <div key={p.id} onClick={() => { openPrompt(p.id); setTimeout(() => document.getElementById('nexus')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="glass-card" style={{ padding: '30px', cursor: 'pointer', borderLeft: currentPrompt?.id === p.id ? '10px solid var(--accent-primary)' : '1px solid var(--glass-border)', background: currentPrompt?.id === p.id ? 'rgba(129, 140, 248, 0.1)' : 'rgba(255,255,255,0.02)' }}>
                      <div style={{ fontWeight: 950, fontSize: '1.25rem', marginBottom: 8 }}>{p.title}</div>
                      <div className="badge badge-accent">{p.versionCount} ITERATIONS</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {currentPrompt && (
              <div id="nexus" className="glass-card" style={{ marginTop: 100, padding: '80px', animation: 'slideUp 0.8s ease' }}>
                <h2 style={{ marginBottom: 40, fontSize: '3rem' }}>Nexus Control: {currentPrompt.title}</h2>
                <textarea value={nextVersionContent} onChange={e => setNextVersionContent(e.target.value)} rows="12" style={{ marginBottom: 40, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '1.2rem' }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" style={{ padding: '24px 80px', fontSize: '1.1rem' }} onClick={addVersion}>COMMIT VERSION v{(currentPrompt?.versions?.length || 0) + 1}</button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'execute' && (
            <div style={{ animation: 'slideUp 0.8s ease' }}>
                <h1 style={{ background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Matrix Benchmark</h1>
                <div className="glass-card" style={{ padding: '80px', marginTop: 40 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 40 }}>
                        <select value={execConfig.promptId} onChange={e => setExecConfig({...execConfig, promptId: e.target.value})}>
                            <option value="">SELECT SIGNAL SOURCE...</option>
                            {prompts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                        <select value={execConfig.versionId} onChange={e => setExecConfig({...execConfig, versionId: e.target.value})}>
                            <option value="">FULL CROSS-SIMULATION</option>
                            {selectedPromptData && Array.from({length: selectedPromptData.versionCount}, (_, i) => `v${i+1}`).map(v => <option key={v} value={v}>LOCKED SIGNAL: {v}</option>)}
                        </select>
                    </div>
                    <input value={execConfig.input} onChange={e => setExecConfig({...execConfig, input: e.target.value})} placeholder="ENTER TEST VECTOR..." style={{ marginBottom: 50 }} />
                    <button className="btn btn-primary" style={{ width: '100%', padding: '30px', fontSize: '1.3rem' }} onClick={runPipeline} disabled={loading}>
                        {loading ? '🛰️ RUNNING SIMULATION...' : '⚡ INITIATE MATRIX PROTOCOL'}
                    </button>
                </div>
                {executionResult && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 40, marginTop: 80 }}>
                        {executionResult.executions.map((e, idx) => (
                            <div key={idx} className="glass-card" style={{ padding: '50px', borderLeft: executionResult.bestVer === e.version ? '15px solid var(--success)' : '10px solid var(--accent-primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
                                    <span style={{ fontWeight: 950, fontSize: '1.8rem' }}>{e.version}</span>
                                    <span style={{ fontWeight: 950, fontSize: '2.5rem', color: executionResult.bestVer === e.version ? 'var(--success)' : 'white' }}>{e.scores.totalScore}</span>
                                </div>
                                <div className="output-quote" style={{ fontSize: '1.05rem', background: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.05)' }}>{e.outputText}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* Other tabs follow the Fantastic style... */}
        {tab === 'bulk' && (
            <div style={{ animation: 'slideUp 0.8s ease' }}>
                <h1 style={{ background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Bulk Pulse</h1>
                <div className="glass-card champion-card" style={{ padding: '80px', marginTop: 40 }}>
                    <textarea value={bulkInputs} onChange={e => setBulkInputs(e.target.value)} rows="12" placeholder="DRIVE MASS INPUTS HERE (One per line)..." style={{ marginBottom: 40 }} />
                    <button className="btn btn-primary" style={{ width: '100%', padding: '30px' }} onClick={runBulkTest} disabled={loading}>INUNDATE MATRIX</button>
                </div>
            </div>
        )}

        {tab === 'sdk' && (
            <div style={{ animation: 'slideUp 0.8s ease' }}>
                <h1>SDK Manifest</h1>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 60 }}>
                    <div className="glass-card" style={{ padding: '50px' }}>
                        <div style={{ color: '#3b82f6', fontWeight: 900, marginBottom: 30 }}>PYTHON DEPLOYMENT</div>
                        <div className="output-quote" style={{ fontSize: '0.9rem' }}>{getSDKCode('python')}</div>
                    </div>
                    <div className="glass-card" style={{ padding: '50px' }}>
                        <div style={{ color: '#f59e0b', fontWeight: 900, marginBottom: 30 }}>NODE.JS DEPLOYMENT</div>
                        <div className="output-quote" style={{ fontSize: '0.9rem' }}>{getSDKCode('node')}</div>
                    </div>
                </div>
            </div>
        )}

        {tab === 'templates' && (
            <div style={{ animation: 'slideUp 0.8s ease' }}>
                <h1 style={{ background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Golden Signals</h1>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: 40, marginTop: 60 }}>
                    {templates.map((t, idx) => (
                        <div key={idx} className="glass-card champion-card" style={{ padding: '60px' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 950, marginBottom: 30 }}>{t.title} 🏆</div>
                            <div className="output-quote" style={{ fontSize: '0.9rem' }}>{t.content}</div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {tab === 'analytics' && analytics && (
            <div style={{ animation: 'slideUp 0.8s ease' }}>
                <h1 style={{ background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Intelligence Hub</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: 60 }}>Real-time telemetry and performance distribution of your neural matrix.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40, marginBottom: 60 }}>
                    <div className="glass-card champion-card" style={{ padding: '60px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 900, opacity: 0.5, marginBottom: 20 }}>TOTAL SIGNAL RUNS</div>
                        <div style={{ fontSize: '5rem', fontWeight: 950 }}>{analytics.stats.totalRuns}</div>
                    </div>
                    <div className="glass-card" style={{ padding: '60px', textAlign: 'center', borderBottom: '6px solid var(--success)' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--success)', marginBottom: 20 }}>AVG EFFICIENCY</div>
                        <div style={{ fontSize: '5rem', fontWeight: 950, color: 'var(--success)' }}>{analytics.stats.avgScore}</div>
                    </div>
                    <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 900, opacity: 0.5, marginBottom: 20 }}>NEURAL LATENCY</div>
                        <div style={{ fontSize: '5rem', fontWeight: 950 }}>{analytics.stats.avgLatency}<span style={{ fontSize: '1.5rem', opacity: 0.4 }}>ms</span></div>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '60px' }}>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 40 }}>Architectural Stability Timeline</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {analytics.history.slice().reverse().map((h, i) => (
                            <div key={i} className="glass-card" style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 40, background: 'rgba(255,255,255,0.01)' }}>
                                <div style={{ width: 140, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 800 }}>{new Date(h.timestamp).toLocaleTimeString()}</div>
                                <div style={{ flex: 1, height: 12, background: 'rgba(0,0,0,0.4)', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                                    <div style={{ width: `${(h.score/15)*100}%`, height: '100%', background: 'var(--gradient-main)', boxShadow: '0 0 20px rgba(99,102,241,0.5)' }}></div>
                                </div>
                                <div style={{ width: 60, fontWeight: 950, textAlign: 'right', fontSize: '1.4rem' }}>{h.score}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

      </main>

      <style jsx global>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(80px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; pointer-events: none; } }
        @keyframes logoPop { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: scale(1); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
