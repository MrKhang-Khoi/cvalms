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

        // Parse CLI options
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

        // Tự động tìm cert trong gateway/certs/ nếu chạy cùng máy
        if (string.IsNullOrEmpty(pfxPath))
        {
            var dir = AppDomain.CurrentDomain.BaseDirectory;
            for (int depth = 0; depth < 8; depth++)
            {
                var candidate = Path.Combine(dir, "gateway", "certs", "agent.pfx");
                if (File.Exists(candidate))
                {
                    pfxPath = Path.GetFullPath(candidate);
                    break;
                }
                var parent = Directory.GetParent(dir);
                if (parent == null) break;
                dir = parent.FullName;
            }
        }

        Console.WriteLine($"📍 Mã máy định danh: {machineId}");
        Console.WriteLine($"🌐 Cổng kết nối Gateway: {gatewayHost}:{gatewayPort}");
        Console.WriteLine($"🔒 Đường dẫn chứng chỉ: {pfxPath ?? "Mặc định (Chưa chỉ định)"}");
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
