# KẾ HOẠCH CHI TIẾT: XÂY DỰNG HỆ THỐNG LMS & DẠY HỌC TƯƠNG TÁC PHÒNG MÁY 18 MÁY (MÔN TIN HỌC)

Tài liệu này tổng hợp toàn bộ các kết quả thảo luận khoa học giữa Giáo viên và Chuyên gia CNTT, định hình kiến trúc, quy trình sư phạm và kế hoạch triển khai cụ thể cho phần mềm mới tại thư mục:  
`C:\Users\HPZBook\OneDrive - Sở GD&ĐT Quảng Ngãi\Desktop\LMS PHÒNG MÁY TƯƠNG TÁC`.

---

## I. MỤC TIÊU & BỐI CẢNH THỰC TẾ

1. **Môi trường thực tế**:
   - Phòng máy tính trường học gồm đúng **18 máy học sinh** + **1 máy giáo viên**.
   - Mạng Internet cáp quang ổn định, máy tính cấu hình tương đối cao.
   - Sĩ số lớp: 30 - 36 học sinh $\rightarrow$ **1 máy tính = 2 học sinh** tạo thành 1 Nhóm đôi (Pair-Learning).
2. **Môn học giảng dạy**: **Tin học (Chương trình GDPT 2018)**.
   - Hỗ trợ cả 2 dạng bài học: Lý thuyết/Khái niệm số (An toàn thông tin, Mạng, CSDL) và Thuật toán/Lập trình (Python, C++, Scratch).
   - Đòi hỏi giao diện hiển thị được Khối Code (Code block) có màu cú pháp chuẩn (Syntax highlighting) và sơ đồ trực quan.
3. **Mục tiêu sư phạm cốt lõi**:
   - Chuyển đổi từ *"Thầy chiếu slide xa xa một chiều $\rightarrow$ Trò ngồi nghe khô khan"* sang *"Học sinh trực tiếp đọc tài liệu tóm tắt, thao tác, phản hồi và thi đua ngay trên máy tính của mình"*.
   - Phát triển năng lực số (Digital Competence) qua tương tác hai chiều thời gian thực.
4. **Mục tiêu quản lý giảng dạy**:
   - Giáo viên dạy **nhiều lớp khác nhau** (10A1, 10A2, 10A3...): Kho bài giảng dùng chung, nhưng mỗi tiết học là một Phiên dạy (Session) độc lập, không đè hay lẫn lộn dữ liệu giữa các lớp.

---

## II. KIẾN TRÚC KỸ THUẬT & GIẢI PHÁP CHỐNG LỖI

### 1. Nền tảng cốt lõi (Core Stack)
- **Frontend**: HTML5 Semantics, CSS3 hiện đại, Vanilla JavaScript (ES6+ Module hóa).
- **Backend & Realtime Sync**: Google Firebase Realtime Database.
- **Thư viện tích hợp**: KaTeX (công thức Toán), Prism.js / Highlight.js siêu nhẹ (màu cú pháp Code Tin học), Canvas-Confetti (hiệu ứng thi đua), SheetJS (xuất Excel).

### 2. Tích hợp PWA (Progressive Web App) + NotebookLM chống giật lag
- **Vai trò NotebookLM**: Giáo viên đưa SGK vào NotebookLM để trích xuất nội dung bài học thành dạng "viên kiến thức súc tích (Micro-learning chunks)".
- **Vai trò PWA & Service Worker**:
  - Tải và lưu cứng (cache) toàn bộ giao diện và nội dung bài học NotebookLM vào ổ cứng 18 máy học sinh.
  - Khi học sinh mở máy, bài học hiện ra ngay trong **0.1 giây**, không tốn băng thông Internet để tải văn bản/ảnh.
  - Firebase chỉ truyền các gói tín hiệu điều khiển siêu nhẹ ($< 100$ bytes) $\rightarrow$ **Triệt tiêu hoàn toàn hiện tượng giật lag phòng máy**.

### 3. Bộ 3 giải pháp diệt triệt để "Lỗi dính Cache" từ năm ngoái
- **Lớp 1 (Firebase Headers)**: File `firebase.json` cấu hình `Cache-Control: no-cache, no-store, must-revalidate` ép trình duyệt luôn nhận diện bản cập nhật mới nhất.
- **Lớp 2 (Cache-busting Versioning)**: Mọi liên kết file JS/CSS đều gắn số hiệu phiên bản (`app.js?v=2.0.1`).
- **Lớp 3 (Remote Force Refresh)**: Nút bấm trên máy giáo viên cho phép gửi lệnh cưỡng bức F5 làm sạch bộ nhớ toàn bộ 18 máy từ xa cùng lúc.

