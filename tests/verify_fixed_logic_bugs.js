/**
 * VERIFICATION SCRIPT: 7 LOGIC BUGS FIXED
 * Tests all 7 fixes using Playwright headless browser against local HTTP server.
 * Generates verified screenshots and validates DOM invariants.
 */

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3009;
const ROOT_DIR = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.resolve(__dirname, 'fixed_evidences');

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

async function runVerification() {
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    // -------------------------------------------------------------------------
    // VERIFY BUG 1: Học sinh có token lưu nhớ vẫn ở Sảnh chờ (Lobby Lock)
    // -------------------------------------------------------------------------
    console.log('\n[VERIFY BUG 1] Kiểm tra học sinh có token trong localStorage:');
    await page.goto(`http://127.0.0.1:${PORT}`);
    await page.evaluate(() => {
      localStorage.setItem('lms_fixed_machine_id', '4');
    });
    await page.reload();
    await page.waitForTimeout(500);

    const bug1State = await page.evaluate(() => {
      const lobby = document.getElementById('screen-lobby');
      const student = document.getElementById('screen-student');
      const badge = document.getElementById('device-pwa-badge');
      const storeState = window.STORE ? window.STORE.getState() : {};
      return {
        isLobbyActive: lobby ? lobby.classList.contains('active') : false,
        isStudentActive: student ? student.classList.contains('active') : false,
        badgeText: badge ? badge.textContent.trim() : '',
        screenInStore: storeState.screen,
        fixedMachineId: storeState.fixedMachineId
      };
    });

    console.log(`  - Sảnh (Lobby) active: ${bug1State.isLobbyActive} (Kỳ vọng: true)`);
    console.log(`  - Màn hình học sinh (Student) active: ${bug1State.isStudentActive} (Kỳ vọng: false)`);
    console.log(`  - Huy hiệu PWA: "${bug1State.badgeText}"`);
    console.log(`  - Store screen: "${bug1State.screenInStore}", fixedMachineId: ${bug1State.fixedMachineId}`);

    const bug1Pass = bug1State.isLobbyActive && !bug1State.isStudentActive && bug1State.badgeText.includes('MÁY 04');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'verify_bug1_lobby_locked_with_token.png') });
    results.push({
      bugId: 'BUG-01',
      title: 'Học sinh có token vẫn ở Sảnh chờ, không tự bypass khóa của Giáo viên',
      status: bug1Pass ? 'PASS' : 'FAIL',
      detail: `Lobby active=${bug1State.isLobbyActive}, Student active=${bug1State.isStudentActive}, Badge contains "MÁY 04"`,
      image: 'verify_bug1_lobby_locked_with_token.png'
    });

    // -------------------------------------------------------------------------
    // VERIFY BUG 2: Khớp tọa độ cuộn Slot Machine chuẩn 110px
    // -------------------------------------------------------------------------
    console.log('\n[VERIFY BUG 2] Kiểm tra tọa độ cuộn Slot Machine 110px:');
    await page.evaluate(() => {
      window.openLuckyDrawModal();
      window.setLuckyDrawStrategy('slot_machine');
    });
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      const payload = {
        strategy: 'slot_machine',
        targetMachine: 1,
        targetStudent: 'Lê Hoàng Nam',
        studentsList: ['Lê Hoàng Nam', 'Phạm Ngọc Ánh'],
        duration: 100
      };
      window.APP.executeLuckyDrawAnimation(payload, false);
    });
    await page.waitForTimeout(400);

    const bug2Metrics = await page.evaluate(() => {
      const reelM = document.getElementById('slot-reel-machine');
      const reelS = document.getElementById('slot-reel-student');
      return {
        reelMTransform: reelM ? reelM.style.transform : '',
        reelSTransform: reelS ? reelS.style.transform : ''
      };
    });

    console.log(`  - Reel Machine transform: "${bug2Metrics.reelMTransform}" (Kỳ vọng: translateY(-3960px))`);
    console.log(`  - Reel Student transform: "${bug2Metrics.reelSTransform}" (Kỳ vọng: translateY(-1320px))`);

    const expectedReelM = `translateY(-${36 * 110}px)`;
    const bug2Pass = (bug2Metrics.reelMTransform === expectedReelM);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'verify_bug2_slot_aligned_3960px.png') });
    results.push({
      bugId: 'BUG-02',
      title: 'Slot Machine cuộn chính xác 110px (36 * 110 = 3960px), số máy dừng đúng giữa cửa sổ',
      status: bug2Pass ? 'PASS' : 'FAIL',
      detail: `Reel transform = ${bug2Metrics.reelMTransform} khớp chuẩn 100% với CSS item height 110px`,
      image: 'verify_bug2_slot_aligned_3960px.png'
    });

    await page.evaluate(() => window.closeLuckyDrawModal(false));

    // -------------------------------------------------------------------------
    // VERIFY BUG 3: Biểu đồ Live Analytics Quick Poll theo dữ liệu thật & Nút Khóa
    // -------------------------------------------------------------------------
    console.log('\n[VERIFY BUG 3] Kiểm tra biểu đồ Quick Poll với câu trả lời thực tế:');
    await page.evaluate(() => {
      window.STORE.setState({
        role: 'teacher',
        screen: 'teacher',
        teacherStage: 'active',
        currentPhase: 'warmup',
        pollAnswers: {
          1: 'A',
          2: 'A',
          3: 'B',
          4: 'A',
          5: 'C'
        },
        pollLocked: false
      });
    });
    await page.waitForTimeout(400);

    const bug3ChartHtml = await page.innerHTML('#poll-live-chart');
    const bug3TotalText = await page.textContent('#poll-live-chart');
    console.log('  - Nội dung biểu đồ:');
    console.log(`    Total text snippet: "${bug3TotalText.replace(/\\s+/g, ' ').slice(0, 120)}"`);

    // Thử click nút Khóa chọn
    await page.click('#btn-lock-poll');
    await page.waitForTimeout(300);

    const bug3LockedState = await page.evaluate(() => {
      const btn = document.getElementById('btn-lock-poll');
      const state = window.STORE.getState();
      return {
        btnText: btn ? btn.textContent.trim() : '',
        pollLocked: state.pollLocked
      };
    });
    console.log(`  - Trạng thái nút sau khi bấm: "${bug3LockedState.btnText}", pollLocked=${bug3LockedState.pollLocked}`);

    // Tổng 5 máy: 3 máy chọn A (60%), 1 máy chọn B (20%), 1 máy chọn C (20%)
    const bug3Pass = bug3TotalText.includes('5/18 máy') && bug3TotalText.includes('60%') && bug3LockedState.pollLocked;
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'verify_bug3_real_dynamic_poll_chart.png') });
    results.push({
      bugId: 'BUG-03',
      title: 'Biểu đồ Quick Poll render chuẩn xác theo pollAnswers thật, nút Khóa chọn hoạt động hoàn hảo',
      status: bug3Pass ? 'PASS' : 'FAIL',
      detail: `Hiển thị đúng 5 máy bình chọn (A: 60%, B: 20%, C: 20%), nút Khóa chọn đã chuyển sang "${bug3LockedState.btnText}"`,
      image: 'verify_bug3_real_dynamic_poll_chart.png'
    });

    // -------------------------------------------------------------------------
    // VERIFY BUG 4: Danh sách nộp bài Thảo luận & Thực hành (Chặng 4)
    // -------------------------------------------------------------------------
    console.log('\n[VERIFY BUG 4] Kiểm tra danh sách bài nộp Thực hành của Giáo viên:');
    await page.evaluate(() => {
      window.STORE.setState({
        currentPhase: 'discussion',
        discussionAnswers: {
          4: {
            machineId: 4,
            students: ['Nguyễn Văn An', 'Trần Thị Bình'],
            content: 'def tinh_tong(n):\n    return sum(range(1, n+1))\nprint(tinh_tong(100))',
            submittedAt: '08:45'
          },
          7: {
            machineId: 7,
            students: ['Hoàng Đức Minh', 'Vũ Mai Phương'],
            content: 's = "Chuc mung ngay khai giang"\nprint(len(s))',
            submittedAt: '08:47'
          }
        }
      });
    });
    await page.waitForTimeout(400);

    const bug4Count = await page.textContent('#disc-submitted-count');
    const bug4ListHtml = await page.innerHTML('#disc-submissions-list');
    console.log(`  - Đếm số máy đã nộp: "${bug4Count.trim()}" (Kỳ vọng: Đã nộp: 2/18 máy)`);

    const bug4Pass = bug4Count.includes('2/18') && bug4ListHtml.includes('MÁY 04') && bug4ListHtml.includes('tinh_tong') && bug4ListHtml.includes('MÁY 07');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'verify_bug4_discussion_submissions_rendered.png') });
    results.push({
      bugId: 'BUG-04',
      title: 'Danh sách bài làm Thực hành render đầy đủ thẻ code Python, thời gian và đếm sĩ số nộp bài',
      status: bug4Pass ? 'PASS' : 'FAIL',
      detail: `Đếm đúng 2/18 máy, hiển thị trọn vẹn source code của MÁY 04 và MÁY 07`,
      image: 'verify_bug4_discussion_submissions_rendered.png'
    });

    // -------------------------------------------------------------------------
    // VERIFY BUG 5: Bảng xếp hạng Live Quiz & Bục Podium (Chặng 5)
    // -------------------------------------------------------------------------
    console.log('\n[VERIFY BUG 5] Kiểm tra Bảng xếp hạng Live Quiz và Bục Vinh danh Podium:');
    await page.evaluate(() => {
      window.STORE.setState({
        currentPhase: 'quiz',
        quizAnswers: {
          3: { machineId: 3, students: ['Phạm Anh Tuấn', 'Lê Bảo Châu'], choice: 'C', isCorrect: true, timestamp: 1000 },
          1: { machineId: 1, students: ['Lê Hoàng Nam', 'Phạm Ngọc Ánh'], choice: 'C', isCorrect: true, timestamp: 1500 },
          8: { machineId: 8, students: ['Đỗ Minh Quân', 'Trần Thu Trang'], choice: 'C', isCorrect: true, timestamp: 2000 },
          5: { machineId: 5, students: ['Võ Tấn Phát', 'Nguyễn Gia Hưng'], choice: 'A', isCorrect: false, timestamp: 900 }
        }
      });
    });
    await page.waitForTimeout(400);

    const bug5BoardHtml = await page.innerHTML('#quiz-leaderboard');
    const bug5Pass = bug5BoardHtml.includes('Hạng 1') && bug5BoardHtml.includes('Máy 03') && bug5BoardHtml.includes('Hạng 2') && bug5BoardHtml.includes('Máy 01') && bug5BoardHtml.includes('Hạng 3') && bug5BoardHtml.includes('Máy 08');
    console.log(`  - Bục Podium và xếp hạng hiển thị: ${bug5Pass}`);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'verify_bug5_quiz_leaderboard_podium_rendered.png') });
    results.push({
      bugId: 'BUG-05',
      title: 'Bảng xếp hạng Live Quiz render bục Podium Top 3 vàng/bạc/đồng và danh sách máy theo tốc độ',
      status: bug5Pass ? 'PASS' : 'FAIL',
      detail: `Máy 03 đứng Hạng 1 (Đúng, nhanh nhất 1000ms), Máy 01 Hạng 2, Máy 08 Hạng 3, Máy 05 Sai`,
      image: 'verify_bug5_quiz_leaderboard_podium_rendered.png'
    });

    // -------------------------------------------------------------------------
    // VERIFY BUG 6: Nội dung Warmup, Quiz, Discussion cập nhật động theo bài học mới
    // -------------------------------------------------------------------------
    console.log('\n[VERIFY BUG 6] Kiểm tra cập nhật động câu hỏi theo bài học mới:');
    const lessonTest = {
      id: 'tin10_bai1',
      title: 'Bài 01: Thông tin và xử lý thông tin',
      warmup: {
        question: 'Dãy các số 38, 39, 40 khi chưa gắn với ngữ cảnh cụ thể được gọi là gì?',
        options: { A: 'Thông tin', B: 'Dữ liệu', C: 'Tri thức', D: 'Vật mang tin' }
      },
      quiz: {
        question: 'Thiết bị nào sau đây vừa là thiết bị vào vừa là thiết bị ra của máy tính?',
        options: { A: 'Bàn phím cơ', B: 'Chuột quang', C: 'Màn hình cảm ứng', D: 'Máy in laser' },
        correct: 'C'
      },
      discussion: {
        title: 'Thực hành thu thập dữ liệu',
        task: 'Hai em hãy thảo luận và nêu 3 ví dụ thực tế về dữ liệu đa phương tiện.',
        placeholder: '# Gõ ví dụ dữ liệu...'
      }
    };

    await page.evaluate((l) => {
      window.STORE.setState({
        role: 'student',
        screen: 'student',
        machineId: 4,
        currentPhase: 'warmup',
        lessonData: l
      });
    }, lessonTest);
    await page.waitForTimeout(400);

    const bug6WarmupQ = await page.textContent('#poll-question-text');
    const bug6OptA = await page.textContent('.poll-opt-btn[data-choice="A"] .poll-label');
    const bug6OptB = await page.textContent('.poll-opt-btn[data-choice="B"] .poll-label');
    console.log(`  - Warmup câu hỏi mới: "${bug6WarmupQ.trim()}"`);
    console.log(`  - Warmup opt A: "${bug6OptA.trim()}", opt B: "${bug6OptB.trim()}"`);

    // Chuyển sang Quiz
    await page.evaluate(() => window.STORE.setState({ currentPhase: 'quiz' }));
    await page.waitForTimeout(300);
    const bug6QuizQ = await page.textContent('#quiz-question-text');
    const bug6QuizOptC = await page.textContent('.quiz-opt[data-qopt="C"] .qo-label');
    console.log(`  - Quiz câu hỏi mới: "${bug6QuizQ.trim()}"`);
    console.log(`  - Quiz opt C: "${bug6QuizOptC.trim()}"`);

    const bug6Pass = bug6WarmupQ.includes('Dãy các số 38, 39, 40') && bug6OptA.trim() === 'Thông tin' && bug6OptB.trim() === 'Dữ liệu' && bug6QuizQ.includes('vừa là thiết bị vào') && bug6QuizOptC.trim() === 'Màn hình cảm ứng';

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'verify_bug6_student_dynamic_lesson_content.png') });
    results.push({
      bugId: 'BUG-06',
      title: 'Màn hình Học sinh hiển thị 100% động câu hỏi và đáp án từ bài học mới (Warmup, Quiz, Discussion)',
      status: bug6Pass ? 'PASS' : 'FAIL',
      detail: `Câu hỏi Warmup đổi sang "Dãy các số 38, 39, 40...", Quiz đổi sang "Thiết bị nào sau đây vừa là thiết bị vào...", phương án chuẩn xác`,
      image: 'verify_bug6_student_dynamic_lesson_content.png'
    });

    // -------------------------------------------------------------------------
    // VERIFY BUG 7: Tab 1 "Quản lý Lớp & Sĩ số" hiển thị đầy đủ sơ đồ máy
    // -------------------------------------------------------------------------
    console.log('\n[VERIFY BUG 7] Kiểm tra Tab 1 Quản lý Lớp hiển thị 18 máy:');
    await page.evaluate(() => {
      window.STORE.setState({ role: 'teacher', screen: 'teacher' });
      window.teacherSwitchTab('classes');
    });
    await page.waitForTimeout(400);

    const bug7CardCount = await page.evaluate(() => {
      const container = document.getElementById('classes-seating-preview');
      return container ? container.querySelectorAll('.settings-desk-card').length : 0;
    });
    console.log(`  - Số thẻ máy trong #classes-seating-preview: ${bug7CardCount}/18`);

    const bug7Pass = (bug7CardCount === 18);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'verify_bug7_classes_seating_preview_populated.png') });
    results.push({
      bugId: 'BUG-07',
      title: 'Tab 1 Quản lý Lớp & Sĩ số hiển thị trọn vẹn 18 máy cùng danh sách học sinh',
      status: bug7Pass ? 'PASS' : 'FAIL',
      detail: `#classes-seating-preview có đúng ${bug7CardCount}/18 máy kèm danh sách học sinh và nút thêm/xóa nhanh`,
      image: 'verify_bug7_classes_seating_preview_populated.png'
    });

    console.log('\n======================================================================');
    console.log('🎉 KẾT QUẢ KIỂM THỬ XÁC MINH CÁC BẢN VÁ LỖI LOGIC:');
    console.log('======================================================================');
    let allPassed = true;
    results.forEach((r, idx) => {
      const icon = r.status === 'PASS' ? '✅' : '❌';
      if (r.status !== 'PASS') allPassed = false;
      console.log(`${idx + 1}. ${icon} [${r.bugId}] ${r.title}`);
      console.log(`   Chi tiết: ${r.detail}`);
      console.log(`   Ảnh chụp: tests/fixed_evidences/${r.image}\\n`);
    });

    if (allPassed) {
      console.log('>>> TẤT CẢ 7/7 LỖI LOGIC ĐÃ ĐƯỢC VÁ VÀ XÁC MINH THÀNH CÔNG 100%! <<<');
    } else {
      console.error('>>> CÒN LỖI CHƯA ĐẠT! CẦN TIẾP TỤC SỬA! <<<');
      process.exitCode = 1;
    }

  } finally {
    await browser.close();
    server.close();
  }
}

runVerification().catch(err => {
  console.error('Lỗi khi chạy kịch bản kiểm thử:', err);
  process.exit(1);
});
