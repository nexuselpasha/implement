// Loader Hub - Admin Controller

let submissions = [];
let activeFilter = 'all';

// DOM Referansları
const loginScreen = document.getElementById('loginScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const loginError = document.getElementById('loginError');
const submissionsTableBody = document.getElementById('submissionsTableBody');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const statTotal = document.getElementById('statTotal');
const statFiles = document.getElementById('statFiles');
const statLinks = document.getElementById('statLinks');
const countAll = document.getElementById('countAll');
const countFile = document.getElementById('countFile');
const countLink = document.getElementById('countLink');
const detailModal = document.getElementById('detailModal');
const detailContent = document.getElementById('detailContent');

// Sayfa yüklendiğinde oturum kontrolü yap
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});

// Oturum Doğrulama
async function checkAuth() {
  try {
    const res = await fetch('/api/admin/check-auth');
    const data = await res.json();
    if (data.authenticated) {
      showDashboard();
    } else {
      showLogin();
    }
  } catch (err) {
    showLogin();
  }
}

function showLogin() {
  loginScreen.classList.remove('hidden');
  dashboardScreen.classList.add('hidden');
}

function showDashboard() {
  loginScreen.classList.add('hidden');
  dashboardScreen.classList.remove('hidden');
  fetchSubmissions();
}

function togglePasswordVisibility() {
  const input = document.getElementById('adminPassword');
  const icon = document.getElementById('eyeIcon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fa-solid fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fa-solid fa-eye';
  }
}

// Giriş Yapma
async function handleLogin(e) {
  e.preventDefault();
  const password = document.getElementById('adminPassword').value;
  const loginBtn = document.getElementById('loginBtn');

  loginBtn.disabled = true;
  loginBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Giriş yapılıyor...';
  loginError.classList.add('hidden');

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showDashboard();
      showToast('Giriş başarılı!', 'success');
    } else {
      loginError.textContent = data.message || 'Hatalı şifre!';
      loginError.classList.remove('hidden');
    }
  } catch (err) {
    loginError.textContent = 'Bağlantı hatası oluştu.';
    loginError.classList.remove('hidden');
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> <span>PANELE GİRİŞ YAP</span>';
  }
}

// Çıkış Yapma
async function handleLogout() {
  try {
    await fetch('/api/admin/logout', { method: 'POST' });
    showToast('Çıkış yapıldı', 'info');
    showLogin();
  } catch (e) {
    showLogin();
  }
}

// Gönderimleri API'den Çek
async function fetchSubmissions() {
  const refreshIcon = document.getElementById('refreshIcon');
  if (refreshIcon) refreshIcon.classList.add('fa-spin');
  loadingState.classList.remove('hidden');
  emptyState.classList.add('hidden');
  submissionsTableBody.innerHTML = '';

  try {
    const res = await fetch('/api/admin/submissions');
    if (res.status === 401) {
      showLogin();
      return;
    }
    const data = await res.json();
    if (data.success) {
      submissions = data.submissions || [];
      updateStats();
      applyFilters();
    }
  } catch (err) {
    showToast('Veriler yüklenirken hata oluştu', 'error');
  } finally {
    loadingState.classList.add('hidden');
    if (refreshIcon) refreshIcon.classList.remove('fa-spin');
  }
}

// İstatistikleri Güncelle
function updateStats() {
  const total = submissions.length;
  const fileCount = submissions.filter(s => s.submissionType === 'file').length;
  const linkCount = submissions.filter(s => s.submissionType === 'link').length;

  statTotal.textContent = total;
  statFiles.textContent = fileCount;
  statLinks.textContent = linkCount;

  countAll.textContent = total;
  countFile.textContent = fileCount;
  countLink.textContent = linkCount;
}

// Filtre Seçimi
function setFilter(type) {
  activeFilter = type;

  const btnAll = document.getElementById('filterAll');
  const btnFile = document.getElementById('filterFile');
  const btnLink = document.getElementById('filterLink');

  [btnAll, btnFile, btnLink].forEach(btn => {
    btn.className = 'px-4 py-2 rounded-xl text-xs font-bold glass-panel text-gray-400 hover:text-white transition';
  });

  if (type === 'all') {
    btnAll.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-md shadow-indigo-600/30 transition';
  } else if (type === 'file') {
    btnFile.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 text-white shadow-md shadow-cyan-600/30 transition';
  } else if (type === 'link') {
    btnLink.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white shadow-md shadow-purple-600/30 transition';
  }

  applyFilters();
}

