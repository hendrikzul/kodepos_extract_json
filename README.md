# Kodepos Extract JSON

Aplikasi sederhana berbasis Express.js untuk memproses, menggabungkan, dan mengurutkan data kode pos dari file JSON, dilengkapi dengan antarmuka web yang mudah digunakan.

## Fitur
- **Antarmuka Web**: Akses semua fitur melalui browser.
- **Proses File Baru**: Membaca file JSON, mengelompokkan kode pos berdasarkan kota.
- **Tambah Data**: Menambahkan data ke file yang sudah ada, baik dari file lain maupun data JSON langsung.
- **Input Manual**: Tambahkan data kota & kodepos satu per satu, upload file JSON, atau upload file TXT dengan format baris per kota.
- **Pengurutan Otomatis**: Kode pos diurutkan dari terkecil ke terbesar untuk setiap kota.
- **Penyimpanan Terpusat**: Semua output disimpan di folder `/output`.
- **API Endpoints**: Tetap tersedia untuk penggunaan programatik (via `curl`, Postman, dll).

## Cara Menjalankan

### 1. Instalasi
Pastikan Node.js sudah terpasang. Jalankan perintah ini di terminal pada root folder project:
```bash
npm install
```

### 2. Menjalankan Server
```bash
node app.js
```
Server akan berjalan di `http://localhost:3000`.

### 3. Menggunakan Antarmuka Web
Buka browser dan kunjungi alamat:
```
http://localhost:3000
```
Anda akan menemukan menu/tab untuk:
- **Buat File Baru**: Proses file JSON atau input manual (dengan upload file JSON/TXT atau ketik manual)
- **Tambah ke File**: Tambahkan data ke file output yang sudah ada

#### **A. Proses File Baru dari Upload File JSON**
- Pilih file JSON (format array, lihat contoh di bawah)
- Klik "Proses File"
- Download hasilnya dengan tombol download

#### **B. Input Manual (Tiga Cara)**
1. **Ketik Nama Kota & Kodepos**: Masukkan nama kota dan daftar kodepos (pisahkan dengan koma atau titik koma), klik "Tambah ke Daftar".
2. **Upload File JSON**: Pilih file JSON (format array, lihat contoh di bawah), data akan digabungkan ke daftar.
3. **Upload File TXT**: Pilih file TXT dengan format baris per kota (lihat contoh di bawah), data akan digabungkan ke daftar.

Setelah daftar data siap, masukkan nama file output dan klik "Buat File dari Input Manual".

#### **C. Tambah Data ke File Output**
- Masukkan nama file output yang sudah ada
- Tambahkan data dari file lain (JSON) atau data JSON langsung (bisa satu objek atau array)
- Klik "Tambah Data"

#### **D. Download Hasil**
Setiap kali proses berhasil, tombol download akan muncul. Klik untuk mengunduh file hasil dari folder `/output`.

---

## Contoh Format File

### **1. Format File JSON (untuk upload di semua fitur)**
```json
[
  { "city": "BANDUNG", "postal_code": "40111" },
  { "city": "BANDUNG", "postal_code": "40112" },
  { "city": "SURABAYA", "postal_code": "60111" },
  { "city": "JAKARTA", "postal_code": "10110" }
]
```
- Boleh ada properti lain, yang diproses hanya `city` dan `postal_code`.

### **2. Format File TXT (untuk upload di input manual)**
Setiap baris: `nama kota` (boleh spasi) diikuti daftar kodepos dipisahkan koma atau titik koma.

```
Bandar lampung 35111, 35112, 35113, 35114
Kota baru 40001, 40002
Jakarta pusat 10110, 10120
```

---

## Penggunaan via API (Alternatif)

Semua fitur juga bisa diakses melalui API:
- **Proses File Baru**: `POST /process` (upload file JSON)
- **Tambah Data**: `POST /append`
- **Download File**: `GET /download/:filename`
- **Cek Server**: `GET /test`

#### Contoh dengan `curl`:
```bash
# Proses file baru (upload JSON)
curl -F "jsonFile=@sample.json" http://localhost:3000/process

# Tambah data dari file lain
curl -X POST -H "Content-Type: application/json" -d '{"fileName":"sample.json", "filePath":"tambahan.json"}' http://localhost:3000/append

# Download file output
curl -O http://localhost:3000/download/sample.json
```

## Troubleshooting
- **Folder `output` tidak muncul**: Pastikan Anda menjalankan `node app.js` dari root folder project dan memiliki hak akses untuk membuat folder.
- **Error di browser**: Cek log di terminal tempat server berjalan untuk melihat detail error.
- **File tidak ditemukan**: Pastikan path file yang Anda masukkan sudah benar relatif terhadap root folder project.

---

**Lisensi:** Bebas digunakan untuk keperluan pembelajaran dan pengembangan. 