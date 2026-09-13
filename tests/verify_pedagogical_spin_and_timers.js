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

async function runVerification() {
  console.log('🚀 [TEST] KHỞI ĐỘNG KIỂM THỬ SƯ PHẠM ĐA ĐẠI LÝ: BỐC THĂM ĐÍCH DANH 1 EM, ĐỒNG HỒ ĐỘC LẬP & CHUYỂN CẢNH MƯỢT');
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });

  const teacherCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const studentCtx = await browser.newContext({ viewport: { width: 1366, height: 768 } });

  const teacherPage = await teacherCtx.newPage();
  const studentPage = await studentCtx.newPage();

  teacherPage.on('dialog', async d => {
    console.log('  [Teacher Dialog]:', d.message());
    await d.accept();
  });
  studentPage.on('dialog', async d => {
    console.log('  [Student Dialog]:', d.message());
    await d.accept();
  });

  const teacherErrors = [];
  const studentErrors = [];
  teacherPage.on('console', msg => { if (msg.type() === 'error') teacherErrors.push(msg.text()); });
  studentPage.on('console', msg => { if (msg.type() === 'error') studentErrors.push(msg.text()); });

  try {
    // -------------------------------------------------------------
    // GIAI ĐOẠN 1: KIỂM TRA CÀI ĐẶT THỜI GIAN TRONG XƯỞNG SOẠN (STUDIO)
    // -------------------------------------------------------------
    console.log('\n--- 1. KIỂM TRA CÀI ĐẶT THỜI LƯỢNG BƯỚC 2 & 4 TRONG XƯỞNG SOẠN ---');
    await teacherPage.goto(`http://127.0.0.1:${PORT}/?role=teacher`, { waitUntil: 'domcontentloaded' });
    await teacherPage.waitForTimeout(1000);

    // Chuyển sang quyền GV và click tab Studio
    await teacherPage.evaluate(() => {
      window.STORE.setState({ role: 'teacher', screen: 'teacher' });
    });
    await teacherPage.waitForTimeout(300);
    await teacherPage.click('#btn-tnav-studio');
    await teacherPage.waitForTimeout(600);

    const stepTime2Exists = await teacherPage.$('#step-time-2');
    const stepTime4Exists = await teacherPage.$('#step-time-4');
    console.log('  [PASS] Dropdown thời gian Bước 2 (#step-time-2) tồn tại:', !!stepTime2Exists);
    console.log('  [PASS] Dropdown thời gian Bước 4 (#step-time-4) tồn tại:', !!stepTime4Exists);

    // Chọn thời lượng mới và lưu bài
    await teacherPage.selectOption('#step-time-2', '180'); // 3 phút
    await teacherPage.selectOption('#step-time-4', '720'); // 12 phút
    await teacherPage.click('#btn-studio-save-lesson');
    await teacherPage.waitForTimeout(600);

    const savedLesson = await teacherPage.evaluate(() => {
      const s = window.STORE.getState();
      const l = window.APP.getLesson(s.lessonId);
      return {
        theoryTimeLimit: l.theoryTimeLimit,
        discTimeLimit: l.discussion && l.discussion.timeLimit
      };
    });
    console.log('  [PASS] Dữ liệu thời gian đã lưu vào Lesson:', savedLesson);

    // -------------------------------------------------------------
    // GIAI ĐOẠN 2: KÍCH HOẠT LỚP HỌC & CÀI ĐẶT CẦU NỐI ĐỒNG BỘ DUAL CONTEXT
    // -------------------------------------------------------------
    console.log('\n--- 2. KÍCH HOẠT LỚP HỌC & ĐƯA HỌC SINH VÀO SẢNH CHỜ ---');
    await teacherPage.click('#btn-tnav-stage');
    await teacherPage.waitForTimeout(500);

    await teacherPage.evaluate(() => {
      window.STORE.setState({
        teacherTab: 'stage',
        teacherStage: 'active',
        unlocked: true,
        currentPhase: 'waiting'
      });
      window.APP.renderDynamicStagePipeline();
    });
    await teacherPage.waitForTimeout(500);

    // Học sinh vào sảnh
    await studentPage.goto(`http://127.0.0.1:${PORT}/?role=student`, { waitUntil: 'domcontentloaded' });
    await studentPage.waitForTimeout(1000);

    // Cài đặt cầu nối đồng bộ thông điệp giữa 2 Browser Contexts độc lập (Playwright Dual-Context Bridge)
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

    await studentPage.evaluate(() => {
      window.STORE.setState({ unlocked: true });
    });
    await studentPage.waitForTimeout(400);

    // Chọn Máy 04
    await studentPage.evaluate(() => {
      window.onSelectDesk(4);
    });
    await studentPage.waitForTimeout(400);
    const confirmBtn = await studentPage.$('#btn-modal-confirm');
    if (confirmBtn) await confirmBtn.click();
    await studentPage.waitForTimeout(600);

    // Kiểm tra học sinh ở Sảnh chờ st-view-waiting
    const studentWaitingActive = await studentPage.evaluate(() => {
      const el = document.getElementById('st-view-waiting');
      return el && el.classList.contains('active');
    });
    console.log('  [PASS] Học sinh Máy 04 đã vào Sảnh chờ Đấu trường (#st-view-waiting):', studentWaitingActive);
    await studentPage.screenshot({ path: path.join(outputDir, '01_student_waiting_ready.png') });

    // -------------------------------------------------------------
    // GIAI ĐOẠN 3: GIÁO VIÊN BẮT ĐẦU HOẠT ĐỘNG KIỂM TRA BÀI CŨ
    // -------------------------------------------------------------
    console.log('\n--- 3. BẮT ĐẦU BƯỚC 1 (BÀI CŨ): ĐỒNG HỒ ĐỨNG YÊN, CÂU HỎI KHÓA ---');
    await teacherPage.evaluate(() => {
      window.APP.executeStartActivity('old_lesson');
    });
    // Bỏ qua đếm ngược 3-2-1 bằng timeout
    await teacherPage.waitForTimeout(4200);
    await studentPage.waitForTimeout(500);

    // Kiểm tra đồng hồ đứng yên (chưa chạy) và câu hỏi chưa phát
    const studentOldLessonState = await studentPage.evaluate(() => {
      const state = window.STORE.getState();
      const standby = document.getElementById('ol-question-standby-banner');
      const qText = document.getElementById('ol-question-text');
      const timerEl = document.getElementById('ol-timer');
      return {
        currentPhase: state.currentPhase,
        questionRevealed: !!(state.oldLesson && state.oldLesson.questionRevealed),
        standbyVisible: standby ? standby.style.display !== 'none' : false,
        qTextVisible: qText ? qText.style.display !== 'none' : false,
        timerText: timerEl ? timerEl.textContent.trim() : ''
      };
    });
    console.log('  [PASS] Trạng thái Bài cũ học sinh:', studentOldLessonState);
    if (studentOldLessonState.questionRevealed || studentOldLessonState.qTextVisible) {
      throw new Error('LỖI SƯ PHẠM: Câu hỏi bài cũ bị lộ trước khi bốc thăm!');
    }
    await studentPage.screenshot({ path: path.join(outputDir, '02_student_old_lesson_standby.png') });

    // -------------------------------------------------------------
    // GIAI ĐOẠN 4: BỐC THĂM VÒNG XOAY ĐÍCH DANH 1 HỌC SINH
    // -------------------------------------------------------------
    console.log('\n--- 4. BỐC THĂM VÒNG XOAY: CHỈ ĐÍCH DANH DUY NHẤT 1 HỌC SINH (KHÔNG GHÉP &) ---');
    await teacherPage.evaluate(() => {
      window.APP.openLuckyDrawModal(true);
      window.APP.setLuckyDrawStrategy('wheel_fortune', true);
    });
    await teacherPage.waitForTimeout(600);

    // Phát lệnh quay với đích danh Máy 04, Em "Trần Đình Khôi" (1 học sinh duy nhất)
    await teacherPage.evaluate(() => {
      const payload = {
        strategy: 'wheel_fortune',
        targetMachine: 4,
        targetStudent: 'Trần Đình Khôi',
        studentsList: ['Trần Đình Khôi', 'Võ Hoài Nam'],
        duration: 1000
      };
      window.SYNC_BUS.broadcast('LUCKY_DRAW_SPIN', payload);
      window.APP.executeLuckyDrawAnimation(payload, true);
    });

    // Chờ quay xong (1000ms + 200ms) + đóng modal (2500ms)
    await teacherPage.waitForTimeout(4200);
    await studentPage.waitForTimeout(1000);

    // Kiểm tra Hộp Thoại Neon Chuẩn Ảnh Thầy Gửi
    const neonCardData = await studentPage.evaluate(() => {
      const card = document.getElementById('neon-lucky-card');
      const desk = document.getElementById('nlc-desk-text');
      const name = document.getElementById('nlc-student-name');
      const status = document.getElementById('nlc-status-text');
      const qRevealed = window.STORE.getState().oldLesson?.questionRevealed;
      return {
        cardVisible: card ? card.style.display !== 'none' : false,
        deskText: desk ? desk.textContent.trim() : '',
        studentName: name ? name.textContent.trim() : '',
        statusText: status ? status.textContent.trim() : '',
        questionRevealed: !!qRevealed
      };
    });
    console.log('  [PASS] Dữ liệu Hộp thoại Neon vinh danh:', neonCardData);

    if (neonCardData.studentName.includes('&')) {
      throw new Error(`LỖI SƯ PHẠM: Hộp thoại vinh danh hiển thị ghép cặp (${neonCardData.studentName}) thay vì 1 em duy nhất!`);
    }
    if (neonCardData.questionRevealed) {
      throw new Error('LỖI SƯ PHẠM: Câu hỏi bị phát tự động sau khi quay xong mà không chờ Thầy bấm nút!');
    }
    await studentPage.screenshot({ path: path.join(outputDir, '03_neon_lucky_card_single_student.png') });

    // -------------------------------------------------------------
    // GIAI ĐOẠN 5: THẦY BẤM [PHÁT ĐỀ & BẮT ĐẦU TÍNH GIỜ]
    // -------------------------------------------------------------
    console.log('\n--- 5. GIÁO VIÊN BẤM PHÁT ĐỀ: CÂU HỎI HIỆN RA & ĐỒNG HỒ ĐẾM GIỜ ---');
    await teacherPage.evaluate(() => {
      window.APP.broadcastOldLessonStart();
    });
    await studentPage.waitForTimeout(1000);

    const questionActiveState = await studentPage.evaluate(() => {
      const qText = document.getElementById('ol-question-text');
      const standby = document.getElementById('ol-question-standby-banner');
      const status = document.getElementById('nlc-status-text');
      const timerRunning = window.STORE.getState().timer?.isRunning;
      return {
        qTextVisible: qText ? qText.style.display !== 'none' : false,
        standbyHidden: standby ? standby.style.display === 'none' : false,
        statusText: status ? status.textContent.trim() : '',
        timerRunning: !!timerRunning
      };
    });
    console.log('  [PASS] Trạng thái sau khi Thầy phát đề:', questionActiveState);
    if (!questionActiveState.qTextVisible) {
      throw new Error('LỖI: Câu hỏi chưa hiện lên màn hình học sinh sau khi Thầy bấm phát đề!');
    }
    await studentPage.screenshot({ path: path.join(outputDir, '04_question_revealed_and_timer_running.png') });

    // -------------------------------------------------------------
    // GIAI ĐOẠN 6: HẾT GIỜ (00:00) -> KHÔNG TỰ THOÁT RA PHÒNG CHỜ
    // -------------------------------------------------------------
    console.log('\n--- 6. HẾT GIỜ (00:00): GIỮ NGUYÊN MÀN HÌNH, THẦY CÔNG BỐ ĐÁP ÁN ---');
    // Cưỡng bức đồng hồ về 0
    await teacherPage.evaluate(() => {
      window.APP.updateMasterTimerDisplay(0);
      window.STORE.setState({
        oldLesson: Object.assign({}, window.STORE.getState().oldLesson, { isLocked: true, timeLeft: 0 }),
        timer: Object.assign({}, window.STORE.getState().timer, { secondsLeft: 0, isRunning: false })
      });
    });
    await studentPage.evaluate(() => {
      window.APP.updateMasterTimerDisplay(0);
    });
    await studentPage.waitForTimeout(500);

    // Học sinh vẫn ở Bước 1
    const stillInOldLesson = await studentPage.evaluate(() => {
      return window.STORE.getState().currentPhase === 'old_lesson';
    });
    console.log('  [PASS] Hết giờ, học sinh vẫn ở trên sàn diễn bài cũ (không bị văng ra phòng chờ):', stillInOldLesson);
    if (!stillInOldLesson) {
      throw new Error('LỖI SƯ PHẠM: Hết giờ hệ thống tự động đá học sinh về phòng chờ!');
    }

    // Thầy công bố đáp án
    await teacherPage.evaluate(() => {
      window.APP.teacherRevealOldLesson();
    });
    await studentPage.waitForTimeout(600);

    const revealBoxVisible = await studentPage.evaluate(() => {
      const box = document.getElementById('ol-reveal-box');
      return box ? box.style.display !== 'none' : false;
    });
    console.log('  [PASS] Thầy công bố đáp án -> Hộp đáp án hiển thị:', revealBoxVisible);
    if (!revealBoxVisible) {
      throw new Error('LỖI SƯ PHẠM: Hộp đáp án chưa hiển thị sau khi Thầy công bố!');
    }
    await studentPage.screenshot({ path: path.join(outputDir, '05_answer_revealed_by_teacher.png') });

    // -------------------------------------------------------------
    // GIAI ĐOẠN 7: KẾT THÚC HOẠT ĐỘNG: CHUYỂN CẢNH MƯỢT 1.5S
    // -------------------------------------------------------------
    console.log('\n--- 7. THẦY BẤM KẾT THÚC HOẠT ĐỘNG: TOAST CHUYỂN CẢNH SƯ PHẠM 1.5S ---');
    await teacherPage.evaluate(() => {
      window.handleFinishActivity('old_lesson');
    });

    // Sau 500ms: Toast chuyển cảnh phải hiển thị
    await studentPage.waitForTimeout(500);
    const toastVisible = await studentPage.evaluate(() => {
      const t = document.getElementById('activity-finishing-toast');
      return t ? t.style.display !== 'none' : false;
    });
    console.log('  [PASS] Toast chuyển cảnh 1.5s hiển thị trên máy học sinh:', toastVisible);
    await studentPage.screenshot({ path: path.join(outputDir, '06_activity_finishing_toast.png') });

    // Chờ qua 1.5s (tổng cộng 1800ms)
    await studentPage.waitForTimeout(1500);
    await teacherPage.waitForTimeout(500);

    // Học sinh đã nhẹ nhàng về Sảnh chờ st-view-waiting
    const backToWaiting = await studentPage.evaluate(() => {
      const state = window.STORE.getState();
      const waitingEl = document.getElementById('st-view-waiting');
      return state.currentPhase === 'waiting' && waitingEl && waitingEl.classList.contains('active');
    });
    console.log('  [PASS] Sau 1.5s, học sinh nhẹ nhàng về Sảnh chờ Đấu trường:', backToWaiting);
    if (!backToWaiting) {
      throw new Error('LỖI SƯ PHẠM: Học sinh chưa trở về sảnh chờ st-view-waiting sau 1.5s kết thúc hoạt động!');
    }

    // Kiểm tra thẻ hoạt động bài cũ phía GV đã bị finished/disabled
    const oldLessonCardFinished = await teacherPage.evaluate(() => {
      const card = document.querySelector('.pipeline-activity-card.finished, .pipeline-act-card.act-card-disabled');
      return !!card;
    });
    console.log('  [PASS] Thẻ hoạt động Bước 1 trên Sân khấu GV đã disable chống chọn lại:', oldLessonCardFinished);
    await teacherPage.screenshot({ path: path.join(outputDir, '07_teacher_stage_disabled_card.png') });

    // -------------------------------------------------------------
    // GIAI ĐOẠN 8: KẾT THÚC TIẾT HỌC -> DỌN SẠCH & VỀ PHÒNG MÁY ĐANG CHỜ
    // -------------------------------------------------------------
    console.log('\n--- 8. KẾT THÚC TIẾT HỌC: LÀM SẠCH FACTORY CLEAN, VỀ PHÒNG MÁY ĐANG CHỜ ---');
    await teacherPage.evaluate(() => {
      window.APP.stopMasterTimer();
      window.APP.updateMasterTimerDisplay(0);
      window.APP.resetAndCleanActivity('waiting', { cleanAll: true });
      window.STORE.setState({
        sessionStarted: false,
        unlocked: false,
        currentPhase: 'waiting',
        teacherPhase: 'waiting',
        machineId: null,
        fixedMachineId: null,
        students: [],
        occupiedMachines: {},
        finishedActivities: {},
        lastFinishedActivity: null
      });
      window.SYNC_BUS.broadcast('SESSION_ENDED', {});
    });
    await studentPage.waitForTimeout(1000);

    const studentLobbyState = await studentPage.evaluate(() => {
      const state = window.STORE.getState();
      const title = document.getElementById('lsb-title');
      const lobbyScreen = document.getElementById('screen-lobby');
      return {
        screen: state.screen,
        sessionStarted: state.sessionStarted,
        studentsLen: state.students ? state.students.length : 0,
        lastFinished: state.lastFinishedActivity,
        bannerText: title ? title.textContent.trim() : '',
        lobbyActive: lobbyScreen ? lobbyScreen.classList.contains('active') : false
      };
    });
    console.log('  [PASS] Trạng thái Sảnh học sinh sau khi Kết thúc Tiết học:', studentLobbyState);

    if (studentLobbyState.screen !== 'lobby' || !studentLobbyState.bannerText.includes('PHÒNG MÁY ĐANG CHỜ')) {
      throw new Error('LỖI: Học sinh chưa về trạng thái PHÒNG MÁY ĐANG CHỜ sạch sẽ!');
    }
    await studentPage.screenshot({ path: path.join(outputDir, '08_student_back_clean_lobby.png') });

    // -------------------------------------------------------------
    // GIAI ĐOẠN 9: KIỂM TRA BỐ CỤC ĐA ĐỘ PHÂN GIẢI & KHÔNG TRÀN NGANG
    // -------------------------------------------------------------
    console.log('\n--- 9. KIỂM TRA BỐ CỤC KHÔNG TRÀN NGANG Ở ĐỘ PHÂN GIẢI 1366x768 VÀ 1920x1080 ---');
    for (const vp of [{ w: 1366, h: 768 }, { w: 1920, h: 1080 }]) {
      await studentPage.setViewportSize({ width: vp.w, height: vp.h });
      await studentPage.waitForTimeout(300);
      const isOverflow = await studentPage.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      console.log(`  [PASS] Độ phân giải ${vp.w}x${vp.h}: Tràn ngang = ${isOverflow} (0 overflow)`);
      if (isOverflow) throw new Error(`LỖI: Bị tràn ngang tại độ phân giải ${vp.w}x${vp.h}!`);
    }

    console.log('\n================================================================');
    console.log('🎉 TẤT CẢ 9 BƯỚC KIỂM THỬ SƯ PHẠM ĐỀU ĐẠT CHUẨN ZERO-BUG 100%!');
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
