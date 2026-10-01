import { create } from 'zustand';
import confetti from 'canvas-confetti';
import type { AgentStatus, CameraPreset, DeveloperTask, SystemTelemetry, TaskArtifact, TaskLogEntry } from '../types/agent';
import { TASK_PRESETS, type TaskPresetTemplate } from '../data/taskPresets';
import { soundEngine } from '../services/audioEngine';

interface AgentStoreState {
  agentStatus: AgentStatus;
  activeTask: DeveloperTask | null;
  taskHistory: DeveloperTask[];
  terminalLogs: TaskLogEntry[];
  activeArtifact: TaskArtifact | null;
  
  // UI & View State
  activeDrawer: 'NONE' | 'TERMINAL' | 'ARTIFACT' | 'HISTORY' | 'KANBAN';
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

  // Execution Timer reference
  executionIntervalId: number | null;

  // Actions
  dispatchPreset: (presetId: string) => void;
  dispatchCustomPrompt: (promptText: string) => void;
  executeTaskPipeline: (preset: TaskPresetTemplate) => void;
  executeCustomTask: (customPrompt: string) => void;
  finishTaskSuccess: (artifact: TaskArtifact) => void;
  abortTask: () => void;
  setCameraPreset: (preset: CameraPreset) => void;
  setActiveDrawer: (drawer: 'NONE' | 'TERMINAL' | 'ARTIFACT' | 'HISTORY' | 'KANBAN') => void;
  setCommandPaletteOpen: (open: boolean) => void;
  
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
    message: 'Cyber-Operator v2.4 Online. Neural link synced. Workstation online.',
  },
  {
    id: 'log-1',
    timestamp: '00:00:02',
    level: 'SUCCESS',
    message: 'Cluster node 10.14.0.8 connected. Three.js isometric viewport ready.',
  },
];

export const useAgentStore = create<AgentStoreState>((set, get) => ({
  agentStatus: 'IDLE',
  activeTask: null,
  taskHistory: [],
  terminalLogs: INITIAL_LOGS,
  activeArtifact: TASK_PRESETS[0].artifact, // Preview default artifact
  activeDrawer: 'NONE',
  isCommandPaletteOpen: false,
  cameraPreset: 'ISOMETRIC',

  telemetry: {
    cpuUsage: 14,
    memoryUsage: 32,
    tokensPerSec: 0,
    neuralSync: 98.4,
    activeModel: 'DeepSeek Coder V2 (MoE 236B)',
  },
  monitorLogStream: [
    'SYSTEM READY',
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
    // Muffle audio when viewing full-page drawer overlays
    soundEngine.setMuffled(drawer !== 'NONE');
    set({ activeDrawer: drawer });
  },

  setCommandPaletteOpen: (open) => {
    soundEngine.playClick();
    soundEngine.setMuffled(open || get().activeDrawer !== 'NONE');
    set({ isCommandPaletteOpen: open });
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

    // Check if it's a CLI command
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

    // Freeform prompt
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

    // Reset to IDLE after 2.5 seconds
    window.setTimeout(() => {
      if (get().agentStatus === 'ERROR') {
        set({ agentStatus: 'IDLE' });
      }
    }, 2500);
  },

  // Internal Execution Pipeline
  executeTaskPipeline: (preset: TaskPresetTemplate) => {
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

    // Run execution simulation
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

      // Play typing click intermittently
      if (Math.random() > 0.4) {
        soundEngine.playTypingKey();
      }

      // Check if new mock log should be posted
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

      // Task Completion
      if (progress >= 100) {
        window.clearInterval(intervalId);
        get().finishTaskSuccess(preset.artifact);
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

/**
 * High-performance, memory-efficient implementation for:
 * "${customPrompt}"
 */
export async function executeOperation(context: TaskContext): Promise<{ success: boolean; data: unknown }> {
  const startTime = performance.now();
  console.log(\`[Cyber-Operator] Executing: \${context.prompt}\`);

  try {
    // 1. Validate inputs and concurrency safety
    if (!context.prompt) {
      throw new Error('Invalid prompt context provided');
    }

    // 2. Perform target operation with error boundaries
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

    // Trigger visual celebratory confetti explosion!
    try {
      confetti({
        particleCount: 85,
        spread: 70,
        origin: { y: 0.7 },
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
      executionIntervalId: null,
      activeArtifact: artifact,
      terminalLogs: [...state.terminalLogs, finalLog],
      monitorLogStream: [
        'TASK DELIVERED 100%',
        'ALL TESTS PASSED',
        'ARTIFACT READY',
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

    // Return to IDLE after celebration duration
    window.setTimeout(() => {
      if (get().agentStatus === 'COMPLETED') {
        set({
          agentStatus: 'IDLE',
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
