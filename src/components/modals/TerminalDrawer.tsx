import React, { useEffect, useRef, useState } from 'react';
import { useAgentStore } from '../../store/useAgentStore';
import {
  Copy,
  Search,
  Terminal,
  Trash2,
  X,
} from 'lucide-react';

export const TerminalDrawer: React.FC = () => {
  const activeDrawer = useAgentStore((state) => state.activeDrawer);
  const setActiveDrawer = useAgentStore((state) => state.setActiveDrawer);
  const terminalLogs = useAgentStore((state) => state.terminalLogs);
  const clearTerminalLogs = useAgentStore((state) => state.clearTerminalLogs);
  const agentStatus = useAgentStore((state) => state.agentStatus);

  const [filterLevel, setFilterLevel] = useState<'ALL' | 'INFO' | 'EXEC' | 'STEP' | 'SUCCESS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new logs arrive
  useEffect(() => {
    if (activeDrawer === 'TERMINAL') {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs, activeDrawer]);

  if (activeDrawer !== 'TERMINAL') return null;

  const filteredLogs = terminalLogs.filter((log) => {
    const matchesFilter = filterLevel === 'ALL' || log.level === filterLevel;
    const matchesSearch = searchQuery === '' || log.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleCopyAll = () => {
    const text = terminalLogs.map((l) => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'SUCCESS':
        return <span className="text-emerald-400 font-bold">[SUCCESS]</span>;
      case 'WARN':
        return <span className="text-rose-400 font-bold">[WARN]</span>;
      case 'EXEC':
        return <span className="text-purple-400 font-bold">[EXEC]</span>;
      case 'STEP':
        return <span className="text-amber-400 font-bold">[STEP]</span>;
      default:
        return <span className="text-cyan-400 font-bold">[INFO]</span>;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col border-l border-slate-800 bg-slate-950/95 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-950/40 text-cyan-400">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-mono font-bold text-white tracking-wide">
              TERMINAL STREAM // LIVE EXECUTION LOGS
            </h2>
            <div className="text-[11px] font-mono text-slate-400">
              Agent State: <span className="text-cyan-400 uppercase font-semibold">{agentStatus}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-white transition-colors"
          >
            <Copy className="h-3.5 w-3.5 text-cyan-400" />
            <span>{copied ? 'Copied!' : 'Copy Logs'}</span>
          </button>

          <button
            onClick={clearTerminalLogs}
            className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:text-rose-400 transition-colors"
            title="Clear Logs"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <button
            onClick={() => setActiveDrawer('NONE')}
            className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:text-white transition-colors"
            title="Close Drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/60 bg-slate-900/40 px-6 py-2.5">
        <div className="flex items-center gap-1.5 text-xs font-mono">
          {(['ALL', 'STEP', 'EXEC', 'INFO', 'SUCCESS'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filterLevel === lvl
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div className="relative w-48">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-3 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Terminal Output Area */}
      <div className="flex-1 overflow-y-auto p-6 font-mono text-xs leading-relaxed scanline">
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 rounded-lg p-1.5 hover:bg-slate-900/50 transition-colors"
            >
              <span className="shrink-0 text-slate-600 select-none">
                {log.timestamp}
              </span>
              <span className="shrink-0 select-none">
                {getLevelBadge(log.level)}
              </span>
              <span className="text-slate-300 break-all font-mono">
                {log.message}
              </span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Terminal Footer */}
      <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-950/80 px-6 py-3 text-[11px] font-mono text-slate-500">
        <div>Total Log Entries: {terminalLogs.length}</div>
        <div className="flex items-center gap-2 text-cyan-400">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Stream Sync: Nominal</span>
        </div>
      </div>
    </div>
  );
};
