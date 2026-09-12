/* ==========================================================
 * BUNDLE.JS — LMS PHÒNG MÁY TƯƠNG TÁC 18 MÁY (STANDALONE)
 * Hỗ trợ chạy trực tiếp cả trên file:/// lẫn http/https (GitHub Pages)
 * Tuyệt đối không bị lỗi CORS của trình duyệt!
 * ========================================================== */

(function() {
  'use strict';

  // 1. DỮ LIỆU CƠ SỞ (TÍCH HỢP SẴN ĐỂ CHẠY MƯỢT KHI MỞ TRỰC TIẾP TỪ FILE)
  const EMBEDDED_CLASSES = {
    "9A1": {
      "className": "Lớp 9A1",
      "grade": 9,
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
    },
    "10A1": {
      "className": "Lớp 10A1",
      "grade": 10,
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
        "18": ["Đặng Quốc Tuấn", ""]
      }
    }
  };

  const EMBEDDED_LESSONS = {
    "tin10_bai12": {
      "id": "tin10_bai12",
      "title": "Bài 12: Kiểu dữ liệu xâu trong Python",
      "grade": 10,
      "warmup": {
        "type": "code-poll",
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
          "code": "# Ví dụ khởi tạo xâu\ns1 = 'Xin chao'\ns2 = \"Tin hoc 10\"\n\n# Độ dài xâu (hàm len)\nprint(len(s1))  # Kết quả: 8",
          "note": "Ký tự khoảng trắng (dấu cách) cũng được tính là một ký tự trong xâu."
        },
        {
          "id": "card-2",
          "title": "2. Truy cập phần tử & Phép cắt xâu (Slicing)",
          "summary": "Mỗi ký tự có một chỉ số (index): chỉ số dương bắt đầu từ 0 (từ trái qua), chỉ số âm từ -1 (từ phải qua). Cú pháp cắt xâu: s[bắt_đầu : kết_thúc].",
          "code": "s = \"Python\"\nprint(s[0])    # 'P' (ký tự đầu)\nprint(s[-1])   # 'n' (ký tự cuối)\nprint(s[0:2])  # 'Py' (từ chỉ số 0 đến trước 2)\nprint(s[2:])   # 'thon' (từ chỉ số 2 đến hết)",
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
        "placeholder": "# Gõ câu trả lời và mã code của nhóm bạn vào đây...\n# Ví dụ:\ns = 'chuc mung nam moi 2026'\n# 1. In do dai:\nprint(...)\n\n# 2. Trich xuat 'nam moi':\nprint(...)\n\n# 3. Dem khoang trang:\n...",
        "timeLimit": 720
      }
    }
  };

  // 2. STORE — QUẢN LÝ TRẠNG THÁI
  const STORE = {
    state: {
      role: 'student',
      fixedMachineId: null,
      machineId: null,
      students: [],
      classId: '10A1',
      lessonId: 'tin10_bai12',
      lessonData: EMBEDDED_LESSONS['tin10_bai12'],
      currentPhase: 'waiting',
      sessionStatus: 'idle',
      timerRemaining: 0,
      pollSelection: null,
      pollLocked: false,
      discStatus: 'working',
      discSubmissionTime: null,
      isSos: false,
      appVersion: '2.0.1'
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
    initFixedMachine() {
      try {
        const params = new URLSearchParams(window.location.search);
        const setMachineParam = params.get('set_machine');
        if (setMachineParam) {
          const num = parseInt(setMachineParam, 10);
          if (num >= 1 && num <= 18) {
            localStorage.setItem('lms_fixed_machine_id', num.toString());
            this.setState({ fixedMachineId: num, machineId: num });
            return num;
          }
        }
        const saved = localStorage.getItem('lms_fixed_machine_id');
        if (saved) {
          const num = parseInt(saved, 10);
          this.setState({ fixedMachineId: num, machineId: num });
          return num;
        }
      } catch (e) {}
      // Mặc định giả lập máy 4 để thầy test ngay
      this.setState({ fixedMachineId: 4, machineId: 4 });
      return 4;
    }
  };

  // 3. FIREBASE WRAPPER
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
        console.log('[Firebase] Đã kết nối Realtime Database.');
      } catch (e) {
        console.warn('[Firebase] Khởi tạo Firebase bị lỗi hoặc đang chạy offline:', e);
      }
    }
  }

  // 4. STUDENT MODULE
  const STUDENT_MODULE = {
    classesData: EMBEDDED_CLASSES,
    lessonsData: EMBEDDED_LESSONS,

    init() {
      STORE.initFixedMachine();
      STORE.subscribe(state => this.render(state));
      this.bindEvents();
      this.render(STORE.getState());
    },

    bindEvents() {
      const sosBtn = document.getElementById('btn-student-sos');
      if (sosBtn) {
        sosBtn.addEventListener('click', () => {
          const state = STORE.getState();
          const newSos = !state.isSos;
          STORE.setState({ isSos: newSos });
          if (db && state.machineId) {
            db.ref(`activeSession/machines/${state.machineId}/isSos`).set(newSos).catch(()=>{});
          }
        });
      }

      const confirmBtn = document.getElementById('btn-confirm-checkin');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
          const state = STORE.getState();
          const machineId = state.machineId || state.fixedMachineId || 4;
          STORE.setState({ currentPhase: 'ready' });
          if (db) {
            db.ref(`activeSession/machines/${machineId}`).set({
              machineId: machineId,
              students: state.students,
              status: 'active',
              joinedAt: Date.now()
            }).catch(()=>{});
          }
        });
      }

      const submitDiscBtn = document.getElementById('btn-submit-discussion');
      if (submitDiscBtn) {
        submitDiscBtn.addEventListener('click', () => {
          const input = document.getElementById('disc-answer-input');
          const content = input ? input.value.trim() : '';
          if (!content) {
            alert('Vui lòng nhập nội dung bài làm của nhóm!');
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
    },

    render(state) {
      const { currentPhase, fixedMachineId, machineId, students, isSos } = state;

      const machineBadge = document.getElementById('sh-machine-badge');
      if (machineBadge) {
        machineBadge.textContent = machineId ? `Máy ${machineId}` : (fixedMachineId ? `Máy ${fixedMachineId}` : 'Máy 4');
      }

      const studentsLabel = document.getElementById('sh-students-label');
      if (studentsLabel) {
        studentsLabel.textContent = students && students.length > 0 ? students.join(' & ') : 'Chưa điểm danh';
      }

      const sosBtn = document.getElementById('btn-student-sos');
      if (sosBtn) {
        sosBtn.classList.toggle('active', isSos);
        sosBtn.innerHTML = isSos ? '<i class="fas fa-hand-paper"></i> Đã gọi thầy' : '<i class="fas fa-hand-paper"></i> Cần trợ giúp';
      }

      const viewWaiting = document.getElementById('st-view-waiting');
      const viewSeating = document.getElementById('st-view-seating');
      const viewReady = document.getElementById('st-view-ready');
      const viewWarmup = document.getElementById('st-view-warmup');
      const viewTheory = document.getElementById('st-view-theory');
      const viewDiscussion = document.getElementById('st-view-discussion');
      const viewQuiz = document.getElementById('st-view-quiz');

      const views = [viewWaiting, viewSeating, viewReady, viewWarmup, viewTheory, viewDiscussion, viewQuiz];
      views.forEach(v => { if (v) v.style.display = 'none'; });

      if (currentPhase === 'waiting') {
        if (viewWaiting) viewWaiting.style.display = 'flex';
      } else if (currentPhase === 'seating') {
        if (viewSeating) {
          viewSeating.style.display = 'flex';
          this.renderSeating(state);
        }
      } else if (currentPhase === 'ready') {
        if (viewReady) viewReady.style.display = 'flex';
      } else if (currentPhase === 'warmup') {
        if (viewWarmup) {
          viewWarmup.style.display = 'flex';
          this.renderWarmup(state);
        }
      } else if (currentPhase === 'theory') {
        if (viewTheory) {
          viewTheory.style.display = 'flex';
          this.renderTheory(state);
        }
      } else if (currentPhase === 'discussion') {
        if (viewDiscussion) {
          viewDiscussion.style.display = 'grid';
          this.renderDiscussion(state);
        }
      } else if (currentPhase === 'quiz') {
        if (viewQuiz) viewQuiz.style.display = 'flex';
      }
    },

    renderSeating(state) {
      const cardTitle = document.getElementById('seating-card-title');
      const pairNames = document.getElementById('seating-pair-names');
      const mId = state.machineId || state.fixedMachineId || 4;

      let pair = ['Học sinh 1', 'Học sinh 2'];
      if (this.classesData && state.classId && this.classesData[state.classId]) {
        const cls = this.classesData[state.classId];
        if (cls.seatingPlan && cls.seatingPlan[mId.toString()]) {
          pair = cls.seatingPlan[mId.toString()].filter(n => n.trim() !== '');
        }
      }

      state.machineId = mId;
      state.students = pair;

      if (cardTitle) cardTitle.textContent = `🖥️ MÁY BÀN SỐ ${mId} — ${state.classId}`;
      if (pairNames) {
        pairNames.innerHTML = pair.length > 1 
          ? `<div class="pair-tag"><i class="fas fa-user-graduate"></i> ${pair[0]}</div>
             <div class="pair-tag"><i class="fas fa-user-graduate"></i> ${pair[1]}</div>`
          : `<div class="pair-tag"><i class="fas fa-user-graduate"></i> ${pair[0]} (Ngồi 1 mình)</div>`;
      }
    },

    renderWarmup(state) {
      const q = state.lessonData?.warmup || {
        question: "Câu hỏi thăm dò nhanh từ Giáo viên trên bảng:",
        options: { A: "Phương án A", B: "Phương án B", C: "Phương án C", D: "Phương án D" }
      };

      const qText = document.getElementById('poll-question-text');
      if (qText) qText.textContent = q.question;

      const codeBox = document.getElementById('poll-code-snippet');
      if (codeBox) {
        if (q.code) {
          codeBox.style.display = 'block';
          codeBox.textContent = q.code;
        } else {
          codeBox.style.display = 'none';
        }
      }

      document.querySelectorAll('.poll-opt-btn').forEach(btn => {
        const choice = btn.dataset.choice;
        btn.classList.toggle('selected', state.pollSelection === choice);
      });

      const statusMsg = document.getElementById('poll-status-msg');
      if (statusMsg) {
        if (state.pollSelection) {
          statusMsg.innerHTML = `<i class="fas fa-check-circle" style="color:var(--success)"></i> Đã ghi nhận: <strong>Đáp án ${state.pollSelection}</strong>. Chờ giáo viên công bố!`;
        } else {
          statusMsg.textContent = 'Hai em hãy trao đổi nhanh và bấm chọn 1 đáp án:';
        }
      }
    },

    renderTheory(state) {
      const container = document.getElementById('theory-cards-container');
      if (!container) return;
      const cards = state.lessonData?.theory || [];
      container.innerHTML = cards.map(c => `
        <div class="theory-card">
          <h3 class="theory-card-title"><i class="fas fa-bookmark"></i> ${c.title}</h3>
          <p class="theory-card-summary">${c.summary}</p>
          ${c.code ? `<pre class="code-block"><code>${c.code}</code></pre>` : ''}
          ${c.note ? `<div class="theory-card-note"><i class="fas fa-info-circle"></i> ${c.note}</div>` : ''}
        </div>
      `).join('');
    },

    renderDiscussion(state) {
      const taskBox = document.getElementById('disc-task-description');
      const disc = state.lessonData?.discussion;
      if (taskBox && disc) {
        taskBox.innerHTML = `
          <h3><i class="fas fa-tasks"></i> ${disc.title}</h3>
          <p style="white-space: pre-line;">${disc.task}</p>
        `;
      }

      const refContainer = document.getElementById('disc-theory-reference');
      if (refContainer) {
        const cards = state.lessonData?.theory || [];
        refContainer.innerHTML = cards.map(c => `
          <div class="ref-card">
            <h4>${c.title}</h4>
            ${c.code ? `<pre class="code-block mini"><code>${c.code}</code></pre>` : ''}
          </div>
        `).join('');
      }

      const statusEl = document.getElementById('disc-submission-status');
      const submitBtn = document.getElementById('btn-submit-discussion');
      if (statusEl) {
        if (state.discStatus === 'submitted') {
          statusEl.innerHTML = `<span class="badge-success"><i class="fas fa-check"></i> Đã nộp bài lúc ${state.discSubmissionTime || ''}</span> (Có thể sửa và nộp lại)`;
          if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-redo"></i> CẬP NHẬT LẠI BÀI LÀM';
        } else {
          statusEl.innerHTML = `<span class="badge-warning"><i class="fas fa-clock"></i> Đang làm bài...</span>`;
          if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> GỬI BÀI LÀM CỦA MÁY';
        }
      }
    }
  };

  // 5. KHỞI CHẠY KHI TẢI TRANG
  window.STORE = STORE;
  window.STUDENT_MODULE = STUDENT_MODULE;

  window.setTestPhase = function(phase, btnEl) {
    console.log(`[Thử nghiệm] Chuyển sang chặng: ${phase}`);
    document.querySelectorAll('.p-tab').forEach(b => b.classList.remove('active'));
    if (btnEl) {
      btnEl.classList.add('active');
    } else {
      const match = document.querySelector(`.p-tab[onclick*="'${phase}'"]`);
      if (match) match.classList.add('active');
    }
    STORE.setState({
      classId: '10A1',
      sessionStatus: 'running',
      currentPhase: phase,
      machineId: 4,
      students: ['Đỗ Gia Huy', 'Bùi Phương Mai']
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    initFirebase();
    STUDENT_MODULE.init();

    // Lắng nghe Firebase nếu có
    if (db) {
      db.ref('activeSession').on('value', snap => {
        const session = snap.val();
        if (session && session.status === 'running') {
          STORE.setState({
            classId: session.classId || '10A1',
            currentPhase: session.currentPhase || 'waiting',
            sessionStatus: 'running'
          });
        }
      });
    }
  });

})();
