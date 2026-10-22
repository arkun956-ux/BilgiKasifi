// ============================================================
// Etkileşimli Animasyonlu Kedi Maskotu ("Bilgi Kaşifi")
// 30 FPS Kare Kare (Frame-by-Frame) Çizgi Film Animasyon Motoru
// ============================================================

class MascotController {
  constructor(containerId, bubbleContainerId) {
    this.container = document.getElementById(containerId);
    this.bubbleContainer = document.getElementById(bubbleContainerId);
    this.state = 'idle'; // idle | listening | thinking | speaking | celebrating | sleep

    try {
      localStorage.removeItem('bilgi_kasifi_mascot_mode');
    } catch (e) {}

    this.poppedBubblesCount = 0;
    this.bubbleInterval = null;
    this.phraseTimer = null;
    this.isWelcomeLocked = true;

    this.thinkingPhrases = [
      "Hımm, ne kadar harika bir soru! Düşünüyorum... 🐾",
      "Düşünce sandığımı açtım, ipuçlarını topluyorum... 💡",
      "Aklıma çok ilginç bir bilgi geldi bile! ✨",
      "Ben düşünürken uçan balonları patlatabilirsin! 🎈",
      "Hemen anlatmak için sabırsızlanıyorum... 🌟"
    ];
    this.phraseIndex = 0;
    this.idleInactivityTimer = null;

    // 30 FPS Motoru Durum Değişkenleri
    this.animRafId = null;
    this.frameCount = 0;
    this.fps = 30;
    this.frameDuration = 1000 / this.fps; // 33.33ms
    this.lastFrameTime = performance.now();

    this.blinkPhase = 0; // 0: açık, 1: yarım, 2: tam kapalı, 3: yarım
    this.blinkStartFrame = 0;
    this.nextBlinkFrame = 60 + Math.floor(Math.random() * 60);

    this.earTwitchPhase = 0;
    this.earTwitchStartFrame = 0;
    this.earTwitchTarget = 'right';
    this.nextEarTwitchFrame = 90 + Math.floor(Math.random() * 90);

    this.speechMouthFrame = 0;
    this.targetGaze = null;

    this.renderMascot();
    this.showVisual('assets/arasaac/welcome.png');
    this.start30FpsEngine();
    this.startIdleInactivityTracker();
  }

  // Sevimli Turuncu Tekir Kedi Maskotunun Zengin Katmanlı Çizgi Film SVG Çizimi
  renderMascot() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="mascot-wrapper state-idle" id="mascotMain">
        <!-- Arka Plan Işık Halesi -->
        <div class="mascot-glow" id="mascotGlow"></div>

        <!-- Dinleme Ses Halkaları (Listening State) -->
        <div class="listen-rings" id="listenRings" style="display:none;">
          <div class="listen-ring r1"></div>
          <div class="listen-ring r2"></div>
          <div class="listen-ring r3"></div>
        </div>

        <!-- Yüzen Çevre Efektleri (Idle / Speaking / Thinking Süsleri) -->
        <div class="mascot-ambient-fx" id="mascotAmbientFx">
          <span class="fx-item fx-1">🐾</span>
          <span class="fx-item fx-2">✨</span>
          <span class="fx-item fx-3">🎵</span>
        </div>

        <!-- Düşünme Simgeleri (Ampul, Çark, Düşünce Bulutu & Merak Soru İşareti) -->
        <div class="mascot-thinking-badge" id="mascotBulb" style="display:none;">
          <span class="idea-cloud">💭</span>
          <span class="idea-bulb">💡</span>
          <span class="idea-gear">⚙️</span>
          <span class="idea-question">❓</span>
        </div>

        <!-- Dinleme Ses Dalgaları Göstergesi -->
        <div class="mascot-listening-badge" id="mascotListeningBadge" style="display:none;">
          <span class="ear-icon">👂</span>
          <div class="sound-wave-bars">
            <span class="sw-bar"></span>
            <span class="sw-bar"></span>
            <span class="sw-bar"></span>
            <span class="sw-bar"></span>
          </div>
          <span class="listen-tag">Dinliyorum!</span>
        </div>

        <!-- 30 FPS KARE KARE ANİMASYONLU VEKTÖR ÇİZGİ FİLM MASKOTU -->
        <svg viewBox="0 0 240 280" class="mascot-svg" id="mascotSvg">
          <defs>
            <!-- Göz İris Gradyanı (Işıltılı Kehribar/Bal Rengi) -->
            <radialGradient id="catEyeGrad" cx="45%" cy="40%" r="65%">
              <stop offset="0%" stop-color="#FFE082" />
              <stop offset="55%" stop-color="#FFB300" />
              <stop offset="100%" stop-color="#E65100" />
            </radialGradient>

            <!-- Gövde Gölgelendirmesi -->
            <linearGradient id="catFurGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FFA756" />
              <stop offset="55%" stop-color="#F58220" />
              <stop offset="100%" stop-color="#D95B08" />
            </linearGradient>

            <!-- Göbek Kremi -->
            <radialGradient id="catBellyGrad" cx="50%" cy="45%" r="55%">
              <stop offset="0%" stop-color="#FFF8E7" />
              <stop offset="80%" stop-color="#FFE0B2" />
              <stop offset="100%" stop-color="#FFCC80" />
            </radialGradient>
          </defs>

          <!-- 1. ZEMİN GÖLGESİ (Zıplama ve Nefesle Büyüyüp Küçülür) -->
          <ellipse id="mascotShadow" class="cat-shadow" cx="110" cy="265" rx="68" ry="11" fill="rgba(191, 54, 12, 0.2)" />

          <!-- ANA KARAKTER GRUBU (30 FPS Kare Kare Vücut Hareketleri) -->
          <g id="catWholeBody" class="cat-whole-body">

            <!-- 2. KUYRUK (30 FPS Canlı Sallanan Tüylü Kuyruk) -->
            <g id="mascotTailGroup" class="cat-tail-group">
              <path id="catTailPath" d="M 135 210 Q 188 225 202 172 Q 216 120 182 82 Q 165 62 154 78 Q 146 95 168 118 Q 186 142 144 195 Z" fill="url(#catFurGrad)"/>
              <!-- Kuyruk Tekir Çizgileri -->
              <path d="M 176 142 Q 186 150 192 160" stroke="#B84407" stroke-width="6" stroke-linecap="round" fill="none"/>
              <path d="M 184 115 Q 194 125 197 134" stroke="#B84407" stroke-width="6" stroke-linecap="round" fill="none"/>
              <path d="M 171 91 Q 180 98 182 108" stroke="#B84407" stroke-width="6" stroke-linecap="round" fill="none"/>
              <path d="M 156 80 Q 163 85 167 92" stroke="#B84407" stroke-width="5" stroke-linecap="round" fill="none"/>
            </g>

            <!-- 3. BACAKLAR & AYAK PATİLERİ -->
            <g class="cat-legs-group">
              <!-- Sol Bacak -->
              <g class="cat-leg-left">
                <path d="M 72 215 Q 68 250 72 256 Q 75 261 88 261 Q 98 261 98 252 Q 98 230 96 215 Z" fill="url(#catFurGrad)"/>
                <ellipse cx="85" cy="256" rx="13" ry="6" fill="#FFA756"/>
                <path d="M 78 254 L 78 260 M 85 254 L 85 260 M 92 253 L 92 259" stroke="#B84407" stroke-width="2.2" stroke-linecap="round"/>
              </g>
              <!-- Sağ Bacak -->
              <g class="cat-leg-right">
                <path d="M 124 215 Q 122 230 122 252 Q 122 261 132 261 Q 145 261 148 256 Q 152 250 148 215 Z" fill="url(#catFurGrad)"/>
                <ellipse cx="135" cy="256" rx="13" ry="6" fill="#FFA756"/>
                <path d="M 128 253 L 128 259 M 135 254 L 135 260 M 142 254 L 142 260" stroke="#B84407" stroke-width="2.2" stroke-linecap="round"/>
              </g>
            </g>

