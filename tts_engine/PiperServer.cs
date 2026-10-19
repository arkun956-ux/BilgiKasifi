using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;

namespace BilgiKasifiTTS
{
    class PersistentPiperWorker : IDisposable
    {
        private Process _proc;
        private StreamWriter _stdin;
        private StreamReader _stdout;
        private readonly string _piperExe;
        private readonly string _modelPath;
        private readonly object _lock = new object();

        public string ModelName { get; private set; }

        public PersistentPiperWorker(string piperExe, string modelPath, string modelName)
        {
            _piperExe = piperExe;
            _modelPath = modelPath;
            ModelName = modelName;
            StartProcess();
        }

        private void StartProcess()
        {
            var psi = new ProcessStartInfo
            {
                FileName = _piperExe,
                Arguments = string.Format("--model \"{0}\" --length_scale 1.06 --noise_scale 0.65 --noise_w 0.8 --json-input", _modelPath),
                WorkingDirectory = Path.GetDirectoryName(_piperExe),
                UseShellExecute = false,
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true,
                StandardOutputEncoding = Encoding.UTF8
            };

            _proc = new Process { StartInfo = psi };
            _proc.ErrorDataReceived += (s, e) => { /* stderr loglarini yut */ };
            _proc.Start();
            _proc.BeginErrorReadLine();

            // UTF-8 BOM olmadan yaz ki piper JSON parser hata vermesin
            _stdin = new StreamWriter(_proc.StandardInput.BaseStream, new UTF8Encoding(false))
            {
                AutoFlush = true
            };
            _stdout = _proc.StandardOutput;
        }

        public byte[] Synthesize(string text, string tempDir)
        {
            lock (_lock)
            {
                if (_proc == null || _proc.HasExited)
                {
                    StartProcess();
                }

                string wavFile = Path.Combine(tempDir, "tts_" + Guid.NewGuid().ToString("N") + ".wav");
                string escapedText = EscapeJsonString(text);
                string escapedPath = EscapeJsonString(wavFile);

                string jsonLine = string.Format("{{\"text\":\"{0}\",\"output_file\":\"{1}\"}}", escapedText, escapedPath);
                _stdin.WriteLine(jsonLine);

                // Piper --json-input modunda her sentez bittiginde stdout'a dosya yolunu basar
                string outLine = _stdout.ReadLine();
                if (outLine == null)
                {
                    throw new Exception("Piper sureci beklenmedik sekilde kapandi.");
                }

                // Dosyanin tam yazildigindan emin ol
                int retries = 0;
                while (!File.Exists(wavFile) && retries < 50)
                {
                    Thread.Sleep(10);
                    retries++;
                }

                if (!File.Exists(wavFile))
                {
                    throw new FileNotFoundException("Sentezlenen WAV dosyasi bulunamadi.", wavFile);
                }

                byte[] audioBytes = File.ReadAllBytes(wavFile);
                try { File.Delete(wavFile); } catch { }
                return audioBytes;
            }
        }

        private static string EscapeJsonString(string str)
        {
            if (string.IsNullOrEmpty(str)) return "";
            var sb = new StringBuilder(str.Length + 16);
            foreach (char c in str)
            {
                switch (c)
                {
                    case '\\': sb.Append("\\\\"); break;
                    case '\"': sb.Append("\\\""); break;
                    case '\r': sb.Append(" "); break;
                    case '\n': sb.Append(" "); break;
                    case '\t': sb.Append(" "); break;
                    default:
                        if (c < 32) sb.Append(' ');
                        else sb.Append(c);
                        break;
                }
            }
            return sb.ToString();
        }

        public void Dispose()
        {
            try
            {
                if (_proc != null && !_proc.HasExited)
                {
                    _proc.Kill();
                }
            }
            catch { }
        }
    }

    class Program
    {
        private static string _baseDir;
        private static string _webRootDir;
        private static string _piperExe;
        private static string _tempDir;
        private static string _activeModel = "tr_TR-fahrettin-medium";
        private static Dictionary<string, PersistentPiperWorker> _workers = new Dictionary<string, PersistentPiperWorker>();
        private static readonly object _workerLock = new object();

