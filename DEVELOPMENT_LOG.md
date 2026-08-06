# HeraDigital - Development Log

Dokumen ini berisi rangkuman riwayat pembaruan, diskusi, dan keputusan desain yang telah kita lakukan pada sesi pengembangan, agar tidak hilang dan mudah dilacak di kemudian hari.

## Ringkasan Pembaruan (Agustus 2026)

### 1. Perombakan Desain Utama (Landing Page)
- **Tema Premium & Modern:** Mengubah UI lama menjadi tata letak berbasis *Tailwind CSS* yang lebih *sleek*, cerah, dan dinamis, dengan micro-animasi yang responsif.
- **Hero Section:** Menghapus desain kartu statis di bagian atas dan menggantinya dengan **animasi teks gradasi dinamis** yang menyoroti keunggulan server (misal: *Performance, Economy, Security, Management*).
- **Ikon Bendera:** Mengubah bendera bahasa Inggris dari Amerika Serikat (US) menjadi bendera Inggris Raya (UK/English), menyesuaikan *border* agar tidak terlalu tebal, dan merapikan mode *fill* membulat.

### 2. Fitur "Admin Suite" Add-on
- **Desain Pil (Badges):** Mengubah daftar panjang fitur Admin Suite (seperti *Admin management*, *Player management*, *Complex economic system*, dll) menjadi desain pil/tag (*flex-wrap*).
- **Pewarnaan Dinamis:** Setiap pil fitur diberikan warna garis tepi (*border*) dan *background* ungu muda yang elegan agar tidak monoton.

### 3. Migrasi Besar: Client Portal (SPA)
- **Penghapusan File Usang:** Menghapus file `public/client.html` yang sebelumnya menggunakan Vanilla JS kuno sepanjang lebih dari 3000 baris.
- **Peleburan ke React (`ClientPortal.jsx`):** Menggabungkan sistem *dashboard* klien sepenuhnya ke dalam React (`App.jsx`). Saat tombol "Portal" ditekan, halaman akan berganti tanpa *loading/reload* browser (Single Page Application).
- **Sinkronisasi UI/UX:** Memastikan Portal Klien menggunakan *Header* atas dan *Navbar* bawah yang sama persis dengan halaman muka. Skema warnanya juga diubah menjadi *light mode* (terang) menyesuaikan tema utama.
- **Perbaikan *Bug* Tampilan (Blank Screen):** Memperbaiki masalah halaman kosong di Portal yang disebabkan oleh kelas `animate-fade-up` (bertabrakan dengan *IntersectionObserver*) dan menghapus pembacaan data `sessionStorage` yang berpotensi *crash*.

### 4. Sistem Autentikasi (Login API)
- **Desain 2-Tab:** Memperbarui formulir login di Portal dengan dua tab keren di bagian atas ("User Login" dan "Admin Gateway") untuk berpindah mode dengan mudah.
- **Restorasi API Payload:** Memperbaiki sistem *login* ke *Google Apps Script* agar kembali menggunakan dua parameter aslinya: **Email Address** dan **License Key / Password**, sehingga API tidak menolak permintaan login (sebelumnya salah menggunakan input PIN tunggal).

---
*Dokumen ini dibuat secara otomatis pada akhir sesi diskusi untuk mengarsipkan pencapaian pengembangan.*
