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
  initLiveClock();
  initGuruDirectory();
  initNewsDetails();
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
/* ==========================================================================\n   8. Live Digital Clock (Jam & Tanggal Real-time)
   ========================================================================== */
function initLiveClock() {
  const clockTime = document.getElementById('liveClockTime');
  const clockDate = document.getElementById('liveClockDate');
  if (!clockTime && !clockDate) return;

  const updateClock = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).formatToParts(new Date());

    const get = type => parts.find(part => part.type === type)?.value || '';
    if (clockTime) clockTime.textContent = `${get('hour')}:${get('minute')}:${get('second')} WIB`;

    if (clockDate) {
      const date = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(new Date());
      clockDate.textContent = date;
    }
  };

  updateClock();
  setInterval(updateClock, 1000);
}

/* ==========================================================================\n   9. Direktori Guru & Tenaga Kependidikan
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

    const getInitials = (name) => {
      const baseName = String(name ?? '').split(',')[0].trim();
      const parts = baseName.split(/\s+/).filter(Boolean);
      if (!parts.length) return '?';
      if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
      return (parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1)).toUpperCase();
    };

    grid.innerHTML = people.map(person => {
      const initials = getInitials(person.nama);
      const category = escapeHtml(person.kategori);
      const name = escapeHtml(person.nama);
      return `
      <article class="guru-card" data-guru-category="${category}">
        <div class="guru-avatar guru-avatar-initials guru-avatar-${category}" role="img" aria-label="Avatar ${name}">
          <span aria-hidden="true">${escapeHtml(initials)}</span>
          <i aria-hidden="true"></i>
        </div>
        <h3 class="guru-name">${name}</h3>
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
      `;
    }).join('');
  } catch (err) {
    console.error('Gagal memuat direktori guru:', err);
    grid.innerHTML = '<div style="grid-column:1 / -1; text-align:center; padding:32px; color:var(--muted);">Data pendidik dan tenaga kependidikan belum dapat dimuat. Silakan coba lagi.</div>';
  }
}




/* ==========================================================================
   10. Berita Detail
   ========================================================================== */
function initNewsDetails() {
  const links = document.querySelectorAll('.js-news-detail');
  const dialog = document.getElementById('newsDetailDialog');
  if (!dialog || !links.length) return;

  const data = {
    'o2sn': {
      category: 'Prestasi',
      date: '12 September 2026',
      author: 'Admin Sekolah',
      title: 'Siswa SDN 057237 Raih Juara Pada Ajang O2SN Tingkat Kecamatan Besitang',
      image: 'images/berita-1.svg',
      body: 'Kabar gembira datang dari kontingen olahraga SDN 057237 Bukit Selamat yang berhasil meraih juara 1 lari cepat 60 meter dan juara 2 bulutangkis tunggal putra pada Olimpiade Olahraga Siswa Nasional (O2SN) tingkat Kecamatan Besitang. Pihak sekolah menyampaikan apresiasi kepada siswa dan guru pembimbing atas kerja keras selama proses latihan dan seleksi.'
    },
    'p5': {
      category: 'Kegiatan',
      date: '05 September 2026',
      author: 'Tim P5',
      title: 'Gelar Karya P5: Menggali Kreativitas Siswa dari Bahan Daur Ulang Alami',
      image: 'images/berita-2.svg',
      body: 'Dengan mengusung tema Gaya Hidup Berkelanjutan, siswa kelas 1 hingga 6 memamerkan aneka hasil kreasi dari pelepah pisang, botol plastik bekas, dan bahan alami. Kegiatan melibatkan orang tua siswa, komite sekolah, serta pengawas pendidikan dan menjadi ruang bagi siswa untuk menampilkan kreativitas serta rasa percaya diri.'
    },
    'persami': {
      category: 'Kegiatan',
      date: '30 Agustus 2026',
      author: 'Pembina Pramuka',
      title: 'Perkemahan Sabtu-Minggu (Persami) Pramuka Siaga Berlangsung Meriah',
      image: 'images/berita-3.svg',
      body: 'Kegiatan Persami Gugus Depan SDN 057237 Bukit Selamat diisi dengan uji keterampilan tanda jejak, semaphore, api unggun ceria, serta bakti sosial kebersihan di lingkungan Desa Bukit Selamat. Para peserta mengikuti kegiatan dengan antusias dan belajar bekerja sama antarregu.'
    },
    'anbk': {
      category: 'Akademik',
      date: '24 Agustus 2026',
      author: 'Proktor ANBK',
      title: 'Gladi Bersih Asesmen Nasional (ANBK) Siswa Kelas V Berjalan Lancar',
      image: 'images/berita-4.svg',
      body: 'Sebanyak 30 siswa kelas 5 mengikuti simulasi gladi bersih ANBK dengan fokus pada instrumen Asesmen Kompetensi Minimum Literasi dan Numerasi serta Survei Lingkungan Belajar. Pelaksanaan berlangsung tertib dengan dukungan perangkat komputer dan koneksi jaringan sekolah.'
    },
    'asts': {
      category: 'Pengumuman',
      date: '18 Agustus 2026',
      author: 'Kurikulum',
      title: 'Pengumuman Jadwal Asesmen Sumatif Tengah Semester (ASTS) Ganjil',
      image: 'images/berita-2.svg',
      body: 'Pelaksanaan ASTS Ganjil ditujukan bagi siswa kelas 1 sampai kelas 6. Jadwal ujian tertulis dan portofolio telah dibagikan melalui grup kelas masing-masing. Orang tua dan wali siswa diharapkan mendampingi persiapan belajar dan memastikan siswa hadir tepat waktu.'
    },
    'buku': {
      category: 'Akademik',
      date: '10 Agustus 2026',
      author: 'Perpustakaan',
      title: 'Distribusi Buku Pelajaran Kurikulum Merdeka Gratis Untuk Seluruh Siswa',
      image: 'images/berita-1.svg',
      body: 'Perpustakaan SDN 057237 Bukit Selamat telah menyalurkan buku pegangan siswa terbitan Kemendikbudristek yang bersumber dari alokasi dana Bantuan Operasional Satuan Pendidikan. Buku dipinjamkan selama satu tahun pelajaran dan siswa diharapkan menjaganya dengan baik.'
    }
  };

  const close = () => {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  };

  const render = article => {
    if (!article) return;
    dialog.querySelector('.news-detail-image').src = article.image;
    dialog.querySelector('.news-detail-image').alt = article.title;
    dialog.querySelector('.news-detail-category').textContent = article.category;
    dialog.querySelector('.news-detail-meta').textContent = `${article.date} • ${article.author}`;
    dialog.querySelector('.news-detail-title').textContent = article.title;
    dialog.querySelector('.news-detail-body').textContent = article.body;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  };

  links.forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    render(data[link.dataset.newsId]);
  }));

  dialog.querySelectorAll('[data-news-close]').forEach(btn => btn.addEventListener('click', close));
  dialog.addEventListener('click', event => {
    if (event.target === dialog) close();
  });
}

