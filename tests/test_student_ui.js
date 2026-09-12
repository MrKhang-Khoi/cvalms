const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 8089;
const ROOT = path.resolve(__dirname, '..');

// 1. Máy chủ HTTP tĩnh siêu nhẹ phục vụ file cho Playwright
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(ROOT, reqPath);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath);
  res.writeHead(200, { 
    'Content-Type': MIME_TYPES[ext] || 'text/plain',
    'Access-Control-Allow-Origin': '*'
  });
  fs.createReadStream(filePath).pipe(res);
});

async function runTests() {
  console.log('🚀 Bắt đầu Chạy Quy trình Kiểm thử Playwright Headless...');
  
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`📡 Local Test Server đang chạy tại: http://localhost:${PORT}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[Console Error]: ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(`[Page Error]: ${err.message}`);
  });

  try {
    // 1. Mở trang với tham số cấu hình số máy ?set_machine=4
    console.log('--- Bước 1: Kiểm tra Nhận diện Máy bàn số 4 ---');
    await page.goto(`http://localhost:${PORT}/index.html?set_machine=4`, { waitUntil: 'networkidle' });

    const badgeText = await page.textContent('#sh-machine-badge');
    console.log(`✅ Badge hiển thị: "${badgeText}"`);
    if (!badgeText.includes('Máy 4')) throw new Error(`Badge không hiển thị đúng Máy 4, nhận được: ${badgeText}`);

    // 2. Chuyển sang View Seating (Điểm danh đôi theo sơ đồ 10A1)
    console.log('--- Bước 2: Kiểm tra Tự động Map Cặp Học sinh Máy 4 ---');
    await page.evaluate(() => {
      window.STORE = window.STORE || {};
      import('./js/core/store.js').then(({ STORE }) => {
        STORE.setState({
          classId: '10A1',
          sessionStatus: 'running',
          currentPhase: 'seating'
        });
      });
    });

    await page.waitForTimeout(500);
    const cardTitle = await page.textContent('#seating-card-title');
    const pairText = await page.textContent('#seating-pair-names');
    console.log(`✅ Tiêu đề thẻ điểm danh: "${cardTitle}"`);
    console.log(`✅ Cặp học sinh được map: "${pairText.replace(/\s+/g, ' ').trim()}"`);
    if (!pairText.includes('Đỗ Gia Huy') || !pairText.includes('Bùi Phương Mai')) {
      throw new Error(`Sơ đồ không map đúng 2 học sinh của Máy 4 lớp 10A1`);
    }

    await page.screenshot({ path: path.join(__dirname, 'screenshots', 'phase0_seating.png') });
    console.log('📸 Đã chụp ảnh màn hình: phase0_seating.png');

    // 3. Học sinh bấm xác nhận vào học
    console.log('--- Bước 3: Kiểm tra Bấm Điểm danh Vào học ---');
    await page.click('#btn-confirm-checkin');
    await page.waitForTimeout(300);
    const readyTitle = await page.textContent('#st-view-ready h2');
    console.log(`✅ Trạng thái sau điểm danh: "${readyTitle}"`);
    if (!readyTitle.includes('Đã sẵn sàng')) throw new Error('Không chuyển sang màn hình sẵn sàng sau điểm danh');

    // 4. Kiểm tra nút SOS ✋
    console.log('--- Bước 4: Kiểm tra Nút Giơ tay Xin trợ giúp (SOS) ---');
    await page.click('#btn-student-sos');
    await page.waitForTimeout(200);
    const sosActive = await page.evaluate(() => document.getElementById('btn-student-sos').classList.contains('active'));
    console.log(`✅ Nút SOS kích hoạt thành công: ${sosActive}`);
    if (!sosActive) throw new Error('Nút SOS không chuyển sang trạng thái kích hoạt');

    // 5. Kiểm tra Chặng 1: Quick Poll A-B-C-D
    console.log('--- Bước 5: Kiểm tra Chặng 1 Khởi động Quick Poll ---');
    await page.evaluate(() => {
      import('./js/core/store.js').then(({ STORE }) => {
        STORE.setState({
          currentPhase: 'warmup',
          lessonData: {
            warmup: {
              question: "Quan sát đoạn mã Python sau và cho biết kết quả:",
              code: "s = 'Tin hoc'\nprint(s[4:])",
              options: { A: "'Tin'", B: "'hoc'", C: "'h'", D: "Lỗi IndexError" }
            }
          }
        });
      });
    });

    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(__dirname, 'screenshots', 'phase1_warmup.png') });
    console.log('📸 Đã chụp ảnh màn hình: phase1_warmup.png');

    // Bấm chọn đáp án B
    await page.click('.poll-opt-btn[data-choice="B"]');
    await page.waitForTimeout(200);
    const statusMsg = await page.textContent('#poll-status-msg');
    console.log(`✅ Thông điệp sau khi chọn: "${statusMsg.trim()}"`);
    if (!statusMsg.includes('Đáp án B') || !statusMsg.includes('Chờ giáo viên công bố')) {
      throw new Error('Chặng 1 không hiển thị đúng trạng thái chọn đáp án B');
    }

    // 6. Kiểm tra Chặng 2: Thẻ lý thuyết PWA NotebookLM
    console.log('--- Bước 6: Kiểm tra Chặng 2 Thẻ lý thuyết PWA ---');
    await page.evaluate(() => {
      import('./js/core/store.js').then(({ STORE }) => {
        STORE.setState({
          currentPhase: 'theory',
          lessonData: {
            theory: [
              { id: 'c1', title: '1. Khái niệm Xâu', summary: 'Xâu là dãy ký tự đặt trong ngoặc nháy.', code: 's = "Python"\nprint(len(s))' },
              { id: 'c2', title: '2. Cắt xâu (Slicing)', summary: 'Cú pháp cắt s[start:end]', code: 'print(s[1:4])' }
            ]
          }
        });
      });
    });

    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(__dirname, 'screenshots', 'phase2_theory.png') });
    console.log('📸 Đã chụp ảnh màn hình: phase2_theory.png');
    const theoryCardsCount = await page.locator('.theory-card').count();
    console.log(`✅ Số thẻ lý thuyết kết xuất thành công: ${theoryCardsCount}`);
    if (theoryCardsCount !== 2) throw new Error('Không kết xuất đúng 2 thẻ lý thuyết');

    // 7. Kiểm tra Chặng 3: Thảo luận & Thực hành Nhóm đôi
    console.log('--- Bước 7: Kiểm tra Chặng 3 Thảo luận & Nộp bài ---');
    await page.evaluate(() => {
      import('./js/core/store.js').then(({ STORE }) => {
        STORE.setState({
          currentPhase: 'discussion',
          lessonData: {
            discussion: {
              title: "Nhiệm vụ: Cắt xâu và đếm ký tự",
              task: "Viết các lệnh Python để cắt xâu 'nam moi' từ xâu s."
            },
            theory: [
              { id: 'c1', title: 'Tham khảo: Cắt xâu', code: 's[start:end]' }
            ]
          }
        });
      });
    });

    await page.waitForTimeout(500);
    // Nhập bài làm vào textarea
    await page.fill('#disc-answer-input', "s = 'chuc mung nam moi 2026'\nprint(s[10:17])");
    await page.click('#btn-submit-discussion');
    await page.waitForTimeout(300);

    const submitStatus = await page.textContent('#disc-submission-status');
    console.log(`✅ Trạng thái sau nộp bài: "${submitStatus.trim()}"`);
    if (!submitStatus.includes('Đã nộp bài lúc')) {
      throw new Error('Chưa cập nhật trạng thái đã nộp bài thành công');
    }
    await page.screenshot({ path: path.join(__dirname, 'screenshots', 'phase3_discussion.png') });
    console.log('📸 Đã chụp ảnh màn hình: phase3_discussion.png');

    // KIỂM TRA ĐIỀU KIỆN TIÊN QUYẾT: CONSOLE F12 SẠCH 100%
    console.log('--- Bước 8: Kiểm tra Nhật ký Console F12 (Zero-Bug Trap) ---');
    console.log(`📊 Tổng số lỗi đỏ Console: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.error('❌ PHÁT HIỆN LỖI CONSOLE:', consoleErrors);
      throw new Error(`Test thất bại vì phát hiện ${consoleErrors.length} lỗi đỏ Console!`);
    }

    console.log('🎉 TẤT CẢ 8 BƯỚC KIỂM THỬ PLAYWRIGHT ĐỀU PASS 100%! CONSOLE SẠCH 0 LỖI.');
  } finally {
    await browser.close();
    server.close();
  }
}

runTests().catch(err => {
  console.error('❌ KIỂM THỬ THẤT BẠI:', err.message);
  process.exit(1);
});
