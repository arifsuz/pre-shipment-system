# Pre-Shipment Entry System (PSE)

## 🚀 Selamat Datang di PSE System

Selamat datang di **Pre-Shipment Entry System (PSE)**, sebuah solusi digital inovatif yang dirancang untuk menyederhanakan dan mengoptimalkan proses manajemen data pre-shipment di lingkungan industri manufaktur. Sistem ini memungkinkan pengguna untuk mengelola shipment, mengimpor data dari file Excel, membuat memo komersial, serta melacak status shipment dengan mudah dan efisien. PSE dibangun dengan fokus pada kemudahan penggunaan, keamanan data, dan skalabilitas, sehingga cocok untuk perusahaan yang ingin meningkatkan produktivitas operasional mereka.

---

## ⚠️ Disclaimer

Proyek ini adalah hasil freelance untuk demonstrasi dan portofolio. Ini bukan untuk penggunaan production langsung tanpa konfigurasi keamanan tambahan. Pastikan untuk mengatur environment variables dengan benar dan jangan gunakan kredensial default. Pengembang tidak bertanggung jawab atas penggunaan yang tidak tepat.

---

### 📋 Informasi Proyek Secara Singkat

PSE adalah aplikasi web full-stack yang terdiri dari backend API dan frontend user interface. Sistem ini mencakup fitur-fitur utama seperti:

- **Manajemen Shipment**: Membuat, mengedit, dan melacak shipment dengan status seperti Draft, In Process, dan Approved.
- **Import Data Excel**: Mengunggah dan memproses file Excel untuk mengisi data shipment secara otomatis, dengan dukungan multi-sheet dan validasi cerdas.
- **Memo Komersial**: Membuat dan mengelola memo PDF untuk dokumen komersial, termasuk perbandingan item antara shipment dan memo.
- **Manajemen Pengguna dan Perusahaan**: Sistem autentikasi berbasis role (Admin/Viewer), serta CRUD untuk pengguna dan perusahaan.
- **Dashboard Interaktif**: Tampilan real-time untuk statistik shipment, dengan filter dan navigasi yang intuitif.
- **Notifikasi**: Sistem notifikasi untuk pembaruan status atau peringatan penting.
- **Keamanan dan Validasi**: Middleware keamanan seperti CORS, rate limiting, dan validasi input menggunakan Zod.

Proyek ini menggunakan database MySQL dengan Prisma ORM untuk persistensi data, dan dirancang untuk deployment yang mudah di server lokal atau cloud. PSE mendukung bahasa Indonesia sebagai bahasa utama, dengan UI yang responsif dan user-friendly.

---

### 🏗️ Arsitektur dan Tech Stack

PSE mengadopsi arsitektur **client-server** dengan pemisahan yang jelas antara backend (API) dan frontend (UI). Ini memungkinkan pengembangan independen, skalabilitas, dan kemudahan maintenance. Berikut adalah breakdown tech stack:

#### Backend (API Server)
- **Runtime**: Node.js dengan TypeScript untuk type safety dan performa tinggi.
- **Framework**: Express.js – Ringan, fleksibel, dan cocok untuk API RESTful.
- **Database**: MySQL dengan Prisma ORM – ORM modern untuk query yang aman dan migrasi database otomatis.
- **Keamanan**: Helmet (header security), CORS, bcryptjs (hashing password), JWT (autentikasi), express-rate-limit (anti-DDoS).
- **Validasi**: Zod – Schema validation untuk input yang robust.
- **Upload & Processing**: Multer (file upload), xlsx (parsing Excel).
- **Lainnya**: Compression middleware, nodemon untuk development, dan dotenv untuk environment variables.

Arsitektur backend menggunakan pola **MVC (Model-View-Controller)** dengan service layer untuk logika bisnis, memastikan kode yang terorganisir dan testable.

#### Frontend (User Interface)
- **Framework**: React 19 dengan TypeScript – Komponen-based, performant, dan type-safe.
- **Build Tool**: Vite – Cepat, modern, dengan HMR (Hot Module Replacement) untuk development yang efisien.
- **Styling**: Tailwind CSS – Utility-first CSS untuk UI yang konsisten dan responsif.
- **Routing**: React Router DOM – Client-side routing untuk SPA (Single Page Application).
- **State Management**: React Context API – Sederhana untuk autentikasi dan state global.
- **HTTP Client**: Axios – Untuk komunikasi API dengan interceptors untuk autentikasi otomatis.
- **Form Handling**: React Hook Form dengan Zod resolver – Validasi form yang powerful.
- **UI Components**: Komponen custom (Button, Input) dengan Lucide React untuk ikon.
- **Lainnya**: Date-fns untuk manipulasi tanggal, clsx untuk conditional styling.

Frontend menggunakan arsitektur komponen modular, dengan hooks untuk state management dan services untuk API calls, memastikan kode yang reusable dan maintainable.

---

### ⚙️ Setup dan Instalasi

Ikuti langkah-langkah berikut untuk menjalankan PSE di mesin lokal Anda. Pastikan Anda memiliki Node.js (v18+), npm/yarn, dan MySQL terinstal.

#### 1. Clone Repository
```bash
git clone https://github.com/arifsuz/pre-shipment-system.git
cd pre-shipment-system
```

#### 2. Setup Backend
```bash
cd backend
npm install
```

