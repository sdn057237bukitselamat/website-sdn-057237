/**
 * SDN 057237 BUKIT SELAMAT - OFFICIAL JAVASCRIPT
 * Interaktivitas Navigasi, Galeri Lightbox, Filter Berita & Guru, Animasi Counter, dan Formulir Kontak
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initBackToTop();
  initStatCounters();
  initGalleryLightbox();
  initFilterTabs();
  initSearch();
  initFaqAccordion();
  initContactForm();
  initLiveClock();
  initAttendanceSystem();
});

/* ==========================================================================
   1. Navigasi & Mobile Menu
   ========================================================================== */
function initNavbar() {
  const header = document.querySelector('.header');
  const toggleBtn = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

  // Sticky navbar shadow effect on scroll
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // Mobile menu toggle
  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navMenu.classList.toggle('open');
      const isExpanded = navMenu.classList.contains('open');
      toggleBtn.setAttribute('aria-expanded', isExpanded);
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
        navMenu.classList.remove('open');
      }
    });

    // Close menu when a link is clicked
    const navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
      });
    });
  }
}

/* ==========================================================================
   2. Back to Top Button
   ========================================================================== */
function initBackToTop() {
  const backBtn = document.querySelector('.back-to-top');
  if (!backBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backBtn.classList.add('show');
    } else {
      backBtn.classList.remove('show');
    }
  });

  backBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/* ==========================================================================
   3. Counter Animasi Statistik
   ========================================================================== */
function initStatCounters() {
  const counterElements = document.querySelectorAll('.stat-number');
  if (counterElements.length === 0) return;

  let hasRun = false;

  const startCounters = () => {
    counterElements.forEach(counter => {
      const target = +counter.getAttribute('data-target');
      if (!target) return;

      const duration = 1500; // ms
      const step = Math.ceil(target / (duration / 20));
      let current = 0;

      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          counter.textContent = target;
          clearInterval(timer);
        } else {
          counter.textContent = current;
        }
      }, 20);
    });
  };

  // Trigger when in viewport
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasRun) {
        hasRun = true;
        startCounters();
      }
    });
  }, { threshold: 0.2 });

  const statsSection = document.querySelector('.stats-section');
  if (statsSection) {
    observer.observe(statsSection);
  } else {
    // Fallback direct run
    startCounters();
  }
}

/* ==========================================================================
   4. Galeri Lightbox (Modal Perbesar Gambar)
   ========================================================================== */
function initGalleryLightbox() {
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.querySelector('.lightbox');
  if (!lightbox) return;

  const lightboxImg = lightbox.querySelector('.lightbox-img');
  const lightboxCaption = lightbox.querySelector('.lightbox-caption');
  const closeBtn = lightbox.querySelector('.lightbox-close');

  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      const caption = item.querySelector('.gallery-caption')?.textContent || 'Galeri SDN 057237';
      if (img && lightboxImg) {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || caption;
      }
      if (lightboxCaption) {
        lightboxCaption.textContent = caption;
      }
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // ESC key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });
}

/* ==========================================================================
   5. Filter Tabs (Guru, Berita, Galeri)
   ========================================================================== */
