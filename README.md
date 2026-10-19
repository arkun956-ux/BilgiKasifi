# 🐾 Bilgi Kâşifi (Okul Öncesi Yapay Zekâ Destekli İlgi Merkezi)

> **Erken Çocuklukta Üstbilişsel Düşünme Becerilerini Destekleyen, %100 Çevrim Dışı (Offline / Local-First), Çocuk Güvenliği ve KVKK Uyumlu Yapay Zekâ Kiosk Mimarisi**

[![Vanilla JavaScript](https://img.shields.io/badge/Frontend-Vanilla%20JS%20(ES6%2B)-F7DF1E?logo=javascript&logoColor=black)](#)
[![Local LLM](https://img.shields.io/badge/Local%20LLM-Ollama%20%7C%20Gemma%204%20(8B)-4285F4?logo=google&logoColor=white)](#)
[![Offline First](https://img.shields.io/badge/Architecture-Local--First%20%7C%20Zero--Backend-10B981)](#)
[![Web Speech API](https://img.shields.io/badge/Audio-Streaming%20TTS%20%26%20STT-FF6F00)](#)
[![Web Audio API](https://img.shields.io/badge/Sound-Procedural%20Web%20Audio-9C27B0)](#)
[![Windows Kiosk](https://img.shields.io/badge/Deployment-Windows%20Kiosk%20(.exe)-0078D6?logo=windows&logoColor=white)](#)

---

## 📌 1. Proje Özeti ve Pedagojik Felsefe

**Bilgi Kâşifi**, 4–5 yaş (48–66 ay) okul öncesi çocuklarının soru sorma, merak, strateji geliştirme ve düşünme süreçlerini fark etme (üstbiliş / metacognition) becerilerini desteklemek üzere geliştirilmiş yapay zekâ tabanlı bir öğrenme merkezidir.

Çocuklar, ekrandaki sevimli ve etkileşimli turuncu tekir kedi maskotuyla sesli veya görsel iletişim kartlarıyla konuşur. Maskot; çocuğun bilişsel düzeyine (Piaget'nin *İşlem Öncesi Dönemi* ve Vygotsky'nin *Yakınsak Gelişim Alanı / İskeleleme*) uygun biçimde **her zaman 3 kurallı cümleyle** yanıt verir:
1. **1. Cümle (Doğru ve Somut Bilgi):** Çocuğun sorusuna gerçek, bilimsel ve net bilgi sunar.
2. **2. Cümle (Günlük Hayattan Benzetme):** Çocuğun somut dünyasından bir metafor kurar (ayna, pipet, top, karpuz vb.).
3. **3. Cümle (Sokratik Merak Sorusu):** *"Peki sence..."* kalıbıyla çocuğu yeni bir tahmine ve bilişötesi düşünmeye yönlendirir.

---

## 🏗️ 2. Sistem Mimarisi (Zero-Backend / Local-First SPA)

Uygulama, bulut bağımlılığı olmayan, internet erişimi gerektirmeyen ve harici bir ara katmana (Node.js/Python proxy) ihtiyaç duymayan **Local-First Tek Sayfa Uygulaması (SPA)** mimarisinde geliştirilmiştir.

```mermaid
flowchart TD
    subgraph UI["İstemci Arayüzü (Vanilla JS ES6+ / HTML5 / CSS3)"]
        ChildInput["Çocuk Girişi (Web Speech STT / Hızlı Merak Kartları / Klavye)"]
        AppOrch["app.js (ChildExplorerApp - Ana Orkestratör)"]
        Mascot["mascot.js (Katmanlı SVG Kedi & 4 Durumlu FSM)"]
        Sound["soundEngine.js (Web Audio API Prosedürel Sesler)"]
        Teacher["teacherDashboard.js (Öğretmen & Araştırmacı Paneli)"]
    end

    subgraph Engine["Pedagojik & Analitik Motor (İstemci İçi)"]
        PedEngine["pedagogicalEngine.js (Few-Shot, Kırmızı Çizgi & 5N1K Motoru)"]
        Storage["storageService.js (localStorage & JASP/SPSS CSV)"]
    end

    subgraph LocalAI["Yerel Yapay Zekâ Motoru (127.0.0.1:11434)"]
        OllamaClient["ollamaClient.js (Streaming NDJSON HTTP Client)"]
        Gemma4["Ollama Sunucusu — Model: gemma4:latest (8.0B, Q4_K_M)"]
    end

    ChildInput -->|Ses / Metin Girdisi| AppOrch
    AppOrch -->|1. Hassas İçerik Denetimi| PedEngine
    PedEngine -->|Güvenli: Sistem İstemi + 4 Few-Shot Çifti| AppOrch
    AppOrch -->|2. Durum: listening -> thinking| Mascot
    AppOrch -->|3. POST /api/chat (stream: true, think: false)| OllamaClient
    OllamaClient <-->|NDJSON Token Akışı| Gemma4
    OllamaClient -->|onSentenceComplete: Cümle Bazlı TTS Kuyruğu| AppOrch
    AppOrch -->|4. Durum: speaking (130ms Lip-Sync)| Mascot
    AppOrch -->|5. onDone: analyzeAndScore()| PedEngine
    PedEngine -->|Puan, Yıldız, Konu ve Alarmlar| Storage
    Storage <-->|JASP / SPSS CSV Veri Çıktısı| Teacher
```

### Neden Local-First?
* **Çocuk Veri Gizliliği (KVKK / COPPA):** Çocukların ses kayıtları veya diyalogları asla harici bulut sunucularına aktarılmaz. Sistem tamamen hava boşluklu (air-gapped / internetsiz) çalışır.
* **Sıfır Sunucu Gecikmesi (0 ms Latency):** Tarayıcı doğrudan yerel makinedeki Ollama REST API ile konuşarak ağ serileştirme yükünü ortadan kaldırır.

---

## 💻 3. Modüler Kod Mimarisi

| Dosya | Görev ve Teknik Rolü |
| :--- | :--- |
| **`index.html`** | İki sütunlu çocuk dostu arayüz: Sol panelde SVG kedi maskotu, düşünce balonları ve konuşma balonu; sağ panelde ARASAAC piktogramlı 6 adet Hızlı Merak Kartı, sohbet akışı ve mikrofon. |
| **`app.js`** | `ChildExplorerApp` sınıfı. Web Speech STT/TTS yaşam döngüsü, mesaj geçmişi (`conversationHistory`), maskot durum geçişleri ve streaming seslendirme kuyruğunu yöneten ana orkestratör. |
| **`ollamaClient.js`** | `OllamaClient` sınıfı. Yerel Ollama `/api/chat` uç noktasıyla `ReadableStream` ve `TextDecoder` üzerinden haberleşir. Cümle bitişlerini (`[.!?\n]`) anlık yakalayarak sesi gecikmesiz üretir. |
| **`pedagogicalEngine.js`** | `PedagogicalEngine` sınıfı. 3 katmanlı pedagojik istem, 4 çift çok-turlu Few-Shot diyaloğu, 21 kelimelik Kırmızı Çizgi güvenlik filtresi ve 0 ms deterministik puanlama motoru. |
| **`mascot.js`** | `MascotController` sınıfı. Katmanlı SVG turuncu tekir kedi maskotu. 4 durumlu Sonlu Durum Makinesi (`idle`, `listening`, `thinking`, `speaking`), 130 ms döngülü kesintisiz dudak senkronizasyonu (`startLipSync`) ve patlatılabilir düşünce balonları. |
| **`soundEngine.js`** | `SoundEngine` sınıfı. Harici `.mp3` veya `.wav` dosyası olmadan Web Audio API osilatörleri ile balon patlatma, ödül fanfarı ve düşünme ışıltısı seslerini matematiksel olarak sentezler. |
| **`storageService.js`** | `StorageService` sınıfı. Tüm oturumları `localStorage`'da tutar; tek tıkla UTF-8 BOM'lu, KVKK anonimleştirilmiş (`KOD_D_1`) JASP / SPSS uyumlu CSV veri seti üretir. |
| **`teacherDashboard.js`** | `TeacherDashboard` sınıfı. Öğretmen ve araştırmacı kontrol paneli; Deney/Kontrol grupları, Sınıf İlgi Haritası çubukları ve Kırmızı Çizgi alarmları. |

---

## ⚡ 4. Çözülen Kritik Mühendislik Darboğazları

### A. 4 GB VRAM (GTX 1650) Donanımında 8B Gemma 4 Optimizasyonu
* **Problem:** 8 Milyar parametreli `gemma4:latest` (Q4_K_M, ~9.6 GB) modeli 4 GB VRAM'e sahip sistemde ilk kelimeyi **30–35 saniyede** üretiyordu.
* **Çözüm:**
  1. `think: false` parametresiyle modelin içsel akıl yürütme (reasoning) token'ları kapatıldı.
  2. Modelin varsayılan 128K'lık devasa KV-Cache penceresi `num_ctx: 2048` değerine çekildi.
  3. Açılışta sessiz bir `warmupModel()` çağrısı yapılarak model `keep_alive: -1` ile bellekte sıcak tutuldu.
* **Sonuç:** İlk cümle üretim süresi (TTFT) **35 saniyeden ~1.5 saniyeye**, toplam yanıt süresi 4–8 saniye bandına indirildi.

### B. Cümle Bazlı Akışkan Seslendirme (Sentence-Level Streaming TTS)
* **Problem:** 4–5 yaş çocuğu cevabın tamamlanması için 6–8 saniye bekletildiğinde dikkatini kaybeder.
* **Çözüm:** `ollamaClient.js` içinde gelen token akışı biriktirilirken ilk nokta/ünlem (`[.!?\n]`) görüldüğü anda 1. cümle anında seslendirme kuyruğuna alınır. Çocuk ilk cümleyi dinlerken model arka planda 2. ve 3. cümleleri üretmeye devam eder. Algılanan gecikme süresi **1.5 saniyenin altına** düşürülmüştür.

### C. 3 Katmanlı Pedagojik İstem Mühendisliği & Çocuk Güvenliği
* **Few-Shot Enjeksiyonu:** 8B kuantize modellerde Türkçe çeviri kokan (*calque*) söz dizimi bozukluklarını engellemek için 4 çift kurallı soru-cevap geçmişi isteme dinamik eklenir.
* **Kırmızı Çizgi Güvenlik Kalkanı:** Çocuğun girdisi LLM'e gitmeden önce 21 kelimelik travmatik/hassas sözlükle taranır; eşleşmede model devreye sokulmaz, önceden onaylanmış şefkatli mesaj okunur ve öğretmene alarm düşer.

### D. Sıfır Gecikmeli Deterministik Öğrenme Analitiği Motoru
* Puanlama ikinci bir LLM'e yaptırılmamış; 0 ms gecikmeyle çalışan kural ve sözlük tabanlı bir JavaScript motoru (`analyzeAndScore`) kodlanmıştır:
  - **5N1K Sorgulama (+5)**
  - **Dijital Nezaket (+2)**
  - **Metafor ve Yaşantı İlişkisi (+8)**
  - **Bağlamsal Derinleşme (+10):** 8 ana tema ve 80+ anahtar kelimelik sözlük üzerinden aynı konuda ardışık derinleşen soruları tespit eder.

### E. Windows Kiosk Otomasyonu ve İzolasyon
* Arka planda açık olan tarayıcı oturumlarının kiosk bayraklarını ezmesini önlemek amacıyla `--user-data-dir="%TEMP%\BilgiKasifiKiosk"` ile izole bir profil sandbox'ı oluşturulmuş; kedi maskotu simgesi çoklu çözünürlüklü `.ico` formatında Windows `.exe` başlatıcısına (`BilgiKasifiBaslat.exe`) gömülmüştür.

---

## 🚀 5. Kurulum ve Çalıştırma

### Gereksinimler
- **İşletim Sistemi:** Windows 10/11
- **Donanım:** 4 GB VRAM (GTX 1650 veya üzeri önerilir), 16 GB Sistem RAM
- **Yazılım:** [Ollama](https://ollama.com/)

### Adım Adım Kurulum
1. **Modeli İndirin:**
   ```bash
   ollama pull gemma4:latest
   ```
2. **Ollama Sunucusunu Başlatın:**
   ```bash
   ollama serve
   ```
3. **Uygulamayı Açın:**
   Klasördeki **`BilgiKasifiBaslat.exe`** veya **`Bilgi_Kasifi_Baslat.bat`** dosyasına çift tıklayarak uygulamayı tam ekran kiosk modunda başlatabilirsiniz.

---

## 👨‍💻 Geliştirici ve Araştırmacı

* **Geliştirici:** **Behsat Berkay Sıyrık**  
* **Kurum:** Anadolu Üniversitesi, Lisansüstü Eğitim Enstitüsü, Okul Öncesi Eğitimi  
* **Tez Danışmanı:** Doç. Dr. Nurbanu Parpucu  
* **Tez Başlığı:** *"Yapay Zekâ Destekli İlgi Merkezi Modelinin Okul Öncesi Çocuklarının Üstbilişsel Düşünme Becerilerine Etkisi"*  
* **İletişim:** arkun956@gmail.com | [LinkedIn](https://linkedin.com)
