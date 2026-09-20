# ĐẶC TẢ YÊU CẦU KỸ THUẬT & KIẾN TRÚC HỆ THỐNG (SPEC.md)
# DỰ ÁN: LMS PHÒNG MÁY TƯƠNG TÁC 18 MÁY - MÔN TIN HỌC THCS (KHỐI 6, 7, 8, 9)
**Phiên bản**: v3.2.0 • **Chuẩn kiểm định**: Alibaba Open-Code-Review & OpenAI Codex Auto-Review

---

## 1. TỔNG QUAN DỰ ÁN & MỤC TIÊU SƯ PHẠM (SYSTEM OVERVIEW)
- **Mục tiêu**: Xây dựng nền tảng phần mềm LMS Web tương tác thời gian thực dành riêng cho phòng máy vi tính trường THCS (chuẩn 18 máy bàn, 36 học sinh ngồi theo cặp đôi 2 em/máy).
- **Phạm vi đối tượng**: Học sinh THCS cấp 2 (Khối 6, Khối 7, Khối 8, Khối 9) học tập môn Tin học theo chương trình GDPT 2018 (Sách Kết Nối Tri Thức / Cánh Diều).
- **Mô hình vận hành**: Single Page Application (SPA), chạy trực tiếp trên trình duyệt Web (Chrome, Edge, Cốc Cốc) qua mạng nội bộ LAN phòng máy hoặc Internet, không yêu cầu cài đặt phần mềm phức tạp, hỗ trợ PWA và Offline-resilient.

---

## 2. KIẾN TRÚC KỸ THUẬT CỐT LÕI (CORE ARCHITECTURE)

### 2.1. Cấu Trúc Mã Nguồn & Module
- `index.html`: Cấu trúc giao diện ngữ nghĩa chuẩn HTML5, tích hợp CSS Responsive, Font Awesome icons, Canvas Confetti, SheetJS (XLSX).
- `js/bundle.js`: Động cơ xử lý chính bao gồm:
  1. `SOUNDS`: Động cơ âm thanh Web Audio API tổng hợp (chuông, click, buzzer, slot machine spin, winner fanfare), không phụ thuộc file MP3 ngoài.
  2. `STORE`: Quản trị trạng thái tập trung (Centralized State Management) theo mô hình Observer Pattern, dữ liệu bất biến (immutability), phản ứng đồng bộ (synchronous reactivity).
  3. `SYNC_BUS`: Động cơ đồng bộ thời gian thực kép:
     - Kênh nội bộ: `BroadcastChannel('lms_machine_sync')` cho đa tab/đa cửa sổ trên cùng máy.
     - Kênh phòng máy: `Firebase Realtime Database` đồng bộ các node `activeSession`, `lessons`, `classes`, `presence` với độ trễ < 300ms.
  4. `EMBEDDED_CLASSES`: Cơ sở dữ liệu 9 lớp THCS (6A1, 6A2, 6A3, 7A1, 7A2, 8A1, 8A2, 9A1, 9A2) với 34-38 học sinh mỗi lớp, tự động ánh xạ 18 cặp đôi.
  5. `DEFAULT_LESSONS`: Kho bài dạy chuẩn GDPT 2018 cho 4 khối 6, 7, 8, 9 (Thuật toán & Sơ đồ khối, Thiết bị vào ra, Hàm Excel, Lịch sử máy tính, Lập trình Scratch, Trí tuệ nhân tạo AI, Python).
  6. `APP`: Bộ điều khiển trung tâm (Master Controller) phân chia thành các module sảnh, học sinh, giáo viên, xưởng soạn bài, bàn điều khiển sân khấu.

### 2.2. Cơ Chế Nhận Diện Phần Cứng & Token Guard
- Mỗi máy tính được gán định danh cố định `machineId` (1..18) lưu vào `localStorage.getItem('lms_fixed_machine_id')`.
- Khi máy đã được gán, hệ thống kích hoạt **Token Guard** (`APP.checkMachineTokenGuard()`):
  - Học sinh chỉ có thể vào đúng số máy của mình, nếu click máy khác sẽ tự động chuyển hướng về máy đã gán.
  - Ngăn chặn triệt để tình trạng học sinh nghịch ngợm bấm chọn nhầm máy của bạn khác hoặc tranh chấp máy.
  - Cung cấp nút "Đặt lại nhớ máy" cho giáo viên khi cần bố trí lại vị trí phòng máy.

