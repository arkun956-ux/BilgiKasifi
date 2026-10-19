# Bilgi Kâşifi (Okul Öncesi Yapay Zekâ Destekli İlgi Merkezi) — Teknik ve Pedagojik Sistem Mimarisi Dokümanı

**Araştırmacı:** Berkay Sıyrık (Anadolu Üniversitesi, Okul Öncesi Eğitimi Tezli Yüksek Lisans)  
**Tez Danışmanı:** Doç. Dr. Nurbanu Parpucu  
**Tez Başlığı:** *"Yapay Zekâ Destekli İlgi Merkezi Modelinin Okul Öncesi Çocuklarının Üstbilişsel Düşünme Becerilerine Etkisi"*  
**Hedef Kitle:** 4–5 Yaş (48–66 Ay) Okul Öncesi Çocukları  
**Çalışma Ortamı:** %100 Çevrim Dışı (Offline / Local-First), KVKK ve Çocuk Veri Gizliliğine Tam Uyumlu İstemci-Yerel Sunucu Mimarisi  

---

## 1. Genel Mimari ve Veri Akışı

### 1.1. Mimari Yaklaşım (Zero-Backend / Local-First SPA)
Uygulama, harici bir bulut sunucusuna veya internet bağlantısına ihtiyaç duymayan **Vanilla JavaScript (ES6+) tabanlı Tek Sayfa Uygulaması (SPA)** ile yerel makinede (`127.0.0.1:11434`) çalışan **Ollama** çıkarım sunucusunun doğrudan haberleşmesi üzerine kurulmuştur. Herhangi bir ara katman (Node.js/Python backend proxy) bulunmamaktadır; tarayıcı doğrudan `fetch` ve `ReadableStream` (`TextDecoder`) üzerinden Ollama REST API'si ile konuşur.

```mermaid
flowchart TD
    subgraph UI["Kullanıcı Arayüzü (Tarayıcı - Vanilla JS / HTML5 / CSS3)"]
        ChildInput["Çocuk Girişi (Mikrofon STT / Hızlı Merak Kartları / Klavye)"]
        AppOrch["app.js (ChildExplorerApp - Ana Orkestratör)"]
        Mascot["mascot.js (Katmanlı SVG Kedi Maskotu & 4 Durum Makinesi)"]
        Sound["soundEngine.js (Web Audio API Prosedürel Ses Efektleri)"]
        Teacher["teacherDashboard.js (Öğretmen & Tez Araştırmacı Paneli)"]
    end

    subgraph Engine["Pedagojik & Analitik Katman (İstemci İçi)"]
        PedEngine["pedagogicalEngine.js (Kırmızı Çizgi, Few-Shot, 5N1K & Derinleşme Motoru)"]
        Storage["storageService.js (localStorage & KVKK Uyumlu JASP CSV Dışa Aktarım)"]
    end

    subgraph LocalAI["Yerel Yapay Zekâ Sunucusu (127.0.0.1:11434)"]
        OllamaClient["ollamaClient.js (Streaming HTTP İstemcisi)"]
        Gemma4["Ollama Engine — Model: gemma4:latest (8.0B, Q4_K_M, 9.6 GB)"]
    end

    ChildInput -->|Metin veya Ses Transkripti| AppOrch
    AppOrch -->|1. Hassas Kelime Kontrolü| PedEngine
    PedEngine -->|Güvenli İse: System Prompt + 4 Few-Shot Çifti| AppOrch
    AppOrch -->|2. Durum: listening -> thinking| Mascot
    AppOrch -->|3. POST /api/chat (stream: true, think: false)| OllamaClient
    OllamaClient <-->|NDJSON Token Akışı| Gemma4
    OllamaClient -->|onToken: Anlık Metin Temizliği & Balon Güncelleme| AppOrch
    OllamaClient -->|onSentenceComplete: Cümle Bazlı TTS Kuyruğu| AppOrch
    AppOrch -->|4. Durum: speaking (130ms Lip-Sync & Kol Jesti)| Mascot
    AppOrch -->|5. onDone: analyzeAndScore()| PedEngine
    PedEngine -->|Puan, Rozet, Konu ve Alarm Kaydı| Storage
    Storage <-->|JASP / SPSS CSV Çıktısı & İlgi Haritası| Teacher
```

