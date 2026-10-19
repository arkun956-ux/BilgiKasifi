// ============================================================
// Etkileşimli Animasyonlu Kedi Maskotu ("Bilgi Kaşifi")
// Zengin Jest, Mimik, Göz, Kaş, Pati ve Kuyruk Animasyon Motoru
// ============================================================

class MascotController {
  constructor(containerId, bubbleContainerId) {
    this.container = document.getElementById(containerId);
    this.bubbleContainer = document.getElementById(bubbleContainerId);
    this.state = 'idle'; // idle | listening | thinking | speaking
    this.poppedBubblesCount = 0;
    this.bubbleInterval = null;
    this.speechInterval = null;
    this.phraseTimer = null;
    this.eyeLookInterval = null;
    this.blinkInterval = null;
    this.mouthPhase = 0;
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

    this.renderMascot();
    this.showVisual('assets/arasaac/welcome.png');
    this.startIdleAnimations();
    this.startIdleInactivityTracker();
  }

  // Sevimli Turuncu Tekir Kedi Maskotunun Zengin Katmanlı SVG Çizimi
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

          <!-- ANA KARAKTER GRUBU (Tüm Vücut Hareketleri İçin) -->
          <g id="catWholeBody" class="cat-whole-body">

            <!-- 2. KUYRUK (Canlı Sallanan Tüylü Kuyruk) -->
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

            <!-- 4. GÖVDE & KARIN (Nefes Alan ve Salınan Gövde) -->
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

            <!-- 5. KOLLAR & PATİLER (4 Farklı Jest Modu!) -->
            <!-- SOL KOL: Normalde belinde, konuşurken anlatıcı jesti yapar -->
            <g id="catArmLeftNormal" class="cat-arm-left-normal">
              <path d="M 68 148 Q 44 170 52 195 Q 56 205 68 202 Q 74 200 70 188 Q 66 172 78 156 Z" fill="url(#catFurGrad)"/>
              <path d="M 49 178 Q 56 182 62 180" stroke="#B84407" stroke-width="4" stroke-linecap="round" fill="none"/>
              <circle cx="62" cy="198" r="7.5" fill="#FFA756" stroke="#D95B08" stroke-width="1.5"/>
            </g>

            <!-- SOL KOL: Konuşurken Heyecanlı Anlatım Jesti -->
            <g id="catArmLeftSpeaking" class="cat-arm-left-speaking" style="display:none;">
              <path d="M 68 150 Q 34 142 28 122 Q 26 112 38 112 Q 48 114 54 132 Q 62 144 74 154 Z" fill="url(#catFurGrad)"/>
              <circle cx="33" cy="116" r="8.5" fill="#FFA756" stroke="#D95B08" stroke-width="1.5"/>
              <path d="M 28 112 L 26 108 M 33 110 L 33 105 M 38 112 L 40 108" stroke="#B84407" stroke-width="2" stroke-linecap="round"/>
            </g>

            <!-- SAĞ KOL MOD 1: Normal Belinde / El Sallayan -->
            <g id="catArmRightNormal" class="cat-arm-right-normal">
              <path d="M 152 148 Q 176 170 168 195 Q 164 205 152 202 Q 146 200 150 188 Q 154 172 142 156 Z" fill="url(#catFurGrad)"/>
              <path d="M 171 178 Q 164 182 158 180" stroke="#B84407" stroke-width="4" stroke-linecap="round" fill="none"/>
              <circle cx="158" cy="198" r="7.5" fill="#FFA756" stroke="#D95B08" stroke-width="1.5"/>
            </g>

            <!-- SAĞ KOL MOD 2: Düşünme Pozu (Pati Çenede Tıkır Tıkır Düşünür) -->
            <g id="catArmRightThinking" class="cat-arm-right-thinking" style="display:none;">
              <path d="M 150 155 Q 174 156 162 132 Q 152 118 130 124 Q 122 127 125 137 Q 138 144 144 158 Z" fill="url(#catFurGrad)"/>
              <circle cx="128" cy="128" r="8.5" fill="#FFA756" stroke="#D95B08" stroke-width="1.5"/>
              <path d="M 123 125 Q 128 129 133 125" stroke="#B84407" stroke-width="2" fill="none"/>
            </g>

