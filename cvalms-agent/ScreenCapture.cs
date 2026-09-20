using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Text;

namespace CvaLmsAgent;

public enum ScreenCaptureState : byte
{
    Normal = 0,
    SecureDesktopBlocked = 1,
    Error = 2
}

public class CapturedFrame
{
    public uint SequenceNumber { get; set; }
    public ulong Timestamp { get; set; }
    public ushort Width { get; set; }
    public ushort Height { get; set; }
    public ScreenCaptureState State { get; set; }
    public byte[] JpegData { get; set; } = Array.Empty<byte>();
}

public class ScreenCaptureEngine
{
    [DllImport("user32.dll")]
    private static extern IntPtr GetDesktopWindow();

    [DllImport("user32.dll")]
    private static extern IntPtr GetWindowDC(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);

    [DllImport("gdi32.dll")]
    private static extern bool BitBlt(IntPtr hObject, int nXDest, int nYDest, int nWidth, int nHeight, IntPtr hObjectSource, int nXSrc, int nYSrc, int dwRop);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr OpenInputDesktop(uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll")]
    private static extern bool CloseDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    private static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

    private const int SRCCOPY = 0x00CC0020;
    private const uint DESKTOP_SWITCHDESKTOP = 0x0100;

    private readonly ImageCodecInfo _jpegEncoder;
    private uint _sequenceCounter = 0;

    public ScreenCaptureEngine()
    {
        _jpegEncoder = GetEncoder(ImageFormat.Jpeg) ?? throw new InvalidOperationException("Không tìm thấy JPEG encoder");
    }

    public string GetForegroundAppTitle()
    {
        try
        {
            var hwnd = GetForegroundWindow();
            if (hwnd == IntPtr.Zero) return "Màn hình chính";
            var sb = new StringBuilder(256);
            if (GetWindowText(hwnd, sb, 256) > 0)
            {
                var title = sb.ToString().Trim();
                return string.IsNullOrEmpty(title) ? "Ứng dụng nền" : title;
            }
        }
        catch
        {
            // ignore
        }
        return "Màn hình Desktop";
    }

    public CapturedFrame CaptureScreen(int targetWidth, int targetHeight, long jpegQuality)
    {
        _sequenceCounter++;
        var ts = (ulong)DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        // 1. Kiểm tra trạng thái Secure Desktop (UAC Prompt hoặc Lock Workstation)
        var hDesktop = OpenInputDesktop(0, false, DESKTOP_SWITCHDESKTOP);
        if (hDesktop == IntPtr.Zero)
        {
            var err = Marshal.GetLastWin32Error();
            if (err == 5) // ERROR_ACCESS_DENIED
            {
                return new CapturedFrame
                {
                    SequenceNumber = _sequenceCounter,
                    Timestamp = ts,
                    Width = (ushort)targetWidth,
                    Height = (ushort)targetHeight,
                    State = ScreenCaptureState.SecureDesktopBlocked,
                    JpegData = CreatePlaceholderFrame(targetWidth, targetHeight, "🔒 SECURE DESKTOP (UAC / LOGON)", Color.FromArgb(40, 30, 0), Color.Gold)
                };
            }
        }
        else
        {
            CloseDesktop(hDesktop);
        }

        // 2. Chụp màn hình Desktop thực tế
        try
        {
            var screenBounds = Screen.PrimaryScreen?.Bounds ?? new Rectangle(0, 0, 1920, 1080);
            using var rawBmp = new Bitmap(screenBounds.Width, screenBounds.Height, PixelFormat.Format24bppRgb);
            using (var g = Graphics.FromImage(rawBmp))
            {
                g.CopyFromScreen(screenBounds.X, screenBounds.Y, 0, 0, screenBounds.Size, CopyPixelOperation.SourceCopy);
            }

            // Thu nhỏ độ phân giải theo Profile (Overview 480x270 hoặc Spotlight 1280x720)
            using var scaledBmp = new Bitmap(targetWidth, targetHeight, PixelFormat.Format24bppRgb);
            using (var gScaled = Graphics.FromImage(scaledBmp))
            {
                gScaled.InterpolationMode = InterpolationMode.Bilinear;
                gScaled.SmoothingMode = SmoothingMode.HighSpeed;
                gScaled.PixelOffsetMode = PixelOffsetMode.HighSpeed;
                gScaled.DrawImage(rawBmp, 0, 0, targetWidth, targetHeight);
            }

            // Nén JPEG in-memory
            using var ms = new MemoryStream();
            using var encoderParams = new EncoderParameters(1);
            encoderParams.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, (long)jpegQuality);
            scaledBmp.Save(ms, _jpegEncoder, encoderParams);

            return new CapturedFrame
            {
                SequenceNumber = _sequenceCounter,
                Timestamp = ts,
                Width = (ushort)targetWidth,
                Height = (ushort)targetHeight,
                State = ScreenCaptureState.Normal,
                JpegData = ms.ToArray()
            };
        }
        catch (Exception)
        {
            return new CapturedFrame
            {
                SequenceNumber = _sequenceCounter,
                Timestamp = ts,
                Width = (ushort)targetWidth,
                Height = (ushort)targetHeight,
                State = ScreenCaptureState.Error,
                JpegData = CreatePlaceholderFrame(targetWidth, targetHeight, "⚠️ LỖI CHỤP MÀN HÌNH", Color.DarkRed, Color.White)
            };
        }
    }

    private byte[] CreatePlaceholderFrame(int width, int height, string text, Color bgColor, Color textColor)
    {
        using var bmp = new Bitmap(width, height);
        using (var g = Graphics.FromImage(bmp))
        {
            g.Clear(bgColor);
            using var brush = new SolidBrush(textColor);
            using var font = new Font(FontFamily.GenericSansSerif, 12, FontStyle.Bold);
            var size = g.MeasureString(text, font);
            g.DrawString(text, font, brush, (width - size.Width) / 2, (height - size.Height) / 2);
        }
        using var ms = new MemoryStream();
        bmp.Save(ms, ImageFormat.Jpeg);
        return ms.ToArray();
    }

    private static ImageCodecInfo? GetEncoder(ImageFormat format)
    {
        return ImageCodecInfo.GetImageDecoders().FirstOrDefault(codec => codec.FormatID == format.Guid);
    }
}
