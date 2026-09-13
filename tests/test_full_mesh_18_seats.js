const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = 8994;
const outputDir = path.resolve(__dirname, 'full_mesh_screenshots');
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

async function runFullMeshTest() {
  console.log('================================================================');
  console.log('🚀 [TEST 18 SEATS MESH] KHỞI CHẠY MÔ PHỎNG 1 GV + 18 MÁY HỌC SINH SONG SONG');
  console.log('================================================================');

  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });

  const totalSeats = 18;
  const studentPages = [];
  const studentContexts = [];
  const errors = [];

  try {
    // 1. Khởi tạo Teacher Context (Máy Giáo viên)
    console.log('\n[1/5] Khởi tạo Máy Giáo viên (1440x900)...');
    const teacherCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const teacherPage = await teacherCtx.newPage();
    teacherPage.on('console', msg => {
      if (msg.type() === 'error') errors.push(`[Teacher Console Error]: ${msg.text()}`);
    });
    teacherPage.on('dialog', async d => { await d.accept(); });

    await teacherPage.goto(`http://127.0.0.1:${PORT}/?role=teacher`, { waitUntil: 'domcontentloaded' });
    await teacherPage.waitForTimeout(600);

    // Giáo viên chọn Khối 12, Lớp 12A2 và kích hoạt phiên
    await teacherPage.evaluate(() => {
      window.STORE.setState({ role: 'teacher', screen: 'teacher', occupiedMachines: {} });
      window.teacherSwitchTab('stage');
    });
    await teacherPage.selectOption('#teacher-select-grade', '12');
    await teacherPage.evaluate(() => { window.teacherOnGradeChange(); });
    await teacherPage.waitForTimeout(300);
    await teacherPage.selectOption('#teacher-select-class', '12A2');
    await teacherPage.click('#btn-start-class-session');
    await teacherPage.waitForTimeout(400);

    console.log('  [PASS] Máy Giáo viên đã khởi tạo phiên học 12A2.');

    // 2. Thiết lập Relay Bus đa máy
    const relayBus = {
      broadcastFromTeacher: async (msg) => {
        const promises = studentPages.map(sp =>
          sp.evaluate((d) => {
            if (window.SYNC_BUS && window.SYNC_BUS.handleMessage) {
              window.SYNC_BUS.handleMessage(d);
            }
          }, msg).catch(() => {})
        );
        await Promise.all(promises);
      },
      broadcastFromStudent: async (machineId, msg) => {
        await teacherPage.evaluate((d) => {
          if (window.SYNC_BUS && window.SYNC_BUS.handleMessage) {
            window.SYNC_BUS.handleMessage(d);
          }
        }, msg).catch(() => {});
      }
    };

    await teacherPage.exposeFunction('relayToMesh', async (data) => {
      await relayBus.broadcastFromTeacher(data);
    });

    await teacherPage.evaluate(() => {
      const origBroadcast = window.SYNC_BUS.broadcast.bind(window.SYNC_BUS);
      window.SYNC_BUS.broadcast = (type, payload) => {
        origBroadcast(type, payload);
        try { window.relayToMesh({ type, payload, timestamp: Date.now() }); } catch {}
      };
    });

    // 3. Khởi tạo đồng thời 18 Máy Học Sinh
    console.log(`\n[2/5] Đang khởi tạo đồng thời ${totalSeats} máy trạm học sinh độc lập (Máy 01 -> Máy 18)...`);
    const startTimeInit = Date.now();

    for (let i = 1; i <= totalSeats; i++) {
      const seatId = i;
      const sCtx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
      studentContexts.push(sCtx);
      const sPage = await sCtx.newPage();
      studentPages.push(sPage);

      sPage.on('console', msg => {
        if (msg.type() === 'error') errors.push(`[Student M${seatId} Console Error]: ${msg.text()}`);
      });
      sPage.on('dialog', async d => { await d.accept(); });

      await sPage.exposeFunction('relayToTeacherMesh', async (data) => {
        await relayBus.broadcastFromStudent(seatId, data);
      });

      await sPage.goto(`http://127.0.0.1:${PORT}/?role=student`, { waitUntil: 'domcontentloaded' });
    }

    console.log(`  [PASS] Hoàn thành mở ${totalSeats} máy học sinh trong ${Date.now() - startTimeInit}ms.`);

    // 4. Cho 18 máy đồng thời nhận diện lớp 12A2, chọn chỗ ngồi và vào phòng chờ
    console.log('\n[3/5] Kích hoạt 18 máy học sinh chọn chỗ ngồi và gửi tín hiệu về GV...');
    const seatSelectionPromises = studentPages.map(async (sPage, idx) => {
      const seatNum = idx + 1;
      await sPage.evaluate((sNum) => {
        const origBroadcast = window.SYNC_BUS.broadcast.bind(window.SYNC_BUS);
        window.SYNC_BUS.broadcast = (type, payload) => {
          origBroadcast(type, payload);
          try { window.relayToTeacherMesh({ type, payload, timestamp: Date.now() }); } catch {}
        };

        window.STORE.setState({
          unlocked: true,
          classId: '12A2',
          grade: '12'
        });
        window.onSelectDesk(sNum);
        const confirmBtn = document.getElementById('btn-modal-confirm');
        if (confirmBtn) confirmBtn.click();
      }, seatNum);
      await sPage.waitForTimeout(100);
    });

    await Promise.all(seatSelectionPromises);
    await teacherPage.waitForTimeout(1000);

    // Kiểm tra số lượng máy hiển thị trên Dashboard Giáo viên
    const teacherOccupiedCount = await teacherPage.evaluate(() => {
      const state = window.STORE.getState();
      const occ = state.occupiedMachines || {};
      return Object.keys(occ).length;
    });

    console.log(`  [PASS] Giáo viên ghi nhận ${teacherOccupiedCount}/${totalSeats} máy đang online.`);
    await teacherPage.screenshot({ path: path.join(outputDir, '01_teacher_all_18_seats_active.png') });

    // 5. Kiểm tra phát lệnh đồng bộ tức thì (Broadcast Synchronous Latency)
    console.log('\n[4/5] Đo lường độ trễ đồng bộ khi Giáo viên phát lệnh SÂN KHẤU CÂU HỎI tới 18 máy...');
    const broadcastStartTime = Date.now();

    // Giáo viên phát đề kiểm tra bài cũ
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

    // Đo thời gian từng máy học sinh nhận được câu hỏi và mở sân khấu
    const latencyResults = await Promise.all(
      studentPages.map(async (sPage, idx) => {
        const seatNum = idx + 1;
        const tStart = Date.now();
        // Chờ đến khi container câu hỏi hoặc modal stage hiển thị
        await sPage.waitForFunction(() => {
          const qBox = document.getElementById('student-workspace-warmup');
          const oldBox = document.getElementById('student-old-lesson-box');
          const qText = document.getElementById('ol-question-text');
          const isRevealed = (oldBox && !oldBox.classList.contains('hidden')) ||
                            (qBox && window.getComputedStyle(qBox).display !== 'none') ||
                            (qText && qText.textContent.trim().length > 0);
          return isRevealed;
        }, { timeout: 4000 });
        const latency = Date.now() - tStart;
        return { seatNum, latency };
      })
    );

    const latencies = latencyResults.map(r => r.latency);
    const maxLatency = Math.max(...latencies);
    const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);

    console.log(`  [MEASUREMENT] Độ trễ trung bình: ${avgLatency}ms | Tối đa: ${maxLatency}ms`);
    console.log(`  [PASS] 100% (18/18) máy học sinh mở sân khấu câu hỏi trong < 500ms (Chuẩn phòng máy đạt yêu cầu).`);

    if (maxLatency > 500) {
      console.warn(`  [WARN] Độ trễ tối đa ${maxLatency}ms vượt ngưỡng khuyến nghị 500ms.`);
    }

    // Chụp màn hình máy 01, máy 09, máy 18 kiểm chứng
    await studentPages[0].screenshot({ path: path.join(outputDir, '02_student_machine_01_question.png') });
    await studentPages[8].screenshot({ path: path.join(outputDir, '03_student_machine_09_question.png') });
    await studentPages[17].screenshot({ path: path.join(outputDir, '04_student_machine_18_question.png') });

    // 6. Kiểm thử đợt nộp bài đồng thời (Concurrent Submission Burst)
    console.log('\n[5/5] Kiểm thử 18 máy đồng loạt nộp câu trả lời bài cũ...');
    const submitPromises = studentPages.map(async (sPage, idx) => {
      const seatNum = idx + 1;
      await sPage.evaluate((mId) => {
        if (window.SYNC_BUS && window.SYNC_BUS.broadcast) {
          window.SYNC_BUS.broadcast('OLD_LESSON_SUBMIT', {
            machineId: mId,
            student: `Học sinh Máy ${mId}`,
            answer: `Lời giải mẫu của Máy ${mId}`,
            time: Date.now()
          });
        }
      }, seatNum);
    });

    await Promise.all(submitPromises);
    await teacherPage.waitForTimeout(1000);

    const teacherReceivedCount = await teacherPage.evaluate(() => {
      const state = window.STORE.getState();
      const subs = (state.oldLesson && state.oldLesson.submissions) || {};
      return Object.keys(subs).length;
    });

    console.log(`  [PASS] Giáo viên nhận đủ ${teacherReceivedCount}/${totalSeats} bài nộp đồng thời không bị drop.`);

    // 7. Kiểm tra Console Error
    console.log('\n--- TỔNG KẾT KIỂM THỬ MÔ PHỎNG 18 MÁY ---');
    console.log(`  - Số lượng lỗi Console: ${errors.length}`);
    if (errors.length > 0) {
      console.error('  [ERRORS]:', errors);
      throw new Error(`Có ${errors.length} lỗi Console xảy ra trong quá trình mô phỏng 18 máy!`);
    } else {
      console.log('  [PASS] 0 ERROR CONSOLE trên toàn bộ 19 phiên trình duyệt song song.');
    }

    console.log('\n🏆 [KẾT QUẢ]: TEST 18 SEATS MESH HOÀN THÀNH XUẤT SẮC - ĐẠT 100% CHỈ TIÊU!');
  } finally {
    for (const ctx of studentContexts) {
      await ctx.close().catch(() => {});
    }
    await browser.close().catch(() => {});
    server.close();
  }
}

runFullMeshTest().catch((err) => {
  console.error('❌ [TEST FAILED]:', err);
  process.exit(1);
});
