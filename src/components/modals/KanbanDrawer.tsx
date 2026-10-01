import React from 'react';
import { useAgentStore } from '../../store/useAgentStore';
import { TASK_PRESETS } from '../../data/taskPresets';
import {
  CheckCircle2,
  Clock,
  FileCode,
  FolderKanban,
  Play,
  X,
} from 'lucide-react';

export const KanbanDrawer: React.FC = () => {
  const activeDrawer = useAgentStore((state) => state.activeDrawer);
  const setActiveDrawer = useAgentStore((state) => state.setActiveDrawer);
  const activeTask = useAgentStore((state) => state.activeTask);
  const taskHistory = useAgentStore((state) => state.taskHistory);
  const dispatchPreset = useAgentStore((state) => state.dispatchPreset);
  const agentStatus = useAgentStore((state) => state.agentStatus);

  if (activeDrawer !== 'KANBAN') return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-4xl flex-col border-l border-slate-800 bg-slate-950/95 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-950/40 text-amber-400">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-mono font-bold text-white tracking-wide">
              WORKFLOW KANBAN BOARD
            </h2>
            <div className="text-[11px] font-mono text-slate-400">
              Synchronized with 3D Whiteboard Canvas
            </div>
          </div>
        </div>

        <button
          onClick={() => setActiveDrawer('NONE')}
          className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Kanban Board 3-Column Layout */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          {/* Column 1: Backlog Presets */}
          <div className="flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                  BACKLOG QUEUE
                </h3>
              </div>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                {TASK_PRESETS.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {TASK_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="rounded-xl border border-slate-800/80 bg-slate-900/80 p-3.5 hover:border-cyan-500/40 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                      {preset.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      ~{preset.estimatedDurationSeconds}s
                    </span>
                  </div>

                  <h4 className="mt-2 text-xs font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
                    {preset.title}
                  </h4>

                  <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                    {preset.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] font-mono text-slate-500">
                      Priority: {preset.priority}
                    </span>

                    <button
                      disabled={agentStatus === 'PROCESSING'}
                      onClick={() => {
                        dispatchPreset(preset.id);
                        setActiveDrawer('NONE');
                      }}
                      className="flex items-center gap-1 rounded-lg bg-cyan-500/20 px-2.5 py-1 text-[11px] font-mono font-semibold text-cyan-300 hover:bg-cyan-500/30 transition-colors disabled:opacity-40"
                    >
                      <Play className="h-3 w-3" />
                      <span>Dispatch</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: In Processing */}
          <div className="flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
                <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                  ACTIVE EXECUTION
                </h3>
              </div>
              <span className="rounded bg-amber-950 px-2 py-0.5 text-[10px] font-mono text-amber-400">
                {agentStatus === 'PROCESSING' ? '1' : '0'}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {agentStatus === 'PROCESSING' && activeTask ? (
                <div className="rounded-xl border border-amber-500/40 bg-slate-900/90 p-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                      {activeTask.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {activeTask.progress}%
                    </span>
                  </div>

                  <h4 className="mt-2 text-sm font-semibold text-white">
                    {activeTask.title}
                  </h4>

                  {/* Progress Bar */}
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
                      style={{ width: `${activeTask.progress}%` }}
                    />
                  </div>

                  <div className="mt-2 text-[11px] font-mono text-slate-300">
                    Current: {activeTask.currentStep}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">
                      Agent: 3D Robot Workstation
                    </span>
                    <button
                      onClick={() => setActiveDrawer('TERMINAL')}
                      className="text-[11px] font-mono text-cyan-400 hover:underline"
                    >
                      View Logs &rarr;
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 p-4 text-center">
                  <Clock className="h-8 w-8 text-slate-600 mb-2" />
                  <p className="text-xs font-mono text-slate-500">
                    No active task currently running.
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Select a preset or enter a prompt in the dock below.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Shipped / Completed */}
          <div className="flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                  SHIPPED ARTIFACTS
                </h3>
              </div>
              <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                {taskHistory.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {taskHistory.length > 0 ? (
                taskHistory.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-emerald-500/20 bg-slate-900/80 p-3.5 hover:border-emerald-500/40 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                        {task.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(task.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <h4 className="mt-2 text-xs font-semibold text-slate-100">
                      {task.title}
                    </h4>

                    {task.artifact && (
                      <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-800/60">
                        <span className="text-[10px] font-mono text-slate-400">
                          {task.artifact.fileName}
                        </span>

                        <button
                          onClick={() => setActiveDrawer('ARTIFACT')}
                          className="flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-400 hover:text-emerald-300"
                        >
                          <FileCode className="h-3 w-3" />
                          <span>Inspect</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 p-4 text-center">
                  <CheckCircle2 className="h-8 w-8 text-slate-600 mb-2" />
                  <p className="text-xs font-mono text-slate-500">
                    No tasks completed yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
