import { getState } from '../../lib/store/store.js';
import { LEAGUE_MEMBERS } from '../../api/api.js';
import { getAvatarColor } from '../../lib/utils/utils.js';

// Shared modal shell — all modals use this structure
function modalShell(id, title, bodyHtml, opts = {}) {
  const overlayClass = opts.overlayClass || '';
  const overlayId = opts.overlayId || '';
  return `
    <div class="app-modal-overlay ${overlayClass}" ${overlayId ? `id="${overlayId}"` : ''}>
      <div class="app-modal">
        <div class="app-modal__header">
          <h2 class="app-modal__title">${title}</h2>
          <button class="app-modal__close" id="${id}">&times;</button>
        </div>
        <div class="app-modal__body">
          ${bodyHtml}
        </div>
      </div>
    </div>
  `;
}

export function renderSettingsModal() {
  const { showSettingsModal, userPaypal, userEmail, userAvatar, settingsSaving, currentUser } = getState();
  if (!showSettingsModal) return '';

  const username = currentUser ? currentUser.username : '';

  const body = `
    <div style="padding: var(--space-lg);">
    <div class="settings-modal__section">
      <div class="settings-modal__section-header">
        <span class="settings-modal__section-title">Profile</span>
      </div>
      <div class="settings-modal__row">
        <div class="settings-modal__field">
          <label class="settings-modal__label">Display Name</label>
          <input type="text" class="form-input" id="displayNameInput" value="${username}" placeholder="Your name" />
        </div>
        <div class="settings-modal__field">
          <label class="settings-modal__label">Profile Picture URL</label>
          <input type="url" class="form-input" id="avatarInput" value="${userAvatar || ''}" placeholder="https://example.com/photo.jpg" />
        </div>
      </div>
    </div>
    <div class="settings-modal__section">
      <div class="settings-modal__section-header">
        <span class="settings-modal__section-title">Account</span>
      </div>
      <div class="settings-modal__row">
        <div class="settings-modal__field">
          <label class="settings-modal__label">Email</label>
          <input type="email" class="form-input" id="emailInput" value="${userEmail || ''}" placeholder="your@email.com" />
        </div>
        <div class="settings-modal__field">
          <label class="settings-modal__label">PayPal Username</label>
          <input type="text" class="form-input" id="paypalInput" value="${userPaypal || ''}" placeholder="e.g. @username or email" />
        </div>
      </div>
    </div>
    <div class="settings-modal__section">
      <div class="settings-modal__section-header">
        <span class="settings-modal__section-title">Security</span>
      </div>
      <div class="settings-modal__row">
        <div class="settings-modal__field">
          <label class="settings-modal__label">Old Password</label>
          <input type="password" class="form-input" id="inlineOldPw" placeholder="Current password" />
        </div>
        <div class="settings-modal__field">
          <label class="settings-modal__label">New Password</label>
          <input type="password" class="form-input" id="inlineNewPw" placeholder="New password" />
        </div>
      </div>
      <div class="error-message" id="inlinePwError" style="display: none;"></div>
    </div>
    <div class="settings-modal__actions">
      <button type="button" class="btn btn--secondary" id="cancelSettingsBtn" ${settingsSaving ? 'disabled' : ''}>Cancel</button>
      <button type="button" class="btn btn--primary" id="saveSettingsBtn" ${settingsSaving ? 'disabled' : ''}>${settingsSaving ? 'Saving...' : 'Save Changes'}</button>
    </div>
    </div>
  `;

  return modalShell('closeSettingsBtn', 'Settings', body, { overlayId: 'settingsModalOverlay' });
}

export function renderOnboardingModal() {
  const { showOnboardingModal, currentUser } = getState();
  if (!showOnboardingModal || !currentUser) return '';

  const body = `
    <div style="padding: var(--space-lg);">
    <div class="login-form__group">
      <label class="login-form__label">Your Display Name</label>
      <input type="text" class="login-form__input" id="onboardName" value="${currentUser.username}" placeholder="Your first name" />
      <p style="font-size: 0.7rem; color: var(--text-muted); margin-top: var(--space-xs);">This is how others will see you</p>
    </div>
    <div class="login-form__group">
      <label class="login-form__label">PayPal Username <span style="color: var(--text-muted); font-weight: 400;">(optional)</span></label>
      <input type="text" class="login-form__input" id="onboardPaypal" placeholder="e.g. @username or email" />
      <p style="font-size: 0.7rem; color: var(--text-muted); margin-top: var(--space-xs);">For receiving payments from bets you win</p>
    </div>
    <div class="login-form__group">
      <label class="login-form__label">Profile Picture URL <span style="color: var(--text-muted); font-weight: 400;">(optional)</span></label>
      <input type="url" class="login-form__input" id="onboardAvatar" placeholder="https://example.com/photo.jpg" />
      <p style="font-size: 0.7rem; color: var(--text-muted); margin-top: var(--space-xs);">You can update all of this later in Settings</p>
    </div>
    <button class="login-form__submit" id="onboardSaveBtn" type="button">Let's Go!</button>
    </div>
  `;

  return modalShell('closeOnboardingBtn', 'Welcome to HD Bets!', body, { overlayId: 'onboardingOverlay' });
}

export function renderChangePasswordModal() {
  return '';
}