### 2.3. Cơ Chế Xác Thực Giáo Viên Chuẩn Mật Mã SHA-256
- Giáo viên đăng nhập qua modal bảo mật độc lập `#modal-teacher-login`.
- Mật khẩu nhập vào được băm mật mã thời gian thực bằng Web Cryptography API (`crypto.subtle.digest('SHA-256', ...)`), có cơ chế Fallback thuật toán SHA-256 thuần chuẩn NIST FIPS 180-4 khi môi trường thiếu secure context.
- Đối chiếu digest với danh sách `VALID_PASSWORD_HASHES` (`240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9` và `33c39cf33ac4a48e2fb588c2fbb99092043744f685a6f5c8d91c8f554139604b`).
- Nghiêm cấm hoàn toàn lưu trữ plain-text password hoặc so sánh chuỗi trần trong toàn bộ mã nguồn client.

### 2.4. Đồng Bộ Nhịp Thời Gian Master NTP & Lockstep Timer
- Đồng hồ đếm ngược hoạt động theo chuẩn Master-Slave thông qua Firebase RTDB:
  - Lắng nghe sự kiện chênh lệch máy chủ `.info/serverTimeOffset` lưu vào `state.serverTimeOffset`.
  - Mọi mốc thời gian hết hạn (`timerDeadline`) được tính toán theo thời gian mạng chuẩn hóa: `nowNetwork = Date.now() + state.serverTimeOffset`.
  - Triệt tiêu 100% hiện tượng máy học sinh bị sai giờ cục bộ (local clock drift) dẫn đến nộp bài sớm hoặc muộn hơn thực tế.

### 2.5. Khả Năng Vận Hành Offline & Kháng Lỗi Mạng (PWA & Offline-Resilient)
- Khi mất kết nối Internet hoặc mạng LAN nội bộ phòng máy gặp sự cố:
  - Hệ thống tự động kích hoạt chế độ Fallback, nạp toàn bộ cấu hình 9 lớp học (`EMBEDDED_CLASSES`) và ngân hàng bài dạy chuẩn GDPT 2018 (`DEFAULT_LESSONS`) từ bộ nhớ cục bộ mà không dừng đột ngột.
  - Cơ chế đồng bộ cục bộ qua `BroadcastChannel('lms_machine_sync')` tiếp tục đảm bảo các phiên kiểm thử và trình chiếu trên cùng phòng máy hoạt động liên tục.
  - Áp dụng kỹ thuật Cache-Busting `?v=3.2.0` cho `style.css` và `js/bundle.js` trong `index.html` ngăn ngừa trình duyệt nạp script cũ từ cache.

### 2.6. Hàng Đợi Ngoại Tuyến & Tự Động Thử Lại (Offline-Resilient Queue & Retry Backoff)
- 100% mọi thao tác ghi dữ liệu (cập nhật tiến trình sư phạm, nộp bài trắc nghiệm, phát đề H4, kích hoạt phòng máy, SOS, Lucky Draw) đều bắt buộc đi qua bộ điều phối `safeFirebaseWrite(op, path, data, maxAttempts = 3)`:
  - Thực hiện đúng tối đa 3 lần thử (1 lần gốc + 2 lần thử lại) với thuật toán giãn cách thời gian (Exponential Backoff: lần 1 thất bại -> chờ 350ms -> thử lần 2; lần 2 thất bại -> chờ 700ms -> thử lần 3).
  - Khi vượt quá 3 lần thử hoặc mất kết nối hoàn toàn, hành động được chuyển vào hàng đợi ngoại tuyến `OFFLINE_QUEUE_KEY` trong `localStorage` với cơ chế khử trùng lặp (Deduplication: tự động cập nhật bản ghi nếu cùng path và cùng op).
  - Động cơ `flushOfflineQueue()` xử lý nguyên tử: CHỈ XÓA từng phần tử khỏi `localStorage` sau khi nhận được xác nhận ghi thành công từ Cloud RTDB. Nếu có lỗi mạng giữa chừng, quá trình flush dừng lại để bảo toàn dữ liệu còn lại, triệt tiêu 100% nguy cơ mất dữ liệu (Zero Data Loss).

