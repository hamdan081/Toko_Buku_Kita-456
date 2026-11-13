const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { buatServer } = require('../server');

const contoh = {
  judul: 'Buku Baru',
  penulis: 'Penulis Uji',
  harga: 45000,
  kategori: 'Teknologi',
  deskripsi: 'Untuk mengetes REST API.',
  stok: 3,
};

test('website dan REST API buku berjalan', async (t) => {
  const direktori = fs.mkdtempSync(path.join(os.tmpdir(), 'toko-buku-test-'));
  const dataFile = path.join(direktori, 'buku.json');
  fs.writeFileSync(dataFile, JSON.stringify([{ id: 1, ...contoh }]));
  const server = buatServer({ dataFile });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const alamat = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    fs.rmSync(direktori, { recursive: true, force: true });
  });

  await t.test('halaman utama dan halaman daftar buku dapat dibuka', async () => {
    const halaman = await fetch(alamat);
    assert.equal(halaman.status, 200);
    assert.match(await halaman.text(), /Selamat Datang di Toko Buku Kita/);
    const katalog = await fetch(`${alamat}/buku.html`);
    assert.equal(katalog.status, 200);
    assert.match(await katalog.text(), /\/api\/buku/);
    assert.equal((await fetch(`${alamat}/style.css`)).status, 200);
    assert.equal((await fetch(`${alamat}/script.js`)).status, 200);
  });

  await t.test('GET semua buku dan GET berdasarkan ID', async () => {
    const daftar = await (await fetch(`${alamat}/api/buku`)).json();
    assert.equal(daftar.length, 1);
    assert.equal(daftar[0].judul, contoh.judul);
    const satu = await (await fetch(`${alamat}/api/buku/1`)).json();
    assert.equal(satu.id, 1);
  });

  await t.test('POST data baru tersimpan', async () => {
    const jawab = await fetch(`${alamat}/api/buku`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contoh),
    });
    assert.equal(jawab.status, 201);
    const baru = await jawab.json();
    assert.equal(baru.id, 2);
    assert.equal(bacaFile().length, 2);
  });

  await t.test('PUT mengubah buku', async () => {
    const jawab = await fetch(`${alamat}/api/buku/2`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...contoh, judul: 'Judul Diperbarui' }),
    });
    assert.equal(jawab.status, 200);
    assert.equal((await jawab.json()).judul, 'Judul Diperbarui');
    assert.equal(bacaFile()[1].judul, 'Judul Diperbarui');
  });

  await t.test('DELETE menghapus buku', async () => {
    const jawab = await fetch(`${alamat}/api/buku/2`, { method: 'DELETE' });
    assert.equal(jawab.status, 204);
    assert.equal(bacaFile().length, 1);
  });

  await t.test('validasi input, data tidak ditemukan, dan file tersembunyi', async () => {
    const salah = await fetch(`${alamat}/api/buku`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...contoh, stok: -10 }),
    });
    assert.equal(salah.status, 400);
    assert.equal((await fetch(`${alamat}/api/buku/999`)).status, 404);
    assert.equal((await fetch(`${alamat}/package.json`)).status, 404);
    assert.equal((await fetch(`${alamat}/buku.json`)).status, 404);
    assert.equal((await fetch(`${alamat}/api/tidak-ada`)).status, 404);
  });

  function bacaFile() { return JSON.parse(fs.readFileSync(dataFile, 'utf8')); }
});