export function renderNewBetModal() {
  const { showNewBetModal, isSubmitting, submitSuccess, currentUser } = getState();
  if (!showNewBetModal) return '';

  const allBetters = [...new Set(LEAGUE_MEMBERS)].filter(b => {
    const name = (typeof b === 'object' && b !== null) ? (b.username || b.name || String(b)) : String(b);
    return name.toLowerCase() !== 'pot' && name !== currentUser.username;
  });

  const state = getState();
  const allAvatars = state.allAvatars || {};

  const betterCards = allBetters.map(m => {
    const name = (typeof m === 'object' && m !== null) ? (m.username || m.name || 'User') : String(m);
    const color = getAvatarColor(name);
    const avatar = allAvatars[name] || '';
    return `<div class="user-select__option js-user-select-option" data-value="${name}" data-target="better2Select">
      <span class="user-tag" style="--tag-color:${color.bg}"><span class="user-tag__icon" ${avatar ? `style="background-image:url('${avatar}')"` : ''}>${name.charAt(0)}</span>${name}</span>
    </div>`;
  }).join('');

  const loadingClass = isSubmitting ? 'is-loading' : '';
  const successClass = submitSuccess ? 'is-success' : '';
  const me = currentUser.username;

  return `
  <div class="app-modal-overlay ${loadingClass} ${successClass}" id="modalOverlay">
    <div class="app-modal" id="modalContainer">
      <!-- Loader Overlay -->
      <div class="modal-overlay-loader">
        <div class="basketball-loader">&#127936;</div>
        <p style="margin-top: var(--space-lg); font-weight: 700; color: white; letter-spacing: 1px; font-size: 0.9rem;">LOCKING IN YOUR BET...</p>
      </div>

      <!-- Success Overlay -->
      <div class="modal-overlay-success">
        <div class="success-icon">&#127881;</div>
        <p class="success-text">Bet Placed!</p>
        <p class="success-subtext">May the best baller win &#127936;</p>
      </div>

      <div class="app-modal__header">
        <h2 class="app-modal__title">New Bet</h2>
        <button class="app-modal__close" id="closeModalBtn">&times;</button>
      </div>

      <p id="newBetError" class="error-message" style="margin: 0 var(--space-lg); display: none;"></p>

      <div class="app-modal__body">
        <form class="new-bet-modal__form" id="newBetForm">
          <!-- Step 1: Opponent -->
          <div class="new-bet-modal__step">
            <div class="new-bet-modal__step-label">
              <span class="new-bet-modal__step-num">1</span>
              <span>Who are you betting against?</span>
            </div>
            <div class="new-bet-modal__matchup">
              <div class="new-bet-modal__player">
                <span class="new-bet-modal__player-label">You</span>
                <span class="user-tag" style="--tag-color:${getAvatarColor(me).bg}"><span class="user-tag__icon" ${allAvatars[me] ? `style="background-image:url('${allAvatars[me]}')"` : ''}>${me.charAt(0)}</span>${me}</span>
                <input type="hidden" name="better1" value="${me}" />
              </div>
              <span class="new-bet-modal__vs">VS</span>
              <div class="new-bet-modal__player">
                <span class="new-bet-modal__player-label">Opponent</span>
                <div class="user-select" id="better2UserSelect">
                  <input type="hidden" name="better2" id="better2Select" value="" />
                  <div class="user-select__trigger" id="better2Trigger">
                    <span class="user-select__placeholder">Choose...</span>
                  </div>
                  <div class="user-select__dropdown">
                    ${betterCards}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 2: What's the bet? -->
          <div class="new-bet-modal__step">
            <div class="new-bet-modal__step-label">
              <span class="new-bet-modal__step-num">2</span>
              <span>What's the bet?</span>
            </div>
            <div class="new-bet-modal__bets">
              <div class="new-bet-modal__bet-side">
                <label class="new-bet-modal__bet-label">Your prediction</label>
                <textarea class="new-bet-modal__textarea" name="better1Bet" placeholder="e.g. Knicks win the series" required></textarea>
              </div>
              <div class="new-bet-modal__bet-side">
                <label class="new-bet-modal__bet-label">Their prediction</label>
                <textarea class="new-bet-modal__textarea" name="better2Bet" placeholder="e.g. Celtics win the series" required></textarea>
              </div>
            </div>
          </div>

          <!-- Step 3: Stakes -->
          <div class="new-bet-modal__step">
            <div class="new-bet-modal__step-label">
              <span class="new-bet-modal__step-num">3</span>
              <span>Set the stakes</span>
            </div>
            <div class="new-bet-modal__stakes">
              <div class="new-bet-modal__stake">
                <label class="new-bet-modal__bet-label">You risk</label>
                <div class="new-bet-modal__stake-input">
                  <span class="new-bet-modal__currency">&#8364;</span>
                  <input type="number" class="new-bet-modal__amount" name="better1Reward" min="1" step="0.01" placeholder="20.00" required />
                </div>
              </div>
              <div class="new-bet-modal__stake">
                <label class="new-bet-modal__bet-label">They risk</label>
                <div class="new-bet-modal__stake-input">
                  <span class="new-bet-modal__currency">&#8364;</span>
                  <input type="number" class="new-bet-modal__amount" name="better2Reward" min="1" step="0.01" placeholder="20.00" required />
                </div>
              </div>
            </div>
          </div>

          <!-- Submit -->
          <div class="new-bet-modal__actions">
            <button type="button" class="btn btn--secondary" id="cancelBetBtn">Cancel</button>
            <button type="submit" class="btn btn--primary new-bet-modal__submit" ${isSubmitting ? 'disabled' : ''}>
              ${isSubmitting ? 'Placing Bet...' : '&#127936; Place Bet'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  `;
}
