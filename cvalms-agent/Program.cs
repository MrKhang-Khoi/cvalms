namespace CvaLmsAgent;

public class Program
{
    public static async Task Main(string[] args)
    {
        Console.OutputEncoding = System.Text.Encoding.UTF8;
        Console.WriteLine("═══════════════════════════════════════════════════════════════");
        Console.WriteLine("💻  CVALMS STUDENT AGENT (v8.0 PILOT SPECIFICATION)");
        Console.WriteLine("    Mô hình Hybrid Giám Sát & Điều Khiển Phòng Máy THCS");
        Console.WriteLine("═══════════════════════════════════════════════════════════════");

        string machineId = "MAY-01";
        string gatewayHost = "127.0.0.1";
        int gatewayPort = 49152;
        string? pfxPath = null;

        // 1. Tự động nạp từ config.json nếu có trong thư mục exe
        try
        {
            var configPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "config.json");
            if (File.Exists(configPath))
            {
                using var doc = System.Text.Json.JsonDocument.Parse(File.ReadAllText(configPath));
                var root = doc.RootElement;
                if (root.TryGetProperty("machineId", out var m)) machineId = m.GetString() ?? machineId;
                if (root.TryGetProperty("gatewayHost", out var g)) gatewayHost = g.GetString() ?? gatewayHost;
                if (root.TryGetProperty("gatewayPort", out var gp) && gp.TryGetInt32(out var p)) gatewayPort = p;
                if (root.TryGetProperty("certPath", out var cp)) pfxPath = cp.GetString() ?? pfxPath;
            }
        }
        catch { }

        // 2. Parse CLI options (ghi đè nếu có)
        for (int i = 0; i < args.Length; i++)
        {
            if (args[i] == "--machine" && i + 1 < args.Length)
            {
                machineId = args[++i];
            }
            else if (args[i] == "--gateway" && i + 1 < args.Length)
            {
                gatewayHost = args[++i];
            }
            else if (args[i] == "--port" && i + 1 < args.Length && int.TryParse(args[++i], out var p))
            {
                gatewayPort = p;
            }
            else if (args[i] == "--cert" && i + 1 < args.Length)
            {
                pfxPath = args[++i];
            }
        }

        // Tự động tìm kiếm chứng chỉ agent.pfx đa tầng
        if (string.IsNullOrEmpty(pfxPath))
        {
            var baseDir = AppDomain.CurrentDomain.BaseDirectory;
            var candidates = new List<string>
            {
                Path.Combine(baseDir, "certs", "agent.pfx"),
                Path.Combine(baseDir, "agent.pfx"),
                Path.Combine(baseDir, "gateway", "certs", "agent.pfx"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "CVALMS-Agent", "certs", "agent.pfx"),
                @"C:\CVALMS-Agent\certs\agent.pfx"
            };

            foreach (var c in candidates)
            {
                if (File.Exists(c))
                {
                    pfxPath = Path.GetFullPath(c);
                    break;
                }
            }

            // Nếu vẫn chưa thấy, quét ngược lên các thư mục cha
            if (string.IsNullOrEmpty(pfxPath))
            {
                var dir = baseDir;
                for (int depth = 0; depth < 8; depth++)
                {
                    var c1 = Path.Combine(dir, "certs", "agent.pfx");
                    var c2 = Path.Combine(dir, "gateway", "certs", "agent.pfx");
                    if (File.Exists(c1)) { pfxPath = Path.GetFullPath(c1); break; }
                    if (File.Exists(c2)) { pfxPath = Path.GetFullPath(c2); break; }
                    var parent = Directory.GetParent(dir);
                    if (parent == null) break;
                    dir = parent.FullName;
                }
            }
        }

        Console.WriteLine($"📍 Mã máy định danh: {machineId}");
        Console.WriteLine($"🌐 Cổng kết nối Gateway: {gatewayHost}:{gatewayPort}");
        Console.WriteLine($"🔒 Đường dẫn chứng chỉ: {pfxPath ?? "⚠️ KHÔNG TÌM THẤY CHỨNG CHỈ"}");

        if (string.IsNullOrEmpty(pfxPath) || !File.Exists(pfxPath))
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("\n❌ LỖI: Không tìm thấy chứng chỉ bảo mật mTLS 'agent.pfx'!");
            Console.WriteLine("👉 Hãy chắc chắn thư mục 'certs' nằm ngay cạnh file CvaLmsAgent.exe");
            Console.WriteLine("👉 Hoặc click đúp file 'install_agent.bat' để hệ thống tự cài đặt chuẩn!");
            Console.ResetColor();
            Console.WriteLine("\nNhấn phím bất kỳ để thoát...");
            Console.ReadKey();
            return;
        }
        Console.WriteLine("───────────────────────────────────────────────────────────────");

        using var cts = new CancellationTokenSource();
        Console.CancelKeyPress += (s, e) =>
        {
            e.Cancel = true;
            cts.Cancel();
            ClassroomFocusLockManager.Unlock();
            Console.WriteLine("\n🛑 Đang dừng Agent...");
        };

        var client = new AgentTlsClient(gatewayHost, gatewayPort, machineId, pfxPath);
        await client.StartAsync(cts.Token);
    }
}
