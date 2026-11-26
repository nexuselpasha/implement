// Loader Hub - Client Side Controller

let currentSubmissionType = 'file';
let selectedFile = null;
const DISCORD_FALLBACK_URL = "https://discord.gg/emEMXQCjba";

// DOM Elemanları
const submitModal = document.getElementById('submitModal');
const modalBox = document.getElementById('modalBox');
const successModal = document.getElementById('successModal');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropPrompt = document.getElementById('dropPrompt');
const fileSelectedInfo = document.getElementById('fileSelectedInfo');
const selectedFileName = document.getElementById('selectedFileName');
const selectedFileSize = document.getElementById('selectedFileSize');
const fileSection = document.getElementById('fileSection');
const linkSection = document.getElementById('linkSection');
const tabFileBtn = document.getElementById('tabFileBtn');
const tabLinkBtn = document.getElementById('tabLinkBtn');
const submissionTypeInput = document.getElementById('submissionType');
const uploadProgressContainer = document.getElementById('uploadProgressContainer');
const uploadProgressBar = document.getElementById('uploadProgressBar');
const uploadPercentText = document.getElementById('uploadPercentText');
const uploadStatusText = document.getElementById('uploadStatusText');
const submitBtn = document.getElementById('submitBtn');
const submitBtnText = document.getElementById('submitBtnText');

// Modal Kontrolleri
function openSubmitModal() {
  submitModal.classList.remove('opacity-0', 'pointer-events-none');
  modalBox.classList.remove('scale-95');
  modalBox.classList.add('scale-100');
  document.body.style.overflow = 'hidden';
}

function closeSubmitModal() {
  submitModal.classList.add('opacity-0', 'pointer-events-none');
  modalBox.classList.remove('scale-100');
  modalBox.classList.add('scale-95');
  document.body.style.overflow = 'auto';
}

function openSuccessModal(discordUrl) {
  const directBtn = document.getElementById('discordDirectLink');
  if (directBtn && discordUrl) {
    directBtn.href = discordUrl;
  }
  successModal.classList.remove('opacity-0', 'pointer-events-none');
  const innerBox = successModal.querySelector('.glass-panel');
  if (innerBox) {
    innerBox.classList.remove('scale-95');
    innerBox.classList.add('scale-100');
  }
  document.body.style.overflow = 'hidden';
}

function closeSuccessModal() {
  successModal.classList.add('opacity-0', 'pointer-events-none');
  const innerBox = successModal.querySelector('.glass-panel');
  if (innerBox) {
    innerBox.classList.remove('scale-100');
    innerBox.classList.add('scale-95');
  }
  document.body.style.overflow = 'auto';
}

// Modal dışına tıklandığında kapatma
submitModal.addEventListener('click', (e) => {
  if (e.target === submitModal) closeSubmitModal();
});

successModal.addEventListener('click', (e) => {
  if (e.target === successModal) closeSuccessModal();
});

// ESC tuşu ile kapatma
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeSubmitModal();
    closeSuccessModal();
  }
});

// Sekme Değiştirme (Dosya vs Link)
function switchTab(type) {
  currentSubmissionType = type;
  submissionTypeInput.value = type;

  if (type === 'file') {
    // Sekme Buton Stilleri
    tabFileBtn.className = 'py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-600/30';
    tabLinkBtn.className = 'py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all text-gray-400 hover:text-white';
    
    fileSection.classList.remove('hidden');
    linkSection.classList.add('hidden');
  } else {
    // Link Sekmesi
    tabLinkBtn.className = 'py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all bg-cyan-600 text-white shadow-lg shadow-cyan-600/30';
    tabFileBtn.className = 'py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all text-gray-400 hover:text-white';
    
    linkSection.classList.remove('hidden');
    fileSection.classList.add('hidden');
  }
}

// Dosya Seçim & Drag-Drop Yönetimi
if (dropZone) {
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('dragover');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });
}

function handleFileSelect(input) {
  if (input.files && input.files[0]) {
    handleFile(input.files[0]);
  }
}

function handleFile(file) {
  const maxBytes = 150 * 1024 * 1024; // 150MB
  if (file.size > maxBytes) {
    showToast('Dosya boyutu 150 MB sınırını aşıyor!', 'error');
    clearSelectedFile();
    return;
  }

  selectedFile = file;
  selectedFileName.textContent = file.name;
  selectedFileSize.textContent = formatBytes(file.size);

  dropPrompt.classList.add('hidden');
  fileSelectedInfo.classList.remove('hidden');
}