            <!-- 4. GÖVDE & KARIN (30 FPS Nefes Alan ve Esneyen Gövde) -->
            <g id="mascotBody" class="cat-body-group">
              <!-- Ana Gövde Şekli -->
              <path d="M 68 140 Q 52 185 64 228 Q 80 240 110 240 Q 140 240 156 228 Q 168 185 152 140 Z" fill="url(#catFurGrad)"/>
              
              <!-- Yan Vücut Tekir Çizgileri -->
              <path d="M 58 175 Q 70 178 78 174" stroke="#B84407" stroke-width="5" stroke-linecap="round" fill="none"/>
              <path d="M 59 195 Q 72 198 80 193" stroke="#B84407" stroke-width="5" stroke-linecap="round" fill="none"/>
              <path d="M 162 175 Q 150 178 142 174" stroke="#B84407" stroke-width="5" stroke-linecap="round" fill="none"/>
              <path d="M 161 195 Q 148 198 140 193" stroke="#B84407" stroke-width="5" stroke-linecap="round" fill="none"/>

              <!-- Sevimli Krem Göbek Ovali -->
              <ellipse cx="110" cy="192" rx="32" ry="36" fill="url(#catBellyGrad)"/>
            </g>

            <!-- 5. KOLLAR & PATİLER (Kare Kare Jest Modları) -->
            <!-- SOL KOL: Normalde belinde -->
            <g id="catArmLeftNormal" class="cat-arm-left-normal">
              <path d="M 68 148 Q 44 170 52 195 Q 56 205 68 202 Q 74 200 70 188 Q 66 172 78 156 Z" fill="url(#catFurGrad)"/>
              <path d="M 49 178 Q 56 182 62 180" stroke="#B84407" stroke-width="4" stroke-linecap="round" fill="none"/>
              <circle cx="62" cy="198" r="7.5" fill="#FFA756" stroke="#D95B08" stroke-width="1.5"/>
            </g>

            <!-- SOL KOL: Konuşurken Anlatıcı Jesti -->
            <g id="catArmLeftSpeaking" class="cat-arm-left-speaking" style="display:none;">
              <path d="M 68 150 Q 34 142 28 122 Q 26 112 38 112 Q 48 114 54 132 Q 62 144 74 154 Z" fill="url(#catFurGrad)"/>
              <circle cx="33" cy="116" r="8.5" fill="#FFA756" stroke="#D95B08" stroke-width="1.5"/>
              <path d="M 28 112 L 26 108 M 33 110 L 33 105 M 38 112 L 40 108" stroke="#B84407" stroke-width="2" stroke-linecap="round"/>
            </g>

            <!-- SOL KOL: Kutlama / Zafer Jesti (Pati Havada) -->
            <g id="catArmLeftCelebration" class="cat-arm-left-celebration" style="display:none;">
              <path d="M 68 145 Q 36 120 40 76 Q 44 64 56 68 Q 62 72 60 92 Q 60 114 76 142 Z" fill="url(#catFurGrad)"/>
              <circle cx="46" cy="70" r="8.5" fill="#FFA756" stroke="#D95B08" stroke-width="1.5"/>
              <path d="M 41 66 L 39 62 M 46 65 L 46 60 M 51 67 L 53 63" stroke="#B84407" stroke-width="2" stroke-linecap="round"/>
            </g>

            <!-- SAĞ KOL MOD 1: Normal Belinde / El Sallayan -->
            <g id="catArmRightNormal" class="cat-arm-right-normal">
              <path d="M 152 148 Q 176 170 168 195 Q 164 205 152 202 Q 146 200 150 188 Q 154 172 142 156 Z" fill="url(#catFurGrad)"/>
              <path d="M 171 178 Q 164 182 158 180" stroke="#B84407" stroke-width="4" stroke-linecap="round" fill="none"/>
              <circle cx="158" cy="198" r="7.5" fill="#FFA756" stroke="#D95B08" stroke-width="1.5"/>
            </g>

            <!-- SAĞ KOL MOD 2: Düşünme Pozu (Pati Çenede) -->
            <g id="catArmRightThinking" class="cat-arm-right-thinking" style="display:none;">
              <path d="M 150 155 Q 174 156 162 132 Q 152 118 130 124 Q 122 127 125 137 Q 138 144 144 158 Z" fill="url(#catFurGrad)"/>
              <circle cx="128" cy="128" r="8.5" fill="#FFA756" stroke="#D95B08" stroke-width="1.5"/>
              <path d="M 123 125 Q 128 129 133 125" stroke="#B84407" stroke-width="2" fill="none"/>
            </g>

            <!-- SAĞ KOL MOD 3: Dinleme Pozu (Pati Kulakta) -->
            <g id="catArmRightListening" class="cat-arm-right-listening" style="display:none;">
              <path d="M 152 150 Q 192 130 184 88 Q 180 74 168 80 Q 162 86 168 106 Q 172 128 146 146 Z" fill="url(#catFurGrad)"/>
              <circle cx="174" cy="82" r="9" fill="#FFA756" stroke="#D95B08" stroke-width="1.5"/>
              <path d="M 170 78 L 168 74 M 175 77 L 175 72 M 180 79 L 182 75" stroke="#B84407" stroke-width="2" stroke-linecap="round"/>
            </g>

            <!-- SAĞ KOL MOD 4: Konuşma Jesti -->
            <g id="catArmRightSpeaking" class="cat-arm-right-speaking" style="display:none;">
              <path d="M 152 150 Q 186 140 192 116 Q 194 106 182 106 Q 172 108 166 128 Q 158 142 146 154 Z" fill="url(#catFurGrad)"/>
              <circle cx="186" cy="110" r="8.5" fill="#FFA756" stroke="#D95B08" stroke-width="1.5"/>
              <path d="M 181 106 L 179 102 M 186 104 L 186 99 M 191 106 L 193 102" stroke="#B84407" stroke-width="2" stroke-linecap="round"/>
            </g>

            <!-- SAĞ KOL MOD 5: Kutlama / Zafer Jesti (Pati Havada) -->
            <g id="catArmRightCelebration" class="cat-arm-right-celebration" style="display:none;">
              <path d="M 152 145 Q 184 120 180 76 Q 176 64 164 68 Q 158 72 160 92 Q 160 114 144 142 Z" fill="url(#catFurGrad)"/>
              <circle cx="174" cy="70" r="8.5" fill="#FFA756" stroke="#D95B08" stroke-width="1.5"/>
              <path d="M 169 67 L 167 63 M 174 65 L 174 60 M 179 66 L 181 62" stroke="#B84407" stroke-width="2" stroke-linecap="round"/>
            </g>

            <!-- 6. KAFA GRUBU (30 FPS Eğilip Bükülebilen, Mimik Yapan Bölge) -->
            <g id="mascotHeadGroup" class="cat-head-group">
              
              <!-- Kulaklar (Bağımsız Seğiren ve Dikilen Kulaklar) -->
              <!-- Sol Kulak -->
              <g id="catEarLeft" class="cat-ear-left">
                <polygon points="62,75 36,18 88,48" fill="url(#catFurGrad)"/>
                <polygon points="61,70 45,28 81,50" fill="#FFAB91"/>
              </g>
              <!-- Sağ Kulak -->
              <g id="catEarRight" class="cat-ear-right">
                <polygon points="158,75 184,18 132,48" fill="url(#catFurGrad)"/>
                <polygon points="159,70 175,28 139,50" fill="#FFAB91"/>
              </g>

