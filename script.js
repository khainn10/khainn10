/**
 * ==========================================================================
 * AGRIBANK KTNB - HỆ THỐNG QUẢN LÝ CÔNG VIỆC NỘI BỘ
 * --------------------------------------------------------------------------
 * @description Quản lý danh sách công việc kiểm toán nội bộ.
 * Lưu trữ dữ liệu tạm thời trong bộ nhớ Javascript (RAM / in-memory).
 * Chức năng: Thêm, Sửa, Xóa, Đánh dấu hoàn thành, Lọc trạng thái, Tìm kiếm.
 * ==========================================================================
 */

/**
 * Cấu trúc dữ liệu công việc (Task):
 * @typedef {Object} Task
 * @property {number} id - Mã định danh duy nhất (Timestamp)
 * @property {string} ten - Tên công việc (ví dụ: "Kiểm toán Chi nhánh A")
 * @property {string} nguoi_phu_trach - Họ tên người được phân công
 * @property {'dang_lam' | 'hoan_thanh'} trang_thai - Trạng thái thực hiện
 * @property {string} ngay_tao - Ngày giờ khởi tạo định dạng tiếng Việt
 */

// 1. DỮ LIỆU BAN ĐẦU (Mẫu kiểm toán nội bộ Agribank)
let tasks = [
  {
    id: 101,
    ten: 'Kiểm toán quy trình cấp tín dụng Chi nhánh Sài Gòn Q3',
    nguoi_phu_trach: 'Nguyễn Văn Ánh',
    trang_thai: 'dang_lam',
    ngay_tao: '01/08/2026',
  },
  {
    id: 102,
    ten: 'Rà soát an toàn hệ thống giao dịch Teller và Quầy Giao dịch',
    nguoi_phu_trach: 'Trần Thị Bình',
    trang_thai: 'hoan_thanh',
    ngay_tao: '31/07/2026',
  },
  {
    id: 103,
    ten: 'Tổng hợp báo cáo kiến nghị kiểm toán nội bộ 6 tháng đầu năm',
    nguoi_phu_trach: 'Lê Hoài Nam',
    trang_thai: 'dang_lam',
    ngay_tao: '30/07/2026',
  },
];

// Biến trạng thái ứng dụng
let currentFilter = 'all'; // 'all' | 'dang_lam' | 'hoan_thanh'
let searchQuery = '';
let editingTaskId = null;
let pendingDeleteId = null;

// 2. TRUY XUẤT CÁC PHẦN TỬ DOM (DOM Elements)
const taskForm = document.getElementById('taskForm');
const taskIdInput = document.getElementById('taskId');
const tenInput = document.getElementById('ten');
const nguoiPhuTrachInput = document.getElementById('nguoi_phu_trach');
const trangThaiInput = document.getElementById('trang_thai');

const formTitleText = document.getElementById('formTitleText');
const submitBtnText = document.getElementById('submitBtnText');
const cancelEditBtn = document.getElementById('cancelEditBtn');

const taskList = document.getElementById('taskList');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');

// Dashboard Elements
const statTotal = document.getElementById('statTotal');
const statDoing = document.getElementById('statDoing');
const statDone = document.getElementById('statDone');
const statPercent = document.getElementById('statPercent');
const progressBarFill = document.getElementById('progressBarFill');

// Badges
const badgeAll = document.getElementById('badgeAll');
const badgeDoing = document.getElementById('badgeDoing');
const badgeDone = document.getElementById('badgeDone');

// Theme & Modal
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeLabel = document.getElementById('themeLabel');
const confirmModal = document.getElementById('confirmModal');
const modalMessage = document.getElementById('modalMessage');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalConfirmBtn = document.getElementById('modalConfirmBtn');
const toastContainer = document.getElementById('toastContainer');

// 3. HÀM TIỆN ÍCH (Utility Functions)

/** Tạo ID ngẫu nhiên dựa trên thời gian */
function generateId() {
  return Date.now() + Math.floor(Math.random() * 100);
}

/** Lấy ngày hiện tại dạng dd/mm/yyyy */
function getCurrentDateFormatted() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Chuyển đổi mã trạng thái sang văn bản tiếng Việt */
function formatStatus(status) {
  return status === 'hoan_thanh' ? 'Đã hoàn thành' : 'Đang làm';
}

