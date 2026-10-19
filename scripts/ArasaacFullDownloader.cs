using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Script.Serialization;

namespace BilgiKasifiArasaac
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.OutputEncoding = Encoding.UTF8;
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
            ServicePointManager.DefaultConnectionLimit = 60;
            ServicePointManager.Expect100Continue = false;

            string baseDir = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ".."));
            string arasaacDir = Path.Combine(baseDir, "assets", "arasaac");
            Directory.CreateDirectory(arasaacDir);

            string[] catalogUrls = new string[]
            {
                "https://api.arasaac.org/api/pictograms/all/tr",
                "https://api.arasaac.org/v1/pictograms/all/tr"
            };

            string catalogJson = null;
            foreach (var url in catalogUrls)
            {
                try
                {
                    Console.WriteLine("[ARASAAC] Tam Türkçe katalog çekiliyor: " + url);
                    using (var wc = new WebClient())
                    {
                        wc.Encoding = Encoding.UTF8;
                        wc.Headers.Add("User-Agent", "BilgiKasifi/2.0");
                        catalogJson = wc.DownloadString(url);
                        if (!string.IsNullOrEmpty(catalogJson) && catalogJson.Length > 1000)
                        {
                            break;
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("[Uyarı] " + url + " denemesi: " + ex.Message);
                }
            }

            if (string.IsNullOrEmpty(catalogJson))
            {
                Console.Error.WriteLine("HATA: ARASAAC Türkçe kataloğu indirilemedi!");
                Environment.Exit(1);
            }

            var serializer = new JavaScriptSerializer { MaxJsonLength = int.MaxValue };
            var catalog = serializer.Deserialize<ArrayList>(catalogJson);
            Console.WriteLine("[ARASAAC] Katalog başarıyla alındı. Toplam kayıt: " + catalog.Count);

            var trCulture = CultureInfo.GetCultureInfo("tr-TR");
            var indexMap = new Dictionary<string, string>(StringComparer.Ordinal);
            var allPids = new List<int>();
            var seenPids = new HashSet<int>();

            foreach (Dictionary<string, object> item in catalog)
            {
                if (!item.ContainsKey("_id") || item["_id"] == null) continue;
                int pid = Convert.ToInt32(item["_id"]);

                if (!seenPids.Contains(pid))
                {
                    seenPids.Add(pid);
                    allPids.Add(pid);
                }

                string fileName = pid.ToString() + ".png";
                if (item.ContainsKey("keywords") && item["keywords"] is ArrayList)
                {
                    var keywords = (ArrayList)item["keywords"];
                    foreach (Dictionary<string, object> kwObj in keywords)
                    {
                        if (kwObj.ContainsKey("keyword") && kwObj["keyword"] != null)
                        {
                            string kw = NormalizeTr(kwObj["keyword"].ToString(), trCulture);
                            if (kw.Length > 0 && !indexMap.ContainsKey(kw))
                            {
                                indexMap[kw] = fileName;
                            }
                        }
                        if (kwObj.ContainsKey("plural") && kwObj["plural"] != null)
                        {
                            string plural = NormalizeTr(kwObj["plural"].ToString(), trCulture);
                            if (plural.Length > 0 && !indexMap.ContainsKey(plural))
                            {
                                indexMap[plural] = fileName;
                            }
                        }
                    }
                }
            }

            // Sık kullanılan pedagojik eş anlamlıları da garanti altına al
            if (indexMap.ContainsKey("dinozor") && !indexMap.ContainsKey("t-rex"))
                indexMap["t-rex"] = indexMap["dinozor"];

            // JSON ve JS indeks dosyalarını hemen diske yaz
            var sbJson = new StringBuilder(indexMap.Count * 32);
            sbJson.Append("{");
            bool first = true;
            foreach (var kvp in indexMap)
            {
                if (!first) sbJson.Append(",");
                first = false;
                sbJson.Append("\"")
                      .Append(EscapeJson(kvp.Key))
                      .Append("\":\"")
                      .Append(EscapeJson(kvp.Value))
                      .Append("\"");
            }
            sbJson.Append("}");

            string indexJsonPath = Path.Combine(arasaacDir, "arasaac_tr_index.json");
            string indexJsPath = Path.Combine(arasaacDir, "arasaac_tr_index.js");
            var utf8NoBom = new UTF8Encoding(false);

            File.WriteAllText(indexJsonPath, sbJson.ToString(), utf8NoBom);
            File.WriteAllText(indexJsPath, "window.ARASAAC_FULL_INDEX = " + sbJson.ToString() + ";\n", utf8NoBom);

            Console.WriteLine(string.Format("[İndeks Hazır] {0} Türkçe anahtar kelime ve çoğul/eş anlamlı '{1}' dosyasına kaydedildi!", indexMap.Count, indexJsonPath));

            int total = allPids.Count;
            int completed = 0;
            int newlyDownloaded = 0;
            int skippedExisting = 0;

            Console.WriteLine(string.Format("[İndirme Başladı] Toplam {0} benzersiz ARASAAC piktogramı 25 paralel kanal ile indiriliyor...", total));

            var parallelOptions = new ParallelOptions { MaxDegreeOfParallelism = 25 };
            Parallel.ForEach(allPids, parallelOptions, pid =>
            {
                string outFile = Path.Combine(arasaacDir, pid.ToString() + ".png");
                bool existed = false;
                if (File.Exists(outFile))
                {
                    var fi = new FileInfo(outFile);
                    if (fi.Length > 100)
                    {
                        existed = true;
                    }
                }

                if (existed)
                {
                    Interlocked.Increment(ref skippedExisting);
                }
                else
                {
                    string imgUrl = string.Format("https://static.arasaac.org/pictograms/{0}/{0}_300.png", pid);
                    for (int attempt = 0; attempt < 3; attempt++)
                    {
                        try
                        {
                            var req = (HttpWebRequest)WebRequest.Create(imgUrl);
                            req.UserAgent = "BilgiKasifi/2.0";
                            req.Timeout = 20000;
                            req.ReadWriteTimeout = 20000;
                            req.KeepAlive = true;

                            using (var resp = (HttpWebResponse)req.GetResponse())
                            using (var stream = resp.GetResponseStream())
                            using (var ms = new MemoryStream())
                            {
                                byte[] buffer = new byte[8192];
                                int read;
                                while ((read = stream.Read(buffer, 0, buffer.Length)) > 0)
                                {
                                    ms.Write(buffer, 0, read);
                                }
                                byte[] bytes = ms.ToArray();
                                if (bytes.Length > 100)
                                {
                                    File.WriteAllBytes(outFile, bytes);
                                    Interlocked.Increment(ref newlyDownloaded);
                                    break;
                                }
                            }
                        }
                        catch
                        {
                            Thread.Sleep(100 * (attempt + 1));
                        }
                    }
                }

                int curr = Interlocked.Increment(ref completed);
                if (curr % 500 == 0 || curr == total)
                {
                    Console.WriteLine(string.Format("[İlerleme] {0} / {1} piktogram indirildi... (Yeni: {2}, Mevcut Atlanan: {3})", curr, total, newlyDownloaded, skippedExisting));
                }
            });

            Console.WriteLine(string.Format("[TAMAMLANDI] Toplam {0} piktogram ve {1} Türkçe anahtar kelime arşivlendi!", total, indexMap.Count));
        }

        static string NormalizeTr(string input, CultureInfo trCulture)
        {
            if (string.IsNullOrWhiteSpace(input)) return "";
            return input.Trim().ToLower(trCulture);
        }

        static string EscapeJson(string s)
        {
            return s.Replace("\\", "\\\\").Replace("\"", "\\\"");
        }
    }
}