              <!-- Kafa Yuvarlağı & Yanaklar -->
              <path d="M 52 100 Q 45 74 70 58 Q 110 48 150 58 Q 175 74 168 100 Q 173 126 152 139 Q 110 153 68 139 Q 47 126 52 100 Z" fill="url(#catFurGrad)"/>

              <!-- Alın Çizgileri (Tekir Kedi Karakteristik 3 Çizgi) -->
              <path d="M 110 56 L 110 81" stroke="#B84407" stroke-width="5.5" stroke-linecap="round"/>
              <path d="M 96 62 L 100 83" stroke="#B84407" stroke-width="4.5" stroke-linecap="round"/>
              <path d="M 124 62 L 120 83" stroke="#B84407" stroke-width="4.5" stroke-linecap="round"/>

              <!-- Yanak Çizgileri -->
              <path d="M 53 98 Q 65 100 73 97" stroke="#B84407" stroke-width="4" stroke-linecap="round" fill="none"/>
              <path d="M 55 110 Q 67 112 75 108" stroke="#B84407" stroke-width="4" stroke-linecap="round" fill="none"/>
              <path d="M 167 98 Q 155 100 147 97" stroke="#B84407" stroke-width="4" stroke-linecap="round" fill="none"/>
              <path d="M 165 110 Q 153 112 145 108" stroke="#B84407" stroke-width="4" stroke-linecap="round" fill="none"/>

              <!-- HAREKETLİ KAŞLAR (Mimiklere Göre İnip Kalkan Kaşlar) -->
              <g id="catEyebrows" class="cat-eyebrows">
                <path id="catBrowLeft" class="cat-brow-left" d="M 74 74 Q 86 68 96 74" stroke="#9A3404" stroke-width="4" stroke-linecap="round" fill="none"/>
                <path id="catBrowRight" class="cat-brow-right" d="M 124 74 Q 134 68 146 74" stroke="#9A3404" stroke-width="4" stroke-linecap="round" fill="none"/>
              </g>

              <!-- 7. GÖZLER (İri, Işıltılı, 30 FPS Kare Kare Kırpan & Yön Değiştiren) -->
              <!-- Sol Göz -->
              <g id="catEyeLeftGroup" class="cat-eye-group">
                <ellipse cx="86" cy="98" rx="17.5" ry="19.5" fill="#FFFFFF"/>
                <ellipse cx="86" cy="98" rx="16.5" ry="18.5" fill="url(#catEyeGrad)"/>
                <!-- Göz Bebeği -->
                <ellipse id="pupilLeft" class="cat-pupil" cx="87" cy="98" rx="8.5" ry="14" fill="#211206"/>
                <!-- İki Nokta Beyaz Işıltı -->
                <circle id="sparkleLeftMajor" class="eye-sparkle-major" cx="82" cy="92" r="5.2" fill="#FFFFFF"/>
                <circle id="sparkleLeftMinor" class="eye-sparkle-minor" cx="91" cy="105" r="2.6" fill="#FFFFFF"/>
                <!-- Yarım Göz Kapağı (Kare Kare Kırpma için) -->
                <ellipse id="mascotLeftLidHalf" cx="86" cy="90" rx="18.5" ry="12" fill="#F58220" style="display:none;"/>
                <!-- Tam Göz Kapağı -->
                <ellipse id="mascotLeftLid" cx="86" cy="98" rx="18.5" ry="20" fill="#F58220" style="display:none;"/>
                <!-- Mutlu Göz Kısma Çizgisi -->
                <path id="happyEyeLeft" d="M 72 98 Q 86 84 100 98" stroke="#792803" stroke-width="4" stroke-linecap="round" fill="none" style="display:none;"/>
              </g>

              <!-- Sağ Göz -->
              <g id="catEyeRightGroup" class="cat-eye-group">
                <ellipse cx="134" cy="98" rx="17.5" ry="19.5" fill="#FFFFFF"/>
                <ellipse cx="134" cy="98" rx="16.5" ry="18.5" fill="url(#catEyeGrad)"/>
                <!-- Göz Bebeği -->
                <ellipse id="pupilRight" class="cat-pupil" cx="133" cy="98" rx="8.5" ry="14" fill="#211206"/>
                <!-- İki Nokta Beyaz Işıltı -->
                <circle id="sparkleRightMajor" class="eye-sparkle-major" cx="129" cy="92" r="5.2" fill="#FFFFFF"/>
                <circle id="sparkleRightMinor" class="eye-sparkle-minor" cx="138" cy="105" r="2.6" fill="#FFFFFF"/>
                <!-- Yarım Göz Kapağı (Kare Kare Kırpma için) -->
                <ellipse id="mascotRightLidHalf" cx="134" cy="90" rx="18.5" ry="12" fill="#F58220" style="display:none;"/>
                <!-- Tam Göz Kapağı -->
                <ellipse id="mascotRightLid" cx="134" cy="98" rx="18.5" ry="20" fill="#F58220" style="display:none;"/>
                <!-- Mutlu Göz Kısma Çizgisi -->
                <path id="happyEyeRight" d="M 120 98 Q 134 84 148 98" stroke="#792803" stroke-width="4" stroke-linecap="round" fill="none" style="display:none;"/>
              </g>

              <!-- Sevimli Pembe Yanak Parıltıları -->
              <circle id="cheekLeft" class="cat-cheek" cx="66" cy="118" r="10" fill="#FF5252" opacity="0.35"/>
              <circle id="cheekRight" class="cat-cheek" cx="154" cy="118" r="10" fill="#FF5252" opacity="0.35"/>

              <!-- Burun (Kedi Üçgen Burnu) -->
              <polygon id="catNose" class="cat-nose" points="105,112 115,112 110,119" fill="#8D3208"/>

              <!-- Bıyıklar -->
              <g id="whiskersLeft" class="cat-whiskers-left">
                <path d="M 56 114 L 93 117" stroke="#792803" stroke-width="2.2" stroke-linecap="round"/>
                <path d="M 54 122 L 94 121" stroke="#792803" stroke-width="2.2" stroke-linecap="round"/>
                <path d="M 58 130 L 94 125" stroke="#792803" stroke-width="2.2" stroke-linecap="round"/>
              </g>
              <g id="whiskersRight" class="cat-whiskers-right">
                <path d="M 164 114 L 127 117" stroke="#792803" stroke-width="2.2" stroke-linecap="round"/>
                <path d="M 166 122 L 126 121" stroke="#792803" stroke-width="2.2" stroke-linecap="round"/>
                <path d="M 162 130 L 126 125" stroke="#792803" stroke-width="2.2" stroke-linecap="round"/>
              </g>

              <!-- 8. AĞIZLAR (Kare Kare Mimik & Lip-Sync Seti) -->
              <!-- Durum A: Kapalı Tatlı Kedi Gülümsemesi (Idle) -->
              <path id="mouthClosed" d="M 97 122 Q 104 129 110 122 Q 116 129 123 122" stroke="#792803" stroke-width="3.2" fill="none" stroke-linecap="round"/>

              <!-- Durum B: Meraklı Dinleme Ağzı (Listening) -->
              <g id="mouthListen" style="display:none;">
                <path d="M 98 122 Q 104 127 110 122 Q 116 127 122 122" stroke="#792803" stroke-width="2.8" fill="none" stroke-linecap="round"/>
                <ellipse cx="110" cy="127" rx="5.5" ry="6" fill="#D32F2F" stroke="#792803" stroke-width="2"/>
                <ellipse cx="110" cy="129" rx="3.5" ry="3" fill="#FF8A80"/>
              </g>

