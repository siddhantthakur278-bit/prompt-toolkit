'use client';

import { useState, useEffect } from 'react';
import { parseStdout } from '@/lib/parser';

export default function Home() {
  const [view, setView] = useState('marketing'); 
  const [showIntro, setShowIntro] = useState(true);
  const [tab, setTab] = useState('prompts');
  const [mounted, setMounted] = useState(false);
  
  // Tutorial State
  const [tutorialStep, setTutorialStep] = useState(null);

  // High-Throughput System State
  const [prompts, setPrompts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [executionResult, setExecutionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbStatus, setDbStatus] = useState('LINK: ACTIVE');

  // Input States (Hardened Scope)
  const [newPrompt, setNewPrompt] = useState({ title: '', content: '' });
  const [nextVersionContent, setNextVersionContent] = useState('');
  const [execConfig, setExecConfig] = useState({ promptId: '', versionId: '', input: '', model: 'llama-3.3-70b-versatile' });
  const [logs, setLogs] = useState(["[CORE] QUANTUM OS INITIALIZED", "[SUB] MATRIX SYNCED", "[SEC] ADVERSARY DEFENSES ACTIVE"]);

  const tutorialSteps = [
    { title: "Neural Forge", text: "Architect your base logic here. Use 'Turbo-Optimize' to leverage the Llama-3.3-70B substrate for automated refinement.", icon: "🌀" },
    { title: "Matrix Laboratory", text: "Simulate signals across multiple variants. Capture real-time latency, token usage, and accuracy scores.", icon: "🛰️" },
    { title: "Vault Registry", text: "Promote your 'Golden Signals' here. This acts as your production-ready signal warehouse.", icon: "🛡️" },
    { title: "SDK Nexus", text: "Deploy instantly with production-ready snippets in Python and Node.js.", icon: "🧬" }
  ];

  const fetchAllSystemData = async () => {
    setIsSyncing(true);
    try {
      const [pRes, tRes, aRes] = await Promise.all([
          fetch('/api/prompts'), 
          fetch('/api/templates'),
          fetch('/api/analytics')
      ]);
      const pData = await pRes.json();
      const tData = await tRes.json();
      const aData = await aRes.json();
      if (Array.isArray(pData)) setPrompts(pData);
      if (Array.isArray(tData)) setTemplates(tData);
      if (aData) setAnalytics(aData);
    } catch(e) {}
    setIsSyncing(false);
  };

  useEffect(() => {
    setMounted(true);
    if (view === 'dashboard') fetchAllSystemData();
    const timer = setTimeout(() => setShowIntro(false), 3500);
    return () => clearTimeout(timer);
  }, [tab, view]);

  if (!mounted) return null;

  // SYSTEM LOGIC
  const createPrompt = async (autoOptimize = false) => {
    if (!newPrompt.title || !newPrompt.content) return;
    setLoading(true);
    await fetch('/api/prompts', {
      method: 'POST',
      body: JSON.stringify({ ...newPrompt, autoOptimize })
    });
    setNewPrompt({ title: '', content: '' });
    await fetchAllSystemData();
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
    setLoading(true);
    await fetch(`/api/prompts/${currentPrompt.id}/version`, {
      method: 'POST',
      body: JSON.stringify({ content: nextVersionContent })
    });
    await openPrompt(currentPrompt.id);
    await fetchAllSystemData();
    setLoading(false);
  };

  const runPipeline = async () => {
    if (!execConfig.input || !execConfig.promptId) return;
    setLoading(true);
    setExecutionResult(null);
    try {
        const res = await fetch('/api/run', {
          method: 'POST',
          body: JSON.stringify(execConfig)
        });
        const data = await res.json();
        setExecutionResult(parseStdout(data.raw));
        await fetchAllSystemData();
    } catch (e) {}
    setLoading(false);
  };

  const getSDKCode = (lang) => {
    const p = currentPrompt || { title: 'TEMPLATE', versions: [{ content: 'PASTE_PROMPT_HERE' }] };
    const content = p.versions?.[p.versions.length-1]?.content || '';
    if (lang === 'python') {
        return `import groq\nclient = groq.Client(api_key="YOUR_KEY")\nprompt = """${content}"""\nresponse = client.chat.completions.create(\n    messages=[{"role": "user", "content": prompt}],\n    model="llama-3.3-70b-versatile"\n)\nprint(response.choices[0].message.content)`;
    }
    return `const { Groq } = require("groq-sdk");\nasync function main() {\n  const groq = new Groq({ apiKey: "YOUR_KEY" });\n  const chat = await groq.chat.completions.create({\n    messages: [{ role: "user", content: \`${content}\` }],\n    model: "llama-3.3-70b-versatile",\n  });\n  console.log(chat.choices[0].message.content);\n}\nmain();`;
  };

  const Sidebar = () => (
    <aside style={{ width: 340, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(100px)', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '60px 40px', cursor: 'pointer' }} onClick={() => setView('marketing')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <img src="/logo_quantum.png" style={{ height: 32 }} />
                <span style={{ fontWeight: 950, fontSize: '1.4rem' }}>QUANTUM</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--accent-primary)', marginTop: 8, fontWeight: 900, letterSpacing: '0.2em' }}>COMMAND OS v13.2</div>
        </div>
        
        <nav style={{ flex: 1, padding: '0 20px' }}>
            {[
                { id: 'prompts', label: 'Neural Forge', icon: '⚡' },
                { id: 'execute', label: 'Laboratory', icon: '🛰️' },
                { id: 'templates', label: 'Vault Registry', icon: '🛡️' },
                { id: 'workflow', label: 'Workflow Pulse', icon: '🔄' },
                { id: 'sdk', label: 'SDK Nexus', icon: '🧬' },
                { id: 'analytics', label: 'Intelligence hub', icon: '📊' }
            ].map(item => (
                <div key={item.id} onClick={() => { setTab(item.id); setExecutionResult(null); }} className={`nav-item ${tab === item.id ? 'active' : ''}`} style={{ padding: '18px 25px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: '1.3rem', opacity: tab === item.id ? 1 : 0.4 }}>{item.icon}</span>
                    <span style={{ fontWeight: 800 }}>{item.label}</span>
                </div>
            ))}
        </nav>

        <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: 15 }}>
            <button className="btn-outline" style={{ width: '100%', padding: '12px', fontSize: '0.7rem' }} onClick={() => setTutorialStep(0)}>🎓 START TUTORIAL</button>
            <div className="glass-card" style={{ padding: '15px', borderRadius: '15px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 950 }}>{isSyncing ? '⚡ SYNCING...' : `🟢 ${dbStatus}`}</span>
            </div>
        </div>
    </aside>
  );

  return (
    <div style={{ position: 'relative' }}>
        <div className="cyber-grid" style={{ opacity: 0.1 }}></div>
        
        {/* Tutorial Overlay */}
        {tutorialStep !== null && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-card" style={{ width: 500, padding: '60px', textAlign: 'center', border: '2px solid var(--accent-primary)' }}>
                    <div style={{ fontSize: '4rem', marginBottom: 20 }}>{tutorialSteps[tutorialStep].icon}</div>
                    <h2 style={{ marginBottom: 20 }}>{tutorialSteps[tutorialStep].title}</h2>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 40 }}>{tutorialSteps[tutorialStep].text}</p>
                    <div style={{ display: 'flex', gap: 20 }}>
                        <button className="btn-outline" style={{ flex: 1 }} onClick={() => setTutorialStep(null)}>SKIP</button>
                        <button className="btn-primary" style={{ flex: 2 }} onClick={() => tutorialStep < 3 ? setTutorialStep(tutorialStep+1) : setTutorialStep(null)}>{tutorialStep === 3 ? 'FINISH' : 'NEXT STEP'}</button>
                    </div>
                </div>
            </div>
        )}

        {showIntro && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: '#010305', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeOut 0.7s ease 3s forwards' }}>
                <div style={{ textAlign: 'center' }}>
                    <img src="/logo_quantum.png" style={{ width: 140, marginBottom: 10, animation: 'logoPop 1s ease' }} />
                    <div style={{ fontSize: '3rem', fontWeight: 950 }} className="shine-text">QUANTUM</div>
                </div>
            </div>
        )}

        {view === 'marketing' ? (
            <div style={{ animation: 'fadeIn 1s ease' }}>
                <nav className="navbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                        <img src="/logo_quantum.png" style={{ height: 38 }} />
                        <span style={{ fontWeight: 950, fontSize: '1.8rem' }}>QUANTUM</span>
                    </div>
                    <button className="btn-primary" style={{ padding: '14px 45px' }} onClick={() => setView('dashboard')}>LAUNCH CORE</button>
                </nav>
                <div className="container" style={{ textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h1 className="shine-text" style={{ marginBottom: 40 }}>The Gold Standard <br/> for <span style={{ color: '#fff' }}>AI Signaling.</span></h1>
                    <button className="btn-primary" style={{ alignSelf: 'center' }} onClick={() => setView('dashboard')}>ENTER THE COMMAND CORE</button>
                </div>
            </div>
        ) : (
            <div style={{ display: 'flex', height: '100vh' }}>
                <Sidebar />
                <main style={{ flex: 1, overflowY: 'auto', padding: '100px 140px' }}>
                    
                    {tab === 'prompts' && (
                        <div style={{ animation: 'slideUp 0.7s ease' }}>
                            <h2 className="shine-text" style={{ fontSize: '4.5rem', marginBottom: 20 }}>Neural Forge</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: 60, marginTop: 50 }}>
                                <div className="glass-card" style={{ padding: '70px', borderBottom: '10px solid var(--accent-primary)' }}>
                                     <input value={newPrompt.title} onChange={e => setNewPrompt({...newPrompt, title: e.target.value})} placeholder="SIGNAL IDENTITY..." style={{ marginBottom: 40 }} />
                                     <textarea value={newPrompt.content} onChange={e => setNewPrompt({...newPrompt, content: e.target.value})} rows="10" placeholder="BASE CORE INSTRUCTIONS..." />
                                     <button className="btn-primary" style={{ width: '100%', marginTop: 50 }} onClick={() => createPrompt(true)} disabled={loading}>
                                         {loading ? 'OPTIMIZING...' : '🚀 INITIATE TURBO-OPTIMIZE'}
                                     </button>
                                </div>
                                <div className="glass-card" style={{ padding: '40px' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 950, opacity: 0.4, display: 'block', marginBottom: 30 }}>ACTIVE REPOSITORY</label>
                                    {prompts.map(p => (
                                        <div key={p.id} onClick={() => openPrompt(p.id)} style={{ padding: '24px', cursor: 'pointer', background: currentPrompt?.id === p.id ? 'rgba(129, 140, 248, 0.1)' : 'transparent', borderRadius: '25px', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                                            <div style={{ fontWeight: 900 }}>{p.title}</div>
                                            <div className="badge badge-accent">{p.versionCount} ITER</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {currentPrompt && (
                                <div className="glass-card" style={{ marginTop: 80, padding: '80px' }}>
                                    <h2 style={{ marginBottom: 40 }}>Nexus Iteration: {currentPrompt.title}</h2>
                                    <textarea value={nextVersionContent} onChange={e => setNextVersionContent(e.target.value)} rows="10" style={{ marginBottom: 40 }} />
                                    <button className="btn-primary" onClick={addVersion} disabled={loading}>COMMIT SIGNAL v{(currentPrompt?.versions?.length || 0) + 1}</button>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'execute' && (
                        <div style={{ animation: 'slideUp 0.7s ease' }}>
                            <h2 className="shine-text" style={{ fontSize: '4.5rem' }}>Laboratory</h2>
                            <div className="glass-card" style={{ padding: '80px', marginTop: 50 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, marginBottom: 40 }}>
                                    <select value={execConfig.promptId} onChange={e => setExecConfig({...execConfig, promptId: e.target.value})}>
                                        <option value="">SELECT SIGNAL SOURCE...</option>
                                        {prompts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                    </select>
                                    <select value={execConfig.versionId} onChange={e => setExecConfig({...execConfig, versionId: e.target.value})}>
                                        <option value="">ALL VERSIONS</option>
                                        {prompts.find(p => p.id === execConfig.promptId)?.versions?.map(v => <option key={v.version} value={v.version}>{v.version}</option>)}
                                    </select>
                                </div>
                                <input value={execConfig.input} onChange={e => setExecConfig({...execConfig, input: e.target.value})} placeholder="INPUT TEST VECTOR..." style={{ marginBottom: 50 }} />
                                <button className="btn-primary" style={{ width: '100%', padding: '30px' }} onClick={runPipeline} disabled={loading}>{loading ? 'EXECUTING MATRIX...' : '⚡ INITIATE MATRIX RUN'}</button>
                            </div>
                            {executionResult && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 40, marginTop: 80 }}>
                                    {executionResult.executions.map((e, idx) => (
                                        <div key={idx} className="glass-card" style={{ padding: '60px', borderLeft: executionResult.bestVer === e.version ? '15px solid var(--success)' : '10px solid var(--accent-primary)' }}>
                                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
                                                <span style={{ fontWeight: 950, fontSize: '1.5rem' }}>{e.version}</span>
                                                <span style={{ fontWeight: 950, fontSize: '2rem', color: executionResult.bestVer === e.version ? 'var(--success)' : 'white' }}>{e.scores.totalScore}</span>
                                             </div>
                                             <div className="output-quote" style={{ background: 'rgba(0,0,0,0.5)', padding: '30px' }}>{e.outputText}</div>
                                             <div style={{ marginTop: 30, fontSize: '0.8rem', opacity: 0.5 }}>LATENCY: {e.meta.latency}ms | TOKENS: {e.meta.tokens}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'workflow' && (
                        <div style={{ animation: 'slideUp 0.7s ease' }}>
                            <h2 className="shine-text" style={{ fontSize: '4.5rem' }}>Workflow Pulse</h2>
                            <p style={{ opacity: 0.5, marginTop: 10, fontSize: '1.2rem' }}>Automated Signaling Pipeline: Local Node → n8n Webhook → Google Sheets</p>
                            
                            <div style={{ marginTop: 80, position: 'relative' }}>
                                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--accent-primary), var(--success))', zIndex: 0, opacity: 0.3 }}></div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 30, position: 'relative', zIndex: 1 }}>
                                    {[
                                        { step: "01", title: "DRAFT", desc: "Neural Forge Entry", icon: "⚡" },
                                        { step: "02", title: "ITERATE", desc: "Cluster Versioning", icon: "🧬" },
                                        { step: "03", title: "OPTIMIZE", desc: "AI Substrate Polish", icon: "🌀" },
                                        { step: "04", title: "VALIDATE", desc: "Matrix Lab Simulation", icon: "🛰️" },
                                        { step: "05", title: "SYNC", desc: "n8n → Google Sheets", icon: "📊" }
                                    ].map((s, i) => (
                                        <div key={i} className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.8)' }}>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 950, color: 'var(--accent-primary)', marginBottom: 15 }}>STEP {s.step}</div>
                                            <div style={{ fontSize: '2.5rem', marginBottom: 15 }}>{s.icon}</div>
                                            <div style={{ fontWeight: 950, marginBottom: 10 }}>{s.title}</div>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.4 }}>{s.desc}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="glass-card" style={{ marginTop: 60, padding: '60px', borderLeft: '10px solid var(--success)' }}>
                                <h3 style={{ marginBottom: 30 }}>Live Automation Status</h3>
                                <div style={{ display: 'flex', gap: 60 }}>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: 10 }}>WEBHOOK ENDPOINT</div>
                                        <code style={{ fontSize: '0.9rem', color: 'var(--success)' }}>{process.env.NEXT_PUBLIC_N8N_URL || "https://n8n.workflow.internal/webhook/..."}</code>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: 10 }}>TARGET WAREHOUSE</div>
                                        <div style={{ fontWeight: 900 }}>Google Sheets: "Optimized_Signals_V1"</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: 10 }}>LAST SYNC</div>
                                        <div style={{ fontWeight: 900 }}>{new Date().toLocaleTimeString()}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === 'templates' && (
                        <div style={{ animation: 'slideUp 0.7s ease' }}>
                            <h2 className="shine-text" style={{ fontSize: '4.5rem' }}>Vault Registry</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(600px, 1fr))', gap: 40, marginTop: 60 }}>
                                {templates.map((t, idx) => (
                                    <div key={idx} className="glass-card" style={{ padding: '60px', borderTop: '8px solid var(--success)' }}>
                                        <div style={{ fontSize: '2.2rem', fontWeight: 950, marginBottom: 30 }}>{t.title} 🏆 {t.versionId}</div>
                                        <div className="output-quote">{t.content}</div>
                                        <div style={{ marginTop: 30, color: 'var(--success)', fontWeight: 950 }}>EFFICIENCY: {(t.score/15*100).toFixed(0)}%</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {tab === 'sdk' && (
                        <div style={{ animation: 'slideUp 0.7s ease' }}>
                            <h2 className="shine-text" style={{ fontSize: '4.5rem' }}>SDK Nexus</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 60 }}>
                                <div className="glass-card" style={{ padding: '50px' }}>
                                    <div style={{ color: '#3b82f6', fontWeight: 900, marginBottom: 30 }}>PYTHON DEPLOYMENT</div>
                                    <div className="output-quote" style={{ fontSize: '0.85rem' }}>{getSDKCode('python')}</div>
                                </div>
                                <div className="glass-card" style={{ padding: '50px' }}>
                                    <div style={{ color: '#f59e0b', fontWeight: 900, marginBottom: 30 }}>NODE.JS DEPLOYMENT</div>
                                    <div className="output-quote" style={{ fontSize: '0.85rem' }}>{getSDKCode('node')}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === 'analytics' && analytics && (
                        <div style={{ animation: 'slideUp 0.7s ease' }}>
                            <h2 className="shine-text" style={{ fontSize: '4.5rem' }}>Intelligence Hub</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40, marginTop: 60 }}>
                                <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
                                    <div style={{ opacity: 0.5, fontWeight: 900, fontSize: '0.8rem', marginBottom: 20 }}>TOTAL SIMULATIONS</div>
                                    <div style={{ fontSize: '6rem', fontWeight: 950 }}>{analytics.stats.totalRuns}</div>
                                </div>
                                <div className="glass-card" style={{ padding: '60px', textAlign: 'center', borderBottom: '10px solid var(--success)' }}>
                                    <div style={{ color: 'var(--success)', fontWeight: 900, fontSize: '0.8rem', marginBottom: 20 }}>AVG EFFICIENCY</div>
                                    <div style={{ fontSize: '6rem', fontWeight: 950, color: 'var(--success)' }}>{analytics.stats.avgScore}</div>
                                </div>
                                <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
                                    <div style={{ opacity: 0.5, fontWeight: 900, fontSize: '0.8rem', marginBottom: 20 }}>NEURAL LATENCY</div>
                                    <div style={{ fontSize: '6rem', fontWeight: 950 }}>{analytics.stats.avgLatency}<span style={{ fontSize: '1.5rem', opacity: 0.4 }}>ms</span></div>
                                </div>
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
