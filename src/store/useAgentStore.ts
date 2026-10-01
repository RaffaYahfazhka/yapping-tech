import { create } from 'zustand';
import confetti from 'canvas-confetti';
import type { AgentStatus, CameraPreset, DeveloperTask, SystemTelemetry, TaskArtifact, TaskLogEntry } from '../types/agent';
import { TASK_PRESETS, type TaskPresetTemplate } from '../data/taskPresets';
import type { JiraConfig, JiraStatus, JiraTicket } from '../types/jira';
import { INITIAL_JIRA_TICKETS, JIRA_USERS } from '../data/jiraTickets';
import { soundEngine } from '../services/audioEngine';

interface AgentStoreState {
  agentStatus: AgentStatus;
  robotEmotion: 'IDLE' | 'WORKING' | 'HAPPY' | 'WAVING' | 'ALERT';
  activeTask: DeveloperTask | null;
  taskHistory: DeveloperTask[];
  terminalLogs: TaskLogEntry[];
  activeArtifact: TaskArtifact | null;
  
  // Jira State
  jiraTickets: JiraTicket[];
  jiraConfig: JiraConfig;
  selectedTicket: JiraTicket | null;

  // UI & View State
  activeDrawer: 'NONE' | 'TERMINAL' | 'ARTIFACT' | 'HISTORY' | 'KANBAN' | 'JIRA';
  isCommandPaletteOpen: boolean;
  cameraPreset: CameraPreset;

  // Telemetry & 3D Texture Feed
  telemetry: SystemTelemetry;
  monitorLogStream: string[];
  typingAnimationTick: number;

  // Audio State
  audioSettings: {
    bgmEnabled: boolean;
    sfxEnabled: boolean;
    volume: number;
    isPlaying: boolean;
    mode: 'LOFI' | 'SYNTHWAVE';
    isUnlocked: boolean;
  };

  executionIntervalId: number | null;

  // Actions
  dispatchPreset: (presetId: string) => void;
  dispatchCustomPrompt: (promptText: string) => void;
  executeTaskPipeline: (preset: TaskPresetTemplate, onDone?: () => void) => void;
  executeCustomTask: (customPrompt: string) => void;
  finishTaskSuccess: (artifact: TaskArtifact) => void;
  abortTask: () => void;
  setCameraPreset: (preset: CameraPreset) => void;
  setActiveDrawer: (drawer: 'NONE' | 'TERMINAL' | 'ARTIFACT' | 'HISTORY' | 'KANBAN' | 'JIRA') => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setRobotEmotion: (emotion: 'IDLE' | 'WORKING' | 'HAPPY' | 'WAVING' | 'ALERT') => void;
  triggerRobotInteraction: () => void;
  
  // Jira Actions
  executeJiraTicket: (ticketId: string) => void;
  updateJiraTicketStatus: (ticketId: string, status: JiraStatus) => void;
  createJiraTicket: (ticket: Omit<JiraTicket, 'id' | 'key' | 'createdAt' | 'updatedAt' | 'comments'>) => void;
  setSelectedTicket: (ticket: JiraTicket | null) => void;
  syncJira: () => Promise<void>;

  // Audio Actions
  initAudio: () => Promise<void>;
  toggleBGM: () => void;
  toggleMute: () => void;
  setVolume: (vol: number) => void;
  setBgmMode: (mode: 'LOFI' | 'SYNTHWAVE') => void;
  toggleSfx: () => void;
  
  // Telemetry updates
  updateTelemetryModel: (modelName: string) => void;
  clearTerminalLogs: () => void;
}

const INITIAL_LOGS: TaskLogEntry[] = [
  {
    id: 'log-0',
    timestamp: '00:00:01',
    level: 'INFO',
    message: 'Cyber-Operator v2.5 Online. Neural link synced. Jira Sprint 34 connected.',
  },
  {
    id: 'log-1',
    timestamp: '00:00:02',
    level: 'SUCCESS',
    message: 'Jira workspace synchronized: 6 tickets loaded. Autonomous delegation engine standing by.',
  },
];

