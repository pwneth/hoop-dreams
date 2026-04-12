import { getState } from '../../lib/store/store.js';

export function renderLoginScreen() {
  const { authMode } = getState();
  const isLogin = authMode === 'login';

  return `
    <div class="login-page">
      <div class="login-card">
        <div class="login-card__hero">
          <span class="login-card__hero-icon">&#127942;</span>
          <h2 class="login-card__title">${isLogin ? 'Welcome back' : 'Join the league'}</h2>
          <p class="login-card__subtitle">${isLogin ? 'Sign in to manage your bets' : 'Create your account to start betting'}</p>
        </div>

        <div class="auth-toggle ${!isLogin ? 'auth-toggle--register' : ''}">
          <button class="auth-toggle__btn ${isLogin ? 'active' : ''}" id="authLoginBtn" type="button">Sign In</button>
          <button class="auth-toggle__btn ${!isLogin ? 'active' : ''}" id="authRegisterBtn" type="button">Register</button>
        </div>

        <form class="login-form" id="loginForm">
          <div class="login-form__group">
            <label class="login-form__label">${isLogin ? 'Name or Email' : 'Email'}</label>
            <input type="${isLogin ? 'text' : 'email'}" class="login-form__input" name="username" placeholder="${isLogin ? 'Enter your name or email' : 'Enter your email address'}" required autofocus />
          </div>
          <div class="login-form__group">
            <label class="login-form__label">Password</label>
            <input type="password" class="login-form__input" name="password" placeholder="${isLogin ? 'Enter your password' : 'Choose a password'}" required />
          </div>

          <div class="login-error" id="loginError" style="display: none;"></div>

          <button type="submit" class="login-form__submit">
            ${isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div class="login-card__features">
          <div class="login-card__feature"><span>&#127942;</span> Bet against friends</div>
          <div class="login-card__feature"><span>&#127936;</span> Pick your bracket</div>
          <div class="login-card__feature"><span>&#128176;</span> Track winnings</div>
        </div>
      </div>
    </div>
  `;
}

// Toggle auth mode via DOM manipulation — no full re-render
window.setAuthMode = (mode) => {
  // Set state silently (direct mutation, no notify) so render() uses the right mode on next full render
  const state = getState();
  state.authMode = mode;
  const isLogin = mode === 'login';

  // Update toggle — slide pill
  const toggle = document.querySelector('.auth-toggle');
  const loginBtn = document.getElementById('authLoginBtn');
  const registerBtn = document.getElementById('authRegisterBtn');
  if (toggle) toggle.classList.toggle('auth-toggle--register', !isLogin);
  if (loginBtn) loginBtn.classList.toggle('active', isLogin);
  if (registerBtn) registerBtn.classList.toggle('active', !isLogin);

  // Update hero text
  const title = document.querySelector('.login-card__title');
  const subtitle = document.querySelector('.login-card__subtitle');
  if (title) title.textContent = isLogin ? 'Welcome back' : 'Join the league';
  if (subtitle) subtitle.textContent = isLogin ? 'Sign in to manage your bets' : 'Create your account to start betting';

  // Update form
  const usernameLabel = document.querySelector('.login-form__label');
  const usernameInput = document.querySelector('[name="username"]');
  if (usernameLabel) usernameLabel.textContent = isLogin ? 'Name or Email' : 'Email';
  if (usernameInput) {
    usernameInput.placeholder = isLogin ? 'Enter your name or email' : 'Enter your email address';
    usernameInput.type = isLogin ? 'text' : 'email';
  }

  const passwordInput = document.querySelector('[name="password"]');
  if (passwordInput) passwordInput.placeholder = isLogin ? 'Enter your password' : 'Choose a password';

  const submitBtn = document.querySelector('.login-form__submit');
  if (submitBtn) submitBtn.textContent = isLogin ? 'Sign In' : 'Create Account';

  const errorEl = document.getElementById('loginError');
  if (errorEl) errorEl.style.display = 'none';
};