### 2.7. Toàn Vẹn Dữ Liệu Bài Thi & Chống Tái Sử Dụng Trạng Thái Cũ (Deep Quiz Invariant)
- Để ngăn ngừa triệt để lỗi học sinh bị khóa nút nộp bài hoặc nhận kết quả của đề thi trước khi giáo viên đổi cấu hình bài học:
  - Hệ thống so sánh sâu toàn diện: `JSON.stringify(prevQuiz) !== JSON.stringify(nextQuiz)`. Khi bất kỳ thuộc tính nào của đề thi thay đổi (câu hỏi, dạng trắc nghiệm, các lựa chọn, đáp án chuẩn, mệnh đề Đúng/Sai, hay thời lượng), máy học sinh tự động giải phóng trạng thái cũ (`quizAnswered: false`, `quizSelection: null`, `quizPacketSubmitted: false`).
  - Khi giáo viên lưu kịch bản mới trong Studio hoặc phát lệnh phase Quiz, node `activeSession/quizAnswers` trên Firebase RTDB được dọn sạch để đảm bảo dữ liệu bài nộp luôn đồng nhất với đề thi hiện tại.

### 2.8. Chống Sự Kiện Trùng Lặp & Ràng Buộc Tiết Học Đa Kênh (H4 LessonId & ActivityId Guard)
- Mọi sự kiện phát động hoạt động (H4_ARENA_START, H4_QUIZ_DELIVER, H4_REVEAL_PODIUM) được gắn kèm cặp định danh bất biến:
  - `lessonId`: Ràng buộc bài học hiện hành, ngăn chặn máy học sinh nhận nhầm đề thi của lớp/bài khác.
  - `activityId`: Định danh duy nhất phiên phát lệnh (ví dụ: `h4_deliver_1710928300000`), được đồng bộ đồng thời lên cả `activeSession/h4State` trên Firebase RTDB và `BroadcastChannel`.
  - Cả hai kênh truyền thông đều kiểm tra `lastActivityId` để loại bỏ 100% gói tin trùng lặp khi mạng truyền chậm (Network Drift / Echo Loop).

### 2.9. Tiêu Chuẩn Bảo Mật Kiểm Thử, Độc Lập Tri Thức & Zero Console Error Exclusions
- Nghiêm cấm hoàn toàn hành vi "đọc trộm đáp án từ giao diện giáo viên" trong kịch bản kiểm thử tự động. Mọi bài test anti-cheat và chấm điểm trắc nghiệm bắt buộc phải đối chiếu với Ngân hàng Tri thức Độc lập chuẩn SGK Tin học GDPT 2018 (`GROUND_TRUTH`).
- Credential xác thực kiểm thử Firebase Auth Token được lưu trữ thuần túy trong RAM (In-Memory Only), cấm ghi plaintext ra file tạm trên đĩa. Kiểm tra tính hợp lực thực tế qua `probe.ok` (HTTP 200..299).
- Triệt tiêu hoàn toàn lỗi Favicon bằng inline SVG data URI trên `index.html` và phản hồi HTTP 204 trên server kiểm thử; loại bỏ mọi bộ lọc ngoại lệ dạng chuỗi, đảm bảo đo đạc 0 lỗi console F12 trung thực tuyệt đối.

---

## 3. ĐẶC TẢ CHI TIẾT CÁC PHÂN HỆ NGHIỆP VỤ (FUNCTIONAL SPECIFICATIONS)

### 3.1. Phân Hệ 1: Sảnh Chọn Máy Tính (Lobby Screen)
- **Lưới 18 máy tính trực quan**:
  - Hiển thị 3 trạng thái màu sắc: Xanh ngọc (Trống - Sẵn sàng chọn), Đỏ cam (Đã có bạn chọn - Khóa), Vàng Neon (Vị trí máy của em).
  - Tự động hiển thị tên 2 bạn học sinh được phân công tại máy theo sơ đồ lớp học.
