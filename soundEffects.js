// ============================================================
// Web Audio API Tabanlı Çevrim Dışı Ses Efektleri Motoru
// Hiçbir harici ses dosyasına ihtiyaç duymaz, %100 yerel ve çevrim dışı çalışır.
// ============================================================

class SoundEffectsEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 1. Balon Patlatma Sesi (Pop!) - Düşünce balonu patlatıldığında
  playPop() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const now = this.ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400 + Math.random() * 200, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // 2. Yıldız / Rozet / Başarı Sesi (Chime)
  playReward() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + idx * 0.07;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.36);
    });
  }

  // 3. Mikrofon Dinleme Başladı Sesi
  playListenStart() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now); // A4
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  // 4. Düğme Tıklama Sesi (Click)
  playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // 5. Sihir / Düşünme Parıltısı
  playSparkle() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [1200, 1500, 1800, 2200];
    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  // 6. Tatlı Yavru Kedi Miyavlaması (0.40 sn - Audio Splicing İçin)
  // Hem assets/sounds/cat_meow.wav dosyasını hem de çevrim dışı (file://) PCM formant tamponunu destekler
  getOrCreateMeowBuffer() {
    this.init();
    if (!this.ctx) return null;
    if (this.meowBuffer) return this.meowBuffer;

    const sampleRate = this.ctx.sampleRate || 44100;
    const duration = 0.40;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);

    let phase = 0.0;
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const p = t / duration;

      // Tatlı yavru kedi "Mii-yaav" perde (pitch) eğrisi
      let f0;
      if (p < 0.35) {
        f0 = 590.0 + (930.0 - 590.0) * Math.sin((p / 0.35) * (Math.PI / 2.0));
      } else {
        const p2 = (p - 0.35) / 0.65;
        f0 = 930.0 - (930.0 - 620.0) * Math.pow(p2, 1.15);
      }
      f0 += 11.0 * Math.sin(2.0 * Math.PI * 15.0 * t);
      phase += (2.0 * Math.PI * f0) / sampleRate;

      // Vokal formant harmonikleri (/i/ -> /a/ -> /u/)
      const w1 = 1.0;
      const w2 = 0.65 * (0.4 + 0.6 * Math.sin(Math.PI * p));
      const w3 = 0.30 * Math.sin(Math.PI * Math.max(0.0, (p - 0.15) / 0.85));
      const raw =
        w1 * Math.sin(phase) +
        w2 * Math.sin(2.0 * phase + 0.3) +
        w3 * Math.sin(3.0 * phase + 0.7);

      // Yumuşak nefes zarfı
      let env;
      if (p < 0.08) {
        env = Math.pow(p / 0.08, 0.7);
      } else if (p < 0.72) {
        env = 1.0 - 0.15 * ((p - 0.08) / 0.64);
      } else {
        env = 0.85 * Math.pow(1.0 - (p - 0.72) / 0.28, 1.6);
      }

      data[i] = Math.max(-1.0, Math.min(1.0, raw * env * 0.26));
    }

    this.meowBuffer = buffer;
    return this.meowBuffer;
  }

  playCatMeow() {
    if (!this.enabled) return Promise.resolve();
    this.init();
    if (!this.ctx) return Promise.resolve();

    this.stopCatMeow();

    return new Promise((resolve) => {
      try {
        const buffer = this.getOrCreateMeowBuffer();
        if (!buffer) {
          resolve();
          return;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        // Kedi sesini yumuşatmak için hafif bandpass/lowpass filtre
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 3400;

        source.connect(filter);
        filter.connect(this.ctx.destination);

        this.currentMeowSource = source;
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          if (this.currentMeowSource === source) {
            this.currentMeowSource = null;
          }
          try {
            source.disconnect();
            filter.disconnect();
          } catch (e) {}
          resolve();
        };

        source.onended = finish;
        setTimeout(finish, 430);
        source.start(0);
      } catch (e) {
        resolve();
      }
    });
  }

  stopCatMeow() {
    if (this.currentMeowSource) {
      try {
        this.currentMeowSource.onended = null;
        this.currentMeowSource.stop();
        this.currentMeowSource.disconnect();
      } catch (e) {}
      this.currentMeowSource = null;
    }
  }
}

window.soundEngine = new SoundEffectsEngine();

