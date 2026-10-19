// ============================================================
// ARASAAC Tam Kapsamlı (14.000+ Piktogram) Çevrim Dışı Görsel Motoru
// Kararlı Cümle Kilidi, Anatomi/Fiil Filtresi ve Ana Konu Sürekliliği
// ============================================================

const CORE_ARASAAC_FALLBACKS = {
  "dinozor": "2738.png",
  "t-rex": "2738.png",
  "fosil": "2738.png",
  "kedi": "2406.png",
  "köpek": "2517.png",
  "kuş": "2490.png",
  "leylek": "3015.png",
  "göç": "3015.png",
  "aslan": "2449.png",
  "fil": "2380.png",
  "balık": "2520.png",
  "balina": "2268.png",
  "kelebek": "2465.png",
  "karınca": "2425.png",
  "arı": "2239.png",
  "tavşan": "2351.png",
  "kurbağa": "2543.png",
  "yılan": "2568.png",
  "zürafa": "2437.png",
  "maymun": "2477.png",
  "ayı": "4945.png",
  "penguen": "3243.png",
  "tavuk": "2403.png",
  "inek": "2609.png",
  "at": "2294.png",
  "koyun": "2489.png",
  "sincap": "2257.png",
  "baykuş": "2671.png",
  "kartal": "2638.png",
  "yengeç": "2312.png",
  "salyangoz": "2685.png",
  "solucan": "2935.png",
  "ahtapot": "3379.png",
  "kanat": "5368.png",
  "yuva": "7173.png",
  "tüy": "5545.png",
  "gezegen": "2829.png",
  "ay": "2933.png",
  "güneş": "2798.png",
  "yıldız": "2752.png",
  "roket": "2344.png",
  "astronot": "4569.png",
  "teleskop": "8531.png",
  "yağmur": "3123.png",
  "kar": "3135.png",
  "rüzgar": "7259.png",
  "bulut": "2883.png",
  "şimşek": "3225.png",
  "gökkuşağı": "2986.png",
  "deniz": "2925.png",
  "dağ": "2909.png",
  "nehir": "2811.png",
  "göl": "6022.png",
  "orman": "2666.png",
  "toprak": "3160.png",
  "taş": "6594.png",
  "kaya": "6594.png",
  "buz": "7128.png",
  "ateş": "4654.png",
  "su": "2248.png",
  "mağara": "2729.png",
  "ağaç": "2256.png",
  "çiçek": "3102.png",
  "yaprak": "3114.png",
  "tohum": "8689.png",
  "kök": "3148.png",
  "sebze": "6244.png",
  "elma": "2462.png",
  "muz": "2530.png",
  "portakal": "2483.png",
  "çilek": "2400.png",
  "karpuz": "2557.png",
  "kavun": "2469.png",
  "ceviz": "2880.png",
  "yumurta": "2427.png",
  "süt": "2445.png",
  "ekmek": "2494.png",
  "bal": "2911.png",
  "havuç": "2619.png",
  "kalp": "2715.png",
  "beyin": "2696.png",
  "diş": "2737.png",
  "akciğer": "8365.png",
  "rüya": "5590.png",
  "araba": "2339.png",
  "uçak": "2264.png",
  "helikopter": "2421.png",
  "tren": "2603.png",
  "tekne": "2273.png",
  "denizaltı": "3157.png",
  "bisiklet": "2277.png",
  "otobüs": "2262.png",
  "kamyon": "2306.png",
  "ambulans": "2251.png",
  "traktör": "2600.png",
  "robot": "6208.png",
  "bilgisayar": "2487.png",
  "saat": "7229.png",
  "ayna": "2385.png",
  "pil": "8320.png",
  "pipet": "6164.png",
  "balon": "2408.png",
  "battaniye": "2459.png",
  "yorgan": "2459.png",
  "yastık": "2250.png",
  "şemsiye": "2500.png",
  "kask": "2691.png",
  "gözlük": "3329.png",
  "kitap": "2450.png",
  "kalem": "2440.png",
  "boya": "4870.png",
  "fırça": "2670.png",
  "ayakkabı": "2622.png",
  "şapka": "2411.png",
  "eldiven": "2415.png",
  "anahtar": "2431.png",
  "lamba": "4938.png",
  "ampul": "2285.png",
  "sabun": "2964.png",
  "bardak": "2356.png",
  "köprü": "5557.png",
  "ev": "2317.png",
  "okul": "3082.png",
  "müze": "3132.png",
  "bahçe": "2434.png"
};

