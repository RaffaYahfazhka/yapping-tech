// @ts-nocheck
import { parseFigmaInput, FIGMA_SPEC, figmaFiles } from '../data/figma';
import { TICKETS } from '../data/tickets';
import { REPO_MAP, REPOS } from '../data/repos';

/**
 * Autonomous Pipeline Runner for:
 * 1. Figma Slicing Loop (jajang ⇄ Vani ➔ Reno)
 * 2. Jira Multi-Repo Task Pipeline (Tara ➔ Arga ➔ Coder ➔ Vani ➔ Reno)
 */
export class PipelineRunner {
  constructor(options = {}) {
    this.onLog = options.onLog || (() => {});
    this.onStepChange = options.onStepChange || (() => {});
    this.onCameraFocus = options.onCameraFocus || (() => {});
    this.onAgentStatus = options.onAgentStatus || (() => {});
    this.onDiffChange = options.onDiffChange || (() => {});
    this.onPrecisionChange = options.onPrecisionChange || (() => {});
    this.onComplete = options.onComplete || (() => {});

    this.isRunning = false;
    this.aborted = false;
    this.speed = 1.0;
  }

  setSpeed(s) {
    this.speed = s;
  }

  abort() {
    this.aborted = true;
    this.isRunning = false;
  }

  async sleep(ms) {
    const adjusted = Math.max(10, ms / this.speed);
    await new Promise((r) => setTimeout(r, adjusted));
    if (this.aborted) throw new Error('PIPELINE_ABORTED');
  }

  /**
   * FITUR 1: Figma Slicing Loop
   */
  async runFigmaPipeline({ figmaUrl, repoId, strictGate }) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.aborted = false;

    const parsed = parseFigmaInput(figmaUrl);
    const slug = parsed.ok ? parsed.slug : '204-12';
    const repo = REPO_MAP[repoId] || REPO_MAP['frontend-dashboard-v2'];

    this.onDiffChange(null);
    this.onPrecisionChange(0);

    const steps = [
      { id: 'jajang_spec', label: 'jajang: Spec & Token Parse', agent: 'jajang' },
      { id: 'jajang_code', label: 'jajang: Generate Component', agent: 'jajang' },
      { id: 'vani_diff1', label: 'Vani: Pixel-Diff Check #1', agent: 'vani' },
      { id: 'jajang_tune', label: 'jajang: Auto-Tune CSS Rules', agent: 'jajang' },
      { id: 'vani_diff2', label: 'Vani: Re-Check Regression', agent: 'vani' },
      { id: 'reno_mr', label: 'Reno: Push & Open MR', agent: 'reno' },
    ];
    this.onStepChange({ kind: 'FIGMA_SLICING', title: `Slicing Figma [${slug}] ➔ ${repo.id}`, steps, activeIndex: 0 });