/** Hiển thị thông báo Toast */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconSvg =
    type === 'success'
      ? `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
           <polyline points="22 4 12 14.01 9 11.01"></polyline>
         </svg>`
      : `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <circle cx="12" cy="12" r="10"></circle>
           <line x1="12" y1="16" x2="12" y2="12"></line>
           <line x1="12" y1="8" x2="12.01" y2="8"></line>
         </svg>`;

  toast.innerHTML = `${iconSvg}<span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// 4. LOGIC XỬ LÝ DỮ LIỆU & GIAO DIỆN (Core Logic & Rendering)

/** Tính toán & cập nhật thống kê dashboard */
function updateDashboardStats() {
  const total = tasks.length;
  const doing = tasks.filter((t) => t.trang_thai === 'dang_lam').length;
  const done = tasks.filter((t) => t.trang_thai === 'hoan_thanh').length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  statTotal.textContent = total;
  statDoing.textContent = doing;
  statDone.textContent = done;
  statPercent.textContent = `${percent}%`;
  progressBarFill.style.width = `${percent}%`;

  badgeAll.textContent = total;
  badgeDoing.textContent = doing;
  badgeDone.textContent = done;
}

/** Lấy danh sách công việc đã qua bộ lọc & tìm kiếm */
function getFilteredAndSearchedTasks() {
  return tasks.filter((task) => {
    // 1. Lọc theo trạng thái
    const matchesFilter =
      currentFilter === 'all' || task.trang_thai === currentFilter;

    // 2. Tìm kiếm theo tên công việc hoặc người phụ trách
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      task.ten.toLowerCase().includes(query) ||
      task.nguoi_phu_trach.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });
}

/** Hiển thị danh sách công việc ra DOM */
function renderTasks() {
  updateDashboardStats();

  const filteredTasks = getFilteredAndSearchedTasks();

  // Khi danh sách trống
  if (filteredTasks.length === 0) {
    taskList.innerHTML = `
      <li class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        <p>${searchQuery ? 'Không tìm thấy công việc phù hợp với từ khóa' : 'Không có công việc nào trong danh mục này'}</p>
      </li>
    `;
    return;
  }

  // Render danh sách công việc
  taskList.innerHTML = filteredTasks
    .map((task) => {
      const isDone = task.trang_thai === 'hoan_thanh';
      return `
        <li class="task-item ${task.trang_thai}" data-id="${task.id}">
          <div class="task-checkbox-wrapper">
            <input
              type="checkbox"
              class="task-checkbox"
              ${isDone ? 'checked' : ''}
              data-action="toggle-status"
              data-id="${task.id}"
              title="${isDone ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}"
            />
          </div>

          <div class="task-body">
            <h3 class="task-title">${escapeHtml(task.ten)}</h3>
            <div class="task-meta">
              <span class="assignee-badge">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                ${escapeHtml(task.nguoi_phu_trach)}
              </span>

              <span class="status-tag ${task.trang_thai}">
                ${formatStatus(task.trang_thai)}
              </span>

              <span style="margin-left: auto; font-size: 0.75rem;">📅 ${task.ngay_tao}</span>
            </div>
          </div>

          <div class="task-actions">
            <button
              type="button"
              class="action-btn edit-btn"
              data-action="edit"
              data-id="${task.id}"
              title="Chỉnh sửa công việc"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>

            <button
              type="button"
              class="action-btn delete-btn"
              data-action="delete"
              data-id="${task.id}"
              title="Xóa công việc"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </li>
      `;
    })
    .join('');
}

/** Chống lỗi XSS khi hiển thị text người dùng nhập */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Reset form nhập liệu về trạng thái ban đầu */
function resetForm() {
  taskForm.reset();
  taskIdInput.value = '';
  editingTaskId = null;
  formTitleText.textContent = 'Thêm công việc mới';
  submitBtnText.textContent = 'Lưu công việc';
  cancelEditBtn.classList.add('hidden');
}

// 5. CÁC HÀM XỬ LÝ SỰ KIỆN (Event Handlers)

/** Thêm mới hoặc Cập nhật công việc */
function handleFormSubmit(event) {
  event.preventDefault();

  const ten = tenInput.value.trim();
  const nguoiPhuTrach = nguoiPhuTrachInput.value.trim();
  const trangThai = trangThaiInput.value;

  if (!ten || !nguoiPhuTrach) {
    showToast('Vui lòng điền đầy đủ tên công việc và người phụ trách!', 'info');
    return;
  }

  if (editingTaskId !== null) {
    // Cập nhật công việc hiện tại
    tasks = tasks.map((task) =>
      task.id === editingTaskId
        ? {
            ...task,
            ten,
            nguoi_phu_trach: nguoiPhuTrach,
            trang_thai: trangThai,
          }
        : task
    );
    showToast('Đã cập nhật thông tin công việc!', 'success');
  } else {
    // Thêm công việc mới
    const newTask = {
      id: generateId(),
      ten,
      nguoi_phu_trach: nguoiPhuTrach,
      trang_thai: trangThai,
      ngay_tao: getCurrentDateFormatted(),
    };
    tasks.unshift(newTask);
    showToast('Đã thêm công việc mới thành công!', 'success');
  }

  resetForm();
  renderTasks();
}

/** Xử lý các tương tác trên dòng công việc (Check hoàn thành, Sửa, Xóa) */
function handleTaskClick(event) {
  const target = event.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;
  const id = Number(target.dataset.id);
  const task = tasks.find((t) => t.id === id);

  if (!task) return;

  // 1. Đổi trạng thái hoàn thành / chưa hoàn thành
  if (action === 'toggle-status') {
    task.trang_thai = task.trang_thai === 'dang_lam' ? 'hoan_thanh' : 'dang_lam';
    renderTasks();
    showToast(
      task.trang_thai === 'hoan_thanh'
        ? 'Đã hoàn thành công việc!'
        : 'Đã chuyển trạng thái về "Đang làm"',
      'success'
    );
    return;
  }

  // 2. Chuyển sang chế độ Sửa
  if (action === 'edit') {
    editingTaskId = task.id;
    taskIdInput.value = String(task.id);
    tenInput.value = task.ten;
    nguoiPhuTrachInput.value = task.nguoi_phu_trach;
    trangThaiInput.value = task.trang_thai;

    formTitleText.textContent = 'Chỉnh sửa công việc';
    submitBtnText.textContent = 'Cập nhật';
    cancelEditBtn.classList.remove('hidden');

    tenInput.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  // 3. Mở Modal xác nhận Xóa
  if (action === 'delete') {
    pendingDeleteId = id;
    modalMessage.textContent = `Bạn có chắc chắn muốn xóa công việc "${task.ten}" không?`;
    confirmModal.classList.remove('hidden');
  }
}

/** Xác nhận xóa công việc */
function confirmDeleteTask() {
  if (pendingDeleteId !== null) {
    tasks = tasks.filter((t) => t.id !== pendingDeleteId);
    if (editingTaskId === pendingDeleteId) {
      resetForm();
    }
    pendingDeleteId = null;
    confirmModal.classList.add('hidden');
    renderTasks();
    showToast('Đã xóa công việc khỏi hệ thống!', 'info');
  }
}

/** Lọc theo trạng thái tab (Tất cả / Đang làm / Đã hoàn thành) */
function handleFilterClick(event) {
  const btn = event.target.closest('.filter-btn');
  if (!btn) return;

  currentFilter = btn.dataset.filter;

  document.querySelectorAll('.filter-btn').forEach((b) => {
    const isActive = b === btn;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  renderTasks();
}

/** Tìm kiếm công việc theo từ khóa */
function handleSearchInput(event) {
  searchQuery = event.target.value;
  clearSearchBtn.classList.toggle('hidden', !searchQuery);
  renderTasks();
}

/** Gợi ý người phụ trách nhanh */
function handleQuickAssigneeClick(event) {
  const btn = event.target.closest('.chip-btn');
  if (!btn) return;
  nguoiPhuTrachInput.value = btn.dataset.assignee;
}

/** Chuyển đổi Dark / Light mode */
function toggleTheme() {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.body.removeAttribute('data-theme');
    themeLabel.textContent = 'Chế độ tối';
  } else {
    document.body.setAttribute('data-theme', 'dark');
    themeLabel.textContent = 'Chế độ sáng';
  }
}

// 6. KHỞI TẠO SỰ KIỆN KHI TRANG TẢI (Initialization)
function initApp() {
  taskForm.addEventListener('submit', handleFormSubmit);
  taskList.addEventListener('click', handleTaskClick);
  cancelEditBtn.addEventListener('click', resetForm);

  // Tab filter
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', handleFilterClick);
  });

  // Tìm kiếm
  searchInput.addEventListener('input', handleSearchInput);
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    renderTasks();
  });

  // Quick assignee chips
  document.querySelector('.quick-assignees').addEventListener('click', handleQuickAssigneeClick);

  // Modal Xóa
  modalCancelBtn.addEventListener('click', () => confirmModal.classList.add('hidden'));
  modalConfirmBtn.addEventListener('click', confirmDeleteTask);

  // Theme toggle
  themeToggleBtn.addEventListener('click', toggleTheme);

  // Render dữ liệu ban đầu
  renderTasks();
}

// Chạy ứng dụng khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', initApp);