### 1.2. Modül ve Dosya Yapısı
| Dosya Adı | Sorumluluk ve Teknik Rolü |
| :--- | :--- |
| [`index.html`](file:///C:/Users/90507/Desktop/BilgiKasifi_Uygulamasi/index.html) | İki sütunlu çocuk dostu arayüz: Sol panelde SVG Kedi Maskotu, konuşma balonu ve uçan düşünce balonları katmanı; sağ panelde sohbet akışı, okuma-yazma bilmeyen çocuklar için 6 adet resimli hızlı merak kartı, mikrofon ve metin giriş alanı; üst barda öğrenci kimliği, aktif rozet ve yıldız sayacı. |
| [`app.js`](file:///C:/Users/90507/Desktop/BilgiKasifi_Uygulamasi/app.js) | `ChildExplorerApp` sınıfı. STT/TTS yaşam döngüsünü, mesaj geçmişini (`conversationHistory`), maskot durum geçişlerini, Ollama streaming çağrılarını ve pedagojik puanlama tetikleyicilerini yöneten ana orkestratör. |
| [`pedagogicalEngine.js`](file:///C:/Users/90507/Desktop/BilgiKasifi_Uygulamasi/pedagogicalEngine.js) | `PedagogicalEngine` sınıfı. Sistem istemi (`getSystemPrompt`), çok-turlu örnek diyaloglar (`getFewShotMessages`), Türkçe metin arındırıcı (`cleanResponse`), kırmızı çizgi filtresi (`checkSensitiveContent`) ve kural tabanlı üstbilişsel puanlama (`analyzeAndScore`) motoru. |
| [`ollamaClient.js`](file:///C:/Users/90507/Desktop/BilgiKasifi_Uygulamasi/ollamaClient.js) | `OllamaClient` sınıfı. Yerel Ollama servisiyle `/api/tags` ve `/api/chat` uç noktaları üzerinden haberleşir. Açılışta modeli belleğe ısıtır (`warmupModel`), NDJSON akışını (streaming) okur ve noktalama işaretlerinden (`[.!?\n]`) cümle bitişlerini yakalayarak anında seslendirme kuyruğuna (`onSentenceComplete`) iletir. |
| [`mascot.js`](file:///C:/Users/90507/Desktop/BilgiKasifi_Uygulamasi/mascot.js) | `MascotController` sınıfı. Saf vektörel (SVG) katmanlı turuncu tekir kedi maskotu. `idle`, `listening`, `thinking`, `speaking` olmak üzere 4 durumlu sonlu durum makinesi (FSM), dudak senkronizasyonu (`startLipSync`), göz bebeği takibi, kaş/kol jestleri ve bekleme süresini oyunlaştıran patlatılabilir düşünce balonları (`startThoughtBubbles`). |
| [`storageService.js`](file:///C:/Users/90507/Desktop/BilgiKasifi_Uygulamasi/storageService.js) | `StorageService` sınıfı. Tüm öğrenci, oturum, konu dağılımı ve kırmızı çizgi alarmlarını tarayıcının `localStorage` alanında tutar. Tek tıkla UTF-8 BOM'lu, KVKK anonimleştirilmiş (`KOD_D_1`, `KOD_K_2`) **JASP / SPSS uyumlu CSV** veri setine dönüştürür. |
| [`teacherDashboard.js`](file:///C:/Users/90507/Desktop/BilgiKasifi_Uygulamasi/teacherDashboard.js) | `TeacherDashboard` sınıfı. Öğretmen ve araştırmacı için Deney/Kontrol grubu yönetimi, Sınıf İlgi Haritası (konu frekans çubukları), Kırmızı Çizgi Alarmları, Ollama model seçimi ve TTS ses/ton/hız ince ayar ekranı. |
| [`soundEngine.js`](file:///C:/Users/90507/Desktop/BilgiKasifi_Uygulamasi/soundEngine.js) | `SoundEngine` sınıfı. Harici `.mp3`/`.wav` dosyasına ihtiyaç duymadan **Web Audio API** (`AudioContext` osilatörleri) ile tıklama, balon patlatma (`playPop`), düşünme ışıltısı (`playSparkle`), dinleme başlangıcı ve ödül fanfarı (`playReward`) seslerini matematiksel olarak sentezler. |

### 1.3. Yerel Model Seçimi ve Kuantizasyon Detayları
Sistemde yerel Ollama üzerinde kurulu olan modeller arasından otomatik öncelik sırasıyla (`gemma4` > `gemma:latest` > `gemma2` > `qwen2.5`) seçim yapılmaktadır. Mevcut aktif üretim modeli:
* **Model Adı:** `gemma4:latest` (Google Gemma 4)
* **Parametre Boyutu:** `8.0B` (8 Milyar Parametre)
* **Kuantizasyon Seviyesi:** `Q4_K_M` (Disk boyutu: ~9.6 GB)
* **Mimari Özellik:** Çok modlu (`vision` + `text`) ve içsel düşünme (`thinking/reasoning`) yeteneğine sahip güncel Gemma 4 mimarisi. (Daha küçük `llama3.2:3b` ve `gemma2:2b` modelleri Türkçe dil bilgisi bozuklukları ve araya İngilizce kelime karıştırma sorunları nedeniyle terk edilmiştir.)

---

## 2. Sistem Promptu ve Pedagojik Kurallar

Modelin 4–5 yaş çocuğunun bilişsel gelişim düzeyine (Piaget'nin *İşlem Öncesi Dönemi* - somutlaştırma ihtiyacı ve Vygotsky'nin *Yakınsak Gelişim Alanı / Yapı İskelesi*) uygun yanıt üretmesi için **3 katmanlı bir istem (prompting) mimarisi** uygulanmaktadır:

### 2.1. Katman 1: Tam Sistem İstemi (`getSystemPrompt`)
[`pedagogicalEngine.js`](file:///C:/Users/90507/Desktop/BilgiKasifi_Uygulamasi/pedagogicalEngine.js#L30-L44) içinde tanımlı olan birebir sistem istemi metni:

```text
Sen 4-5 yaşındaki okul öncesi çocuklarla konuşan sevimli, meraklı ve bilgili bir kedi olan "Bilgi Kaşifi"sin.
Çocuğun adı: ${childName}.

CEVAP FORMÜLÜN (HER ZAMAN 3 KISA VE KURALLI CÜMLE):
1. CÜMLE (Doğru ve Somut Bilgi): Çocuğun sorusuna veya söylediğine doğrudan, gerçek ve bilimsel bir bilgiyle cevap ver. Asla "büyük bir olay oldu", "gizemli olurdu" gibi belirsiz ifadeler kullanma.
2. CÜMLE (Günlük Hayattan Benzetme): Çocuğun bildiği somut bir nesneyle (ayna, pipet, top, karpuz, el feneri, yorgan vb.) gözünde canlandırabileceği bir örnek ver.
3. CÜMLE (Sokratik Merak Sorusu): Her zaman "Peki sence..." ile başlayan, konuyla doğrudan ilgili ve 4-5 yaşındaki bir çocuğun kolayca cevaplayabileceği kısa bir karşılaştırma veya tahmin sorusu sor.

KESİN TÜRKÇE VE DİL BİLGİSİ KURALLARI:
- Kusursuz, duru, sıcak ve kurallı bir İstanbul Türkçesi kullan (Özne + Nesne + Yüklem sırasına uy, devrik cümle kurma).
- ASLA "... olduğunu düşünüyorsun?", "... yaşamayı bıraktılar", "... koyardın ki ... olsun" gibi İngilizceden çeviri kokan bozuk kalıplar kullanma!
- Aynı kelimeyi ("çok" vb.) her cümlede tekrar etme.
- Araya tek bir yabancı kelime veya markdown işareti (*, #) karıştırma.
```

### 2.2. Katman 2: Çok-Turlu Few-Shot Diyalog Enjeksiyonu (`getFewShotMessages`)
Yalnızca `system` rolüyle verilen kuralların 8B kuantize modellerde zaman zaman çeviri kokan cümlelere (calque/translationese) yol açmasını engellemek amacıyla, `/api/chat` çağrısındaki `messages` dizisine her istekte **4 çift (8 mesaj) sentetik `user`/`assistant` geçmişi** enjekte edilmektedir ([`pedagogicalEngine.js`](file:///C:/Users/90507/Desktop/BilgiKasifi_Uygulamasi/pedagogicalEngine.js#L47-L82)):

```javascript
[
  {
    role: 'user',
    content: 'Ay neden geceleri parlar?'
  },
  {
    role: 'assistant',
    content: 'Miyav! Ay kendi ışığını üretmez, Güneş\'ten aldığı ışığı geceleri dünyamıza yansıtır. Tıpkı karanlık bir odada el feneri tutulan parlak bir ayna gibi parlar! Peki sence gökyüzündeki bulutlar Ay\'ın önünden geçerse Ay nasıl görünür?'
  },
  {
    role: 'user',
    content: 'Dinozorlar neden artık yaşamıyor?'
  },
  {
    role: 'assistant',
    content: 'Miyav! Çok uzun yıllar önce uzaydan Dünya\'ya dev bir göktaşı düştü ve hava aşırı soğuduğu için dinozorların nesli tükendi. Bugün onlardan geriye sadece müzelerde sergilenen kocaman kemikler kaldı! Peki sence dinozorların yumurtası bir tavuk yumurtası kadar küçük müydü, yoksa bir karpuz kadar büyük müydü?'
  },
  {
    role: 'user',
    content: 'Ben en çok T-Rex\'in yumurtasını merak ediyorum'
  },
  {
    role: 'assistant',
    content: 'Miyav, harika bir seçim! Dev bir T-Rex\'in yumurtası neredeyse kocaman bir kavun büyüklüğündeydi ve kabuğu çok sertti. İçinden çıkan yavru T-Rex ise ilk doğduğunda sevimli bir kedi yavrusu boyundaydı! Peki sence bu minik yavru dinozor yumurtadan ilk çıktığında ne yemek istemiştir?'
  },
  {
    role: 'user',
    content: 'Ağaçlar nasıl büyür ve su içer?'
  },
  {
    role: 'assistant',
    content: 'Miyav! Ağaçlar toprağın altındaki kökleriyle suyu emer ve gövdelerinin içinden yapraklarına kadar taşırlar. Tıpkı senin meyve suyunu pipetle çekip içmen gibi toprağın suyunu içer ve güneş ışığıyla büyürler! Peki sence yağmur yağdığında ağaçların yaprakları neden tertemiz ve parlak görünür?'
  }
]
```
> **Not:** 3. örnek (`"Ben en çok T-Rex'in yumurtasını merak ediyorum"`), çocuk soru sormak yerine kendi fikrini/tercihini beyan ettiğinde bile modelin 3 cümlelik (Bilgi + Benzetme + `"Peki sence..."` sorusu) yapıyı bozmamasını sağlar. Model çağrısında bu dizinin hemen arkasına gerçek sohbetin son 4 mesajı (`this.conversationHistory.slice(-4)`) ve çocuğun son girdisi eklenir.

### 2.3. Katman 3: Çıktı Sonrası Deterministik Arındırma (`cleanResponse`) ve Kırmızı Çizgi Filtresi
1. **Kırmızı Çizgi (Hassas Konu) Filtresi (`checkSensitiveContent`):**
   Çocuğun girdisi modele gönderilmeden önce 21 kelimelik travmatik/hassas sözlükle karşılaştırılır:
   `['öldü', 'ölüm', 'ölmek', 'ölecek', 'vefat', 'mezar', 'cenaze', 'cennet', 'cehennem', 'kan', 'kaza', 'cinayet', 'bıçak', 'silah', 'vurmak', 'dövüş', 'bomba', 'zehir', 'korkunç', 'ayrılmak', 'boşanmak']`
   Eşleşme olursa **LLM devreye girmez**; önceden onaylanmış pedagojik yönlendirme mesajı çocuğa okunur ve Öğretmen Panelindeki **Kırmızı Çizgi Alarmları** sekmesine psikolojik rehberlik önerisiyle birlikte kaydedilir.
2. **Türkçe Harf Korumalı Regex Temizleyici (`cleanResponse`):**
   Akış sırasında gelen metin, Türkçe karakter sınırlarını (`(?<![a-zA-ZçğıöşüÇĞİÖŞÜ])...(?![a-zA-ZçğıöşüÇĞİÖŞÜ])`) koruyan regex haritasıyla olası İngilizce sızıntılardan (`actually` $\rightarrow$ `aslında`, `because` $\rightarrow$ `çünkü`, `external` $\rightarrow$ `dış`, `hello` $\rightarrow$ `merhaba`, `okay` $\rightarrow$ `tamam`) ve markdown sembollerinden (`[#*_~\`>[\]]`) arındırılır.

---

## 3. Öğrenme Analitiği ve Rozet Motoru

Üst paneldeki yıldız/rozet sistemi ve öğretmen panelindeki JASP verileri **ikinci bir LLM değerlendirmesiyle değil, %100 deterministik (kural ve sözlük tabanlı) bir JavaScript algoritmasıyla (`analyzeAndScore`)** çalışmaktadır. Bu tercih; sıfır gecikme (0 ms latency), GPU belleğini yormama ve tez araştırmasında ölçüm tutarlılığı (tekrarlanabilirlik) sağlamak amacıyla yapılmıştır.

### 3.1. Puanlama Matrisi (`analyzeAndScore`)
Çocuğun gönderdiği her mesaj küçük harfe çevrilir (`toLowerCase()`) ve aşağıdaki 5 kural süzgecinden kümülatif olarak geçer:

| Analitik Boyut | Puan | Tetiklenme Mantığı ve Anahtar Kelime Sözlüğü |
| :--- | :---: | :--- |
| **1. 5N1K Sorgulama (`5N1K`)** | **+5** | Mesaj içinde `['neden', 'niye', 'nasıl', 'nerede', 'kim', 'ne zaman']` kelimelerinden en az birinin geçmesi (`lower.includes(w)`). |
| **2. Dijital Nezaket (`COURTESY`)** | **+2** | Mesaj içinde `['merhaba', 'günaydın', 'selam', 'teşekkür', 'teşekkürler', 'sağ ol', 'lütfen', 'görüşürüz', 'hoşça kal']` ifadelerinden birinin geçmesi. |
| **3. Metafor ve Yaşantı İlişkisi (`METAPHOR`)** | **+8** | Çocuğun bilgiyi kendi dünyasıyla veya bir benzetmeyle ilişkilendirmesi: `['benim', 'bizim', 'evde', 'annem', 'babam', 'arkadaşım', 'gibi', 'benziyor']`. |
| **4. Bağlamsal Derinleşme (`DEEPENING`)** | **+10** | `TOPIC_DICTIONARY` (8 ana tema, 80+ anahtar kelime) üzerinden mesajın konusu tespit edilir. Eğer tespit edilen konu bir önceki mesajın konusuyla (`this.lastDetectedTopic`) aynıysa `consecutiveTopicCount` artırılır. **`consecutiveTopicCount >= 2`** olduğunda (aynı temada üst üste en az 2. ve sonraki sorular) her seferinde **+10 puan** verilir. |
| **5. Meraklı Keşif Taban Puanı (`EXPLORATION`)** | **+1** | Yukarıdaki 4 kategoriden hiçbirisi tetiklenmediyse (`scoreDelta === 0`), çocuğun etkileşimini kırmamak için verilen taban puan. |

### 3.2. Yıldız, Ödül Bildirimi ve Rozet Eşikleri
* **Yıldız Hesabı:** Her **5 puan = 1 Yıldız (`⭐`)** olarak hesaplanır (`Math.floor(student.score / 5)`).
* **Anlık Ödül Geri Bildirimi:** Tek mesajda kazanılan puan `scoreDelta >= 5` ise Web Audio API ödül fanfarı (`playReward()`) çalar, kedi maskotu 1.2 saniye boyunca mutlu göz kısma (`triggerHappyEyes`) mimiği yapar ve üstten 3.2 saniyeliğine ödül bandı (`#rewardBanner`) iner.
* **Rozet Seviyeleri (`getBadgeInfo`):**
  * `0 – 49 Puan` (Seviye 1): 🥉 **Başlangıç Kaşifi** (`#10B981`)
  * `50 – 149 Puan` (Seviye 2): 🥈 **Meraklı Bilgin** (`#3B82F6`)
  * `150+ Puan` (Seviye 3): 🥇 **Süper Mucit** (`#F59E0B`)

---

## 4. Donanım ve Model Çıkarım Parametreleri

### 4.1. Hedef Donanım Profili
* **İşlemci (CPU):** AMD Ryzen 7 3750H (4 Çekirdek / 8 İzlek)
* **Bellek (RAM):** 16 GB DDR4 Sistem Belleği
* **Ekran Kartı (GPU):** NVIDIA GeForce GTX 1650 (**4 GB GDDR5 VRAM**)
* **İşletim Sistemi:** Windows 10/11

### 4.2. Ollama `/api/chat` Çıkarım Parametreleri
[`ollamaClient.js`](file:///C:/Users/90507/Desktop/BilgiKasifi_Uygulamasi/ollamaClient.js#L102-L116) içinde yapılandırılan tam JSON yükü (payload) ve her parametrenin donanım/pedagoji gerekçesi:

```json
{
  "model": "gemma4:latest",
  "stream": true,
  "think": false,
  "keep_alive": -1,
  "options": {
    "temperature": 0.35,
    "top_p": 0.85,
    "top_k": 25,
    "repeat_penalty": 1.18,
    "num_ctx": 2048,
    "num_predict": 135
  }
}
```

### 4.3. Kritik GTX 1650 (4 GB VRAM) Optimizasyon Bulguları
1. **`think: false` (Reasoning Kapatma):** `gemma4:latest` varsayılan olarak cevap üretmeden önce içsel düşünme (`<thought>`) token'ları üretir. Bu mod açıkken GTX 1650 + Ryzen 7 sistemde ilk kelimenin ekrana düşmesi **30–35 saniye** sürüyordu. `think: false` ile bu gecikme tamamen sıfırlandı ve ilk cümle **~1.2 – 1.8 saniyede** gelmeye başladı.
2. **`num_ctx: 2048` (KV-Cache Daraltma):** `gemma4:latest` modelinin varsayılan bağlam penceresi `131072` (128K) token'dır. 128K KV-Cache bellekte devasa yer kaplayarak 4 GB VRAM'den sistem RAM'ine (CPU offload) aşırı taşma yaratıyordu. Bağlam penceresi `2048` token'a çekildiğinde (sistem istemi + 4 few-shot + son 4 mesaj toplam ~650 token tutmaktadır), KV-Cache yükü minimuma indi ve toplam yanıt süresi **35 saniyeden 4.0 – 8.0 saniye bandına** düştü.
3. **`keep_alive: -1` ve `warmupModel()`:** Ollama varsayılan olarak 5 dakika işlem yapılmazsa modeli VRAM/RAM'den boşaltır. Uygulama açılır açılmaz `warmupModel()` arka planda 5 token'lık sessiz bir istek atarak 9.6 GB'lık modeli belleğe yükler ve `keep_alive: -1` ile uygulama açık kaldığı sürece bellekte sıcak tutar.
4. **`temperature: 0.35`, `top_k: 25`, `repeat_penalty: 1.18`:** Düşük sıcaklık (`0.35`) ve dar `top_k` (`25`), modelin Türkçe söz diziminden sapmasını ve halüsinasyon görmesini engeller. `repeat_penalty: 1.18` ise okul öncesi istemlerde sık görülen *"çok... çok... çok..."* gibi sıfat tekrarlarını bastırır.
5. **`num_predict: 135`:** 3 kurallı Türkçe cümle ortalama 80–110 token tutmaktadır. `135` sınırı modelin gereksiz uzatmasını önlerken 3. cümledeki `"Peki sence..."` sorusunun yarıda kesilmemesini garanti eder.

---

## 5. Ses ve Çoklu Ortam Entegrasyonu

### 5.1. Ses Tanıma (STT - Mikrofon Akışı)
* Tarayıcı yerleşik **Web Speech API (`webkitSpeechRecognition` / `SpeechRecognition`)** kullanılır (`lang = 'tr-TR'`, `continuous = false`, `interimResults = true`).
* Uygulama [`baslat.bat`](file:///C:/Users/90507/Desktop/BilgiKasifi_Uygulamasi/baslat.bat) üzerinden başlatılırken Chrome/Edge tarayıcısına `--use-fake-ui-for-media-stream --allow-file-access-from-files` bayrakları geçilerek `file://` protokolünde her seferinde mikrofon izni sorma engeli aşılır.
* Çocuk mikrofona bastığında (`toggleListening`), eğer kedi konuşuyorsa `stopSpeaking()` ile susturulur, maskot anında `listening` durumuna geçer (sağ patisini kulağına götürür, kulak çevresinde ses halkaları yayılır).
* Konuşma bittiğinde (`onend`), `childInput` içindeki transkript otomatik olarak `handleSendMessage(text)` fonksiyonuna iletilir.
* **Not (Web Speech STT Kısıtı):** Tarayıcıların yerleşik `webkitSpeechRecognition` motoru sesi metne çevirmek için arka planda Google/Microsoft bulut servisine bağlanmaya çalışır. Tamamen internetsiz (air-gapped) ortamda `network` hatası döner; bu durumda uygulama çökmez, kullanıcıyı sesli/görsel olarak bilgilendirir ve çocuk alttaki **6 resimli Hızlı Merak Kartı** veya yazı kutusu ile etkileşime devam eder.

### 5.2. Akışkan Seslendirme (Streaming TTS) ve Emoji Filtresi
* Modelin cevabının tamamlanmasını beklemek yerine **Cümle Bazlı Akışkan TTS (Sentence-Level Streaming TTS)** uygulanmıştır:
  1. [`ollamaClient.js`](file:///C:/Users/90507/Desktop/BilgiKasifi_Uygulamasi/ollamaClient.js#L152-L161) içinde her token geldiğinde `sentenceBuffer` biriktirilir.
  2. Token içinde `[.!?\n]` karakterlerinden biri görüldüğünde ve tampon uzunluğu 6 karakterden büyükse, cümle tamamlanmış kabul edilir ve `onSentenceComplete(cleanedSentence)` tetiklenir.
  3. [`app.js`](file:///C:/Users/90507/Desktop/BilgiKasifi_Uygulamasi/app.js#L245-L260) içindeki `queueSentenceToSpeak(sentence)` bu cümleyi `speechQueue` dizisine ekler ve `processSpeechQueue()` ilk cümleyi hemen seslendirmeye başlar. Böylece model 2. ve 3. cümleyi üretirken çocuk 1. cümleyi dinlemeye başlamış olur (**Algılanan gecikme ~1.5 saniyedir**).
* **Emoji ve Sembol Filtresi:** `speakText()` içinde metin `SpeechSynthesisUtterance` nesnesine verilmeden önce `/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu` regex'i ile tüm emojilerden temizlenir. Böylece ekranda `🐾`, `✨` görünürken TTS motorunun bunları *"pati izi"* veya *"parıltılar"* diye okuması engellenir.
* **Ses Seçimi ve Maskot Tınısı:** `getBestVoice()` öncelikli olarak `Google Türkçe` > `Microsoft Emel / Natural` > `Microsoft Tolga` sırasını izler. Windows'ta varsayılan olarak yalnızca `Microsoft Tolga` yüklü olduğunda bile sesin sert bir yetişkin erkek sesi gibi çıkmaması için varsayılan `pitch = 1.30` (ince/sevimli çizgi film karakteri tonu) ve `rate = 1.02` uygulanır.

### 5.3. Sol Paneldeki Kedi Maskotu ve Konuşma Balonu Senkronizasyonu
Sol paneldeki kedi maskotu (`MascotController`) ile ses ve metin akışı şu şekilde senkronize edilir:
1. **Dinleme (`listening`):** Çocuk mikrofona bastığında veya yazı kutusuna harf girdiğinde (`input` eventi) kedi sağ patisini kulağına götürür, göz bebekleri büyür (`rx: 10.5, ry: 15.5`) ve sol paneldeki konuşma balonunda (`#mascotStatusText`) *"Seni pür dikkat dinliyorum minik kaşif... 👂"* yazar.
2. **Düşünme (`thinking`):** Mesaj gönderildikten 650 ms sonra kedi sağ patisini çenesine götürüp kaşımaya başlar, gözlerini yukarıdaki fikir bulutuna (`💭 💡 ⚙️ ❓`) diker ve 2.2 saniyede bir gözlerini sağ-sol oynatarak `thinkingPhrases` dizisindeki cümleleri sol balonda döndürür. Aynı anda ekranda çocuğun tıklayarak patlatabileceği (`playPop`) **uçan düşünce balonları (`startThoughtBubbles`)** yükselir.
3. **Konuşma (`speaking`) ve Dudak Senkronizasyonu (`startLipSync`):** Her bir cümlenin `SpeechSynthesisUtterance.onstart` olayı tetiklendiğinde `this.mascot.setState('speaking', cleanText)` çağrılır:
   * Sol paneldeki kedi konuşma balonuna (`#mascotStatusText`) o an okunan cümlenin metni yazılır.
   * Kedinin iki kolu yukarı kalkarak anlatıcı jesti yapar.
   * `startLipSync()` her **130 ms**'de bir `mouthPhase` (`0 -> 1 -> 2 -> 3`) döngüsüyle `mouthClosed` $\rightarrow$ `mouthOpen` $\rightarrow$ `mouthOpenWide` $\rightarrow$ `mouthOpen` SVG katmanlarını değiştirerek konuşma süresince kesintisiz ağız-dudak senkronizasyonu sağlar.
   * Cümle okunup bittiğinde (`utterance.onend`), kuyrukta başka cümle yoksa maskot otomatik olarak `idle` (boşta göz kırpma, etrafa bakınarak ara sıra el sallama) durumuna döner.

---

## 6. Geliştirmeye Açık / Zayıf Noktalar ve Optimizasyon Hedefleri

Gemini ile yapılacak mimari ve pedagojik optimizasyon çalışmasında odaklanılması önerilen **6 temel darboğaz ve geliştirme alanı** şunlardır:

### 6.1. Kural Tabanlı Analitik Motorunun (`analyzeAndScore`) Sınırları
* **Mevcut Durum:** 5N1K, Metafor ve Konu Tespiti tamamen sabit kelime listeleri (`includes`) ile çalışmaktadır.
* **Zayıf Nokta:**
  * Türkçe sondan eklemeli (agglutinative) bir dil olduğu için kelime kökleri bazen yanlış eşleşebilir (ör. `"kim"` kelimesinin `"hekim"` veya `"çekim"` içinde geçmesi `includes('kim')` kontrolünü yanlış pozitif tetikleyebilir).
  * Çocuk *"neden"* veya *"nasıl"* kelimesini kullanmadan üstbilişsel bir soru sorduğunda (ör. *"Bulutlar su doluysa niçin düşmüyor?"* veya *"Kuşların kolları yorulmaz mı?"*) 5N1K puanı alamamaktadır.
  * `TOPIC_DICTIONARY` içindeki 8 tema dışında bir konu konuşulduğunda (`Genel Merak`), `detectTopic` `null` döndüğü için çocuk aynı konu üzerinde 5 kez üst üste derinleşse bile **Bağlamsal Derinleşme (+10 puan)** tetiklenmemektedir.
* **Optimizasyon Hedefi:** Kelime sınırlarını Türkçe kök/ek yapısına uygun hale getirmek, soru eki (`mı/mi/mu/mü`) ve merak kalıplarını (`acaba`, `niçin`, `ne işe yarar`) 5N1K'ya dahil etmek ve sözlük dışı konularda da ardışık mesajlardaki ortak kelime köklerinden (N-gram / Jaccard benzerliği) otomatik derinleşme tespit etmek.

### 6.2. Çok-Turlu Sohbette Pedagojik İskele (Scaffolding) Sürekliliği
* **Mevcut Durum:** Model her yanıtının 3. cümlesinde `"Peki sence..."` ile başlayan harika bir merak sorusu sormaktadır. Ancak çocuk bu soruya kısa bir tahminle cevap verdiğinde (ör. Model: *"Peki sence dinozor yumurtası tavuk yumurtası kadar küçük müydü, yoksa karpuz kadar büyük müydü?"* $\rightarrow$ Çocuk: *"Karpuz kadar büyüktü!"*), model bir sonraki turda çocuğun tahminini değerlendirip ödüllendirmek yerine doğrudan yeni bir 3 cümlelik bilgi bloğuna geçebilmektedir.
* **Optimizasyon Hedefi:** Sistem istemine ve few-shot örneklerine **"Çocuk senin bir önceki 'Peki sence...' soruna cevap verdiyse, 1. cümlede önce çocuğun tahminini onayla/kutla ve neden doğru/yakın olduğunu açıkla"** kuralını içeren bağlantılı (multi-turn) bir few-shot çifti eklemek.

### 6.3. Donanım Sınırlarında (`GTX 1650 4GB VRAM`) Model Boyutu vs. Hız Dengesi
* **Mevcut Durum:** `gemma4:latest` (8.0B, 9.6 GB) 4 GB VRAM'e tamamen sığmadığı için katmanların bir kısmı sistem RAM'inde (CPU üzerinde) çalışmaktadır. `think: false` ve `num_ctx: 2048` ile yanıt süresi 4–8 saniyeye indirilmiş olsa da, ardışık hızlı sorularda işlemci yükü artmaktadır.
* **Optimizasyon Hedefi:** Ollama Modelfile özelleştirmesi veya `gemma4` / `gemma2` ailesinin 4GB VRAM'e %100 sığabilen kuantizasyon seçenekleri ya da sistem istemi + few-shot token sayısını (~550 token) kaliteden ödün vermeden ~300 token'a sıkıştırarak **Prompt Evaluation (TTFT - İlk Token Süresi)** hızını 1 saniyenin altına çekmek.

### 6.4. Çevrim Dışı Seslendirme (TTS) ve Ses Tanıma (STT) Kalitesi
* **Mevcut Durum:**
  * **TTS:** Tarayıcının yerleşik `window.speechSynthesis` API'si kullanılmaktadır. İnternet varken Edge üzerinde çok doğal olan *Microsoft Emel Natural* veya Chrome'da *Google Türkçe* sesleri çalışabilirken, tamamen çevrim dışı Windows ortamında yalnızca mekanik tınılı *Microsoft Tolga* (SAPI5) sesi kalmaktadır (`pitch: 1.3` ile yumuşatılmaktadır).
  * **STT:** `webkitSpeechRecognition` bulut tabanlı olduğu için tam çevrim dışı ortamda çalışmamaktadır.
* **Optimizasyon Hedefi:** İlerleyen aşamada yerel makinede çok hafif çalışan açık kaynaklı **Piper TTS** (Türkçe ONNX ses modeli, CPU'da 0.1 saniyede doğal insan sesi üretir) ve **Whisper.cpp / Vosk** (küçük Türkçe çevrim dışı STT modeli) için hafif bir yerel köprü (local bridge) eklenmesi tartışılabilir.

### 6.5. Araştırma Verilerinin (JASP / SPSS) Zenginliği ve Tam Transkript Kaydı
* **Mevcut Durum:** `storageService.js` şu anda her öğrencinin toplam soru sayısını, puan türlerini (`score5N1K`, `scoreDeepening`, `scoreMetaphor`, `scoreCourtesy`) ve konu frekanslarını kaydedip CSV'ye aktarmaktadır; ancak **çocuğun sorduğu soruların ve yapay zekânın verdiği yanıtların tam metin geçmişi (`conversationHistory`) sayfa yenilendiğinde (`F5`) sıfırlanmaktadır**.
* **Optimizasyon Hedefi:** Tez savunmasında ve nitel içerik analizinde (betimsel analiz / söylem analizi) kullanılmak üzere, her çocuğun konuşma dökümünün (zaman damgası, çocuğun ifadesi, modelin yanıtı, o mesajda tetiklenen puan türü) `localStorage` içine kalıcı olarak kaydedilmesi ve Öğretmen Panelinden **"Tam Konuşma Transkriptlerini İndir (JSON / CSV)"** butonuyla dışa aktarılabilmesi.
