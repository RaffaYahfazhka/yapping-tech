# Product Requirements Document (PRD)
## Kantor Raffa — Autonomous Virtual 3D Office & Mission Control (v2.6)
**Document Version:** 2.6.0  
**Target Execution Agent:** Claude 3.5 Sonnet / Opus 5.5  
**Author:** Raffa Yahfazhka  
**Status:** Approved for Implementation  

---

## 1. Executive Summary & Objective

**Kantor Raffa** adalah platform virtual 3D isometrik interaktif berbasis Next.js App Router, Three.js, dan Emotion CSS yang mensimulasikan lingkungan kantor autonomous AI software engineering. Raffa (The Boss) mendelegasikan tugas engineering ke 6 karyawan AI (Tara, Arga, Jajang, Kian, Vani, Reno) yang terhubung langsung dengan Jira Cloud, repositori Git lokal, dan tooling modern.

PRD ini merumuskan perbaikan menyeluruh (overhaul) pada:
1. **Music Player UI & Engine**: Transformasi widget dock menjadi floating trigger + full responsive Pop-up Modal, audio playback YouTube Music yang reliable tanpa silent throttle, dan sync counter durasi.
2. **Global Splash Screen**: Pengalaman opening profesional beranimasi saat aplikasi pertama kali dimuat.
3. **Penyempurnaan Seluruh Modal & Responsivitas**: Standardisasi ukuran, grid responsif (desktop, tablet, mobile), menghilangkan elemen cramped/tumpang tindih pada Mission Control & Subordinate Workspace.
4. **Local Repository Picker (Native Folder/File Picker)**: Menggantikan input text path manual dan preset static dengan input picker folder lokal (`webkitdirectory` / native directory selector) di Mission Control dan workspace Arga.
5. **Konfigurasi Git Flow Fleksibel pada Reno**:
   - Base branch dinamis: pilihan `main`, `dev`, `development`, dll.
   - Target branch dinamis: `dev`, `development`, dll.
   - Pola Release Branch otomatis mengadopsi nama branch fitur: jika feature branch `feat/{ticketKey}`, maka release branch otomatis menjadi `rc/{ticketKey}` (contoh: `feat/fds336` ➔ `rc/fds336`).
6. **Live Mockup Feature Execution**: 1 skenario mockup fitur nyata yang dapat dieksekusi langsung di folder `yapping-techflow` menggunakan orchestrator Antigravity.

---

## 2. Scope of Work & Feature Specifications

### Feature 1: Music Player Overhaul (Pop-up Modal & Reliable Audio)
#### Background & Problem
- Saat ini widget player memakan space di viewport bawah dan audio iframe sering di-throttle oleh browser security policies jika tidak di-render dalam visual context yang valid.
- Pengaturan volume, playlist, dan kontrol lagu perlu disatukan ke dalam **Pop-up Modal responsif**, sementara dock di layar utama cukup berupa floating mini pill / bubble indicator.

#### Requirements
1. **Floating Trigger Pill (Mini Dock)**:
   - Floating pill minimalis di sudut kiri bawah layar dengan artwork berputar, nama lagu berjalan (marquee jika panjang), tombol quick play/pause, dan tombol expand modal.
   - Posisi z-index aman dari prompt interaksi agen (`z-index: 70`).
2. **Music Player Modal (Pop-up Modal)**:
   - Modal pop-up dengan glassmorphism dark aesthetic, responsif di semua ukuran layar (Mobile 360px hingga Desktop 4K).
   - **Hero Section**: Album art besar dengan vinyl spin animation, title, artist, source badge (YouTube Music).
   - **Progress Bar & Time Display**: Scrubber yang bisa di-drag/klik untuk seek, label elapsed time (`0:00`) dan total duration (`3:16`) tanpa wrapping teks.
   - **Playback Controls**: Previous, Play/Pause, Next, Shuffle, Loop, Mute toggle, dan Smooth Volume Slider (0-100%).
   - **Playlist Drawer/Tabs**: List 58 lagu dari `USER_PLAYLIST` lengkap dengan cover thumbnail, indikator lagu aktif, dan input search lagu.
   - **Custom YouTube Input**: Field untuk memasukkan URL YouTube / YouTube Music custom dengan validasi instan.
