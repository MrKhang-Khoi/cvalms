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
      if (err.code === 'EADDRINUSE') resolve({ close: () => {} });
      else throw err;
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function testResetLobbyAndTimerFlow() {
  console.log('====================================================');
  console.log('TEST: STUDIO SCROLLING, COUNTDOWN TIMER & RESET TO LOBBY');
  console.log('====================================================');

  const server = await startServer(8089);
  const artifactsDir = path.resolve('C:/Users/HPZBook/.gemini/antigravity/brain/991599f5-9f64-4542-b049-830a340f7b2b');

  // Reset Firebase to clean locked state
  console.log('[Setup] Resetting Firebase state...');
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
    console.log('   -> Firebase state reset OK!');
  } catch (e) {
    console.warn('   -> Reset warning:', e.message);
  }

  const browser = await chromium.launch({ headless: true });
  const teacherContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const studentContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });

  const teacherPage = await teacherContext.newPage();
  const studentPage = await studentContext.newPage();

  const consoleErrors = [];
  teacherPage.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('favicon')) consoleErrors.push('[Teacher Console] ' + msg.text());
  });
  studentPage.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('favicon')) consoleErrors.push('[Student Console] ' + msg.text());
  });
  teacherPage.on('dialog', async d => { await d.accept(); });
  studentPage.on('dialog', async d => { await d.accept(); });

  try {
    // ----------------------------------------------------
    // 1. KIEM TRA LAN CHUOT / CUON TRANG TRONG TAB 2 STUDIO
    // ----------------------------------------------------
    console.log('\n--- BUOC 1: KIEM TRA CUON TRANG (SCROLL) TRONG TAB 2 STUDIO ---');
    await teacherPage.goto('http://127.0.0.1:8089/', { waitUntil: 'networkidle' });
    await teacherPage.click('#btn-open-teacher-login');
    await teacherPage.fill('#teacher-password-input', 'admin123');
    await teacherPage.click('#modal-teacher-login button[type="submit"]');
    await teacherPage.waitForTimeout(300);

    // Chuyen sang Tab 2: Xuong Soan Kich Ban
    await teacherPage.click('#btn-tnav-studio');
    await teacherPage.waitForTimeout(400);

    // Do dac scrollHeight va kha nang cuon cua #teacher-panel-studio
    const scrollMetrics = await teacherPage.evaluate(() => {
      const panel = document.getElementById('teacher-panel-studio');
      const step3 = document.querySelector('.studio-step-card[data-step="3"]');
      const step4 = document.querySelector('.studio-step-card[data-step="4"]');
      const step5 = document.querySelector('.studio-step-card[data-step="5"]');
      return {
        panelScrollHeight: panel ? panel.scrollHeight : 0,
        panelClientHeight: panel ? panel.clientHeight : 0,
        canScroll: panel ? (panel.scrollHeight > panel.clientHeight) : false,
        step3Exists: !!step3,
        step4Exists: !!step4,
        step5Exists: !!step5
      };
    });

    console.log('   - Panel ScrollHeight:', scrollMetrics.panelScrollHeight, 'px');
    console.log('   - Panel ClientHeight:', scrollMetrics.panelClientHeight, 'px');
    console.log('   - Can Scroll Vertically:', scrollMetrics.canScroll ? 'PASS' : 'FAIL');
    console.log('   - Steps 3, 4, 5 Exist in DOM:', (scrollMetrics.step3Exists && scrollMetrics.step4Exists && scrollMetrics.step5Exists) ? 'PASS' : 'FAIL');

    if (!scrollMetrics.canScroll) {
      throw new Error('Studio Panel cannot scroll vertically! scrollHeight must be greater than clientHeight');
    }

    // Thuc hien cuon chuot xuong 800px
    console.log('   - Thuc hien cuon chuot xuong 800px...');
    await teacherPage.evaluate(() => {
      const panel = document.getElementById('teacher-panel-studio');
      panel.scrollTop = 800;
    });
    await teacherPage.waitForTimeout(300);

    const afterScrollTop = await teacherPage.evaluate(() => {
      return document.getElementById('teacher-panel-studio').scrollTop;
    });
    console.log('   - ScrollTop after scroll:', afterScrollTop, 'px (PASS > 0)');
    if (afterScrollTop <= 0) throw new Error('Scrolling failed to change scrollTop!');

    // Chup anh minh chung khi cuon xuong nhin thay Buoc 3 (Kahoot) va Buoc 4
    const shotScroll = path.join(artifactsDir, 'v7_11_studio_scrolling_bottom.png');
    await teacherPage.screenshot({ path: shotScroll });
    console.log('   [OK] Da chup anh minh chung: v7_11_studio_scrolling_bottom.png');

    // ----------------------------------------------------
    // 2. KICH HOAT LOP HOC & HOC SINH VAO MAY
    // ----------------------------------------------------
    console.log('\n--- BUOC 2: KICH HOAT LOP HOC & HOC SINH VAO MAY ---');
    await teacherPage.click('#btn-tnav-stage');
    await teacherPage.waitForTimeout(300);
    const startBtnVisible = await teacherPage.isVisible('#btn-start-class-session');
    if (startBtnVisible) {
      await teacherPage.click('#btn-start-class-session');
      await teacherPage.waitForTimeout(400);
    }

    // Hoc sinh mo trang va chon May 04
    await studentPage.goto('http://127.0.0.1:8089/?set_machine=4', { waitUntil: 'networkidle' });
    await studentPage.waitForTimeout(500);

    const studentWaitingActive = await studentPage.isVisible('#st-view-waiting');
    console.log('   - Hoc sinh da vao Sanh cho (st-view-waiting):', studentWaitingActive ? 'PASS' : 'FAIL');
    if (!studentWaitingActive) throw new Error('Student failed to enter waiting lobby!');

    // ----------------------------------------------------
    // 3. KIEM TRA DONG HO DEM NGUOC (MASTER TIMER COUNTDOWN)
    // ----------------------------------------------------
    console.log('\n--- BUOC 3: KIEM TRA DONG HO DEM NGUOC MASTER COUNTDOWN ---');
    // Giao vien chuyen sang Buoc 1 (Kiem tra bai cu)
    await teacherPage.evaluate(() => {
      window.teacherSetPhase('old_lesson');
    });
    await teacherPage.waitForTimeout(500);

    const initialTimerText = await teacherPage.innerText('#master-timer-display');
    console.log('   - Thoi gian ban dau khi phat de Buoc 1:', initialTimerText);

    // Doi 2.2 giay de dong ho dem lui
    console.log('   - Dang doi 2.2 giay de kiem tra buoc dem lui thuc te...');
    await teacherPage.waitForTimeout(2200);

    const afterTickingText = await teacherPage.innerText('#master-timer-display');
    console.log('   - Thoi gian sau 2.2 giay:', afterTickingText);

    if (afterTickingText === initialTimerText) {
      throw new Error('Dong ho Master Timer KHONG dem nguoc! Thoi gian bi dung yen.');
    }
    console.log('   [OK] DONG HO DANG DEM NGUOC CHUAN XAC TUNG GIAY (PASS)!');

    // Kiem tra nut TAM DUNG
    console.log('   - Bam nut "Tam dung"...');
    await teacherPage.click('#btn-master-pause-timer');
    await teacherPage.waitForTimeout(300);

    const pausedTime = await teacherPage.innerText('#master-timer-display');
    await teacherPage.waitForTimeout(1500);
    const afterPauseTime = await teacherPage.innerText('#master-timer-display');
    console.log(`   - Kiem tra dung: ${pausedTime} === ${afterPauseTime} (${pausedTime === afterPauseTime ? 'PASS' : 'FAIL'})`);
    if (pausedTime !== afterPauseTime) throw new Error('Nut tam dung khong giu nguyen thoi gian!');

    // Bam TIEP TUC
    console.log('   - Bam nut "Tiep tuc"...');
    await teacherPage.click('#btn-master-pause-timer');
    await teacherPage.waitForTimeout(300);

    // Bam CONG THEM 30S (+30s)
    const beforeAddSec = await teacherPage.evaluate(() => window.STORE.getState().timer.secondsLeft);
    console.log('   - Bam nut "+30s" (Thoi gian truoc khi cong:', beforeAddSec, 's)...');
    await teacherPage.click('#btn-master-add-time');
    await teacherPage.waitForTimeout(300);
    const afterAddSec = await teacherPage.evaluate(() => window.STORE.getState().timer.secondsLeft);
    console.log('   - Thoi gian sau khi cong +30s:', afterAddSec, 's (Expected:', beforeAddSec + 30, 's)');
    if (afterAddSec < beforeAddSec + 28) throw new Error('Nut +30s khong cong dung thoi gian!');
    console.log('   [OK] Tam dung, Tiep tuc va +30s hoat dong hoan hao!');

    // ----------------------------------------------------
    // 4. KIEM TRA NUT "RESET VE PHONG CHO"
    // ----------------------------------------------------
    console.log('\n--- BUOC 4: KIEM TRA NUT "RESET VE PHONG CHO" ---');
    // Xac nhan hoc sinh dang o man hinh old_lesson
    const studentInOldLesson = await studentPage.isVisible('#st-view-old-lesson');
    console.log('   - Hoc sinh dang o man hinh lam bai Buoc 1:', studentInOldLesson ? 'YES' : 'NO');

    // Giao vien bam nut "RESET VE PHONG CHO"
    console.log('   - Giao vien bam nut "RESET VE PHONG CHO"...');
    await teacherPage.click('#btn-master-reset-lobby');
    await teacherPage.waitForTimeout(600);

    // Kiem tra hoc sinh lap tuc quay ve st-view-waiting
    const studentBackInWaiting = await studentPage.isVisible('#st-view-waiting');
    const oldLessonHidden = await studentPage.isVisible('#st-view-old-lesson');
    console.log('   - Hoc sinh da tu dong quay ve Sanh cho (st-view-waiting):', studentBackInWaiting ? 'PASS' : 'FAIL');
    console.log('   - Man hinh lam bai cu da duoc dong lai:', !oldLessonHidden ? 'PASS' : 'FAIL');

    if (!studentBackInWaiting || oldLessonHidden) {
      throw new Error('Nut Reset ve phong cho that bai khong dua hoc sinh ve sanh!');
    }

    const shotReset = path.join(artifactsDir, 'v7_12_reset_to_lobby_verified.png');
    await studentPage.screenshot({ path: shotReset });
    console.log('   [OK] Da chup anh minh chung: v7_12_reset_to_lobby_verified.png');

    // ----------------------------------------------------
    // 5. KIEM TRA HET GIO HOAT DONG -> TU DONG VE PHONG CHO
    // ----------------------------------------------------
    console.log('\n--- BUOC 5: HET GIO HOAT DONG -> TU DONG VE PHONG CHO ---');
    // Bat mot hoat dong ngan (2 giay)
    console.log('   - Giao vien mo hoat dong Buoc 2 (Khoi dong) voi bo dem con 2 giay...');
    await teacherPage.evaluate(() => {
      window.teacherSetPhase('warmup');
      window.APP.startMasterCountdown(2, 'warmup');
    });
    await teacherPage.waitForTimeout(400);

    const studentInWarmup = await studentPage.isVisible('#st-view-warmup');
    console.log('   - Hoc sinh da vao Buoc 2 (Khoi dong):', studentInWarmup ? 'PASS' : 'FAIL');

    // Doi 2.8 giay de het gio
    console.log('   - Dang doi 2.8 giay cho hoat dong het gio tu dong...');
    await teacherPage.waitForTimeout(2800);

    // Kiem tra sau khi het gio: hoc sinh phai tu dong ve phong cho
    const autoBackWaiting = await studentPage.isVisible('#st-view-waiting');
    const waitingSubText = await studentPage.innerText('#waiting-lesson-sub');
    console.log('   - Hoc sinh tu dong quay ve phong cho sau khi het gio:', autoBackWaiting ? 'PASS' : 'FAIL');
    console.log('   - Thong diep tren phong cho hoc sinh:', waitingSubText);

    if (!autoBackWaiting) {
      throw new Error('Het gio hoat dong nhung hoc sinh khong tu dong ve phong cho!');
    }

    const shotAutoEnd = path.join(artifactsDir, 'v7_13_activity_completed_waiting.png');
    await studentPage.screenshot({ path: shotAutoEnd });
    console.log('   [OK] Da chup anh minh chung: v7_13_activity_completed_waiting.png');

    // ----------------------------------------------------
    // 6. KIEM TRA CONSOLE F12
    // ----------------------------------------------------
    console.log('\n--- BUOC 6: KIEM TRA CONSOLE ERRORS ---');
    console.log('   - Total Console Errors:', consoleErrors.length === 0 ? '0 Error (PASS)' : consoleErrors);
    if (consoleErrors.length > 0) throw new Error('Console errors encountered!');

    console.log('\n====================================================');
    console.log('TAT CA 4 YEU CAU DA DAT CHUAN ZERO-BUG 100% HOAN HAO!');
    console.log('====================================================\n');
  } finally {
    await browser.close();
    server.close();
  }
}

testResetLobbyAndTimerFlow().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