export const useAgentStore = create<AgentStoreState>((set, get) => ({
  agentStatus: 'IDLE',
  robotEmotion: 'IDLE',
  activeTask: null,
  taskHistory: [],
  terminalLogs: INITIAL_LOGS,
  activeArtifact: TASK_PRESETS[0].artifact,
  
  jiraTickets: INITIAL_JIRA_TICKETS,
  jiraConfig: {
    domain: 'huni-technologies.atlassian.net',
    projectKey: 'TECH',
    isConnected: true,
    isSyncing: false,
    activeSprint: 'Sprint 34 // Core Hardening',
  },
  selectedTicket: INITIAL_JIRA_TICKETS[0],

  activeDrawer: 'NONE',
  isCommandPaletteOpen: false,
  cameraPreset: 'ISOMETRIC',

  telemetry: {
    cpuUsage: 14,
    memoryUsage: 32,
    tokensPerSec: 0,
    neuralSync: 98.8,
    activeModel: 'DeepSeek Coder V2 (MoE 236B)',
  },
  monitorLogStream: [
    'JIRA SPRINT 34 SYNCED',
    'AWAITING DISPATCH',
    'ISOMETRIC RENDER: 60 FPS',
  ],
  typingAnimationTick: 0,

  audioSettings: {
    bgmEnabled: true,
    sfxEnabled: true,
    volume: 0.6,
    isPlaying: false,
    mode: 'LOFI',
    isUnlocked: false,
  },

  executionIntervalId: null,

  initAudio: async () => {
    const unlocked = await soundEngine.unlockAudio();
    set((state) => ({
      audioSettings: {
        ...state.audioSettings,
        isUnlocked: unlocked,
      },
    }));
  },

  toggleBGM: () => {
    const playing = soundEngine.toggleBGM();
    set((state) => ({
      audioSettings: {
        ...state.audioSettings,
        isPlaying: playing,
      },
    }));
  },

  toggleMute: () => {
    const currentMute = soundEngine.getState().isMuted;
    soundEngine.setMute(!currentMute);
    set((state) => ({
      audioSettings: {
        ...state.audioSettings,
        volume: !currentMute ? 0 : 0.6,
      },
    }));
  },

  setVolume: (vol: number) => {
    soundEngine.setVolume(vol);
    set((state) => ({
      audioSettings: {
        ...state.audioSettings,
        volume: vol,
      },
    }));
  },

  setBgmMode: (mode: 'LOFI' | 'SYNTHWAVE') => {
    soundEngine.setBgmMode(mode);
    set((state) => ({
      audioSettings: {
        ...state.audioSettings,
        mode,
      },
    }));
  },

  toggleSfx: () => {
    const current = get().audioSettings.sfxEnabled;
    soundEngine.setSfxEnabled(!current);
    set((state) => ({
      audioSettings: {
        ...state.audioSettings,
        sfxEnabled: !current,
      },
    }));
  },

  setCameraPreset: (preset: CameraPreset) => {
    soundEngine.playClick();
    set({ cameraPreset: preset });
  },

  setActiveDrawer: (drawer) => {
    soundEngine.playClick();
    soundEngine.setMuffled(drawer !== 'NONE');
    set({ activeDrawer: drawer });
  },

  setCommandPaletteOpen: (open) => {
    soundEngine.playClick();
    soundEngine.setMuffled(open || get().activeDrawer !== 'NONE');
    set({ isCommandPaletteOpen: open });
  },

  setRobotEmotion: (emotion) => {
    set({ robotEmotion: emotion });
  },

  triggerRobotInteraction: () => {
    soundEngine.playClick();
    set({ robotEmotion: 'WAVING' });
    setTimeout(() => {
      set({ robotEmotion: get().agentStatus === 'PROCESSING' ? 'WORKING' : 'IDLE' });
    }, 2800);
  },

  setSelectedTicket: (ticket) => {
    set({ selectedTicket: ticket });
  },

  updateJiraTicketStatus: (ticketId: string, status: JiraStatus) => {
    soundEngine.playClick();
    set((state) => ({
      jiraTickets: state.jiraTickets.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status,
              updatedAt: new Date().toLocaleTimeString(),
            }
          : t
      ),
    }));
  },

  createJiraTicket: (ticketData) => {
    soundEngine.playDispatch();
    const newId = `TECH-${200 + get().jiraTickets.length + 10}`;
    const newTicket: JiraTicket = {
      ...ticketData,
      id: newId,
      key: newId,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      comments: [],
    };

    set((state) => ({
      jiraTickets: [newTicket, ...state.jiraTickets],
      selectedTicket: newTicket,
    }));
  },

  syncJira: async () => {
    soundEngine.playClick();
    set((state) => ({
      jiraConfig: { ...state.jiraConfig, isSyncing: true },
    }));

    await new Promise((resolve) => setTimeout(resolve, 1400));
    soundEngine.playSuccessChime();

    set((state) => ({
      jiraConfig: {
        ...state.jiraConfig,
        isSyncing: false,
        lastSyncedAt: Date.now(),
      },
      terminalLogs: [
        ...state.terminalLogs,
        {
          id: `log-${Date.now()}-sync`,
          timestamp: new Date().toLocaleTimeString(),
          level: 'SUCCESS',
          message: `Jira Board synced with ${state.jiraConfig.domain} // Sprint 34 active.`,
        },
      ],
    }));
  },

  // Jira Ticket AI Execution Engine
  executeJiraTicket: (ticketId: string) => {
    const ticket = get().jiraTickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    // Move to IN_PROGRESS and assign to AI Agent
    set((state) => ({
      jiraTickets: state.jiraTickets.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'IN_PROGRESS',
              assignee: JIRA_USERS.aiAgent,
              updatedAt: new Date().toLocaleTimeString(),
            }
          : t
      ),
    }));

    // Synthesize task preset from Jira Ticket
    const jiraPreset: TaskPresetTemplate = {
      id: `jira-task-${ticket.id}`,
      title: `[${ticket.key}] ${ticket.title}`,
      category: ticket.issueType === 'Bug' ? 'TESTING' : ticket.labels.includes('database') ? 'DATABASE' : ticket.labels.includes('frontend') ? 'FRONTEND' : 'API',
      description: ticket.description,
      targetStack: ticket.labels,
      priority: ticket.priority === 'Highest' ? 'CRITICAL' : ticket.priority === 'High' ? 'HIGH' : 'NORMAL',
      estimatedDurationSeconds: Math.max(6, Math.min(10, ticket.storyPoints * 1.5)),
      steps: [
        `Ingesting Jira ACs for ${ticket.key} & checking out branch ${ticket.branchName}`,
        'Synthesizing implementation code & type validation',
        'Running Vitest assertions & automated security checks',
        `Generating Pull Request & transitioning Jira ticket to DONE`,
      ],
      mockLogs: [
        { stepIndex: 0, level: 'STEP', text: `JIRA WEBHOOK: Received ${ticket.key} (${ticket.storyPoints} pts)` },
        { stepIndex: 0, level: 'INFO', text: `git checkout -b ${ticket.branchName}` },
        { stepIndex: 1, level: 'EXEC', text: `Implementing Acceptance Criteria (0/${ticket.acceptanceCriteria.length} satisfied)` },
        { stepIndex: 1, level: 'INFO', text: `Generating code and validating strict TypeScript contracts...` },
        { stepIndex: 2, level: 'EXEC', text: `RUN vitest --run --coverage (All test suites passed)` },
        { stepIndex: 3, level: 'SUCCESS', text: `All ${ticket.acceptanceCriteria.length} Acceptance Criteria verified. PR created.` },
      ],
      artifact: {
        title: `Resolution for ${ticket.key}: ${ticket.title}`,
        summary: `Automated implementation satisfying all ${ticket.acceptanceCriteria.length} acceptance criteria for Jira ticket ${ticket.key}.`,
        fileName: `${ticket.key.toLowerCase()}-resolution.ts`,
        language: 'typescript',
        stats: {
          lines: 84 + ticket.storyPoints * 12,
          coverage: '98.5%',
          securityScore: '100% Passed (OWASP Compliance)',
          durationSeconds: Math.max(6, Math.min(10, ticket.storyPoints * 1.5)),
        },
        code: `// ====================================================================
// JIRA TICKET: ${ticket.key} - ${ticket.title}
// ASSIGNEE: ${JIRA_USERS.aiAgent.name}
// SPRINT: ${ticket.sprint}
// BRANCH: ${ticket.branchName}
// ====================================================================

import crypto from 'node:crypto';

/**
 * Acceptance Criteria Implementation:
${ticket.acceptanceCriteria.map((ac, i) => ` * [x] ${i + 1}. ${ac}`).join('\n')}
 */

export interface TicketResolutionContext {
  ticketKey: string;
  timestamp: string;
  executor: string;
  branch: string;
}

export async function executeJiraResolution(ctx: TicketResolutionContext) {
  console.log(\`[Cyber-Operator] Executing verified fix for: \${ctx.ticketKey}\`);

  // Constant-time timingSafeEqual validation for cryptographic safety
  const safeCompare = (a: string, b: string): boolean => {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  };

  return {
    status: 'RESOLVED',
    jiraTicket: ctx.ticketKey,
    branch: ctx.branch,
    timestamp: new Date().toISOString(),
    testsPassed: 48,
    coverage: '98.5%',
  };
}`,
      },
    };

    get().executeTaskPipeline(jiraPreset, () => {
      // Upon completion: Mark Jira ticket as DONE, attach PR & comment
      set((state) => ({
        jiraTickets: state.jiraTickets.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                status: 'DONE',
                updatedAt: new Date().toLocaleTimeString(),
                resolutionSummary: `Resolved automatically by AI Agent. All ${t.acceptanceCriteria.length} ACs fulfilled with full test pass.`,
                pullRequest: {
                  branch: t.branchName,
                  commits: 2,
                  filesChanged: 3,
                  checksPassed: true,
                  prUrl: `https://github.com/huni-enterprise/core-repo/pull/${Math.floor(100 + Math.random() * 900)}`,
                },
                comments: [
                  ...t.comments,
                  {
                    id: `c-${Date.now()}`,
                    author: JIRA_USERS.aiAgent,
                    timestamp: new Date().toLocaleTimeString(),
                    content: `Ticket ${t.key} resolved automatically by Cyber-Operator 3D AI Agent. Pull Request submitted with 100% test coverage.`,
                  },
                ],
              }
            : t
        ),
      }));
    });
  },

  updateTelemetryModel: (modelName: string) => {
    set((state) => ({
      telemetry: {
        ...state.telemetry,
        activeModel: modelName,
      },
    }));
  },

  clearTerminalLogs: () => {
    set({ terminalLogs: [] });
  },

  dispatchPreset: (presetId: string) => {
    const preset = TASK_PRESETS.find((p) => p.id === presetId) || TASK_PRESETS[0];
    get().executeTaskPipeline(preset);
  },

  dispatchCustomPrompt: (promptText: string) => {
    const cleanPrompt = promptText.trim();
    if (!cleanPrompt) return;

    if (cleanPrompt.startsWith('/')) {
      const [cmd, ...args] = cleanPrompt.split(' ');
      if (cmd === '/clear') {
        get().clearTerminalLogs();
        return;
      }
      if (cmd === '/abort') {
        get().abortTask();
        return;
      }
      if (cmd === '/jira') {
        get().setActiveDrawer('JIRA');
        return;
      }
      if (cmd === '/status') {
        const time = new Date().toLocaleTimeString();
        set((state) => ({
          terminalLogs: [
            ...state.terminalLogs,
            {
              id: `log-${Date.now()}`,
              timestamp: time,
              level: 'INFO',
              message: `STATUS: Agent=${state.agentStatus} | CPU=${state.telemetry.cpuUsage}% | ActiveTask=${state.activeTask?.title || 'None'}`,
            },
          ],
        }));
        return;
      }
      if (cmd === '/preset') {
        const idx = parseInt(args[0] || '1', 10) - 1;
        const validPreset = TASK_PRESETS[idx] || TASK_PRESETS[0];
        get().executeTaskPipeline(validPreset);
        return;
      }
      if (cmd === '/dispatch') {
        const customTitle = args.join(' ') || 'Custom Task Request';
        get().executeCustomTask(customTitle);
        return;
      }
    }

    get().executeCustomTask(cleanPrompt);
  },

  abortTask: () => {
    const { executionIntervalId, activeTask, taskHistory } = get();
    if (executionIntervalId) {
      window.clearInterval(executionIntervalId);
    }
    soundEngine.playErrorBeep();

    const timestamp = new Date().toLocaleTimeString();
    const abortLog: TaskLogEntry = {
      id: `log-${Date.now()}`,
      timestamp,
      level: 'WARN',
      message: 'ABORT SIGNAL RECEIVED: Task execution cancelled by operator.',
    };

    set({
      agentStatus: 'ERROR',
      robotEmotion: 'ALERT',
      executionIntervalId: null,
      terminalLogs: [...get().terminalLogs, abortLog],
      monitorLogStream: ['TASK ABORTED', 'OPERATOR OVERRIDE', 'AGENT STANDBY'],
      activeTask: activeTask ? { ...activeTask, status: 'ERROR', progress: 0 } : null,
      taskHistory: activeTask ? [{ ...activeTask, status: 'ERROR', completedAt: Date.now() }, ...taskHistory] : taskHistory,
      telemetry: {
        ...get().telemetry,
        cpuUsage: 18,
        memoryUsage: 35,
        tokensPerSec: 0,
      },
    });

    window.setTimeout(() => {
      if (get().agentStatus === 'ERROR') {
        set({ agentStatus: 'IDLE', robotEmotion: 'IDLE' });
      }
    }, 2500);
  },

  executeTaskPipeline: (preset: TaskPresetTemplate, onDone?: () => void) => {
    const { executionIntervalId } = get();
    if (executionIntervalId) {
      window.clearInterval(executionIntervalId);
    }

    soundEngine.playDispatch();

    const task: DeveloperTask = {
      id: `task-${Date.now()}`,
      title: preset.title,
      description: preset.description,
      category: preset.category,
      targetStack: preset.targetStack,
      priority: preset.priority,
      status: 'PROCESSING',
      progress: 0,
      currentStep: preset.steps[0] || 'Ingesting Task Context...',
      steps: preset.steps,
      logs: [],
      artifact: preset.artifact,
      createdAt: Date.now(),
    };

    const initialDispatchLog: TaskLogEntry = {
      id: `log-${Date.now()}-dispatch`,
      timestamp: new Date().toLocaleTimeString(),
      level: 'STEP',
      message: `DISPATCHED: ${preset.title} [${preset.category}]`,
    };

    set({
      agentStatus: 'PROCESSING',
      robotEmotion: 'WORKING',
      activeTask: task,
      terminalLogs: [...get().terminalLogs, initialDispatchLog],
      monitorLogStream: [
        `> EXEC: ${preset.category}`,
        'ANALYZING AST GRAPH',
        'COMPILING...',
      ],
      telemetry: {
        ...get().telemetry,
        cpuUsage: 78 + Math.floor(Math.random() * 15),
        memoryUsage: 64 + Math.floor(Math.random() * 12),
        tokensPerSec: 135 + Math.floor(Math.random() * 45),
      },
    });

    const totalDurationMs = preset.estimatedDurationSeconds * 1000;
    const intervalTickMs = 200;
    let elapsedMs = 0;
    let logCounter = 0;

    const intervalId = window.setInterval(() => {
      elapsedMs += intervalTickMs;
      const progress = Math.min(100, Math.floor((elapsedMs / totalDurationMs) * 100));
      const stepIndex = Math.min(
        preset.steps.length - 1,
        Math.floor((progress / 100) * preset.steps.length)
      );

      if (Math.random() > 0.4) {
        soundEngine.playTypingKey();
      }

      const newLogs = [...get().terminalLogs];
      let monitorStream = [...get().monitorLogStream];
      if (logCounter < preset.mockLogs.length) {
        const nextMock = preset.mockLogs[logCounter];
        if (progress >= ((nextMock.stepIndex + 0.3) / preset.steps.length) * 100) {
          const timestamp = new Date().toLocaleTimeString();
          newLogs.push({
            id: `log-${Date.now()}-${logCounter}`,
            timestamp,
            level: nextMock.level,
            message: nextMock.text,
          });
          monitorStream = [
            `> ${nextMock.text.slice(0, 32)}...`,
            `PROGRESS: ${progress}%`,
            `STEP ${stepIndex + 1}/${preset.steps.length}`,
          ];
          logCounter++;
        }
      }

      set((state) => ({
        typingAnimationTick: state.typingAnimationTick + 1,
        terminalLogs: newLogs,
        monitorLogStream: monitorStream,
        activeTask: state.activeTask
          ? {
              ...state.activeTask,
              progress,
              currentStep: preset.steps[stepIndex],
            }
          : null,
      }));

      if (progress >= 100) {
        window.clearInterval(intervalId);
        get().finishTaskSuccess(preset.artifact);
        if (onDone) onDone();
      }
    }, intervalTickMs);

    set({ executionIntervalId: intervalId });
  },

  executeCustomTask: (customPrompt: string) => {
    const customPreset: TaskPresetTemplate = {
      id: `custom-${Date.now()}`,
      title: customPrompt,
      category: 'CUSTOM',
      description: `User-specified developer task prompt: "${customPrompt}"`,
      targetStack: ['TypeScript', 'Node.js', 'React', 'Tailwind', 'Docker'],
      priority: 'HIGH',
      estimatedDurationSeconds: 7,
      steps: [
        'Analyzing custom instruction AST & dependencies',
        'Generating modular implementation code',
        'Running type-check & automated assertion validation',
        'Packaging production artifact and diff summary',
      ],
      mockLogs: [
        { stepIndex: 0, level: 'STEP', text: `Ingesting prompt: "${customPrompt.slice(0, 48)}..."` },
        { stepIndex: 1, level: 'EXEC', text: 'Generating AST nodes & synthesizing interface definitions' },
        { stepIndex: 2, level: 'EXEC', text: 'Running tsc --noEmit && oxlint -c ./oxlint.json' },
        { stepIndex: 3, level: 'SUCCESS', text: 'Custom agent task synthesized with 0 lint errors.' },
      ],
      artifact: {
        title: `Solution: ${customPrompt}`,
        summary: `Production-ready implementation for prompt: "${customPrompt}"`,
        fileName: 'custom-implementation.ts',
        language: 'typescript',
        stats: {
          lines: 64,
          coverage: '96.2%',
          securityScore: 'A (Hardened)',
          durationSeconds: 7,
        },
        code: `// ====================================================================
// TASK: ${customPrompt}
// GENERATED BY: Cyber-Operator 3D AI Assistant
// TIMESTAMP: ${new Date().toISOString()}
// ====================================================================

export interface TaskContext {
  prompt: string;
  timestamp: number;
  environment: 'production' | 'staging';
}

export async function executeOperation(context: TaskContext): Promise<{ success: boolean; data: unknown }> {
  const startTime = performance.now();
  console.log(\`[Cyber-Operator] Executing: \${context.prompt}\`);

  try {
    if (!context.prompt) {
      throw new Error('Invalid prompt context provided');
    }

    const result = {
      status: 'COMPLETED',
      executionTimeMs: performance.now() - startTime,
      checksum: crypto.randomUUID(),
      output: 'Task execution completed successfully with full type-safety.',
    };

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('[Cyber-Operator] Execution failed:', error);
    throw error;
  }
}`,
      },
    };

    get().executeTaskPipeline(customPreset);
  },

  finishTaskSuccess: (artifact: TaskArtifact) => {
    soundEngine.playSuccessChime();

    try {
      confetti({
        particleCount: 95,
        spread: 80,
        origin: { y: 0.65 },
        colors: ['#06b6d4', '#ec4899', '#10b981', '#38bdf8', '#a855f7'],
      });
    } catch {
      // safe fallback
    }

    const completedTimestamp = new Date().toLocaleTimeString();
    const finalLog: TaskLogEntry = {
      id: `log-${Date.now()}-done`,
      timestamp: completedTimestamp,
      level: 'SUCCESS',
      message: `TASK COMPLETED // Artifact "${artifact.fileName}" (${artifact.stats.lines} lines) ready for inspection.`,
    };

    const currentTask = get().activeTask;
    const finishedTask: DeveloperTask | null = currentTask
      ? {
          ...currentTask,
          status: 'COMPLETED',
          progress: 100,
          currentStep: 'Execution Completed. Artifact Ready.',
          completedAt: Date.now(),
        }
      : null;

    set((state) => ({
      agentStatus: 'COMPLETED',
      robotEmotion: 'HAPPY',
      executionIntervalId: null,
      activeArtifact: artifact,
      terminalLogs: [...state.terminalLogs, finalLog],
      monitorLogStream: [
        'TASK DELIVERED 100%',
        'ALL TESTS PASSED',
        'JIRA STATUS: DONE',
      ],
      activeTask: finishedTask,
      taskHistory: finishedTask ? [finishedTask, ...state.taskHistory] : state.taskHistory,
      telemetry: {
        ...state.telemetry,
        cpuUsage: 22,
        memoryUsage: 38,
        tokensPerSec: 0,
      },
    }));

    window.setTimeout(() => {
      if (get().agentStatus === 'COMPLETED') {
        set({
          agentStatus: 'IDLE',
          robotEmotion: 'IDLE',
          monitorLogStream: [
            'IDLE // AWAITING DISPATCH',
            'SYSTEM TELEMETRY NOMINAL',
            'WORKSTATION 60 FPS',
          ],
        });
      }
    }, 4500);
  },
}));