// 1. İNSAN ANATOMİSİ / TIP İKİNCİL KELİMELERİ (Ana konu "Vücudumuz ve Sağlık" değilse hayvan/doğa anlatımında ASLA araya girmemeli!)
const ANATOMY_SECONDARY_WORDS = new Set([
  "boyun", "boynu", "boyunları", "kol", "kolu", "kolları", "bacak", "bacağı", "bacakları",
  "gövde", "gövdesi", "kemik", "kemiği", "kemikler", "kemikleri", "deri", "derisi",
  "kafa", "kafası", "baş", "başı", "sırt", "sırtı", "karın", "karnı", "omuz", "parmak",
  "tırnak", "kas", "kasları", "damar", "kan", "eklem", "boğaz", "yüz", "ten", "vücut",
  "vücudu", "ağız", "ağzı", "dil", "dili", "burun", "burnu", "kulak", "kulağı", "göz",
  "gözü", "gözleri", "el", "eli", "elleri", "ayak", "ayağı", "ayakları", "saç", "mide",
  "iskelet", "kuyruk", "kuyruğu", "kabuk", "kabuğu"
]);

// 2. GÖRSEL KARA LİSTE (Fiiller, Sıfatlar, Edatlar, Soyut Kavramlar - ARASAAC'ta piktogramı olsa bile somut nesnelerin önüne geçmemeli)
const VISUAL_BLACKLIST = new Set([
  // Hitaplar & Ünlemler
  "miyav", "merhaba", "selam", "evet", "hayır", "tamam", "peki", "sence", "bence",
  "acaba", "neden", "nasıl", "niye", "niçin", "nerede", "hangisi", "kimi", "kimin",
  "kaşif", "minik", "dostum", "arkadaş", "arkadaşım", "çocuk", "çocuklar", "insan",
  // Zamirler, Bağlaçlar, Edatlar
  "bir", "iki", "üç", "dört", "beş", "çok", "daha", "en", "kadar", "gibi", "için",
  "ile", "ama", "fakat", "ancak", "çünkü", "veya", "yoksa", "hem", "her", "hiç",
  "hiçbir", "bazı", "bütün", "tüm", "aynı", "başka", "diğer", "böyle", "şöyle",
  "öyle", "bu", "şu", "o", "bunlar", "şunlar", "onlar", "ben", "sen", "biz", "siz",
  "benim", "senin", "onun", "bizim", "sizin", "onların", "kendi", "kendisi",
  // Sık Geçen Yardımcı Fiiller ve Eylemler
  "var", "yok", "olur", "oldu", "olan", "olarak", "olmak", "olabilir", "eder",
  "etmek", "yapar", "yapmak", "gelir", "gider", "kalır", "alır", "verir", "tutmak",
  "tutar", "tutulan", "kırmak", "kırar", "kırılmayan", "açmak", "açar", "kapatmak",
  "düşmek", "düşer", "düştü", "çalışmak", "korumak", "korur", "taşımak", "taşır",
  "taşırlar", "emmek", "emer", "yansıtmak", "yansıtır", "üretmek", "üretmez",
  "bakmak", "görmek", "görünür", "duymak", "konuşmak", "söylemek", "sormak",
  "istemek", "ister", "istemiştir", "sevmek", "oynamak", "atmak", "yakalamak",
  "çekmek", "içmek", "içer", "yemek", "yer", "büyümek", "büyür", "büyürler",
  "yaşamak", "yaşıyor", "uçmak", "uçar", "uçabilir", "süzülmek", "süzülür",
  "çırpmak", "çırpar", "parlamak", "parlar", "soğumak", "ısınmak", "saklamak",
  // Sıfatlar ve Niteleyiciler
  "harika", "güzel", "büyük", "büyüklüğünde", "küçük", "kocaman", "dev", "devasa",
  "sevimli", "tatlı", "hızlı", "hızlıca", "yavaş", "kolay", "kolayca", "zor",
  "sert", "yumuşak", "sıcak", "soğuk", "uzun", "kısa", "yüksek", "alçak", "derin",
  "yeni", "eski", "iyi", "kötü", "tam", "bile", "parlak", "karanlık", "temiz",
  "tertemiz", "kirli", "sağlam", "güvende", "güçlü", "zayıf", "taze", "ilginç",
  "heyecan", "merak", "meraklı",
  // Soyut ve Genel Kavramlar
  "sonra", "önce", "şimdi", "bugün", "yarın", "dün", "zaman", "vakit", "yıl", "yıllar",
  "altında", "altındaki", "üstünde", "üstündeki", "içinde", "içindeki", "dışında",
  "yanında", "önünde", "önünden", "arkasında", "arasında", "etrafında", "üzerinde",
  "doğru", "karşı", "göre", "rağmen", "beri", "boyunca", "sayede", "aslında",
  "gerçekten", " tıpkı", "örnek", "tahmin", "fikir", "seçim", "soru", "cevap",
  "bilgi", "olay", "hareket", "güç", "kuvvet", "itme", "şekil", "boy", "boyunda",
  "renk", "ses", "hava", "havada", "yer", "yere", "yol", "taraf", "oda", "odada",
  "nesil", "nesli", "yavru", "yavrusu", "tehlike", "sır", "dünyamız"
]);

