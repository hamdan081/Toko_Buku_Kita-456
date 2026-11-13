# Toko Buku Kita — Website + REST API

Proyek ini terdiri dari dua halaman (Beranda dan Daftar Buku) dan server REST API sederhana menggunakan **Node.js 18 atau lebih baru**. Tidak memerlukan Express, `npm install`, atau internet.

## Menjalankan di Antigravity IDE / VS Code (Windows)

1. Ekstrak ZIP, kemudian buka folder `latihan_1_web/toko-buku` di editor.
2. Pastikan Node.js sudah terpasang (cek dengan `node -v`).
3. Buka terminal pada folder **toko-buku** (folder tempat file `package.json`).
4. Pada terminal **PowerShell**, jalankan:

   ```powershell
   npm.cmd start
   ```

   Pada terminal **CMD**, bisa juga jalankan `npm start`.
5. Buka **http://localhost:3000** untuk beranda atau **http://localhost:3000/buku.html** untuk daftar buku.
6. Uji REST API di **http://localhost:3000/api/buku**.
7. Untuk menghentikan server, tekan `Ctrl+C`.

**Penting:** Jangan membuka `buku.html` lewat `file://` atau Live Server jika ingin mengakses REST API ini. Selalu gunakan alamat `localhost:3000` karena endpoint `/api/buku` disediakan oleh `server.js`.

## Endpoint REST API

| Metode | Alamat | Kegunaan |
|---|---|---|
| `GET` | `/api/buku` | Tampilkan semua buku |
| `GET` | `/api/buku/1` | Tampilkan buku berdasarkan ID |
| `POST` | `/api/buku` | Tambah buku baru |
| `PUT` | `/api/buku/1` | Ubah seluruh data buku ID 1 |
| `DELETE` | `/api/buku/1` | Hapus buku ID 1 |

Contoh tambah buku di PowerShell:

```powershell
$body = @{ judul = 'Belajar HTML'; penulis = 'Penulis Baru'; kategori = 'Teknologi'; harga = 50000; stok = 4; deskripsi = 'Buku latihan pemrograman web.' } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/api/buku -Method Post -ContentType 'application/json' -Body $body
```

Data disimpan ke `buku.json`, sehingga perubahan dari POST/PUT/DELETE akan tetap tersimpan. Form input di website belum disediakan; pengelolaan data bisa dilakukan lewat REST API.

## Menguji proyek

Di folder `toko-buku`, jalankan:

```powershell
npm.cmd test
```

Pengujian menggunakan data sementara, jadi tidak mengubah `buku.json` asli.

## Mengatasi error

- `npm.ps1 cannot be loaded`: gunakan `npm.cmd start` pada PowerShell.
- `ENOENT package.json`: pastikan terminal sudah berada di folder `toko-buku`, bukan folder induknya.
- `Port 3000 sudah digunakan`: hentikan server yang masih aktif atau jalankan `$env:PORT=3001; npm.cmd start` di PowerShell.
- Data buku tidak muncul: cek server masih aktif dan buka website melalui `http://localhost:3000/buku.html`.
