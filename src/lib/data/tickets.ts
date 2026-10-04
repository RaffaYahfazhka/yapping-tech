/**
 * Mock Jira backlog. Setiap tiket punya AC, rencana Arga, daftar test Vani,
 * dan unified diff (format git asli) yang ditampilkan di Git Diff Viewer.
 * coder: 'jajang' (frontend) | 'kian' (backend)
 */
export const TICKETS = [
  // ───────────────────────── frontend-dashboard-v2 ─────────────────────────
  {
    key: 'JIRA-104',
    type: 'Story',
    priority: 'High',
    summary: 'Virtual scroll untuk tabel transaksi (10k+ rows)',
    description: 'Tabel transaksi lag saat data > 2.000 baris. Implementasikan virtualisasi baris + sticky header tanpa mengubah API.',
    repo: 'frontend-dashboard-v2',
    coder: 'jajang',
    points: 5,
    labels: ['performance', 'table'],
    status: 'To Do',
    ac: [
      'Scroll 10.000 baris tetap ≥ 55 FPS di Chrome mid-range',
      'Header tabel sticky saat scroll',
      'Keyboard navigation (↑/↓) tetap berfungsi',
      'Tidak ada perubahan kontrak API /transactions',
    ],
    plan: ['Tambah hook useVirtualRows (windowing + overscan)', 'Refactor TransactionTable jadi row-renderer', 'Sticky header via position: sticky', 'Benchmark + unit test hook'],
    tests: ['useVirtualRows › menghitung window awal', 'useVirtualRows › overscan 8 baris', 'TransactionTable › render 10k rows < 16ms', 'TransactionTable › sticky header', 'TransactionTable › keyboard nav ↑/↓'],
    files: [
      {
        path: 'src/hooks/useVirtualRows.ts',
        status: 'added',
        diff: `@@ -0,0 +1,22 @@
+import { useMemo, useState } from 'react';
+
+type Options = { count: number; rowHeight: number; viewport: number; overscan?: number };
+
+export function useVirtualRows({ count, rowHeight, viewport, overscan = 8 }: Options) {
+  const [scrollTop, setScrollTop] = useState(0);
+
+  const range = useMemo(() => {
+    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
+    const visible = Math.ceil(viewport / rowHeight) + overscan * 2;
+    const end = Math.min(count, start + visible);
+    return { start, end, offset: start * rowHeight };
+  }, [scrollTop, rowHeight, viewport, overscan, count]);
+
+  return {
+    ...range,
+    totalHeight: count * rowHeight,
+    onScroll: (e: React.UIEvent<HTMLDivElement>) => setScrollTop(e.currentTarget.scrollTop),
+  };
+}
+
+export type VirtualRange = ReturnType<typeof useVirtualRows>;`,
      },
      {
        path: 'src/app/(dashboard)/transactions/page.tsx',
        status: 'modified',
        diff: `@@ -1,8 +1,10 @@
 import { getTransactions } from '@/lib/api';
-import { Card } from '@/components/ui/card';
+import { Card } from '@/components/ui/card';
+import { useVirtualRows } from '@/hooks/useVirtualRows';
 
 const ROW_HEIGHT = 44;
+const VIEWPORT = 640;
 
 export default function TransactionsPage() {
   const { data = [] } = getTransactions();
@@ -14,12 +16,19 @@ export default function TransactionsPage() {
-      <table className="w-full text-sm">
-        <thead>
+      <div className="h-[640px] overflow-auto" onScroll={v.onScroll}>
+      <table className="w-full text-sm" style={{ height: v.totalHeight }}>
+        <thead className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur">
           <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
         </thead>
-        <tbody>
-          {data.map((row) => <Row key={row.id} row={row} />)}
+        <tbody style={{ transform: 'translateY(' + v.offset + 'px)' }}>
+          {data.slice(v.start, v.end).map((row) => (
+            <Row key={row.id} row={row} height={ROW_HEIGHT} />
+          ))}
         </tbody>
       </table>
+      </div>`,
      },
    ],
  },
  {
    key: 'JIRA-111',
    type: 'Bug',
    priority: 'Highest',
    summary: 'Flicker putih saat toggle dark mode di Safari',
    description: 'FOUC terlihat ~120ms karena class theme di-set setelah hydration.',
    repo: 'frontend-dashboard-v2',
    coder: 'jajang',
    points: 2,
    labels: ['bug', 'theming', 'safari'],
    status: 'To Do',
    ac: ['Tidak ada flash putih saat reload di Safari 17+', 'Preferensi tersimpan di localStorage', 'Respect prefers-color-scheme saat belum ada preferensi'],
    plan: ['Inject inline script pre-hydration di <head>', 'Sinkronkan useTheme dengan dataset.theme', 'Tambah color-scheme meta'],
    tests: ['useTheme › baca localStorage', 'useTheme › fallback prefers-color-scheme', 'layout › inline theme script dirender sebelum body'],
    files: [
      {
        path: 'src/app/layout.tsx',
        status: 'modified',
        diff: `@@ -6,9 +6,16 @@ export default function RootLayout({ children }) {
   return (
-    <html lang="id">
-      <head />
+    <html lang="id" suppressHydrationWarning>
+      <head>
+        <meta name="color-scheme" content="dark light" />
+        <script
+          dangerouslySetInnerHTML={{
+            __html: "try{var t=localStorage.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t}catch(e){}",
+          }}
+        />
+      </head>
       <body className={inter.className}>{children}</body>
     </html>
   );`,
      },
      {
        path: 'src/hooks/useTheme.ts',
        status: 'modified',
        diff: `@@ -3,10 +3,12 @@ import { useEffect, useState } from 'react';
 export function useTheme() {
-  const [theme, setTheme] = useState<'dark' | 'light'>('light');
-
-  useEffect(() => {
-    setTheme((localStorage.theme as 'dark' | 'light') ?? 'light');
-  }, []);
+  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
+    typeof document === 'undefined' ? 'dark' : (document.documentElement.dataset.theme as 'dark' | 'light'),
+  );
+
+  useEffect(() => {
+    document.documentElement.dataset.theme = theme;
+    localStorage.theme = theme;
+  }, [theme]);
 
   return { theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) };
 }`,
      },
    ],
  },
  {
    key: 'JIRA-117',
    type: 'Task',
    priority: 'Medium',
    summary: 'Skeleton loading untuk StatCard dashboard',
    description: 'Ganti spinner dengan skeleton shimmer konsisten dengan design system.',
    repo: 'frontend-dashboard-v2',
    coder: 'jajang',
    points: 1,
    labels: ['ux'],
    status: 'To Do',
    ac: ['Skeleton punya dimensi sama dengan StatCard final (no CLS)', 'Animasi shimmer menghormati prefers-reduced-motion'],
    plan: ['Buat komponen Skeleton', 'Pakai di StatCard saat isLoading'],
    tests: ['Skeleton › render dimensi tetap', 'StatCard › tampilkan skeleton saat loading', 'a11y › aria-busy=true'],
    files: [
      {
        path: 'src/components/core/StatCard.tsx',
        status: 'modified',
        diff: `@@ -1,12 +1,20 @@
 import { Card } from '@/components/ui/card';
+import { cn } from '@/lib/cn';
 
-export function StatCard({ label, value }: { label: string; value?: string }) {
-  if (!value) return <Card className="grid h-28 place-items-center"><Spinner /></Card>;
+export function StatCard({ label, value, isLoading }: { label: string; value?: string; isLoading?: boolean }) {
   return (
-    <Card className="h-28 p-5">
-      <p className="text-sm text-zinc-400">{label}</p>
-      <p className="mt-2 text-2xl font-semibold">{value}</p>
+    <Card className="h-28 p-5" aria-busy={isLoading}>
+      <p className={cn('text-sm text-zinc-400', isLoading && 'skeleton h-4 w-24')}>{!isLoading && label}</p>
+      <p className={cn('mt-2 text-2xl font-semibold', isLoading && 'skeleton h-7 w-36')}>
+        {!isLoading && value}
+      </p>
     </Card>
   );
 }`,
      },
    ],
  },

  // ───────────────────────── payment-service-gateway ─────────────────────────
  {
    key: 'JIRA-121',
    type: 'Story',
    priority: 'Highest',
    summary: 'Idempotency-Key untuk POST /payments',
    description: 'Retry dari mobile client menyebabkan transaksi ganda. Tambahkan header Idempotency-Key dengan TTL 24 jam.',
    repo: 'payment-service-gateway',
    coder: 'kian',
    points: 8,
    labels: ['payments', 'reliability'],
    status: 'To Do',
    ac: [
      'Request dengan Idempotency-Key sama mengembalikan response pertama (HTTP 200, bukan 201)',
      'Key disimpan 24 jam lalu expired',
      'Request tanpa key tetap diproses (backward compatible)',
      'Konflik payload dengan key sama → 422',
    ],
    plan: ['Tabel idempotency_keys + migration', 'IdempotencyInterceptor di level controller', 'Hash payload SHA-256 untuk deteksi konflik', 'E2E test retry scenario'],
    tests: ['POST /payments › key baru → 201', 'POST /payments › key sama → replay 200', 'POST /payments › payload beda → 422', 'POST /payments › tanpa key → 201', 'idempotency › expired setelah 24 jam'],
    files: [
      {
        path: 'prisma/schema.prisma',
        status: 'modified',
        diff: `@@ -41,3 +41,14 @@ model Payment {
   createdAt  DateTime @default(now())
   updatedAt  DateTime @updatedAt
 }
+
+model IdempotencyKey {
+  key          String   @id
+  requestHash  String   @map("request_hash")
+  responseCode Int      @map("response_code")
+  responseBody Json     @map("response_body")
+  expiresAt    DateTime @map("expires_at")
+
+  @@index([expiresAt])
+  @@map("idempotency_keys")
+}`,
      },
      {
        path: 'prisma/migrations/20261003_idempotency/migration.sql',
        status: 'added',
        diff: `@@ -0,0 +1,9 @@
+-- CreateTable
+CREATE TABLE "idempotency_keys" (
+    "key" TEXT NOT NULL PRIMARY KEY,
+    "request_hash" TEXT NOT NULL,
+    "response_code" INTEGER NOT NULL,
+    "response_body" JSONB NOT NULL,
+    "expires_at" TIMESTAMP(3) NOT NULL
+);
+CREATE INDEX "idempotency_keys_expires_at_idx" ON "idempotency_keys"("expires_at");`,
      },
      {
        path: 'src/payments/payments.controller.ts',
        status: 'modified',
        diff: `@@ -1,15 +1,18 @@
-import { Body, Controller, Post } from '@nestjs/common';
+import { Body, Controller, Headers, Post, UseInterceptors } from '@nestjs/common';
+import { IdempotencyInterceptor } from '../common/interceptors/idempotency.interceptor';
 import { CreatePaymentDto } from './dto/create-payment.dto';
 import { PaymentsService } from './payments.service';
 
 @Controller('payments')
 export class PaymentsController {
   constructor(private readonly payments: PaymentsService) {}
 
   @Post()
-  create(@Body() dto: CreatePaymentDto) {
-    return this.payments.create(dto);
+  @UseInterceptors(IdempotencyInterceptor)
+  create(@Body() dto: CreatePaymentDto, @Headers('idempotency-key') key?: string) {
+    return this.payments.create(dto, { idempotencyKey: key });
   }
 }`,
      },
    ],
  },
  {
    key: 'JIRA-125',
    type: 'Bug',
    priority: 'High',
    summary: 'Webhook retry memicu double charge',
    description: 'Provider mengirim ulang webhook saat timeout 5s; handler tidak cek event_id.',
    repo: 'payment-service-gateway',
    coder: 'kian',
    points: 3,
    labels: ['bug', 'webhook'],
    status: 'To Do',
    ac: ['Event dengan event_id yang sama hanya diproses sekali', 'Handler membalas 200 dalam < 500ms (proses async)'],
    plan: ['Dedup event_id via upsert', 'Pindahkan proses berat ke queue'],
    tests: ['webhooks › event duplikat di-skip', 'webhooks › respon < 500ms', 'webhooks › signature invalid → 401'],
    files: [
      {
        path: 'src/webhooks/webhooks.service.ts',
        status: 'modified',
        diff: `@@ -12,10 +12,17 @@ export class WebhooksService {
   async handle(event: ProviderEvent) {
-    const payment = await this.prisma.payment.findUnique({ where: { ref: event.ref } });
-    await this.ledger.charge(payment);
-    return { ok: true };
+    const seen = await this.prisma.webhookEvent.upsert({
+      where: { id: event.id },
+      create: { id: event.id, type: event.type },
+      update: {},
+      select: { processedAt: true },
+    });
+    if (seen.processedAt) return { ok: true, duplicate: true };
+
+    await this.queue.add('settle-payment', { ref: event.ref, eventId: event.id });
+    return { ok: true };
   }
 }`,
      },
    ],
  },
  {
    key: 'JIRA-129',
    type: 'Task',
    priority: 'Low',
    summary: 'Index komposit refunds(payment_id, created_at)',
    description: 'Query laporan refund full-scan, p95 1.8s.',
    repo: 'payment-service-gateway',
    coder: 'kian',
    points: 1,
    labels: ['db', 'performance'],
    status: 'To Do',
    ac: ['p95 query laporan refund < 150ms', 'Migration non-blocking (CONCURRENTLY)'],
    plan: ['Migration CREATE INDEX CONCURRENTLY', 'EXPLAIN ANALYZE sebelum/sesudah'],
    tests: ['migration › index tersedia', 'refunds report › memakai Index Scan'],
    files: [
      {
        path: 'prisma/migrations/20261003_refunds_idx/migration.sql',
        status: 'added',
        diff: `@@ -0,0 +1,3 @@
+-- Non-blocking index for refund reports
+CREATE INDEX CONCURRENTLY IF NOT EXISTS "refunds_payment_id_created_at_idx"
+  ON "refunds" ("payment_id", "created_at" DESC);`,
      },
    ],
  },

  // ───────────────────────── design-system-tokens ─────────────────────────
  {
    key: 'JIRA-132',
    type: 'Story',
    priority: 'Medium',
    summary: 'Tambah skala warna violet 50–950 ke tokens',
    description: 'Brand refresh membutuhkan skala violet lengkap sebagai aksen sekunder.',
    repo: 'design-system-tokens',
    coder: 'jajang',
    points: 2,
    labels: ['tokens', 'brand'],
    status: 'To Do',
    ac: ['Skala 50–950 tersedia di JSON & CSS vars', 'Kontras teks violet-500 di zinc-950 ≥ 4.5:1'],
    plan: ['Tambah tokens/color/base.json', 'Map semantic accent.secondary', 'Rebuild style-dictionary'],
    tests: ['tokens › schema valid', 'tokens › kontras WCAG AA', 'build › css vars ter-generate'],
    files: [
      {
        path: 'tokens/color/base.json',
        status: 'modified',
        diff: `@@ -22,6 +22,19 @@
     "emerald": {
       "500": { "value": "#10b981" },
       "600": { "value": "#059669" }
-    }
+    },
+    "violet": {
+      "50": { "value": "#f5f3ff" },
+      "100": { "value": "#ede9fe" },
+      "200": { "value": "#ddd6fe" },
+      "300": { "value": "#c4b5fd" },
+      "400": { "value": "#a78bfa" },
+      "500": { "value": "#8b5cf6" },
+      "600": { "value": "#7c3aed" },
+      "700": { "value": "#6d28d9" },
+      "800": { "value": "#5b21b6" },
+      "900": { "value": "#4c1d95" },
+      "950": { "value": "#2e1065" }
+    }
   }
 }`,
      },
    ],
  },
  {
    key: 'JIRA-136',
    type: 'Task',
    priority: 'High',
    summary: 'Sinkronisasi typography tokens dari Figma Variables',
    description: 'Letter-spacing heading di kode tidak sama dengan Figma (-0.2px).',
    repo: 'design-system-tokens',
    coder: 'jajang',
    points: 3,
    labels: ['tokens', 'figma'],
    status: 'To Do',
    ac: ['Semua text style Figma punya padanan token', 'letterSpacing heading = -0.2px'],
    plan: ['Pull Figma Variables API', 'Transform ke tokens/typography.json'],
    tests: ['typography › 12 style tersinkron', 'typography › letterSpacing heading -0.2px'],
    files: [
      {
        path: 'tokens/typography.json',
        status: 'modified',
        diff: `@@ -2,12 +2,12 @@
   "heading": {
     "h5": {
       "fontFamily": { "value": "Inter" },
       "fontWeight": { "value": 600 },
       "fontSize": { "value": "18px" },
       "lineHeight": { "value": "24px" },
-      "letterSpacing": { "value": "0px" }
+      "letterSpacing": { "value": "-0.2px" }
     }
   },
   "body": {
     "s": {
-      "lineHeight": { "value": "21px" }
+      "lineHeight": { "value": "20px" }
     }
   }`,
      },
    ],
  },

  // ───────────────────────── mobile-app-client ─────────────────────────
  {
    key: 'JIRA-140',
    type: 'Story',
    priority: 'High',
    summary: 'Login biometrik (Face ID / Fingerprint)',
    description: 'User returning bisa login dengan biometrik setelah opt-in.',
    repo: 'mobile-app-client',
    coder: 'jajang',
    points: 5,
    labels: ['auth', 'mobile'],
    status: 'To Do',
    ac: ['Prompt biometrik muncul jika user sudah opt-in', 'Fallback ke PIN setelah 3x gagal', 'Token disimpan di SecureStore'],
    plan: ['Hook useBiometric (expo-local-authentication)', 'Integrasi di login.tsx', 'Simpan refresh token di SecureStore'],
    tests: ['useBiometric › hardware tidak tersedia', 'useBiometric › sukses → token', 'login › fallback PIN setelah 3x gagal'],
    files: [
      {
        path: 'src/hooks/useBiometric.ts',
        status: 'added',
        diff: `@@ -0,0 +1,16 @@
+import * as LocalAuth from 'expo-local-authentication';
+import * as SecureStore from 'expo-secure-store';
+
+export function useBiometric() {
+  async function authenticate() {
+    const supported = await LocalAuth.hasHardwareAsync();
+    if (!supported) return { ok: false, reason: 'unsupported' as const };
+
+    const res = await LocalAuth.authenticateAsync({ promptMessage: 'Masuk ke Kantor Raffa' });
+    if (!res.success) return { ok: false, reason: 'failed' as const };
+
+    return { ok: true, token: await SecureStore.getItemAsync('refresh_token') };
+  }
+
+  return { authenticate };
+}`,
      },
    ],
  },
  {
    key: 'JIRA-144',
    type: 'Bug',
    priority: 'Highest',
    summary: 'Crash saat buka push notification deep link',
    description: 'Deep link kantor://tx/:id crash ketika app cold start.',
    repo: 'mobile-app-client',
    coder: 'jajang',
    points: 3,
    labels: ['bug', 'crash', 'push'],
    status: 'To Do',
    ac: ['Cold start dari notif membuka detail transaksi', 'Tidak ada crash di Crashlytics 24 jam'],
    plan: ['Tunda navigasi sampai navigator ready', 'Tambah route tx/:id di linking config'],
    tests: ['linking › parse kantor://tx/42', 'push › cold start queue navigasi'],
    files: [
      {
        path: 'src/navigation/linking.ts',
        status: 'modified',
        diff: `@@ -4,8 +4,10 @@ export const linking = {
   prefixes: ['kantor://', 'https://kantor.raffa.dev'],
   config: {
     screens: {
       home: 'home',
-      login: 'login',
+      login: 'login',
+      transaction: 'tx/:id',
     },
   },
+  getInitialURL: async () => (await Notifications.getLastNotificationResponseAsync())?.notification.request.content.data?.url,
 };`,
      },
    ],
  },
  // ───────────────────────── yapping-techflow (Live Mockup Demo) ─────────────────────────
  {
    key: 'TECH-777',
    type: 'Story',
    priority: 'Highest',
    summary: 'Autonomous Antigravity Engineering Pipeline Live Demo',
    description: 'Eksekusi live pipeline otonom di folder lokal yapping-techflow: validasi AC oleh Tara, arsitektur & scanning oleh Arga, Emotion CSS component slicing oleh Jajang, validasi API & state oleh Kian, automated QA oleh Vani, dan Git Flow rc/TECH-777 ke branch dev oleh Reno.',
    repo: 'yapping-techflow',
    coder: 'jajang',
    points: 8,
    labels: ['antigravity', 'autonomous', 'live-demo'],
    status: 'To Do',
    ac: [
      'Folder repositori lokal yapping-techflow terverifikasi otomatis',
      'Git branch aktif dev / development terdeteksi sebelum eksekusi',
      'Komponen UI terslice dengan Emotion CSS outline styles (presisi > 99%)',
      'Automated test suites lulus tanpa warning linting',
      'Reno membentuk branch feat/TECH-777 dan release rc/TECH-777 ke branch dev',
    ],
    plan: [
      'Validasi Acceptance Criteria & INVEST gate (Tara)',
      'Inspect folder repositori lokal & rancang blueprint modul (Arga)',
      'Generate komponen UI interaktif responsif (Jajang)',
      'Simulasi unit tests & validasi snapshot (Vani)',
      'Deploy Git Flow feat/TECH-777 ➔ rc/TECH-777 ➔ dev & link GitLab MR (Reno)',
    ],
    tests: [
      'local-repo › verify yapping-techflow root path exists',
      'git-branch › verify active dev / development branch',
      'emotion-css › verify responsive breakpoints & zero collision',
      'pipeline › complete autonomous execution Tara ➔ Reno',
    ],
    files: [
      {
        path: 'src/components/demo/AutonomousWorkflowDemo.tsx',
        status: 'added',
        diff: `@@ -0,0 +1,28 @@
+'use client';
+import React from 'react';
+import { css } from '@emotion/css';
+
+const styles = {
+  card: css\`
+    padding: 20px;
+    border-radius: 16px;
+    background: #0e1017;
+    border: 1px solid rgba(16, 185, 129, 0.4);
+    color: #f4f4f5;
+  \`,
+};
+
+export default function AutonomousWorkflowDemo() {
+  return (
+    <div className={styles.card}>
+      <h3>Antigravity Autonomous Live Demo</h3>
+      <p>Executed by Raffa AI Team (Tara, Arga, Jajang, Kian, Vani, Reno)</p>
+    </div>
+  );
+}`,
      },
    ],
  },
];

export const TYPE_META = {
  Story: { color: '#10b981', icon: '◆' },
  Bug: { color: '#f43f5e', icon: '●' },
  Task: { color: '#38bdf8', icon: '■' },
};

export const PRIORITY_META = {
  Highest: { color: '#f43f5e', icon: '⇈' },
  High: { color: '#fb923c', icon: '↑' },
  Medium: { color: '#fbbf24', icon: '=' },
  Low: { color: '#38bdf8', icon: '↓' },
};