              <!-- Durum C: Meraklı Düşünce Ağzı (Thinking) -->
              <path id="mouthThink" d="M 102 126 Q 108 122 114 127 Q 118 129 121 124" stroke="#792803" stroke-width="3.2" fill="none" stroke-linecap="round" style="display:none;"/>

              <!-- Durum D: Konuşan Yarı Açık Ağız (Speaking Frame 1) -->
              <g id="mouthOpen" style="display:none;">
                <path d="M 99 122 Q 110 137 121 122 Z" fill="#C62828" stroke="#792803" stroke-width="2.2"/>
                <path d="M 104 129 Q 110 134 116 129 Z" fill="#FF8A80"/>
              </g>

              <!-- Durum E: Konuşan Tam Açık Neşeli Ağız (Speaking Frame 2) -->
              <g id="mouthOpenWide" style="display:none;">
                <path d="M 96 121 Q 110 145 124 121 Z" fill="#B71C1C" stroke="#792803" stroke-width="2.5"/>
                <ellipse cx="110" cy="133" rx="7" ry="5" fill="#FF80AB"/>
                <polygon points="101,122 104,122 102.5,126" fill="#FFFFFF"/>
                <polygon points="116,122 119,122 117.5,126" fill="#FFFFFF"/>
              </g>

              <!-- Durum F: Şaşkın / 'O' Harfi Ağzı (Speaking Frame 3) -->
              <g id="mouthTalkO" style="display:none;">
                <ellipse cx="110" cy="126" rx="6" ry="8" fill="#B71C1C" stroke="#792803" stroke-width="2.2"/>
                <ellipse cx="110" cy="128" rx="3.5" ry="4" fill="#FF80AB"/>
              </g>

            </g>
          </g>
        </svg>

