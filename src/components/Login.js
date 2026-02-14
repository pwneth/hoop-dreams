import { getState, setAuthMode as setStoreAuthMode } from '../lib/store.js';

export function renderLoginScreen() {
    const { authMode } = getState();
    const BASE_URL = import.meta.env.BASE_URL || '/';

    return `
    <div class="login-container">
      <div class="login-card">
        <div class="login-card__header">
          <img src="${BASE_URL}header_logo.png" class="login-card__logo-img" alt="HD Bets" />
          <h1 class="login-card__title">HD Bets!</h1>
          <p class="login-card__subtitle">Fantasy Basketball Betting</p>
        </div>
        
        <div class="auth-toggle">
          <div class="auth-toggle__btn ${authMode === 'login' ? 'active' : ''}" onclick="window.setAuthMode('login')">Login</div>
          <div class="auth-toggle__btn ${authMode === 'register' ? 'active' : ''}" onclick="window.setAuthMode('register')">Register</div>
        </div>

        <form class="login-form" id="loginForm">
          <div class="form-group">
            <label class="form-label">First Name</label>
            <input type="text" class="form-input" name="username" placeholder="Enter your first name" style="text-transform: capitalize;" required autofocus />
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" name="password" placeholder="Enter password" required />
          </div>
          
          <div class="login-error" id="loginError" style="display: none;"></div>
          
          <button type="submit" class="btn btn--primary btn--full">
            ${authMode === 'login' ? 'Login' : 'Create Account'}
          </button>
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