function initFilterTabs() {
  const tabGroups = document.querySelectorAll('.filter-tabs');

  tabGroups.forEach(group => {
    const buttons = group.querySelectorAll('.filter-btn');
    const targetType = group.getAttribute('data-target'); // e.g. 'guru', 'berita', 'galeri'

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all buttons in group
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterValue = btn.getAttribute('data-filter');
        const items = document.querySelectorAll(`[data-${targetType}-category]`);

        items.forEach(item => {
          const category = item.getAttribute(`data-${targetType}-category`);
          if (filterValue === 'all' || category === filterValue || category?.includes(filterValue)) {
            item.style.display = '';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  });
}

/* ==========================================================================
   6. Fitur Pencarian Berita
   ========================================================================== */
function initSearch() {
  const searchInput = document.querySelector('#searchNewsInput');
  if (!searchInput) return;

  const newsCards = document.querySelectorAll('.news-card');

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();

    newsCards.forEach(card => {
      const title = card.querySelector('.news-title')?.textContent.toLowerCase() || '';
      const excerpt = card.querySelector('.news-excerpt')?.textContent.toLowerCase() || '';
      const category = card.querySelector('.news-badge')?.textContent.toLowerCase() || '';

      if (title.includes(query) || excerpt.includes(query) || category.includes(query)) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  });
}

/* ==========================================================================
   7. FAQ Accordion Toggle
   ========================================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (!questionBtn) return;

    questionBtn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all other items
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
        }
      });

      // Toggle current item
      if (isActive) {
        item.classList.remove('active');
      } else {
        item.classList.add('active');
      }
    });
  });
}

/* ==========================================================================
   8. Formulir Kontak & Validasi
   ========================================================================== */
function initContactForm() {
  const form = document.querySelector('#schoolContactForm');
  const alertBox = document.querySelector('#contactAlert');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.querySelector('#senderName')?.value.trim();
    const email = form.querySelector('#senderEmail')?.value.trim();
    const subject = form.querySelector('#messageSubject')?.value.trim();
    const message = form.querySelector('#senderMessage')?.value.trim();

    if (!name || !email || !message) {
      alert('Mohon lengkapi Nama, Email, dan Pesan Anda.');
      return;
    }

    // Tampilkan notifikasi sukses simulasi
    if (alertBox) {
      alertBox.style.display = 'flex';
      alertBox.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>Terima kasih, <strong>${name}</strong>! Pesan Anda telah berhasil dikirim ke pihak SDN 057237 Bukit Selamat. Kami akan segera menghubungi Anda kembali melalui email <strong>${email}</strong>.</span>
      `;
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      alert(`Terima kasih, ${name}! Pesan Anda telah berhasil dikirim.`);
    }

    form.reset();
  });
}

/* ==========================================================================
   9. Live Digital Clock (Jam & Tanggal Real-time)
   ========================================================================== */
function initLiveClock() {
  const clockTime = document.getElementById('liveClockTime');
  const clockDate = document.getElementById('liveClockDate');
  if (!clockTime && !clockDate) return;

  const updateClock = () => {
    const now = new Date();
    
    // Format WIB Time (HH:mm:ss)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    if (clockTime) clockTime.textContent = `${hours}:${minutes}:${seconds} WIB`;

    // Format Indonesian Date (Hari, DD MMMM YYYY)
    if (clockDate) {
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const dayName = days[now.getDay()];
      const day = now.getDate();
      const monthName = months[now.getMonth()];
      const year = now.getFullYear();
      clockDate.textContent = `${dayName}, ${day} ${monthName} ${year}`;
    }
  };

  updateClock();
  setInterval(updateClock, 1000);
}

/* ==========================================================================
   10. Sistem Absensi Guru & Pegawai
   ========================================================================== */
// Master Data 14 Guru & Pegawai SDN 057237 Bukit Selamat
const DAFTAR_GURU_PEGAWAI = [
  { id: "1", nama: "H. Supardi, S.Pd., M.Pd.", nip: "19740512 199803 1 004", jabatan: "Kepala Sekolah" },
  { id: "2", nama: "Hj. Maryati, S.Pd.", nip: "19780814 200501 2 008", jabatan: "Guru Kelas I" },
  { id: "3", nama: "Ahmad Zulkarnain, S.Pd.", nip: "19851120 201101 1 012", jabatan: "Guru Kelas II" },
  { id: "4", nama: "Dewi Sartika, S.Pd.", nip: "19880615 201402 2 009", jabatan: "Guru Kelas III" },
  { id: "5", nama: "Nurhaliza, S.Pd.", nip: "19890403 201903 2 015", jabatan: "Guru Kelas IV / Koord. P5" },
  { id: "6", nama: "Siti Rahmah, S.Pd.", nip: "19870210 201001 2 011", jabatan: "Guru Kelas V / Bendahara BOS" },
  { id: "7", nama: "Hendra Wijaya, S.Pd.", nip: "19820925 200801 1 007", jabatan: "Guru Kelas VI" },
  { id: "8", nama: "Drs. M. Ridwan Lubis", nip: "19750319 200212 1 005", jabatan: "Guru Pend. Agama Islam (PAI)" },
  { id: "9", nama: "Fitri Handayani, S.Pd.", nip: "19930418 202121 2 004", jabatan: "Guru Pend. Agama Islam (PAI)" },
  { id: "10", nama: "Bambang Irawan, S.Pd.", nip: "19920108 202221 1 003", jabatan: "Guru PJOK / Pembina Pramuka" },
  { id: "11", nama: "Sri Wahyuni, S.Pd.", nip: "19901202 201902 2 010", jabatan: "Guru Bahasa Inggris / Mulok" },
  { id: "12", nama: "Syahrial, S.Pd.", nip: "19940822 202221 1 002", jabatan: "Guru Pendamping Khusus / Inklusi" },
  { id: "13", nama: "Rian Anggara, A.Md.", nip: "19910515 201601 1 006", jabatan: "Operator Dapodik & Tata Usaha" },
  { id: "14", nama: "Joko Susilo", nip: "-", jabatan: "Petugas Kebersihan & Keamanan" }
];

function initAttendanceSystem() {
  const form = document.getElementById('formAbsensi');
  const pegawaiSelect = document.getElementById('pegawaiSelect');
  const nipInput = document.getElementById('nipInput');
  const jabatanInput = document.getElementById('jabatanInput');
  const tableBody = document.getElementById('tabelAbsensiBody');
  const filterBtns = document.querySelectorAll('.filter-btn-absensi');
  const printBtn = document.getElementById('btnCetakAbsensi');
  const resetBtn = document.getElementById('btnResetAbsensi');
  const alertBox = document.getElementById('absensiAlert');

  if (!tableBody) return; // Not on absensi page

  // Populate Dropdown
  if (pegawaiSelect) {
    DAFTAR_GURU_PEGAWAI.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.nama} (${p.jabatan})`;
      pegawaiSelect.appendChild(opt);
    });

    pegawaiSelect.addEventListener('change', () => {
      const selected = DAFTAR_GURU_PEGAWAI.find(p => p.id === pegawaiSelect.value);
      if (selected) {
        if (nipInput) nipInput.value = selected.nip;
        if (jabatanInput) jabatanInput.value = selected.jabatan;
      } else {
        if (nipInput) nipInput.value = '';
        if (jabatanInput) jabatanInput.value = '';
      }
    });
  }

  // Load from LocalStorage or seed default data
  const storageKey = 'sdn057237_absensi_data';
  let absensiRecords = [];
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      absensiRecords = JSON.parse(saved);
    }
  } catch (err) {
    console.warn('LocalStorage error:', err);
  }

  // If empty, generate realistic seed records for today
  if (!absensiRecords || absensiRecords.length === 0) {
    absensiRecords = [
      {
        nama: "H. Supardi, S.Pd., M.Pd.",
        nip: "19740512 199803 1 004",
        jabatan: "Kepala Sekolah",
        waktu: "07.05 WIB",
        status: "hadir",
        keterangan: "Memimpin brefing pagi dewan guru"
      },
      {
        nama: "Hj. Maryati, S.Pd.",
        nip: "19780814 200501 2 008",
        jabatan: "Guru Kelas I",
        waktu: "07.12 WIB",
        status: "hadir",
        keterangan: "Mengajar pembelajaran tematik pagi"
      },
      {
        nama: "Ahmad Zulkarnain, S.Pd.",
        nip: "19851120 201101 1 012",
        jabatan: "Guru Kelas II",
        waktu: "07.15 WIB",
        status: "hadir",
        keterangan: "Mengajar di kelas"
      },
      {
        nama: "Nurhaliza, S.Pd.",
        nip: "19890403 201903 2 015",
        jabatan: "Guru Kelas IV / Koord. P5",
        waktu: "07.18 WIB",
        status: "hadir",
        keterangan: "Piket kebersihan gerbang & mengajar"
      },
      {
        nama: "Drs. M. Ridwan Lubis",
        nip: "19750319 200212 1 005",
        jabatan: "Guru Pend. Agama Islam (PAI)",
        waktu: "07.20 WIB",
        status: "hadir",
        keterangan: "Pembinaan sholat Dhuha bersama siswa"
      },
      {
        nama: "Bambang Irawan, S.Pd.",
        nip: "19920108 202221 1 003",
        jabatan: "Guru PJOK / Pembina Pramuka",
        waktu: "07.22 WIB",
        status: "hadir",
        keterangan: "Senam pagi & olahraga siswa"
      },
      {
        nama: "Dewi Sartika, S.Pd.",
        nip: "19880615 201402 2 009",
        jabatan: "Guru Kelas III",
        waktu: "07.25 WIB",
        status: "izin",
        keterangan: "Izin keperluan keluarga mendesak (Surat terlampir)"
      },
      {
        nama: "Siti Rahmah, S.Pd.",
        nip: "19870210 201001 2 011",
        jabatan: "Guru Kelas V / Bendahara BOS",
        waktu: "07.30 WIB",
        status: "dinas",
        keterangan: "Rekonsiliasi BOSP di Disdik Kab. Langkat"
      },
      {
        nama: "Rian Anggara, A.Md.",
        nip: "19910515 201601 1 006",
        jabatan: "Operator Dapodik & Tata Usaha",
        waktu: "07.10 WIB",
        status: "hadir",
        keterangan: "Pelayanan administrasi & sinkronisasi Dapodik"
      }
    ];
    saveToStorage(absensiRecords);
  }

  function saveToStorage(data) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }
  }

  // Render Table & Counters
  function renderTable(filter = 'all') {
    tableBody.innerHTML = '';

    const filtered = absensiRecords.filter(item => {
      if (filter === 'all') return true;
      return item.status === filter;
    });

    if (filtered.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="6" style="text-align: center; padding: 24px; color: var(--muted);">Belum ada data absensi untuk kategori ini.</td>`;
      tableBody.appendChild(tr);
    } else {
      filtered.forEach((item, index) => {
        const tr = document.createElement('tr');
        
        let badgeClass = 'badge-status-hadir';
        let badgeLabel = 'Hadir Tepat Waktu';
        if (item.status === 'izin') {
          badgeClass = 'badge-status-izin';
          badgeLabel = 'Izin Resmi';
        } else if (item.status === 'sakit') {
          badgeClass = 'badge-status-sakit';
          badgeLabel = 'Sakit';
        } else if (item.status === 'dinas') {
          badgeClass = 'badge-status-dinas';
          badgeLabel = 'Dinas Luar';
        }

        tr.innerHTML = `
          <td><strong>${index + 1}</strong></td>
          <td><span style="font-weight: 700; color: var(--primary);">${item.waktu}</span></td>
          <td>
            <div style="font-weight: 700; color: var(--dark);">${item.nama}</div>
            <div style="font-size: 0.8rem; color: var(--muted);">NIP: ${item.nip || '-'}</div>
          </td>
          <td>${item.jabatan}</td>
          <td><span class="badge-status ${badgeClass}">${badgeLabel}</span></td>
          <td style="font-size: 0.9rem;">${item.keterangan || '-'}</td>
        `;
        tableBody.appendChild(tr);
      });
    }

    updateCounterCards();
  }

  function updateCounterCards() {
    const totalStaff = DAFTAR_GURU_PEGAWAI.length; // 14
    let hadirCount = 0;
    let izinCount = 0;
    let sakitCount = 0;
    let dinasCount = 0;

    absensiRecords.forEach(item => {
      if (item.status === 'hadir') hadirCount++;
      else if (item.status === 'izin') izinCount++;
      else if (item.status === 'sakit') sakitCount++;
      else if (item.status === 'dinas') dinasCount++;
    });

    const recordedTotal = absensiRecords.length;
    const belumAbsen = Math.max(0, totalStaff - recordedTotal);

    const cTotal = document.getElementById('statAbsenTotal');
    const cHadir = document.getElementById('statAbsenHadir');
    const cIzinSakit = document.getElementById('statAbsenIzinSakit');
    const cDinas = document.getElementById('statAbsenDinas');
    const cBelum = document.getElementById('statAbsenBelum');

    if (cTotal) cTotal.textContent = totalStaff;
    if (cHadir) cHadir.textContent = hadirCount;
    if (cIzinSakit) cIzinSakit.textContent = (izinCount + sakitCount);
    if (cDinas) cDinas.textContent = dinasCount;
    if (cBelum) cBelum.textContent = belumAbsen;
  }

  // Handle Form Submit
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const pId = pegawaiSelect?.value;
      const status = document.getElementById('statusAbsenSelect')?.value || 'hadir';
      const keterangan = document.getElementById('keteranganAbsen')?.value.trim() || '-';

      if (!pId) {
        alert('Silakan pilih nama guru atau pegawai terlebih dahulu.');
        return;
      }

      const pegawai = DAFTAR_GURU_PEGAWAI.find(p => p.id === pId);
      if (!pegawai) return;

      // Check if already checked in today
      const alreadyCheckedIndex = absensiRecords.findIndex(r => r.nama === pegawai.nama);
      
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const waktuStr = `${hours}.${minutes} WIB`;

      const newRecord = {
        nama: pegawai.nama,
        nip: pegawai.nip,
        jabatan: pegawai.jabatan,
        waktu: waktuStr,
        status: status,
        keterangan: keterangan
      };

      if (alreadyCheckedIndex >= 0) {
        // Update existing entry
        absensiRecords[alreadyCheckedIndex] = newRecord;
      } else {
        // Add to beginning of array
        absensiRecords.unshift(newRecord);
      }

      saveToStorage(absensiRecords);
      renderTable();

      // Show alert
      if (alertBox) {
        alertBox.style.display = 'flex';
        alertBox.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>Presensi untuk <strong>${pegawai.nama}</strong> (${pegawai.jabatan}) berhasil tercatat pada pukul <strong>${waktuStr}</strong> dengan status <strong>${status.toUpperCase()}</strong>!</span>
        `;
        alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      // Reset selection
      pegawaiSelect.value = '';
      if (nipInput) nipInput.value = '';
      if (jabatanInput) jabatanInput.value = '';
      if (document.getElementById('keteranganAbsen')) document.getElementById('keteranganAbsen').value = '';
    });
  }

  // Handle Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.getAttribute('data-filter');
      renderTable(f);
    });
  });

  // Handle Print Button
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Handle Reset Button
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Apakah Anda yakin ingin mereset seluruh data absensi hari ini?')) {
        absensiRecords = [];
        saveToStorage([]);
        renderTable();
        if (alertBox) {
          alertBox.style.display = 'flex';
          alertBox.innerHTML = `<span>Data absensi hari ini telah berhasil direset.</span>`;
        }
      }
    });
  }

  // Initial render
  renderTable();
}
