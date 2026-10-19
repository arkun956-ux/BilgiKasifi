// ============================================================
// Çevrim Dışı Ollama İstemcisi ve Gerçek Zamanlı Streaming Motoru
// ============================================================

class OllamaClient {
  constructor() {
    this.baseUrl = 'http://127.0.0.1:11434';
    this.selectedModel = 'gemma4:latest';
    this.availableModels = [];
    this.isGenerating = false;
    this.abortController = null;
    this.init();
  }

  async init() {
    try {
      await this.refreshModels();
      // Seçili modeli arka planda bellekte ısıt (ilk soru beklemesin)
      this.warmupModel();
    } catch (err) {
      console.warn('Ollama ilk bağlantı denemesi:', err);
    }
  }

  // Modeli arka planda RAM'e yükle ve sıcak tut
  async warmupModel() {
    try {
      await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.selectedModel,
          think: false,
          keep_alive: -1,
          messages: [{ role: 'user', content: 'Merhaba' }],
          stream: false,
          options: {
            temperature: 0.35,
            top_p: 0.85,
            top_k: 25,
            repeat_penalty: 1.18,
            num_ctx: 2048,
            num_predict: 5
          }
        })
      });
    } catch (e) {
      // İlk ısınma hatası kritik değil
    }
  }

  // Yüklü modelleri listele
  async refreshModels() {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.availableModels = data.models || [];
      
      // Eski bozuk Türkçe modelli kayıt varsa temizle, v2 tercihini oku
      localStorage.removeItem('bilgi_kasifi_selected_model');
      const savedModel = localStorage.getItem('bilgi_kasifi_model_v2');
      if (savedModel && this.availableModels.some(m => m.name === savedModel)) {
        this.selectedModel = savedModel;
        return this.availableModels;
      }
      
      // Tercih sırası: gemma4 (Kusursuz İstanbul Türkçesi + think:false & num_ctx:2048 ile 4 saniyede yanıt!) -> gemma -> gemma2 -> qwen2.5
      const gemma4  = this.availableModels.find(m => m.name.includes('gemma4'));
      const gemma   = this.availableModels.find(m => m.name === 'gemma:latest');
      const gemma2  = this.availableModels.find(m => m.name.includes('gemma2'));
      const qwen25  = this.availableModels.find(m => m.name.includes('qwen2.5'));
      
      if (gemma4) {
        this.selectedModel = gemma4.name;
      } else if (gemma) {
        this.selectedModel = gemma.name;
      } else if (gemma2) {
        this.selectedModel = gemma2.name;
      } else if (qwen25) {
        this.selectedModel = qwen25.name;
      } else if (this.availableModels.length > 0) {
        this.selectedModel = this.availableModels[0].name;
      }
      return this.availableModels;
    } catch (error) {
      console.error('Ollama modelleri alınamadı:', error);
      return [];
    }
  }

  // Gerçek Zamanlı Akış (Streaming) ile Sokratik veya Veda Cevabı Üretme
  async streamChat({ messages, isFarewell = false, farewellIntent = null, onToken, onSentenceComplete, onDone, onError }) {
    if (this.isGenerating && this.abortController) {
      this.abortController.abort();
    }

    this.isGenerating = true;
    this.abortController = new AbortController();

    try {
      const payload = {
        model: this.selectedModel,
        messages: messages,
        stream: true,
        think: false, // Gemma 4'ün 30 saniyelik içsel düşünme (reasoning) gecikmesini kapatır!
        keep_alive: -1, // Modeli bellekte sıcak tut
        options: {
          temperature: 0.35,
          top_p: 0.85,
          top_k: 25,
          repeat_penalty: 1.18,
          num_ctx: 2048, // GTX 1650 VRAM'ine sığması için bağlam penceresi optimizasyonu (4 sn yanıt hızı!)
          num_predict: isFarewell ? 120 : 260 // Veda modunda 1-2 tatlı cümle, normal modda 2-3 tam kurallı cümle
        }
      };

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`Ollama Hatası: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';
      let sentenceBuffer = '';
      let ndjsonBuffer = '';
      let doneHandled = false;

      const flushRemainingBuffer = () => {
        if (doneHandled) return;
        doneHandled = true;

        let remaining = sentenceBuffer.trim();
        if (remaining.length > 0) {
          // Cümle sonlandırma işareti (., !, ?) henüz gelmemişse sonuna uygun noktalama ekle
          if (!/[.!?]$/.test(remaining)) {
            const isQuestion = !isFarewell && /(?:sence|acaba|neden|nasıl|hangisi|nerede|ne zaman|\bmı\b|\bmi\b|\bmu\b|\bmü\b|\bmıdır\b|\bmidir\b)/i.test(remaining);
            const endPunct = isQuestion ? '?' : '.';
            remaining += endPunct;
            fullText = fullText.trimEnd() + endPunct;
          }
          if (onSentenceComplete) {
            const cleanedSentence = window.pedagogicalEngine
              ? window.pedagogicalEngine.cleanResponse(remaining, isFarewell, farewellIntent)
              : remaining;
            if (cleanedSentence) {
              onSentenceComplete(cleanedSentence);
            }
          }
          sentenceBuffer = '';
        }

        const cleanedFull = window.pedagogicalEngine
          ? window.pedagogicalEngine.cleanResponse(fullText, isFarewell, farewellIntent)
          : fullText;
        if (onDone) onDone(cleanedFull);
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          ndjsonBuffer += decoder.decode();
          break;
        }

        ndjsonBuffer += decoder.decode(value, { stream: true });
        const lines = ndjsonBuffer.split('\n');
        ndjsonBuffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.message && parsed.message.content) {
              const token = parsed.message.content;
              fullText += token;
              sentenceBuffer += token;

              if (onToken) onToken(token, fullText);

              // Cümle tamamlandıysa yalnızca biten cümleyi ayır, sonraki cümlenin ilk kelimesini arabellekte koru
              if (/[.!?\n]/.test(token) && sentenceBuffer.trim().length > 32) {
                const match = sentenceBuffer.match(/^([\s\S]+?[.!?]+)(?:\s+|$)([\s\S]*)$/);
                if (match && match[1].trim().length > 32) {
                  const completedPart = match[1].trim();
                  sentenceBuffer = match[2] || '';
                  if (onSentenceComplete) {
                    const cleanedSentence = window.pedagogicalEngine
                      ? window.pedagogicalEngine.cleanResponse(completedPart, isFarewell, farewellIntent)
                      : completedPart;
                    if (cleanedSentence) {
                      onSentenceComplete(cleanedSentence);
                    }
                  }
                }
              }
            }

            if (parsed.done) {
              flushRemainingBuffer();
            }
          } catch (e) {
            // Tamamlanmamış JSON satırı varsa sonraki pakette birleşir
          }
        }
      }

      // Akış kapandığında son satır veya kalan arabellek varsa temizle ve seslendir
      if (ndjsonBuffer.trim()) {
        try {
          const parsed = JSON.parse(ndjsonBuffer.trim());
          if (parsed.message && parsed.message.content) {
            fullText += parsed.message.content;
            sentenceBuffer += parsed.message.content;
            if (onToken) onToken(parsed.message.content, fullText);
          }
        } catch (e) {}
      }
      flushRemainingBuffer();
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('İstek iptal edildi.');
      } else {
        console.error('Ollama stream hatası:', error);
        if (onError) onError(error);
      }
    } finally {
      this.isGenerating = false;
      this.abortController = null;
    }
  }

  stop() {
    if (this.abortController) {
      this.abortController.abort();
      this.isGenerating = false;
    }
  }
}

window.ollamaClient = new OllamaClient();
