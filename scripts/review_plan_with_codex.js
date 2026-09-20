const fs = require('fs');

async function callModel(modelName, planContent) {
  console.log(`Sending request to 9Router with model: ${modelName}...`);
  const prompt = `Bạn là Chuyên gia Kiến trúc Hệ thống Cấp cao & Kiểm Định Viên Độc Lập (OpenAI Codex System Architecture Auditor).
Người dùng đã yêu cầu lên kế hoạch chi tiết, các bước triển khai, công nghệ làm đạt chuẩn công nghiệp, hiện đại đáp ứng chuẩn một ứng dụng cài đặt Windows (tương tự NetSupport School, CSM/GCafe) cho phòng máy THCS 18 máy có đóng băng Deep Freeze, kết hợp với Web LMS hiện tại.

Dưới đây là Bản Kế Hoạch Kiến Trúc & Triển Khai v5.0 (implementation_plan.md) đã tiếp thu trọn vẹn 6 tiêu chuẩn khắt khe ở vòng review trước:
--------------------------------------------------
${planContent}
--------------------------------------------------

Hãy tiến hành THẨM ĐỊNH TOÀN DIỆN (Architectural Review & Industrial Windows Standards Audit) trên các khía cạnh:
1. Đánh giá tính chuẩn xác của kiến trúc Windows Session: Phân tách rõ Session 0 (CvaAgentService - LocalSystem) và Active Console Session (CvaSessionAgent) chỉ chạy trên phiên người dùng active duy nhất (WTSGetActiveConsoleSessionId) qua Named Pipe có SDDL ACL.
2. Đánh giá giải pháp chụp màn hình DXGI Desktop Duplication + Tự động tái tạo context + GDI Fallback và cơ chế Bounded Latest-Frame-Wins.
3. Đánh giá giải pháp mạng LAN: Dual-layer TLS (Web WSS/HTTPS nội bộ vs Device TLS 1.3 TLS-PSK), Session Epoch GUID + Sequence Monotonic Replay Guard, Single-Active Spotlight Scheduler.
4. Đánh giá Giao thức Thu Bài Cam Kết 2 Pha (2-Phase Commit Auto-Collect Protocol) kết hợp phòng chống Zip Slip / Reparse Points / TOCTOU.
5. Đánh giá Định vị Sư phạm thực tế (Soft Classroom Focus Lock) và đóng gói WiX Toolset v4 MSI.
6. Đưa ra KẾT LUẬN NGHIỆM THU: [APPROVED FOR PILOT] hoặc [APPROVED] nếu kiến trúc v5.0 đã hoàn toàn đáp ứng xuất sắc các tiêu chuẩn kỹ thuật.`;

  const res = await fetch('http://127.0.0.1:20128/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sk-2133f22b28d1f309-ogr2cy-0852bea5'
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: 'You are an elite Senior Windows Systems Architect and OpenAI Codex Technical Reviewer. Provide deep, rigorous, objective, and structured reviews.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1
    })
  });

  console.log(`Response status for ${modelName}: ${res.status}`);
  if (!res.ok) {
    const errText = await res.text();
    console.error(`Error body for ${modelName}:`, errText);
    return null;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content;
}

async function main() {
  const planPath = 'C:\\Users\\HPZBook\\.gemini\\antigravity\\brain\\3200ba6e-bc70-4c6b-860d-d35ff50ae270\\implementation_plan.md';
  const planContent = fs.readFileSync(planPath, 'utf8');

  const models = ['cx/gpt-5.4-review', 'cx/codex-auto-review', 'cx/gpt-5.5-review'];
  for (const model of models) {
    try {
      const result = await callModel(model, planContent);
      if (result) {
        console.log(`\n=================== KẾT QUẢ REVIEW TỪ ${model} ===================\n`);
        console.log(result);
        return;
      }
    } catch (err) {
      console.warn(`Lỗi khi gọi ${model}:`, err.message);
    }
  }
}

main();
