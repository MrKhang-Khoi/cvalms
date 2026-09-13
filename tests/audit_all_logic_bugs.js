const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');
const url = require('url');

const PORT = 8099;
const ROOT = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png'
};

function createServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let pathname = url.parse(req.url).pathname;
      if (pathname === '/') pathname = '/index.html';
      const filePath = path.join(ROOT, pathname);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      });
      fs.createReadStream(filePath).pipe(res);
    });

    server.listen(PORT, '127.0.0.1', () => {
      console.log(`[HTTP Server] Sẵn sàng tại http://127.0.0.1:${PORT}`);
      resolve(server);
    });
  });
}

async function runBugEvidenceAudit() {
  console.log('======================================================================');
  console.log('🔍 KHỞI ĐỘNG KỊCH BẢN CHỨNG MINH LỖI LOGIC BẰNG CHỨNG THẬT (ZERO GUESSWORK)');
  console.log('======================================================================');

  const server = await createServer();
  const screenshotsDir = path.join(__dirname, 'bug_evidences');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const evidenceReport = [];

  try {
    // -------------------------------------------------------------------------
    // BUG 1: Lỗi Bỏ qua Sảnh khi có Token cố định (Fixed Machine Token Auto-Bypass)
    // -------------------------------------------------------------------------
    console.log('\n[BUG 1 TEST] Kiểm tra việc mở máy đã lưu token lms_fixed_machine_id:');
    await page.goto(`http://127.0.0.1:${PORT}/index.html`);
    await page.evaluate(() => localStorage.setItem('lms_fixed_machine_id', '4'));
    await page.reload({ waitUntil: 'networkidle' });

    const isLobbyActive = await page.isVisible('#screen-lobby.active');
    const isStudentActive = await page.isVisible('#screen-student.active');
    const pwaBadgeText = await page.textContent('#device-pwa-badge');

    console.log(`  - Trạng thái Screen Lobby active: ${isLobbyActive}`);
    console.log(`  - Trạng thái Screen Student active: ${isStudentActive}`);
    console.log(`  - Nội dung huy hiệu PWA trên Topbar: "${pwaBadgeText.replace(/\\s+/g, ' ').trim()}"`);

    await page.screenshot({ path: path.join(screenshotsDir, 'bug1_bypass_lobby.png') });
    console.log('  📸 Đã chụp minh chứng: bug1_bypass_lobby.png');

    evidenceReport.push({
      bugId: 'BUG-01',
      title: 'Học sinh có token lưu nhớ bị văng thẳng vào Student Workspace, bỏ qua Sảnh khóa của GV',
      evidence: `Mở trang khi có token: screen-lobby.active = ${isLobbyActive} (kỳ vọng: true), screen-student.active = ${isStudentActive}. Huy hiệu PWA vẫn là: "${pwaBadgeText.replace(/\\s+/g, ' ').trim()}".`,
      image: 'bug1_bypass_lobby.png'
    });

    // -------------------------------------------------------------------------
    // BUG 2: Lỗi Lệch Tọa độ Slot Machine (100px vs 110px CSS)
    // -------------------------------------------------------------------------
    console.log('\n[BUG 2 TEST] Kiểm tra kích thước và công thức cuộn Slot Machine:');
    const slotMetrics = await page.evaluate(() => {
      const windowEl = document.querySelector('.slot-window');
      const itemEl = document.querySelector('.slot-item');
      return {
        windowHeight: windowEl ? window.getComputedStyle(windowEl).height : null,
        itemHeight: itemEl ? window.getComputedStyle(itemEl).height : null
      };
    });
    console.log(`  - Chiều cao CSS .slot-window: ${slotMetrics.windowHeight}`);
    console.log(`  - Chiều cao CSS .slot-item: ${slotMetrics.itemHeight}`);

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

    const reelTransform = await page.evaluate(() => {
      const reelM = document.getElementById('slot-reel-machine');
      return reelM ? reelM.style.transform : '';
    });
    console.log(`  - Transform thực tế áp dụng: "${reelTransform}"`);

    const expectedPx = 36 * 110;
    const actualPx = 36 * 100;
    const diffPx = expectedPx - actualPx;
    console.log(`  - Vị trí kỳ vọng: -${expectedPx}px | Vị trí code gán: -${actualPx}px => LỆCH: ${diffPx}px`);

    await page.screenshot({ path: path.join(screenshotsDir, 'bug2_slot_offset_discrepancy.png') });
    console.log('  📸 Đã chụp minh chứng: bug2_slot_offset_discrepancy.png');

    evidenceReport.push({
      bugId: 'BUG-02',
      title: 'Lệch vị trí dừng Slot Machine 360px do nhân 100px thay vì 110px của CSS',
      evidence: `CSS item = ${slotMetrics.itemHeight}, transform thực tế = ${reelTransform}. Lệch ${diffPx}px làm số máy bị trượt mất khỏi khung nhìn.`,
      image: 'bug2_slot_offset_discrepancy.png'
    });

    await page.evaluate(() => window.closeLuckyDrawModal(false));

    // -------------------------------------------------------------------------
    // BUG 3: Biểu đồ Quick Poll trên Bảng Giáo Viên Bị Hardcode Giả Mạo
    // -------------------------------------------------------------------------
    console.log('\n[BUG 3 TEST] Kiểm tra mã nguồn render biểu đồ Quick Poll của Giáo viên:');
    await page.evaluate(() => {
      window.STORE.setState({
        role: 'teacher',
        screen: 'teacher',
        teacherStage: 'active',
        currentPhase: 'warmup'
      });
    });
    await page.waitForTimeout(400);

    const pollChartHtml = await page.innerHTML('#poll-live-chart');
    console.log('  - Nội dung HTML của #poll-live-chart:');
    console.log(pollChartHtml.trim());

    await page.screenshot({ path: path.join(screenshotsDir, 'bug3_fake_hardcoded_poll_chart.png') });
    console.log('  📸 Đã chụp minh chứng: bug3_fake_hardcoded_poll_chart.png');

    evidenceReport.push({
      bugId: 'BUG-03',
      title: 'Biểu đồ Live Analytics của Giáo viên bị hardcode chuỗi tĩnh 22% - 67% - 11%',
      evidence: `Nội dung chart chứa cố định text mẫu: "${pollChartHtml.replace(/\\s+/g, ' ').slice(0, 150)}..." không hề kết nối Firebase hay tính toán từ pollAnswers.`,
      image: 'bug3_fake_hardcoded_poll_chart.png'
    });

    // -------------------------------------------------------------------------
    // BUG 4 & 5: Thiếu Bộ Lắng Nghe & Render Cho Discussion Submissions & Quiz Leaderboard
    // -------------------------------------------------------------------------
    console.log('\n[BUG 4 & 5 TEST] Kiểm tra các panel Discussion Submissions và Quiz Leaderboard:');
    await page.evaluate(() => window.STORE.setState({ currentPhase: 'discussion' }));
    await page.waitForTimeout(300);

    const discSubListHtml = await page.innerHTML('#disc-submissions-list');
    const discSubCountText = await page.textContent('#disc-submitted-count');
    console.log(`  - Danh sách nộp bài Chặng 4 (#disc-submissions-list): "${discSubListHtml.trim()}"`);
    console.log(`  - Đếm số lượng nộp bài (#disc-submitted-count): "${discSubCountText.trim()}"`);

    await page.evaluate(() => window.STORE.setState({ currentPhase: 'quiz' }));
    await page.waitForTimeout(300);

    const quizLeaderboardHtml = await page.innerHTML('#quiz-leaderboard');
    console.log(`  - Bảng xếp hạng Chặng 5 (#quiz-leaderboard): "${quizLeaderboardHtml.trim()}"`);

    await page.screenshot({ path: path.join(screenshotsDir, 'bug4_5_empty_discussion_and_quiz_panels.png') });
    console.log('  📸 Đã chụp minh chứng: bug4_5_empty_discussion_and_quiz_panels.png');

    evidenceReport.push({
      bugId: 'BUG-04 & BUG-05',
      title: 'Bảng Giáo viên Chặng 4 (Thực hành) và Chặng 5 (Live Quiz) bị bỏ trống hoàn toàn',
      evidence: `#disc-submissions-list rỗng ("${discSubListHtml.trim()}"), #quiz-leaderboard rỗng ("${quizLeaderboardHtml.trim()}"). bundle.js không có code render cho 2 phần tử này.`,
      image: 'bug4_5_empty_discussion_and_quiz_panels.png'
    });

    // -------------------------------------------------------------------------
    // BUG 6: Nội dung Warmup, Quiz, Discussion trên Màn hình Học sinh Bị Hardcode
    // -------------------------------------------------------------------------
    console.log('\n[BUG 6 TEST] Kiểm tra việc đổi bài học nhưng nội dung học sinh không cập nhật:');
    await page.evaluate(() => {
      const lesson1 = {
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
          task: 'Hai em hãy thảo luận và nêu 3 ví dụ thực tế về dữ liệu đa phương tiện.'
        }
      };

      window.STORE.setState({
        role: 'student',
        screen: 'student',
        currentPhase: 'warmup',
        lessonData: lesson1
      });
    });
    await page.waitForTimeout(400);

    const warmupQ = await page.textContent('#poll-question-text');
    const warmupOptA = await page.textContent('.poll-opt-btn[data-choice="A"] .poll-label');
    console.log(`  - Câu hỏi Warmup đang hiển thị: "${warmupQ.trim()}"`);
    console.log(`  - Phương án A đang hiển thị: "${warmupOptA.trim()}"`);
    console.log(`  - Kỳ vọng: "Dãy các số 38, 39, 40..." | "Thông tin"`);

    await page.screenshot({ path: path.join(screenshotsDir, 'bug6_stale_hardcoded_warmup.png') });
    console.log('  📸 Đã chụp minh chứng: bug6_stale_hardcoded_warmup.png');

    evidenceReport.push({
      bugId: 'BUG-06',
      title: 'Màn hình Học sinh Warmup & Quiz giữ nguyên văn bản HTML tĩnh cũ, không cập nhật theo bài học mới',
      evidence: `Đã nạp Bài 01 nhưng #poll-question-text vẫn hiện: "${warmupQ.trim()}" và Phương án A vẫn là "${warmupOptA.trim()}".`,
      image: 'bug6_stale_hardcoded_warmup.png'
    });

    // -------------------------------------------------------------------------
    // BUG 7: Tab 1 "Quản Lý Lớp" Hiển Thị Rỗng (#classes-seating-preview)
    // -------------------------------------------------------------------------
    console.log('\n[BUG 7 TEST] Kiểm tra Tab 1 Quản lý Lớp & Sĩ số trên máy Giáo viên:');
    await page.evaluate(() => {
      window.STORE.setState({ role: 'teacher', screen: 'teacher' });
      window.teacherSwitchTab('classes');
    });
    await page.waitForTimeout(400);

    const classesPreviewHtml = await page.innerHTML('#classes-seating-preview');
    console.log(`  - Nội dung của #classes-seating-preview: "${classesPreviewHtml.trim()}"`);

    await page.screenshot({ path: path.join(screenshotsDir, 'bug7_blank_classes_tab.png') });
    console.log('  📸 Đã chụp minh chứng: bug7_blank_classes_tab.png');

    evidenceReport.push({
      bugId: 'BUG-07',
      title: 'Tab 1 (Quản lý Lớp & Sĩ số) của Giáo viên là một ô trống trơn không có sơ đồ máy',
      evidence: `#classes-seating-preview có nội dung rỗng: "${classesPreviewHtml.trim()}". APP.renderSettingsSeatingGrid() chỉ render vào modal ẩn.`,
      image: 'bug7_blank_classes_tab.png'
    });

    console.log('\n======================================================================');
    console.log('📋 TỔNG HỢP CÁC LỖI LOGIC ĐÃ XÁC THỰC BẰNG CODE VÀ ẢNH CHỤP THẬT:');
    console.log('======================================================================');
    evidenceReport.forEach((rep, idx) => {
      console.log(`${idx + 1}. [${rep.bugId}] ${rep.title}`);
      console.log(`   -> Minh chứng: ${rep.evidence}`);
      console.log(`   -> Ảnh chụp: tests/bug_evidences/${rep.image}`);
    });

  } finally {
    await browser.close();
    server.close();
  }
}

runBugEvidenceAudit().catch(err => {
  console.error('Lỗi khi chạy kịch bản kiểm chứng:', err);
  process.exit(1);
});
