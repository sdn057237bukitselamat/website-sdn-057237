import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm';

const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_PUBLISHABLE_KEY);
const form = document.getElementById('schoolContactForm');
const alertBox = document.getElementById('contactAlert');

if (form) {
  const submitButton = form.querySelector('button[type="submit"]');
  const honeypot = form.querySelector('#websiteTrap');

  form.addEventListener('submit', async event => {
    event.preventDefault();

    if (honeypot?.value) return;

    const name = form.querySelector('#senderName')?.value.trim() || '';
    const email = form.querySelector('#senderEmail')?.value.trim() || '';
    const subject = form.querySelector('#messageSubject')?.value.trim() || '';
    const message = form.querySelector('#senderMessage')?.value.trim() || '';

    if (!name || !email || !subject || !message) {
      show('Mohon lengkapi data yang wajib diisi.', true);
      return;
    }

    if (message.length < 5) {
      show('Isi pesan terlalu singkat. Mohon tuliskan pesan yang lebih jelas.', true);
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.dataset.originalLabel = submitButton.querySelector('span')?.textContent || 'Kirim Pesan Sekarang';
      const label = submitButton.querySelector('span');
      if (label) label.textContent = 'Mengirim...';
    }

    const { error } = await supabase.from('contact_messages').insert({
      nama: name,
      email,
      subject,
      message
    });

    if (error) {
      console.error('Contact submission error:', error);
      show('Pesan belum dapat dikirim. Silakan coba lagi beberapa saat lagi atau gunakan email resmi sekolah.', true);
    } else {
      show(`Terima kasih, ${name}. Pesan Anda sudah terkirim dan tercatat di sistem sekolah. Pihak sekolah akan menindaklanjutinya melalui alamat email yang Anda cantumkan.`);
      form.reset();
    }

    if (submitButton) {
      submitButton.disabled = false;
      const label = submitButton.querySelector('span');
      if (label) label.textContent = submitButton.dataset.originalLabel || 'Kirim Pesan Sekarang';
    }
  });
}

function show(message, error = false) {
  if (!alertBox) return;
  alertBox.className = `alert ${error ? 'alert-danger' : 'alert-success'}`;
  alertBox.textContent = message;
  alertBox.style.display = 'flex';
  alertBox.setAttribute('role', 'status');
  alertBox.setAttribute('aria-live', 'polite');
  alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