- **Khóa Sảnh An Toàn (Lobby Security Lock)**:
  - Mặc định khi giáo viên chưa kích hoạt tiết học, toàn bộ 18 máy ở trạng thái KHÓA CỨNG kèm biểu tượng ổ khóa và thông điệp: *"Phòng máy đang chờ giáo viên kích hoạt tiết học"*.
  - Chỉ khi giáo viên chọn Lớp và bấm *"LƯU LẠI & KÍCH HOẠT TIẾT HỌC"*, sảnh mới tự động mở khóa tức thì cho học sinh chọn máy.
- **Modal Xác Nhận Vị Trí Cặp Đôi**:
  - Khi học sinh bấm vào máy trống, modal hiện tên 2 bạn để xác nhận lần cuối trước khi vào lớp.

### 3.2. Phân Hệ 2: Không Gian Học Sinh (Student Workspace)
- **Header Định Danh Rõ Ràng**:
  - Huy hiệu số máy (`MÁY 04`), Tên 2 học sinh ngồi chung máy, Nhãn lớp (`Lớp 6A1 • Môn Tin học THCS`), Trạng thái trực tuyến, Nút Đổi máy, Nút SOS trợ giúp.
- **Chặng 0: Sảnh Chờ Đấu Trường (Waiting Lobby)**:
  - Hiệu ứng ánh sáng vũ trụ Cosmic Glow, thẻ Neon Hologram danh tính của máy.
  - Radar sĩ số quét 18 máy: Hiển thị thời gian thực số lượng máy đã kết nối vào phòng.
  - Thông báo đón nhận lệnh đếm ngược đồng bộ 3... 2... 1... 🚀 từ giáo viên.
- **Chặng 1: Kiểm Tra Bài Cũ (Step 1: Old Lesson)**:
  - Hộp thoại Neon Lucky Card nổi bật trên máy học sinh được gọi tên bốc thăm.
  - Chiếu câu hỏi kiểm tra bài cũ (trả lời miệng hoặc trắc nghiệm nhanh).
  - Chiếu Banner Đáp Án Chuẩn & Lời giải thích khi giáo viên bấm công bố.
- **Chặng 2: Khám Phá SGK & Thẻ Tri Thức (Step 2: Theory Exploration)**:
  - Giao nhiệm vụ đọc sách giáo khoa có hẹn giờ.
  - Hiển thị thẻ kiến thức cô đọng (NotebookLM digest), hỗ trợ nạp tức thì từ cache PWA.
- **Chặng 3: Thảo Luận & Thực Hành Nhóm Đôi (Step 3: Pair Practice & Discussion)**:
  - Giao diện chia đôi màn hình thông minh (Smart Split-View): Cột trái tra cứu lý thuyết, cột phải khung soạn bài làm.
  - Khung soạn thảo code/nội dung font monospace `Fira Code`.
  - Nút nộp bài trực tuyến, tự động cập nhật trạng thái "Đã nộp bài" lên bảng điều khiển của giáo viên kèm timestamp.
- **Chặng 4: Đấu Trường Trắc Nghiệm Live Quiz (Step 4: Dynamic Quiz Arena)**:
  - Hỗ trợ đa dạng 3 dạng trắc nghiệm:
    1. Trắc nghiệm 4 lựa chọn (Single Choice): Khung màu Kahoot (Đỏ, Lam, Vàng, Lục) tự động đảo vị trí chống nhìn bài.
    2. Trắc nghiệm Đúng/Sai (True/False): 4 mệnh đề a, b, c, d độc lập, mỗi mệnh đề có nút chọn Đúng hoặc Sai.
    3. Trắc nghiệm Trả lời ngắn / Điền kết quả (Short Answer): Ô nhập chuỗi hoặc số, tự động so khớp kết quả chuẩn.
  - Hỗ trợ Gói câu hỏi trắc nghiệm (Packet Quiz): Học sinh làm tuần tự các câu hỏi với thanh điều hướng "Câu trước", "Câu tiếp theo" và nút "Nộp bài hoàn thành".
  - Phản hồi tức thì sau khi chọn, tính điểm xếp hạng thi đua thời gian thực.