    try {
      // 1. Camera to jajang
      this.onCameraFocus('jajang');
      this.onAgentStatus('jajang', 'Spec Parse', '#8b5cf6');
      this.onLog({
        sender: 'jajang',
        color: '#8b5cf6',
        text: `🚀 Menerima instruksi slicing Figma node [${slug}] untuk repo \x1b[36m${repo.id}\x1b[0m.`,
      });
      await this.sleep(700);

      this.onLog({
        sender: 'jajang',
        color: '#8b5cf6',
        text: `📥 Fetching Figma Node REST API... Frame: \x1b[35m${FIGMA_SPEC.frame}\x1b[0m (${FIGMA_SPEC.size}px)`,
      });
      await this.sleep(900);

      this.onLog({
        sender: 'jajang',
        color: '#8b5cf6',
        text: `🎨 Ekstraksi 5 color variables & 4 typography tokens selesai. Menyusun Tailwind layout class...`,
      });
      await this.sleep(800);

      // jajang generates code (Iterasi 1)
      this.onStepChange({ activeIndex: 1 });
      this.onAgentStatus('jajang', 'Code Gen', '#8b5cf6');
      const filesV1 = figmaFiles(slug, 1);
      this.onDiffChange({ files: filesV1, activeIndex: 0, branch: `feat/slicing-figma-${slug}` });

      this.onLog({
        sender: 'jajang',
        color: '#8b5cf6',
        text: `✨ Berhasil generate \x1b[32m${filesV1[0].path}\x1b[0m + test snapshot. Menyerahkan ke Vani untuk pixel-diff verification.`,
      });
      await this.sleep(1100);

      // 2. Camera to Vani (QA)
      this.onStepChange({ activeIndex: 2 });
      this.onCameraFocus('vani');
      this.onAgentStatus('jajang', 'Waiting QA', '#a1a1aa');
      this.onAgentStatus('vani', 'Pixel Diff', '#f43f5e');

      this.onLog({
        sender: 'VANI',
        color: '#f43f5e',
        text: `🔍 [QA Guardian] Menjalankan \x1b[1mHeadless DOM vs Figma Raster Pixel-Diff Checker\x1b[0m (scale: 2x, dpr: 2)...`,
      });
      await this.sleep(1000);

      // Precision score 84.2%
      for (let p = 0; p <= 84.2; p += 12) {
        this.onPrecisionChange(Math.min(84.2, p));
        await this.sleep(80);
      }
      this.onPrecisionChange(84.2);

      this.onLog({
        sender: 'VANI',
        color: '#f43f5e',
        text: `⚠️  \x1b[31;1mPixel-Diff Failure: Deviasi terdeteksi! Precision: 84.2% (Target: ≥ 99.5%)\x1b[0m`,
      });
      await this.sleep(500);

      FIGMA_SPEC.deviations.forEach((dev) => {
        this.onLog({
          sender: 'VANI',
          color: '#f43f5e',
          text: `   ├─ \x1b[33m${dev.el}\x1b[0m: ${dev.prop} expected "${dev.expected}", got "${dev.got}" (Δ ${dev.px} mismatched px)`,
        });
      });
      await this.sleep(700);

      this.onLog({
        sender: 'VANI',
        color: '#f43f5e',
        text: `❌ \x1b[31;1mStrict Gate: Reject commit! Melempar balik log deviasi ke jajang untuk auto-correction loop.\x1b[0m`,
      });
      this.onAgentStatus('vani', 'Rejected', '#f43f5e');
      await this.sleep(1000);

      // 3. Camera back to jajang: Auto-correction feedback loop
      this.onStepChange({ activeIndex: 3 });
      this.onCameraFocus('jajang');
      this.onAgentStatus('jajang', 'Auto-Tune', '#8b5cf6');

      this.onLog({
        sender: 'jajang',
        color: '#8b5cf6',
        text: `🔧 Menerima feedback koreksi dari Vani. Melakukan auto-tuning rules Tailwind:`,
      });
      await this.sleep(700);

      this.onLog({
        sender: 'jajang',
        color: '#8b5cf6',
        text: `   ├─ Tune button.cta padding: px-4 py-2.5 ➔ \x1b[32mpx-5 py-3\x1b[0m (12px 20px match)`,
      });
      await this.sleep(500);
      this.onLog({
        sender: 'jajang',
        color: '#8b5cf6',
        text: `   ├─ Tune h5.merchant letter-spacing: tracking-normal ➔ \x1b[32mtracking-[-0.2px]\x1b[0m`,
      });
      await this.sleep(500);
      this.onLog({
        sender: 'jajang',
        color: '#8b5cf6',
        text: `   └─ Tune gap-3.5 ➔ \x1b[32mgap-3\x1b[0m (12px auto-layout match)`,
      });
      await this.sleep(800);

      const filesV2 = figmaFiles(slug, 2);
      this.onDiffChange({ files: filesV2, activeIndex: 0, branch: `feat/slicing-figma-${slug}` });

      this.onLog({
        sender: 'jajang',
        color: '#8b5cf6',
        text: `🚀 Patch iterasi #2 diaplikasikan. Meminta Vani melakukan re-verification.`,
      });
      await this.sleep(900);

      // 4. Camera to Vani: Re-check
      this.onStepChange({ activeIndex: 4 });
      this.onCameraFocus('vani');
      this.onAgentStatus('vani', 'Verifying', '#f43f5e');

      this.onLog({
        sender: 'VANI',
        color: '#f43f5e',
        text: `🔬 [QA Guardian] Menjalankan Pixel-Diff Re-check pada patch #2...`,
      });
      await this.sleep(800);

      for (let p = 84.2; p <= 99.8; p += 3.5) {
        this.onPrecisionChange(Math.min(99.8, Math.round(p * 10) / 10));
        await this.sleep(60);
      }
      this.onPrecisionChange(99.8);

      this.onLog({
        sender: 'VANI',
        color: '#f43f5e',
        text: `✅ \x1b[32;1mVisual Regression Passed! Precision: 99.8% (Toleransi hanya 0.2% subpixel AA).\x1b[0m`,
      });
      this.onLog({
        sender: 'VANI',
        color: '#f43f5e',
        text: `🎉 \x1b[32mPixel-Perfect Gate: PASSED. Menyerahkan ke Reno untuk automated push & MR!\x1b[0m`,
      });
      this.onAgentStatus('vani', 'Passed 99.8%', '#10b981');
      await this.sleep(1100);

      // 5. Camera to Reno (DevOps)
      this.onStepChange({ activeIndex: 5 });
      this.onCameraFocus('reno');
      this.onAgentStatus('reno', 'GitLab MR', '#22d3ee');

      this.onLog({
        sender: 'RENO',
        color: '#22d3ee',
        text: `📦 [DevOps Dispatcher] Membuat branch baru: \x1b[36mfeat/slicing-figma-${slug}\x1b[0m`,
      });
      await this.sleep(700);

      this.onLog({
        sender: 'RENO',
        color: '#22d3ee',
        text: `📝 git commit -m "feat(ui): slicing PaymentCard pixel-perfect from node ${slug}"`,
      });
      await this.sleep(700);

      this.onLog({
        sender: 'RENO',
        color: '#22d3ee',
        text: `🚀 git push origin feat/slicing-figma-${slug} ➔ GitLab repository \x1b[36m${repo.id}\x1b[0m`,
      });
      await this.sleep(900);

      const mrIid = Math.floor(Math.random() * 40) + 120;
      this.onLog({
        sender: 'RENO',
        color: '#22d3ee',
        text: `🎉 \x1b[32;1mGitLab Merge Request Dibuat: MR !${mrIid} [Ready for Review]\x1b[0m`,
      });
      this.onLog({
        sender: 'RENO',
        color: '#22d3ee',
        text: `🔗 URL: \x1b[34;4mhttps://gitlab.kantorraffa.internal/${repo.group}/${repo.id}/-/merge_requests/${mrIid}\x1b[0m`,
      });
      this.onAgentStatus('reno', 'MR Created', '#10b981');
      await this.sleep(1200);

      // Return camera to boss
      this.onCameraFocus('raffa');
      this.onLog({
        sender: 'SYSTEM',
        color: '#10b981',
        text: `🏁 \x1b[32;1mMisi Slicing Figma Selesai dengan Sukses! Semua agent kembali ke mode standby.\x1b[0m`,
      });

      this.onComplete({
        kind: 'FIGMA_SLICING',
        mrIid,
        branch: `feat/slicing-figma-${slug}`,
        repo: repo.id,
        precision: 99.8,
      });
    } catch (e) {
      if (e.message !== 'PIPELINE_ABORTED') {
        console.error(e);
      }
      this.onLog({ sender: 'SYSTEM', color: '#f43f5e', text: `🛑 Pipeline dihentikan.` });
    } finally {
      this.isRunning = false;
      this.resetAgentStatuses();
    }
  }

  /**
   * FITUR 2: Jira Multi-Repo Task Pipeline
   */
  async runJiraPipeline({ ticketKey, ticket: ticketInput, repoId, projectPath }) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.aborted = false;

    // Support passing ticket object directly or finding by key
    const ticket = typeof ticketInput === 'object' && ticketInput !== null
      ? ticketInput
      : TICKETS.find((t) => t.key === ticketKey) || TICKETS[0];
    const repo = REPO_MAP[repoId] || REPO_MAP[ticket.repo] || REPOS[0];
    const coderId = ticket.coder || 'jajang';
    const activeDir = projectPath || repo.id;

    this.onDiffChange({ files: ticket.files || [], activeIndex: 0, branch: `feat/${ticket.key.toLowerCase()}` });

    const steps = [
      { id: 'tara_triage', label: 'Tara: Jira Triage & AC', agent: 'tara' },
      { id: 'arga_arch', label: 'Arga: Architecture & Plan', agent: 'arga' },
      { id: 'coder_dev', label: `${coderId === 'jajang' ? 'jajang' : 'Kian'}: Implementation`, agent: coderId },
      { id: 'vani_qa', label: 'Vani: Linter & Vitest', agent: 'vani' },
      { id: 'reno_ops', label: 'Reno: Push MR & Update Jira', agent: 'reno' },
    ];

    this.onStepChange({
      kind: 'JIRA_EXECUTION',
      title: `${ticket.key}: ${ticket.summary}`,
      steps,
      activeIndex: 0,
    });

    try {
      // 1. Tara: Triage & Acceptance Criteria
      this.onStepChange({ activeIndex: 0 });
      this.onCameraFocus('tara');
      this.onAgentStatus('tara', 'Triaging', '#f59e0b');

      this.onLog({
        sender: 'TARA',
        color: '#f59e0b',
        text: `📋 [PM Triage] Membuka tiket Jira \x1b[1m${ticket.key}\x1b[0m (${ticket.type} · ${ticket.priority})`,
      });
      this.onLog({
        sender: 'TARA',
        color: '#f59e0b',
        text: `📁 Target Folder Eksekusi: \x1b[36m${activeDir}\x1b[0m`,
      });
      await this.sleep(800);

      this.onLog({
        sender: 'TARA',
        color: '#f59e0b',
        text: `📝 Memvalidasi Acceptance Criteria (INVEST guideline):`,
      });
      ticket.ac.forEach((item, i) => {
        this.onLog({ sender: 'TARA', color: '#f59e0b', text: `   [AC-${i + 1}] ✓ ${item}` });
      });
      await this.sleep(900);

      this.onLog({
        sender: 'TARA',
        color: '#f59e0b',
        text: `✅ Tiket tervalidasi. Mengalihkan ke Arga (Lead Architect) untuk technical breakdown.`,
      });
      this.onAgentStatus('tara', 'AC Passed', '#10b981');
      await this.sleep(1000);

      // 2. Arga: Architecture & Planning
      this.onStepChange({ activeIndex: 1 });
      this.onCameraFocus('arga');
      this.onAgentStatus('arga', 'Scanning', '#38bdf8');

      this.onLog({
        sender: 'ARGA',
        color: '#38bdf8',
        text: `🏗️  [Lead Architect] Scanning codebase tree & dependency graph \x1b[36m${repo.id}\x1b[0m...`,
      });
      await this.sleep(800);

      repo.paths.slice(0, 4).forEach((p) => {
        this.onLog({ sender: 'ARGA', color: '#38bdf8', text: `   📁 mapped: ${p}` });
      });
      await this.sleep(600);

      this.onLog({
        sender: 'ARGA',
        color: '#38bdf8',
        text: `📐 Menyusun Architectural Execution Plan:`,
      });
      ticket.plan.forEach((step, i) => {
        this.onLog({ sender: 'ARGA', color: '#38bdf8', text: `   Step ${i + 1}: ${step}` });
      });
      await this.sleep(800);

      this.onLog({
        sender: 'ARGA',
        color: '#38bdf8',
        text: `🎯 Menugaskan implementasi kepada \x1b[1m${coderId === 'jajang' ? 'jajang (Senior Frontend)' : 'Kian (Senior Backend)'}\x1b[0m.`,
      });
      this.onAgentStatus('arga', 'Plan Ready', '#10b981');
      await this.sleep(1000);

      // 3. Coder (jajang / Kian): Implementation
      this.onStepChange({ activeIndex: 2 });
      this.onCameraFocus(coderId);
      const coderColor = coderId === 'jajang' ? '#8b5cf6' : '#10b981';
      const coderName = coderId === 'jajang' ? 'jajang' : 'KIAN';
      this.onAgentStatus(coderId, 'Coding', coderColor);

      this.onLog({
        sender: coderName,
        color: coderColor,
        text: `💻 [Coder Execution] Mengambil spesifikasi arsitektur dari Arga. Memulai coding...`,
      });
      await this.sleep(800);

      ticket.files.forEach((f) => {
        this.onLog({
          sender: coderName,
          color: coderColor,
          text: `   ✏️  Modifikasi: \x1b[33m${f.path}\x1b[0m (${f.status})`,
        });
      });
      await this.sleep(1000);

      this.onLog({
        sender: coderName,
        color: coderColor,
        text: `✨ Kode selesai ditulis & di-format via prettier. Mengirimkan ke Vani (QA) untuk linter & testing suite.`,
      });
      this.onAgentStatus(coderId, 'Code Done', '#10b981');
      await this.sleep(1000);

      // 4. Vani: QA & Test Suites
      this.onStepChange({ activeIndex: 3 });
      this.onCameraFocus('vani');
      this.onAgentStatus('vani', 'Running Tests', '#f43f5e');

      this.onLog({
        sender: 'VANI',
        color: '#f43f5e',
        text: `🧪 [QA Sentinel] Menjalankan \x1b[1mOxlint + Vitest runner\x1b[0m pada repo \x1b[36m${repo.id}\x1b[0m...`,
      });
      await this.sleep(700);

      for (const t of ticket.tests) {
        this.onLog({
          sender: 'VANI',
          color: '#f43f5e',
          text: `   \x1b[32m✓\x1b[0m ${t} (ok)`,
        });
        await this.sleep(200);
      }

      this.onLog({
        sender: 'VANI',
        color: '#f43f5e',
        text: `✅ \x1b[32;1mTest Suites: ${ticket.tests.length} passed, 0 failed. Linter: 0 warnings. QA PASSED!\x1b[0m`,
      });
      this.onAgentStatus('vani', 'Tests Passed', '#10b981');
      await this.sleep(1100);

      // 5. Reno: DevOps Push & Jira Status Update
      this.onStepChange({ activeIndex: 4 });
      this.onCameraFocus('reno');
      this.onAgentStatus('reno', 'Deploying', '#22d3ee');

      const branchName = `feat/${ticket.key.toLowerCase()}`;
      const rcBranch = `rc/${ticket.key.toLowerCase()}`;
      this.onLog({
        sender: 'RENO',
        color: '#22d3ee',
        text: `🚀 [DevOps] Menginisialisasi Git Flow: branch \x1b[36m${branchName}\x1b[0m ➔ release: \x1b[33m${rcBranch}\x1b[0m`,
      });
      await this.sleep(600);

      // Inspect target folder remote URL if available
      let detectedRemote = null;
      let detectedProvider = 'Git';
      try {
        const inspectRes = await fetch(`/api/repo/local-inspect?path=${encodeURIComponent(activeDir)}`);
        if (inspectRes.ok) {
          const inspectData = await inspectRes.json();
          if (inspectData.remoteWebUrl) {
            detectedRemote = inspectData.remoteWebUrl;
            detectedProvider = inspectData.remoteProvider || 'Git';
          }
        }
      } catch (err) {
        // ignore network error
      }

      if (detectedRemote) {
        this.onLog({
          sender: 'RENO',
          color: '#22d3ee',
          text: `🔗 [Remote Sync] Terdeteksi remote link aktif: \x1b[32;1m${detectedRemote}\x1b[0m (${detectedProvider})`,
        });
        await this.sleep(700);

        this.onLog({
          sender: 'RENO',
          color: '#22d3ee',
          text: `📦 [Git Push] Sinkronisasi ke origin: \x1b[36mgit push origin ${branchName} ${rcBranch} ${targetBranch}\x1b[0m`,
        });
        await this.sleep(800);

        this.onLog({
          sender: 'RENO',
          color: '#22d3ee',
          text: `🎉 \x1b[32;1m${detectedProvider} Pull Request / MR Sinkron: ${detectedRemote}/pull/new/${rcBranch}\x1b[0m`,
        });
      } else {
        this.onLog({
          sender: 'RENO',
          color: '#22d3ee',
          text: `📦 git push origin ${branchName} ${rcBranch} ${targetBranch} ➔ \x1b[36m${repo.group || 'workspace'}/${repo.id}\x1b[0m`,
        });
        await this.sleep(800);

        const mrIid = Math.floor(Math.random() * 50) + 140;
        this.onLog({
          sender: 'RENO',
          color: '#22d3ee',
          text: `🎉 \x1b[32;1mMerge Request: !${mrIid} "${ticket.summary}" [Ready for Review]\x1b[0m`,
        });
      }
      await this.sleep(600);

      this.onLog({
        sender: 'RENO',
        color: '#22d3ee',
        text: `🔄 [Jira API] Update status tiket \x1b[1m${ticket.key}\x1b[0m ➔ \x1b[32mIN REVIEW\x1b[0m (PR/MR linked)`,
      });
      this.onAgentStatus('reno', 'MR Opened', '#10b981');
      await this.sleep(1200);

      // Return camera to Raffa
      this.onCameraFocus('raffa');
      this.onLog({
        sender: 'SYSTEM',
        color: '#10b981',
        text: `🏁 \x1b[32;1mPipeline ${ticket.key} Selesai! Semua tahap telah terverifikasi.\x1b[0m`,
      });

      this.onComplete({
        kind: 'JIRA_EXECUTION',
        ticketKey: ticket.key,
        repo: repo.id,
        mrIid,
        branch: branchName,
      });
    } catch (e) {
      if (e.message !== 'PIPELINE_ABORTED') {
        console.error(e);
      }
      this.onLog({ sender: 'SYSTEM', color: '#f43f5e', text: `🛑 Pipeline Jira dihentikan.` });
    } finally {
      this.isRunning = false;
      this.resetAgentStatuses();
    }
  }

  resetAgentStatuses() {
    ['tara', 'arga', 'jajang', 'kian', 'vani', 'reno'].forEach((id) => {
      this.onAgentStatus(id, 'Idle');
    });
  }
}
