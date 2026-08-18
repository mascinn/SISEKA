/* ============================================================
   SISEKA WASI'I — Reusable Components JS
   Modals, bottom sheets, filter chips, interactions
   ============================================================ */

// ---- Bottom Sheet / Modal ----
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    const sheet = modal.querySelector('.bottom-sheet');
    if (sheet) {
      sheet.style.animation = 'slideDown 0.25s ease forwards';
      setTimeout(() => {
        modal.classList.remove('open');
        sheet.style.animation = '';
        document.body.style.overflow = '';
      }, 250);
    } else {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }
}

// Close modal on overlay click
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    const modalId = e.target.id;
    if (modalId) closeModal(modalId);
  }
});

// ---- Filter Chips ----
function initFilterChips(containerId, callback) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const chips = container.querySelectorAll('.chip');
  chips.forEach(chip => {
    chip.addEventListener('click', function() {
      chips.forEach(c => {
        c.classList.remove('chip--active');
        c.classList.add('chip--default');
      });
      this.classList.remove('chip--default');
      this.classList.add('chip--active');

      const filter = this.getAttribute('data-filter');
      if (callback) callback(filter);
    });
  });
}

// ---- Mode Switcher (Deposit Modal) ----
function initModeSwitcher(containerId, callback) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const buttons = container.querySelectorAll('.mode-switcher__btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', function() {
      buttons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      const mode = this.getAttribute('data-mode');
      if (callback) callback(mode);
    });
  });
}

// ---- Quick Amount Chips ----
function initQuickAmounts(containerId, inputId) {
  const container = document.getElementById(containerId);
  const input = document.getElementById(inputId);
  if (!container || !input) return;

  const chips = container.querySelectorAll('.quick-amount');
  chips.forEach(chip => {
    chip.addEventListener('click', function() {
      chips.forEach(c => c.classList.remove('active'));
      this.classList.add('active');

      const amount = parseInt(this.getAttribute('data-amount'));
      if (input && amount) {
        input.value = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      }
    });
  });
}

// ---- Payment Method Toggle ----
function initPaymentMethods(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const methods = container.querySelectorAll('.payment-method');
  methods.forEach(method => {
    method.addEventListener('click', function() {
      methods.forEach(m => m.classList.remove('active'));
      this.classList.add('active');
    });
  });
}

// ---- Password Toggle ----
function togglePassword(inputId, toggleBtn) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const icon = toggleBtn.querySelector('.material-symbols-outlined');
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.textContent = 'visibility';
  } else {
    input.type = 'password';
    if (icon) icon.textContent = 'visibility_off';
  }
}

// ---- Toast / Notification ----
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.cssText = `
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 200;
    padding: 12px 24px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    font-family: 'Plus Jakarta Sans', sans-serif;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    animation: fadeIn 0.3s ease;
    max-width: 90%;
    text-align: center;
  `;

  if (type === 'success') {
    toast.style.background = '#047857';
    toast.style.color = '#fff';
  } else if (type === 'error') {
    toast.style.background = '#dc2626';
    toast.style.color = '#fff';
  } else {
    toast.style.background = '#fff';
    toast.style.color = '#0f172a';
    toast.style.border = '1px solid #e2e8f0';
  }

  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ---- Rupiah Input Formatting ----
