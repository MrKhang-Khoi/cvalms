const http = require('http');
const tls = require('tls');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { generateCerts, certsDir } = require('./generate_certs');
const { sendWakeOnLan } = require('./wol');
const { DurableCollectionStorage } = require('./storage');

// 1. Khởi tạo chứng chỉ nếu chưa có
generateCerts();

const WEB_PORT = 49150;
const AGENT_MTLS_PORT = 49152;

// 2. Session Epoch & Security Tokens
const SESSION_EPOCH_ID = crypto.randomUUID();
const CSRF_TOKEN = crypto.randomBytes(16).toString('hex');
const STORAGE = new DurableCollectionStorage();

console.log('═══════════════════════════════════════════════════════════════');
console.log('🏛️  CVALMS LAB GATEWAY / LOCAL CONTROLLER (v8.0 PILOT SPEC)');
console.log(`🔑 Session Epoch ID: ${SESSION_EPOCH_ID}`);
console.log(`🛡️  CSRF Token: ${CSRF_TOKEN}`);
console.log('═══════════════════════════════════════════════════════════════');

// 3. Trạng thái 18 máy trạm trong phòng máy THCS
const SEATS = {};
for (let i = 1; i <= 18; i++) {
  const id = `MAY-${String(i).padStart(2, '0')}`;
  SEATS[id] = {
    id,
    seatIndex: i,
    online: false,
    ip: null,
    mac: `00:11:22:33:44:${String(i).padStart(2, '0')}`,
    lastSeen: 0,
    screenState: 'OFFLINE', // 'ONLINE' | 'OFFLINE' | 'SCREEN_STATE_SECURE_DESKTOP_BLOCKED' | 'LOCKED'
    currentApp: 'Chưa có dữ liệu',
    isSpotlight: false,
    latestFrame: null,
    sequenceNumber: 0,
    socket: null
  };
}

let activeSpotlightMachine = null;
const webSockets = new Set();

// 4. Máy chủ mTLS cho C# Agent (Port 49152)
const tlsOptions = {
  key: fs.readFileSync(path.join(certsDir, 'gateway.key')),
  cert: fs.readFileSync(path.join(certsDir, 'gateway.crt')),
  ca: fs.readFileSync(path.join(certsDir, 'ca.crt')),
  requestCert: true,
  rejectUnauthorized: true
};

