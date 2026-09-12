const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testPWASeatingVerification() {
  console.log('🚀 Bắt đầu kịch bản kiểm chứng cơ chế ngồi đúng máy khi chạy PWA...');
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));

  // 1. Giả lập khởi chạy PWA trên Máy 01 (có tham số ?machine=1 từ Shortcut Desktop PWA)
  const fileUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/') + '?machine=1';
  console.log('1. Khởi động PWA trên Máy 01:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.waitForTimeout(500);

  // 2. Kiểm tra Huy hiệu Nhận diện Thiết bị PWA
  const pwaBadge = await page.textContent('#device-pwa-badge');
  console.log('2. Huy hiệu PWA nhận diện:', pwaBadge.replace(/\s+/g, ' ').trim());
  if (!pwaBadge.includes('MÁY 01')) {
    throw new Error('PWA không nhận diện được định danh MÁY 01!');
  }

  // 3. Kiểm tra ô Máy 01 trên lưới 18 máy có huy hiệu [Máy của bạn] không
  const isMyMachineClass = await page.evaluate(() => {
    const card1 = document.querySelector('#computers-grid .computer-card:first-child');
    return card1 && card1.classList.contains('my-saved-machine');
  });
  console.log('3. Ô Máy 01 được đánh dấu vị trí máy của bạn:', isMyMachineClass);
  if (!isMyMachineClass) throw new Error('Thẻ Máy 01 không được đánh dấu là Máy của bạn!');

  await page.screenshot({ path: path.join(screenshotsDir, 'pwa_01_identified_machine1.png') });
  console.log('   📸 Đã chụp: pwa_01_identified_machine1.png');

  // 4. KIỂM CHỨNG TÌNH HUỐNG HỌC SINH BẤM NHẦM / NGỒI SAI MÁY:
  // Máy vật lý là Máy 01 nhưng học sinh lại bấm sang Máy 05
  console.log('4. Thử nghiệm học sinh ở Máy 01 bấm sang Máy 05 (ngồi sai vị trí)...');
  await page.locator('#computers-grid .computer-card').nth(4).click(); // Máy 5
  await page.waitForTimeout(400);

  const isWarningVisible = await page.isVisible('#modal-token-warning');
  console.log('   - Bật cảnh báo chặn đứng học sinh:', isWarningVisible);
  if (!isWarningVisible) throw new Error('Hệ thống KHÔNG chặn khi học sinh chọn sai máy!');

  const warnMsg = await page.textContent('#warning-text-content');
  console.log('   - Chi tiết cảnh báo:', warnMsg.replace(/\s+/g, ' ').trim());
  if (!warnMsg.includes('MÁY 01') || !warnMsg.includes('MÁY 05')) {
    throw new Error('Nội dung cảnh báo không nêu rõ Máy 01 và Máy 05!');
  }

  await page.screenshot({ path: path.join(screenshotsDir, 'pwa_02_blocked_wrong_machine.png') });
  console.log('   📸 Đã chụp: pwa_02_blocked_wrong_machine.png');

  // Bấm "Về đúng máy của tôi"
  await page.click('#btn-warning-back');
  await page.waitForTimeout(300);

  // 5. KIỂM CHỨNG TÌNH HUỐNG HỌC SINH NGỒI ĐÚNG MÁY:
  console.log('5. Học sinh bấm đúng Máy 01...');
  await page.locator('#computers-grid .computer-card:first-child').click();
  await page.waitForTimeout(400);

  const isConfirmVisible = await page.isVisible('#modal-confirm-machine');
  if (!isConfirmVisible) throw new Error('Modal xác nhận không hiển thị!');

  await page.click('#btn-modal-confirm');
  await page.waitForTimeout(400);

  const headerBadge = await page.textContent('#sh-machine-badge');
  console.log('   - Header Học sinh hiển thị:', headerBadge.trim());
  if (!headerBadge.includes('MÁY 01')) throw new Error('Header không ghi nhận đúng Máy 01!');

  await page.screenshot({ path: path.join(screenshotsDir, 'pwa_03_entered_correct_machine.png') });
  console.log('   📸 Đã chụp: pwa_03_entered_correct_machine.png');

  console.log('6. Kiểm tra Console F12...');
  console.log('   - Số lỗi ghi nhận:', errors.length);
  if (errors.length > 0) throw new Error('Phát hiện lỗi Console: ' + JSON.stringify(errors));

  await browser.close();
  console.log('🎉 KIỂM CHỨNG HOÀN TOÀN THÀNH CÔNG: Cơ chế PWA nhận diện đúng máy và chặn 100% khi học sinh bấm sai máy!');
}

testPWASeatingVerification().catch(e => {
  console.error('❌ Thất bại:', e);
  process.exit(1);
});
