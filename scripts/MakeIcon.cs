using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Collections.Generic;

class MakeIcon
{
    static void Main()
    {
        string inputPath = @"C:\Users\90507\Desktop\BilgiKasifi_Uygulamasi\kedi_icon.jpg";
        string outputIco = @"C:\Users\90507\Desktop\BilgiKasifi_Uygulamasi\app_icon.ico";
        string outputPng = @"C:\Users\90507\Desktop\BilgiKasifi_Uygulamasi\app_icon.png";

        using (Bitmap src = new Bitmap(inputPath))
        {
            int w = src.Width;
            int h = src.Height;
            Console.WriteLine("Source size: " + w + "x" + h);

            // Analiz: Dört köşedeki beyaz arka planı tespit et
            // Köşeler (0,0), (w-1, 0), (0, h-1), (w-1, h-1) beyaz renktedir.
            // Squircle kenar yuvarlatma yarıçapını veya flood fill / alpha maskesini hesapla:
            // Köşeden içeri doğru beyaz renk threshold'unu belirle:
            // Squircle yaklaşık %20 - %24 oranında köşe yuvarlatmasına (corner radius: ~220px) sahiptir.
            // Düzgün antialiased rounded rectangle maskesi oluştur:
            
            // Köşe sınırlarını otomatik tara:
            int cornerOffset = 0;
            for (int i = 0; i < w / 4; i++)
            {
                Color c = src.GetPixel(i, i);
                if (c.R < 250 || c.G < 250 || c.B < 250)
                {
                    cornerOffset = i;
                    break;
                }
            }
            Console.WriteLine("Detected corner diagonal threshold: " + cornerOffset);

            // Squircle çerçeve payı (inset) yaklaşık 32 - 40 px, köşe yarıçapı ~220 px
            // En temiz sonuç: Antialiased GraphicsPath RoundedRectangle maskesi
            // Sınırları flood-fill ile köşelerdeki dış beyaz alanı saydam yapalım,
            // böylece rozetin sarımsı dış çerçevesi ve gölgeleri milimetrik olarak korunur!

            Bitmap transparentBmp = new Bitmap(w, h, PixelFormat.Format32bppArgb);
            bool[,] visited = new bool[w, h];
            Queue<Point> queue = new Queue<Point>();

            // Dört köşeyi sıraya ekle
            Point[] corners = new Point[] {
                new Point(0, 0),
                new Point(w - 1, 0),
                new Point(0, h - 1),
                new Point(w - 1, h - 1)
            };

            foreach (var pt in corners)
            {
                queue.Enqueue(pt);
                visited[pt.X, pt.Y] = true;
            }

            // Dış beyaz bölgeyi BFS ile bul
            while (queue.Count > 0)
            {
                Point p = queue.Dequeue();
                int x = p.X;
                int y = p.Y;

                Point[] neighbors = new Point[] {
                    new Point(x + 1, y),
                    new Point(x - 1, y),
                    new Point(x, y + 1),
                    new Point(x, y - 1)
                };

                foreach (var n in neighbors)
                {
                    if (n.X >= 0 && n.X < w && n.Y >= 0 && n.Y < h && !visited[n.X, n.Y])
                    {
                        Color c = src.GetPixel(n.X, n.Y);
                        // Dış beyaz alan: R > 250 && G > 250 && B > 250 (veya hafif pastel beyaz sınır)
                        // Rozetin dış çerçevesi sarı/turuncu gradyandır (R: ~255, G: ~220, B: ~160)
                        bool isOuterWhite = (c.R >= 248 && c.G >= 248 && c.B >= 248);
                        if (isOuterWhite)
                        {
                            visited[n.X, n.Y] = true;
                            queue.Enqueue(n);
                        }
                    }
                }
            }

            // Saydam piksel aktarımı ve yumuşak kenar antialiasing
            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    if (visited[x, y])
                    {
                        transparentBmp.SetPixel(x, y, Color.FromArgb(0, 0, 0, 0));
                    }
                    else
                    {
                        Color c = src.GetPixel(x, y);
                        // Kenar yumuşatma: komşularda visited varsa alfa derecelendir
                        int whiteNeighbors = 0;
                        if (x > 0 && visited[x - 1, y]) whiteNeighbors++;
                        if (x < w - 1 && visited[x + 1, y]) whiteNeighbors++;
                        if (y > 0 && visited[x, y - 1]) whiteNeighbors++;
                        if (y < h - 1 && visited[x, y + 1]) whiteNeighbors++;

                        if (whiteNeighbors > 0 && (c.R > 240 && c.G > 240 && c.B > 240))
                        {
                            int alpha = Math.Max(0, 255 - (whiteNeighbors * 60));
                            transparentBmp.SetPixel(x, y, Color.FromArgb(alpha, c.R, c.G, c.B));
                        }
                        else
                        {
                            transparentBmp.SetPixel(x, y, Color.FromArgb(255, c.R, c.G, c.B));
                        }
                    }
                }
            }

            // PNG olarak kaydet
            transparentBmp.Save(outputPng, ImageFormat.Png);
            Console.WriteLine("Saved transparent PNG: " + outputPng);

            // Çoklu çözünürlük içeren ICO oluştur (256, 128, 64, 48, 32, 16)
            int[] sizes = new int[] { 256, 128, 64, 48, 32, 16 };
            List<byte[]> pngImages = new List<byte[]>();

            foreach (int size in sizes)
            {
                using (Bitmap resized = new Bitmap(size, size, PixelFormat.Format32bppArgb))
                {
                    using (Graphics g = Graphics.FromImage(resized))
                    {
                        g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                        g.SmoothingMode = SmoothingMode.HighQuality;
                        g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                        g.Clear(Color.Transparent);
                        g.DrawImage(transparentBmp, 0, 0, size, size);
                    }
                    using (MemoryStream ms = new MemoryStream())
                    {
                        resized.Save(ms, ImageFormat.Png);
                        pngImages.Add(ms.ToArray());
                    }
                }
            }

            // Windows ICO Dosya Formatını Yaz
            using (FileStream fs = new FileStream(outputIco, FileMode.Create))
            using (BinaryWriter bw = new BinaryWriter(fs))
            {
                // 1. ICO Header (6 bytes)
                bw.Write((short)0); // Reserved
                bw.Write((short)1); // Type: 1 = Icon
                bw.Write((short)sizes.Length); // Image count

                // 2. Icon Directory Entries (16 bytes each)
                int offset = 6 + (sizes.Length * 16);
                for (int i = 0; i < sizes.Length; i++)
                {
                    int s = sizes[i];
                    bw.Write((byte)(s >= 256 ? 0 : s)); // Width
                    bw.Write((byte)(s >= 256 ? 0 : s)); // Height
                    bw.Write((byte)0); // Color count
                    bw.Write((byte)0); // Reserved
                    bw.Write((short)1); // Color planes
                    bw.Write((short)32); // Bits per pixel
                    bw.Write((int)pngImages[i].Length); // Size in bytes
                    bw.Write((int)offset); // Offset
                    offset += pngImages[i].Length;
                }

                // 3. Image Data
                for (int i = 0; i < sizes.Length; i++)
                {
                    bw.Write(pngImages[i]);
                }
            }

            Console.WriteLine("Saved multi-resolution ICO: " + outputIco);
        }
    }
}
