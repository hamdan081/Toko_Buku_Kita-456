/**
 * Server Toko Buku Kita (Node.js 18+, tanpa package tambahan).
 * Jalankan: npm.cmd start (PowerShell) atau npm start (Command Prompt).
 * Website: http://localhost:3000
 * API:     http://localhost:3000/api/buku
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const TIPE_FILE = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
};
const FILE_PUBLIK = new Set(['index.html', 'buku.html', 'style.css', 'script.js', 'buku.jpg']);

class KesalahanInput extends Error {
  constructor(pesan, status = 400) {
    super(pesan);
    this.status = status;
  }
}

function kirimJson(res, status, data) {
  const isi = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(isi);
}

function bacaBuku(lokasiData) {
  const data = JSON.parse(fs.readFileSync(lokasiData, 'utf8'));
  if (!Array.isArray(data)) throw new Error('Isi buku.json harus berupa array.');
  return data;
}

function simpanBuku(lokasiData, data) {
  const sementara = `${lokasiData}.tmp`;
  fs.writeFileSync(sementara, JSON.stringify(data, null, 2) + '\n', 'utf8');
  fs.renameSync(sementara, lokasiData);
}

async function bacaBody(req) {
  const bagian = [];
  let ukuran = 0;
  for await (const potongan of req) {
    ukuran += potongan.length;
    if (ukuran > 1_000_000) throw new KesalahanInput('Data terlalu besar.', 413);
    bagian.push(potongan);
  }
  try {
    const body = JSON.parse(Buffer.concat(bagian).toString('utf8'));
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new Error('Bukan objek JSON');
    }
    return body;
  } catch {
    throw new KesalahanInput('Kirim objek JSON yang valid.');
  }
}

function periksaDataBuku(body) {
  const hasil = {};
  for (const field of ['judul', 'penulis', 'kategori']) {
    if (typeof body[field] !== 'string' || !body[field].trim() || body[field].trim().length > 120) {
      throw new KesalahanInput(`${field} wajib berupa teks (1–120 karakter).`);
    }
    hasil[field] = body[field].trim();
  }
  if (body.deskripsi !== undefined && (typeof body.deskripsi !== 'string' || body.deskripsi.length > 1000)) {
    throw new KesalahanInput('deskripsi harus berupa teks maksimal 1000 karakter.');
  }
  hasil.deskripsi = (body.deskripsi || '').trim();
  if (typeof body.harga !== 'number' || !Number.isFinite(body.harga) || body.harga < 0) {
    throw new KesalahanInput('harga wajib angka minimal 0.');
  }
  if (!Number.isSafeInteger(body.stok) || body.stok < 0) {
    throw new KesalahanInput('stok wajib bilangan bulat minimal 0.');
  }
  hasil.harga = body.harga;
  hasil.stok = body.stok;
  return hasil;
}

function buatServer({ dataFile = path.join(__dirname, 'buku.json'), publicDir = __dirname } = {}) {
  return http.createServer(async (req, res) => {
    try {
      const alamat = new URL(req.url, 'http://localhost');
      const rute = alamat.pathname;
      const cocokId = rute.match(/^\/api\/buku\/([1-9]\d*)\/?$/);

      // REST API: menampilkan, menambah, mengubah, dan menghapus buku.
      if (rute === '/api/buku' || rute === '/api/buku/' || cocokId) {
        const daftar = bacaBuku(dataFile);
        const id = cocokId ? Number(cocokId[1]) : null;
        if (id !== null && !Number.isSafeInteger(id)) {
          throw new KesalahanInput('ID buku tidak valid.');
        }
        const posisi = id === null ? -1 : daftar.findIndex(buku => buku.id === id);

        if (req.method === 'GET') {
          if (id === null) return kirimJson(res, 200, daftar);
          if (posisi === -1) return kirimJson(res, 404, { pesan: 'Buku tidak ditemukan.' });
          return kirimJson(res, 200, daftar[posisi]);
        }

        if (req.method === 'POST' && id === null) {
          const bukuBaru = periksaDataBuku(await bacaBody(req));
          const nomorBaru = Math.max(0, ...daftar.map(buku => buku.id)) + 1;
          const hasil = { id: nomorBaru, ...bukuBaru };
          daftar.push(hasil);
          simpanBuku(dataFile, daftar);
          res.setHeader('Location', `/api/buku/${nomorBaru}`);
          return kirimJson(res, 201, hasil);
        }

        if (req.method === 'PUT' && id !== null) {
          if (posisi === -1) return kirimJson(res, 404, { pesan: 'Buku tidak ditemukan.' });
          const baru = periksaDataBuku(await bacaBody(req));
          daftar[posisi] = { id, ...baru };
          simpanBuku(dataFile, daftar);
          return kirimJson(res, 200, daftar[posisi]);
        }

        if (req.method === 'DELETE' && id !== null) {
          if (posisi === -1) return kirimJson(res, 404, { pesan: 'Buku tidak ditemukan.' });
          daftar.splice(posisi, 1);
          simpanBuku(dataFile, daftar);
          res.writeHead(204);
          return res.end();
        }
        res.setHeader('Allow', id === null ? 'GET, POST' : 'GET, PUT, DELETE');
        return kirimJson(res, 405, { pesan: 'Metode HTTP tidak didukung untuk alamat ini.' });
      }

      if (rute.startsWith('/api/')) return kirimJson(res, 404, { pesan: 'Endpoint tidak ditemukan.' });

      // Website tetap 2 halaman; hanya file publik yang boleh diakses.
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { Allow: 'GET, HEAD' });
        return res.end('Metode tidak diizinkan.');
      }
      if (rute === '/favicon.ico') {
        res.writeHead(204);
        return res.end();
      }
      const namaFile = rute === '/' ? 'index.html' : rute.slice(1);
      if (!FILE_PUBLIK.has(namaFile)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Halaman tidak ditemukan.');
      }
      const konten = fs.readFileSync(path.join(publicDir, namaFile));
      res.writeHead(200, {
        'Content-Type': TIPE_FILE[path.extname(namaFile)],
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(req.method === 'HEAD' ? undefined : konten);
    } catch (error) {
      if (error.status) return kirimJson(res, error.status, { pesan: error.message });
      console.error('Kesalahan server:', error);
      return kirimJson(res, 500, { pesan: 'Terjadi kesalahan pada server.' });
    }
  });
}

if (require.main === module) {
  const PORT = Number(process.env.PORT) || 3000;
  const server = buatServer();
  server.on('error', error => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} sudah digunakan. Tutup server sebelumnya atau gunakan port lain.`);
    } else {
      console.error(error);
    }
    process.exitCode = 1;
  });
  server.listen(PORT, () => {
    console.log(`Toko Buku berjalan: http://localhost:${PORT}`);
    console.log(`REST API tersedia: http://localhost:${PORT}/api/buku`);
    console.log('Tekan Ctrl+C untuk menghentikan server.');
  });
}

module.exports = { buatServer };
