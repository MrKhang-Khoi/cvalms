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
        "3": ["Vũ Đức Minh", "Hoàng Kim Ngân"],
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

  // 2. STORE — QUẢN LÝ TRẠNG THÁI TỔNG THỂ
  const STORE = {
    state: {
      screen: 'lobby',          // 'lobby' hoặc 'student'
      classId: '10A1',          // Lớp hiện tại
      lessonId: 'tin10_bai12',
      lessonData: EMBEDDED_LESSONS['tin10_bai12'],
      fixedMachineId: null,     // Số máy đã lưu cố định trên thiết bị này
      machineId: null,          // Số máy hiện tại đang mở trong phiên
      pendingMachineId: null,   // Số máy đang chờ bấm xác nhận trong modal
      students: [],             // Danh sách 2 bạn tại máy
      occupiedMachines: {       // Danh sách các máy đã có bạn khác chọn (mô phỏng / realtime)
        1: true,
        2: true
      },
      currentPhase: 'waiting',  // 'waiting', 'warmup', 'theory', 'discussion', 'quiz'
      pollSelection: null,
      pollLocked: false,
      discStatus: 'working',
      discSubmissionTime: null,
      quizSelection: null,
      quizAnswered: false,
      isSos: false
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
            return num;
          }
        }
        const saved = localStorage.getItem('lms_fixed_machine_id');
        if (saved) {
          const num = parseInt(saved, 10);
          if (num >= 1 && num <= 18) {
            this.state.fixedMachineId = num;
            return num;
          }
        }
      } catch (e) {
        console.warn('[LocalStorage] Không truy cập được storage:', e);
      }
      return null;
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
        console.log('[Firebase] Đã kết nối cơ sở dữ liệu thời gian thực.');
      } catch (e) {
        console.warn('[Firebase] Đang chạy chế độ Local Standalone:', e);
      }
    }
  }

  // 4. BỘ ĐIỀU KHIỂN GIAO DIỆN HỌC SINH (STUDENT CONTROLLER)
  const APP = {
    classes: EMBEDDED_CLASSES,
    lessons: EMBEDDED_LESSONS,

    init() {
      initFirebase();
      STORE.loadSavedDeviceToken();
      STORE.subscribe(state => this.render(state));
      this.bindEvents();
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
          } catch (e) {}
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
          } catch (e) {}

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
          } catch (e) {}
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
            } catch (err) {}
          }
        });
      });
    },

    // Hàm mở modal khi click vào máy tính tại Sảnh
    onSelectMachine(num) {
      const state = STORE.getState();
      const fixedId = state.fixedMachineId;

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
        modalTags.innerHTML = `
          <div class="pair-tag"><i class="fas fa-user-graduate"></i> 1. ${pair[0] || 'Chưa phân công'}</div>
          <div class="pair-tag"><i class="fas fa-user-graduate"></i> 2. ${pair[1] || 'Chưa phân công'}</div>
        `;
      }

      const confirmModal = document.getElementById('modal-confirm-machine');
      if (confirmModal) confirmModal.style.display = 'flex';
    },

    render(state) {
      // 1. Chuyển màn hình chính: Sảnh (Lobby) hoặc Học sinh (Student Workspace)
      const screenLobby = document.getElementById('screen-lobby');
      const screenStudent = document.getElementById('screen-student');

      if (screenLobby && screenStudent) {
        if (state.screen === 'lobby') {
          screenLobby.classList.add('active');
          screenStudent.classList.remove('active');
        } else {
          screenLobby.classList.remove('active');
          screenStudent.classList.add('active');
        }
      }

      // 2. Render Sảnh 18 máy tính
      this.renderLobby(state);

      // 3. Render Không gian Học sinh
      this.renderStudentWorkspace(state);
    },

    renderLobby(state) {
      const classData = this.classes[state.classId] || this.classes['10A1'];
      const grid = document.getElementById('computers-grid');
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
              <div class="student-row"><i class="fas fa-user"></i> ${pair[0] || 'Trống'}</div>
              <div class="student-row"><i class="fas fa-user"></i> ${pair[1] || 'Trống'}</div>
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

      // Thanh tiến trình sư phạm (Pace Navigator)
      document.querySelectorAll('.pn-item').forEach(item => {
        item.classList.toggle('active', item.dataset.phase === currentPhase);
      });

      // Chuyển view nội dung
      const views = {
        'waiting': document.getElementById('st-view-waiting'),
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
      if (currentPhase === 'waiting') {
        const deskInfo = document.getElementById('waiting-desk-info');
        if (deskInfo) deskInfo.textContent = `Máy bàn số ${String(machineId || 4).padStart(2,'0')}`;

        const pairInfo = document.getElementById('waiting-pair-info');
        if (pairInfo) pairInfo.textContent = students && students.length > 0 ? students.join(' & ') : 'Đang cập nhật';

        // Render Classroom Radar 18 máy thu nhỏ
        const radarGrid = document.getElementById('radar-grid');
        if (radarGrid) {
          let radarHtml = '';
          for (let i = 1; i <= 18; i++) {
            const isThis = (i === machineId);
            const isAct = isThis || state.occupiedMachines[i];
            let cellClass = 'radar-cell';
            if (isThis) cellClass += ' this-machine';
            else if (isAct) cellClass += ' active-desk';

            radarHtml += `
              <div class="${cellClass}">
                <span class="rc-num">${String(i).padStart(2,'0')}</span>
                <span class="rc-dot"></span>
              </div>
            `;
          }
          radarGrid.innerHTML = radarHtml;
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
    }
  };

  // Expose global methods for HTML onclick handlers
  window.onSelectDesk = function(deskNum) {
    APP.onSelectMachine(deskNum);
  };

  window.switchStudentPhase = function(phase) {
    STORE.setState({ currentPhase: phase });
  };

  // Khởi động ứng dụng khi DOM sẵn sàng
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => APP.init());
  } else {
    APP.init();
  }

})();


