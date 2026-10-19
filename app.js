// ============================================================
// Ana Uygulama Orkestratörü (Bilgi Kaşifi - İlgi Merkezi)
// ============================================================

class ChildExplorerApp {
  constructor() {
    this.activeStudent = null;
    this.mascot = null;
    this.isListening = false;
    this.recognition = null;
    this.persistentMicStream = null;
    this.speechSynth = window.speechSynthesis;
    this.piperBaseUrl = 'http://127.0.0.1:5005';
    this.piperAvailable = false;
    this.piperModels = ['tr_TR-fahrettin-medium', 'tr_TR-dfki-medium', 'tr_TR-fettah-medium'];
    this.ttsAudioCtx = null;
    this.currentAudioSource = null;
    this.currentAudio = null;
    this.currentBlobUrl = null;
    this.speechQueue = [];
    this.isSpeakingQueue = false;
    this.conversationHistory = [];

    // Ana sesi Fahrettin Türkçe Nöral Ses (tr_TR-fahrettin-medium) olarak sabitle
    localStorage.setItem('bilgi_kasifi_piper_model', 'tr_TR-fahrettin-medium');

    this.init();
  }

  // Web Audio API Context (Maskot Ses Efekt Zinciri İçin)
  getOrCreateTtsAudioContext() {
    if (!this.ttsAudioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ttsAudioCtx = new AudioCtx();
    }
    if (this.ttsAudioCtx.state === 'suspended') {
      this.ttsAudioCtx.resume().catch(() => {});
    }
    return this.ttsAudioCtx;
  }

  // file:// protokolünden http://127.0.0.1:5005/ adresine geçerken öğrenci verilerini koru
  restoreStorageFromWindowName() {
    try {
      if (window.name && window.name.startsWith('BILGI_KASIFI_SYNC:')) {
        const raw = window.name.slice('BILGI_KASIFI_SYNC:'.length);
        const data = JSON.parse(raw);
        for (const [k, v] of Object.entries(data)) {
          if (typeof v === 'string' && !localStorage.getItem(k)) {
            localStorage.setItem(k, v);
          }
        }
        localStorage.setItem('bilgi_kasifi_piper_model', 'tr_TR-fahrettin-medium');
        window.name = '';
      }
    } catch (e) {}
  }

  // Mikrofon iznini bir kez alıp oturum boyunca açık tut (Sürekli "Bu seferlik izin ver" çıkmasını engeller)
  async ensurePersistentMicStream() {
    if (this.persistentMicStream && this.persistentMicStream.active) {
      return true;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }
    try {
      this.persistentMicStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  async init() {
    this.restoreStorageFromWindowName();

    // 1. Piper Nöral TTS & Yerel Web Sunucusu Durumunu Kontrol Et
    await this.checkPiperStatus();

    // KRİTİK: Tarayıcılar file:// protokolünde mikrofon iznini kaydetmez ve her seferinde "Bu seferlik izin ver" sorar.
    // Yerel sunucu (http://127.0.0.1:5005) aktifse otomatik olarak localhost'a geçerek kalıcı mikrofon iznini devreye sok!
    if (window.location.protocol === 'file:' && this.piperAvailable) {
      try {
        const dump = {};
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k) dump[k] = localStorage.getItem(k);
        }
        window.name = 'BILGI_KASIFI_SYNC:' + JSON.stringify(dump);
      } catch (e) {}
      window.location.replace(`${this.piperBaseUrl}/index.html`);
      return;
    }

    // 2. Maskot Başlat
    this.mascot = new MascotController('mascotContainer', 'thoughtBubblesLayer');

    // 3. Öğretmen Panelini Başlat
    window.teacherDashboard.init();

    // 4. Varsayılan veya Kayıtlı Öğrenciyi Yükle
    const students = window.storageService.getStudents();
    if (students.length > 0) {
      this.setActiveStudent(students[0].id, students[0].name);
    } else {
      const defaultStudent = window.storageService.getOrCreateStudent('Minik Kaşif', 'Deney');
      this.setActiveStudent(defaultStudent.id, defaultStudent.name);
    }

    // 5. Ses Tanıma (STT) Kurulumu ve Kalıcı Mikrofon Kanalı Hazırlığı
    this.initSpeechRecognition();
    this.ensurePersistentMicStream();

    // 6. DOM Olaylarını Bağla
    this.attachDomEvents();

    // 7. Hoş Geldin Mesajı ("Miyav!" nidası dahil tam seslendirme ve sabit welcome.png görseli)
    setTimeout(() => {
      const welcomeText = `Miyav! Merhaba ${this.activeStudent ? this.activeStudent.name : 'küçük dostum'}! Ben senin Bilgi Kaşifi arkadaşınım. Bugün dünyadaki hangi sırrı keşfetmek istersin?`;
      this.updateActiveSpeechBubble(welcomeText, { animateFade: true });
      this.speakText(
        welcomeText,
        null,
        null,
        'assets/arasaac/welcome.png'
      );
    }, 1000);
  }

