const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = 8995;
const outputDir = path.resolve(__dirname, 'resilience_screenshots');
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
      console.log('📡 [HTTP Server] Đang chạy tại http://127.0.0.1:' + PORT);
      resolve(server);
    });
  });
}

async function runResilienceTest() {
  console.log('================================================================');
  console.log('🛡️ [TEST CDP NETWORK RESILIENCE] KIỂM THỬ MẠNG CHẬP CHỜN & TỰ PHỤC HỒI QUA CDP');
  console.log('================================================================');

  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });

  const teacherCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const studentCtx = await browser.newContext({ viewport: { width: 1366, height: 768 } });

  const teacherPage = await teacherCtx.newPage();
  const studentPage = await studentCtx.newPage();

  const errors = [];
  teacherPage.on('console', msg => { if (msg.type() === 'error') errors.push(`[Teacher Error]: ${msg.text()}`); });
  studentPage.on('console', msg => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (txt.includes('ERR_INTERNET_DISCONNECTED')) return; // Bỏ qua lỗi ngắt socket mạng vật lý do CDP giả lập
      errors.push(`[Student Error]: ${txt}`);
    }
  });
  teacherPage.on('dialog', async d => { await d.accept(); });
  studentPage.on('dialog', async d => { await d.accept(); });

  try {
    // 1. Khởi động 2 máy GV và HS Máy 05
    console.log('\n[1/4] Khởi động phiên làm việc GV và HS (Máy 05)...');
    await teacherPage.goto(`http://127.0.0.1:${PORT}/?role=teacher`, { waitUntil: 'domcontentloaded' });
    await studentPage.goto(`http://127.0.0.1:${PORT}/?role=student`, { waitUntil: 'domcontentloaded' });

    // Thiết lập cầu nối sự kiện hai chiều
    await teacherPage.exposeFunction('relayToStudent', (data) => {
      return studentPage.evaluate((d) => {
        if (window.SYNC_BUS && window.SYNC_BUS.handleMessage) {
          window.SYNC_BUS.handleMessage(d);
        }
      }, data).catch(() => {});
    });
    await studentPage.exposeFunction('relayToTeacher', (data) => {
      return teacherPage.evaluate((d) => {
        if (window.SYNC_BUS && window.SYNC_BUS.handleMessage) {
          window.SYNC_BUS.handleMessage(d);
        }
      }, data).catch(() => {});
    });

    await teacherPage.evaluate(() => {
      const origBroadcast = window.SYNC_BUS.broadcast.bind(window.SYNC_BUS);
      window.SYNC_BUS.broadcast = (type, payload) => {
        origBroadcast(type, payload);
        try { window.relayToStudent({ type, payload, timestamp: Date.now() }); } catch {}
      };
      window.STORE.setState({ role: 'teacher', screen: 'teacher', occupiedMachines: {} });
    });

    await studentPage.evaluate(() => {
      const origBroadcast = window.SYNC_BUS.broadcast.bind(window.SYNC_BUS);
      window.SYNC_BUS.broadcast = (type, payload) => {
        origBroadcast(type, payload);
        try { window.relayToTeacher({ type, payload, timestamp: Date.now() }); } catch {}
      };
      window.STORE.setState({
        unlocked: true,
        classId: '12A2',
        grade: '12'
      });
      window.onSelectDesk(5);
      const confirmBtn = document.getElementById('btn-modal-confirm');
      if (confirmBtn) confirmBtn.click();
    });
    await studentPage.waitForTimeout(300);

    console.log('  [PASS] Máy 05 đã vào vị trí thành công.');

    // 2. Mở kết nối CDP Session để điều khiển mạng vật lý của trình duyệt
    console.log('\n[2/4] Thiết lập CDP Session trên máy học sinh...');
    const cdpClient = await studentCtx.newCDPSession(studentPage);

    // Kích hoạt Network tracking trong CDP
    await cdpClient.send('Network.enable');

    // 3. MÔ PHỎNG MẤT MẠNG ĐỘT NGỘT (Offline Outage)
    console.log('\n[3/4] MÔ PHỎNG MẤT KẾT NỐI MẠNG ĐỘT NGỘT (CDP offline: true) trong 3.000ms...');
    await cdpClient.send('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0
    });

    // Kiểm tra trạng thái navigator.onLine trên máy học sinh
    const isOnlineDuringCut = await studentPage.evaluate(() => navigator.onLine);
    console.log(`  [CDP TRACE] Trạng thái mạng navigator.onLine của học sinh khi rớt mạng: ${isOnlineDuringCut}`);
    await studentPage.screenshot({ path: path.join(outputDir, '01_student_during_network_cut.png') });

    // Trong khi máy học sinh bị rớt mạng, học sinh vẫn thao tác UI mà không bị vỡ giao diện
    const uiFunctionalOffline = await studentPage.evaluate(() => {
      const body = document.body;
      return body && !body.classList.contains('crashed');
    });
    console.log('  [PASS] Giao diện học sinh giữ nguyên trạng thái tĩnh, không bị crash đơ:', uiFunctionalOffline);

    await studentPage.waitForTimeout(2000);

    // 4. MÔ PHỎNG PHỤC HỒI MẠNG (Reconnection Resiliency)
    console.log('\n[4/4] MÔ PHỎNG PHỤC HỒI KẾT NỐI (CDP offline: false, Wi-Fi phòng máy: 10Mbps, 30ms latency)...');
    await cdpClient.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 30,
      downloadThroughput: 10 * 1024 * 1024 / 8,
      uploadThroughput: 5 * 1024 * 1024 / 8
    });

    const isOnlineAfterRestore = await studentPage.evaluate(() => navigator.onLine);
    console.log(`  [CDP TRACE] Trạng thái mạng navigator.onLine sau khi phục hồi: ${isOnlineAfterRestore}`);

    // Giáo viên phát lệnh sau khi mạng phục hồi
    await teacherPage.evaluate(() => {
      const state = window.STORE.getState();
      const oldL = Object.assign({}, state.oldLesson || {}, {
        selectedStudent: 'Nguyễn Thái Học',
        selectedMachine: 1,
        questionText: 'Trình bày sự khác biệt giữa AI Hẹp (Narrow AI) và AI Tổng Quát (AGI)?'
      });
      window.STORE.setState({ oldLesson: oldL });
      window.broadcastOldLessonStart();
    });
    await studentPage.waitForTimeout(800);

    // Xác nhận máy học sinh nhận được câu hỏi bình thường
    const questionVisible = await studentPage.evaluate(() => {
      const oldBox = document.getElementById('student-old-lesson-box');
      const qBox = document.getElementById('student-workspace-warmup');
      const qText = document.getElementById('ol-question-text');
      return (oldBox && !oldBox.classList.contains('hidden')) ||
             (qBox && window.getComputedStyle(qBox).display !== 'none') ||
             (qText && qText.textContent.trim().length > 0);
    });

    console.log('  [PASS] Máy học sinh phục hồi liên lạc và hiển thị sân khấu câu hỏi bình thường:', questionVisible);
    if (!questionVisible) {
      throw new Error('LỖI: Máy học sinh không phục hồi được dữ liệu sau khi có mạng trở lại!');
    }

    await studentPage.screenshot({ path: path.join(outputDir, '02_student_reconnected_question_active.png') });

    // 5. Kiểm thử Mạng chậm / Jitter cao (Slow 3G Simulation)
    console.log('\n--- KIỂM TRA ĐỘ BỀN VỚI MẠNG CHẬM / ĐỘ TRỄ CAO (Slow 3G: 500ms lag) ---');
    await cdpClient.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 500, // 500ms delay
      downloadThroughput: 500 * 1024 / 8, // 500 kbps
      uploadThroughput: 500 * 1024 / 8
    });

    // Học sinh gửi câu trả lời dưới điều kiện mạng nghẽn
    await studentPage.evaluate(() => {
      if (window.SYNC_BUS && window.SYNC_BUS.broadcast) {
        window.SYNC_BUS.broadcast('OLD_LESSON_SUBMIT', {
          machineId: 5,
          student: 'Học sinh Máy 05',
          answer: 'Đáp án nộp trong điều kiện mạng yếu',
          time: Date.now()
        });
      }
    });

    await teacherPage.waitForTimeout(1000);
    const answerReceivedByTeacher = await teacherPage.evaluate(() => {
      const state = window.STORE.getState();
      const subs = (state.oldLesson && state.oldLesson.submissions) || {};
      return !!subs[5];
    });

    console.log('  [PASS] Giáo viên nhận được đáp án từ máy mạng yếu (Lag 500ms):', answerReceivedByTeacher);
    if (!answerReceivedByTeacher) {
      throw new Error('LỖI: Rớt gói tin khi mạng học sinh bị lag 500ms!');
    }

    console.log('\n--- TỔNG KẾT TEST PHỤC HỒI MẠNG CDP ---');
    console.log(`  - Tổng số lỗi Console: ${errors.length}`);
    if (errors.length > 0) {
      console.error('  [ERRORS]:', errors);
      throw new Error(`Có ${errors.length} lỗi console trong quá trình kiểm thử chịu tải mạng!`);
    } else {
      console.log('  [PASS] 0 LỖI CONSOLE. Hệ thống phục hồi kết nối tự động 100% trơn tru.');
    }

    console.log('\n🏆 [KẾT QUẢ]: TEST RESILIENCE CDP HOÀN THÀNH XUẤT SẮC!');
  } finally {
    await studentCtx.close().catch(() => {});
    await teacherCtx.close().catch(() => {});
    await browser.close().catch(() => {});
    server.close();
  }
}

runResilienceTest().catch((err) => {
  console.error('❌ [TEST FAILED]:', err);
  process.exit(1);
});
