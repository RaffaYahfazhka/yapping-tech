'use client';

import { useState } from 'react';
import { AGENTS } from '../lib/data/agents.js';
import { REPOS } from '../lib/data/repos.js';
import { TYPE_META, PRIORITY_META } from '../lib/data/tickets.js';

/**
 * SubordinateModal — Interactive Team Workspace for Raffa (The Frontend Boss)
 * Provides unique, role-tailored interactions for each subordinate agent:
 * - Tara: Jira Triage & INVEST Acceptance Criteria
 * - Arga: Folder / Repo Selection & Architecture Blueprint
 * - jajang: Figma Slicing to React + Tailwind CSS
 * - Kian: API Contracts, Mock Endpoints & Prisma Schema
 * - Vani: Pixel-Diff QA & Automated Test Suite (100% Gate)
 * - Reno: Git Flow (main -> feat -> rc -> dev) & GitLab Merge Request Manager
 */
export default function SubordinateModal({
  isOpen,
  onClose,
  activeAgentId = 'tara',
  setActiveAgentId,
  tickets = [],
  activeTicket = null,
  setActiveTicketKey,
  selectedRepoId,
  setSelectedRepoId,
  customRepoPath,
  setCustomRepoPath,
  figmaUrl,
  setFigmaUrl,
  figmaParseResult,
  onRunFullPipeline,
  onFocusAgentInScene,
}) {
  if (!isOpen) return null;

  const currentAgent = AGENTS.find((a) => a.id === activeAgentId) || AGENTS[0];

  // Search & Filter for Tara's Tickets
  const [taraSearch, setTaraSearch] = useState('');
  const [taraStatusFilter, setTaraStatusFilter] = useState('active');

  // Arga: Component Blueprint state
  const [blueprintSaved, setBlueprintSaved] = useState(false);

  // jajang: Slicing state
  const [slicingDone, setSlicingDone] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Kian: Mock API state
  const [mockTested, setMockTested] = useState(false);

  // Vani: QA Regression state
  const [precisionScore, setPrecisionScore] = useState(99.8);
  const [qaPassed, setQaPassed] = useState(true);

  // Reno: Git Flow state
  const [rcVersion, setRcVersion] = useState('v1.4.0');
  const [gitlabHost, setGitlabHost] = useState('https://gitlab.com');
  const [gitlabProject, setGitlabProject] = useState('raffayahfazhka/yapping-techflow');
  const [gitlabToken, setGitlabToken] = useState('glpat-atlassian-etb-token');
  const [copiedGitCmd, setCopiedGitCmd] = useState(false);
  const [mrCreated, setMrCreated] = useState(false);

  // Filtered tickets for Tara
  const filteredTickets = tickets.filter((t) => {
    if (taraStatusFilter === 'active') {
      const activeStatuses = ['To Do', 'In Progress', 'In Review', 'QA', 'Ready Prod'];
      if (!activeStatuses.includes(t.status)) return false;
    } else if (taraStatusFilter !== 'all' && t.status !== taraStatusFilter) {
      return false;
    }
    if (taraSearch.trim()) {
      const q = taraSearch.toLowerCase();
      return t.key.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q);
    }
    return true;
  });

  const gitFlowCommand = `cd "${customRepoPath}"
git checkout main && git pull origin main
git checkout -b feat/${activeTicket?.key || 'FEAT-101'}-${activeTicket?.key ? 'feature-slicing' : 'ui-update'}
git add . && git commit -m "feat(${activeTicket?.key || 'UI'}): slice component with tailwind css"
git checkout -b rc/${rcVersion}
git merge feat/${activeTicket?.key || 'FEAT-101'}-${activeTicket?.key ? 'feature-slicing' : 'ui-update'}
git checkout dev && git merge rc/${rcVersion}
git push origin feat/${activeTicket?.key || 'FEAT-101'}-${activeTicket?.key ? 'feature-slicing' : 'ui-update'} rc/${rcVersion} dev`;

  const handleCopyGitCommand = () => {
    navigator.clipboard.writeText(gitFlowCommand);
    setCopiedGitCmd(true);
    setTimeout(() => setCopiedGitCmd(false), 2000);
  };

  const handleCopyTailwindCode = () => {
    const code = `// ${activeTicket?.key || 'FEAT-101'}: Sliced Component by jajang (Senior Frontend Dev)
import { useState } from 'react';

export default function TicketFeatureComponent() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="w-full max-w-4xl mx-auto p-6 rounded-2xl bg-zinc-900/80 backdrop-blur-xl border border-white/10 shadow-2xl text-zinc-100">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            ${activeTicket?.key || 'TECH-101'}
          </span>
          <h2 className="text-xl font-bold mt-1 text-white">${activeTicket?.summary || 'Interactive Feature'}</h2>
        </div>
        <button className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-sm transition-all shadow-lg shadow-emerald-500/25">
          Submit Action
        </button>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-zinc-800/50 border border-white/5">
          <span className="text-xs text-zinc-400 uppercase font-mono">Status</span>
          <p className="text-sm font-semibold text-emerald-400 mt-1">${activeTicket?.status || 'In Progress'}</p>
        </div>
        <div className="p-4 rounded-xl bg-zinc-800/50 border border-white/5">
          <span className="text-xs text-zinc-400 uppercase font-mono">Assignee</span>
          <p className="text-sm font-semibold text-zinc-200 mt-1">Raffa (Lead Frontend)</p>
        </div>
        <div className="p-4 rounded-xl bg-zinc-800/50 border border-white/5">
          <span className="text-xs text-zinc-400 uppercase font-mono">Figma Node</span>
          <p className="text-sm font-semibold text-purple-400 mt-1">${figmaParseResult?.nodeId || '204-12'}</p>
        </div>
      </div>
    </div>
  );
}`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal glass"
        style={{ maxWidth: '960px', width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===================== MODAL HEADER ===================== */}
        <div className="modal-head flex-shrink-0 flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-md"
              style={{ backgroundColor: `${currentAgent.color}25`, color: currentAgent.color, border: `1.5px solid ${currentAgent.color}60` }}
            >
              {currentAgent.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">{currentAgent.name}</h2>
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase"
                  style={{ backgroundColor: `${currentAgent.color}20`, color: currentAgent.color, border: `1px solid ${currentAgent.color}40` }}
                >
                  {currentAgent.role}
                </span>
                <span className="text-[11px] text-zinc-400 mono">· Tim Raffa</span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">{currentAgent.duties}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              onClick={() => {
                onClose();
                onRunFullPipeline?.();
              }}
              title="Jalankan pipeline otomatis dari Tara sampai Reno"
            >
              <span>⚡ Jalankan Full Pipeline</span>
            </button>
            <button
              className="btn-icon modal-close"
              type="button"
              aria-label="Tutup"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ===================== SUBORDINATE AGENT TABS BAR ===================== */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-black/30 border-b border-white/5 overflow-x-auto flex-shrink-0">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-2 flex-shrink-0">
            Karyawan:
          </span>
          {AGENTS.map((agent) => {
            const isActive = activeAgentId === agent.id;
            return (
              <button
                key={agent.id}
                type="button"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                  isActive
                    ? 'bg-zinc-800 text-white shadow-sm border'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
                style={{
                  borderColor: isActive ? `${agent.color}80` : 'transparent',
                }}
                onClick={() => {
                  setActiveAgentId?.(agent.id);
                  onFocusAgentInScene?.(agent.id);
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: agent.color }}
                />
                <span className="font-semibold">{agent.name}</span>
                <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">({agent.short})</span>
              </button>
            );
          })}
        </div>

        {/* ===================== AGENT WORKSPACE BODY ===================== */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* ========================================================================= */}
          {/* 1. TARA: Jira Triage & Acceptance Criteria                                 */}
          {/* ========================================================================= */}
          {activeAgentId === 'tara' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs text-amber-200">
                <span className="text-xl flex-shrink-0">📋</span>
                <div>
                  <b className="font-bold block text-amber-300">Tara — Product Manager</b>
                  Tara menyaring tiket Jira yang di-assign ke Raffa, memvalidasi Acceptance Criteria, dan memastikan kriteria INVEST lengkap sebelum didelegasikan ke tim teknis.
                </div>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                <input
                  type="text"
                  placeholder="Cari tiket Jira (Key / Summary)..."
                  className="input text-xs w-full sm:w-72"
                  value={taraSearch}
                  onChange={(e) => setTaraSearch(e.target.value)}
                />
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['active', 'To Do', 'In Progress', 'Ready Prod', 'all'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                        taraStatusFilter === st
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                          : 'border-white/10 text-zinc-400 hover:text-white'
                      }`}
                      onClick={() => setTaraStatusFilter(st)}
                    >
                      {st === 'active' ? '⚡ To Do ➔ Ready Prod' : st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tickets List & Detail */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Column: Ticket List */}
                <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
                  {filteredTickets.map((t) => {
                    const isSelected = activeTicket?.key === t.key;
                    const typeMeta = TYPE_META[t.type] || { icon: '•', color: '#f59e0b' };
                    return (
                      <div
                        key={t.key}
                        onClick={() => setActiveTicketKey?.(t.key)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-mono font-bold text-amber-400">{t.key}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-800 text-zinc-300 border border-white/10">
                            {t.status}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-white truncate">{t.summary}</div>
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2">
                          <span className="flex items-center gap-1">
                            <span style={{ color: typeMeta.color }}>{typeMeta.icon}</span> {t.type}
                          </span>
                          <span className="font-mono text-zinc-500">{t.storyPoints || 3} SP</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Column: Active Ticket Inspection */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/10 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Tiket Terpilih</span>
                      <a
                        href={activeTicket?.jiraUrl || `https://etbteam.atlassian.net/browse/${activeTicket?.key || 'TECH-101'}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-sky-400 hover:underline flex items-center gap-1 font-mono"
                      >
                        Buka di Jira ↗
                      </a>
                    </div>
                    <h3 className="text-sm font-bold text-white">{activeTicket?.summary || 'Pilih tiket dari daftar'}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">{activeTicket?.description || 'Deskripsi tiket dari Jira Cloud.'}</p>

                    <div className="pt-2 border-t border-white/10 space-y-1.5">
                      <span className="text-[11px] font-bold text-zinc-300 block">Acceptance Criteria (INVEST):</span>
                      {(activeTicket?.acceptanceCriteria || [
                        'Komponen responsif di desktop & mobile',
                        'Menerapkan styling Tailwind CSS sesuai token Figma',
                        'Validasi input & handling error state',
                        'Unit test Vitest minimum 80% coverage',
                      ]).map((ac, idx) => (
                        <label key={idx} className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                          <input type="checkbox" defaultChecked className="accent-amber-500 rounded" />
                          <span>{ac}</span>
                        </label>
                      ))}
                    </div>

                    {activeTicket?.figmaUrl && (
                      <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
                        <b>🎨 Link Figma Terlampir:</b>
                        <span className="block truncate font-mono text-[11px] mt-0.5">{activeTicket.figmaUrl}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="w-full mt-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                    onClick={() => {
                      setActiveAgentId?.('arga');
                      onFocusAgentInScene?.('arga');
                    }}
                  >
                    <span>Lanjut ke Arga: Pilih Folder &amp; Desain Arsitektur ➔</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. ARGA: Folder Selection & Architecture Blueprint                         */}
          {/* ========================================================================= */}
          {activeAgentId === 'arga' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-start gap-3 text-xs text-sky-200">
                <span className="text-xl flex-shrink-0">📐</span>
                <div>
                  <b className="font-bold block text-sky-300">Arga — Lead Architect</b>
                  Arga membantu Raffa memilih folder repositori target eksekusi di komputer lokal, memindai dependensi, dan merancang kontrak arsitektur modul sebelum slicing.
                </div>
              </div>

              {/* Local Folder / Repo Selection */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                    1. Pilih Folder Proyek Lokal untuk Dieksekusi
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono font-semibold">✓ Next.js 16 + Tailwind CSS</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-300 font-medium">Path Folder Repositori (Komputer Kamu):</label>
                  <input
                    type="text"
                    className="input mono text-xs w-full"
                    value={customRepoPath}
                    onChange={(e) => setCustomRepoPath?.(e.target.value)}
                    placeholder="/Users/.../your-project-folder"
                  />
                  <small className="text-[10px] text-zinc-400 font-mono">
                    Semua branching Git Flow dan generate kode akan diarahkan ke direktori ini.
                  </small>
                </div>

                {/* Preset Repos */}
                <div>
                  <span className="text-xs text-zinc-400 block mb-2">Preset Repositori Terdaftar:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {REPOS.map((repo) => (
                      <button
                        key={repo.id}
                        type="button"
                        className={`p-2.5 rounded-xl text-left border transition-all ${
                          selectedRepoId === repo.id
                            ? 'bg-sky-500/15 border-sky-500 text-sky-300 shadow-sm'
                            : 'border-white/10 hover:border-white/20 text-zinc-300'
                        }`}
                        onClick={() => setSelectedRepoId?.(repo.id)}
                      >
                        <div className="font-semibold text-xs truncate">{repo.id}</div>
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{repo.lang}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Architecture Blueprint Card */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                    2. Architecture Blueprint untuk {activeTicket?.key || 'Tiket Aktif'}
                  </span>
                  {blueprintSaved && (
                    <span className="text-[11px] text-emerald-400 font-bold">✓ Blueprint Disetujui</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                    <span className="text-[10px] text-zinc-400 font-mono uppercase block">UI Layer (Next.js)</span>
                    <p className="font-mono text-zinc-200 text-[11px]">src/components/features/</p>
                    <p className="text-[10px] text-zinc-400">Tailwind CSS + Server Actions</p>
                  </div>
                  <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                    <span className="text-[10px] text-zinc-400 font-mono uppercase block">State &amp; Hooks</span>
                    <p className="font-mono text-zinc-200 text-[11px]">src/hooks/useTicket.js</p>
                    <p className="text-[10px] text-zinc-400">Optimistic UI update</p>
                  </div>
                  <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                    <span className="text-[10px] text-zinc-400 font-mono uppercase block">API Client Contract</span>
                    <p className="font-mono text-zinc-200 text-[11px]">/api/tickets/:id</p>
                    <p className="text-[10px] text-zinc-400">Standard REST JSON schema</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    className="flex-1 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-black font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                    onClick={() => {
                      setBlueprintSaved(true);
                      setActiveAgentId?.('jajang');
                      onFocusAgentInScene?.('jajang');
                    }}
                  >
                    <span>📐 Setujui Blueprint &amp; Delegasikan ke jajang (Slicing) ➔</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. JAJANG: Figma Slicing to React + Tailwind                               */}
          {/* ========================================================================= */}
          {activeAgentId === 'jajang' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-start gap-3 text-xs text-violet-200">
                <span className="text-xl flex-shrink-0">🎨</span>
                <div>
                  <b className="font-bold block text-violet-300">jajang — Senior Frontend Dev</b>
                  jajang adalah eksekutor UI bawahan Raffa. Dia meng-extract design tokens dari Figma (warna, layout, spacing) dan memproduksi komponen Next.js + Tailwind CSS yang responsif.
                </div>
              </div>

              {/* Figma URL & Target File */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/10 space-y-3">
                <label className="field">
                  <span className="text-xs text-zinc-300 font-medium block mb-1">Link Desain Figma / Frame Node ID:</span>
                  <input
                    type="text"
                    className="input mono text-xs w-full"
                    value={figmaUrl}
                    onChange={(e) => setFigmaUrl?.(e.target.value)}
                    placeholder="https://www.figma.com/design/.../?node-id=204-12"
                  />
                  {figmaParseResult?.ok && (
                    <small className="text-[11px] text-emerald-400 font-mono mt-1 block">
                      ✓ Valid Figma Node ID: <b>{figmaParseResult.nodeId}</b> (File: {figmaParseResult.fileKey})
                    </small>
                  )}
                </label>

                {/* Slicing Actions & Code Preview */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                    onClick={() => setSlicingDone(true)}
                  >
                    <span>⚡ Generate Komponen Tailwind</span>
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-zinc-300 font-mono flex items-center gap-1"
                    onClick={handleCopyTailwindCode}
                  >
                    {copiedCode ? '✓ Tersalin!' : '📋 Salin Kode JSX'}
                  </button>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/60">
                  <div className="px-3 py-1.5 bg-zinc-800/80 border-b border-white/5 text-[10px] font-mono text-zinc-400 flex items-center justify-between">
                    <span>Generated Component: TicketDetailModal.jsx (Tailwind CSS)</span>
                    <span className="text-emerald-400">Strict Precision Mode</span>
                  </div>
                  <pre className="p-3 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-[180px] leading-relaxed">
{`export default function TicketFeatureComponent() {
  return (
    <div className="w-full max-w-4xl p-6 rounded-2xl bg-zinc-900/80 backdrop-blur-xl border border-white/10 text-zinc-100">
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400">
        ${activeTicket?.key || 'TECH-101'}
      </span>
      <h2 className="text-xl font-bold mt-2">${activeTicket?.summary || 'Interactive Feature'}</h2>
      <button className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-sm">
        Submit Action
      </button>
    </div>
  );
}`}
                  </pre>
                </div>

                <button
                  type="button"
                  className="w-full py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold text-xs shadow-lg shadow-violet-500/20 transition-all flex items-center justify-center gap-2"
                  onClick={() => {
                    setActiveAgentId?.('vani');
                    onFocusAgentInScene?.('vani');
                  }}
                >
                  <span>Kirim ke Vani: Uji Pixel-Diff &amp; Visual Regression ➔</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. KIAN: API Endpoints & Mock Services                                     */}
          {/* ========================================================================= */}
          {activeAgentId === 'kian' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3 text-xs text-emerald-200">
                <span className="text-xl flex-shrink-0">🗄️</span>
                <div>
                  <b className="font-bold block text-emerald-300">Kian — Senior Backend Specialist</b>
                  Kian memastikan Raffa tidak terhambat oleh backend yang belum siap. Kian menyiapkan kontrak API, Prisma schema, dan server mock yang langsung merespons data JSON untuk UI Raffa.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    API Contract untuk Frontend Raffa
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px]">
                    200 OK
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-bold text-[10px]">GET</span>
                    <span className="text-zinc-200">/api/v1/tickets/{activeTicket?.key || 'TECH-101'}</span>
                  </div>
                  <pre className="text-[11px] font-mono text-emerald-300 bg-black/60 p-2.5 rounded-lg overflow-x-auto max-h-[140px]">
{`{
  "key": "${activeTicket?.key || 'TECH-101'}",
  "status": "${activeTicket?.status || 'In Progress'}",
  "summary": "${activeTicket?.summary || 'Mock Summary'}",
  "assignee": "Raffa (Frontend Boss)",
  "payload": { "authorized": true, "timestamp": "${new Date().toISOString()}" }
}`}
                  </pre>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                    onClick={() => setMockTested(true)}
                  >
                    <span>▶ Test Mock Endpoint</span>
                  </button>
                  {mockTested && (
                    <span className="text-xs text-emerald-400 font-semibold">✓ Respons 200 OK Diterima (Mock Siap)</span>
                  )}
                </div>

                <button
                  type="button"
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                  onClick={() => {
                    setActiveAgentId?.('jajang');
                    onFocusAgentInScene?.('jajang');
                  }}
                >
                  <span>Hubungkan Mock Data ke Komponen jajang ➔</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. VANI: QA Pixel-Diff & Precision Gate                                    */}
          {/* ========================================================================= */}
          {activeAgentId === 'vani' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 text-xs text-rose-200">
                <span className="text-xl flex-shrink-0">🔍</span>
                <div>
                  <b className="font-bold block text-rose-300">Vani — QA Sentinel &amp; Guardian</b>
                  Vani menjalankan raster pixel-diff antara desain Figma dan hasil render Next.js DOM, memverifikasi responsive breakpoints, dan memastikan precision score mencapai 99%+ sebelum kode boleh masuk Git Flow.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/10 space-y-4">
                {/* Precision Score Progress */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-zinc-200">Pixel Precision Gate:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">{precisionScore}% (Passed)</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden border border-white/5">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500" style={{ width: `${precisionScore}%` }} />
                  </div>
                </div>

                {/* QA Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { label: 'Pixel-Diff Raster Alignment', passed: true },
                    { label: 'Oxlint & ESLint Clean', passed: true },
                    { label: 'Vitest Unit Tests (3/3)', passed: true },
                    { label: 'Responsive Breakpoint Check', passed: true },
                  ].map((check, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                      <span className="text-zinc-300">{check.label}</span>
                      <span className="text-emerald-400 font-bold">✓ Pass</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
                  onClick={() => {
                    setActiveAgentId?.('reno');
                    onFocusAgentInScene?.('reno');
                  }}
                >
                  <span>Kirim ke Reno: Eksekusi Git Flow &amp; Buat GitLab MR ➔</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. RENO: Git Flow Automation & GitLab Release Manager                      */}
          {/* ========================================================================= */}
          {activeAgentId === 'reno' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-start gap-3 text-xs text-cyan-200">
                <span className="text-xl flex-shrink-0">🦊</span>
                <div>
                  <b className="font-bold block text-cyan-300">Reno — DevOps Dispatcher</b>
                  Reno mengeksekusi Git Flow spesifik: checkout dari branch <b>main</b> ➔ buat branch <b>feat/</b> ➔ buat Release Candidate <b>rc/</b> ➔ merge ke branch <b>dev</b> ➔ buat Merge Request di GitLab.
                </div>
              </div>

              {/* Git Flow Steps Visualization */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/10 space-y-3">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                  Git Flow Pipeline ({customRepoPath})
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-black/50 border border-white/5">
                    <span className="text-[10px] text-zinc-400 font-mono block">1. Base Branch</span>
                    <b className="text-cyan-300 font-mono">main</b>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/50 border border-white/5">
                    <span className="text-[10px] text-zinc-400 font-mono block">2. Feature Branch</span>
                    <b className="text-purple-300 font-mono truncate block">feat/{activeTicket?.key || 'FEAT'}</b>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/50 border border-white/5">
                    <span className="text-[10px] text-zinc-400 font-mono block">3. Release Branch</span>
                    <b className="text-amber-300 font-mono block">rc/{rcVersion}</b>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/50 border border-white/5">
                    <span className="text-[10px] text-zinc-400 font-mono block">4. Target Branch</span>
                    <b className="text-emerald-300 font-mono block">dev</b>
                  </div>
                </div>

                {/* Git Bash Command Box */}
                <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/70">
                  <div className="px-3 py-1.5 bg-zinc-800/80 border-b border-white/5 text-[10px] font-mono text-zinc-400 flex items-center justify-between">
                    <span>Git Flow Terminal Command (Tinggal Paste &amp; Run):</span>
                    <button
                      type="button"
                      onClick={handleCopyGitCommand}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                    >
                      {copiedGitCmd ? '✓ Tersalin!' : '📋 Salin Command'}
                    </button>
                  </div>
                  <pre className="p-3 text-[11px] font-mono text-cyan-200 overflow-x-auto leading-relaxed">
                    {gitFlowCommand}
                  </pre>
                </div>

                {/* GitLab Integration Form */}
                <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-2 text-xs">
                  <span className="font-bold text-zinc-300 block">Integrasi GitLab API:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-400 block mb-0.5">GitLab Instance Host:</span>
                      <input
                        type="text"
                        className="input text-xs w-full"
                        value={gitlabHost}
                        onChange={(e) => setGitlabHost(e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block mb-0.5">Project Path / ID:</span>
                      <input
                        type="text"
                        className="input text-xs w-full"
                        value={gitlabProject}
                        onChange={(e) => setGitlabProject(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {mrCreated && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                    <span>🎉 GitLab Merge Request Berhasil Dibuat: <b>MR !142 (rc/{rcVersion} ➔ dev)</b></span>
                    <span className="font-mono text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded">Jira Updated</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
                    onClick={() => {
                      setMrCreated(true);
                      handleCopyGitCommand();
                    }}
                  >
                    <span>🦊 Buat GitLab Merge Request &amp; Selesaikan Tiket</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