            <!-- SAĞ KOL MOD 3: Dinleme Pozu (Patisini Kulağına Götürüp Dinler!) -->
            <g id="catArmRightListening" class="cat-arm-right-listening" style="display:none;">
              <path d="M 152 150 Q 192 130 184 88 Q 180 74 168 80 Q 162 86 168 106 Q 172 128 146 146 Z" fill="url(#catFurGrad)"/>
              <circle cx="174" cy="82" r="9" fill="#FFA756" stroke="#D95B08" stroke-width="1.5"/>
              <path d="M 170 78 L 168 74 M 175 77 L 175 72 M 180 79 L 182 75" stroke="#B84407" stroke-width="2" stroke-linecap="round"/>
            </g>

            <!-- SAĞ KOL MOD 4: Konuşma / El Sallama Jesti -->
            <g id="catArmRightSpeaking" class="cat-arm-right-speaking" style="display:none;">
              <path d="M 152 150 Q 186 140 192 116 Q 194 106 182 106 Q 172 108 166 128 Q 158 142 146 154 Z" fill="url(#catFurGrad)"/>
              <circle cx="186" cy="110" r="8.5" fill="#FFA756" stroke="#D95B08" stroke-width="1.5"/>
              <path d="M 181 106 L 179 102 M 186 104 L 186 99 M 191 106 L 193 102" stroke="#B84407" stroke-width="2" stroke-linecap="round"/>
            </g>

            <!-- 6. KAFA GRUBU (Eğilip Bükülebilen, Mimik Yapan Bölge) -->
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

              <!-- HAREKETLİ KAŞLAR (Mimiklere Göre İnip Kalkan Kaşlar!) -->
              <g id="catEyebrows" class="cat-eyebrows">
                <path id="catBrowLeft" class="cat-brow-left" d="M 74 74 Q 86 68 96 74" stroke="#9A3404" stroke-width="4" stroke-linecap="round" fill="none"/>
                <path id="catBrowRight" class="cat-brow-right" d="M 124 74 Q 134 68 146 74" stroke="#9A3404" stroke-width="4" stroke-linecap="round" fill="none"/>
              </g>

              <!-- 7. GÖZLER (İri, Işıltılı, Göz Kırpan & Yön Değiştiren) -->
              <!-- Sol Göz -->
              <g id="catEyeLeftGroup" class="cat-eye-group">
                <ellipse cx="86" cy="98" rx="17.5" ry="19.5" fill="#FFFFFF"/>
                <ellipse cx="86" cy="98" rx="16.5" ry="18.5" fill="url(#catEyeGrad)"/>
                <!-- Göz Bebeği -->
                <ellipse id="pupilLeft" class="cat-pupil" cx="87" cy="98" rx="8.5" ry="14" fill="#211206"/>
                <!-- İki Nokta Beyaz Işıltı (Canlı Anime Parıltısı) -->
                <circle id="sparkleLeftMajor" class="eye-sparkle-major" cx="82" cy="92" r="5.2" fill="#FFFFFF"/>
                <circle id="sparkleLeftMinor" class="eye-sparkle-minor" cx="91" cy="105" r="2.6" fill="#FFFFFF"/>
                <!-- Göz Kapağı (Kırpma Animasyonu İçin) -->
                <ellipse id="mascotLeftLid" cx="86" cy="98" rx="18.5" ry="20" fill="#F58220" style="display:none;"/>
                <!-- Mutlu Göz Kısma Çizgisi (Sevinçli Anlarda) -->
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
                <!-- Göz Kapağı -->
                <ellipse id="mascotRightLid" cx="134" cy="98" rx="18.5" ry="20" fill="#F58220" style="display:none;"/>
                <!-- Mutlu Göz Kısma Çizgisi -->
                <path id="happyEyeRight" d="M 120 98 Q 134 84 148 98" stroke="#792803" stroke-width="4" stroke-linecap="round" fill="none" style="display:none;"/>
              </g>