  // Piper Nöral TTS Sunucu Kontrolü (http://127.0.0.1:5005/status)
  async checkPiperStatus() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);
      const res = await fetch(`${this.piperBaseUrl}/status`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        this.piperAvailable = data.status === 'ok';
        if (Array.isArray(data.models) && data.models.length > 0) {
          this.piperModels = data.models;
        }
        return true;
      }
    } catch (e) {
      this.piperAvailable = false;
    }
    return false;
  }

  // Öğrenci Değiştirme
  setActiveStudent(id, name) {
    const students = window.storageService.getStudents();
    this.activeStudent = students.find(s => s.id === id) || { id, name, score: 0, stars: 0 };

    // Sayfa yenilense bile öğrencinin son sohbet geçmişini transkriptten geri yükle (Çok-turlu iskele sürekliliği)
    const savedTranscript = window.storageService.getTranscripts
      ? window.storageService.getTranscripts(this.activeStudent.id)
      : [];
    this.conversationHistory = savedTranscript.slice(-6).map(entry => ({
      role: entry.role === 'Çocuk' ? 'user' : 'assistant',
      content: entry.text
    }));

    document.getElementById('headerStudentName').innerText = this.activeStudent.name;
    this.updateScoreDisplay();

    // Maskota söyle
    if (this.mascot) {
      this.mascot.sayTemporarily(`Harika! Bugün kaptanımız ${this.activeStudent.name}!`);
    }
  }

  updateScoreDisplay() {
    if (!this.activeStudent) return;
    const badge = window.pedagogicalEngine.getBadgeInfo(this.activeStudent.score || 0);

    document.getElementById('headerBadgeIcon').innerText = badge.icon;
    document.getElementById('headerBadgeName').innerText = badge.name;
    document.getElementById('headerStarsCount').innerText = `${this.activeStudent.stars || 0} ⭐`;
  }

  // Web Speech API - Türkçe Ses Tanıma
  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'tr-TR';
      this.recognition.continuous = false;
      this.recognition.interimResults = true;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.mascot.setState('listening');
        document.getElementById('btnMic').classList.add('mic-active');
        document.getElementById('micStatusLabel').innerText = '🎙️ Dinliyorum... Konuş bakalım!';
      };

      this.recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        const inputEl = document.getElementById('childInput');
        if (inputEl) inputEl.value = transcript;
      };

      this.recognition.onerror = (event) => {
        console.warn('Ses tanıma hatası:', event.error);
        this.isListening = false;
        document.getElementById('btnMic').classList.remove('mic-active');

        const label = document.getElementById('micStatusLabel');
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          if (label) label.innerText = '⚠️ Mikrofon izni gerekli (Adres çubuğundan izin verin veya aşağıya yazın)';
          this.mascot.setState('idle', 'Mikrofon izni kapalı görünüyor, aşağıdan yazabilir veya kartlara dokunabilirsin! 🐾');
        } else if (event.error === 'network') {
          if (label) label.innerText = 'ℹ️ Ses tanıma çevrim dışı; aşağıdan yazabilir veya kartlara dokunabilirsin!';
          this.mascot.setState('idle', 'İnternetsiz modda aşağıdaki renkli kartlara dokunabilir veya yazabilirsin! 🐾');
        } else {
          if (label) label.innerText = 'Konuşmak için Mikrofona Bas veya Yaz';
          this.mascot.setState('idle', 'Seni tam duyamadım minik dostum, tekrar dener misin? 🐱');
        }
      };

      this.recognition.onend = () => {
        if (!this.isListening) return;
        this.isListening = false;
        document.getElementById('btnMic').classList.remove('mic-active');
        document.getElementById('micStatusLabel').innerText = 'Konuşmak için Mikrofona Bas';

        const text = document.getElementById('childInput').value.trim();
        if (text) {
          this.handleSendMessage(text);
        } else {
          this.mascot.setState('idle', 'Seni tam duyamadım minik dostum, tekrar söyler misin? 🐾');
        }
      };
    } else {
      console.warn('Web Speech tanıma bu tarayıcıda desteklenmiyor.');
      document.getElementById('micStatusLabel').innerText = 'Mikrofon desteklenmiyor (Yazabilirsin)';
    }
  }

  async toggleListening() {
    if (!this.recognition) {
      this.mascot.setState('listening', 'Sesli giriş desteklenmiyor ama sorunu aşağıya yazabilirsin! 🐾');
      document.getElementById('childInput')?.focus();
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
    } else {
      this.stopSpeaking();
      // Kalıcı mikrofon akışını aktif tut (tekrar izin istemesini önler)
      this.ensurePersistentMicStream();
      // Anında dinleme animasyonunu göster
      this.mascot.setState('listening');
      document.getElementById('btnMic').classList.add('mic-active');
      document.getElementById('micStatusLabel').innerText = '🎙️ Mikrofon açılıyor... Konuşabilirsin!';
      try {
        this.recognition.start();
      } catch (e) {
        console.warn('Mikrofon yeniden başlatılıyor:', e);
        try {
          this.recognition.abort();
          setTimeout(() => this.recognition.start(), 150);
        } catch (err) {
          console.error('Mikrofon başlatılamadı:', err);
        }
      }
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try { this.recognition.stop(); } catch (e) {}
    }
    this.isListening = false;
    document.getElementById('btnMic')?.classList.remove('mic-active');
  }

  // En Doğal ve Uygun Tarayıcı Sesini Seç (Fahrettin Öncelikli)
  getBestVoice() {
    if (!this.speechSynth) return null;
    const voices = this.speechSynth.getVoices();
    const savedVoiceName = localStorage.getItem('bilgi_kasifi_voice_name');

    const fahrettinTr = voices.find(v => v.name.toLowerCase().includes('fahrettin'));
    if (fahrettinTr) return fahrettinTr;

    if (savedVoiceName) {
      const saved = voices.find(v => v.name === savedVoiceName);
      if (saved) return saved;
    }

    const googleTr = voices.find(v => v.name.toLowerCase().includes('google') && (v.lang.includes('tr') || v.lang.includes('TR')));
    if (googleTr) return googleTr;

    const naturalTr = voices.find(v => (v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('emel')) && (v.lang.includes('tr') || v.lang.includes('TR')));
    if (naturalTr) return naturalTr;

    const anyTr = voices.find(v => v.lang.includes('tr') || v.lang.includes('TR'));
    return anyTr || voices[0] || null;
  }

  // Metni konuşma balonu için markdown, parantez ("Ahmet (Kaptan)" -> "Ahmet Kaptan") ve görsel emojilerden arındır
  cleanTextForSpeech(text) {
    if (!text) return '';
    return text
      .replace(/[()*_#`~[\]]/g, ' ')
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Metnin başında "Miyav!", "Miyavvv", "Mırnav" nidası olup olmadığını tespit et
  hasMeowIntro(text) {
    if (!text) return false;
    return /^\s*(?:miyav+|mırnav+)\b/i.test(text);
  }

  // Piper'a gidecek metinden "Miyav!", "Miyavvv", "Miyav," ifadelerini temizle ve cümle sonu noktalamasını garanti et
  stripMeowForPiper(text) {
    if (!text) return '';
    let stripped = text
      .replace(/^\s*(?:miyav+|mırnav+)[!.,;:\s-]*/i, '')
      .replace(/(?:^|[.!?]\s+)(?:miyav+|mırnav+)[!.,;:\s-]*/gi, (match) => {
        const punct = match.match(/^[.!?]\s+/);
        return punct ? punct[0] : '';
      })
      .replace(/\s+/g, ' ')
      .trim();

    if (stripped.length > 0) {
      stripped = stripped.charAt(0).toUpperCase() + stripped.slice(1);
      if (!/[.!?]$/.test(stripped)) {
        const isQuestion = /(?:sence|acaba|neden|nasıl|hangisi|nerede|ne zaman|\bmı\b|\bmi\b|\bmu\b|\bmü\b|\bmıdır\b|\bmidir\b)/i.test(stripped);
        stripped += isQuestion ? '?' : '.';
      }
    }
    return stripped;
  }

  // Piper Nöral TTS Sunucusundan WAV Blob İste (Varsayılan Ana Ses: tr_TR-fahrettin-medium, 4500 ms Timeout)
  async fetchPiperAudioBlob(cleanText) {
    const piperText = this.stripMeowForPiper(cleanText);
    if (!piperText) return null;

    const selectedPiperModel = localStorage.getItem('bilgi_kasifi_piper_model') || 'tr_TR-fahrettin-medium';

    for (let attempt = 1; attempt <= 2; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);
      try {
        const response = await fetch(`${this.piperBaseUrl}/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: piperText,
            model: selectedPiperModel
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Piper HTTP ${response.status}`);
        }
        const blob = await response.blob();
        if (blob && blob.size >= 100) {
          this.piperAvailable = true;
          return blob;
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (attempt === 2) {
          throw err;
        }
        // Piper anlık meşgulse 0.35 sn bekle ve tekrar Piper'dan iste (Kesinlikle Tolga'ya geçme)
        await new Promise(r => setTimeout(r, 350));
      }
    }
    return null;
  }

  // Türkçe Ses Sentezi: 0.4 sn Kedi Miyavlaması (Audio Splicing) -> Piper WAV -> Web Audio API Maskot DSP Zinciri
  async speakText(text, onComplete, preFetchedBlobPromise = null, lockedVisualUrl = null, playMeowFirst = null) {
    const cleanText = this.cleanTextForSpeech(text);
    if (!cleanText) {
      if (onComplete) onComplete();
      return;
    }

    const sessionId = ++this.speechSessionId || (this.speechSessionId = 1);
    const shouldPlayMeow = playMeowFirst !== null ? playMeowFirst : this.hasMeowIntro(cleanText);
    const piperText = this.stripMeowForPiper(cleanText);

    // Cümle için kilitlenmiş görsel yoksa bir kez hesapla (Karşılama modunda welcome.png, vedalaşmada star.png)
    const sentenceVisualUrl = (this.mascot && this.mascot.isWelcomeLocked)
      ? 'assets/arasaac/welcome.png'
      : (this.isFarewellTurn
          ? 'assets/arasaac/star.png'
          : (lockedVisualUrl || (
              window.visualEngine
                ? window.visualEngine.findBestMatch(cleanText, this.mascot ? this.mascot.activeTopicHint : null)
                : null
            )));

    try {
      // Piper ses sentezini arka planda başlat / bekle
      const wavPromise = preFetchedBlobPromise
        ? preFetchedBlobPromise.then(b => (b && b.size >= 100 ? b : this.fetchPiperAudioBlob(cleanText)))
        : this.fetchPiperAudioBlob(cleanText);

      // Eğer cümle başında "Miyav!" varsa: konuşma başlar başlamaz önce 0.4 sn tatlı kedi miyavlamasını çal!
      if (shouldPlayMeow) {
        this.mascot.setState('speaking', cleanText, sentenceVisualUrl);
        if (window.soundEngine && window.soundEngine.playCatMeow) {
          await window.soundEngine.playCatMeow();
        }
      }

      // Miyavlama sırasında konuşma durdurulduysa çık
      if (this.speechSessionId !== sessionId) {
        return;
      }

      // Eğer metin sadece "Miyav!" idiyse miyavlama efekti yeterli
      if (!piperText) {
        if (this.speechQueue.length === 0) {
          this.mascot.setState('idle');
        }
        if (onComplete) onComplete();
        return;
      }

      const wavBlob = await wavPromise;
      if (this.speechSessionId !== sessionId) {
        return;
      }

      if (!wavBlob || wavBlob.size < 100) {
        throw new Error('Piper WAV verisi alınamadı');
      }

      // Önceki çalan ses varsa durdur
      if (this.currentAudioSource) {
        try {
          this.currentAudioSource.onended = null;
          this.currentAudioSource.stop();
        } catch (e) {}
        this.currentAudioSource = null;
      }

      const audioCtx = this.getOrCreateTtsAudioContext();
      const arrayBuffer = await wavBlob.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      if (this.speechSessionId !== sessionId) {
        return;
      }

      // 1. Perdeyi Maskot Frekansına Kaydırma (playbackRate = 1.13)
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = 1.13;

      // 2. Gereksiz Yetişkin Göğüs Derinliğini Tıraşlama (Highpass @ 175 Hz)
      const highpassFilter = audioCtx.createBiquadFilter();
      highpassFilter.type = 'highpass';
      highpassFilter.frequency.value = 175;

      // 3. Vokal Parlaklığı ve Sevimli Maskot Netliği (Peaking @ 2900 Hz, Gain: +2.8 dB)
      const peakingFilter = audioCtx.createBiquadFilter();
      peakingFilter.type = 'peaking';
      peakingFilter.frequency.value = 2900;
      peakingFilter.gain.value = 2.8;

      // DSP Zincirini Bağla: Source -> Highpass (175Hz) -> Peaking (2900Hz, +2.8dB) -> Hoparlör
      source.connect(highpassFilter);
      highpassFilter.connect(peakingFilter);
      peakingFilter.connect(audioCtx.destination);

      this.currentAudioSource = source;

      // Ses başladığı anda kedi konuşma ve dudak senkronizasyonu moduna geçsin (cümle görseli kilitli)
      this.mascot.setState('speaking', cleanText, sentenceVisualUrl);

      source.onended = () => {
        if (this.currentAudioSource === source) {
          this.currentAudioSource = null;
        }
        try {
          source.disconnect();
          highpassFilter.disconnect();
          peakingFilter.disconnect();
        } catch (e) {}

        if (this.speechQueue.length === 0) {
          this.applyPostTurnMascotState();
        }
        if (onComplete) onComplete();
      };

      // Miyavlama efekti biter bitmez Piper'ın hazırladığı asıl cümle sesini pürüzsüzce başlat
      source.start(0);
      return;
    } catch (piperErr) {
      // Web Speech API (Microsoft Tolga) fallback TAMAMEN SUSTURULDU!
      // Araya kesinlikle sistem sesi girmez; yalnızca görsel/metin durumu güncellenip sonraki cümleye geçilir.
      console.warn('Piper TTS yanıtı gecikti veya alınamadı (Tolga fallback devre dışı):', piperErr);
      if (this.speechQueue.length === 0 && this.mascot) {
        this.applyPostTurnMascotState();
      }
      if (onComplete) onComplete();
    }
  }

  // Konuşma bittiğinde vedalaşma durumundaysa mikrofonu kapat ve maskotu sakin dinlenme modunda bırak
  applyPostTurnMascotState() {
    if (!this.mascot) return;
    const studentName = this.activeStudent ? this.activeStudent.name : 'Minik Kaşif';

    if (this.isFarewellTurn) {
      this.stopListening();
      if (this.farewellIntent === 'sleep_farewell') {
        this.mascot.setState('sleep', `İyi geceler ${studentName}! Tekrar keşfetmek istediğinde buradayım... 🌙🐾💤`);
      } else {
        this.mascot.setState('sleep', `Görüşmek üzere ${studentName}! Tekrar keşfetmek istediğinde buradayım... 👋🐾✨`);
      }
    } else {
      this.mascot.setState('idle');
    }
  }

  // Web Speech API (Microsoft Tolga) Fallback Tamamen Susturuldu
  speakWithBrowserFallback(cleanText, onComplete, lockedVisualUrl = null) {
    // Pedagojik atmosferi korumak için Microsoft Tolga / sistem sesi kesinlikle devreye girmez.
    if (this.speechQueue.length === 0 && this.mascot) {
      this.applyPostTurnMascotState();
    }
    if (onComplete) onComplete();
  }

  stopSpeaking() {
    this.speechSessionId = (this.speechSessionId || 0) + 1;
    if (window.soundEngine && window.soundEngine.stopCatMeow) {
      window.soundEngine.stopCatMeow();
    }
    if (this.currentAudioSource) {
      try {
        this.currentAudioSource.onended = null;
        this.currentAudioSource.stop();
        this.currentAudioSource.disconnect();
      } catch (e) {}
      this.currentAudioSource = null;
    }
    if (this.currentAudio) {
      try {
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      this.currentAudio = null;
    }
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
    if (this.speechSynth) {
      this.speechSynth.cancel();
    }
    this.speechQueue = [];
    this.isSpeakingQueue = false;
    if (this.mascot) this.mascot.setState('idle');
  }

  // Cümle Cümle Sıralı Seslendirme Kuyruğu (Ön-Bellekli Streaming Piper TTS + Cümle Başına Tek Görsel Kilidi)
  queueSentenceToSpeak(sentence) {
    const cleanText = this.cleanTextForSpeech(sentence);
    if (!cleanText) return;

    // 1. Cümle başında "Miyav!" varsa veya yanıtın ilk cümlesiyse 0.4 sn kedi miyavlaması çalınacak
    const playMeowFirst = this.hasMeowIntro(cleanText) || (!this.isSpeakingQueue && this.speechQueue.length === 0 && !this.hasPlayedTurnMeow);
    if (playMeowFirst) {
      this.hasPlayedTurnMeow = true;
    }

    // 2. Cümle kuyruğa girerken o cümle için TEK BİR baskın kavram piktogramı belirle ve kilitle
    // (Eğer isFarewellTurn aktifse ARASAAC aramasını bypass et, doğrudan sabit "assets/arasaac/star.png" ata)
    const lockedVisualUrl = this.isFarewellTurn
      ? 'assets/arasaac/star.png'
      : (window.visualEngine
          ? window.visualEngine.findBestMatch(cleanText, this.mascot ? this.mascot.activeTopicHint : null)
          : null);

    // 3. Cümle kuyruğa girer girmez ("Miyav" temizlenmiş metinle) arka planda Piper WAV sentezini başlat
    const preFetchedPromise = this.fetchPiperAudioBlob(cleanText).catch(() => null);
    this.speechQueue.push({
      text: cleanText,
      blobPromise: preFetchedPromise,
      visualUrl: lockedVisualUrl,
      playMeowFirst
    });
    this.processSpeechQueue();
  }

  processSpeechQueue() {
    if (this.isSpeakingQueue || this.speechQueue.length === 0) return;

    this.isSpeakingQueue = true;
    const nextItem = this.speechQueue.shift();

    this.speakText(
      nextItem.text,
      () => {
        this.isSpeakingQueue = false;
        this.processSpeechQueue();
      },
      nextItem.blobPromise,
      nextItem.visualUrl,
      nextItem.playMeowFirst
    );
  }

  // Mesaj Gönderme ve Yapay Zekâ Yanıtı
  async handleSendMessage(text) {
    if (!text || !text.trim()) return;
    if (window.ollamaClient.isGenerating) {
      window.ollamaClient.stop();
    }

    this.stopSpeaking();
    this.hasPlayedTurnMeow = false;
    const childQuestion = text.trim();

    // Vedalaşma / Oturum Kapatma Niyeti Kontrolü (gratitude | day_farewell | sleep_farewell)
    const farewellCheck = (window.pedagogicalEngine && window.pedagogicalEngine.checkFarewellIntent)
      ? window.pedagogicalEngine.checkFarewellIntent(childQuestion)
      : { isFarewell: false, intent: null, category: null };
    this.isFarewellTurn = farewellCheck.isFarewell;
    this.farewellIntent = farewellCheck.intent;

    const detectedTopic = window.pedagogicalEngine
      ? window.pedagogicalEngine.detectTopic(childQuestion.toLowerCase())
      : null;

    if (this.mascot) {
      this.mascot.activeTopicHint = farewellCheck.isFarewell ? 'Vedalaşma ve Kapanış' : detectedTopic;
    }
    if (window.visualEngine) {
      window.visualEngine.setQuestionContext(childQuestion, detectedTopic, farewellCheck);
    }
    const inputEl = document.getElementById('childInput');
    if (inputEl) inputEl.value = '';

    // 1. Çocuğun Mesajını Arka Plan Geçmiş Havuzuna Ekle (Tez Verileri İçin Korunur) ve Aktif Konuşma Balonunu Güncelle
    this.appendMessage({
      sender: 'child',
      text: childQuestion,
      avatar: '🧒'
    });
    this.updateActiveSpeechBubble(
      farewellCheck.isFarewell
        ? 'Seni duydum küçük kâşifim! 🐾💛'
        : 'Hımm, ne kadar güzel bir soru! Hemen düşünüyorum... 🐾✨',
      { childQuestion, animateFade: true }
    );

    if (window.soundEngine) window.soundEngine.playClick();

    // 2. Kırmızı Çizgi / Hassas Konu Kontrolü
    const sensitiveCheck = window.pedagogicalEngine.checkSensitiveContent(childQuestion);
    if (sensitiveCheck.isSensitive) {
      const studentId = this.activeStudent ? this.activeStudent.id : 'std_default';
      const nowStr = new Date().toLocaleString('tr-TR');

      window.storageService.saveAlert(
        this.activeStudent ? this.activeStudent.name : 'Minik Kaşif',
        sensitiveCheck.keyword,
        childQuestion,
        sensitiveCheck.recommendation
      );

      window.storageService.saveTranscriptEntry(studentId, {
        timestamp: nowStr,
        role: 'Çocuk',
        text: childQuestion,
        topic: `Hassas Konu (${sensitiveCheck.keyword})`,
        scoreDelta: 0,
        triggeredRules: ['Kırmızı Çizgi Filtresi']
      });

      window.storageService.saveTranscriptEntry(studentId, {
        timestamp: nowStr,
        role: 'Bilgi Kâşifi',
        text: sensitiveCheck.safeResponse,
        topic: `Hassas Konu (${sensitiveCheck.keyword})`,
        scoreDelta: 0,
        triggeredRules: ['Güvenli Pedagojik Yönlendirme']
      });

      setTimeout(() => {
        if (this.mascot) this.mascot.isWelcomeLocked = false;
        this.appendMessage({
          sender: 'teacher',
          text: sensitiveCheck.safeResponse,
          avatar: '🐱'
        });
        this.updateActiveSpeechBubble(sensitiveCheck.safeResponse, { animateFade: true });
        this.speakText(sensitiveCheck.safeResponse);
      }, 500);
      return;
    }

    // 3. Önce Dinleme/Anlama Jesti Göster, Ardından Düşünme Moduna Geç!
    this.mascot.setState(
      'listening',
      farewellCheck.isFarewell
        ? 'Seni duydum küçük kâşifim! 🐾💛'
        : 'Harika bir soru! Seni duydum, hemen düşünüyorum... 👂✨'
    );
    await new Promise(resolve => setTimeout(resolve, 650));

    this.mascot.setState('thinking');
    if (window.soundEngine) window.soundEngine.playSparkle();

    // 4. Mesaj Konteynerını Hazırla
    const teacherMsgId = 'msg_' + Date.now();
    const msgElement = this.appendMessage({
      id: teacherMsgId,
      sender: 'teacher',
      text: '',
      avatar: '🐱',
      isStreaming: true
    });

    // 5. Konuşma Geçmişini Oluştur (Kapanış/teşekkür/veda modundaysa niyete göre Sokratik soru kuralını askıya al!)
    const studentName = this.activeStudent ? this.activeStudent.name : 'Minik Kaşif';
    const systemPrompt = window.pedagogicalEngine.getSystemPrompt(
      studentName,
      { isFarewell: farewellCheck.isFarewell, farewellIntent: farewellCheck.intent }
    );
    const fewShot = farewellCheck.isFarewell
      ? (window.pedagogicalEngine.getFarewellFewShotMessages
          ? window.pedagogicalEngine.getFarewellFewShotMessages(studentName, farewellCheck.intent)
          : [])
      : (window.pedagogicalEngine.getFewShotMessages ? window.pedagogicalEngine.getFewShotMessages() : []);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...fewShot,
      ...(farewellCheck.isFarewell ? [] : this.conversationHistory.slice(-4)),
      { role: 'user', content: childQuestion }
    ];

    let fullGeneratedResponse = '';
    let hasAnimatedFirstToken = false;

    // 6. Ollama'dan Gerçek Zamanlı Streaming Başlat
    await window.ollamaClient.streamChat({
      messages,
      isFarewell: farewellCheck.isFarewell,
      farewellIntent: farewellCheck.intent,
      userQuestion: childQuestion,
      onToken: (token, currentFull) => {
        fullGeneratedResponse = currentFull;
        const cleanText = window.pedagogicalEngine 
          ? window.pedagogicalEngine.cleanResponse(currentFull, farewellCheck.isFarewell, farewellCheck.intent, childQuestion)
          : currentFull;
        const textNode = msgElement.querySelector('.message-text');
        if (textNode) {
          textNode.innerText = cleanText;
          this.scrollToBottom();
        }
        if (cleanText) {
          this.updateActiveSpeechBubble(cleanText, { animateFade: !hasAnimatedFirstToken });
          hasAnimatedFirstToken = true;
        }
      },
      onSentenceComplete: (sentence) => {
        if (this.mascot) this.mascot.isWelcomeLocked = false;
        this.queueSentenceToSpeak(sentence);
      },
      onDone: (finalText) => {
        if (this.mascot) this.mascot.isWelcomeLocked = false;
        msgElement.classList.remove('streaming');
        const textNode = msgElement.querySelector('.message-text');
        if (textNode && finalText) {
          textNode.innerText = finalText;
        }
        if (finalText) {
          this.updateActiveSpeechBubble(finalText, { animateFade: true });
        }

        if (this.speechQueue.length === 0 && !this.isSpeakingQueue && finalText) {
          this.speakText(finalText);
        } else if (this.speechQueue.length === 0 && !this.isSpeakingQueue) {
          this.applyPostTurnMascotState();
        }

        this.conversationHistory.push({ role: 'user', content: childQuestion });
        this.conversationHistory.push({ role: 'assistant', content: finalText || '' });

        // 7. Pedagojik Puanlama, Rozet Kontrolü ve Kalıcı Transkript Kaydı
        const scoring = window.pedagogicalEngine.analyzeAndScore(childQuestion);
        const studentId = this.activeStudent ? this.activeStudent.id : 'std_default';
        const nowStr = new Date().toLocaleString('tr-TR');
        const ruleLabels = scoring.details.map(d => d.label);

        // Çocuğun mesajını transkripte kaydet
        window.storageService.saveTranscriptEntry(studentId, {
          timestamp: nowStr,
          role: 'Çocuk',
          text: childQuestion,
          topic: farewellCheck.isFarewell ? 'Vedalaşma / Kapanış' : scoring.topic,
          scoreDelta: scoring.scoreDelta,
          triggeredRules: ruleLabels
        });

        // Yapay zekânın yanıtını transkripte kaydet
        window.storageService.saveTranscriptEntry(studentId, {
          timestamp: nowStr,
          role: 'Bilgi Kâşifi',
          text: finalText || '',
          topic: farewellCheck.isFarewell ? 'Vedalaşma / Kapanış' : scoring.topic,
          scoreDelta: 0,
          triggeredRules: [farewellCheck.isFarewell ? 'Sıcak Veda ve Oturum Kapanışı' : 'Sokratik İskele Yanıtı']
        });

        if (this.activeStudent) {
          window.storageService.updateStudentStats(
            this.activeStudent.id,
            scoring.scoreDelta,
            scoring.details,
            scoring.topic
          );

          const updated = window.storageService.getStudents().find(s => s.id === this.activeStudent.id);
          if (updated) {
            this.activeStudent = updated;
            this.updateScoreDisplay();
          }

          if (scoring.scoreDelta >= 5) {
            if (window.soundEngine) window.soundEngine.playReward();
            this.mascot.triggerHappyEyes(1200);
            this.showRewardBadge(scoring.details[0]?.label || `+${scoring.scoreDelta} Yıldız!`);
          }
        }
      },
      onError: (err) => {
        const errMsg = 'Özür dilerim minik dostum, yerel yapay zekâ servisine (Ollama) bağlanırken bir sorun oldu. Tekrar dener misin?';
        msgElement.classList.remove('streaming');
        const textNode = msgElement.querySelector('.message-text');
        if (textNode) {
          textNode.innerText = errMsg;
        }
        this.updateActiveSpeechBubble(errMsg, { animateFade: true });
        this.mascot.setState('idle', 'Tekrar sorar mısın minik kaşif?');
      }
    });
  }

  // Sağ Paneldeki Tek ve Ferah Aktif Konuşma Balonunu Güncelle (Fade-in Geçişli)
  updateActiveSpeechBubble(text, { childQuestion = null, animateFade = true } = {}) {
    if (childQuestion !== null) {
      const qBadge = document.getElementById('activeQuestionBadge');
      const qText = document.getElementById('activeQuestionText');
      if (qBadge && qText) {
        qText.innerText = childQuestion;
        qBadge.style.display = 'inline-flex';
      }
    }

    const speechEl = document.getElementById('activeSpeechText');
    if (!speechEl || !text) return;

    if (animateFade) {
      speechEl.classList.remove('fade-in');
      void speechEl.offsetWidth;
      speechEl.innerText = text;
      speechEl.classList.add('fade-in');
    } else {
      speechEl.innerText = text;
    }
  }

  // Mesaj Balonunu Arka Plan Geçmiş Havuzuna Ekleme (Tez Verileri İçin Korunur)
  appendMessage({ id, sender, text, avatar, isStreaming = false }) {
    const container = document.getElementById('chatMessages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-bubble chat-bubble-${sender} ${isStreaming ? 'streaming' : ''}`;
    if (id) msgDiv.id = id;

    msgDiv.innerHTML = `
      <div class="bubble-avatar">${avatar}</div>
      <div class="bubble-content">
        <p class="message-text">${text || (isStreaming ? 'Düşünüyorum... 🐾' : '')}</p>
      </div>
    `;

    if (container) {
      container.appendChild(msgDiv);
      this.scrollToBottom();
    }
    return msgDiv;
  }

  scrollToBottom() {
    const container = document.getElementById('chatMessages');
    if (container) container.scrollTop = container.scrollHeight;
  }

  // Ödül Rozeti / Geçici Toast Bildirimi (3 sn sonra yukarı kayıp tamamen kaybolur)
  showRewardBadge(text) {
    const banner = document.getElementById('rewardBanner');
    if (!banner) return;

    if (this.rewardBannerTimer) clearTimeout(this.rewardBannerTimer);
    if (this.rewardBannerHideTimer) clearTimeout(this.rewardBannerHideTimer);

    banner.innerText = text;
    banner.style.display = 'block';
    banner.classList.remove('fade-out');

    // Tarayıcı yeniden boyamasını (reflow) tetikleyip yukarıdan yumuşakça indir (slide-down)
    void banner.offsetWidth;
    banner.classList.add('show');

    // 3 saniye (3000 ms) ekranda kaldıktan sonra yukarı kayıp saydamlaşarak kaybolsun
    this.rewardBannerTimer = setTimeout(() => {
      banner.classList.remove('show');
      banner.classList.add('fade-out');
      this.rewardBannerHideTimer = setTimeout(() => {
        banner.classList.remove('fade-out');
        banner.style.display = 'none';
      }, 420);
    }, 3000);
  }

  // DOM Olaylarını Bağlama
  attachDomEvents() {
    // Mikrofon Butonu
    const btnMic = document.getElementById('btnMic');
    if (btnMic) {
      btnMic.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.init();
        this.toggleListening();
      });
    }

    // Gönder Butonu
    const btnSend = document.getElementById('btnSend');
    if (btnSend) {
      btnSend.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.init();
        const input = document.getElementById('childInput');
        if (input && input.value.trim()) {
          this.handleSendMessage(input.value);
        }
      });
    }

    // Yazı Kutusu (Enter Tuşu + Yazarken Kedinin Dinleme Tepkisi)
    const childInput = document.getElementById('childInput');
    if (childInput) {
      childInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (window.soundEngine) window.soundEngine.init();
          if (childInput.value.trim()) {
            this.handleSendMessage(childInput.value);
          }
        }
      });

      childInput.addEventListener('input', () => {
        if (!window.ollamaClient.isGenerating && !this.isSpeakingQueue) {
          if (childInput.value.trim().length > 0 && this.mascot.state !== 'listening') {
            this.mascot.setState('listening', 'Yazdıklarını pür dikkat takip ediyorum... 👂🐾');
          } else if (childInput.value.trim().length === 0 && this.mascot.state === 'listening' && !this.isListening) {
            this.mascot.setState('idle', 'Sorunu bekliyorum minik kaşif! 🐾');
          }
        }
      });
    }

    // Geliştirici Hızlı Metin Test Girişi Kısayolu (Shift + T ile Açılır / Kapanır)
    window.addEventListener('keydown', (e) => {
      if (e.shiftKey && !e.ctrlKey && !e.altKey && (e.key === 'T' || e.key === 't' || e.code === 'KeyT')) {
        const activeEl = document.activeElement;
        const isTypingInOtherInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') && activeEl.id !== 'childInput';
        if (isTypingInOtherInput) return;

        // Eğer kullanıcı #childInput içinde metin yazıyorsa ve kutu boş değilse büyük 'T' harfi yazabilsin;
        // kutu boşken veya odakta değilken Shift + T çubuğu açıp kapatsın
        if (activeEl && activeEl.id === 'childInput' && activeEl.value.length > 0) {
          return;
        }

        e.preventDefault();
        const devBar = document.getElementById('devTestInputBar');
        if (!devBar) return;

        const isHidden = devBar.style.display === 'none' || getComputedStyle(devBar).display === 'none';
        if (isHidden) {
          devBar.style.display = 'flex';
          setTimeout(() => {
            document.getElementById('childInput')?.focus();
          }, 30);
        } else {
          devBar.style.display = 'none';
          document.getElementById('childInput')?.blur();
        }
      }
    });

    // Hızlı Merak Kartları (Okuma Yazma Bilmeyen 4-5 Yaş Çocuklar İçin Dokunmatik Resimli Kartlar)
    const quickButtons = document.querySelectorAll('.quick-topic-btn');
    quickButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.init();
        const promptText = btn.dataset.prompt;
        if (promptText) {
          this.handleSendMessage(promptText);
        }
      });
    });

    // Öğretmen Paneli Butonu (Kilit Simgesi)
    const btnTeacher = document.getElementById('btnTeacherPanel');
    if (btnTeacher) {
      btnTeacher.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.playClick();
        window.teacherDashboard.open();
      });
    }

    // Tam Ekran Butonu
    const btnFullscreen = document.getElementById('btnFullscreen');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => console.log(err));
        } else {
          document.exitFullscreen().catch(err => console.log(err));
        }
      });
    }

    // Uygulamayı Kapat Butonu (Kiosk / Çıkış Modu)
    const btnCloseApp = document.getElementById('btnCloseApp');
    if (btnCloseApp) {
      btnCloseApp.addEventListener('click', () => {
        closeApplication();
      });
    }

    // Otomatik Tam Ekran: İlk tıklamada/dokunuşta sessizce tam ekrana geç
    document.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    }, { once: true });

    document.addEventListener('touchstart', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    }, { once: true });
  }
}

