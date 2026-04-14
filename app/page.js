'use client';

import { useState, useEffect } from 'react';
import { parseStdout } from '@/lib/parser';

export default function Home() {
  const [view, setView] = useState('marketing'); 
  const [showIntro, setShowIntro] = useState(true);
  const [tab, setTab] = useState('prompts');
  const [prompts, setPrompts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [executionResult, setExecutionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState('SYNCING...');
  const [mounted, setMounted] = useState(false);

  // Core Forms State
  const [newPrompt, setNewPrompt] = useState({ title: '', content: '' });
  const [nextVersionContent, setNextVersionContent] = useState('');
  const [execConfig, setExecConfig] = useState({ promptId: '', versionId: '', model: 'llama-3.3-70b-versatile', input: '', multiModel: false });
  
  // Bulk Input State
  const [bulkInputs, setBulkInputs] = useState('');
  const [bulkResults, setBulkResults] = useState([]);

  // Eye-catching Logs
  const [logs, setLogs] = useState([
    "[SYSTEM] RECONNECTING TO NEURAL HUB...",
    "[INFO] ACCESSING LLAMA-3 SUBSTRATE",
    "[WARN] LATENCY SPIKE DETECTED IN MATRIX-RUNNER",
    "[AUTH] ENCRYPTED TUNNEL ESTABLISHED"
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
        const newLog = `[${new Date().toLocaleTimeString()}] ${["PACKET ROUTED", "SIGNAL FLUSHED", "NEURAL SYNC", "MATRIX STABLE", "BREACH DEFLECTED", "CORE OPTIMIZED"][Math.floor(Math.random()*6)]}`;
        setLogs(prev => [newLog, ...prev.slice(0, 12)]);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
        const res = await fetch('/api/health');
        const { status } = await res.json();
        setDbStatus(status === 'connected' ? 'QUANTUM-LINK ACTIVE' : 'LOCAL-CORE-MODE');
    } catch(e) { setDbStatus('LOCAL-CORE-MODE'); }
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
    const timer = setTimeout(() => setShowIntro(false), 3500);
    return () => clearTimeout(timer);
  }, [tab]);

  if (!mounted) return null;

  const createPrompt = async (autoOptimize = false) => {
    if (!newPrompt.title || !newPrompt.content) return;
    setLoading(true);
    try {
        await fetch('/api/prompts', {
          method: 'POST',
          body: JSON.stringify({ ...newPrompt, autoOptimize })
        });
        setNewPrompt({ title: '', content: '' });
        await fetchPrompts();
    } catch(e) {}
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
    if (!nextVersionContent || !currentPrompt) return;
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

  const handleLaunch = () => {
    setView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getSDKCode = (lang) => {
    const p = currentPrompt || { title: 'TEMPLATE', versions: [{ content: 'PASTE_PROMPT_HERE' }] };
    const content = p.versions?.[p.versions.length-1]?.content || '';
    if (lang === 'python') {
        return `import groq\n\nclient = groq.Client(api_key="YOUR_KEY")\n\n# Fantastic Signal: ${p.title}\nprompt = """${content}"""\n\nresponse = client.chat.completions.create(\n    messages=[{"role": "user", "content": prompt}],\n    model="llama-3.3-70b-versatile"\n)\nprint(response.choices[0].message.content)`;
    }
    return `const { Groq } = require("groq-sdk");\n\nconst groq = new Groq({ apiKey: "YOUR_KEY" });\n\n// Fantastic Signal: ${p.title}\nconst prompt = \`${content}\`;\n\nasync function main() {\n  const chat = await groq.chat.completions.create({\n    messages: [{ role: "user", content: prompt }],\n    model: "llama-3.3-70b-versatile",\n  });\n  console.log(chat.choices[0].message.content);\n}\nmain();`;
  };

  // --- SUB-COMPONENTS ---

  const Sidebar = () => (
    <aside style={{ width: 340, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(100px)', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
        <div style={{ padding: '60px 40px', cursor: 'pointer' }} onClick={() => setView('marketing')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 10 }}>
                <img src="/logo_quantum.png" style={{ height: 36, filter: 'drop-shadow(0 0 10px var(--accent-primary))' }} />
                <span style={{ fontWeight: 950, fontSize: '1.6rem', letterSpacing: '-0.04em' }}>QUANTUM</span>
            </div>
            <p style={{ fontSize: '0.65rem', color: 'var(--accent-primary)', fontWeight: 900, letterSpacing: '0.3em' }}>ULTRA-ENGINE CORE</p>
        </div>
        
        <nav style={{ flex: 1, padding: '0 24px' }}>
            {[
                { id: 'prompts', label: 'Neural Forge', icon: '🌀' },
                { id: 'execute', label: 'Laboratory', icon: '🛰️' },
                { id: 'templates', label: 'Archived Core', icon: '🛡️' },
                { id: 'sdk', label: 'SDK Nexus', icon: '🧬' },
                { id: 'analytics', label: 'Metrics hub', icon: '📊' }
            ].map(item => (
                <div key={item.id} onClick={() => { setTab(item.id); setExecutionResult(null); }} className={`nav-item ${tab === item.id ? 'active' : ''}`} style={{ padding: '20px 30px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 18 }}>
                    <span style={{ fontSize: '1.4rem', opacity: tab === item.id ? 1 : 0.4 }}>{item.icon}</span>
                    <span style={{ fontWeight: 800, fontSize: '1rem' }}>{item.label}</span>
                </div>
            ))}
        </nav>

        <div className="log-stream">
            {logs.map((log, i) => <div key={i} style={{ marginBottom: 4 }}>{log}</div>)}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '50px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}></div>
        </div>

        <div style={{ padding: '40px' }}>
            <div className="glass-card" style={{ padding: '20px', borderRadius: '20px', textAlign: 'center', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--success)' }}>● {dbStatus}</span>
            </div>
        </div>
    </aside>
  );

  return (
    <div style={{ position: 'relative' }}>
        {/* Eye-catching Atmospheric Elements */}
        <div className="cyber-grid" style={{ opacity: view === 'marketing' ? 0.2 : 0.05 }}></div>
        <div className="glow-point" style={{ top: '10%', left: '10%' }}></div>
        <div className="glow-point" style={{ bottom: '10%', right: '10%', background: 'radial-gradient(circle, var(--accent-secondary) 0%, transparent 70%)' }}></div>

        {showIntro && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeOut 0.6s ease 3s forwards' }}>
                <div style={{ textAlign: 'center' }}>
                    <img src="/logo_quantum.png" style={{ width: 140, marginBottom: 20, animation: 'logoPop 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) both' }} />
                    <div style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '0.2em', color: '#fff' }}>QUANTUM CORE</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', marginTop: 10, letterSpacing: '0.6em' }}>STABILIZING NEURAL MATRIX...</div>
                </div>
            </div>
        )}

        {view === 'marketing' ? (
            <div style={{ animation: 'fadeIn 1s ease' }}>
                <nav className="navbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                        <img src="/logo_quantum.png" style={{ height: 36, filter: 'drop-shadow(0 0 10px var(--accent-primary))' }} />
                        <span style={{ fontWeight: 950, fontSize: '1.8rem', letterSpacing: '-0.04em' }}>QUANTUM</span>
                    </div>
                    <button className="btn-primary" style={{ padding: '14px 40px', fontSize: '0.8rem' }} onClick={handleLaunch}>LAUNCH CORE</button>
                </nav>

                <div className="reveal container" style={{ textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h1 className="shine-text">Design the Signals <br/> that Define <span style={{ color: '#fff' }}>AI.</span></h1>
                    <p style={{ fontSize: '1.6rem', color: 'var(--text-muted)', maxWidth: 1000, margin: '50px auto 80px', lineHeight: 1.5 }}>The world's first autonomous prompt engineering suite for high-performance researchers.</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 30 }}>
                        <button className="btn-primary" onClick={handleLaunch}>ENTER COMMAND CORE</button>
                        <button className="btn-outline">VIEW MANIFEST</button>
                    </div>
                    <div style={{ marginTop: 120, display: 'flex', justifyContent: 'center', gap: 80, opacity: 0.2, fontWeight: 900, filter: 'grayscale(1)' }}>
                        <span>NVIDIA</span><span>ANTHROPIC</span><span>OPENAI</span><span>META</span>
                    </div>
                </div>
            </div>
        ) : (
            <div style={{ display: 'flex', height: '100vh' }}>
                <Sidebar />
                <main style={{ flex: 1, overflowY: 'auto', padding: '100px 140px', position: 'relative' }}>
                    
                    {tab === 'prompts' && (
                        <div style={{ animation: 'slideUp 0.8s ease' }}>
                            <h2 className="shine-text" style={{ fontSize: '4.5rem', marginBottom: 20 }}>Neural Forge</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: 60, marginTop: 60 }}>
                                <div className="glass-card" style={{ padding: '60px', borderBottom: '10px solid var(--accent-primary)' }}>
                                     <input value={newPrompt.title} onChange={e => setNewPrompt({...newPrompt, title: e.target.value})} placeholder="Signal Name..." style={{ fontSize: '1.8rem', fontWeight: 900, border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'transparent', width: '100%', marginBottom: 40, outline: 'none' }} />
                                     <textarea value={newPrompt.content} onChange={e => setNewPrompt({...newPrompt, content: e.target.value})} rows="10" placeholder="Construct Signal Logic..." />
                                     <button className="btn-primary" style={{ width: '100%', padding: '24px', marginTop: 40 }} onClick={() => createPrompt(true)} disabled={loading}>
                                         {loading ? 'CALIBRATING...' : '🚀 INITIATE TURBO-OPTIMIZE'}
                                     </button>
                                </div>
                                <div className="glass-card" style={{ padding: '40px' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 950, opacity: 0.4, display: 'block', marginBottom: 30 }}>REPOSITORY HUB</label>
                                    {prompts.map(p => (
                                        <div key={p.id} onClick={() => openPrompt(p.id)} style={{ padding: '24px', cursor: 'pointer', background: currentPrompt?.id === p.id ? 'rgba(129,140,248,0.1)' : 'transparent', borderRadius: '20px', marginBottom: 15, border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                                            <div style={{ fontWeight: 900 }}>{p.title}</div>
                                            <div className="badge badge-accent">{p.versionCount} V</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {currentPrompt && (
                                <div className="glass-card" style={{ marginTop: 60, padding: '60px' }}>
                                    <h2 style={{ marginBottom: 30 }}>Nexus Edit: {currentPrompt.title}</h2>
                                    <textarea value={nextVersionContent} onChange={e => setNextVersionContent(e.target.value)} rows="8" />
                                    <button className="btn-primary" style={{ marginTop: 20 }} onClick={addVersion}>COMMIT v{(currentPrompt?.versions?.length || 0) + 1}</button>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'execute' && (
                        <div style={{ animation: 'slideUp 0.8s ease' }}>
                            <h2 className="shine-text" style={{ fontSize: '4.5rem' }}>Laboratory</h2>
                            <div className="glass-card" style={{ padding: '80px', marginTop: 60 }}>
                                <input value={execConfig.input} onChange={e => setExecConfig({...execConfig, input: e.target.value})} placeholder="Input Signal Vector..." style={{ marginBottom: 40 }} />
                                <button className="btn-primary" style={{ width: '100%', padding: '28px' }} onClick={runPipeline}>INITIATE EVALUATION</button>
                            </div>
                        </div>
                    )}

                    {tab === 'analytics' && (
                        <div style={{ animation: 'slideUp 0.8s ease' }}>
                            <h2 className="shine-text" style={{ fontSize: '4.5rem' }}>Intelligence Hub</h2>
                            <div className="glass-card" style={{ padding: '100px', textAlign: 'center', marginTop: 60 }}>
                                <div style={{ fontSize: '10rem', fontWeight: 950, color: 'var(--success)' }}>98.2</div>
                                <p style={{ fontSize: '1.2rem', fontWeight: 900, opacity: 0.4 }}>GLOBAL STABILITY QUOTIENT</p>
                            </div>
                        </div>
                    )}

                </main>
            </div>
        )}

        <style jsx global>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(60px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; pointer-events: none; } }
            @keyframes logoPop { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: scale(1); } }
        `}</style>
    </div>
  );
}