        static PersistentPiperWorker GetOrCreateWorker(string modelName)
        {
            lock (_workerLock)
            {
                if (string.IsNullOrEmpty(modelName)) modelName = _activeModel;
                string modelPath = Path.Combine(_baseDir, modelName + ".onnx");
                if (!File.Exists(modelPath))
                {
                    modelName = "tr_TR-fahrettin-medium";
                    modelPath = Path.Combine(_baseDir, modelName + ".onnx");
                }

                if (!_workers.ContainsKey(modelName))
                {
                    Console.WriteLine("[Piper TTS] Model bellege yukleniyor: " + modelName);
                    var worker = new PersistentPiperWorker(_piperExe, modelPath, modelName);
                    // Ilk isinma (Warmup) sentezi
                    try { worker.Synthesize("Merhaba", _tempDir); } catch { }
                    _workers[modelName] = worker;
                    Console.WriteLine("[Piper TTS] Model hazir ve sicak: " + modelName);
                }

                _activeModel = modelName;
                return _workers[modelName];
            }
        }

        static void Main(string[] args)
        {
            _baseDir = AppDomain.CurrentDomain.BaseDirectory;
            _webRootDir = Path.GetFullPath(Path.Combine(_baseDir, ".."));
            _piperExe = Path.Combine(_baseDir, "piper", "piper.exe");
            _tempDir = Path.Combine(_baseDir, "temp_wav");
            Directory.CreateDirectory(_tempDir);

            int port = 5005;
            var listener = new HttpListener();
            listener.Prefixes.Add("http://127.0.0.1:" + port + "/");
            listener.Prefixes.Add("http://localhost:" + port + "/");

            try
            {
                listener.Start();
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("Port 5005 dinlenemedi (Zaten calisiyor olabilir): " + ex.Message);
                return;
            }

            Console.WriteLine("====================================================");
            Console.WriteLine(" Bilgi Kasifi - Piper Noral TTS & Web Sunucusu (5005)");
            Console.WriteLine("====================================================");

            // Varsayilan modeli (Fahrettin) arka planda isit ki HTTP sunucusu 0ms icinde yanit versin
            ThreadPool.QueueUserWorkItem(_ =>
            {
                try { GetOrCreateWorker(_activeModel); } catch { }
            });

            while (listener.IsListening)
            {
                try
                {
                    var context = listener.GetContext();
                    ThreadPool.QueueUserWorkItem(o => HandleRequest((HttpListenerContext)o), context);
                }
                catch (Exception)
                {
                    break;
                }
            }
        }

