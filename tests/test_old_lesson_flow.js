const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testOldLessonFlow() {
  console.log('🚀 Bắt đầu kiểm thử E2E: Tối giản hóa Học sinh & Cô lập Tab Giáo viên 100%...');
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

  // ==================== BƯỚC 1: HỌC SINH VÀO MÁY 03 (PHÒNG CHỜ ĐIỂM DANH) ====================
  console.log('1. Học sinh mở máy số 03...');
  await studentPage.goto(fileUrl, { waitUntil: 'load' });
  await studentPage.waitForTimeout(400);

  // Chọn máy 03 (index 2)
  await studentPage.locator('#computers-grid .computer-card').nth(2).click();
  await studentPage.waitForTimeout(300);
  await studentPage.click('#btn-modal-confirm');
  await studentPage.waitForTimeout(500);

  // KIỂM CHỨNG BẮT BUỘC: Học sinh KHÔNG CÓ thanh tab điều hướng (tránh phân tâm)
  const navCount = await studentPage.locator('.pace-navigator').count();
  console.log('   - Số lượng thanh tab điều hướng trên máy học sinh:', navCount, '(Kỳ vọng: 0)');
  if (navCount !== 0) throw new Error('Thanh tab điều hướng vẫn còn hiển thị trên máy học sinh!');

  const isStudentWaitingVisible = await studentPage.isVisible('#st-view-waiting.active');
  console.log('   - Học sinh đang ở phòng chờ đón nhận điểm danh:', isStudentWaitingVisible);
  if (!isStudentWaitingVisible) throw new Error('Học sinh không ở phòng chờ điểm danh!');

  await studentPage.screenshot({ path: path.join(screenshotsDir, 'streamlined_01_student_waiting_no_tabs.png') });
  console.log('   📸 Đã chụp: streamlined_01_student_waiting_no_tabs.png');

  // ==================== BƯỚC 2: GIÁO VIÊN ĐĂNG NHẬP & BẮT ĐẦU ĐIỂM DANH ====================
  console.log('2. Giáo viên mở trang, đăng nhập và chọn lớp 10A1...');
  await teacherPage.goto(fileUrl, { waitUntil: 'load' });
  await teacherPage.waitForTimeout(400);

  await teacherPage.click('#btn-open-teacher-login');
  await teacherPage.waitForTimeout(300);
  await teacherPage.fill('#teacher-password-input', 'admin123');
  await teacherPage.click('#modal-teacher-login button[type="submit"]');
  await teacherPage.waitForTimeout(500);

  await teacherPage.selectOption('#teacher-select-class', '10A1');
  await teacherPage.click('#btn-start-class-session');
  await teacherPage.waitForTimeout(600);

  // Tab 0 (Điểm danh) toàn màn hình
  const isTab0Active = await teacherPage.isVisible('#tw-panel-waiting.active');
  console.log('   - Tab 0 (Điểm danh toàn màn hình) đang active:', isTab0Active);
  if (!isTab0Active) throw new Error('Tab 0 Điểm danh không hiển thị!');

  await teacherPage.screenshot({ path: path.join(screenshotsDir, 'streamlined_02_teacher_tab0_attendance_fullscreen.png') });
  console.log('   📸 Đã chụp: streamlined_02_teacher_tab0_attendance_fullscreen.png');

  // ==================== BƯỚC 3: THẦY BẤM [BẮT ĐẦU BÀI HỌC] ➔ CHUYỂN SANG BƯỚC 1 ====================
  console.log('3. Giáo viên bấm [ĐIỂM DANH XONG — BẮT ĐẦU BÀI HỌC (CHUYỂN SANG BƯỚC 1: KIỂM TRA BÀI CŨ)]...');
  await teacherPage.click('#btn-start-lesson-hero');
  await teacherPage.waitForTimeout(600);

  // KIỂM CHỨNG BẮT BUỘC THEO YÊU CẦU CỦA THẦY: Tab 0 Điểm danh PHẢI ẨN HOÀN TOÀN!
  const isTab0Hidden = !(await teacherPage.isVisible('#tw-panel-waiting'));
  const isTab1Active = await teacherPage.isVisible('#tw-panel-old-lesson.active');
  console.log('   - Tab 0 Điểm danh đã ẩn hoàn toàn:', isTab0Hidden);
  console.log('   - Tab 1 Kiểm tra bài cũ hiển thị toàn màn hình:', isTab1Active);
  if (!isTab0Hidden || !isTab1Active) throw new Error('Lỗi chuyển tab: Tab 0 chưa ẩn hoặc Tab 1 chưa hiển thị!');

  // KIỂM CHỨNG ĐỒNG BỘ: Màn hình Học sinh tự động chuyển sang Bước 1 (Kiểm tra bài cũ)
  const isStudentOldLessonActive = await studentPage.isVisible('#st-view-old-lesson.active');
  console.log('   - Màn hình Học sinh tự động chuyển sang Bước 1 (Kiểm tra bài cũ):', isStudentOldLessonActive);
  if (!isStudentOldLessonActive) throw new Error('Máy học sinh không tự động chuyển theo khi Thầy bấm bắt đầu bài học!');

  await teacherPage.screenshot({ path: path.join(screenshotsDir, 'streamlined_03_teacher_tab1_old_lesson_fullscreen.png') });
  console.log('   📸 Đã chụp: streamlined_03_teacher_tab1_old_lesson_fullscreen.png');

  // ==================== BƯỚC 4: MỞ BỐC THĂM KỊCH TÍNH (ARCADE GAMESHOW THEME) ====================
  console.log('4. Thầy mở Modal Bốc thăm Gọi học sinh Arcade Gameshow...');
  await teacherPage.click('#btn-open-lucky-draw');
  await teacherPage.waitForTimeout(400);

  const isArcadeModalVisible = await teacherPage.isVisible('.lucky-draw-card.arcade-theme');
  console.log('   - Modal Bốc thăm Arcade Gameshow hiển thị:', isArcadeModalVisible);
  if (!isArcadeModalVisible) throw new Error('Modal bốc thăm arcade theme không hiển thị!');

  console.log('5. Nhấn [BẮT ĐẦU QUAY SỐ] Phương án A (Trục lăn Ma trận)...');
  await teacherPage.click('#btn-trigger-spin');
  await teacherPage.waitForTimeout(4200);

  const slotWinner = await teacherPage.$eval('#ld-result-banner', el => el.textContent);
  console.log('   🎉 Kết quả bốc thăm Phương án A:', slotWinner.trim().replace(/\s+/g, ' '));

  await teacherPage.screenshot({ path: path.join(screenshotsDir, 'streamlined_04_lucky_draw_arcade_slot.png') });
  console.log('   📸 Đã chụp: streamlined_04_lucky_draw_arcade_slot.png');

  console.log('6. Chuyển tab sang Phương án B (Chiếc nón kỳ diệu)...');
  await teacherPage.click('#btn-strat-wheel');
  await teacherPage.waitForTimeout(400);

  console.log('7. Nhấn [BẮT ĐẦU QUAY SỐ] Phương án B...');
  await teacherPage.click('#btn-trigger-spin');
  await teacherPage.waitForTimeout(4500);

  const wheelWinner = await teacherPage.$eval('#ld-result-banner', el => el.textContent);
  console.log('   🎉 Kết quả bốc thăm Phương án B:', wheelWinner.trim().replace(/\s+/g, ' '));

  await teacherPage.screenshot({ path: path.join(screenshotsDir, 'streamlined_05_lucky_draw_arcade_wheel.png') });
  console.log('   📸 Đã chụp: streamlined_05_lucky_draw_arcade_wheel.png');

  await teacherPage.click('#btn-close-lucky-draw');
  await teacherPage.waitForTimeout(400);

  // ==================== BƯỚC 5: PHÁT ĐỀ VÀ HỌC SINH NỘP BÀI ====================
  console.log('8. Giáo viên bấm [PHÁT ĐỀ XUỐNG 18 MÁY]...');
  await teacherPage.click('#btn-teacher-start-old-lesson');
  await teacherPage.waitForTimeout(600);

  console.log('9. Học sinh Máy 03 gõ câu trả lời tự luận và bấm [GỬI CÂU TRẢ LỜI]...');
  await studentPage.fill('#ol-text-input', 'Bộ não điều khiển máy tính là CPU (Central Processing Unit).');
  await studentPage.waitForTimeout(300);
  await studentPage.click('#btn-submit-old-lesson');
  await studentPage.waitForTimeout(600);

  await studentPage.screenshot({ path: path.join(screenshotsDir, 'streamlined_06_student_submitted_answer.png') });
  console.log('   📸 Đã chụp: streamlined_06_student_submitted_answer.png');

  // ==================== BƯỚC 6: BẢNG GIÁO VIÊN CẬP NHẬT 18 MÁY THỜI GIAN THỰC ====================
  console.log('10. Kiểm tra bảng bài nộp của 18 máy trên Bảng điều khiển Giáo viên...');
  await teacherPage.waitForTimeout(500);
  const cardMachine3Text = await teacherPage.$eval('#ol-submissions-list', el => el.textContent);
  console.log('   - Máy 03 đã hiển thị trạng thái [Đã nộp]:', cardMachine3Text.includes('MÁY 03') && cardMachine3Text.includes('Đã nộp'));
  if (!cardMachine3Text.includes('MÁY 03') || !cardMachine3Text.includes('Đã nộp')) {
    throw new Error('Bảng 18 máy giáo viên không cập nhật trạng thái bài nộp của Máy 03!');
  }

  await teacherPage.screenshot({ path: path.join(screenshotsDir, 'streamlined_07_teacher_18_cards_submissions_grid.png') });
  console.log('   📸 Đã chụp: streamlined_07_teacher_18_cards_submissions_grid.png');

  // ==================== BƯỚC 7: KHÓA BÀI & CÔNG BỐ ĐÁP ÁN ====================
  console.log('11. Giáo viên bấm [KHÓA BÀI NGAY] và [CÔNG BỐ ĐÁP ÁN CHUẨN]...');
  await teacherPage.click('#btn-teacher-lock-old-lesson');
  await teacherPage.waitForTimeout(400);
  await teacherPage.click('#btn-teacher-reveal-old-lesson');
  await teacherPage.waitForTimeout(600);

  const isRevealVisible = await studentPage.isVisible('#ol-reveal-box');
  console.log('   - Học sinh nhìn thấy hộp đáp án chuẩn và lời giải thích:', isRevealVisible);
  if (!isRevealVisible) throw new Error('Học sinh chưa thấy đáp án chuẩn sau khi Thầy công bố!');

  await studentPage.screenshot({ path: path.join(screenshotsDir, 'streamlined_08_student_reveal_explanation.png') });
  console.log('   📸 Đã chụp: streamlined_08_student_reveal_explanation.png');

  // ==================== QUÉT LỖI CONSOLE F12 ====================
  console.log('12. Kiểm tra nhật ký lỗi Console F12...');
  if (consoleErrors.length > 0) {
    console.error('❌ Phát hiện lỗi Console:', consoleErrors);
    throw new Error(`Kiểm thử thất bại do có ${consoleErrors.length} lỗi console!`);
  }
  console.log('✅ TẤT CẢ CÁC BƯỚC ĐỀU PASS 100% — 0 LỖI CONSOLE (ZERO-BUG VERIFIED)!');

  await browser.close();
}

testOldLessonFlow().catch(err => {
  console.error('❌ E2E TEST FAILED:', err);
  process.exit(1);
});
