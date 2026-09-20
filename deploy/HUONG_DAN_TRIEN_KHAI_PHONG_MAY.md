# HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG GIÁM SÁT PHÒNG MÁY 18 MÁY TRẠM (CVALMS HYBRID MONITOR)

Hệ thống kết hợp sức mạnh giữa **Giao diện Web LMS Giáo Viên** và **C# .NET 8 Native Agent** chạy ngầm trên 18 máy học sinh, đạt chuẩn công nghiệp, tương thích 100% với ổ cứng đóng băng Deep Freeze.

---

## 1. MÔ HÌNH KIẾN TRÚC MẠNG LAN PHÒNG MÁY

```
   [ MÁY GIÁO VIÊN ]
   ├── Trình duyệt Chrome / Edge (Web LMS Dashboard) -> Port 49150 (WebSocket & REST)
   └── Local Lab Gateway (Node.js mTLS Server)        -> Port 49152 (mTLS X.509)
              ▲
              │ (Mạng LAN Switch 100Mbps/1Gbps - Gói tin mã hóa mTLS)
              ▼
   ┌──────────┴──────────┬───────────────────────┬───────────────────────┐
[ MÁY HỌC SINH 01 ]   [ MÁY HỌC SINH 02 ]     [ MÁY HỌC SINH ... ]    [ MÁY HỌC SINH 18 ]
  - Deep Freeze         - Deep Freeze           - Deep Freeze           - Deep Freeze
  - CvaLmsAgent.exe     - CvaLmsAgent.exe       - CvaLmsAgent.exe       - CvaLmsAgent.exe
  - Desktop\BaiTap      - Desktop\BaiTap        - Desktop\BaiTap        - Desktop\BaiTap
```

---

## 2. BƯỚC 1: KHỞI ĐỘNG TRÊN MÁY GIÁO VIÊN

1. **Khởi động Local Lab Gateway**:
   Mở terminal hoặc chạy file `start_gateway.bat` tại thư mục dự án:
   ```cmd
   node gateway/server.js
   ```
   *Gateway sẽ mở 2 cổng:*
   - `49152` (0.0.0.0): Cổng mTLS bảo mật đón kết nối từ 18 máy học sinh.
   - `49150` (127.0.0.1): Cổng Loopback WebSocket & REST phục vụ Web LMS.

2. **Mở Web LMS Giáo Viên**:
   Mở trình duyệt (Chrome/Edge) truy cập file `index.html`.
   Đăng nhập tài khoản Giáo viên.
   Bấm vào Tab: **"4. Giám Sát Phòng Máy (18 Máy)"**.
   *Đèn LED trạng thái sẽ báo màu xanh: "Đã kết nối Gateway Local (Port 49150)".*

---

## 3. BƯỚC 2: CÀI ĐẶT TRÊN 18 MÁY HỌC SINH (DEEP FREEZE WORKFLOW)

### Quy trình "Thawed $\rightarrow$ Cài đặt $\rightarrow$ Frozen"
1. **Mở băng Deep Freeze**:
   - Nhấn tổ hợp phím `Ctrl + Alt + Shift + F6` (hoặc nhấp đúp icon chú gấu Deep Freeze ở khay hệ thống).
   - Nhập mật khẩu Deep Freeze của phòng máy.
   - Chọn **"Boot Thawed"** (Chế độ Mở băng) $\rightarrow$ Khởi động lại máy.

2. **Chạy bộ cài đặt `install_agent.bat`**:
   - Cắm USB chứa thư mục `deploy/` vào máy học sinh.
   - Nhấp chuột phải vào `deploy\install_agent.bat` $\rightarrow$ Chọn **Run as Administrator**.
   - **Nhập số máy**: Ví dụ máy số 1 nhập `1` (Hệ thống tự gán `MAY-01`).
   - **Nhập IP máy Giáo viên**: Ví dụ `192.168.1.100` (hoặc `127.0.0.1` nếu test cùng máy).
   - Bộ cài sẽ tự động:
     - Tạo thư mục `C:\CVALMS-Agent\` và chép `CvaLmsAgent.exe` + chứng chỉ `agent.pfx`.
     - Tạo thư mục `Desktop\BaiTap_TinHoc` để học sinh làm bài.
     - Đăng ký tự khởi động ngầm trong Windows Session qua Registry `Run`.
     - Cho phép ứng dụng qua Windows Firewall.
     - Khởi chạy Agent ngay lập tức.

3. **Đóng băng lại Deep Freeze**:
   - Nhấn `Ctrl + Alt + Shift + F6` $\rightarrow$ Chọn **"Boot Frozen"** (Chế độ Đóng băng) $\rightarrow$ Khởi động lại máy.
   - *Kể từ nay, mỗi khi máy bật lên, Agent sẽ tự động chạy trong phiên người dùng, kết nối mTLS tới máy giáo viên mà không bao giờ bị mất cấu hình.*

---

## 4. TÍNH NĂNG ĐIỀU KHIỂN SƯ PHẠM VÀ PHÒNG NET

| Tính năng | Mô tả hoạt động | Chuẩn kỹ thuật |
| :--- | :--- | :--- |
| **Theo dõi 18 màn hình** | Xem đồng thời 18 màn hình học sinh 1-2 FPS overview; tự động vẽ lên Canvas. | DXGI Desktop Duplication / GDI BitBlt |
| **Chiếu Spotlight Full HD** | Nhấp vào bất kỳ màn hình nào để phóng to 1280x720 12-15 FPS chiếu lên bảng. | Adaptive JPEG in-memory stream |
| **Khóa tập trung (Lock All)** | Khóa toàn màn hình và bàn phím (Alt+Tab, Win, Alt+F4) khi thầy giảng bài. | Win32 Low-Level Keyboard Hook |
| **Mở khóa (Unlock All)** | Trả lại màn hình và bàn phím ngay lập tức để học sinh làm bài. | IPC Command Packet `CVAL` |
| **Thu bài tập tự động** | Thu gom toàn bộ thư mục `Desktop\BaiTap_TinHoc` thành file ZIP có mã băm SHA-256. | Durable Storage Atomic Transaction |
| **Phát hiện UAC Shield** | Nhận diện khi học sinh mở hộp thoại Administrator hoặc màn hình khóa Logon. | Win32 `OpenInputDesktop` DESKTOP_SWITCH |
| **Bật máy từ xa (WOL)** | Gửi gói tin Magic Packet qua UDP Broadcast port 9 để khởi động máy. | IEEE 802.3 Wake-on-LAN |
| **Tắt máy từ xa** | Tắt toàn bộ máy an toàn khi kết thúc buổi học. | Win32 `ExitWindowsEx` |

---

## 5. CẤU HÌNH WAKE-ON-LAN TRONG BIOS/UEFI (NẾU CẦN BẬT MÁY TỪ XA)
1. Khởi động máy trạm $\rightarrow$ Nhấn `Del` hoặc `F2` để vào BIOS Setup.
2. Tìm mục **Power Management** $\rightarrow$ Kích hoạt **Wake on LAN** (hoặc **Power On By PCIE Devices**).
3. Trong Windows $\rightarrow$ Device Manager $\rightarrow$ Network Adapters $\rightarrow$ Chuột phải Card LAN $\rightarrow$ Properties $\rightarrow$ Tab **Power Management** $\rightarrow$ Tích chọn:
   - *"Allow this device to wake the computer"*
   - *"Only allow a magic packet to wake the computer"*
