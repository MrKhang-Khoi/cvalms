using System.Diagnostics;
using System.Net.Security;
using System.Net.Sockets;
using System.Security.Authentication;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Text.Json;

namespace CvaLmsAgent;

public class StreamProfile
{
    public int Width { get; set; } = 480;
    public int Height { get; set; } = 270;
    public int Fps { get; set; } = 2;
    public long JpegQuality { get; set; } = 60;
}

public class AgentTlsClient
{
    private readonly string _gatewayHost;
    private readonly int _gatewayPort;
    private readonly string _machineId;
    private readonly string? _pfxPath;
    private readonly ScreenCaptureEngine _captureEngine;
    private StreamProfile _currentProfile = new();
    private SslStream? _sslStream;
    private TcpClient? _tcpClient;
    private bool _running = false;
    private string? _sessionEpochId;

    public AgentTlsClient(string gatewayHost, int gatewayPort, string machineId, string? pfxPath = null)
    {
        _gatewayHost = gatewayHost;
        _gatewayPort = gatewayPort;
        _machineId = machineId;
        _pfxPath = pfxPath;
        _captureEngine = new ScreenCaptureEngine();
    }

    public async Task StartAsync(CancellationToken ct)
    {
        _running = true;
        Console.WriteLine($"🚀 Agent khởi động trên [{_machineId}] kết nối tới Gateway {_gatewayHost}:{_gatewayPort}...");

        while (_running && !ct.IsCancellationRequested)
        {
            try
            {
                await ConnectAndRunAsync(ct);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Mất kết nối Gateway: {ex.Message}. Tự kết nối lại sau 2 giây...");
                try { _sslStream?.Dispose(); } catch { }
                try { _tcpClient?.Dispose(); } catch { }
                await Task.Delay(2000, ct);
            }
        }
    }

    private async Task ConnectAndRunAsync(CancellationToken ct)
    {
        _tcpClient = new TcpClient();
        await _tcpClient.ConnectAsync(_gatewayHost, _gatewayPort, ct);

        // Nạp chứng chỉ máy trạm
        var clientCerts = new X509Certificate2Collection();
        if (!string.IsNullOrEmpty(_pfxPath) && File.Exists(_pfxPath))
        {
            var cert = new X509Certificate2(_pfxPath, "cvalms2026");
            clientCerts.Add(cert);
        }

        _sslStream = new SslStream(
            _tcpClient.GetStream(),
            false,
            (sender, cert, chain, errors) => true,
            (sender, targetHost, localCerts, remoteCert, acceptableIssuers) => clientCerts.Count > 0 ? clientCerts[0] : null!
        );

        await _sslStream.AuthenticateAsClientAsync(new SslClientAuthenticationOptions
        {
            TargetHost = _gatewayHost,
            ClientCertificates = clientCerts,
            EnabledSslProtocols = SslProtocols.Tls12 | SslProtocols.Tls13
        }, ct);

        Console.WriteLine($"✅ Đã bắt tay mTLS thành công với Gateway [{_gatewayHost}:{_gatewayPort}]");

        // Gửi bản tin REGISTER
        await SendJsonMessageAsync(new
        {
            type = "REGISTER",
            machineId = _machineId,
            foregroundApp = _captureEngine.GetForegroundAppTitle(),
            timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        }, ct);

        // Chạy song song 2 luồng: Nhận lệnh và Gửi khung hình màn hình
        var receiveTask = Task.Run(() => ReceiveLoopAsync(ct), ct);
        var captureTask = Task.Run(() => CaptureAndStreamLoopAsync(ct), ct);

        await Task.WhenAny(receiveTask, captureTask);
    }

    private async Task CaptureAndStreamLoopAsync(CancellationToken ct)
    {
        while (_running && !ct.IsCancellationRequested && _sslStream != null)
        {
            var profile = _currentProfile;
            var frame = _captureEngine.CaptureScreen(profile.Width, profile.Height, profile.JpegQuality);

            // Gửi gói tin nhị phân CVFR (0x43564652)
            await SendFrameAsync(frame, ct);

            // Nghỉ theo FPS mục tiêu (2 FPS ~ 500ms, 12 FPS ~ 83ms)
            int delayMs = Math.Max(50, 1000 / profile.Fps);
            await Task.Delay(delayMs, ct);
        }
    }

