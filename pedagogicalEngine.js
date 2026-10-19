// ============================================================
// Pedagojik Mantık, Kırmızı Çizgi Filtreleri ve Puanlama Motoru
// "Behsat Berkay Sistem Mimarisi" ve tez ilkelerine birebir sadıktır.
// ============================================================

const SENSITIVE_KEYWORDS = [
  'öldü', 'ölüm', 'ölmek', 'ölecek', 'vefat', 'mezar', 'cenaze',
  'cennet', 'cehennem', 'kan', 'kaza', 'cinayet', 'bıçak', 'silah',
  'vurmak', 'dövüş', 'bomba', 'zehir', 'korkunç', 'ayrılmak', 'boşanmak'
];

// Kırmızı Çizgi Beyaz Listesi ("kan" hecesi içeren zararsız kelimeler asla alarm tetiklemez)
const SENSITIVE_WHITELIST = [
  'kanat', 'kanatlı', 'kanatları', 'kanatlarını', 'kanatlarıyla', 'kanatlanmak',
  'kanadı', 'kanadını', 'kanadında', 'kanarya', 'volkan', 'volkanik', 'volkanlar',
  'kanca', 'kancalı', 'balkan', 'balkanlar', 'kandil', 'kanepe', 'kanal', 'kanun',
  'kanıt', 'pelikan', 'delikanlı', 'başkan', 'çalışkan', 'alışkanlık'
];

const TOPIC_DICTIONARY = {
  'Dinozorlar': ['dinozor', 't-rex', 'fosil', 'raptor', 'kemik', 'büyük kertenkele'],
  'Uzay ve Gökyüzü': ['uzay', 'gezegen', 'yıldız', 'ay', 'güneş', 'roket', 'astronot', 'dünya', 'mars', 'gökyüzü'],
  'Hayvanlar Alemi': ['hayvan', 'kedi', 'köpek', 'kuş', 'aslan', 'fil', 'balık', 'böcek', 'karınca', 'kelebek', 'tavşan', 'yunus'],
  'Doğa ve Hava': ['yağmur', 'kar', 'rüzgar', 'bulut', 'fırtına', 'şimşek', 'gökkuşağı', 'deniz', 'okyanus', 'dağ', 'nehir'],
  'Bitkiler ve Çiçekler': ['bitki', 'çiçek', 'ağaç', 'orman', 'yaprak', 'tohum', 'kök', 'meyve', 'sebze', 'toprak'],
  'Vücudumuz ve Sağlık': ['vücut', 'kalp', 'göz', 'kulak', 'burun', 'el', 'ayak', 'beyin', 'kemik', 'nefes', 'uyku'],
  'Renkler ve Sanat': ['renk', 'kırmızı', 'mavi', 'sarı', 'yeşil', 'turuncu', 'mor', 'resim', 'çizim', 'boya'],
  'Makineler ve Taşıtlar': ['araba', 'uçak', 'tren', 'gemi', 'tekerlek', 'motor', 'robot', 'bisiklet']
};

class PedagogicalEngine {
  constructor() {
    this.consecutiveTopicCount = 0;
    this.lastDetectedTopic = null;
    this.lastUserWords = [];
  }

  // Türkçe karakter duyarlı kelime sınırı kontrolü (Örn: "kim" kelimesinin "hekim" veya "çekim" içinde yanlış eşleşmesini önler)
  hasTurkishWord(text, word) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<![a-zçğıöşüA-ZÇĞİÖŞÜ])${escaped}(?![a-zçğıöşüA-ZÇĞİÖŞÜ])`, 'i');
    return regex.test(text);
  }

  // Çocuğun adındaki olası parantez karakterlerini temizler ("Ahmet (Kaptan)" -> "Ahmet Kaptan")
  formatChildName(childName = 'Minik Kaşif') {
    return String(childName || 'Minik Kaşif')
      .replace(/[()[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || 'Minik Kaşif';
  }

  // 1. Sokratik Sistem İstemi (4-5 Yaş Çocuk Seviyesi & Kusursuz İstanbul Türkçesi)
  // Eğer options.isFarewell === true ise Sokratik soru kuralı geçici olarak askıya alınır ve sıcak veda cümlesi kurulur.
  getSystemPrompt(childName = 'Minik Kaşif', options = {}) {
    const cleanName = this.formatChildName(childName);

    if (options && options.isFarewell) {
      const intent = options.farewellIntent || 'day_farewell';

      if (intent === 'sleep_farewell') {
        return `Sen 4-5 yaşındaki okul öncesi çocuklarla konuşan sevimli, sevgi dolu ve bilgili bir kedi olan "Bilgi Kaşifi"sin.