const TOPIC_FALLBACK_MAP = {
  "Dinozorlar": "2738.png",
  "Uzay ve Gökyüzü": "2829.png",
  "Hayvanlar Alemi": "2490.png",
  "Doğa ve Hava": "2986.png",
  "Bitkiler ve Çiçekler": "2256.png",
  "Vücudumuz ve Sağlık": "2715.png",
  "Renkler ve Sanat": "4870.png",
  "Makineler ve Taşıtlar": "2344.png"
};

class VisualEngine {
  constructor() {
    const fullIndex = (typeof window !== "undefined" && window.ARASAAC_FULL_INDEX) ? window.ARASAAC_FULL_INDEX : {};
    this.index = { ...fullIndex, ...CORE_ARASAAC_FALLBACKS };
    this.defaultFallback = "assets/arasaac/default_idea.svg";

    // Konuşma turu boyunca görsel sürekliliği sağlayan durum değişkenleri
    this.isWelcomeMode = true;
    this.welcomeVisualUrl = "assets/arasaac/welcome.png";
    this.turnAnchorVisualUrl = "assets/arasaac/welcome.png";
    this.lastVisualUrl = "assets/arasaac/welcome.png";
    this.activeTopic = null;
    this.isFarewellMode = false;
    this.farewellVisualUrl = null;

    this.loadExternalIndex();
  }

  async loadExternalIndex() {
    try {
      const res = await fetch("assets/arasaac/arasaac_tr_index.json");
      if (res.ok) {
        const externalData = await res.json();
        this.index = { ...externalData, ...CORE_ARASAAC_FALLBACKS };
      }
    } catch (e) {
      // file:// protokolünde window.ARASAAC_FULL_INDEX zaten hafızadadır
    }
  }

  // Vedalaşma / Kapanış Durumu İçin Sabit Görsel Yolu (ARASAAC aramasını tamamen bypass eder)
  getFarewellVisualUrl() {
    return "assets/arasaac/star.png";
  }

  // Yeni bir çocuk sorusu geldiğinde karşılama kilidini kaldırır ve o turun "Ana Konu Görselini" (Anchor) belirler
  setQuestionContext(questionText, detectedTopic = null, farewellInfo = null) {
    this.isWelcomeMode = false;

    if (farewellInfo && farewellInfo.isFarewell) {
      this.isFarewellMode = true;
      this.farewellVisualUrl = "assets/arasaac/star.png";
      this.turnAnchorVisualUrl = this.farewellVisualUrl;
      this.lastVisualUrl = this.farewellVisualUrl;
      this.activeTopic = "Vedalaşma ve Kapanış";
      return;
    }

    this.isFarewellMode = false;
    this.farewellVisualUrl = null;
    this.activeTopic = detectedTopic;
    // Çocuğun sorusundaki ana somut kavramı bul (örn. "Zürafalar neden..." -> Zürafa)
    const matchFromQuestion = this._scoreSentenceForBestConcept(questionText, detectedTopic, true);
    if (matchFromQuestion) {
      this.turnAnchorVisualUrl = matchFromQuestion;
      this.lastVisualUrl = matchFromQuestion;
    } else if (detectedTopic && TOPIC_FALLBACK_MAP[detectedTopic]) {
      this.turnAnchorVisualUrl = `assets/arasaac/${TOPIC_FALLBACK_MAP[detectedTopic]}`;
      this.lastVisualUrl = this.turnAnchorVisualUrl;
    }
  }

