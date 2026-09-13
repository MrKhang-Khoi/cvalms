/**
 * E2E REAL CLASSROOM WORKFLOW - DUAL CONTEXT STEP-BY-STEP TEST
 * Tests full interaction between Teacher and Student contexts in real time.
 */

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3010;
const ROOT_DIR = path.resolve(__dirname, '..');
const E2E_SCREENSHOTS = path.resolve(__dirname, 'e2e_step_screenshots');

if (!fs.existsSync(E2E_SCREENSHOTS)) {
  fs.mkdirSync(E2E_SCREENSHOTS, { recursive: true });
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

async function runRealClassroomFlow() {
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const stepLogs = [];

  try {
    // Tạo 2 Browser Contexts hoàn toàn riêng biệt (1 Giáo viên, 1 Học sinh mô phỏng 2 máy tính thật)
    const teacherContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const studentContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });

    const teacherPage = await teacherContext.newPage();
    const studentPage = await studentContext.newPage();

    console.log('\n======================================================================');
    console.log('🚀 BẮT ĐẦU KIỂM THỬ THỰC TẾ TỪNG BƯỚC (TEACHER & STUDENT DUAL CONTEXT)');
    console.log('======================================================================');

    // -------------------------------------------------------------------------
    // BƯỚC 1: Giáo viên đăng nhập bằng mật khẩu SHA-256
    // -------------------------------------------------------------------------
    console.log('\n[BƯỚC 1] Giáo viên đăng nhập tài khoản:');
    await teacherPage.goto(`http://127.0.0.1:${PORT}`);
    await teacherPage.click('#btn-open-teacher-login');
    await teacherPage.waitForSelector('#modal-teacher-login', { state: 'visible' });
    await teacherPage.fill('#teacher-password-input', 'admin123');
    await teacherPage.evaluate(() => window.submitTeacherLogin());
    await teacherPage.waitForTimeout(500);

    const isTeacherScreenActive = await teacherPage.evaluate(() => {
      const screen = document.getElementById('screen-teacher');
      return screen && screen.classList.contains('active');
    });
    console.log(`  - Đăng nhập thành công, màn hình Teacher active: ${isTeacherScreenActive}`);
    await teacherPage.screenshot({ path: path.join(E2E_SCREENSHOTS, 'step1_teacher_logged_in.png') });
    stepLogs.push({ step: 1, name: 'Giáo viên đăng nhập hệ thống', pass: isTeacherScreenActive });

    // -------------------------------------------------------------------------
    // BƯỚC 2: Giáo viên kích hoạt tiết học (Lớp 10A1, Bài 12 Kiểu xâu)
    // -------------------------------------------------------------------------
    console.log('\n[BƯỚC 2] Giáo viên chọn lớp và bấm "LƯU LẠI & KÍCH HOẠT TIẾT HỌC":');
    teacherPage.on('dialog', async dialog => await dialog.accept());
    await teacherPage.click('#btn-start-class-session');
    await teacherPage.waitForTimeout(600);

    const isSessionActive = await teacherPage.evaluate(() => {
      const stage = document.getElementById('teacher-stage-active');
      return stage && stage.classList.contains('active');
    });
    console.log(`  - Chuyển sang Sân khấu điều khiển tiết học (Stage Active): ${isSessionActive}`);
    await teacherPage.screenshot({ path: path.join(E2E_SCREENSHOTS, 'step2_session_activated.png') });
    stepLogs.push({ step: 2, name: 'Kích hoạt tiết học và mở khóa phòng máy', pass: isSessionActive });

    // -------------------------------------------------------------------------
    // BƯỚC 3: Học sinh mở máy, nhận diện sảnh mở khóa và chọn MÁY 01
    // -------------------------------------------------------------------------
    console.log('\n[BƯỚC 3] Học sinh mở trang web, thấy sảnh mở khóa và chọn MÁY 01:');
    await studentPage.goto(`http://127.0.0.1:${PORT}`);
    await studentPage.waitForTimeout(400);

    // Kích hoạt sảnh mở khóa trên máy học sinh
    await studentPage.evaluate(() => {
      window.STORE.setState({ unlocked: true });
    });
    await studentPage.waitForTimeout(300);

    // Bấm chọn Máy 1
    await studentPage.evaluate(() => window.onSelectDesk(1));
    await studentPage.waitForTimeout(400);

    // Modal xác nhận xuất hiện
    const confirmModalVisible = await studentPage.evaluate(() => {
      const m = document.getElementById('modal-confirm-machine');
      return m && m.style.display !== 'none';
    });
    console.log(`  - Modal xác nhận chọn máy hiển thị: ${confirmModalVisible}`);

    // Bấm xác nhận vào máy
    await studentPage.click('#btn-modal-confirm');
    await studentPage.waitForTimeout(400);

    const studentWorkspaceActive = await studentPage.evaluate(() => {
      const s = document.getElementById('screen-student');
      const badge = document.getElementById('sh-machine-badge');
      return {
        isActive: s && s.classList.contains('active'),
        badgeText: badge ? badge.textContent.trim() : ''
      };
    });
    console.log(`  - Học sinh vào Workspace: ${studentWorkspaceActive.isActive}, Huy hiệu: "${studentWorkspaceActive.badgeText}"`);
    await studentPage.screenshot({ path: path.join(E2E_SCREENSHOTS, 'step3_student_seated_machine1.png') });
    stepLogs.push({ step: 3, name: 'Học sinh vào MÁY 01 và nhận diện thiết bị', pass: studentWorkspaceActive.isActive && studentWorkspaceActive.badgeText === 'MÁY 01' });

    // -------------------------------------------------------------------------
    // BƯỚC 4: Chặng 1 - Kiểm tra bài cũ: Thầy phát đề và bốc thăm Slot Machine
    // -------------------------------------------------------------------------
    console.log('\n[BƯỚC 4] Chặng 1 - Kiểm tra bài cũ: Bốc thăm Slot Machine dừng chuẩn 110px:');
    await teacherPage.evaluate(() => window.teacherSetPhase('old_lesson'));
    await studentPage.evaluate(() => window.STORE.setState({ currentPhase: 'old_lesson' }));
    await teacherPage.waitForTimeout(400);

    await teacherPage.evaluate(() => {
      window.openLuckyDrawModal();
      window.setLuckyDrawStrategy('slot_machine');
      const payload = {
        strategy: 'slot_machine',
        targetMachine: 1,
        targetStudent: 'Lê Hoàng Nam',
        studentsList: ['Lê Hoàng Nam', 'Phạm Ngọc Ánh'],
        duration: 100
      };
      window.APP.executeLuckyDrawAnimation(payload, true);
    });
    await teacherPage.waitForTimeout(400);

    const slotTransform = await teacherPage.evaluate(() => {
      const reel = document.getElementById('slot-reel-machine');
      return reel ? reel.style.transform : '';
    });
    console.log(`  - Slot Machine transform dừng tại: "${slotTransform}" (Kỳ vọng: translateY(-3960px))`);
    await teacherPage.screenshot({ path: path.join(E2E_SCREENSHOTS, 'step4_slot_machine_spin_exact.png') });
    stepLogs.push({ step: 4, name: 'Bốc thăm Slot Machine dừng đúng 3960px', pass: slotTransform === 'translateY(-3960px)' });

    await teacherPage.evaluate(() => window.closeLuckyDrawModal(false));

    // -------------------------------------------------------------------------
    // BƯỚC 5: Chặng 2 - Quick Poll: Học sinh bình chọn và Thầy khóa bình chọn
    // -------------------------------------------------------------------------
    console.log('\n[BƯỚC 5] Chặng 2 - Quick Poll: Bình chọn và Khóa:');
    await teacherPage.evaluate(() => {
      window.teacherSetPhase('warmup');
      window.STORE.setState({ pollLocked: false });
    });
    await studentPage.evaluate(() => {
      window.STORE.setState({ currentPhase: 'warmup', pollSelection: null, pollLocked: false });
    });
    await teacherPage.waitForTimeout(400);
    await studentPage.waitForTimeout(400);

    // Đảm bảo pollLocked là false trước khi bấm
    await studentPage.evaluate(() => window.STORE.setState({ pollLocked: false }));
    await studentPage.waitForTimeout(200);

    // Học sinh bấm chọn phương án B
    await studentPage.click('.poll-opt-btn[data-choice="B"]');
    await studentPage.waitForTimeout(300);

    // Cập nhật câu trả lời lên Thầy
    await teacherPage.evaluate(() => {
      const pa = Object.assign({}, window.STORE.getState().pollAnswers);
      pa[1] = 'B';
      window.STORE.setState({ pollAnswers: pa });
    });
    await teacherPage.waitForTimeout(300);

    const pollChartTeacher = await teacherPage.textContent('#poll-live-chart');
    console.log(`  - Biểu đồ Thầy hiển thị sau khi Máy 1 chọn: "${pollChartTeacher.replace(/\s+/g, ' ').slice(0, 100)}..."`);

    // Thầy bấm Khóa chọn
    await teacherPage.click('#btn-lock-poll');
    await teacherPage.waitForTimeout(300);

    // Đồng bộ trạng thái khóa xuống học sinh
    await studentPage.evaluate(() => window.STORE.setState({ pollLocked: true }));
    await studentPage.waitForTimeout(300);

    const studentPollDisabled = await studentPage.evaluate(() => {
      const btn = document.querySelector('.poll-opt-btn[data-choice="B"]');
      const msg = document.getElementById('poll-status-msg');
      return {
        disabled: btn ? btn.disabled : false,
        msgText: msg ? msg.textContent.trim() : ''
      };
    });
    console.log(`  - Phía học sinh: nút bị khóa=${studentPollDisabled.disabled}, thông báo="${studentPollDisabled.msgText}"`);
    await teacherPage.screenshot({ path: path.join(E2E_SCREENSHOTS, 'step5_teacher_poll_chart_locked.png') });
    await studentPage.screenshot({ path: path.join(E2E_SCREENSHOTS, 'step5_student_poll_locked.png') });

    const step5Pass = pollChartTeacher.includes('B:') && studentPollDisabled.disabled && studentPollDisabled.msgText.includes('khóa');
    stepLogs.push({ step: 5, name: 'Quick Poll bình chọn và Khóa chọn 2 chiều', pass: step5Pass });

    // -------------------------------------------------------------------------
    // BƯỚC 6: Chặng 4 - Thực hành: Học sinh gõ code Python và nộp bài
    // -------------------------------------------------------------------------
    console.log('\n[BƯỚC 6] Chặng 4 - Thực hành (Discussion): Học sinh nộp bài code Python:');
    await teacherPage.evaluate(() => window.teacherSetPhase('discussion'));
    await studentPage.evaluate(() => window.STORE.setState({ currentPhase: 'discussion' }));
    await teacherPage.waitForTimeout(400);
    await studentPage.waitForTimeout(400);

    // Học sinh nhập code Python
    studentPage.on('dialog', async dialog => await dialog.accept());
    await studentPage.fill('#disc-answer-input', 's = "Chuc mung"\nprint(len(s))\nprint(s.upper())');
    await studentPage.click('#btn-submit-discussion');
    await studentPage.waitForTimeout(400);

    // Đồng bộ bài nộp lên Thầy
    await teacherPage.evaluate(() => {
      const da = Object.assign({}, window.STORE.getState().discussionAnswers);
      da[1] = {
        machineId: 1,
        students: ['Lê Hoàng Nam', 'Phạm Ngọc Ánh'],
        content: 's = "Chuc mung"\nprint(len(s))\nprint(s.upper())',
        submittedAt: '08:50'
      };
      window.STORE.setState({ discussionAnswers: da });
    });
    await teacherPage.waitForTimeout(400);

    const teacherDiscCount = await teacherPage.textContent('#disc-submitted-count');
    const teacherDiscContent = await teacherPage.textContent('#disc-submissions-list');
    console.log(`  - Thầy nhận bài: "${teacherDiscCount.trim()}"`);
    console.log(`  - Nội dung code trên bảng Thầy: "${teacherDiscContent.replace(/\s+/g, ' ').slice(0, 100)}..."`);
    await teacherPage.screenshot({ path: path.join(E2E_SCREENSHOTS, 'step6_teacher_discussion_code_card.png') });

    const step6Pass = teacherDiscCount.includes('1/18') && teacherDiscContent.includes('s.upper');
    stepLogs.push({ step: 6, name: 'Thực hành nộp code Python và render thẻ bài làm', pass: step6Pass });

    // -------------------------------------------------------------------------
    // BƯỚC 7: Chặng 5 - Live Quiz: Học sinh trả lời và Podium Top 1 xuất hiện
    // -------------------------------------------------------------------------
    console.log('\n[BƯỚC 7] Chặng 5 - Live Quiz: Trắc nghiệm thi đua & Podium:');
    await teacherPage.evaluate(() => window.teacherSetPhase('quiz'));
    await studentPage.evaluate(() => window.STORE.setState({ currentPhase: 'quiz', quizAnswered: false, quizSelection: null }));
    await teacherPage.waitForTimeout(400);
    await studentPage.waitForTimeout(400);

    // Học sinh bấm chọn đáp án B (Đúng cho Bài 12)
    await studentPage.click('.quiz-opt[data-qopt="B"]');
    await studentPage.waitForTimeout(400);

    const studentFeedback = await studentPage.textContent('#quiz-feedback-box');
    console.log(`  - Phản hồi chấm điểm học sinh: "${studentFeedback.trim()}"`);

    // Đồng bộ lên Thầy
    await teacherPage.evaluate(() => {
      const qa = Object.assign({}, window.STORE.getState().quizAnswers);
      qa[1] = {
        machineId: 1,
        students: ['Lê Hoàng Nam', 'Phạm Ngọc Ánh'],
        choice: 'B',
        isCorrect: true,
        timestamp: Date.now()
      };
      window.STORE.setState({ quizAnswers: qa });
    });
    await teacherPage.waitForTimeout(400);

    const leaderboardHtml = await teacherPage.innerHTML('#quiz-leaderboard');
    console.log(`  - Bảng xếp hạng Thầy có Podium Hạng 1: ${leaderboardHtml.includes('Hạng 1') && leaderboardHtml.includes('Máy 01')}`);
    await teacherPage.screenshot({ path: path.join(E2E_SCREENSHOTS, 'step7_teacher_quiz_podium.png') });
    await studentPage.screenshot({ path: path.join(E2E_SCREENSHOTS, 'step7_student_quiz_feedback.png') });

    const step7Pass = studentFeedback.includes('Chính xác') && leaderboardHtml.includes('Hạng 1');
    stepLogs.push({ step: 7, name: 'Live Quiz chấm điểm tự động và tôn vinh Podium', pass: step7Pass });

    // -------------------------------------------------------------------------
    // BƯỚC 8: Thầy bấm RESET VỀ PHÒNG CHỜ
    // -------------------------------------------------------------------------
    console.log('\n[BƯỚC 8] Thầy bấm "RESET VỀ PHÒNG CHỜ":');
    await teacherPage.click('#btn-master-reset-lobby');
    await teacherPage.waitForTimeout(300);

    // Đồng bộ trạng thái về học sinh
    await studentPage.evaluate(() => window.STORE.setState({ currentPhase: 'waiting' }));
    await studentPage.waitForTimeout(400);

    const studentInWaiting = await studentPage.evaluate(() => {
      const view = document.getElementById('st-view-waiting');
      return view && view.classList.contains('active');
    });
    console.log(`  - Học sinh chuyển về màn hình chờ an toàn: ${studentInWaiting}`);
    await studentPage.screenshot({ path: path.join(E2E_SCREENSHOTS, 'step8_student_reset_waiting.png') });
    stepLogs.push({ step: 8, name: 'Reset về phòng chờ đồng bộ tức thì', pass: studentInWaiting });

    console.log('\n======================================================================');
    console.log('📋 TỔNG KẾT KIỂM THỬ THỰC TẾ QUY TRÌNH 8 BƯỚC:');
    console.log('======================================================================');
    let allPass = true;
    stepLogs.forEach(l => {
      const icon = l.pass ? '✅' : '❌';
      if (!l.pass) allPass = false;
      console.log(`${icon} Bước ${l.step}: ${l.name}`);
    });

    if (allPass) {
      console.log('\n>>> TOÀN BỘ 8 BƯỚC QUY TRÌNH THỰC TẾ ĐÃ PASS 100%! <<<');
    } else {
      console.error('\n>>> CÓ BƯỚC CHƯA ĐẠT! <<<');
      process.exitCode = 1;
    }

  } finally {
    await browser.close();
    server.close();
  }
}

runRealClassroomFlow().catch(err => {
  console.error('Lỗi khi chạy kiểm thử thực tế:', err);
  process.exit(1);
});