function initRupiahInput(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  input.addEventListener('input', function() {
    let value = this.value.replace(/\D/g, '');
    if (value) {
      this.value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
  });
}

// ---- List Filter (Penarikan page) ----
function filterKiosList(filter) {
  const items = document.querySelectorAll('[data-status]');
  items.forEach(item => {
    const status = item.getAttribute('data-status');
    if (filter === 'semua') {
      item.style.display = '';
    } else if (filter === 'belum') {
      item.style.display = status === 'belum' ? '' : 'none';
    } else if (filter === 'setor') {
      item.style.display = status === 'setor' ? '' : 'none';
    } else if (filter === 'libur') {
      item.style.display = status === 'libur' ? '' : 'none';
    }
  });
}

// ---- "Lihat N lainnya" toggle ----
function toggleShowMore(btnId, containerId) {
  const btn = document.getElementById(btnId);
  const container = document.getElementById(containerId);
  if (!btn || !container) return;

  const hiddenItems = container.querySelectorAll('.hidden-item');
  let shown = false;

  btn.addEventListener('click', function() {
    shown = !shown;
    hiddenItems.forEach(item => {
      item.style.display = shown ? '' : 'none';
    });
    btn.textContent = shown ? 'Sembunyikan' : `Lihat ${hiddenItems.length} lainnya`;
  });
}

// ---- Universal Header Profile Dropdown (Admin & Tenant) ----
function initHeaderProfileMenu() {
  const avatar = document.querySelector('.top-app-bar .avatar') || document.getElementById('userAvatar') || document.getElementById('headerAvatar');
  if (!avatar) return;

  avatar.style.cursor = 'pointer';
  avatar.title = 'Buka Menu Akun';

  let dropdown = document.getElementById('headerProfileDropdown');
  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.id = 'headerProfileDropdown';
    dropdown.style.cssText = `
      position: fixed;
      background: #ffffff;
      border: 1px solid rgba(192, 201, 192, 0.45);
      border-radius: 20px;
      box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.15), 0 6px 12px -4px rgba(0, 0, 0, 0.08);
      width: 240px;
      z-index: 99999;
      padding: 12px;
      display: none;
      animation: fadeIn 0.15s ease;
    `;
    document.body.appendChild(dropdown);
  }

  // Get current user info from localStorage or session
  const user = typeof getAuthUser === 'function' ? getAuthUser() : (localStorage.getItem('siseka_user') ? JSON.parse(localStorage.getItem('siseka_user')) : null);
  const role = user ? user.role : (window.location.pathname.includes('/admin/') ? 'admin' : 'tenant');
  const initials = user ? (user.initials || (user.name ? user.name.substring(0, 2).toUpperCase() : (role === 'admin' ? 'AD' : 'TN'))) : (role === 'admin' ? 'AD' : 'TN');
  const name = user ? (user.name || user.username || (role === 'admin' ? 'Admin BPH' : 'Penyewa Kantin')) : (role === 'admin' ? 'Admin BPH' : 'Penyewa Kantin');
  const kioskName = user && user.kios ? user.kios : (role === 'admin' ? 'Administrator' : 'Unit Usaha');

  const isInsideSubfolder = window.location.pathname.includes('/admin/') || window.location.pathname.includes('/tenant/');
  const profileLink = role === 'admin' ? (isInsideSubfolder ? 'profil.html' : 'admin/profil.html') : (isInsideSubfolder ? 'profil.html' : 'tenant/profil.html');

  dropdown.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;padding:8px 8px 12px;border-bottom:1px solid #f1f5f9;margin-bottom:8px;">
      <div style="width:38px;height:38px;border-radius:50%;background:#003820;color:#ffffff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;flex-shrink:0;">
        ${initials}
      </div>
      <div style="min-width:0;">
        <p style="font-size:13px;font-weight:700;color:#0f172a;margin:0 0 2px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name}</p>
        <p style="font-size:11px;color:#64748b;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${kioskName}</p>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:4px;">
      <a href="${profileLink}" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;color:#0f172a;text-decoration:none;font-size:13px;font-weight:600;transition:background 0.15s ease;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
        <span class="material-symbols-outlined" style="font-size:18px;color:#003820;">account_circle</span>
        <span>Menu Profil</span>
      </a>
      <button type="button" onclick="logout()" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;color:#dc2626;background:transparent;border:none;width:100%;text-align:left;font-size:13px;font-weight:600;cursor:pointer;transition:background 0.15s ease;" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='transparent'">
        <span class="material-symbols-outlined" style="font-size:18px;color:#dc2626;">logout</span>
        <span>Keluar Akun</span>
      </button>
    </div>
  `;

  // Toggle dropdown on avatar click
  avatar.addEventListener('click', function(e) {
    e.stopPropagation();
    const isVisible = dropdown.style.display === 'block';
    if (isVisible) {
      dropdown.style.display = 'none';
    } else {
      dropdown.style.display = 'block';
      const rect = avatar.getBoundingClientRect();
      dropdown.style.top = `${rect.bottom + 8}px`;
      dropdown.style.right = `${Math.max(12, window.innerWidth - rect.right)}px`;
    }
  });

  // Close dropdown on click outside
  document.addEventListener('click', function(e) {
    if (dropdown && dropdown.style.display === 'block' && !dropdown.contains(e.target) && e.target !== avatar) {
      dropdown.style.display = 'none';
    }
  });

  window.addEventListener('resize', () => { if (dropdown) dropdown.style.display = 'none'; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && dropdown) dropdown.style.display = 'none'; });
}

// Auto init on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeaderProfileMenu);
} else {
  setTimeout(initHeaderProfileMenu, 50);
}