  // Türkçe ünsüz yumuşamasını geri çevirir ("ağac" -> "ağaç", "yaprağ" -> "yaprak")
  unsoftenStem(stem) {
    if (!stem || stem.length < 3) return null;
    const last = stem[stem.length - 1];
    const base = stem.slice(0, -1);
    if (last === "c") return base + "ç";
    if (last === "ğ") return base + "k";
    if (last === "d") return base + "t";
    if (last === "b") return base + "p";
    return null;
  }

  // Bir cümle için TEK BİR baskın piktogram seçer; baskın somut kavram yoksa önceki görseli (örn. Zürafa) korur!
  findBestMatch(sentenceText, topicHint = null) {
    // 1. Uygulama ilk açıldığında ve karşılama konuşması sırasında (çocuk ilk sorusunu sorup yeni yanıt üretilene kadar)
    // hiçbir kelime araması yapma, doğrudan "assets/arasaac/welcome.png" döndür!
    if (this.isWelcomeMode) {
      return "assets/arasaac/welcome.png";
    }

    // 2. Vedalaşma modundaysak ARASAAC aramasını tamamen devre dışı bırak ve doğrudan sabit "assets/arasaac/star.png" görselini döndür
    if (this.isFarewellMode) {
      return "assets/arasaac/star.png";
    }

    const effectiveTopic = topicHint || this.activeTopic;
    const bestUrl = this._scoreSentenceForBestConcept(sentenceText, effectiveTopic, false);

    if (bestUrl) {
      this.lastVisualUrl = bestUrl;
      if (!this.turnAnchorVisualUrl) {
        this.turnAnchorVisualUrl = bestUrl;
      }
      return bestUrl;
    }

    // KURAL 3.3 (Varsayılan Konu Koruması): Cümlede baskın yeni bir somut nesne yoksa,
    // alakasız ara kelimelere atlamak yerine bir önceki cümlenin / ana konunun görselini koru!
    if (this.lastVisualUrl) {
      return this.lastVisualUrl;
    }
    if (this.turnAnchorVisualUrl) {
      return this.turnAnchorVisualUrl;
    }
    return this.getTopicOrDefault(effectiveTopic);
  }

