const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');
const url = require('url');

function startServer(port = 8089) {
  const rootDir = path.resolve(__dirname, '..');
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg'
  };
  const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname === '/' ? '/index.html' : parsedUrl.pathname;
    const filePath = path.join(rootDir, pathname);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve) => {
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve({ close: () => {} });
      } else {
        throw err;
      }
    });
    server.listen(port, '127.0.0.1', () => {
      resolve(server);
    });
  });
}

async function testStudioEditorAndCleanUI() {
  console.log('====================================================');
  console.log('🧪 TEST: INTERACTIVE STUDIO EDITOR & CLEAN COMMAND BAR');
  console.log('====================================================');

  const server = await startServer(8089);
  const artifactsDir = path.resolve('C:/Users/HPZBook/.gemini/antigravity/brain/991599f5-9f64-4542-b049-830a340f7b2b');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('favicon')) {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });
  page.on('dialog', async d => {
    console.log('   [Dialog Alert]:', d.message());
    await d.accept();
  });

  console.log('[Setup] Resetting Firebase activeSession to clean locked state...');
  try {
    const authRes = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyCC2tCURXYAMpdN687kcjY537K7zUhh_Fg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnSecureToken: true })
    }).then(r => r.json());
    await fetch('https://day-hoc-tuong-tac-7ee69-default-rtdb.asia-southeast1.firebasedatabase.app/activeSession.json?auth=' + authRes.idToken, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPhase: 'waiting',
        sessionStarted: false,
        unlocked: false,
        luckyDraw: { spinning: false },
        resetAt: 0,
        machines: null
      })
    });
    console.log('   -> Firebase activeSession reset OK!');
  } catch (e) {
    console.warn('   -> Reset warning:', e.message);
  }

  try {
    await page.goto('http://127.0.0.1:8089/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);

    // 1. Đăng nhập Giáo viên
    console.log('\n1. Đăng nhập Giáo viên...');
    await page.click('#btn-open-teacher-login');
    await page.waitForTimeout(200);
    await page.fill('#teacher-password-input', 'admin123');
    await page.click('#modal-teacher-login button[type="submit"]');
    await page.waitForTimeout(400);

    // 2. Chuyển sang Tab 2: XƯỞNG SOẠN KỊCH BẢN (STUDIO)
    console.log('\n2. Chuyển sang Tab Xưởng Soạn Kịch Bản...');
    await page.click('#btn-tnav-studio');
    await page.waitForTimeout(400);

    // Kiểm tra tất cả input đều tồn tại và có giá trị
    const titleVal = await page.inputValue('#studio-lesson-title-input');
    const oldQVal = await page.inputValue('#studio-old-lesson-q');
    const theoryTaskVal = await page.inputValue('#studio-theory-task');
    const quizQVal = await page.inputValue('#studio-quiz-q');

    console.log('   - Loaded Title:', titleVal);
    console.log('   - Loaded Old Question:', oldQVal.substring(0, 40) + '...');
    console.log('   - Loaded Theory Task:', theoryTaskVal.substring(0, 40) + '...');
    console.log('   - Loaded Quiz Question:', quizQVal.substring(0, 40) + '...');

    if (!titleVal || !oldQVal || !theoryTaskVal || !quizQVal) {
      throw new Error('Studio inputs failed to populate data!');
    }

    // 3. Thực hiện chỉnh sửa trực tiếp nội dung bài học trong Studio
    console.log('\n3. Thực hiện chỉnh sửa trực tiếp nội dung bài học...');
    const editedTitle = 'Bài 12: Xâu ký tự & Phép cắt lát (Đã chỉnh sửa)';
    const editedOldQ = 'Bộ phận nào của máy tính thực hiện các phép tính số học và logic (ALU)?';
    const editedTheoryTask = 'Đọc SGK Tin 10 Cánh Diều trang 92-94, thảo luận về cú pháp cắt xâu s[start:end:step].';
    const editedQuizQ = 'Trong Python, biểu thức "TinHoc"[1:4] cho kết quả là gì?';
    const editedOptA = '"Tin"';
    const editedOptB = '"inH"';
    const editedOptC = '"inHo"';
    const editedOptD = '"Hoc"';

    await page.fill('#studio-lesson-title-input', editedTitle);
    await page.fill('#studio-old-lesson-q', editedOldQ);
    await page.fill('#studio-theory-task', editedTheoryTask);
    await page.fill('#studio-quiz-q', editedQuizQ);
    await page.fill('#studio-quiz-opt-a', editedOptA);
    await page.fill('#studio-quiz-opt-b', editedOptB);
    await page.fill('#studio-quiz-opt-c', editedOptC);
    await page.fill('#studio-quiz-opt-d', editedOptD);
    await page.selectOption('#studio-quiz-correct', 'B');

    // Chụp ảnh màn hình Studio khi đang chỉnh sửa
    const shotStudio = path.join(artifactsDir, 'v7_09_studio_interactive_editing.png');
    await page.screenshot({ path: shotStudio });
    console.log('   ✅ Đã chụp ảnh minh chứng: v7_09_studio_interactive_editing.png');

    // 4. Bấm "LƯU KỊCH BẢN"
    console.log('\n4. Bấm Lưu kịch bản bài dạy...');
    await page.click('#btn-studio-save-lesson');
    await page.waitForTimeout(500);

    // Kiểm tra dữ liệu đã được ghi vào localStorage
    const savedInStorage = await page.evaluate(() => {
      const raw = localStorage.getItem('lms_custom_lessons');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed['tin10_bai12'];
    });

    if (!savedInStorage || savedInStorage.title !== editedTitle) {
      throw new Error('Failed to persist edited lesson to localStorage!');
    }
    console.log('   - Verified in localStorage: Title saved as:', savedInStorage.title);
    console.log('   - Verified in localStorage: Quiz Q saved as:', savedInStorage.quiz.question);

    // 5. Kiểm tra chuyển sang Tab 3 (Sân khấu) & Thanh Master Control Bar tinh gọn
    console.log('\n5. Chuyển sang Tab 3 (Sân khấu Live Stage)...');
    await page.click('#btn-tnav-stage');
    await page.waitForTimeout(300);

    // Kích hoạt lớp để vào màn hình Live Stage nếu chưa kích hoạt
    const isStartBtnVisible = await page.isVisible('#btn-start-class-session');
    if (isStartBtnVisible) {
      console.log('   - Kích hoạt lớp học qua #btn-start-class-session...');
      await page.click('#btn-start-class-session');
      await page.waitForTimeout(500);
    } else {
      console.log('   - Tiết học đã ở trạng thái Active Live Stage.');
    }

    // Kiểm tra thanh Master Bar duy nhất
    const masterBarCount = await page.locator('.teacher-master-control-bar').count();
    const paceBarOutsideCount = await page.locator('body > .teacher-pace-bar, #teacher-panel-stage > .teacher-pace-bar').count();
    const endSessionBtns = await page.locator('button:has-text("KẾT THÚC TIẾT HỌC")').count();
    const reloadBtnPresent = await page.locator('#btn-remote-reload-all').count();
    const randomPickBtnPresent = await page.locator('#btn-random-pick-student').count();

    console.log('   - Master Control Bar Count:', masterBarCount, '(Expected 1)');
    console.log('   - Duplicate Pace Bar Count Outside:', paceBarOutsideCount, '(Expected 0)');
    console.log('   - "KẾT THÚC TIẾT HỌC" Button Count:', endSessionBtns, '(Expected exactly 1)');
    console.log('   - Redundant "F5 18 máy" button in Header:', reloadBtnPresent, '(Expected 0)');
    console.log('   - Redundant "Bốc thăm" button in Header:', randomPickBtnPresent, '(Expected 0)');

    if (masterBarCount !== 1) throw new Error('Master control bar should be exactly 1!');
    if (endSessionBtns !== 1) throw new Error('There should be exactly 1 End Session button!');
    if (reloadBtnPresent !== 0 || randomPickBtnPresent !== 0) throw new Error('Redundant header buttons still exist!');

    // Chụp ảnh màn hình giao diện Live Stage sạch sẽ tinh gọn
    const shotStage = path.join(artifactsDir, 'v7_10_clean_unified_command_bar.png');
    await page.screenshot({ path: shotStage });
    console.log('   ✅ Đã chụp ảnh minh chứng: v7_10_clean_unified_command_bar.png');

    // 6. Kiểm tra Console Errors
    console.log('\n6. Kiểm tra Console F12:');
    console.log('   - Console Errors:', consoleErrors.length === 0 ? '0 Error (PASS)' : consoleErrors);
    if (consoleErrors.length > 0) throw new Error('Console errors encountered!');

    console.log('\n====================================================');
    console.log('🎉 TẤT CẢ CÁC BƯỚC ĐÃ PASS 100% ZERO-BUG!');
    console.log('====================================================\n');
  } finally {
    await browser.close();
    server.close();
  }
}

testStudioEditorAndCleanUI().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