        <!-- Durum Konuşma Baloncuğu -->
        <div class="mascot-status-bubble" id="mascotBubble">
          <span id="mascotStatusText">Miyav! Merhaba minik kaşif! Bugün neyi keşfetmek istersin? 🐾</span>
        </div>
      </div>
    `;

    // Maskota dokununca sevimli gıdıklanma (wiggle), mutlu gözler ve neşeli ses
    const mascot = document.getElementById('mascotMain');
    if (mascot) {
      const handleTickle = () => {
        if (window.soundEngine && window.soundEngine.playReward) {
          window.soundEngine.playReward();
        }
        this.wiggle();
        this.triggerHappyEyes(950);

        const studentName = (window.appInstance && window.appInstance.activeStudent && window.appInstance.activeStudent.name)
          ? window.appInstance.activeStudent.name
          : '';

        const ticklePhrases = studentName
          ? [
              `Hihi, gıdıklandım ${studentName}! Hadi bana merak ettiğin bir soru sor! 🐱✨`,
              `Miyavv, çok gıdıklandım ${studentName}! Bıyıklarım titredi! 🐾💛`,
              `Hihihi! Patilerim gıdıklanıyor ${studentName}! Bugün ne keşfedelim? 🌟`
            ]
          : [
              "Hihi, gıdıklandım tatlı kâşif! Hadi bana merak ettiğin bir soru sor! 🐱✨",
              "Miyavv, çok gıdıklandım! Bıyıklarım titredi! 🐾💛",
              "Hihihi! Patilerim gıdıklanıyor! Bugün ne keşfedelim? 🌟"
            ];

        const randomPhrase = ticklePhrases[Math.floor(Math.random() * ticklePhrases.length)];
        this.sayTemporarily(randomPhrase, 4200);
        this.resetIdleTimer();
      };

      mascot.addEventListener('click', handleTickle);
      mascot.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        handleTickle();
      }, { passive: true });
    }
  }

  // ── 30 FPS KARE KARE ÇİZGİ FİLM ANİMASYON MOTORU (Frame-by-Frame Loop) ──
  start30FpsEngine() {
    this.stop30FpsEngine();
    this.frameCount = 0;
    this.lastFrameTime = performance.now();

    const loop = (currentTime) => {
      this.animRafId = requestAnimationFrame(loop);
      const elapsed = currentTime - this.lastFrameTime;
      if (elapsed >= this.frameDuration) {
        this.lastFrameTime = currentTime - (elapsed % this.frameDuration);
        this.tick30Fps();
      }
    };
    this.animRafId = requestAnimationFrame(loop);
  }

  stop30FpsEngine() {
    if (this.animRafId) {
      cancelAnimationFrame(this.animRafId);
      this.animRafId = null;
    }
  }

  tick30Fps() {
    this.frameCount++;

    // 1. KARE KARE 4-AŞAMALI GÖZ KIRPMA (Doğal Çizgi Film Kırpması)
    this.updateBlinkFrame();

    // 2. KARE KARE KUYRUK SALLANMASI
    this.updateTailFrame();

    // 3. KARE KARE NEFES & GÖVDE CANLILIĞI (Squash & Stretch)
    this.updateBodyBreathingFrame();

    // 4. KARE KARE KULAK SEĞİRMESİ
    this.updateEarTwitchFrame();

    // 5. KARE KARE KONUŞMA AĞIZ SENKRONU & JESTLER (Speaking State)
    if (this.state === 'speaking') {
      this.updateSpeakingMouthFrame();
    }

    // 6. KARE KARE KUTLAMA VE ZAFER ZIPLAMASI (Celebrating State)
    if (this.state === 'celebrating') {
      this.updateCelebrationHopFrame();
    }

    // 7. KARE KARE BAKIŞ VE GÖZ GEZDİRME (Idle State)
    if (this.state === 'idle') {
      this.updateIdleGazeFrame();
    }
  }

  // 1. Dört Aşamalı Kare Kare Göz Kırpma (Açık -> Yarım -> Tam Kapalı -> Yarım -> Açık)
  updateBlinkFrame() {
    if (this.state === 'sleep') return;

    const leftHalf = document.getElementById('mascotLeftLidHalf');
    const rightHalf = document.getElementById('mascotRightLidHalf');
    const leftFull = document.getElementById('mascotLeftLid');
    const rightFull = document.getElementById('mascotRightLid');
    const happyLeft = document.getElementById('happyEyeLeft');
    const happyRight = document.getElementById('happyEyeRight');

    // Mutlu göz çizgileri ekrandaysa kırpma yapma
    if (happyLeft && happyLeft.style.display !== 'none') return;

    if (this.blinkPhase === 0) {
      if (this.frameCount >= this.nextBlinkFrame) {
        this.blinkPhase = 1;
        this.blinkStartFrame = this.frameCount;
      }
    } else {
      const step = this.frameCount - this.blinkStartFrame;
      if (step === 1) {
        // Kare 1: Yarım kapalı göz kapağı
        if (leftHalf) leftHalf.style.display = 'block';
        if (rightHalf) rightHalf.style.display = 'block';
        if (leftFull) leftFull.style.display = 'none';
        if (rightFull) rightFull.style.display = 'none';
      } else if (step === 2 || step === 3) {
        // Kare 2-3: Tam kapalı göz kapağı
        if (leftHalf) leftHalf.style.display = 'none';
        if (rightHalf) rightHalf.style.display = 'none';
        if (leftFull) leftFull.style.display = 'block';
        if (rightFull) rightFull.style.display = 'block';
      } else if (step === 4) {
        // Kare 4: Yarım açılıyor
        if (leftHalf) leftHalf.style.display = 'block';
        if (rightHalf) rightHalf.style.display = 'block';
        if (leftFull) leftFull.style.display = 'none';
        if (rightFull) rightFull.style.display = 'none';
      } else if (step >= 5) {
        // Tamamen açık gözler
        if (leftHalf) leftHalf.style.display = 'none';
        if (rightHalf) rightHalf.style.display = 'none';
        if (leftFull) leftFull.style.display = 'none';
        if (rightFull) rightFull.style.display = 'none';
        this.blinkPhase = 0;
        this.nextBlinkFrame = this.frameCount + 75 + Math.floor(Math.random() * 85);
      }
    }
  }

  // 2. 30 FPS Akıcı Kuyruk Sallanması (Duruma Göre Hız ve Salınım Değişir)
  updateTailFrame() {
    const tail = document.getElementById('mascotTailGroup');
    if (!tail) return;

    let baseFreq = 0.08;
    let baseAmp = 9;

    if (this.state === 'speaking') {
      baseFreq = 0.16;
      baseAmp = 13;
    } else if (this.state === 'thinking') {
      baseFreq = 0.05;
      baseAmp = 6;
    } else if (this.state === 'listening') {
      baseFreq = 0.12;
      baseAmp = 14;
    } else if (this.state === 'celebrating') {
      baseFreq = 0.22;
      baseAmp = 20;
    }

    const angle = Math.sin(this.frameCount * baseFreq) * baseAmp;
    tail.style.transformOrigin = '140px 210px';
    tail.style.transform = `rotate(${angle.toFixed(1)}deg)`;
  }

  // 3. 30 FPS Çizgi Film Hacim Koruma & Nefes (Squash & Stretch)
  updateBodyBreathingFrame() {
    const body = document.getElementById('mascotBody');
    const head = document.getElementById('mascotHeadGroup');
    if (!body || !head) return;

    if (this.state === 'celebrating') return; // Kutlamada zıplama motoru kontrol eder

    const breathFreq = 0.055;
    const sinVal = Math.sin(this.frameCount * breathFreq);
    
    // Çizgi film squash & stretch kuralı
    const scaleY = 1 + sinVal * 0.02;
    const scaleX = 1 - sinVal * 0.015;
    const transY = -sinVal * 2.5;

    body.style.transformOrigin = '110px 220px';
    body.style.transform = `matrix(${scaleX.toFixed(3)}, 0, 0, ${scaleY.toFixed(3)}, 0, ${transY.toFixed(1)})`;

    // Kafa hafif gecikmeli (overlapping action) gövdeyi takip eder
    const headSin = Math.sin((this.frameCount - 2) * breathFreq);
    head.style.transformOrigin = '110px 145px';
    head.style.transform = `translateY(${(-headSin * 1.8).toFixed(1)}px)`;
  }

  // 4. Doğal Kulak Seğirmesi (Quick Alert Ear Twitch)
  updateEarTwitchFrame() {
    const earLeft = document.getElementById('catEarLeft');
    const earRight = document.getElementById('catEarRight');
    if (!earLeft || !earRight) return;

    if (this.earTwitchPhase === 0) {
      if (this.frameCount >= this.nextEarTwitchFrame) {
        this.earTwitchPhase = 1;
        this.earTwitchStartFrame = this.frameCount;
        this.earTwitchTarget = Math.random() > 0.5 ? 'left' : 'right';
      }
    } else {
      const step = this.frameCount - this.earTwitchStartFrame;
      const targetEar = this.earTwitchTarget === 'left' ? earLeft : earRight;
      const origin = this.earTwitchTarget === 'left' ? '62px 75px' : '158px 75px';
      targetEar.style.transformOrigin = origin;

      if (step === 1) {
        targetEar.style.transform = 'rotate(-8deg)';
      } else if (step === 2) {
        targetEar.style.transform = 'rotate(10deg)';
      } else if (step === 3) {
        targetEar.style.transform = 'rotate(-4deg)';
      } else {
        targetEar.style.transform = 'rotate(0deg)';
        this.earTwitchPhase = 0;
        this.nextEarTwitchFrame = this.frameCount + 90 + Math.floor(Math.random() * 110);
      }
    }
  }

  // 5. 30 FPS Konuşma Ağız Senkronu & Çizgi Film Jestleri
  updateSpeakingMouthFrame() {
    const mouthClosed = document.getElementById('mouthClosed');
    const mouthOpen = document.getElementById('mouthOpen');
    const mouthOpenWide = document.getElementById('mouthOpenWide');
    const mouthTalkO = document.getElementById('mouthTalkO');

    // Her 4 karede bir (~7.5 fps) ağız şeklini çizgi film fonemlerine göre değiştir
    if (this.frameCount % 4 === 0) {
      this.speechMouthFrame = (this.speechMouthFrame + 1) % 6;

      const hideAll = () => {
        if (mouthClosed) mouthClosed.style.display = 'none';
        if (mouthOpen) mouthOpen.style.display = 'none';
        if (mouthOpenWide) mouthOpenWide.style.display = 'none';
        if (mouthTalkO) mouthTalkO.style.display = 'none';
      };

      hideAll();

      switch (this.speechMouthFrame) {
        case 0:
          if (mouthClosed) mouthClosed.style.display = 'block';
          break;
        case 1:
        case 4:
          if (mouthOpen) mouthOpen.style.display = 'block';
          break;
        case 2:
          if (mouthTalkO) mouthTalkO.style.display = 'block';
          break;
        case 3:
        case 5:
          if (mouthOpenWide) mouthOpenWide.style.display = 'block';
          break;
      }
    }

    // Kolların ve kafanın konuşma ritmi
    const armLeft = document.getElementById('catArmLeftSpeaking');
    const armRight = document.getElementById('catArmRightSpeaking');
    const head = document.getElementById('mascotHeadGroup');

    if (armLeft) {
      const leftAngle = Math.sin(this.frameCount * 0.22) * 12;
      armLeft.style.transformOrigin = '68px 150px';
      armLeft.style.transform = `rotate(${leftAngle.toFixed(1)}deg)`;
    }
    if (armRight) {
      const rightAngle = -Math.cos(this.frameCount * 0.22) * 14;
      armRight.style.transformOrigin = '152px 150px';
      armRight.style.transform = `rotate(${rightAngle.toFixed(1)}deg)`;
    }
    if (head) {
      const headRot = Math.sin(this.frameCount * 0.16) * 3;
      const headY = Math.abs(Math.sin(this.frameCount * 0.22)) * -4;
      head.style.transformOrigin = '110px 145px';
      head.style.transform = `translateY(${headY.toFixed(1)}px) rotate(${headRot.toFixed(1)}deg)`;
    }
  }

  // 6. 30 FPS Kutlama Zıplaması & Zafer Patileri (Physics Hop)
  updateCelebrationHopFrame() {
    const whole = document.getElementById('catWholeBody');
    const shadow = document.getElementById('mascotShadow');
    const armLeft = document.getElementById('catArmLeftCelebration');
    const armRight = document.getElementById('catArmRightCelebration');
    if (!whole) return;

    const hopSin = Math.sin(this.frameCount * 0.24);
    const hopY = -Math.abs(hopSin) * 32; // 32px yukarı sıçrama

    let scaleX = 1;
    let scaleY = 1;

    if (Math.abs(hopSin) < 0.2) {
      // Yere iniş anı: squash
      scaleX = 1.12;
      scaleY = 0.88;
    } else {
      // Havadayken: stretch
      scaleX = 0.94;
      scaleY = 1.08;
    }

    whole.style.transformOrigin = '110px 260px';
    whole.style.transform = `translateY(${hopY.toFixed(1)}px) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`;

    // Zemin gölgesi zıplayınca açılır
    if (shadow) {
      const shadowScale = 1 - (Math.abs(hopY) / 45);
      shadow.style.transformOrigin = '110px 265px';
      shadow.style.transform = `scale(${Math.max(0.45, shadowScale).toFixed(2)})`;
      shadow.style.opacity = `${(0.15 + shadowScale * 0.2).toFixed(2)}`;
    }

    // Havada sallanan sevinç patileri
    if (armLeft) {
      const armWave = Math.sin(this.frameCount * 0.3) * 15;
      armLeft.style.transformOrigin = '68px 145px';
      armLeft.style.transform = `rotate(${armWave.toFixed(1)}deg)`;
    }
    if (armRight) {
      const armWave = -Math.cos(this.frameCount * 0.3) * 15;
      armRight.style.transformOrigin = '152px 145px';
      armRight.style.transform = `rotate(${armWave.toFixed(1)}deg)`;
    }
  }

  // 7. Doğal Göz Gezdirme (Idle Gaze Shift)
  updateIdleGazeFrame() {
    const pupilLeft = document.getElementById('pupilLeft');
    const pupilRight = document.getElementById('pupilRight');
    if (!pupilLeft || !pupilRight) return;

    if (this.frameCount % 90 === 0) {
      const targets = [
        { lx: 87, ly: 98, rx: 133, ry: 98 }, // Merkez (Çocuğa bakış)
        { lx: 90, ly: 97, rx: 136, ry: 97 }, // Sağa (Sohbete bakış)
        { lx: 85, ly: 96, rx: 131, ry: 96 }, // Sola bakış
        { lx: 87, ly: 94, rx: 133, ry: 94 }  // Merakla yukarı bakış
      ];
      this.targetGaze = targets[Math.floor(Math.random() * targets.length)];
    }

    if (this.targetGaze) {
      pupilLeft.setAttribute('cx', String(this.targetGaze.lx));
      pupilLeft.setAttribute('cy', String(this.targetGaze.ly));
      pupilRight.setAttribute('cx', String(this.targetGaze.rx));
      pupilRight.setAttribute('cy', String(this.targetGaze.ry));
    }
  }

  // Başarı, Doğru Cevap veya Rozet Kutlama Hareketi
  celebrate(durationMs = 2800) {
    const prevState = (this.state === 'celebrating' || this.state === 'sleep') ? 'idle' : this.state;
    this.setState('celebrating', 'Harika bir keşif! Çok güzel bir soru sordun! 🌟🎉');
    this.triggerHappyEyes(durationMs);

    if (window.soundEngine && window.soundEngine.playReward) {
      window.soundEngine.playReward();
    }

    setTimeout(() => {
      if (this.state === 'celebrating') {
        const whole = document.getElementById('catWholeBody');
        if (whole) whole.style.transform = 'none';
        const shadow = document.getElementById('mascotShadow');
        if (shadow) {
          shadow.style.transform = 'none';
          shadow.style.opacity = '0.2';
        }
        this.setState(prevState);
      }
    }, durationMs);
  }

  // ── DURUM DEĞİŞTİRME & JEST/MİMİK YÖNETİMİ ─────────────────
  setState(newState, customText = '', lockedVisualUrl = null) {
    this.state = newState;
    const wrapper = document.getElementById('mascotMain');
    const bulb = document.getElementById('mascotBulb');
    const listeningBadge = document.getElementById('mascotListeningBadge');
    const listenRings = document.getElementById('listenRings');
    const statusText = document.getElementById('mascotStatusText');

    const mouthClosed = document.getElementById('mouthClosed');
    const mouthListen = document.getElementById('mouthListen');
    const mouthThink = document.getElementById('mouthThink');
    const mouthOpen = document.getElementById('mouthOpen');
    const mouthOpenWide = document.getElementById('mouthOpenWide');
    const mouthTalkO = document.getElementById('mouthTalkO');

    const armLeftNormal = document.getElementById('catArmLeftNormal');
    const armLeftSpeaking = document.getElementById('catArmLeftSpeaking');
    const armLeftCelebration = document.getElementById('catArmLeftCelebration');

    const armRightNormal = document.getElementById('catArmRightNormal');
    const armRightThinking = document.getElementById('catArmRightThinking');
    const armRightListening = document.getElementById('catArmRightListening');
    const armRightSpeaking = document.getElementById('catArmRightSpeaking');
    const armRightCelebration = document.getElementById('catArmRightCelebration');

    const pupilLeft = document.getElementById('pupilLeft');
    const pupilRight = document.getElementById('pupilRight');
    const browLeft = document.getElementById('catBrowLeft');
    const browRight = document.getElementById('catBrowRight');

    if (!wrapper) return;

    // CSS Sınıflarını Güncelle
    wrapper.classList.remove('state-idle', 'state-listening', 'state-thinking', 'state-speaking', 'state-celebrating');
    wrapper.classList.add(`state-${newState}`);

    // Rozetleri Sıfırla
    if (bulb) bulb.style.display = 'none';
    if (listeningBadge) listeningBadge.style.display = 'none';
    if (listenRings) listenRings.style.display = 'none';

    // Kolları Varsayılana Getir
    if (armLeftNormal) armLeftNormal.style.display = 'block';
    if (armLeftSpeaking) armLeftSpeaking.style.display = 'none';
    if (armLeftCelebration) armLeftCelebration.style.display = 'none';

    if (armRightNormal) armRightNormal.style.display = 'block';
    if (armRightThinking) armRightThinking.style.display = 'none';
    if (armRightListening) armRightListening.style.display = 'none';
    if (armRightSpeaking) armRightSpeaking.style.display = 'none';
    if (armRightCelebration) armRightCelebration.style.display = 'none';

    // Göz Bebeklerini Merkeze ve Normal Boyuta Al
    if (pupilLeft && pupilRight) {
      pupilLeft.setAttribute('cx', '87');
      pupilLeft.setAttribute('cy', '98');
      pupilLeft.setAttribute('rx', '8.5');
      pupilLeft.setAttribute('ry', '14');
      pupilRight.setAttribute('cx', '133');
      pupilRight.setAttribute('cy', '98');
      pupilRight.setAttribute('rx', '8.5');
      pupilRight.setAttribute('ry', '14');
    }

    // Kaşları Normal Konuma Al
    if (browLeft && browRight) {
      browLeft.setAttribute('d', 'M 74 74 Q 86 68 96 74');
      browRight.setAttribute('d', 'M 124 74 Q 134 68 146 74');
    }

    // Ağızları Varsayılana Getir
    if (mouthOpen) mouthOpen.style.display = 'none';
    if (mouthOpenWide) mouthOpenWide.style.display = 'none';
    if (mouthTalkO) mouthTalkO.style.display = 'none';
    if (mouthThink) mouthThink.style.display = 'none';
    if (mouthListen) mouthListen.style.display = 'none';
    if (mouthClosed) mouthClosed.style.display = 'block';

    // ── 1. DÜŞÜNME MODU (Thinking) ───────────────────────────
    if (newState === 'thinking') {
      if (bulb) bulb.style.display = 'flex';
      this.startThoughtBubbles();

      if (armRightNormal) armRightNormal.style.display = 'none';
      if (armRightThinking) armRightThinking.style.display = 'block';

      if (pupilLeft && pupilRight) {
        pupilLeft.setAttribute('cx', '90');
        pupilLeft.setAttribute('cy', '91');
        pupilRight.setAttribute('cx', '136');
        pupilRight.setAttribute('cy', '91');
      }

      if (browLeft && browRight) {
        browLeft.setAttribute('d', 'M 74 76 Q 86 73 96 77');
        browRight.setAttribute('d', 'M 124 70 Q 134 62 146 70');
      }

      if (mouthClosed) mouthClosed.style.display = 'none';
      if (mouthThink) mouthThink.style.display = 'block';

      if (statusText) statusText.innerText = customText || this.thinkingPhrases[0];
      this.cycleThinkingPhrases();
    } else {
      this.stopThoughtBubbles();
    }

    // ── 2. DİNLEME MODU (Listening) ──────────────────────────
    if (newState === 'listening') {
      if (listeningBadge) listeningBadge.style.display = 'flex';
      if (listenRings) listenRings.style.display = 'block';

      if (armRightNormal) armRightNormal.style.display = 'none';
      if (armRightListening) armRightListening.style.display = 'block';

      if (pupilLeft && pupilRight) {
        pupilLeft.setAttribute('cx', '86');
        pupilLeft.setAttribute('cy', '98');
        pupilLeft.setAttribute('rx', '10.5');
        pupilLeft.setAttribute('ry', '15.5');
        pupilRight.setAttribute('cx', '134');
        pupilRight.setAttribute('cy', '98');
        pupilRight.setAttribute('rx', '10.5');
        pupilRight.setAttribute('ry', '15.5');
      }

      if (browLeft && browRight) {
        browLeft.setAttribute('d', 'M 73 69 Q 86 61 97 69');
        browRight.setAttribute('d', 'M 123 69 Q 134 61 147 69');
      }

      if (mouthClosed) mouthClosed.style.display = 'none';
      if (mouthListen) mouthListen.style.display = 'block';

      if (statusText) {
        statusText.innerText = customText || "Seni pür dikkat dinliyorum minik kaşif... 👂 Hadi sorunu sor!";
      }
      if (window.soundEngine && window.soundEngine.playListenStart) {
        window.soundEngine.playListenStart();
      }
    }

    // ── 3. KONUŞMA MODU (Speaking) ───────────────────────────
    if (newState === 'speaking') {
      if (armLeftNormal) armLeftNormal.style.display = 'none';
      if (armLeftSpeaking) armLeftSpeaking.style.display = 'block';
      if (armRightNormal) armRightNormal.style.display = 'none';
      if (armRightSpeaking) armRightSpeaking.style.display = 'block';

      if (browLeft && browRight) {
        browLeft.setAttribute('d', 'M 74 71 Q 86 64 96 71');
        browRight.setAttribute('d', 'M 124 71 Q 134 64 146 71');
      }

      if (customText && statusText) statusText.innerText = customText;

      const visualUrl = this.isWelcomeLocked
        ? 'assets/arasaac/welcome.png'
        : (lockedVisualUrl || (window.visualEngine && customText
            ? window.visualEngine.findBestMatch(customText, this.activeTopicHint || null)
            : null));
      if (visualUrl) {
        this.showVisual(visualUrl);
      }
    }

    // ── 4. KUTLAMA / ZAFER MODU (Celebrating) ────────────────
    if (newState === 'celebrating') {
      if (armLeftNormal) armLeftNormal.style.display = 'none';
      if (armLeftCelebration) armLeftCelebration.style.display = 'block';
      if (armRightNormal) armRightNormal.style.display = 'none';
      if (armRightCelebration) armRightCelebration.style.display = 'block';

      if (browLeft && browRight) {
        browLeft.setAttribute('d', 'M 74 68 Q 86 60 96 68');
        browRight.setAttribute('d', 'M 124 68 Q 134 60 146 68');
      }

      const happyLeft = document.getElementById('happyEyeLeft');
      const happyRight = document.getElementById('happyEyeRight');
      if (happyLeft) happyLeft.style.display = 'block';
      if (happyRight) happyRight.style.display = 'block';

      if (mouthClosed) mouthClosed.style.display = 'none';
      if (mouthOpenWide) mouthOpenWide.style.display = 'block';
    }

    // ── 5. BOŞTA VEYA UYKU/DİNLENME MODU (Idle / Sleep) ──────
    const happyLeft = document.getElementById('happyEyeLeft');
    const happyRight = document.getElementById('happyEyeRight');
    const lidLeft = document.getElementById('mascotLeftLid');
    const lidRight = document.getElementById('mascotRightLid');

    if (newState === 'sleep') {
      wrapper.classList.add('state-idle');
      if (lidLeft) lidLeft.style.display = 'block';
      if (lidRight) lidRight.style.display = 'block';
      if (happyLeft) happyLeft.style.display = 'block';
      if (happyRight) happyRight.style.display = 'block';
      if (statusText) {
        statusText.innerText = customText || 'Tatlı rüyalar küçük kâşif! Tekrar keşfetmek istediğinde buradayım... 🌙🐾💤';
      }
      this.hideVisual(4500);
    } else if (newState !== 'celebrating') {
      if (lidLeft) lidLeft.style.display = 'none';
      if (lidRight) lidRight.style.display = 'none';
      if (happyLeft) happyLeft.style.display = 'none';
      if (happyRight) happyRight.style.display = 'none';

      if (newState === 'idle') {
        if (customText && statusText) statusText.innerText = customText;
        this.hideVisual(2000);
      } else if (newState === 'listening' || newState === 'thinking') {
        this.hideVisual(0, true);
      }
    }
  }

  // Mutlu Göz Kısma Efekti (^_^)
  triggerHappyEyes(durationMs = 800) {
    const happyLeft = document.getElementById('happyEyeLeft');
    const happyRight = document.getElementById('happyEyeRight');
    const lidLeft = document.getElementById('mascotLeftLid');
    const lidRight = document.getElementById('mascotRightLid');
    const leftHalf = document.getElementById('mascotLeftLidHalf');
    const rightHalf = document.getElementById('mascotRightLidHalf');

    if (leftHalf) leftHalf.style.display = 'none';
    if (rightHalf) rightHalf.style.display = 'none';
    if (lidLeft) lidLeft.style.display = 'none';
    if (lidRight) lidRight.style.display = 'none';
    if (happyLeft) happyLeft.style.display = 'block';
    if (happyRight) happyRight.style.display = 'block';

    setTimeout(() => {
      if (happyLeft) happyLeft.style.display = 'none';
      if (happyRight) happyRight.style.display = 'none';
    }, durationMs);
  }

  // Düşünme sırasında periyodik sevimli fısıltılar
  cycleThinkingPhrases() {
    this.phraseIndex = 0;
    if (this.phraseTimer) clearInterval(this.phraseTimer);

    this.phraseTimer = setInterval(() => {
      if (this.state !== 'thinking') {
        clearInterval(this.phraseTimer);
        return;
      }
      this.phraseIndex = (this.phraseIndex + 1) % this.thinkingPhrases.length;
      const statusText = document.getElementById('mascotStatusText');
      if (statusText) {
        statusText.innerText = this.thinkingPhrases[this.phraseIndex];
      }
    }, 2800);
  }

  // Sevimli Düşünce Baloncukları (Balon Patlatma Oyunu)
  startThoughtBubbles() {
    this.stopThoughtBubbles();
    if (!this.bubbleContainer) return;

    const spawnBubble = () => {
      if (this.state !== 'thinking') return;
      const bubble = document.createElement('div');
      bubble.className = 'floating-thought-bubble';

      const icons = ['💡', '⭐', '🐾', '✨', '🎈', '🔍', '🪐'];
      bubble.innerText = icons[Math.floor(Math.random() * icons.length)];

      const leftPercent = 10 + Math.random() * 80;
      const size = 38 + Math.random() * 26;
      const duration = 2.4 + Math.random() * 1.2;

      bubble.style.left = `${leftPercent}%`;
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.animationDuration = `${duration}s`;

      const popBubble = (e) => {
        e.stopPropagation();
        if (window.soundEngine && window.soundEngine.playPop) window.soundEngine.playPop();
        this.poppedBubblesCount++;

        bubble.classList.add('popping');
        bubble.innerHTML = '✨';
        setTimeout(() => bubble.remove(), 250);

        const counter = document.getElementById('poppedCounter');
        if (counter) counter.innerText = `${this.poppedBubblesCount} 🎈`;
      };

      bubble.addEventListener('click', popBubble);
      bubble.addEventListener('touchstart', popBubble, { passive: true });

      if (this.bubbleContainer) {
        this.bubbleContainer.appendChild(bubble);
      }

      setTimeout(() => {
        if (bubble.parentElement) bubble.remove();
      }, duration * 1000);
    };

    spawnBubble();
    setTimeout(spawnBubble, 600);
    this.bubbleInterval = setInterval(spawnBubble, 1900);
  }

  stopThoughtBubbles() {
    if (this.bubbleInterval) {
      clearInterval(this.bubbleInterval);
      this.bubbleInterval = null;
    }
    if (this.phraseTimer) {
      clearInterval(this.phraseTimer);
      this.phraseTimer = null;
    }
    const bubbles = document.querySelectorAll('.floating-thought-bubble');
    bubbles.forEach(b => b.remove());
  }

  bounce() {
    const whole = document.getElementById('catWholeBody');
    if (whole) {
      whole.classList.remove('mascot-bounce');
      void whole.offsetWidth;
      whole.classList.add('mascot-bounce');
      setTimeout(() => whole.classList.remove('mascot-bounce'), 600);
    }
  }

  // Gıdıklanınca İki Yana Sevimli Kıvrılma (Wiggle)
  wiggle() {
    const whole = document.getElementById('catWholeBody');
    if (whole) {
      whole.classList.remove('mascot-bounce', 'mascot-wiggle', 'mascot-idle-nudge');
      void whole.offsetWidth;
      whole.classList.add('mascot-wiggle');
      setTimeout(() => whole.classList.remove('mascot-wiggle'), 750);
    }
  }

  // 15 Saniye İşlemsiz Kalındığında Canlılık Takibi
  startIdleInactivityTracker() {
    const reset = () => this.resetIdleTimer();
    ['pointerdown', 'keydown', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, reset, { passive: true });
    });
    this.resetIdleTimer();
  }

  resetIdleTimer() {
    if (this.idleInactivityTimer) {
      clearTimeout(this.idleInactivityTimer);
    }
    this.idleInactivityTimer = setTimeout(() => {
      this.triggerIdleMicroInteraction();
    }, 15000);
  }

  triggerIdleMicroInteraction() {
    if (this.state === 'idle') {
      const whole = document.getElementById('catWholeBody');
      if (whole) {
        whole.classList.remove('mascot-idle-nudge', 'mascot-bounce', 'mascot-wiggle');
        void whole.offsetWidth;
        whole.classList.add('mascot-idle-nudge');
        setTimeout(() => whole.classList.remove('mascot-idle-nudge'), 1250);
      }

      // Meraklı Göz Kırpma
      this.blinkPhase = 1;
      this.blinkStartFrame = this.frameCount;

      // Canlı Kuyruk Sallanması
      const tail = document.getElementById('mascotTailGroup');
      if (tail) {
        tail.style.transition = 'transform 0.4s ease';
        tail.style.transform = 'rotate(-10deg)';
        setTimeout(() => {
          if (tail) tail.style.transform = 'rotate(0deg)';
        }, 650);
      }
    }

    this.resetIdleTimer();
  }

  sayTemporarily(text, durationMs = 4000) {
    const statusText = document.getElementById('mascotStatusText');
    if (statusText) {
      const oldText = statusText.innerText;
      statusText.innerText = text;
      setTimeout(() => {
        if (this.state === 'idle') statusText.innerText = oldText;
      }, durationMs);
    }

    const activeSpeechEl = document.getElementById('activeSpeechText');
    if (activeSpeechEl && this.state === 'idle') {
      const prevSpeech = activeSpeechEl.innerText;
      activeSpeechEl.classList.remove('fade-in');
      void activeSpeechEl.offsetWidth;
      activeSpeechEl.innerText = text;
      activeSpeechEl.classList.add('fade-in');

      if (this.tempSpeechTimer) clearTimeout(this.tempSpeechTimer);
      this.tempSpeechTimer = setTimeout(() => {
        if (this.state === 'idle' && activeSpeechEl.innerText === text) {
          activeSpeechEl.classList.remove('fade-in');
          void activeSpeechEl.offsetWidth;
          activeSpeechEl.innerText = prevSpeech;
          activeSpeechEl.classList.add('fade-in');
        }
      }, durationMs);
    }
  }

  // ARASAAC Piktogramını Düşünce Bulutunda Göster
  showVisual(imageUrl) {
    if (this.visualFadeTimer) {
      clearTimeout(this.visualFadeTimer);
      this.visualFadeTimer = null;
    }
    if (this.pendingVisualSwitchTimer) {
      clearTimeout(this.pendingVisualSwitchTimer);
      this.pendingVisualSwitchTimer = null;
    }

    const container = document.getElementById('thoughtVisualContainer');
    const imgEl = document.getElementById('thoughtVisualImg');
    if (!container || !imgEl) return;

    const fallbackUrl = 'assets/arasaac/default_idea.svg';
    const targetUrl = imageUrl || fallbackUrl;

    imgEl.onerror = () => {
      if (!imgEl.src.endsWith('default_idea.svg')) {
        imgEl.src = fallbackUrl;
      }
    };

    const isVisible = container.classList.contains('visible');

    if (!isVisible || !this.currentVisualUrl) {
      this.currentVisualUrl = targetUrl;
      this.lastVisualShownAt = Date.now();
      imgEl.style.opacity = '1';
      imgEl.src = targetUrl;
      container.classList.add('visible');
      return;
    }

    if (this.currentVisualUrl === targetUrl) {
      return;
    }

    const MIN_VISIBLE_MS = 3000;
    const elapsed = Date.now() - (this.lastVisualShownAt || 0);
    const isCurrentGeneric = this.currentVisualUrl.endsWith('default_idea.svg') || this.currentVisualUrl.endsWith('welcome.png');

    const applyCrossFade = () => {
      this.currentVisualUrl = targetUrl;
      this.lastVisualShownAt = Date.now();
      imgEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      imgEl.style.opacity = '0';
      setTimeout(() => {
        imgEl.src = targetUrl;
        imgEl.style.opacity = '1';
      }, 280);
    };

    if (elapsed >= MIN_VISIBLE_MS || isCurrentGeneric) {
      applyCrossFade();
    } else {
      const remainingMs = MIN_VISIBLE_MS - elapsed;
      this.pendingVisualSwitchTimer = setTimeout(() => {
        if (this.state === 'speaking') {
          applyCrossFade();
        }
      }, remainingMs);
    }
  }

  hideVisual(delayMs = 2000, forceImmediate = false) {
    if (this.isWelcomeLocked) {
      return;
    }

    if (this.visualFadeTimer) {
      clearTimeout(this.visualFadeTimer);
      this.visualFadeTimer = null;
    }
    if (this.pendingVisualSwitchTimer) {
      clearTimeout(this.pendingVisualSwitchTimer);
      this.pendingVisualSwitchTimer = null;
    }

    const container = document.getElementById('thoughtVisualContainer');
    if (!container) return;

    if (forceImmediate) {
      container.classList.remove('visible');
      this.currentVisualUrl = null;
      return;
    }

    const MIN_VISIBLE_MS = 3000;
    const elapsed = Date.now() - (this.lastVisualShownAt || 0);
    const minRemaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
    const waitTime = Math.max(delayMs, minRemaining);

    this.visualFadeTimer = setTimeout(() => {
      if (this.state !== 'speaking') {
        container.classList.remove('visible');
        this.currentVisualUrl = null;
      }
    }, waitTime);
  }

  // Uyumluluk Metotları (Geriye Dönük Güvenlik)
  startLipSync() {}
  stopLipSync() {}
  startIdleAnimations() {}
  setMascotMode(mode) {}
  updateModelPose(state) {}
}

window.MascotController = MascotController;
