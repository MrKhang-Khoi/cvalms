const { chromium } = require('playwright');
const path = require('path');

async function testFileProtocol() {
  console.log('🚀 Đang kiểm tra mở trực tiếp bằng file:/// (Cách thầy vừa mở)...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  const fileUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
  console.log('Đường dẫn mở file:', fileUrl);

  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  const badge = await page.textContent('#sh-machine-badge');
  console.log('Nhãn máy:', badge);

  // Thử click nút Điểm danh đôi
  await page.click('.tpb-btn:has-text("0. Sảnh Điểm danh đôi")');
  await page.waitForTimeout(300);
  const seatingTitle = await page.textContent('#seating-card-title');
  console.log('Tiêu đề Điểm danh:', seatingTitle);

  // Thử click nút Chặng 1 Quick Poll
  await page.click('.tpb-btn:has-text("1. Quick Poll A-B-C-D")');
  await page.waitForTimeout(300);
  const pollText = await page.textContent('#poll-question-text');
  console.log('Câu hỏi Poll:', pollText);

  console.log('--- KẾT QUẢ QUÉT LỖI CONSOLE F12 ---');
  console.log('Số lượng lỗi Console:', errors.length);
  if (errors.length > 0) {
    console.error('Chi tiết lỗi:', errors);
    process.exit(1);
  }

  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'direct_file_open_success.png') });
  console.log('📸 Đã chụp ảnh màn hình thành công: direct_file_open_success.png');

  await browser.close();
  console.log('🎉 THÀNH CÔNG RỰC RỠ: MỞ FILE TRỰC TIẾP KHÔNG CÒN BẤT KỲ LỖI CORS NÀO (0 ERRORS)!');
}

testFileProtocol().catch(e => {
  console.error('❌ Thất bại:', e);
  process.exit(1);
});
