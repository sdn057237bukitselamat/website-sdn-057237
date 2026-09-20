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
  const gallery = document.querySelector('.gallery-grid');
  const lightbox = document.querySelector('.lightbox');
  if (!gallery || !lightbox) return;

  const lightboxImg = lightbox.querySelector('.lightbox-img');
  const lightboxCaption = lightbox.querySelector('.lightbox-caption');
  const closeBtn = lightbox.querySelector('.lightbox-close');

  const prepareItem = item => {
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', item.querySelector('img')?.alt || 'Buka gambar galeri');
  };

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

  gallery.querySelectorAll('.gallery-item').forEach(prepareItem);
  gallery.addEventListener('click', e => {
    const item = e.target.closest('.gallery-item');
    if (item && gallery.contains(item)) openLightbox(item);
  });
  gallery.addEventListener('keydown', e => {
    const item = e.target.closest('.gallery-item');
    if (item && gallery.contains(item) && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openLightbox(item);
    }
  });

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) closeLightbox();
  });
}

/* ==========================================================================
   5. Filter Tabs (Guru, Berita, Galeri)
   ========================================================================== */
function initFilterTabs() {
  const tabGroups = document.querySelectorAll('.filter-tabs');

  tabGroups.forEach(group => {
    const buttons = [...group.querySelectorAll('.filter-btn')];
    const targetType = group.getAttribute('data-target');
    if (!buttons.length || !targetType) return;

    const applyFilter = (filterValue) => {
      const targetButton = buttons.find(btn => btn.dataset.filter === filterValue);
      group.classList.add('is-switching');
      window.clearTimeout(group._switchTimer);
      group._switchTimer = window.setTimeout(() => group.classList.remove('is-switching'), 260);

      buttons.forEach(btn => {
        const selected = btn.dataset.filter === filterValue;
        btn.classList.toggle('active', selected);
        btn.setAttribute('aria-pressed', String(selected));
      });

      const items = document.querySelectorAll(`[data-${targetType}-category]`);
      let visibleCount = 0;

      items.forEach(item => {
        const category = item.getAttribute(`data-${targetType}-category`) || '';
        const visible = filterValue === 'all' || category === filterValue || category.includes(filterValue);
        item.hidden = !visible;
        if (visible) visibleCount += 1;
      });

      const grid = document.getElementById(`${targetType}Grid`);
      if (grid) {
        grid.dataset.activeFilter = filterValue;
        grid.classList.remove('filter-updated');
        void grid.offsetWidth;
        grid.classList.add('filter-updated');
        if (targetButton) {
          targetButton.classList.remove('filter-pop');
          void targetButton.offsetWidth;
          targetButton.classList.add('filter-pop');
        }
        grid.setAttribute('aria-label', `${visibleCount} data ditampilkan`);
      }
    };

    buttons.forEach((btn, index) => {
      btn.addEventListener('click', () => applyFilter(btn.dataset.filter || 'all'));

      btn.addEventListener('keydown', event => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') return;
        event.preventDefault();

        let nextIndex = index;
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % buttons.length;
        if (event.key === 'ArrowLeft') nextIndex = (index - 1 + buttons.length) % buttons.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = buttons.length - 1;

        buttons[nextIndex].focus();
        applyFilter(buttons[nextIndex].dataset.filter || 'all');
      });
    });

    applyFilter(group.querySelector('.filter-btn.active')?.dataset.filter || 'all');
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

  const getInitials = (name) => {
    const parts = String(name ?? '').split(',')[0].trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  };

  const setState = (type, title, detail = '', action = '') => {
    grid.setAttribute('aria-busy', type === 'loading' ? 'true' : 'false');

    if (type === 'loading') {
      grid.innerHTML = `
        <div class="guru-loading-grid" role="status" aria-label="Memuat profil guru dan tenaga kependidikan">
          ${Array.from({ length: 6 }, (_, index) => `
            <div class="guru-skeleton-card" aria-hidden="true" style="--skeleton-delay:${index * 45}ms">
              <span class="guru-skeleton guru-skeleton-accent"></span>
              <span class="guru-skeleton guru-skeleton-avatar"></span>
              <span class="guru-skeleton guru-skeleton-pill"></span>
              <span class="guru-skeleton guru-skeleton-name"></span>
              <span class="guru-skeleton guru-skeleton-role"></span>
              <span class="guru-skeleton guru-skeleton-info"></span>
            </div>`).join('')}
        </div>`;
      return;
    }

    grid.innerHTML = `
      <div class="guru-state guru-state-${type}" role="${type === 'error' ? 'alert' : 'status'}">
        <strong>${escapeHtml(title)}</strong>
        ${detail ? `<span>${escapeHtml(detail)}</span>` : ''}
        ${action}
      </div>`;
  };

  const render = (people) => {
    grid.setAttribute('aria-busy', 'false');

    grid.innerHTML = people.map(person => {
      const category = escapeHtml(person.kategori || 'guru');
      const name = escapeHtml(person.nama);
      const image = String(person.image || '').trim();
      const avatar = image
        ? `<div class="guru-avatar guru-avatar-photo-wrap">
             <img class="guru-avatar-photo" src="${escapeHtml(image)}" alt="Foto ${name}" loading="lazy" decoding="async" width="320" height="320">
           </div>`
        : `<div class="guru-avatar guru-avatar-initials" role="img" aria-label="Avatar ${name}">
             <span aria-hidden="true">${escapeHtml(getInitials(person.nama))}</span>
           </div>`;

      return `
        <article class="guru-card" data-guru-category="${category}" data-guru-id="${escapeHtml(person.id || '')}">
          <div class="guru-card-accent" aria-hidden="true"></div>
          ${avatar}
          <div class="guru-card-body">
            <span class="guru-category-badge guru-category-${category}">${escapeHtml(person.kategori === 'kelas' ? 'Guru Kelas' : person.kategori === 'mapel' ? 'Guru Mapel' : person.kategori === 'pimpinan' ? 'Pimpinan' : 'Tenaga Kependidikan')}</span>
            <h3 class="guru-name">${name}</h3>
            <p class="guru-role">${escapeHtml(person.jabatan)}</p>
            <dl class="guru-info-list">
              <div class="guru-info-item"><dt>Status</dt><dd>${escapeHtml(person.status)}</dd></div>
              <div class="guru-info-item"><dt>Tugas</dt><dd>${escapeHtml(person.tugas)}</dd></div>
            </dl>
          </div>
        </article>
      `;
    }).join('');

    if (!people.length) {
      setState('empty', 'Belum ada data pada kategori ini.', 'Silakan pilih kategori lain untuk melihat data yang tersedia.');
    }

    const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
    const count = grid.querySelectorAll(`[data-guru-category]`).length;
    grid.setAttribute('aria-label', `${count} data guru dan tenaga kependidikan`);

    // Keep filter counts synchronized with the actual source data.
    const countMap = people.reduce((map, person) => {
      const key = person.kategori || 'guru';
      map[key] = (map[key] || 0) + 1;
      map.all = (map.all || 0) + 1;
      return map;
    }, {});
    document.querySelectorAll('.filter-count[data-count]').forEach(counter => {
      counter.textContent = countMap[counter.dataset.count] || 0;
    });

    initGuruScrollReveal();

    // Re-apply the active filter after async rendering.
    const group = document.querySelector('.filter-tabs[data-target="guru"]');
    const activeButton = group?.querySelector('.filter-btn.active');
    if (activeButton) {
      activeButton.click();
    } else {
      void activeFilter;
    }
  };

  const loadDirectory = async () => {
    setState('loading', 'Memuat data pendidik...', 'Mengambil data terbaru dari sumber sekolah.');

    try {
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm');
      const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_PUBLISHABLE_KEY);
      const { data, error } = await supabase
        .from('guru')
        .select('id,nama,status,tugas,kategori,jabatan,image')
        .eq('aktif', true)
        .order('nama', { ascending: true });

      if (error) throw error;
      const people = Array.isArray(data) ? data : [];
      if (!people.length) throw new Error('Data online kosong.');
      render(people);
      return;
    } catch (dbError) {
      console.warn('Data guru online belum tersedia, menggunakan data cadangan:', dbError);
    }

    try {
      const response = await fetch('data/guru.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const master = await response.json();
      const people = Array.isArray(master.people) ? master.people : [];
      if (!people.length) throw new Error('Data master kosong.');
      render(people);
    } catch (err) {
      console.error('Gagal memuat direktori guru:', err);
      setState(
        'error',
        'Data guru belum dapat dimuat.',
        'Periksa koneksi internet atau coba muat ulang halaman.',
        '<button type="button" class="btn btn-primary guru-retry" id="guruRetry">Coba Lagi</button>'
      );
      document.getElementById('guruRetry')?.addEventListener('click', loadDirectory);
    }
  };

  await loadDirectory();
}





/* ==========================================================================
   10. Guru Page — scroll reveal
   ========================================================================== */
function initGuruScrollReveal() {
  const items = document.querySelectorAll('.guru-card');
  if (!items.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    items.forEach(item => item.classList.add('is-visible'));
    return;
  }

  if (window.__guruRevealObserver) {
    items.forEach(item => {
      if (!item.dataset.revealBound) {
        item.dataset.revealBound = 'true';
        window.__guruRevealObserver.observe(item);
      }
    });
    return;
  }

  window.__guruRevealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px' });

  items.forEach(item => {
    item.dataset.revealBound = 'true';
    window.__guruRevealObserver.observe(item);
  });
}

/* ==========================================================================
   11. Berita Detail
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

