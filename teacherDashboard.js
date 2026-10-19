// ============================================================
// Öğretmen Paneli & Analiz Kontrolcüsü (Tez Araştırmacısı İçin)
// ============================================================

class TeacherDashboard {
  constructor() {
    this.modal = null;
    this.isOpen = false;
  }

  init() {
    this.createModalDOM();
    this.attachEvents();
  }

  createModalDOM() {
    const div = document.createElement('div');
    div.id = 'teacherModal';
    div.className = 'teacher-modal-backdrop';
    div.style.display = 'none';

    div.innerHTML = `
      <div class="teacher-modal-content">
        <div class="teacher-modal-header">
          <div class="flex items-center gap-2">
            <span class="text-2xl">🎓</span>
            <div>
              <h2 class="text-xl font-bold text-gray-800">Öğretmen ve Araştırmacı Paneli</h2>
              <p class="text-xs text-gray-500">Yapay Zekâ Destekli İlgi Merkezi - Tez Veri Yönetimi</p>
            </div>
          </div>
          <button id="closeTeacherModal" class="btn-close-modal">✕</button>
        </div>

        <div class="teacher-modal-body">
          <!-- Üst Özet Kartları -->
          <div class="dashboard-stats-grid">
            <div class="stat-card">
              <span class="stat-icon">👥</span>
              <div class="stat-value" id="dashTotalStudents">0</div>
              <div class="stat-label">Kayıtlı Çocuklar</div>
            </div>
            <div class="stat-card">
              <span class="stat-icon">❓</span>
              <div class="stat-value" id="dashTotalQuestions">0</div>
              <div class="stat-label">Toplam Soru</div>
            </div>
            <div class="stat-card">
              <span class="stat-icon">⭐</span>
              <div class="stat-value" id="dashTotalStars">0</div>
              <div class="stat-label">Kazanılan Yıldızlar</div>
            </div>
            <div class="stat-card">
              <span class="stat-icon">🚨</span>
              <div class="stat-value text-red-500" id="dashTotalAlerts">0</div>
              <div class="stat-label">Hassas Konu Alarmı</div>
            </div>
          </div>

          <!-- Sekmeler -->
          <div class="teacher-tabs">
            <button class="tab-btn active" data-tab="students">Öğrenciler & Akranlar</button>
            <button class="tab-btn" data-tab="interests">İlgi Haritası</button>
            <button class="tab-btn" data-tab="alerts">Kırmızı Çizgi Alarmları</button>
            <button class="tab-btn" data-tab="settings">Model & Çevrim Dışı Ayarlar</button>
          </div>

          <!-- Sekme 1: Öğrenci Listesi -->
          <div class="tab-pane active" id="paneStudents">
            <div class="flex justify-between items-center mb-3">
              <h3 class="font-bold text-gray-700">Öğrenci Listesi & Gruplar</h3>
              <button id="btnAddNewStudent" class="btn-primary-sm">+ Yeni Çocuk Ekle</button>
            </div>
            <div class="table-container">
              <table class="dashboard-table">
                <thead>
                  <tr>
                    <th>Adı</th>
                    <th>Grup</th>
                    <th>Sorular</th>
                    <th>5N1K Puanı</th>
                    <th>Derinleşme</th>
                    <th>Rozet</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody id="studentTableBody">
                  <!-- JS ile doldurulacak -->
                </tbody>
              </table>
            </div>
          </div>

          <!-- Sekme 2: Sınıf İlgi Haritası -->
          <div class="tab-pane" id="paneInterests" style="display:none;">
            <h3 class="font-bold text-gray-700 mb-2">Sınıf Geneli Merak & İlgi Alanları Dağılımı</h3>
            <p class="text-xs text-gray-500 mb-4">Müfredatı çocukların doğal merakına göre planlamak için kanıta dayalı analiz.</p>
            <div id="interestBarsContainer" class="interest-bars-list">
              <!-- JS ile barlar eklenecek -->
            </div>
          </div>

          <!-- Sekme 3: Kırmızı Çizgi ve Hassas Konu Alarmları -->
          <div class="tab-pane" id="paneAlerts" style="display:none;">
            <div class="flex justify-between items-center mb-3">
              <h3 class="font-bold text-gray-700">Hassas Konu Bildirimleri & Pedagojik Öneriler</h3>
              <button id="btnClearAlerts" class="btn-danger-sm">Alarmları Temizle</button>
            </div>
            <div id="alertsListContainer" class="alerts-list">
              <!-- JS ile doldurulacak -->
            </div>
          </div>

          <!-- Sekme 4: Model Ayarları -->
          <div class="tab-pane" id="paneSettings" style="display:none;">
            <h3 class="font-bold text-gray-700 mb-3">Yerel Yapay Zekâ (Ollama) Ayarları</h3>
            <div class="setting-item">
              <label class="block text-sm font-medium text-gray-700 mb-1">Seçili Ollama Modeli:</label>
              <select id="modelSelector" class="form-select"></select>
              <p class="text-xs text-gray-500 mt-1">Önerilen: <strong>gemma4:latest</strong> (think:false & num_ctx:2048 optimizasyonlu).</p>
            </div>
            <div class="setting-item mt-4 border-t pt-4">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
                <h4 class="font-bold text-gray-700" style="margin:0;">🔊 Türkçe Ses Motoru ve Maskot Tınısı</h4>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span id="ttsEngineStatusBadge" style="padding:4px 10px; border-radius:999px; font-size:0.78rem; font-weight:700; background:#FEF3C7; color:#92400E;">
                    🟡 Tarayıcı Yerleşik Sesi (Fallback Aktif)
                  </span>
                  <button id="btnTestVoice" class="btn-primary-sm" style="margin:0;">Sesi Test Et 📢</button>
                </div>
              </div>

              <label class="block text-sm font-medium text-gray-700 mb-1">Piper Nöral Türkçe Ses Modeli (Çevrim Dışı ONNX - 0 VRAM):</label>
              <select id="piperModelSelector" class="form-select mb-2">
                <option value="tr_TR-fahrettin-medium">🎙️ Fahrettin Türkçe Nöral Ses (tr_TR-fahrettin-medium - Ana Ses)</option>
                <option value="tr_TR-dfki-medium">🎙️ DFKI Türkçe Nöral Ses (tr_TR-dfki-medium)</option>
                <option value="tr_TR-fettah-medium">🎙️ Fettah Türkçe Nöral Ses (tr_TR-fettah-medium)</option>
              </select>

              <label class="block text-xs font-medium text-gray-500 mb-1 mt-2">Yedek (Fallback) Tarayıcı Sesi (Piper kapalıysa devreye girer):</label>
              <select id="voiceSelector" class="form-select mb-2"></select>

              <div class="grid grid-cols-2 gap-4 mt-2" style="display:flex; gap:16px;">
                <div style="flex:1;">
                  <label class="block text-xs font-semibold text-gray-600">Yedek Ses Tonu (Pitch): <span id="pitchVal">1.3</span></label>
                  <input type="range" id="pitchSlider" min="0.8" max="1.6" step="0.05" value="1.3" style="width:100%;">
                </div>
                <div style="flex:1;">
                  <label class="block text-xs font-semibold text-gray-600">Konuşma Hızı: <span id="rateVal">1.0</span></label>
                  <input type="range" id="rateSlider" min="0.8" max="1.3" step="0.05" value="1.0" style="width:100%;">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Alt Butonlar -->
        <div class="teacher-modal-footer" style="flex-wrap: wrap; gap: 8px;">
          <button id="btnExportJASP" class="btn-success">
            📊 Tez Verilerini İndir (JASP / CSV)
          </button>
          <button id="btnExportTranscriptCSV" class="btn-primary-sm" style="padding: 8px 14px; font-size: 0.85rem;">
            📝 Nitel Analiz Transkriptini İndir (CSV)
          </button>
          <button id="btnExportTranscriptJSON" class="btn-primary-sm" style="padding: 8px 14px; font-size: 0.85rem; background:#4F46E5;">
            📥 Tam Konuşma Dökümünü İndir (JSON)
          </button>
          <button id="btnCloseModalBottom" class="btn-secondary">
            Kapat
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(div);
    this.modal = div;
  }

  attachEvents() {
    // Kapatma
    document.getElementById('closeTeacherModal').addEventListener('click', () => this.close());
    document.getElementById('btnCloseModalBottom').addEventListener('click', () => this.close());

    // Sekmeler
    const tabBtns = this.modal.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tab = btn.dataset.tab;
        this.modal.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');

        if (tab === 'students') document.getElementById('paneStudents').style.display = 'block';
        if (tab === 'interests') document.getElementById('paneInterests').style.display = 'block';
        if (tab === 'alerts') document.getElementById('paneAlerts').style.display = 'block';
        if (tab === 'settings') document.getElementById('paneSettings').style.display = 'block';
      });
    });

    // JASP CSV İndirme Butonu
    document.getElementById('btnExportJASP').addEventListener('click', () => {
      window.storageService.exportToJASP_CSV();
      if (window.soundEngine) window.soundEngine.playReward();
      alert('Tez nicel verileriniz JASP ve Excel uyumlu CSV formatında başarıyla indirildi!');
    });

    // Nitel Analiz Transkripti (CSV) İndirme Butonu
    document.getElementById('btnExportTranscriptCSV').addEventListener('click', () => {
      window.storageService.exportTranscriptsCSV();
      if (window.soundEngine) window.soundEngine.playReward();
      alert('Nitel analiz transkriptiniz (CSV - UTF-8 BOM) başarıyla indirildi!');
    });

    // Tam Konuşma Dökümü (JSON) İndirme Butonu
    document.getElementById('btnExportTranscriptJSON').addEventListener('click', () => {
      window.storageService.exportTranscriptsJSON();
      if (window.soundEngine) window.soundEngine.playReward();
      alert('Tam konuşma dökümünüz (JSON) başarıyla indirildi!');
    });

    // Yeni Öğrenci Ekle
    document.getElementById('btnAddNewStudent').addEventListener('click', () => {
      const name = prompt('Öğrencinin Adını Girin:');
      if (name && name.trim()) {
        const group = confirm('Bu öğrenci Deney Grubunda mı?\n(Tamam = Deney, İptal = Kontrol)') ? 'Deney' : 'Kontrol';
        window.storageService.getOrCreateStudent(name.trim(), group);
        this.renderData();
      }
    });

    // Alarmları Temizle
    document.getElementById('btnClearAlerts').addEventListener('click', () => {
      if (confirm('Tüm hassas konu alarmlarını temizlemek istediğinize emin misiniz?')) {
        window.storageService.clearAlerts();
        this.renderData();
      }
    });

    // Model Değiştirme
    document.getElementById('modelSelector').addEventListener('change', (e) => {
      window.ollamaClient.selectedModel = e.target.value;
      localStorage.setItem('bilgi_kasifi_model_v2', e.target.value);
      window.ollamaClient.warmupModel();
      alert(`Model ${e.target.value} olarak güncellendi ve belleğe yüklendi.`);
    });

    // ── Ses Ayarları ──────────────────────────────────────────

    // Piper Nöral Model Seçici
    const piperSelector = document.getElementById('piperModelSelector');
    if (piperSelector) {
      piperSelector.addEventListener('change', (e) => {
        localStorage.setItem('bilgi_kasifi_piper_model', e.target.value);
      });
    }

    // Yedek Ses Seçici
    document.getElementById('voiceSelector').addEventListener('change', (e) => {
      localStorage.setItem('bilgi_kasifi_voice_name', e.target.value);
    });

    // Pitch Slider
    document.getElementById('pitchSlider').addEventListener('input', (e) => {
      localStorage.setItem('bilgi_kasifi_pitch', e.target.value);
      document.getElementById('pitchVal').innerText = parseFloat(e.target.value).toFixed(2);
    });

    // Rate Slider
    document.getElementById('rateSlider').addEventListener('input', (e) => {
      localStorage.setItem('bilgi_kasifi_rate', e.target.value);
      document.getElementById('rateVal').innerText = parseFloat(e.target.value).toFixed(2);
    });

    // Ses Test Butonu (Yalnızca Piper Nöral TTS + Kedi Miyavlaması)
    document.getElementById('btnTestVoice').addEventListener('click', async () => {
      if (window.appInstance) {
        await window.appInstance.checkPiperStatus();
        this._updateTtsBadge();
        window.appInstance.speakText('Miyav! Merhaba minik kaşif, bugün dünyadaki hangi sırrı birlikte keşfedelim?');
      }
    });

    // Ses listesi async yüklenebilir, değişince dropdown'u yenile
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      this._fillVoiceSelector();
    });
  }

  _updateTtsBadge() {
    const ttsBadge = document.getElementById('ttsEngineStatusBadge');
    if (!ttsBadge) return;
    const isPiperUp = window.appInstance && window.appInstance.piperAvailable;
    if (isPiperUp) {
      ttsBadge.innerText = '🟢 Piper Nöral TTS (Aktif - Doğal İnsan Sesi)';
      ttsBadge.style.background = '#D1FAE5';
      ttsBadge.style.color = '#065F46';
    } else {
      ttsBadge.innerText = '🟡 Tarayıcı Yerleşik Sesi (Fallback Aktif)';
      ttsBadge.style.background = '#FEF3C7';
      ttsBadge.style.color = '#92400E';
    }
  }

  async open() {
    await window.ollamaClient.refreshModels();
    if (window.appInstance && window.appInstance.checkPiperStatus) {
      await window.appInstance.checkPiperStatus();
    }
    this.renderData();
    this.modal.style.display = 'flex';
    this.isOpen = true;
  }

  close() {
    this.modal.style.display = 'none';
    this.isOpen = false;
  }

  renderData() {
    const students = window.storageService.getStudents();
    const alerts = window.storageService.getAlerts();

    // İstatistikler
    document.getElementById('dashTotalStudents').innerText = students.length;
    const totalQ = students.reduce((acc, s) => acc + (s.questionsCount || 0), 0);
    const totalS = students.reduce((acc, s) => acc + (s.stars || 0), 0);
    document.getElementById('dashTotalQuestions').innerText = totalQ;
    document.getElementById('dashTotalStars').innerText = totalS;
    document.getElementById('dashTotalAlerts').innerText = alerts.length;

    // Öğrenci Tablosu
    const tbody = document.getElementById('studentTableBody');
    tbody.innerHTML = '';
    students.forEach(s => {
      const badge = window.pedagogicalEngine.getBadgeInfo(s.score || 0);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="font-semibold">${s.name}</td>
        <td><span class="badge-${s.group === 'Deney' ? 'blue' : 'gray'}">${s.group || 'Deney'}</span></td>
        <td>${s.questionsCount || 0}</td>
        <td>${s.score5N1K || 0}</td>
        <td>${s.scoreDeepening || 0}</td>
        <td>${badge.icon} ${badge.name}</td>
        <td>
          <button class="btn-select-student" data-id="${s.id}" data-name="${s.name}">Seç</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Öğrenci Seçme Butonları
    tbody.querySelectorAll('.btn-select-student').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        if (window.appInstance) {
          window.appInstance.setActiveStudent(id, name);
        }
        this.close();
      });
    });

    // İlgi Haritası Grafikleri
    const interestContainer = document.getElementById('interestBarsContainer');
    interestContainer.innerHTML = '';
    const topicTotals = {};
    students.forEach(s => {
      if (s.topics) {
        for (const [t, cnt] of Object.entries(s.topics)) {
          topicTotals[t] = (topicTotals[t] || 0) + cnt;
        }
      }
    });

    const maxTopicVal = Math.max(...Object.values(topicTotals), 1);
    const topicsSorted = Object.entries(topicTotals).sort((a, b) => b[1] - a[1]);

    if (topicsSorted.length === 0) {
      interestContainer.innerHTML = '<p class="text-sm text-gray-500 italic">Henüz soru verisi kaydedilmedi.</p>';
    } else {
      topicsSorted.forEach(([topName, count]) => {
        const pct = Math.round((count / maxTopicVal) * 100);
        const bar = document.createElement('div');
        bar.className = 'interest-bar-row';
        bar.innerHTML = `
          <div class="interest-bar-label">
            <span>${topName}</span>
            <span class="font-bold text-amber-600">${count} soru</span>
          </div>
          <div class="interest-bar-track">
            <div class="interest-bar-fill" style="width: ${pct}%"></div>
          </div>
        `;
        interestContainer.appendChild(bar);
      });
    }

    // Alarmlar Listesi
    const alertsContainer = document.getElementById('alertsListContainer');
    alertsContainer.innerHTML = '';
    if (alerts.length === 0) {
      alertsContainer.innerHTML = '<p class="text-sm text-gray-500 italic">Harika! Hiçbir hassas/travmatik kelime uyarısı bulunmuyor.</p>';
    } else {
      alerts.forEach(a => {
        const item = document.createElement('div');
        item.className = 'alert-item-box';
        item.innerHTML = `
          <div class="alert-item-header">
            <span class="font-bold text-red-600">🚨 ${a.studentName} - Tetikleyici Kelime: "${a.keyword}"</span>
            <span class="text-xs text-gray-400">${a.timestamp}</span>
          </div>
          <p class="text-sm text-gray-700 mt-1"><strong>Çocuğun Sorusu:</strong> "${a.childQuestion}"</p>
          <div class="alert-pedagogical-tip">
            <strong>Pedagojik Müdahale Önerisi:</strong> ${a.recommendation}
          </div>
        `;
        alertsContainer.appendChild(item);
      });
    }

    // Model Seçiciyi Güncelle
    const modelSelector = document.getElementById('modelSelector');
    modelSelector.innerHTML = '';
    window.ollamaClient.availableModels.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.name;
      opt.text = `${m.name} (${(m.size / 1024 / 1024 / 1024).toFixed(1)} GB)`;
      if (m.name === window.ollamaClient.selectedModel) opt.selected = true;
      modelSelector.appendChild(opt);
    });

    // Ollama durum göstergesi (sadece varsa güncelle)
    const statusBadge = document.getElementById('ollamaStatusBadge');
    if (statusBadge) {
      if (window.ollamaClient.availableModels.length > 0) {
        statusBadge.innerText = '● Ollama Çevrim Dışı Hazır';
        statusBadge.className = 'inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700';
      } else {
        statusBadge.innerText = '○ Ollama Bağlantısı Aranıyor...';
        statusBadge.className = 'inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700';
      }
    }

    // ── Piper Nöral TTS Durum Rozeti & Model Seçici ───────────
    this._updateTtsBadge();
    const piperSelector = document.getElementById('piperModelSelector');
    if (piperSelector) {
      piperSelector.value = localStorage.getItem('bilgi_kasifi_piper_model') || 'tr_TR-fahrettin-medium';
    }

    // ── Yedek Ses Seçiciyi Doldur ─────────────────────────────
    this._fillVoiceSelector();

    // Pitch/Rate slider başlangıç değerlerini yükle
    const pitchSlider = document.getElementById('pitchSlider');
    const rateSlider  = document.getElementById('rateSlider');
    if (pitchSlider) {
      const p = localStorage.getItem('bilgi_kasifi_pitch') || '1.3';
      pitchSlider.value = p;
      document.getElementById('pitchVal').innerText = parseFloat(p).toFixed(2);
    }
    if (rateSlider) {
      const r = localStorage.getItem('bilgi_kasifi_rate') || '1.0';
      rateSlider.value = r;
      document.getElementById('rateVal').innerText = parseFloat(r).toFixed(2);
    }
  }

  // ── Yardımcı: Ses dropdown'unu Web Speech API'den doldur ───
  _fillVoiceSelector() {
    const voiceSelector = document.getElementById('voiceSelector');
    if (!voiceSelector) return;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return; // async henüz hazır değil, voiceschanged gelince tekrar çağrılır

    const savedVoice = localStorage.getItem('bilgi_kasifi_voice_name');
    voiceSelector.innerHTML = '';

    // Fahrettin Türkçe nöral sesini listenin en başına al
    const trVoices = voices
      .filter(v => v.lang.startsWith('tr'))
      .sort((a, b) => {
        const aFahrettin = a.name.toLowerCase().includes('fahrettin') ? -1 : 0;
        const bFahrettin = b.name.toLowerCase().includes('fahrettin') ? -1 : 0;
        return aFahrettin - bFahrettin;
      });
    const otherVoices = voices.filter(v => !v.lang.startsWith('tr'));

    const addGroup = (label, list) => {
      if (list.length === 0) return;
      const grp = document.createElement('optgroup');
      grp.label = label;
      list.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.name;
        opt.text  = `${v.name} (${v.lang})${v.localService ? ' 📥' : ' ☁️'}`;
        if (v.name === savedVoice) opt.selected = true;
        grp.appendChild(opt);
      });
      voiceSelector.appendChild(grp);
    };

    addGroup('🇹🇷 Türkçe Sesler', trVoices);
    addGroup('🌍 Diğer Sesler', otherVoices);

    // Fahrettin Türkçe nöral sesini ana varsayılan ses olarak seç
    const fahrettinVoice = trVoices.find(v => v.name.toLowerCase().includes('fahrettin'));
    if (fahrettinVoice && (!savedVoice || !savedVoice.toLowerCase().includes('fahrettin'))) {
      voiceSelector.value = fahrettinVoice.name;
      localStorage.setItem('bilgi_kasifi_voice_name', fahrettinVoice.name);
    } else if (!savedVoice && trVoices.length > 0) {
      const best = fahrettinVoice
                || trVoices.find(v => v.name.toLowerCase().includes('google'))
                || trVoices.find(v => !v.name.toLowerCase().includes('tolga') && v.localService)
                || trVoices[0];
      voiceSelector.value = best.name;
      localStorage.setItem('bilgi_kasifi_voice_name', best.name);
    }
  }
}

window.teacherDashboard = new TeacherDashboard();