        static void HandleRequest(HttpListenerContext ctx)
        {
            var req = ctx.Request;
            var res = ctx.Response;

            // CORS ve Mikrofon Permissions-Policy basliklari
            res.Headers.Add("Access-Control-Allow-Origin", "*");
            res.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            res.Headers.Add("Access-Control-Allow-Headers", "Content-Type");
            res.Headers.Add("Permissions-Policy", "microphone=(self \"http://127.0.0.1:5005\" \"http://localhost:5005\")");

            if (req.HttpMethod == "OPTIONS")
            {
                res.StatusCode = 204;
                res.Close();
                return;
            }

            string rawPath = Uri.UnescapeDataString(req.Url.AbsolutePath);
            string path = rawPath.ToLowerInvariant();

            try
            {
                if (path == "/status" || path == "/health")
                {
                    var available = new List<string>();
                    foreach (var f in Directory.GetFiles(_baseDir, "*.onnx"))
                    {
                        var fi = new FileInfo(f);
                        if (fi.Length > 1024 * 1024) // >1MB gecerli ONNX modeli
                        {
                            available.Add(Path.GetFileNameWithoutExtension(f));
                        }
                    }

                    string modelsJson = "[\"" + string.Join("\",\"", available.ToArray()) + "\"]";
                    string json = string.Format("{{\"status\":\"ok\",\"engine\":\"piper-neural-tts\",\"activeModel\":\"{0}\",\"models\":{1}}}", _activeModel, modelsJson);
                    byte[] buf = Encoding.UTF8.GetBytes(json);
                    res.ContentType = "application/json; charset=utf-8";
                    res.ContentLength64 = buf.Length;
                    res.OutputStream.Write(buf, 0, buf.Length);
                    res.Close();
                    return;
                }

                if (path == "/shutdown")
                {
                    byte[] buf = Encoding.UTF8.GetBytes("{\"status\":\"shutting_down\"}");
                    res.ContentType = "application/json";
                    res.OutputStream.Write(buf, 0, buf.Length);
                    res.Close();
                    foreach (var w in _workers.Values) w.Dispose();
                    Environment.Exit(0);
                    return;
                }

                if (path == "/tts")
                {
                    string text = req.QueryString["text"] ?? "";
                    string model = req.QueryString["model"] ?? "";

                    if (req.HttpMethod == "POST")
                    {
                        using (var reader = new StreamReader(req.InputStream, Encoding.UTF8))
                        {
                            string body = reader.ReadToEnd();
                            string extractedText = ExtractJsonField(body, "text");
                            string extractedModel = ExtractJsonField(body, "model");
                            if (!string.IsNullOrEmpty(extractedText)) text = extractedText;
                            if (!string.IsNullOrEmpty(extractedModel)) model = extractedModel;
                        }
                    }

                    if (string.IsNullOrWhiteSpace(text))
                    {
                        res.StatusCode = 400;
                        byte[] err = Encoding.UTF8.GetBytes("{\"error\":\"text parametresi bos\"}");
                        res.ContentType = "application/json";
                        res.OutputStream.Write(err, 0, err.Length);
                        res.Close();
                        return;
                    }

                    var sw = Stopwatch.StartNew();
                    var worker = GetOrCreateWorker(model);
                    byte[] wavBytes = worker.Synthesize(text, _tempDir);
                    sw.Stop();

                    res.StatusCode = 200;
                    res.ContentType = "audio/wav";
                    res.Headers.Add("X-Synthesis-Time-Ms", sw.ElapsedMilliseconds.ToString());
                    res.ContentLength64 = wavBytes.Length;
                    res.OutputStream.Write(wavBytes, 0, wavBytes.Length);
                    res.Close();
                    return;
                }

                // Statik Uygulama Dosyalarini Sun (http://127.0.0.1:5005/ uzerinden kalici mikrofon izni icin)
                string relPath = rawPath.TrimStart('/');
                if (string.IsNullOrEmpty(relPath)) relPath = "index.html";
                relPath = relPath.Replace('/', Path.DirectorySeparatorChar);

                string fullFilePath = Path.GetFullPath(Path.Combine(_webRootDir, relPath));
                if (fullFilePath.StartsWith(_webRootDir, StringComparison.OrdinalIgnoreCase) && File.Exists(fullFilePath))
                {
                    string ext = Path.GetExtension(fullFilePath).ToLowerInvariant();
                    string contentType = "application/octet-stream";
                    switch (ext)
                    {
                        case ".html": contentType = "text/html; charset=utf-8"; break;
                        case ".js":   contentType = "application/javascript; charset=utf-8"; break;
                        case ".css":  contentType = "text/css; charset=utf-8"; break;
                        case ".json": contentType = "application/json; charset=utf-8"; break;
                        case ".png":  contentType = "image/png"; break;
                        case ".jpg":
                        case ".jpeg": contentType = "image/jpeg"; break;
                        case ".svg":  contentType = "image/svg+xml"; break;
                        case ".wav":  contentType = "audio/wav"; break;
                        case ".ico":  contentType = "image/x-icon"; break;
                    }

                    byte[] fileBytes = File.ReadAllBytes(fullFilePath);
                    res.StatusCode = 200;
                    res.ContentType = contentType;
                    res.ContentLength64 = fileBytes.Length;
                    res.OutputStream.Write(fileBytes, 0, fileBytes.Length);
                    res.Close();
                    return;
                }

                res.StatusCode = 404;
                res.Close();
            }
            catch (Exception ex)
            {
                try
                {
                    res.StatusCode = 500;
                    byte[] err = Encoding.UTF8.GetBytes("{\"error\":\"" + ex.Message.Replace("\"", "'") + "\"}");
                    res.ContentType = "application/json";
                    res.OutputStream.Write(err, 0, err.Length);
                    res.Close();
                }
                catch { }
            }
        }

        static string ExtractJsonField(string json, string fieldName)
        {
            if (string.IsNullOrEmpty(json)) return "";
            var match = Regex.Match(json, "\"" + fieldName + "\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"");
            if (match.Success)
            {
                return Regex.Unescape(match.Groups[1].Value);
            }
            return "";
        }
    }
}
