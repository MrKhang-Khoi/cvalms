/**
 * ============================================================================
 * TEST PLAYWRIGHT: KIỂM THỬ GIAO DIỆN GIÁM SÁT 18 MÁY (TAB 4 LIVE MONITOR)
 * Đo đạc bẫy tràn ngang, kiểm tra 18 Canvas, Spotlight Modal, Toolbar và 0 Console Errors
 * ============================================================================
 */

const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = 8998;
const outputDir = path.resolve(__dirname, 'visual_regression_screenshots');
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

      if (req.url === '/favicon.ico') {
        res.writeHead(204);
        res.end();
        return;
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

async function runLiveMonitorUITest() {
  console.log('================================================================');
  console.log('🖥️  [TEST LIVE MONITOR UI] KIỂM THỬ GIAO DIỆN GIÁM SÁT 18 MÁY');
  console.log('================================================================');

  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });

  const resolutions = [
    { name: 'FullHD_1920x1080', width: 1920, height: 1080, label: '1920x1080 (Màn máy chủ GV / Máy chiếu)' },
    { name: 'HD_1366x768', width: 1366, height: 768, label: '1366x768 (Màn hình trường học THCS tiêu chuẩn)' }
  ];

  const consoleErrors = [];

  try {
    for (const res of resolutions) {
      console.log(`\n------------------------------------------------------------`);
      console.log(`🔍 [ĐỘ PHÂN GIẢI]: ${res.label}`);
      console.log(`------------------------------------------------------------`);

      const context = await browser.newContext({ viewport: { width: res.width, height: res.height } });
      const page = await context.newPage();

      page.on('console', msg => {
        if (msg.type() === 'error') {
          // Bỏ qua lỗi kết nối websocket tới 49150 nếu gateway chưa bật trong test này
          if (!msg.text().includes('WebSocket') && !msg.text().includes('ERR_CONNECTION_REFUSED')) {
            consoleErrors.push(`[Console Error ${res.name}]: ${msg.text()}`);
          }
        }
      });

      // 1. Mở trang và đăng nhập Giáo viên qua Modal
      await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);

      await page.click('#btn-open-teacher-login');
      await page.waitForTimeout(200);
      await page.fill('#teacher-password-input', 'admin123');
      await page.click('#modal-teacher-login button[type="submit"]');
      await page.waitForSelector('#screen-teacher.active', { state: 'visible' });
      await page.waitForTimeout(400);

      // Chuyển sang Tab 4: Giám sát phòng máy
      await page.click('#btn-tnav-monitor');
      await page.waitForTimeout(600);

      // 2. Kiểm tra Tab 4 button active và Panel hiển thị
      const isTabActive = await page.evaluate(() => {
        const btn = document.getElementById('btn-tnav-monitor');
        const panel = document.getElementById('teacher-panel-monitor');
        return btn && btn.classList.contains('active') && panel && panel.style.display !== 'none';
      });
      console.log(`  - Trạng thái Tab 4 Active: ${isTabActive ? 'PASS (Đang mở)' : 'FAIL'}`);
      if (!isTabActive) throw new Error('Tab 4 không kích hoạt được!');

      // 3. Kiểm tra số lượng card máy trạm (Bắt buộc đủ 18 máy)
      const seatCount = await page.evaluate(() => {
        return document.querySelectorAll('.mon-card').length;
      });
      console.log(`  - Đếm số lượng máy trạm: ${seatCount}/18 ${seatCount === 18 ? 'PASS (Đủ 18 máy)' : 'FAIL'}`);
      if (seatCount !== 18) throw new Error(`Số lượng máy trạm không đúng: ${seatCount} !== 18`);

      // 4. Kiểm tra các nút tác vụ Toolbar
      const toolbarReady = await page.evaluate(() => {
        const broadcastStart = document.getElementById('btn-mon-broadcast-start');
        const broadcastStop = document.getElementById('btn-mon-broadcast-stop');
        const wol = document.getElementById('btn-mon-wol-all');
        const lock = document.getElementById('btn-mon-lock-all');
        const unlock = document.getElementById('btn-mon-unlock-all');
        const collect = document.getElementById('btn-mon-collect-all');
        const shutdown = document.getElementById('btn-mon-shutdown-all');
        return Boolean(broadcastStart && broadcastStop && wol && lock && unlock && collect && shutdown);
      });
      console.log(`  - Bộ nút điều khiển tập thể (Chiếu màn hình Thầy, Dừng chiếu, WOL, Lock, Unlock, Thu bài, Tắt máy): ${toolbarReady ? 'PASS (Đầy đủ)' : 'FAIL'}`);
      if (!toolbarReady) throw new Error('Thiếu nút trong Toolbar điều khiển!');

      // 5. Kiểm tra bẫy tràn ngang (scrollWidth === clientWidth)
      const overflowInfo = await page.evaluate(() => {
        const docW = document.documentElement.clientWidth;
        const scrollW = document.documentElement.scrollWidth;
        const panel = document.getElementById('teacher-panel-monitor');
        const panelScrollW = panel ? panel.scrollWidth : 0;
        const panelClientW = panel ? panel.clientWidth : 0;
        return {
          hasOverflow: scrollW > docW || panelScrollW > panelClientW,
          docClientW: docW,
          docScrollW: scrollW,
          panelClientW,
          panelScrollW
        };
      });
      console.log(`  - Bẫy tràn ngang màn hình: ${overflowInfo.hasOverflow ? 'CÓ LỖI (TRÀN)' : '0 BẪY TRÀN (PASS)'} (doc: ${overflowInfo.docClientW}/${overflowInfo.docScrollW}px, panel: ${overflowInfo.panelClientW}/${overflowInfo.panelScrollW}px)`);
      if (overflowInfo.hasOverflow) {
        throw new Error(`Phát hiện bẫy tràn ngang tại độ phân giải ${res.name}!`);
      }

      // 6. Thử nghiệm mở Spotlight Modal khi click vào màn hình máy 1
      console.log('  - Thử nghiệm kích hoạt Spotlight Modal...');
      await page.click('#mon-card-MAY-01 .mon-screen-canvas');
      await page.waitForTimeout(400);

      const spotlightOpened = await page.evaluate(() => {
        const modal = document.getElementById('modal-monitor-spotlight');
        const canvas = document.getElementById('modal-spotlight-canvas');
        return modal && modal.style.display === 'flex' && canvas !== null;
      });
      console.log(`  - Spotlight Modal mở thành công: ${spotlightOpened ? 'PASS' : 'FAIL'}`);
      if (!spotlightOpened) throw new Error('Spotlight Modal không mở khi click vào máy!');

      // Đóng Spotlight Modal
      await page.click('#btn-close-spotlight-modal');
      await page.waitForTimeout(300);

      const spotlightClosed = await page.evaluate(() => {
        const modal = document.getElementById('modal-monitor-spotlight');
        return modal && modal.style.display === 'none';
      });
      console.log(`  - Spotlight Modal đóng thành công: ${spotlightClosed ? 'PASS' : 'FAIL'}`);

      // Chụp ảnh màn hình lưu bằng chứng
      const screenPath = path.join(outputDir, `${res.name}_live_monitor_18_seats.png`);
      await page.screenshot({ path: screenPath });
      console.log(`  📸 Đã chụp ảnh lưu kiểm chứng: ${path.basename(screenPath)}`);

      await context.close();
    }

    if (consoleErrors.length > 0) {
      console.error('\n❌ Phát hiện console errors trong quá trình test:');
      consoleErrors.forEach(err => console.error('  ', err));
      throw new Error('Có console errors!');
    }

    console.log('\n================================================================');
    console.log('🎉 TẤT CẢ CÁC BƯỚC KIỂM THỬ GIAO DIỆN LIVE MONITOR ĐỀU ĐẠT PASS 100%!');
    console.log('================================================================');

  } finally {
    await browser.close();
    server.close();
  }
}

runLiveMonitorUITest().catch(err => {
  console.error('❌ LỖI KIỂM THỬ:', err.message);
  process.exit(1);
});