Çocuğun adı/hitabı: ${cleanName}.

ÖZEL VEDALAŞMA YÖNERGESİ (SOKRATİK SORU KURALI GEÇİCİ OLARAK KALDIRILDI):
${cleanName} sana "iyi geceler" diyerek vedalaşıyor. Ona kesinlikle yeni bir Sokratik soru SORMA.
Çocuğun mevcut hitabını (${cleanName}) kullanarak sevgi dolu, sıcak tek bir veda cümlesi kur (Örn: 'Miyav! İyi geceler ${cleanName}! Seninle keşfetmek harikaydı, tatlı rüyalar!').

KESİN KURALLAR:
- Sevgi dolu, sıcak tek bir veda cümlesiyle konuşmayı noktala.
- Kesinlikle "Peki sence..." deme ve ASLA soru sorma (soru işareti '?' kullanma).
- Çocuğa hitap ederken isimdeki parantez karakterlerini ("Ahmet (Kaptan)" vb.) ASLA kullanma; doğrudan düz metin olarak "${cleanName}" şeklinde seslen.
- Başladığın cümleyi dilbilgisel olarak tamamla, kusursuz ve sıcak bir İstanbul Türkçesi kullan.`;
      }

      return `Sen 4-5 yaşındaki okul öncesi çocuklarla konuşan sevimli, sevgi dolu ve bilgili bir kedi olan "Bilgi Kaşifi"sin.
Çocuğun adı/hitabı: ${cleanName}.

ÖZEL VEDALAŞMA YÖNERGESİ (SOKRATİK SORU KURALI GEÇİCİ OLARAK KALDIRILDI):
${cleanName} seninle vedalaşıyor ("görüşürüz", "bay bay", "hoşça kal" veya "güle güle" dedi). Ona kesinlikle yeni bir Sokratik soru SORMA.
ASLA "huzurlu uykular", "iyi geceler" veya "tatlı rüyalar" DEME.
Çocuğun mevcut hitabını (${cleanName}) kullanarak sevgi dolu, sıcak tek bir veda cümlesi kur (Örn: 'Miyav! Görüşmek üzere ${cleanName}! Seninle keşfetmek harikaydı, kendine çok iyi bak!').

KESİN KURALLAR:
- Sevgi dolu, sıcak tek bir veda cümlesiyle konuşmayı noktala.
- ASLA uyku veya gece dileğinde bulunma ("iyi geceler", "huzurlu uykular", "tatlı rüyalar" YASAK).
- Kesinlikle "Peki sence..." deme ve ASLA soru sorma (soru işareti '?' kullanma).
- Çocuğa hitap ederken isimdeki parantez karakterlerini ("Ahmet (Kaptan)" vb.) ASLA kullanma; doğrudan düz metin olarak "${cleanName}" şeklinde seslen.
- Başladığın cümleyi dilbilgisel olarak tamamla, kusursuz ve sıcak bir İstanbul Türkçesi kullan.`;
    }

    return `Sen 4-5 yaşındaki okul öncesi çocuklarla konuşan sevimli, meraklı, bilgili ve sıcacık bir kedi olan "Bilgi Kaşifi"sin.
Çocuğun adı: ${cleanName}.

KESİN CEVAP PLANI (HER YANITIN MUTLAKA TAM 3 KURALLI CÜMLE OLMALIDIR):

1. CÜMLE (Doğru, Sade ve Somut Bilgi):
- Çocuğun sorusuna doğrudan, gerçek ve bilimsel bir bilgiyle cevap ver.
- Çocuk bir soru soruyorsa (Örn: 'Kuşlar nasıl uçar?', 'Ay neden parlar?'), ASLA "Harika bir tahmin!" veya "Doğru bildin!" DEME! (Çünkü çocuk tahmin yapmadı, soru sordu). Doğrudan "Miyav!" nidasıyla bilgi cümlesine başla.
- YALNIZCA çocuk senin bir önceki tahmin soruna bir yanıt/tahmin verdiyse (Örn: 'Bence karpuz kadardır') cümleye 'Harika bir tahmin! Evet...' diyerek başla.
- Asla "büyük bir olay oldu", "gizemli olurdu" gibi belirsiz veya soyut ifadeler kullanma.

