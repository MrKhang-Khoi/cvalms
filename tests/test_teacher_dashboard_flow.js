const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testTeacherDashboardFlow() {
  console.log('🚀 Bắt đầu kiểm thử toàn diện Giao diện Giáo viên & Đăng nhập bảo mật SHA-256...');
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  // Tự động đồng ý các popup dialog alert/confirm
  page.on('dialog', async dialog => {
    console.log(`   💬 [Dialog Box]: ${dialog.message()}`);
    await dialog.accept();
  });

  const fileUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
  console.log('1. Mở trang tại:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.waitForTimeout(500);

  // BƯỚC 1: MỞ MODAL ĐĂNG NHẬP GIÁO VIÊN
  console.log('2. Bấm nút [Giáo viên] trên thanh Sảnh...');
  await page.click('#btn-open-teacher-login');
  await page.waitForTimeout(400);

  const isLoginModalVisible = await page.isVisible('#modal-teacher-login');
  console.log('   - Modal đăng nhập mở:', isLoginModalVisible);
  if (!isLoginModalVisible) throw new Error('Modal đăng nhập Giáo viên không mở!');

  // BƯỚC 2: THỬ NGHIỆM ĐĂNG NHẬP SAI MẬT KHẨU
  console.log('3. Thử nghiệm nhập sai mật khẩu ("sai_mat_khau")...');
  await page.fill('#teacher-password-input', 'sai_mat_khau');
  await page.click('#modal-teacher-login button[type="submit"]');
  await page.waitForTimeout(400);

  const isErrorMsgVisible = await page.isVisible('#auth-error-msg');
  console.log('   - Cảnh báo sai mật khẩu xuất hiện:', isErrorMsgVisible);
  if (!isErrorMsgVisible) throw new Error('Không báo lỗi khi nhập sai mật khẩu!');

  await page.screenshot({ path: path.join(screenshotsDir, 'teacher_01_login_modal.png') });
  console.log('   📸 Đã chụp: teacher_01_login_modal.png');

  // BƯỚC 3: ĐĂNG NHẬP ĐÚNG BẰNG MẬT KHẨU BẢO MẬT SHA-256
  console.log('4. Nhập mật khẩu chính xác ("admin123")...');
  await page.fill('#teacher-password-input', 'admin123');
  await page.click('#modal-teacher-login button[type="submit"]');
  await page.waitForTimeout(600);

  const isTeacherScreenActive = await page.isVisible('#screen-teacher.active');
  console.log('   - Vào Bảng điều khiển Giáo viên:', isTeacherScreenActive);
  if (!isTeacherScreenActive) throw new Error('Đăng nhập thành công nhưng không vào được màn hình Giáo viên!');

  // BƯỚC 4: KIỂM CHỨNG GIAI ĐOẠN 1 (KIỂM TRA PHẦN CỨNG 18 MÁY)
  console.log('5. Kiểm chứng GIAI ĐOẠN 1: Kiểm tra phần cứng 18 máy...');
  const isStage1Active = await page.isVisible('#teacher-stage-hardware.active');
  console.log('   - Giai đoạn 1 đang active:', isStage1Active);
  if (!isStage1Active) throw new Error('Giai đoạn 1 không hiển thị mặc định khi GV vừa đăng nhập!');

  const hwCardsCount = await page.locator('#hardware-grid-18 .hardware-card').count();
  console.log(`   - Số ô máy phần cứng: ${hwCardsCount}/18 máy.`);
  if (hwCardsCount !== 18) throw new Error(`Lưới phần cứng chỉ có ${hwCardsCount} máy thay vì 18!`);

  // KIỂM CHỨNG BẮT BUỘC THEO YÊU CẦU CỦA THẦY:
  // Giai đoạn 1 TUYỆT ĐỐI KHÔNG HIỆN TÊN HỌC SINH vì chưa chọn lớp!
  const stage1Text = await page.textContent('#hardware-grid-18');
  console.log('   - Kiểm tra xem có bị lộ tên học sinh sớm không...');
  if (stage1Text.includes('Đỗ Gia Huy') || stage1Text.includes('Nguyễn Văn An')) {
    throw new Error('SAI LOGIC: Giai đoạn 1 chưa chọn lớp mà đã hiện tên học sinh!');
  }
  console.log('   ✅ ĐÚNG LOGIC 100%: Giai đoạn 1 chỉ hiện tín hiệu máy Online/Offline, không có tên học sinh.');

  await page.screenshot({ path: path.join(screenshotsDir, 'teacher_02_stage1_hardware.png') });
  console.log('   📸 Đã chụp: teacher_02_stage1_hardware.png');

  // BƯỚC 5: BẮT ĐẦU TIẾT HỌC -> CHUYỂN SANG GIAI ĐOẠN 2
  console.log('6. Thầy chọn Lớp 10A1 và bấm [BẮT ĐẦU TIẾT HỌC CHO LỚP NÀY]...');
  await page.selectOption('#teacher-select-class', '10A1');
  await page.click('#btn-start-class-session');
  await page.waitForTimeout(600);

  const isStage2Active = await page.isVisible('#teacher-stage-active.active');
  console.log('   - Chuyển sang Giai đoạn 2 (Tiết học chính thức):', isStage2Active);
  if (!isStage2Active) throw new Error('Không chuyển sang Giai đoạn 2 sau khi bấm Bắt đầu tiết học!');

  // Kiểm tra tên học sinh đã được nạp vào 18 máy ở Giai đoạn 2
  const matrixText = await page.textContent('#active-session-grid-18');
  if (!matrixText.includes('Đỗ Gia Huy') || !matrixText.includes('Bùi Phương Mai')) {
    throw new Error('Giai đoạn 2 không nạp đúng danh sách học sinh lớp 10A1!');
  }
  console.log('   ✅ ĐÚNG LOGIC 100%: Giai đoạn 2 đã nạp đầy đủ danh sách học sinh lớp 10A1.');

  await page.screenshot({ path: path.join(screenshotsDir, 'teacher_03_stage2_active_session.png') });
  console.log('   📸 Đã chụp: teacher_03_stage2_active_session.png');

  // BƯỚC 6: THỬ ĐIỀU PHỐI CHUYỂN CHẶNG (CHẶNG 1 QUICK POLL)
  console.log('7. Thầy phát lệnh chuyển sang Chặng 1 (Quick Poll)...');
  await page.click('.tpb-step[data-tphase="warmup"]');
  await page.waitForTimeout(400);

  const isPollPanelActive = await page.isVisible('#tw-panel-warmup.active');
  console.log('   - Bảng Live Analytics Chặng 1 hiển thị:', isPollPanelActive);
  if (!isPollPanelActive) throw new Error('Bảng Analytics Quick Poll không hiển thị!');

  await page.screenshot({ path: path.join(screenshotsDir, 'teacher_04_stage2_quickpoll_chart.png') });
  console.log('   📸 Đã chụp: teacher_04_stage2_quickpoll_chart.png');

  // BƯỚC 7: THỬ NGHIỆM CÁC CÔNG CỤ NÓNG
  console.log('8. Thử nghiệm nút [Bốc thăm ngẫu nhiên]...');
  await page.click('#btn-random-pick-student');
  await page.waitForTimeout(300);

  console.log('9. Thử nghiệm nút [F5 18 máy từ xa]...');
  await page.click('#btn-remote-reload-all');
  await page.waitForTimeout(300);

  // BƯỚC 8: KẾT THÚC TIẾT HỌC -> QUAY LẠI GIAI ĐOẠN 1 ĐÓN LỚP SAU
  console.log('10. Thầy bấm [KẾT THÚC TIẾT HỌC]...');
  await page.click('#btn-end-class-session');
  await page.waitForTimeout(500);

  const isBackToStage1 = await page.isVisible('#teacher-stage-hardware.active');
  console.log('   - Đã quay lại Giai đoạn 1 sẵn sàng đón lớp sau:', isBackToStage1);
  if (!isBackToStage1) throw new Error('Không trở về Giai đoạn 1 sau khi Kết thúc tiết học!');

  // BƯỚC 9: KIỂM TRA TOÀN DIỆN CONSOLE F12
  console.log('11. Quét lỗi Console F12...');
  console.log(`   - Số lỗi ghi nhận: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    throw new Error('Phát hiện lỗi Console: ' + JSON.stringify(consoleErrors));
  }

  await browser.close();
  console.log('🎉 TOÀN BỘ KỊCH BẢN GIAO DIỆN GIÁO VIÊN PASS 100% (0 LỖI CONSOLE)! CHUẨN XÁC THEO ĐÚNG SƠ ĐỒ 2 GIAI ĐOẠN ĐÃ THỐNG NHẤT!');
}

testTeacherDashboardFlow().catch(e => {
  console.error('❌ Kiểm thử thất bại:', e);
  process.exit(1);
});
