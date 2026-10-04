/**
 * Mock Figma node spec + hasil slicing jajang per iterasi.
 * Semua kalkulasi "pixel diff" disimulasikan secara deterministik.
 */

export function parseFigmaInput(raw) {
  const input = (raw || '').trim();
  if (!input) return { ok: false, error: 'Masukkan Figma URL atau Node ID' };

  // Raw node id: "204:12" / "204-12"
  const bare = input.match(/^(\d+)[:-](\d+)$/);
  if (bare) return { ok: true, fileKey: 'TRPL-App', fileName: 'Core', nodeId: `${bare[1]}:${bare[2]}`, slug: `${bare[1]}-${bare[2]}` };

  const url = input.match(/figma\.com\/(?:design|file|proto)\/([^/?#]+)(?:\/([^?#]+))?.*?[?&]node-id=(\d+)(?:-|:|%3A)(\d+)/i);
  if (url) {
    return {
      ok: true,
      fileKey: decodeURIComponent(url[1]),
      fileName: decodeURIComponent(url[2] || 'Untitled'),
      nodeId: `${url[3]}:${url[4]}`,
      slug: `${url[3]}-${url[4]}`,
    };
  }
  if (/figma\.com/i.test(input)) return { ok: false, error: 'URL Figma valid tapi parameter node-id tidak ditemukan' };
  return { ok: false, error: 'Format tidak dikenali. Contoh: …/design/TRPL-App/Core?node-id=204-12' };
}

export const FIGMA_SPEC = {
  frame: 'Core / PaymentCard',
  component: 'PaymentCard',
  size: '360 × 212',
  layout: 'Auto Layout · vertical · gap 12 · padding 20',
  variables: [
    ['--color-primary-500', '#10B981'],
    ['--color-surface-900', '#18181B'],
    ['--color-violet-500', '#8B5CF6'],
    ['--color-text-muted', '#A1A1AA'],
    ['--radius-2xl', '16px'],
  ],
  typography: [
    ['Heading/H5', 'Inter 600 · 18/24 · ls -0.2px'],
    ['Body/S', 'Inter 400 · 14/20 · ls 0'],
    ['Mono/2XL', 'JetBrains Mono 500 · 24/32'],
    ['Label/Button', 'Inter 600 · 14/20'],
  ],
  deviations: [
    { el: 'button.cta', prop: 'padding', expected: '12px 20px', got: '10px 16px', px: 1840 },
    { el: 'h5.merchant', prop: 'letter-spacing', expected: '-0.2px', got: '0px', px: 1212 },
    { el: 'article', prop: 'row-gap', expected: '12px', got: '14px', px: 968 },
  ],
};

export function figmaFiles(slug, iteration) {
  const component = {
    path: 'src/components/core/PaymentCard.tsx',
    status: 'added',
    diff: `@@ -0,0 +1,31 @@
+import { cn } from '@/lib/cn';
+
+type PaymentCardProps = {
+  amount: string;
+  merchant: string;
+  status: 'paid' | 'pending';
+  onPay?: () => void;
+};
+
+export function PaymentCard({ amount, merchant, status, onPay }: PaymentCardProps) {
+  return (
+    <article className="flex w-[360px] flex-col ${iteration > 1 ? 'gap-3' : 'gap-3.5'} rounded-2xl border border-white/10 bg-surface-900 p-5">
+      <header className="flex items-center justify-between">
+        <h5 className="text-[18px] font-semibold leading-6 ${iteration > 1 ? 'tracking-[-0.2px]' : 'tracking-normal'} text-zinc-50">{merchant}</h5>
+        <span
+          className={cn(
+            'rounded-full px-2 py-0.5 font-mono text-xs',
+            status === 'paid' ? 'bg-primary-500/15 text-primary-500' : 'bg-violet-500/15 text-violet-500',
+          )}
+        >
+          {status}
+        </span>
+      </header>
+      <p className="text-sm leading-5 text-muted">Total tagihan</p>
+      <strong className="font-mono text-2xl text-zinc-50">{amount}</strong>
+      <button onClick={onPay} className="rounded-xl bg-primary-500 ${iteration > 1 ? 'px-5 py-3' : 'px-4 py-2.5'} text-sm font-semibold text-zinc-950">
+        Bayar Sekarang
+      </button>
+    </article>
+  );
+}`,
  };

  const tokens = {
    path: 'tailwind.config.ts',
    status: 'modified',
    diff: `@@ -8,6 +8,14 @@ export default {
   theme: {
     extend: {
+      colors: {
+        primary: { 500: 'var(--color-primary-500)' },
+        surface: { 900: 'var(--color-surface-900)' },
+        violet: { 500: 'var(--color-violet-500)' },
+        muted: 'var(--color-text-muted)',
+      },
+      fontFamily: { mono: ['JetBrains Mono', 'monospace'] },
+      borderRadius: { '2xl': 'var(--radius-2xl)' },
     },
   },
   plugins: [],`,
  };

  const visual = {
    path: 'src/components/core/PaymentCard.visual.test.ts',
    status: 'added',
    diff: `@@ -0,0 +1,12 @@
+import { expect, test } from 'vitest';
+import { renderToRaster, figmaRaster, pixelDiff } from '@/test/visual';
+
+test('PaymentCard matches Figma node ${slug.replace('-', ':')} pixel-perfect', async () => {
+  const dom = await renderToRaster('PaymentCard', { width: 360, dpr: 2 });
+  const ref = await figmaRaster('TRPL-App', '${slug.replace('-', ':')}', { scale: 2 });
+
+  const { precision, mismatched } = pixelDiff(dom, ref, { threshold: 0.1, ignoreAA: true });
+
+  expect(mismatched.layout).toHaveLength(0);
+  expect(precision).toBeGreaterThanOrEqual(99.5);
+});`,
  };

  const files = [component, tokens, visual];

  if (iteration > 1) {
    files.unshift({
      path: 'src/components/core/PaymentCard.tsx  ·  auto-tune iterasi #2',
      status: 'patch',
      diff: `@@ -12,3 +12,3 @@ export function PaymentCard({ amount, merchant, status, onPay }: PaymentCardProps) {
-    <article className="flex w-[360px] flex-col gap-3.5 rounded-2xl border border-white/10 bg-surface-900 p-5">
+    <article className="flex w-[360px] flex-col gap-3 rounded-2xl border border-white/10 bg-surface-900 p-5">
       <header className="flex items-center justify-between">
-        <h5 className="text-[18px] font-semibold leading-6 tracking-normal text-zinc-50">{merchant}</h5>
+        <h5 className="text-[18px] font-semibold leading-6 tracking-[-0.2px] text-zinc-50">{merchant}</h5>
@@ -26,1 +26,1 @@ export function PaymentCard({ amount, merchant, status, onPay }: PaymentCardProps) {
-      <button onClick={onPay} className="rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-zinc-950">
+      <button onClick={onPay} className="rounded-xl bg-primary-500 px-5 py-3 text-sm font-semibold text-zinc-950">`,
    });
  }
  return files;
}
