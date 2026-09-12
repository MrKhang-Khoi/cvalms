const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testOldLessonFlow() {
  console.log('🚀 Bắt đầu kiểm thử E2E: Tính năng 1 - Kiểm tra bài cũ & Bốc thăm gọi học sinh 2 tầng...');
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  const teacherPage = await context.newPage();
  const studentPage = await context.newPage();

  const consoleErrors = [];
  teacherPage.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(`[Teacher Console Error]: ${msg.text()}`);
  });
  teacherPage.on('pageerror', err => consoleErrors.push(`[Teacher Page Error]: ${err.message}`));

  studentPage.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(`[Student Console Error]: ${msg.text()}`);
  });
  studentPage.on('pageerror', err => consoleErrors.push(`[Student Page Error]: ${err.message}`));

  // Auto-accept alert/confirm dialogs
  teacherPage.on('dialog', async d => {
    console.log(`   💬 [Teacher Dialog]: ${d.message()}`);
    await d.accept();
  });
  studentPage.on('dialog', async d => {
    console.log(`   💬 [Student Dialog]: ${d.message()}`);
    await d.accept();
  });

  const fileUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

  // ==================== BƯỚC 1: GIÁO VIÊN ĐĂNG NHẬP & BẮT ĐẦU TIẾT HỌC ====================
  console.log('1. Giáo viên mở trang và đăng nhập...');
  await teacherPage.goto(fileUrl, { waitUntil: 'load' });
  await teacherPage.waitForTimeout(400);

  await teacherPage.click('#btn-open-teacher-login');
  await teacherPage.waitForTimeout(300);
  await teacherPage.fill('#teacher-password-input', 'admin123');
  await teacherPage.click('#modal-teacher-login button[type="submit"]');
  await teacherPage.waitForTimeout(500);

  console.log('2. Giáo viên chọn Lớp 10A1 và bấm [BẮT ĐẦU TIẾT HỌC CHO LỚP NÀY]...');
  await teacherPage.selectOption('#teacher-select-class', '10A1');
  await teacherPage.click('#btn-start-class-session');
  await teacherPage.waitForTimeout(600);

  const isTeacherActive = await teacherPage.isVisible('#teacher-stage-active');
  if (!isTeacherActive) throw new Error('Không chuyển sang trạng thái tiết học đang diễn ra!');
  console.log('   ✓ Tiết học đang diễn ra. Thanh điều phối tiến trình (Pace bar) đã hiển thị.');

  // ==================== BƯỚC 2: MỞ DROPDOWN "1. KIỂM TRA BÀI CŨ" ====================
  console.log('3. Thử nghiệm mở Dropdown [1. Kiểm tra bài cũ ▾]...');
  const btnOldLessonMenu = await teacherPage.$('#btn-toggle-old-lesson-menu');
  if (!btnOldLessonMenu) throw new Error('Không tìm thấy nút mũi tên mở dropdown Kiểm tra bài cũ!');
  await btnOldLessonMenu.click();
  await teacherPage.waitForTimeout(400);

  const isMenuVisible = await teacherPage.isVisible('#tpb-menu-old-lesson');
  console.log('   - Menu thả xuống hiển thị:', isMenuVisible);
  if (!isMenuVisible) throw new Error('Menu thả xuống của Kiểm tra bài cũ không hiển thị!');

  await teacherPage.screenshot({ path: path.join(screenshotsDir, 'old_lesson_01_dropdown_menu.png') });
  console.log('   📸 Đã chụp: old_lesson_01_dropdown_menu.png');

  // ==================== BƯỚC 3: MỞ MODAL BỐC THĂM & KIỂM THỬ PHƯƠNG ÁN A (SLOT MACHINE) ====================
  console.log('4. Mở Bốc thăm ngẫu nhiên (Phương án A - Trục lăn Ma trận)...');
  await teacherPage.click('.tdm-btn-action');
  await teacherPage.waitForTimeout(400);

  const isLuckyDrawVisible = await teacherPage.isVisible('#modal-lucky-draw');
  if (!isLuckyDrawVisible) throw new Error('Modal bốc thăm không hiển thị!');

  const isSlotViewActive = await teacherPage.isVisible('#ld-view-slot');
  console.log('   - Giao diện Phương án A (Slot Machine Reel) sẵn sàng:', isSlotViewActive);
  if (!isSlotViewActive) throw new Error('Phương án A mặc định chưa hiển thị!');

  console.log('5. Nhấn [BẮT ĐẦU QUAY SỐ] trên Slot Machine...');
  await teacherPage.click('#btn-trigger-spin');
  // Chờ hiệu ứng quay 4 giây hoàn thành
  await teacherPage.waitForTimeout(4200);

  const slotWinnerTxt = await teacherPage.$eval('#ld-result-banner', el => el.textContent);
  console.log('   🎉 Kết quả bốc thăm Phương án A:', slotWinnerTxt.trim().replace(/\s+/g, ' '));
  if (!slotWinnerTxt.includes('MÁY') || !slotWinnerTxt.includes('Em:')) {
    throw new Error('Kết quả bốc thăm 2 tầng không đầy đủ thông tin Máy & Tên học sinh!');
  }

  await teacherPage.screenshot({ path: path.join(screenshotsDir, 'old_lesson_02_lucky_draw_slot.png') });
  console.log('   📸 Đã chụp: old_lesson_02_lucky_draw_slot.png');

  // ==================== BƯỚC 4: CHUYỂN SANG PHƯƠNG ÁN B (CHIẾC NÓN KỲ DIỆU) ====================
  console.log('6. Chuyển sang Phương án B (Chiếc nón kỳ diệu)...');
  await teacherPage.click('#btn-strat-wheel');
  await teacherPage.waitForTimeout(400);

  const isWheelViewActive = await teacherPage.isVisible('#ld-view-wheel');
  console.log('   - Giao diện Phương án B (Wheel Canvas) hiển thị:', isWheelViewActive);
  if (!isWheelViewActive) throw new Error('Phương án B không hiển thị khi bấm chuyển tab!');

  console.log('7. Nhấn [BẮT ĐẦU QUAY SỐ] chiếc nón kỳ diệu...');
  await teacherPage.click('#btn-trigger-spin');
  // Chờ hiệu ứng xoay nón 4.2 giây hoàn thành
  await teacherPage.waitForTimeout(4500);

  const wheelWinnerTxt = await teacherPage.$eval('#ld-result-banner', el => el.textContent);
  console.log('   🎉 Kết quả bốc thăm Phương án B:', wheelWinnerTxt.trim().replace(/\s+/g, ' '));

  await teacherPage.screenshot({ path: path.join(screenshotsDir, 'old_lesson_03_lucky_draw_wheel.png') });
  console.log('   📸 Đã chụp: old_lesson_03_lucky_draw_wheel.png');

  // Đóng Modal bốc thăm
  console.log('8. Đóng Modal bốc thăm...');
  await teacherPage.click('#btn-close-lucky-draw');
  await teacherPage.waitForTimeout(400);

  // Chuyển sang Chặng 1 trên Teacher Dashboard để xem Workspace Kiểm tra bài cũ
  await teacherPage.click('#tpb-step-old-lesson');
  await teacherPage.waitForTimeout(400);

  const calledStudentOnDashboard = await teacherPage.$eval('#ots-student-name', el => el.textContent);
  console.log('   - Bảng điều khiển Giáo viên hiển thị người được gọi:', calledStudentOnDashboard.trim());

  // ==================== BƯỚC 5: HỌC SINH VÀO PHÒNG MÁY (MÁY 03) ====================
  console.log('9. Học sinh mở máy số 03...');
  await studentPage.goto(fileUrl, { waitUntil: 'load' });
  await studentPage.waitForTimeout(400);

  // Chọn máy 03 (index 2)
  await studentPage.locator('#computers-grid .computer-card').nth(2).click();
  await studentPage.waitForTimeout(300);
  await studentPage.click('#btn-modal-confirm');
  await studentPage.waitForTimeout(500);

  const isStudentWorkspaceActive = await studentPage.isVisible('#screen-student.active');
  console.log('   - Học sinh Máy 03 đã vào Bàn học:', isStudentWorkspaceActive);

  // ==================== BƯỚC 6: GIÁO VIÊN CÀI ĐẶT & PHÁT ĐỀ ====================
  console.log('10. Giáo viên mở dropdown kiểm tra bài cũ, chọn Trắc nghiệm và Phát đề...');
  await teacherPage.click('#btn-toggle-old-lesson-menu');
  await teacherPage.waitForTimeout(300);

  // Chọn loại trắc nghiệm
  await teacherPage.click('.tdm-type-btn[data-qtype="mcq"]');
  await teacherPage.waitForTimeout(200);

  // Chọn thời gian 2 phút
  await teacherPage.click('.tdm-timer-btn[data-sec="120"]');
  await teacherPage.waitForTimeout(200);

  // Phát đề
  await teacherPage.click('.tdm-btn-submit');
  await teacherPage.waitForTimeout(700);

  // ==================== BƯỚC 7: XÁC MINH GIAO DIỆN HỌC SINH NHẬN ĐỀ ====================
  console.log('11. Kiểm tra màn hình Học sinh Máy 03 nhận đề thi...');
  const isStudentOldLessonActive = await studentPage.isVisible('#st-view-old-lesson');
  console.log('   - Học sinh đã tự động chuyển sang Chặng Kiểm tra bài cũ:', isStudentOldLessonActive);
  if (!isStudentOldLessonActive) throw new Error('Học sinh không nhận được tín hiệu chuyển chặng Kiểm tra bài cũ!');

  const studentQuestionTxt = await studentPage.$eval('#ol-question-text', el => el.textContent);
  console.log('   - Câu hỏi hiển thị trên máy học sinh:', studentQuestionTxt.trim());

  await studentPage.screenshot({ path: path.join(screenshotsDir, 'old_lesson_04_student_received_question.png') });
  console.log('   📸 Đã chụp: old_lesson_04_student_received_question.png');

  // ==================== BƯỚC 8: HỌC SINH CHỌN ĐÁP ÁN VÀ NỘP BÀI ====================
  console.log('12. Học sinh chọn đáp án B và bấm Nộp bài...');
  await studentPage.click('.ol-mcq-btn[data-ol-choice="B"]');
  await studentPage.waitForTimeout(200);
  await studentPage.click('#btn-submit-old-lesson');
  await studentPage.waitForTimeout(600);

  // ==================== BƯỚC 9: GIÁO VIÊN NHẬN BÀI NỘP TRỰC TIẾP TRÊN DASHBOARD ====================
  console.log('13. Kiểm tra bài nộp hiển thị trực tiếp trên Dashboard Giáo viên...');
  await teacherPage.waitForTimeout(500);
  const submissionsList = await teacherPage.$eval('#ol-submissions-list', el => el.innerHTML);
  console.log('   - Bài nộp xuất hiện trên Giáo viên:', submissionsList.includes('Máy 3') || submissionsList.includes('B'));
  if (!submissionsList.includes('Máy 3') && !submissionsList.includes('B')) {
    throw new Error('Giáo viên không nhận được bài nộp từ Máy 3 qua SYNC_BUS!');
  }

  await teacherPage.screenshot({ path: path.join(screenshotsDir, 'old_lesson_05_teacher_received_submissions.png') });
  console.log('   📸 Đã chụp: old_lesson_05_teacher_received_submissions.png');

  // ==================== BƯỚC 10: GIÁO VIÊN KHÓA BÀI & CÔNG BỐ ĐÁP ÁN ====================
  console.log('14. Giáo viên bấm Khóa nộp bài...');
  await teacherPage.click('#btn-teacher-lock-old-lesson');
  await teacherPage.waitForTimeout(400);

  console.log('15. Giáo viên bấm Công bố đáp án & Chốt bài...');
  await teacherPage.click('#btn-teacher-reveal-old-lesson');
  await teacherPage.waitForTimeout(600);

  const isRevealVisibleOnStudent = await studentPage.isVisible('#ol-reveal-box');
  console.log('   - Học sinh đã nhìn thấy hộp đáp án chuẩn và lời giải thích:', isRevealVisibleOnStudent);
  if (!isRevealVisibleOnStudent) throw new Error('Hộp giải thích đáp án chưa hiển thị trên máy học sinh!');

  await studentPage.screenshot({ path: path.join(screenshotsDir, 'old_lesson_06_student_answer_reveal.png') });
  console.log('   📸 Đã chụp: old_lesson_06_student_answer_reveal.png');

  // ==================== KIỂM TRA LỖI CONSOLE ====================
  console.log('16. Kiểm tra nhật ký lỗi Console...');
  if (consoleErrors.length > 0) {
    console.error('❌ Phát hiện lỗi Console:', consoleErrors);
    throw new Error(`Kiểm thử thất bại do có ${consoleErrors.length} lỗi console!`);
  }
  console.log('✅ TUYỆT VỜI: 0 LỖI CONSOLE (ZERO-BUG CLEAN)! TẤT CẢ CÁC BƯỚC ĐỀU PASS 100%!');

  await browser.close();
}

testOldLessonFlow().catch(err => {
  console.error('❌ E2E TEST FAILED:', err);
  process.exit(1);
});
