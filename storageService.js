// ============================================================
// Çevrim Dışı Veri Depolama ve JASP / CSV Dışa Aktarma Servisi
// ============================================================

const STORAGE_KEYS = {
  STUDENTS: 'bilgi_kasifi_students',
  SESSIONS: 'bilgi_kasifi_sessions',
  ALERTS: 'bilgi_kasifi_alerts',
  ACTIVE_STUDENT: 'bilgi_kasifi_active_student',
  TRANSCRIPTS: 'bilgiKasifi_transcripts'
};

class StorageService {
  constructor() {
    this.initDefaultData();
  }

  initDefaultData() {
    if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
      const defaultStudents = [
        { id: 'std_1', name: 'Ahmet (Kaptan)', group: 'Deney', score: 25, stars: 5, topics: { 'Dinozorlar': 4, 'Uzay ve Gökyüzü': 2 }, questionsCount: 6 },
        { id: 'std_2', name: 'Zeynep (Kaptan)', group: 'Deney', score: 45, stars: 9, topics: { 'Doğa ve Hava': 5, 'Bitkiler ve Çiçekler': 3 }, questionsCount: 8 },
        { id: 'std_3', name: 'Mehmet (Kaptan)', group: 'Kontrol', score: 10, stars: 2, topics: { 'Hayvanlar Alemi': 3 }, questionsCount: 3 }
      ];
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(defaultStudents));
    }

    if (!localStorage.getItem(STORAGE_KEYS.ALERTS)) {
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify([]));
    }

    if (!localStorage.getItem(STORAGE_KEYS.TRANSCRIPTS)) {
      localStorage.setItem(STORAGE_KEYS.TRANSCRIPTS, JSON.stringify({}));
    }
  }

  getStudents() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
  }

  saveStudents(students) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }

  getOrCreateStudent(name, group = 'Deney') {
    const students = this.getStudents();
    let student = students.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (!student) {
      student = {
        id: 'std_' + Date.now(),
        name: name,
        group: group,
        score: 0,
        stars: 0,
        topics: {},
        questionsCount: 0,
        score5N1K: 0,
        scoreDeepening: 0,
        scoreMetaphor: 0,
        scoreCourtesy: 0,
        createdAt: new Date().toISOString()
      };
      students.push(student);
      this.saveStudents(students);
    }
    return student;
  }

  updateStudentStats(studentId, scoreDelta, scoringDetails, topic) {
    const students = this.getStudents();
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    student.score = (student.score || 0) + scoreDelta;
    student.stars = Math.floor(student.score / 5);
    student.questionsCount = (student.questionsCount || 0) + 1;

    // Ayrıntılı pedagojik metrikler (JASP analizi için)
    if (!student.score5N1K) student.score5N1K = 0;
    if (!student.scoreDeepening) student.scoreDeepening = 0;
    if (!student.scoreMetaphor) student.scoreMetaphor = 0;
    if (!student.scoreCourtesy) student.scoreCourtesy = 0;

    scoringDetails.forEach(d => {
      if (d.type === '5N1K') student.score5N1K += d.points;
      if (d.type === 'DEEPENING') student.scoreDeepening += d.points;
      if (d.type === 'METAPHOR') student.scoreMetaphor += d.points;
      if (d.type === 'COURTESY') student.scoreCourtesy += d.points;
    });

    if (topic) {
      if (!student.topics) student.topics = {};
      student.topics[topic] = (student.topics[topic] || 0) + 1;
    }

    this.saveStudents(students);
  }

  // Kalıcı Konuşma Transkripti Kaydı (Sayfa yenilense bile kaybolmaz)
  saveTranscriptEntry(studentId, { timestamp, role, text, topic = '-', scoreDelta = 0, triggeredRules = '-' }) {
    if (!studentId || !text) return;
    const allTranscripts = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSCRIPTS) || '{}');
    if (!Array.isArray(allTranscripts[studentId])) {
      allTranscripts[studentId] = [];
    }

    allTranscripts[studentId].push({
      timestamp: timestamp || new Date().toLocaleString('tr-TR'),
      role: role,
      text: text,
      topic: topic,
      scoreDelta: scoreDelta,
      triggeredRules: Array.isArray(triggeredRules) ? triggeredRules.join(' | ') : (triggeredRules || '-')
    });

    localStorage.setItem(STORAGE_KEYS.TRANSCRIPTS, JSON.stringify(allTranscripts));
  }

  getTranscripts(studentId = null) {
    const allTranscripts = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSCRIPTS) || '{}');
    if (studentId) {
      return allTranscripts[studentId] || [];
    }
    return allTranscripts;
  }

  saveAlert(studentName, keyword, childQuestion, recommendation) {
    const alerts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ALERTS) || '[]');
    alerts.unshift({
      id: 'alt_' + Date.now(),
      studentName: studentName,
      keyword: keyword,
      childQuestion: childQuestion,
      recommendation: recommendation,
      timestamp: new Date().toLocaleString('tr-TR')
    });
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
  }

  getAlerts() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ALERTS) || '[]');
  }

  clearAlerts() {
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify([]));
  }

  // JASP ve SPSS İçin Nicel CSV Dışa Aktarma (Anonimleştirilmiş KVKK Uyumlu)
  exportToJASP_CSV() {
    const students = this.getStudents();
    const alerts = this.getAlerts();

    // CSV Başlıkları
    let csv = 'Ogrenci_Kodu,Grup,Toplam_Soru,Puan_5N1K,Baglamsal_Derinlesme,Metafor_Yasanti,Nezaket,Toplam_Puan,Rozet_Seviyesi,Kavram_Yanilgisi_Sayisi,Baskin_Ilgi_Alani\n';

    students.forEach((s, idx) => {
      // KVKK uyumlu maskeleme
      const code = `KOD_${s.group === 'Deney' ? 'D' : 'K'}_${idx + 1}`;
      
      // En çok konuşulan konu
      let topTopic = 'Belirsiz';
      let maxCount = -1;
      if (s.topics) {
        for (const [top, cnt] of Object.entries(s.topics)) {
          if (cnt > maxCount) {
            maxCount = cnt;
            topTopic = top;
          }
        }
      }

      // Bu öğrenciye ait alarm/yanılgı sayısı
      const alertCount = alerts.filter(a => a.studentName === s.name).length;

      // Rozet seviyesi
      const badgeLevel = s.score >= 150 ? 3 : (s.score >= 50 ? 2 : 1);

      csv += `${code},${s.group || 'Deney'},${s.questionsCount || 0},${s.score5N1K || 0},${s.scoreDeepening || 0},${s.scoreMetaphor || 0},${s.scoreCourtesy || 0},${s.score || 0},${badgeLevel},${alertCount},"${topTopic}"\n`;
    });

    // UTF-8 BOM ekle ki Excel ve JASP Türkçe karakterleri (ş, ğ, ı, ö, ü) düzgün okusun
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Tez_Verisi_JASP_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Tam Konuşma Dökümünü İndir (JSON - UTF-8 BOM Destekli)
  exportTranscriptsJSON() {
    const students = this.getStudents();
    const allTranscripts = this.getTranscripts();
    const exportPayload = {
      exportDate: new Date().toLocaleString('tr-TR'),
      project: 'Bilgi Kaşifi - Yapay Zekâ Destekli İlgi Merkezi',
      students: students.map((s, idx) => ({
        studentCode: `KOD_${s.group === 'Deney' ? 'D' : 'K'}_${idx + 1}`,
        studentName: s.name,
        group: s.group || 'Deney',
        totalScore: s.score || 0,
        transcript: allTranscripts[s.id] || []
      }))
    };

    const jsonStr = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob(['\uFEFF' + jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Tam_Konusma_Dokumu_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Nitel Analiz Transkriptini İndir (CSV - Sütunlar: OgrenciKodu, ZamanDamgasi, Konusan, Metin, TespitEdilenKonu, KazanilanPuan, TetiklenenKural)
  exportTranscriptsCSV() {
    const students = this.getStudents();
    const allTranscripts = this.getTranscripts();

    let csv = 'OgrenciKodu,ZamanDamgasi,Konusan,Metin,TespitEdilenKonu,KazanilanPuan,TetiklenenKural\n';

    students.forEach((s, idx) => {
      const code = `KOD_${s.group === 'Deney' ? 'D' : 'K'}_${idx + 1}`;
      const entries = allTranscripts[s.id] || [];

      entries.forEach(entry => {
        const cleanText = String(entry.text || '').replace(/"/g, '""').replace(/\r?\n/g, ' ');
        const cleanTopic = String(entry.topic || '-').replace(/"/g, '""');
        const cleanRules = String(entry.triggeredRules || '-').replace(/"/g, '""');
        const cleanTime = String(entry.timestamp || '').replace(/"/g, '""');
        const speaker = String(entry.role || '').replace(/"/g, '""');
        const pts = entry.scoreDelta !== undefined ? entry.scoreDelta : 0;

        csv += `${code},"${cleanTime}","${speaker}","${cleanText}","${cleanTopic}",${pts},"${cleanRules}"\n`;
      });
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Nitel_Analiz_Transkripti_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

window.storageService = new StorageService();
