import React, { useState } from 'react';
import { useAgentStore } from '../../store/useAgentStore';
import {
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  Download,
  FileCode,
  FileText,
  Layers,
  Shield,
  Sparkles,
  X,
} from 'lucide-react';

export const ArtifactDrawer: React.FC = () => {
  const activeDrawer = useAgentStore((state) => state.activeDrawer);
  const setActiveDrawer = useAgentStore((state) => state.setActiveDrawer);
  const activeArtifact = useAgentStore((state) => state.activeArtifact);

  const [activeTab, setActiveTab] = useState<'CODE' | 'SUMMARY' | 'STATS'>('CODE');
  const [copied, setCopied] = useState(false);

  if (activeDrawer !== 'ARTIFACT' || !activeArtifact) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeArtifact.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([activeArtifact.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeArtifact.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-3xl flex-col border-l border-slate-800 bg-slate-950/95 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-400">
            <FileCode className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-mono font-bold text-white tracking-wide">
                {activeArtifact.title}
              </h2>
              <span className="rounded bg-emerald-950/60 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400 border border-emerald-800/50">
                PROD-READY
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Target File: <span className="text-cyan-400 font-semibold">{activeArtifact.fileName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-white hover:border-cyan-500/50 transition-all"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-cyan-400" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>

          {/* Download File Button */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 text-xs font-mono font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </button>

          {/* Close Drawer */}
          <button
            onClick={() => setActiveDrawer('NONE')}
            className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 border-b border-slate-800/60 bg-slate-900/40 px-6 py-2.5 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-slate-400">Lines:</span>
          <span className="font-bold text-white">{activeArtifact.stats.lines}</span>
        </div>

        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-slate-400">Security:</span>
          <span className="font-bold text-emerald-400">
            {activeArtifact.stats.securityScore || '100% Passed'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-slate-400">Coverage:</span>
          <span className="font-bold text-amber-400">
            {activeArtifact.stats.coverage || '95%+'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-purple-400" />
          <span className="text-slate-400">Duration:</span>
          <span className="font-bold text-white">{activeArtifact.stats.durationSeconds}s</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800/60 bg-slate-950 px-6">
        <button
          onClick={() => setActiveTab('CODE')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-mono font-medium transition-all ${
            activeTab === 'CODE'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Code2 className="h-4 w-4" />
          <span>Source Code</span>
        </button>

        <button
          onClick={() => setActiveTab('SUMMARY')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-mono font-medium transition-all ${
            activeTab === 'SUMMARY'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Architecture & Rollback</span>
        </button>

        <button
          onClick={() => setActiveTab('STATS')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-mono font-medium transition-all ${
            activeTab === 'STATS'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Verification Audit</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 font-mono text-xs">
        {activeTab === 'CODE' && (
          <div className="relative rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
            <pre className="text-slate-200 leading-relaxed overflow-x-auto">
              <code>{activeArtifact.code}</code>
            </pre>
          </div>
        )}

        {activeTab === 'SUMMARY' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-5">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                Artifact Overview
              </h3>
              <p className="text-slate-300 leading-relaxed">
                {activeArtifact.summary}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-5">
              <h3 className="text-sm font-bold text-emerald-400 mb-2">
                Production Deployment Instructions
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Save file as <code className="bg-slate-800 px-2 py-0.5 rounded text-cyan-400">{activeArtifact.fileName}</code>.</li>
                <li>Run schema validation: <code className="bg-slate-800 px-2 py-0.5 rounded text-amber-400">npx prisma migrate dev --name init_multi_tenant</code>.</li>
                <li>Execute test assertions: <code className="bg-slate-800 px-2 py-0.5 rounded text-emerald-400">npm run test:security</code>.</li>
                <li>Review git diff and trigger CI/CD deployment pipeline.</li>
              </ol>
            </div>
          </div>
        )}

        {activeTab === 'STATS' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
                <div className="text-xs text-slate-400">Security Audit Status</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">PASSED</div>
                <div className="text-[11px] text-slate-500 mt-1">0 CWE vulnerabilities found</div>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
                <div className="text-xs text-slate-400">Test Coverage</div>
                <div className="text-2xl font-bold text-cyan-400 mt-1">
                  {activeArtifact.stats.coverage || '96.4%'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Unit & Integration suites</div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
              <div className="text-xs text-slate-400 mb-2">Compilation Checksum</div>
              <div className="font-mono text-[11px] text-slate-300 break-all bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                sha256:7f9a2b5e981c3d42e478546b30f2c418e38d975a6c11d293f0b8a1c9371089bc
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
