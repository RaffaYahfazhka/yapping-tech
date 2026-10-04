# 🏢 Kantor Raffa — Interactive 3D Virtual AI Office & Autonomous Mission Control

Aplikasi virtual office 3D interaktif berbasis **Next.js (App Router)**, **Three.js**, dan **Tailwind CSS**. Kantor Raffa memungkinkan **Raffa (The Boss)** memimpin dan mendelegasikan pengerjaan software secara otonom kepada **6 AI Agent (Karyawan AI)** yang bekerja di meja masing-masing.

---

## 🤖 Mengenal 6 AI Agent (Karyawan Kantor Raffa)

Setiap karyawan AI memiliki spesialisasi dan tanggung jawab nyata dalam siklus pengerjaan software:

| Karyawan | Foto & Nama Lengkap | Posisi & Peran | Tugas Utama (Ringkas & Jelas) |
|---|---|---|---|
| **Khansaku** | ![Khansaku](/public/agents/khansaku.jpg) <br> **Khansaku Anindita** `EMP-001` | **Product Manager** (PM) | **Penyaring Tiket Jira.** Membaca requirement dari Jira, memvalidasi kriteria selesai (*Acceptance Criteria*), dan membagi prioritas kerja sprint. |
| **Arga** | ![Arga](/public/agents/arga.jpg) <br> **Arga Pratama** `EMP-002` | **Lead Architect** | **Perancang Struktur.** Membaca susunan file dan dependency proyek lokal, lalu merancang cetak biru (*blueprint*) sebelum kode mulai ditulis. |
| **Jajang** | ![Jajang](/public/agents/jajang.jpg) <br> **Jajang Sasmita** `EMP-003` | **Senior Frontend Dev** | **Tukang Slice UI & Styling.** Mengubah desain Figma menjadi komponen React + Tailwind CSS yang responsif, rapi, dan modern. |
| **Kian** | ![Kian](/public/agents/kian.jpg) <br> **Kian Wardhana** `EMP-004` | **Senior Backend Specialist** | **Ahli Database & API.** Merancang schema database (Prisma/PostgreSQL), membuat endpoint API, dan memastikan logika server aman. |
| **Vani** | ![Vani](/public/agents/vani.jpg) <br> **Vani Maharani** `EMP-005` | **QA Sentinel & Guardian** | **Penguji Kualitas (Tester).** Menjalankan automated test, linting, dan memeriksa apakah tampilan pixel sudah 100% presisi sesuai desain. |
| **Reno** | ![Reno](/public/agents/reno.jpg) <br> **Reno Alamsyah** `EMP-006` | **DevOps Dispatcher** | **Penyalur Deployment.** Mengelola branch Git, membuat Merge Request (MR), menjalankan pipeline CI/CD, dan mengupdate status Jira jadi selesai. |

> 👑 **Raffa Yahfazhka (The Boss / CEO)**: Komandan utama kantor yang mengarahkan task backlog Jira, memilih folder proyek, memantau simulasi terminal, dan mendengarkan YouTube Music sambil bekerja.

---

## 🔄 Bagaimana Cara Kerjanya? (Alur Kerja Otonom)

1. **Raffa Memilih Folder & Tiket**:
   Raffa membuka **Mission Control** (`J`), memilih folder proyek lokal lewat `SelectField`, dan sistem secara otomatis memvalidasi apakah branch aktif adalah **`dev`** atau **`development`**.
2. **Tara (PM)** melakukan validasi Acceptance Criteria tiket Jira.
3. **Arga (Architect)** memetakan file tree & dependency arsitektur.
4. **Jajang (Frontend) / Kian (Backend)** menulis kode implementasi atau slicing dari Figma.
5. **Vani (QA)** menguji test suite dan pixel diff hingga 100% lolos.
6. **Reno (DevOps)** melakukan commit dan push ke branch dev/Merge Request.

---

## ✨ Fitur-Fitur Terbaru (Update v2.5)

- 🪪 **Kartu Identitas Karyawan AI**: Modal direktori tim lengkap dengan foto profil photorealistic hasil generate AI, badge ID, departemen, dan keahlian masing-masing.
- 📁 **Target Folder Selector & Branch Dev Detection**:
  - `SelectField` untuk memilih folder lokal di komputer.
  - Memeriksa keabsahan repositori Git dan branch aktif.
  - Notifikasi otomatis jika branch belum beralih ke `dev` atau `development`, lengkap dengan tombol instan *checkout ke dev*.
- 🎵 **YouTube Music Player (58 Lagu Playlist Akun Raffa)**:
  - Floating player di sudut kiri bawah dengan animasi piringan hitam (*vinyl spin*).
  - Modal playlist berisi 58 lagu favorit dari playlist akun YouTube Music Raffa.
  - Fitur pencarian cepat lagu dan opsi memasukkan link YouTube kustom.
- ☀️🌙 **Dual Theme (Mode Terang & Gelap)**: Tampilan studio modern responsif di seluruh layar komputer, tablet, maupun mobile.
- ⚡ **Struktur Folder Modular & Ringan**:
  - Komponen dipisahkan secara rapi ke `src/components/ui/Button`, `Container`, `SelectField`, `Modal`, `Navbar`, dll.
  - Rute API terdedikasi di `src/app/api/repo/local-inspect` dan `src/app/api/jira/tickets`.

---

## 🎮 Kontrol Pergerakan & Shortcut

| Tombol | Fungsi |
|---|---|
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> atau Panah | Menggerakkan Raffa menjelajahi kantor (anti-inverted) |
| <kbd>Shift</kbd> | Berlari cepat (*Sprint*) |
| **Drag Mouse (Klik & Geser)** | Menggeser sudut pandang kamera 3D |
| **Klik Meja / Karakter** | Membuka meja kerja spesifik karyawan AI |
| <kbd>E</kbd> | Berbicara dengan karyawan AI terdekat |
| <kbd>F</kbd> | Buka workspace Slicing Figma (Jajang) |
| <kbd>J</kbd> | Buka Mission Control (Jira & Folder Picker) |
| <kbd>T</kbd> | Buka / Tutup Terminal Output & Git Diff Drawer |
| <kbd>P</kbd> / <kbd>M</kbd> | Play/Pause & Mute YouTube Music |
| <kbd>C</kbd> | Reset kamera kembali ke Raffa |
| <kbd>Esc</kbd> | Menutup modal yang sedang terbuka |

---

## 🚀 Cara Menjalankan Proyek

Pastikan Node.js dan Yarn sudah terpasang di komputer:

```bash
# 1. Jalankan development server
yarn dev

# 2. Buka di browser
# http://localhost:3000 (atau port yang tertera)
```

Untuk build produksi:
```bash
yarn build && yarn start
```
