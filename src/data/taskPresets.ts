import type { DeveloperTask, TaskArtifact } from '../types/agent';

export interface TaskPresetTemplate {
  id: string;
  title: string;
  category: DeveloperTask['category'];
  description: string;
  targetStack: string[];
  priority: DeveloperTask['priority'];
  estimatedDurationSeconds: number;
  steps: string[];
  mockLogs: Array<{ stepIndex: number; level: 'INFO' | 'EXEC' | 'WARN' | 'SUCCESS' | 'STEP'; text: string }>;
  artifact: TaskArtifact;
}

export const TASK_PRESETS: TaskPresetTemplate[] = [
  {
    id: 'preset-db-migration',
    title: 'Generate Database Migration & Multi-tenant Schema',
    category: 'DATABASE',
    description: 'PostgreSQL row-level security (RLS), multi-tenant isolation, and automated migration files with rollbacks.',
    targetStack: ['PostgreSQL 16', 'Prisma / Drizzle', 'RLS Policies', 'Docker Compose'],
    priority: 'HIGH',
    estimatedDurationSeconds: 8,
    steps: [
      'Ingesting tenant model & schema constraints',
      'Generating SQL DDL with tenant_id indexes & UUIDv7 PKs',
      'Configuring Postgres Row Level Security (RLS) policies',
      'Compiling migration & rollback scripts',
    ],
    mockLogs: [
      { stepIndex: 0, level: 'STEP', text: 'Analyzing existing schema AST and relational dependency graphs...' },
      { stepIndex: 0, level: 'INFO', text: 'Detected tenancy model: Foreign key tenant_id on organizations table' },
      { stepIndex: 1, level: 'EXEC', text: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' },
      { stepIndex: 1, level: 'INFO', text: 'Generating partitioned indices on (tenant_id, created_at DESC)...' },
      { stepIndex: 2, level: 'EXEC', text: 'ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;' },
      { stepIndex: 2, level: 'INFO', text: 'Binding current_setting(\'app.current_tenant_id\') policy for tenant isolation' },
      { stepIndex: 3, level: 'EXEC', text: 'Applying dry-run validation against transient dockerized postgres:16-alpine...' },
      { stepIndex: 3, level: 'SUCCESS', text: 'Migration 20261001_multi_tenant_rls.sql validated with 0 errors. Rollback test passed.' },
    ],
    artifact: {
      title: 'PostgreSQL Multi-Tenant Schema & RLS Migration',
      summary: 'Complete production-ready multi-tenant schema with Row Level Security, automatic tenant_id indexing, and Drizzle/Prisma schema models.',
      fileName: '20261001_multi_tenant_rls.sql',
      language: 'sql',
      stats: {
        lines: 84,
        securityScore: 'A+ (RLS Enforced)',
        durationSeconds: 8,
      },
      code: `-- ====================================================================
-- MIGRATION: 20261001_multi_tenant_rls.sql
-- DESCRIPTION: Multi-tenant workspace isolation with PostgreSQL Row-Level Security
-- AUTHOR: Cyber-Operator 3D AI Agent
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Organizations / Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    plan_tier VARCHAR(32) DEFAULT 'pro' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Multi-Tenant Workspaces Table
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb,
    is_archived BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Compound Index for High-Performance Tenant Querying
CREATE INDEX IF NOT EXISTS idx_workspaces_tenant_created 
    ON workspaces(tenant_id, created_at DESC);

-- 5. Enable Row-Level Security (RLS)
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces FORCE ROW LEVEL SECURITY;

-- 6. Define Strict Tenant Isolation Policy
DROP POLICY IF EXISTS tenant_isolation_policy ON workspaces;
CREATE POLICY tenant_isolation_policy ON workspaces
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

-- 7. Audit Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- ROLLBACK SCRIPT (UP/DOWN SAFE)
-- ====================================================================
-- DROP TRIGGER IF EXISTS trg_workspaces_updated_at ON workspaces;
-- DROP POLICY IF EXISTS tenant_isolation_policy ON workspaces;
-- DROP TABLE IF EXISTS workspaces;
-- DROP TABLE IF EXISTS tenants;`,
    },
  },
  {
    id: 'preset-api-auth',
    title: 'Scaffold REST/GraphQL Endpoints & Auth Middleware',
    category: 'API',
    description: 'Type-safe Fastify / Express endpoints with JWT bearer verification, RBAC permissions, and Zod validation schemas.',
    targetStack: ['TypeScript', 'Fastify / Express', 'Zod', 'JWT / Jose', 'OpenAPI 3.1'],
    priority: 'HIGH',
    estimatedDurationSeconds: 9,
    steps: [
      'Parsing route specifications and parameters',
      'Generating Zod request/response validation schemas',
      'Implementing JWT verification & RBAC middleware',
      'Mounting CRUD route handlers with typed responses',
    ],
    mockLogs: [
      { stepIndex: 0, level: 'STEP', text: 'Initializing route registry and OpenAPI v3.1 spec generator...' },
      { stepIndex: 1, level: 'INFO', text: 'Compiling Zod validation schema with strict field coersion' },
      { stepIndex: 2, level: 'EXEC', text: 'Verifying JWT HMAC SHA256 / RS256 token signature handling' },
      { stepIndex: 2, level: 'INFO', text: 'Injecting claims [tenant_id, role, permissions] into FastifyRequest context' },
      { stepIndex: 3, level: 'EXEC', text: 'Mounting GET /api/v1/workspaces, POST /api/v1/workspaces' },
      { stepIndex: 3, level: 'SUCCESS', text: 'Endpoint scaffolding generated. Route contracts: 100% Type-safe.' },
    ],
    artifact: {
      title: 'Secure Fastify Endpoints & Auth Middleware',
      summary: 'Production-ready TypeScript REST controllers, Zod contract validation, and JWT RBAC authentication guard.',
      fileName: 'workspaces.router.ts',
      language: 'typescript',
      stats: {
        lines: 96,
        coverage: '98.5%',
        securityScore: 'A (OWASP Compliant)',
        durationSeconds: 9,
      },
      code: `import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { jwtVerify } from 'jose';

// 1. Zod Validation Schemas
export const CreateWorkspaceSchema = z.object({
  name: z.string().min(3).max(128),
  settings: z.record(z.unknown()).optional().default({}),
});

export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;

// 2. Auth Context Types
export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  role: 'owner' | 'admin' | 'member';
}

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthenticatedUser;
  }
}

// 3. JWT & RBAC Auth Middleware
export const authenticate = async (req: FastifyRequest, reply: FastifyReply) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Missing Bearer token' });
  }

  const token = authHeader.substring(7);
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-key-32-chars-minimum!');
    const { payload } = await jwtVerify(token, secret);
    
    req.user = {
      userId: payload.sub as string,
      tenantId: payload.tenant_id as string,
      role: payload.role as AuthenticatedUser['role'],
    };
  } catch (err) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired JWT token' });
  }
};

// 4. Role Guard Factory
export const requireRole = (allowedRoles: AuthenticatedUser['role'][]) => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!allowedRoles.includes(req.user.role)) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Insufficient privileges' });
    }
  };
};

// 5. Route Controller Definition
export async function workspaceRoutes(app: FastifyInstance) {
  // Pre-handler hook for authentication
  app.addHook('preHandler', authenticate);

  // GET /api/v1/workspaces
  app.get('/', async (req, reply) => {
    const tenantId = req.user.tenantId;
    return reply.send({
      success: true,
      tenantId,
      data: [
        { id: 'ws_01', name: 'Production Cluster', tenantId, status: 'active' },
        { id: 'ws_02', name: 'Staging Environment', tenantId, status: 'active' },
      ],
    });
  });

  // POST /api/v1/workspaces (Requires Admin or Owner)
  app.post(
    '/',
    { preHandler: [requireRole(['owner', 'admin'])] },
    async (req, reply) => {
      const parsed = CreateWorkspaceSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'ValidationError', issues: parsed.error.issues });
      }

      const newWorkspace = {
        id: \`ws_\${Date.now()}\`,
        name: parsed.data.name,
        tenantId: req.user.tenantId,
        settings: parsed.data.settings,
        createdAt: new Date().toISOString(),
      };

      return reply.status(201).send({ success: true, data: newWorkspace });
    }
  );
}`,
    },
  },
  {
    id: 'preset-ui-component',
    title: 'Build Responsive UI Component with Dark Mode',
    category: 'FRONTEND',
    description: 'Cyberpunk glassmorphic analytics card with dynamic telemetry gauges, dark/light mode toggle, and micro-animations.',
    targetStack: ['React 19', 'Tailwind CSS v4', 'Framer Motion / Lucide', 'Accessible ARIA'],
    priority: 'NORMAL',
    estimatedDurationSeconds: 7,
    steps: [
      'Generating accessible semantic HTML & ARIA attributes',
      'Implementing glassmorphic neon Tailwind classes',
      'Adding responsive breakpoints & micro-interactions',
      'Bundling TypeScript prop contracts and storybook demo',
    ],
    mockLogs: [
      { stepIndex: 0, level: 'STEP', text: 'Initializing Component Spec: <TelemetryCard /> with Radix UI primitives' },
      { stepIndex: 1, level: 'INFO', text: 'Configuring CSS backdrop-filter: blur(16px) with dynamic border gradients' },
      { stepIndex: 2, level: 'EXEC', text: 'Optimizing touch targets for mobile viewport (w-full sm:w-auto)' },
      { stepIndex: 3, level: 'SUCCESS', text: 'TelemetryCard.tsx compiled. 0 accessibility warnings detected.' },
    ],
    artifact: {
      title: 'Cyberpunk TelemetryCard Component',
      summary: 'Responsive, accessible React component featuring glassmorphism, sparkline visualizer, and neon accents.',
      fileName: 'TelemetryCard.tsx',
      language: 'tsx',
      stats: {
        lines: 88,
        bundleSize: '3.4 kB gzipped',
        coverage: '100%',
        durationSeconds: 7,
      },
      code: `import React, { useState } from 'react';
import { Activity, ArrowUpRight, Cpu, Sparkles, Terminal } from 'lucide-react';

export interface TelemetryCardProps {
  title: string;
  metricValue: string | number;
  deltaPercent: number;
  status?: 'optimal' | 'warning' | 'critical';
  graphPoints?: number[];
  onInspect?: () => void;
}

export const TelemetryCard: React.FC<TelemetryCardProps> = ({
  title,
  metricValue,
  deltaPercent,
  status = 'optimal',
  graphPoints = [40, 55, 35, 70, 65, 85, 92],
  onInspect,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const statusColors = {
    optimal: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20 shadow-cyan-500/10',
    warning: 'text-amber-400 border-amber-500/30 bg-amber-950/20 shadow-amber-500/10',
    critical: 'text-rose-400 border-rose-500/30 bg-rose-950/20 shadow-rose-500/10',
  }[status];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/10"
    >
      {/* Ambient Cyber Neon Gradient Corner */}
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-40" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/50 bg-slate-800/80 text-cyan-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h3>
            <span className="text-xs text-slate-500">Live Agent Stream</span>
          </div>
        </div>

        <span className={\`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border \${statusColors}\`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
          {status.toUpperCase()}
        </span>
      </div>

      {/* Main Metric Value */}
      <div className="mt-4 flex items-baseline justify-between">
        <div className="text-3xl font-extrabold tracking-tight text-white font-mono">
          {metricValue}
        </div>
        <div className="flex items-center text-xs font-semibold text-emerald-400">
          <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
          +{deltaPercent}%
        </div>
      </div>

      {/* SVG Mini Sparkline Visualizer */}
      <div className="mt-4 h-12 w-full">
        <svg className="h-full w-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
          <defs>
            <linearGradient id="cyberGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {/* Sparkline curve */}
          <polyline
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={graphPoints.map((val, idx) => \`\${(idx / (graphPoints.length - 1)) * 100},\${30 - (val / 100) * 26}\`).join(' ')}
          />
        </svg>
      </div>

      {/* Action Footer */}
      {onInspect && (
        <button
          onClick={onInspect}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/40 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700/60 hover:text-white"
        >
          <Terminal className="h-3.5 w-3.5 text-cyan-400" />
          Inspect Diagnostics
        </button>
      )}
    </div>
  );
};`,
    },
  },
  {
    id: 'preset-tests-audit',
    title: 'Run Unit/E2E Test Suites & Security Audit',
    category: 'TESTING',
    description: 'Comprehensive test runner with Vitest mocking, Playwright E2E checks, and OWASP Top 10 automated security scan.',
    targetStack: ['Vitest', 'Testing Library', 'Playwright', 'ESLint Security', 'Trivy'],
    priority: 'CRITICAL',
    estimatedDurationSeconds: 10,
    steps: [
      'Collecting test files & resolving import mocks',
      'Executing unit & integration test suites',
      'Running AST-based security vulnerability scan',
      'Generating coverage reports & compliance badges',
    ],
    mockLogs: [
      { stepIndex: 0, level: 'STEP', text: 'Initializing test runner: 48 spec files found across /src/__tests__' },
      { stepIndex: 1, level: 'EXEC', text: 'RUN  src/__tests__/auth-pipeline.test.ts (14 tests passed in 142ms)' },
      { stepIndex: 1, level: 'EXEC', text: 'RUN  src/__tests__/database-rls.test.ts (22 tests passed in 218ms)' },
      { stepIndex: 2, level: 'STEP', text: 'Running SAST & Dependency Vulnerability Analyzer (CVE database v2026.09)' },
      { stepIndex: 2, level: 'INFO', text: 'Checking SQL injection, XSS vectors, and timing attack vectors...' },
      { stepIndex: 3, level: 'SUCCESS', text: 'All 76 tests passed. Overall coverage: 94.8%. 0 vulnerabilities detected.' },
    ],
    artifact: {
      title: 'Vitest Unit & Integration Test Suite',
      summary: 'Rock-solid test harness covering authentication boundaries, RLS policies, and concurrent transaction safety.',
      fileName: 'auth-pipeline.test.ts',
      language: 'typescript',
      stats: {
        lines: 92,
        coverage: '94.8%',
        securityScore: '100% Pass (0 CVEs)',
        durationSeconds: 10,
      },
      code: `import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authenticate, requireRole, AuthenticatedUser } from '../workspaces.router';
import { FastifyRequest, FastifyReply } from 'fastify';

describe('Auth Middleware Security Pipeline', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;
  let statusMock: ReturnType<typeof vi.fn>;
  let sendMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sendMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ send: sendMock });
    mockReply = {
      status: statusMock,
      send: sendMock,
    };
  });

  it('rejects requests without Authorization header with HTTP 401', async () => {
    mockRequest = { headers: {} };
    await authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Unauthorized', message: 'Missing Bearer token' })
    );
  });

  it('rejects malformed bearer tokens', async () => {
    mockRequest = { headers: { authorization: 'Bearer invalid-token-string' } };
    await authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid or expired JWT token' })
    );
  });

  describe('RBAC Role Guard', () => {
    it('allows users with authorized role to proceed', async () => {
      const guard = requireRole(['owner', 'admin']);
      mockRequest = {
        user: { userId: 'u1', tenantId: 't1', role: 'admin' },
      };

      await guard(mockRequest as FastifyRequest, mockReply as FastifyReply);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('blocks regular member from accessing admin-only actions with HTTP 403', async () => {
      const guard = requireRole(['owner', 'admin']);
      mockRequest = {
        user: { userId: 'u2', tenantId: 't1', role: 'member' },
      };

      await guard(mockRequest as FastifyRequest, mockReply as FastifyReply);
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Forbidden' })
      );
    });
  });

  describe('Timing Attack Prevention', () => {
    it('guarantees constant-time key comparisons for HMAC verification', () => {
      // Validates cryptographically secure timingSafeEqual implementation
      expect(crypto.subtle).toBeDefined();
    });
  });
});`,
    },
  },
  {
    id: 'preset-docker-cicd',
    title: 'Generate Dockerfile & CI/CD Pipeline Config',
    category: 'DEVOPS',
    description: 'Multi-stage rootless Dockerfile with layer caching, minimal Alpine footprint, and GitHub Actions CI workflow.',
    targetStack: ['Docker Multi-stage', 'Alpine Linux', 'GitHub Actions', 'Docker Buildx', 'Trivy Scan'],
    priority: 'HIGH',
    estimatedDurationSeconds: 8,
    steps: [
      'Configuring multi-stage Docker build pipeline',
      'Implementing unprivileged non-root user security',
      'Creating GitHub Actions CI/CD matrix with cache mounts',
      'Validating container image layer footprint and SBOM',
    ],
    mockLogs: [
      { stepIndex: 0, level: 'STEP', text: 'Generating Dockerfile with stages: [builder, pruner, runner]' },
      { stepIndex: 1, level: 'INFO', text: 'Applying node:22-alpine base image with musl libc optimizations' },
      { stepIndex: 2, level: 'EXEC', text: 'Adding non-root user appuser (UID: 10001, GID: 10001)' },
      { stepIndex: 2, level: 'EXEC', text: 'Synthesizing .github/workflows/deploy.yml with OIDC AWS credentials' },
      { stepIndex: 3, level: 'SUCCESS', text: 'Dockerfile & CI Pipeline synthesized. Final image estimate: ~68MB.' },
    ],
    artifact: {
      title: 'Multi-Stage Production Dockerfile & CI Workflow',
      summary: 'Secure non-root container packaging with layer caching and GitHub Actions automated deployment workflow.',
      fileName: 'Dockerfile.production',
      language: 'dockerfile',
      stats: {
        lines: 75,
        bundleSize: '~68MB Image Footprint',
        securityScore: 'Non-Root / 0 CVEs',
        durationSeconds: 8,
      },
      code: `# ==============================================================================
# Multi-Stage Production Dockerfile for Node.js / Full-Stack Workflows
# Security: Runs unprivileged as non-root user (appuser:10001)
# ==============================================================================

# Stage 1: Dependency resolution and base environment
FROM node:22-alpine AS dependencies
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# Stage 2: Application Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run build

# Stage 3: Minimal, Hardened Production Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Security: Create non-root system user and group
RUN addgroup --system --gid 10001 nodejs && \
    adduser --system --uid 10001 appuser

# Copy built artifacts and minimal production dependencies
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/package.json ./package.json
COPY --from=dependencies --chown=appuser:nodejs /app/node_modules ./node_modules

# Switch to unprivileged user
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

ENTRYPOINT ["node", "dist/index.js"]`,
    },
  },
];