    private async Task SendFrameAsync(CapturedFrame frame, CancellationToken ct)
    {
        if (_sslStream == null) return;

        var mIdBytes = Encoding.UTF8.GetBytes(_machineId);
        int headerLen = 5 + mIdBytes.Length + 4 + 8 + 2 + 2 + 1 + 4;
        var header = new byte[headerLen];

        using var ms = new MemoryStream(header);
        using var bw = new BinaryWriter(ms);

        // Magic 0x43564652 ('CVFR')
        bw.Write(new byte[] { 0x43, 0x56, 0x46, 0x52 });
        bw.Write((byte)mIdBytes.Length);
        bw.Write(mIdBytes);

        // Big Endian fields
        WriteUInt32BE(bw, frame.SequenceNumber);
        WriteUInt64BE(bw, frame.Timestamp);
        WriteUInt16BE(bw, frame.Width);
        WriteUInt16BE(bw, frame.Height);
        bw.Write((byte)frame.State);
        WriteUInt32BE(bw, (uint)frame.JpegData.Length);

        await _sslStream.WriteAsync(header, ct);
        await _sslStream.WriteAsync(frame.JpegData, ct);
        await _sslStream.FlushAsync(ct);
    }

    private async Task ReceiveLoopAsync(CancellationToken ct)
    {
        var readBuf = new byte[8192];
        var memoryBuffer = new List<byte>();

        while (_running && !ct.IsCancellationRequested && _sslStream != null)
        {
            int bytesRead = await _sslStream.ReadAsync(readBuf, ct);
            if (bytesRead <= 0) break;

            memoryBuffer.AddRange(readBuf.Take(bytesRead));

            // Xử lý framing
            while (memoryBuffer.Count >= 8)
            {
                uint magic = (uint)((memoryBuffer[0] << 24) | (memoryBuffer[1] << 16) | (memoryBuffer[2] << 8) | memoryBuffer[3]);
                if (magic == 0x4356414C) // 'CVAL'
                {
                    uint len = (uint)((memoryBuffer[4] << 24) | (memoryBuffer[5] << 16) | (memoryBuffer[6] << 8) | memoryBuffer[7]);
                    if (memoryBuffer.Count < 8 + len) break;

                    var jsonBytes = memoryBuffer.Skip(8).Take((int)len).ToArray();
                    memoryBuffer.RemoveRange(0, 8 + (int)len);

                    var jsonStr = Encoding.UTF8.GetString(jsonBytes);
                    ProcessCommand(jsonStr);
                }
                else
                {
                    memoryBuffer.RemoveAt(0);
                }
            }
        }
    }

