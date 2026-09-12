const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runFullStudentTest() {
  console.log('🚀 Bắt đầu kịch bản kiểm thử toàn diện Giao diện Học sinh...');
  
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  const fileUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
  console.log('1. Mở trang tại:', fileUrl);

  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.waitForTimeout(500);

  // BƯỚC 1: KIỂM TRA SẢNH 18 MÁY TÍNH
  console.log('2. Kiểm tra Sảnh chọn 18 máy tính...');
  const isLobbyActive = await page.isVisible('#screen-lobby.active');
  if (!isLobbyActive) throw new Error('Sảnh chọn máy tính không ở trạng thái active khi mở trang!');

  const cardsCount = await page.locator('#computers-grid .computer-card').count();
  console.log(`   - Số lượng máy tính trên lưới: ${cardsCount}/18 máy.`);
  if (cardsCount !== 18) throw new Error(`Lưới chỉ hiển thị ${cardsCount} máy thay vì 18 máy!`);

  // Kiểm tra tên học sinh ở Máy 4 (Lớp 10A1)
  const card4Text = await page.locator('#computers-grid .computer-card').nth(3).textContent();
  console.log(`   - Nội dung Máy 04: ${card4Text.replace(/\s+/g, ' ').trim()}`);
  if (!card4Text.includes('Đỗ Gia Huy') || !card4Text.includes('Bùi Phương Mai')) {
    throw new Error('Máy 04 không map đúng tên 2 học sinh lớp 10A1!');
  }

  await page.screenshot({ path: path.join(screenshotsDir, '01_lobby_18_computers.png') });
  console.log('   📸 Đã chụp: 01_lobby_18_computers.png');

  // BƯỚC 2: CHỌN MÁY 04 & XÁC NHẬN VÀO HỌC
  console.log('3. Nhấp chọn Máy 04...');
  await page.locator('#computers-grid .computer-card').nth(3).click();
  await page.waitForTimeout(400);

  const isConfirmModalVisible = await page.isVisible('#modal-confirm-machine');
  if (!isConfirmModalVisible) throw new Error('Modal xác nhận không mở sau khi chọn máy!');

  const modalTitle = await page.textContent('#modal-machine-title');
  console.log(`   - Tiêu đề modal: ${modalTitle}`);

  await page.screenshot({ path: path.join(screenshotsDir, '02_confirm_modal.png') });
  console.log('   📸 Đã chụp: 02_confirm_modal.png');

  console.log('4. Nhấp [ĐÚNG VỊ TRÍ — VÀO HỌC]...');
  await page.click('#btn-modal-confirm');
  await page.waitForTimeout(500);

  const isStudentWorkspaceActive = await page.isVisible('#screen-student.active');
  if (!isStudentWorkspaceActive) throw new Error('Chưa chuyển sang Không gian Học sinh sau khi xác nhận!');

  const machineBadge = await page.textContent('#sh-machine-badge');
  const pairLabel = await page.textContent('#sh-students-label');
  console.log(`   - Badge máy trên Header: ${machineBadge} | ${pairLabel}`);
  if (!machineBadge.includes('MÁY 04') || !pairLabel.includes('Đỗ Gia Huy')) {
    throw new Error('Header không hiển thị đúng thông tin Máy 04!');
  }

  // BƯỚC 3: KIỂM TRA TÍNH NĂNG CHỐNG BẤM NHẦM (TOKEN GUARD)
  console.log('5. Thử quay lại Sảnh để kiểm tra tính năng Chống chọn nhầm máy...');
  await page.click('#btn-back-to-lobby');
  await page.waitForTimeout(400);

  // Thử bấm vào Máy 2 (trong khi máy này đã lưu token là Máy 4)
  console.log('   - Cố tình bấm vào Máy 02...');
  await page.locator('#computers-grid .computer-card').nth(1).click();
  await page.waitForTimeout(400);

  const isWarningModalVisible = await page.isVisible('#modal-token-warning');
  if (!isWarningModalVisible) throw new Error('Modal cảnh báo Token Guard không xuất hiện khi bấm nhầm máy!');

  const warningMsg = await page.textContent('#warning-text-content');
  console.log(`   - Nội dung cảnh báo: ${warningMsg.replace(/\s+/g, ' ').trim()}`);

  await page.screenshot({ path: path.join(screenshotsDir, '03_token_warning_guard.png') });
  console.log('   📸 Đã chụp: 03_token_warning_guard.png');

  // Bấm nút "Về đúng máy của tôi"
  await page.click('#btn-warning-back');
  await page.waitForTimeout(300);

  // Bấm chọn đúng máy 04 để vào lại
  await page.locator('#computers-grid .computer-card').nth(3).click();
  await page.waitForTimeout(300);
  await page.click('#btn-modal-confirm');
  await page.waitForTimeout(400);

  // BƯỚC 4: KIỂM TRA CHẶNG 0 (SƠ ĐỒ LỚP RADAR)
  console.log('6. Kiểm tra Chặng 0: Phòng chờ & Radar...');
  const radarCount = await page.locator('#radar-grid .radar-cell').count();
  console.log(`   - Số ô radar lớp học: ${radarCount}/18 ô.`);
  await page.screenshot({ path: path.join(screenshotsDir, '04_phase0_radar.png') });
  console.log('   📸 Đã chụp: 04_phase0_radar.png');

  // BƯỚC 5: KIỂM TRA CHẶNG 1 (QUICK POLL)
  console.log('7. Kiểm tra Chặng 1: Quick Poll A-B-C-D...');
  await page.click('.pn-item[data-phase="warmup"]');
  await page.waitForTimeout(400);

  // Chọn đáp án B
  await page.click('.poll-opt-btn[data-choice="B"]');
  await page.waitForTimeout(300);

  const isBOptSelected = await page.evaluate(() => {
    const btn = document.querySelector('.poll-opt-btn[data-choice="B"]');
    return btn && btn.classList.contains('selected');
  });
  if (!isBOptSelected) throw new Error('Phương án B không nhận class selected sau khi click!');

  await page.screenshot({ path: path.join(screenshotsDir, '05_phase1_quickpoll.png') });
  console.log('   📸 Đã chụp: 05_phase1_quickpoll.png');

  // BƯỚC 6: KIỂM TRA CHẶNG 2 (LÝ THUYẾT PWA)
  console.log('8. Kiểm tra Chặng 2: Trạm Lý thuyết PWA NotebookLM...');
  await page.click('.pn-item[data-phase="theory"]');
  await page.waitForTimeout(400);

  const theoryCards = await page.locator('#theory-cards-container .theory-card').count();
  console.log(`   - Số thẻ kiến thức NotebookLM: ${theoryCards} thẻ.`);
  if (theoryCards < 3) throw new Error('Thiếu thẻ kiến thức NotebookLM!');

  await page.screenshot({ path: path.join(screenshotsDir, '06_phase2_theory.png') });
  console.log('   📸 Đã chụp: 06_phase2_theory.png');

  // BƯỚC 7: KIỂM TRA CHẶNG 3 (THẢO LUẬN ĐÔI & NỘP BÀI)
  console.log('9. Kiểm tra Chặng 3: Thảo luận đôi & Thực hành...');
  await page.click('.pn-item[data-phase="discussion"]');
  await page.waitForTimeout(400);

  await page.fill('#disc-answer-input', `# Bài giải của nhóm Máy 04\ns = 'chuc mung nam moi 2026'\nprint(len(s))\nprint(s[10:17])\nprint(s.count(' '))`);
  await page.click('#btn-submit-discussion');
  await page.waitForTimeout(400);

  const submitStatus = await page.textContent('#disc-submission-status');
  console.log(`   - Trạng thái nộp bài: ${submitStatus.replace(/\s+/g, ' ').trim()}`);
  if (!submitStatus.includes('Đã nộp bài lúc')) throw new Error('Nộp bài không thành công!');

  await page.screenshot({ path: path.join(screenshotsDir, '07_phase3_discussion.png') });
  console.log('   📸 Đã chụp: 07_phase3_discussion.png');

  // BƯỚC 8: KIỂM TRA CHẶNG 4 (LIVE QUIZ)
  console.log('10. Kiểm tra Chặng 4: Live Quiz...');
  await page.click('.pn-item[data-phase="quiz"]');
  await page.waitForTimeout(400);

  await page.click('.quiz-opt[data-qopt="B"]');
  await page.waitForTimeout(400);

  const feedbackText = await page.textContent('#quiz-feedback-box');
  console.log(`   - Phản hồi Live Quiz: ${feedbackText.replace(/\s+/g, ' ').trim()}`);

  await page.screenshot({ path: path.join(screenshotsDir, '08_phase4_livequiz.png') });
  console.log('   📸 Đã chụp: 08_phase4_livequiz.png');

  // KIỂM TRA TỔNG QUAN CONSOLE F12
  console.log('11. Tổng kết kiểm tra Console F12...');
  console.log(`   - Số lỗi Console ghi nhận: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('❌ Các lỗi Console xuất hiện:', consoleErrors);
    throw new Error('Phát hiện lỗi Console trong quá trình chạy!');
  }

  await browser.close();
  console.log('🎉 TẤT CẢ 10/10 TEST CASE ĐỀU PASS 100%! GIAO DIỆN HỌC SINH HOÀN TOÀN CHUẨN XÁC, 0 LỖI!');
}

runFullStudentTest().catch(err => {
  console.error('❌ Kiểm thử thất bại:', err);
  process.exit(1);
});
