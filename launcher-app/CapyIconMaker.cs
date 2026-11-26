using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public static class CapyIconMaker
{
    public static void Main(string[] args)
    {
        if (args.Length == 0) return;
        string outIcoPath = args[0];
        string outPngPath = args.Length >= 3 && args[1] == "--png" ? args[2] : null;

        string dir = Path.GetDirectoryName(outIcoPath);
        if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);

        using (Bitmap bmp = new Bitmap(256, 256, PixelFormat.Format32bppArgb))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.Clear(Color.Transparent);

            // 1. Rounded dark espresso background card with warm Yuzu border
            using (GraphicsPath bgPath = RoundedRect(new Rectangle(12, 12, 232, 232), 56))
            using (LinearGradientBrush bgBrush = new LinearGradientBrush(
                new Rectangle(12, 12, 232, 232),
                Color.FromArgb(24, 19, 16),
                Color.FromArgb(42, 32, 26),
                45f))
            using (Pen borderPen = new Pen(Color.FromArgb(234, 106, 32), 8f))
            {
                g.FillPath(bgBrush, bgPath);
                g.DrawPath(borderPen, bgPath);
            }

            // 2. Capybara ears
            using (SolidBrush earBrush = new SolidBrush(Color.FromArgb(140, 88, 52)))
            {
                g.FillEllipse(earBrush, 58, 86, 34, 34);
                g.FillEllipse(earBrush, 164, 86, 34, 34);
            }

            // 3. Capybara warm brown head
            using (GraphicsPath headPath = RoundedRect(new Rectangle(56, 96, 144, 114), 52))
            using (LinearGradientBrush headBrush = new LinearGradientBrush(
                new Rectangle(56, 96, 144, 114),
                Color.FromArgb(196, 134, 84),
                Color.FromArgb(158, 102, 60),
                90f))
            {
                g.FillPath(headBrush, headPath);
            }

            // 4. Capybara snout (darker caramel muzzle)
            using (GraphicsPath snoutPath = RoundedRect(new Rectangle(88, 132, 80, 62), 28))
            using (SolidBrush snoutBrush = new SolidBrush(Color.FromArgb(128, 78, 45)))
            {
                g.FillPath(snoutBrush, snoutPath);
            }

            // Nostrils & calm smile
            using (SolidBrush darkBrush = new SolidBrush(Color.FromArgb(36, 22, 14)))
            using (Pen smilePen = new Pen(Color.FromArgb(36, 22, 14), 5f) { StartCap = LineCap.Round, EndCap = LineCap.Round })
            {
                g.FillEllipse(darkBrush, 108, 146, 10, 10);
                g.FillEllipse(darkBrush, 138, 146, 10, 10);
                g.DrawLine(smilePen, 128, 158, 128, 172);
                g.DrawLine(smilePen, 114, 174, 142, 174);

                // Calm chill eyes
                g.DrawLine(smilePen, 74, 128, 92, 128);
                g.DrawLine(smilePen, 164, 128, 182, 128);
            }

            // 5. Golden Yuzu Citrus on top of Capybara's head + Matcha green leaf
            using (LinearGradientBrush yuzuBrush = new LinearGradientBrush(
                new Rectangle(102, 46, 52, 48),
                Color.FromArgb(255, 180, 40),
                Color.FromArgb(234, 106, 32),
                90f))
            using (SolidBrush leafBrush = new SolidBrush(Color.FromArgb(16, 185, 129)))
            {
                g.FillEllipse(yuzuBrush, 102, 50, 52, 46);
                g.FillEllipse(leafBrush, 128, 38, 26, 16);
            }

            if (!string.IsNullOrEmpty(outPngPath))
            {
                string pngDir = Path.GetDirectoryName(outPngPath);
                if (!string.IsNullOrEmpty(pngDir)) Directory.CreateDirectory(pngDir);
                bmp.Save(outPngPath, ImageFormat.Png);
            }

            WriteSinglePngIcon(bmp, outIcoPath);
        }
    }

    private static GraphicsPath RoundedRect(Rectangle bounds, int radius)
    {
        int d = radius * 2;
        GraphicsPath path = new GraphicsPath();
        path.AddArc(bounds.X, bounds.Y, d, d, 180, 90);
        path.AddArc(bounds.Right - d, bounds.Y, d, d, 270, 90);
        path.AddArc(bounds.Right - d, bounds.Bottom - d, d, d, 0, 90);
        path.AddArc(bounds.X, bounds.Bottom - d, d, d, 90, 90);
        path.CloseFigure();
        return path;
    }

    private static void WriteSinglePngIcon(Bitmap bmp, string icoPath)
    {
        byte[] pngBytes;
        using (MemoryStream ms = new MemoryStream())
        {
            bmp.Save(ms, ImageFormat.Png);
            pngBytes = ms.ToArray();
        }

        using (FileStream fs = new FileStream(icoPath, FileMode.Create, FileAccess.Write))
        using (BinaryWriter bw = new BinaryWriter(fs))
        {
            bw.Write((short)0);
            bw.Write((short)1);
            bw.Write((short)1);
            bw.Write((byte)0);
            bw.Write((byte)0);
            bw.Write((byte)0);
            bw.Write((byte)0);
            bw.Write((short)1);
            bw.Write((short)32);
            bw.Write(pngBytes.Length);
            bw.Write(22);
            bw.Write(pngBytes);
        }
    }
}