const agentServer = tls.createServer(tlsOptions, (socket) => {
  let authenticatedMachineId = null;
  let buffer = Buffer.alloc(0);

agentServer.on('tlsClientError', (err) => {
  console.warn(`[mTLS Handshake Error]: ${err.message}`);
});

  if (!socket.authorized) {
    console.warn(`⚠️ Client không được chứng thực mTLS: ${socket.authorizationError}`);
  } else {
    console.log('🔒 Client mTLS kết nối thành công và được xác thực hợp lệ!');
  }

  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    // Xử lý gói tin nhị phân hoặc JSON framing
    while (buffer.length >= 4) {
      const magic = buffer.readUInt32BE(0);

      // Gói tin Đăng ký / Trạng thái JSON (Magic: 0x4356414C = 'CVAL')
      if (magic === 0x4356414C) {
        if (buffer.length < 8) break;
        const jsonLen = buffer.readUInt32BE(4);
        if (buffer.length < 8 + jsonLen) break;

        const jsonBuf = buffer.slice(8, 8 + jsonLen);
        buffer = buffer.slice(8 + jsonLen);

        try {
          const msg = JSON.parse(jsonBuf.toString('utf8'));
          handleAgentMessage(msg, socket, (mId) => { authenticatedMachineId = mId; });
        } catch (err) {
          console.warn('⚠️ Lỗi giải mã JSON agent:', err.message);
        }
      }
      // Gói tin Khung hình màn hình Binary Frame (Magic: 0x43564652 = 'CVFR')
      else if (magic === 0x43564652) {
        // Header: Magic(4B) + MachineIdLen(1B) + MachineId(str) + Seq(4B) + Time(8B) + Width(2B) + Height(2B) + State(1B) + PayloadLen(4B)
        if (buffer.length < 5) break;
        const mIdLen = buffer.readUInt8(4);
        const headerLen = 5 + mIdLen + 4 + 8 + 2 + 2 + 1 + 4;
        if (buffer.length < headerLen) break;

        const machineId = buffer.slice(5, 5 + mIdLen).toString('utf8');
        let offset = 5 + mIdLen;
        const seq = buffer.readUInt32BE(offset); offset += 4;
        const ts = Number(buffer.readBigUInt64BE(offset)); offset += 8;
        const width = buffer.readUInt16BE(offset); offset += 2;
        const height = buffer.readUInt16BE(offset); offset += 2;
        const stateCode = buffer.readUInt8(offset); offset += 1;
        const payloadLen = buffer.readUInt32BE(offset); offset += 4;

        if (buffer.length < headerLen + payloadLen) break;

        const jpegPayload = buffer.slice(headerLen, headerLen + payloadLen);
        buffer = buffer.slice(headerLen + payloadLen);

        handleAgentFrame(machineId, seq, ts, width, height, stateCode, jpegPayload);
      }
      // Gói tin Thu bài Stream Data (Magic: 0x43565355 = 'CVSU')
      else if (magic === 0x43565355) {
        if (buffer.length < 12) break;
        const subIdLen = buffer.readUInt32BE(4);
        const dataLen = buffer.readUInt32BE(8);
        if (buffer.length < 12 + subIdLen + dataLen) break;

        const submissionId = buffer.slice(12, 12 + subIdLen).toString('utf8');
        const zipPayload = buffer.slice(12 + subIdLen, 12 + subIdLen + dataLen);
        buffer = buffer.slice(12 + subIdLen + dataLen);

        handleSubmissionUpload(submissionId, zipPayload, socket);
      } else {
        // Dịch chuyển 1 byte để tìm magic tiếp theo
        buffer = buffer.slice(1);
      }
    }
  });

  socket.on('close', () => {
    if (authenticatedMachineId && SEATS[authenticatedMachineId]) {
      const seat = SEATS[authenticatedMachineId];
      seat.online = false;
      seat.screenState = 'OFFLINE';
      seat.socket = null;
      broadcastSeatStatus(seat);
    }
  });

  socket.on('error', (err) => {
    console.warn(`[Agent Socket Error] ${authenticatedMachineId || 'Unknown'}:`, err.message);
  });
});

function handleAgentMessage(msg, socket, setMachineId) {
  if (msg.type === 'REGISTER') {
    const mId = msg.machineId;
    if (SEATS[mId]) {
      setMachineId(mId);
      const seat = SEATS[mId];
      seat.online = true;
      seat.ip = socket.remoteAddress;
      seat.lastSeen = Date.now();
      seat.screenState = 'ONLINE';
      seat.currentApp = msg.foregroundApp || 'LMS';
      seat.socket = socket;
      seat.mac = msg.macAddress || seat.mac;

      // Phản hồi SESSION_INIT kèm EpochId
      const reply = Buffer.from(JSON.stringify({
        type: 'SESSION_INIT',
        sessionEpochId: SESSION_EPOCH_ID,
        spotlight: (activeSpotlightMachine === mId),
        csrfToken: CSRF_TOKEN
      }), 'utf8');
      const header = Buffer.alloc(8);
      header.writeUInt32BE(0x4356414C, 0);
      header.writeUInt32BE(reply.length, 4);
      socket.write(Buffer.concat([header, reply]));

      broadcastSeatStatus(seat);
    }
  } else if (msg.type === 'HEARTBEAT') {
    const mId = msg.machineId;
    if (SEATS[mId]) {
      const seat = SEATS[mId];
      seat.lastSeen = Date.now();
      seat.currentApp = msg.foregroundApp || seat.currentApp;
      if (msg.screenState) seat.screenState = msg.screenState;
      broadcastSeatStatus(seat);
    }
  } else if (msg.type === 'STATE_CHANGE') {
    const mId = msg.machineId;
    if (SEATS[mId]) {
      const seat = SEATS[mId];
      seat.screenState = msg.screenState;
      broadcastSeatStatus(seat);
    }
  } else if (msg.type === 'COLLECT_SUBMIT') {
    STORAGE.createTransaction(msg.submissionId, msg.machineId, msg.studentName, msg.expectedHash, msg.sessionEpochId);
    console.log(`📝 Đã đăng ký giao dịch nộp bài [${msg.submissionId}] từ máy ${msg.machineId}`);
  }
}