// Filtre ve Arama Uygula
function applyFilters() {
  const searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();

  const filtered = submissions.filter(item => {
    // Tür filtresi
    if (activeFilter !== 'all' && item.submissionType !== activeFilter) {
      return false;
    }

    // Arama filtresi
    if (searchTerm) {
      const name = (item.submitterName || '').toLowerCase();
      const contact = (item.contactInfo || '').toLowerCase();
      const note = (item.note || '').toLowerCase();
      const filename = item.file ? (item.file.originalName || '').toLowerCase() : '';
      const link = (item.linkUrl || '').toLowerCase();

      return name.includes(searchTerm) || 
             contact.includes(searchTerm) || 
             note.includes(searchTerm) || 
             filename.includes(searchTerm) || 
             link.includes(searchTerm);
    }

    return true;
  });

  renderTable(filtered);
}

// Tabloyu Ekrana Bas
function renderTable(list) {
  submissionsTableBody.innerHTML = '';

  if (list.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  } else {
    emptyState.classList.add('hidden');
  }

  list.forEach(item => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-800/40 transition group';

    const isFile = item.submissionType === 'file';
    const dateFormatted = new Date(item.createdAt).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Gönderen Sütunu
    const submitterCol = `
      <td class="py-4 px-6">
        <div class="font-bold text-white flex items-center gap-2">
          <span>${escapeHtml(item.submitterName)}</span>
        </div>
        <div class="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
          <i class="fa-brands fa-discord text-[#5865F2] text-xs"></i>
          <span>${escapeHtml(item.contactInfo)}</span>
        </div>
      </td>
    `;

    // Tür Sütunu
    const typeCol = `
      <td class="py-4 px-6">
        ${isFile ? `
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            <i class="fa-solid fa-file text-[10px]"></i> Dosya
          </span>
        ` : `
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30">
            <i class="fa-solid fa-link text-[10px]"></i> Bağlantı
          </span>
        `}
      </td>
    `;

    // İçerik Sütunu
    let contentCol = '';
    if (isFile && item.file) {
      contentCol = `
        <td class="py-4 px-6">
          <div class="flex items-center space-x-3">
            <div class="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <i class="fa-solid fa-file-arrow-down"></i>
            </div>
            <div class="truncate max-w-xs">
              <p class="font-semibold text-white truncate text-xs sm:text-sm" title="${escapeHtml(item.file.originalName)}">
                ${escapeHtml(item.file.originalName)}
              </p>
              <p class="text-[11px] text-gray-400">${formatBytes(item.file.size)}</p>
            </div>
          </div>
        </td>
      `;
    } else {
      const link = item.linkUrl || '';
      contentCol = `
        <td class="py-4 px-6">
          <div class="flex items-center space-x-2 max-w-xs">
            <a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" 
               class="text-xs text-indigo-300 hover:text-cyan-300 truncate font-mono underline max-w-[200px]" title="${escapeHtml(link)}">
              ${escapeHtml(link)}
            </a>
            <button onclick="copyToClipboard('${escapeJs(link)}')" title="Linki Kopyala" 
                    class="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition">
              <i class="fa-regular fa-copy text-xs"></i>
            </button>
          </div>
        </td>
      `;
    }

    // Not Sütunu
    const noteCol = `
      <td class="py-4 px-6 max-w-[180px]">
        <p class="text-xs text-gray-300 truncate" title="${escapeHtml(item.note || 'Not yok')}">
          ${item.note ? escapeHtml(item.note) : '<span class="text-gray-500 italic">Not yok</span>'}
        </p>
      </td>
    `;

    // Tarih Sütunu
    const dateCol = `
      <td class="py-4 px-6 text-xs text-gray-400 whitespace-nowrap">
        ${dateFormatted}
      </td>
    `;

    // İşlemler Sütunu
    let actionButtons = '';
    if (isFile) {
      actionButtons += `
        <a href="/api/admin/download/${item.id}" 
           class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
           title="Dosyayı İndir">
          <i class="fa-solid fa-download"></i>
          <span>İndir</span>
        </a>
      `;
    } else {
      actionButtons += `
        <a href="${escapeHtml(item.linkUrl)}" target="_blank" rel="noopener noreferrer" 
           class="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-600/30"
           title="Linki Yeni Sekmede Aç">
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
          <span>Aç</span>
        </a>
      `;
    }

    actionButtons += `
      <button onclick="viewDetail('${item.id}')" 
              class="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs transition" 
              title="Detayları Gör">
        <i class="fa-solid fa-eye"></i>
      </button>
      <button onclick="deleteSubmission('${item.id}')" 
              class="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs transition" 
              title="Sil">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    `;

    const actionsCol = `
      <td class="py-4 px-6 text-right whitespace-nowrap">
        <div class="flex items-center justify-end space-x-2">
          ${actionButtons}
        </div>
      </td>
    `;

    tr.innerHTML = submitterCol + typeCol + contentCol + noteCol + dateCol + actionsCol;
    submissionsTableBody.appendChild(tr);
  });
}

