"use client";

import { useState, useEffect } from "react";
import { parseStdout } from "@/lib/parser";

export default function Home() {
  const [view, setView] = useState("marketing");
  const [showIntro, setShowIntro] = useState(true);
  const [tab, setTab] = useState("prompts");
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  // Tutorial State
  const [tutorialStep, setTutorialStep] = useState(null);

  // High-Throughput System State
  const [prompts, setPrompts] = useState([]);
  const [suites, setSuites] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [executionResult, setExecutionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbStatus, setDbStatus] = useState("LINK: ACTIVE");
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [showRadar, setShowRadar] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersion, setCompareVersion] = useState("");
  const [deployingId, setDeployingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const mockDeploy = (id) => {
    setDeployingId(id);
    setTimeout(() => {
      setDeployingId(null);
      alert("SIGNAL DEPLOYED TO EDGE NODES SUCCESSFULLY.");
    }, 3000);
  };

  // Input States (Hardened Scope)
  const [newPrompt, setNewPrompt] = useState({ title: "", content: "" });
  const [newSuite, setNewSuite] = useState({ title: "" });
  const [nextVersionContent, setNextVersionContent] = useState("");
  const [execConfig, setExecConfig] = useState({
    promptId: "",
    versionId: "",
    input: "",
    model: "llama-3.3-70b-versatile",
  });
  const [logs, setLogs] = useState([
    "[CORE] QUANTUM OS INITIALIZED",
    "[SUB] MATRIX SYNCED",
    "[SEC] ADVERSARY DEFENSES ACTIVE",
  ]);

  const tutorialSteps = [
    {
      title: "Neural Forge",
      text: "Architect your base logic here. Use 'Turbo-Optimize' to leverage the Llama-3.3-70B substrate for automated refinement.",
      icon: "🌀",
    },
    {
      title: "Matrix Laboratory",
      text: "Simulate signals across multiple variants. Capture real-time latency, token usage, and accuracy scores.",
      icon: "🛰️",
    },
    {
      title: "Vault Registry",
      text: "Promote your 'Golden Signals' here. This acts as your production-ready signal warehouse.",
      icon: "🛡️",
    },
    {
      title: "SDK Nexus",
      text: "Deploy instantly with production-ready snippets in Python and Node.js.",
      icon: "🧬",
    },
  ];

  const fetchAllSystemData = async () => {
    setIsSyncing(true);
    try {
      const [pRes, sRes, tRes, aRes] = await Promise.all([
        fetch("/api/prompts"),
        fetch("/api/suites"),
        fetch("/api/templates"),
        fetch("/api/analytics"),
      ]);
      const pData = await pRes.json();
      const sData = await sRes.json();
      const tData = await tRes.json();
      const aData = await aRes.json();
      if (Array.isArray(pData)) setPrompts(pData);
      if (Array.isArray(sData)) setSuites(sData);
      if (Array.isArray(tData)) setTemplates(tData);
      if (aData) setAnalytics(aData);
    } catch (e) {
      console.error("System Sync Failure:", e);
      setDbStatus("SYNC ERROR");
    }
    setIsSyncing(false);
  };

  useEffect(() => {
    setMounted(true);
    if (view === "dashboard") fetchAllSystemData();
    const timer = setTimeout(() => setShowIntro(false), 3500);
    return () => clearTimeout(timer);
  }, [tab, view]);

  if (!mounted) return null;

  // SYSTEM LOGIC
  const createPrompt = async (autoOptimize = false) => {
    if (!newPrompt.title || !newPrompt.content) return;
    setLoading(true);
    try {
      await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newPrompt, autoOptimize }),
      });
      setNewPrompt({ title: "", content: "" });
      await fetchAllSystemData();
    } catch (e) {
      console.error("Create Prompt Error:", e);
    }
    setLoading(false);
  };

  const createSuite = async () => {
    if (!newSuite.title) return;
    setLoading(true);
    try {
      await fetch("/api/suites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSuite),
      });
      setNewSuite({ title: "" });
      await fetchAllSystemData();
    } catch (e) {
      console.error("Create Suite Error:", e);
    }
    setLoading(false);
  };

  const openPrompt = async (id) => {
    try {
      const res = await fetch(`/api/prompts/${id}`);
      const data = await res.json();
      setCurrentPrompt(data);
      setNextVersionContent(
        data?.versions?.[data?.versions?.length - 1]?.content || "",
      );
      setExecConfig((prev) => ({ ...prev, promptId: id }));
    } catch (e) {
      console.error("Open Prompt Error:", e);
    }
  };

  const addVersion = async () => {
    if (!nextVersionContent || !currentPrompt) return;
    setLoading(true);
    try {
      await fetch(`/api/prompts/${currentPrompt.id}/version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: nextVersionContent }),
      });
      await openPrompt(currentPrompt.id);
      await fetchAllSystemData();
    } catch (e) {
      console.error("Add Version Error:", e);
    }
    setLoading(false);
  };

  const runPipeline = async () => {
    if (!execConfig.input || !execConfig.promptId) return;
    setLoading(true);
    setExecutionResult(null);
    setTerminalLogs([
      `[SYSTEM] INITIATING MATRIX RUN: PROMPT=${execConfig.promptId}`,
      `[MODEL] LOADING SUBSTRATE: ${execConfig.model}`,
      `[SECURITY] ISOLATING EXECUTION ENVIRONMENT...`,
    ]);

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(execConfig),
      });
      const data = await res.json();

      if (data.error) {
        setTerminalLogs((prev) => [...prev, `[ERROR] ${data.error}`]);
        setExecutionResult(`[Error] ${data.error}`);
      } else {
        const parsed = parseStdout(data.raw);
        setTerminalLogs((prev) => [
          ...prev,
          `[SYSTEM] SIGNAL CAPTURED`,
          `[METRICS] LATENCY: ${parsed.executions[0]?.meta.latency}ms`,
          `[METRICS] TOKENS: ${parsed.executions[0]?.meta.tokens}`,
          `[SUCCESS] OPTIMAL VERSION: ${parsed.bestVer}`,
        ]);
        setExecutionResult(parsed);
      }
      await fetchAllSystemData();
    } catch (e) {
      setTerminalLogs((prev) => [...prev, `[FATAL] NETWORK INTERRUPT`]);
      setExecutionResult(
        `[Network Error] Failed to reach the execution engine.`,
      );
    }
    setLoading(false);
  };

  const RadarChart = ({ data }) => {
    if (!data || !data.executions) return null;
    const size = 300;
    const center = size / 2;
    const radius = size * 0.4;
    const metrics = [
      "accuracy",
      "efficiency",
      "coherence",
      "structure",
      "conciseness",
    ];

    const getPoint = (metricIndex, value, totalMetrics) => {
      const angle = (Math.PI * 2 * metricIndex) / totalMetrics - Math.PI / 2;
      const dist = (value / 5) * radius; // assuming score out of 5 for each metric
      return {
        x: center + dist * Math.cos(angle),
        y: center + dist * Math.sin(angle),
      };
    };

    return (
      <div
        className="glass-card"
        style={{ padding: "40px", textAlign: "center" }}
      >
        <h4
          style={{
            fontSize: "1rem",
            fontWeight: 900,
            marginBottom: 30,
            opacity: 0.6,
          }}
        >
          NEURAL PERFORMANCE RADAR
        </h4>
        <svg width={size} height={size}>
          {/* Background circles */}
          {[1, 2, 3, 4, 5].map((i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={(i / 5) * radius}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          ))}
          {/* Axis lines */}
          {metrics.map((m, i) => {
            const p = getPoint(i, 5, metrics.length);
            return (
              <line
                key={m}
                x1={center}
                y1={center}
                x2={p.x}
                y2={p.y}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />
            );
          })}
          {/* Version polygons */}
          {data.executions.map((e, idx) => {
            const points = metrics
              .map((_, i) => {
                const val = (e.scores.totalScore / 15) * 5; // Normalize total score for radar
                const p = getPoint(i, val, metrics.length);
                return `${p.x},${p.y}`;
              })
              .join(" ");
            const color =
              idx === 0 ? "var(--accent-primary)" : "var(--accent-secondary)";
            return (
              <polygon
                key={idx}
                points={points}
                fill={`${color}33`}
                stroke={color}
                strokeWidth="2"
              />
            );
          })}
        </svg>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 20,
            marginTop: 20,
          }}
        >
          {data.executions.map((e, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.7rem",
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background:
                    idx === 0
                      ? "var(--accent-primary)"
                      : "var(--accent-secondary)",
                }}
              ></div>
              {e.version}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getSDKCode = (lang) => {
    const p = currentPrompt || {
      title: "TEMPLATE",
      versions: [{ content: "PASTE_PROMPT_HERE" }],
    };
    const content = p.versions?.[p.versions.length - 1]?.content || "";
    if (lang === "python") {
      return `import groq\nclient = groq.Client(api_key="YOUR_KEY")\nprompt = """${content}"""\nresponse = client.chat.completions.create(\n    messages=[{"role": "user", "content": prompt}],\n    model="llama-3.3-70b-versatile"\n)\nprint(response.choices[0].message.content)`;
    }
    return `const { Groq } = require("groq-sdk");\nasync function main() {\n  const groq = new Groq({ apiKey: "YOUR_KEY" });\n  const chat = await groq.chat.completions.create({\n    messages: [{ role: "user", content: \`${content}\` }],\n    model: "llama-3.3-70b-versatile",\n  });\n  console.log(chat.choices[0].message.content);\n}\nmain();`;
  };

  const Sidebar = () => (
    <aside
      className="sidebar"
      style={{
        width: 380,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(100px)",
        borderRight: "1px solid var(--glass-border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
      }}
    >
      <div
        style={{ padding: "80px 50px", cursor: "pointer" }}
        onClick={() => setView("marketing")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 40,
              height: 40,
              background: "var(--gradient-main)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 30px rgba(99, 102, 241, 0.4)",
            }}
          >
            <img src="/logo_quantum.png" style={{ height: 24 }} />
          </div>
          <span
            style={{
              fontWeight: 950,
              fontSize: "1.8rem",
              letterSpacing: "-0.02em",
            }}
          >
            QUANTUM
          </span>
        </div>
        <div
          style={{
            fontSize: "0.65rem",
            color: "var(--accent-primary)",
            marginTop: 12,
            fontWeight: 900,
            letterSpacing: "0.3em",
            opacity: 0.8,
          }}
        >
          ELITE_COMMAND_OS v13.2
        </div>
      </div>

      <nav style={{ flex: 1, padding: "0 30px" }}>
        {[
          { id: "prompts", label: "Neural Forge", icon: "⚡" },
          { id: "suites", label: "Suite Matrix", icon: "🧪" },
          { id: "execute", label: "Laboratory", icon: "🛰️" },
          { id: "templates", label: "Vault Registry", icon: "🛡️" },
          { id: "workflow", label: "Workflow Pulse", icon: "🔄" },
          { id: "sdk", label: "SDK Nexus", icon: "🧬" },
          { id: "analytics", label: "Intelligence Hub", icon: "📊" },
        ].map((item) => (
          <div
            key={item.id}
            onClick={() => {
              setTab(item.id);
              setExecutionResult(null);
            }}
            className={`nav-item ${tab === item.id ? "active" : ""}`}
            style={{
              padding: "22px 30px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 20,
              borderRadius: "20px",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: "1.5rem",
                opacity: tab === item.id ? 1 : 0.3,
                transition: "all 0.3s",
              }}
            >
              {item.icon}
            </span>
            <span
              style={{
                fontWeight: 800,
                fontSize: "0.95rem",
                opacity: tab === item.id ? 1 : 0.5,
                letterSpacing: "0.02em",
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </nav>

      <div
        style={{
          padding: "50px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <button
          className="btn-outline"
          style={{
            width: "100%",
            padding: "15px",
            fontSize: "0.7rem",
            borderRadius: "15px",
            borderColor: "rgba(255,255,255,0.1)",
          }}
          onClick={() => setTutorialStep(0)}
        >
          🎓 INITIATE NEURAL_TRAINING
        </button>
        <div
          className="glass-card"
          style={{
            padding: "20px",
            borderRadius: "20px",
            textAlign: "center",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: isSyncing
                  ? "var(--accent-primary)"
                  : "var(--success)",
                animation: "pulse 1s infinite",
              }}
            ></div>
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 950,
                letterSpacing: "0.1em",
              }}
            >
              {isSyncing ? "SYNCING_CORES..." : `LINK_${dbStatus}`}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div className="cyber-grid"></div>
      <div className="scanlines"></div>

      {/* Tutorial Overlay */}
      {tutorialStep !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 3000,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(15px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="glass-card"
            style={{
              width: 500,
              padding: "60px",
              textAlign: "center",
              border: "2px solid var(--accent-primary)",
            }}
          >
            <div style={{ fontSize: "4rem", marginBottom: 20 }}>
              {tutorialSteps[tutorialStep].icon}
            </div>
            <h2 style={{ marginBottom: 20 }}>
              {tutorialSteps[tutorialStep].title}
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                lineHeight: 1.6,
                marginBottom: 40,
              }}
            >
              {tutorialSteps[tutorialStep].text}
            </p>
            <div style={{ display: "flex", gap: 20 }}>
              <button
                className="btn-outline"
                style={{ flex: 1 }}
                onClick={() => setTutorialStep(null)}
              >
                SKIP
              </button>
              <button
                className="btn-primary"
                style={{ flex: 2 }}
                onClick={() =>
                  tutorialStep < 3
                    ? setTutorialStep(tutorialStep + 1)
                    : setTutorialStep(null)
                }
              >
                {tutorialStep === 3 ? "FINISH" : "NEXT STEP"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showIntro && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "#010305",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "fadeOut 0.7s ease 3s forwards",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <img
              src="/logo_quantum.png"
              style={{
                width: 140,
                marginBottom: 10,
                animation: "logoPop 1s ease",
              }}
            />
            <div
              style={{ fontSize: "3rem", fontWeight: 950 }}
              className="shine-text"
            >
              QUANTUM
            </div>
          </div>
        </div>
      )}

      {view === "marketing" ? (
        <div
          style={{
            animation: "fadeIn 1.5s ease",
            position: "relative",
            zIndex: 10,
          }}
        >
          <nav className="navbar" style={{ padding: "0 80px", height: 120 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div
                style={{
                  width: 45,
                  height: 45,
                  background: "var(--gradient-main)",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 40px rgba(99, 102, 241, 0.5)",
                }}
              >
                <img src="/logo_quantum.png" style={{ height: 26 }} />
              </div>
              <span
                style={{
                  fontWeight: 950,
                  fontSize: "2rem",
                  letterSpacing: "-0.02em",
                }}
              >
                QUANTUM
              </span>
            </div>
            <button
              className="btn-primary"
              style={{ padding: "18px 50px", fontSize: "0.8rem" }}
              onClick={() => setView("dashboard")}
            >
              LAUNCH COMMAND CORE
            </button>
          </nav>
          <div
            className="container"
            style={{
              textAlign: "center",
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "40%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "800px",
                height: "800px",
                background:
                  "radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)",
                zIndex: -1,
              }}
            ></div>

            <div
              style={{
                display: "inline-block",
                padding: "10px 25px",
                borderRadius: "100px",
                background: "rgba(129, 140, 248, 0.1)",
                border: "1px solid rgba(129, 140, 248, 0.2)",
                color: "var(--accent-primary)",
                fontSize: "0.7rem",
                fontWeight: 900,
                letterSpacing: "0.3em",
                marginBottom: 40,
                alignSelf: "center",
                animation: "slideUp 1s ease",
              }}
            >
              NEXT-GEN PROMPT ENGINEERING SUBSTRATE
            </div>

            <h1
              className="shine-text"
              style={{
                marginBottom: 40,
                fontSize: "8rem",
                lineHeight: 0.85,
                animation: "slideUp 1.2s ease",
              }}
            >
              Architect the <br />
              <span
                style={{
                  color: "#fff",
                  textShadow: "0 0 50px rgba(255,255,255,0.2)",
                }}
              >
                Perfect Signal.
              </span>
            </h1>

            <p
              style={{
                maxWidth: "700px",
                alignSelf: "center",
                fontSize: "1.4rem",
                color: "var(--text-muted)",
                lineHeight: 1.6,
                marginBottom: 60,
                animation: "slideUp 1.4s ease",
              }}
            >
              The elite structured platform for versioning, optimizing, and
              validating high-throughput AI signals with neural-grade precision.
            </p>

            <div
              style={{
                display: "flex",
                gap: 30,
                justifyContent: "center",
                animation: "slideUp 1.6s ease",
              }}
            >
              <button
                className="btn-primary"
                style={{ padding: "30px 80px", fontSize: "1rem" }}
                onClick={() => setView("dashboard")}
              >
                ENTER COMMAND CORE
              </button>
              <button
                className="btn-outline"
                style={{ padding: "30px 60px" }}
                onClick={() => setTutorialStep(0)}
              >
                SYSTEM TRAINING
              </button>
            </div>

            <div
              style={{
                marginTop: 100,
                display: "flex",
                gap: 80,
                justifyContent: "center",
                opacity: 0.3,
                filter: "grayscale(1)",
                animation: "fadeIn 3s ease",
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 900,
                  letterSpacing: "0.2em",
                }}
              >
                LLAMA-3.3-70B
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 900,
                  letterSpacing: "0.2em",
                }}
              >
                GROQ_ACCELERATED
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 900,
                  letterSpacing: "0.2em",
                }}
              >
                N8N_INTEGRATED
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="dashboard-layout"
          style={{ display: "flex", height: "100vh" }}
        >
          <Sidebar />
          <main
            className="main-content"
            style={{ flex: 1, overflowY: "auto", padding: "100px 140px" }}
          >
            {tab === "prompts" && (
              <div style={{ animation: "slideUp 0.7s ease" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 30,
                    marginBottom: 50,
                  }}
                >
                  <h2 className="shine-text" style={{ fontSize: "5rem" }}>
                    Neural Forge
                  </h2>
                  <div
                    style={{
                      height: 2,
                      flex: 1,
                      background:
                        "linear-gradient(90deg, var(--accent-primary), transparent)",
                      marginBottom: 25,
                      opacity: 0.3,
                    }}
                  ></div>
                </div>

                <div
                  className="neural-forge-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.3fr 0.7fr",
                    gap: 60,
                  }}
                >
                  <div
                    className="glass-card"
                    style={{
                      padding: "70px",
                      borderBottom: "10px solid var(--accent-primary)",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 30,
                        left: 40,
                        display: "flex",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "var(--accent-primary)",
                          animation: "pulse 2s infinite",
                        }}
                      ></div>
                      <span
                        style={{
                          fontSize: "0.6rem",
                          fontWeight: 900,
                          opacity: 0.5,
                          letterSpacing: "0.2em",
                        }}
                      >
                        CORE_ARCHITECT_v4.2
                      </span>
                    </div>
                    <input
                      value={newPrompt.title}
                      onChange={(e) =>
                        setNewPrompt({ ...newPrompt, title: e.target.value })
                      }
                      placeholder="SIGNAL IDENTITY..."
                      style={{ marginBottom: 40, marginTop: 20 }}
                    />
                    <textarea
                      value={newPrompt.content}
                      onChange={(e) =>
                        setNewPrompt({ ...newPrompt, content: e.target.value })
                      }
                      rows="10"
                      placeholder="BASE CORE INSTRUCTIONS..."
                    />
                    <button
                      className="btn-primary"
                      style={{ width: "100%", marginTop: 50 }}
                      onClick={() => createPrompt(true)}
                      disabled={loading}
                    >
                      {loading ? "OPTIMIZING..." : "🚀 INITIATE TURBO-OPTIMIZE"}
                    </button>
                  </div>

                  <div className="glass-card" style={{ padding: "40px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 30,
                      }}
                    >
                      <label
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 950,
                          opacity: 0.4,
                          margin: 0,
                        }}
                      >
                        ACTIVE REPOSITORY
                      </label>
                      <span
                        style={{
                          fontSize: "0.6rem",
                          fontWeight: 900,
                          color: "var(--accent-primary)",
                        }}
                      >
                        {prompts.length} SIGNALS
                      </span>
                    </div>
                    <div
                      style={{
                        maxHeight: "600px",
                        overflowY: "auto",
                        paddingRight: "10px",
                      }}
                    >
                      {prompts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => openPrompt(p.id)}
                          style={{
                            padding: "24px",
                            cursor: "pointer",
                            background:
                              currentPrompt?.id === p.id
                                ? "rgba(129, 140, 248, 0.1)"
                                : "rgba(255,255,255,0.02)",
                            borderRadius: "25px",
                            border:
                              currentPrompt?.id === p.id
                                ? "1px solid var(--accent-primary)"
                                : "1px solid var(--glass-border)",
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 15,
                            transition: "all 0.3s",
                          }}
                        >
                          <div style={{ fontWeight: 900 }}>{p.title}</div>
                          <div
                            className={`badge ${
                              currentPrompt?.id === p.id
                                ? "badge-accent"
                                : "badge-outline"
                            }`}
                          >
                            {p.versionCount} ITER
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {currentPrompt && (
                  <div
                    className="glass-card"
                    style={{
                      marginTop: 80,
                      padding: "80px",
                      borderTop: "5px solid var(--accent-secondary)",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 30,
                        right: 40,
                        display: "flex",
                        gap: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.6rem",
                          fontWeight: 900,
                          opacity: 0.5,
                          letterSpacing: "0.2em",
                        }}
                      >
                        NEXUS_SYNC_ACTIVE
                      </span>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "var(--accent-secondary)",
                          animation: "pulse 2s infinite",
                        }}
                      ></div>
                    </div>
                    <h2 style={{ marginBottom: 40, fontSize: "2.5rem" }}>
                      Nexus Iteration: {currentPrompt.title}
                    </h2>

                    <div style={{ display: "flex", gap: 30, marginBottom: 40 }}>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 900,
                            opacity: 0.5,
                            marginBottom: 15,
                          }}
                        >
                          ACTIVE SIGNAL (EDITABLE)
                        </div>
                        <textarea
                          value={nextVersionContent}
                          onChange={(e) =>
                            setNextVersionContent(e.target.value)
                          }
                          rows="15"
                        />
                      </div>
                      {compareMode && (
                        <div style={{ flex: 1, animation: "fadeIn 0.5s ease" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 15,
                            }}
                          >
                            <div
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 900,
                                color: "var(--accent-secondary)",
                              }}
                            >
                              COMPARISON SIGNAL (READ-ONLY)
                            </div>
                            <select
                              value={compareVersion}
                              onChange={(e) =>
                                setCompareVersion(e.target.value)
                              }
                              style={{
                                width: "auto",
                                padding: "8px 15px",
                                fontSize: "0.7rem",
                                borderRadius: "10px",
                              }}
                            >
                              {currentPrompt.versions.map((v) => (
                                <option key={v.version} value={v.version}>
                                  {v.version}
                                </option>
                              ))}
                            </select>
                          </div>
                          <textarea
                            value={
                              currentPrompt.versions.find(
                                (v) => v.version === compareVersion,
                              )?.content || ""
                            }
                            readOnly
                            rows="15"
                            style={{
                              background: "rgba(0,0,0,0.3)",
                              opacity: 0.7,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 20 }}>
                      <button
                        className="btn-primary"
                        style={{ flex: 2 }}
                        onClick={addVersion}
                        disabled={loading}
                      >
                        COMMIT SIGNAL v
                        {(currentPrompt?.versions?.length || 0) + 1}
                      </button>
                      <button
                        className="btn-outline"
                        style={{ flex: 1 }}
                        onClick={() => {
                          setCompareMode(!compareMode);
                          if (
                            !compareVersion &&
                            currentPrompt.versions.length > 0
                          ) {
                            setCompareVersion(
                              currentPrompt.versions[
                                currentPrompt.versions.length - 1
                              ].version,
                            );
                          }
                        }}
                      >
                        {compareMode
                          ? "🧬 HIDE COMPARISON"
                          : "🧬 COMPARE SIGNAL"}
                      </button>
                      <button
                        className="btn-outline"
                        onClick={() => {
                          setCurrentPrompt(null);
                          setCompareMode(false);
                        }}
                      >
                        DISCARD CHANGES
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "suites" && (
              <div style={{ animation: "slideUp 0.7s ease" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 30,
                    marginBottom: 50,
                  }}
                >
                  <h2 className="shine-text" style={{ fontSize: "5rem" }}>
                    Suite Matrix
                  </h2>
                  <div
                    style={{
                      height: 2,
                      flex: 1,
                      background:
                        "linear-gradient(90deg, var(--accent-secondary), transparent)",
                      marginBottom: 25,
                      opacity: 0.3,
                    }}
                  ></div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 60,
                  }}
                >
                  <div
                    className="glass-card"
                    style={{
                      padding: "70px",
                      borderBottom: "10px solid var(--accent-secondary)",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 30,
                        left: 40,
                        display: "flex",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "var(--accent-secondary)",
                          animation: "pulse 2s infinite",
                        }}
                      ></div>
                      <span
                        style={{
                          fontSize: "0.6rem",
                          fontWeight: 900,
                          opacity: 0.5,
                          letterSpacing: "0.2em",
                        }}
                      >
                        MATRIX_INIT_v1.0
                      </span>
                    </div>
                    <h3 style={{ marginBottom: 40, marginTop: 20 }}>
                      Initialize New Suite
                    </h3>
                    <input
                      value={newSuite.title}
                      onChange={(e) => setNewSuite({ title: e.target.value })}
                      placeholder="SUITE IDENTITY (e.g. Code Quality)..."
                      style={{ marginBottom: 40 }}
                    />
                    <button
                      className="btn-primary"
                      style={{ width: "100%", background: "var(--gradient-2)" }}
                      onClick={createSuite}
                      disabled={loading}
                    >
                      {loading
                        ? "INITIALIZING..."
                        : "🧪 CREATE VALIDATION SUITE"}
                    </button>
                  </div>
                  <div className="glass-card" style={{ padding: "40px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 30,
                      }}
                    >
                      <label
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 950,
                          opacity: 0.4,
                          margin: 0,
                        }}
                      >
                        AVAILABLE SUITES
                      </label>
                      <span
                        style={{
                          fontSize: "0.6rem",
                          fontWeight: 900,
                          color: "var(--accent-secondary)",
                        }}
                      >
                        {suites.length} VECTORS
                      </span>
                    </div>
                    <div
                      style={{
                        maxHeight: "600px",
                        overflowY: "auto",
                        paddingRight: "10px",
                      }}
                    >
                      {suites.length === 0 ? (
                        <div
                          style={{
                            opacity: 0.4,
                            textAlign: "center",
                            padding: "40px",
                          }}
                        >
                          No suites detected in matrix.
                        </div>
                      ) : (
                        suites.map((s) => (
                          <div
                            key={s.id}
                            style={{
                              padding: "24px",
                              borderRadius: "25px",
                              border: "1px solid var(--glass-border)",
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: 15,
                              background: "rgba(255,255,255,0.02)",
                              transition: "all 0.3s",
                            }}
                          >
                            <div style={{ fontWeight: 900 }}>{s.title}</div>
                            <div className="badge badge-outline">
                              {s.tests?.length || 0} TESTS
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "execute" && (
              <div style={{ animation: "slideUp 0.7s ease" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 30,
                    marginBottom: 50,
                  }}
                >
                  <h2 className="shine-text" style={{ fontSize: "5rem" }}>
                    Laboratory
                  </h2>
                  <div
                    style={{
                      height: 2,
                      flex: 1,
                      background:
                        "linear-gradient(90deg, var(--accent-primary), transparent)",
                      marginBottom: 25,
                      opacity: 0.3,
                    }}
                  ></div>
                </div>

                <div
                  className="glass-card"
                  style={{ padding: "80px", position: "relative" }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 30,
                      left: 40,
                      display: "flex",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "var(--accent-primary)",
                        animation: "pulse 2s infinite",
                      }}
                    ></div>
                    <span
                      style={{
                        fontSize: "0.6rem",
                        fontWeight: 900,
                        opacity: 0.5,
                        letterSpacing: "0.2em",
                      }}
                    >
                      LAB_SIMULATOR_v9.1
                    </span>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 30,
                      marginBottom: 40,
                      marginTop: 20,
                    }}
                  >
                    <select
                      value={execConfig.promptId}
                      onChange={(e) =>
                        setExecConfig({
                          ...execConfig,
                          promptId: e.target.value,
                        })
                      }
                    >
                      <option value="">SELECT SIGNAL SOURCE...</option>
                      {prompts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                    <select
                      value={execConfig.versionId}
                      onChange={(e) =>
                        setExecConfig({
                          ...execConfig,
                          versionId: e.target.value,
                        })
                      }
                    >
                      <option value="">ALL VERSIONS</option>
                      {prompts
                        .find((p) => p.id === execConfig.promptId)
                        ?.versions?.map((v) => (
                          <option key={v.version} value={v.version}>
                            {v.version}
                          </option>
                        ))}
                    </select>
                    <select
                      value={execConfig.suiteId || ""}
                      onChange={(e) =>
                        setExecConfig({
                          ...execConfig,
                          suiteId: e.target.value,
                        })
                      }
                    >
                      <option value="">MANUAL INPUT VECTOR...</option>
                      {suites.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  {!execConfig.suiteId && (
                    <input
                      value={execConfig.input}
                      onChange={(e) =>
                        setExecConfig({ ...execConfig, input: e.target.value })
                      }
                      placeholder="INPUT TEST VECTOR..."
                      style={{ marginBottom: 50 }}
                    />
                  )}
                  <button
                    className="btn-primary"
                    style={{ width: "100%", padding: "30px" }}
                    onClick={runPipeline}
                    disabled={loading}
                  >
                    {loading ? "EXECUTING MATRIX..." : "⚡ INITIATE MATRIX RUN"}
                  </button>
                </div>

                {loading && (
                  <div
                    className="glass-card"
                    style={{
                      marginTop: 40,
                      padding: "30px",
                      background: "rgba(0,0,0,0.9)",
                      border: "1px solid var(--accent-primary)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 15,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.6rem",
                          fontWeight: 900,
                          color: "var(--accent-primary)",
                        }}
                      >
                        LIVE_SIGNAL_STREAM
                      </span>
                      <span
                        style={{
                          fontSize: "0.6rem",
                          fontWeight: 900,
                          color: "var(--accent-primary)",
                          animation: "pulse 1s infinite",
                        }}
                      >
                        EXECUTING...
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.75rem",
                        color: "var(--accent-primary)",
                        opacity: 0.8,
                      }}
                    >
                      {terminalLogs.map((log, i) => (
                        <div
                          key={i}
                          style={{ marginBottom: 5 }}
                        >{`> ${log}`}</div>
                      ))}
                      <div style={{ animation: "blink 1s infinite" }}>_</div>
                    </div>
                  </div>
                )}

                {executionResult && (
                  <div style={{ marginTop: 80 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 40,
                      }}
                    >
                      <h3 style={{ fontSize: "2rem" }}>Matrix Results</h3>
                      <div style={{ display: "flex", gap: 20 }}>
                        <button
                          className="btn-outline"
                          style={{ padding: "10px 20px", fontSize: "0.7rem" }}
                          onClick={() =>
                            setViewMode((v) => (v === "list" ? "grid" : "list"))
                          }
                        >
                          {viewMode === "list"
                            ? "🔳 GRID VIEW"
                            : "📝 LIST VIEW"}
                        </button>
                        <button
                          className="btn-outline"
                          style={{ padding: "10px 20px", fontSize: "0.7rem" }}
                          onClick={() => setShowRadar(!showRadar)}
                        >
                          {showRadar ? "📉 HIDE RADAR" : "📊 SHOW RADAR"}
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: showRadar ? "1fr 350px" : "1fr",
                        gap: 40,
                        alignItems: "start",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            viewMode === "list"
                              ? "1fr"
                              : "repeat(auto-fit, minmax(500px, 1fr))",
                          gap: 40,
                        }}
                      >
                        {executionResult.executions.map((e, idx) => (
                          <div
                            key={idx}
                            className="glass-card"
                            style={{
                              padding: "60px",
                              borderLeft:
                                executionResult.bestVer === e.version
                                  ? "15px solid var(--success)"
                                  : "10px solid var(--accent-primary)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 30,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 15,
                                }}
                              >
                                <span
                                  className={`badge ${
                                    executionResult.bestVer === e.version
                                      ? "badge-success"
                                      : "badge-accent"
                                  }`}
                                >
                                  {e.version}
                                </span>
                                {executionResult.bestVer === e.version && (
                                  <span
                                    style={{
                                      fontSize: "0.7rem",
                                      fontWeight: 900,
                                      color: "var(--success)",
                                    }}
                                  >
                                    OPTIMAL SIGNAL
                                  </span>
                                )}
                              </div>
                              <span
                                style={{
                                  fontWeight: 950,
                                  fontSize: "2.5rem",
                                  color:
                                    executionResult.bestVer === e.version
                                      ? "var(--success)"
                                      : "white",
                                }}
                              >
                                {e.scores.totalScore}
                              </span>
                            </div>
                            <div
                              className="output-quote"
                              style={{
                                background: "rgba(0,0,0,0.5)",
                                padding: "30px",
                                borderRadius: "20px",
                                border: "1px solid var(--glass-border)",
                                fontSize: "0.9rem",
                              }}
                            >
                              {e.outputText}
                            </div>
                            <div
                              style={{
                                marginTop: 30,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "0.7rem",
                                  opacity: 0.5,
                                  fontWeight: 900,
                                }}
                              >
                                LATENCY: {e.meta.latency}ms | TOKENS:{" "}
                                {e.meta.tokens}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.7rem",
                                  fontWeight: 900,
                                  color: "var(--accent-primary)",
                                }}
                              >
                                MODEL: {e.meta.model || "Groq-Llama-3"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {showRadar && <RadarChart data={executionResult} />}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "workflow" && (
              <div style={{ animation: "slideUp 0.7s ease" }}>
                <h2 className="shine-text" style={{ fontSize: "4.5rem" }}>
                  Workflow Pulse
                </h2>
                <p style={{ opacity: 0.5, marginTop: 10, fontSize: "1.2rem" }}>
                  Automated Signaling Pipeline: Local Node → n8n Webhook →
                  Google Sheets
                </p>

                <div style={{ marginTop: 80, position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: 0,
                      right: 0,
                      height: "4px",
                      background:
                        "linear-gradient(90deg, var(--accent-primary), var(--success))",
                      zIndex: 0,
                      opacity: 0.3,
                    }}
                  ></div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(5, 1fr)",
                      gap: 30,
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {[
                      {
                        step: "01",
                        title: "DRAFT",
                        desc: "Neural Forge Entry",
                        icon: "⚡",
                      },
                      {
                        step: "02",
                        title: "ITERATE",
                        desc: "Cluster Versioning",
                        icon: "🧬",
                      },
                      {
                        step: "03",
                        title: "OPTIMIZE",
                        desc: "AI Substrate Polish",
                        icon: "🌀",
                      },
                      {
                        step: "04",
                        title: "VALIDATE",
                        desc: "Matrix Lab Simulation",
                        icon: "🛰️",
                      },
                      {
                        step: "05",
                        title: "SYNC",
                        desc: "n8n → Google Sheets",
                        icon: "📊",
                      },
                    ].map((s, i) => (
                      <div
                        key={i}
                        className="glass-card"
                        style={{
                          padding: "40px 20px",
                          textAlign: "center",
                          border: "1px solid var(--glass-border)",
                          background: "rgba(0,0,0,0.8)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: 950,
                            color: "var(--accent-primary)",
                            marginBottom: 15,
                          }}
                        >
                          STEP {s.step}
                        </div>
                        <div style={{ fontSize: "2.5rem", marginBottom: 15 }}>
                          {s.icon}
                        </div>
                        <div style={{ fontWeight: 950, marginBottom: 10 }}>
                          {s.title}
                        </div>
                        <div style={{ fontSize: "0.7rem", opacity: 0.4 }}>
                          {s.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="glass-card"
                  style={{
                    marginTop: 60,
                    padding: "60px",
                    borderLeft: "10px solid var(--success)",
                  }}
                >
                  <h3 style={{ marginBottom: 30 }}>Live Automation Status</h3>
                  <div style={{ display: "flex", gap: 60 }}>
                    <div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          opacity: 0.5,
                          marginBottom: 10,
                        }}
                      >
                        WEBHOOK ENDPOINT
                      </div>
                      <code
                        style={{ fontSize: "0.9rem", color: "var(--success)" }}
                      >
                        {process.env.NEXT_PUBLIC_N8N_URL ||
                          "https://n8n.workflow.internal/webhook/..."}
                      </code>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          opacity: 0.5,
                          marginBottom: 10,
                        }}
                      >
                        TARGET WAREHOUSE
                      </div>
                      <div style={{ fontWeight: 900 }}>
                        Google Sheets: "Optimized_Signals_V1"
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          opacity: 0.5,
                          marginBottom: 10,
                        }}
                      >
                        LAST SYNC
                      </div>
                      <div style={{ fontWeight: 900 }}>
                        {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "templates" && (
              <div style={{ animation: "slideUp 0.7s ease" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 30,
                    marginBottom: 50,
                  }}
                >
                  <h2 className="shine-text" style={{ fontSize: "5rem" }}>
                    Vault Registry
                  </h2>
                  <div
                    style={{
                      height: 2,
                      flex: 1,
                      background:
                        "linear-gradient(90deg, var(--success), transparent)",
                      marginBottom: 25,
                      opacity: 0.3,
                    }}
                  ></div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(600px, 1fr))",
                    gap: 40,
                  }}
                >
                  {templates.map((t, idx) => (
                    <div
                      key={idx}
                      className="glass-card"
                      style={{
                        padding: "60px",
                        borderTop: "8px solid var(--success)",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 30,
                          right: 40,
                          display: "flex",
                          gap: 10,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.6rem",
                            fontWeight: 900,
                            color: "var(--success)",
                            letterSpacing: "0.2em",
                          }}
                        >
                          SECURE_STORAGE_v2
                        </span>
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "var(--success)",
                            animation: "pulse 2s infinite",
                          }}
                        ></div>
                      </div>
                      <div
                        style={{
                          fontSize: "2.5rem",
                          fontWeight: 950,
                          marginBottom: 30,
                          display: "flex",
                          alignItems: "center",
                          gap: 20,
                        }}
                      >
                        {t.title}
                        <span className="badge badge-success">
                          {t.versionId}
                        </span>
                      </div>
                      <div
                        className="output-quote"
                        style={{
                          background: "rgba(0,0,0,0.5)",
                          padding: "40px",
                          borderRadius: "30px",
                          border: "1px solid var(--glass-border)",
                          fontSize: "1rem",
                          marginBottom: 40,
                        }}
                      >
                        {t.content}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            color: "var(--success)",
                            fontWeight: 950,
                            fontSize: "1.2rem",
                          }}
                        >
                          SIGNAL EFFICIENCY:{" "}
                          {(((t.averageScore || 0) / 15) * 100).toFixed(0)}%
                        </div>
                        <div style={{ display: "flex", gap: 15 }}>
                          <button
                            className="btn-outline"
                            style={{
                              padding: "10px 20px",
                              fontSize: "0.65rem",
                              borderRadius: "12px",
                            }}
                            onClick={() => copyToClipboard(t.content, t.id)}
                          >
                            {copiedId === t.id ? "✅ COPIED" : "📋 COPY SIGNAL"}
                          </button>
                          <button
                            className="btn-primary"
                            style={{
                              padding: "10px 20px",
                              fontSize: "0.65rem",
                              borderRadius: "12px",
                              background: "var(--success)",
                            }}
                            onClick={() => mockDeploy(t.id)}
                            disabled={deployingId === t.id}
                          >
                            {deployingId === t.id
                              ? "🚀 DEPLOYING..."
                              : "🚀 DEPLOY TO EDGE"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "sdk" && (
              <div style={{ animation: "slideUp 0.7s ease" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 30,
                    marginBottom: 50,
                  }}
                >
                  <h2 className="shine-text" style={{ fontSize: "5rem" }}>
                    SDK Nexus
                  </h2>
                  <div
                    style={{
                      height: 2,
                      flex: 1,
                      background:
                        "linear-gradient(90deg, var(--accent-primary), transparent)",
                      marginBottom: 25,
                      opacity: 0.3,
                    }}
                  ></div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 40,
                  }}
                >
                  <div
                    className="glass-card"
                    style={{ padding: "50px", borderTop: "5px solid #3b82f6" }}
                  >
                    <div
                      style={{
                        color: "#3b82f6",
                        fontWeight: 900,
                        marginBottom: 30,
                        letterSpacing: "0.1em",
                      }}
                    >
                      PYTHON DEPLOYMENT
                    </div>
                    <div
                      className="output-quote"
                      style={{
                        fontSize: "0.85rem",
                        background: "rgba(0,0,0,0.5)",
                        padding: "30px",
                        borderRadius: "20px",
                      }}
                    >
                      {getSDKCode("python")}
                    </div>
                  </div>
                  <div
                    className="glass-card"
                    style={{ padding: "50px", borderTop: "5px solid #f59e0b" }}
                  >
                    <div
                      style={{
                        color: "#f59e0b",
                        fontWeight: 900,
                        marginBottom: 30,
                        letterSpacing: "0.1em",
                      }}
                    >
                      NODE.JS DEPLOYMENT
                    </div>
                    <div
                      className="output-quote"
                      style={{
                        fontSize: "0.85rem",
                        background: "rgba(0,0,0,0.5)",
                        padding: "30px",
                        borderRadius: "20px",
                      }}
                    >
                      {getSDKCode("node")}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "analytics" && analytics && (
              <div style={{ animation: "slideUp 0.7s ease" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    marginBottom: 60,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: 30,
                      flex: 1,
                    }}
                  >
                    <h2 className="shine-text" style={{ fontSize: "5rem" }}>
                      Intelligence Hub
                    </h2>
                    <div
                      style={{
                        height: 2,
                        flex: 1,
                        background:
                          "linear-gradient(90deg, var(--accent-primary), transparent)",
                        marginBottom: 25,
                        opacity: 0.3,
                      }}
                    ></div>
                  </div>
                  <button
                    className="btn-outline"
                    style={{
                      padding: "20px 40px",
                      fontSize: "0.8rem",
                      marginBottom: 10,
                    }}
                    onClick={() => {
                      const dataStr =
                        "data:text/json;charset=utf-8," +
                        encodeURIComponent(JSON.stringify(analytics, null, 2));
                      const downloadAnchorNode = document.createElement("a");
                      downloadAnchorNode.setAttribute("href", dataStr);
                      downloadAnchorNode.setAttribute(
                        "download",
                        "prompt_intel_v1.json",
                      );
                      document.body.appendChild(downloadAnchorNode);
                      downloadAnchorNode.click();
                      downloadAnchorNode.remove();
                    }}
                  >
                    📥 EXPORT SYSTEM INTEL
                  </button>
                </div>

                <div
                  className="analytics-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 40,
                  }}
                >
                  <div
                    className="glass-card"
                    style={{
                      padding: "60px",
                      textAlign: "center",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 25,
                        left: 0,
                        right: 0,
                        fontSize: "0.6rem",
                        fontWeight: 900,
                        opacity: 0.3,
                        letterSpacing: "0.3em",
                      }}
                    >
                      NEURAL_LOAD_METRIC
                    </div>
                    <div className="stat-label" style={{ marginBottom: 20 }}>
                      TOTAL SIMULATIONS
                    </div>
                    <div className="stat-value">
                      {analytics.stats.totalRuns}
                    </div>
                  </div>
                  <div
                    className="glass-card"
                    style={{
                      padding: "60px",
                      textAlign: "center",
                      borderBottom: "15px solid var(--success)",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 25,
                        left: 0,
                        right: 0,
                        fontSize: "0.6rem",
                        fontWeight: 900,
                        color: "var(--success)",
                        opacity: 0.5,
                        letterSpacing: "0.3em",
                      }}
                    >
                      SIGNAL_ACCURACY_v9
                    </div>
                    <div
                      className="stat-label"
                      style={{ color: "var(--success)", marginBottom: 20 }}
                    >
                      AVG EFFICIENCY
                    </div>
                    <div
                      className="stat-value"
                      style={{ color: "var(--success)" }}
                    >
                      {analytics.stats.avgScore}
                    </div>
                  </div>
                  <div
                    className="glass-card"
                    style={{
                      padding: "60px",
                      textAlign: "center",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 25,
                        left: 0,
                        right: 0,
                        fontSize: "0.6rem",
                        fontWeight: 900,
                        opacity: 0.3,
                        letterSpacing: "0.3em",
                      }}
                    >
                      LATENCY_P99_VECTOR
                    </div>
                    <div className="stat-label" style={{ marginBottom: 20 }}>
                      NEURAL LATENCY
                    </div>
                    <div className="stat-value">
                      {analytics.stats.avgLatency}
                      <span style={{ fontSize: "2rem", opacity: 0.4 }}>ms</span>
                    </div>
                  </div>
                </div>

                <div
                  className="glass-card"
                  style={{ marginTop: 60, padding: "60px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 40,
                    }}
                  >
                    <h3 style={{ fontSize: "1.5rem", fontWeight: 900 }}>
                      Real-time Signal History
                    </h3>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 900,
                        color: "var(--accent-primary)",
                      }}
                    >
                      LAST 20 SIMULATIONS
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-end",
                      height: 200,
                    }}
                  >
                    {analytics.history.map((h, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          background: "var(--gradient-main)",
                          height: `${(h.score / 15) * 100}%`,
                          borderRadius: "4px 4px 0 0",
                          opacity: 0.3 + i / 40,
                          position: "relative",
                        }}
                        title={`Score: ${h.score}`}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: -25,
                            left: 0,
                            right: 0,
                            textAlign: "center",
                            fontSize: "0.6rem",
                            fontWeight: 900,
                            opacity: 0.5,
                          }}
                        >
                          {h.score.toFixed(1)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(60px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
            pointer-events: none;
          }
        }
        @keyframes logoPop {
          from {
            opacity: 0;
            transform: scale(0.7);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