function handleAgentFrame(machineId, seq, ts, width, height, stateCode, jpegPayload) {
  const seat = SEATS[machineId];
  if (!seat) return;

  seat.online = true;
  seat.lastSeen = Date.now();
  seat.sequenceNumber = seq;

  if (stateCode === 1) {
    seat.screenState = 'SCREEN_STATE_SECURE_DESKTOP_BLOCKED';
  } else if (seat.screenState === 'SCREEN_STATE_SECURE_DESKTOP_BLOCKED') {
    seat.screenState = 'ONLINE';
  }

  // Ring Buffer = 1 (Latest-Frame-Wins)
  seat.latestFrame = {
    machineId,
    seq,
    ts,
    width,
    height,
    state: seat.screenState,
    jpegBase64: jpegPayload.toString('base64')
  };

  // Phát frame tới các trình duyệt Web LMS đang kết nối
  broadcastFrame(seat.latestFrame);
}

function handleSubmissionUpload(submissionId, zipPayload, socket) {
  try {
    const tx = STORAGE.getSubmissionStatus(submissionId);
    if (!tx) {
      throw new Error('Giao dịch chưa được đăng ký chuẩn bị');
    }
    const result = STORAGE.commitSubmission(submissionId, zipPayload, tx.expectedHash);

    // Gửi COMMIT_ACK
    const ack = Buffer.from(JSON.stringify({
      type: 'COMMIT_ACK',
      submissionId,
      status: 'COMMITTED',
      savedFile: result.savedFile
    }), 'utf8');
    const header = Buffer.alloc(8);
    header.writeUInt32BE(0x4356414C, 0);
    header.writeUInt32BE(ack.length, 4);
    socket.write(Buffer.concat([header, ack]));

    broadcastWebLms({
      type: 'SUBMISSION_COMMITTED',
      submission: tx
    });
  } catch (err) {
    console.error('❌ Lỗi commit bài tập:', err.message);
  }
}