3. **Audio Engine Reliability**:
   - Menggunakan IFrame API dengan penanganan event lengkap (`UNSTARTED`, `PLAYING`, `PAUSED`, `BUFFERING`, `CUED`).
   - Penanganan status `CUED (5)` agar langsung mengeksekusi playback saat user melakukan gesture play.
   - Host iframe YouTube di-render dengan dimensi valid (`200x200px`) di viewport (opacity ultra-rendah) sehingga terbebas dari throttling Chrome/Safari.

---

### Feature 2: Splash Screen Experience
#### Requirements
1. **Branded Initial Loader**:
   - Layar splash screen modern saat aset 3D Three.js dan API Jira sedang di-load.
   - Animasi logo/branding `KANTOR RAFFA v2.6 — Autonomous Mission Control`.
   - Progress bar dinamis (0% ke 100%) dengan status teks:
     - `Memuat aset 3D kantor...`
     - `Menginisialisasi AI Agents...`
     - `Menghubungkan Jira Cloud & Git local...`
     - `Siap masuk ke kantor!`
2. **Smooth Fade-out Transition**:
   - Begitu loading selesai, tombol "🚀 Masuk ke Kantor Raffa" aktif dengan efek pulse emerald.
   - Transisi fade-out halus membuka view isometric 3D office.

---

### Feature 3: Standardisasi Modal & UI Responsiveness
#### Problem
- Modal Mission Control dan Subordinate Workspace terasa sempit, font atau padding kekecilan/kegedean di resolusi tertentu, dan kartu tiket Jira kurang proporsional.

#### Requirements
1. **Modal Architecture Standard**:
   - Semua modal (`MissionControlModal`, `SubordinateModal`, `TeamDirectoryModal`, `MusicPlayerModal`) menggunakan ukuran viewport responsif:
     - Desktop: `max-width: 90vw` atau `1100px`, `max-height: 85vh`.
     - Mobile/Tablet: `width: 96vw`, `height: 92vh`, auto scroll vertikal dengan custom scrollbar halus.
2. **Mission Control Refinement**:
   - Layout dua kolom yang adaptif (List tiket di kiri, detail & action di kanan pada desktop; stacked pada mobile).
   - Kartu tiket Jira proporsional dengan badge status warna yang konsisten (`To Do`: Slate, `In Progress`: Blue, `In Review`: Amber, `Done`: Emerald).
   - Font scale yang konsisten menggunakan design system token (heading 16-18px, body 13-14px, mono badges 11-12px).

---

### Feature 4: Local Repository Directory Selector (Native Folder Picker)
#### Problem
- Pengguna tidak ingin mengetik path folder absolut (`/Users/...`) secara manual dan tidak ingin terpaku pada preset repositori palsu yang kaku.

#### Requirements
1. **Native Directory Picker**:
   - Ganti text input manual dengan tombol `📁 Pilih Folder Proyek di Komputer Anda`.
   - Menggunakan input HTML5 `<input type="file" webkitdirectory directory />` yang membuka dialog native file system OS (Finder di Mac / Explorer di Windows).
   - Menampilkan nama folder yang dipilih beserta status deteksi otomatis:
     - Path folder terdeteksi.
     - Deteksi file `package.json` / jenis proyek (Next.js, React, Node).
     - Deteksi status Git dan branch aktif (`dev`, `development`, dll.).
2. **Integrasi ke Arga & Mission Control**:
   - Workspace **Arga (Software Architect)** menghapus preset hardcode dan menggunakan komponen selector folder lokal yang sama.
   - Jika browser membatasi pembacaan full absolute path untuk keamanan, sediakan fallback auto-detect ke workspace aktif `yapping-techflow` dengan tombol 1-klik "Gunakan Workspace Saat Ini".