  _scoreSentenceForBestConcept(text, topicHint, isUserQuestion = false) {
    if (!text || typeof text !== "string") return null;

    if (typeof window !== "undefined" && window.ARASAAC_FULL_INDEX && Object.keys(this.index).length < 500) {
      this.index = { ...window.ARASAAC_FULL_INDEX, ...CORE_ARASAAC_FALLBACKS };
    }

    const lower = text.toLocaleLowerCase("tr-TR");
    const isAnatomyTopic = topicHint === "Vücudumuz ve Sağlık";

    // Kelimeleri ayıkla ve kara listedeki soyut/fiil/sıfat kelimeleri ele
    const words = lower
      .replace(/['’]/g, " ")
      .replace(/[^a-zçğıöşü0-9-\s]/gi, " ")
      .split(/\s+/)
      .filter(w => w.length >= 2 && !VISUAL_BLACKLIST.has(w));

    const candidates = [];

    // 1. İki kelimeli somut tamlamalar (örn. "el feneri", "kutup ayısı", "güneş sistemi")
    for (let i = 0; i < words.length - 1; i++) {
      const twoWord = `${words[i]} ${words[i + 1]}`;
      if (this.index[twoWord] && !VISUAL_BLACKLIST.has(twoWord)) {
        candidates.push({
          key: twoWord,
          file: this.index[twoWord],
          score: 55
        });
      }
    }

    // Kısa 2 harfli somut kavramlar için güvenli çekim kümesi
    const shortSafeMap = {
      "ay": "ay", "ayı": "ay", "ayın": "ay", "aya": "ay", "ayda": "ay",
      "su": "su", "suyu": "su", "suyun": "su", "suya": "su", "suda": "su", "sular": "su",
      "at": "at", "atı": "at", "atın": "at", "ata": "at", "atlar": "at",
      "ev": "ev", "evi": "ev", "evin": "ev", "eve": "ev", "evde": "ev", "evler": "ev"
    };

    for (const word of words) {
      // KURAL 3.1: Anatomi/Tıp kelimelerini, ana konu "Vücudumuz ve Sağlık" değilse tamamen devre dışı bırak / puanını düşür
      if (!isAnatomyTopic && ANATOMY_SECONDARY_WORDS.has(word)) {
        continue;
      }

      if (shortSafeMap[word]) {
        const shortKey = shortSafeMap[word];
        if (this.index[shortKey]) {
          candidates.push({ key: shortKey, file: this.index[shortKey], score: 26 });
          continue;
        }
      }

      if (word.length < 3) continue;

      // Tam eşleşme kontrolü
      if (this.index[word] && !VISUAL_BLACKLIST.has(word)) {
        if (!isAnatomyTopic && ANATOMY_SECONDARY_WORDS.has(word)) continue;

        const isHero = Boolean(CORE_ARASAAC_FALLBACKS[word]);
        const isMascotSelf = word === "kedi";
        const baseScore = isMascotSelf ? 8 : (isHero ? 42 : 24);
        candidates.push({
          key: word,
          file: this.index[word],
          score: baseScore + Math.min(word.length, 8)
        });
        continue;
      }

      // Türkçe sondan eklemeli kök taraması (O(1) hash sorgusu)
      for (let len = word.length - 1; len >= 3; len--) {
        const prefix = word.slice(0, len);
        if (VISUAL_BLACKLIST.has(prefix)) continue;
        if (!isAnatomyTopic && ANATOMY_SECONDARY_WORDS.has(prefix)) continue;

        // Yanlış pozitif kök korumaları
        if (prefix === "kar" && !["karı", "karın", "karda", "karlar", "karla"].includes(word)) continue;
        if (prefix === "top" && (word.startsWith("topra") || word.startsWith("topla") || word.startsWith("toplu"))) continue;
        if (prefix === "bal" && (word.startsWith("balı") || word.startsWith("bali") || word.startsWith("balo"))) continue;
        if (prefix === "kol" && word.startsWith("kolay")) continue;
        if (prefix === "dil" && word.startsWith("dile")) continue;
        if (prefix === "pil" && word.startsWith("pila")) continue;
        if (prefix === "koy" && !word.startsWith("koyun")) continue;
        if (prefix === "taş" && word.startsWith("taşı")) continue; // taşımak vs taş

        // a) Doğrudan kök eşleşmesi
        if (this.index[prefix]) {
          const isHero = Boolean(CORE_ARASAAC_FALLBACKS[prefix]);
          const isMascotSelf = prefix === "kedi";
          const baseScore = isMascotSelf ? 6 : (isHero ? 40 : 20);
          candidates.push({
            key: prefix,
            file: this.index[prefix],
            score: baseScore + Math.min(prefix.length, 8)
          });
          break;
        }

        // b) Ünsüz yumuşaması geri çevrilmiş kök eşleşmesi
        const unsoftened = this.unsoftenStem(prefix);
        if (
          unsoftened &&
          !VISUAL_BLACKLIST.has(unsoftened) &&
          (isAnatomyTopic || !ANATOMY_SECONDARY_WORDS.has(unsoftened)) &&
          this.index[unsoftened]
        ) {
          const isHero = Boolean(CORE_ARASAAC_FALLBACKS[unsoftened]);
          const baseScore = isHero ? 40 : 20;
          candidates.push({
            key: unsoftened,
            file: this.index[unsoftened],
            score: baseScore + Math.min(unsoftened.length, 8)
          });
          break;
        }
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    // Eğer cümlede ana konunun (turnAnchorVisualUrl) kendisi de geçiyorsa (örn. hem "zürafa" hem "yaprak" geçtiyse),
    // veya adayların skoru düşükse (< 25), kararlılığı korumak için en yüksek skorlu somut kavramı seç
    candidates.sort((a, b) => b.score - a.score);
    const winner = candidates[0];

    // Düşük güvenli/belirsiz eşleşmelerde (score < 22) mevcut ana konu görseli varsa onu bozma
    if (!isUserQuestion && winner.score < 22 && this.turnAnchorVisualUrl) {
      return this.turnAnchorVisualUrl;
    }

    return `assets/arasaac/${winner.file}`;
  }

  getTopicOrDefault(topicHint) {
    if (topicHint && TOPIC_FALLBACK_MAP[topicHint]) {
      return `assets/arasaac/${TOPIC_FALLBACK_MAP[topicHint]}`;
    }
    return this.defaultFallback;
  }
}

window.visualEngine = new VisualEngine();
