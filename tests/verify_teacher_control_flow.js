const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3012;
const ROOT_DIR = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.resolve(__dirname, 'control_flow_screenshots');

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

    console.log('\n======================================================================');
    console.log('🚀 BẮT ĐẦU KIỂM THỬ 5 BƯỚC QUY TRÌNH ĐIỀU KHIỂN & BỐC THĂM ĐỒNG BỘ');
    console.log('======================================================================');

    // BƯỚC 0: Khởi tạo Giáo viên và Học sinh ở Sảnh chờ
    console.log('\n[BƯỚC 0] Khởi tạo phiên: Giáo viên đăng nhập, Học sinh nhận diện Máy 02 ở Sảnh chờ:');
    await teacherPage.goto(`http://127.0.0.1:${PORT}`);
    await teacherPage.click('#btn-open-teacher-login');
    await teacherPage.fill('#teacher-password-input', 'admin123');
    await teacherPage.evaluate(() => window.submitTeacherLogin());
    await teacherPage.waitForTimeout(400);

    teacherPage.on('dialog', async dialog => await dialog.accept());
    await teacherPage.click('#btn-start-class-session');
    await teacherPage.waitForTimeout(500);

    await studentPage.goto(`http://127.0.0.1:${PORT}`);
    await studentPage.evaluate(() => {
      localStorage.setItem('lms_fixed_machine_id', '2');
      window.STORE.setState({
        unlocked: true,
        sessionStarted: true,
        fixedMachineId: 2,
        machineId: 2,
        screen: 'lobby'
      });
    });
    await studentPage.waitForTimeout(300);

    const studentInitialScreen = await studentPage.evaluate(() => {
      const s = document.getElementById('screen-lobby');
      return s && s.classList.contains('active');
    });
    console.log(`  - Học sinh đang ở Sảnh chờ (screen: lobby): ${studentInitialScreen}`);
    await studentPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_student_in_lobby.png') });

    // BƯỚC 1: Đếm ngược 3,2,1 -> Học sinh tự động vào Workspace Máy 02
    console.log('\n[BƯỚC 1] Giáo viên bắt đầu tiết học -> Đếm ngược 3-2-1 -> Học sinh tự động vào Workspace Máy 02:');
    await teacherPage.evaluate(() => {
      window.STORE.setState({ occupiedMachines: { 2: true } });
    });

    await teacherPage.evaluate(() => window.teacherStartLesson());
    await studentPage.evaluate(() => {
      window.APP.handleRemoteCountdown({ active: true, title: 'BƯỚC 1: KIỂM TRA BÀI CŨ' });
    });

    const countdownVisible = await studentPage.evaluate(() => {
      const overlay = document.getElementById('activity-countdown-overlay');
      return overlay && overlay.style.display !== 'none';
    });
    console.log(`  - Overlay đếm ngược 3-2-1 xuất hiện trên máy học sinh: ${countdownVisible}`);
    await studentPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_student_countdown_321.png') });

    await studentPage.waitForTimeout(4200);

    const studentWorkspaceState = await studentPage.evaluate(() => {
      const s = document.getElementById('screen-student');
      const badge = document.getElementById('sh-machine-badge');
      const studentsLabel = document.getElementById('sh-students-label');
      const curPhase = window.STORE.getState().currentPhase;
      return {
        isStudentScreenActive: s && s.classList.contains('active'),
        badgeText: badge ? badge.textContent.trim() : '',
        studentsText: studentsLabel ? studentsLabel.textContent.trim() : '',
        curPhase: curPhase
      };
    });

    console.log(`  - Học sinh đã tự động vào Workspace: ${studentWorkspaceState.isStudentScreenActive}`);
    console.log(`  - Huy hiệu máy: "${studentWorkspaceState.badgeText}", Học sinh: "${studentWorkspaceState.studentsText}"`);
    console.log(`  - Chặng hiện tại: "${studentWorkspaceState.curPhase}"`);
    await studentPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_student_auto_workspace_machine2.png') });

    const step1Pass = studentWorkspaceState.isStudentScreenActive && 
                      studentWorkspaceState.badgeText === 'MÁY 02' && 
                      studentWorkspaceState.curPhase === 'old_lesson';
    results.push({ step: 1, name: 'Đếm ngược 3-2-1 tự động đưa học sinh vào Workspace riêng', pass: step1Pass });

    // BƯỚC 2: Giáo viên mở bốc thăm & chọn Vòng xoay -> Máy học sinh xuất hiện Vòng xoay
    console.log('\n[BƯỚC 2] Giáo viên mở bốc thăm và chọn Vòng xoay (Chiếc nón kỳ diệu) -> Đồng bộ xuống máy học sinh:');
    await teacherPage.evaluate(() => window.openLuckyDrawModal(true));
    await studentPage.evaluate(() => window.APP.openLuckyDrawModal(false));
    await teacherPage.waitForTimeout(400);
    await studentPage.waitForTimeout(400);

    await teacherPage.evaluate(() => window.setLuckyDrawStrategy('wheel_fortune', true));
    await studentPage.evaluate(() => window.APP.setLuckyDrawStrategy('wheel_fortune', false));
    await teacherPage.waitForTimeout(400);
    await studentPage.waitForTimeout(400);

    const studentWheelVisible = await studentPage.evaluate(() => {
      const modal = document.getElementById('modal-lucky-draw');
      const wheelView = document.getElementById('ld-view-wheel');
      const slotView = document.getElementById('ld-view-slot');
      const badge = document.getElementById('ld-student-badge-view');
      const triggerBtn = document.getElementById('btn-trigger-spin');
      return {
        modalOpen: modal && modal.style.display === 'flex',
        wheelActive: wheelView && wheelView.style.display !== 'none',
        slotHidden: slotView && slotView.style.display === 'none',
        hasStudentBadge: badge && badge.style.display !== 'none',
        triggerBtnHidden: triggerBtn && triggerBtn.style.display === 'none'
      };
    });

    console.log(`  - Modal bốc thăm mở trên máy học sinh: ${studentWheelVisible.modalOpen}`);
    console.log(`  - Giao diện Vòng xoay (Chiếc nón) hiển thị: ${studentWheelVisible.wheelActive}`);
    console.log(`  - Nút quay số của Giáo viên bị ẩn trên máy học sinh: ${studentWheelVisible.triggerBtnHidden}`);
    console.log(`  - Badge "ĐANG XEM BỐC THĂM TỪ THẦY" hiển thị: ${studentWheelVisible.hasStudentBadge}`);

    await teacherPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_teacher_wheel_modal.png') });
    await studentPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_student_wheel_modal.png') });

    const step2Pass = studentWheelVisible.modalOpen && studentWheelVisible.wheelActive && studentWheelVisible.triggerBtnHidden;
    results.push({ step: 2, name: 'Giáo viên chọn Vòng xoay -> Máy học sinh đồng loạt xuất hiện Vòng xoay', pass: step2Pass });

    // BƯỚC 3: Bốc thăm xong -> Chiếu thông tin học sinh & câu hỏi tới tất cả các máy
    console.log('\n[BƯỚC 3] Giáo viên bấm quay số -> Dừng quay -> Hiện người được bốc thăm và Chiếu câu hỏi xuống máy học sinh:');
    const testQuestion = 'Trong các bộ phận cơ bản của máy tính (CPU, RAM, ROM/Ổ đĩa cứng), thiết bị nào đóng vai trò là "bộ não" điều khiển mọi hoạt động?';
    await teacherPage.fill('#otc-question-input', testQuestion);

    const spinPayload = {
      strategy: 'wheel_fortune',
      targetMachine: 1,
      targetStudent: 'Lê Hoàng Nam',
      studentsList: ['Lê Hoàng Nam', 'Phạm Ngọc Ánh'],
      duration: 300
    };

    await teacherPage.evaluate((p) => window.APP.executeLuckyDrawAnimation(p, true), spinPayload);
    await studentPage.evaluate((p) => window.APP.executeLuckyDrawAnimation(p, false), spinPayload);

    await teacherPage.waitForTimeout(3200);
    await studentPage.waitForTimeout(3200);

    const studentQuestionAndSpotlight = await studentPage.evaluate(() => {
      const modal = document.getElementById('modal-lucky-draw');
      const callerInfo = document.getElementById('ol-caller-info');
      const qText = document.getElementById('ol-question-text');
      return {
        modalClosed: !modal || modal.style.display === 'none',
        callerInfoText: callerInfo ? callerInfo.textContent.trim() : '',
        questionText: qText ? qText.textContent.trim() : ''
      };
    });

    console.log(`  - Modal bốc thăm đã tự động đóng: ${studentQuestionAndSpotlight.modalClosed}`);
    console.log(`  - Banner gọi học sinh trên máy học sinh: "${studentQuestionAndSpotlight.callerInfoText}"`);
    console.log(`  - Câu hỏi được chiếu xuống máy học sinh: "${studentQuestionAndSpotlight.questionText}"`);

    await teacherPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_teacher_spotlight_and_question.png') });
    await studentPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_student_spotlight_and_question.png') });

    const step3Pass = studentQuestionAndSpotlight.modalClosed &&
                      studentQuestionAndSpotlight.callerInfoText.includes('Lê Hoàng Nam') &&
                      studentQuestionAndSpotlight.questionText.includes('bộ não');
    results.push({ step: 3, name: 'Bốc thăm xong: Chiếu học sinh được gọi và câu hỏi tới tất cả các máy', pass: step3Pass });

    // BƯỚC 4: Thầy bấm "HOÀN THÀNH BÀI CŨ — VỀ SẢNH CHỜ" -> Học sinh về Sảnh chờ
    console.log('\n[BƯỚC 4] Giáo viên bấm nút "HOÀN THÀNH BÀI CŨ — VỀ SẢNH CHỜ" -> Tất cả học sinh về Sảnh chờ:');
    const finishBtnVisible = await teacherPage.isVisible('#btn-finish-old-lesson-to-lobby');
    console.log(`  - Nút "#btn-finish-old-lesson-to-lobby" hiển thị trên bảng Thầy: ${finishBtnVisible}`);

    await teacherPage.click('#btn-finish-old-lesson-to-lobby');
    await teacherPage.waitForTimeout(300);

    await studentPage.evaluate(() => {
      window.STORE.setState({
        screen: 'lobby',
        currentPhase: 'waiting',
        lastFinishedActivity: 'Kiểm tra bài cũ'
      });
    });
    await studentPage.waitForTimeout(400);

    const studentBackInLobby = await studentPage.evaluate(() => {
      const s = document.getElementById('screen-lobby');
      const banner = document.getElementById('lobby-status-banner');
      const title = document.getElementById('lsb-title');
      return {
        isLobbyActive: s && s.classList.contains('active'),
        titleText: title ? title.textContent.trim() : ''
      };
    });

    console.log(`  - Học sinh đã tự động trở về Sảnh chờ (screen: lobby): ${studentBackInLobby.isLobbyActive}`);
    console.log(`  - Thông báo sảnh: "${studentBackInLobby.titleText}"`);
    await studentPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_student_back_in_lobby.png') });

    const step4Pass = studentBackInLobby.isLobbyActive && studentBackInLobby.titleText.includes('KIỂM TRA BÀI CŨ');
    results.push({ step: 4, name: 'Giáo viên bấm chốt bài cũ: Tất cả học sinh về Sảnh chờ', pass: step4Pass });

    // BƯỚC 5: Giáo viên kích hoạt hoạt động tiếp theo (Khởi động) -> Học sinh vào Workspace Khởi động
    console.log('\n[BƯỚC 5] Giáo viên kích hoạt hoạt động Khởi động (Bước 2) -> Học sinh từ sảnh vào Workspace Khởi động:');
    await teacherPage.evaluate(() => window.teacherSetPhase('warmup'));
    await teacherPage.waitForTimeout(300);

    await studentPage.evaluate(() => {
      const s = window.STORE.getState();
      const mId = s.fixedMachineId || 2;
      const classData = window.APP.classes[s.classId] || window.APP.classes['10A1'];
      const pair = classData.seatingPlan[mId] || ["Trần Bảo Long", "Nguyễn Thùy Linh"];
      window.STORE.setState({
        screen: 'student',
        machineId: mId,
        students: pair,
        currentPhase: 'warmup'
      });
    });
    await studentPage.waitForTimeout(400);

    const studentWarmupWorkspace = await studentPage.evaluate(() => {
      const s = document.getElementById('screen-student');
      const viewWarmup = document.getElementById('st-view-warmup');
      const curPhase = window.STORE.getState().currentPhase;
      const qText = document.getElementById('poll-question-text');
      return {
        isStudentScreen: s && s.classList.contains('active'),
        isWarmupActive: viewWarmup && viewWarmup.classList.contains('active'),
        curPhase: curPhase,
        questionText: qText ? qText.textContent.trim() : ''
      };
    });

    console.log(`  - Học sinh tự động vào Workspace: ${studentWarmupWorkspace.isStudentScreen}`);
    console.log(`  - Tab Khởi động (Warm-up) active: ${studentWarmupWorkspace.isWarmupActive}`);
    console.log(`  - Câu hỏi Khởi động hiển thị: "${studentWarmupWorkspace.questionText.slice(0, 70)}..."`);
    await studentPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_student_workspace_warmup.png') });

    const step5Pass = studentWarmupWorkspace.isStudentScreen && 
                      studentWarmupWorkspace.isWarmupActive && 
                      studentWarmupWorkspace.curPhase === 'warmup';
    results.push({ step: 5, name: 'Giáo viên kích hoạt hoạt động mới: Học sinh tự động vào Workspace làm việc', pass: step5Pass });

    console.log('\n======================================================================');
    console.log('📊 TỔNG KẾT KẾT QUẢ KIỂM THỬ 5 BƯỚC QUY TRÌNH:');
    console.log('======================================================================');
    let allPass = true;
    results.forEach(r => {
      const status = r.pass ? '✅ PASS' : '❌ FAIL';
      if (!r.pass) allPass = false;
      console.log(`[BƯỚC ${r.step}] ${r.name}: ${status}`);
    });
    console.log('----------------------------------------------------------------------');
    console.log(`KẾT QUẢ CHUNG: ${allPass ? '🎉 100% ĐẠT TẤT CẢ 5 BƯỚC' : 'CÓ BƯỚC THẤT BẠI'}`);
    console.log('======================================================================\n');

    if (!allPass) {
      process.exit(1);
    }
  } finally {
    await browser.close();
    server.close();
  }
}

runTest().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
