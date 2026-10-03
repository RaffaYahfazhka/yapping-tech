'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { OfficeScene } from '../lib/engine/officeScene.js';
import { AudioEngine } from '../lib/engine/audioEngine.js';
import { PipelineRunner } from '../lib/engine/pipelineRunner.js';
import { readScreenInput } from '../lib/engine/movement.js';
import { AGENTS } from '../lib/data/agents.js';
import { REPOS, REPO_MAP } from '../lib/data/repos.js';
import { TICKETS, TYPE_META, PRIORITY_META } from '../lib/data/tickets.js';
import { parseFigmaInput, FIGMA_SPEC } from '../lib/data/figma.js';

export default function OfficePage() {
  const stageRef = useRef(null);
  const sceneRef = useRef(null);
  const audioRef = useRef(null);
  const pipelineRef = useRef(null);
  const keysDownRef = useRef(new Set());
  const inputLoopRef = useRef(null);

  // App & Boot State
  const [booted, setBooted] = useState(false);
  const [clockStr, setClockStr] = useState('--:--:--');
  const [missionState, setMissionState] = useState('IDLE');

  // Audio Widget State
  const [audioState, setAudioState] = useState({
    ready: false,
    isPlaying: false,
    volume: 50,
    isMuted: false,
  });
  const [audioTime, setAudioTime] = useState({ currentTime: 0, duration: 196 });

  // Terminal & Pipeline State
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [termTab, setTermTab] = useState('logs'); // 'logs' | 'diff'
  const [logs, setLogs] = useState([]);
  const [logCount, setLogCount] = useState(0);
  const [diffData, setDiffData] = useState(null);
  const [selectedDiffIndex, setSelectedDiffIndex] = useState(0);
  const [simSpeed, setSimSpeed] = useState(1);

  // Pipeline Progress HUD
  const [pipelineInfo, setPipelineInfo] = useState(null);
  const [pipelineTimer, setPipelineTimer] = useState('00:00');
  const [precisionScore, setPrecisionScore] = useState(0);
  const timerStartRef = useRef(null);

  // Modals
  const [isFigmaOpen, setIsFigmaOpen] = useState(false);
  const [isMissionOpen, setIsMissionOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [interactAgent, setInteractAgent] = useState(null);

  // Figma Modal Form
  const [figmaUrl, setFigmaUrl] = useState('https://www.figma.com/design/TRPL-App/Core?node-id=204-12');
  const [figmaRepo, setFigmaRepo] = useState('frontend-dashboard-v2');
  const [figmaStrict, setFigmaStrict] = useState(true);
  const [figmaParseResult, setFigmaParseResult] = useState(null);

  // Theme State: 'light' or 'dark' (Defaulting to modern Light Studio theme)
  const [theme, setTheme] = useState('light');

  // Live Jira Cloud & Ticket Selection State
  const [useLiveJira, setUseLiveJira] = useState(true);
  const [liveTickets, setLiveTickets] = useState([]);
  const [jiraLoading, setJiraLoading] = useState(false);
  const [jiraError, setJiraError] = useState(null);
  const [selectedRepoId, setSelectedRepoId] = useState(REPOS[0]?.id || 'frontend-dashboard-v2');
  const [customRepoPath, setCustomRepoPath] = useState('/Users/raffayahfazhka/Downloads/master/yapping-techflow');
  const [selectedTicketKey, setSelectedTicketKey] = useState(TICKETS[0]?.key || '');
  const [ticketTypeFilter, setTicketTypeFilter] = useState('all');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('active'); // 'all' | 'active' (todo - ready prod) | 'To Do' | 'In Progress' | 'QA' | 'Ready Prod'
  const [ticketSearch, setTicketSearch] = useState('');
  const [missionMobileTab, setMissionMobileTab] = useState('tickets'); // 'repos' | 'tickets' | 'details'

  // Fetch live Jira tickets from /api/jira/tickets
  useEffect(() => {
    async function loadJira() {
      setJiraLoading(true);
      try {
        const res = await fetch('/api/jira/tickets');
        const data = await res.json();
        if (data.tickets && data.tickets.length > 0) {
          setLiveTickets(data.tickets);
          setSelectedTicketKey(data.tickets[0].key);
        } else if (data.error) {
          setJiraError(data.error);
        }
      } catch (err) {
        setJiraError(err.message);
      } finally {
        setJiraLoading(false);
      }
    }
    loadJira();
  }, []);

  // Ref to hold near agent without re-triggering main useEffect
  const interactAgentRef = useRef(null);
  useEffect(() => {
    interactAgentRef.current = interactAgent;
  }, [interactAgent]);

  // 1. Clock timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setClockStr(now.toTimeString().split(' ')[0]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Parse Figma URL on change
  useEffect(() => {
    setFigmaParseResult(parseFigmaInput(figmaUrl));
  }, [figmaUrl]);

  // 3. Initialize 3D Scene & Audio Engine ONCE
  useEffect(() => {
    if (!stageRef.current) return;

    // A. Init Scene
    const scene = new OfficeScene(
      stageRef.current,
      (nearAgent) => {
        setInteractAgent((prev) => (prev?.id === nearAgent?.id ? prev : nearAgent));
      },
      (agentId) => {
        if (agentId === 'bimo') {
          setIsFigmaOpen(true);
        } else {
          setIsMissionOpen(true);
        }
      }
    );
    sceneRef.current = scene;

    // B. Init Audio Engine
    const audio = new AudioEngine({
      containerId: 'yt-player-host',
      onStateChange: (state) => setAudioState({ ...state }),
      onTimeUpdate: (time) => setAudioTime({ ...time }),
    });
    audio.init();
    audioRef.current = audio;

    // C. Init Pipeline Runner
    const pipeline = new PipelineRunner({
      onLog: (logItem) => {
        setLogs((prev) => [...prev, logItem]);
        setLogCount((c) => c + 1);
      },
      onStepChange: (info) => {
        setPipelineInfo((prev) => ({ ...prev, ...info }));
      },
      onCameraFocus: (targetId) => {
        scene.focusOn(targetId);
      },
      onAgentStatus: (agentId, statusText, color) => {
        scene.updateAgentStatus(agentId, statusText, color);
      },
      onDiffChange: (diff) => {
        setDiffData(diff);
        setSelectedDiffIndex(0);
      },
      onPrecisionChange: (val) => {
        setPrecisionScore(val);
      },
      onComplete: (res) => {
        setMissionState('COMPLETED');
      },
    });
    pipelineRef.current = pipeline;

    // D. Rigid WASD Keyboard Loop (Screen-Relative)
    const handleKeyDown = (e) => {
      // Don't capture when typing in modal inputs
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

      keysDownRef.current.add(e.code);

      // Shortcut Keys
      if (e.code === 'KeyF' && !e.repeat) {
        setIsFigmaOpen((o) => !o);
      } else if (e.code === 'KeyJ' && !e.repeat) {
        setIsMissionOpen((o) => !o);
      } else if (e.code === 'KeyT' && !e.repeat) {
        setIsTerminalOpen((o) => !o);
      } else if (e.code === 'KeyH' && !e.repeat) {
        setIsHelpOpen((o) => !o);
      } else if (e.code === 'KeyC' && !e.repeat) {
        scene.resetCamera();
      } else if (e.code === 'KeyP' && !e.repeat) {
        audio.togglePlay();
      } else if (e.code === 'KeyM' && !e.repeat) {
        audio.toggleMute();
      } else if (e.code === 'KeyE' && !e.repeat) {
        // Interact with near agent or open Mission Control
        const near = interactAgentRef.current;
        if (near) {
          if (near.id === 'bimo') setIsFigmaOpen(true);
          else setIsMissionOpen(true);
        } else {
          setIsMissionOpen(true);
        }
      } else if (e.code === 'Escape') {
        setIsFigmaOpen(false);
        setIsMissionOpen(false);
        setIsHelpOpen(false);
      }
    };

    const handleKeyUp = (e) => {
      keysDownRef.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // WASD poll loop
    let lastTime = performance.now();
    const movementLoop = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const screenInput = readScreenInput(keysDownRef.current);
      if (screenInput.active) {
        const isSprint = keysDownRef.current.has('ShiftLeft') || keysDownRef.current.has('ShiftRight');
        scene.applyWASD(screenInput.moveX, screenInput.moveZ, isSprint, dt);
      }

      inputLoopRef.current = requestAnimationFrame(movementLoop);
    };
    inputLoopRef.current = requestAnimationFrame(movementLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (inputLoopRef.current) cancelAnimationFrame(inputLoopRef.current);
      scene.destroy();
      audio.destroy();
    };
  }, []);

  // Terminal scroll to bottom on new log (safe container scroll, never shifts window)
  const logsPaneRef = useRef(null);
  useEffect(() => {
    if (termTab === 'logs' && logsPaneRef.current) {
      logsPaneRef.current.scrollTop = logsPaneRef.current.scrollHeight;
    }
  }, [logs, termTab]);

  // Pipeline timer
  useEffect(() => {
    let interval = null;
    if (pipelineInfo && !pipelineTimer) {
      timerStartRef.current = Date.now();
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timerStartRef.current) / 1000);
        const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const secs = String(elapsed % 60).padStart(2, '0');
        setPipelineTimer(`${mins}:${secs}`);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pipelineInfo, pipelineTimer]);

  // Start Kantor Raffa (Boot Click -> Autoplay Music)
  const handleEnterOffice = () => {
    setBooted(true);
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  // Run Figma Pipeline
  const handleExecuteFigma = (e) => {
    e.preventDefault();
    if (!figmaParseResult || !figmaParseResult.ok) return;

    setIsFigmaOpen(false);
    setIsTerminalOpen(true);
    setTermTab('logs');
    setMissionState('RUNNING');
    setPipelineTimer(null);

    pipelineRef.current.runFigmaPipeline({
      figmaUrl,
      repoId: figmaRepo,
      strictGate: figmaStrict,
    });
  };


  const handleSpeedToggle = () => {
    const nextSpeed = simSpeed === 1 ? 2 : simSpeed === 2 ? 4 : 1;
    setSimSpeed(nextSpeed);
    if (pipelineRef.current) pipelineRef.current.setSpeed(nextSpeed);
  };

  // Apply theme to DOM and 3D scene
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (sceneRef.current) {
      sceneRef.current.setTheme(theme === 'light');
    }
  }, [theme]);

  // Filtered tickets (switches between live Jira Cloud and mock presets)
  const ticketPool = (useLiveJira && liveTickets.length > 0) ? liveTickets : TICKETS;

  // Active status set: from 'To Do' up to 'Ready Prod'
  const ACTIVE_STATUS_KEYWORDS = ['to do', 'in progress', 'qa', 'qa list', 'ready prod', 'backlog'];

  const filteredTickets = ticketPool.filter((t) => {
    const matchRepo = useLiveJira ? true : t.repo === selectedRepoId;
    const matchType = ticketTypeFilter === 'all' || t.type === ticketTypeFilter;

    const tStatus = (t.status || '').toLowerCase();
    let matchStatus = true;
    if (ticketStatusFilter === 'active') {
      // Todo sampai Ready Prod (exclude terminal Done / PROD Deployment unless explicitly clicked)
      matchStatus = ACTIVE_STATUS_KEYWORDS.some((kw) => tStatus.includes(kw));
    } else if (ticketStatusFilter !== 'all') {
      matchStatus = tStatus.includes(ticketStatusFilter.toLowerCase());
    }

    const matchSearch =
      !ticketSearch ||
      t.key.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.summary.toLowerCase().includes(ticketSearch.toLowerCase());
    return matchRepo && matchType && matchStatus && matchSearch;
  });

  const activeTicket = ticketPool.find((t) => t.key === selectedTicketKey) || filteredTickets[0];

  // Run Jira Pipeline with live ticket payload and selected project directory
  const handleExecuteJira = () => {
    setIsMissionOpen(false);
    setIsTerminalOpen(true);
    setTermTab('logs');
    setMissionState('RUNNING');
    setPipelineTimer(null);

    pipelineRef.current.runJiraPipeline({
      ticketKey: activeTicket?.key,
      ticket: activeTicket,
      repoId: selectedRepoId,
      projectPath: customRepoPath,
    });
  };

  return (
    <main id="app" className="relative w-screen h-screen overflow-hidden">
      <h1 className="sr-only">Kantor Raffa — Interactive 3D Virtual AI Office &amp; Autonomous Mission Control</h1>

      {/* 3D WebGL Canvas */}
      <div id="stage" ref={stageRef} aria-label="Kantor 3D isometrik" />
      <div className="vignette" aria-hidden="true" />

      {/* ===================== HEADER ===================== */}
      <header className="hud-header glass" id="hud-header">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 64 64" width="22" height="22">
              <path
                d="M32 8 54 20.5v23L32 56 10 43.5v-23Z"
                fill="none"
                stroke="url(#bm)"
                strokeWidth="5"
                strokeLinejoin="round"
              />
              <path
                d="M32 32 54 20.5M32 32 10 20.5M32 32v24"
                stroke="url(#bm)"
                strokeWidth="4"
                strokeLinecap="round"
                opacity=".75"
              />
              <defs>
                <linearGradient id="bm" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="brand-text">
            <div className="brand-title">Kantor Raffa</div>
            <div className="brand-sub">Autonomous Mission Control</div>
          </div>
        </div>

        <div className="header-status">
          <span className="pill">
            <span className="live-dot" />
            <span>6/6 agen online</span>
          </span>
          <span className="pill mono text-emerald-400 font-bold" data-state={missionState}>
            {missionState}
          </span>
          <span className="pill mono">{clockStr}</span>
        </div>

        <nav className="header-actions" aria-label="Aksi utama">
          <button id="btn-figma" className="btn btn-violet" type="button" onClick={() => setIsFigmaOpen(true)}>
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
              <path
                fill="currentColor"
                d="M8 2h4v6.5H8a3.25 3.25 0 0 1 0-6.5Zm4 0h4a3.25 3.25 0 0 1 0 6.5h-4Zm-4 6.5h4V15H8a3.25 3.25 0 0 1 0-6.5Zm8 0a3.25 3.25 0 1 1 0 6.5 3.25 3.25 0 0 1 0-6.5ZM8 15h4v3.25A3.25 3.25 0 1 1 8 15Z"
              />
            </svg>
            Slicing Figma <kbd>F</kbd>
          </button>
          <button id="btn-mission" className="btn btn-emerald" type="button" onClick={() => setIsMissionOpen(true)}>
            ⚡ Mission Control <kbd>J</kbd>
          </button>
          <button
            id="btn-terminal"
            className="btn btn-ghost"
            type="button"
            onClick={() => setIsTerminalOpen((o) => !o)}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4 17 6-5-6-5M12 19h8"
              />
            </svg>
            Terminal <kbd>T</kbd>
          </button>
          <button
            id="btn-theme"
            className="btn btn-ghost"
            type="button"
            title="Ganti Tema (Terang / Gelap)"
            onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          >
            {theme === 'light' ? '☀️ Terang' : '🌙 Gelap'}
          </button>
          <button
            id="btn-help"
            className="btn-icon"
            type="button"
            aria-label="Bantuan kontrol"
            onClick={() => setIsHelpOpen(true)}
          >
            ?
          </button>
        </nav>
      </header>

      {/* ===================== PIPELINE HUD ===================== */}
      {pipelineInfo && (
        <section id="pipeline-hud" className="pipeline-hud glass" aria-live="polite">
          <div className="ph-head">
            <span className="ph-kind mono">{pipelineInfo.kind}</span>
            <span className="ph-title">{pipelineInfo.title}</span>
            <span className="ph-timer mono">{pipelineTimer || '00:00'}</span>
          </div>
          <ol className="ph-steps">
            {pipelineInfo.steps &&
              pipelineInfo.steps.map((step, idx) => {
                const isDone = idx < pipelineInfo.activeIndex;
                const isActive = idx === pipelineInfo.activeIndex;
                return (
                  <li key={step.id} className="ph-step-item">
                    <div className={`ph-step-bar ${isDone ? 'done' : isActive ? 'active' : ''}`} />
                    <span className={`ph-step-label ${isActive ? 'active' : ''}`}>{step.label}</span>
                  </li>
                );
              })}
          </ol>
          {precisionScore > 0 && (
            <div className="ph-meter">
              <div className="ph-meter-label mono">
                <span>Pixel Precision</span>
                <span className={precisionScore >= 99.5 ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                  {precisionScore.toFixed(1)}%
                </span>
              </div>
              <div className="ph-meter-track">
                <div className="ph-meter-fill" style={{ width: `${precisionScore}%` }} />
              </div>
            </div>
          )}
        </section>
      )}

      {/* ===================== INTERACTION PROMPT ===================== */}
      {interactAgent && (
        <div
          id="interact-prompt"
          className="interact-prompt glass"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            if (interactAgent.id === 'bimo') setIsFigmaOpen(true);
            else setIsMissionOpen(true);
          }}
        >
          <kbd className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs">E</kbd>
          <span>
            Bicara dengan <b>{interactAgent.name}</b> ({interactAgent.role}) — <b className="text-emerald-400">Klik / Tekan [E]</b>
          </span>
        </div>
      )}

      {/* ===================== TERMINAL DRAWER ===================== */}
      <aside className={`terminal glass ${!isTerminalOpen ? 'closed' : ''}`} aria-label="Terminal Drawer">
        <div className="term-head">
          <div className="term-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div className="term-title mono">
            raffa@kantor<span className="dim">:</span>
            <span className="violet">~/mission</span>
          </div>
          <div className="term-actions">
            <button className="chip mono" type="button" title="Kecepatan simulasi" onClick={handleSpeedToggle}>
              {simSpeed}×
            </button>
            <button className="chip mono" type="button" title="Clear log" onClick={() => setLogs([])}>
              clear
            </button>
            <button
              className="btn-icon"
              style={{ width: '24px', height: '24px' }}
              type="button"
              aria-label="Tutup terminal"
              onClick={() => setIsTerminalOpen(false)}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="term-tabs" role="tablist">
          <button
            className={`tab ${termTab === 'logs' ? 'active' : ''}`}
            role="tab"
            type="button"
            onClick={() => setTermTab('logs')}
          >
            Logs <span className="mono text-xs opacity-75">({logCount})</span>
          </button>
          <button
            className={`tab ${termTab === 'diff' ? 'active' : ''}`}
            role="tab"
            type="button"
            onClick={() => setTermTab('diff')}
          >
            Git Diff {diffData && <span className="text-emerald-400 font-mono text-xs">• {diffData.files.length}</span>}
          </button>
        </div>

        <div className="term-body">
          {/* Logs Tab */}
          <div ref={logsPaneRef} className={`term-pane ${termTab === 'logs' ? 'active' : ''}`}>
            <div className="term-logs">
              {logs.length === 0 ? (
                <div className="text-zinc-500 italic py-4">Belum ada output eksekusi misi. Silakan jalankan Slicing Figma atau Mission Control.</div>
              ) : (
                logs.map((item, i) => (
                  <div key={i} className="term-log-line">
                    <span
                      className="term-log-tag mono"
                      style={{
                        backgroundColor: `${item.color}22`,
                        color: item.color,
                        border: `1px solid ${item.color}44`,
                      }}
                    >
                      {item.sender}
                    </span>
                    <span>{item.text.replace(/\x1b\[[0-9;]*m/g, '')}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Diff Tab */}
          <div className={`term-pane ${termTab === 'diff' ? 'active' : ''}`}>
            {!diffData ? (
              <div className="text-zinc-500 italic py-4">Belum ada file git diff aktif.</div>
            ) : (
              <div className="diff-viewer">
                <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                  {diffData.files.map((file, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedDiffIndex(idx)}
                      className={`chip mono text-xs ${selectedDiffIndex === idx ? 'active' : ''}`}
                    >
                      {file.path.split('/').pop()}
                    </button>
                  ))}
                </div>

                {diffData.files[selectedDiffIndex] && (
                  <div className="diff-file-card">
                    <div className="diff-file-head">
                      <span>{diffData.files[selectedDiffIndex].path}</span>
                      <span className="mono text-xs text-emerald-400">{diffData.branch}</span>
                    </div>
                    <pre className="diff-pre mono">
                      {diffData.files[selectedDiffIndex].diff.split('\n').map((line, li) => {
                        const isAdd = line.startsWith('+');
                        const isDel = line.startsWith('-');
                        const isHunk = line.startsWith('@@');
                        return (
                          <span
                            key={li}
                            className={
                              isAdd ? 'diff-line-add' : isDel ? 'diff-line-del' : isHunk ? 'diff-line-hunk' : ''
                            }
                          >
                            {line}
                          </span>
                        );
                      })}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="term-foot mono">
          <span className="text-emerald-400">❯</span>
          <span>{pipelineInfo ? 'pipeline streaming active' : 'siap menerima misi'}</span>
          <span className="caret" />
        </div>
      </aside>

      {/* ===================== AUDIO WIDGET ===================== */}
      <section className={`audio-widget glass ${audioState.isPlaying ? 'playing' : ''}`} aria-label="Music player">
        <div className="aw-cover">
          {/* Album thumbnail */}
          <img
            src="https://i.ytimg.com/vi/sF80I-TQiW0/mqdefault.jpg"
            alt="CHON — Pitch Dark"
            loading="lazy"
            crossOrigin="anonymous"
          />
          <span className="aw-spin" aria-hidden="true" />
        </div>
        <div className="aw-main">
          <div className="aw-meta mono">
            <span className="aw-led" />
            <span>{audioState.isPlaying ? 'PLAYING' : 'STANDBY'}</span>
            <span className="text-zinc-500">
              {Math.floor(audioTime.currentTime / 60)}:
              {String(Math.floor(audioTime.currentTime % 60)).padStart(2, '0')} / 3:16
            </span>
          </div>
          <div className="aw-track">
            <div className="aw-title">Pitch Dark</div>
            <div className="aw-artist">CHON · YouTube API</div>
          </div>
          <div className="aw-controls">
            <button
              className="aw-btn aw-play"
              type="button"
              aria-label="Play/Pause"
              onClick={() => audioRef.current?.togglePlay()}
            >
              {audioState.isPlaying ? (
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M7 4.5v15l13-7.5z" />
                </svg>
              )}
            </button>
            <button
              className="aw-btn"
              type="button"
              aria-label="Mute"
              onClick={() => audioRef.current?.toggleMute()}
            >
              {audioState.isMuted ? (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M4 9v6h4l5 4V5L8 9Zm12.6 3 2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M4 9v6h4l5 4V5L8 9Zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4Zm-2.5-8.7v2.1a7 7 0 0 1 0 13.2v2.1a9 9 0 0 0 0-17.4Z" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={audioState.volume}
              onChange={(e) => audioRef.current?.setVolume(Number(e.target.value))}
              aria-label="Volume"
            />
            {/* Animated Equalizer */}
            <div className="eq" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
        </div>
      </section>

      {/* Hidden YouTube Player Host */}
      <div id="yt-player-host" />

      {/* Controls Hint */}
      <div className="controls-hint glass mono">
        <span>
          <kbd>W</kbd>
          <kbd>A</kbd>
          <kbd>S</kbd>
          <kbd>D</kbd> Gerak
        </span>
        <span>
          <kbd>⇧ Shift</kbd> Sprint
        </span>
        <span>
          <kbd>Klik Lantai</kbd> Jalan
        </span>
        <span>
          <kbd>E</kbd> Interaksi
        </span>
        <span>
          <kbd>C</kbd> Center Cam
        </span>
        <span>
          <kbd>H</kbd> Bantuan
        </span>
      </div>

      {/* ===================== MODAL: FIGMA SLICING (FITUR 1) ===================== */}
      {isFigmaOpen && (
        <div className="modal-backdrop" onClick={() => setIsFigmaOpen(false)}>
          <div className="modal glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-icon violet">
                <svg viewBox="0 0 24 24" width="22" height="22">
                  <path
                    fill="currentColor"
                    d="M8 2h4v6.5H8a3.25 3.25 0 0 1 0-6.5Zm4 0h4a3.25 3.25 0 0 1 0 6.5h-4Zm-4 6.5h4V15H8a3.25 3.25 0 0 1 0-6.5Zm8 0a3.25 3.25 0 1 1 0 6.5 3.25 3.25 0 0 1 0-6.5ZM8 15h4v3.25A3.25 3.25 0 1 1 8 15Z"
                  />
                </svg>
              </div>
              <div>
                <h2>Delegasi Slicing Figma ke Bimo</h2>
                <p>Pixel-perfect autonomous loop: Bimo (Frontend) ⇄ Vani (QA) ➔ Reno (DevOps)</p>
              </div>
              <button
                className="btn-icon modal-close"
                type="button"
                aria-label="Tutup"
                onClick={() => setIsFigmaOpen(false)}
              >
                ✕
              </button>
            </div>
            <form className="modal-body" onSubmit={handleExecuteFigma}>
              <label className="field">
                <span className="field-label">Figma URL / Node ID</span>
                <input
                  className="input mono"
                  value={figmaUrl}
                  onChange={(e) => setFigmaUrl(e.target.value)}
                  placeholder="https://www.figma.com/design/.../?node-id=204-12"
                />
                {figmaParseResult && (
                  <small className="mono text-xs mt-1 text-zinc-400">
                    {figmaParseResult.ok ? (
                      <span className="text-emerald-400">
                        ✓ Node ID: <b>{figmaParseResult.nodeId}</b> ({figmaParseResult.fileKey})
                      </span>
                    ) : (
                      <span className="text-rose-400">✗ {figmaParseResult.error}</span>
                    )}
                  </small>
                )}
              </label>

              <label className="field">
                <span className="field-label">Target GitLab Repository</span>
                <select
                  className="input mono"
                  value={figmaRepo}
                  onChange={(e) => setFigmaRepo(e.target.value)}
                >
                  {REPOS.map((r) => (
                    <option key={r.id} value={r.id} className="bg-zinc-900">
                      {r.group} / {r.id} ({r.lang})
                    </option>
                  ))}
                </select>
              </label>

              <label className="toggle-row" htmlFor="figma-strict">
                <div>
                  <b>Strict 100% Precision Gate</b>
                  <small>Tolak commit jika ada deviasi layout/typography (toleransi hanya subpixel antialiasing &lt; 0.5%).</small>
                </div>
                <input
                  type="checkbox"
                  id="figma-strict"
                  className="switch"
                  checked={figmaStrict}
                  onChange={(e) => setFigmaStrict(e.target.checked)}
                />
              </label>

              <div className="flow-preview">
                <span className="flow-chip" style={{ '--c': '#8b5cf6' }}>
                  Bimo · Spec ➔ Code
                </span>
                <span className="flow-arrow">⇄</span>
                <span className="flow-chip" style={{ '--c': '#f43f5e' }}>
                  Vani · Pixel-Diff
                </span>
                <span className="flow-arrow">➔</span>
                <span className="flow-chip" style={{ '--c': '#22d3ee' }}>
                  Reno · Branch ➔ MR
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-violet btn-lg w-full"
                disabled={!figmaParseResult || !figmaParseResult.ok}
              >
                🚀 Bimo, Slicing Sampai Presisi!
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: MISSION CONTROL (FITUR 2) ===================== */}
      {isMissionOpen && (
        <div className="modal-backdrop" onClick={() => setIsMissionOpen(false)}>
          <div className="modal modal-wide glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-icon emerald">⚡</div>
              <div>
                <h2>Mission Control</h2>
                <p>Pilih repo GitLab ➔ tiket Jira ➔ eksekusi pipeline otonom 5 agen</p>
              </div>
              <button
                className="btn-icon modal-close"
                type="button"
                aria-label="Tutup"
                onClick={() => setIsMissionOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Mobile/Tablet Column Selector */}
            <div className="mission-mobile-tabs">
              <button
                type="button"
                className={`mission-tab-btn ${missionMobileTab === 'repos' ? 'active' : ''}`}
                onClick={() => setMissionMobileTab('repos')}
              >
                📁 1. Repo
              </button>
              <button
                type="button"
                className={`mission-tab-btn ${missionMobileTab === 'tickets' ? 'active' : ''}`}
                onClick={() => setMissionMobileTab('tickets')}
              >
                🎫 2. Tiket ({filteredTickets.length})
              </button>
              <button
                type="button"
                className={`mission-tab-btn ${missionMobileTab === 'details' ? 'active' : ''}`}
                onClick={() => setMissionMobileTab('details')}
              >
                📋 3. Detail
              </button>
            </div>

            <div className="mission-grid">
              {/* Column 1: Repositories & Execution Folder */}
              <section className={`mission-col col-repos ${missionMobileTab === 'repos' ? 'show-mobile' : ''}`}>
                <h3 className="col-title">
                  <span className="step-no">1</span> Target Repo / Folder
                </h3>
                <div className="flex flex-col gap-1.5">
                  <span className="field-label text-[11px]">Direktori Target Eksekusi (Folder Lokal):</span>
                  <input
                    className="input mono text-xs"
                    value={customRepoPath}
                    onChange={(e) => setCustomRepoPath(e.target.value)}
                    placeholder="/path/to/your/project"
                    title="Folder lokal yang akan dieksekusi"
                  />
                  <small className="mono text-[10px] text-emerald-500 font-semibold">
                    ✓ Folder target aktif untuk Antigravity
                  </small>
                </div>

                <div className="mt-2">
                  <span className="field-label text-[11px] mb-1.5 block">Preset GitLab Project:</span>
                  <div className="flex flex-col gap-2">
                    {REPOS.map((repo) => (
                      <div
                        key={repo.id}
                        className={`repo-card ${selectedRepoId === repo.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedRepoId(repo.id);
                          const firstTicket = TICKETS.find((t) => t.repo === repo.id);
                          if (firstTicket) setSelectedTicketKey(firstTicket.key);
                        }}
                      >
                        <div className="repo-name">{repo.id}</div>
                        <div className="repo-sub mono">
                          {repo.group} · {repo.lang}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Column 2: Tickets with Status Range Filter */}
              <section className={`mission-col col-tickets ${missionMobileTab === 'tickets' ? 'show-mobile' : ''}`}>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h3 className="col-title m-0">
                    <span className="step-no">2</span> Tiket Jira ({filteredTickets.length})
                  </h3>
                  <button
                    type="button"
                    className={`chip mono text-[10px] ${useLiveJira ? 'active' : ''}`}
                    onClick={() => setUseLiveJira((prev) => !prev)}
                    title={useLiveJira ? 'Terhubung ke Jira Cloud: etbteam.atlassian.net' : 'Menggunakan preset simulasi mock'}
                  >
                    {useLiveJira ? '🟢 etbteam.atlassian.net' : '⚪ Mock Presets'}
                  </button>
                </div>

                {jiraLoading && (
                  <div className="text-[11px] text-zinc-500 mono italic animate-pulse">
                    ⏳ Memuat tiket live dari Jira Cloud...
                  </div>
                )}
                {jiraError && useLiveJira && (
                  <div className="text-[10px] text-rose-500 mono">
                    ⚠️ {jiraError} (Beralih ke fallback)
                  </div>
                )}

                <input
                  className="input text-xs"
                  placeholder="Cari key / summary..."
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                />

                {/* Status Range Filter (Todo -> Ready Prod) */}
                <div className="flex flex-col gap-1">
                  <span className="field-label text-[10px] uppercase font-bold text-zinc-500">Filter Status:</span>
                  <div className="flex gap-1 flex-wrap">
                    {[
                      { id: 'active', label: '⚡ To Do ➔ Ready Prod' },
                      { id: 'To Do', label: 'To Do' },
                      { id: 'In Progress', label: 'In Progress' },
                      { id: 'QA', label: 'QA' },
                      { id: 'Ready Prod', label: 'Ready Prod' },
                      { id: 'all', label: 'Semua Status' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        className={`chip text-[10px] ${ticketStatusFilter === st.id ? 'active' : ''}`}
                        onClick={() => setTicketStatusFilter(st.id)}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Issue Type Filter */}
                <div className="flex gap-1">
                  {['all', 'Story', 'Bug', 'Task'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`chip text-[10px] ${ticketTypeFilter === type ? 'active' : ''}`}
                      onClick={() => setTicketTypeFilter(type)}
                    >
                      {type === 'all' ? 'Semua Tipe' : type}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-2 overflow-y-auto pr-1">
                  {filteredTickets.map((t) => {
                    const typeMeta = TYPE_META[t.type] || { color: 'var(--text-primary)', icon: '•' };
                    const priorityMeta = PRIORITY_META[t.priority] || { color: 'var(--text-primary)', icon: '-' };
                    return (
                      <div
                        key={t.key}
                        className={`ticket-card ${selectedTicketKey === t.key ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedTicketKey(t.key);
                          // Auto open details on mobile upon clicking ticket
                          if (window.innerWidth < 860) setMissionMobileTab('details');
                        }}
                      >
                        <div className="ticket-head">
                          <span className="ticket-key mono">{t.key}</span>
                          <span className="mono text-xs" style={{ color: priorityMeta.color }}>
                            {priorityMeta.icon} {t.priority}
                          </span>
                        </div>
                        <div className="ticket-summary">{t.summary}</div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {t.projectKey && (
                            <span className="chip mono text-[9px]">
                              {t.projectKey}
                            </span>
                          )}
                          <span className="chip text-[10px]" style={{ color: typeMeta.color }}>
                            {typeMeta.icon} {t.type}
                          </span>
                          {t.status && (
                            <span className={`chip mono text-[9px] ${t.status === 'In Progress' ? 'text-amber-500 font-bold' : t.status === 'Ready Prod' || t.status === 'Done' ? 'text-emerald-500 font-bold' : ''}`}>
                              ● {t.status}
                            </span>
                          )}
                          {t.figmaUrl && (
                            <span className="chip text-[9px] text-purple-500 font-bold">
                              🎨 Figma
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-500 mono ml-auto">{t.points} pts</span>
                        </div>
                      </div>
                    );
                  })}
                  {filteredTickets.length === 0 && (
                    <div className="text-zinc-500 italic text-xs py-4 text-center">
                      Tidak ada tiket yang cocok dengan filter status/pencarian.
                    </div>
                  )}
                </div>
              </section>

              {/* Column 3: Ticket Detail, Figma Link, & Acceptance Criteria */}
              <section className={`mission-col col-details ${missionMobileTab === 'details' ? 'show-mobile' : ''}`}>
                <h3 className="col-title">
                  <span className="step-no">3</span> Detail Spesifikasi &amp; Figma
                </h3>
                {activeTicket ? (
                  <div className="flex flex-col gap-3 text-xs overflow-y-auto pr-1">
                    <div>
                      <div className="text-base font-bold text-primary mb-1">
                        {activeTicket.key}: {activeTicket.summary}
                      </div>
                      <p className="text-zinc-500 leading-relaxed">{activeTicket.description}</p>
                    </div>

                    {/* Figma Design Link Section */}
                    {activeTicket.figmaUrl ? (
                      <div className="p-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-base">🎨</span>
                          <div className="overflow-hidden">
                            <b className="text-purple-600 dark:text-purple-400 block text-xs">Figma Design Terkait</b>
                            <span className="mono text-[10px] text-zinc-500 truncate block">
                              {activeTicket.figmaUrl}
                            </span>
                          </div>
                        </div>
                        <a
                          href={activeTicket.figmaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-violet text-xs whitespace-nowrap py-1 px-3"
                          style={{ padding: '4px 10px', fontSize: '11px' }}
                        >
                          Buka Figma ↗
                        </a>
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 text-[11px] mono">
                        Tidak ada link Figma terlampir di deskripsi tiket Jira ini.
                      </div>
                    )}

                    <div>
                      <div className="font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1">
                        Acceptance Criteria
                      </div>
                      <ul className="flex flex-col gap-1 text-zinc-500 pl-4 list-disc">
                        {activeTicket.ac.map((acItem, i) => (
                          <li key={i}>{acItem}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1">
                        Architectural Plan (Arga)
                      </div>
                      <ol className="flex flex-col gap-1 text-zinc-500 pl-4 list-decimal">
                        {activeTicket.plan.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                        Assigned Coder:
                      </span>
                      <span className="flow-chip" style={{ '--c': activeTicket.coder === 'bimo' ? '#8b5cf6' : '#10b981' }}>
                        {activeTicket.coder === 'bimo' ? 'Bimo (Senior Frontend)' : 'Kian (Senior Backend)'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 mono text-[11px]">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold block mb-0.5">
                        🤖 Eksekusi Antigravity AI
                      </span>
                      <span className="text-zinc-500">
                        Target Folder: <b className="text-primary">{customRepoPath}</b>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-zinc-500 italic">Pilih tiket Jira di samping.</div>
                )}
              </section>
            </div>

            <div className="modal-foot">
              <div className="flow-preview">
                <span className="flow-chip" style={{ '--c': '#f59e0b' }}>Tara (PM)</span>
                <span className="flow-arrow">➔</span>
                <span className="flow-chip" style={{ '--c': '#38bdf8' }}>Arga (Arch)</span>
                <span className="flow-arrow">➔</span>
                <span className="flow-chip" style={{ '--c': activeTicket?.coder === 'kian' ? '#10b981' : '#8b5cf6' }}>
                  {activeTicket?.coder === 'kian' ? 'Kian (BE)' : 'Bimo (FE)'}
                </span>
                <span className="flow-arrow">➔</span>
                <span className="flow-chip" style={{ '--c': '#f43f5e' }}>Vani (QA)</span>
                <span className="flow-arrow">➔</span>
                <span className="flow-chip" style={{ '--c': '#22d3ee' }}>Reno (Ops)</span>
              </div>
              <button
                type="button"
                className="btn btn-emerald btn-lg"
                disabled={!activeTicket}
                onClick={handleExecuteJira}
              >
                ⚡ Execute Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: HELP ===================== */}
      {isHelpOpen && (
        <div className="modal-backdrop" onClick={() => setIsHelpOpen(false)}>
          <div className="modal modal-sm glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-icon">⌨</div>
              <div>
                <h2>Kontrol &amp; Shortcut</h2>
                <p>Gerakan relatif terhadap layar (anti-inverted).</p>
              </div>
              <button
                className="btn-icon modal-close"
                type="button"
                aria-label="Tutup"
                onClick={() => setIsHelpOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body mono text-xs">
              <div className="grid grid-cols-2 gap-y-2">
                <div><kbd>W</kbd> / <kbd>↑</kbd></div><div>Jalan ke ATAS layar</div>
                <div><kbd>S</kbd> / <kbd>↓</kbd></div><div>Jalan ke BAWAH layar</div>
                <div><kbd>A</kbd> / <kbd>←</kbd></div><div>Jalan ke KIRI layar</div>
                <div><kbd>D</kbd> / <kbd>→</kbd></div><div>Jalan ke KANAN layar</div>
                <div><kbd>⇧ Shift</kbd></div><div>Sprint</div>
                <div><kbd>Klik Lantai</kbd></div><div>Click-to-move (raycast)</div>
                <div><kbd>Klik Meja</kbd></div><div>Jalan ke meja &amp; delegasi</div>
                <div><kbd>E</kbd></div><div>Interaksi dengan agen terdekat</div>
                <div><kbd>F</kbd></div><div>Slicing Figma ke Bimo</div>
                <div><kbd>J</kbd></div><div>Mission Control (Jira)</div>
                <div><kbd>T</kbd></div><div>Toggle Terminal Drawer</div>
                <div><kbd>P</kbd> / <kbd>M</kbd></div><div>Play/Pause · Mute audio</div>
                <div><kbd>C</kbd></div><div>Reset kamera ke Raffa</div>
                <div><kbd>Scroll</kbd></div><div>Zoom in / out</div>
                <div><kbd>Esc</kbd></div><div>Tutup panel / modal</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== BOOT SCREEN ===================== */}
      {!booted && (
        <div className="boot">
          <div className="boot-card">
            <div className="boot-cube" aria-hidden="true" />
            <div className="boot-title">Kantor Raffa</div>
            <div className="boot-sub mono">3D Virtual AI Office &amp; Autonomous Mission Control</div>
            <button
              id="boot-enter"
              className="btn btn-emerald btn-lg mt-4"
              type="button"
              onClick={handleEnterOffice}
            >
              Masuk Kantor ▶
            </button>
            <div className="boot-note mono">♪ CHON — Pitch Dark akan diputar otomatis saat masuk</div>
          </div>
        </div>
      )}
    </main>
  );
}
