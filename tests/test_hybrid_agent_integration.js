const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data || '{}') });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runIntegrationTest() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🧪 KIỂM THỬ TÍCH HỢP HYBRID: GATEWAY MTLS + C# AGENT + WEB API');
  console.log('═══════════════════════════════════════════════════════════════');

  // 1. Khởi chạy Gateway Server
  console.log('1. Khởi chạy Local Lab Gateway...');
  const gatewayProcess = spawn('node', ['gateway/server.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe']
  });

  gatewayProcess.stdout.on('data', (d) => {
    const msg = d.toString().trim();
    if (msg) console.log(`   [Gateway] ${msg}`);
  });

  await wait(2000);

  // 2. Khởi chạy C# Agent cho MAY-01
  console.log('2. Khởi chạy C# Agent (MAY-01)...');
  const agentExe = path.join(__dirname, '..', 'cvalms-agent', 'bin', 'Release', 'net8.0-windows', 'win-x64', 'publish', 'CvaLmsAgent.exe');
  const certPath = path.join(__dirname, '..', 'gateway', 'certs', 'agent.pfx');
  const agentProcess = spawn(agentExe, ['--machine', 'MAY-01', '--gateway', '127.0.0.1', '--port', '49152', '--cert', certPath], {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe']
  });

  agentProcess.stdout.on('data', (d) => {
    const msg = d.toString().trim();
    if (msg) console.log(`   [Agent MAY-01] ${msg}`);
  });

  await wait(3000);

  let allPassed = true;

  try {
    // 3. Kiểm tra Gateway Status API
    console.log('3. Kiểm tra API GET /api/status trên Web Loopback 127.0.0.1:49150...');
    const statusRes = await fetchJson('http://127.0.0.1:49150/api/status');
    console.log(`   Status HTTP: ${statusRes.status}, Epoch: ${statusRes.data?.epoch}`);

    const seat01 = statusRes.data?.seats?.find(s => s.id === 'MAY-01');
    console.log(`   MAY-01 Online: ${seat01?.online}, ScreenState: ${seat01?.screenState}, App: ${seat01?.currentApp}`);

    if (seat01 && seat01.online) {
      console.log('   ✅ PASS: MAY-01 đã kết nối mTLS thành công và hiển thị Online trên sơ đồ!');
    } else {
      console.error('   ❌ FAIL: MAY-01 chưa được ghi nhận Online!');
      allPassed = false;
    }

    // 4. Kiểm tra lệnh Spotlight
    console.log('4. Kiểm tra API POST /api/spotlight kích hoạt chế độ HD...');
    const spotRes = await fetchJson('http://127.0.0.1:49150/api/spotlight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetMachine: 'MAY-01' })
    });
    console.log(`   Spotlight Active: ${spotRes.data?.activeSpotlight}`);
    if (spotRes.data?.activeSpotlight === 'MAY-01') {
      console.log('   ✅ PASS: Kích hoạt Spotlight thành công cho MAY-01!');
    } else {
      console.error('   ❌ FAIL: Không thể kích hoạt Spotlight!');
      allPassed = false;
    }

    await wait(1500);

    // 5. Kiểm tra lệnh Thu bài tập (Collect)
    console.log('5. Kiểm tra API POST /api/collect kích hoạt thu bài tập...');
    const collectRes = await fetchJson('http://127.0.0.1:49150/api/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetMachine: 'MAY-01' })
    });
    console.log(`   Collect SubmissionId: ${collectRes.data?.submissionId}`);
    if (collectRes.data?.success) {
      console.log('   ✅ PASS: Đã phát lệnh thu bài và tạo giao dịch thành công!');
    } else {
      console.error('   ❌ FAIL: Lệnh thu bài thất bại!');
      allPassed = false;
    }

    await wait(2000);

    // Kiểm tra danh sách bài nộp đã ghi nhận
    const subList = await fetchJson('http://127.0.0.1:49150/api/submissions');
    console.log(`   Số lượng bài tập đã lưu trữ: ${subList.data?.submissions?.length || 0}`);
    if (subList.data?.submissions?.length > 0) {
      console.log(`   ✅ PASS: Đã nhận và lưu trữ bài nộp: ${subList.data.submissions[0].savedFile}`);
    }

  } finally {
    // Dọn dẹp tiến trình
    console.log('───────────────────────────────────────────────────────────────');
    console.log('🛑 Đang đóng các tiến trình thử nghiệm...');
    try { agentProcess.kill(); } catch (e) { console.debug('Cleanup agent:', e.message); }
    try { gatewayProcess.kill(); } catch (e) { console.debug('Cleanup gateway:', e.message); }
  }

  if (allPassed) {
    console.log('\n🎉 TOÀN BỘ KIỂM THỬ TÍCH HỢP ĐÃ ĐẠT PASS 100%!');
    process.exit(0);
  } else {
    console.error('\n❌ KIỂM THỬ TÍCH HỢP CÓ BƯỚC THẤT BẠI!');
    process.exit(1);
  }
}

runIntegrationTest();