---

### Feature 5: Flexible Git Flow Automation & Remote Git Detection pada Reno (DevOps)
#### Problem
- Reno sebelumnya tidak mendeteksi remote link Git repositori (`remote.origin.url`), sehingga user tidak tahu apakah branch yang di-push akan tersinkronisasi ke repository nyata (seperti GitHub `https://github.com/RaffaYahfazhka/yapping-tech`).
- Eksekusi hanya berupa simulasi statis / copy-paste command tanpa tombol eksekusi langsung yang terintegrasi ke engine git lokal.

#### Requirements
1. **Auto-Detection Git Remote Repository**:
   - Reno secara otomatis mendeteksi konfigurasi link Git repositori dari folder lokal komputer (misal: `https://github.com/RaffaYahfazhka/yapping-tech.git`).
   - Mendeteksi provider remote (`GitHub` atau `GitLab`) dan status sinkronisasinya.
   - Menyediakan input URL remote untuk menghubungkan atau mengganti link remote secara instan.
2. **Dynamic Base & Target Branch**:
   - Input/Dropdown **Base Branch**: Pilihan cepat `main`, `dev`, `development`, atau custom branch name.
   - Input/Dropdown **Target Branch**: Pilihan cepat `dev`, `development`, `staging`, `main`.
3. **Dynamic Release Branch Convention**:
   - Release candidate branch otomatis mengikuti feature branch yang sedang dikerjakan.
   - Aturan: `feat/{ticketKey}` ➔ Release Branch: `rc/{ticketKey}` (contoh: `feat/tech-777` ➔ `rc/tech-777`).
4. **Direct Git Flow Execution & Push to Remote**:
   - Reno menyediakan tombol **"🦊 Eksekusi Langsung Git Flow & Push ke Remote"** yang langsung menjalankan:
     - Checkout & pull base branch
     - Create & commit feature branch
     - Create & merge release candidate branch (`rc/`)
     - Checkout target branch & merge release branch
     - Push ke remote origin GitHub / GitLab (`git push origin feat/... rc/... dev`)
   - Menampilkan link langsung menuju halaman pembuatan Pull Request / Merge Request di GitHub/GitLab.

---

### Feature 6: Executable Mockup Feature Scenario (Antigravity Orchestration)
#### Requirements
1. **Dedicated Demo Ticket**:
   - Buat 1 tiket spesifik: `TECH-777: Antigravity Autonomous Workflow Demonstration`.
   - Scope: Menjalankan slicing UI dan pipeline pengujian otomatis langsung di dalam repo `yapping-techflow`.
2. **Full Pipeline Steps Validation**:
   - **Step 1 (Tara)**: Verifikasi Acceptance Criteria & Sprint Goal.
   - **Step 2 (Arga)**: Verifikasi struktur arsitektur folder lokal `yapping-techflow` dan git branch `dev`.
   - **Step 3 (Jajang)**: Slicing mockup komponen UI (Emotion CSS) dengan skor presisi `> 99%`.
   - **Step 4 (Kian)**: Validasi API endpoint & data flow.
   - **Step 5 (Vani)**: Menjalankan automated test suite (mock pass).
   - **Step 6 (Reno)**: Generate Git Flow `feat/TECH-777` ➔ `rc/TECH-777` ➔ `dev`.
3. **Direct Execution**:
   - Pengguna dapat mengklik tombol "Eksekusi Otomatis Tiket Ini" di Mission Control dan menyaksikan pipeline HUD bergerak secara interaktif bersama pergerakan kamera 3D ke masing-masing meja agen.

---

## 3. Technical Architecture & File Impact Matrix