### 4. An toàn & Bảo mật
- **Ẩn đáp án trắc nghiệm**: Tuyệt đối không gửi trường `correct` về máy học sinh khi chưa công bố kết quả.
- **Phân quyền Firebase Rules**: Học sinh chỉ được ghi dữ liệu vào node của máy mình, không có quyền can thiệp vào kho bài học hay điểm số của máy khác.

---

## III. THIẾT KẾ TIẾN TRÌNH BÀI DẠY (TEACHER-PACED 4-PHASE WORKFLOW)

Tiến trình 45 phút diễn ra qua 5 chặng tuần tự dưới sự điều phối của Giáo viên:

```
[CHẶNG 0: BẮT ĐẦU TIẾT HỌC] (3 phút)
GV chọn Lớp (10A1) + Bài học (Tin 10 - Bài 12) → Bấm Bắt đầu
18 máy hiện danh sách HS lớp 10A1 → 2 em chọn tên mình → Sơ đồ GV hiện xanh đủ 18 máy
                                  ↓
[CHẶNG 1: KHỞI ĐỘNG TỨC THÌ] (3 - 5 phút)
GV kích hoạt: Quick Poll A-B-C-D hoặc Câu hỏi tình huống
18 máy bấm chọn trong 30-45s (Chưa hiện đúng/sai để chống nhìn bài)
GV khóa → Chiếu biểu đồ Live Analytics lên màn hình lớp → Dẫn nhập bài mới
                                  ↓
[CHẶNG 2: KHÁM PHÁ KIẾN THỨC SỐ] (10 - 12 phút)
GV mở "Trạm lý thuyết" → 18 máy nhận bài đọc trực quan từ PWA Cache
(Văn bản súc tích từ NotebookLM + Khối Code màu + Sơ đồ + Câu hỏi định hướng)
Học sinh tự do đọc, quan sát rõ ràng ngay trước mắt
                                  ↓
[CHẶNG 3: NHIỆM VỤ THẢO LUẬN / THỰC HÀNH] (12 - 15 phút)
GV phát lệnh thảo luận → 18 máy mở khung bài làm (giữ nguyên lý thuyết bên cạnh)
2 em cùng thảo luận, giải bài toán, gõ code/câu trả lời → Bấm NỘP BÀI
Sơ đồ GV cập nhật thời gian thực: Máy nào đã nộp, máy nào đang làm
                                  ↓
[CHẶNG 4: BÁO CÁO, SPOTLIGHT & CỦNG CỐ] (12 - 15 phút)
1. Chiếu bài làm (Spotlight) 1-2 máy lên Tivi/Máy chiếu để cả lớp nhận xét
2. Chạy Trắc nghiệm thi đua (Live Quiz) 3-5 câu chốt kiến thức
3. GV bấm [KẾT THÚC TIẾT HỌC]: Lưu kết quả lớp 10A1, làm sạch 18 máy chuẩn bị cho lớp tiếp theo
```

---

## IV. CẤU TRÚC THƯ MỤC DỰ ÁN MỚI

Toàn bộ dự án tại `C:\Users\HPZBook\OneDrive - Sở GD&ĐT Quảng Ngãi\Desktop\LMS PHÒNG MÁY TƯƠNG TÁC` được thiết kế theo cấu trúc Module hóa sạch sẽ:

