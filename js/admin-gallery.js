import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm';

const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const BUCKET = 'website-media';
const MAX_FILE_SIZE = 6 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const CATEGORY_LABELS = {
  upacara: 'Upacara',
  kebugaran: 'Kebugaran & Senam',
  pramuka: 'Pramuka',
  belajar: 'Pembelajaran',
  literasi: 'Literasi',
  prestasi: 'Prestasi',
  kegiatan: 'Kegiatan',
  lainnya: 'Lainnya'
};

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

let currentUserId = null;

function showAlert(message, type = 'success') {
  const box = $('adminAlert');
  if (!box) return;
  box.hidden = false;
  box.className = 'alert ' + (type === 'error' ? 'alert-danger' : 'alert-success');
  box.textContent = message;
}

function showLoginAlert(message) {
  const box = $('adminLoginAlert');
  if (!box) return;
  box.hidden = false;
  box.textContent = message;
}

function setView(loggedIn) {
  $('adminLogin').hidden = loggedIn;
  $('adminApp').hidden = !loggedIn;
  $('adminUserBar').hidden = !loggedIn;
}

async function requireAdmin() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    setView(false);
    return false;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id,email,nama,role')
    .eq('id', session.user.id)
    .single();

  if (error || profile?.role !== 'admin') {
    await supabase.auth.signOut();
    setView(false);
    showLoginAlert('Akun ini tidak memiliki akses administrator.');
    return false;
  }

  currentUserId = session.user.id;
  $('adminUserBar').innerHTML = '<span>Masuk sebagai <strong>' + esc(profile.nama || profile.email) + '</strong></span><button id="adminLogout" class="btn btn-sm btn-outline" type="button">Keluar</button>';
  $('adminLogout').addEventListener('click', async () => {
    await supabase.auth.signOut();
    location.reload();
  });

  setView(true);
  await Promise.all([loadGallery(), loadAdminUsers(), loadTeachers()]);
  return true;
}

function renderGallery(rows) {
  const list = $('galleryAdminList');
  if (!list) return;

  if (!rows.length) {
    list.innerHTML = '<div class="admin-empty">Belum ada foto yang diunggah melalui dashboard.</div>';
    return;
  }

  list.innerHTML = rows.map(row => {
    const date = new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeZone: 'Asia/Jakarta'
    }).format(new Date(row.created_at));

    return '<article class="admin-gallery-item">' +
      '<img src="' + esc(row.public_url) + '" alt="' + esc(row.title) + '" loading="lazy">' +
      '<div class="admin-gallery-meta">' +
        '<div class="admin-gallery-title">' + esc(row.title) + '</div>' +
        '<div class="admin-gallery-category">' + esc(CATEGORY_LABELS[row.category] || row.category) + ' · ' + esc(date) + '</div>' +
        (row.caption ? '<p>' + esc(row.caption) + '</p>' : '') +
        '<button class="btn btn-sm btn-danger-outline" type="button" data-delete-id="' + esc(row.id) + '" data-delete-path="' + esc(row.storage_path) + '">Hapus</button>' +
      '</div>' +
    '</article>';
  }).join('');

  list.querySelectorAll('[data-delete-id]').forEach(button => {
    button.addEventListener('click', () => deletePhoto(button.dataset.deleteId, button.dataset.deletePath));
  });
}

async function loadGallery() {
  const list = $('galleryAdminList');
  if (list) list.innerHTML = '<div class="admin-empty">Memuat foto...</div>';

  const { data, error } = await supabase
    .from('gallery_photos')
    .select('id,title,caption,category,storage_path,public_url,created_at')
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) {
    showAlert('Galeri gagal dimuat: ' + error.message, 'error');
    return;
  }
  renderGallery(data || []);
}

function renderAdminUsers(rows) {
  const list = $('adminUsersList');
  if (!list) return;

  if (!rows.length) {
    list.innerHTML = '<div class="admin-empty">Belum ada profil akun. Buat akun Auth terlebih dahulu melalui Supabase Dashboard.</div>';
    return;
  }

  list.innerHTML = rows.map(row => {
    const isCurrent = row.id === currentUserId;
    const isAdmin = row.role === 'admin';
    const displayName = row.nama || 'Nama belum diisi';
    const action = isAdmin
      ? (isCurrent
        ? '<span class="admin-role-badge">Admin aktif</span>'
        : '<button class="btn btn-sm btn-danger-outline" type="button" data-role-id="' + esc(row.id) + '" data-next-role="guru">Turunkan ke Guru</button>')
      : '<button class="btn btn-sm btn-primary" type="button" data-role-id="' + esc(row.id) + '" data-next-role="admin">Jadikan Admin</button>';

    return '<article class="admin-user-item">' +
      '<div class="admin-user-info">' +
        '<strong>' + esc(displayName) + '</strong>' +
        '<span>' + esc(row.email || 'Email tidak tersedia') + '</span>' +
      '</div>' +
      '<div class="admin-user-role">' +
        '<span class="admin-role-badge ' + (isAdmin ? 'is-admin' : '') + '">' + (isAdmin ? 'Admin' : 'Guru') + '</span>' +
        action +
      '</div>' +
    '</article>';
  }).join('');

  list.querySelectorAll('[data-role-id]').forEach(button => {
    button.addEventListener('click', () => updateUserRole(button.dataset.roleId, button.dataset.nextRole));
  });
}

