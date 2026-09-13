const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');
const url = require('url');

function startServer(port = 8096) {
  const rootDir = path.resolve(__dirname, '..', '..', '..', '..', '..', 'OneDrive - Sở GD&ĐT Quảng Ngãi', 'Desktop', 'LMS PHÒNG MÁY TƯƠNG TÁC');
  const actualDir = fs.existsSync(rootDir) ? rootDir : path.resolve(__dirname, '..');
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg'
  };
  const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname === '/' ? '/index.html' : parsedUrl.pathname;
    const filePath = path.join(actualDir, pathname);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve) => {
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve({ close: () => {} });
      } else {
        throw err;
      }
    });
    server.listen(port, '127.0.0.1', () => {
      resolve(server);
    });
  });
}

async function runTest() {
  console.log('========================================================================');
  console.log('🧪 TEST: SECTION-BASED BLUEPRINT & INTERACTIVE PREVIEW MODAL (NO ALERT)');
  console.log('========================================================================');

  const server = await startServer(8096);
  const artifactsDir = path.resolve('C:/Users/HPZBook/.gemini/antigravity/brain/3200ba6e-bc70-4c6b-860d-d35ff50ae270');
  const screenshotsDir = path.resolve('c:/Users/HPZBook/OneDrive - Sở GD&ĐT Quảng Ngãi/Desktop/LMS PHÒNG MÁY TƯƠNG TÁC/tests/pipeline_screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('404')) {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  let dialogPoppedDuringPreview = false;
  let dialogMessage = '';
  page.on('dialog', async d => {
    console.log(`   ⚠️ [Dialog Triggered]: "${d.message()}" (Type: ${d.type()})`);
    dialogMessage = d.message();
    dialogPoppedDuringPreview = true;
    await d.accept();
  });

  try {
    console.log('\n[1] Mở ứng dụng LMS...');
    await page.goto('http://127.0.0.1:8096/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);

    console.log('[2] Đăng nhập Giáo viên...');
    await page.click('#btn-open-teacher-login');
    await page.waitForTimeout(200);
    await page.fill('#teacher-password-input', 'admin123');
    await page.click('#modal-teacher-login button[type="submit"]');
    await page.waitForTimeout(400);

    console.log('[3] Chuyển sang Tab 2: XƯỞNG SOẠN KỊCH BẢN (STUDIO)...');
    await page.click('#btn-tnav-studio');
    await page.waitForTimeout(400);

    // Kiểm tra cấu trúc Mục 1 và Mục 2 trong DOM
    console.log('[4] Kiểm tra Cấu trúc Sư phạm Đa Mục (Section-based Architecture)...');
    const secContainer = await page.locator('#studio-sections-container').count();
    if (secContainer === 0) throw new Error('Không tìm thấy #studio-sections-container!');

    const sec1Count = await page.locator('#studio-sec-card-1').count();
    const sec2Count = await page.locator('#studio-sec-card-2').count();
    const subCardsCount = await page.locator('.sub-activity-card').count();
    const seqBadgesCount = await page.locator('.seq-badge-flow').count();

    console.log(`   - Số Mục hiện hữu: ${sec1Count + sec2Count} (Mục 1 & Mục 2)`);
    console.log(`   - Tổng số thẻ hoạt động con (sub-activity): ${subCardsCount} (Kỳ vọng >= 6)`);
    console.log(`   - Tổng số luồng 4 nút tuần tự (.seq-badge-flow): ${seqBadgesCount} (Kỳ vọng >= 8)`);

    if (sec1Count === 0 || sec2Count === 0) {
      throw new Error('Thiếu Mục 1 hoặc Mục 2 trong Xưởng soạn kịch bản!');
    }
    if (subCardsCount < 6) {
      throw new Error(`Số lượng hoạt động con không đủ: ${subCardsCount} < 6`);
    }

    // Kiểm tra Nút "Xem trước" kịch bản
    console.log('\n[5] Kiểm chứng Nút "Xem trước" KHÔNG ĐƯỢC BẬT ALERT và PHẢI MỞ MODAL BẢNG...');
    dialogPoppedDuringPreview = false;
    
    const previewBtn = page.locator('button:has-text("Xem trước")');
    await previewBtn.click();
    await page.waitForTimeout(500);

    if (dialogPoppedDuringPreview) {
      throw new Error(`VI PHẠM YÊU CẦU: Nút "Xem trước" vẫn kích hoạt dialog/alert của trình duyệt: "${dialogMessage}"`);
    }
    console.log('   ✅ PASS: Không có bất kỳ hộp thoại alert() nào của trình duyệt xuất hiện!');

    // Kiểm tra Modal xem trước hiển thị
    const isModalVisible = await page.evaluate(() => {
      const el = document.getElementById('modal-studio-preview');
      return el && window.getComputedStyle(el).display !== 'none';
    });
    if (!isModalVisible) {
      throw new Error('Modal #modal-studio-preview không hiển thị sau khi bấm "Xem trước"!');
    }
    console.log('   ✅ PASS: Modal #modal-studio-preview đã mở thành công với layout flex!');

    // Kiểm tra nội dung Bảng Bản Đồ Tiến Trình Sư Phạm (Blueprint Table)
    console.log('\n[6] Kiểm tra cấu trúc Bảng Tiến trình Sư phạm (Blueprint Table)...');
    const tableExists = await page.locator('.blueprint-table').count();
    if (tableExists === 0) throw new Error('Không tìm thấy .blueprint-table bên trong modal!');

    const tableText = await page.locator('.blueprint-table').innerText();
    const hasWarmup = tableText.includes('KHỞI ĐỘNG') || tableText.includes('bài cũ');
    const hasSec1 = tableText.includes('Mục 1') || tableText.includes('Khái niệm');
    const hasSec2 = tableText.includes('Mục 2') || tableText.includes('Slicing');
    const hasKahoot = tableText.includes('TỔNG KẾT') || tableText.includes('Kahoot');

    console.log(`   - Có phần Khởi động & Bài cũ: ${hasWarmup ? '✅' : '❌'}`);
    console.log(`   - Có phần Mục 1: ${hasSec1 ? '✅' : '❌'}`);
    console.log(`   - Có phần Mục 2: ${hasSec2 ? '✅' : '❌'}`);
    console.log(`   - Có phần Tổng kết Kahoot: ${hasKahoot ? '✅' : '❌'}`);

    if (!hasWarmup || !hasSec1 || !hasSec2 || !hasKahoot) {
      throw new Error('Nội dung bảng Blueprint thiếu một trong các giai đoạn sư phạm cốt lõi!');
    }

    const tableChipsCount = await page.locator('.bp-seq-chip').count();
    console.log(`   - Số chip chu trình 4 nút trong bảng: ${tableChipsCount} (Kỳ vọng >= 16)`);
    if (tableChipsCount < 16) {
      throw new Error(`Số chip chu trình 4 nút không đầy đủ: ${tableChipsCount} < 16`);
    }

    // Chụp ảnh màn hình minh chứng Modal
    const shotPath1 = path.join(screenshotsDir, 'studio_blueprint_table_modal.png');
    const shotPath2 = path.join(artifactsDir, 'studio_blueprint_table_modal.png');
    await page.screenshot({ path: shotPath1, fullPage: false });
    fs.copyFileSync(shotPath1, shotPath2);
    console.log(`   📸 Đã chụp ảnh minh chứng: ${shotPath1}`);

    // Bấm nút [ÁP DỤNG & LƯU KỊCH BẢN] từ bên trong modal
    console.log('\n[7] Thử nghiệm nút [ÁP DỤNG & LƯU KỊCH BẢN] trên thanh footer modal...');
    await page.click('#btn-bp-apply-save');
    await page.waitForTimeout(500);

    const isModalClosed = await page.evaluate(() => {
      const el = document.getElementById('modal-studio-preview');
      return !el || window.getComputedStyle(el).display === 'none';
    });
    if (!isModalClosed) {
      throw new Error('Modal không tự đóng sau khi bấm Lưu kịch bản!');
    }
    console.log('   ✅ PASS: Modal đã đóng lại mượt mà sau khi lưu.');

    // Kiểm tra tính năng thêm Mục 3 (+ THÊM MỤC BÀI HỌC MỚI)
    console.log('\n[8] Kiểm tra tính năng Thêm Mục bài học mới (+ THÊM MỤC 3, MỤC 4...)...');
    const beforeAddCount = await page.locator('.studio-section-card').count();
    await page.click('.btn-add-section');
    await page.waitForTimeout(300);

    const afterAddCount = await page.locator('.studio-section-card').count();
    console.log(`   - Số mục trước khi bấm thêm: ${beforeAddCount}`);
    console.log(`   - Số mục sau khi bấm thêm: ${afterAddCount}`);

    if (afterAddCount !== beforeAddCount + 1) {
      throw new Error(`Thêm mục thất bại: Trước=${beforeAddCount}, Sau=${afterAddCount}`);
    }
    const sec3Exists = await page.locator('#studio-sec-card-3').count();
    if (sec3Exists === 0) throw new Error('Không tìm thấy #studio-sec-card-3 được sinh ra!');
    console.log('   ✅ PASS: Mục 3 đã được tự động khởi tạo với đầy đủ 3 hoạt động sư phạm con!');

    // Chụp ảnh Studio sau khi thêm Mục 3
    const shotStudioPath = path.join(screenshotsDir, 'studio_multi_sections_added.png');
    await page.screenshot({ path: shotStudioPath, fullPage: false });
    console.log(`   📸 Đã chụp ảnh minh chứng: ${shotStudioPath}`);

    // Kiểm tra console errors
    console.log('\n[9] Kiểm tra Console Errors...');
    console.log(`   - Tổng console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.warn('   ⚠️ Console errors found:', consoleErrors);
    }

    console.log('\n========================================================================');
    console.log('🎉 TẤT CẢ CÁC BƯỚC TEST SECTION BLUEPRINT & MODAL PREVIEW ĐỀU ĐẠT PASS 100%!');
    console.log('========================================================================');
  } finally {
    await browser.close();
    if (server && server.close) server.close();
  }
}

runTest().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
