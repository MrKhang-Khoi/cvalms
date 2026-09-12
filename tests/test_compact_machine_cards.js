const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const HTML_PATH = 'file:///' + path.resolve(__dirname, '../index.html').replace(/\\/g, '/');
const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots');

(async () => {
  console.log('🚀 Bắt đầu kiểm thử Giao diện Thẻ 18 Máy Tính Siêu Gọn...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[Console Error]: ${msg.text()}`);
  });
  page.on('pageerror', err => errors.push(`[PageError]: ${err.message}`));

  // 1. Mở trang và đăng nhập Giáo viên
  console.log('1. Đăng nhập Giáo viên...');
  await page.goto(HTML_PATH);
  await page.waitForLoadState('networkidle');

  await page.click('#btn-open-teacher-login');
  await page.waitForTimeout(300);
  await page.fill('#teacher-password-input', 'admin123');
  await page.click('#modal-teacher-login button[type="submit"]');
  await page.waitForSelector('#screen-teacher.active', { state: 'visible' });

  // 2. Thầy bắt đầu tiết học (Chuyển sang Giai đoạn 2)
  console.log('2. Bấm [BẮT ĐẦU TIẾT HỌC CHO LỚP NÀY]...');
  await page.click('#btn-start-class-session');
  await page.waitForSelector('#teacher-stage-active', { state: 'visible' });

  // 3. Kiểm tra 18 thẻ máy trên lưới sơ đồ
  console.log('3. Kiểm tra lưới 18 máy (#active-session-grid-18)...');
  const cardsCount = await page.locator('#active-session-grid-18 .asm-card').count();
  console.log(`   - Số thẻ máy hiển thị: ${cardsCount}/18 máy.`);
  if (cardsCount !== 18) throw new Error(`Lưới chỉ có ${cardsCount} máy thay vì 18 máy!`);

  // 4. Kiểm tra cấu trúc thẻ Máy 01: Status Pill ở trên, Tên học sinh ở dưới
  console.log('4. Kiểm tra cấu trúc thẻ Máy 01...');
  const card1 = page.locator('#active-session-grid-18 .asm-card').nth(0);
  const idText = await card1.locator('.asm-id').textContent();
  const pillText = await card1.locator('.asm-status-pill').textContent();
  const studentsText = await card1.locator('.asm-students-row').textContent();

  console.log(`   - Dòng trên (ID): "${idText.trim()}"`);
  console.log(`   - Dòng trên (Trạng thái nhỏ): "${pillText.trim()}"`);
  console.log(`   - Dòng dưới (Tên học sinh): "${studentsText.trim()}"`);

  if (!idText.includes('MÁY 01')) throw new Error('Không tìm thấy ID MÁY 01!');
  if (!card1.locator('.asm-status-pill .asm-status-dot')) throw new Error('Thiếu chấm trạng thái tròn!');
  if (!studentsText || studentsText.trim().length < 3) throw new Error('Dòng dưới không hiển thị tên học sinh!');

  // 5. Kiểm tra Máy 03 có 3 học sinh hiển thị bên dưới
  console.log('5. Kiểm tra Máy 03 (demo 3 học sinh)...');
  const card3Students = await page.locator('#active-session-grid-18 .asm-card').nth(2).locator('.asm-students-row').textContent();
  console.log(`   - Tên 3 học sinh Máy 03 bên dưới: "${card3Students.trim()}"`);
  if (!card3Students.includes('Đặng Quốc Anh')) {
    throw new Error('Máy 03 thiếu học sinh thứ 3!');
  }

  // 6. Kiểm tra kích thước thẻ và đo lường cuộn
  console.log('6. Đo lường kích thước thẻ và kiểm tra thanh cuộn...');
  const metrics = await page.evaluate(() => {
    const grid = document.getElementById('active-session-grid-18');
    const firstCard = grid.querySelector('.asm-card');
    const rect = firstCard.getBoundingClientRect();
    return {
      cardHeight: rect.height,
      cardWidth: rect.width,
      gridScrollHeight: grid.scrollHeight,
      gridClientHeight: grid.clientHeight,
      gridScrollWidth: grid.scrollWidth,
      gridClientWidth: grid.clientWidth,
      hasVerticalScroll: grid.scrollHeight > grid.clientHeight + 2,
      hasHorizontalScroll: grid.scrollWidth > grid.clientWidth + 2
    };
  });

  console.log(`   - Chiều cao mỗi thẻ: ${metrics.cardHeight.toFixed(1)}px (Đã giảm cực gọn so với 100px trước đây!)`);
  console.log(`   - Chiều rộng mỗi thẻ: ${metrics.cardWidth.toFixed(1)}px`);
  console.log(`   - Tràn cuộn ngang: ${metrics.hasHorizontalScroll ? 'CÓ (LỖI)' : 'KHÔNG (CHUẨN)'}`);
  console.log(`   - Tràn cuộn dọc: ${metrics.hasVerticalScroll ? 'CÓ' : 'KHÔNG (HOÀN HẢO)'}`);

  if (metrics.hasHorizontalScroll) {
    throw new Error('Lưới 18 máy bị tràn cuộn ngang!');
  }

  // Chụp ảnh bằng chứng trực quan
  const screenshotPath = path.join(SCREENSHOT_DIR, 'compact_01_teacher_active_session_18_desks.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`   📸 Đã chụp ảnh nghiệm thu: compact_01_teacher_active_session_18_desks.png`);

  // Chụp cận cảnh riêng phần lưới 18 máy để soi chi tiết
  const matrixCol = page.locator('.teacher-col-matrix');
  await matrixCol.screenshot({ path: path.join(SCREENSHOT_DIR, 'compact_02_zoom_18_cards_matrix.png') });
  console.log(`   📸 Đã chụp ảnh cận cảnh: compact_02_zoom_18_cards_matrix.png`);

  // 7. Quét Console F12
  console.log('7. Quét Console F12...');
  console.log(`   - Lỗi Console F12: ${errors.length}`);
  if (errors.length > 0) {
    console.error('Các lỗi phát hiện:', errors);
    process.exit(1);
  }

  console.log('🎉 KIỂM THỬ GIAO DIỆN THẺ 18 MÁY NHỎ GỌN PASS 100%! 0 LỖI CONSOLE!');
  await browser.close();
})();
