import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm';

const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_PUBLISHABLE_KEY);
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

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

async function loadOnlineGallery() {
  const grid = document.querySelector('.gallery-grid');
  if (!grid) return;

  const { data, error } = await supabase
    .from('gallery_photos')
    .select('id,title,caption,category,public_url,created_at')
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error || !data?.length) return;

  const html = data.map(photo => {
    const caption = photo.caption || photo.title;
    const label = CATEGORY_LABELS[photo.category] || photo.category;
    return '<div class="gallery-item gallery-item-online" data-galeri-category="' + esc(photo.category) + '">' +
      '<img src="' + esc(photo.public_url) + '" alt="' + esc(photo.title) + '" loading="lazy">' +
      '<div class="gallery-overlay"><span class="gallery-cat">' + esc(label) + '</span><div class="gallery-caption">' + esc(caption) + '</div></div>' +
      '<div class="gallery-zoom-icon" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg></div>' +
    '</div>';
  }).join('');

  grid.insertAdjacentHTML('afterbegin', html);
  grid.querySelectorAll('.gallery-item-online').forEach(item => {
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', item.querySelector('img')?.alt || 'Buka gambar galeri');
  });
}

document.addEventListener('DOMContentLoaded', loadOnlineGallery);
