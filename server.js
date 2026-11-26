const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Yollar
const ROOT_DIR = __dirname;
const CONFIG_FILE = path.join(ROOT_DIR, 'config.json');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');

// Klasörleri garantiye al
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(SUBMISSIONS_FILE)) fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify([], null, 2), 'utf-8');

// Yapılandırma yükle veya oluştur
let config = {
  port: 3000,
  adminPath: "/secret-admin",
  adminPassword: "admin",
  discordUrl: "https://discord.gg/emEMXQCjba",
  maxFileSizeMB: 150
};

if (fs.existsSync(CONFIG_FILE)) {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    config = { ...config, ...JSON.parse(raw) };
  } catch (err) {
    console.error("Config okunamadı, varsayılanlar kullanılıyor.", err);
  }
} else {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

// Aktif admin oturum tokenları (Bellekte tutulur)
const activeSessions = new Set();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser('loader-hub-secret-key-2026'));

// Multer Dosya Yükleme Ayarları
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, 'loader-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: (config.maxFileSizeMB || 150) * 1024 * 1024
  }
});

// Veri okuma/yazma yardımcıları
function getSubmissions() {
  try {
    const data = fs.readFileSync(SUBMISSIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function saveSubmissions(list) {
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

// Admin Yetkilendirme Middleware
function requireAdmin(req, res, next) {
  const token = req.cookies.admin_token || req.headers['x-admin-token'];
  if (token && activeSessions.has(token)) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Yetkisiz erişim. Lütfen giriş yapın.' });
}

// -------------------------------------------------------------
// API ROTALARI
// -------------------------------------------------------------

// Genel Ayar Bilgisi
app.get('/api/config/public', (req, res) => {
  res.json({
    discordUrl: config.discordUrl,
    maxFileSizeMB: config.maxFileSizeMB
  });
});

// Loader İletme (Dosya veya Link)
app.post('/api/submit', upload.single('loaderFile'), (req, res) => {
  try {
    const { submitterName, contactInfo, note, submissionType, linkUrl } = req.body;

    if (!submissionType || (submissionType !== 'file' && submissionType !== 'link')) {
      return res.status(400).json({ success: false, message: 'Geçersiz gönderim tipi seçildi.' });
    }

    if (submissionType === 'link') {
      if (!linkUrl || !linkUrl.trim()) {
        return res.status(400).json({ success: false, message: 'Lütfen geçerli bir indirme linki girin.' });
      }
    } else if (submissionType === 'file') {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Lütfen yüklenecek dosyayı seçin.' });
      }
    }

    const id = 'sub_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    const newSubmission = {
      id: id,
      submitterName: (submitterName || 'Anonim').trim(),
      contactInfo: (contactInfo || 'Belirtilmedi').trim(),
      note: (note || '').trim(),
      submissionType: submissionType,
      createdAt: new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Bilinmiyor',
      status: 'pending' // pending, reviewed, downloaded
    };

    if (submissionType === 'file') {
      newSubmission.file = {
        originalName: req.file.originalname,
        storedName: req.file.filename,
        size: req.file.size,
        mimeType: req.file.mimetype
      };
    } else {
      newSubmission.linkUrl = linkUrl.trim();
    }

    const list = getSubmissions();
    list.unshift(newSubmission); // En yeniyi başa ekle
    saveSubmissions(list);

    res.json({
      success: true,
      message: 'Loader başarıyla iletildi! Teşekkür ederiz.',
      discordUrl: config.discordUrl
    });
  } catch (error) {
    console.error('Gönderim hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası: ' + error.message });
  }
});

// Admin Giriş
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: 'Şifre gereklidir.' });
  }

  if (password === config.adminPassword) {
    const token = 'token_' + crypto.randomBytes(32).toString('hex');
    activeSessions.add(token);

    res.cookie('admin_token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 saat
      sameSite: 'lax'
    });

    return res.json({ success: true, message: 'Giriş başarılı!', token: token });
  }

  return res.status(401).json({ success: false, message: 'Hatalı şifre girdiniz.' });
});

