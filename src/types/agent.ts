export type AgentStatus = 'IDLE' | 'PROCESSING' | 'COMPLETED' | 'ERROR';

export type TaskCategory = 'DATABASE' | 'API' | 'FRONTEND' | 'TESTING' | 'DEVOPS' | 'CUSTOM';

export type CameraPreset = 'ISOMETRIC' | 'DESK' | 'SERVER' | 'TOP';

export interface TaskArtifact {
  title: string;
  summary: string;
  code: string;
  language: string;
  fileName: string;
  stats: {
    lines: number;
    coverage?: string;
    bundleSize?: string;
    securityScore?: string;
    durationSeconds: number;
  };
}

export interface TaskLogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'EXEC' | 'STEP';
  message: string;
}

export interface DeveloperTask {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  targetStack: string[];
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  status: AgentStatus;
  progress: number; // 0 to 100
  currentStep: string;
  steps: string[];
  logs: TaskLogEntry[];
  artifact?: TaskArtifact;
  createdAt: number;
  completedAt?: number;
}

export interface AudioSettings {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  volume: number; // 0.0 to 1.0
  isPlaying: boolean;
  mode: 'LOFI' | 'SYNTHWAVE';
  isMuffled: boolean;
}

export interface SystemTelemetry {
  cpuUsage: number;
  memoryUsage: number;
  tokensPerSec: number;
  neuralSync: number;
  activeModel: string;
}
