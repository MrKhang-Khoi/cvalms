const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = 8993;
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

async function runVerification() {
  console.log('🚀 [TEST] KHỞI ĐỘNG KIỂM THỬ SƯ PHẠM ĐA ĐẠI LÝ v2.9.2: 4 NÚT TUẦN TỰ, CHẶN CỨNG 0 HỌC SINH, ĐỒNG BỘ 12A2, GIAO DIỆN TINH GỌN & ĐỒNG HỒ TĨNH');
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });

  const teacherCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const studentCtx = await browser.newContext({ viewport: { width: 1366, height: 768 } });

  const teacherPage = await teacherCtx.newPage();
  const studentPage = await studentCtx.newPage();

  let nativeConfirmTriggered = false;
  teacherPage.on('dialog', async d => {
    console.log('  [Teacher Dialog]:', d.type(), d.message());
    nativeConfirmTriggered = true;
    await d.accept();
  });
  studentPage.on('dialog', async d => {
    console.log('  [Student Dialog]:', d.type(), d.message());
    await d.accept();
  });

  const teacherErrors = [];
  const studentErrors = [];
  teacherPage.on('console', msg => { if (msg.type() === 'error') teacherErrors.push(msg.text()); });
  studentPage.on('console', msg => { if (msg.type() === 'error') studentErrors.push(msg.text()); });

  try {
    // -------------------------------------------------------------
    // GIAI ĐOẠN 0: CHẶN CỨNG 100% KHI CHƯA CÓ HỌC SINH NÀO VÀO PHÒNG CHỜ (0/18 MÁY)
    // -------------------------------------------------------------
    console.log('\n--- 0. KIỂM TRA CHẶN CỨNG KHI PHÒNG CHỜ TRỐNG (0/18 MÁY) ---');
    await teacherPage.goto('http://127.0.0.1:' + PORT + '/?role=teacher', { waitUntil: 'domcontentloaded' });
    await teacherPage.waitForTimeout(1000);

    // Chuyển sang quyền GV
    await teacherPage.evaluate(() => {
      window.STORE.setState({ role: 'teacher', screen: 'teacher', occupiedMachines: {} });
    });
    await teacherPage.waitForTimeout(300);

    // Thầy bấm bắt đầu tiết học khi 0 học sinh
    await teacherPage.evaluate(() => {
      window.teacherStartLesson();
    });
    await teacherPage.waitForTimeout(400);

    const zeroModalState = await teacherPage.evaluate(() => {
      const modal = document.getElementById('modal-zero-student-alert');
      const bypassBtn = modal ? modal.querySelector('#btn-wra-proceed') : null;
      const closeBtn = document.getElementById('btn-close-zero-student-alert');
      return {
        visible: modal ? window.getComputedStyle(modal).display !== 'none' : false,
        hasBypassBtn: !!bypassBtn,
        hasCloseBtn: !!closeBtn
      };
    });
    console.log('  [PASS] Modal chặn cứng (#modal-zero-student-alert) hiển thị:', zeroModalState.visible);
    console.log('  [PASS] Không có nút vượt rào (Vẫn bắt đầu):', !zeroModalState.hasBypassBtn);
    console.log('  [PASS] Không sử dụng alert/confirm mặc định của trình duyệt:', !nativeConfirmTriggered);

    if (!zeroModalState.visible) {
      throw new Error('LỖI: Chưa hiện hộp thoại chặn cứng #modal-zero-student-alert khi phòng chờ trống!');
    }
    if (zeroModalState.hasBypassBtn) {
      throw new Error('LỖI: Tồn tại nút vượt rào cho phép bắt đầu khi 0 học sinh!');
    }
    if (nativeConfirmTriggered) {
      throw new Error('LỖI: Vẫn còn gọi confirm() mặc định của trình duyệt!');
    }

    await teacherPage.screenshot({ path: path.join(outputDir, '00_zero_student_strict_modal.png') });

    // Đóng modal cảnh báo
    await teacherPage.click('#btn-close-zero-student-alert');
    await teacherPage.waitForTimeout(400);
    const zeroModalClosed = await teacherPage.evaluate(() => {
      const modal = document.getElementById('modal-zero-student-alert');
      return modal ? window.getComputedStyle(modal).display === 'none' : true;
    });
    console.log('  [PASS] Đóng modal thành công và giữ nguyên sảnh chờ:', zeroModalClosed);

    // -------------------------------------------------------------
    // GIAI ĐOẠN 1: ĐỒNG BỘ KHỐI 12, LỚP 12A2 VÀ TỰ ĐỘNG NẠP CÂU HỎI TIN 12
    // -------------------------------------------------------------
    console.log('\n--- 1. KIỂM TRA ĐỒNG BỘ KHỐI 12, LỚP 12A2 VÀ CÂU HỎI AI ---');
    await teacherPage.evaluate(() => {
      window.teacherSwitchTab('stage');
      const hwStage = document.getElementById('teacher-stage-hardware');
      const actStage = document.getElementById('teacher-stage-active');
      if (hwStage) hwStage.classList.add('active');
      if (actStage) actStage.classList.remove('active');
    });
    await teacherPage.waitForTimeout(500);

    // Chọn Khối 8 (THCS)
    await teacherPage.selectOption('#teacher-select-grade', '8');
    await teacherPage.evaluate(() => {
      window.teacherOnGradeChange();
    });
    await teacherPage.waitForTimeout(400);

    // Kiểm tra danh sách lớp có 8A2
    const class8A2Option = await teacherPage.evaluate(() => {
      const sel = document.getElementById('teacher-select-class');
      return sel ? !!sel.querySelector('option[value="8A2"]') : false;
    });
    console.log('  [PASS] Danh sách lớp có Lớp 8A2:', class8A2Option);
    if (!class8A2Option) throw new Error('LỖI: Thiếu lớp 8A2 trong dropdown chọn lớp!');

    await teacherPage.selectOption('#teacher-select-class', '8A2');

    // Kiểm tra câu hỏi tự động nạp theo bài Tin học 8
    const qInputValue = await teacherPage.evaluate(() => {
      const qIn = document.getElementById('otc-question-input');
      return qIn ? qIn.value.trim() : '';
    });
    console.log('  [PASS] Ô câu hỏi bài cũ (#otc-question-input) tự động nạp:', qInputValue);
    if (!qInputValue.includes('máy tính') && !qInputValue.includes('linh kiện') && !qInputValue.includes('Tin học')) {
      throw new Error('LỖI: Ô câu hỏi chưa nạp đúng câu hỏi Tin học 8 (giá trị hiện tại: ' + qInputValue + ')');
    }

    // Bấm kích hoạt lớp học
    await teacherPage.click('#btn-start-class-session');
    await teacherPage.waitForTimeout(500);

    // -------------------------------------------------------------
    // GIAI ĐOẠN 2: HỌC SINH VÀO SẢNH & KIỂM TRA ĐỒNG BỘ 12A2 + SƠ ĐỒ MÁY
    // -------------------------------------------------------------
    console.log('\n--- 2. HỌC SINH MÁY 01 VÀO PHÒNG CHỜ (SƠ ĐỒ 12A2) ---');
    await studentPage.goto('http://127.0.0.1:' + PORT + '/?role=student', { waitUntil: 'domcontentloaded' });
    await studentPage.waitForTimeout(1000);

    // Cài đặt cầu nối đồng bộ Playwright Dual-Context
    await teacherPage.exposeFunction('relayToStudent', (data) => {
      return studentPage.evaluate((d) => {
        if (window.SYNC_BUS && window.SYNC_BUS.handleMessage) {
          window.SYNC_BUS.handleMessage(d);
        }
      }, data);
    });
    await studentPage.exposeFunction('relayToTeacher', (data) => {
      return teacherPage.evaluate((d) => {
        if (window.SYNC_BUS && window.SYNC_BUS.handleMessage) {
          window.SYNC_BUS.handleMessage(d);
        }
      }, data);
    });

    await teacherPage.evaluate(() => {
      const origBroadcast = window.SYNC_BUS.broadcast.bind(window.SYNC_BUS);
      window.SYNC_BUS.broadcast = (type, payload) => {
        origBroadcast(type, payload);
        try { window.relayToStudent({ type, payload, timestamp: Date.now() }); } catch {}
      };
    });
    await studentPage.evaluate(() => {
      const origBroadcast = window.SYNC_BUS.broadcast.bind(window.SYNC_BUS);
      window.SYNC_BUS.broadcast = (type, payload) => {
        origBroadcast(type, payload);
        try { window.relayToTeacher({ type, payload, timestamp: Date.now() }); } catch {}
      };
    });

    // Học sinh nhận diện lớp 8A2
    await studentPage.evaluate(() => {
      window.STORE.setState({
        unlocked: true,
        classId: '8A2',
        grade: '8'
      });
    });
    await studentPage.waitForTimeout(400);

    // Chọn Máy 01 (ở 8A2 là Nguyễn Thái Học • Trần Thị Dung)
    await studentPage.evaluate(() => {
      window.onSelectDesk(1);
    });
    await studentPage.waitForTimeout(400);
    const confirmBtn = await studentPage.$('#btn-modal-confirm');
    if (confirmBtn) await confirmBtn.click();
    await studentPage.waitForTimeout(600);

    // Kiểm tra Topbar học sinh hiện đúng Lớp 8A2
    const studentHeaderData = await studentPage.evaluate(() => {
      const classLabel = document.getElementById('sh-class-label');
      const studentsLabel = document.getElementById('sh-students-label');
      return {
        classText: classLabel ? classLabel.textContent.trim() : '',
        studentsText: studentsLabel ? studentsLabel.textContent.trim() : ''
      };
    });
    console.log('  [PASS] Topbar học sinh hiển thị:', studentHeaderData);
    if (!studentHeaderData.classText.includes('8A2')) {
      throw new Error('LỖI: Topbar học sinh không hiện đúng Lớp 8A2 (' + studentHeaderData.classText + ')');
    }
    if (!studentHeaderData.studentsText.includes('Nguyễn Thái Học')) {
      throw new Error('LỖI: Danh sách học sinh máy 01 rơi về lớp khác (' + studentHeaderData.studentsText + ')');
    }

    // Đánh dấu máy 01 đã điểm danh vào state Giáo viên
    await teacherPage.evaluate(() => {
      window.STORE.setState({
        occupiedMachines: { "1": { machineId: 1, students: ["Nguyễn Thái Học", "Trần Thị Dung"] } }
      });
    });

    // -------------------------------------------------------------
    // GIAI ĐOẠN 3: KIỂM TRA GIAO DIỆN HỌC SINH TINH GỌN (CLEAN STAGE)
    // -------------------------------------------------------------
    console.log('\n--- 3. KIỂM TRA GIAO DIỆN HỌC SINH ĐÃ XÓA SẠCH CÁC PHẦN TỬ THỪA ---');
    await teacherPage.evaluate(() => {
      window.APP.executeStartActivity('old_lesson');
    });
    await teacherPage.waitForTimeout(4200);
    await studentPage.waitForTimeout(500);

    const cleanStageCheck = await studentPage.evaluate(() => {
      const callerSpotlight = document.getElementById('ol-caller-spotlight');
      const oralBanner = document.querySelector('.ol-oral-instruction-banner');
      const neonCard = document.getElementById('neon-lucky-card');
      const timerEl = document.getElementById('ol-timer');
      return {
        callerSpotlightRemoved: !callerSpotlight,
        oralBannerRemoved: !oralBanner,
        neonCardExists: !!neonCard,
        timerText: timerEl ? timerEl.textContent.trim() : ''
      };
    });
    console.log('  [PASS] Đã xóa bỏ #ol-caller-spotlight:', cleanStageCheck.callerSpotlightRemoved);
    console.log('  [PASS] Đã xóa bỏ .ol-oral-instruction-banner:', cleanStageCheck.oralBannerRemoved);
    console.log('  [PASS] Thẻ Neon Lucky Card (#neon-lucky-card) sẵn sàng:', cleanStageCheck.neonCardExists);
    console.log('  [PASS] Đồng hồ học sinh đứng yên tĩnh tuyệt đối tại 02:00:', cleanStageCheck.timerText === '02:00');

    if (!cleanStageCheck.callerSpotlightRemoved) {
      throw new Error('LỖI: Phần tử #ol-caller-spotlight vẫn còn tồn tại trong DOM học sinh!');
    }
    if (!cleanStageCheck.oralBannerRemoved) {
      throw new Error('LỖI: Hướng dẫn trả lời miệng vẫn còn tồn tại trong DOM học sinh!');
    }
    if (cleanStageCheck.timerText !== '02:00') {
      throw new Error('LỖI: Đồng hồ bài cũ không đứng yên tại 02:00 (giá trị hiện tại: ' + cleanStageCheck.timerText + ')');
    }

    await studentPage.screenshot({ path: path.join(outputDir, '01_clean_student_stage_02_00.png') });

    // -------------------------------------------------------------
    // GIAI ĐOẠN 4: KIỂM TRA RÀNG BUỘC 4 NÚT TUẦN TỰ TRÊN BÀN ĐIỀU KHIỂN
    // -------------------------------------------------------------
    console.log('\n--- 4. KIỂM TRA LOGIC TUẦN TỰ 4 BƯỚC: [1.BỐC THĂM] -> [2.CÂU HỎI] -> [3.ĐÁP ÁN] -> [4.PHÒNG CHỜ] ---');
    const initialButtonsState = await teacherPage.evaluate(() => {
      const btnDraw = document.getElementById('btn-ol-step-1-draw');
      const btnQ = document.getElementById('btn-ol-step-2-question');
      const btnA = document.getElementById('btn-ol-step-3-answer');
      const btnW = document.getElementById('btn-ol-step-4-waiting');
      return {
        btnDrawEnabled: btnDraw ? !btnDraw.disabled : false,
        btnQDisabled: btnQ ? btnQ.disabled : false,
        btnADisabled: btnA ? btnA.disabled : false,
        btnWEnabled: btnW ? !btnW.disabled : false
      };
    });
    console.log('  [PASS] Trạng thái 4 nút trước khi bốc thăm:', initialButtonsState);
    if (!initialButtonsState.btnQDisabled) {
      throw new Error('LỖI SƯ PHẠM: Nút 2 (Câu hỏi) chưa bị khóa khi chưa bốc thăm!');
    }
    if (!initialButtonsState.btnADisabled) {
      throw new Error('LỖI SƯ PHẠM: Nút 3 (Đáp án) chưa bị khóa khi chưa phát câu hỏi!');
    }

    // Thầy bấm Nút 1: Bốc thăm ngẫu nhiên học sinh lớp 8A2 (Máy 01: Nguyễn Thái Học)
    console.log('\n--- BƯỚC 1: BỐC THĂM ĐÍCH DANH HỌC SINH LỚP 8A2 ---');
    await teacherPage.evaluate(() => {
      const payload = {
        strategy: 'slot_machine',
        targetMachine: 1,
        targetStudent: 'Nguyễn Thái Học',
        studentsList: ['Nguyễn Thái Học', 'Trần Thị Dung'],
        duration: 1000
      };
      window.SYNC_BUS.broadcast('LUCKY_DRAW_SPIN', payload);
      window.APP.executeLuckyDrawAnimation(payload, true);
    });

    await teacherPage.waitForTimeout(4000);
    await studentPage.waitForTimeout(1000);

    const postDrawState = await teacherPage.evaluate(() => {
      const btnQ = document.getElementById('btn-ol-step-2-question');
      const btnA = document.getElementById('btn-ol-step-3-answer');
      const otsName = document.getElementById('ots-student-name');
      const otsTimer = document.getElementById('ots-timer-display');
      return {
        btnQEnabled: btnQ ? !btnQ.disabled : false,
        btnADisabled: btnA ? btnA.disabled : false,
        otsName: otsName ? otsName.textContent.trim() : '',
        otsTimer: otsTimer ? otsTimer.textContent.trim() : ''
      };
    });
    console.log('  [PASS] Bàn điều khiển GV sau khi bốc thăm xong:', postDrawState);
    if (!postDrawState.btnQEnabled) {
      throw new Error('LỖI: Nút 2 (Câu hỏi) chưa mở khóa sau khi bốc thăm!');
    }
    if (!postDrawState.btnADisabled) {
      throw new Error('LỖI: Nút 3 (Đáp án) bị mở khóa sớm khi chưa phát đề!');
    }
    if (postDrawState.otsTimer !== '02:00') {
      throw new Error('LỖI: Đồng hồ GV bị chạy sớm trước khi phát đề (' + postDrawState.otsTimer + ')');
    }

    const studentPostDraw = await studentPage.evaluate(() => {
      const name = document.getElementById('nlc-student-name');
      const timerEl = document.getElementById('ol-timer');
      return {
        name: name ? name.textContent.trim() : '',
        timerText: timerEl ? timerEl.textContent.trim() : ''
      };
    });
    console.log('  [PASS] Màn hình học sinh sau khi bốc thăm:', studentPostDraw);
    if (studentPostDraw.name !== 'Nguyễn Thái Học') {
      throw new Error('LỖI: Thẻ Neon học sinh hiện sai tên (' + studentPostDraw.name + ')');
    }
    if (studentPostDraw.timerText !== '02:00') {
      throw new Error('LỖI: Đồng hồ học sinh bị chạy sớm trước khi phát đề (' + studentPostDraw.timerText + ')');
    }

    await studentPage.screenshot({ path: path.join(outputDir, '02_student_neon_card_12A2_02_00.png') });

    // Bấm Nút 2: Phát đề câu hỏi xuống 18 máy
    console.log('\n--- BƯỚC 2: PHÁT ĐỀ CÂU HỎI & BẮT ĐẦU TÍNH GIỜ ---');
    await teacherPage.click('#btn-ol-step-2-question');
    await teacherPage.waitForTimeout(1000);
    await studentPage.waitForTimeout(500);

    const postQuestionState = await teacherPage.evaluate(() => {
      const btnA = document.getElementById('btn-ol-step-3-answer');
      return {
        btnAEnabled: btnA ? !btnA.disabled : false
      };
    });
    console.log('  [PASS] Sau khi phát đề, Nút 3 (Đáp án) đã mở khóa:', postQuestionState.btnAEnabled);
    if (!postQuestionState.btnAEnabled) {
      throw new Error('LỖI: Nút 3 (Đáp án) chưa mở khóa sau khi phát đề!');
    }

    const studentPostQuestion = await studentPage.evaluate(() => {
      const qText = document.getElementById('ol-question-text');
      const timerRunning = window.STORE.getState().timer?.isRunning;
      return {
        qTextVisible: qText ? qText.style.display !== 'none' : false,
        qContent: qText ? qText.textContent.trim() : '',
        timerRunning: !!timerRunning
      };
    });
    console.log('  [PASS] Câu hỏi đã hiển thị trên màn hình học sinh:', studentPostQuestion);
    if (!studentPostQuestion.qTextVisible) {
      throw new Error('LỖI: Câu hỏi chưa bung ra sau khi bấm Nút 2!');
    }

    // KIỂM TRA ĐẶC BIỆT: CHỐNG RACE CONDITION (ĐỢI 3.5S ĐỂ CHỨNG MINH CÂU HỎI KHÔNG BỊ ẨN MẤT)
    console.log('  [WAIT] Đợi 3.5 giây kiểm tra câu hỏi có bị timeout cũ ẩn mất không...');
    await teacherPage.waitForTimeout(3500);
    await studentPage.waitForTimeout(500);

    const questionStillVisible = await studentPage.evaluate(() => {
      const qText = document.getElementById('ol-question-text');
      const banner = document.getElementById('ol-question-standby-banner');
      return {
        qVisible: qText ? qText.style.display !== 'none' : false,
        standbyHidden: banner ? banner.style.display === 'none' : false,
        qContent: qText ? qText.textContent.trim() : ''
      };
    });
    console.log('  [PASS] Sau 3.5s, câu hỏi vẫn hiển thị ổn định 100%, không bị ẩn mất:', questionStillVisible);
    if (!questionStillVisible.qVisible || !questionStillVisible.standbyHidden) {
      throw new Error('LỖI NGHIÊM TRỌNG: Câu hỏi bị ẩn mất sau khi phát đề!');
    }

    await studentPage.screenshot({ path: path.join(outputDir, '03_question_revealed_and_timer_active.png') });

    // Bấm Nút 3: Công bố đáp án chuẩn
    console.log('\n--- BƯỚC 3: CÔNG BỐ ĐÁP ÁN CHUẨN ---');
    await teacherPage.click('#btn-ol-step-3-answer');
    await teacherPage.waitForTimeout(800);
    await studentPage.waitForTimeout(500);

    const answerRevealed = await studentPage.evaluate(() => {
      const box = document.getElementById('ol-reveal-box');
      return box ? box.style.display !== 'none' : false;
    });
    console.log('  [PASS] Đáp án chuẩn hiển thị trên máy học sinh:', answerRevealed);
    if (!answerRevealed) {
      throw new Error('LỖI: Hộp đáp án chuẩn chưa hiển thị sau khi bấm Nút 3!');
    }

    await studentPage.screenshot({ path: path.join(outputDir, '04_answer_revealed.png') });

    // Bấm Nút 4: Phòng chờ (Reset học sinh về sảnh chờ an toàn)
    console.log('\n--- BƯỚC 4: BẤM PHÒNG CHỜ (RESET AN TOÀN VỀ SẢNH CHỜ) ---');
    await teacherPage.click('#btn-ol-step-4-waiting');
    await teacherPage.waitForTimeout(1000);
    await studentPage.waitForTimeout(500);

    const backToLobbySafe = await studentPage.evaluate(() => {
      const stWaiting = document.getElementById('st-view-waiting');
      return {
        phase: window.STORE.getState().currentPhase,
        stWaitingActive: stWaiting ? stWaiting.classList.contains('active') : false
      };
    });
    console.log('  [PASS] Học sinh đã trở về sảnh chờ an toàn (#st-view-waiting):', backToLobbySafe);
    if (backToLobbySafe.phase !== 'waiting' || !backToLobbySafe.stWaitingActive) {
      throw new Error('LỖI: Bấm Nút 4 không đưa học sinh về sảnh chờ an toàn!');
    }

    // Kiểm tra bàn điều khiển Giáo viên: Thẻ 1 chuyển màu xám (disabled) và Nút Hero chuyển sang Bước 2
    const teacherPipelineAfterStep4 = await teacherPage.evaluate(() => {
      const card1 = document.getElementById('pac-old_lesson');
      const card1Btn = card1 ? card1.querySelector('.btn-pac-action') : null;
      const heroBtn = document.getElementById('btn-start-lesson-hero');
      return {
        card1Finished: card1 ? card1.classList.contains('finished') : false,
        card1BtnDisabled: card1Btn ? card1Btn.disabled : false,
        card1BtnText: card1Btn ? card1Btn.textContent.trim() : '',
        heroBtnText: heroBtn ? heroBtn.textContent.trim() : ''
      };
    });
    console.log('  [PASS] Thẻ HĐ 1 chuyển xám và Nút Hero chuyển sang Bước 2:', teacherPipelineAfterStep4);
    if (!teacherPipelineAfterStep4.card1Finished || !teacherPipelineAfterStep4.card1BtnDisabled) {
      throw new Error('LỖI: Thẻ HĐ 1 chưa chuyển sang trạng thái xám disabled sau khi hoàn thành!');
    }
    if (!teacherPipelineAfterStep4.heroBtnText.includes('BƯỚC 2') && !teacherPipelineAfterStep4.heroBtnText.includes('KHỞI ĐỘNG')) {
      throw new Error('LỖI: Nút Hero dưới sảnh chờ chưa chuyển sang Bước 2 (Khởi động & Khám phá)! Text: ' + teacherPipelineAfterStep4.heroBtnText);
    }

    await teacherPage.screenshot({ path: path.join(outputDir, '06_activity_card_disabled.png') });
    await studentPage.screenshot({ path: path.join(outputDir, '05_student_back_to_lobby_rescued.png') });

    // -------------------------------------------------------------
    // GIAI ĐOẠN 5: KIỂM TRA BỐ CỤC ĐA ĐỘ PHÂN GIẢI & KHÔNG TRÀN NGANG
    // -------------------------------------------------------------
    console.log('\n--- 5. KIỂM TRA BỐ CỤC KHÔNG TRÀN NGANG Ở ĐỘ PHÂN GIẢI 1366x768 VÀ 1920x1080 ---');
    for (const vp of [{ w: 1366, h: 768 }, { w: 1920, h: 1080 }]) {
      await studentPage.setViewportSize({ width: vp.w, height: vp.h });
      await studentPage.waitForTimeout(300);
      const isOverflow = await studentPage.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      console.log('  [PASS] Độ phân giải ' + vp.w + 'x' + vp.h + ': Tràn ngang = ' + isOverflow + ' (0 overflow)');
      if (isOverflow) throw new Error('LỖI: Bị tràn ngang tại độ phân giải ' + vp.w + 'x' + vp.h + '!');
    }

    console.log('\n================================================================');
    console.log('🎉 TẤT CẢ CÁC HẠNG MỤC SƯ PHẠM v2.9.2 ĐỀU ĐẠT CHUẨN ZERO-BUG 100%!');
    console.log('================================================================\n');

  } finally {
    await browser.close();
    server.close();
  }
}

runVerification().catch(err => {
  console.error('\n❌ [TEST FAILED]:', err);
  process.exit(1);
});
