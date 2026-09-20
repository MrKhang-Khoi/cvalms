/**
 * Kiểm thử luồng tín hiệu mạng thật: Trình chiếu bài giảng Giáo viên -> Gateway -> C# Agent
 */
const http = require('http');

function postJson(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request({
      hostname: '127.0.0.1',
      port: 49150,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function getJson(path) {
  return new Promise((resolve, reject) => {
    http.get({
      hostname: '127.0.0.1',
      port: 49150,
      path
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function runTest() {
  console.log('📡 [1] Gửi tín hiệu kích hoạt trình chiếu bài giảng...');
  const startRes = await postJson('/api/broadcast/start', { title: 'Bài giảng Tin học 6 - Bài 1' });
  console.log('  -> Phản hồi từ Gateway:', startRes);

  await new Promise(r => setTimeout(r, 1000));

  console.log('🔍 [2] Kiểm tra trạng thái broadcast từ Gateway...');
  const statusRes = await getJson('/api/broadcast/status');
  console.log('  -> Trạng thái hiện tại:', statusRes);
  if (!statusRes.active) throw new Error('Broadcast status should be active!');

  await new Promise(r => setTimeout(r, 1500));

  console.log('🛑 [3] Gửi tín hiệu dừng trình chiếu và mở khóa chuột/phím...');
  const stopRes = await postJson('/api/broadcast/stop', {});
  console.log('  -> Phản hồi từ Gateway:', stopRes);

  const finalStatus = await getJson('/api/broadcast/status');
  console.log('  -> Trạng thái sau khi dừng:', finalStatus);
  if (finalStatus.active) throw new Error('Broadcast status should be inactive!');

  console.log('🎉 TEST THÀNH CÔNG: Tín hiệu mạng 2 chiều hoạt động chuẩn xác 100%!');
}

runTest().catch(err => {
  console.error('❌ TEST FAILED:', err.message);
  process.exit(1);
});