2. CÜMLE (Çocuğun Dünyasından Somut Benzetme):
- Her zaman 'Tıpkı senin [eylem] gibi...' kalıbını kullan. İyelik ekine çok dikkat et ('sen' değil, 'senin ... yapman gibi').
- Çocuğun bildiği somut nesne ve eylemlerle benzetme yap (kollarını açıp koşmak, pipetle meyve suyu çekmek, aynaya el feneri tutmak, süzgeçle su süzmek, yumuşak bir yorgana sarılmak vb.).

3. CÜMLE (Sokratik Karşılaştırma veya Merak Sorusu):
- Her zaman "Peki sence..." ile başlayan, konuyla doğrudan ilgili ve 4-5 yaşındaki bir çocuğun kolayca cevaplayabileceği kısa bir karşılaştırma veya tahmin sorusu sor.
- Soru cümlesi kesinlikle '-mı/-mi' soru ekiyle veya iki seçenekli karşılaştırmayla bitsin (Örn: '...daha mı hızlı uçar?', '...büyük müdür, küçük müdür?').
- Cümle sonundaki Sokratik yönlendirmeyi ASLA düz bildirme veya emir kipiyle bitirme (Örn: 'Tahmin edebilirsin' DEME). Mutlaka soru işaretiyle ('?') bitir.

KESİN TÜRKÇE DİLBİLGİSİ VE SÖZ DİZİMİ (SOV) KURALLARI:
- TÜRKÇEDE YÜKLEM (FİİL/EYLEM) HER ZAMAN CÜMLENİN EN SON KELİMESİDİR. Yüklemden sonra asla kelime koyma!
- DEVRİK CÜMLE KESİNLİKLE YASAKTIR. (Özne + Tümleç + Nesne + Yüklem sırasına harfiyen uy).
  * ❌ YANLIŞ: 'Ay parlar gökyüzünde parlak bir ayna gibi.'
  * ✅ DOĞRU: 'Ay, gökyüzünde parlak bir ayna gibi parlar.'
  * ❌ YANLIŞ: 'Kuşlar uçarlar çünkü kanatları vardır.'
  * ✅ DOĞRU: 'Kuşlar kanatlarını çırparak gökyüzünde uçarlar.'
- Üst üste aynı zarf-fiil ekini kullanma (Örn: 'çırparak iterek uçarlar' YANLIŞTIR; 'çırpar ve uçarlar' DOĞRUDUR).
- BOZUK İNGİLİZCE ÇEVİRİ KALIPLARINI ASLA KULLANMA:
  * 'tıpkı sen yapman gibi' YASAK! -> 'tıpkı senin yapman gibi' KULLAN.
  * 'yaşamayı bıraktılar' YASAK! -> 'nesilleri tükendi' KULLAN.
  * 'itme gücü yaratır' YASAK! -> 'havayı geriye doğru iter' KULLAN.
  * '... olduğunu düşünüyorsun?' YASAK! -> '... olabilir mi?' KULLAN.
  * 'bir parçasıdır bunun' YASAK! -> 'bunun bir parçasıdır' KULLAN.
