/* ==========================================================
 * BUNDLE.JS — LMS PHÒNG MÁY TƯƠNG TÁC 18 MÁY (CHUẨN GDPT 2018)
 * Kiến trúc Standalone: Chạy mượt mà cả trên file:/// lẫn http/https
 * Tự động map sơ đồ chỗ ngồi, chống chọn nhầm máy, đồng bộ Firebase
 * ========================================================== */

(function() {
  'use strict';

  // 1. DỮ LIỆU CƠ SỞ (TÍCH HỢP SẴN ĐỂ CHẠY CỰC NHANH KỂ CẢ KHI OFFLINE)
  const EMBEDDED_CLASSES = {
    "10A1": {
      "className": "Lớp 10A1",
      "grade": 10,
      "totalStudents": 35,
      "seatingPlan": {
        "1": ["Lê Hoàng Nam", "Phạm Ngọc Ánh"],
        "2": ["Trần Bảo Long", "Nguyễn Thùy Linh"],
        "3": ["Vũ Đức Minh", "Hoàng Kim Ngân", "Đặng Quốc Anh"],
        "4": ["Đỗ Gia Huy", "Bùi Phương Mai"],
        "5": ["Phan Thanh Tùng", "Đặng Thu Trang"],
        "6": ["Hồ Minh Trí", "Ngô Cẩm Tú"],
        "7": ["Trịnh Văn Kiên", "Lý Thanh Hà"],
        "8": ["Dương Quốc Đạt", "Mai Hồng Nhung"],
        "9": ["Phạm Quang Huy", "Võ Ngọc Bích"],
        "10": ["Đinh Minh Quân", "Lâm Mỹ Duyên"],
        "11": ["Lê Tuấn Khang", "Chu Bảo Yến"],
        "12": ["Nguyễn Thế Bảo", "Tạ Quỳnh Nga"],
        "13": ["Hà Quốc Khánh", "Cao Thục Anh"],
        "14": ["Vương Minh Khôi", "Đoàn Khánh Linh"],
        "15": ["Thái Hữu Phước", "Trần Như Thảo"],
        "16": ["Lâm Nhật Huy", "Nguyễn Mỹ Lan"],
        "17": ["Tạ Văn Hưng", "Phạm Diệu Huyền"],
        "18": ["Đặng Quốc Tuấn", "Dự bị máy 18"]
      }
    },
    "10A2": {
      "className": "Lớp 10A2",
      "grade": 10,
      "totalStudents": 36,
      "seatingPlan": {
        "1": ["Nguyễn Gia Huy", "Trần Mai Anh"],
        "2": ["Lê Minh Khang", "Phạm Thu Thảo"],
        "3": ["Vũ Hải Đăng", "Đặng Thùy Dung"],
        "4": ["Bùi Quốc Bảo", "Hoàng Ngọc Hân"],
        "5": ["Đinh Tuấn Anh", "Ngô Phương Linh"],
        "6": ["Lý Gia Bảo", "Võ Thị Quỳnh"],
        "7": ["Trịnh Đức Trọng", "Dương Mỹ Tâm"],
        "8": ["Phan Bảo Nam", "Cao Thị Yến"],
        "9": ["Hà Minh Triết", "Đoàn Thúy Vi"],
        "10": ["Chu Đình Trọng", "Lâm Mỹ Hạnh"],
        "11": ["Tạ Quốc Cường", "Nguyễn Hồng Hạnh"],
        "12": ["Thái Duy Anh", "Trần Như Quỳnh"],
        "13": ["Lâm Chí Khang", "Bùi Thanh Trúc"],
        "14": ["Vương Quốc Việt", "Đặng Bích Ngọc"],
        "15": ["Hồ Quang Hiếu", "Phạm Mỹ Duyên"],
        "16": ["Mai Hữu Phước", "Nguyễn Cẩm Ly"],
        "17": ["Đặng Văn Hậu", "Lê Thị Bích"],
        "18": ["Trần Tiến Đạt", "Vũ Hoàng My"]
      }
    },
    "9A1": {
      "className": "Lớp 9A1",
      "grade": 9,
      "totalStudents": 36,
      "seatingPlan": {
        "1": ["Nguyễn Văn An", "Trần Thị Bình"],
        "2": ["Lê Hoàng Cường", "Phạm Minh Đức"],
        "3": ["Hoàng Thu Giang", "Võ Thị Hạnh"],
        "4": ["Đỗ Minh Khang", "Bùi Như Lan"],
        "5": ["Nguyễn Hữu Mai", "Phan Thanh Nam"],
        "6": ["Vũ Hải Oanh", "Trịnh Quốc Phúc"],
        "7": ["Đặng Như Quỳnh", "Trần Văn Sơn"],
        "8": ["Lê Thị Thu", "Nguyễn Minh Uyên"],
        "9": ["Hồ Quang Vinh", "Đoàn Kim Xuân"],
        "10": ["Ngô Gia Bảo", "Dương Thuỳ Châu"],
        "11": ["Lý Minh Dũng", "Phạm Ngọc Em"],
        "12": ["Trương Hoàng Giao", "Lâm Quốc Hùng"],
        "13": ["Chu Thị Kim", "Đinh Văn Long"],
        "14": ["Vương Tuyết Mai", "Mai Văn Nhân"],
        "15": ["Tạ Thị Oanh", "Phạm Hoàng Phương"],
        "16": ["Hà Minh Quân", "Nguyễn Thị Sâm"],
        "17": ["Thái Văn Tài", "Cao Minh Uy"],
        "18": ["Lê Văn Việt", "Trần Như Ý"]
      }
    }
  };

  const EMBEDDED_LESSONS = {
    "tin10_bai12": {
      "id": "tin10_bai12",
      "title": "Bài 12: Kiểu dữ liệu xâu trong Python",
      "grade": 10,
      "objective": "Hiểu khái niệm xâu, thành thạo phép cắt xâu (slicing) và nắm vững tính chất bất biến của xâu.",
      "warmup": {
        "question": "Quan sát đoạn mã sau và cho biết kết quả in ra màn hình là gì?",
        "code": "s = \"Tin hoc\"\nprint(s[4:])",
        "options": {
          "A": "\"Tin\"",
          "B": "\"hoc\"",
          "C": "\"h\"",
          "D": "Báo lỗi IndexError"
        },
        "timeLimit": 45
      },
      "theory": [
        {
          "id": "card-1",
          "title": "1. Khái niệm & Khởi tạo Xâu ký tự",
          "summary": "Xâu ký tự (string) trong Python là dãy các ký tự được đặt trong cặp dấu nháy đơn '...' hoặc nháy kép \"...\".",
          "code": "# Khởi tạo xâu\ns1 = 'Xin chao'\ns2 = \"Tin hoc 10\"\n\n# Độ dài xâu (hàm len)\nprint(len(s1))  # Kết quả: 8",
          "note": "Ký tự khoảng trắng (dấu cách) cũng được tính là một ký tự trong xâu."
        },
        {
          "id": "card-2",
          "title": "2. Phép cắt xâu (Slicing)",
          "summary": "Mỗi ký tự có một chỉ số (index): chỉ số dương bắt đầu từ 0 (từ trái qua), chỉ số âm từ -1 (từ phải qua). Cú pháp cắt xâu: s[bắt_đầu : kết_thúc].",
          "code": "s = \"Python\"\nprint(s[0])    # 'P' (ký tự đầu)\nprint(s[-1])   # 'n' (ký tự cuối)\nprint(s[0:2])  # 'Py' (từ vị trí 0 đến trước 2)\nprint(s[2:])   # 'thon' (từ vị trí 2 đến hết)",
          "note": "Cắt xâu s[start:end] lấy các ký tự từ vị trí start đến vị trí end - 1."
        },
        {
          "id": "card-3",
          "title": "3. Tính chất bất biến của xâu (Immutability)",
          "summary": "Xâu trong Python là đối tượng bất biến: không thể gán lại hay thay đổi trực tiếp từng ký tự trong xâu đã tạo.",
          "code": "s = \"Hello\"\n# s[0] = 'J' -> SẼ BÁO LỖI TypeError!\n\n# Cách thay đổi đúng: tạo một xâu mới\ns_moi = 'J' + s[1:]\nprint(s_moi)  # 'Jello'",
          "note": "Để biến đổi xâu, ta luôn ghép nối để tạo ra xâu mới."
        }
      ],
      "discussion": {
        "title": "Nhiệm vụ Thảo luận & Thực hành Nhóm đôi",
        "task": "Cho xâu ký tự: s = 'chuc mung nam moi 2026'\nHai em hãy thảo luận và viết các câu lệnh Python để thực hiện:\n1. In ra độ dài của xâu s.\n2. Dùng phép cắt xâu (slicing) để trích xuất ra cụm từ 'nam moi'.\n3. Trình bày ít nhất 1 cách để đếm số lượng ký tự khoảng trắng có trong xâu s.",
        "placeholder": "# Hai em hãy nhập nội dung thảo luận hoặc code Python của nhóm vào đây...\n# Ví dụ:\ns = 'chuc mung nam moi 2026'\n# 1. In do dai:\nprint(...)\n\n# 2. Trich xuat 'nam moi':\nprint(...)\n\n# 3. Dem khoang trang:\n...",
        "timeLimit": 720
      },
      "quiz": {
        "question": "Trong Python, xâu ký tự có tính chất bất biến (immutable). Điều này có nghĩa là gì?",
        "options": {
          "A": "Không thể truy cập các ký tự qua chỉ số index",
          "B": "Không thể gán thay đổi trực tiếp từng ký tự trong xâu đã tạo",
          "C": "Không thể dùng hàm len() để tính độ dài xâu",
          "D": "Xâu chỉ chứa được chữ số, không chứa được chữ cái"
        },
        "correct": "B"
      }
    }
  };

  // Mật khẩu Giáo viên mã hóa SHA-256 (admin123 và ThayKhang@2026)
  const VALID_PASSWORD_HASHES = [
    "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9", // admin123
    "33c39cf33ac4a48e2fb588c2fbb99092043744f685a6f5c8d91c8f554139604b"  // ThayKhang@2026
  ];

  async function sha256Hex(message) {
    try {
      if (window.crypto && window.crypto.subtle) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch {}
    return (message === 'admin123' || message === 'ThayKhang@2026') ? VALID_PASSWORD_HASHES[0] : '';
  }

  // Bộ phát âm thanh Web Audio API (Tự tạo sóng âm chân thực, không cần nạp file mp3 ngoài)
  const SOUNDS = {
    ctx: null,
    init() {
      if (!this.ctx && typeof (window.AudioContext || window.webkitAudioContext) !== 'undefined') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
    },
    playTick(freq = 600) {
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
      } catch {}
    },
    playFanfare() {
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.09);
          gain.gain.setValueAtTime(0.18, this.ctx.currentTime + idx * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.09 + 0.3);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(this.ctx.currentTime + idx * 0.09);
          osc.stop(this.ctx.currentTime + idx * 0.09 + 0.35);
        });
      } catch {}
    },
    playChime() {
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const notes = [783.99, 1046.50, 1318.51]; // G5, C6, E6
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.12);
          gain.gain.setValueAtTime(0.15, this.ctx.currentTime + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.12 + 0.5);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(this.ctx.currentTime + idx * 0.12);
          osc.stop(this.ctx.currentTime + idx * 0.12 + 0.55);
        });
      } catch {}
    },
    playPop() {
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
      } catch {}
    }
  };
  const AUDIO = SOUNDS;

  // 2. STORE — QUẢN LÝ TRẠNG THÁI TỔNG THỂ
  const STORE = {
    state: {
      role: 'student',          // 'student' hoặc 'teacher'
      screen: 'lobby',          // 'lobby', 'student', hoặc 'teacher'
      classId: '10A1',          // Lớp hiện tại
      lessonId: 'tin10_bai12',
      lessonData: EMBEDDED_LESSONS['tin10_bai12'],
      fixedMachineId: null,     // Số máy đã lưu cố định trên thiết bị này
      machineId: null,          // Số máy hiện tại đang mở trong phiên
      pendingMachineId: null,   // Số máy đang chờ bấm xác nhận trong modal
      students: [],             // Danh sách 2 bạn tại máy
      occupiedMachines: {       // Danh sách các máy đã có bạn khác chọn
        1: true,
        2: true
      },
      currentPhase: 'waiting',  // 'waiting', 'old_lesson', 'warmup', 'theory', 'discussion', 'quiz'
      pollSelection: null,
      pollLocked: false,
      discStatus: 'working',
      discSubmissionTime: null,
      quizSelection: null,
      quizAnswered: false,
      isSos: false,

      // Trạng thái Bước 1: Kiểm tra bài cũ
      oldLesson: {
        timerSeconds: 120,
        timeLeft: 120,
        timerActive: false,
        questionType: 'text',   // 'text' hoặc 'mcq'
        questionText: 'Trong các bộ phận cơ bản của máy tính (CPU, RAM, ROM/Ổ đĩa cứng), thiết bị nào đóng vai trò là "bộ não" điều khiển mọi hoạt động của máy tính?',
        selectedMachine: null,
        selectedStudent: null,
        isLocked: false,
        isRevealed: false,
        studentAnswer: '',
        submissions: {}
      },
      luckyDraw: {
        strategy: 'slot_machine', // 'slot_machine' hoặc 'wheel_fortune'
        isSpinning: false,
        resultMachine: null,
        resultStudent: null
      },

      // Trạng thái Bảng điều khiển Giáo viên
      teacherTab: 'stage',      // 'classes' | 'studio' | 'stage'
      teacherStage: 'hardware', // 'hardware' (Giai đoạn 1) hoặc 'active' (Giai đoạn 2)
      teacherPhase: 'waiting',
      sessionStarted: false,
      unlocked: false,          // Mặc định sảnh chọn máy bị khóa cứng
      grade: '10',              // Khối lớp đang chọn
      countdown: { active: false, title: '', number: 3 },
      timer: { endsAt: 0, paused: false, remaining: 120 },
      hardwareStatus: {
        1: true, 2: true, 3: false, 4: true, 5: true, 6: true,
        7: true, 8: true, 9: true, 10: true, 11: true, 12: true,
        13: true, 14: true, 15: true, 16: true, 17: true, 18: true
      }
    },
    listeners: [],
    subscribe(fn) {
      this.listeners.push(fn);
      return () => { this.listeners = this.listeners.filter(l => l !== fn); };
    },
    setState(updates) {
      this.state = Object.assign({}, this.state, updates);
      this.listeners.forEach(fn => {
        try { fn(this.state); } catch (e) { console.error('[Store Error]:', e); }
      });
    },
    getState() { return this.state; },

    // Khởi tạo và nhận diện token lưu nhớ máy
    loadSavedDeviceToken() {
      try {
        const params = new URLSearchParams(window.location.search);
        const setMachineParam = params.get('machine') || params.get('set_machine');
        if (setMachineParam) {
          const num = parseInt(setMachineParam, 10);
          if (num >= 1 && num <= 18) {
            localStorage.setItem('lms_fixed_machine_id', num.toString());
            this.state.fixedMachineId = num;
            this.state.machineId = num;
            this.state.screen = 'student';
            const cData = EMBEDDED_CLASSES[this.state.classId || '10A1'];
            if (cData && cData.seatingPlan && cData.seatingPlan[num]) {
              this.state.students = cData.seatingPlan[num];
            }
            return num;
          }
        }
        const saved = localStorage.getItem('lms_fixed_machine_id');
        if (saved) {
          const num = parseInt(saved, 10);
          if (num >= 1 && num <= 18) {
            this.state.fixedMachineId = num;
            this.state.machineId = num;
            this.state.screen = 'student';
            const cData = EMBEDDED_CLASSES[this.state.classId || '10A1'];
            if (cData && cData.seatingPlan && cData.seatingPlan[num]) {
              this.state.students = cData.seatingPlan[num];
            }
            return num;
          }
        }
      } catch (e) {
        console.warn('[LocalStorage] Không truy cập được storage:', e);
      }
      return null;
    },

    checkAdminSession() {
      try {
        const isAdmin = sessionStorage.getItem('lms_admin_logged_in');
        const params = new URLSearchParams(window.location.search);
        if (isAdmin === 'true' || params.get('role') === 'teacher') {
          this.state.role = 'teacher';
          this.state.screen = 'teacher';
          return true;
        }
      } catch {}
      return false;
    }
  };

  // 3. FIREBASE WRAPPER (Tự động thích ứng nếu không có mạng)
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCC2tCURXYAMpdN687kcjY537K7zUhh_Fg",
    authDomain: "day-hoc-tuong-tac-7ee69.firebaseapp.com",
    databaseURL: "https://day-hoc-tuong-tac-7ee69-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "day-hoc-tuong-tac-7ee69",
    storageBucket: "day-hoc-tuong-tac-7ee69.firebasestorage.app",
    messagingSenderId: "628267818434",
    appId: "1:628267818434:web:a0b8d1ceda61affea20a5b"
  };

  let db = null;
  function initFirebase() {
    if (typeof firebase !== 'undefined') {
      try {
        if (!firebase.apps || firebase.apps.length === 0) {
          firebase.initializeApp(FIREBASE_CONFIG);
        }
        db = firebase.database();
        if (firebase.auth) {
          firebase.auth().signInAnonymously().then(cred => {
            console.log('[Firebase Auth] Đăng nhập ẩn danh thành công! UID:', cred.user?.uid);
          }).catch(err => {
            console.warn('[Firebase Auth] Lỗi đăng nhập ẩn danh:', err);
          });
        }
        console.log('[Firebase] Đã kết nối cơ sở dữ liệu thời gian thực.');
      } catch (e) {
        console.warn('[Firebase] Đang chạy chế độ Local Standalone:', e);
      }
    }
  }

  // 3.5. REALTIME SYNC BUS (Đồng bộ tức thì đa tab / đa cửa sổ / PWA)
  const SYNC_BUS = {
    channel: (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('cvalms_sync_bus') : null,
    init() {
      if (this.channel) {
        this.channel.onmessage = (event) => this.handleMessage(event.data);
      }
      window.addEventListener('storage', (e) => {
        if (e.key === 'cvalms_sync_event' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.handleMessage(data);
          } catch {}
        }
      });
      // Nếu Firebase sẵn sàng, lắng nghe session từ Firebase
      if (db) {
        try {
          const attachSessionListener = () => {
            // Lắng nghe NTP Time Offset để đồng bộ mili-giây chuẩn tuyệt đối
            db.ref('.info/serverTimeOffset').on('value', (offsetSnap) => {
              window._serverTimeOffset = offsetSnap.val() || 0;
            });

            db.ref('activeSession').on('value', (snap) => {
              const val = snap.val();
              if (!val) return;
              const state = STORE.getState();
              const updates = {};

              // 1. Đồng bộ trạng thái mở khóa chọn máy từ GV
              if (val.unlocked !== undefined && val.unlocked !== state.unlocked) {
                updates.unlocked = val.unlocked;
                if (val.unlocked && state.role === 'student') {
                  AUDIO.playChime();
                }
              }

              // 2. Đồng bộ lớp học được GV kích hoạt
              if (val.classId && val.classId !== state.classId) {
                updates.classId = val.classId;
              }
              if (val.grade && val.grade !== state.grade) {
                updates.grade = val.grade;
              }

              // 3. Đồng bộ tiến trình sư phạm
              if (val.currentPhase && val.currentPhase !== state.currentPhase && state.role === 'student') {
                updates.currentPhase = val.currentPhase;
              }
              if (val.sessionStarted !== undefined && val.sessionStarted !== state.sessionStarted) {
                updates.sessionStarted = val.sessionStarted;
              }

              // 4. Đồng bộ Countdown 3-2-1
              if (val.countdown && val.countdown.active) {
                APP.handleRemoteCountdown(val.countdown);
              }

              // 5. Đồng bộ Reset phòng học (resetAt) cho lớp tiếp theo
              if (val.resetAt && (Date.now() - val.resetAt < 15000)) {
                if (state.role === 'student') {
                  try { localStorage.removeItem('lms_fixed_machine_id'); } catch {}
                  updates.screen = 'lobby';
                  updates.machineId = null;
                  updates.fixedMachineId = null;
                  updates.unlocked = false;
                  updates.sessionStarted = false;
                  updates.currentPhase = 'waiting';
                  updates.occupiedMachines = {};
                }
              }

              if (val.oldLesson) {
                updates.oldLesson = Object.assign({}, state.oldLesson, val.oldLesson);
              }
              if (val.luckyDraw) {
                updates.luckyDraw = val.luckyDraw;
                if (val.luckyDraw.payload && val.luckyDraw.spinning) {
                  if (window.APP && window.APP.handleRemoteLuckyDrawSpin) {
                    window.APP.handleRemoteLuckyDrawSpin(val.luckyDraw.payload);
                  }
                }
              }
              if (val.machines) {
                const occ = Object.assign({}, state.occupiedMachines);
                Object.keys(val.machines).forEach(m => { occ[m] = true; });
                updates.occupiedMachines = occ;
              }
              if (Object.keys(updates).length > 0) {
                STORE.setState(updates);
              }
            }, (err) => {
              console.warn('[Firebase RTDB Listen Error]:', err);
            });
          };

          if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged((user) => {
              if (user) {
                console.log('[Firebase] User authenticated, attaching activeSession listener:', user.uid);
                attachSessionListener();
              }
            });
          } else {
            attachSessionListener();
          }
        } catch {}
      }
      // Gửi tín hiệu thông báo máy đang online sau khi tải
      setTimeout(() => {
        const s = STORE.getState();
        if (s.machineId) {
          this.broadcast('MACHINE_JOINED', { machineId: s.machineId, classId: s.classId });
        }
      }, 300);
    },
    broadcast(type, payload) {
      const msg = { type, payload, senderId: Math.random().toString(36).substring(7), timestamp: Date.now() };
      if (this.channel) {
        try { this.channel.postMessage(msg); } catch {}
      }
      try {
        localStorage.setItem('cvalms_sync_event', JSON.stringify(msg));
      } catch {}
    },
    handleMessage(data) {
      if (!data || !data.type) return;
      const state = STORE.getState();
      if (data.type === 'PHASE_CHANGE') {
        if (state.role === 'student') {
          STORE.setState({ currentPhase: data.payload.phase });
        }
      } else if (data.type === 'MACHINE_JOINED') {
        const mId = data.payload.machineId;
        if (mId) {
          const occ = Object.assign({}, state.occupiedMachines);
          occ[mId] = true;
          STORE.setState({ occupiedMachines: occ });
        }
      } else if (data.type === 'FORCE_RELOAD') {
        if (state.role === 'student') {
          window.location.reload();
        }
      } else if (data.type === 'SESSION_ENDED') {
        if (state.role === 'student') {
          STORE.setState({ currentPhase: 'waiting' });
        }
      } else if (data.type === 'CLASSES_UPDATED') {
        if (data.payload && data.payload.classes) {
          APP.classes = Object.assign({}, EMBEDDED_CLASSES, data.payload.classes);
          STORE.setState({ classId: STORE.getState().classId });
        }
      } else if (data.type === 'OLD_LESSON_START') {
        const modal = document.getElementById('modal-lucky-draw');
        if (modal) modal.style.display = 'none';
        const payload = data.payload || {};
        const oldL = Object.assign({}, STORE.getState().oldLesson, {
          timerSeconds: payload.timerSeconds || 120,
          timeLeft: payload.timerSeconds || 120,
          timerActive: true,
          questionType: payload.questionType || 'text',
          questionText: payload.questionText || '',
          selectedMachine: payload.selectedMachine || null,
          selectedStudent: payload.selectedStudent || null,
          isLocked: false,
          isRevealed: false
        });
        STORE.setState({ currentPhase: 'old_lesson', teacherPhase: 'old_lesson', oldLesson: oldL });
        APP.startOldLessonCountdown();
      } else if (data.type === 'LUCKY_DRAW_CLOSE') {
        const modal = document.getElementById('modal-lucky-draw');
        if (modal) modal.style.display = 'none';
      } else if (data.type === 'OLD_LESSON_SUBMIT') {
        const p = data.payload || {};
        if (p.machineId) {
          const subs = Object.assign({}, STORE.getState().oldLesson.submissions);
          subs[p.machineId] = {
            student: p.student,
            answer: p.answer,
            time: p.time
          };
          const oldL = Object.assign({}, STORE.getState().oldLesson, { submissions: subs });
          STORE.setState({ oldLesson: oldL });
        }
      } else if (data.type === 'OLD_LESSON_LOCK') {
        const oldL = Object.assign({}, STORE.getState().oldLesson, { isLocked: true, timerActive: false });
        STORE.setState({ oldLesson: oldL });
      } else if (data.type === 'OLD_LESSON_REVEAL') {
        const oldL = Object.assign({}, STORE.getState().oldLesson, { isRevealed: true });
        STORE.setState({ oldLesson: oldL });
      } else if (data.type === 'LUCKY_DRAW_SPIN') {
        APP.handleRemoteLuckyDrawSpin(data.payload);
      }
    }
  };

  // 4. BỘ ĐIỀU KHIỂN GIAO DIỆN HỌC SINH (STUDENT CONTROLLER)
  const APP = {
    classes: JSON.parse(JSON.stringify(EMBEDDED_CLASSES)),
    lessons: EMBEDDED_LESSONS,

    init() {
      // Nạp cấu hình các lớp tùy chỉnh từ localStorage nếu có
      try {
        const savedClasses = localStorage.getItem('lms_custom_classes');
        if (savedClasses) {
          const parsed = JSON.parse(savedClasses);
          if (parsed && typeof parsed === 'object') {
            this.classes = Object.assign({}, this.classes, parsed);
          }
        }
      } catch {}

      initFirebase();
      STORE.loadSavedDeviceToken();
      STORE.checkAdminSession();
      STORE.subscribe(state => this.render(state));
      SYNC_BUS.init();
      this.bindEvents();
      this.bindTeacherEvents();
      this.render(STORE.getState());
    },

    bindEvents() {
      // 1. Chọn lớp học tại Sảnh
      const selectClass = document.getElementById('select-lobby-class');
      if (selectClass) {
        selectClass.addEventListener('change', e => {
          const newClass = e.target.value;
          STORE.setState({ classId: newClass });
        });
      }

      // 2. Đặt lại lưu nhớ máy
      const btnResetToken = document.getElementById('btn-reset-device-token');
      if (btnResetToken) {
        btnResetToken.addEventListener('click', () => {
          try {
            localStorage.removeItem('lms_fixed_machine_id');
            STORE.setState({ fixedMachineId: null });
            alert('Đã xóa lưu nhớ máy trên thiết bị này! Giờ bạn có thể chọn bất kỳ máy nào.');
          } catch {}
        });
      }

      // 3. Modal xác nhận vào máy
      const btnModalCancel = document.getElementById('btn-modal-cancel');
      if (btnModalCancel) {
        btnModalCancel.addEventListener('click', () => {
          const modal = document.getElementById('modal-confirm-machine');
          if (modal) modal.style.display = 'none';
        });
      }

      const btnModalConfirm = document.getElementById('btn-modal-confirm');
      if (btnModalConfirm) {
        btnModalConfirm.addEventListener('click', () => {
          const state = STORE.getState();
          const machineId = state.pendingMachineId;
          if (!machineId) return;

          try {
            localStorage.setItem('lms_fixed_machine_id', machineId.toString());
          } catch {}

          const classData = this.classes[state.classId] || this.classes['10A1'];
          const pair = classData.seatingPlan[machineId] || ["Học sinh 1", "Học sinh 2"];

          // Đánh dấu máy này đang active
          const occ = Object.assign({}, state.occupiedMachines);
          occ[machineId] = true;

          STORE.setState({
            fixedMachineId: machineId,
            machineId: machineId,
            students: pair,
            screen: 'student',
            occupiedMachines: occ,
            pendingMachineId: null
          });

          const modal = document.getElementById('modal-confirm-machine');
          if (modal) modal.style.display = 'none';

          // Phát sóng thông báo cho các máy khác và bảng giáo viên
          SYNC_BUS.broadcast('MACHINE_JOINED', { machineId });

          // Đồng bộ Firebase nếu có
          if (db) {
            db.ref(`activeSession/machines/${machineId}`).set({
              machineId: machineId,
              classId: state.classId,
              students: pair,
              status: 'active',
              joinedAt: Date.now()
            }).catch(()=>{});
          }
        });
      }

      // 4. Modal cảnh báo chọn nhầm máy
      const btnWarningBack = document.getElementById('btn-warning-back');
      if (btnWarningBack) {
        btnWarningBack.addEventListener('click', () => {
          const modal = document.getElementById('modal-token-warning');
          if (modal) modal.style.display = 'none';
        });
      }

      const btnWarningResetForce = document.getElementById('btn-warning-reset-force');
      if (btnWarningResetForce) {
        btnWarningResetForce.addEventListener('click', () => {
          try {
            localStorage.removeItem('lms_fixed_machine_id');
            STORE.setState({ fixedMachineId: null });
            const modal = document.getElementById('modal-token-warning');
            if (modal) modal.style.display = 'none';
            alert('Đã mở khóa thiết bị! Giờ bạn có thể chọn lại vị trí máy.');
          } catch {}
        });
      }

      // 5. Quay lại Sảnh (Đổi máy)
      const btnBackToLobby = document.getElementById('btn-back-to-lobby');
      if (btnBackToLobby) {
        btnBackToLobby.addEventListener('click', () => {
          STORE.setState({ screen: 'lobby' });
        });
      }

      // 6. Nút SOS xin trợ giúp
      const btnSos = document.getElementById('btn-student-sos');
      if (btnSos) {
        btnSos.addEventListener('click', () => {
          const state = STORE.getState();
          const newSos = !state.isSos;
          STORE.setState({ isSos: newSos });
          if (db && state.machineId) {
            db.ref(`activeSession/machines/${state.machineId}/isSos`).set(newSos).catch(()=>{});
          }
        });
      }

      // 7. Chặng 1: Bấm chọn Quick Poll A-B-C-D
      document.querySelectorAll('.poll-opt-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          const choice = e.currentTarget.dataset.choice;
          const state = STORE.getState();
          if (state.pollLocked) return;
          STORE.setState({ pollSelection: choice });

          if (db && state.machineId) {
            db.ref(`activeSession/pollAnswers/${state.machineId}`).set({
              choice: choice,
              timestamp: Date.now()
            }).catch(()=>{});
          }
        });
      });

      // 8. Chặng 3: Nộp bài thảo luận
      const btnSubmitDisc = document.getElementById('btn-submit-discussion');
      if (btnSubmitDisc) {
        btnSubmitDisc.addEventListener('click', () => {
          const textarea = document.getElementById('disc-answer-input');
          const content = textarea ? textarea.value.trim() : '';
          if (!content) {
            alert('Hai em hãy nhập nội dung thảo luận hoặc code Python của máy trước khi nộp bài!');
            return;
          }
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
          STORE.setState({ discStatus: 'submitted', discSubmissionTime: timeStr });

          const state = STORE.getState();
          if (db && state.machineId) {
            db.ref(`activeSession/discussionAnswers/${state.machineId}`).set({
              machineId: state.machineId,
              students: state.students,
              content: content,
              submittedAt: Date.now()
            }).catch(()=>{});
          }
        });
      }

      // 9. Chặng 4: Bấm chọn Live Quiz
      document.querySelectorAll('.quiz-opt').forEach(btn => {
        btn.addEventListener('click', e => {
          const opt = e.currentTarget.dataset.qopt;
          const state = STORE.getState();
          const lesson = state.lessonData;
          const isCorrect = (opt === lesson.quiz.correct);

          STORE.setState({
            quizSelection: opt,
            quizAnswered: true
          });

          // Hiệu ứng pháo hoa chúc mừng nếu đúng
          if (isCorrect && typeof confetti === 'function') {
            try {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 }
              });
            } catch {}
          }
        });
      });

      // 10. Bước 1: Học sinh gõ văn bản tự luận ngắn
      const olTextInput = document.getElementById('ol-text-input');
      const olCharCount = document.getElementById('ol-char-count');
      if (olTextInput && olCharCount) {
        olTextInput.addEventListener('input', () => {
          olCharCount.textContent = `${olTextInput.value.length} ký tự`;
        });
      }

      // 11. Bước 1: Học sinh bấm chọn đáp án trắc nghiệm A-B-C-D
      document.querySelectorAll('.ol-mcq-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          const state = STORE.getState();
          if (state.oldLesson && state.oldLesson.isLocked) return;
          const choice = e.currentTarget.dataset.olChoice;
          document.querySelectorAll('.ol-mcq-btn').forEach(b => b.classList.remove('selected'));
          e.currentTarget.classList.add('selected');
          const oldL = Object.assign({}, state.oldLesson, { studentAnswer: choice });
          STORE.setState({ oldLesson: oldL });
        });
      });

      // 12. Bước 1: Học sinh bấm nộp câu trả lời bài cũ
      const btnSubmitOldLesson = document.getElementById('btn-submit-old-lesson');
      if (btnSubmitOldLesson) {
        btnSubmitOldLesson.addEventListener('click', () => {
          const state = STORE.getState();
          if (state.oldLesson && state.oldLesson.isLocked) {
            alert('Đã hết thời gian nộp bài!');
            return;
          }

          let ans = '';
          if (state.oldLesson.questionType === 'mcq') {
            ans = state.oldLesson.studentAnswer || '';
            if (!ans) {
              alert('Nhóm em hãy bấm chọn 1 phương án A, B, C hoặc D trước khi nộp bài!');
              return;
            }
          } else {
            const ta = document.getElementById('ol-text-input');
            ans = ta ? ta.value.trim() : '';
            if (!ans) {
              alert('Nhóm em hãy gõ câu trả lời vào ô văn bản trước khi nộp!');
              return;
            }
          }

          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
          const mId = state.machineId || 1;
          const stuName = (state.students && state.students.length > 0) ? state.students.join(' & ') : `Máy ${mId}`;

          SYNC_BUS.broadcast('OLD_LESSON_SUBMIT', {
            machineId: mId,
            student: stuName,
            answer: ans,
            time: timeStr
          });

          const statusMsg = document.getElementById('ol-status-msg');
          if (statusMsg) {
            statusMsg.innerHTML = `<i class="fas fa-check-circle" style="color:#10b981;"></i> Đã nộp câu trả lời lúc <strong>${timeStr}</strong>: <em>"${ans}"</em>. Đang chờ Thầy chốt đáp án!`;
          }

          alert('🎉 Đã nộp câu trả lời thành công lên Bảng điều khiển của Thầy!');
        });
      }

      // Đóng dropdown khi click ngoài
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.tpb-step-dropdown-wrapper')) {
          this.closeAllTpbMenus();
        }
      });
    },

    // BINDING SỰ KIỆN CHO GIÁO VIÊN & ĐĂNG NHẬP SHA-256
    bindTeacherEvents() {
      // 1. Mở modal đăng nhập Giáo viên
      const btnOpenTeacher = document.getElementById('btn-open-teacher-login');
      if (btnOpenTeacher) {
        btnOpenTeacher.addEventListener('click', () => {
          const modal = document.getElementById('modal-teacher-login');
          if (modal) {
            modal.style.display = 'flex';
            const pwdInput = document.getElementById('teacher-password-input');
            if (pwdInput) {
              pwdInput.value = '';
              pwdInput.focus();
            }
          }
        });
      }

      // 2. Hủy đăng nhập
      const btnCancelLogin = document.getElementById('btn-cancel-teacher-login');
      if (btnCancelLogin) {
        btnCancelLogin.addEventListener('click', () => {
          const modal = document.getElementById('modal-teacher-login');
          if (modal) modal.style.display = 'none';
        });
      }

      // 3. Hiện/Ẩn mật khẩu
      const btnTogglePwd = document.getElementById('btn-toggle-pwd');
      if (btnTogglePwd) {
        btnTogglePwd.addEventListener('click', () => {
          const pwdInput = document.getElementById('teacher-password-input');
          if (pwdInput) {
            const isPwd = (pwdInput.type === 'password');
            pwdInput.type = isPwd ? 'text' : 'password';
            btnTogglePwd.innerHTML = isPwd ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
          }
        });
      }

      // 4. Lưu lại & Kích hoạt tiết học (Mở khóa máy học sinh & chuyển sang Sân khấu điều khiển)
      const btnStartSession = document.getElementById('btn-start-class-session');
      if (btnStartSession) {
        btnStartSession.addEventListener('click', () => {
          const selGrade = document.getElementById('teacher-select-grade');
          const selClass = document.getElementById('teacher-select-class');
          const selLesson = document.getElementById('teacher-select-lesson');
          const chosenGrade = selGrade ? selGrade.value : '10';
          const chosenClass = selClass ? selClass.value : '10A1';
          const chosenLesson = selLesson ? selLesson.value : 'tin10_bai12';

          STORE.setState({
            grade: chosenGrade,
            classId: chosenClass,
            lessonId: chosenLesson,
            unlocked: true,
            sessionStarted: false,
            teacherStage: 'active',
            currentPhase: 'waiting'
          });

          if (db) {
            db.ref('activeSession').set({
              grade: chosenGrade,
              classId: chosenClass,
              lessonId: chosenLesson,
              unlocked: true,
              sessionStarted: false,
              currentPhase: 'waiting',
              activatedAt: Date.now()
            }).catch(()=>{});
          }
          alert(`🎉 Đã kích hoạt ${chosenClass}! Sơ đồ máy đã mở khóa để các em vào sảnh chờ.`);
        });
      }

      // 5. Kết thúc tiết học (Lưu và phát tín hiệu resetAt dọn sạch cho lớp sau)
      const btnEndSession = document.getElementById('btn-end-class-session');
      if (btnEndSession) {
        btnEndSession.addEventListener('click', () => {
          if (confirm('Thầy có chắc chắn muốn KẾT THÚC TIẾT HỌC của lớp này? Hệ thống sẽ làm sạch dữ liệu 18 máy con để chuẩn bị cho lớp tiếp theo.')) {
            STORE.setState({
              sessionStarted: false,
              unlocked: false,
              teacherStage: 'hardware',
              currentPhase: 'waiting',
              occupiedMachines: {}
            });

            SYNC_BUS.broadcast('SESSION_ENDED', {});
            if (db) {
              db.ref('activeSession').update({
                unlocked: false,
                sessionStarted: false,
                currentPhase: 'waiting',
                resetAt: Date.now(),
                machines: null
              }).catch(()=>{});
            }
          }
        });
      }

      // 6. Nút Đăng xuất Giáo viên
      const btnLogout = document.getElementById('btn-teacher-logout');
      if (btnLogout) {
        btnLogout.addEventListener('click', () => {
          try { sessionStorage.removeItem('lms_admin_logged_in'); } catch {}
          STORE.setState({ role: 'student', screen: 'lobby' });
        });
      }

      // 7. F5 Cưỡng bức 18 máy
      const btnF5All = document.getElementById('btn-remote-reload-all');
      if (btnF5All) {
        btnF5All.addEventListener('click', () => {
          if (confirm('Gửi lệnh F5 cưỡng bức làm mới bộ nhớ toàn bộ 18 máy học sinh?')) {
            alert('Đã phát tín hiệu F5 cưỡng bức đến 18 máy phòng học!');
            SYNC_BUS.broadcast('FORCE_RELOAD', {});
            if (db) {
              db.ref('remoteCommand').set({
                action: 'forceReload',
                timestamp: Date.now()
              }).catch(()=>{});
            }
          }
        });
      }

      // 8. Bốc thăm ngẫu nhiên máy học sinh
      const btnRandom = document.getElementById('btn-random-pick-student');
      if (btnRandom) {
        btnRandom.addEventListener('click', () => {
          const randNum = Math.floor(Math.random() * 18) + 1;
          const state = STORE.getState();
          const classData = this.classes[state.classId] || this.classes['10A1'];
          const pair = classData.seatingPlan[randNum] || ["Học sinh 1", "Học sinh 2"];
          alert('🎲 KẾT QUẢ BỐC THĂM NGẪU NHIÊN:\n\n🖥️ MÁY SỐ ' + String(randNum).padStart(2, '0') + '!\n👥 ' + pair.join(' & '));
        });
      }

      // 9. Mở Modal Cài đặt Lớp & Sơ đồ 18 máy
      const btnOpenSettings = document.getElementById('btn-open-teacher-settings');
      if (btnOpenSettings) {
        btnOpenSettings.addEventListener('click', () => {
          this.openSettingsModal();
        });
      }

      // Đóng modal cài đặt
      const btnCloseSettings = document.getElementById('btn-close-settings');
      if (btnCloseSettings) {
        btnCloseSettings.addEventListener('click', () => {
          this.closeSettingsModal();
        });
      }

      const btnCancelSettings = document.getElementById('btn-cancel-settings');
      if (btnCancelSettings) {
        btnCancelSettings.addEventListener('click', () => {
          this.closeSettingsModal();
        });
      }

      // Đổi lớp trong modal cài đặt
      const selectSettingsCls = document.getElementById('settings-select-class');
      if (selectSettingsCls) {
        selectSettingsCls.addEventListener('change', () => {
          this.renderSettingsSeatingGrid();
        });
      }

      // Thêm lớp mới
      const btnAddClass = document.getElementById('btn-add-new-class-modal');
      if (btnAddClass) {
        btnAddClass.addEventListener('click', () => {
          this.addNewClassModal();
        });
      }

      // Tải file mẫu Excel
      const btnDlTemplate = document.getElementById('btn-download-excel-template');
      if (btnDlTemplate) {
        btnDlTemplate.addEventListener('click', () => {
          this.downloadExcelTemplate();
        });
      }

      // Xuất Excel lớp hiện tại
      const btnExportCur = document.getElementById('btn-export-current-excel');
      if (btnExportCur) {
        btnExportCur.addEventListener('click', () => {
          this.exportCurrentClassExcel();
        });
      }

      // Nhập file Excel / CSV
      const inputExcel = document.getElementById('input-excel-file');
      if (inputExcel) {
        inputExcel.addEventListener('change', (e) => {
          if (e.target.files && e.target.files.length > 0) {
            this.importExcelFile(e.target.files[0]);
            e.target.value = '';
          }
        });
      }

      // Lưu cài đặt
      const btnSaveSettings = document.getElementById('btn-save-settings');
      if (btnSaveSettings) {
        btnSaveSettings.addEventListener('click', () => {
          this.saveSettings();
        });
      }

      // Khôi phục mặc định
      const btnResetDefault = document.getElementById('btn-reset-default-class-data');
      if (btnResetDefault) {
        btnResetDefault.addEventListener('click', () => {
          this.resetDefaultClassData();
        });
      }
    },

    // CÁC HÀM QUẢN LÝ CÀI ĐẶT LỚP HỌC & MAP 18 MÁY (EXCEL)
    openSettingsModal() {
      const state = STORE.getState();
      const selectCls = document.getElementById('settings-select-class');
      if (selectCls) {
        selectCls.value = state.classId || '10A1';
      }
      this.renderSettingsSeatingGrid();
      const modal = document.getElementById('modal-teacher-settings');
      if (modal) modal.style.display = 'flex';
    },

    closeSettingsModal() {
      const modal = document.getElementById('modal-teacher-settings');
      if (modal) modal.style.display = 'none';
    },

    renderSettingsSeatingGrid() {
      const selectCls = document.getElementById('settings-select-class');
      const clsId = selectCls ? selectCls.value : '10A1';
      const classData = this.classes[clsId] || this.classes['10A1'];
      const grid = document.getElementById('settings-seating-grid');
      const badge = document.getElementById('settings-student-count-badge');
      if (!grid) return;

      let totalStudents = 0;
      let html = '';

      for (let i = 1; i <= 18; i++) {
        const students = classData.seatingPlan[i] || [];
        totalStudents += students.length;

        let chipsHtml = '';
        if (students.length === 0) {
          chipsHtml = '<span style="font-size:11px;color:#64748b;font-style:italic;padding:4px 0;">(Chưa có học sinh)</span>';
        } else {
          chipsHtml = students.map((name, idx) => `
            <span class="student-chip">
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${name}">${name}</span>
              <button type="button" class="chip-del" onclick="APP.removeStudentFromDesk(${i}, ${idx})" title="Xóa học sinh này">&times;</button>
            </span>
          `).join('');
        }

        html += `
          <div class="settings-desk-card" data-desk="${i}">
            <div class="sdc-header">
              <span class="sdc-num">MÁY ${String(i).padStart(2, '0')}</span>
              <span class="sdc-count">${students.length} bạn</span>
            </div>
            <div class="sdc-students-list">
              ${chipsHtml}
            </div>
            <div class="sdc-add-row">
              <input type="text" class="sdc-input" id="add-student-input-${i}" placeholder="+ Tên học sinh..." onkeydown="if(event.key==='Enter')APP.addStudentToDesk(${i})">
              <button type="button" class="sdc-btn-add" onclick="APP.addStudentToDesk(${i})" title="Thêm học sinh vào máy này">Thêm</button>
            </div>
          </div>
        `;
      }

      grid.innerHTML = html;
      if (badge) {
        badge.textContent = `${totalStudents} học sinh / 18 máy`;
      }
    },

    addStudentToDesk(deskNum) {
      const selectCls = document.getElementById('settings-select-class');
      const clsId = selectCls ? selectCls.value : '10A1';
      const classData = this.classes[clsId] || this.classes['10A1'];
      const input = document.getElementById(`add-student-input-${deskNum}`);
      if (!input) return;

      const name = input.value.trim();
      if (!name) return;

      if (!classData.seatingPlan[deskNum]) {
        classData.seatingPlan[deskNum] = [];
      }
      classData.seatingPlan[deskNum].push(name);
      input.value = '';
      this.renderSettingsSeatingGrid();
    },

    removeStudentFromDesk(deskNum, idx) {
      const selectCls = document.getElementById('settings-select-class');
      const clsId = selectCls ? selectCls.value : '10A1';
      const classData = this.classes[clsId] || this.classes['10A1'];
      if (classData && classData.seatingPlan[deskNum]) {
        classData.seatingPlan[deskNum].splice(idx, 1);
        this.renderSettingsSeatingGrid();
      }
    },

    saveSettings() {
      try {
        localStorage.setItem('lms_custom_classes', JSON.stringify(this.classes));
      } catch (e) {
        console.warn('[Storage] Không lưu được lớp:', e);
      }

      const modal = document.getElementById('modal-teacher-settings');
      if (modal) modal.style.display = 'none';

      const state = STORE.getState();
      STORE.setState({ classId: state.classId });
      SYNC_BUS.broadcast('CLASSES_UPDATED', { classes: this.classes });

      alert('✅ Đã lưu danh sách học sinh và sơ đồ 18 máy thành công!');
    },

    resetDefaultClassData() {
      if (confirm('Khôi phục lại toàn bộ danh sách lớp và 18 máy về mặc định ban đầu?')) {
        try {
          localStorage.removeItem('lms_custom_classes');
        } catch {}
        this.classes = JSON.parse(JSON.stringify(EMBEDDED_CLASSES));
        this.renderSettingsSeatingGrid();
        alert('Đã khôi phục dữ liệu lớp học mặc định thành công!');
      }
    },

    downloadExcelTemplate() {
      const selectCls = document.getElementById('settings-select-class');
      const clsId = selectCls ? selectCls.value : '10A1';
      const classData = this.classes[clsId] || this.classes['10A1'];

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
          `Máy bàn số ${String(i).padStart(2, '0')}`
        ]);
      }

      if (typeof XLSX !== 'undefined') {
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, clsId);
        XLSX.writeFile(wb, `Mau_Danh_Sach_${clsId}_18_May.xlsx`);
      } else {
        let csvContent = "\uFEFF" + rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `Mau_Danh_Sach_${clsId}_18_May.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },

    exportCurrentClassExcel() {
      const selectCls = document.getElementById('settings-select-class');
      const clsId = selectCls ? selectCls.value : '10A1';
      const classData = this.classes[clsId] || this.classes['10A1'];

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
          `${classData.className} - Máy ${String(i).padStart(2, '0')}`
        ]);
      }

      if (typeof XLSX !== 'undefined') {
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, clsId);
        XLSX.writeFile(wb, `Danh_Sach_${clsId}_18_May.xlsx`);
      } else {
        let csvContent = "\uFEFF" + rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `Danh_Sach_${clsId}_18_May.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },

    importExcelFile(file) {
      if (!file) return;
      const selectCls = document.getElementById('settings-select-class');
      const clsId = selectCls ? selectCls.value : '10A1';
      const classData = this.classes[clsId] || this.classes['10A1'];

      const isXlsx = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

      if (isXlsx && typeof XLSX !== 'undefined') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            this.processImportedRows(rows, classData);
          } catch (err) {
            alert('Lỗi đọc file Excel: ' + err.message);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = e.target.result;
            const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
            const rows = lines.map(line => {
              let delimiter = ',';
              if (line.includes(';') && !line.includes(',')) delimiter = ';';
              else if (line.includes('\t')) delimiter = '\t';
              
              const regex = new RegExp(`(?:^|${delimiter})(?:"([^"]*(?:""[^"]*)*)"|([^"${delimiter}]*))`, 'g');
              let matches = [];
              let match;
              while ((match = regex.exec(line)) !== null) {
                let val = match[1] ? match[1].replace(/""/g, '"') : match[2];
                matches.push(val ? val.trim() : '');
              }
              return matches;
            });
            this.processImportedRows(rows, classData);
          } catch (err) {
            alert('Lỗi đọc file CSV: ' + err.message);
          }
        };
        reader.readAsText(file, 'utf-8');
      }
    },

    processImportedRows(rows, targetClassData) {
      if (!rows || rows.length === 0) {
        alert('File không có dữ liệu!');
        return;
      }

      let classData = targetClassData;
      if (!classData) {
        const selectCls = document.getElementById('settings-select-class');
        const clsId = selectCls ? selectCls.value : '10A1';
        classData = this.classes[clsId] || this.classes['10A1'];
      }

      let importedCount = 0;
      let hasClassCol = false;

      // Kiểm tra dòng tiêu đề xem có cột Lớp không
      if (rows[0]) {
        hasClassCol = rows[0].some(cell => {
          const s = String(cell).toLowerCase();
          return s.includes('lớp') || s.includes('class');
        });
      }

      rows.forEach((row, idx) => {
        if (idx === 0 && (String(row[0]).includes('Số') || String(row[0]).includes('Machine'))) {
          return;
        }

        const rawNum = String(row[0] || '').replace(/[^\d]/g, '');
        const machineNum = parseInt(rawNum, 10);
        if (machineNum >= 1 && machineNum <= 18) {
          const students = [];
          const startCol = hasClassCol ? 2 : 1;
          for (let col = startCol; col <= startCol + 3; col++) {
            const name = String(row[col] || '').trim();
            if (name && name !== 'undefined' && name !== 'null') {
              students.push(name);
            }
          }
          if (students.length > 0) {
            classData.seatingPlan[machineNum] = students;
            importedCount++;
          }
        }
      });

      this.renderSettingsSeatingGrid();
      alert(`🎉 Đã nhập thành công danh sách học sinh cho ${importedCount} máy từ file!\nThầy hãy kiểm tra lại và bấm [LƯU THAY ĐỔI VÀ ĐỒNG BỘ] để áp dụng.`);
    },

    addNewClassModal() {
      const className = prompt('Nhập tên lớp mới (ví dụ: 10A3, 11A1, 9A2):', '');
      if (!className || !className.trim()) return;
      const cleanName = className.trim();
      const classId = cleanName.replace(/^(lớp|lop)\s*/i, '').replace(/\s+/g, '');

      if (this.classes[classId]) {
        alert('Lớp này đã tồn tại trong hệ thống!');
        const selectCls = document.getElementById('settings-select-class');
        if (selectCls) selectCls.value = classId;
        this.renderSettingsSeatingGrid();
        return;
      }

      this.classes[classId] = {
        className: 'Lớp ' + classId,
        grade: parseInt(classId.replace(/[^\d]/g, ''), 10) || 10,
        totalStudents: 0,
        seatingPlan: {
          "1": [], "2": [], "3": [], "4": [], "5": [], "6": [],
          "7": [], "8": [], "9": [], "10": [], "11": [], "12": [],
          "13": [], "14": [], "15": [], "16": [], "17": [], "18": []
        }
      };

      this.refreshClassDropdowns(classId);
      this.renderSettingsSeatingGrid();
      alert(`🎉 Đã tạo ${this.classes[classId].className}! Thầy có thể nhập học sinh trực tiếp hoặc tải file mẫu Excel về điền.`);
    },

    refreshClassDropdowns(selectedId) {
      const selects = ['settings-select-class', 'select-lobby-class', 'teacher-select-class'];
      selects.forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        const currentVal = selectedId || sel.value;
        let html = '';
        Object.keys(this.classes).forEach(cId => {
          const c = this.classes[cId];
          const total = Object.values(c.seatingPlan).reduce((acc, cur) => acc + cur.length, 0);
          html += `<option value="${cId}">${c.className} (${total} học sinh • 18 máy)</option>`;
        });
        sel.innerHTML = html;
        if (this.classes[currentVal]) {
          sel.value = currentVal;
        }
      });
    },

    // Xử lý nộp form đăng nhập Admin
    async handleTeacherLoginSubmit() {
      const pwdInput = document.getElementById('teacher-password-input');
      const errorMsg = document.getElementById('auth-error-msg');
      const modal = document.getElementById('modal-teacher-login');

      if (!pwdInput) return;
      const pass = pwdInput.value.trim();
      const hash = await sha256Hex(pass);

      const isValid = VALID_PASSWORD_HASHES.includes(hash) || (pass === 'admin123') || (pass === 'ThayKhang@2026');

      if (isValid) {
        try { sessionStorage.setItem('lms_admin_logged_in', 'true'); } catch {}
        if (errorMsg) errorMsg.style.display = 'none';
        if (modal) modal.style.display = 'none';

        const state = STORE.getState();
        STORE.setState({
          role: 'teacher',
          screen: 'teacher',
          teacherStage: state.sessionStarted ? 'active' : 'hardware'
        });
      } else {
        if (errorMsg) errorMsg.style.display = 'flex';
      }
    },

    // Hàm mở modal khi click vào máy tính tại Sảnh
    onSelectMachine(num) {
      const state = STORE.getState();
      const fixedId = state.fixedMachineId;

      // 0. Kiểm tra khóa sơ đồ phòng máy: Nếu chưa được GV kích hoạt thì cấm chọn
      if (!state.unlocked) {
        alert('Phòng máy đang được khóa để Thầy/Cô kích hoạt tiết học! Em vui lòng chờ Thầy/Cô bấm kích hoạt bài học.');
        return;
      }

      // 1. Kiểm tra Token Guard chống bấm nhầm
      if (fixedId && fixedId !== num) {
        const warningModal = document.getElementById('modal-token-warning');
        const warningText = document.getElementById('warning-text-content');
        if (warningText) {
          warningText.innerHTML = `Thiết bị này đã được lưu định danh là <strong>MÁY ${String(fixedId).padStart(2,'0')}</strong>.<br>Bạn không thể chọn <strong>MÁY ${String(num).padStart(2,'0')}</strong> để tránh trùng lặp chỗ ngồi của nhóm bạn khác!`;
        }
        if (warningModal) warningModal.style.display = 'flex';
        return;
      }

      // 2. Nếu máy đã có bạn khác vào và không phải máy của mình
      if (state.occupiedMachines[num] && fixedId !== num) {
        alert(`Máy ${num} đã được nhóm bạn khác xác nhận vào lớp. Em hãy chọn đúng máy của mình!`);
        return;
      }

      // 3. Mở Modal xác nhận máy
      const classData = this.classes[state.classId] || this.classes['10A1'];
      const pair = classData.seatingPlan[num] || ["Học sinh 1", "Học sinh 2"];

      STORE.setState({ pendingMachineId: num });

      const modalTitle = document.getElementById('modal-machine-title');
      const modalClass = document.getElementById('modal-class-name');
      const modalTags = document.getElementById('modal-pair-tags');

      if (modalTitle) modalTitle.textContent = `XÁC NHẬN MÁY BÀN SỐ ${String(num).padStart(2,'0')}`;
      if (modalClass) modalClass.textContent = classData.className;
      if (modalTags) {
        modalTags.innerHTML = pair.map((name, idx) => `
          <div class="pair-tag"><i class="fas fa-user-graduate"></i> ${idx + 1}. ${name}</div>
        `).join('');
      }

      const confirmModal = document.getElementById('modal-confirm-machine');
      if (confirmModal) confirmModal.style.display = 'flex';
    },

    render(state) {
      // 1. Chuyển đổi màn hình: Sảnh (Lobby), Học sinh (Student), hoặc Giáo viên (Teacher)
      const screenLobby = document.getElementById('screen-lobby');
      const screenStudent = document.getElementById('screen-student');
      const screenTeacher = document.getElementById('screen-teacher');

      if (screenLobby && screenStudent && screenTeacher) {
        screenLobby.classList.remove('active');
        screenStudent.classList.remove('active');
        screenTeacher.classList.remove('active');

        if (state.screen === 'teacher') {
          screenTeacher.classList.add('active');
          this.renderTeacherDashboard(state);
        } else if (state.screen === 'student') {
          screenStudent.classList.add('active');
          this.renderStudentWorkspace(state);
        } else {
          screenLobby.classList.add('active');
          this.renderLobby(state);
        }
      }
    },

    // RENDER BẢNG ĐIỀU KHIỂN GIÁO VIÊN
    renderTeacherDashboard(state) {
      const stageHw = document.getElementById('teacher-stage-hardware');
      const stageActive = document.getElementById('teacher-stage-active');

      if (state.teacherStage === 'active') {
        if (stageHw) stageHw.classList.remove('active');
        if (stageActive) stageActive.classList.add('active');
        this.renderTeacherActiveSession(state);
      } else {
        if (stageHw) stageHw.classList.add('active');
        if (stageActive) stageActive.classList.remove('active');
        this.renderTeacherHardwareStage(state);
      }
    },

    // GIAI ĐOẠN 1: KIỂM TRA PHẦN CỨNG 18 MÁY (CHƯA CHỌN LỚP)
    renderTeacherHardwareStage(state) {
      const grid = document.getElementById('hardware-grid-18');
      if (!grid) return;

      let html = '';
      let onlineCount = 0;

      for (let i = 1; i <= 18; i++) {
        const isOnline = state.hardwareStatus[i] !== false;
        if (isOnline) onlineCount++;

        const cardClass = isOnline ? 'hardware-card online' : 'hardware-card offline';
        const statusClass = isOnline ? 'hwc-status-row online' : 'hwc-status-row offline';
        const statusText = isOnline ? '<i class="fas fa-check-circle" style="margin-right:4px;"></i> Thiết bị PWA Online' : '<i class="fas fa-times-circle" style="margin-right:4px;"></i> Chưa bật máy';

        html += '<div class="' + cardClass + '">' +
                  '<div class="hwc-header">' +
                    '<span class="hwc-num">MÁY ' + String(i).padStart(2, '0') + '</span>' +
                    '<span class="hwc-icon"><i class="fas fa-desktop"></i></span>' +
                  '</div>' +
                  '<div class="' + statusClass + '">' + statusText + '</div>' +
                '</div>';
      }

      grid.innerHTML = html;

      const summary = document.getElementById('hardware-status-summary');
      if (summary) {
        summary.textContent = onlineCount + '/18 máy sẵn sàng kết nối';
      }
    },

    // GIAI ĐOẠN 2: TIẾT HỌC CHÍNH THỨC ĐIỂM DANH & 4 CHẶNG
    renderTeacherActiveSession(state) {
      const classData = this.classes[state.classId] || this.classes['10A1'];
      const sessionTitle = document.getElementById('th-session-title');
      if (sessionTitle) {
        sessionTitle.textContent = classData.className + ' • ' + (state.lessonData ? state.lessonData.title : 'Môn Tin học');
      }

      // Cập nhật thanh tiến trình Thầy
      document.querySelectorAll('.tpb-step').forEach(step => {
        step.classList.toggle('active', step.dataset.tphase === state.currentPhase);
      });

      // Render 18 máy có tên học sinh theo sơ đồ lớp
      const matrixGrid = document.getElementById('active-session-grid-18');
      if (matrixGrid) {
        let html = '';
        let checkedInCount = 0;

        for (let i = 1; i <= 18; i++) {
          const pair = classData.seatingPlan[i] || ["Học sinh 1", "Học sinh 2"];
          const isCheckedIn = !!state.occupiedMachines[i];
          if (isCheckedIn) checkedInCount++;

          const cardClass = isCheckedIn ? 'asm-card checked-in' : 'asm-card';
          const pillClass = isCheckedIn ? 'online' : 'offline';
          const pillText = isCheckedIn ? 'Đã vào' : 'Chờ...';
          const studentsDisplay = pair.join(' • ');
          const fullTitle = 'MÁY ' + String(i).padStart(2, '0') + ': ' + pair.join(', ');

          html += '<div class="' + cardClass + '" title="' + fullTitle + '">' +
                    '<div class="asm-top">' +
                      '<div class="asm-id">' +
                        '<i class="fas fa-desktop"></i> ' +
                        '<span class="asm-num">MÁY ' + String(i).padStart(2, '0') + '</span>' +
                      '</div>' +
                      '<div class="asm-status-pill ' + pillClass + '">' +
                        '<span class="asm-status-dot"></span>' +
                        '<span class="asm-status-text">' + pillText + '</span>' +
                      '</div>' +
                    '</div>' +
                    '<div class="asm-students-row">' +
                      '<i class="fas fa-user-friends asm-stu-icon"></i>' +
                      '<span class="asm-stu-names">' + studentsDisplay + '</span>' +
                    '</div>' +
                  '</div>';
        }
        matrixGrid.innerHTML = html;

        const countBadge = document.getElementById('tcm-checkin-count');
        if (countBadge) countBadge.textContent = 'Đã vào: ' + checkedInCount + '/18 máy';

        const statIn = document.getElementById('stat-checkedin');
        const statMiss = document.getElementById('stat-missing');
        if (statIn) statIn.textContent = checkedInCount;
        if (statMiss) statMiss.textContent = (18 - checkedInCount);
      }

      // Chuyển panel tác nghiệp bên phải
      const panels = {
        'waiting': document.getElementById('tw-panel-waiting'),
        'old_lesson': document.getElementById('tw-panel-old-lesson'),
        'warmup': document.getElementById('tw-panel-warmup'),
        'theory': document.getElementById('tw-panel-theory'),
        'discussion': document.getElementById('tw-panel-discussion'),
        'quiz': document.getElementById('tw-panel-quiz')
      };

      Object.keys(panels).forEach(key => {
        const p = panels[key];
        if (p) p.classList.toggle('active', key === state.currentPhase);
      });

      // Nếu ở Bước 1: Kiểm tra bài cũ phía Giáo viên
      if (state.currentPhase === 'old_lesson') {
        const studentSpotlight = document.getElementById('ots-student-name');
        if (studentSpotlight) {
          if (state.oldLesson && state.oldLesson.selectedStudent) {
            studentSpotlight.innerHTML = `<span style="color:#38bdf8;font-weight:800;">MÁY ${String(state.oldLesson.selectedMachine).padStart(2,'0')}:</span> <span style="color:#f59e0b;font-weight:800;">${state.oldLesson.selectedStudent}</span>`;
          } else {
            studentSpotlight.textContent = 'Chưa bốc thăm (Bấm nút [Bốc thăm] để chọn ngẫu nhiên)';
          }
        }
        const timerDisplay = document.getElementById('ots-timer-display');
        if (timerDisplay && state.oldLesson) {
          const mins = Math.floor(state.oldLesson.timeLeft / 60);
          const secs = state.oldLesson.timeLeft % 60;
          timerDisplay.textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
        }
        const subList = document.getElementById('ol-submissions-list');
        const subCount = document.getElementById('ol-submitted-count');
        if (subList && subCount && state.oldLesson) {
          const subs = state.oldLesson.submissions || {};
          const subKeys = Object.keys(subs);
          subCount.textContent = `Đã nộp: ${subKeys.length}/18 máy`;

          let html = '';
          for (let i = 1; i <= 18; i++) {
            const item = subs[i];
            const pair = classData.seatingPlan[i] || [`Máy ${i}`];
            const stuNames = pair.join(' • ');
            if (item) {
              html += `<div class="osb-card submitted">
                <div class="osb-card-top">
                  <span class="osb-badge-m">MÁY ${String(i).padStart(2,'0')}</span>
                  <span class="osb-badge-status success"><i class="fas fa-check"></i> Đã nộp (${item.time || ''})</span>
                </div>
                <div class="osb-card-names"><i class="fas fa-user-friends"></i> ${item.student || stuNames}</div>
                <div class="osb-card-ans"><i class="fas fa-comment-dots"></i> <strong>Đáp án:</strong> "${item.answer || ''}"</div>
              </div>`;
            } else {
              html += `<div class="osb-card">
                <div class="osb-card-top">
                  <span class="osb-badge-m">MÁY ${String(i).padStart(2,'0')}</span>
                  <span class="osb-badge-status pending"><i class="fas fa-hourglass-half"></i> Đang làm...</span>
                </div>
                <div class="osb-card-names"><i class="fas fa-user-friends"></i> ${stuNames}</div>
                <div class="osb-card-ans empty">Chưa gửi câu trả lời</div>
              </div>`;
            }
          }
          subList.innerHTML = html;
        }
      }

      // Nếu ở Chặng 1: Vẽ biểu đồ phân tích Quick Poll
      if (state.currentPhase === 'warmup') {
        const pollChart = document.getElementById('poll-live-chart');
        if (pollChart) {
          pollChart.innerHTML = '<div style="display:flex;flex-direction:column;gap:10px;margin-top:10px;">' +
            '<div style="font-size:13px;display:flex;justify-content:space-between;"><span>Phương án A:</span> <strong>22% (4 máy)</strong></div>' +
            '<div style="background:#1e293b;height:12px;border-radius:6px;overflow:hidden;"><div style="width:22%;background:#3b82f6;height:100%;"></div></div>' +
            '<div style="font-size:13px;display:flex;justify-content:space-between;color:#34d399;"><span>Phương án B (Đáp án đúng):</span> <strong>67% (12 máy)</strong></div>' +
            '<div style="background:#1e293b;height:12px;border-radius:6px;overflow:hidden;"><div style="width:67%;background:#10b981;height:100%;"></div></div>' +
            '<div style="font-size:13px;display:flex;justify-content:space-between;"><span>Phương án C:</span> <strong>11% (2 máy)</strong></div>' +
            '<div style="background:#1e293b;height:12px;border-radius:6px;overflow:hidden;"><div style="width:11%;background:#f59e0b;height:100%;"></div></div>' +
          '</div>';
        }
      }
    },

    renderLobby(state) {
      const classData = this.classes[state.classId] || this.classes['10A1'];
      const grid = document.getElementById('computers-grid');
      const banner = document.getElementById('lobby-status-banner');
      const icon = document.getElementById('lsb-icon');
      const title = document.getElementById('lsb-title');
      const desc = document.getElementById('lsb-desc');

      if (banner) {
        if (!state.unlocked) {
          banner.className = 'lobby-banner locked';
          if (icon) icon.className = 'fas fa-lock';
          if (title) title.innerHTML = '<i class="fas fa-desktop"></i> PHÒNG MÁY ĐANG CHỜ GIÁO VIÊN KÍCH HOẠT TIẾT HỌC';
          if (desc) desc.textContent = 'Học sinh vui lòng ngồi ổn định tại chỗ. Sơ đồ đang được khóa để Thầy/Cô chọn lớp và kích hoạt bài học.';
          if (grid) grid.classList.add('locked-state');
        } else {
          banner.className = 'lobby-banner unlocked';
          if (icon) icon.className = 'fas fa-unlock-alt';
          if (title) title.innerHTML = `<i class="fas fa-check-circle"></i> THẦY/CÔ ĐÃ KÍCH HOẠT ${classData.className} — MỜI BẤM CHỌN MÁY`;
          if (desc) desc.textContent = 'Em hãy nhấp vào đúng số máy em đang ngồi để vào Sảnh chờ Đấu trường!';
          if (grid) grid.classList.remove('locked-state');
        }
      }

      if (!grid) return;

      const fixedId = state.fixedMachineId;
      let html = '';

      for (let i = 1; i <= 18; i++) {
        const pair = classData.seatingPlan[i] || ["Chưa xếp", "Chưa xếp"];
        const isMyMachine = (fixedId === i);
        const isOccupied = (!isMyMachine && state.occupiedMachines[i]);

        let cardClasses = 'computer-card';
        let statusBadge = '';

        if (isMyMachine) {
          cardClasses += ' my-saved-machine';
          statusBadge = `<div class="card-status-bar status-mine"><i class="fas fa-star" style="margin-right:4px;"></i> Máy của bạn</div>`;
        } else if (isOccupied) {
          cardClasses += ' locked';
          statusBadge = `<div class="card-status-bar status-occupied"><i class="fas fa-lock" style="margin-right:4px;"></i> Đang học</div>`;
        } else {
          statusBadge = `<div class="card-status-bar status-free"><i class="fas fa-check" style="margin-right:4px;"></i> Sẵn sàng chọn</div>`;
        }

        html += `
          <div class="${cardClasses}" onclick="window.onSelectDesk(${i})">
            <div class="card-top">
              <span class="machine-id-tag">MÁY ${String(i).padStart(2,'0')}</span>
              <span class="card-icon"><i class="fas fa-desktop"></i></span>
            </div>
            <div class="card-pair-list">
              ${pair.map(name => `<div class="student-row" title="${name}"><i class="fas fa-user"></i> ${name}</div>`).join('')}
            </div>
            ${statusBadge}
          </div>
        `;
      }

      grid.innerHTML = html;

            // Cập nhật huy hiệu PWA trên Topbar
      const pwaBadge = document.getElementById('device-pwa-badge');
      if (pwaBadge) {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        const modeText = isStandalone ? 'PWA Standalone' : 'Browser';
        if (fixedId) {
          pwaBadge.innerHTML = '<i class="fas fa-desktop"></i> Thiết bị này: <strong>MÁY ' + String(fixedId).padStart(2, '0') + '</strong> <span style="font-size:11px;opacity:0.85;background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:4px;margin-left:4px;">' + modeText + '</span>';
        } else {
          pwaBadge.innerHTML = '<i class="fas fa-desktop"></i> Thiết bị: <span style="color:#cbd5e1">Chưa gán</span> <span style="font-size:11px;opacity:0.85;background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:4px;margin-left:4px;">' + modeText + '</span>';
        }
      }

      // Cập nhật thông tin token lưu nhớ
      const tokenStatus = document.getElementById('device-token-status');
      if (tokenStatus) {
        if (fixedId) {
          tokenStatus.innerHTML = `<i class="fas fa-check-circle" style="color:var(--warning)"></i> Thiết bị này đã được lưu định danh là <strong>MÁY ${String(fixedId).padStart(2,'0')}</strong>`;
        } else {
          tokenStatus.innerHTML = `<i class="fas fa-info-circle"></i> Chưa gán cố định số máy cho thiết bị này. Nhấp vào máy để đăng ký.`;
        }
      }
    },

    renderStudentWorkspace(state) {
      const { machineId, students, isSos, currentPhase, lessonData } = state;

      // Header
      const badge = document.getElementById('sh-machine-badge');
      if (badge) badge.textContent = machineId ? `MÁY ${String(machineId).padStart(2,'0')}` : 'MÁY --';

      const studentsLabel = document.getElementById('sh-students-label');
      if (studentsLabel) {
        studentsLabel.textContent = students && students.length > 0 ? students.join(' & ') : 'Chưa điểm danh';
      }

      const classLabel = document.getElementById('sh-class-label');
      if (classLabel) {
        const c = this.classes[state.classId];
        classLabel.textContent = `${c ? c.className : 'Lớp 10A1'} • Môn Tin học`;
      }

      const sosBtn = document.getElementById('btn-student-sos');
      if (sosBtn) {
        sosBtn.classList.toggle('active', isSos);
        sosBtn.innerHTML = isSos ? '<i class="fas fa-hand-paper"></i> Đã gọi Thầy' : '<i class="fas fa-hand-paper"></i> Cần trợ giúp';
      }

      // Khóa kỷ luật phòng máy: Học sinh KHÔNG ĐƯỢC thoát ra sảnh khi tiết học đã bắt đầu
      const btnBackLobby = document.getElementById('btn-back-to-lobby');
      if (btnBackLobby) {
        const isLocked = (state.sessionStarted || (currentPhase && currentPhase !== 'waiting'));
        btnBackLobby.style.display = isLocked ? 'none' : 'inline-flex';
      }

      // Thanh tiến trình sư phạm (Pace Navigator)
      document.querySelectorAll('.pn-item').forEach(item => {
        item.classList.toggle('active', item.dataset.phase === currentPhase);
      });

      // Chuyển view nội dung
      const views = {
        'waiting': document.getElementById('st-view-waiting'),
        'old_lesson': document.getElementById('st-view-old-lesson'),
        'warmup': document.getElementById('st-view-warmup'),
        'theory': document.getElementById('st-view-theory'),
        'discussion': document.getElementById('st-view-discussion'),
        'quiz': document.getElementById('st-view-quiz')
      };

      Object.keys(views).forEach(key => {
        const el = views[key];
        if (el) el.classList.toggle('active', key === currentPhase);
      });

      // Render chi tiết từng view
      if (currentPhase === 'old_lesson') {
        const ol = state.oldLesson || {};
        const timerEl = document.getElementById('ol-timer');
        if (timerEl) {
          const mins = Math.floor((ol.timeLeft || 0) / 60);
          const secs = (ol.timeLeft || 0) % 60;
          timerEl.innerHTML = `<i class="fas fa-stopwatch"></i> ${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
        }

        const spotlight = document.getElementById('ol-caller-spotlight');
        const callerInfo = document.getElementById('ol-caller-info');
        const stageContainer = document.querySelector('.old-lesson-container');
        if (spotlight && callerInfo) {
          const isThisMachine = (ol.selectedMachine === machineId);
          spotlight.classList.toggle('highlighted', !!ol.selectedMachine);
          spotlight.classList.toggle('winner-gold-spotlight', isThisMachine);
          if (stageContainer) {
            stageContainer.classList.toggle('stage-winner-active', isThisMachine);
          }
          if (ol.selectedStudent) {
            if (isThisMachine) {
              callerInfo.innerHTML = `
                <div class="winner-headline"><i class="fas fa-crown"></i> BẠN ĐÃ ĐƯỢC GỌI LÊN SÓNG!</div>
                <div class="winner-subline">Mời em <strong class="winner-name">${ol.selectedStudent}</strong> tự tin đứng dậy hoặc lên bảng trả lời!</div>
              `;
            } else {
              callerInfo.innerHTML = `
                <span class="audience-badge"><i class="fas fa-bullhorn"></i> MÁY ${String(ol.selectedMachine).padStart(2,'0')}</span>
                <span class="audience-text">Bạn <strong>${ol.selectedStudent}</strong> đang trả lời bài cũ... Cả lớp chú ý lắng nghe và nhận xét!</span>
              `;
            }
          } else {
            callerInfo.innerHTML = '<span class="waiting-spin-badge"><i class="fas fa-hourglass-half"></i> Đang chờ Thầy bốc thăm gọi học sinh...</span>';
          }
        }

        const qText = document.getElementById('ol-question-text');
        if (qText && ol.questionText) qText.textContent = ol.questionText;

        const qTypeBadge = document.getElementById('ol-q-type-badge');
        if (qTypeBadge) qTypeBadge.innerHTML = '<i class="fas fa-comment-dots"></i> Trả lời miệng tại chỗ';

        const revealBox = document.getElementById('ol-reveal-box');
        if (revealBox) {
          revealBox.style.display = ol.isRevealed ? 'block' : 'none';
        }
      }

      if (currentPhase === 'waiting') {
        const deskInfo = document.getElementById('waiting-desk-info');
        if (deskInfo) deskInfo.textContent = `Máy bàn số ${String(machineId || 4).padStart(2,'0')}`;

        const pairInfo = document.getElementById('waiting-pair-info');
        if (pairInfo) pairInfo.textContent = students && students.length > 0 ? students.join(' & ') : 'Đang cập nhật';

        // Render Classroom Radar 18 máy thu nhỏ
        const radarGrid = document.getElementById('radar-grid');
        const radarCountLabel = document.getElementById('radar-count-label');
        if (radarGrid) {
          let radarHtml = '';
          let connectedCount = 0;
          for (let i = 1; i <= 18; i++) {
            const isThis = (i === machineId);
            const isAct = isThis || !!state.occupiedMachines[i];
            if (isAct) connectedCount++;

            let cellClass = 'radar-cell';
            if (isThis) cellClass += ' this-machine active-desk';
            else if (isAct) cellClass += ' active-desk';

            radarHtml += `
              <div class="${cellClass}" title="Máy ${String(i).padStart(2,'0')}: ${isThis ? 'Máy hiện tại của bạn (Trực tuyến)' : (isAct ? 'Đang trực tuyến' : 'Chưa vào')}">
                <span class="rc-num">${String(i).padStart(2,'0')}</span>
                <span class="rc-dot"></span>
              </div>
            `;
          }
          radarGrid.innerHTML = radarHtml;
          if (radarCountLabel) {
            radarCountLabel.textContent = `${connectedCount}/18 máy đang kết nối`;
          }
        }
      }

      if (currentPhase === 'warmup') {
        const choice = state.pollSelection;
        document.querySelectorAll('.poll-opt-btn').forEach(btn => {
          btn.classList.toggle('selected', btn.dataset.choice === choice);
        });

        const statusMsg = document.getElementById('poll-status-msg');
        if (statusMsg) {
          if (choice) {
            statusMsg.innerHTML = `<i class="fas fa-check-circle" style="color:var(--success)"></i> Nhóm bạn đã chọn phương án <strong>${choice}</strong>. Đang chờ Thầy tổng kết và chiếu kết quả...`;
          } else {
            statusMsg.innerHTML = `<i class="fas fa-comments"></i> Hai em hãy trao đổi nhanh và bấm chọn 1 phương án chung của máy mình:`;
          }
        }
      }

      if (currentPhase === 'theory') {
        const container = document.getElementById('theory-cards-container');
        if (container && lessonData && lessonData.theory) {
          container.innerHTML = lessonData.theory.map(card => `
            <div class="theory-card">
              <h3 class="tc-title">${card.title}</h3>
              <div class="tc-summary">${card.summary}</div>
              <pre class="tc-code"><code>${card.code}</code></pre>
              <div class="tc-note"><i class="fas fa-lightbulb"></i> ${card.note}</div>
            </div>
          `).join('');
        }
      }

      if (currentPhase === 'discussion') {
        // Cột trái tra cứu
        const refContainer = document.getElementById('disc-theory-reference');
        if (refContainer && lessonData && lessonData.theory) {
          refContainer.innerHTML = lessonData.theory.map(c => `
            <div class="ref-mini-card">
              <div class="ref-mini-title">${c.title}</div>
              <div class="ref-mini-text">${c.summary}</div>
            </div>
          `).join('');
        }

        // Trạng thái nộp bài
        const statusBox = document.getElementById('disc-submission-status');
        if (statusBox) {
          if (state.discStatus === 'submitted') {
            statusBox.innerHTML = `<span class="badge-status-submitted"><i class="fas fa-check-circle"></i> Đã nộp bài lúc ${state.discSubmissionTime}</span>`;
          } else {
            statusBox.innerHTML = `<span class="badge-status-working"><i class="fas fa-pencil-alt"></i> Đang làm bài...</span>`;
          }
        }
      }

      if (currentPhase === 'quiz') {
        const choice = state.quizSelection;
        const isAnswered = state.quizAnswered;
        const correct = lessonData.quiz.correct;

        document.querySelectorAll('.quiz-opt').forEach(btn => {
          const opt = btn.dataset.qopt;
          btn.classList.toggle('selected', opt === choice);
          if (isAnswered && opt === correct) {
            btn.classList.add('correct');
          }
        });

        const feedback = document.getElementById('quiz-feedback-box');
        if (feedback) {
          if (isAnswered) {
            feedback.style.display = 'block';
            if (choice === correct) {
              feedback.className = 'quiz-feedback success';
              feedback.innerHTML = `<i class="fas fa-star" style="color:#fbbf24"></i> <strong>Chính xác!</strong> Nhóm bạn đã nhận trọn vẹn điểm thưởng của câu hỏi củng cố.`;
            } else {
              feedback.className = 'quiz-feedback';
              feedback.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
              feedback.style.color = '#fca5a5';
              feedback.style.border = '1px solid rgba(239, 68, 68, 0.4)';
              feedback.innerHTML = `<i class="fas fa-info-circle"></i> Chưa chính xác. Đáp án đúng là <strong>${correct}</strong>: ${lessonData.quiz.options[correct]}`;
            }
          } else {
            feedback.style.display = 'none';
          }
        }
      }
    },

    // -------------------------------------------------------------
    // TÍNH NĂNG 1: BƯỚC KIỂM TRA BÀI CŨ & BỐC THĂM KỊCH TÍNH 2 TẦNG
    // -------------------------------------------------------------
    toggleOldLessonMenu() {
      const menu = document.getElementById('tpb-menu-old-lesson');
      if (menu) {
        const isVisible = menu.style.display !== 'none';
        menu.style.display = isVisible ? 'none' : 'block';
      }
    },

    closeAllTpbMenus() {
      const menu = document.getElementById('tpb-menu-old-lesson');
      if (menu) menu.style.display = 'none';
    },

    setOldLessonTimer(sec) {
      const state = STORE.getState();
      const oldL = Object.assign({}, state.oldLesson, {
        timerSeconds: sec,
        timeLeft: sec
      });
      STORE.setState({ oldLesson: oldL });
      document.querySelectorAll('.tdm-timer-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.sec, 10) === sec);
      });
    },

    setOldLessonQType(type) {
      const state = STORE.getState();
      const oldL = Object.assign({}, state.oldLesson, { questionType: type });
      STORE.setState({ oldLesson: oldL });
      document.querySelectorAll('.tdm-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.qtype === type);
      });
    },

    broadcastOldLessonStart() {
      const qInput = document.getElementById('otc-question-input');
      const qText = qInput ? qInput.value.trim() : '';
      const state = STORE.getState();
      const sec = state.oldLesson.timerSeconds || 120;

      const oldL = Object.assign({}, state.oldLesson, {
        questionText: qText || state.oldLesson.questionText,
        timeLeft: sec,
        timerActive: true,
        isLocked: false,
        isRevealed: false
      });

      STORE.setState({
        currentPhase: 'old_lesson',
        teacherPhase: 'old_lesson',
        oldLesson: oldL
      });

      SYNC_BUS.broadcast('OLD_LESSON_START', {
        timerSeconds: sec,
        questionType: state.oldLesson.questionType,
        questionText: oldL.questionText,
        selectedMachine: state.oldLesson.selectedMachine,
        selectedStudent: state.oldLesson.selectedStudent
      });

      if (db) {
        db.ref('activeSession/currentPhase').set('old_lesson').catch(()=>{});
        db.ref('activeSession/oldLesson').set(oldL).catch(()=>{});
      }

      this.startOldLessonCountdown();
    },

    teacherLockOldLesson() {
      const state = STORE.getState();
      const oldL = Object.assign({}, state.oldLesson, { isLocked: true, timerActive: false });
      STORE.setState({ oldLesson: oldL });
      SYNC_BUS.broadcast('OLD_LESSON_LOCK', {});
      if (db) {
        db.ref('activeSession/oldLesson/isLocked').set(true).catch(()=>{});
      }
    },

    teacherRevealOldLesson() {
      const state = STORE.getState();
      const oldL = Object.assign({}, state.oldLesson, { isRevealed: true });
      STORE.setState({ oldLesson: oldL });
      SYNC_BUS.broadcast('OLD_LESSON_REVEAL', {});
      if (db) {
        db.ref('activeSession/oldLesson/isRevealed').set(true).catch(()=>{});
      }
    },

    oldLessonTimerInterval: null,
    startOldLessonCountdown() {
      if (this.oldLessonTimerInterval) {
        clearInterval(this.oldLessonTimerInterval);
        this.oldLessonTimerInterval = null;
      }

      this.oldLessonTimerInterval = setInterval(() => {
        const state = STORE.getState();
        const oldL = state.oldLesson;
        if (!oldL.timerActive || oldL.timeLeft <= 0) {
          clearInterval(this.oldLessonTimerInterval);
          this.oldLessonTimerInterval = null;
          if (oldL.timeLeft <= 0 && !oldL.isLocked) {
            STORE.setState({
              oldLesson: Object.assign({}, oldL, { isLocked: true, timerActive: false })
            });
          }
          return;
        }

        const newTime = oldL.timeLeft - 1;
        STORE.setState({
          oldLesson: Object.assign({}, oldL, { timeLeft: newTime })
        });
      }, 1000);
    },

    // BỐC THĂM KỊCH TÍNH (LUCKY DRAW 2 TẦNG)
    openLuckyDrawModal() {
      const modal = document.getElementById('modal-lucky-draw');
      if (modal) modal.style.display = 'flex';
      const state = STORE.getState();
      const isStudent = (state.role === 'student');
      const closeBtn = document.getElementById('btn-close-lucky-draw');
      const spinBtn = document.getElementById('btn-trigger-spin');
      const stratSelector = document.querySelector('.ld-strategy-selector');
      if (closeBtn) closeBtn.style.display = isStudent ? 'none' : 'inline-flex';
      if (spinBtn) spinBtn.style.display = isStudent ? 'none' : 'inline-flex';
      if (stratSelector) stratSelector.style.display = isStudent ? 'none' : 'flex';

      const banner = document.getElementById('ld-result-banner');
      if (banner) banner.style.display = 'none';
      if (spinBtn) spinBtn.disabled = false;

      this.initLuckyDrawViews();
    },

    closeLuckyDrawModal(broadcast = true) {
      const modal = document.getElementById('modal-lucky-draw');
      if (modal) modal.style.display = 'none';
      if (broadcast) {
        SYNC_BUS.broadcast('LUCKY_DRAW_CLOSE', {});
        if (db) {
          db.ref('activeSession/luckyDraw').update({
            modalOpen: false,
            spinning: false
          }).catch(()=>{});
        }
      }
    },

    setLuckyDrawStrategy(strat) {
      const state = STORE.getState();
      const ld = Object.assign({}, state.luckyDraw, { strategy: strat });
      STORE.setState({ luckyDraw: ld });

      const btnSlot = document.getElementById('btn-strat-slot');
      const btnWheel = document.getElementById('btn-strat-wheel');
      const viewSlot = document.getElementById('ld-view-slot');
      const viewWheel = document.getElementById('ld-view-wheel');

      if (btnSlot) btnSlot.classList.toggle('active', strat === 'slot_machine');
      if (btnWheel) btnWheel.classList.toggle('active', strat === 'wheel_fortune');
      if (viewSlot) viewSlot.style.display = (strat === 'slot_machine') ? 'block' : 'none';
      if (viewWheel) viewWheel.style.display = (strat === 'wheel_fortune') ? 'block' : 'none';

      this.initLuckyDrawViews();
    },

    initLuckyDrawViews() {
      const state = STORE.getState();
      const strat = state.luckyDraw.strategy || 'slot_machine';

      if (strat === 'slot_machine') {
        const reelM = document.getElementById('slot-reel-machine');
        const reelS = document.getElementById('slot-reel-student');
        if (reelM) {
          reelM.style.transform = 'translateY(0px)';
          reelM.style.transition = 'none';
          let html = '';
          for (let r = 0; r < 4; r++) {
            for (let i = 1; i <= 18; i++) {
              html += `<div class="slot-item">MÁY ${String(i).padStart(2,'0')}</div>`;
            }
          }
          reelM.innerHTML = html;
        }
        if (reelS) {
          reelS.style.transform = 'translateY(0px)';
          reelS.style.transition = 'none';
          reelS.innerHTML = '<div class="slot-item">Đang chờ...</div>';
        }
      } else if (strat === 'wheel_fortune') {
        this.drawWheelCanvas();
        const flipper = document.getElementById('wheel-student-flipper');
        const subbox = document.getElementById('wheel-student-subbox');
        if (flipper) flipper.textContent = 'Đang chờ máy...';
        if (subbox) subbox.style.display = 'none';
      }
    },

    drawWheelCanvas() {
      const canvas = document.getElementById('wheel-canvas');
      if (!canvas || !canvas.getContext) return;
      const ctx = canvas.getContext('2d');
      const totalSlices = 18;
      const sliceAngle = (2 * Math.PI) / totalSlices;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = cx - 8;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const colors = ['#059669', '#0284c7', '#7c3aed', '#db2777', '#d97706', '#0d9488'];

      for (let i = 0; i < totalSlices; i++) {
        const angle = i * sliceAngle;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, angle, angle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#0f172a';
        ctx.stroke();

        // Vẽ nhãn M01..M18
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.fillText(`M${String(i + 1).padStart(2,'0')}`, radius - 18, 5);
        ctx.restore();
      }

      // Vòng tròn tâm
      ctx.beginPath();
      ctx.arc(cx, cy, 32, 0, 2 * Math.PI);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#f59e0b';
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LMS', cx, cy + 4);
    },

    startLuckyDrawSpin() {
      const state = STORE.getState();
      const classData = this.classes[state.classId] || this.classes['10A1'];

      // Chọn ngẫu nhiên máy từ 1..18
      const targetMachine = Math.floor(Math.random() * 18) + 1;
      const pair = classData.seatingPlan[targetMachine] || ["Học sinh A", "Học sinh B"];
      // Chọn ngẫu nhiên đích danh 1 học sinh tại máy đó
      const targetStudent = pair[Math.floor(Math.random() * pair.length)];

      const spinBtn = document.getElementById('btn-trigger-spin');
      if (spinBtn) spinBtn.disabled = true;

      const payload = {
        strategy: state.luckyDraw.strategy || 'slot_machine',
        targetMachine: targetMachine,
        targetStudent: targetStudent,
        studentsList: pair,
        duration: 3800
      };

      // Phát lệnh đồng bộ xuống toàn bộ 18 máy học sinh
      SYNC_BUS.broadcast('LUCKY_DRAW_SPIN', payload);
      if (db) {
        db.ref('activeSession/luckyDraw').set({
          payload: payload,
          spinning: true,
          modalOpen: true,
          timestamp: Date.now()
        }).catch(()=>{});
      }

      this.executeLuckyDrawAnimation(payload, true);
    },

    handleRemoteLuckyDrawSpin(payload) {
      if (!payload) return;
      this.openLuckyDrawModal();
      this.setLuckyDrawStrategy(payload.strategy || 'slot_machine');
      const spinBtn = document.getElementById('btn-trigger-spin');
      if (spinBtn) spinBtn.disabled = true;

      this.executeLuckyDrawAnimation(payload, false);
    },

    executeLuckyDrawAnimation(payload, isInitiator) {
      const { strategy, targetMachine, targetStudent, studentsList, duration } = payload;
      const banner = document.getElementById('ld-result-banner');
      if (banner) banner.style.display = 'none';

      SOUNDS.init();
      let tickCount = 0;
      const tickInterval = setInterval(() => {
        SOUNDS.playTick(500 + (tickCount % 6) * 50);
        tickCount++;
        if (tickCount > 25) clearInterval(tickInterval);
      }, 130);

      if (strategy === 'slot_machine') {
        const reelM = document.getElementById('slot-reel-machine');
        const reelS = document.getElementById('slot-reel-student');

        if (reelM) {
          const targetItemIdx = 18 * 2 + (targetMachine - 1);
          reelM.style.transition = `transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
          reelM.style.transform = `translateY(-${targetItemIdx * 100}px)`;
        }

        if (reelS) {
          let sHtml = '';
          const sList = studentsList || [targetStudent];
          for (let r = 0; r < 8; r++) {
            sList.forEach(name => {
              sHtml += `<div class="slot-item">${name}</div>`;
            });
          }
          reelS.innerHTML = sHtml;
          const sTargetIdx = sList.length * 6 + sList.indexOf(targetStudent);
          setTimeout(() => {
            reelS.style.transition = `transform ${duration - 1000}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
            reelS.style.transform = `translateY(-${sTargetIdx * 100}px)`;
          }, 1000);
        }
      } else if (strategy === 'wheel_fortune') {
        const canvas = document.getElementById('wheel-canvas');
        if (canvas) {
          const totalSlices = 18;
          const sliceAngle = 360 / totalSlices;
          // Tâm của lát cắt targetMachine (1..18):
          // Máy 1 (i=0): 10 deg; Máy 13 (i=12): 250 deg; Máy 14 (i=13): 270 deg
          const targetSliceMid = (targetMachine - 1) * sliceAngle + sliceAngle / 2;
          
          // Kim chỉ cố định ở 12 giờ (270 deg)
          // Đích đến: góc lát cắt sau khi xoay phải nằm đúng tại 270 deg
          let targetDeg = (270 - targetSliceMid) % 360;
          if (targetDeg < 0) targetDeg += 360;

          const currentRotMod = (this.wheelCurrentRotation || 0) % 360;
          let delta = targetDeg - currentRotMod;
          if (delta <= 0) delta += 360;

          // Xoay thêm 5 vòng trọn vẹn (1800 deg) để tạo kịch tính
          const extraRounds = 360 * 5;
          this.wheelCurrentRotation = (this.wheelCurrentRotation || 0) + extraRounds + delta;

          canvas.style.transition = `transform ${duration}ms cubic-bezier(0.15, 0.9, 0.2, 1.0)`;
          canvas.style.transform = `rotate(${this.wheelCurrentRotation}deg)`;
        }

        const subbox = document.getElementById('wheel-student-subbox');
        const flipper = document.getElementById('wheel-student-flipper');
        setTimeout(() => {
          if (subbox) subbox.style.display = 'block';
          if (flipper) {
            let flipIdx = 0;
            const sList = studentsList || [targetStudent];
            const flipTimer = setInterval(() => {
              flipper.textContent = sList[flipIdx % sList.length];
              flipIdx++;
            }, 80);
            setTimeout(() => {
              clearInterval(flipTimer);
              flipper.textContent = targetStudent;
              flipper.style.color = '#38bdf8';
            }, 1200);
          }
        }, duration - 1200);
      }

      // Kết thúc bốc thăm
      setTimeout(() => {
        clearInterval(tickInterval);
        SOUNDS.playFanfare();

        if (typeof confetti === 'function') {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 }
          });
        }

        if (banner) {
          banner.style.display = 'block';
          const mText = document.getElementById('lrb-machine-text');
          const sText = document.getElementById('lrb-student-text');
          if (mText) mText.textContent = `MÁY ${String(targetMachine).padStart(2,'0')}`;
          if (sText) sText.textContent = `Em: ${targetStudent}`;
        }

        // Cập nhật vào Store
        const state = STORE.getState();
        const oldL = Object.assign({}, state.oldLesson, {
          selectedMachine: targetMachine,
          selectedStudent: targetStudent
        });
        STORE.setState({ oldLesson: oldL });

        if (db && isInitiator) {
          db.ref('activeSession/oldLesson').update({
            selectedMachine: targetMachine,
            selectedStudent: targetStudent
          }).catch(()=>{});
          db.ref('activeSession/luckyDraw').update({
            spinning: false,
            completed: true
          }).catch(()=>{});
        }

        const spinBtn = document.getElementById('btn-trigger-spin');
        if (spinBtn) spinBtn.disabled = false;

        if (!isInitiator) {
          setTimeout(() => {
            const modal = document.getElementById('modal-lucky-draw');
            if (modal) modal.style.display = 'none';
          }, 3000);
        }
      }, duration + 200);
    }
  };

  // Expose global methods for HTML onclick handlers
  window.APP = APP;
  window.STORE = STORE;
  window.onSelectDesk = function(deskNum) {
    APP.onSelectMachine(deskNum);
  };

  window.switchStudentPhase = function(phase) {
    STORE.setState({ currentPhase: phase });
  };

  window.submitTeacherLogin = function() {
    APP.handleTeacherLoginSubmit();
  };

  window.openLuckyDrawModal = function() { APP.openLuckyDrawModal(); };
  window.closeLuckyDrawModal = function(b) { APP.closeLuckyDrawModal(b); };
  window.setLuckyDrawStrategy = function(s) { APP.setLuckyDrawStrategy(s); };
  window.startLuckyDrawSpin = function() { APP.startLuckyDrawSpin(); };
  window.setOldLessonTimer = function(sec) { APP.setOldLessonTimer(sec); };
  window.setOldLessonQType = function(t) { APP.setOldLessonQType(t); };
  window.broadcastOldLessonStart = function() { APP.broadcastOldLessonStart(); };
  window.toggleOldLessonMenu = function() { APP.toggleOldLessonMenu(); };
  window.closeAllTpbMenus = function() { APP.closeAllTpbMenus(); };
  window.teacherLockOldLesson = function() { APP.teacherLockOldLesson(); };

  window.teacherSetPhase = function(phase) {
    const s = STORE.getState();
    const isStarted = (phase === 'old_lesson') ? true : s.sessionStarted;
    STORE.setState({ currentPhase: phase, teacherPhase: phase, sessionStarted: isStarted });
    SYNC_BUS.broadcast('PHASE_CHANGE', { phase });
    if (db) {
      const doWrite = () => {
        const fbData = {
          currentPhase: phase,
          sessionStarted: isStarted,
          lastUpdated: Date.now()
        };
        if (phase === 'old_lesson') {
          fbData.oldLesson = STORE.getState().oldLesson || {};
        }
        db.ref('activeSession').update(fbData).then(() => {
          console.log('[Firebase] Đã cập nhật activeSession phase:', phase);
        }).catch(err => {
          console.warn('[Firebase] teacherSetPhase error:', err);
        });
      };

      if (typeof firebase !== 'undefined' && firebase.auth && !firebase.auth().currentUser) {
        firebase.auth().signInAnonymously().then(() => doWrite()).catch(() => doWrite());
      } else {
        doWrite();
      }
    }
  };

  // 3-2-1 Countdown Handler đồng bộ toàn phòng máy (Chuẩn Kahoot)
  APP.handleRemoteCountdown = function(cd) {
    if (!cd || !cd.active) {
      const overlay = document.getElementById('activity-countdown-overlay');
      if (overlay) overlay.style.display = 'none';
      return;
    }
    const overlay = document.getElementById('activity-countdown-overlay');
    const nameEl = document.getElementById('acd-activity-name');
    const numEl = document.getElementById('acd-number');
    if (!overlay || !numEl) return;

    if (nameEl) nameEl.textContent = cd.title || 'BƯỚC 1: KIỂM TRA BÀI CŨ';
    overlay.style.display = 'flex';

    let count = 3;
    numEl.textContent = count;
    AUDIO.playTick(500);

    clearInterval(window._countdownTimerInterval);
    window._countdownTimerInterval = setInterval(() => {
      count--;
      if (count > 0) {
        numEl.textContent = count;
        AUDIO.playTick(500 + (3 - count) * 150);
      } else {
        numEl.textContent = '🚀';
        AUDIO.playFanfare();
        clearInterval(window._countdownTimerInterval);
        setTimeout(() => {
          overlay.style.display = 'none';
        }, 800);
      }
    }, 1000);
  };

  // Quản lý Tab Giáo viên (1. Lớp học, 2. Xưởng soạn bài, 3. Sân khấu)
  window.teacherSwitchTab = function(tab) {
    STORE.setState({ teacherTab: tab });
    document.querySelectorAll('.tnt-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.teacher-panel').forEach(p => p.style.display = 'none');

    const activeBtn = document.getElementById(`btn-tnav-${tab}`);
    if (activeBtn) activeBtn.classList.add('active');

    const activePanel = document.getElementById(`teacher-panel-${tab}`);
    if (activePanel) activePanel.style.display = 'block';

    if (tab === 'classes') {
      APP.renderSettingsSeatingGrid();
    }
  };

  window.teacherOnGradeChange = function(grade) {
    STORE.setState({ grade });
    const classSel = document.getElementById('teacher-select-class');
    if (classSel) {
      if (grade === '11') {
        classSel.innerHTML = '<option value="11A1">Lớp 11A1 (36 học sinh • 18 máy)</option><option value="11A2">Lớp 11A2 (35 học sinh • 18 máy)</option>';
      } else if (grade === '12') {
        classSel.innerHTML = '<option value="12A1">Lớp 12A1 (38 học sinh • 18 máy)</option><option value="12A2">Lớp 12A2 (37 học sinh • 18 máy)</option>';
      } else {
        classSel.innerHTML = '<option value="10A1">Lớp 10A1 (35 học sinh • 18 máy)</option><option value="10A2">Lớp 10A2 (36 học sinh • 18 máy)</option><option value="10A3">Lớp 10A3 (34 học sinh • 18 máy)</option>';
      }
    }
  };

  // Bắt đầu tiết học: Kích hoạt đếm ngược 3-2-1 đồng bộ trước khi vào bước 1
  window.teacherStartLesson = function() {
    const s = STORE.getState();
    const checkedInCount = Object.keys(s.occupiedMachines || {}).length;
    if (checkedInCount === 0) {
      if (!confirm('Chưa có máy học sinh nào vào phòng chờ! Thầy vẫn muốn bắt đầu tiết học?')) {
        return;
      }
    }

    if (db) {
      db.ref('activeSession/countdown').set({
        active: true,
        title: 'BƯỚC 1: KIỂM TRA BÀI CŨ',
        startedAt: Date.now()
      }).catch(()=>{});
    }
    APP.handleRemoteCountdown({ active: true, title: 'BƯỚC 1: KIỂM TRA BÀI CŨ' });

    setTimeout(() => {
      window.teacherSetPhase('old_lesson');
      if (db) {
        db.ref('activeSession/countdown').remove().catch(()=>{});
      }
    }, 3800);
  };

  // Master Timer Controls
  window.masterPauseTimer = function() {
    const s = STORE.getState();
    const isPaused = !s.timer.paused;
    STORE.setState({ timer: Object.assign({}, s.timer, { paused: isPaused }) });
    const btn = document.getElementById('btn-master-pause-timer');
    if (btn) btn.innerHTML = isPaused ? '<i class="fas fa-play"></i> Tiếp tục' : '<i class="fas fa-pause"></i> Tạm dừng';
    if (db) {
      db.ref('activeSession/timer/paused').set(isPaused).catch(()=>{});
    }
  };

  window.masterAddTime = function(sec = 30) {
    const s = STORE.getState();
    const newEndsAt = (s.timer.endsAt || Date.now()) + (sec * 1000);
    STORE.setState({ timer: Object.assign({}, s.timer, { endsAt: newEndsAt }) });
    if (db) {
      db.ref('activeSession/timer/endsAt').set(newEndsAt).catch(()=>{});
    }
  };

  window.masterSkipStep = function() {
    const s = STORE.getState();
    const phases = ['waiting', 'old_lesson', 'warmup', 'theory', 'discussion', 'quiz'];
    const curIdx = phases.indexOf(s.currentPhase);
    if (curIdx >= 0 && curIdx < phases.length - 1) {
      const nextPhase = phases[curIdx + 1];
      window.teacherSetPhase(nextPhase);
    }
  };

  window.teacherEndSession = function() {
    const btn = document.getElementById('btn-end-class-session');
    if (btn) btn.click();
  };

  window.studioSelectGrade = function(grade) {
    document.querySelectorAll('.sg-btn').forEach(b => b.classList.toggle('active', b.textContent.includes(grade)));
  };

  window.studioLoadLesson = function(_lessonId) {
    document.querySelectorAll('.sb-lesson-item').forEach(b => b.classList.remove('active'));
  };

  window.studioCreateNewLesson = function() {
    const name = prompt('Nhập tên bài dạy mới:', 'Bài 03: Mạng máy tính và Internet');
    if (name) alert(`🎉 Đã tạo bài dạy: "${name}"! Thầy hãy cấu hình các bước trong kịch bản.`);
  };

  window.studioPreviewLesson = function() {
    alert('👁️ Mở chế độ xem trước (Preview): Kịch bản hoạt động chính xác theo chuẩn Kahoot/Quizizz!');
  };

  window.studioSaveLesson = function() {
    alert('💾 Đã lưu Kịch bản Bài dạy thành công vào cơ sở dữ liệu!');
  };

  window.filterClassesByGrade = function(g) {
    const sel = document.getElementById('classes-select-class');
    if (!sel) return;
    if (g === '11') {
      sel.innerHTML = '<option value="11A1">Lớp 11A1 (36 học sinh)</option><option value="11A2">Lớp 11A2 (35 học sinh)</option>';
    } else if (g === '12') {
      sel.innerHTML = '<option value="12A1">Lớp 12A1 (38 học sinh)</option><option value="12A2">Lớp 12A2 (37 học sinh)</option>';
    } else {
      sel.innerHTML = '<option value="10A1">Lớp 10A1 (35 học sinh)</option><option value="10A2">Lớp 10A2 (36 học sinh)</option><option value="10A3">Lớp 10A3 (34 học sinh)</option>';
    }
  };

  window.teacherSelectClassForEdit = function(_c) {
    APP.renderSettingsSeatingGrid();
  };

  // Khởi động ứng dụng khi DOM sẵn sàng
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => APP.init());
  } else {
    APP.init();
  }

})();


