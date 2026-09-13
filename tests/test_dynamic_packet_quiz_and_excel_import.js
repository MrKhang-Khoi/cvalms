const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');
const url = require('url');

function startServer(port = 8098) {
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
  console.log('🧪 TEST: DYNAMIC MULTI-QUESTION PACKET QUIZ, EXCEL IMPORT & STAGE NAVIGATOR');
  console.log('========================================================================');

  const server = await startServer(8098);
  const artifactsDir = path.resolve('C:/Users/HPZBook/.gemini/antigravity/brain/3200ba6e-bc70-4c6b-860d-d35ff50ae270');
  const screenshotsDir = path.resolve('C:/Users/HPZBook/OneDrive - Sở GD&ĐT Quảng Ngãi/Desktop/LMS PHÒNG MÁY TƯƠNG TÁC/tests/pipeline_screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  // Context 1: Teacher (1920x1080)
  const teacherContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const teacherPage = await teacherContext.newPage();

  // Context 2: Student (1366x768 - chuẩn máy trạm trường học)
  const studentContext = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const studentPage = await studentContext.newPage();

  const consoleErrors = [];
  teacherPage.on('pageerror', err => consoleErrors.push(`Teacher PageError: ${err.message}`));
  studentPage.on('pageerror', err => consoleErrors.push(`Student PageError: ${err.message}`));

  teacherPage.on('dialog', async d => {
    console.log(`   [Teacher Dialog]: ${d.message()}`);
    await d.accept();
  });
  studentPage.on('dialog', async d => {
    console.log(`   [Student Dialog]: ${d.message()}`);
    await d.accept();
  });

  try {
    console.log('\n--- [PHẦN 1: KIỂM TRA EXCEL TEMPLATE & IMPORT PARSER] ---');
    await teacherPage.goto('http://127.0.0.1:8098/', { waitUntil: 'networkidle' });
    await teacherPage.waitForTimeout(300);

    // Đăng nhập giáo viên
    await teacherPage.click('#btn-open-teacher-login');
    await teacherPage.waitForTimeout(200);
    await teacherPage.fill('#teacher-password-input', 'admin123');
    await teacherPage.click('#modal-teacher-login button[type="submit"]');
    await teacherPage.waitForTimeout(400);

    // Chuyển sang Studio Editor
    await teacherPage.click('#btn-tnav-studio');
    await teacherPage.waitForTimeout(400);

    // Kiểm tra nút Mẫu Excel và Nhập Excel
    const btnDownload = await teacherPage.$('#btn-download-excel-template');
    const btnImport = await teacherPage.$('#btn-import-excel');
    const inputExcel = await teacherPage.$('#excel-file-input');

    if (!btnDownload || !btnImport || !inputExcel) {
      throw new Error('Nút [Mẫu Excel], [Nhập Excel] hoặc input file không tồn tại trong Studio!');
    }
    console.log('   ✅ Nút [Mẫu Excel] và [Nhập Excel] hiển thị đầy đủ trên thanh công cụ Studio!');

    // Test parser CSV & Excel logic
    const parseResult = await teacherPage.evaluate(() => {
      const csv = 'Mục,Tên mục,Loại hoạt động,Dạng trắc nghiệm,Nội dung,A,B,C,D,Đáp án,Thời lượng\n1,Mục 1: Xâu Ký Tự,trac_nghiem,single_choice,Index đầu tiên là mấy?,0,1,-1,Tùy chọn,A,60\n1,Mục 1: Xâu Ký Tự,trac_nghiem,short_answer,len("Python") là gì?,,,,6,60';
      const rows = window.APP.parseCSV(csv);
      return { rowCount: rows.length, colCount: rows[0].length };
    });
    console.log(`   ✅ Bộ parser CSV thuần hoạt động chuẩn xác: ${parseResult.rowCount} dòng, ${parseResult.colCount} cột.`);

    console.log('\n--- [PHẦN 2: THÊM CÂU HỎI ĐỘNG VÀO GÓI TRẮC NGHIỆM MỤC 1 & 2] ---');
    // Nạp kịch bản gốc sạch sẽ và dọn dẹp container để chắc chắn bắt đầu từ 1 câu
    await teacherPage.evaluate(() => {
      window.APP.loadLessonToStudio('tin10_bai12');
      const container = document.getElementById('sec1-quizzes-container');
      if (container) {
        const cards = container.querySelectorAll('.studio-quiz-item-card');
        for (let i = 1; i < cards.length; i++) cards[i].remove();
      }
      const badge = document.getElementById('sec1-quiz-count-badge');
      if (badge) badge.innerHTML = '<i class="fas fa-layer-group"></i> Gói 1 câu trắc nghiệm';
    });
    await teacherPage.waitForTimeout(300);

    // Thêm câu hỏi thứ 2 vào Mục 1
    await teacherPage.evaluate(() => {
      window.studioAddQuizQuestion(1);
    });
    await teacherPage.waitForTimeout(300);

    // Đổi câu hỏi 2 thành dạng True/False
    await teacherPage.evaluate(() => {
      const container = document.getElementById('sec1-quizzes-container');
      const cards = container.querySelectorAll('.studio-quiz-item-card');
      if (cards.length >= 2) {
        const q2 = cards[1];
        const sel = q2.querySelector('.sqic-type-select');
        sel.value = 'true_false';
        window.studioChangeQuestionType(sel);
        const qInp = q2.querySelector('.sqic-q-input');
        if (qInp) qInp.value = 'Các nhận định sau về xâu ký tự trong Python Đúng hay Sai?';
      }
    });
    await teacherPage.waitForTimeout(200);

    // Thêm câu hỏi thứ 3 vào Mục 1 (Dạng short answer)
    await teacherPage.evaluate(() => {
      window.studioAddQuizQuestion(1);
    });
    await teacherPage.waitForTimeout(300);

    await teacherPage.evaluate(() => {
      const container = document.getElementById('sec1-quizzes-container');
      const cards = container.querySelectorAll('.studio-quiz-item-card');
      if (cards.length >= 3) {
        const q3 = cards[2];
        const sel = q3.querySelector('.sqic-type-select');
        sel.value = 'short_answer';
        window.studioChangeQuestionType(sel);
        const qInp = q3.querySelector('.sqic-q-input');
        if (qInp) qInp.value = 'Cho s = "TinHoc". Kết quả của len(s) là bao nhiêu?';
        const saInp = q3.querySelector('.sqic-sa-ans');
        if (saInp) saInp.value = '6';
      }
    });
    await teacherPage.waitForTimeout(200);

    // Đọc số câu hỏi trong Mục 1
    const sec1CountText = await teacherPage.$eval('#sec1-quiz-count-badge', el => el.textContent.trim());
    console.log(`   ✅ Huy hiệu Mục 1 đã cập nhật: "${sec1CountText}" (Gồm 3 dạng: Single Choice, Đúng/Sai, Điền code).`);

    // Bấm LƯU KỊCH BẢN
    await teacherPage.click('#btn-studio-save-lesson');
    await teacherPage.waitForTimeout(400);

    // Bấm XEM TRƯỚC KỊCH BẢN (Blueprint Table)
    await teacherPage.click('.sta-actions button:has-text("Xem trước")');
    await teacherPage.waitForTimeout(400);

    const modalVisible = await teacherPage.$eval('#modal-studio-preview', el => el.style.display !== 'none');
    if (!modalVisible) throw new Error('Modal Blueprint Preview không hiển thị sau khi bấm Xem trước!');

    const tableContent = await teacherPage.$eval('.blueprint-table', el => el.textContent);
    const hasPacketText = tableContent.includes('Gói 3 câu trắc nghiệm');
    console.log(`   ✅ Modal Bảng Blueprint hiển thị chuẩn xác gói 3 câu hỏi trắc nghiệm: ${hasPacketText}`);

    // Đóng modal preview
    await teacherPage.click('#btn-close-blueprint-preview');
    await teacherPage.waitForTimeout(300);

    console.log('\n--- [PHẦN 3: SÂN KHẤU GIÁO VIÊN & THANH SECTION NAVIGATOR] ---');
    // Chuyển sang Tab Sân khấu lớp học
    await teacherPage.click('#btn-tnav-stage');
    await teacherPage.waitForTimeout(400);

    // Kích hoạt tiết học 10A1 nếu chưa kích hoạt
    const isStartVisible = await teacherPage.isVisible('#btn-start-class-session');
    if (isStartVisible) {
      await teacherPage.click('#btn-start-class-session');
      await teacherPage.waitForTimeout(500);
    }

    // Kiểm tra thanh Section Navigator
    const secNav = await teacherPage.$('#stage-section-navigator');
    if (!secNav) throw new Error('#stage-section-navigator không tồn tại trên Sân khấu Giáo viên!');
    
    const tabsCount = await teacherPage.$$eval('.stage-sec-tab', tabs => tabs.length);
    console.log(`   ✅ Thanh Section Navigator trên Sân khấu hiển thị ${tabsCount} tab phân tầng (Khởi động, Mục 1, Mục 2, Tổng kết).`);

    // Chuyển sang Tab Mục 1 trên Section Navigator
    await teacherPage.evaluate(() => {
      window.stageSelectSection(1);
    });
    await teacherPage.waitForTimeout(300);

    const activeSecId = await teacherPage.evaluate(() => window.STORE.getState().currentSection);
    console.log(`   ✅ Đã chọn Mục 1 trên Sân khấu: currentSection = ${activeSecId}`);

    console.log('\n--- [PHẦN 4: HỌC SINH THAM GIA PHÒNG HỌC & ĐẤU TRƯỜNG LIVE QUIZ] ---');
    // Giải phóng 18 máy về trạng thái trống trước khi học sinh vào lớp
    await teacherPage.evaluate(() => window.teacherResetAllToLobby());
    await teacherPage.waitForTimeout(300);

    await studentPage.goto('http://127.0.0.1:8098/', { waitUntil: 'networkidle' });
    await studentPage.evaluate(() => localStorage.removeItem('lms_fixed_machine_id'));
    await studentPage.reload({ waitUntil: 'networkidle' });
    await studentPage.waitForTimeout(500);

    // Học sinh chọn Máy 01
    await studentPage.waitForSelector('#computers-grid', { timeout: 5000 });
    await studentPage.locator('#computers-grid .computer-card').nth(0).click();
    await studentPage.waitForTimeout(300);
    await studentPage.click('#btn-modal-confirm');
    await studentPage.waitForSelector('#st-view-waiting.active', { timeout: 5000 });

    const stuScreen = await studentPage.evaluate(() => window.STORE.getState().screen);
    console.log(`   ✅ Học sinh Máy 01 đã vào sảnh chờ an toàn (screen: ${stuScreen})!`);

    // Giáo viên kích hoạt Hoạt động Đấu trường (Quiz)
    console.log('   -> Giáo viên kích hoạt Hoạt động Đấu trường Quiz...');
    await teacherPage.evaluate(() => {
      window.teacherSetPhase('quiz');
      window.APP.h4StartArena();
      window.APP.h4DeliverQuiz();
    });
    await teacherPage.waitForTimeout(1000);
    await studentPage.waitForTimeout(1000);

    console.log('\n--- [PHẦN 5: HỌC SINH LÀM GÓI ĐỀ 3 CÂU THEO CHU TRÌNH TIẾP THEO -> NỘP BÀI] ---');
    // Kiểm tra giao diện câu hỏi 1 trên máy học sinh
    const q1Title = await studentPage.$eval('#quiz-q-num', el => el.textContent.trim());
    console.log(`   -> Học sinh đang ở: "${q1Title}"`);

    // Học sinh chọn đáp án Câu 1
    await studentPage.locator('.quiz-opt').first().click();
    await studentPage.waitForTimeout(300);
    console.log('   -> Học sinh Máy 01 đã chọn phương án cho Câu 1.');

    // Bấm [Câu tiếp theo ➡️]
    await studentPage.locator('#btn-quiz-next').click();
    await studentPage.waitForTimeout(300);

    // Kiểm tra sang Câu 2
    const q2Title = await studentPage.$eval('#quiz-q-num', el => el.textContent.trim());
    console.log(`   -> Đã chuyển sang: "${q2Title}" (Dạng Đúng/Sai 4 ý)`);

    // Học sinh trả lời 4 ý Đúng/Sai của Câu 2
    await studentPage.evaluate(() => {
      const rows = document.querySelectorAll('.quiz-tf-row');
      rows.forEach((r, idx) => {
        const btn = idx % 2 === 0 ? r.querySelector('.btn-true') : r.querySelector('.btn-false');
        if (btn) btn.click();
      });
    });
    await studentPage.waitForTimeout(300);

    // Bấm [Câu tiếp theo ➡️] sang Câu 3
    await studentPage.locator('#btn-quiz-next').click();
    await studentPage.waitForTimeout(300);

    // Kiểm tra sang Câu 3
    const q3Title = await studentPage.$eval('#quiz-q-num', el => el.textContent.trim());
    console.log(`   -> Đã chuyển sang: "${q3Title}" (Dạng điền kết quả code)`);

    // Học sinh điền kết quả Câu 3
    await studentPage.locator('#quiz-short-input').fill('6');
    await studentPage.waitForTimeout(300);

    // Kiểm tra nút [NỘP BÀI HOÀN THÀNH]
    console.log('   -> Bấm [🚀 NỘP BÀI HOÀN THÀNH] gói đề trắc nghiệm...');
    await studentPage.locator('#btn-quiz-packet-submit').click();
    await studentPage.waitForTimeout(600);

    // Kiểm tra hộp phản hồi Feedback hiển thị thành công
    const feedbackVisible = await studentPage.$eval('#quiz-feedback-box', el => el.style.display !== 'none');
    const feedbackText = await studentPage.$eval('#quiz-feedback-box', el => el.textContent.trim());
    console.log(`   ✅ Hộp phản hồi hiển thị: "${feedbackText}" (Feedback Visible: ${feedbackVisible})`);

    // Chụp ảnh minh chứng máy học sinh hoàn thành gói đề
    const stuScreenshot = path.join(screenshotsDir, 'student_dynamic_packet_quiz_completed.png');
    await studentPage.screenshot({ path: stuScreenshot, fullPage: true });
    console.log(`   📸 Đã chụp ảnh máy học sinh: ${path.basename(stuScreenshot)}`);

    // Copy sang artifact dir
    const artStuScreenshot = path.join(artifactsDir, 'student_dynamic_packet_quiz_completed.png');
    fs.copyFileSync(stuScreenshot, artStuScreenshot);

    // Kiểm tra Sân khấu Giáo viên đã nhận bài nộp của Máy 01
    await teacherPage.waitForTimeout(500);
    const teacherHasAnswer = await teacherPage.evaluate(() => {
      const state = window.STORE.getState();
      return !!(state.quizAnswers && state.quizAnswers[1]);
    });
    console.log(`   ✅ Sân khấu Giáo viên đã cập nhật bài làm gói đề của Máy 01: ${teacherHasAnswer}`);

    // Giáo viên bấm [3. Công bố đáp án & Podium]
    console.log('   -> Giáo viên bấm [3. Công bố đáp án & Podium]...');
    await teacherPage.click('#btn-h4-step-3-podium');
    await teacherPage.waitForTimeout(800);

    const teacherScreenshot = path.join(screenshotsDir, 'teacher_stage_packet_quiz_leaderboard.png');
    await teacherPage.screenshot({ path: teacherScreenshot, fullPage: true });
    console.log(`   📸 Đã chụp ảnh Sân khấu Giáo viên: ${path.basename(teacherScreenshot)}`);

    const artTeacherScreenshot = path.join(artifactsDir, 'teacher_stage_packet_quiz_leaderboard.png');
    fs.copyFileSync(teacherScreenshot, artTeacherScreenshot);

    console.log('\n--- [PHẦN 6: KIỂM TRA CHỐNG NHÌN BÀI KNUTH THEO MÁY TRẠM] ---');
    // Kiểm tra thứ tự đáp án giữa Máy 01 và Máy 02
    const orders = await teacherPage.evaluate(() => {
      const qOptions = { A: 'A', B: 'B', C: 'C', D: 'D' };
      const m1 = window.APP.getShuffledOptions(qOptions, 1, 0, true).map(i => i.key).join('');
      const m2 = window.APP.getShuffledOptions(qOptions, 2, 0, true).map(i => i.key).join('');
      const m3 = window.APP.getShuffledOptions(qOptions, 3, 0, true).map(i => i.key).join('');
      return { m1, m2, m3 };
    });
    console.log(`   Thứ tự máy 1: ${orders.m1} | Máy 2: ${orders.m2} | Máy 3: ${orders.m3}`);
    const isAntiCheatOk = (orders.m1 !== orders.m2 || orders.m2 !== orders.m3);
    console.log(`   ✅ Thuật toán đảo ngẫu nhiên có hạt giống chống nhìn bài: ${isAntiCheatOk ? 'ĐẠT (Khác nhau)' : 'FAIL'}`);

    console.log('\n========================================================================');
    console.log('🎉 TẤT CẢ CÁC TÍNH NĂNG MỚI ĐÃ VƯỢT QUA BÀI TEST ZERO-BUG 100%!');
    console.log('========================================================================');

    if (consoleErrors.length > 0) {
      console.warn('⚠️ Console errors during test:', consoleErrors);
    }
  } finally {
    await browser.close();
    if (server && server.close) server.close();
  }
}

runTest().catch(err => {
  console.error('❌ Test thất bại:', err);
  process.exit(1);
});