- Çocuğa hitap ederken isimdeki parantez karakterlerini ("Ahmet (Kaptan)" vb.) ASLA kullanma; doğrudan düz metin olarak "${cleanName}" şeklinde seslen.
- Aynı kelimeyi ("çok" vb.) her cümlede tekrar etme.
- Araya tek bir yabancı kelime veya markdown işareti (*, #) karıştırma.`;
  }

  // 1.1. Katı Vedalaşma Tetikleyicileri
  // SADECE çocuğun cümlesinde şu net ifadelerden biri geçtiğinde isFarewell: true döner:
  // "görüşürüz", "bay bay", "hoşça kal", "güle güle", "iyi geceler"
  // ("tamam", "tamamdır", "anladım", "peki", "teşekkür ederim", "teşekkürler" gibi ara kelimeler ASLA kapanış tetiklemez!)
  checkFarewellIntent(userText) {
    if (!userText || typeof userText !== 'string') {
      return { isFarewell: false, intent: null, category: null, matched: null };
    }

    const lower = userText.toLocaleLowerCase('tr-TR').trim();

    const strictFarewellPatterns = [
      { pattern: /(?<![a-zçğıöşü])görüşürüz(?![a-zçğıöşü])/i, intent: 'day_farewell', category: 'star', label: 'görüşürüz' },
      { pattern: /(?<![a-zçğıöşü])bay\s*bay(?![a-zçğıöşü])/i, intent: 'day_farewell', category: 'star', label: 'bay bay' },
      { pattern: /(?<![a-zçğıöşü])hoş\s*ça\s*kal\w*/i, intent: 'day_farewell', category: 'star', label: 'hoşça kal' },
      { pattern: /(?<![a-zçğıöşü])hoşçakal\w*/i, intent: 'day_farewell', category: 'star', label: 'hoşça kal' },
      { pattern: /(?<![a-zçğıöşü])güle\s*güle(?![a-zçğıöşü])/i, intent: 'day_farewell', category: 'star', label: 'güle güle' },
      { pattern: /(?<![a-zçğıöşü])iyi\s*geceler(?![a-zçğıöşü])/i, intent: 'sleep_farewell', category: 'star', label: 'iyi geceler' }
    ];

    for (const item of strictFarewellPatterns) {
      if (item.pattern.test(lower)) {
        return {
          isFarewell: true,
          intent: item.intent,
          category: item.category,
          matched: item.label
        };
      }
    }

    return { isFarewell: false, intent: null, category: null, matched: null };
  }

  // 1.15. Veda Turu İçin Soru İçermeyen Örnek Diyaloglar
  getFarewellFewShotMessages(childName = 'Minik Kaşif', farewellIntent = 'day_farewell') {
    const cleanName = this.formatChildName(childName);

    if (farewellIntent === 'sleep_farewell') {
      return [
        {
          role: 'user',
          content: 'İyi geceler!'
        },
        {
          role: 'assistant',
          content: `Miyav! İyi geceler ${cleanName}! Seninle keşfetmek harikaydı, tatlı rüyalar!`
        }
      ];
    }

    return [
      {
        role: 'user',
        content: 'Görüşürüz, bay bay!'
      },
      {
        role: 'assistant',
        content: `Miyav! Görüşmek üzere ${cleanName}! Seninle keşfetmek harikaydı, kendine çok iyi bak!`
      },
      {
        role: 'user',
        content: 'Hoşça kal!'
      },
      {
        role: 'assistant',
        content: `Miyav! Güle güle ${cleanName}! Tekrar keşfetmek istediğinde ben hep buradayım, kendine çok iyi bak!`
      }
    ];
  }

  // 1.2. Modelin Kusursuz İstanbul Türkçesi Üslubunu Kilitlediği Örnek Diyaloglar (Few-Shot)
  getFewShotMessages() {
    return [
      {
        role: 'user',
        content: 'Ay neden geceleri parlar?'
      },
      {
        role: 'assistant',
        content: 'Miyav! Ay kendi ışığını üretmez, Güneş\'ten gelen ışığı geceleri Dünya\'mıza yansıtır. Tıpkı senin karanlık bir odada el fenerini parlak bir aynaya tuttuğunda ışığın duvara yansıması gibi parlar! Peki sence gökyüzündeki kara bulutlar Ay\'ın önünü kapatırsa gecemiz daha mı karanlık olur?'
      },
      {
        role: 'user',
        content: 'Dinozorlar neden artık yaşamıyor?'
      },
      {
        role: 'assistant',
        content: 'Miyav! Çok uzun yıllar önce Dünya\'mıza dev bir göktaşı düştü ve hava çok soğuduğu için dinozorların nesli tükendi. Tıpkı kışın dondurucu soğukta montsuz kalan birinin üşümesi gibi onlar da bu soğuğa dayanamadılar! Peki sence dinozorların yumurtası bir tavuk yumurtası kadar küçük müydü, yoksa bir karpuz kadar büyük müydü?'
      },
      {
        role: 'user',
        content: 'Kuşlar nasıl uçar?'
      },
      {
        role: 'assistant',
        content: 'Miyav! Kuşlar, kanatlarıyla havayı geriye doğru iterek güç toplar ve gökyüzünde süzülürler. Tıpkı senin kollarını iki yana açıp koşarken rüzgarı hissetmen gibi onlar da kanatlarını çırparak havada kalırlar! Peki sence kocaman bir kartal mı daha hızlı uçar, yoksa minik bir serçe mi?'
      },
      {
        role: 'user',
        content: 'Balıklar suyun altında nasıl nefes alır?'
      },
      {
        role: 'assistant',
        content: 'Miyav! Balıklar, başlarının iki yanındaki solungaçlarıyla suyun içindeki havayı süzerek nefes alırlar. Tıpkı annenin mutfakta makarnayı süzgeçten süzmesi gibi onlar da suyu dışarı atıp temiz havayı içlerinde tutarlar! Peki sence balıklar da insanlar gibi suyun altında uyurken gözlerini kapatırlar mı?'
      },
      {
        role: 'user',
        content: 'Ağaçlar nasıl büyür ve su içer?'
      },
      {
        role: 'assistant',
        content: 'Miyav! Ağaçlar toprağın altındaki ince kökleriyle suyu emer ve gövdelerinin içinden yeşil yapraklarına kadar taşırlar. Tıpkı senin lezzetli bir meyve suyunu pipetle bardağın dibinden içine çekmen gibi topraktaki suyu içerler! Peki sence yağmur yağdığında ağaçların yaprakları neden tertemiz ve pırıl pırıl görünür?'
      },
      {
        role: 'user',
        content: 'Bence karpuz kadar büyüktü!'
      },
      {
        role: 'assistant',
        content: 'Miyav, harika bir tahmin! Evet, bazı dev dinozorların yumurtaları tam da kocaman bir karpuz büyüklüğündeydi ve taş gibi sertti. Tıpkı kırılmayan devasa bir ceviz kabuğu gibi yavruyu tehlikelerden korurdu! Peki sence bu sert kabuğu kırmak için yavru dinozor kafasını mı kullanmıştır, yoksa kuyruğunu mu?'
      }
    ];
  }

  // 1.5. Güvenlik ve Kusursuz İstanbul Türkçesi Dilbilgisi Temizleyici
  cleanResponse(text, isFarewell = false, farewellIntent = null, userQuestion = '') {
    if (!text) return '';
    let cleaned = text;

    // Eski hatalı "çtamam" kalıntısı varsa düzelt
    cleaned = cleaned.replace(/çtamam/gi, 'çok');

    // 1. Çocuk bir soru sorduysa ve model yine de ezbere "Harika bir tahmin!" dediyse bunu temizle!
    if (userQuestion && typeof userQuestion === 'string') {
      const isQuestion = /(?:\?|neden|nasıl|niye|nerede|kim|ne zaman|hangisi|\bmı\b|\bmi\b|\bmu\b|\bmü\b)/i.test(userQuestion);
      if (isQuestion) {
        cleaned = cleaned
          .replace(/^\s*(?:Miyav!?,?\s*)?(?:Harika\s+bir\s+tahmin!?|Çok\s+güzel\s+bir\s+tahmin!?|Doğru\s+bildin!?)[,!\s]*/i, 'Miyav! ')
          .replace(/^\s*Miyav!\s*Miyav!\s*/i, 'Miyav! ');
      }
    }

    if (isFarewell) {
      // Veda/teşekkür modunda model alışkanlıkla sonuna "Peki sence...?" eklediyse o soru cümlesini temizle
      cleaned = cleaned.replace(/\s*(?:Peki\s+sence|Sence\s+)[^.!?]*[?]+/gi, '').trim();
      cleaned = cleaned.replace(/\?/g, '!').trim();

      // Eğer niyet sleep_farewell DEĞİLSE (yani sadece teşekkür veya gündüz vedasıysa),
      // modelin olası uyku/gece ifadelerini kesin olarak temizle!
      if (farewellIntent && farewellIntent !== 'sleep_farewell') {
        cleaned = cleaned
          .replace(/huzurlu\s+uykular(?:\s+dilerim)?/gi, 'keyifli keşifler dilerim')
          .replace(/iyi\s+uykular(?:\s+dilerim)?/gi, 'keyifli keşifler dilerim')
          .replace(/tatlı\s+rüyalar(?:\s+dilerim)?/gi, 'iyi eğlenceler dilerim')
          .replace(/iyi\s+geceler(?:\s+dilerim)?/gi, 'görüşmek üzere')
          .replace(/mışıl\s+mışıl\s+uyu\w*/gi, 'merakla kal');
      }
    } else {
      // Düz bildirme/emir kipiyle biten Sokratik ifadeleri net soru kipine dönüştür
      cleaned = cleaned
        .replace(/tahmin edebilirsin[.!]?(?=\s|$)/gi, 'tahmin edebilir misin?')
        .replace(/düşünebilirsin[.!]?(?=\s|$)/gi, 'düşünebilir misin?')
        .replace(/söyleyebilirsin[.!]?(?=\s|$)/gi, 'söyleyebilir misin?')
        .replace(/bulabilirsin[.!]?(?=\s|$)/gi, 'bulabilir misin?');
    }

    // 2. Bozuk Çeviri (Calque) ve Devrik Söz Dizimi Düzeltmeleri
    const turkishCalqueFixes = [
      { pattern: /tıpkı\s+sen\s+(\w+)(?:m|n|i|ı|e|a)?\s+gibi/gi, replacement: 'tıpkı senin $1n gibi' },
      { pattern: /itme\s+gücü\s+yaratır/gi, replacement: 'havayı geriye doğru iter' },
      { pattern: /yaşamayı\s+bıraktılar/gi, replacement: 'nesilleri tükendi' },
      { pattern: /bir\s+parçasıdır\s+bunun/gi, replacement: 'bunun bir parçasıdır' },
      { pattern: /mantıklı\s+yapar/gi, replacement: 'mantıklıdır' },
      { pattern: /olduğunu\s+düşünüyorsun\?/gi, replacement: 'olabilir mi?' },
      { pattern: /bunun\s+hakkında\s+ne\s+düşünüyorsun\?/gi, replacement: 'sen ne düşünüyorsun?' },
      { pattern: /ne\s+kadar\s+hızlı\s+çırpmak\s+onları\s+daha\s+yükseğe\s+çıkarır\?/gi, replacement: 'kanatlarını daha hızlı çırparlarsa daha yükseğe uçabilirler mi?' }
    ];

    for (const item of turkishCalqueFixes) {
      cleaned = cleaned.replace(item.pattern, item.replacement);
    }

    // Sadece Türkçe harf sınırlarını koruyarak olası uzun İngilizce kelimeleri temizle
    const englishWordMap = {
      '(?<![a-zA-ZçğıöşüÇĞİÖŞÜ])actually(?![a-zA-ZçğıöşüÇĞİÖŞÜ])': 'aslında',
      '(?<![a-zA-ZçğıöşüÇĞİÖŞÜ])because(?![a-zA-ZçğıöşüÇĞİÖŞÜ])': 'çünkü',
      '(?<![a-zA-ZçğıöşüÇĞİÖŞÜ])external(?![a-zA-ZçğıöşüÇĞİÖŞÜ])': 'dış',
      '(?<![a-zA-ZçğıöşüÇĞİÖŞÜ])hello(?![a-zA-ZçğıöşüÇĞİÖŞÜ])': 'merhaba',
      '(?<![a-zA-ZçğıöşüÇĞİÖŞÜ])okay(?![a-zA-ZçğıöşüÇĞİÖŞÜ])': 'tamam'
    };

    for (const [pattern, replacement] of Object.entries(englishWordMap)) {
      try {
        cleaned = cleaned.replace(new RegExp(pattern, 'gi'), replacement);
      } catch (e) {}
    }

    // Markdown, parantez ("Ahmet (Kaptan)" -> "Ahmet Kaptan") ve özel karakterleri temizle
    cleaned = cleaned
      .replace(/[()]/g, ' ')
      .replace(/[#*_~`>[\]]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned;
  }

  // 2. Kırmızı Çizgi / Hassas Konu Tespiti (Beyaz Liste + Tam Kelime Sınırı Korumalı)
  checkSensitiveContent(text) {
    if (!text) return { isSensitive: false };

    let sanitized = text.toLocaleLowerCase('tr-TR');

    // 1. Beyaz listedeki zararsız kelimeleri ("kanat", "kanatları", "volkan", "kanca", "balkan" vb.) metinden çıkar
    for (const safeWord of SENSITIVE_WHITELIST) {
      const escapedSafe = safeWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const safeRegex = new RegExp(`(?<![a-zçğıöşüA-ZÇĞİÖŞÜ])${escapedSafe}[a-zçğıöşüA-ZÇĞİÖŞÜ]*`, 'gi');
      sanitized = sanitized.replace(safeRegex, ' ');
    }

    // 2. Düz includes() yerine TAM KELİME SINIRI (\bkan\b ve Türkçe harf sınırı) ile kontrol et
    for (const kw of SENSITIVE_KEYWORDS) {
      const escapedKw = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const exactWordRegex = kw === 'kan'
        ? /(?:^|\b|(?<![a-zçğıöşüA-ZÇĞİÖŞÜ]))kan(?:\b|(?![a-zçğıöşüA-ZÇĞİÖŞÜ])|$)/i
        : new RegExp(`(?<![a-zçğıöşüA-ZÇĞİÖŞÜ])${escapedKw}(?![a-zçğıöşüA-ZÇĞİÖŞÜ])`, 'i');

      if (exactWordRegex.test(sanitized)) {
        return {
          isSensitive: true,
          keyword: kw,
          safeResponse: 'Bu çok derin ve önemli bir soru minik kaşifim. Bunu öğretmenine veya ailene sorarsan sana en doğru ve sıcacık cevabı onlar verecektir. Onlar her zaman senin yanındalar! Peki şimdi etrafımızda merak ettiğin başka bir şey keşfedelim mi?',
          recommendation: `Çocuk '${kw}' kelimesini içeren bir soru sordu. Okul öncesi dönemde ölüm/hassas kavramlar somutlaştırılmalı, kaygı giderilmeli ve aile ile işbirliği yapılmalıdır. (Psk. Rehberliği)`
        };
      }
    }
    return { isSensitive: false };
  }

  // Anlamlı kelimeleri/kökleri ayıkla (Sözlük dışı dinamik derinleşme için >4 harfli kelimeler)
  extractMeaningfulWords(text) {
    const stopWords = new Set([
      'neden', 'nasıl', 'nerede', 'zaman', 'acaba', 'niçin', 'hangisi',
      'merhaba', 'günaydın', 'selam', 'teşekkür', 'teşekkürler', 'lütfen',
      'görüşürüz', 'benim', 'bizim', 'annem', 'babam', 'arkadaşım', 'benziyor',
      'bence', 'sence', 'olarak', 'kadar', 'sonra', 'başka', 'öyle', 'böyle'
    ]);

    const clean = text
      .toLowerCase()
      .replace(/[^a-zçğıöşü0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter(w => w.length > 4 && !stopWords.has(w));

    return clean;
  }

  // 3. Akıllı Puanlama Algoritması
  analyzeAndScore(userMessage) {
    const lower = userMessage.toLowerCase().trim();
    let scoreDelta = 0;
    const details = [];

    // 1. 5N1K ve Merak/Soru Eki Tetikleyicisi (+5 Puan) - Türkçe Kelime Sınırı Korumalı
    const fiveW1H = [
      'neden', 'niye', 'nasıl', 'nerede', 'kim', 'ne zaman',
      'acaba', 'niçin', 'ne işe yarar', 'hangisi'
    ];
    const questionParticleRegex = /(?<![a-zçğıöşüA-ZÇĞİÖŞÜ])(mı|mi|mu|mü|mıdır|midir|mudur|müdür)(?![a-zçğıöşüA-ZÇĞİÖŞÜ])/i;
    const has5N1K = fiveW1H.some(w => this.hasTurkishWord(lower, w)) || questionParticleRegex.test(lower);
    if (has5N1K) {
      scoreDelta += 5;
      details.push({ type: '5N1K', points: 5, label: '5N1K ve Merak Sorusu (+5 ⭐)' });
    }

    // 2. Dijital Nezaket ve Sosyal Uyum (+2 Puan) - Türkçe Kelime Sınırı Korumalı
    const courtesies = ['merhaba', 'günaydın', 'selam', 'teşekkür', 'teşekkürler', 'sağ ol', 'lütfen', 'görüşürüz', 'hoşça kal'];
    const hasCourtesy = courtesies.some(c => this.hasTurkishWord(lower, c));
    if (hasCourtesy) {
      scoreDelta += 2;
      details.push({ type: 'COURTESY', points: 2, label: 'Nezaket (+2 ⭐)' });
    }

    // 3. Metafor ve Yaşantı İlişkisi (+8 Puan) - Türkçe Kelime Sınırı Korumalı
    const personalLinks = ['benim', 'bizim', 'evde', 'annem', 'babam', 'arkadaşım', 'gibi', 'benziyor'];
    const hasPersonalLink = personalLinks.some(p => this.hasTurkishWord(lower, p));
    if (hasPersonalLink) {
      scoreDelta += 8;
      details.push({ type: 'METAPHOR', points: 8, label: 'Kendi Yaşantısıyla Bağ Kurma (+8 ⭐)' });
    }

    // 4. Konu Tespiti & Bağlamsal Derinleşme (+10 Puan)
    let topic = this.detectTopic(lower);
    const currentWords = this.extractMeaningfulWords(lower);

    if (topic) {
      if (topic === this.lastDetectedTopic) {
        this.consecutiveTopicCount++;
        if (this.consecutiveTopicCount >= 2) {
          scoreDelta += 10;
          details.push({ type: 'DEEPENING', points: 10, label: `Derinlemesine Öğrenme [${topic}] (+10 ⭐)` });
        }
      } else {
        this.lastDetectedTopic = topic;
        this.consecutiveTopicCount = 1;
      }
    } else {
      // Sözlük dışı (serbest) temalarda dinamik derinleşme:
      // Önceki mesajla şu anki mesaj arasında >4 harfli ortak anlamlı kelime veya ilk 5 harflik kök var mı?
      const sharedWord = currentWords.find(cw =>
        this.lastUserWords.some(lw => lw === cw || (cw.length >= 5 && lw.length >= 5 && cw.slice(0, 5) === lw.slice(0, 5)))
      );

      if (sharedWord) {
        const dynamicTopic = `Serbest Tema (${sharedWord})`;
        topic = dynamicTopic;
        this.consecutiveTopicCount = Math.max(2, this.consecutiveTopicCount + 1);
        this.lastDetectedTopic = dynamicTopic;
        scoreDelta += 10;
        details.push({ type: 'DEEPENING', points: 10, label: `Derinlemesine Öğrenme [${sharedWord}] (+10 ⭐)` });
      } else {
        this.lastDetectedTopic = null;
        this.consecutiveTopicCount = 1;
      }
    }

    this.lastUserWords = currentWords;

    // 5. Standart soru sorma taban puanı (+1)
    if (scoreDelta === 0) {
      scoreDelta = 1;
      details.push({ type: 'EXPLORATION', points: 1, label: 'Meraklı Soru (+1 ⭐)' });
    }

    return {
      scoreDelta,
      details,
      topic: topic || 'Genel Merak'
    };
  }

  // Konu Tespiti
  detectTopic(text) {
    for (const [topic, keywords] of Object.entries(TOPIC_DICTIONARY)) {
      if (keywords.some(kw => text.includes(kw))) {
        return topic;
      }
    }
    return null;
  }

  // Rozet Seviyesi
  getBadgeInfo(totalScore) {
    if (totalScore >= 150) {
      return {
        level: 3,
        name: 'Süper Mucit',
        icon: '🥇',
        color: '#F59E0B',
        desc: 'Derinlemesine sorgulayan, yaratıcı kaşif!'
      };
    } else if (totalScore >= 50) {
      return {
        level: 2,
        name: 'Meraklı Bilgin',
        icon: '🥈',
        color: '#3B82F6',
        desc: 'Neden-sonuç ilişkisi kuran araştırmacı!'
      };
    } else {
      return {
        level: 1,
        name: 'Başlangıç Kaşifi',
        icon: '🥉',
        color: '#10B981',
        desc: 'Merak dolu bir yolculuğa başlayan minik!'
      };
    }
  }
}

window.pedagogicalEngine = new PedagogicalEngine();
