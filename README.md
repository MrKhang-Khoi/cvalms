# HỆ THỐNG LMS & DẠY HỌC TƯƠNG TÁC PHÒNG MÁY (18 MÁY - PAIR LEARNING)

## I. MỤC TIÊU DỰ ÁN
Phát triển nền tảng dạy học số tương tác chuyên biệt cho phòng máy 18 máy tính (mỗi máy 2 học sinh ngồi đôi), phục vụ giảng dạy trực tiếp theo tiến trình bài dạy tích cực (CV 5512 / GDPT 2018), do Giáo viên điều phối toàn bộ nhịp độ lớp học.

---

## II. KẾ THỪA TƯ TƯỞNG TỪ PHIÊN BẢN TRƯỚC
1. Trực quan hóa phòng máy: Sơ đồ 18 máy tính thời gian thực (trạng thái online, nộp bài, điểm số, bàn tay giơ phát biểu).
2. Học tập hợp tác & Đánh giá đa chiều:
   - Thảo luận nhóm nộp bài chung theo máy.
   - Đánh giá chéo giữa các máy (Peer Review).
   - Giáo viên nhận xét, chấm sao.
3. Trắc nghiệm thi đua (Gamification): Trắc nghiệm thời gian thực, bảng xếp hạng Leaderboard, âm thanh và hiệu ứng pháo hoa tạo hứng thú học tập.
4. Hỗ trợ công thức Toán/Khoa học: Tích hợp KaTeX hiển thị công thức chuẩn LaTeX.
5. Tiện ích sư phạm: Đồng hồ đếm ngược đồng bộ toàn phòng, Vòng quay ngẫu nhiên (Random Picker), Xuất báo cáo điểm chi tiết ra Excel.

---

## III. NÂNG CẤP ĐỘT PHÁ Ở PHIÊN BẢN MỚI
1. Tích hợp trạm học Lý thuyết (Micro-LMS):
   - Giáo viên đẩy nội dung lý thuyết trọng tâm (văn bản, sơ đồ, công thức, video ngắn) trực tiếp về 18 máy.
   - Màn hình học sinh hiển thị song song: Nửa trên/trái là lý thuyết tham khảo, nửa dưới/phải là phiếu thảo luận.
2. Cơ chế Nhóm đôi chuẩn hóa (1 Máy = 2 Học sinh):
   - Đăng nhập/chọn tên cặp 2 học sinh theo danh sách lớp.
   - Ghi nhận đóng góp chung của máy và đồng bộ điểm số cho cả 2 em.
3. Tiến trình bài dạy có người cầm trịch (Teacher-Paced Flow):
   - Giáo viên nắm toàn quyền chuyển đổi trạng thái: Lý thuyết -> Thảo luận -> Báo cáo & Spotlight -> Trắc nghiệm -> Tổng kết.
4. Khảo sát nhanh tức thời (Quick Poll A-B-C-D): Kiểm tra nhanh mức độ hiểu bài của học sinh trong 15-30 giây mà không cần soạn giáo án trước.
5. Khóa màn hình tập trung (Focus Mode): Vô hiệu hóa màn hình học sinh khi giáo viên cần cả lớp nhìn lên bảng.
6. Nút Giơ tay hỗ trợ (SOS): Học sinh gặp sự cố có thể phát tín hiệu trật tự lên sơ đồ máy của GV.

---

## IV. CẢI TIẾN KỸ THUẬT TRIỆT ĐỂ
1. Kiến trúc Module hóa: Tách nhỏ code thành các thành phần độc lập, không dồn vào 1 file monolithic 5.600 dòng.
2. Bảo mật: Ẩn đáp án trắc nghiệm ở máy học sinh, bảo vệ quyền giáo viên, chống can thiệp F12 Console.
3. Tối ưu Băng thông: Tự động nén ảnh bài làm xuống dưới 100KB, tự động dọn dẹp (cleanup) listeners chống tràn bộ nhớ.