async function loadAdminUsers() {
  const list = $('adminUsersList');
  if (list) list.innerHTML = '<div class="admin-empty">Memuat akun...</div>';

  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,nama,role,created_at')
    .order('created_at', { ascending: true });

  if (error) {
    showAlert('Daftar akun gagal dimuat: ' + error.message, 'error');
    return;
  }

  renderAdminUsers(data || []);
}

async function updateUserRole(userId, nextRole) {
  if (!['admin', 'guru'].includes(nextRole)) return;
  if (userId === currentUserId && nextRole !== 'admin') {
    showAlert('Akun yang sedang digunakan tidak dapat diturunkan dari admin.', 'error');
    return;
  }

  const message = nextRole === 'admin'
    ? 'Tetapkan akun ini sebagai administrator?'
    : 'Turunkan akun ini menjadi guru?';
  if (!window.confirm(message)) return;

  const { error } = await supabase
    .from('profiles')
    .update({ role: nextRole })
    .eq('id', userId);

  if (error) {
    showAlert('Perubahan peran gagal: ' + error.message, 'error');
    return;
  }

  showAlert(nextRole === 'admin'
    ? 'Akun berhasil diberi akses administrator.'
    : 'Akun berhasil diturunkan menjadi guru.');
  await loadAdminUsers();
}

function renderTeachers(rows) {
  const list = $('teacherPhotoList');
  if (!list) return;

  if (!rows.length) {
    list.innerHTML = '<div class="admin-empty">Data guru belum tersedia.</div>';
    return;
  }

  list.innerHTML = rows.map(row => {
    const image = row.image && /^https?:\\/\\//.test(row.image)
      ? row.image
      : (row.image || '');
    const hasImage = Boolean(image);
    return '<article class="admin-teacher-item">' +
      '<div class="admin-teacher-preview">' +
        (hasImage
          ? '<img src="' + esc(image) + '" alt="Foto ' + esc(row.nama) + '" loading="lazy">'
          : '<div class="admin-teacher-placeholder">' + esc(getInitials(row.nama)) + '</div>') +
      '</div>' +
      '<div class="admin-teacher-info">' +
        '<strong>' + esc(row.nama) + '</strong>' +
        '<span>' + esc(row.jabatan || row.tugas || '') + '</span>' +
        '<small>' + (hasImage ? 'Foto saat ini tersedia' : 'Belum ada foto') + '</small>' +
      '</div>' +
      '<div class="admin-teacher-actions">' +
        '<input class="form-control teacher-photo-input" type="file" accept="image/jpeg,image/png,image/webp" data-teacher-id="' + esc(row.id) + '" aria-label="Pilih foto untuk ' + esc(row.nama) + '">' +
        '<button class="btn btn-sm btn-primary teacher-photo-upload" type="button" data-teacher-id="' + esc(row.id) + '">Upload Foto</button>' +
      '</div>' +
    '</article>';
  }).join('');

  list.querySelectorAll('.teacher-photo-upload').forEach(button => {
    button.addEventListener('click', () => uploadTeacherPhoto(button.dataset.teacherId, button));
  });
}