// Detay Modalını Aç
function viewDetail(id) {
  const item = submissions.find(s => s.id === id);
  if (!item) return;

  const isFile = item.submissionType === 'file';
  const dateFormatted = new Date(item.createdAt).toLocaleString('tr-TR');

  detailContent.innerHTML = `
    <div class="p-4 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-3">
      <div>
        <p class="text-xs text-gray-500 uppercase font-bold">Gönderen Kişi</p>
        <p class="text-base font-bold text-white">${escapeHtml(item.submitterName)}</p>
      </div>
      <div>
        <p class="text-xs text-gray-500 uppercase font-bold">Discord / İletişim</p>
        <p class="text-sm text-indigo-400 font-mono">${escapeHtml(item.contactInfo)}</p>
      </div>
      <div>
        <p class="text-xs text-gray-500 uppercase font-bold">Gönderim Tarihi & Saati</p>
        <p class="text-xs text-gray-300">${dateFormatted}</p>
      </div>
      <div>
        <p class="text-xs text-gray-500 uppercase font-bold">Gönderen IP Adresi</p>
        <p class="text-xs text-gray-400 font-mono">${escapeHtml(item.ip || 'Bilinmiyor')}</p>
      </div>
    </div>

    <div class="p-4 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-2">
      <p class="text-xs text-gray-500 uppercase font-bold">Gönderilen Loader İçeriği</p>
      ${isFile && item.file ? `
        <div class="flex items-center justify-between p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
          <div>
            <p class="font-bold text-white text-sm">${escapeHtml(item.file.originalName)}</p>
            <p class="text-xs text-gray-400">${formatBytes(item.file.size)} &bull; ${escapeHtml(item.file.mimeType || 'Bilinmiyor')}</p>
          </div>
          <a href="/api/admin/download/${item.id}" class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1">
            <i class="fa-solid fa-download"></i> İndir
          </a>
        </div>
      ` : `
        <div class="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 break-all">
          <p class="text-xs text-gray-400 mb-1">Paylaşılan Bağlantı:</p>
          <a href="${escapeHtml(item.linkUrl)}" target="_blank" class="text-sm text-cyan-300 underline font-mono">
            ${escapeHtml(item.linkUrl)}
          </a>
        </div>
      `}
    </div>

    <div class="p-4 rounded-2xl bg-gray-900/80 border border-gray-800">
      <p class="text-xs text-gray-500 uppercase font-bold mb-1">Açıklama / Not</p>
      <p class="text-sm text-gray-300 whitespace-pre-wrap">${item.note ? escapeHtml(item.note) : 'Herhangi bir not eklenmedi.'}</p>
    </div>
  `;

  detailModal.classList.remove('opacity-0', 'pointer-events-none');
  const box = document.getElementById('detailBox');
  if (box) {
    box.classList.remove('scale-95');
    box.classList.add('scale-100');
  }
}

function closeDetailModal() {
  detailModal.classList.add('opacity-0', 'pointer-events-none');
  const box = document.getElementById('detailBox');
  if (box) {
    box.classList.remove('scale-100');
    box.classList.add('scale-95');
  }
}

detailModal.addEventListener('click', (e) => {
  if (e.target === detailModal) closeDetailModal();
});

// Gönderim Silme
async function deleteSubmission(id) {
  if (!confirm('Bu loader kaydını (ve varsa dosyasını) silmek istediğinize emin misiniz?')) {
    return;
  }

  try {
    const res = await fetch(`/api/admin/submissions/${id}`, {
      method: 'DELETE'
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Kayıt başarıyla silindi', 'success');
      fetchSubmissions();
    } else {
      showToast(data.message || 'Silme işlemi başarısız', 'error');
    }
  } catch (err) {
    showToast('Silinirken hata oluştu', 'error');
  }
}

// Yardımcılar
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Bağlantı panoya kopyalandı!', 'info');
  }).catch(() => {
    showToast('Kopyalama başarısız', 'error');
  });
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeJs(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  let bgClass = 'bg-gray-900 border-indigo-500/40 text-indigo-300';
  let icon = 'fa-circle-info';

  if (type === 'success') {
    bgClass = 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200';
    icon = 'fa-circle-check text-emerald-400';
  } else if (type === 'error') {
    bgClass = 'bg-rose-950/90 border-rose-500/50 text-rose-200';
    icon = 'fa-circle-exclamation text-rose-400';
  }

  toast.className = `flex items-center space-x-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-xl text-sm transition-all duration-300 transform translate-y-3 opacity-0 pointer-events-auto ${bgClass}`;
  toast.innerHTML = `
    <i class="fa-solid ${icon} text-lg shrink-0"></i>
    <span class="font-medium">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('translate-y-3', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('translate-y-3', 'opacity-0');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}
