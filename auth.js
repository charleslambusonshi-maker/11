/* DIDAS PWA Admin Auth System v2.1 */

/* ================= GLOBAL STATE ================= */
const ADMIN_EMAIL = 'admin@didas.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_HASH = btoa(ADMIN_PASSWORD + 'didas_salt');

let users = [];
let currentSession = null;

// Initialize admin account
function initAdmin() {
  if (!localStorage.getItem('didas_admin_initialized')) {
    const adminUser = {
      id: 'admin_001',
      name: 'System Administrator',
      email: ADMIN_EMAIL,
      idNumber: 'ADMIN001',
      role: 'admin',
      passwordHash: ADMIN_HASH,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };
    users = [adminUser];
    localStorage.setItem('didas_users', JSON.stringify(users));
    localStorage.setItem('didas_admin_initialized', 'true');
    console.log('✅ DIDAS Admin account initialized');
  } else {
    users = JSON.parse(localStorage.getItem('didas_users') || '[]');
  }
}

// Load current session
function loadCurrentSession() {
  const stored = localStorage.getItem('didas_current_user');
  currentSession = stored ? JSON.parse(stored) : null;
}

initAdmin();
loadCurrentSession();

/* ================= CORE AUTH FUNCTIONS ================= */

// ✅ CREATE ACCOUNT
window.createAccount = async function(name, email, idNumber, password) {
  return window.registerUser(name, email, idNumber, password);
};

// ✅ REGISTER USER
window.registerUser = async function(name, email, idNumber, password) {
  return new Promise((resolve) => {
    const trimmedName = (name || '').trim();
    const trimmedEmail = (email || '').toLowerCase().trim();
    const trimmedId = (idNumber || '').trim();
    const pass = password || '';

    if (!trimmedName || !trimmedEmail || !trimmedId || !pass) {
      return resolve({ success: false, error: 'Please fill all fields.' });
    }

    if (pass.length < 6) {
      return resolve({ success: false, error: 'Password must be at least 6 characters.' });
    }

    initAdmin();
    users = JSON.parse(localStorage.getItem('didas_users') || '[]');

    if (users.some(u => u.email === trimmedEmail)) {
      return resolve({ success: false, error: 'Email already registered.' });
    }

    if (users.some(u => u.idNumber === trimmedId)) {
      return resolve({ success: false, error: 'ID number already used.' });
    }

    const newUser = {
      id: `user_${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      idNumber: trimmedId,
      role: 'user',
      passwordHash: btoa(pass + 'didas_salt'),
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    users.push(newUser);
    localStorage.setItem('didas_users', JSON.stringify(users));

    resolve({ success: true, user: newUser, message: '✅ Registered successfully' });
  });
};

// 🔑 LOGIN
window.loginAccount = async function(email, password) {
  return new Promise((resolve) => {
    const trimmedEmail = (email || '').toLowerCase().trim();
    const pass = password || '';

    if (!trimmedEmail || !pass) {
      return resolve({ success: false, error: 'Email and password are required.' });
    }

    initAdmin();
    users = JSON.parse(localStorage.getItem('didas_users') || '[]');

    const user = users.find(u => u.email === trimmedEmail && u.passwordHash === btoa(pass + 'didas_salt'));
    if (!user) {
      return resolve({ success: false, error: 'Invalid email or password.' });
    }

    user.lastLogin = new Date().toISOString();
    currentSession = user;
    localStorage.setItem('didas_current_user', JSON.stringify(user));
    localStorage.setItem('didas_users', JSON.stringify(users));

    resolve({ success: true, user, message: '✅ Login successful.' });
  });
};

// Convenience
window.loginUser = window.loginAccount;

// 🚪 LOGOUT - Clear all app data
window.logoutAccount = async function() {
  return new Promise(resolve => {
    localStorage.removeItem('didas_current_user');
    localStorage.removeItem('didas_users');
    localStorage.removeItem('didas_admin_initialized');
    localStorage.removeItem('didas_students');
    localStorage.removeItem('didas_attendance');
    currentSession = null;
    users = [];
    resolve({ success: true, message: '✅ Logged out & app data cleared' });
  });
};

// 👤 GET CURRENT USER
window.getCurrentUser = function() {
  if (!currentSession) loadCurrentSession();
  return currentSession;
};

// ✅ CHECK LOGIN STATUS
window.isLoggedIn = function() {
  const user = window.getCurrentUser();
  return user && user.lastLogin;
};

/* ================= UI HELPERS ================= */
window.showMessage = function(type, message, duration = 4000) {
  const msg = document.createElement('div');
  msg.className = `message message-${type}`;
  msg.textContent = message;
  msg.style.cssText = `
    position: fixed; top: 20px; right: 20px; 
    padding: 16px 24px; border-radius: 12px; 
    color: white; font-weight: 600; z-index: 9999;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
  `;
  
  // Colors
  if (type === 'success') msg.style.background = 'linear-gradient(135deg,#4CAF50,#45a049)';
  if (type === 'error') msg.style.background = 'linear-gradient(135deg,#f44336,#d32f2f)';

  document.body.appendChild(msg);

  setTimeout(() => {
    msg.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => msg.remove(), 300);
  }, duration);
};

window.showError = function(id, msg) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 4000);
  }
  window.showMessage('error', msg);
};

window.showSuccess = function(id, msg) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 4000);
  }
  window.showMessage('success', msg);
};

/* ================= AUTO LOGIN CHECK ================= */
document.addEventListener('DOMContentLoaded', () => {
  initAdmin();
  if (window.isLoggedIn()) window.dashboardRedirect();
});

// 🌐 DASHBOARD REDIRECT
window.dashboardRedirect = function() {
  const user = window.getCurrentUser();
  if (!user) {
    window.location.href = 'new-login.html';
    return;
  }
  window.location.href = 'dashboard.html';
};

/* ================= EXPORTS ================= */
window.DIDASAuth = {
  createAccount,
  registerUser,
  loginAccount,
  loginUser,
  logoutAccount,
  getCurrentUser,
  isLoggedIn,
  dashboardRedirect
};

console.log('✅ DIDAS Auth Loaded - User + Admin System Active');