function getInitials(name) {
  const parts = String(name || '').split(/\\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function loadTeachers() {
  const list = $('teacherPhotoList');
  if (list) list.innerHTML = '<div class="admin-empty">Memuat data guru...</div>';

  const { data, error } = await supabase
    .from('guru')
    .select('id,nama,jabatan,tugas,image,aktif')
    .eq('aktif', true)
    .order('nama', { ascending: true });

  if (error) {
    showAlert('Data guru gagal dimuat: ' + error.message, 'error');
    return;
  }

  renderTeachers(data || []);
}

async function uploadTeacherPhoto(guruId, button) {
  const input = document.querySelector('.teacher-photo-input[data-teacher-id="' + CSS.escape(guruId) + '"]');
  const file = input?.files?.[0];
  if (!file) {
    showAlert('Pilih foto terlebih dahulu.', 'error');
    return;
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    showAlert('Format foto harus JPG, PNG, atau WebP.', 'error');
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    showAlert('Ukuran foto maksimal 6 MB.', 'error');
    return;
  }

  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = 'Mengunggah...';

  let uploadedPath = null;
  try {
    const { data: current, error: currentError } = await supabase
      .from('guru')
      .select('id,nama,image')
      .eq('id', guruId)
      .single();
    if (currentError) throw currentError;

    const extension = file.name.split('.').pop().toLowerCase();
    uploadedPath = 'guru/' + guruId + '/' + crypto.randomUUID() + '.' + extension;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(uploadedPath, file, {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: false
      });
    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(uploadedPath);
    const { error: updateError } = await supabase
      .from('guru')
      .update({ image: publicData.publicUrl })
      .eq('id', guruId);

    if (updateError) {
      await supabase.storage.from(BUCKET).remove([uploadedPath]);
      uploadedPath = null;
      throw updateError;
    }

    const oldPath = String(current.image || '').includes('/storage/v1/object/public/' + BUCKET + '/')
      ? String(current.image).split('/storage/v1/object/public/' + BUCKET + '/')[1]
      : null;
    if (oldPath && oldPath.startsWith('guru/')) {
      const { error: removeOldError } = await supabase.storage.from(BUCKET).remove([oldPath]);
      if (removeOldError) {
        console.warn('Foto lama tidak dapat dihapus:', removeOldError);
      }
    }

    showAlert('Foto ' + (current.nama || 'guru') + ' berhasil diperbarui.');
    await loadTeachers();
  } catch (error) {
    console.error(error);
    showAlert('Upload foto guru gagal: ' + (error.message || 'Kesalahan tidak diketahui.'), 'error');
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

async function uploadPhoto(event) {
  event.preventDefault();
  const file = $('galleryFile').files[0];
  const title = $('galleryTitle').value.trim();
  const caption = $('galleryCaption').value.trim() || null;
  const category = $('galleryCategory').value;
  const button = $('galleryUploadButton');

  if (!file || !title) return;
  if (!ALLOWED_TYPES.has(file.type)) return showAlert('Format file harus JPG, PNG, atau WebP.', 'error');
  if (file.size > MAX_FILE_SIZE) return showAlert('Ukuran foto maksimal 6 MB.', 'error');

  button.disabled = true;
  button.querySelector('span').textContent = 'Mengunggah...';

  const extension = file.name.split('.').pop().toLowerCase();
  const path = 'galeri/' + new Date().toISOString().slice(0, 10) + '/' + crypto.randomUUID() + '.' + extension;

  try {
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = publicData.publicUrl;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Sesi administrator tidak tersedia.');

    const { error: insertError } = await supabase.from('gallery_photos').insert({
      title,
      caption,
      category,
      storage_path: path,
      public_url: publicUrl,
      uploaded_by: user.id
    });

    if (insertError) {
      await supabase.storage.from(BUCKET).remove([path]);
      throw insertError;
    }

    $('galleryUploadForm').reset();
    showAlert('Foto berhasil diunggah. Foto otomatis tersedia di halaman Galeri.');
    await loadGallery();
  } catch (error) {
    console.error(error);
    showAlert('Upload gagal: ' + (error.message || 'Kesalahan tidak diketahui.'), 'error');
  } finally {
    button.disabled = false;
    button.querySelector('span').textContent = 'Upload ke Galeri';
  }
}

async function deletePhoto(id, path) {
  if (!window.confirm('Hapus foto ini dari galeri?')) return;

  const { error: storageError } = await supabase.storage.from(BUCKET).remove([path]);
  if (storageError) {
    showAlert('Foto gagal dihapus dari Storage: ' + storageError.message, 'error');
    return;
  }

  const { error } = await supabase.from('gallery_photos').delete().eq('id', id);
  if (error) {
    showAlert('File sudah terhapus dari Storage, tetapi metadata database gagal dihapus: ' + error.message, 'error');
    return;
  }

  showAlert('Foto berhasil dihapus.');
  await loadGallery();
}

$('adminLoginForm')?.addEventListener('submit', async event => {
  event.preventDefault();
  const button = $('adminLoginButton');
  button.disabled = true;
  button.textContent = 'Memproses...';
  const { error } = await supabase.auth.signInWithPassword({
    email: $('adminEmail').value.trim(),
    password: $('adminPassword').value
  });

  if (error) {
    showLoginAlert('Login gagal. Periksa email dan password.');
  } else {
    try {
      const ok = await requireAdmin();
      if (!ok) return;
    } catch (error) {
      console.error(error);
      showLoginAlert('Profil administrator belum dapat diverifikasi.');
    }
  }
  button.disabled = false;
  button.textContent = 'Masuk ke Dashboard';
});

$('galleryUploadForm')?.addEventListener('submit', uploadPhoto);
$('refreshGalleryButton')?.addEventListener('click', loadGallery);
$('refreshTeachersButton')?.addEventListener('click', loadTeachers);
$('refreshUsersButton')?.addEventListener('click', loadAdminUsers);

requireAdmin().catch(error => {
  console.error(error);
  setView(false);
  showLoginAlert('Dashboard belum dapat dimuat. Silakan coba lagi.');
});