```
LMS PHÒNG MÁY TƯƠNG TÁC/
├── index.html                  # Giao diện chính (Gồm màn hình GV & màn hình HS)
├── style.css                   # Toàn bộ CSS giao diện, tối ưu độ tương phản phòng máy
├── manifest.json               # Cấu hình PWA để cài đặt ứng dụng ngoài Desktop
├── sw.js                       # Service Worker quản lý Cache tài nguyên & bài học
├── firebase.json               # Cấu hình chống lưu cache trình duyệt
├── database.rules.json         # Luật bảo mật cơ sở dữ liệu Firebase
├── data/
│   ├── classes.json            # Danh sách các lớp học (10A1, 10A2...) & danh sách học sinh
│   └── default-lessons.json    # Kho bài học mẫu Tin học (được trích xuất từ NotebookLM)
└── js/
    ├── app.js                  # Điểm khởi động ứng dụng & nhận diện vai trò (GV / HS)
    ├── core/
    │   ├── firebase-config.js  # Cấu hình và kết nối Firebase an toàn
    │   ├── store.js            # Quản lý trạng thái (State) và phiên dạy (Session)
    │   └── pwa-manager.js      # Quản lý cài đặt PWA và cập nhật bộ đệm
    └── modules/
        ├── teacher.js          # Nghiệp vụ GV: Điều phối nhịp, sơ đồ 18 máy, Spotlight
        ├── student.js          # Nghiệp vụ HS: Chọn tên đôi, đọc lý thuyết PWA, nộp bài
        ├── poll.js             # Động cơ Thăm dò nhanh tức thời (Chặng 1)
        └── quiz.js             # Động cơ Trắc nghiệm thi đua (Chặng 4)
```

---

## V. LỘ TRÌNH THỰC HIỆN TỪNG BƯỚC (STEP-BY-STEP IMPLEMENTATION)

* **Bước 1: Khởi tạo Bộ khung & Cấu hình PWA + Cache Control**:
  - Tạo `firebase.json` chuẩn chống cache, `manifest.json`, `sw.js`.
  - Xây dựng `index.html` và `style.css` khung với 2 không gian làm việc: Bảng điều khiển Giáo viên và Màn hình Học sinh.
* **Bước 2: Xây dựng Cơ sở Dữ liệu & Quản lý Đa Lớp (Multi-class Session)**:
  - Cấu trúc dữ liệu Firebase cho Danh sách lớp, Kho bài học và Phiên dạy (`activeSession`).
  - Màn hình điểm danh nhóm đôi 18 máy (1 máy 2 em).
* **Bước 3: Hoàn thiện [CHẶNG 1: KHỞI ĐỘNG TỨC THÌ]**:
  - Chế độ Thăm dò nhanh A-B-C-D (Quick Poll) & Câu hỏi soạn sẵn.
  - Biểu đồ Live Analytics trên máy GV, cơ chế ẩn kết quả đúng/sai trên máy HS.
* **Bước 4: Hoàn thiện [CHẶNG 2: KHÁM PHÁ LÝ THUYẾT PWA]**:
  - Trình kết xuất thẻ kiến thức NotebookLM (Text súc tích, Code block có màu cú pháp, sơ đồ).
  - Tải và nạp bài học từ bộ đệm Service Worker trong 0.1s.
* **Bước 5: Hoàn thiện [CHẶNG 3: THẢO LUẬN & NỘP BÀI]**:
  - Khung làm bài nhóm đôi, hỗ trợ nhập câu trả lời & dán code.
  - Sơ đồ ma trận 18 máy hiển thị trạng thái nộp bài theo thời gian thực.
* **Bước 6: Hoàn thiện [CHẶNG 4: SPOTLIGHT, QUIZ & KẾT THÚC PHIÊN]**:
  - Chế độ phóng to toàn màn hình bài làm học sinh (Spotlight).
  - Trắc nghiệm thi đua thời gian thực (ẩn đáp án, bảng xếp hạng pháo hoa).
  - Nút Kết thúc phiên: Lưu lịch sử, xuất Excel, làm sạch màn hình 18 máy cho lớp tiếp theo.
* **Bước 7: Kiểm thử Toàn diện & Bàn giao**:
  - Chạy kịch bản giả lập 18 máy đồng thời kiểm tra tải và độ trễ.
  - Kiểm tra tính năng làm mới cưỡng bức từ xa (Force Reload).

---

## VI. XÁC NHẬN ĐỂ BẮT ĐẦU TRIỂN KHAI

Kế hoạch này đã bao quát đầy đủ mọi góc cạnh khoa học giáo dục, đặc thù môn Tin học, năng lực phòng máy 18 máy và các giải pháp công nghệ chuẩn xác.

> **HÀNH ĐỘNG TIẾP THEO**:  
> Thầy hãy xem xét kỹ kế hoạch chi tiết trên. Khi thầy đồng ý, tôi sẽ tiến hành ngay **Bước 1: Khởi tạo Bộ khung dự án, cấu hình PWA và Header chống cache** trong thư mục `LMS PHÒNG MÁY TƯƠNG TÁC`!