// Admin Çıkış
app.post('/api/admin/logout', (req, res) => {
  const token = req.cookies.admin_token || req.headers['x-admin-token'];
  if (token) {
    activeSessions.delete(token);
  }
  res.clearCookie('admin_token');
  res.json({ success: true, message: 'Çıkış yapıldı.' });
});

// Admin Oturum Kontrolü
app.get('/api/admin/check-auth', (req, res) => {
  const token = req.cookies.admin_token || req.headers['x-admin-token'];
  if (token && activeSessions.has(token)) {
    return res.json({ authenticated: true });
  }
  return res.json({ authenticated: false });
});

// Admin: Tüm Loader Gönderimlerini Listele
app.get('/api/admin/submissions', requireAdmin, (req, res) => {
  const list = getSubmissions();
  res.json({ success: true, submissions: list });
});

// Admin: Dosya İndirme
app.get('/api/admin/download/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  const list = getSubmissions();
  const item = list.find(s => s.id === id);

  if (!item || item.submissionType !== 'file' || !item.file) {
    return res.status(404).send('Dosya kaydı bulunamadı.');
  }

  const filePath = path.join(UPLOADS_DIR, item.file.storedName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Fiziksel dosya sunucuda bulunamadı.');
  }

  // Durumu güncelle
  item.status = 'downloaded';
  saveSubmissions(list);

  // Dosya akışını güvenle başlat
  const safeFilename = encodeURIComponent(item.file.originalName).replace(/['()]/g, escape);
  res.setHeader('Content-Disposition', `attachment; filename="${item.file.originalName}"; filename*=UTF-8''${safeFilename}`);
  res.setHeader('Content-Type', item.file.mimeType || 'application/octet-stream');

  const fileStream = fs.createReadStream(filePath);
  fileStream.on('error', (err) => {
    console.error('Dosya okuma hatası:', err);
    if (!res.headersSent) res.status(500).send('Dosya okunamadı.');
  });
  fileStream.pipe(res);
});

// Admin: Gönderim Silme
app.delete('/api/admin/submissions/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  const list = getSubmissions();
  const index = list.findIndex(s => s.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Kayıt bulunamadı.' });
  }

  const item = list[index];

  // Eğer dosya varsa fiziksel dosyayı da sil
  if (item.submissionType === 'file' && item.file && item.file.storedName) {
    const filePath = path.join(UPLOADS_DIR, item.file.storedName);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Dosya silinirken hata:', err);
      }
    }
  }

  list.splice(index, 1);
  saveSubmissions(list);

  res.json({ success: true, message: 'Gönderim başarıyla silindi.' });
});

// -------------------------------------------------------------
// ÖZEL VE GİZLİ ADMİN PANELİ ROTASI (Ana menüde linki yoktur!)
// -------------------------------------------------------------
const adminRoute = config.adminPath || '/secret-admin';

// Admin paneli sayfası (Doğrudan ve güvenli servis)
app.get(adminRoute, (req, res) => {
  const adminHtmlPath = path.join(ROOT_DIR, 'public', 'admin.html');
  if (fs.existsSync(adminHtmlPath)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(fs.readFileSync(adminHtmlPath, 'utf-8'));
  }
  return res.status(404).send('Admin paneli dosyası bulunamadı.');
});

// Statik Dosyalar (Public Klasörü)
app.use(express.static(path.join(ROOT_DIR, 'public'), { dotfiles: 'allow' }));

// Herhangi bir tanımlanmamış rota için ana sayfaya yönlendir
app.use((req, res) => {
  const indexHtmlPath = path.join(ROOT_DIR, 'public', 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(fs.readFileSync(indexHtmlPath, 'utf-8'));
  }
  return res.status(404).send('Sayfa bulunamadı.');
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Loader Hub Sistemi Yayında!`);
  console.log(`🌐 Ana Sayfa: http://localhost:${PORT}`);
  console.log(`🔒 Gizli Admin Paneli: http://localhost:${PORT}${adminRoute}`);
  console.log(`🔑 Varsayılan Admin Şifresi: ${config.adminPassword}`);
  console.log(`💬 Discord Linki: ${config.discordUrl}`);
  console.log(`=======================================================`);
});
