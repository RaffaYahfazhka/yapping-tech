# Kantor Raffa — Interactive 3D Virtual AI Office & Autonomous Mission Control

A full-featured Single Page Application (SPA) built with **Next.js (App Router)**, **Vanilla Three.js**, and modern **Vanilla CSS Glassmorphism**.

---

## 🚀 Menjalankan Aplikasi

Jalankan perintah berikut menggunakan **Yarn**:

```bash
# 1. Install dependencies
yarn install

# 2. Jalankan dev server (port 3000)
yarn dev

# 3. Atau build produksi
yarn build && yarn start
```

Buka peramban di [http://localhost:3000](http://localhost:3000).

---

## 🎮 Kontrol Pergerakan & Kamera ("Raffa - The Boss")

| Tombol / Mouse | Aksi | Keterangan |
|---|---|---|
| <kbd>W</kbd> / <kbd>↑</kbd> | Jalan ke **ATAS** layar | Screen-relative anti-inverted |
| <kbd>S</kbd> / <kbd>↓</kbd> | Jalan ke **BAWAH** layar | Screen-relative anti-inverted |
| <kbd>A</kbd> / <kbd>←</kbd> | Jalan ke **KIRI** layar | Screen-relative anti-inverted |
| <kbd>D</kbd> / <kbd>→</kbd> | Jalan ke **KANAN** layar | Screen-relative anti-inverted |
| <kbd>⇧ Shift</kbd> | Sprint (1.75× kecepatan) | Animasi walk-cycle dinamis |
| **Drag Mouse (Klik & Tahan)** | Geser Kamera (Pan) | Bebas menjelajahi seluruh area kantor |
| **Klik Meja / Agen** | Buka Workspace Karyawan | Membuka modal interaksi spesifik karyawan |
| <kbd>E</kbd> | Interaksi Kontekstual | Bicara dengan karyawan terdekat |
| <kbd>F</kbd> | Slicing Figma ke jajang | Workspace jajang (Figma ➔ Tailwind) |
| <kbd>J</kbd> | Mission Control | Workspace Jira & Git Flow |
| <kbd>T</kbd> | Toggle Terminal Drawer | Slide-over logs & Git Diff |
| <kbd>P</kbd> / <kbd>M</kbd> | Play / Pause / Mute | Audio widget YouTube Music (58 lagu) |
| <kbd>C</kbd> / **Double Click** | Center Kamera | Reset posisi fokus ke Raffa |
| **Scroll Mouse** | Zoom Kamera | Smooth isometric zoom (0.6× - 1.8×) |
| **Sistem Tabrakan** | Real Collision Detection | Karakter tidak tembus meja, pot tanaman, atau holotable |

---

## 🧠 6 AI Agents & Role

1. **Tara** — *Product Manager* (Jira Triage, INVEST Criteria Validation)
2. **Arga** — *Lead Architect* (Codebase Mapping, File Tree Scan, Architecture Planning)
3. **jajang** — *Senior Frontend Dev* (Figma Token Parsing, Tailwind/CSS Auto-tuning, Slicing)
4. **Kian** — *Senior Backend Specialist* (Schema DB, Prisma Migrations, Idempotency API)
5. **Vani** — *QA Sentinel & Guardian* (Oxlint, Vitest, Headless DOM vs Figma Raster Pixel-Diff Checker)
6. **Reno** — *DevOps Dispatcher* (Branching, Git Commit/Push, GitLab MR Generator, Jira API Updater)

---

## 🎨 Fitur Utama

### 1. Delegasi Slicing Figma ke jajang (Pixel-Perfect Loop)
- **Input**: Figma URL / Node ID (contoh: `https://www.figma.com/design/TRPL-App/Core?node-id=204-12`).
- **Target Repository**: Pilihan repo GitLab (`frontend-dashboard-v2`, `payment-service-gateway`, dll.).
- **Strict 100% Precision Gate**: Menolak deviasi tampilan layout atau tipografi.
- **Autonomous Feedback Loop**:
  1. Kamera pan ke meja **jajang** untuk ekstraksi spec Figma & generate kode komponen.
  2. Kamera pan ke meja **Vani (QA)**: Vani menjalankan raster pixel-diff checker.
  3. **Iterasi 1**: Vani mendeteksi skor presisi **84.2%** (deviasi padding tombol & letter spacing). Reject commit!
  4. Kamera kembali ke **jajang**: jajang auto-tune CSS/Tailwind live di terminal log.
  5. **Iterasi 2**: Vani re-check, presisi naik ke **99.8%** (Visual Regression Passed).
  6. Kamera beralih ke **Reno (DevOps)**: Reno membuat branch, commit, push ke GitLab, dan membuat Merge Request baru.

### 2. Multi-Repo Selection & Jira Ticket Execute (Mission Control `J`)
- Filter tiket Jira berdasarkan Repository GitLab (`core-apps`, `backend-services`, `shared-libs`).
- Triage tiket Jira lengkap dengan prioritas, story points, dan Acceptance Criteria.
- Pipeline sekuensial: **Tara ➔ Arga ➔ Coder (jajang/Kian) ➔ Vani ➔ Reno**.
- Slide-over **Terminal Drawer** dengan ANSI color streaming logs dan **Interactive Git Diff Viewer** (additions/deletions).

### 3. Integrated Audio Engine
- Terintegrasi dengan **YouTube IFrame Player API** memutar lagu **CHON — Pitch Dark** (`sF80I-TQiW0`).
- Floating retro-modern audio widget di pojok kiri bawah:
  - Album art vinyl spinning effect saat playing.
  - 9-bar reactive animated equalizer.
  - Volume slider (0–100%) dan tombol mute toggle.