### 3.3. Phân Hệ 3: Bảng Điều Khiển Giáo Viên (Teacher Command Center)
Đăng nhập bảo mật mã hóa SHA-256 qua modal độc lập. Giao diện chia làm 3 phân hệ qua Tab điều hướng:

#### Tab 1: Quản Lý Lớp & Sĩ Số (Classes Management)
- **Bộ lọc khối lớp THCS**: Khối 6, Khối 7, Khối 8, Khối 9.
- **Quản lý danh sách lớp**: 6A1, 6A2, 6A3, 7A1, 7A2, 8A1, 8A2, 9A1, 9A2.
- **Sơ đồ phân bổ 18 máy tính**: Xem và chỉnh sửa trực tiếp 2 học sinh trên từng máy.
- **Tích hợp Excel (SheetJS)**:
  - Tải file Excel mẫu với cấu trúc chuẩn (`STT`, `Máy số`, `Học sinh 1`, `Học sinh 2`, `Ghi chú`).
  - Nhập danh sách lớp từ file `.xlsx`, `.xls`, `.csv` tự động ánh xạ vào sơ đồ máy.
  - Xuất sơ đồ lớp hiện tại ra file Excel để in ấn, lưu trữ.

#### Tab 2: Xưởng Soạn Kịch Bản (Studio Editor)
- **Thanh chọn Khối & Quản lý Bài dạy**:
  - 4 nút chọn Khối 6, Khối 7, Khối 8, Khối 9 lọc danh sách bài dạy tương ứng.
  - Nút "Tạo bài dạy mới" tự động gán mã bài theo khối THCS (ví dụ: `lesson_6_...`).
  - Nút "Xóa bài dạy" có xác nhận an toàn, tự động chuyển về bài mẫu hợp lệ.
- **Kiến trúc Mục Bài Học Động (Dynamic Sections)**:
  - Cho phép Thêm/Xóa không giới hạn các Mục bài học (`Mục 1`, `Mục 2`, `Mục 3`...).
  - Trong mỗi mục, cho phép Thêm/Xóa/Bật/Tắt linh hoạt từng hoạt động con:
    * Hoạt động Khám phá SGK & Thẻ tri thức.
    * Hoạt động Trắc nghiệm củng cố (cho phép chọn 1 câu hoặc Gói nhiều câu với các dạng câu hỏi khác nhau).
    * Hoạt động Thực hành trên máy tính.
- **Quản lý Đa Dạng Câu Hỏi Trắc Nghiệm**:
  - Chuyển đổi linh hoạt giữa các dạng câu hỏi: Single Choice, True/False 4 ý, Short Answer.
  - Thêm/Xóa câu hỏi trong gói trắc nghiệm của từng mục bài học.
- **Tích hợp Excel Kịch Bản Dạy Học**:
  - Tải file Excel mẫu kịch bản bài dạy (các cột: Khối, Tên bài, Mục số, Tên mục, Loại hoạt động, Câu hỏi, Đáp án, Thời lượng).
  - Nhập kịch bản trực tiếp từ Excel vào Studio.
- **Xem Trước Kịch Bản (Lesson Blueprint Preview Modal)**:
  - Hiển thị Bản đồ Tiến trình Sư phạm trực quan dạng bảng tổng hợp: Thời lượng dự kiến, Mục tiêu, Nội dung, Chu trình 4 nút điều khiển.
  - Nút "Áp dụng & Lưu kịch bản" từ modal xem trước.

#### Tab 3: Bàn Điều Khiển Sân Khấu (Stage Controller)
- **Giai đoạn 1: Chuẩn Bị & Khởi Tạo (Hardware Stage)**:
  - Chọn Khối (6-9), Chọn Lớp (6A1-9A2), Chọn Bài dạy Tin học THCS.
  - Thanh trạng thái kiểm tra kết nối phần cứng 18 máy (Online/Offline).
  - Nút *"LƯU LẠI & KÍCH HOẠT TIẾT HỌC"*: Chuyển sang Giai đoạn 2 và tự động mở khóa sảnh cho học sinh.