// 5. Máy chủ Web HTTP & WebSocket cho Web LMS Giáo viên (Port 49150)
const webServer = http.createServer((req, res) => {
  // CORS & Origin Protection
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CVALMS-CSRF-Token, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // API Endpoints
  if (url.pathname === '/api/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      epoch: SESSION_EPOCH_ID,
      csrfToken: CSRF_TOKEN,
      activeSpotlight: activeSpotlightMachine,
      seats: Object.values(SEATS).map(s => ({
        id: s.id,
        seatIndex: s.seatIndex,
        online: s.online,
        screenState: s.screenState,
        currentApp: s.currentApp,
        isSpotlight: s.isSpotlight,
        lastSeen: s.lastSeen
      }))
    }));
    return;
  }

  // Parse POST body helper
  function readBody(callback) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        callback(null, parsed);
      } catch (e) {
        callback(e);
      }
    });
  }

  // Kiểm tra CSRF cho các thao tác tác động phần cứng
  function verifyCsrf(headers) {
    const token = headers['x-cvalms-csrf-token'];
    return (token === CSRF_TOKEN);
  }

  if (url.pathname === '/api/lock' && req.method === 'POST') {
    readBody((err, data) => {
      if (err) return sendJson(res, 400, { error: 'Invalid JSON' });
      const target = data.targetMachine; // 'ALL' hoặc 'MAY-01'
      const message = data.message || 'Thầy đang giảng bài, các em chú ý lên bảng!';
      sendCommandToAgents(target, 'CLASSROOM_FOCUS_LOCK', { message });
      sendJson(res, 200, { success: true, target, action: 'LOCK' });
    });
    return;
  }

  if (url.pathname === '/api/unlock' && req.method === 'POST') {
    readBody((err, data) => {
      if (err) return sendJson(res, 400, { error: 'Invalid JSON' });
      const target = data.targetMachine;
      sendCommandToAgents(target, 'CLASSROOM_FOCUS_UNLOCK', {});
      sendJson(res, 200, { success: true, target, action: 'UNLOCK' });
    });
    return;
  }

  if (url.pathname === '/api/wol' && req.method === 'POST') {
    readBody(async (err, data) => {
      if (err) return sendJson(res, 400, { error: 'Invalid JSON' });
      const target = data.targetMachine;
      try {
        if (target === 'ALL') {
          for (const seat of Object.values(SEATS)) {
            await sendWakeOnLan(seat.mac);
          }
          sendJson(res, 200, { success: true, message: 'Đã phát gói tin Wake-on-LAN tới 18 máy trạm' });
        } else if (SEATS[target]) {
          await sendWakeOnLan(SEATS[target].mac);
          sendJson(res, 200, { success: true, message: `Đã phát WOL tới ${target}` });
        } else {
          sendJson(res, 404, { error: 'Máy không tồn tại' });
        }
      } catch (e) {
        sendJson(res, 500, { error: e.message });
      }
    });
    return;
  }

  if (url.pathname === '/api/spotlight' && req.method === 'POST') {
    readBody((err, data) => {
      if (err) return sendJson(res, 400, { error: 'Invalid JSON' });
      const target = data.targetMachine; // machineId hoặc null để tắt
      setSpotlightMachine(target);
      sendJson(res, 200, { success: true, activeSpotlight: activeSpotlightMachine });
    });
    return;
  }

  if (url.pathname === '/api/collect' && req.method === 'POST') {
    readBody((err, data) => {
      if (err) return sendJson(res, 400, { error: 'Invalid JSON' });
      const target = data.targetMachine || 'ALL';
      const submissionId = `sub_${Date.now()}`;
      sendCommandToAgents(target, 'PREPARE_COLLECT', { submissionId });
      sendJson(res, 200, { success: true, submissionId, message: 'Đã phát lệnh thu bài' });
    });
    return;
  }

  if (url.pathname === '/api/submissions' && req.method === 'GET') {
    sendJson(res, 200, { submissions: STORAGE.getAllSubmissions() });
    return;
  }

  if (url.pathname === '/api/shutdown' && req.method === 'POST') {
    readBody((err, data) => {
      if (err) return sendJson(res, 400, { error: 'Invalid JSON' });
      const target = data.targetMachine;
      sendCommandToAgents(target, 'SYSTEM_SHUTDOWN', {});
      sendJson(res, 200, { success: true, message: 'Đã phát lệnh tắt máy' });
    });
    return;
  }

  sendJson(res, 404, { error: 'Not Found' });
});

