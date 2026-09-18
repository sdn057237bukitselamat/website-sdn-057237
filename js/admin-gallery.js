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
  await Promise.all([loadGallery(), loadAdminUsers()]);
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
$('refreshUsersButton')?.addEventListener('click', loadAdminUsers);

requireAdmin().catch(error => {
  console.error(error);
  setView(false);
  showLoginAlert('Dashboard belum dapat dimuat. Silakan coba lagi.');
});