- **Giai đoạn 2: Sân Khấu Điều Khiển Trực Tiếp (Active Stage)**:
  - **Quy trình 4 Nút Tuần Tự (4-Step Sequential Rhythm)** áp dụng đồng nhất trên tất cả các hoạt động:
    * Nút 1: Khởi động / Bốc thăm / Giao nhiệm vụ / Phát đề.
    * Nút 2: Bắt đầu làm bài / Tính giờ / Mở trắc nghiệm.
    * Nút 3: Thu bài / Công bố đáp án chuẩn / Bục vinh danh.
    * Nút 4: Hoàn thành hoạt động & Chuyển về phòng chờ an toàn.
  - **Vòng Quay / Slot Machine Bốc Thăm**:
    * 2 chế độ: Máy đánh bạc (Slot Machine 3D) và Vòng quay may mắn (Wheel of Fortune).
    * Hiệu ứng âm thanh chân thực, tự động ghim khung viền vàng Gold Neon cho máy trúng thưởng.
  - **Bộ Đếm Giờ Master NTP (Lockstep Timer)**:
    * Đồng bộ thời gian thực dựa trên độ lệch máy chủ Firebase (`_serverTimeOffset`).
    * Hỗ trợ Tạm dừng (Pause), Tiếp tục (Resume), Cộng thêm thời gian (+30s).
    * Cảnh báo nhấp nháy đỏ khi còn dưới 10 giây.
  - **Nút "RESET VỀ PHÒNG CHỜ"**:
    * Lệnh khẩn cấp từ giáo viên lập tức thu hồi toàn bộ 18 máy về sảnh chờ khi học sinh mất tập trung hoặc hết tiết học.
  - **Bục Vinh Danh Podium 3D & Pháo Hoa Confetti**:
    * Tôn vinh top 3 máy có điểm số và tốc độ cao nhất trong các hoạt động trắc nghiệm.

---

## 4. TIÊU CHUẨN AN TOÀN & BẤT BIẾN KỸ THUẬT (SYSTEM INVARIANTS & INTEGRITY)

1. **Tuân Thủ Tuyệt Đối Chuẩn Alibaba Open-Code-Review**:
   - `0 var`: Toàn bộ biến khai báo bằng `const` hoặc `let`.
   - `0 == lỏng`: So sánh bắt buộc dùng `===` hoặc `!==`.
   - `0 nuốt lỗi`: Tuyệt đối không dùng `catch (e) {}` rỗng; mọi lỗi đều phải được log hoặc xử lý có kiểm soát.
   - `0 mock ảo`: Trạng thái máy trực tuyến, bài nộp, điểm số phải phản ánh đúng sự kiện từ client và Firebase, cấm dùng cờ giả tạo trạng thái online.
2. **Cơ Chế Tương Thích Ngược An Toàn (Backward Compatibility)**:
   - Ánh xạ alias tự động nếu trình duyệt của học sinh hoặc giáo viên còn lưu trữ session cũ từ cấp 3: `10A1 -> 6A1`, `10A2 -> 6A2`, `11A1 -> 7A1`, `12A1 -> 9A1`; `tin10_bai12 -> tin6_bai12`.
   - Không bao giờ để xảy ra ngoại lệ `Cannot read properties of undefined` khi nạp dữ liệu cũ từ `localStorage`.
3. **Cơ Chế Chống Đọng Cache (Cache-Busting)**:
   - Các tài nguyên CSS và JS liên kết trong `index.html` bắt buộc có tham số phiên bản `?v=3.2.0`.
4. **Kiểm Thử Tự Động Toàn Diện (Zero-Bug Test Suite)**:
   - V8 syntax validation: `node -c js/bundle.js` không có lỗi cú pháp.
   - Oxlint correctness: `npx oxlint js/ -D correctness` đạt 0 error, 0 warning.
   - Playwright Dual-Context: Kịch bản mô phỏng 2 trình duyệt độc lập (Giáo viên và Học sinh) xác thực chu trình 4 nút tuần tự trên tất cả các hoạt động, đo đạc 0 lỗi console F12 (`npm run test:universal`).