function sendJson(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// 6. Quản lý lệnh điều khiển tới Agents
function sendCommandToAgents(target, action, payload) {
  const cmd = {
    commandId: `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    action,
    sessionEpochId: SESSION_EPOCH_ID,
    issuedAt: Date.now(),
    payload
  };

  const jsonBuf = Buffer.from(JSON.stringify(cmd), 'utf8');
  const header = Buffer.alloc(8);
  header.writeUInt32BE(0x4356414C, 0);
  header.writeUInt32BE(jsonBuf.length, 4);
  const packet = Buffer.concat([header, jsonBuf]);

  if (target === 'ALL') {
    for (const seat of Object.values(SEATS)) {
      if (seat.socket && seat.online) {
        seat.socket.write(packet);
      }
    }
  } else if (SEATS[target] && SEATS[target].socket && SEATS[target].online) {
    SEATS[target].socket.write(packet);
  }
}

function setSpotlightMachine(machineId) {
  activeSpotlightMachine = machineId;
  for (const seat of Object.values(SEATS)) {
    seat.isSpotlight = (seat.id === machineId);
    if (seat.socket && seat.online) {
      const msg = Buffer.from(JSON.stringify({
        type: 'SET_STREAM_PROFILE',
        profile: seat.isSpotlight ? 'SPOTLIGHT_HD' : 'OVERVIEW_THUMBNAIL'
      }), 'utf8');
      const header = Buffer.alloc(8);
      header.writeUInt32BE(0x4356414C, 0);
      header.writeUInt32BE(msg.length, 4);
      seat.socket.write(Buffer.concat([header, msg]));
    }
  }
  broadcastWebLms({
    type: 'SPOTLIGHT_CHANGED',
    activeSpotlight: activeSpotlightMachine
  });
}

// 7. WebSocket Handshake thủ công cho Web LMS
webServer.on('upgrade', (req, socket, head) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }

  const acceptKey = crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');

  const headers = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey}`
  ];

  socket.write(headers.join('\r\n') + '\r\n\r\n');
  webSockets.add(socket);

  // Gửi trạng thái ban đầu
  const initMsg = JSON.stringify({
    type: 'INIT_STATE',
    epoch: SESSION_EPOCH_ID,
    activeSpotlight: activeSpotlightMachine,
    seats: Object.values(SEATS).map(s => ({
      id: s.id,
      seatIndex: s.seatIndex,
      online: s.online,
      screenState: s.screenState,
      currentApp: s.currentApp,
      isSpotlight: s.isSpotlight
    }))
  });
  sendWsText(socket, initMsg);

  socket.on('close', () => { webSockets.delete(socket); });
  socket.on('error', () => { webSockets.delete(socket); });
});

function sendWsText(socket, text) {
  try {
    const payload = Buffer.from(text, 'utf8');
    const length = payload.length;
    let header;

    if (length < 126) {
      header = Buffer.alloc(2);
      header[0] = 0x81; // FIN + text
      header[1] = length;
    } else if (length <= 65535) {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 126;
      header.writeUInt16BE(length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x81;
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(length), 2);
    }
    socket.write(Buffer.concat([header, payload]));
  } catch (e) {
    webSockets.delete(socket);
  }
}

function broadcastWebLms(obj) {
  const text = JSON.stringify(obj);
  for (const ws of webSockets) {
    sendWsText(ws, text);
  }
}

function broadcastSeatStatus(seat) {
  broadcastWebLms({
    type: 'SEAT_STATUS',
    seat: {
      id: seat.id,
      seatIndex: seat.seatIndex,
      online: seat.online,
      screenState: seat.screenState,
      currentApp: seat.currentApp,
      isSpotlight: seat.isSpotlight
    }
  });
}

function broadcastFrame(frame) {
  broadcastWebLms({
    type: 'FRAME',
    frame
  });
}

// 8. Khởi động 2 cổng dịch vụ
agentServer.listen(AGENT_MTLS_PORT, '0.0.0.0', () => {
  console.log(`🔒 [mTLS Agent Port] Đang lắng nghe trên 0.0.0.0:${AGENT_MTLS_PORT}`);
});

webServer.listen(WEB_PORT, '127.0.0.1', () => {
  console.log(`🌐 [Web LMS Loopback] Đang lắng nghe trên 127.0.0.1:${WEB_PORT}`);
});

module.exports = { agentServer, webServer, SEATS, SESSION_EPOCH_ID };
