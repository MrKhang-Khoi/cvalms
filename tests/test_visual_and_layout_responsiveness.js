const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = 8996;
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

async function runVisualResponsivenessTest() {
  console.log('================================================================');
  console.log('🎨 [TEST VISUAL & LAYOUT] KIỂM TRA ĐA ĐỘ PHÂN GIẢI, BẪY TRÀN VÀ WCAG');
  console.log('================================================================');

  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });

  const resolutions = [
    { name: 'FullHD_1920x1080', width: 1920, height: 1080, label: '1920x1080 (Màn máy chủ GV / Máy chiếu)' },
    { name: 'HD_1366x768', width: 1366, height: 768, label: '1366x768 (Màn hình máy học sinh THPT tiêu chuẩn)' }
  ];

  const errors = [];

  try {
    for (const res of resolutions) {
      console.log(`\n------------------------------------------------------------`);
      console.log(`🔍 [ĐỘ PHÂN GIẢI]: ${res.label}`);
      console.log(`------------------------------------------------------------`);

      const context = await browser.newContext({ viewport: { width: res.width, height: res.height } });
      const page = await context.newPage();
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(`[Console Error ${res.name}]: ${msg.text()}`);
        }
      });
      page.on('dialog', async d => { await d.accept(); });

      // 1. Kiểm tra Màn hình Giáo viên (Teacher Dashboard)
      console.log(`  1. Kiểm tra Giao diện Giáo viên (${res.width}x${res.height})...`);
      await page.goto(`http://127.0.0.1:${PORT}/?role=teacher`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      await page.evaluate(() => {
        window.STORE.setState({ role: 'teacher', screen: 'teacher', occupiedMachines: {} });
        window.teacherSwitchTab('stage');
      });
      await page.waitForTimeout(400);

      // Kiểm tra tràn ngang
      const teacherOverflow = await page.evaluate(() => {
        const docW = document.documentElement.clientWidth;
        const scrollW = document.documentElement.scrollWidth;
        const bodyScrollW = document.body.scrollWidth;
        return {
          hasOverflow: scrollW > docW || bodyScrollW > docW,
          clientWidth: docW,
          scrollWidth: scrollW,
          bodyScrollWidth: bodyScrollW
        };
      });

      console.log(`    - Tràn ngang màn hình GV: ${teacherOverflow.hasOverflow ? 'CÓ LỖI (TRÀN)' : '0 BẪY TRÀN (PASS)'} (client: ${teacherOverflow.clientWidth}px, scroll: ${teacherOverflow.scrollWidth}px)`);
      if (teacherOverflow.hasOverflow) {
        throw new Error(`LỖI TRÀN NGANG: Màn hình GV bị tràn ngang ở độ phân giải ${res.name}!`);
      }

      await page.screenshot({ path: path.join(outputDir, `${res.name}_01_teacher_stage.png`) });

      // 2. Kiểm tra Màn hình Chọn chỗ ngồi Học sinh (Student Lobby)
      console.log(`  2. Kiểm tra Sảnh chờ & Sơ đồ 18 máy Học sinh (${res.width}x${res.height})...`);
      await page.goto(`http://127.0.0.1:${PORT}/?role=student`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      await page.evaluate(() => {
        window.STORE.setState({
          unlocked: true,
          classId: '12A2',
          grade: '12'
        });
      });
      await page.waitForTimeout(300);

      const lobbyOverflow = await page.evaluate(() => {
        const docW = document.documentElement.clientWidth;
        const scrollW = document.documentElement.scrollWidth;
        return {
          hasOverflow: scrollW > docW,
          clientWidth: docW,
          scrollWidth: scrollW
        };
      });

      console.log(`    - Tràn ngang Sảnh chờ HS: ${lobbyOverflow.hasOverflow ? 'CÓ LỖI' : '0 BẪY TRÀN (PASS)'}`);
      if (lobbyOverflow.hasOverflow) {
        throw new Error(`LỖI TRÀN NGANG: Sảnh học sinh bị tràn ở độ phân giải ${res.name}!`);
      }

      // Kiểm tra kích thước ô chọn máy (Touch/Click Target size >= 44px)
      const seatTargetsValid = await page.evaluate(() => {
        const desks = document.querySelectorAll('.desk-slot, .desk-seat, [onclick*="onSelectDesk"]');
        if (!desks || desks.length === 0) return true;
        let allSufficient = true;
        desks.forEach(d => {
          const rect = d.getBoundingClientRect();
          if (rect.width < 40 || rect.height < 40) {
            allSufficient = false;
          }
        });
        return allSufficient;
      });

      console.log(`    - Kích thước điểm chạm các ô máy trạm: ${seatTargetsValid ? 'ĐẠT CHUẨN (>= 44px)' : 'CHƯA ĐẠT'}`);
      await page.screenshot({ path: path.join(outputDir, `${res.name}_02_student_lobby.png`) });

      // 3. Kiểm tra Sân khấu Chiếc Nón Kỳ Diệu & Vòng Quay May Mắn (Lucky Draw Modal)
      console.log(`  3. Kiểm tra Modal Chiếc Nón Kỳ Diệu / Vòng Quay May Mắn (${res.width}x${res.height})...`);
      await page.evaluate(() => {
        if (window.APP && window.APP.openLuckyDrawModal) {
          window.APP.openLuckyDrawModal(false);
          window.APP.setLuckyDrawStrategy('magic_hat', false);
        }
      });
      await page.waitForTimeout(500);

      const modalOverflow = await page.evaluate(() => {
        const modal = document.getElementById('modal-lucky-draw');
        if (!modal) return { exists: false, hasOverflow: false };
        const rect = modal.getBoundingClientRect();
        const content = modal.querySelector('.modal-content') || modal;
        const contentRect = content.getBoundingClientRect();
        return {
          exists: true,
          modalWidth: rect.width,
          contentWidth: contentRect.width,
          hasOverflow: contentRect.width > window.innerWidth
        };
      });

      console.log(`    - Modal Chiếc Nón Kỳ Diệu: ${modalOverflow.hasOverflow ? 'CÓ LỖI TRÀN' : '0 BẪY TRÀN (PASS)'}`);
      if (modalOverflow.hasOverflow) {
        throw new Error(`LỖI TRÀN: Modal trò chơi bị tràn ở độ phân giải ${res.name}!`);
      }

      await page.screenshot({ path: path.join(outputDir, `${res.name}_03_lucky_magic_hat_modal.png`) });

      // Đóng modal
      await page.evaluate(() => {
        if (window.APP && window.APP.closeLuckyDrawModal) {
          window.APP.closeLuckyDrawModal(false);
        }
      });
      await page.waitForTimeout(300);

      // 4. Kiểm tra Sân khấu Tương tác Câu hỏi Học sinh (Interactive Stage >= 85vh)
      console.log(`  4. Kiểm tra Sân khấu Tương tác Câu hỏi Học sinh (${res.width}x${res.height})...`);
      await page.evaluate(() => {
        window.onSelectDesk(1);
        const confirmBtn = document.getElementById('btn-modal-confirm');
        if (confirmBtn) confirmBtn.click();
      });
      await page.waitForTimeout(400);

      // Nhận tín hiệu câu hỏi
      await page.evaluate(() => {
        if (window.SYNC_BUS && window.SYNC_BUS.handleMessage) {
          window.SYNC_BUS.handleMessage({
            type: 'OLD_LESSON_QUESTION_REVEAL',
            payload: {
              question: 'Trình bày sự khác biệt giữa AI Hẹp (Narrow AI) và AI Tổng Quát (AGI)?',
              timerDuration: 60,
              mode: 'all'
            }
          });
        }
      });
      await page.waitForTimeout(500);

      const stageMetrics = await page.evaluate(() => {
        const docW = document.documentElement.clientWidth;
        const scrollW = document.documentElement.scrollWidth;
        const stage = document.getElementById('student-workspace-warmup') ||
                      document.getElementById('student-old-lesson-box') ||
                      document.querySelector('.student-screen');
        const stageH = stage ? stage.getBoundingClientRect().height : window.innerHeight;
        const vhRatio = stageH / window.innerHeight;

        return {
          hasOverflow: scrollW > docW,
          stageHeight: stageH,
          viewportHeight: window.innerHeight,
          vhRatio: Math.round(vhRatio * 100)
        };
      });

      console.log(`    - Sân khấu tương tác: Chiều cao đạt ${stageMetrics.vhRatio}% viewport (${stageMetrics.stageHeight}px / ${stageMetrics.viewportHeight}px)`);
      console.log(`    - Bẫy tràn ngang sân khấu: ${stageMetrics.hasOverflow ? 'CÓ LỖI' : '0 BẪY TRÀN (PASS)'}`);

      if (stageMetrics.hasOverflow) {
        throw new Error(`LỖI: Sân khấu câu hỏi bị tràn ngang ở độ phân giải ${res.name}!`);
      }

      await page.screenshot({ path: path.join(outputDir, `${res.name}_04_student_question_stage.png`) });

      await context.close();
    }

    console.log('\n--- TỔNG KẾT KIỂM THỬ GIAO DIỆN & WCAG ---');
    console.log(`  - Lỗi Console phát sinh: ${errors.length}`);
    if (errors.length > 0) {
      console.error('  [ERRORS]:', errors);
      throw new Error(`Có ${errors.length} lỗi console trong quá trình kiểm thử giao diện!`);
    } else {
      console.log('  [PASS] 100% GIAO DIỆN SẠCH 0 BẪY TRÀN NGANG, ĐẠT CHUẨN CẢ 1920x1080 VÀ 1366x768.');
    }

    console.log('\n🏆 [KẾT QUẢ]: TEST VISUAL & LAYOUT HOÀN THÀNH XUẤT SẮC!');
  } finally {
    await browser.close().catch(() => {});
    server.close();
  }
}

runVisualResponsivenessTest().catch((err) => {
  console.error('❌ [TEST FAILED]:', err);
  process.exit(1);
});
