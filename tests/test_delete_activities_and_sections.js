const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');
const url = require('url');

function startServer(port = 8099) {
  const rootDir = path.resolve('C:/Users/HPZBook/OneDrive - Sở GD&ĐT Quảng Ngãi/Desktop/LMS PHÒNG MÁY TƯƠNG TÁC');
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
  console.log('🧪 TEST: DELETE & RESTORE SUB-ACTIVITIES, DELETE QUESTIONS & REMOVE SECTIONS');
  console.log('========================================================================');

  const server = await startServer(8099);
  const artifactsDir = path.resolve('C:/Users/HPZBook/.gemini/antigravity/brain/3200ba6e-bc70-4c6b-860d-d35ff50ae270');
  const screenshotsDir = path.resolve('C:/Users/HPZBook/OneDrive - Sở GD&ĐT Quảng Ngãi/Desktop/LMS PHÒNG MÁY TƯƠNG TÁC/tests/pipeline_screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  page.on('dialog', async dialog => {
    console.log(`💬 [Dialog (${dialog.type()})]: ${dialog.message()}`);
    await dialog.accept();
  });

  try {
    console.log('\n--- BƯỚC 1: MỞ ỨNG DỤNG VÀ VÀO XƯỞNG SOẠN KỊCH BẢN (STUDIO) ---');
    await page.goto('http://127.0.0.1:8099', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Mở modal đăng nhập GV
    await page.click('#btn-open-teacher-login');
    await page.waitForTimeout(300);

    // Điền mật khẩu admin123
    await page.fill('#teacher-password-input', 'admin123');
    await page.click('#modal-teacher-login button[type="submit"]');
    await page.waitForTimeout(500);

    // Vào tab Soạn Kịch Bản
    await page.click('#btn-tnav-studio');
    await page.waitForTimeout(500);

    const studioVisible = await page.isVisible('#view-teacher-studio');
    console.log(`✅ Xưởng Soạn Kịch Bản hiển thị: ${studioVisible}`);

    console.log('\n--- BƯỚC 2: XÓA HOẠT ĐỘNG CON HĐ 1.3 (THỰC HÀNH PYTHON MỤC 1) ---');
    const pracCardInitial = await page.evaluate(() => {
      const card = document.getElementById('sub-act-1-3');
      return card ? window.getComputedStyle(card).display : null;
    });
    console.log(`Trạng thái ban đầu HĐ 1.3: display=${pracCardInitial}`);

    // Click nút Xóa HĐ 1.3
    await page.click('#sub-act-1-3 .btn-delete-sub-act');
    await page.waitForTimeout(500);

    const pracCardAfterDelete = await page.evaluate(() => {
      const card = document.getElementById('sub-act-1-3');
      const placeholder = document.getElementById('sub-act-placeholder-1-practice');
      const secCard = document.getElementById('studio-sec-card-1');
      const tag = secCard?.querySelector('.sec-act-count-tag')?.textContent;
      return {
        cardDisplay: card ? window.getComputedStyle(card).display : null,
        placeholderDisplay: placeholder ? window.getComputedStyle(placeholder).display : null,
        tagText: tag
      };
    });
    console.log(`Sau khi xóa HĐ 1.3: cardDisplay=${pracCardAfterDelete.cardDisplay}, placeholderDisplay=${pracCardAfterDelete.placeholderDisplay}, tag=${pracCardAfterDelete.tagText}`);
    if (pracCardAfterDelete.cardDisplay !== 'none' || pracCardAfterDelete.placeholderDisplay !== 'flex') {
      throw new Error('❌ LỖI: Thẻ HĐ 1.3 không ẩn hoặc placeholder không hiện!');
    }
    console.log('✅ PASS: HĐ 1.3 đã được ẩn thành công, placeholder khôi phục hiện rõ ràng.');

    console.log('\n--- BƯỚC 3: XÓA CÂU HỎI TRẮC NGHIỆM TRONG MỤC 1 XUỐNG 0 CÂU ---');
    // Xóa tất cả các câu hỏi trắc nghiệm trong Mục 1
    let qDeleteBtns = await page.$$('#sec1-quizzes-container .studio-quiz-item-card .btn-tool-danger');
    console.log(`Số nút xóa câu hỏi ban đầu: ${qDeleteBtns.length}`);
    while (qDeleteBtns.length > 0) {
      await qDeleteBtns[0].click();
      await page.waitForTimeout(300);
      qDeleteBtns = await page.$$('#sec1-quizzes-container .studio-quiz-item-card .btn-tool-danger');
    }

    const quizZeroState = await page.evaluate(() => {
      const container = document.getElementById('sec1-quizzes-container');
      const notice = container?.querySelector('.empty-quizzes-notice');
      const badge = document.getElementById('sec1-quiz-count-badge')?.textContent;
      return {
        hasEmptyNotice: !!notice,
        noticeText: notice?.innerText.trim(),
        badgeText: badge
      };
    });
    console.log(`Trạng thái sau khi xóa hết câu hỏi: hasNotice=${quizZeroState.hasEmptyNotice}, badge="${quizZeroState.badgeText}"`);
    if (!quizZeroState.hasEmptyNotice || !quizZeroState.badgeText.includes('0')) {
      throw new Error('❌ LỖI: Không hiển thị empty-quizzes-notice hoặc badge không về 0 câu!');
    }
    console.log('✅ PASS: Xóa hết câu hỏi hiển thị đúng Empty Notice và Badge 0 câu.');

    console.log('\n--- BƯỚC 4: THÊM LẠI CÂU HỎI TRẮC NGHIỆM MỚI ---');
    await page.click('#sub-act-1-2 button[onclick*="studioAddQuizQuestion(1)"]');
    await page.waitForTimeout(500);

    const quizAddState = await page.evaluate(() => {
      const container = document.getElementById('sec1-quizzes-container');
      const notice = container?.querySelector('.empty-quizzes-notice');
      const cards = container?.querySelectorAll('.studio-quiz-item-card');
      const badge = document.getElementById('sec1-quiz-count-badge')?.textContent;
      return {
        hasEmptyNotice: !!notice,
        cardCount: cards?.length || 0,
        badgeText: badge
      };
    });
    console.log(`Sau khi thêm lại: hasNotice=${quizAddState.hasEmptyNotice}, cardCount=${quizAddState.cardCount}, badge="${quizAddState.badgeText}"`);
    if (quizAddState.hasEmptyNotice || quizAddState.cardCount !== 1) {
      throw new Error('❌ LỖI: Thêm câu hỏi mới không gỡ empty notice hoặc không tăng thẻ!');
    }
    console.log('✅ PASS: Thêm câu hỏi mới thành công, empty notice được tự động gỡ bỏ.');

    console.log('\n--- BƯỚC 5: KHÔI PHỤC LẠI HOẠT ĐỘNG 1.3 TỪ PLACEHOLDER ---');
    await page.click('#sub-act-placeholder-1-practice .btn-restore-sub-act');
    await page.waitForTimeout(500);

    const pracCardAfterRestore = await page.evaluate(() => {
      const card = document.getElementById('sub-act-1-3');
      const placeholder = document.getElementById('sub-act-placeholder-1-practice');
      const secCard = document.getElementById('studio-sec-card-1');
      const tag = secCard?.querySelector('.sec-act-count-tag')?.textContent;
      return {
        cardDisplay: card ? window.getComputedStyle(card).display : null,
        placeholderDisplay: placeholder ? window.getComputedStyle(placeholder).display : null,
        tagText: tag
      };
    });
    console.log(`Sau khi khôi phục HĐ 1.3: cardDisplay=${pracCardAfterRestore.cardDisplay}, placeholderDisplay=${pracCardAfterRestore.placeholderDisplay}, tag=${pracCardAfterRestore.tagText}`);
    if (pracCardAfterRestore.cardDisplay === 'none' || pracCardAfterRestore.placeholderDisplay !== 'none') {
      throw new Error('❌ LỖI: Khôi phục HĐ 1.3 thất bại!');
    }
    console.log('✅ PASS: Khôi phục hoạt động con thành công 100%.');

    console.log('\n--- BƯỚC 6: XÓA MỤC 2 (CHỈ GIỮ LẠI MỤC 1) ---');
    const secCountBefore = await page.$$eval('#studio-sections-container .studio-section-card', els => els.length);
    console.log(`Số mục trước khi xóa: ${secCountBefore}`);

    // Click nút Xóa Mục 2
    await page.click('#studio-sec-card-2 .btn-delete-section');
    await page.waitForTimeout(600);

    const secCountAfter = await page.$$eval('#studio-sections-container .studio-section-card', els => els.length);
    console.log(`Số mục sau khi xóa: ${secCountAfter}`);
    if (secCountAfter !== 1) {
      throw new Error('❌ LỖI: Mục 2 chưa được xóa khỏi container!');
    }
    console.log('✅ PASS: Mục 2 đã được xóa hoàn toàn.');

    console.log('\n--- BƯỚC 7: XEM KỊCH BẢN TRƯỚC KHI LƯU (BLUEPRINT TABLE MODAL) ---');
    await page.click('button[onclick*="studioPreviewLesson"]');
    await page.waitForTimeout(800);

    const previewModalState = await page.evaluate(() => {
      const modal = document.getElementById('modal-studio-preview');
      const isVisible = modal && window.getComputedStyle(modal).display === 'flex';
      const summaryText = document.getElementById('bp-summary-tags')?.innerText || '';
      const tableRows = document.querySelectorAll('#blueprint-table-container table tbody tr');
      const hasSec2 = Array.from(tableRows).some(r => r.innerText.includes('Mục 2'));
      const hasSec1 = Array.from(tableRows).some(r => r.innerText.includes('Mục 1'));
      return {
        isVisible,
        summaryText,
        rowCount: tableRows.length,
        hasSec1,
        hasSec2
      };
    });
    console.log(`Modal Blueprint: isVisible=${previewModalState.isVisible}, summary="${previewModalState.summaryText}", rows=${previewModalState.rowCount}, hasSec1=${previewModalState.hasSec1}, hasSec2=${previewModalState.hasSec2}`);
    if (!previewModalState.isVisible || previewModalState.hasSec2 || !previewModalState.hasSec1) {
      throw new Error('❌ LỖI: Modal xem kịch bản không đúng (vẫn còn Mục 2 hoặc thiếu Mục 1)!');
    }

    // Chụp ảnh màn hình Modal Preview
    const shotPath1 = path.join(artifactsDir, 'studio_preview_modal_after_delete.png');
    const shotPathLocal = path.join(screenshotsDir, 'studio_preview_modal_after_delete.png');
    await page.screenshot({ path: shotPath1, fullPage: false });
    await page.screenshot({ path: shotPathLocal, fullPage: false });
    console.log(`📸 Đã chụp ảnh Modal Kịch Bản lưu tại: ${shotPath1}`);

    // Đóng modal
    await page.click('button[onclick*="closeStudioPreviewModal"]');
    await page.waitForTimeout(500);

    console.log('\n--- BƯỚC 8: LƯU KỊCH BẢN VÀ CHUYỂN SANG SÂN KHẤU GIÁO VIÊN ---');
    await page.click('button[onclick*="studioSaveLesson"]');
    await page.waitForTimeout(1000);

    // Sang Sân khấu
    await page.click('#btn-tnav-stage');
    await page.waitForTimeout(800);

    const stageSectionNav = await page.evaluate(() => {
      const nav = document.getElementById('stage-section-navigator');
      const tabs = nav ? Array.from(nav.querySelectorAll('.stage-sec-tab')).map(b => b.innerText.trim()) : [];
      return tabs;
    });
    console.log('Các tab trên Section Navigator Sân Khấu:', stageSectionNav);
    const hasSec2InStage = stageSectionNav.some(t => t.includes('Mục 2'));
    if (hasSec2InStage) {
      throw new Error('❌ LỖI: Section Navigator trên Sân Khấu vẫn còn Mục 2!');
    }
    console.log('✅ PASS: Sân Khấu đồng bộ chính xác, chỉ có Mục 1!');

    // Chụp ảnh Sân khấu
    const shotPath2 = path.join(artifactsDir, 'teacher_stage_after_section_delete.png');
    await page.screenshot({ path: shotPath2, fullPage: false });
    console.log(`📸 Đã chụp ảnh Sân Khấu lưu tại: ${shotPath2}`);

    console.log('\n========================================================================');
    console.log('🎉 TẤT CẢ 8 BƯỚC KIỂM THỬ XÓA / KHÔI PHỤC HĐ VÀ XÓA MỤC ĐẠT PASS 100%!');
    console.log('========================================================================');
  } finally {
    await browser.close();
    if (server && server.close) server.close();
  }
}

runTest().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