function clearSelectedFile(e) {
  if (e) e.stopPropagation();
  selectedFile = null;
  fileInput.value = '';
  dropPrompt.classList.remove('hidden');
  fileSelectedInfo.classList.add('hidden');
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Form Gönderim İşlemi
function handleFormSubmit(e) {
  e.preventDefault();

  const submitterName = document.getElementById('submitterName').value.trim();
  const contactInfo = document.getElementById('contactInfo').value.trim();
  const note = document.getElementById('note').value.trim();
  const linkUrl = document.getElementById('linkUrl').value.trim();

  // Doğrulama
  if (currentSubmissionType === 'file') {
    if (!selectedFile) {
      showToast('Lütfen iletmek istediğiniz loader dosyasını seçin!', 'warning');
      return;
    }
  } else {
    if (!linkUrl) {
      showToast('Lütfen geçerli bir indirme linki girin!', 'warning');
      return;
    }
  }

  // FormData Hazırlığı
  const formData = new FormData();
  formData.append('submissionType', currentSubmissionType);
  formData.append('submitterName', submitterName);
  formData.append('contactInfo', contactInfo);
  formData.append('note', note);

  if (currentSubmissionType === 'file') {
    formData.append('loaderFile', selectedFile);
  } else {
    formData.append('linkUrl', linkUrl);
  }

  // UI Yükleme Durumuna Geçir
  submitBtn.disabled = true;
  submitBtn.classList.add('opacity-70', 'cursor-not-allowed');
  submitBtnText.textContent = 'İletiliyor, lütfen bekleyin...';
  uploadProgressContainer.classList.remove('hidden');
  uploadProgressBar.style.width = '0%';
  uploadPercentText.textContent = '0%';
  uploadStatusText.textContent = 'Gönderiliyor...';

  // XHR ile Yükleme ve İlerleme Takibi
  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/submit', true);

  // İlerleme Çubuğu
  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      const percentComplete = Math.round((event.loaded / event.total) * 100);
      uploadProgressBar.style.width = percentComplete + '%';
      uploadPercentText.textContent = percentComplete + '%';
      if (percentComplete === 100) {
        uploadStatusText.textContent = 'İşleniyor & Kaydediliyor...';
      }
    }
  };

  xhr.onload = function () {
    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
    submitBtnText.textContent = 'İLET VE DİSCORD\'A KATIL';
    uploadProgressContainer.classList.add('hidden');

    try {
      const response = JSON.parse(xhr.responseText);
      if (xhr.status === 200 && response.success) {
        // Formu temizle ve kapat
        document.getElementById('submissionForm').reset();
        clearSelectedFile();
        closeSubmitModal();

        // Discord linkini al
        const targetDiscord = response.discordUrl || DISCORD_FALLBACK_URL;

        // Discord'u yeni sekmede aç (kullanıcının isteği)
        try {
          window.open(targetDiscord, '_blank');
        } catch (err) {
          console.warn('Popup engelleyici araya girdi:', err);
        }

        // Başarı modalını göster
        openSuccessModal(targetDiscord);
        showToast('Loader başarıyla iletildi!', 'success');

      } else {
        showToast(response.message || 'Gönderim sırasında hata oluştu.', 'error');
      }
    } catch (err) {
      showToast('Sunucu yanıtı okunamadı.', 'error');
    }
  };

  xhr.onerror = function () {
    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
    submitBtnText.textContent = 'İLET VE DİSCORD\'A KATIL';
    uploadProgressContainer.classList.add('hidden');
    showToast('Ağ hatası veya sunucuya erişilemiyor!', 'error');
  };

  xhr.send(formData);
}

// Toast Bildirimi
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
  } else if (type === 'warning') {
    bgClass = 'bg-amber-950/90 border-amber-500/50 text-amber-200';
    icon = 'fa-triangle-exclamation text-amber-400';
  }

  toast.className = `flex items-center space-x-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-xl text-sm transition-all duration-300 transform translate-y-3 opacity-0 pointer-events-auto ${bgClass}`;
  toast.innerHTML = `
    <i class="fa-solid ${icon} text-lg shrink-0"></i>
    <span class="font-medium">${message}</span>
  `;

  container.appendChild(toast);

  // Animasyon
  setTimeout(() => {
    toast.classList.remove('translate-y-3', 'opacity-0');
  }, 10);

  // Otomatik silme
  setTimeout(() => {
    toast.classList.add('translate-y-3', 'opacity-0');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}
