# Sistem Absensi Siswa Sekolah Backend

Backend API untuk **Sistem Absensi Siswa Sekolah** dibangun menggunakan Node.js, Express.js, Sequelize, dan MySQL.

## Teknologi yang Digunakan

* Node.js
* Express.js
* MySQL
* Sequelize ORM
* dotenv
* cors
* bcrypt
* jsonwebtoken (JWT)
* fastest-validator
* nodemon

---

## Cara Install dan Menjalankan

### 1. Clone & Masuk ke Folder Project
Pastikan Anda berada di direktori root backend (`d:\project-test-backend`).

### 2. Install Dependency
Jalankan perintah berikut untuk mengunduh seluruh package yang diperlukan:
```bash
npm install
```

### 3. Konfigurasi Environment Variable (`.env`)
Buat file `.env` di root project (atau salin dari `.env.example`). Isi konfigurasi database dan JWT:
```env
PORT=4000

DB_HOST=127.0.0.1
DB_PORT=3308
DB_NAME=db_absensi_sekolah
DB_USERNAME=root
DB_PASSWORD=

JWT_SECRET=sekolah_absensi_super_secret_jwt_2026
JWT_EXPIRES_IN=1d
```
*Catatan: Sesuaikan DB_PORT (default: 3306 atau 3308 sesuai setelan MySQL Laragon/XAMPP Anda).*

### 4. Membuat Database
Buat database kosong bernama `db_absensi_sekolah` melalui PhpMyAdmin, Laragon Database client, atau MySQL CLI:
```sql
CREATE DATABASE db_absensi_sekolah;
```

### 5. Jalankan Migration
Untuk membuat semua tabel dan relasi, jalankan perintah:
```bash
npx sequelize-cli db:migrate
```

### 6. Jalankan Seeder
Untuk mengisi database dengan akun Administrator default, guru, kelas, mata pelajaran, dan siswa dummy, jalankan perintah:
```bash
npx sequelize-cli db:seed:all
```

### 7. Jalankan Server
* **Mode Development (dengan Nodemon):**
  ```bash
  npm run dev
  ```
* **Mode Production:**
  ```bash
  npm start
  ```
Server akan berjalan di `http://localhost:4000`.

---

## Akun Default Hasil Seeder

1. **Admin**
   * **Email:** `admin@sekolah.com`
   * **Password:** `admin123`
   * **Role:** `admin`

2. **Guru**
   * **Email:** `budi@sekolah.com` (Budi Rahardjo, S.Pd.)
   * **Password:** `guru123`
   * **Role:** `teacher`

---

## Penggunaan Bearer Token

Untuk mengakses endpoint yang dilindungi (selain login), kirimkan token JWT di header request:
```text
Authorization: Bearer <TOKEN_JWT_HASIL_LOGIN>
```

---

## Daftar Endpoint & Contoh Request

### 1. Authentication
* **POST** `/api/auth/login`
  * **Body:**
    ```json
    {
      "email": "admin@sekolah.com",
      "password": "admin123"
    }
    ```
  * **Response Berhasil:**
    ```json
    {
      "status": 200,
      "message": "Login berhasil",
      "data": {
        "token": "ey...",
        "user": {
          "id": 1,
          "name": "Administrator",
          "email": "admin@sekolah.com",
          "role": "admin"
        }
      }
    }
    ```

### 2. Dashboard (Akses: Admin & Teacher)
* **GET** `/api/dashboard`
  * Mengambil data total siswa, kelas, guru, ringkasan absensi hari ini, daftar riwayat absensi terbaru, dan grafik mingguan.

### 3. CRUD Siswa (Akses GET: Admin & Teacher, CRUD lainnya: Admin)
* **GET** `/api/students`
  * Query params untuk search, filter, pagination, dan sorting:
    * `search`: `nis` atau `fullName` (contoh: `Ahmad`)
    * `classId`: `1` (filter berdasarkan kelas)
    * `gender`: `male` atau `female` (filter jenis kelamin)
    * `page`: `1`
    * `limit`: `10`
    * `sortBy`: `fullName`, `nis`, atau `createdAt`
    * `sortOrder`: `ASC` atau `DESC`
  * **Contoh Request:** `/api/students?search=Ahmad&classId=1&page=1&limit=10&sortBy=fullName&sortOrder=ASC`
