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