| Komponen / File | Peran & Perubahan |
|---|---|
| `src/components/music/MusicPlayerModal/MusicPlayerModal.tsx` | Redesign menjadi pop-up modal player utama (cover besar, responsive controls, search playlist, equalizer). |
| `src/components/music/MusicPlayerWidget/MusicPlayerWidget.tsx` | Menjadi floating mini-pill dock yang memicu pembukaan `MusicPlayerModal`. |
| `src/lib/engine/audioEngine.ts` | Mengoptimalkan event state YouTube Iframe API (autoplay unlock, cued trigger, timer polling). |
| `src/components/ui/SplashScreen/SplashScreen.tsx` | Komponen baru splash screen opening dengan animasi loading aset kantor Raffa. |
| `src/components/mission/LocalFolderSelector/LocalFolderSelector.tsx` | Penambahan upload file / folder input dialog (`webkitdirectory`) & quick-pick workspace aktif. |
| `src/components/SubordinateModal.tsx` | Refactor tab Arga (ganti preset dengan folder picker) & tab Reno (dynamic branch & format `rc/{featureBranch}`). |
| `src/components/mission/MissionControlModal/MissionControlModal.tsx` | Standardisasi proporsi, grid responsif tiket, dan integrasi folder picker baru. |
| `src/lib/data/tickets.ts` | Penambahan tiket mockup `TECH-777` untuk live run di `yapping-techflow`. |
| `src/app/page.tsx` | Integrasi state modal music baru, splash screen flow, dan sinkronisasi orchestrator. |

---

## 4. Acceptance Criteria (Definition of Done)

1. **Music Player**:
   - [ ] Musik YouTube dapat di-play dan di-pause secara konsisten saat tombol ditekan atau lagu dipilih.
   - [ ] Counter detik berjalan (`currentTime` dan `duration` bertambah saat audio berputar).
   - [ ] Pengaturan audio tampil elegan dalam bentuk pop-up modal yang responsif di mobile dan desktop.
2. **Splash Screen**:
   - [ ] Saat web dibuka, muncul splash screen loading modern dengan progress bar animasi sebelum masuk ke canvas 3D.
3. **Modal UI & Responsiveness**:
   - [ ] Semua modal tidak mengalami teks overflow, elemen tertimpa, atau ukuran terlalu sempit di berbagai breakpoint layar.
4. **Local Repository Selector**:
   - [ ] User dapat memilih folder via dialog pemilihan file/folder lokal komputer (tanpa wajib ketik path manual).
   - [ ] Sistem memvalidasi branch aktif (`dev` / `development`) secara otomatis.
5. **Reno Git Flow & Remote Integration**:
   - [ ] Base branch dan target branch dapat dipilih fleksibel.
   - [ ] Release branch secara otomatis terisi format `rc/{namaFeatureBranch}` (misal: `rc/fds336`).
   - [ ] Remote link git repositori (`https://github.com/RaffaYahfazhka/yapping-tech`) otomatis terdeteksi dari folder lokal aktif.
   - [ ] Reno dapat mengeksekusi langsung Git Flow dan melakukan push ke remote origin dengan 1 klik.
6. **Executable Mockup**:
   - [ ] Terdapat 1 skenario tiket siap uji (`TECH-777`) yang dapat langsung dijalankan dalam folder proyek `yapping-techflow`.
7. **Build Validation**:
   - [ ] Perintah `npm run build` berhasil tanpa error TypeScript atau lint warning kritis.

---

## 5. Execution Instructions for AI Agent (Opus 5.5 / Sonnet)

1. Jalankan pekerjaan secara berurutan sesuai fase teknis di atas.
2. Pertahankan arsitektur Next.js 16 App Router dan Three.js 3D canvas tanpa merusak fungsionalitas visual yang sudah ada.
3. Gunakan styling Emotion CSS / Vanilla CSS yang konsisten dengan tema dark glassmorphism neon-emerald Kantor Raffa.
4. Pastikan build selalu diverifikasi dengan `npm run build` sebelum finalisasi tugas.