              <!-- Sevimli Pembe Yanak Parıltıları -->
              <circle id="cheekLeft" class="cat-cheek" cx="66" cy="118" r="10" fill="#FF5252" opacity="0.35"/>
              <circle id="cheekRight" class="cat-cheek" cx="154" cy="118" r="10" fill="#FF5252" opacity="0.35"/>

              <!-- Burun (Kedi Üçgen Burnu) -->
              <polygon id="catNose" class="cat-nose" points="105,112 115,112 110,119" fill="#8D3208"/>

              <!-- Bıyıklar (Canlı Titreyen Bıyıklar!) -->
              <g id="whiskersLeft" class="cat-whiskers-left">
                <path d="M 56 114 L 93 117" stroke="#792803" stroke-width="2.2" stroke-linecap="round"/>
                <path d="M 54 122 L 94 121" stroke="#792803" stroke-width="2.2" stroke-linecap="round"/>
                <path d="M 58 130 L 94 125" stroke="#792803" stroke-width="2" stroke-linecap="round"/>
              </g>
              <g id="whiskersRight" class="cat-whiskers-right">
                <path d="M 164 114 L 127 117" stroke="#792803" stroke-width="2.2" stroke-linecap="round"/>
                <path d="M 166 122 L 126 121" stroke="#792803" stroke-width="2.2" stroke-linecap="round"/>
                <path d="M 162 130 L 126 125" stroke="#792803" stroke-width="2" stroke-linecap="round"/>
              </g>

              <!-- 8. AĞIZLAR (5 Farklı Canlı Mimik & Lip-Sync Seçeneği!) -->
              <!-- Durum A: Kapalı Tatlı Kedi Gülümsemesi (Idle) -->
              <path id="mouthClosed" d="M 97 122 Q 104 129 110 122 Q 116 129 123 122" stroke="#792803" stroke-width="3.2" fill="none" stroke-linecap="round"/>

              <!-- Durum B: Meraklı Dinleme Ağzı (Listening - Heyecanlı Minik Açık Ağız) -->
              <g id="mouthListen" style="display:none;">
                <path d="M 98 122 Q 104 127 110 122 Q 116 127 122 122" stroke="#792803" stroke-width="2.8" fill="none" stroke-linecap="round"/>
                <ellipse cx="110" cy="127" rx="5.5" ry="6" fill="#D32F2F" stroke="#792803" stroke-width="2"/>
                <ellipse cx="110" cy="129" rx="3.5" ry="3" fill="#FF8A80"/>
              </g>

              <!-- Durum C: Meraklı Düşünce Ağzı (Thinking - Hımm Yapan Büzülmüş Ağız) -->
              <path id="mouthThink" d="M 102 126 Q 108 122 114 127 Q 118 129 121 124" stroke="#792803" stroke-width="3.2" fill="none" stroke-linecap="round" style="display:none;"/>

              <!-- Durum D: Konuşan Yarı Açık Ağız (Speaking Lip-Sync 1) -->
              <g id="mouthOpen" style="display:none;">
                <path d="M 99 122 Q 110 137 121 122 Z" fill="#C62828" stroke="#792803" stroke-width="2.2"/>
                <path d="M 104 129 Q 110 134 116 129 Z" fill="#FF8A80"/>
              </g>

              <!-- Durum E: Konuşan Tam Açık Neşeli Ağız (Speaking Lip-Sync 2) -->
              <g id="mouthOpenWide" style="display:none;">
                <path d="M 96 121 Q 110 145 124 121 Z" fill="#B71C1C" stroke="#792803" stroke-width="2.5"/>
                <ellipse cx="110" cy="133" rx="7" ry="5" fill="#FF80AB"/>
                <!-- Minik kedi dişleri -->
                <polygon points="101,122 104,122 102.5,126" fill="#FFFFFF"/>
                <polygon points="116,122 119,122 117.5,126" fill="#FFFFFF"/>
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

