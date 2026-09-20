using System.Diagnostics;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace CvaLmsAgent;

public class ClassroomFocusLockManager
{
    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool UnhookWindowsHookEx(IntPtr hhk);

    [DllImport("user32.dll")]
    private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

    [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr GetModuleHandle(string lpModuleName);

    private delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);

    private const int WH_KEYBOARD_LL = 13;
    private const int WM_KEYDOWN = 0x0100;
    private const int WM_SYSKEYDOWN = 0x0104;

    private static IntPtr _hookId = IntPtr.Zero;
    private static LowLevelKeyboardProc? _proc;
    private static FocusLockOverlayForm? _activeForm;
    private static readonly object _lock = new();

    public static bool IsLocked => _activeForm != null && !_activeForm.IsDisposed;

    public static void Lock(string message)
    {
        lock (_lock)
        {
            if (IsLocked)
            {
                _activeForm?.UpdateMessage(message);
                return;
            }

            // Cài đặt Keyboard Hook
            _proc = HookCallback;
            using var curProcess = Process.GetCurrentProcess();
            using var curModule = curProcess.MainModule;
            _hookId = SetWindowsHookEx(WH_KEYBOARD_LL, _proc, GetModuleHandle(curModule?.ModuleName ?? "CvaLmsAgent"), 0);

            // Mở Form Overlay trên UI Thread
            var thread = new Thread(() =>
            {
                _activeForm = new FocusLockOverlayForm(message, OnEmergencyUnlocked);
                Application.Run(_activeForm);
            });
            thread.SetApartmentState(ApartmentState.STA);
            thread.IsBackground = true;
            thread.Start();
        }
    }

    public static void Unlock()
    {
        lock (_lock)
        {
            if (_hookId != IntPtr.Zero)
            {
                UnhookWindowsHookEx(_hookId);
                _hookId = IntPtr.Zero;
            }

            if (_activeForm != null && !_activeForm.IsDisposed)
            {
                _activeForm.Invoke(new Action(() => _activeForm.Close()));
                _activeForm = null;
            }
        }
    }

    private static void OnEmergencyUnlocked()
    {
        Unlock();
    }

    private static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam)
    {
        if (nCode >= 0 && (wParam == (IntPtr)WM_KEYDOWN || wParam == (IntPtr)WM_SYSKEYDOWN))
        {
            int vkCode = Marshal.ReadInt32(lParam);
            var key = (Keys)vkCode;

            // Chặn phím Windows trái/phải
            if (key == Keys.LWin || key == Keys.RWin)
                return (IntPtr)1;

            // Chặn Alt + Tab, Alt + F4, Alt + Escape
            bool isAlt = (Control.ModifierKeys & Keys.Alt) != 0;
            if (isAlt && (key == Keys.Tab || key == Keys.F4 || key == Keys.Escape))
                return (IntPtr)1;

            // Chặn Ctrl + Escape
            bool isCtrl = (Control.ModifierKeys & Keys.Control) != 0;
            if (isCtrl && key == Keys.Escape)
                return (IntPtr)1;
        }

        return CallNextHookEx(_hookId, nCode, wParam, lParam);
    }
}

public class FocusLockOverlayForm : Form
{
    private readonly Action _onUnlocked;
    private readonly Label _lblTitle;
    private readonly Label _lblMessage;
    private readonly TextBox _txtPasscode;
    private readonly Button _btnUnlock;
    private readonly Label _lblStatus;
    private int _failedAttempts = 0;
    private DateTime _lockoutUntil = DateTime.MinValue;

