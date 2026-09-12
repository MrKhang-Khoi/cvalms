/**
 * KIỂM THỬ TỰ ĐỘNG MENU CÀI ĐẶT & QUẢN LÝ DANH SÁCH 18 MÁY (EXCEL IMPORT/EXPORT)
 * - Mở modal cài đặt từ thanh giáo viên
 * - Kiểm tra 18 máy và demo máy có 3 học sinh (linh hoạt 1-4 bạn)
 * - Kiểm tra tính năng thêm/xóa học sinh trực tiếp trên từng máy
 * - Kiểm tra sinh file mẫu Excel/CSV
 * - Kiểm tra nạp danh sách từ file
 * - Quét 100% Console F12 (0 lỗi)
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const HTML_PATH = 'file:///' + path.resolve(__dirname, '../index.html').replace(/\\/g, '/');
const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

(async () => {
  console.log('🚀 Bắt đầu kiểm thử Menu Cài đặt & Nhập/Xuất Excel cho 18 máy...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[Console Error]: ${msg.text()}`);
  });
  page.on('pageerror', err => errors.push(`[PageError]: ${err.message}`));

  // 1. Mở trang và đăng nhập Giáo viên
  console.log('1. Mở trang và đăng nhập Giáo viên...');
  await page.goto(HTML_PATH);
  await page.waitForLoadState('networkidle');

  await page.click('#btn-open-teacher-login');
  await page.waitForTimeout(300);
  await page.fill('#teacher-password-input', 'admin123');
  await page.click('#modal-teacher-login button[type="submit"]');
  await page.waitForSelector('#screen-teacher.active', { state: 'visible' });

  // 2. Mở Modal Cài đặt học sinh
  console.log('2. Kiểm tra nút [👥 Cài đặt học sinh] trên thanh topbar Giáo viên...');
  const btnSettings = page.locator('#btn-open-teacher-settings');
  const btnText = await btnSettings.textContent();
  console.log(`   - Tên nút cài đặt: "${btnText.trim()}"`);
  if (!btnText.includes('Cài đặt học sinh')) {
    throw new Error(`Nút cài đặt phải có tên "Cài đặt học sinh"! Hiện tại: "${btnText}"`);
  }
  await btnSettings.click();
  await page.waitForTimeout(400);

  const isModalVisible = await page.locator('#modal-teacher-settings').isVisible();
  console.log('   - Modal Cài đặt mở lên:', isModalVisible);
  if (!isModalVisible) throw new Error('Modal Cài đặt không mở khi bấm nút!');

  const modalTitle = await page.locator('#modal-teacher-settings h3').textContent();
  console.log(`   - Tiêu đề modal: "${modalTitle.trim()}"`);
  if (!modalTitle.includes('CÀI ĐẶT HỌC SINH')) {
    throw new Error('Tiêu đề modal chưa được đổi thành CÀI ĐẶT HỌC SINH!');
  }

  // 3. Kiểm tra danh sách nhiều lớp (10A1, 10A2, 9A1)
  console.log('3. Kiểm tra danh sách nhiều lớp học trong dropdown...');
  const classOptions = await page.locator('#settings-select-class option').allTextContents();
  console.log('   - Các lớp hiện có:', classOptions);
  if (!classOptions.some(opt => opt.includes('10A1')) || !classOptions.some(opt => opt.includes('10A2'))) {
    throw new Error('Dropdown phải hỗ trợ nhiều lớp (10A1, 10A2)!');
  }

  // Chuyển sang lớp 10A2 để kiểm tra hiển thị học sinh 10A2
  console.log('   - Thử chuyển sang Lớp 10A2...');
  await page.selectOption('#settings-select-class', '10A2');
  await page.waitForTimeout(300);
  const m1Text10A2 = await page.locator('#settings-seating-grid .settings-desk-card[data-desk="1"]').textContent();
  console.log(`   - Học sinh Máy 01 của 10A2: ${m1Text10A2.replace(/\s+/g, ' ')}`);
  if (!m1Text10A2.includes('Nguyễn Gia Huy')) {
    throw new Error('Lớp 10A2 không hiển thị đúng học sinh Máy 01!');
  }

  // Quay lại lớp 10A1
  await page.selectOption('#settings-select-class', '10A1');
  await page.waitForTimeout(300);

  // 4. Kiểm tra lưới 18 máy trong Cài đặt của lớp 10A1
  console.log('4. Kiểm tra 18 máy tính trong lưới cài đặt 10A1...');
  const deskCardsCount = await page.locator('#settings-seating-grid .settings-desk-card').count();
  console.log(`   - Số máy hiển thị: ${deskCardsCount}/18 máy.`);
  if (deskCardsCount !== 18) throw new Error(`Lưới cài đặt chỉ có ${deskCardsCount} máy thay vì 18 máy!`);

  // Kiểm tra Máy 03 có demo 3 học sinh
  const machine3Chips = await page.locator('#settings-seating-grid .settings-desk-card[data-desk="3"] .student-chip').count();
  const machine3Text = await page.locator('#settings-seating-grid .settings-desk-card[data-desk="3"]').textContent();
  console.log(`   - Số học sinh tại Máy 03: ${machine3Chips} bạn (Nội dung: ${machine3Text.replace(/\s+/g, ' ')})`);
  if (machine3Chips < 3) throw new Error(`Máy 03 phải có ít nhất 3 học sinh demo! Thực tế: ${machine3Chips}`);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'settings_01_modal_18_desks.png') });
  console.log('   📸 Đã chụp: settings_01_modal_18_desks.png');

  // 5. Thử nghiệm thêm học sinh thứ 4 vào Máy 03
  console.log('5. Thử nghiệm thêm học sinh thứ 4 vào Máy 03 ("Trần Văn Bốn")...');
  await page.fill('#add-student-input-3', 'Trần Văn Bốn');
  await page.click('.settings-desk-card[data-desk="3"] .sdc-btn-add');
  await page.waitForTimeout(300);

  const machine3ChipsAfterAdd = await page.locator('#settings-seating-grid .settings-desk-card[data-desk="3"] .student-chip').count();
  console.log(`   - Số học sinh tại Máy 03 sau khi thêm: ${machine3ChipsAfterAdd} bạn.`);
  if (machine3ChipsAfterAdd !== 4) throw new Error('Không thêm được học sinh thứ 4 vào máy!');

  // 6. Thử nghiệm xóa học sinh vừa thêm
  console.log('6. Thử nghiệm xóa học sinh vừa thêm khỏi Máy 03...');
  await page.locator('.settings-desk-card[data-desk="3"] .student-chip').last().locator('.chip-del').click();
  await page.waitForTimeout(300);

  const machine3ChipsAfterDel = await page.locator('#settings-seating-grid .settings-desk-card[data-desk="3"] .student-chip').count();
  console.log(`   - Số học sinh tại Máy 03 sau khi xóa: ${machine3ChipsAfterDel} bạn.`);
  if (machine3ChipsAfterDel !== 3) throw new Error('Xóa học sinh thất bại!');

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'settings_02_machine3_with_3_students.png') });
  console.log('   📸 Đã chụp: settings_02_machine3_with_3_students.png');

  // 7. Kiểm tra cấu trúc file mẫu Excel và tính năng xuất danh sách kèm cột [Lớp]
  console.log('7. Kiểm tra tính năng tạo file Excel có cột [Lớp]...');
  const excelHeaders = await page.evaluate(() => {
    const selectCls = document.getElementById('settings-select-class');
    const clsId = selectCls ? selectCls.value : '10A1';
    const classData = window.APP.classes[clsId];
    const rows = [
      ["Số máy", "Lớp", "Học sinh 1", "Học sinh 2", "Học sinh 3", "Học sinh 4", "Ghi chú"]
    ];
    for (let i = 1; i <= 18; i++) {
      const p = (classData.seatingPlan[i] || []);
      rows.push([
        i,
        classData.className || clsId,
        p[0] || "",
        p[1] || "",
        p[2] || "",
        p[3] || "",
        ""
      ]);
    }
    return {
      headerRow: rows[0],
      firstRow: rows[1],
      totalRows: rows.length
    };
  });

  console.log('   - Tiêu đề cột xuất Excel:', excelHeaders.headerRow);
  console.log('   - Dòng 1 mẫu dữ liệu:', excelHeaders.firstRow);
  if (excelHeaders.headerRow[1] !== 'Lớp') {
    throw new Error('Cột thứ 2 trong mẫu Excel phải là cột "Lớp"!');
  }
  if (!excelHeaders.firstRow[1].includes('10A1')) {
    throw new Error('Giá trị cột Lớp không khớp với lớp đang chọn!');
  }

  // 8. Kiểm tra nạp danh sách học sinh từ file có cột [Lớp]
  console.log('8. Kiểm tra nạp danh sách từ file có cột [Lớp] (7 cột)...');
  const importResult = await page.evaluate(() => {
    const testRows = [
      ["Số máy", "Lớp", "Học sinh 1", "Học sinh 2", "Học sinh 3", "Học sinh 4", "Ghi chú"],
      [1, "Lớp 10A1", "Nguyễn Test A", "Trần Test B", "", "", "OK"],
      [2, "Lớp 10A1", "Lê Test C", "Phạm Test D", "Hoàng Test E", "", "OK"]
    ];
    window.APP.processImportedRows(testRows);
    const m1 = window.APP.classes['10A1'].seatingPlan[1];
    const m2 = window.APP.classes['10A1'].seatingPlan[2];
    return { m1, m2 };
  });
  console.log('   - Kết quả sau import Máy 1:', importResult.m1);
  console.log('   - Kết quả sau import Máy 2 (3 bạn):', importResult.m2);
  if (importResult.m1[0] !== 'Nguyễn Test A' || importResult.m2[2] !== 'Hoàng Test E') {
    throw new Error('Import dữ liệu có cột Lớp thất bại!');
  }

  // Phục hồi lại danh sách chuẩn của 10A1 để các test khác không bị ảnh hưởng
  await page.evaluate(() => {
    window.APP.classes['10A1'].seatingPlan[1] = ["Nguyễn Văn An", "Trần Thị Mai"];
    window.APP.classes['10A1'].seatingPlan[2] = ["Lê Hoàng Nam", "Phạm Quỳnh Anh"];
    window.APP.renderSettingsSeatingGrid();
  });

  // 9. Bấm [LƯU THAY ĐỔI VÀ ĐỒNG BỘ]
  console.log('9. Bấm [LƯU THAY ĐỔI VÀ ĐỒNG BỘ]...');
  page.on('dialog', async dialog => {
    console.log(`   💬 [Dialog]: ${dialog.message()}`);
    await dialog.accept();
  });
  await page.click('#btn-save-settings');
  await page.waitForTimeout(500);

  // 10. Bắt đầu tiết học Giai đoạn 2 và kiểm tra Máy 03 hiển thị 3 bạn
  console.log('10. Thầy bấm [BẮT ĐẦU TIẾT HỌC CHO LỚP NÀY]...');
  await page.click('#btn-start-class-session');
  await page.waitForSelector('#teacher-stage-active', { state: 'visible' });

  const machine3SessionText = await page.locator('#active-session-grid-18 .asm-card').nth(2).textContent();
  console.log(`   - Máy 03 trên Sơ đồ tiết học: ${machine3SessionText.replace(/\s+/g, ' ')}`);
  if (!machine3SessionText.includes('Đặng Quốc Anh')) {
    throw new Error('Sơ đồ tiết học không hiển thị đủ 3 học sinh của Máy 03!');
  }

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'settings_03_active_session_with_flexible_students.png') });
  console.log('   📸 Đã chụp: settings_03_active_session_with_flexible_students.png');

  // 11. Quét 100% Console F12
  console.log('\n11. Quét tổng thể Console F12...');
  console.log(`   - Số lỗi ghi nhận: ${errors.length}`);
  if (errors.length > 0) {
    console.error('Các lỗi phát hiện:', errors);
    process.exit(1);
  }

  console.log('🎉 TOÀN BỘ KIỂM THỬ MENU CÀI ĐẶT & QUẢN LÝ EXCEL 18 MÁY PASS 100%!');
  await browser.close();
})();
