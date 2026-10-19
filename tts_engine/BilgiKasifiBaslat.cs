using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;

namespace BilgiKasifiLauncher
{
    class Program
    {
        static bool IsServerUp()
        {
            try
            {
                var req = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:5005/status");
                req.Timeout = 400;
                using (var res = (HttpWebResponse)req.GetResponse())
                {
                    return res.StatusCode == HttpStatusCode.OK;
                }
            }
            catch
            {
                return false;
            }
        }

        static void Main(string[] args)
        {
            string appDir = @"C:\Users\90507\Desktop\BilgiKasifi_Uygulamasi";
            string ttsDir = Path.Combine(appDir, "tts_engine");
            string piperServerExe = Path.Combine(ttsDir, "piper_server.exe");

            // 1. Piper Noral TTS & Yerel Web Sunucusu calismiyorsa hemen baslat
            if (!IsServerUp() && File.Exists(piperServerExe))
            {
                try
                {
                    var psi = new ProcessStartInfo
                    {
                        FileName = piperServerExe,
                        WorkingDirectory = ttsDir,
                        UseShellExecute = false,
                        CreateNoWindow = true,
                        WindowStyle = ProcessWindowStyle.Hidden
                    };
                    Process.Start(psi);
                }
                catch { }

                // Sunucunun port 5005'i acmasini bekle (maksimum 3 saniye)
                for (int i = 0; i < 35; i++)
                {
                    if (IsServerUp()) break;
                    Thread.Sleep(85);
                }
            }

            // 2. Ollama calismiyorsa arka planda baslat
            try
            {
                if (Process.GetProcessesByName("ollama").Length == 0)
                {
                    string ollamaExe = Path.Combine(
                        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                        @"Programs\Ollama\ollama.exe"
                    );
                    if (File.Exists(ollamaExe))
                    {
                        var ollamaPsi = new ProcessStartInfo
                        {
                            FileName = ollamaExe,
                            Arguments = "serve",
                            UseShellExecute = false,
                            CreateNoWindow = true,
                            WindowStyle = ProcessWindowStyle.Hidden
                        };
                        Process.Start(ollamaPsi);
                    }
                }
            }
            catch { }

            // 3. Tarayicida Bilgi Kasifi'ni ac (127.0.0.1:5005 hazirsa localhost, degilse index.html)
            string targetUrl = IsServerUp()
                ? "http://127.0.0.1:5005/index.html"
                : Path.Combine(appDir, "index.html");

            string[] chromePaths = new string[]
            {
                @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
                @"C:\Program Files\Google\Chrome\Application\chrome.exe",
                @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                @"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
            };

            string kioskDir = Path.Combine(Path.GetTempPath(), "BilgiKasifiKiosk");
            string kioskArgs = string.Format("--app=\"{0}\" --start-fullscreen --kiosk --user-data-dir=\"{1}\" --no-first-run --disable-pinch --use-fake-ui-for-media-stream", targetUrl, kioskDir);

            foreach (string browser in chromePaths)
            {
                if (File.Exists(browser))
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = browser,
                        Arguments = kioskArgs,
                        UseShellExecute = true
                    });
                    return;
                }
            }

            Process.Start(new ProcessStartInfo
            {
                FileName = targetUrl,
                UseShellExecute = true
            });
        }
    }
}
