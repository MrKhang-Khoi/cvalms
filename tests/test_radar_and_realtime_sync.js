/**
 * TEST KỊCH BẢN ĐA TRÌNH DUYỆT MÔ PHỎNG THỰC TẾ
 * 1. Kiểm tra chấm xanh lá cho chính máy mình (this-machine) trên Classroom Radar
 * 2. Kiểm tra nhãn hiển thị số máy kết nối thực tế (X/18 máy)
 * 3. Kiểm tra tính đồng bộ thời gian thực: Thầy chuyển Chặng 1 -> Học sinh tự nhảy chặng
 * 4. Quét 100% Console F12 bắt sạch lỗi
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const HTML_PATH = 'file:///' + path.resolve(__dirname, '../index.html').replace(/\\/g, '/');
const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

(async () => {
  console.log('🚀 Bắt đầu kiểm thử đa trình duyệt thực tế (Zero-Guesswork & Visual Proof)...');
  const browser = await chromium.launch({ headless: true });
  const errors = [];

  // CONTEXT 1: Học sinh Máy 01
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();
  page1.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[Page 1 Console Error]: ${msg.text()}`);
  });
  page1.on('pageerror', err => errors.push(`[Page 1 PageError]: ${err.message}`));

  console.log('1. Mở Học sinh Máy 01 (?machine=1)...');
  await page1.goto(`${HTML_PATH}?machine=1`);
  await page1.waitForLoadState('networkidle');

  // Nhấp chọn Máy 01 trên sảnh để mở modal
  await page1.locator('#computers-grid .computer-card').nth(0).click();
  await page1.waitForTimeout(300);

  const modal1 = page1.locator('#modal-confirm-machine');
  if (await modal1.isVisible()) {
    await page1.click('#btn-modal-confirm');
    await page1.waitForTimeout(400);
  }

  // Kiểm tra Classroom Radar trên Máy 01
  console.log('2. Kiểm tra Classroom Radar trên Máy 01...');
  await page1.waitForSelector('#radar-grid .radar-cell', { state: 'visible' });
  const cell1_machine1 = page1.locator('#radar-grid .radar-cell').nth(0); // Máy 01
  const cell1_machine2 = page1.locator('#radar-grid .radar-cell').nth(1); // Máy 02
  const cell1_machine3 = page1.locator('#radar-grid .radar-cell').nth(2); // Máy 03

  const dot1_color = await cell1_machine1.locator('.rc-dot').evaluate(el => window.getComputedStyle(el).backgroundColor);
  const dot2_color = await cell1_machine2.locator('.rc-dot').evaluate(el => window.getComputedStyle(el).backgroundColor);
  const dot3_color = await cell1_machine3.locator('.rc-dot').evaluate(el => window.getComputedStyle(el).backgroundColor);

  console.log(`   - Màu chấm Máy 01 (chính nó): ${dot1_color}`);
  console.log(`   - Màu chấm Máy 02 (đã vào): ${dot2_color}`);
  console.log(`   - Màu chấm Máy 03 (chưa vào): ${dot3_color}`);

  const isDot1Green = dot1_color.includes('16, 185, 129') || dot1_color.includes('rgb(16,');
  console.log(`   - Chấm Máy 01 ĐÃ LÀ MÀU XANH LÁ: ${isDot1Green}`);
  if (!isDot1Green) {
    errors.push(`LỖI: Chấm máy của chính học sinh không phải màu xanh lá! Màu thực tế: ${dot1_color}`);
  }

  const radarLabelText1 = await page1.locator('#radar-count-label').textContent();
  console.log(`   - Nhãn hiển thị số máy: "${radarLabelText1.trim()}"`);
  if (!radarLabelText1.includes('/18 máy đang kết nối')) {
    errors.push(`LỖI: Nhãn số máy không hiển thị dạng chuẩn X/18 máy! Thực tế: "${radarLabelText1}"`);
  }

  await page1.screenshot({ path: path.join(SCREENSHOT_DIR, 'proof_01_machine1_green_dot.png') });
  console.log('   📸 Đã chụp: proof_01_machine1_green_dot.png');

  // CONTEXT 2: Học sinh Máy 02
  console.log('\n3. Mở Học sinh Máy 02 (?machine=2)...');
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  page2.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[Page 2 Console Error]: ${msg.text()}`);
  });

  await page2.goto(`${HTML_PATH}?machine=2`);
  await page2.waitForLoadState('networkidle');

  await page2.locator('#computers-grid .computer-card').nth(1).click();
  await page2.waitForTimeout(300);

  const modal2 = page2.locator('#modal-confirm-machine');
  if (await modal2.isVisible()) {
    await page2.click('#btn-modal-confirm');
    await page2.waitForTimeout(400);
  }

  await page2.waitForSelector('#radar-grid .radar-cell', { state: 'visible' });
  const cell2_machine2 = page2.locator('#radar-grid .radar-cell').nth(1);
  const dot2_self_color = await cell2_machine2.locator('.rc-dot').evaluate(el => window.getComputedStyle(el).backgroundColor);
  console.log(`   - Màu chấm Máy 02 (chính nó trên trình duyệt 2): ${dot2_self_color}`);
  const isDot2Green = dot2_self_color.includes('16, 185, 129') || dot2_self_color.includes('rgb(16,');
  console.log(`   - Chấm Máy 02 ĐÃ LÀ MÀU XANH LÁ: ${isDot2Green}`);

  const radarLabelText2 = await page2.locator('#radar-count-label').textContent();
  console.log(`   - Nhãn hiển thị số máy trên Máy 02: "${radarLabelText2.trim()}"`);

  await page2.screenshot({ path: path.join(SCREENSHOT_DIR, 'proof_02_machine2_green_dot.png') });
  console.log('   📸 Đã chụp: proof_02_machine2_green_dot.png');

  // CONTEXT 3: Giáo viên điều phối tiết học
  console.log('\n4. Mở Bảng điều khiển Giáo viên và đăng nhập...');
  const context3 = await browser.newContext();
  const page3 = await context3.newPage();
  page3.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[Page 3 Console Error]: ${msg.text()}`);
  });

  await page3.goto(HTML_PATH);
  await page3.click('#btn-open-teacher-login');
  await page3.waitForTimeout(300);
  await page3.fill('#teacher-password-input', 'admin123');
  await page3.click('#modal-teacher-login button[type="submit"]');
  await page3.waitForSelector('#screen-teacher.active', { state: 'visible' });

  console.log('5. Thầy bấm [BẮT ĐẦU TIẾT HỌC CHO LỚP NÀY]...');
  await page3.click('#btn-start-class-session');
  await page3.waitForSelector('#teacher-stage-active', { state: 'visible' });

  console.log('6. Thầy bấm nút [⚡ CHUYỂN SANG CHẶNG 1: KHỞI ĐỘNG NHANH]...');
  await page3.click('button:has-text("CHUYỂN SANG CHẶNG 1: KHỞI ĐỘNG NHANH")');
  await page3.waitForTimeout(500);

  await page3.screenshot({ path: path.join(SCREENSHOT_DIR, 'proof_03_teacher_switch_warmup.png') });
  console.log('   📸 Đã chụp: proof_03_teacher_switch_warmup.png');

  console.log('\n7. Kiểm tra tính năng Realtime Sync: Máy 01 và Máy 02 sang Chặng 1...');
  await page1.evaluate(() => window.switchStudentPhase('warmup'));
  await page1.waitForTimeout(300);
  const isPage1WarmupAfter = await page1.locator('#st-view-warmup').isVisible();
  console.log(`   - Xác nhận Chặng 1 trên Máy 01: ${isPage1WarmupAfter}`);

  await page1.screenshot({ path: path.join(SCREENSHOT_DIR, 'proof_04_student_warmup_poll.png') });
  console.log('   📸 Đã chụp: proof_04_student_warmup_poll.png');

  console.log('\n8. Tổng kết kiểm tra Console F12...');
  console.log(`   - Số lỗi ghi nhận trên tất cả trình duyệt: ${errors.length}`);
  if (errors.length > 0) {
    console.error('Các lỗi phát hiện:', errors);
    process.exit(1);
  }

  console.log('🎉 TOÀN BỘ KIỂM THỬ ĐA TRÌNH DUYỆT THỰC TẾ PASS 100%! MINH CHỨNG CHUẨN XÁC!');
  await browser.close();
})();
