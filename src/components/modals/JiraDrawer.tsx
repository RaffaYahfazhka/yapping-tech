import React, { useState } from 'react';
import { useAgentStore } from '../../store/useAgentStore';
import type { JiraIssueType, JiraPriority, JiraStatus, JiraTicket } from '../../types/jira';
import { JIRA_USERS } from '../../data/jiraTickets';
import {
  ArrowUp,
  Bookmark,
  Bot,
  CheckCircle2,
  ChevronDown,
  GitBranch,
  GitPullRequest,
  Plus,
  RefreshCw,
  Search,
  X,
  Zap,
} from 'lucide-react';

export const JiraDrawer: React.FC = () => {
  const activeDrawer = useAgentStore((state) => state.activeDrawer);
  const setActiveDrawer = useAgentStore((state) => state.setActiveDrawer);
  const jiraTickets = useAgentStore((state) => state.jiraTickets);
  const jiraConfig = useAgentStore((state) => state.jiraConfig);
  const syncJira = useAgentStore((state) => state.syncJira);
  const executeJiraTicket = useAgentStore((state) => state.executeJiraTicket);
  const updateJiraTicketStatus = useAgentStore((state) => state.updateJiraTicketStatus);
  const createJiraTicket = useAgentStore((state) => state.createJiraTicket);
  const agentStatus = useAgentStore((state) => state.agentStatus);

  const [selectedTicket, setSelectedTicket] = useState<JiraTicket | null>(jiraTickets[0] || null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New ticket form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<JiraIssueType>('Story');
  const [newPriority, setNewPriority] = useState<JiraPriority>('High');
  const [newPoints, setNewPoints] = useState(5);
  const [newAcs, setNewAcs] = useState('Verify end-to-end type safety\nAdd unit test coverage > 90%');

  if (activeDrawer !== 'JIRA') return null;

  const filteredTickets = jiraTickets.filter((t) => {
    const matchesType = filterType === 'ALL' || t.issueType === filterType;
    const matchesSearch =
      searchQuery === '' ||
      t.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const todoTickets = filteredTickets.filter((t) => t.status === 'TODO');
  const inProgressTickets = filteredTickets.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW');
  const doneTickets = filteredTickets.filter((t) => t.status === 'DONE');

  const totalPoints = jiraTickets.reduce((acc, t) => acc + t.storyPoints, 0);
  const completedPoints = jiraTickets
    .filter((t) => t.status === 'DONE')
    .reduce((acc, t) => acc + t.storyPoints, 0);
  const progressPercent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    createJiraTicket({
      title: newTitle,
      description: newDesc || newTitle,
      acceptanceCriteria: newAcs.split('\n').filter((l) => l.trim().length > 0),
      issueType: newType,
      priority: newPriority,
      status: 'TODO',
      storyPoints: newPoints,
      assignee: JIRA_USERS.techLead,
      reporter: JIRA_USERS.techLead,
      sprint: jiraConfig.activeSprint,
      labels: [newType.toLowerCase(), 'backlog'],
      branchName: `feat/${newTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)}`,
    });

    setNewTitle('');
    setNewDesc('');
    setShowCreateModal(false);
  };

  const getPriorityBadge = (p: JiraPriority) => {
    switch (p) {
      case 'Highest':
        return <span className="text-rose-400 flex items-center gap-0.5"><ArrowUp className="h-3 w-3" /> Highest</span>;
      case 'High':
        return <span className="text-amber-400 flex items-center gap-0.5"><ArrowUp className="h-3 w-3" /> High</span>;
      default:
        return <span className="text-cyan-400 flex items-center gap-0.5"><ChevronDown className="h-3 w-3" /> Normal</span>;
    }
  };

  const getTypeBadge = (type: JiraIssueType) => {
    switch (type) {
      case 'Bug':
        return <span className="rounded bg-rose-950/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-rose-400 border border-rose-800/60">BUG</span>;
      case 'Story':
        return <span className="rounded bg-emerald-950/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400 border border-emerald-800/60">STORY</span>;
      case 'Epic':
        return <span className="rounded bg-purple-950/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-purple-400 border border-purple-800/60">EPIC</span>;
      default:
        return <span className="rounded bg-cyan-950/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-cyan-400 border border-cyan-800/60">TASK</span>;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-5xl flex-col border-l border-slate-800 bg-[#070a14]/95 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Jira Top Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/60 to-blue-950 text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Bookmark className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-mono font-bold text-white tracking-wide">
                ATLASSIAN JIRA // SPRINT BOARD
              </h2>
              <span className="rounded-full bg-emerald-950/80 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE SYNC
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
              <span>{jiraConfig.domain}</span>
              <span>•</span>
              <span className="text-cyan-400 font-semibold">{jiraConfig.activeSprint}</span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          {/* Sprint Burnup Progress Pill */}
          <div className="hidden lg:flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5">
            <span className="text-xs font-mono text-slate-400">Sprint:</span>
            <div className="h-2 w-24 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-mono text-xs font-bold text-white">
              {completedPoints}/{totalPoints} pts ({progressPercent}%)
            </span>
          </div>

          <button
            onClick={() => syncJira()}
            disabled={jiraConfig.isSyncing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-white hover:border-cyan-500/40 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-cyan-400 ${jiraConfig.isSyncing ? 'animate-spin' : ''}`} />
            <span>{jiraConfig.isSyncing ? 'Syncing...' : 'Sync Jira'}</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-3 py-1.5 text-xs font-mono font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-500 hover:to-blue-500 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Issue</span>
          </button>

          <button
            onClick={() => setActiveDrawer('NONE')}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Ribbon */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800/60 bg-slate-900/30 px-6 py-2.5">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-500 text-[11px] uppercase mr-1">Filter:</span>
          {['ALL', 'Story', 'Bug', 'Task'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterType === type
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search tickets, ACs, keys..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-1.5 pl-9 pr-3 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 2-Pane Main View: Board Swimlanes + Ticket Detail Drawer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: 3-Column Sprint Swimlanes */}
        <div className="flex-1 overflow-x-auto p-5 border-r border-slate-800/80">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full min-w-[680px]">
            {/* 1. TO DO Column */}
            <div className="flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/30 p-3.5">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  <h3 className="text-xs font-mono font-bold text-slate-300 uppercase">TO DO</h3>
                </div>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                  {todoTickets.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {todoTickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`cursor-pointer rounded-xl border p-3.5 transition-all group ${
                      selectedTicket?.id === t.id
                        ? 'border-cyan-500 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
                        : 'border-slate-800/80 bg-slate-900/70 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeBadge(t.issueType)}
                        <span className="font-mono text-xs font-bold text-cyan-400">{t.key}</span>
                      </div>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                        {t.storyPoints} pts
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-2">
                      {t.title}
                    </h4>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <span className="text-[11px] font-mono">{getPriorityBadge(t.priority)}</span>
                      <button
                        disabled={agentStatus === 'PROCESSING'}
                        onClick={(e) => {
                          e.stopPropagation();
                          executeJiraTicket(t.id);
                        }}
                        className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-2.5 py-1 text-[11px] font-mono font-semibold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-500 hover:to-blue-500 transition-all disabled:opacity-40"
                      >
                        <Zap className="h-3 w-3" />
                        <span>AI Solve</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. IN PROGRESS Column */}
            <div className="flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/30 p-3.5">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                  <h3 className="text-xs font-mono font-bold text-slate-300 uppercase">IN PROGRESS</h3>
                </div>
                <span className="rounded bg-amber-950 px-2 py-0.5 text-[10px] font-mono text-amber-400">
                  {inProgressTickets.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {inProgressTickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`cursor-pointer rounded-xl border p-3.5 transition-all group ${
                      selectedTicket?.id === t.id
                        ? 'border-amber-500 bg-amber-950/20 shadow-lg shadow-amber-500/10'
                        : 'border-slate-800/80 bg-slate-900/70 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeBadge(t.issueType)}
                        <span className="font-mono text-xs font-bold text-amber-400">{t.key}</span>
                      </div>
                      <span className="rounded bg-amber-950/60 px-1.5 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-800/50">
                        {t.storyPoints} pts
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                      {t.title}
                    </h4>

                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                      <Bot className="h-3.5 w-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
                      <span>{t.assignee.name}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] font-mono">
                      <span className="text-amber-400">Pipeline Active</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDrawer('TERMINAL');
                        }}
                        className="text-cyan-400 hover:underline"
                      >
                        Inspect Stream &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. DONE Column */}
            <div className="flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/30 p-3.5">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <h3 className="text-xs font-mono font-bold text-slate-300 uppercase">DONE</h3>
                </div>
                <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                  {doneTickets.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {doneTickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`cursor-pointer rounded-xl border p-3.5 transition-all group ${
                      selectedTicket?.id === t.id
                        ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/10'
                        : 'border-slate-800/80 bg-slate-900/70 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeBadge(t.issueType)}
                        <span className="font-mono text-xs font-bold text-emerald-400">{t.key}</span>
                      </div>
                      <span className="rounded bg-emerald-950/60 px-1.5 py-0.5 text-[10px] font-mono text-emerald-300 border border-emerald-800/50">
                        {t.storyPoints} pts
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-200 line-clamp-2">
                      {t.title}
                    </h4>

                    {t.pullRequest && (
                      <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                        <GitPullRequest className="h-3 w-3" />
                        <span>PR Merged (Checks: 100%)</span>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] font-mono">
                      <span className="text-slate-500">{t.updatedAt}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDrawer('ARTIFACT');
                        }}
                        className="text-emerald-400 hover:underline"
                      >
                        View Code &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Selected Ticket Detailed Inspector */}
        {selectedTicket && (
          <div className="w-96 flex flex-col overflow-y-auto bg-slate-950/60 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {getTypeBadge(selectedTicket.issueType)}
                <span className="font-mono text-sm font-bold text-white">{selectedTicket.key}</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedTicket.status}
                  onChange={(e) => updateJiraTicketStatus(selectedTicket.id, e.target.value as JiraStatus)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="TODO">TO DO</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="DONE">DONE</option>
                </select>
              </div>
            </div>

            {/* Title & Description */}
            <div className="mt-4">
              <h3 className="text-sm font-bold text-white leading-snug">{selectedTicket.title}</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                {selectedTicket.description}
              </p>
            </div>

            {/* Acceptance Criteria Checklist */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold uppercase text-slate-400">
                  Acceptance Criteria ({selectedTicket.acceptanceCriteria.length})
                </span>
              </div>
              <div className="space-y-2">
                {selectedTicket.acceptanceCriteria.map((ac, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 rounded-lg border border-slate-800/60 bg-slate-900/40 p-2.5 text-xs text-slate-300"
                  >
                    <CheckCircle2
                      className={`h-4 w-4 shrink-0 mt-0.5 ${
                        selectedTicket.status === 'DONE' ? 'text-emerald-400' : 'text-slate-600'
                      }`}
                    />
                    <span className="leading-snug">{ac}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Git Branch Details */}
            <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-900/50 p-3 font-mono text-xs">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <GitBranch className="h-3.5 w-3.5 text-cyan-400" />
                <span>Feature Branch:</span>
              </div>
              <div className="rounded bg-slate-950 p-2 text-cyan-300 select-all break-all border border-slate-800">
                git checkout -b {selectedTicket.branchName}
              </div>
            </div>

            {/* Metadata Rows */}
            <div className="mt-4 space-y-2 border-t border-slate-800 pt-3 text-xs font-mono text-slate-400">
              <div className="flex justify-between">
                <span>Assignee:</span>
                <span className="text-white font-medium">{selectedTicket.assignee.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Reporter:</span>
                <span className="text-slate-300">{selectedTicket.reporter.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Story Points:</span>
                <span className="text-amber-400 font-bold">{selectedTicket.storyPoints} pts</span>
              </div>
              <div className="flex justify-between">
                <span>Priority:</span>
                <span>{getPriorityBadge(selectedTicket.priority)}</span>
              </div>
            </div>

            {/* Action Button */}
            {selectedTicket.status !== 'DONE' && (
              <button
                disabled={agentStatus === 'PROCESSING'}
                onClick={() => executeJiraTicket(selectedTicket.id)}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 py-3 text-xs font-mono font-bold text-white shadow-xl shadow-cyan-500/20 hover:from-cyan-500 hover:to-blue-500 transition-all disabled:opacity-50"
              >
                <Zap className="h-4 w-4" />
                <span>Execute Ticket in 3D Office</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Ticket Modal Overlay */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-cyan-400" />
                <h3 className="font-mono text-sm font-bold text-white">Create New Jira Issue</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-400 mb-1 block">Issue Summary / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement Redis distributed locks for payment checkout"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-400 mb-1 block">Issue Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as JiraIssueType)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Story">Story</option>
                    <option value="Bug">Bug</option>
                    <option value="Task">Task</option>
                    <option value="Epic">Epic</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 mb-1 block">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as JiraPriority)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Highest">Highest</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 mb-1 block">Story Points</label>
                  <input
                    type="number"
                    min="1"
                    max="21"
                    value={newPoints}
                    onChange={(e) => setNewPoints(parseInt(e.target.value, 10))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 mb-1 block">
                  Acceptance Criteria (one per line)
                </label>
                <textarea
                  rows={3}
                  value={newAcs}
                  onChange={(e) => setNewAcs(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 text-xs font-mono font-bold text-white hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-500/20"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