    private void ProcessCommand(string jsonStr)
    {
        try
        {
            using var doc = JsonDocument.Parse(jsonStr);
            var root = doc.RootElement;

            if (root.TryGetProperty("type", out var typeProp))
            {
                var type = typeProp.GetString();
                if (type == "SESSION_INIT")
                {
                    _sessionEpochId = root.GetProperty("sessionEpochId").GetString();
                    Console.WriteLine($"🔑 Nhận Session Epoch mới từ Gateway: {_sessionEpochId}");
                }
                else if (type == "SET_STREAM_PROFILE")
                {
                    var profileName = root.GetProperty("profile").GetString();
                    if (profileName == "SPOTLIGHT_HD")
                    {
                        _currentProfile = new StreamProfile { Width = 1280, Height = 720, Fps = 12, JpegQuality = 75 };
                        Console.WriteLine("🌟 Kích hoạt chế độ Spotlight Full HD (1280x720 @ 12 FPS)");
                    }
                    else
                    {
                        _currentProfile = new StreamProfile { Width = 480, Height = 270, Fps = 2, JpegQuality = 60 };
                        Console.WriteLine("📺 Chuyển về chế độ Overview Thumbnail (480x270 @ 2 FPS)");
                    }
                }
                else if (type == "COMMIT_ACK")
                {
                    var subId = root.GetProperty("submissionId").GetString();
                    Console.WriteLine($"🎉 Bài tập [{subId}] đã được Gateway xác nhận Committed thành công!");
                }
            }
            else if (root.TryGetProperty("action", out var actionProp))
            {
                var action = actionProp.GetString();
                Console.WriteLine($"⚡ Nhận lệnh điều khiển: {action}");

                if (action == "CLASSROOM_FOCUS_LOCK")
                {
                    var msg = "Thầy đang giảng bài, các em chú ý lên bảng!";
                    if (root.TryGetProperty("payload", out var p) && p.TryGetProperty("message", out var m))
                    {
                        msg = m.GetString() ?? msg;
                    }
                    ClassroomFocusLockManager.Lock(msg);
                }
                else if (action == "CLASSROOM_FOCUS_UNLOCK")
                {
                    ClassroomFocusLockManager.Unlock();
                }
                else if (action == "PREPARE_COLLECT")
                {
                    var subId = root.GetProperty("payload").GetProperty("submissionId").GetString() ?? $"sub_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
                    _ = UploadExerciseSubmissionAsync(subId);
                }
                else if (action == "SYSTEM_SHUTDOWN")
                {
                    Console.WriteLine("🛑 Nhận lệnh tắt máy từ giáo viên!");
                    Process.Start("shutdown.exe", "/s /t 10 /c \"Giao vien yeu cau tat may ket thuc tiet hoc\"");
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ Lỗi xử lý lệnh: {ex.Message}");
        }
    }

    private async Task UploadExerciseSubmissionAsync(string submissionId)
    {
        try
        {
            Console.WriteLine($"📦 Đang đóng gói bài tập nộp cho giao dịch [{submissionId}]...");
            var archive = FileCollectorEngine.CreateExerciseArchive();

            // Gửi bản tin chuẩn bị giao dịch
            await SendJsonMessageAsync(new
            {
                type = "COLLECT_SUBMIT",
                submissionId,
                machineId = _machineId,
                studentName = Environment.UserName,
                expectedHash = archive.Sha256Hash,
                fileCount = archive.FileCount,
                sessionEpochId = _sessionEpochId
            }, CancellationToken.None);

            // Gửi binary zip payload CVSU (0x43565355)
            var subIdBytes = Encoding.UTF8.GetBytes(submissionId);
            var header = new byte[12 + subIdBytes.Length];
            using (var ms = new MemoryStream(header))
            using (var bw = new BinaryWriter(ms))
            {
                bw.Write(new byte[] { 0x43, 0x56, 0x53, 0x55 }); // 'CVSU'
                WriteUInt32BE(bw, (uint)subIdBytes.Length);
                WriteUInt32BE(bw, (uint)archive.ZipData.Length);
                bw.Write(subIdBytes);
            }

            if (_sslStream != null)
            {
                await _sslStream.WriteAsync(header);
                await _sslStream.WriteAsync(archive.ZipData);
                await _sslStream.FlushAsync();
                Console.WriteLine($"📤 Đã gửi thành công {archive.FileCount} tệp ({archive.ZipData.Length / 1024} KB) lên Gateway!");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Lỗi thu bài: {ex.Message}");
        }
    }

    private async Task SendJsonMessageAsync(object obj, CancellationToken ct)
    {
        if (_sslStream == null) return;
        var json = JsonSerializer.Serialize(obj);
        var bytes = Encoding.UTF8.GetBytes(json);
        var header = new byte[8];
        header[0] = 0x43; header[1] = 0x56; header[2] = 0x41; header[3] = 0x4C; // 'CVAL'
        header[4] = (byte)((bytes.Length >> 24) & 0xFF);
        header[5] = (byte)((bytes.Length >> 16) & 0xFF);
        header[6] = (byte)((bytes.Length >> 8) & 0xFF);
        header[7] = (byte)(bytes.Length & 0xFF);

        await _sslStream.WriteAsync(header, ct);
        await _sslStream.WriteAsync(bytes, ct);
        await _sslStream.FlushAsync(ct);
    }

    private static void WriteUInt16BE(BinaryWriter bw, ushort val)
    {
        bw.Write((byte)((val >> 8) & 0xFF));
        bw.Write((byte)(val & 0xFF));
    }

    private static void WriteUInt32BE(BinaryWriter bw, uint val)
    {
        bw.Write((byte)((val >> 24) & 0xFF));
        bw.Write((byte)((val >> 16) & 0xFF));
        bw.Write((byte)((val >> 8) & 0xFF));
        bw.Write((byte)(val & 0xFF));
    }

    private static void WriteUInt64BE(BinaryWriter bw, ulong val)
    {
        for (int i = 7; i >= 0; i--)
        {
            bw.Write((byte)((val >> (i * 8)) & 0xFF));
        }
    }
}
