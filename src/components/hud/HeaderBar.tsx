import React, { useState } from 'react';
import { useAgentStore } from '../../store/useAgentStore';
import {
  Activity,
  Bookmark,
  Bot,
  ChevronDown,
  FileCode,
  Headphones,
  KanbanSquare,
  Radio,
  Sliders,
  Terminal,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';

export const HeaderBar: React.FC = () => {
  const agentStatus = useAgentStore((state) => state.agentStatus);
  const telemetry = useAgentStore((state) => state.telemetry);
  const updateTelemetryModel = useAgentStore((state) => state.updateTelemetryModel);
  const activeDrawer = useAgentStore((state) => state.activeDrawer);
  const setActiveDrawer = useAgentStore((state) => state.setActiveDrawer);
  const jiraTickets = useAgentStore((state) => state.jiraTickets);

  // Audio store state
  const audioSettings = useAgentStore((state) => state.audioSettings);
  const toggleBGM = useAgentStore((state) => state.toggleBGM);
  const toggleMute = useAgentStore((state) => state.toggleMute);
  const setVolume = useAgentStore((state) => state.setVolume);
  const setBgmMode = useAgentStore((state) => state.setBgmMode);
  const initAudio = useAgentStore((state) => state.initAudio);

  const [showAudioPopover, setShowAudioPopover] = useState(false);
  const [showModelPopover, setShowModelPopover] = useState(false);

  const statusConfig = {
    IDLE: {
      badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      dot: 'bg-cyan-400',
      label: 'IDLE // MONITORING',
    },
    PROCESSING: {
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      dot: 'bg-amber-400 animate-ping',
      label: 'WORKING // PIPELINE ACTIVE',
    },
    COMPLETED: {
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400',
      label: 'DELIVERED // SUCCESS',
    },
    ERROR: {
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      dot: 'bg-rose-400',
      label: 'ABORTED // ERROR',
    },
  }[agentStatus];

  const models = [
    'DeepSeek Coder V2 (MoE 236B)',
    'Claude 3.5 Sonnet (Agentic)',
    'GPT-4o (Omni Pipeline)',
    'Qwen 2.5 Coder 32B',
  ];

  return (
    <header className="relative z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-6 backdrop-blur-xl">
      {/* Left: Branding & Agent Status */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/80 to-slate-900 text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Bot className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${statusConfig.dot}`} />
              <span className={`relative inline-flex h-3 w-3 rounded-full ${statusConfig.dot}`} />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Orbitron'] text-sm font-bold tracking-wider text-white">
                CYBER-OPERATOR
              </span>
              <span className="rounded bg-cyan-950/60 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-cyan-400 border border-cyan-800/50">
                v2.4
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              3D AI Virtual Office & Delegation Engine
            </div>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className={`hidden sm:flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-mono font-medium ${statusConfig.badge}`}>
          <span className={`h-2 w-2 rounded-full ${statusConfig.dot}`} />
          {statusConfig.label}
        </div>
      </div>

      {/* Center: Live Telemetry Gauges */}
      <div className="hidden lg:flex items-center gap-6 rounded-2xl border border-slate-800/60 bg-slate-900/40 px-4 py-1.5 backdrop-blur-md">
        {/* Model Selector */}
        <div className="relative">
          <button
            onClick={() => setShowModelPopover(!showModelPopover)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span className="max-w-[150px] truncate">{telemetry.activeModel}</span>
            <ChevronDown className="h-3 w-3 text-slate-500" />
          </button>

          {showModelPopover && (
            <div className="absolute top-8 left-0 z-50 w-64 rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-2xl backdrop-blur-xl">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 py-1">
                Select Model Backend
              </div>
              {models.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    updateTelemetryModel(m);
                    setShowModelPopover(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                    telemetry.activeModel === m
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-4 w-[1px] bg-slate-800" />

        {/* CPU Load */}
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-xs text-slate-400">CPU</span>
          <span className="font-mono text-xs font-bold text-white">
            {telemetry.cpuUsage}%
          </span>
        </div>

        <div className="h-4 w-[1px] bg-slate-800" />

        {/* Tokens per second */}
        <div className="flex items-center gap-2">
          <Radio className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs text-slate-400">TOKENS</span>
          <span className="font-mono text-xs font-bold text-emerald-400">
            {telemetry.tokensPerSec} t/s
          </span>
        </div>
      </div>

      {/* Right: Audio Control & Drawer Toggles */}
      <div className="flex items-center gap-3">
        {/* Audio Control Pill */}
        <div className="relative">
          <div className="flex items-center rounded-xl border border-slate-800/80 bg-slate-900/60 p-1">
            <button
              onClick={() => {
                initAudio();
                toggleBGM();
              }}
              title={audioSettings.isPlaying ? 'Pause Lo-Fi Ambient BGM' : 'Play Lo-Fi Ambient BGM'}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                audioSettings.isPlaying
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Headphones className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">
                {audioSettings.isPlaying ? 'BGM ON' : 'BGM OFF'}
              </span>
              {/* Equalizer animation */}
              {audioSettings.isPlaying && (
                <div className="flex items-end gap-0.5 h-3 ml-1">
                  <span className="w-0.5 bg-cyan-400 rounded-full animate-pulse h-2" />
                  <span className="w-0.5 bg-cyan-400 rounded-full animate-pulse h-3" style={{ animationDelay: '0.15s' }} />
                  <span className="w-0.5 bg-cyan-400 rounded-full animate-pulse h-1.5" style={{ animationDelay: '0.3s' }} />
                </div>
              )}
            </button>

            <button
              onClick={() => setShowAudioPopover(!showAudioPopover)}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
              title="Audio Sound Settings"
            >
              <Sliders className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Audio Settings Popover */}
          {showAudioPopover && (
            <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-slate-800 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                  Synthesizer Audio Engine
                </span>
                <span className="rounded bg-cyan-950 px-1.5 py-0.5 text-[10px] font-mono text-cyan-400">
                  Web Audio API
                </span>
              </div>

              {/* Master Volume Slider */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Master Volume</span>
                  <span className="font-mono text-cyan-400">{Math.round(audioSettings.volume * 100)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={toggleMute} className="text-slate-400 hover:text-white">
                    {audioSettings.volume === 0 ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioSettings.volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* BGM Mode Switch */}
              <div className="mt-4">
                <div className="text-xs text-slate-400 mb-2">BGM Soundscape</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setBgmMode('LOFI')}
                    className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all ${
                      audioSettings.mode === 'LOFI'
                        ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-300 font-semibold'
                        : 'border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Lo-Fi Chords
                  </button>
                  <button
                    onClick={() => setBgmMode('SYNTHWAVE')}
                    className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all ${
                      audioSettings.mode === 'SYNTHWAVE'
                        ? 'border-purple-500/50 bg-purple-500/20 text-purple-300 font-semibold'
                        : 'border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Synthwave Retro
                  </button>
                </div>
              </div>

              {/* Dynamic Muffle Effect Note */}
              <div className="mt-3 rounded-lg bg-slate-900/60 p-2 text-[10px] text-slate-400 border border-slate-800/60">
                💡 Low-pass filter (muffle) dynamically engages whenever task drawers and code inspect overlays are open.
              </div>
            </div>
          )}
        </div>

        {/* Drawer Quick Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Jira Board Toggle */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === 'JIRA' ? 'NONE' : 'JIRA')}
            title="Open Atlassian Jira Sprint Board"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
              activeDrawer === 'JIRA'
                ? 'border-cyan-400 bg-cyan-500/25 text-cyan-200 shadow-lg shadow-cyan-500/20'
                : 'border-slate-800/80 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bookmark className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline font-bold">Jira</span>
            <span className="rounded-full bg-cyan-950/80 px-1.5 py-0.2 text-[10px] text-cyan-300 border border-cyan-800/60">
              {jiraTickets.filter((t) => t.status === 'DONE').length}/{jiraTickets.length}
            </span>
          </button>

          {/* Terminal Drawer Toggle */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === 'TERMINAL' ? 'NONE' : 'TERMINAL')}
            title="Toggle Live Terminal & Logs"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
              activeDrawer === 'TERMINAL'
                ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-500/10'
                : 'border-slate-800/80 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Terminal className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden md:inline">Terminal</span>
          </button>

          {/* Artifact Drawer Toggle */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === 'ARTIFACT' ? 'NONE' : 'ARTIFACT')}
            title="Inspect Generated Code & Artifacts"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
              activeDrawer === 'ARTIFACT'
                ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-500/10'
                : 'border-slate-800/80 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileCode className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden md:inline">Artifact</span>
          </button>

          {/* Kanban Drawer Toggle */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === 'KANBAN' ? 'NONE' : 'KANBAN')}
            title="Workflow Kanban Board"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
              activeDrawer === 'KANBAN'
                ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-500/10'
                : 'border-slate-800/80 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <KanbanSquare className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden md:inline">Kanban</span>
          </button>
        </div>
      </div>
    </header>
  );
};