// Global Uygulama Kapatma Fonksiyonu (HTML onclick ve kiosk butonuna bağlı)
function closeApplication() {
  try {
    if (window.appInstance) {
      window.appInstance.stopSpeaking();
      window.appInstance.stopListening();
    }
  } catch (e) {}

  window.close();

  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }

  // Tarayıcı sekmesi güvenlik sebebiyle kapanmazsa dinlenme/kapanış mesajı göster
  setTimeout(() => {
    if (window.appInstance && window.appInstance.mascot) {
      const studentName = window.appInstance.activeStudent ? window.appInstance.activeStudent.name : 'küçük dostum';
      window.appInstance.mascot.setState('sleep', `Hoşça kal ${studentName}! Sayfayı veya tarayıcıyı kapatabilirsin... 👋🐾💤`);
      window.appInstance.updateActiveSpeechBubble(`Oturum tamamlandı. Sekmeyi güvenle kapatabilirsin ${studentName}! 🐾🌙`, { animateFade: true });
    }
  }, 250);
}
window.closeApplication = closeApplication;

// Emniyet Supabı: Sayfa yüklendiğinde ve ilk odaklanmada doğrudan tam ekrana geçmeyi dene
window.addEventListener('load', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
});

window.addEventListener('focus', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
});

// Uygulamayı Başlat
window.addEventListener('DOMContentLoaded', () => {
  window.appInstance = new ChildExplorerApp();
});
