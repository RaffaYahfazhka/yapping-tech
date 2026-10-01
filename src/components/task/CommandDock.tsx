import React, { useState } from 'react';
import { useAgentStore } from '../../store/useAgentStore';
import { TASK_PRESETS } from '../../data/taskPresets';
import {
  CheckCircle2,
  ChevronRight,
  Database,
  Globe,
  Layout,
  Send,
  Server,
  ShieldCheck,
  Sparkles,
  StopCircle,
  Terminal,
  Zap,
} from 'lucide-react';

export const CommandDock: React.FC = () => {
  const [inputVal, setInputVal] = useState('');
  const agentStatus = useAgentStore((state) => state.agentStatus);
  const activeTask = useAgentStore((state) => state.activeTask);
  const dispatchPreset = useAgentStore((state) => state.dispatchPreset);
  const dispatchCustomPrompt = useAgentStore((state) => state.dispatchCustomPrompt);
  const abortTask = useAgentStore((state) => state.abortTask);
  const setActiveDrawer = useAgentStore((state) => state.setActiveDrawer);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || agentStatus === 'PROCESSING') return;
    dispatchCustomPrompt(inputVal);
    setInputVal('');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'DATABASE':
        return <Database className="h-3.5 w-3.5 text-emerald-400" />;
      case 'API':
        return <Server className="h-3.5 w-3.5 text-cyan-400" />;
      case 'FRONTEND':
        return <Layout className="h-3.5 w-3.5 text-purple-400" />;
      case 'TESTING':
        return <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />;
      case 'DEVOPS':
        return <Globe className="h-3.5 w-3.5 text-sky-400" />;
      default:
        return <Zap className="h-3.5 w-3.5 text-pink-400" />;
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-4 pointer-events-auto">
      <div className="overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-950/85 p-3.5 backdrop-blur-2xl shadow-2xl shadow-cyan-950/20">
        {/* Active Task Live Progress Bar (if processing or just finished) */}
        {activeTask && (
          <div className="mb-3 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  {agentStatus === 'PROCESSING' && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${agentStatus === 'PROCESSING' ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
                </span>
                <span className="text-xs font-semibold text-white tracking-wide">
                  {activeTask.title}
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {activeTask.category}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {activeTask.progress}%
                </span>
                {agentStatus === 'PROCESSING' && (
                  <button
                    onClick={abortTask}
                    className="flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-[11px] font-mono text-rose-300 hover:bg-rose-500/20 transition-colors"
                  >
                    <StopCircle className="h-3 w-3" />
                    <span>Abort</span>
                  </button>
                )}
                {agentStatus === 'COMPLETED' && (
                  <button
                    onClick={() => setActiveDrawer('ARTIFACT')}
                    className="flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-mono text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    <span>View Artifact</span>
                  </button>
                )}
              </div>
            </div>

            {/* Glowing progress line */}
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${activeTask.progress}%` }}
              />
            </div>

            {/* Current Step Description */}
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono flex items-center gap-1">
                <ChevronRight className="h-3 w-3 text-cyan-400" />
                {activeTask.currentStep}
              </span>
              <span className="font-mono text-slate-500">
                {agentStatus === 'PROCESSING' ? 'Estimating ~6s...' : 'Delivered'}
              </span>
            </div>
          </div>
        )}

        {/* Quick Action Presets Horizontal Strip */}
        <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 shrink-0 pr-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>PRESETS:</span>
          </div>

          {TASK_PRESETS.map((preset) => (
            <button
              key={preset.id}
              disabled={agentStatus === 'PROCESSING'}
              onClick={() => dispatchPreset(preset.id)}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 transition-all hover:border-cyan-500/50 hover:bg-slate-800/80 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed group"
            >
              {getCategoryIcon(preset.category)}
              <span className="font-medium">{preset.title.split('&')[0]}</span>
              <span className="text-[10px] font-mono text-slate-500 group-hover:text-cyan-400">
                ~{preset.estimatedDurationSeconds}s
              </span>
            </button>
          ))}
        </div>

        {/* CLI Task Input Form */}
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <div className="absolute left-3.5 flex items-center gap-2 pointer-events-none text-cyan-400">
            <Terminal className="h-4 w-4" />
            <span className="text-xs font-mono font-bold text-slate-500">$</span>
          </div>

          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={agentStatus === 'PROCESSING'}
            placeholder={
              agentStatus === 'PROCESSING'
                ? 'AI Agent executing workflow... Please wait'
                : 'Enter task or command (e.g. /dispatch Optimize Postgres indexes, /status, /clear)...'
            }
            className="w-full rounded-xl border border-slate-800/80 bg-slate-900/80 py-3 pl-12 pr-28 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/80 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 disabled:opacity-50"
          />

          <div className="absolute right-2 flex items-center gap-1.5">
            <button
              type="submit"
              disabled={!inputVal.trim() || agentStatus === 'PROCESSING'}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-cyan-500 hover:to-sky-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="h-3 w-3" />
              <span>Dispatch</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
