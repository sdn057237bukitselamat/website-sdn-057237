import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm';

const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const state = { user: null, profile: null, people: [], records: [], filter: 'all' };
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const todayWib = () => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const wib = iso => new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'medium',timeStyle:'medium'}).format(new Date(iso));

function msg(text, error=false) {
  const el=$('absensiAlert'); if(!el)return;
  el.className='alert '+(error?'alert-danger':'alert-success');
  el.style.display='flex'; el.textContent=text;
}
function loginView(show){ $('attendanceLogin').style.display=show?'':'none'; $('attendanceApp').style.display=show?'none':''; }

async function people(){
  const {data,error}=await supabase.from('guru').select('*').eq('aktif',true).order('nama');
  if(error)throw error; state.people=data||[];
}
async function profile(user){
  const {data,error}=await supabase.from('profiles').select('id,email,nama,role,guru_id').eq('id',user.id).single();
  if(error)throw error; state.profile=data;
}
function fillPeople(){
  const s=$('pegawaiSelect'); if(!s)return;
  const list=state.profile.role==='admin'?state.people:state.people.filter(p=>p.id===state.profile.guru_id);
  s.innerHTML='<option value="">-- Pilih Nama Pendidik / Tendik --</option>'+list.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.nama)+' ('+esc(p.jabatan)+')</option>').join('');
  if(state.profile.role==='guru'){s.value=state.profile.guru_id;s.disabled=true;setJob();}
}
function setJob(){
  const p=state.people.find(x=>x.id===$('pegawaiSelect')?.value);
  if($('jabatanInput'))$('jabatanInput').value=p?.jabatan||'';
}
function statusBadge(s){
  return ({hadir:['badge-status-hadir','Hadir'],izin:['badge-status-izin','Izin'],sakit:['badge-status-sakit','Sakit'],dinas:['badge-status-dinas','Dinas Luar']})[s]||['badge-status-hadir',s];
}
function counters(){
  const c={hadir:0,izin:0,sakit:0,dinas:0}; state.records.forEach(r=>{if(c[r.status]!=null)c[r.status]++});
  const total=state.profile.role==='admin'?state.people.length:1;
  $('statAbsenTotal').textContent=total;$('statAbsenHadir').textContent=c.hadir;$('statAbsenIzinSakit').textContent=c.izin+c.sakit;$('statAbsenDinas').textContent=c.dinas;$('statAbsenBelum').textContent=Math.max(0,total-state.records.length);
}
function table(){
  const body=$('tabelAbsensiBody'); if(!body)return;
  const rows=state.filter==='all'?state.records:state.records.filter(r=>r.status===state.filter);
  body.innerHTML=rows.length?rows.map((r,i)=>{const [cl,label]=statusBadge(r.status);const p=r.guru||state.people.find(x=>x.id===r.guru_id)||{};return '<tr><td><strong>'+(i+1)+'</strong></td><td><span style="font-weight:700;color:var(--primary)">'+esc(wib(r.waktu))+'</span></td><td><strong>'+esc(p.nama||r.guru_id)+'</strong></td><td>'+esc(p.jabatan||'-')+'</td><td><span class="badge-status '+cl+'">'+label+'</span></td><td>'+esc(r.keterangan||'-')+'</td></tr>'}).join(''):'<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--muted)">Belum ada data presensi untuk kategori ini.</td></tr>';
  counters();
}
async function today(){
  const {data,error}=await supabase.from('attendance').select('id,guru_id,tanggal,waktu,status,keterangan,guru:guru_id(nama,jabatan)').eq('tanggal',todayWib()).order('waktu',{ascending:false});
  if(error)throw error;state.records=data||[];table();
}
async function save(e){
  e.preventDefault();
  const gid=$('pegawaiSelect')?.value, status=$('statusAbsenSelect')?.value, note=$('keteranganAbsen')?.value.trim()||null;
  if(!gid)return msg('Silakan pilih guru/pegawai terlebih dahulu.',true);
  const {data:old,error:oe}=await supabase.from('attendance').select('id').eq('guru_id',gid).eq('tanggal',todayWib()).maybeSingle();
  if(oe)return msg(oe.message,true);
  if(old&&state.profile.role!=='admin')return msg('Presensi hari ini sudah tercatat. Presensi kedua ditolak oleh aturan satu presensi per guru per tanggal.',true);
  const payload={guru_id:gid,status,keterangan:note,created_by:state.user.id};
  const result=old?await supabase.from('attendance').update(payload).eq('id',old.id).select('id,waktu,guru:guru_id(nama)').single():await supabase.from('attendance').insert(payload).select('id,waktu,guru:guru_id(nama)').single();
  if(result.error)return msg(result.error.code==='23505'?'Presensi ganda ditolak oleh database.':result.error.message,true);
  msg('Presensi '+result.data.guru.nama+' berhasil dicatat pada '+wib(result.data.waktu)+'.');
  $('formAbsensi').reset(); if(state.profile.role==='guru')$('pegawaiSelect').value=state.profile.guru_id; setJob(); await today();
}
async function recap(){
  const m=$('recapMonth')?.value;if(!m)return;
  const [y,mo]=m.split('-').map(Number), start=y+'-'+String(mo).padStart(2,'0')+'-01', end=new Date(Date.UTC(y,mo,1)).toISOString().slice(0,10);
  const {data,error}=await supabase.from('attendance').select('guru_id,status').gte('tanggal',start).lt('tanggal',end);
  if(error)return msg('Rekap gagal dimuat: '+error.message,true);
  const map=Object.fromEntries(state.people.map(p=>[p.id,{nama:p.nama,hadir:0,izin:0,sakit:0,dinas:0,total:0}]));
  (data||[]).forEach(r=>{if(map[r.guru_id]){map[r.guru_id][r.status]++;map[r.guru_id].total++}});
  $('recapBody').innerHTML=Object.values(map).map(x=>'<tr><td><strong>'+esc(x.nama)+'</strong></td><td>'+x.hadir+'</td><td>'+x.izin+'</td><td>'+x.sakit+'</td><td>'+x.dinas+'</td><td><strong>'+x.total+'</strong></td></tr>').join('');
}
async function loadAdminAccounts(){
  if(state.profile.role!=='admin')return;
  const {data,error}=await supabase.from('profiles').select('id,email,nama,role,guru_id').order('email');
  if(error)return msg('Data akun gagal dimuat: '+error.message,true);
  const account=$('adminAccountSelect'), guru=$('adminGuruSelect'), rows=$('adminAccountRows');
  if(!account||!guru||!rows)return;
  const current=account.value;
  account.innerHTML='<option value="">-- Pilih akun guru --</option>'+(data||[]).filter(x=>x.role!=='admin').map(x=>'<option value="'+esc(x.id)+'">'+esc(x.email)+(x.guru_id?' — '+esc((state.people.find(p=>p.id===x.guru_id)||{}).nama||x.guru_id):' — belum terhubung')+'</option>').join('');
  if(current)account.value=current;
  guru.innerHTML='<option value="">-- Pilih data guru --</option>'+state.people.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.nama)+' ('+esc(p.jabatan)+')</option>').join('');
  const render=()=>{rows.innerHTML=(data||[]).map(x=>{const p=state.people.find(g=>g.id===x.guru_id);return '<tr><td>'+esc(x.email)+'</td><td>'+esc(x.role)+'</td><td>'+esc(p?.nama||'Belum terhubung')+'</td></tr>'}).join('')||'<tr><td colspan="3">Belum ada akun.</td></tr>';};
  render();
  $('btnLinkGuru').onclick=async()=>{const pid=account.value,gid=guru.value;if(!pid||!gid)return msg('Pilih akun dan data guru.',true);const {error:e}=await supabase.from('profiles').update({guru_id:gid,role:'guru',updated_at:new Date().toISOString()}).eq('id',pid);if(e)return msg('Gagal menghubungkan akun: '+e.message,true);msg('Akun guru berhasil dihubungkan.');await loadAdminAccounts();};
}
function adminUI(){
  const r=$('adminRecap');if(!r)return;
  if(state.profile.role!=='admin'){r.style.display='none';return}
  r.style.display=''; const month=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit'}).format(new Date());
  r.innerHTML='<div id="adminAccountManager" class="contact-form" style="padding:24px;margin-bottom:20px"><h3 style="font-size:1.2rem;font-weight:800;color:var(--dark)">Hubungkan Akun Guru</h3><p style="font-size:.85rem;color:var(--muted)">Pilih akun Auth yang sudah dibuat, lalu tautkan ke data guru yang sesuai.</p><div style="display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:end"><div><label class="form-label" for="adminAccountSelect">Akun</label><select id="adminAccountSelect" class="form-control"></select></div><div><label class="form-label" for="adminGuruSelect">Data Guru</label><select id="adminGuruSelect" class="form-control"></select></div><button id="btnLinkGuru" type="button" class="btn btn-primary">Hubungkan</button></div><div class="table-responsive" style="margin-top:16px"><table class="custom-table"><thead><tr><th>Email</th><th>Role</th><th>Guru Terhubung</th></tr></thead><tbody id="adminAccountRows"></tbody></table></div></div><div class="contact-form" style="padding:24px"><div style="display:flex;justify-content:space-between;align-items:end;gap:16px;flex-wrap:wrap"><div><h3 style="font-size:1.2rem;font-weight:800;color:var(--dark)">Rekap Bulanan</h3><div style="font-size:.85rem;color:var(--muted)">Khusus administrator.</div></div><div style="display:flex;gap:10px;align-items:end"><div><label class="form-label" for="recapMonth">Bulan</label><input id="recapMonth" type="month" class="form-control" value="'+month+'"></div><button id="btnLoadRecap" type="button" class="btn btn-primary">Tampilkan</button></div></div><div class="table-responsive" style="margin-top:18px"><table class="custom-table"><thead><tr><th>Nama</th><th>Hadir</th><th>Izin</th><th>Sakit</th><th>Dinas</th><th>Total</th></tr></thead><tbody id="recapBody"></tbody></table></div></div>';
  $('btnLoadRecap').addEventListener('click',recap);recap();loadAdminAccounts();
}
function userBar(){
  const r=$('attendanceUserBar');if(!r)return;
  r.innerHTML='<div><strong>'+esc(state.profile.nama||state.user.email)+'</strong><span style="margin-left:8px;color:var(--muted)">('+(state.profile.role==='admin'?'Administrator':'Guru/Pegawai')+')</span></div><button type="button" id="btnLogoutAttendance" class="btn btn-sm btn-outline">Keluar</button>';
  $('btnLogoutAttendance').onclick=async()=>{await supabase.auth.signOut();location.reload()};
}
async function start(user){
  state.user=user;await profile(user);
  if(state.profile.role==='guru'&&!state.profile.guru_id){$('loginAlert').style.display='';$('loginAlert').textContent='Akun belum ditautkan ke data guru. Administrator perlu menghubungkan akun ini.';await supabase.auth.signOut();return}
  await people();fillPeople();userBar();adminUI();await today();loginView(false);
}
async function login(e){
  e.preventDefault();const b=$('btnLogin');b.disabled=true;b.textContent='Memproses...';
  const {data,error}=await supabase.auth.signInWithPassword({email:$('loginEmail').value.trim(),password:$('loginPassword').value});
  if(error){$('loginAlert').style.display='';$('loginAlert').textContent='Login gagal. Periksa email/password.'}else{try{await start(data.user)}catch(err){console.error(err);$('loginAlert').style.display='';$('loginAlert').textContent='Profil akun belum siap. Hubungi administrator.'}}
  b.disabled=false;b.textContent='Masuk ke Sistem Presensi';
}
async function init(){
  if(!$('formAbsensi'))return;
  $('formLogin')?.addEventListener('submit',login);$('formAbsensi')?.addEventListener('submit',save);$('pegawaiSelect')?.addEventListener('change',setJob);$('btnCetakAbsensi')?.addEventListener('click',()=>window.print());
  document.querySelectorAll('.filter-btn-absensi').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.filter-btn-absensi').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.filter=b.dataset.filter||'all';table()}));
  const {data:{session}}=await supabase.auth.getSession();
  if(session?.user){try{await start(session.user)}catch(err){console.error(err);loginView(true)}}else loginView(true);
}
document.addEventListener('DOMContentLoaded',init);