* **GET** `/api/students/:id` (Detail Siswa)
* **POST** `/api/students`
  * **Body:**
    ```json
    {
      "nis": "102611",
      "fullName": "Rizky Ramadhan",
      "gender": "male",
      "classId": 1
    }
    ```
* **PUT** `/api/students/:id`
* **DELETE** `/api/students/:id`

### 4. CRUD Kelas (Akses GET: Admin & Teacher, CRUD lainnya: Admin)
* **GET** `/api/classes`
  * Query params: `search` (nama kelas, jurusan, wali kelas), `page`, `limit`, `sortBy`, `sortOrder`.
* **GET** `/api/classes/:id` (Detail kelas beserta daftar siswanya)
* **POST** `/api/classes`
  * **Body:**
    ```json
    {
      "name": "PPLG XI-3",
      "major": "Pengembangan Perangkat Lunak dan Gim",
      "grade": 11,
      "schoolYear": "2026/2027",
      "homeroomTeacher": "Dewi Sartika, S.Pd."
    }
    ```
* **PUT** `/api/classes/:id`
* **DELETE** `/api/classes/:id` *(tidak diizinkan jika kelas masih memiliki siswa)*

### 5. CRUD Mata Pelajaran (Akses GET: Admin & Teacher, CRUD lainnya: Admin)
* **GET** `/api/subjects`
  * Query params: `search` (kode, nama mapel), `teacherId`, `page`, `limit`, `sortBy`, `sortOrder`.
* **POST** `/api/subjects`
  * **Body:**
    ```json
    {
      "code": "PROG-11",
      "name": "Pemrograman Berorientasi Objek XI",
      "teacherId": 2
    }
    ```
* **PUT** `/api/subjects/:id`
* **DELETE** `/api/subjects/:id` *(tidak diizinkan jika sudah digunakan di absensi)*

### 6. CRUD Guru (Akses: Admin)
* **GET** `/api/teachers`
  * Query params: `search` (nama, nip, email), `page`, `limit`, `sortBy`, `sortOrder`.
* **POST** `/api/teachers`
  * **Body:**
    ```json
    {
      "name": "Eko Prasetyo, S.Kom.",
      "nip": "199201012020121003",
      "email": "eko@sekolah.com",
      "password": "guru123"
    }
    ```
* **PUT** `/api/teachers/:id` *(password opsional)*
* **DELETE** `/api/teachers/:id`

### 7. Fitur Absensi (Akses GET & POST: Admin & Teacher, PUT & DELETE: Admin atau Teacher Pembuat Absensi)
* **GET** `/api/attendances` (Riwayat Absensi)
  * Query params:
    * `search`: nama siswa atau NIS
    * `attendanceDate`: `2026-07-21` (filter tanggal spesifik)
    * `startDate` & `endDate`: `2026-07-01` & `2026-07-31` (filter rentang tanggal)
    * `classId`: `1` (filter kelas)
    * `subjectId`: `2` (filter mapel)
    * `status`: `present`, `permission`, `sick`, `absent` (filter status)
    * `teacherId`: `2` (filter pembuat absensi)
    * `page`, `limit`, `sortBy`, `sortOrder`
* **GET** `/api/attendances/:id` (Detail Absensi)
* **POST** `/api/attendances` (Batch Input Absensi)
  * **Body:**
    ```json
    {
      "classId": 1,
      "subjectId": 1,
      "attendanceDate": "2026-07-21",
      "attendances": [
        {
          "studentId": 1,
          "status": "present",
          "note": null
        },
        {
          "studentId": 2,
          "status": "sick",
          "note": "Demam"
        },
        {
          "studentId": 3,
          "status": "permission",
          "note": "Acara keluarga"
        }
      ]
    }
    ```
* **PUT** `/api/attendances/:id`
* **DELETE** `/api/attendances/:id`
