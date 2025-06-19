# Kodepos Extract JSON

Aplikasi sederhana berbasis Express.js untuk membaca file JSON berisi data kode pos, mengelompokkan kode pos berdasarkan kota, dan menghasilkan file output JSON yang sudah terurut.

## Fitur
- Membaca file JSON berisi data kode pos
- Mengelompokkan kode pos berdasarkan nama kota
- Mengurutkan kode pos dari yang terkecil hingga terbesar untuk setiap kota
- Menyimpan hasil output ke file baru di folder `output` pada root project
- Endpoint download file output via browser atau curl
- API endpoint mudah digunakan

## Struktur Data Input
File input berupa array JSON, contoh:

```json
[
  {
    "urban": "PULAU PANGGANG",
    "sub_district": "KEPULAUAN SERIBU UTARA",
    "city": "KEPULAUAN SERIBU",
    "province_code": "31",
    "postal_code": "14530"
  },
  {
    "urban": "ABEUK BUDI",
    "sub_district": "JULI",
    "city": "BIREUEN",
    "province_code": "11",
    "postal_code": "24251"
  }
]
```

## Struktur Data Output
File output akan berupa JSON dengan format:

```json
{
  "KEPULAUAN SERIBU": [
    "14530"
  ],
  "BIREUEN": [
    "24251",
    "24261"
  ]
}
```

## Cara Menjalankan

### 1. Instalasi
Pastikan Node.js sudah terpasang. Jalankan perintah berikut di terminal:

```bash
npm install
```

### 2. Menjalankan Server

```bash
node app.js
```

Server akan berjalan di `http://localhost:3000`.

### 3. Memproses File Input
Gunakan endpoint berikut untuk memproses file JSON:

#### Endpoint
```
POST /process
```

#### Request Body
Kirim JSON dengan properti `filePath` yang berisi path file input (boleh relatif atau absolut dari root project):

```json
{
  "filePath": "sample.json"
}
```

#### Contoh dengan curl
```bash
curl -X POST -H "Content-Type: application/json" -d "{\"filePath\":\"sample.json\"}" http://localhost:3000/process
```

#### Contoh dengan Postman
- Method: POST
- URL: `http://localhost:3000/process`
- Body: raw JSON

```
{
  "filePath": "sample.json"
}
```

### 4. Mendownload File Output
Setelah file diproses, file output akan berada di folder `output` pada root project.

#### Download via browser
Buka di browser:
```
http://localhost:3000/download/sample.json
```

#### Download via curl
```bash
curl -O http://localhost:3000/download/sample.json
```

### 5. Cek Folder Output
Semua file hasil akan otomatis tersimpan di folder `output` di root project. Jika folder tidak muncul, cek log terminal dan pastikan aplikasi berjalan di root project.

### 6. Endpoint Test
Untuk memastikan server berjalan:
```
GET /test
```
akan mengembalikan:
```json
{ "message": "Server is running" }
```

### 7. Troubleshooting
- Jika folder `output` tidak muncul, pastikan Anda menjalankan `node app.js` dari root project.
- Cek log terminal untuk pesan error saat proses penulisan file.
- Pastikan user yang menjalankan Node.js punya hak akses untuk membuat folder/file di root project.
- Jika file tidak bisa didownload, pastikan nama file benar dan file sudah ada di folder `output`.

---

**Lisensi:** Bebas digunakan untuk keperluan pembelajaran dan pengembangan. 