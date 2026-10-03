/**
 * Kantor Raffa — 6 karyawan AI + The Boss.
 * desk.rot = 0  → agen duduk menghadap +Z (wajah terlihat kamera)
 * desk.rot = PI → agen duduk menghadap -Z (layar monitor terlihat kamera)
 */
export const AGENTS = [
  {
    id: 'tara',
    name: 'Tara',
    role: 'Product Manager',
    short: 'PM',
    color: '#f59e0b',
    duties: 'Triage tiket Jira & validasi Acceptance Criteria',
    skills: ['Jira Triage', 'INVEST Check', 'Acceptance Criteria', 'Sprint Planning'],
    look: { skin: '#e9b99a', hair: '#3b2416', shirt: '#f59e0b', pants: '#3f3f46', hairStyle: 'long', accessory: null },
    desk: { x: -8, z: -6.5, rot: 0 },
    screens: ['kanban', 'doc'],
  },
  {
    id: 'arga',
    name: 'Arga',
    role: 'Lead Architect',
    short: 'Lead',
    color: '#38bdf8',
    duties: 'Scan file tree, struktur arsitektur & planning',
    skills: ['Codebase Mapping', 'ADR', 'Dependency Graph', 'Task Breakdown'],
    look: { skin: '#c98e6b', hair: '#1c1917', shirt: '#0ea5e9', pants: '#27272a', hairStyle: 'short', accessory: 'glasses' },
    desk: { x: -2.5, z: -6.5, rot: 0 },
    screens: ['tree', 'code'],
  },
  {
    id: 'bimo',
    name: 'Bimo',
    role: 'Senior Frontend Dev',
    short: 'Frontend',
    color: '#8b5cf6',
    duties: 'Slicing Figma, Tailwind/CSS, responsive UI, branch feature',
    skills: ['Figma API', 'Tailwind', 'React/Next', 'Design Tokens'],
    look: { skin: '#d9a383', hair: '#111113', shirt: '#7c3aed', pants: '#1f2937', hairStyle: 'spiky', accessory: 'headphones' },
    desk: { x: 3, z: -6.5, rot: 0 },
    screens: ['figma', 'code'],
  },
  {
    id: 'kian',
    name: 'Kian',
    role: 'Senior Backend Specialist',
    short: 'Backend',
    color: '#10b981',
    duties: 'Schema DB, API endpoint, migration',
    skills: ['PostgreSQL', 'Prisma', 'REST/gRPC', 'Idempotency'],
    look: { skin: '#b97f5a', hair: '#0c0a09', shirt: '#059669', pants: '#292524', hairStyle: 'buzz', accessory: 'beanie' },
    desk: { x: -8, z: 6.5, rot: Math.PI },
    screens: ['sql', 'code'],
  },
  {
    id: 'vani',
    name: 'Vani',
    role: 'QA Sentinel & Guardian',
    short: 'QA',
    color: '#f43f5e',
    duties: 'Linter, Vitest runner, Pixel Diff Comparison',
    skills: ['Vitest', 'Playwright', 'Pixel-Diff', 'Oxlint'],
    look: { skin: '#f0c4a4', hair: '#7c2d12', shirt: '#e11d48', pants: '#3f3f46', hairStyle: 'bun', accessory: 'glasses' },
    desk: { x: -2.5, z: 6.5, rot: Math.PI },
    screens: ['diff', 'tests'],
  },
  {
    id: 'reno',
    name: 'Reno',
    role: 'DevOps Dispatcher',
    short: 'DevOps',
    color: '#22d3ee',
    duties: 'Git push, GitLab MR generator, Jira status updater',
    skills: ['GitLab CI', 'Git Flow', 'Jira API', 'Release Notes'],
    look: { skin: '#cf9b78', hair: '#292524', shirt: '#0891b2', pants: '#18181b', hairStyle: 'curly', accessory: 'headset' },
    desk: { x: 3, z: 6.5, rot: Math.PI },
    screens: ['pipeline', 'code'],
  },
];

export const BOSS = {
  id: 'raffa',
  name: 'Raffa',
  role: 'The Boss',
  color: '#10b981',
  look: { skin: '#d6a07c', hair: '#0a0a0a', shirt: '#18181b', pants: '#27272a', hairStyle: 'short', accessory: 'crown', accent: '#10b981' },
  spawn: { x: -2.5, z: 2.6 },
};

export const AGENT_MAP = Object.fromEntries(AGENTS.map((a) => [a.id, a]));

export const STATUS_LABEL = {
  idle: 'Idle',
  thinking: 'Thinking',
  working: 'Working',
  review: 'Reviewing',
  blocked: 'Rejected',
  done: 'Done',
};