- Copy file `.env.example` ke `.env` dan isi dengan konfigurasi Anda:
  ```
  DATABASE_URL="mysql://username:password@localhost:3306/your_db_name"
  JWT_SECRET="your-super-secret-jwt-key-here"
  JWT_EXPIRES_IN="7d"
  FRONTEND_URL="http://localhost:3000"
  PORT=5000
  NODE_ENV="development"
  ADMIN_PASSWORD="your-secure-admin-password"
  ```
- Jalankan migrasi database:
  ```bash
  npm run db:generate
  npm run db:push
  ```
- Buat admin user:
  ```bash
  npm run tsx src/scripts/createAdmin.ts
  ```
- Jalankan server development:
  ```bash
  npm run dev
  ```
  Server akan berjalan di `http://localhost:5000`.

#### 3. Setup Frontend
```bash
cd ../frontend
npm install
```

- Copy file `.env.example` ke `.env` dan isi:
  ```
  VITE_API_URL="http://localhost:5000/api"
  ```
- Jalankan development server:
  ```bash
  npm run dev
  ```
  Frontend akan berjalan di `http://localhost:3000`.

#### 4. Akses Aplikasi
- Buka browser dan kunjungi `http://localhost:3000`.
- Login dengan kredensial admin yang Anda set di `.env` (username: admin, password: sesuai ADMIN_PASSWORD).
- Pastikan backend dan frontend berjalan secara bersamaan.

#### Tips Troubleshooting
- Jika ada error database, pastikan MySQL running dan kredensial benar.
- Untuk production, gunakan `npm run build` di kedua folder, lalu deploy dengan PM2 atau Docker.
- Jika port konflik, ubah PORT di `.env`.

---

### 📖 Cara Penggunaan

PSE dirancang intuitif, tetapi berikut panduan langkah demi langkah untuk memaksimalkan penggunaan:

1. **Login**: Masukkan username/email dan password. Admin dapat mengelola semua fitur, Viewer hanya melihat data.

2. **Dashboard**: Lihat statistik shipment secara real-time. Klik kartu status untuk filter shipment terkait.

3. **Manajemen Shipment**:
   - **Buat Shipment Baru**: Klik "New Shipment" → Isi form atau upload Excel → Simpan sebagai Draft.
   - **Import Excel**: Klik "Import Excel" → Upload file → Sistem akan parse dan validasi data → Gunakan data yang dipilih.
   - **Edit Shipment**: Klik Edit pada shipment non-Approved → Update data → Simpan.
   - **Lihat Detail**: Klik shipment → Lihat items, status, dan relasi perusahaan.

4. **Memo Komersial**:
   - Dari detail shipment, klik "Create Memo" → Isi form (jenis barang, packing, dll.) → Input manual items → Check Data untuk validasi qty.
   - Jika qty match, Approve shipment; jika tidak, simpan sebagai In Process dan perbaiki.

5. **Manajemen Perusahaan & Pengguna**: Admin dapat CRUD perusahaan dan pengguna via menu sidebar.

6. **Notifikasi**: Cek notifikasi di header untuk update status atau peringatan.

Sistem mendukung pencarian, pagination, dan filter untuk kemudahan navigasi. Pastikan file Excel sesuai template untuk import yang sukses.

---

### 🔍 Inti Proyek: Fitur-Fitur Utama

PSE berfokus pada otomasi proses pre-shipment untuk mengurangi kesalahan manual:

- **Excel Parsing Service**: Mengurai file Excel multi-sheet, menggabungkan data, dan validasi otomatis – memungkinkan import cepat tanpa input manual.
- **Shipment Lifecycle Management**: Dari Draft hingga Approved, dengan status tracking dan pencegahan edit pada approved shipments.
- **Memo Generation & Validation**: Form interaktif untuk memo PDF, dengan diff checker untuk memastikan konsistensi qty antara shipment dan memo.
- **Authentication & Authorization**: JWT-based login dengan role-based access, memastikan keamanan data.
- **Dashboard Analytics**: Statistik real-time dengan visualisasi sederhana untuk overview operasional.

Inti PSE adalah mengintegrasikan data dari berbagai sumber (Excel, form manual) ke dalam workflow yang terstruktur, mengurangi waktu proses dan meningkatkan akurasi.

---

### 💡 Sistem Insights & Rekomendasi Pengembangan

PSE sudah solid sebagai MVP, tetapi untuk pengembangan lanjutan:

- **Skalabilitas**: Tambahkan caching (Redis) untuk query berat, atau migrasi ke microservices jika traffic tinggi.
- **Fitur Tambahan**: Integrasi email untuk notifikasi, export PDF untuk memo, atau API untuk integrasi ERP.
- **Keamanan**: Implementasi 2FA, audit logs, dan encryption untuk data sensitif.
- **UI/UX**: Tambahkan dark mode, internationalization, atau PWA untuk mobile access.
- **Testing**: Tambahkan unit tests (Jest) dan E2E tests (Cypress) untuk reliability.
- **Deployment**: Gunakan Docker untuk containerization, dan CI/CD dengan GitHub Actions.

Saran: Fokus pada feedback user untuk iterasi, dan monitor performa dengan tools seperti New Relic.

---

### 👨‍💻 Pengembang

Proyek ini dikembangkan oleh **Muhamad Nur Arif**, seorang full-stack developer yang passionate tentang teknologi web dan solusi bisnis. Dengan pengalaman di React, Node.js, dan database design, Arif berkomitmen untuk membangun aplikasi yang impactful dan user-centric.

Kunjungi portfolio saya di: [https://ariftsx.vercel.app/](https://ariftsx.vercel.app/) untuk melihat proyek lainnya dan kontak.