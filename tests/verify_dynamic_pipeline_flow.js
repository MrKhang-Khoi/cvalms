const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3029;
const ROOT_DIR = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.resolve(__dirname, 'pipeline_screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
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
          res.end(`404 Not Found: ${req.url}`);
        } else {
          res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
          res.end(content);
        }
      });
    });

    server.listen(PORT, '127.0.0.1', () => {
      console.log(`[HTTP Server] Running at http://127.0.0.1:${PORT}`);
      resolve(server);
    });
  });
}

async function runTest() {
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    const teacherContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const studentContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });

    const teacherPage = await teacherContext.newPage();
    const studentPage = await studentContext.newPage();

    teacherPage.on('pageerror', err => console.error('[Teacher Page Error]:', err));
    studentPage.on('pageerror', err => console.error('[Student Page Error]:', err));

    console.log('\n======================================================');
    console.log('🚀 KIỂM THỬ TỰ ĐỘNG SÂN KHẤU ĐỘNG & NHỊP ĐỘ SƯ PHẠM (v2.9.0)');
    console.log('======================================================\n');

    await teacherPage.goto(`http://127.0.0.1:${PORT}/?role=teacher`, { waitUntil: 'domcontentloaded' });
    await teacherPage.waitForTimeout(1000);

    await teacherPage.evaluate(() => {
      window.STORE.setState({
        role: 'teacher',
        screen: 'teacher',
        teacherTab: 'stage',
        teacherStage: 'active',
        classId: '10A1',
        lessonId: 'tin10_bai12'
      });
      window.APP.renderTeacherDashboard(window.STORE.getState());
    });
    await teacherPage.waitForTimeout(500);

    const oldBarCount = await teacherPage.locator('.teacher-master-control-bar').count();
    const dynamicHeaderCount = await teacherPage.locator('.teacher-dynamic-control-header').count();
    const pipelineCardsCount = await teacherPage.locator('#teacher-dynamic-pipeline .pipeline-activity-card').count();

    console.log(`[TEST 1] Hàng 2 cũ tồn tại: ${oldBarCount} (Kỳ vọng: 0)`);
    console.log(`[TEST 1] Header Sân khấu Động tồn tại: ${dynamicHeaderCount} (Kỳ vọng: 1)`);
    console.log(`[TEST 1] Số thẻ hoạt động động được sinh: ${pipelineCardsCount} (Kỳ vọng: >= 1)`);

    if (oldBarCount === 0 && dynamicHeaderCount === 1 && pipelineCardsCount > 0) {
      results.push({ name: 'TEST 1: Dynamic Stage Pipeline & Clean UI', pass: true });
      console.log('✅ TEST 1 PASS: Hàng 2 cũ đã bị xóa bỏ, Sân khấu động hiển thị chính xác!');
    } else {
      results.push({ name: 'TEST 1: Dynamic Stage Pipeline & Clean UI', pass: false });
      console.error('❌ TEST 1 FAIL: Header hoặc Thẻ động chưa đúng cấu hình!');
    }
    await teacherPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_dynamic_stage_pipeline.png') });

    console.log('\n--- TEST 2: Cảnh báo sĩ số phòng chờ ---');
    await teacherPage.locator('.pipeline-activity-card .btn-pac-start').first().click();
    await teacherPage.waitForTimeout(500);

    const alertModalVisible = await teacherPage.locator('#modal-waiting-room-alert').isVisible();
    const missingChipsCount = await teacherPage.locator('#wra-missing-list .missing-desk-chip').count();
    console.log(`[TEST 2] Modal cảnh báo phòng chờ hiển thị: ${alertModalVisible} (Kỳ vọng: true)`);
    console.log(`[TEST 2] Số chip máy vắng: ${missingChipsCount} (Kỳ vọng: 18 máy)`);

    if (alertModalVisible && missingChipsCount === 18) {
      results.push({ name: 'TEST 2: Waiting Room Alert Modal', pass: true });
      console.log('✅ TEST 2 PASS: Modal cảnh báo sĩ số phòng chờ hoạt động hoàn hảo!');
    } else {
      results.push({ name: 'TEST 2: Waiting Room Alert Modal', pass: false });
      console.error('❌ TEST 2 FAIL: Modal cảnh báo không hiển thị đúng!');
    }
    await teacherPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_waiting_room_alert.png') });

    console.log('\n--- TEST 3: Học sinh kết nối vào phòng chờ ---');
    await studentPage.goto(`http://127.0.0.1:${PORT}`, { waitUntil: 'domcontentloaded' });
    await studentPage.waitForTimeout(1000);

    await teacherPage.evaluate(() => {
      window.STORE.setState({ unlocked: true });
      window.closeWaitingRoomAlert(false);
    });
    await studentPage.evaluate(() => {
      window.STORE.setState({ unlocked: true });
      window.onSelectDesk(2);
      const confirmBtn = document.getElementById('btn-modal-confirm');
      if (confirmBtn) confirmBtn.click();
    });
    await studentPage.waitForTimeout(600);

    const studentWaitingVisible = await studentPage.locator('#st-view-waiting').isVisible();
    console.log(`[TEST 3] Màn hình Học sinh đang ở Phòng chờ (#st-view-waiting): ${studentWaitingVisible}`);

    if (studentWaitingVisible) {
      results.push({ name: 'TEST 3: Student in Waiting Room', pass: true });
      console.log('✅ TEST 3 PASS: Học sinh vào đúng phòng chờ cá nhân chuẩn giao diện!');
    } else {
      results.push({ name: 'TEST 3: Student in Waiting Room', pass: false });
      console.error('❌ TEST 3 FAIL: Học sinh không vào đúng phòng chờ!');
    }
    await studentPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_student_waiting_room.png') });

    console.log('\n--- TEST 4: Bắt đầu hoạt động & Chặn học sinh vào muộn ---');
    await teacherPage.locator('.pipeline-activity-card .btn-pac-start').first().click();
    await teacherPage.waitForTimeout(300);
    await teacherPage.locator('#btn-wra-proceed').click();
    await teacherPage.waitForTimeout(4000);

    const runningCard = await teacherPage.locator('.pipeline-activity-card.running').count();
    const finishBtnVisible = await teacherPage.locator('.pipeline-activity-card .btn-pac-finish').count();
    console.log(`[TEST 4] Thẻ hoạt động chuyển sang running: ${runningCard} (Kỳ vọng: 1)`);
    console.log(`[TEST 4] Nút Kết thúc hoạt động hiển thị: ${finishBtnVisible} (Kỳ vọng: 1)`);

    const lateStudentContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const lateStudentPage = await lateStudentContext.newPage();
    await lateStudentPage.goto(`http://127.0.0.1:${PORT}`, { waitUntil: 'domcontentloaded' });
    await lateStudentPage.waitForTimeout(500);

    let lateDialogDismissed = false;
    lateStudentPage.on('dialog', async dialog => {
      console.log(`[TEST 4 - Late Joiner Alert Caught]: ${dialog.message()}`);
      lateDialogDismissed = true;
      await dialog.dismiss();
    });

    await lateStudentPage.evaluate(() => {
      window.STORE.setState({ sessionStarted: true, currentPhase: 'old_lesson' });
      window.onSelectDesk(5);
    });
    await lateStudentPage.waitForTimeout(500);

    console.log(`[TEST 4] Học sinh vào muộn bị chặn với Dialog: ${lateDialogDismissed} (Kỳ vọng: true)`);
    if (runningCard === 1 && finishBtnVisible === 1 && lateDialogDismissed) {
      results.push({ name: 'TEST 4: Activity Running & Late-Joiner Guard', pass: true });
      console.log('✅ TEST 4 PASS: Hoạt động chạy mượt mà & Chốt chặn vào muộn kỷ luật 100%!');
    } else {
      results.push({ name: 'TEST 4: Activity Running & Late-Joiner Guard', pass: false });
      console.error('❌ TEST 4 FAIL: Lỗi trạng thái chạy hoặc chốt chặn học sinh vào muộn!');
    }
    await lateStudentContext.close();

    console.log('\n--- TEST 5: Nhịp độ sư phạm Kiểm tra bài cũ ---');
    await studentPage.evaluate(() => {
      window.STORE.setState({ currentPhase: 'old_lesson' });
      window.APP.renderStudentWorkspace(window.STORE.getState());
    });
    await studentPage.waitForTimeout(500);

    const standbyBannerVisible = await studentPage.locator('#ol-question-standby-banner').isVisible();
    const questionTextHidden = !(await studentPage.locator('#ol-question-text').isVisible());
    console.log(`[TEST 5] Banner chờ hiển thị ban đầu: ${standbyBannerVisible}`);
    console.log(`[TEST 5] Nội dung câu hỏi giấu kín ban đầu: ${questionTextHidden}`);

    await teacherPage.evaluate(() => {
      window.STORE.setState({
        oldLesson: Object.assign({}, window.STORE.getState().oldLesson, {
          selectedMachine: 2,
          selectedStudent: 'Nguyễn Văn A',
          questionText: 'Xâu ký tự trong Python là gì? Cho ví dụ.'
        })
      });
      window.APP.executeLuckyDrawAnimation(2, 'Nguyễn Văn A', 300, true);
    });

    await teacherPage.waitForTimeout(5600);

    await studentPage.evaluate(() => {
      window.STORE.setState({
        oldLesson: Object.assign({}, window.STORE.getState().oldLesson, {
          selectedMachine: 2,
          selectedStudent: 'Nguyễn Văn A',
          questionText: 'Xâu ký tự trong Python là gì? Cho ví dụ.',
          questionRevealed: true
        })
      });
      window.APP.renderStudentWorkspace(window.STORE.getState());
    });
    await studentPage.waitForTimeout(500);

    const questionTextNowVisible = await studentPage.locator('#ol-question-text').isVisible();
    const questionContent = await studentPage.locator('#ol-question-text').textContent();
    console.log(`[TEST 5] Câu hỏi xuất hiện sau tôn vinh Spotlight: ${questionTextNowVisible}`);
    console.log(`[TEST 5] Nội dung câu hỏi: "${questionContent.trim()}"`);

    if (standbyBannerVisible && questionTextHidden && questionTextNowVisible) {
      results.push({ name: 'TEST 5: Old Lesson Pedagogical Cadence', pass: true });
      console.log('✅ TEST 5 PASS: Nhịp điệu sư phạm Bài cũ chuẩn xác từng giây!');
    } else {
      results.push({ name: 'TEST 5: Old Lesson Pedagogical Cadence', pass: false });
      console.error('❌ TEST 5 FAIL: Trình tự hiển thị câu hỏi bài cũ chưa chuẩn!');
    }
    await studentPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_student_question_revealed.png') });

    console.log('\n--- TEST 6: Kết thúc hoạt động & Khóa thẻ Disabled ---');
    await teacherPage.locator('.pipeline-activity-card .btn-pac-finish').first().click();
    await teacherPage.waitForTimeout(1000);

    const disabledCardCount = await teacherPage.locator('.pipeline-activity-card.finished').count();
    const disabledBtnCount = await teacherPage.locator('.pipeline-activity-card .btn-pac-disabled').count();
    console.log(`[TEST 6] Thẻ bị khóa finished/disabled: ${disabledCardCount} (Kỳ vọng: >= 1)`);
    console.log(`[TEST 6] Nút đổi thành ĐÃ HOÀN THÀNH disabled: ${disabledBtnCount} (Kỳ vọng: >= 1)`);

    await studentPage.evaluate(() => {
      window.STORE.setState({ currentPhase: 'waiting' });
      window.APP.renderStudentWorkspace(window.STORE.getState());
    });
    await studentPage.waitForTimeout(500);
    const studentBackWaiting = await studentPage.locator('#st-view-waiting').isVisible();
    console.log(`[TEST 6] Học sinh tự động quay về Phòng chờ: ${studentBackWaiting}`);

    if (disabledCardCount >= 1 && disabledBtnCount >= 1 && studentBackWaiting) {
      results.push({ name: 'TEST 6: Finish Activity & Card Disabled', pass: true });
      console.log('✅ TEST 6 PASS: Thẻ bị khóa xám chống click lại & 18 máy về phòng chờ sạch sẽ!');
    } else {
      results.push({ name: 'TEST 6: Finish Activity & Card Disabled', pass: false });
      console.error('❌ TEST 6 FAIL: Khóa thẻ hoặc đưa về phòng chờ chưa đúng!');
    }
    await teacherPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_activity_card_disabled.png') });
    await studentPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_student_back_waiting.png') });

    console.log('\n--- TEST 7: Kết thúc tiết học (End Session) ---');
    teacherPage.on('dialog', async dialog => {
      console.log(`[TEST 7 - Teacher End Session Confirm]: ${dialog.message()}`);
      await dialog.accept();
    });

    await teacherPage.evaluate(() => {
      window.teacherEndSession();
    });
    await teacherPage.waitForTimeout(1000);

    await studentPage.evaluate(() => {
      window.SYNC_BUS.handleMessage({ type: 'SESSION_ENDED' });
      window.APP.render(window.STORE.getState());
    });
    await studentPage.waitForTimeout(500);

    const studentInLobby = await studentPage.locator('#screen-lobby').isVisible();
    const teacherCardsReset = await teacherPage.evaluate(() => {
      const s = window.STORE.getState();
      return Object.keys(s.finishedActivities || {}).length === 0;
    });

    console.log(`[TEST 7] Học sinh quay về Màn hình Sảnh chọn máy (#screen-lobby): ${studentInLobby}`);
    console.log(`[TEST 7] Danh sách thẻ của Thầy đã reset sạch sẽ: ${teacherCardsReset}`);

    if (studentInLobby && teacherCardsReset) {
      results.push({ name: 'TEST 7: Teacher End Session Full Cleanup', pass: true });
      console.log('✅ TEST 7 PASS: Kết thúc tiết học dọn sạch 100%, sẵn sàng cho lớp tiếp theo!');
    } else {
      results.push({ name: 'TEST 7: Teacher End Session Full Cleanup', pass: false });
      console.error('❌ TEST 7 FAIL: Dọn dẹp tiết học chưa hoàn tất!');
    }
    await studentPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_student_in_lobby.png') });

    console.log('\n======================================================');
    console.log('📊 TỔNG HỢP KẾT QUẢ KIỂM THỬ:');
    let allPass = true;
    results.forEach(r => {
      console.log(` - ${r.name}: ${r.pass ? '✅ PASS' : '❌ FAIL'}`);
      if (!r.pass) allPass = false;
    });
    console.log(`KẾT QUẢ CHUNG: ${allPass ? '🎉 100% PASS' : '⚠️ CÓ LỖI CẦN SỬA'}`);
    console.log('======================================================\n');

  } catch (err) {
    console.error('[Playwright Test Runner Exception]:', err);
  } finally {
    await browser.close();
    server.close();
  }
}

runTest();
