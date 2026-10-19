# 🛡️ Güvenlik ve Çocuk Veri Gizliliği Politikası (Security & Child Safety by Design)

"Bilgi Kâşifi" projesi, erken çocukluk dönemindeki (48–66 ay) çocukların dijital güvenliğini, psikolojik esenliğini ve veri mahremiyetini en üst düzeyde korumak üzere tasarlanmıştır.

Proje mimarisi; **UNICEF Yapay Zekâ ve Çocuk Hakları İlkeleri (2021)**, **KVKK (Kişisel Verilerin Korunması Kanunu)** ve **COPPA (Children's Online Privacy Protection Act)** ilkelerine tam uyumludur.

---

## 1. Temel Güvenlik İlkeleri

### 1.1. %100 Çevrim Dışı (Air-Gapped / Zero-Cloud Telemetry)
* Uygulama hiçbir bulut sunucusuna ses, metin, kullanıcı kimliği veya analitik verisi göndermez.
* Tüm LLM çıkarımı ve ses işleme işlemleri okul/sınıf bünyesindeki yerel donanımda (`127.0.0.1:11434`) tamamlanır.
* İnternet bağlantısı kopsa veya cihaz tamamen ağdan yalıtılsa dahi sistem kesintisiz çalışmaya devam eder.

### 1.2. İki Katmanlı Kırmızı Çizgi (Hassas İçerik) Filtresi
Çocukların yaşantılarında karşılaşabileceği travmatik veya gelişimsel olarak uygun olmayan durumları tespit etmek amacıyla **çift katmanlı deterministik bir kalkan** kullanılır:

1. **İstem Öncesi Filtreleme (`checkSensitiveContent`):**
   * Çocuğun girdisi LLM'e iletilmeden önce 21 anahtar kelimelik travmatik/hassas kelime listesiyle (`öldü`, `kaza`, `kan`, `silah`, `korkunç`, `ayrılmak` vb.) taranır.
   * Eşleşme tespit edildiğinde yapay zekâ modeli kesinlikle devreye sokulmaz. Önceden uzman pedagoglar tarafından kaleme alınmış şefkatli yönlendirme mesajı devreye girer.
2. **Öğretmen / Araştırmacı Alarm Sistemi:**
   * Hassas içerik tetiklendiğinde durum gizlice Öğretmen Paneline (`teacherDashboard.js`) kaydedilir; çocuğun sınıf öğretmeni veya rehberlik uzmanı anında bilgilendirilir.

### 1.3. Anonimleştirilmiş Araştırma Verisi
* Oturum verileri yerel tarayıcı belleğinde (`localStorage`) tutulur.
* Dışa aktarılan JASP/SPSS veri setlerinde çocukların adları ve kimlik bilgileri yerine rastgele kriptografik olmayan araştırma kodları (`KOD_D_1`, `KOD_K_2`) kullanılır.

---

## 2. Güvenlik Açığı Bildirimi

Bu açık kaynaklı yazılımda veya pedagojik filtrelerde herhangi bir güvenlik veya etik ihlal şüphesi tespit ederseniz, lütfen GitHub Issues üzerinden herkese açık paylaşım yapmadan önce doğrudan araştırmacı ile iletişime geçiniz:

📧 **İletişim:** `arkun956@gmail.com`  
*Bildirilen güvenlik açıkları ve etik iyileştirme talepleri 24-48 saat içerisinde değerlendirilir.*
