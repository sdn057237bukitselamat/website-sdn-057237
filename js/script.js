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
  initGuruDirectory();
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
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-controls', 'navMenu');
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

  const openLightbox = (item) => {
    const img = item.querySelector('img');
    const caption = item.querySelector('.gallery-caption')?.textContent || 'Galeri SDN 057237';
    if (img && lightboxImg) {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || caption;
    }
    if (lightboxCaption) lightboxCaption.textContent = caption;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  galleryItems.forEach(item => {
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', item.querySelector('img')?.alt || 'Buka gambar galeri');
    item.addEventListener('click', () => openLightbox(item));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(item);
      }
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
// Data master guru/pegawai dimuat dari data/guru.json agar guru.html dan absensi
// menggunakan satu sumber data. NIP/NUPTK tidak disimpan pada data publik.
let DAFTAR_GURU_PEGAWAI = [];

async function initAttendanceSystem() {
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

  // Load the single source of truth.
  try {
    const response = await fetch('data/guru.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const master = await response.json();
    DAFTAR_GURU_PEGAWAI = Array.isArray(master.people) ? master.people : [];
  } catch (err) {
    console.error('Gagal memuat data master guru:', err);
    if (alertBox) {
      alertBox.style.display = 'flex';
      alertBox.classList.remove('alert-success');
      alertBox.textContent = 'Data guru/pegawai tidak dapat dimuat. Silakan coba lagi.';
    }
    if (pegawaiSelect) pegawaiSelect.disabled = true;
    return;
  }

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
        if (jabatanInput) jabatanInput.value = selected.jabatan;
      } else {
        if (nipInput) nipInput.value = '';
        if (jabatanInput) jabatanInput.value = '';
      }
    });
  }

  // Versioned storage key prevents stale demo records from being mixed
  // with the current school master data.
  const storageKey = 'sdn057237_absensi_data_v2';
  const todayKey = new Date().toISOString().slice(0, 10);
  let absensiRecords = [];
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) absensiRecords = JSON.parse(saved);
    if (!Array.isArray(absensiRecords)) absensiRecords = [];
    absensiRecords = absensiRecords.filter(record => record.tanggal === todayKey);
  } catch (err) {
    console.warn('LocalStorage error:', err);
    absensiRecords = [];
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
    const totalStaff = DAFTAR_GURU_PEGAWAI.length;
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
      const alreadyCheckedIndex = absensiRecords.findIndex(r => r.tanggal === todayKey && r.nama === pegawai.nama);
      
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const waktuStr = `${hours}.${minutes} WIB`;

      const newRecord = {
        tanggal: todayKey,
        nama: pegawai.nama,
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
}/* ==========================================================================
   5. Direktori Guru & Tenaga Kependidikan
   ========================================================================== */
async function initGuruDirectory() {
  const grid = document.getElementById('guruGrid');
  if (!grid) return;

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));

  try {
    const response = await fetch('data/guru.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const master = await response.json();
    const people = Array.isArray(master.people) ? master.people : [];
    if (!people.length) throw new Error('Data master kosong.');

    grid.innerHTML = people.map(person => `
      <article class="guru-card" data-guru-category="${escapeHtml(person.kategori)}">
        <div class="guru-avatar">
          <img src="${escapeHtml(person.image)}" alt="Foto profil ${escapeHtml(person.nama)}" loading="lazy" decoding="async">
        </div>
        <h3 class="guru-name">${escapeHtml(person.nama)}</h3>
        <span class="guru-role">${escapeHtml(person.jabatan)}</span>
        <div class="guru-info-list">
          <div class="guru-info-item">
            <span class="guru-info-label">Status:</span>
            <span>${escapeHtml(person.status)}</span>
          </div>
          <div class="guru-info-item">
            <span class="guru-info-label">Tugas:</span>
            <span>${escapeHtml(person.tugas)}</span>
          </div>
        </div>
      </article>
    `).join('');
  } catch (err) {
    console.error('Gagal memuat direktori guru:', err);
    grid.innerHTML = '<div style="grid-column:1 / -1; text-align:center; padding:32px; color:var(--muted);">Data pendidik dan tenaga kependidikan belum dapat dimuat. Silakan coba lagi.</div>';
  }
}


