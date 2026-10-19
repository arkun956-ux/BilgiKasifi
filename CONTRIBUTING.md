# 🤝 Katkı Kılavuzu (Contributing to Bilgi Kâşifi)

"Bilgi Kâşifi" projesine katkıda bulunmak istediğiniz için teşekkür ederiz! Bu proje hem erken çocukluk eğitimi pedagojisinin hem de modern yazılım mühendisliğinin kesişiminde yer almaktadır.

---

## 1. Kodlama Standartları

1. **Framework-Free Vanilla JavaScript (ES6+):**
   * Harici ağır UI kütüphaneleri (React, Vue, Angular) yerine saf, okunabilir ve modüler ES6+ sınıfları (`class`) tercih edilmektedir.
   * Asenkron operasyonlarda `async/await` ve `Promise` yapıları kullanılmalı; tarayıcı ana iş parçacığı (main thread) bloklanmamalıdır.

2. **Okul Öncesi Erişilebilirlik Standartları (WCAG 2.1 AAA & Touch-First):**
   * Tüm dokunmatik butonlar ve kartlar en az **48x48 px** (tercihen 64px+) büyüklükte olmalıdır.
   * Yazı tipleri yuvarlak hatlı ve okunaklı olmalıdır (Google Fonts `Nunito` / `Fredoka`).
   * Okuma-yazma bilmeyen çocuklar için her işlem görsel bir ipucuyla (ARASAAC piktogramı, animasyon veya ses) desteklenmelidir.

3. **Pedagojik İstem (Prompting) Kurallarına Sadakat:**
   * `pedagogicalEngine.js` içindeki sistem istemine veya few-shot diyaloglarına yapılacak eklemeler, mutlaka **3 kurallı cümle formülünü** (1. Somut Bilgi + 2. Günlük Benzetme + 3. Sokratik Merak Sorusu) korumalıdır.
   * Türkçe söz dizimi bozukluklarına (calque / çeviri kokan yapılar) izin verilmez.

---

## 2. Commit Mesajı Formatı (Conventional Commits)

Commit mesajlarında uluslararası standartlara uyulmaktadır:

* `feat:` Yeni bir özellik eklendiğinde (Örn: `feat: add ARASAAC high-contrast cards`)
* `fix:` Bir hata düzeltildiğinde (Örn: `fix: prevent audio overlap on rapid clicks`)
* `perf:` Donanım ve gecikme optimizasyonlarında (Örn: `perf: reduce KV-cache context to 2048 tokens`)
* `docs:` Dokümantasyon ve literatür güncellemelerinde (Örn: `docs: update Whitebread 2009 metacognition matrix`)
* `refactor:` Kod yapısı iyileştirmelerinde (Örn: `refactor: extract procedural audio synthesis to soundEngine`)

---

## 3. Geliştirme Döngüsü

1. Projeyi çatallayın (`Fork`).
2. Yeni bir özellik dalı oluşturun (`git checkout -b feature/YeniOzellik`).
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Yeni ozellik eklendi'`).
4. Dalınızı itin (`git push origin feature/YeniOzellik`).
5. Bir **Pull Request (PR)** açın ve pedagojik/teknik gerekçesini detaylandırın.