    public FocusLockOverlayForm(string message, Action onUnlocked)
    {
        _onUnlocked = onUnlocked;

        FormBorderStyle = FormBorderStyle.None;
        WindowState = FormWindowState.Maximized;
        TopMost = true;
        BackColor = Color.FromArgb(10, 14, 26);
        ShowInTaskbar = false;
        DoubleBuffered = true;

        var panel = new Panel
        {
            Size = new Size(700, 450),
            BackColor = Color.FromArgb(18, 24, 42),
            BorderStyle = BorderStyle.FixedSingle
        };
        panel.Location = new Point((Screen.PrimaryScreen?.Bounds.Width ?? 1920 - panel.Width) / 2, (Screen.PrimaryScreen?.Bounds.Height ?? 1080 - panel.Height) / 2);

        _lblTitle = new Label
        {
            Text = "🔒 KHÔNG GIAN HỌC TẬP TẬP TRUNG",
            Font = new Font("Segoe UI", 18, FontStyle.Bold),
            ForeColor = Color.FromArgb(0, 242, 254),
            TextAlign = ContentAlignment.MiddleCenter,
            Dock = DockStyle.Top,
            Height = 60
        };

        _lblMessage = new Label
        {
            Text = message,
            Font = new Font("Segoe UI", 14, FontStyle.Regular),
            ForeColor = Color.FromArgb(226, 232, 240),
            TextAlign = ContentAlignment.MiddleCenter,
            Dock = DockStyle.Top,
            Height = 100
        };

        var lblInstruction = new Label
        {
            Text = "Các em vui lòng chú ý lắng nghe Thầy/Cô hướng dẫn trên bảng chiếu!",
            Font = new Font("Segoe UI", 11, FontStyle.Italic),
            ForeColor = Color.FromArgb(148, 163, 184),
            TextAlign = ContentAlignment.MiddleCenter,
            Dock = DockStyle.Top,
            Height = 40
        };

        var pnlPasscode = new Panel
        {
            Dock = DockStyle.Bottom,
            Height = 140,
            BackColor = Color.Transparent
        };

        var lblPass = new Label
        {
            Text = "Mã khẩn cấp giáo viên (Break-Glass):",
            Font = new Font("Segoe UI", 10, FontStyle.Regular),
            ForeColor = Color.FromArgb(148, 163, 184),
            Location = new Point(150, 15),
            AutoSize = true
        };

        _txtPasscode = new TextBox
        {
            PasswordChar = '●',
            Font = new Font("Segoe UI", 12),
            Width = 220,
            Location = new Point(150, 45),
            BackColor = Color.FromArgb(15, 23, 42),
            ForeColor = Color.White
        };

        _btnUnlock = new Button
        {
            Text = "Mở khóa",
            Font = new Font("Segoe UI", 10, FontStyle.Bold),
            BackColor = Color.FromArgb(14, 165, 233),
            ForeColor = Color.White,
            FlatStyle = FlatStyle.Flat,
            Width = 120,
            Height = 35,
            Location = new Point(390, 43)
        };
        _btnUnlock.Click += (s, e) => TryUnlock();

        _lblStatus = new Label
        {
            Text = "",
            Font = new Font("Segoe UI", 9, FontStyle.Bold),
            ForeColor = Color.FromArgb(239, 68, 68),
            Location = new Point(150, 85),
            AutoSize = true
        };

        pnlPasscode.Controls.Add(lblPass);
        pnlPasscode.Controls.Add(_txtPasscode);
        pnlPasscode.Controls.Add(_btnUnlock);
        pnlPasscode.Controls.Add(_lblStatus);

        panel.Controls.Add(pnlPasscode);
        panel.Controls.Add(lblInstruction);
        panel.Controls.Add(_lblMessage);
        panel.Controls.Add(_lblTitle);

        Controls.Add(panel);
    }

    public void UpdateMessage(string msg)
    {
        if (InvokeRequired)
        {
            Invoke(new Action(() => UpdateMessage(msg)));
            return;
        }
        _lblMessage.Text = msg;
    }

    private void TryUnlock()
    {
        if (DateTime.UtcNow < _lockoutUntil)
        {
            var remaining = (int)(_lockoutUntil - DateTime.UtcNow).TotalSeconds;
            _lblStatus.Text = $"Đã khóa nhập tạm thời! Thử lại sau {remaining} giây.";
            return;
        }

        var pass = _txtPasscode.Text.Trim();
        // Emergency passcode mặc định của giáo viên THCS
        if (pass == "123456" || pass == "ThayKhang@2026")
        {
            _onUnlocked();
        }
        else
        {
            _failedAttempts++;
            if (_failedAttempts >= 5)
            {
                _lockoutUntil = DateTime.UtcNow.AddSeconds(60);
                _lblStatus.Text = "Nhập sai quá 5 lần! Khóa chức năng nhập 60 giây.";
            }
            else
            {
                _lblStatus.Text = $"Sai mật mã! ({_failedAttempts}/5 lần)";
            }
            _txtPasscode.Clear();
        }
    }
}
