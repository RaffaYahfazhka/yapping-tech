export type JiraIssueType = 'Bug' | 'Story' | 'Task' | 'Epic';
export type JiraPriority = 'Highest' | 'High' | 'Medium' | 'Low';
export type JiraStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export interface JiraUser {
  id: string;
  name: string;
  avatar: string;
  role: string;
  isAiAgent?: boolean;
}

export interface JiraComment {
  id: string;
  author: JiraUser;
  timestamp: string;
  content: string;
}

export interface JiraTicket {
  id: string; // e.g. "TECH-101"
  key: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  issueType: JiraIssueType;
  priority: JiraPriority;
  status: JiraStatus;
  storyPoints: number;
  assignee: JiraUser;
  reporter: JiraUser;
  sprint: string;
  labels: string[];
  branchName: string;
  createdAt: string;
  updatedAt: string;
  resolutionSummary?: string;
  pullRequest?: {
    branch: string;
    commits: number;
    filesChanged: number;
    checksPassed: boolean;
    prUrl: string;
  };
  comments: JiraComment[];
}

export interface JiraConfig {
  domain: string;
  projectKey: string;
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt?: number;
  activeSprint: string;
}
