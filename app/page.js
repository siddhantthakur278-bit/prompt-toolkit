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

  // Recipes Data
  const recipes = [
    { title: 'Chain-of-Thought', icon: '🧠', logic: '\n\nThink step-by-step and show your reasoning before the final answer.' },
    { title: 'Self-Critique', icon: '⚖️', logic: '\n\nAfter generating the response, critique it for accuracy and provide an improved version.' },
    { title: 'Extreme Detail', icon: '🔭', logic: '\n\nProvide an exhaustive breakdown, covering every technical edge-case possible.' },
    { title: 'Structural JSON', icon: '📦', logic: '\n\nFormat your output strictly as valid JSON according to the following schema: { ... }' },
    { title: 'Persona Injection', icon: '👤', logic: '\n\nAct as a Senior Principal Engineer with 20 years of experience in distributed systems.' }
  ];

  const applyRecipe = (logic) => {
    if (currentPrompt) {
        setNextVersionContent(prev => prev + logic);
        alert("Neural Recipe injected into Nexus.");
    } else {
        setNewPrompt(prev => ({ ...prev, content: prev.content + logic }));
        alert("Neural Recipe injected into Forge Seed.");
    }
  };

  const checkHealth = async () => {
    try {
        const res = await fetch('/api/health');
        const { status } = await res.json();
        setDbStatus(status === 'connected' ? 'QUANTUM-LINK ACTIVE' : 'L-STORAGE OFFLINE');
    } catch(e) {
        setDbStatus('L-STORAGE OFFLINE');
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
    
    const timer = setTimeout(() => {
        setShowIntro(false);
    }, 4000);
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

  const selectedPromptData = prompts.find(p => p.id === execConfig.promptId);

  return (
    <div style={{ display: 'flex', height: '100vh', position: 'relative' }}>
      
      {/* Intro Overlay */}
      {showIntro && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeOut 0.5s ease 3.5s forwards' }}>
            <div style={{ textAlign: 'center' }}>
                <img src="/logo_quantum.png" style={{ width: 180, marginBottom: 20, animation: 'logoPop 1s ease both' }} />
                <div style={{ fontSize: '3rem', fontWeight: 900, background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em', animation: 'fadeInUp 1s ease 0.5s both' }}>QUANTUM.PROMPT</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.4em', fontSize: '0.7rem', fontWeight: 600, marginTop: 10, animation: 'fadeInUp 1s ease 0.8s both' }}>ELITE INTELLIGENCE SUITE</div>
            </div>
        </div>
      )}

      {/* Modern Sidebar */}
      <aside style={{ width: 320, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(80px)', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
        <div style={{ padding: '50px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, background: 'var(--gradient-main)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem' }}>Q</div>
              <div style={{ fontWeight: 900, letterSpacing: '-0.02em', fontSize: '1.4rem' }}>QUANTUM</div>
          </div>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent-primary)', opacity: 0.6, letterSpacing: '0.2em' }}>ELITE DASHBOARD v7.0</div>
        </div>
        
        <nav style={{ flex: 1, padding: '0 20px' }}>
          {[
            { id: 'prompts', label: 'Prompt Forge', icon: '⚡' },
            { id: 'recipes', label: 'Tactical Recipes', icon: '🧪' },
            { id: 'execute', label: 'Benchmark Lab', icon: '🛰️' },
            { id: 'templates', label: 'Signal Library', icon: '🛡️' },
            { id: 'analytics', label: 'Signal Metrics', icon: '📊' },
            { id: 'manifest', label: 'Vault Manifest', icon: '📑' }
          ].map(item => (
            <div 
              key={item.id}
              onClick={() => { setTab(item.id); setExecutionResult(null); }}
              className={`nav-item ${tab === item.id ? 'active' : ''}`}
              style={{ padding: '16px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}
            >
              <span style={{ fontSize: '1.2rem', opacity: tab === item.id ? 1 : 0.4 }}>{item.icon}</span>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.label}</span>
            </div>
          ))}
        </nav>
        
        <div style={{ padding: '40px' }}>
            <div className="glass-card" style={{ padding: '16px 20px', borderRadius: '18px', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="live-indicator" style={{ width: 8, height: 8, background: 'var(--success)', borderRadius: '50%', boxShadow: '0 0 10px var(--success)' }}></div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>{dbStatus}</span>
                </div>
            </div>
        </div>
      </aside>

      {/* Workspace */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '80px 100px', scrollBehavior: 'smooth' }}>
        
        {tab === 'prompts' && (
          <div style={{ animation: 'slideUp 0.6s ease' }}>
            <div style={{ marginBottom: 60 }}>
                <h1>Prompt Forge</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: 12 }}>Architect and evolve your neural instructions through autonomous iteration.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: 40, alignItems: 'start' }}>
              <div className="glass-card" style={{ padding: '50px' }}>
                <div style={{ marginBottom: 30 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--accent-primary)', marginBottom: 12, display: 'block' }}>SIGNAL IDENTITY</label>
                    <input value={newPrompt.title} onChange={e => setNewPrompt({...newPrompt, title: e.target.value})} placeholder="e.g. Tactical Support Agent" />
                </div>
                <div style={{ marginBottom: 40 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--accent-primary)', marginBottom: 12, display: 'block' }}>SEED LOGIC</label>
                    <textarea value={newPrompt.content} onChange={e => setNewPrompt({...newPrompt, content: e.target.value})} rows="8" placeholder="Enter base prompt structure..." />
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                    <button className="btn btn-primary" style={{ flex: 2, padding: '20px' }} onClick={() => createPrompt(true)}>🚀 Turbo-Evolve Sequence</button>
                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => createPrompt(false)}>Manual Init</button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: 20, display: 'block' }}>🛰️ ACTIVE REPOSITORY</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {prompts.map(p => (
                    <div key={p.id} className="glass-card" style={{ padding: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: currentPrompt?.id === p.id ? '6px solid var(--accent-primary)' : '1px solid var(--glass-border)' }} onClick={() => { openPrompt(p.id); setTimeout(() => document.getElementById('nexus')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 4 }}>{p.title}</div>
                        <span className="badge badge-accent">{p.versionCount} ITERATIONS</span>
                      </div>
                      <div style={{ fontSize: '1.2rem', opacity: 0.3 }}>→</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {currentPrompt && (
              <div id="nexus" className="glass-card" style={{ marginTop: 60, padding: '60px', animation: 'slideUp 0.6s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40, alignItems: 'center' }}>
                    <h2>Neural Nexus: {currentPrompt.title}</h2>
                    <button className="btn btn-outline" style={{ padding: '10px 20px' }} onClick={() => setCurrentPrompt(null)}>Dismiss</button>
                </div>
                <textarea value={nextVersionContent} onChange={e => setNextVersionContent(e.target.value)} rows="10" style={{ marginBottom: 30, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.05)' }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 60 }}>
                    <button className="btn btn-primary" style={{ padding: '18px 50px' }} onClick={addVersion}>Commit v{(currentPrompt?.versions?.length || 0) + 1}</button>
                </div>
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 50 }}>
                   <div style={{ fontWeight: 900, fontSize: '1.2rem', marginBottom: 30 }}>⏮️ LINEAGE LOG</div>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 24 }}>
                     {[...(currentPrompt?.versions || [])].reverse().map((v, i) => (
                       <div key={i} className="glass-card" style={{ padding: '30px', background: 'rgba(255,255,255,0.01)' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <span className="badge badge-accent">VERSION {v.version}</span>
                            <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>{new Date(v.createdAt).toLocaleDateString()}</span>
                         </div>
                         <div className="output-quote" style={{ fontSize: '0.85rem' }}>{v.content}</div>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'recipes' && (
          <div style={{ animation: 'slideUp 0.6s ease' }}>
            <div style={{ marginBottom: 60 }}>
                <h1>Tactical Recipes</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: 12 }}>One-click neural enhancements to inject advanced reasoning into your prompts.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 32 }}>
                {recipes.map((r, i) => (
                    <div key={i} className="glass-card" style={{ padding: '40px', borderLeft: '6px solid var(--accent-primary)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 20 }}>{r.icon}</div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 12 }}>{r.title}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 30 }}>Apply this tactical logic to your current workspace to enhance AI performance.</p>
                        <button className="btn btn-primary" style={{ width: '100%', padding: '16px' }} onClick={() => applyRecipe(r.logic)}>Inject Recipe</button>
                    </div>
                ))}
            </div>
          </div>
        )}

        {tab === 'manifest' && (
          <div style={{ animation: 'slideUp 0.6s ease' }}>
            <div style={{ marginBottom: 60 }}>
                <h1>Vault Manifest</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: 12 }}>A complete inventory of all optimized signals in your repository.</p>
            </div>
            <div className="glass-card" style={{ padding: '50px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 20, borderBottom: '1px solid var(--glass-border)', paddingBottom: 20, marginBottom: 20, fontWeight: 900, fontSize: '0.8rem', opacity: 0.4 }}>
                    <div>SIGNAL NAME</div>
                    <div>IDENTITY ID</div>
                    <div>ITERATIONS</div>
                    <div>STATUS</div>
                </div>
                {prompts.map(p => (
                    <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 20, padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ fontWeight: 800 }}>{p.title}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', opacity: 0.6 }}>{p.id}</div>
                        <div style={{ fontWeight: 800 }}>{p.versionCount}</div>
                        <div><span className="badge badge-success">STABLE</span></div>
                    </div>
                ))}
            </div>
          </div>
        )}

        {tab === 'execute' && (
          <div style={{ animation: 'slideUp 0.6s ease' }}>
            <h1 style={{ marginBottom: 60 }}>Benchmark Lab</h1>
            <div className="glass-card" style={{ padding: '60px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 40 }}>
                  <select value={execConfig.promptId} onChange={e => setExecConfig({...execConfig, promptId: e.target.value, versionId: ''})}>
                      <option value="">Select core...</option>
                      {prompts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                  <select value={execConfig.versionId} onChange={e => setExecConfig({...execConfig, versionId: e.target.value})}>
                      <option value="">Matrix Benchmark</option>
                      {selectedPromptData && Array.from({length: selectedPromptData.versionCount}, (_, i) => `v${i+1}`).map(v => <option key={v} value={v}>Locked {v}</option>)}
                  </select>
              </div>
              <input value={execConfig.input} onChange={e => setExecConfig({...execConfig, input: e.target.value})} placeholder="Input signal..." style={{ marginBottom: 40 }} />
              <button className="btn btn-primary" style={{ width: '100%', padding: '24px' }} onClick={runPipeline} disabled={loading}>
                {loading ? '🛰️ EVALUATING...' : '⚡ INITIATE PROTOCOL'}
              </button>
            </div>
            {executionResult && (
               <div style={{ marginTop: 80 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                     <h2>Performance Report</h2>
                     {executionResult.bestVer && <div className="badge badge-success" style={{ padding: '12px 24px' }}>🏆 WINNER: {executionResult.bestVer}</div>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 32 }}>
                    {executionResult.executions.map((e, idx) => (
                      <div key={idx} className="glass-card" style={{ padding: '40px', borderLeft: '10px solid var(--accent-primary)' }}>
                        <div style={{ fontWeight: 900, marginBottom: 20 }}>{e.version} (Score: {e.scores.totalScore})</div>
                        <div className="output-quote" style={{ maxHeight: 300, overflowY: 'auto' }}>{e.outputText}</div>
                      </div>
                    ))}
                  </div>
               </div>
            )}
          </div>
        )}

        {tab === 'templates' && (
          <div style={{ animation: 'slideUp 0.6s ease' }}>
             <h1 style={{ marginBottom: 60 }}>Signal Library</h1>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: 40 }}>
                {templates.map((t, idx) => (
                  <div key={idx} className="glass-card" style={{ borderTop: '6px solid var(--success)', padding: '40px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
                        <strong style={{ fontSize: '1.4rem' }}>{t.title}</strong>
                        <span className="badge badge-success">🏆 {t.versionId}</span>
                     </div>
                     <div className="output-quote" style={{ marginBottom: 30 }}>{t.content}</div>
                     <div className="output-quote" style={{ background: 'rgba(16, 185, 129, 0.05)', color: '#cbd5e1' }}>{t.bestResponse}</div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {tab === 'analytics' && analytics && (
          <div style={{ animation: 'slideUp 0.6s ease' }}>
            <h1 style={{ marginBottom: 60 }}>Signal Metrics</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32, marginBottom: 60 }}>
                <div className="glass-card" style={{ padding: '50px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 900, opacity: 0.6, marginBottom: 16 }}>TOTAL EVALUATIONS</div>
                    <div style={{ fontSize: '4rem', fontWeight: 900 }}>{analytics.stats.totalRuns}</div>
                </div>
                <div className="glass-card" style={{ padding: '50px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 900, opacity: 0.6, marginBottom: 16 }}>AVG EFFICIENCY</div>
                    <div style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--success)' }}>{analytics.stats.avgScore}</div>
                </div>
                <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 900, opacity: 0.6, marginBottom: 16 }}>NEURAL LATENCY</div>
                    <div style={{ fontSize: '4rem', fontWeight: 900 }}>{analytics.stats.avgLatency}ms</div>
                </div>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(60px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; pointer-events: none; } }
        @keyframes logoPop { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
