import { getState, setAuthMode as setStoreAuthMode } from '../../lib/store/store.js';

export function renderLoginScreen() {
  const { authMode } = getState();
  const BASE_URL = import.meta.env.BASE_URL || '/';

  return `
    <div class="login-container">
      <div class="login-card">
        <div class="login-card__header">
          <div class="login-logo-container">
            <img src="${BASE_URL}header_logo.png" class="login-card__logo-img" alt="HD Bets" />
          </div>
          <h1 class="login-card__title">HD // BETS</h1>
          <p class="login-card__subtitle">PREMIUM P2P WAGERING</p>
        </div>
        
        <div class="auth-toggle">
          <button class="auth-toggle__btn ${authMode === 'login' ? 'active' : ''}" onclick="window.setAuthMode('login')">SIGN IN</button>
          <button class="auth-toggle__btn ${authMode === 'register' ? 'active' : ''}" onclick="window.setAuthMode('register')">CREATE ACCOUNT</button>
        </div>

        <form class="login-form" id="loginForm">
          <div class="form-group">
            <label class="form-label">First Name</label>
            <input type="text" class="form-input" name="username" placeholder="e.g. Michael" style="text-transform: capitalize;" required autofocus />
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" name="password" placeholder="••••••••" required />
          </div>
          
          <div class="login-error" id="loginError" style="display: none;"></div>
          
          <button type="submit" class="btn btn--primary btn--full btn--xl" style="margin-top: var(--space-md);">
            ${authMode === 'login' ? 'ACCESS ACCOUNT' : 'CREATE SLIP'}
          </button>
          
          <p style="margin-top: var(--space-lg); font-size: 0.7rem; color: var(--text-muted); text-align: center; font-family: var(--font-mono);">
            BY PROCEEDING YOU AGREE TO THE LEAGUE TERMS
          </p>
        </form>
      </div>
    </div>
  `;
}

// Make available globally for the inline onclick handlers
window.setAuthMode = (mode) => {
  setStoreAuthMode(mode);
  const app = document.getElementById('app');
  if (app) app.innerHTML = renderLoginScreen();

  // Dispatch custom event so main.js can re-attach form listeners
  window.dispatchEvent(new CustomEvent('auth-mode-changed'));
};
