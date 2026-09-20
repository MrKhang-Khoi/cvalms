const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = 8996;
const outputDir = path.resolve(__dirname, 'pipeline_screenshots');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(ROOT_DIR, req.url.split('?')[0]);
      if (req.url === '/' || req.url.startsWith('/?')) {
        filePath = path.join(ROOT_DIR, 'index.html');
      }

      if (req.url === '/favicon.ico') {
        res.writeHead(204);
        res.end();
        return;
      }

      const ext = path.extname(filePath);
      const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml'
      };

      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Not Found: ' + req.url);
        } else {
          res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
          res.end(content);
        }
      });
    });

    server.listen(PORT, '127.0.0.1', () => {
      console.log('[HTTP Server] Running at http://127.0.0.1:' + PORT);
      resolve(server);
    });
  });
}

async function runAntiCheatAndConsistencyTests() {
  console.log('================================================================');
  console.log('🚀 [TEST] KIỂM THỬ ĐỒNG BỘ TIẾN TRÌNH SƯ PHẠM & CHỐNG NHÌN BÀI 18 MÁY');
  console.log('================================================================');

  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });

  // 3 Browser contexts: Teacher, Student Machine 1, Student Machine 2
  const teacherCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const m1Ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const m2Ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });

  const teacherPage = await teacherCtx.newPage();
  const m1Page = await m1Ctx.newPage();
  const m2Page = await m2Ctx.newPage();

  const consoleErrors = [];
  [teacherPage, m1Page, m2Page].forEach((page, idx) => {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`Page ${idx} Error: ${msg.text()}`);
      }
    });
    page.on('pageerror', err => {
      consoleErrors.push(`Page ${idx} PageError: ${err.message}`);
    });
    page.on('dialog', async d => {
      console.log(`   [Page ${idx} Dialog]:`, d.message());
      await d.accept();
    });
  });

  // NGÂN HÀNG TRI THỨC ĐỘC LẬP CHUẨN SGK TIN HỌC (BLACKBOX TEST GROUND TRUTH)
  const GROUND_TRUTH = {
    singleChoice: {
      question: 'Đặc điểm nào sau đây KHÔNG PHẢI là tính chất của thuật toán?',
      correctKey: 'D' // Tính vô tận (thuật toán bắt buộc phải dừng sau số bước hữu hạn)
    },
    trueFalse: {
      answers: { a: true, b: false, c: true, d: true }
    },
    shortAnswer: {
      text: 'TinHoc'
    }
  };

  let idToken = '';

  console.log('[Setup] Resetting Firebase activeSession to clean state...');
  try {
    const os = require('os');
    const cachePath = path.join(os.tmpdir(), 'cvalms_fb_token_cache.json');
    // Dọn sạch file cache cũ trên đĩa nếu còn tồn tại
    try { if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath); } catch (e) { /* ignore */ }

    // Cấp phát token ẩn danh an toàn trong bộ nhớ RAM, tuyệt đối không lưu plaintext ra đĩa
    const authRes = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyCC2tCURXYAMpdN687kcjY537K7zUhh_Fg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnSecureToken: true })
    }).then(r => r.json());
    idToken = authRes.idToken || '';

    // Kiểm tra tính hợp lực thực tế qua probe.ok (HTTP 200-299)
    if (idToken) {
      const probe = await fetch('https://day-hoc-tuong-tac-7ee69-default-rtdb.asia-southeast1.firebasedatabase.app/.json?auth=' + idToken + '&shallow=true');
      if (!probe.ok) {
        throw new Error(`Firebase token probe failed with HTTP status ${probe.status}`);
      }
    }

    await fetch('https://day-hoc-tuong-tac-7ee69-default-rtdb.asia-southeast1.firebasedatabase.app/activeSession.json?auth=' + idToken, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lessonId: 'tin6_bai12',
        classId: '6A1',
        currentPhase: 'waiting',
        sessionStarted: false,
        unlocked: true,
        luckyDraw: { spinning: false },
        resetAt: 0,
        occupiedMachines: null,
        quizAnswers: null,
        machines: null
      })
    });
    console.log('   -> Firebase activeSession reset OK!');
  } catch (e) {
    console.warn('   -> Reset warning:', e.message);
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: KIỂM TRA ĐỒNG NHẤT 4 HOẠT ĐỘNG SƯ PHẠM (STUDIO & PIPELINE)
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: ĐỒNG BỘ 4 BƯỚC SƯ PHẠM GIỮA XƯỞNG SOẠN VÀ TIẾN TRÌNH ---');
    await teacherPage.goto(`http://127.0.0.1:${PORT}`, { waitUntil: 'networkidle' });
    await teacherPage.waitForTimeout(300);

    // Login Teacher
    await teacherPage.click('#btn-open-teacher-login');
    await teacherPage.waitForTimeout(200);
    await teacherPage.fill('#teacher-password-input', 'admin123');
    await teacherPage.click('#modal-teacher-login button[type="submit"]');
    await teacherPage.waitForTimeout(400);

    // Reset sạch toàn bộ phòng máy về trạng thái ban đầu
    await teacherPage.evaluate(() => {
      if (typeof window.teacherResetAllToLobby === 'function') {
        window.teacherResetAllToLobby();
      }
    });
    await teacherPage.waitForTimeout(800);

    // Mở Tab Xưởng Soạn Kịch Bản
    await teacherPage.click('#btn-tnav-studio');
    await teacherPage.waitForTimeout(300);

    // Kiểm tra Step 3 trong Studio là Thực hành Python
    const step3Title = await teacherPage.inputValue('#studio-disc-title');
    console.log('   -> Studio Bước 3 (Thực hành):', step3Title);
    if (!step3Title.toLowerCase().includes('thực hành') && !step3Title.toLowerCase().includes('thảo luận')) {
      throw new Error(`Bước 3 trong Studio không phải Thực hành: ${step3Title}`);
    }

    // Thiết lập cấu hình câu hỏi trắc nghiệm đồng bộ với Ground Truth chuẩn
    await teacherPage.selectOption('#studio-quiz-correct', GROUND_TRUTH.singleChoice.correctKey);
    const quizQ = await teacherPage.inputValue('#studio-quiz-q');
    const quizType = await teacherPage.inputValue('#studio-quiz-type');
    const quizShuffle = await teacherPage.isChecked('#studio-quiz-shuffle');
    console.log('   -> Studio Bước 4 (Kahoot/Quiz):', quizQ.substring(0, 45) + '...');
    console.log('   -> Quiz Type:', quizType, '| Anti-cheat Shuffle:', quizShuffle, '| Ground Truth Key:', GROUND_TRUTH.singleChoice.correctKey);
    if (!quizQ) throw new Error('Không nạp được câu hỏi trắc nghiệm trong Studio');

    // Lưu và đồng bộ kịch bản từ Studio
    await teacherPage.click('#btn-studio-save-lesson');
    await teacherPage.waitForTimeout(500);

    // Chuyển lại Tab Điều Khiển & Sân Khấu để kiểm tra Pipeline
    await teacherPage.click('#btn-tnav-stage');
    await teacherPage.waitForTimeout(300);

    const pipelineActivities = await teacherPage.evaluate(() => {
      const cards = document.querySelectorAll('.pipeline-activity-card');
      return Array.from(cards).map(c => ({
        key: c.dataset.actKey,
        title: c.querySelector('.pac-title')?.textContent?.trim(),
        index: c.querySelector('.pac-index-tag')?.textContent?.trim()
      }));
    });

    console.log('   -> Pipeline trên Sân khấu:', JSON.stringify(pipelineActivities));
    if (pipelineActivities.length !== 4) {
      throw new Error(`Số lượng hoạt động trên Sân khấu (${pipelineActivities.length}) không bằng 4!`);
    }

    // Kiểm tra đúng thứ tự 1-2-3-4
    if (pipelineActivities[0].key !== 'old_lesson') throw new Error('Bước 1 không phải old_lesson');
    if (pipelineActivities[1].key !== 'warmup') throw new Error('Bước 2 không phải warmup');
    if (pipelineActivities[2].key !== 'discussion') throw new Error('Bước 3 không phải discussion');
    if (pipelineActivities[3].key !== 'quiz') throw new Error('Bước 4 không phải quiz');

    console.log('   ✅ TEST 1 PASS: 4 bước sư phạm đã đồng nhất 100% giữa Xưởng Soạn & Sân khấu!');

    // Giáo viên kích hoạt và mở khóa tiết học (giải phóng toàn bộ 18 máy)
    await teacherPage.click('#btn-start-class-session');
    await teacherPage.waitForTimeout(600);

    // -------------------------------------------------------------
    // TEST 2: THIẾT LẬP MÁY 01 VÀ MÁY 02 VÀO PHÒNG HỌC
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: ĐĂNG NHẬP 2 HỌC SINH MÁY 01 VÀ MÁY 02 ---');
    await m1Page.goto(`http://127.0.0.1:${PORT}`, { waitUntil: 'networkidle' });
    await m2Page.goto(`http://127.0.0.1:${PORT}`, { waitUntil: 'networkidle' });
    await m1Page.evaluate(() => localStorage.clear());
    await m2Page.evaluate(() => localStorage.clear());
    await m1Page.reload({ waitUntil: 'networkidle' });
    await m2Page.reload({ waitUntil: 'networkidle' });
    await m1Page.waitForTimeout(400);
    await m2Page.waitForTimeout(400);

    // Chờ 2 máy học sinh tự động nhận tín hiệu mở khóa từ Firebase RTDB thật
    await m1Page.waitForSelector('#computers-grid:not(.locked-state)', { timeout: 15000 });
    await m2Page.waitForSelector('#computers-grid:not(.locked-state)', { timeout: 15000 });

    // Máy 1 chọn bàn 1
    await m1Page.locator('#computers-grid .computer-card').nth(0).click();
    await m1Page.waitForTimeout(300);
    await m1Page.click('#btn-modal-confirm');
    await m1Page.waitForTimeout(400);

    // Máy 2 chọn bàn 2
    await m2Page.locator('#computers-grid .computer-card').nth(1).click();
    await m2Page.waitForTimeout(300);
    await m2Page.click('#btn-modal-confirm');
    await m2Page.waitForTimeout(400);

    const m1Occupied = await m1Page.evaluate(() => window.STORE.getState().machineId);
    const m2Occupied = await m2Page.evaluate(() => window.STORE.getState().machineId);
    console.log(`   -> Máy 1 ID: ${m1Occupied} | Máy 2 ID: ${m2Occupied}`);
    if (m1Occupied !== 1 || m2Occupied !== 2) throw new Error('Không phân vị trí chính xác cho Máy 1 và Máy 2');

    // Xác nhận Giáo viên ghi nhận 2 máy học sinh tự động qua Firebase RTDB thật (Real Network Trace, cấm mock)
    await teacherPage.waitForFunction(() => {
      const s = window.STORE ? window.STORE.getState() : {};
      const occ = s.occupiedMachines || {};
      return Object.keys(occ).length >= 2;
    }, { timeout: 15000 });
    console.log('   ✅ Đã đồng bộ sĩ số Máy 1 và Máy 2 về Giáo viên qua Firebase Cloud RTDB!');

    if (idToken) {
      const verifyRes = await fetch(`https://day-hoc-tuong-tac-7ee69-default-rtdb.asia-southeast1.firebasedatabase.app/activeSession/machines.json?auth=${idToken}`);
      const cloudMachines = await verifyRes.json();
      console.log('   [Cloud RTDB Audit] Real Network Trace verified machines:', Object.keys(cloudMachines || {}));
      if (!cloudMachines || !cloudMachines['1'] || !cloudMachines['2']) {
        throw new Error('Firebase Cloud RTDB chưa nhận đủ Máy 1 và Máy 2!');
      }
    }

    // -------------------------------------------------------------
    // TEST 3: GIÁO VIÊN KÍCH HOẠT ĐẤU TRƯỜNG KAHOOT & TEST CHỐNG NHÌN BÀI
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: KÍCH HOẠT LIVE QUIZ & KIỂM TRA ĐẢO ĐÁP ÁN CHỐNG NHÌN BÀI ---');
    // Giáo viên bắt đầu hoạt động quiz
    await teacherPage.click('#pac-quiz .btn-pac-start');
    await teacherPage.waitForTimeout(300);
    if (await teacherPage.isVisible('#modal-waiting-room-alert')) {
      await teacherPage.click('#btn-wra-proceed');
    }
    // Đợi hiệu ứng đếm ngược 3-2-1
    await teacherPage.waitForTimeout(3800);

    // Chờ 2 máy học sinh chuyển sang view quiz từ Firebase RTDB thật
    await m1Page.waitForSelector('#st-view-quiz.active', { timeout: 15000 });
    await m2Page.waitForSelector('#st-view-quiz.active', { timeout: 15000 });
    await m1Page.waitForTimeout(500);

    // Đọc thứ tự 4 đáp án trên Máy 1
    const m1Options = await m1Page.evaluate(() => {
      const btns = document.querySelectorAll('#quiz-dynamic-body .quiz-opt');
      return Array.from(btns).map((b, idx) => ({
        slot: idx,
        key: b.dataset.qopt,
        text: b.querySelector('.qo-label')?.textContent?.trim()
      }));
    });

    // Đọc thứ tự 4 đáp án trên Máy 2
    const m2Options = await m2Page.evaluate(() => {
      const btns = document.querySelectorAll('#quiz-dynamic-body .quiz-opt');
      return Array.from(btns).map((b, idx) => ({
        slot: idx,
        key: b.dataset.qopt,
        text: b.querySelector('.qo-label')?.textContent?.trim()
      }));
    });

    console.log('   [Máy 01] Thứ tự phương án 4 vị trí:', m1Options.map(o => `Slot ${o.slot}: ${o.key}`).join(' | '));
    console.log('   [Máy 02] Thứ tự phương án 4 vị trí:', m2Options.map(o => `Slot ${o.slot}: ${o.key}`).join(' | '));

    // Khẳng định Knuth Seeded Permutation: Vị trí đầu tiên (Slot 0) của Máy 1 và Máy 2 phải khác nhau!
    const m1Slot0 = m1Options[0].key;
    const m2Slot0 = m2Options[0].key;
    console.log(`   -> Máy 01 Slot 0 (ĐỎ) mang phương án: [${m1Slot0}]`);
    console.log(`   -> Máy 02 Slot 0 (ĐỎ) mang phương án: [${m2Slot0}]`);

    if (m1Slot0 === m2Slot0) {
      throw new Error(`Máy 1 và Máy 2 có phương án ở Slot 0 trùng nhau (${m1Slot0})! Thuật toán đảo chưa kích hoạt.`);
    }

    // Chụp ảnh minh chứng 2 máy hiển thị khác nhau
    const shotM1 = path.join(outputDir, 'm1_quiz_shuffled.png');
    const shotM2 = path.join(outputDir, 'm2_quiz_shuffled.png');
    await m1Page.screenshot({ path: shotM1 });
    await m2Page.screenshot({ path: shotM2 });
    console.log('   ✅ Đã chụp minh chứng Máy 1 và Máy 2 đảo thứ tự màu và phương án!');

    // -------------------------------------------------------------
    // TEST 4: THỬ THÁCH CHỐNG LIẾC BÀI NHAU (SHOULDER-SURFING INVARIANT)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: CHỨNG MINH LIẾC BÀI BỊ TÍNH SAI, BẤM ĐÚNG THEO KEY ĐƯỢC ĐIỂM ---');
    const expectedKey = GROUND_TRUTH.singleChoice.correctKey;
    console.log(`   -> Đáp án chuẩn SGK Tin học độc lập (Ground Truth): [${expectedKey}]`);

    // Máy 1 tìm phương án có key=expectedKey và click chọn (làm bài độc lập theo kiến thức chuẩn)
    await m1Page.click(`.quiz-opt[data-qopt="${expectedKey}"]`);
    await m1Page.waitForTimeout(500);

    const m1Feedback = await m1Page.evaluate(() => {
      const fb = document.getElementById('quiz-feedback-box');
      return {
        visible: fb && fb.style.display !== 'none',
        isSuccess: fb && fb.classList.contains('success'),
        text: fb ? fb.textContent.trim() : ''
      };
    });
    console.log(`   [Máy 01] Kết quả nộp đáp án độc lập ${expectedKey}:`, m1Feedback);
    if (!m1Feedback.isSuccess) {
      throw new Error(`Máy 01 chọn đáp án ${expectedKey} nhưng không nhận được thông báo Chính xác: ${m1Feedback.text}`);
    }

    // Bây giờ: Máy 2 liếc sang thấy Máy 1 bấm nút ở Slot X (vị trí mà Máy 1 bấm theo Ground Truth)
    const m1ClickedSlot = m1Options.find(o => o.key === expectedKey).slot;
    console.log(`   -> Máy 01 đã bấm nút ở Slot ${m1ClickedSlot}`);

    // Máy 2 "bắt chước" bấm đúng nút ở Slot đó (nhìn bài theo vị trí / màu sắc):
    const m2BtnToCheat = await m2Page.locator(`.quiz-opt.opt-slot-${m1ClickedSlot}`);
    const m2CheatedKey = await m2BtnToCheat.getAttribute('data-qopt');
    console.log(`   -> Máy 02 liếc nhìn và bấm Slot ${m1ClickedSlot} (tương ứng key ${m2CheatedKey} trên Máy 02)`);
    await m2BtnToCheat.click();
    await m2Page.waitForTimeout(500);

    const m2Feedback = await m2Page.evaluate(() => {
      const fb = document.getElementById('quiz-feedback-box');
      return {
        visible: fb && fb.style.display !== 'none',
        isSuccess: fb && fb.classList.contains('success'),
        text: fb ? fb.textContent.trim() : ''
      };
    });
    console.log('   [Máy 02] Kết quả do liếc nhìn bài:', m2Feedback);

    if (m2Feedback.isSuccess) {
      throw new Error('LỖI BẢO MẬT: Máy 02 liếc vị trí của Máy 01 nhưng vẫn được tính Đúng!');
    }
    console.log('   ✅ TEST 4 PASS: Máy 02 liếc nhìn bài đã bị hệ thống tính SAI triệt để!');

    // Kiểm tra Bảng xếp hạng trên màn hình Giáo viên tự động đồng bộ qua Firebase RTDB
    await teacherPage.waitForFunction(() => {
      const board = document.getElementById('quiz-leaderboard');
      const text = board ? board.textContent.trim() : '';
      return text.includes('Máy 01') || text.includes('Máy 1') || text.includes('An');
    }, { timeout: 15000 });
    const teacherLeaderboard = await teacherPage.evaluate(() => {
      const board = document.getElementById('quiz-leaderboard');
      return board ? board.textContent.trim() : '';
    });
    console.log('   [Giáo viên] Leaderboard phản ánh kết quả:', teacherLeaderboard.substring(0, 100) + '...');

    // -------------------------------------------------------------
    // TEST 5: KIỂM THỬ ĐA DẠNG CÂU HỎI (ĐÚNG/SAI 4 Ý & ĐIỀN KẾT QUẢ)
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: KIỂM THỬ DẠNG ĐÚNG/SAI 4 Ý & ĐIỀN KẾT QUẢ NGẮN ---');
    // Chuyển sang Tab Studio để đổi dạng sang True/False
    await teacherPage.click('#btn-tnav-studio');
    await teacherPage.waitForTimeout(300);
    await teacherPage.selectOption('#studio-quiz-type', 'true_false');
    await teacherPage.waitForTimeout(200);

    // Kiểm tra form True/False hiện lên và đọc đáp án chuẩn trực tiếp từ giao diện Giáo viên
    const isTfVisible = await teacherPage.isVisible('#studio-quiz-tf-wrap');
    if (!isTfVisible) throw new Error('Form True/False không hiển thị khi chọn true_false trong Studio');

    const expectedTfAnswers = {
      a: (await teacherPage.inputValue('#studio-tf-ans-a')) === 'true',
      b: (await teacherPage.inputValue('#studio-tf-ans-b')) === 'true',
      c: (await teacherPage.inputValue('#studio-tf-ans-c')) === 'true',
      d: (await teacherPage.inputValue('#studio-tf-ans-d')) === 'true'
    };
    console.log('   [Giáo viên] Cấu hình đáp án Đúng/Sai trên form Studio:', expectedTfAnswers);

    // Lưu kịch bản trong Studio
    await teacherPage.click('#btn-studio-save-lesson');
    await teacherPage.waitForTimeout(500);

    // Chuyển lại Tab giảng dạy và phát lệnh Quiz cho học sinh nhận dạng câu hỏi mới
    await teacherPage.click('#btn-tnav-stage');
    await teacherPage.waitForTimeout(400);
    await teacherPage.evaluate(() => {
      window.teacherSetPhase('quiz');
    });
    // Chờ mạng Firebase và Bus đồng bộ trạng thái ổn định
    await teacherPage.waitForTimeout(1200);

    // Học sinh tự động chuyển sang dạng Bảng Đúng/Sai 4 ý qua event bus (không can thiệp DOM/State)
    await m1Page.waitForSelector('#quiz-tf-table', { timeout: 10000 });
    await m1Page.waitForTimeout(400);
    const hasTfTable = await m1Page.isVisible('#quiz-tf-table');
    console.log('   [Máy 01] Hiển thị bảng Đúng/Sai 4 ý:', hasTfTable);
    if (!hasTfTable) throw new Error('Giao diện học sinh không chuyển sang bảng Đúng/Sai 4 ý');

    const tfRowsCount = await m1Page.locator('.quiz-tf-row').count();
    console.log('   [Máy 01] Số lượng mệnh đề Đúng/Sai:', tfRowsCount);
    if (tfRowsCount !== 4) throw new Error('Số lượng mệnh đề Đúng/Sai (' + tfRowsCount + ') không bằng 4');

    // Thực hiện tương tác chọn Đúng/Sai cho 4 mệnh đề theo đáp án đề thi Ground Truth độc lập
    for (const key of ['a', 'b', 'c', 'd']) {
      const isCorrect = GROUND_TRUTH.trueFalse.answers[key];
      const btnClass = isCorrect ? '.btn-true' : '.btn-false';
      await m1Page.click(`.quiz-tf-row[data-row-key="${key}"] ${btnClass}`);
      await m1Page.waitForTimeout(200);
    }
    await m1Page.waitForTimeout(400);
    await m1Page.click('#btn-submit-tf');
    await m1Page.waitForTimeout(600);

    const tfFeedback = await m1Page.evaluate(() => {
      const fb = document.getElementById('quiz-feedback-box');
      return fb ? fb.classList.contains('success') : false;
    });
    console.log('   [Máy 01] Nộp đáp án Đúng/Sai 4 ý:', tfFeedback ? 'CHÍNH XÁC ✅' : 'CHƯA ĐÚNG ❌');
    if (!tfFeedback) throw new Error('Nộp đáp án Đúng/Sai 4 ý chính xác nhưng không nhận được thông báo thành công');

    // Chụp ảnh minh chứng dạng Đúng/Sai
    const shotTf = path.join(outputDir, 'student_quiz_true_false_format.png');
    await m1Page.screenshot({ path: shotTf });
    console.log('   ✅ Đã chụp minh chứng dạng câu hỏi Đúng/Sai 4 ý chuẩn 2025!');

    // Chuyển sang dạng Short Answer (Điền kết quả)
    await teacherPage.click('#btn-tnav-studio');
    await teacherPage.waitForTimeout(300);
    await teacherPage.selectOption('#studio-quiz-type', 'short_answer');
    await teacherPage.waitForTimeout(200);
    await teacherPage.fill('#studio-sa-correct', GROUND_TRUTH.shortAnswer.text);
    await teacherPage.click('#btn-studio-save-lesson');
    await teacherPage.waitForTimeout(500);

    // Kích hoạt Quiz điền từ ngắn trên Sân khấu
    await teacherPage.click('#btn-tnav-stage');
    await teacherPage.waitForTimeout(400);
    await teacherPage.evaluate(() => {
      window.teacherSetPhase('quiz');
    });
    await teacherPage.waitForTimeout(1200);

    // Học sinh tự động chuyển sang dạng Short Answer qua event bus (không can thiệp DOM/State)
    await m1Page.waitForSelector('#quiz-short-input', { timeout: 10000 });
    await m1Page.waitForTimeout(400);
    const hasShortWrap = await m1Page.isVisible('.quiz-short-wrap');
    console.log('   [Máy 01] Hiển thị ô điền kết quả ngắn:', hasShortWrap);
    if (!hasShortWrap) throw new Error('Giao diện học sinh không chuyển sang ô điền kết quả');

    // Nhập và nộp kết quả theo Ground Truth độc lập
    await m1Page.locator('#quiz-short-input').fill(GROUND_TRUTH.shortAnswer.text);
    await m1Page.waitForTimeout(300);
    await m1Page.click('#btn-submit-short');
    await m1Page.waitForTimeout(600);

    const saFeedback = await m1Page.evaluate(() => {
      const fb = document.getElementById('quiz-feedback-box');
      return fb ? fb.classList.contains('success') : false;
    });
    console.log(`   [Máy 01] Nộp kết quả ngắn "${GROUND_TRUTH.shortAnswer.text}":`, saFeedback ? 'CHÍNH XÁC ✅' : 'CHƯA ĐÚNG ❌');
    if (!saFeedback) throw new Error('Nộp kết quả ngắn chính xác nhưng không nhận được phản hồi thành công');

    const shotSa = path.join(outputDir, 'student_quiz_short_answer_format.png');
    await m1Page.screenshot({ path: shotSa });
    console.log('   ✅ Đã chụp minh chứng dạng câu hỏi Điền kết quả code ngắn!');

    // Xác thực toàn diện qua Firebase Cloud REST API (Real Network Trace)
    if (idToken) {
      const cloudAuditRes = await fetch(`https://day-hoc-tuong-tac-7ee69-default-rtdb.asia-southeast1.firebasedatabase.app/activeSession.json?auth=${idToken}`);
      const cloudFinal = await cloudAuditRes.json();
      console.log('   [Cloud RTDB Final Audit]:', {
        currentPhase: cloudFinal?.currentPhase,
        lessonId: cloudFinal?.lessonId,
        machinesCount: Object.keys(cloudFinal?.machines || {}).length,
        hasQuizData: !!cloudFinal?.lessonData?.quiz
      });
      if (cloudFinal?.currentPhase !== 'quiz') {
        throw new Error('Cloud RTDB currentPhase không khớp quiz sau khi hoàn tất test!');
      }
    }

    console.log('\n================================================================');
    console.log('🎉 TẤT CẢ CÁC BÀI TEST CHỐNG NHÌN BÀI & ĐỒNG BỘ TIẾN TRÌNH ĐỀU PASS 100%!');
    console.log('================================================================');
  } finally {
    try {
      const os = require('os');
      const cachePath = path.join(os.tmpdir(), 'cvalms_fb_token_cache.json');
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    } catch (err) {
      console.warn('[Cache Cleanup Warning]:', err?.message || err);
    }
    await browser.close();
    server.close();
  }
}

runAntiCheatAndConsistencyTests().catch(err => {
  console.error('\n❌ TEST THẤT BẠI:', err);
  process.exit(1);
});
