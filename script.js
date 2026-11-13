/**
 * Mengambil daftar buku dari REST API Node.js.
 * Untuk menjalankan, gunakan "npm.cmd start" lalu buka http://localhost:3000/buku.html
 */
document.addEventListener('DOMContentLoaded', () => {
  const wadahBuku = document.getElementById('daftar-buku');
  if (!wadahBuku) return; // Kode ini hanya berjalan pada halaman buku.html.

  const statusPesan = document.getElementById('status-pesan');
  const inputCari = document.getElementById('cari-buku');
  const filterKategori = document.getElementById('filter-kategori');
  const hargaRupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  });
  let semuaBuku = [];

  function buatParagraf(kelas, label, isi) {
    const paragraf = document.createElement('p');
    paragraf.className = kelas;
    const kuat = document.createElement('strong');
    kuat.textContent = `${label}: `;
    paragraf.append(kuat, document.createTextNode(String(isi)));
    return paragraf;
  }

  function tampilkanBuku(data) {
    wadahBuku.replaceChildren();
    if (data.length === 0) {
      const pesan = document.createElement('p');
      pesan.className = 'pesan-kosong';
      pesan.textContent = 'Tidak ada buku yang cocok dengan pencarian.';
      wadahBuku.append(pesan);
      return;
    }

    data.forEach((buku, urutan) => {
      const item = document.createElement('article');
      item.className = 'buku-item';

      const bagianJudul = document.createElement('div');
      bagianJudul.className = 'buku-header';
      const judul = document.createElement('h2');
      judul.textContent = `${urutan + 1}. ${buku.judul}`;
      const kategori = document.createElement('span');
      kategori.className = 'badge badge-kategori';
      kategori.textContent = buku.kategori;
      bagianJudul.append(judul, kategori);

      const detail = document.createElement('button');
      detail.type = 'button';
      detail.className = 'btn-detail';
      detail.textContent = 'Lihat Detail';
      detail.addEventListener('click', () => {
        alert(`Detail Buku:\n\nJudul: ${buku.judul}\nPenulis: ${buku.penulis}\nKategori: ${buku.kategori}\nHarga: ${hargaRupiah.format(buku.harga)}\nStok: ${buku.stok}\n\nDeskripsi:\n${buku.deskripsi}`);
      });

      item.append(
        bagianJudul,
        buatParagraf('buku-penulis', 'Penulis', buku.penulis),
        buatParagraf('buku-harga', 'Harga', hargaRupiah.format(buku.harga)),
        buatParagraf('buku-stok', 'Stok', `${buku.stok} buah`),
        buatParagraf('buku-deskripsi', 'Deskripsi', buku.deskripsi),
        detail,
      );
      wadahBuku.append(item);
    });
  }

  function terapkanFilter() {
    const cari = inputCari.value.trim().toLocaleLowerCase('id-ID');
    const kategori = filterKategori.value;
    const hasil = semuaBuku.filter(buku => {
      const teks = `${buku.judul} ${buku.penulis}`.toLocaleLowerCase('id-ID');
      return teks.includes(cari) && (kategori === 'semua' || buku.kategori === kategori);
    });
    tampilkanBuku(hasil);
  }

  async function ambilDataBuku() {
    statusPesan.textContent = 'Memuat buku dari REST API...';
    statusPesan.className = 'status-pesan loading';
    try {
      const respon = await fetch('/api/buku', { cache: 'no-store' });
      if (!respon.ok) throw new Error(`HTTP ${respon.status}`);
      const data = await respon.json();
      if (!Array.isArray(data)) throw new Error('Format data API salah.');
      semuaBuku = data;
      statusPesan.textContent = `Berhasil memuat ${semuaBuku.length} buku dari REST API.`;
      statusPesan.className = 'status-pesan sukses';
      terapkanFilter();
    } catch (error) {
      console.error('Gagal memuat daftar buku:', error);
      statusPesan.textContent = 'Gagal mengambil data buku. Jalankan npm.cmd start dan buka http://localhost:3000/buku.html, lalu muat ulang halaman.';
      statusPesan.className = 'status-pesan warning';
      wadahBuku.replaceChildren();
    }
  }

  inputCari.addEventListener('input', terapkanFilter);
  filterKategori.addEventListener('change', terapkanFilter);
  ambilDataBuku();
});
