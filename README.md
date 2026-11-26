# ⚡ Loader Hub - Güvenli Loader İletim ve Yönetim Portalı

Özel olarak hazırlanmış, modern ve fütüristik tasarıma sahip loader iletim ve yönetici kontrol sistemi.

---

## 🌟 Temel Özellikler

1. **Modern Kullanıcı Arayüzü (GUI)**:
   - Siber/Gaming karanlık neon teması, cam efekti (glassmorphism) ve pürüzsüz animasyonlar.
   - **"LOADER İLET"** butonu ile açılan hızlı gönderim penceresi.
   - İki farklı gönderim modu:
     - 📁 **Doğrudan Dosya Yükleme**: EXE, ZIP, RAR, 7Z, DLL vb. dosyaları sürükle-bırak veya dosya seçerek doğrudan sunucuya yükleme (İlerleme çubuğu ile).
     - 🔗 **Bağlantı / Link İletme**: Mega.nz, Google Drive, Mediafire vb. indirme linklerini iletme.
   - İsteğe bağlı isim/nickname, Discord kullanıcı adı ve loader hakkında açıklama/not ekleme.

2. **Otomatik Discord Yönlendirmesi**:
   - Kullanıcı dosya veya link gönderimini tamamladığı anda sistem otomatik olarak tarayıcıda yeni sekmede Discord sunucunuzu (`https://discord.gg/emEMXQCjba`) açar ve ekranda başarı bildirimi gösterir.

3. **Gizli ve Korumalı Yönetici (Admin) Paneli**:
   - **Ana menüde ve sitede kesinlikle hiçbir admin linki veya butonu yer almaz.**
   - Sadece belirlediğiniz gizli rota üzerinden erişilir (Varsayılan: `http://localhost:3000/secret-admin`).
   - Güvenli şifre korumalı giriş ekranı (Varsayılan şifre: `admin`).
   - Yönetici panelinde:
     - Gönderilen tüm loader'ların listesi (Gönderen adı, Discord bilgisi, tarih/saat, IP adresi, not).
     - **Doğrudan dosya olarak gönderilenler**: Tek tıkla "İndir" butonu ile güvenli dosya indirme.
     - **Link ile gönderilenler**: Linki görüntüleme, panoya kopyalama ve direkt yeni sekmede açma.
     - Arama çubuğu (isim, not, dosya adına göre anlık filtreleme).
     - Tür filtresi (Tümü / Sadece Dosyalar / Sadece Linkler).
     - Gönderim silme özelliği (dosyayı da sunucudan temizler).
     - Gönderim detay penceresi.

---

## 🚀 Başlatma ve Çalıştırma

Projeyi çalıştırmak için komut istemcisinde (Terminal / PowerShell) şu komutları uygulayın:

```bash
cd C:\Users\PhrA\.gemini\antigravity\scratch\loader-hub
npm start
```

Sunucu başladığında:
- 🌐 **Kullanıcı Ana Sayfası**: `http://localhost:3000`
- 🔒 **Gizli Admin Paneli**: `http://localhost:3000/secret-admin`

---

## ⚙️ Yapılandırma (`config.json`)

`config.json` dosyasını açarak tüm ayarları kolayca değiştirebilirsiniz:

```json
{
  "port": 3000,
  "adminPath": "/secret-admin",
  "adminPassword": "admin",
  "discordUrl": "https://discord.gg/emEMXQCjba",
  "maxFileSizeMB": 150
}
```

- **`adminPassword`**: Yönetici paneli şifreniz.
- **`adminPath`**: Gizli admin panelinin URL uzantısı (İstediğiniz gibi değiştirebilirsiniz, örn: `/ozel-yonetim-2026`).
- **`discordUrl`**: Gönderim sonrası açılacak Discord davet bağlantısı.
- **`maxFileSizeMB`**: Maksimum yüklenebilecek dosya boyutu (MB cinsinden).

---

## 📁 Dosya Yapısı

```
loader-hub/
├── config.json           # Sistem ayarları, admin şifresi ve discord linki
├── server.js             # Node.js Express backend sunucusu ve API
├── package.json          # Bağımlılıklar ve başlatma komutları
├── data/
│   └── submissions.json  # Gelen tüm gönderim kayıtları
├── uploads/              # Yüklenen fiziksel loader dosyaları (güvenli depolama)
└── public/
    ├── index.html        # Kullanıcı arayüzü (Ana sayfa)
    ├── admin.html        # Gizli Admin Paneli
    ├── css/
    │   └── style.css     # Siber tasarım ve stil kodları
    └── js/
        ├── app.js        # Ana sayfa mantığı ve dosya yükleme yöneticisi
        └── admin.js      # Yönetici paneli kontrolcüsü
```
