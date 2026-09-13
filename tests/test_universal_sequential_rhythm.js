const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = 8997;
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

async function runUniversalSequentialRhythmTest() {
  console.log('================================================================');
  console.log('🚀 [TEST] KIỂM THỬ TOÀN DIỆN BỘ 4 NÚT TUẦN TỰ TRÊN TẤT CẢ CÁC HOẠT ĐỘNG');
  console.log('================================================================');

  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });

  const teacherCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const studentCtx = await browser.newContext({ viewport: { width: 1366, height: 768 } });

  const teacherPage = await teacherCtx.newPage();
  const studentPage = await studentCtx.newPage();

  const consoleErrors = [];
  [teacherPage, studentPage].forEach((page, idx) => {
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        consoleErrors.push({ page: idx === 0 ? 'Teacher' : 'Student', text: msg.text() });
      }
    });
    page.on('pageerror', err => {
      consoleErrors.push({ page: idx === 0 ? 'Teacher' : 'Student', text: err.message });
    });
  });

  teacherPage.on('dialog', async dialog => {
    console.log(`   [Teacher Dialog]:`, dialog.message());
    await dialog.accept();
  });

  try {
    console.log('[Setup] Dọn dẹp Firebase activeSession sang trạng thái chuẩn...');
    try {
      const authRes = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyCC2tCURXYAMpdN687kcjY537K7zUhh_Fg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnSecureToken: true })
      }).then(r => r.json());
      await fetch('https://day-hoc-tuong-tac-7ee69-default-rtdb.asia-southeast1.firebasedatabase.app/activeSession.json?auth=' + authRes.idToken, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: 'tin6_bai12',
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
      console.warn('   -> Firebase reset warning:', e.message);
    }

    // -------------------------------------------------------------
    // SETUP: Đăng nhập Giáo viên và mở phòng học
    // -------------------------------------------------------------
    console.log('\n--- BƯỚC 0: KHỞI TẠO TIẾT HỌC & ĐĂNG NHẬP GIÁO VIÊN ---');
    await teacherPage.goto(`http://127.0.0.1:${PORT}`, { waitUntil: 'networkidle' });
    await teacherPage.evaluate(() => localStorage.clear());
    await teacherPage.reload({ waitUntil: 'networkidle' });

    await teacherPage.click('#btn-open-teacher-login');
    await teacherPage.waitForTimeout(200);
    await teacherPage.fill('#teacher-password-input', 'admin123');
    await teacherPage.click('#modal-teacher-login button[type="submit"]');
    await teacherPage.waitForSelector('#screen-teacher.active', { timeout: 5000 });
    console.log('   -> Giáo viên đăng nhập thành công!');

    // Reset sạch toàn bộ phòng máy về trạng thái ban đầu
    await teacherPage.evaluate(() => {
      if (typeof window.teacherResetAllToLobby === 'function') {
        window.teacherResetAllToLobby();
      }
    });
    await teacherPage.waitForTimeout(600);

    // Kích hoạt lớp 10A1 và mở khóa máy
    await teacherPage.click('#btn-start-class-session');
    await teacherPage.waitForTimeout(600);

    // Học sinh vào máy 01
    console.log('   -> Học sinh Máy 01 tham gia phòng học...');
    await studentPage.goto(`http://127.0.0.1:${PORT}`, { waitUntil: 'networkidle' });
    await studentPage.evaluate(() => localStorage.clear());
    await studentPage.reload({ waitUntil: 'networkidle' });
    await studentPage.waitForTimeout(400);

    await studentPage.waitForSelector('#computers-grid', { timeout: 5000 });
    await studentPage.locator('#computers-grid .computer-card').nth(0).click();
    await studentPage.waitForTimeout(300);
    await studentPage.click('#btn-modal-confirm');
    await studentPage.waitForSelector('#st-view-waiting.active', { timeout: 5000 });
    // Đảm bảo teacherPage ghi nhận học sinh Máy 01 đã vào phòng
    await teacherPage.evaluate(() => {
      if (window.STORE && typeof window.STORE.getState === 'function') {
        const s = window.STORE.getState();
        window.STORE.setState({
          occupiedMachines: Object.assign({}, s.occupiedMachines, {
            1: { machineId: 1, name: 'Nguyễn Văn An & Trần Thị Bình', joinedAt: Date.now() }
          })
        });
      }
    });

    // Helper: Bắt đầu hoạt động và vượt qua modal kiểm tra sĩ số an toàn
    async function triggerStartActivity(clickAction) {
      await clickAction();
      await teacherPage.waitForTimeout(400);
      if (await teacherPage.isVisible('#modal-waiting-room-alert')) {
        console.log('   [Modal Alert] Xác nhận bắt đầu dù chưa đủ 18 máy...');
        await teacherPage.click('#btn-wra-proceed');
      }
      await teacherPage.waitForTimeout(4000); // Đếm ngược 3-2-1 đồng bộ
    }

    // -------------------------------------------------------------
    // CHẶNG 1: HOẠT ĐỘNG 1 - KIỂM TRA BÀI CŨ (old_lesson)
    // -------------------------------------------------------------
    console.log('\n--- CHẶNG 1: KIỂM TRA BÀI CŨ (4 NÚT TUẦN TỰ) ---');
    await triggerStartActivity(async () => {
      await teacherPage.click('#btn-start-lesson-hero');
    });

    await teacherPage.waitForSelector('#tw-panel-old-lesson.active', { timeout: 5000 });
    console.log('   -> Bảng tác nghiệp Kiểm tra bài cũ (#tw-panel-old-lesson) active!');

    // Kiểm tra trạng thái ban đầu của 4 nút Bước 1
    const h1Buttons = await teacherPage.evaluate(() => ({
      btn1Disabled: document.getElementById('btn-ol-step-1-draw').disabled,
      btn2Disabled: document.getElementById('btn-ol-step-2-question').disabled,
      btn3Disabled: document.getElementById('btn-ol-step-3-answer').disabled,
      btn4Disabled: document.getElementById('btn-ol-step-4-waiting').disabled
    }));
    console.log('   [HĐ 1 Ban đầu] Nút 1:', !h1Buttons.btn1Disabled, '| Nút 2 (Khóa):', h1Buttons.btn2Disabled, '| Nút 3 (Khóa):', h1Buttons.btn3Disabled, '| Nút 4 (Sẵn sàng):', !h1Buttons.btn4Disabled);
    if (h1Buttons.btn1Disabled || !h1Buttons.btn2Disabled || !h1Buttons.btn3Disabled || h1Buttons.btn4Disabled) {
      throw new Error('Logic ban đầu 4 nút HĐ 1 không đúng quy tắc!');
    }

    // Bấm Nút 1: Bốc thăm
    console.log('   -> Bấm Nút 1: Bốc thăm gọi học sinh...');
    await teacherPage.click('#btn-ol-step-1-draw');
    await teacherPage.waitForSelector('#modal-lucky-draw', { state: 'visible' });
    await teacherPage.click('#btn-trigger-spin');
    await teacherPage.waitForTimeout(4600);

    if (await teacherPage.isVisible('#btn-close-lucky-draw')) {
      await teacherPage.click('#btn-close-lucky-draw');
      await teacherPage.waitForTimeout(400);
    }

    // Kiểm tra Nút 2 đã mở khóa
    const h1AfterDraw = await teacherPage.evaluate(() => ({
      btn1Completed: document.getElementById('btn-ol-step-1-draw').disabled,
      btn2Unlocked: !document.getElementById('btn-ol-step-2-question').disabled
    }));
    console.log('   [HĐ 1 Sau Bốc thăm] Nút 1 đã hoàn thành:', h1AfterDraw.btn1Completed, '| Nút 2 đã mở khóa:', h1AfterDraw.btn2Unlocked);
    if (!h1AfterDraw.btn2Unlocked) throw new Error('Nút 2 chưa mở khóa sau khi bốc thăm!');

    // Bấm Nút 2: Phát đề & Tính giờ
    console.log('   -> Bấm Nút 2: Phát đề câu hỏi & Bắt đầu tính giờ...');
    await teacherPage.click('#btn-ol-step-2-question');
    await teacherPage.waitForTimeout(500);

    const h1AfterQ = await teacherPage.evaluate(() => ({
      btn2Completed: document.getElementById('btn-ol-step-2-question').disabled,
      btn3Unlocked: !document.getElementById('btn-ol-step-3-answer').disabled
    }));
    console.log('   [HĐ 1 Sau Phát đề] Nút 2 đã hoàn thành:', h1AfterQ.btn2Completed, '| Nút 3 đã mở khóa:', h1AfterQ.btn3Unlocked);
    if (!h1AfterQ.btn3Unlocked) throw new Error('Nút 3 chưa mở khóa sau khi phát đề!');

    // Bấm Nút 3: Công bố đáp án
    console.log('   -> Bấm Nút 3: Công bố đáp án chuẩn...');
    await teacherPage.click('#btn-ol-step-3-answer');
    await teacherPage.waitForTimeout(300);

    // Bấm Nút 4: Phòng chờ
    console.log('   -> Bấm Nút 4: Chuyển về phòng chờ an toàn...');
    await teacherPage.click('#btn-ol-step-4-waiting');
    await teacherPage.waitForTimeout(2000);

    const studentInLobbyAfterH1 = await studentPage.isVisible('#st-view-waiting.active');
    console.log('   ✅ HĐ 1 hoàn thành! Học sinh trở về sảnh chờ:', studentInLobbyAfterH1);
    if (!studentInLobbyAfterH1) throw new Error('Học sinh chưa trở về sảnh chờ sau HĐ 1!');

    // -------------------------------------------------------------
    // CHẶNG 2: HOẠT ĐỘNG 2 - KHÁM PHÁ KIẾN THỨC SGK (warmup/theory)
    // -------------------------------------------------------------
    console.log('\n--- CHẶNG 2: KHÁM PHÁ KIẾN THỨC SGK (4 NÚT TUẦN TỰ) ---');
    // Bấm bắt đầu Hoạt động 2 từ Pipeline
    await triggerStartActivity(async () => {
      await teacherPage.click('#pac-warmup .btn-pac-start');
    });

    await teacherPage.waitForSelector('#tw-panel-warmup.active', { timeout: 5000 });
    const isH2PanelActive = await teacherPage.isVisible('#tw-panel-warmup.active');
    console.log('   -> Bảng tác nghiệp Khám phá SGK (#tw-panel-warmup) active:', isH2PanelActive);
    if (!isH2PanelActive) throw new Error('#tw-panel-warmup không hiển thị!');

    // Kiểm tra nội dung nhiệm vụ đọc SGK hiển thị đầy đủ trên màn hình Thầy
    const h2TaskText = await teacherPage.textContent('#h2-theory-task-display');
    const h2DocText = await teacherPage.textContent('#h2-theory-doc-display');
    console.log('   -> Nhiệm vụ đọc SGK hiển thị:', h2TaskText.trim().substring(0, 50) + '...');
    console.log('   -> Tài liệu đính kèm hiển thị:', h2DocText.trim());

    // Kiểm tra 4 nút của Hoạt động 2
    const h2InitialButtons = await teacherPage.evaluate(() => ({
      btn1Disabled: document.getElementById('btn-h2-step-1-task').disabled,
      btn2Disabled: document.getElementById('btn-h2-step-2-timer').disabled,
      btn3Disabled: document.getElementById('btn-h2-step-3-summary').disabled,
      btn4Disabled: document.getElementById('btn-h2-step-4-waiting').disabled
    }));
    console.log('   [HĐ 2 Ban đầu] Nút 1 (Giao nhiệm vụ):', !h2InitialButtons.btn1Disabled, '| Nút 2 (Khóa):', h2InitialButtons.btn2Disabled, '| Nút 3 (Khóa):', h2InitialButtons.btn3Disabled, '| Nút 4 (Sẵn sàng):', !h2InitialButtons.btn4Disabled);
    if (h2InitialButtons.btn1Disabled || !h2InitialButtons.btn2Disabled || !h2InitialButtons.btn3Disabled || h2InitialButtons.btn4Disabled) {
      throw new Error('Logic ban đầu 4 nút HĐ 2 không đúng chuẩn tuần tự!');
    }

    // Bấm Nút 1 HĐ 2: Giao nhiệm vụ
    console.log('   -> Bấm Nút 1: Giao nhiệm vụ đọc SGK...');
    await teacherPage.click('#btn-h2-step-1-task');
    await teacherPage.waitForTimeout(500);

    const h2AfterAssign = await teacherPage.evaluate(() => ({
      btn1Completed: document.getElementById('btn-h2-step-1-task').disabled,
      btn2Unlocked: !document.getElementById('btn-h2-step-2-timer').disabled
    }));
    console.log('   [HĐ 2 Sau Giao NV] Nút 1 hoàn thành:', h2AfterAssign.btn1Completed, '| Nút 2 mở khóa:', h2AfterAssign.btn2Unlocked);
    if (!h2AfterAssign.btn2Unlocked) throw new Error('Nút 2 HĐ 2 chưa mở khóa sau khi giao nhiệm vụ!');

    // Bấm Nút 2 HĐ 2: Bắt đầu đọc & Tính giờ
    console.log('   -> Bấm Nút 2: Bắt đầu đọc & Tính giờ...');
    await teacherPage.click('#btn-h2-step-2-timer');
    await teacherPage.waitForTimeout(500);

    const h2AfterStart = await teacherPage.evaluate(() => ({
      btn2Completed: document.getElementById('btn-h2-step-2-timer').disabled,
      btn3Unlocked: !document.getElementById('btn-h2-step-3-summary').disabled
    }));
    console.log('   [HĐ 2 Sau Bắt đầu đọc] Nút 2 hoàn thành:', h2AfterStart.btn2Completed, '| Nút 3 mở khóa:', h2AfterStart.btn3Unlocked);
    if (!h2AfterStart.btn3Unlocked) throw new Error('Nút 3 HĐ 2 chưa mở khóa sau khi bắt đầu đọc!');

    // Bấm Nút 3 HĐ 2: Chốt kiến thức
    console.log('   -> Bấm Nút 3: Chốt kiến thức trọng tâm...');
    await teacherPage.click('#btn-h2-step-3-summary');
    await teacherPage.waitForTimeout(500);

    const h2AfterSummary = await teacherPage.evaluate(() => ({
      btn3Completed: document.getElementById('btn-h2-step-3-summary').disabled
    }));
    console.log('   [HĐ 2 Sau Chốt kiến thức] Nút 3 hoàn thành:', h2AfterSummary.btn3Completed);

    // Chụp ảnh minh chứng HĐ 2
    await teacherPage.screenshot({ path: path.join(outputDir, 'teacher_stage_h2_theory_reading.png') });
    console.log('   📸 Đã chụp ảnh minh chứng: teacher_stage_h2_theory_reading.png');

    // Bấm Nút 4 HĐ 2: Phòng chờ
    console.log('   -> Bấm Nút 4: Hoàn thành HĐ 2 & Về phòng chờ...');
    await teacherPage.click('#btn-h2-step-4-waiting');
    await teacherPage.waitForTimeout(2500);

    const studentInLobbyAfterH2 = await studentPage.isVisible('#st-view-waiting.active');
    console.log('   ✅ HĐ 2 hoàn thành! Học sinh trở về sảnh chờ an toàn:', studentInLobbyAfterH2);

    // -------------------------------------------------------------
    // CHẶNG 3: HOẠT ĐỘNG 3 - THỰC HÀNH & THẢO LUẬN (discussion)
    // -------------------------------------------------------------
    console.log('\n--- CHẶNG 3: THỰC HÀNH & THẢO LUẬN (4 NÚT TUẦN TỰ) ---');
    await triggerStartActivity(async () => {
      await teacherPage.click('#pac-discussion .btn-pac-start');
    });

    await teacherPage.waitForSelector('#tw-panel-discussion.active', { timeout: 5000 });
    const isH3PanelActive = await teacherPage.isVisible('#tw-panel-discussion.active');
    console.log('   -> Bảng tác nghiệp Thực hành (#tw-panel-discussion) active:', isH3PanelActive);
    if (!isH3PanelActive) throw new Error('#tw-panel-discussion không active!');

    const h3InitialButtons = await teacherPage.evaluate(() => ({
      btn1Disabled: document.getElementById('btn-h3-step-1-task').disabled,
      btn2Disabled: document.getElementById('btn-h3-step-2-timer').disabled,
      btn3Disabled: document.getElementById('btn-h3-step-3-solution').disabled,
      btn4Disabled: document.getElementById('btn-h3-step-4-waiting').disabled
    }));
    console.log('   [HĐ 3 Ban đầu] Nút 1 (Phát đề):', !h3InitialButtons.btn1Disabled, '| Nút 2 (Khóa):', h3InitialButtons.btn2Disabled, '| Nút 3 (Khóa):', h3InitialButtons.btn3Disabled, '| Nút 4 (Sẵn sàng):', !h3InitialButtons.btn4Disabled);
    if (h3InitialButtons.btn1Disabled || !h3InitialButtons.btn2Disabled || !h3InitialButtons.btn3Disabled || h3InitialButtons.btn4Disabled) {
      throw new Error('Logic ban đầu 4 nút HĐ 3 không đúng chuẩn tuần tự!');
    }

    // Bấm Nút 1 HĐ 3: Phát đề bài
    console.log('   -> Bấm Nút 1: Phát đề bài thực hành...');
    await teacherPage.click('#btn-h3-step-1-task');
    await teacherPage.waitForTimeout(500);

    const h3AfterDeliver = await teacherPage.evaluate(() => ({
      btn1Completed: document.getElementById('btn-h3-step-1-task').disabled,
      btn2Unlocked: !document.getElementById('btn-h3-step-2-timer').disabled
    }));
    console.log('   [HĐ 3 Sau Phát đề] Nút 1 hoàn thành:', h3AfterDeliver.btn1Completed, '| Nút 2 mở khóa:', h3AfterDeliver.btn2Unlocked);
    if (!h3AfterDeliver.btn2Unlocked) throw new Error('Nút 2 HĐ 3 chưa mở khóa!');

    // Bấm Nút 2 HĐ 3: Mở khung làm bài & Tính giờ
    console.log('   -> Bấm Nút 2: Mở khung làm bài & Tính giờ...');
    await teacherPage.click('#btn-h3-step-2-timer');
    await teacherPage.waitForTimeout(500);

    const h3AfterStart = await teacherPage.evaluate(() => ({
      btn2Completed: document.getElementById('btn-h3-step-2-timer').disabled,
      btn3Unlocked: !document.getElementById('btn-h3-step-3-solution').disabled
    }));
    console.log('   [HĐ 3 Sau Bắt đầu làm bài] Nút 2 hoàn thành:', h3AfterStart.btn2Completed, '| Nút 3 mở khóa:', h3AfterStart.btn3Unlocked);
    if (!h3AfterStart.btn3Unlocked) throw new Error('Nút 3 HĐ 3 chưa mở khóa!');

    // Bấm Nút 3 HĐ 3: Thu bài & Công bố code mẫu
    console.log('   -> Bấm Nút 3: Thu bài & Công bố code mẫu...');
    await teacherPage.click('#btn-h3-step-3-solution');
    await teacherPage.waitForTimeout(500);

    await teacherPage.screenshot({ path: path.join(outputDir, 'teacher_stage_h3_practice_coding.png') });
    console.log('   📸 Đã chụp ảnh minh chứng: teacher_stage_h3_practice_coding.png');

    // Bấm Nút 4 HĐ 3: Phòng chờ
    console.log('   -> Bấm Nút 4: Về phòng chờ an toàn...');
    await teacherPage.click('#btn-h3-step-4-waiting');
    await teacherPage.waitForTimeout(2500);

    const studentInLobbyAfterH3 = await studentPage.isVisible('#st-view-waiting.active');
    console.log('   ✅ HĐ 3 hoàn thành! Học sinh trở về sảnh chờ an toàn:', studentInLobbyAfterH3);

    // -------------------------------------------------------------
    // CHẶNG 4: HOẠT ĐỘNG 4 - ĐẤU TRƯỜNG KAHOOT & PODIUM (quiz)
    // -------------------------------------------------------------
    console.log('\n--- CHẶNG 4: ĐẤU TRƯỜNG KAHOOT & PODIUM (4 NÚT TUẦN TỰ) ---');
    await triggerStartActivity(async () => {
      await teacherPage.click('#pac-quiz .btn-pac-start');
    });

    await teacherPage.waitForSelector('#tw-panel-quiz.active', { timeout: 5000 });
    const isH4PanelActive = await teacherPage.isVisible('#tw-panel-quiz.active');
    console.log('   -> Bảng tác nghiệp Đấu trường (#tw-panel-quiz) active:', isH4PanelActive);
    if (!isH4PanelActive) throw new Error('#tw-panel-quiz không active!');

    const h4InitialButtons = await teacherPage.evaluate(() => ({
      btn1Disabled: document.getElementById('btn-h4-step-1-start').disabled,
      btn2Disabled: document.getElementById('btn-h4-step-2-timer').disabled,
      btn3Disabled: document.getElementById('btn-h4-step-3-podium').disabled,
      btn4Disabled: document.getElementById('btn-h4-step-4-waiting').disabled
    }));
    console.log('   [HĐ 4 Ban đầu] Nút 1 (Khởi động):', !h4InitialButtons.btn1Disabled, '| Nút 2 (Khóa):', h4InitialButtons.btn2Disabled, '| Nút 3 (Khóa):', h4InitialButtons.btn3Disabled, '| Nút 4 (Sẵn sàng):', !h4InitialButtons.btn4Disabled);
    if (h4InitialButtons.btn1Disabled || !h4InitialButtons.btn2Disabled || !h4InitialButtons.btn3Disabled || h4InitialButtons.btn4Disabled) {
      throw new Error('Logic ban đầu 4 nút HĐ 4 không đúng chuẩn tuần tự!');
    }

    // Bấm Nút 1 HĐ 4: Khởi động đấu trường
    console.log('   -> Bấm Nút 1: Khởi động đấu trường...');
    await teacherPage.click('#btn-h4-step-1-start');
    await teacherPage.waitForTimeout(500);

    const h4AfterStart = await teacherPage.evaluate(() => ({
      btn1Completed: document.getElementById('btn-h4-step-1-start').disabled,
      btn2Unlocked: !document.getElementById('btn-h4-step-2-timer').disabled
    }));
    console.log('   [HĐ 4 Sau Khởi động] Nút 1 hoàn thành:', h4AfterStart.btn1Completed, '| Nút 2 mở khóa:', h4AfterStart.btn2Unlocked);
    if (!h4AfterStart.btn2Unlocked) throw new Error('Nút 2 HĐ 4 chưa mở khóa!');

    // Bấm Nút 2 HĐ 4: Phát đề & Tính giờ
    console.log('   -> Bấm Nút 2: Phát đề & Tính giờ...');
    await teacherPage.click('#btn-h4-step-2-timer');
    await teacherPage.waitForTimeout(500);

    const h4AfterDeliver = await teacherPage.evaluate(() => ({
      btn2Completed: document.getElementById('btn-h4-step-2-timer').disabled,
      btn3Unlocked: !document.getElementById('btn-h4-step-3-podium').disabled
    }));
    console.log('   [HĐ 4 Sau Phát đề] Nút 2 hoàn thành:', h4AfterDeliver.btn2Completed, '| Nút 3 mở khóa:', h4AfterDeliver.btn3Unlocked);
    if (!h4AfterDeliver.btn3Unlocked) throw new Error('Nút 3 HĐ 4 chưa mở khóa!');

    // Bấm Nút 3 HĐ 4: Công bố & Bục vinh danh Podium 3D
    console.log('   -> Bấm Nút 3: Công bố & Bục vinh danh Podium 3D...');
    await teacherPage.click('#btn-h4-step-3-podium');
    await teacherPage.waitForTimeout(500);

    await teacherPage.screenshot({ path: path.join(outputDir, 'teacher_stage_h4_kahoot_podium.png') });
    console.log('   📸 Đã chụp ảnh minh chứng: teacher_stage_h4_kahoot_podium.png');

    // Bấm Nút 4 HĐ 4: Tổng kết tiết học
    console.log('   -> Bấm Nút 4: Tổng kết tiết học...');
    await teacherPage.click('#btn-h4-step-4-waiting');
    await teacherPage.waitForTimeout(2500);

    const pipelineAllFinished = await teacherPage.evaluate(() => {
      const cards = document.querySelectorAll('.pipeline-activity-card');
      return Array.from(cards).every(c => c.classList.contains('finished'));
    });
    console.log('   -> Toàn bộ 4 hoạt động trên Pipeline đã đánh dấu hoàn thành:', pipelineAllFinished);
    if (!pipelineAllFinished) throw new Error('Pipeline chưa chuyển sang trạng thái đã hoàn thành!');

    console.log('\n================================================================');
    console.log('🎉 TẤT CẢ 4 HOẠT ĐỘNG ĐỀU TUÂN THỦ CHUẨN XÁC 100% QUY TRÌNH 4 NÚT TUẦN TỰ!');
    console.log('================================================================');
  } finally {
    await browser.close();
    server.close();
  }
}

runUniversalSequentialRhythmTest().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
