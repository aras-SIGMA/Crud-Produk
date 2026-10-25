# Product Requirements Document (PRD): Fitur Kategori Produk

## 1. Executive Summary

- **Problem Statement**: Pengguna kesulitan mengelompokkan dan menemukan produk spesifik karena seluruh item tersaji dalam satu daftar datar tanpa klasifikasi.
- **Proposed Solution**: Menambahkan entitas `categories` yang berelasi `1:N` wajib terhadap `products`, dilengkapi fungsionalitas pembuatan kategori inline serta filter kategori pada antarmuka tabel produk.
- **Success Criteria**:
  - Endpoint API `/api/categories` dan `/api/products` merespons dalam waktu `< 200ms` untuk volume data hingga 1.000 item.
  - 100% produk baru dan produk yang diperbarui memiliki `category_id` valid yang terlindungi integritasnya melalui Foreign Key constraint database (`RESTRICT`).
  - Pengurangan waktu pencarian dan filter produk spesifik hingga 40% menggunakan filter kategori di UI.
  - Nilai skor Lighthouse Accessibility pada halaman aplikasi tetap `>= 90`.

---

## 2. User Experience & Functionality

- **User Personas**:
  - **Admin Toko**: Pengguna tunggal yang mengelola katalog barang dagangan, memasukkan data produk baru, dan mengorganisasi produk ke dalam kelompok tertentu.
- **User Stories**:
  - As an admin, I want to select an existing category or quickly create a new category inline directly from the product form, so that I can classify products without navigating away from the page.
  - As an admin, I want to see each product's category name in the product list table, so that I can identify the classification at a glance.
  - As an admin, I want to filter products by category via a dropdown selector, so that I can view only products belonging to a specific segment.
  - As an admin, I want to update a product's category when editing, so that product categorizations remain accurate over time.
- **Acceptance Criteria**:
  - **AC 1 (Pilihan & Pembuatan Kategori Inline)**:
    - Form produk memuat input `<select>` yang menampilkan semua kategori aktif dari `GET /api/categories`.
    - Di sebelah atau di bawah select, terdapat tombol / toggle input cepat "+ Kategori Baru" dengan kolom nama kategori dan tombol simpan.
    - Menyimpan kategori baru memicu `POST /api/categories`, menambahkan kategori ke daftar opsi, dan langsung memilih kategori tersebut.
  - **AC 2 (Integritas Relasi Wajib)**:
    - Request `POST /api/products` dan `PUT /api/products/:id` tanpa `category_id` yang valid harus mengembalikan respon HTTP status `400 Bad Request`.
    - Database menerapkan kolom `products.category_id INT NOT NULL` dengan Foreign Key ke `categories(id)` berskema `ON DELETE RESTRICT ON UPDATE CASCADE`.
  - **AC 3 (Penyajian Tabel Produk)**:
    - Tabel produk memuat kolom "Kategori" di antara kolom "Nama" dan "Deskripsi".
    - Data produk dari `GET /api/products` menyertakan kolom `category_name` hasil join dari tabel `categories`.
  - **AC 4 (Penyaringan / Filter)**:
    - Di atas tabel produk tersedia dropdown filter berisi "Semua Kategori" dan daftar kategori yang tersedia.
    - Saat opsi kategori dipilih, baris tabel tersaring menampilkan produk yang sesuai secara instan.
- **Non-Goals**:
  - Manajemen hierarki bertingkat (parent-child subkategori).
  - Halaman mandiri terpisah khusus untuk pengeditan nama (rename) atau penghapusan massal kategori.
  - Multi-kategori per produk (relasi Many-to-Many).

---

## 3. AI System Requirements

- *N/A (Fitur ini merupakan fitur aplikasi web relasional murni tanpa pemanfaatan model machine learning atau agen AI).*

---

## 4. Technical Specifications

- **Architecture Overview**:
  - **Frontend**: Next.js 14 Client Component (`app/page.js`) mengambil data kategori (`/api/categories`) dan produk (`/api/products`), mengelola state form inline, serta melakukan filtering tampilan produk.
  - **Backend API**: Next.js App Router Route Handlers (`/api/categories/route.js`, `/api/products/route.js`, `/api/products/[id]/route.js`) memvalidasi payload dan mengeksekusi parameterized query via pool `mysql2/promise`.
  - **Database**: MySQL pada Aiven Cloud menggunakan enkripsi SSL CA certificate (`ca.pem`).
- **Integration Points & Database Schema**:
  - **Tabel `categories`**:
    ```sql
    CREATE TABLE IF NOT EXISTS categories (
      id_categories INT AUTO_INCREMENT PRIMARY KEY,
      name_categories VARCHAR(225) NOT NULL
    );
    ```
  - **Tabel `products`**:
    ```sql
    ALTER TABLE products
    ADD COLUMN id_categories INT,
    ADD CONSTRAINT fk_products_categories
    FOREIGN KEY (id_categories) REFERENCES categories(id_categories);
    ```
  - **API Contract**:
    - `GET /api/categories`: Mengembalikan daftar kategori `[{ id_categories, name_categories }]`.
    - `POST /api/categories`: Menerima body `{ name_categories }` -> Mengembalikan `201 Created` `{ id_categories, name_categories }`.
    - `GET /api/products`: Mengembalikan `[{ id, name, description, price, id_categories, name_categories, created_at }]`.
    - `POST /api/products`: Menerima `{ name, description, price, id_categories }`.
    - `PUT /api/products/:id`: Menerima `{ name, description, price, id_categories }`.
- **Security & Privacy**:
  - Semua query database menggunakan prepared statements (`?` placeholder) guna mencegah SQL Injection.
  - Validasi ketat pada backend: nama produk, nama kategori (1-100 karakter, trim whitespace), harga `>= 0`, dan eksistensi `category_id`.
  - Kredensial database tetap dienkripsi dan diproteksi di `.env.local` / Vercel Environment Variables.

---

## 5. Risks & Roadmap

- **Phased Rollout**:
  - **MVP (Cakupan Saat Ini)**:
    - Skema database `categories` dan migrasi aman `products.category_id`.
    - Endpoint `/api/categories` (`GET`, `POST`).
    - Penyesuaian endpoint `/api/products` (`GET` join kategori, `POST`/`PUT` simpan `category_id`).
    - Antarmuka form produk (dropdown kategori + input inline kategori baru) dan filter tabel produk.
  - **v1.1**:
    - Modal edit dan hapus kategori (dengan proteksi penolakan jika kategori masih digunakan produk).
  - **v2.0**:
    - Multi-kategori atau tag produk, serta visualisasi grafik distribusi produk per kategori.
- **Technical Risks & Mitigations**:
  - **Risk**: Migrasi database di Aiven gagal bila data `products` lama belum memiliki relasi `category_id`.
    - *Mitigasi*: Menyiapkan script migrasi bertahap yang mengisi data lama dengan kategori default ('Umum') sebelum menetapkan aturan `NOT NULL` & Foreign Key constraint.
  - **Risk**: Duplikasi nama kategori saat input cepat.
    - *Mitigasi*: Kolom `categories.name` diberi constraint `UNIQUE` dan backend menangani error `ER_DUP_ENTRY` dengan pesan ramah (HTTP 409).
