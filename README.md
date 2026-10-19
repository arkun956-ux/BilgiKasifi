# 🐾 Bilgi Kâşifi (Okul Öncesi Yapay Zekâ Destekli İlgi Merkezi)

> **Erken Çocuklukta Üstbilişsel Düşünme Becerilerini Destekleyen, %100 Çevrim Dışı (Offline / Local-First), Çocuk Güvenliği ve KVKK Uyumlu Yapay Zekâ Kiosk Mimarisi**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Citation](https://img.shields.io/badge/Cite-CITATION.cff-informational)](CITATION.cff)
[![Frontend](https://img.shields.io/badge/Frontend-Vanilla%20JS%20(ES6%2B)-F7DF1E?logo=javascript&logoColor=black)](#)
[![Local LLM](https://img.shields.io/badge/Local%20LLM-Ollama%20%7C%20Gemma%204%20(8B)-4285F4?logo=google&logoColor=white)](#)
[![Offline First](https://img.shields.io/badge/Architecture-Local--First%20%7C%20Zero--Backend-10B981)](#)
[![Web Speech API](https://img.shields.io/badge/Speech-Streaming%20TTS%20%26%20STT-FF6F00)](#)
[![Web Audio API](https://img.shields.io/badge/Audio-Procedural%20Synthesis-9C27B0)](#)
[![Security Policy](https://img.shields.io/badge/Security-Child%20Safety%20by%20Design-red.svg)](SECURITY.md)

---

## 📖 1. Proje Özeti ve Akademik Künye

**Bilgi Kâşifi**, 4–5 yaş (48–66 ay) okul öncesi çocuklarının soru sorma, merak, strateji geliştirme ve düşünme süreçlerini fark etme (*üstbiliş / metacognition ve öz-düzenleme*) becerilerini desteklemek üzere geliştirilmiş yapay zekâ tabanlı bir öğrenme merkezidir.

* **Araştırmacı & Geliştirici:** **Behsat Berkay Sıyrık** (Anadolu Üniversitesi, Lisansüstü Eğitim Enstitüsü, Okul Öncesi Eğitimi Tezli Yüksek Lisans)
* **Tez Danışmanı:** **Doç. Dr. Nurbanu Parpucu**
* **Tez Başlığı:** *"Yapay Zekâ Destekli İlgi Merkezi Modelinin Okul Öncesi Çocuklarının Üstbilişsel Düşünme Becerilerine Etkisi"*
* **Çalışma Ortamı:** %100 Çevrim Dışı (Offline / Local-First), KVKK ve Çocuk Veri Gizliliğine Tam Uyumlu Kiosk Tablet Mimarisi

---

## 📚 2. Literatür Temelleri ve Pedagojik Dayanaklar

Erken çocukluk yazılımlarının başarısı pedagojik kuramlarla doğrudan örtüşmesine bağlıdır. Bilgi Kâşifi projesi şu temel kuramsal çerçeveler üzerine inşa edilmiştir:

1. **Piaget'nin Bilişsel Gelişim Kuramı (İşlem Öncesi Dönem - 1952, 1959):**
   * 4–5 yaş çocukları soyut kavramları anlamakta zorlanır; bilginin somutlaştırılmasına ve zihinsel benzetmelere ihtiyaç duyar.
   * *Yansıma:* Modelin her yanıtında yer alan **2. Cümle kuralı**, günlük yaşamdan somut bir benzetme (*ayna, pipet, top, karpuz*) kurar.
2. **Vygotsky'nin Sosyokültürel Gelişim Kuramı & Yapı İskelesi (ZPD & Scaffolding - 1978):**
   * Çocuğun tek başına yapamadığı zihinsel sıçramayı, yetkin bir rehberin (yapay zekâ maskotu) sunduğu basamaklı ipuçlarıyla başarması hedeflenir.
   * *Yansıma:* Çocuk takıldığında arayüzdeki ARASAAC temelli 6 resimli Hızlı Merak Kartı ve modelin yönlendirici karşılaştırma soruları devreye girer.
3. **Whitebread ve ark. (2009) Bilişötesi ve Öz-Düzenleme Gözlem Çerçevesi (C.H.I.L.D. 3–5):**
   * Okul öncesi çocuklarda kâğıt-kalem anketleri geçersizdir; bilişötesi düşünme çocuk doğal bir görev başındayken sözel (düşünceyi seslendirme) ve sözel olmayan (duraklama, mimik, düzeltme) davranışlarla ölçülür.
   * *Yansıma:* Kedi maskotu çocuğun düşünme süresinde patlatılabilir fikir balonları sunar; sistem transkript ve bekleme sürelerini video analizi için zaman damgalı kaydeder.
4. **Flavell (1979) Üstbiliş Kuramı:**
   * *Bilişötesi Bilgi (MK)* ve *Bilişötesi Düzenleme (MR)* ayrımı sistemin öğrenme analitiği motoruna (`analyzeAndScore`) doğrudan entegre edilmiştir.
5. **Lipman (1988, 2003) & Fisher (2007) Çocuklarla Felsefe (P4C):**
   * Sokratik sorgulama yöntemi benimsenmiş; maskotun 3. cümlesi her zaman *"Peki sence..."* kalıbıyla çocuğu edilgen dinleyicilikten çıkarıp aktif akıl yürütücü konumuna taşır.

---

## 🧩 3. Pedagojiden Koda Eşleme Matrisi (Theory-to-Code Mapping)

| Pedagojik Kuram / Kavram | Hedef Gelişim Alanı | Kod Düzeyindeki Karşılığı | İlgili Dosya / Fonksiyon |
| :--- | :--- | :--- | :--- |
| **Somutlaştırma (Piaget)** | Soyut kavramları canlandırma | Sistem İstemi 2. Cümle Kuralı (Günlük hayattan somut benzetme üretimi) | `pedagogicalEngine.js` $\rightarrow$ `getSystemPrompt()` |
| **Sokratik Merak (P4C / Lipman)** | Tahmin ve akıl yürütme | 3. Cümle: *"Peki sence..."* merak sorusu ile turu çocuğa devretme | `pedagogicalEngine.js` $\rightarrow$ `getFewShotMessages()` |
| **Sözel Olmayan Düzenleme (Whitebread 2009)** | Düşünme anında bekleme sabrı | Maskotun sağ patisini çeneye götürmesi ve uçan patlatılabilir düşünce balonları | `mascot.js` $\rightarrow$ `startThoughtBubbles()` |
| **5N1K ve Derinleşme (Flavell)** | Üstbilişsel strateji zenginliği | 80+ kelimelik sözlükle aynı temada ardışık soru sormada **+10 Derinleşme Puanı** | `pedagogicalEngine.js` $\rightarrow$ `analyzeAndScore()` |
| **İskeleleme / Scaffolding (Vygotsky)** | Okuma-yazma bilmeyen çocuk desteği | ARASAAC açık kaynaklı piktogramlarıyla 6 resimli Hızlı Merak Kartı | `index.html` $\rightarrow$ `.quick-cards-grid` |
| **Çocuk Güvenliği (UNICEF / KVKK)** | Travmatik içerik koruması | 21 kelimelik kalkan; LLM baypas edilerek şefkatli pedagojik yanıt verilmesi | `pedagogicalEngine.js` $\rightarrow$ `checkSensitiveContent()` |

---

## 🏗️ 4. Sistem Mimarisi (Zero-Backend / Local-First SPA)

Uygulama, bulut bağımlılığı olmayan, internet erişimi gerektirmeyen ve harici bir ara katmana (Node.js/Python FastAPI) ihtiyaç duymayan **Local-First Tek Sayfa Uygulaması (SPA)** mimarisinde geliştirilmiştir:

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

---

## ⚡ 5. Çözülen Kritik Mühendislik Darboğazları

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

### C. Web Audio API ile Prosedürel Ses Sentezi
* Harici hiçbir `.mp3` veya `.wav` dosyası indirmeden, `AudioContext` osilatörleri (`sine`, `triangle`) ve frekans modülasyonu ile balon patlatma (`playPop`), ödül fanfarı (`playReward`) ve düşünme ışıltısı sesleri matematiksel olarak sentezlenir.

### D. Windows Kiosk Otomasyonu ve İzolasyon
* Arka planda açık olan tarayıcı oturumlarının kiosk bayraklarını ezmesini önlemek amacıyla `--user-data-dir="%TEMP%\BilgiKasifiKiosk"` ile izole bir profil sandbox'ı oluşturulmuş; kedi maskotu simgesi çoklu çözünürlüklü `.ico` formatında Windows `.exe` başlatıcısına (`BilgiKasifiBaslat.exe`) gömülmüştür.

---

## 🚀 6. Kurulum ve Çalıştırma

### Gereksinimler
- **İşletim Sistemi:** Windows 10/11
- **Donanım:** 4 GB VRAM (GTX 1650 veya üzeri önerilir), 16 GB Sistem RAM
- **Yazılım:** [Ollama](https://ollama.com/)

### Adım Adım Kurulum
1. **Depoyu Klonlayın:**
   ```bash
   git clone https://github.com/arkun956-ux/BilgiKasifi.git
   cd BilgiKasifi
   ```
2. **Yapay Zekâ Modelini İndirin:**
   ```bash
   ollama pull gemma4:latest
   ```
3. **Ollama Sunucusunu Başlatın:**
   ```bash
   ollama serve
   ```
4. **Uygulamayı Açın:**
   Klasördeki **`BilgiKasifiBaslat.exe`** veya **`Bilgi_Kasifi_Baslat.bat`** dosyasına çift tıklayarak uygulamayı tam ekran kiosk modunda başlatabilirsiniz.

---

## 📜 7. Akademik Atıf (How to Cite)

Bu yazılımı veya ilgi merkezi pedagojik modelini akademik çalışmanızda kullanırsanız, lütfen şu şekilde atıfta bulununuz:

### APA 7 Formatı:
> Sıyrık, B. B. (2026). *Okul Öncesi Eğitimde Yapay Zekâ Destekli İlgi Merkezi: Bir Model Önerisine Yönelik Nitel Bir İnceleme*. 9. Uluslararası Okul Öncesi Eğitim Kongresi, Bildiri Sunumu.

### BibTeX Formatı:
```bibtex
@inproceedings{siyrik2026bilgikasifi,
  author    = {Behsat Berkay S{\i}yr{\i}k},
  title     = {Okul Öncesi Eğitimde Yapay Zekâ Destekli İlgi Merkezi: Bir Model Önerisine Yönelik Nitel Bir İnceleme},
  booktitle = {9. Uluslararası Okul Öncesi Eğitim Kongresi},
  year      = {2026},
  url       = {https://github.com/arkun956-ux/BilgiKasifi}
}
```

---

## 📄 Lisans
Bu proje [MIT Lisansı](LICENSE) kapsamında açık kaynak olarak yayımlanmıştır.