    // Maskota dokununca sevimli gıdıklanma (wiggle), mutlu gözler ve neşeli tepki
    const mascot = document.getElementById('mascotMain');
    if (mascot) {
      const handleTickle = () => {
        if (window.soundEngine) window.soundEngine.playReward();
        this.wiggle();
        this.triggerHappyEyes(950);

        // Kullanıcının kayıtlı öğrenci ismini dinamik olarak al
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

    const armLeftNormal = document.getElementById('catArmLeftNormal');
    const armLeftSpeaking = document.getElementById('catArmLeftSpeaking');
    const armRightNormal = document.getElementById('catArmRightNormal');
    const armRightThinking = document.getElementById('catArmRightThinking');
    const armRightListening = document.getElementById('catArmRightListening');
    const armRightSpeaking = document.getElementById('catArmRightSpeaking');

    const pupilLeft = document.getElementById('pupilLeft');
    const pupilRight = document.getElementById('pupilRight');
    const browLeft = document.getElementById('catBrowLeft');
    const browRight = document.getElementById('catBrowRight');

    if (!wrapper) return;

    // CSS Sınıflarını Güncelle
    wrapper.classList.remove('state-idle', 'state-listening', 'state-thinking', 'state-speaking');
    wrapper.classList.add(`state-${newState}`);

    // Rozetleri Sıfırla
    if (bulb) bulb.style.display = 'none';
    if (listeningBadge) listeningBadge.style.display = 'none';
    if (listenRings) listenRings.style.display = 'none';

    // Kolları Varsayılana Getir
    if (armLeftNormal) armLeftNormal.style.display = 'block';
    if (armLeftSpeaking) armLeftSpeaking.style.display = 'none';
    if (armRightNormal) armRightNormal.style.display = 'block';
    if (armRightThinking) armRightThinking.style.display = 'none';
    if (armRightListening) armRightListening.style.display = 'none';
    if (armRightSpeaking) armRightSpeaking.style.display = 'none';

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
    if (mouthThink) mouthThink.style.display = 'none';
    if (mouthListen) mouthListen.style.display = 'none';
    if (mouthClosed) mouthClosed.style.display = 'block';

    // ── 1. DÜŞÜNME MODU (Thinking) ───────────────────────────
    if (newState === 'thinking') {
      if (bulb) bulb.style.display = 'flex';
      this.startThoughtBubbles();

      // Jest: Sağ pati çeneye gider ve çenesini kaşır!
      if (armRightNormal) armRightNormal.style.display = 'none';
      if (armRightThinking) armRightThinking.style.display = 'block';

      // Mimik: Göz bebekleri yukarı fikir bulutuna bakar!
      if (pupilLeft && pupilRight) {
        pupilLeft.setAttribute('cx', '90');
        pupilLeft.setAttribute('cy', '91');
        pupilRight.setAttribute('cx', '136');
        pupilRight.setAttribute('cy', '91');
      }

      // Mimik: Meraklı asimetrik kaşlar (Biri kalkık, biri düşünceli)
      if (browLeft && browRight) {
        browLeft.setAttribute('d', 'M 74 76 Q 86 73 96 77');
        browRight.setAttribute('d', 'M 124 70 Q 134 62 146 70');
      }

      // Mimik: Düşünen 'hımm' ağzı
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

      // Jest: Sağ patisini kulağının arkasına götürüp pür dikkat dinler!
      if (armRightNormal) armRightNormal.style.display = 'none';
      if (armRightListening) armRightListening.style.display = 'block';

      // Mimik: Göz bebekleri meraktan kocaman büyür!
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

      // Mimik: Heyecanla yukarı kalkan kaşlar
      if (browLeft && browRight) {
        browLeft.setAttribute('d', 'M 73 69 Q 86 61 97 69');
        browRight.setAttribute('d', 'M 123 69 Q 134 61 147 69');
      }

      // Mimik: Meraklı açık dinleme ağzı
      if (mouthClosed) mouthClosed.style.display = 'none';
      if (mouthListen) mouthListen.style.display = 'block';

      if (statusText) {
        statusText.innerText = customText || "Seni pür dikkat dinliyorum minik kaşif... 👂 Hadi sorunu sor!";
      }
      if (window.soundEngine) window.soundEngine.playListenStart();
    }

    // ── 3. KONUŞMA MODU (Speaking) ───────────────────────────
    if (newState === 'speaking') {
      // Jest: İki koluyla heyecanlı anlatım hareketi yapar!
      if (armLeftNormal) armLeftNormal.style.display = 'none';
      if (armLeftSpeaking) armLeftSpeaking.style.display = 'block';
      if (armRightNormal) armRightNormal.style.display = 'none';
      if (armRightSpeaking) armRightSpeaking.style.display = 'block';

      // Mimik: Neşeli kalkık kaşlar
      if (browLeft && browRight) {
        browLeft.setAttribute('d', 'M 74 71 Q 86 64 96 71');
        browRight.setAttribute('d', 'M 124 71 Q 134 64 146 71');
      }

      this.startLipSync();
      if (customText && statusText) statusText.innerText = customText;

      // Cümle başına kilitlenmiş tek ARASAAC piktogramını düşünce bulutunda göster
      // (Karşılama kilidi aktifken hiçbir arama yapılmaz, doğrudan welcome.png gösterilir)
      const visualUrl = this.isWelcomeLocked
        ? 'assets/arasaac/welcome.png'
        : (lockedVisualUrl || (window.visualEngine && customText
            ? window.visualEngine.findBestMatch(customText, this.activeTopicHint || null)
            : null));
      if (visualUrl) {
        this.showVisual(visualUrl);
      }
    } else {
      this.stopLipSync();
    }

    // ── 4. BOŞTA VEYA UYKU/DİNLENME MODU (Idle / Sleep) ──────
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
    } else {
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
    if (happyLeft && happyRight && lidLeft && lidRight) {
      lidLeft.style.display = 'block';
      lidRight.style.display = 'block';
      happyLeft.style.display = 'block';
      happyRight.style.display = 'block';
      setTimeout(() => {
        lidLeft.style.display = 'none';
        lidRight.style.display = 'none';
        happyLeft.style.display = 'none';
        happyRight.style.display = 'none';
      }, durationMs);
    }
  }

  // Düşünme sırasında periyodik sevimli fısıltılar ve göz gezdirme
  cycleThinkingPhrases() {
    this.phraseIndex = 0;
    if (this.phraseTimer) clearInterval(this.phraseTimer);
    let lookLeft = false;

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

      // Düşünürken gözlerini sağ-üst ve sol-üst arasında gezdirsin
      lookLeft = !lookLeft;
      const pupilLeft = document.getElementById('pupilLeft');
      const pupilRight = document.getElementById('pupilRight');
      if (pupilLeft && pupilRight) {
        pupilLeft.setAttribute('cx', lookLeft ? '82' : '91');
        pupilLeft.setAttribute('cy', '90');
        pupilRight.setAttribute('cx', lookLeft ? '128' : '137');
        pupilRight.setAttribute('cy', '90');
      }
    }, 2200);
  }

  // Düşünce Balonu Oyunu (Bekleme süresinde ekranda uçuşan patlatılabilir balonlar)
  startThoughtBubbles() {
    this.stopThoughtBubbles();
    const bubbleIcons = ['🦖', '🚀', '🌟', '🌿', '☁️', '🪐', '🐾', '🔍', '🐬', '🌋', '🌈', '🍎', '🎨', '🌙', '🐱'];

    const spawnBubble = () => {
      if (this.state !== 'thinking') return;

      const bubble = document.createElement('div');
      bubble.className = 'floating-thought-bubble';
      const icon = bubbleIcons[Math.floor(Math.random() * bubbleIcons.length)];
      bubble.innerHTML = `<span>${icon}</span>`;

      const startX = 15 + Math.random() * 70;
      const duration = 5 + Math.random() * 3.5;
      const size = 56 + Math.random() * 26;

      bubble.style.left = `${startX}%`;
      bubble.style.bottom = '-80px';
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.animationDuration = `${duration}s`;

      // Dokununca / Tıklayınca Patlama
      const popBubble = (e) => {
        e.stopPropagation();
        if (window.soundEngine) window.soundEngine.playPop();
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

  // Konuşma Senkronizasyonu (Gerçekçi Açılıp Kapanan Ağız ve Mimik Hareketi)
  startLipSync() {
    this.stopLipSync();
    const mouthOpen = document.getElementById('mouthOpen');
    const mouthOpenWide = document.getElementById('mouthOpenWide');
    const mouthClosed = document.getElementById('mouthClosed');
    const mouthThink = document.getElementById('mouthThink');
    const mouthListen = document.getElementById('mouthListen');
    if (mouthThink) mouthThink.style.display = 'none';
    if (mouthListen) mouthListen.style.display = 'none';

    this.speechInterval = setInterval(() => {
      this.mouthPhase = (this.mouthPhase + 1) % 4;
      if (this.mouthPhase === 0) {
        if (mouthClosed) mouthClosed.style.display = 'block';
        if (mouthOpen) mouthOpen.style.display = 'none';
        if (mouthOpenWide) mouthOpenWide.style.display = 'none';
      } else if (this.mouthPhase === 1 || this.mouthPhase === 3) {
        if (mouthClosed) mouthClosed.style.display = 'none';
        if (mouthOpen) mouthOpen.style.display = 'block';
        if (mouthOpenWide) mouthOpenWide.style.display = 'none';
      } else {
        if (mouthClosed) mouthClosed.style.display = 'none';
        if (mouthOpen) mouthOpen.style.display = 'none';
        if (mouthOpenWide) mouthOpenWide.style.display = 'block';
      }
    }, 130);
  }

  stopLipSync() {
    if (this.speechInterval) {
      clearInterval(this.speechInterval);
      this.speechInterval = null;
    }
    const mouthOpen = document.getElementById('mouthOpen');
    const mouthOpenWide = document.getElementById('mouthOpenWide');
    const mouthClosed = document.getElementById('mouthClosed');
    if (mouthOpen) mouthOpen.style.display = 'none';
    if (mouthOpenWide) mouthOpenWide.style.display = 'none';
    if (mouthClosed && this.state !== 'thinking' && this.state !== 'listening') {
      mouthClosed.style.display = 'block';
    }
  }

  // Canlı Göz Kırpma, Etrafa Bakınma ve Pati Sallama Animasyonları
  startIdleAnimations() {
    // 1. Doğal Göz Kırpma (Bazen tek, bazen çift kırpma; uyku modunda kapalı kalır)
    this.blinkInterval = setInterval(() => {
      if (this.state === 'sleep') return;
      const leftLid = document.getElementById('mascotLeftLid');
      const rightLid = document.getElementById('mascotRightLid');
      if (leftLid && rightLid) {
        leftLid.style.display = 'block';
        rightLid.style.display = 'block';
        setTimeout(() => {
          if (this.state === 'sleep') return;
          leftLid.style.display = 'none';
          rightLid.style.display = 'none';
        }, 140);
      }
    }, 3200);

    // 2. Boşta Dururken Canlı Göz Gezdirme ve Ara Sıra El Sallama
    const eyePositions = [
      { lx: '87', ly: '98', rx: '133', ry: '98' }, // Merkez
      { lx: '84', ly: '97', rx: '130', ry: '97' }, // Sola bakış
      { lx: '90', ly: '97', rx: '136', ry: '97' }, // Sağa (sohbete) bakış
      { lx: '87', ly: '94', rx: '133', ry: '94' }, // Yukarı meraklı bakış
      { lx: '87', ly: '98', rx: '133', ry: '98' }  // Merkez
    ];
    let posIdx = 0;

    this.eyeLookInterval = setInterval(() => {
      if (this.state === 'idle') {
        posIdx = (posIdx + 1) % eyePositions.length;
        const pos = eyePositions[posIdx];
        const pupilLeft = document.getElementById('pupilLeft');
        const pupilRight = document.getElementById('pupilRight');
        if (pupilLeft && pupilRight) {
          pupilLeft.setAttribute('cx', pos.lx);
          pupilLeft.setAttribute('cy', pos.ly);
          pupilRight.setAttribute('cx', pos.rx);
          pupilRight.setAttribute('cy', pos.ry);
        }

        // Her birkaç harekette bir çocuğa neşeyle el sallasın!
        if (posIdx === 2) {
          const armNormal = document.getElementById('catArmRightNormal');
          const armWave = document.getElementById('catArmRightSpeaking');
          if (armNormal && armWave && this.state === 'idle') {
            armNormal.style.display = 'none';
            armWave.style.display = 'block';
            setTimeout(() => {
              if (this.state === 'idle') {
                armWave.style.display = 'none';
                armNormal.style.display = 'block';
              }
            }, 1400);
          }
        }
      }
    }, 2600);
  }

  bounce() {
    const wrapper = document.getElementById('mascotMain');
    if (wrapper) {
      wrapper.classList.remove('mascot-bounce', 'mascot-wiggle');
      void wrapper.offsetWidth;
      wrapper.classList.add('mascot-bounce');
      setTimeout(() => wrapper.classList.remove('mascot-bounce'), 600);
    }
  }

  // Gıdıklanınca İki Yana Sevimli Kıvrılma (Wiggle)
  wiggle() {
    const wrapper = document.getElementById('mascotMain');
    if (wrapper) {
      wrapper.classList.remove('mascot-bounce', 'mascot-wiggle', 'mascot-idle-nudge');
      void wrapper.offsetWidth;
      wrapper.classList.add('mascot-wiggle');
      setTimeout(() => wrapper.classList.remove('mascot-wiggle'), 750);
    }
  }

  // 15 Saniye İşlemsiz Kalındığında Canlılık Takibi (Idle Inactivity Micro-Interactions)
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
      const wrapper = document.getElementById('mascotMain');
      if (wrapper) {
        wrapper.classList.remove('mascot-idle-nudge', 'mascot-bounce', 'mascot-wiggle');
        void wrapper.offsetWidth;
        wrapper.classList.add('mascot-idle-nudge');
        setTimeout(() => wrapper.classList.remove('mascot-idle-nudge'), 1250);
      }

      // Meraklı Göz Kırpma & Başını Hafifçe Eğme Hareketi
      const leftLid = document.getElementById('mascotLeftLid');
      const rightLid = document.getElementById('mascotRightLid');
      if (leftLid && rightLid) {
        leftLid.style.display = 'block';
        rightLid.style.display = 'block';
        setTimeout(() => {
          if (this.state === 'idle') {
            leftLid.style.display = 'none';
            rightLid.style.display = 'none';
          }
        }, 180);
      }

      // Canlı Kuyruk Sallanmasını Destekle
      const tail = document.getElementById('mascotTailGroup');
      if (tail) {
        tail.style.transition = 'transform 0.4s ease';
        tail.style.transform = 'rotate(-10deg)';
        setTimeout(() => {
          if (tail) tail.style.transform = 'rotate(0deg)';
        }, 650);
      }
    }

    // 15 saniye sonra tekrar tetiklenebilmesi için döngüyü sürdür
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

  // ARASAAC Piktogramını Düşünce Bulutunda Göster (En Az 3000 ms Kararlılık Kilidi & 300 ms Yumuşak Geçiş)
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

    // 1. Eğer balon şu an kapalıysa hemen yumuşakça aç ve 3000 ms zamanlayıcısını başlat
    if (!isVisible || !this.currentVisualUrl) {
      this.currentVisualUrl = targetUrl;
      this.lastVisualShownAt = Date.now();
      imgEl.style.opacity = '1';
      imgEl.src = targetUrl;
      container.classList.add('visible');
      return;
    }

    // 2. Zaten aynı görsel ekrandaysa hiçbir titreme yapmadan sabit tut
    if (this.currentVisualUrl === targetUrl) {
      return;
    }

    // 3. Farklı bir cümle görseline geçilecekse: En az 3000 ms (3 saniye) görünürlük kuralını uygula
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
      // 3 saniyelik süre dolana kadar mevcut görseli koru, süre dolduğunda konuşma devam ediyorsa yumuşakça değiştir
      const remainingMs = MIN_VISIBLE_MS - elapsed;
      this.pendingVisualSwitchTimer = setTimeout(() => {
        if (this.state === 'speaking') {
          applyCrossFade();
        }
      }, remainingMs);
    }
  }

  // Konuşma Bitince Görseli En Az 3000 ms Göründükten Sonra Zarifçe Kaybet (Fade-Out)
  hideVisual(delayMs = 2000, forceImmediate = false) {
    // Çocuk ilk sorusunu sorup kedi yeni bir yanıt verene kadar düşünce bulutunda yalnızca welcome.png kalsın!
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
}

window.MascotController = MascotController;
