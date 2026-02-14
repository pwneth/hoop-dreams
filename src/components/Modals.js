import { getState } from '../lib/store.js';
import { LEAGUE_MEMBERS } from '../api.js';

export function renderChangePasswordModal() {
    const { showChangePasswordModal } = getState();
    if (!showChangePasswordModal) return '';
    return `
  <div class="modal-overlay" id="pwModalOverlay">
    <div class="modal">
      <div class="modal__header">
        <h2 class="modal__title">Change Password</h2>
        <button class="modal__close" id="closePwModalBtn">&times;</button>
      </div>
      <form class="modal__form" id="changePwForm">
        <div class="form-group">
          <label class="form-label">Old Password</label>
          <input type="password" class="form-input" name="oldPassword" required />
        </div>
        <div class="form-group">
          <label class="form-label">New Password</label>
          <input type="password" class="form-input" name="newPassword" required />
        </div>

        <div class="error-message" id="pwError" style="margin-top: 1rem; display: none;"></div>

        <div class="form-actions">
          <button type="button" class="btn btn--secondary" id="cancelPwBtn">Cancel</button>
          <button type="submit" class="btn btn--primary">Change Password</button>
        </div>
      </form>
    </div>
    </div>
  `;
}

export function renderNewBetModal() {
    const { showNewBetModal, isSubmitting, submitSuccess, currentUser } = getState();
    if (!showNewBetModal) return '';

    // Filter out 'Pot' from LEAGUE_MEMBERS if it's present, and then filter out the current user
    const allBetters = [...new Set(LEAGUE_MEMBERS)].filter(b => {
        const name = (typeof b === 'object' && b !== null) ? (b.username || b.name || String(b)) : String(b);
        return name.toLowerCase() !== 'pot' && name !== currentUser.username;
    });

    const betterOptions = allBetters.map(m => {
        const name = (typeof m === 'object' && m !== null) ? (m.username || m.name || 'User') : String(m);
        return `<option value="${name}">${name}</option>`;
    }).join('');

    const loadingClass = isSubmitting ? 'is-loading' : '';
    const successClass = submitSuccess ? 'is-success' : '';
    const me = currentUser.username;

    return `
  <div class="modal-overlay ${loadingClass} ${successClass}" id="modalOverlay">
    <div class="modal" id="modalContainer">
      <!-- Loader Overlay -->
      <div class="modal-overlay-loader">
        <div class="basketball-loader">🏀</div>
        <p style="margin-top: var(--space-lg); font-weight: 700; color: var(--text-primary); letter-spacing: 1px; font-size: 0.9rem;">LOCKING IN YOUR BET...</p>
      </div>

      <!-- Success Overlay -->
      <div class="modal-overlay-success">
        <div class="success-icon">🎲</div>
        <p class="success-text">Bet Placed Successfully!</p>
        <p class="success-subtext">Good luck to both bettors! May the best baller win. 🏀</p>
      </div>

      <!-- Main Form Content -->
      <div class="modal__header">
        <h2 class="modal__title">New Bet</h2>
        <button class="modal__close" id="closeModalBtn">&times;</button>
      </div>
      <p id="newBetError" class="error-message" style="margin: 0 var(--space-lg); display: none;"></p>
      <form class="modal__form" id="newBetForm">
        <div class="form-group" style="margin-bottom: var(--space-lg);">
          <label class="form-label" style="display: block; margin-bottom: var(--space-sm);">Who are you betting against?</label>
          <div class="betters-row" style="display: flex; align-items: center; gap: var(--space-md);">
            <div style="flex: 1; padding: var(--space-sm); background: var(--bg-secondary); border-radius: var(--radius-md); text-align: center; font-weight: 700; border: 1px solid var(--border-medium);">
              ${me} (You)
              <input type="hidden" name="better1" value="${me}" />
            </div>
            <span style="font-weight: 700; color: var(--text-muted); flex-shrink: 0;">VS</span>
            <select class="form-select" name="better2" id="better2Select" style="flex: 1;" required>
              <option value="">Select opponent...</option>
              ${betterOptions}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Your Bet</label>
            <textarea class="form-textarea" name="better1Bet" placeholder="e.g. Knicks win" required></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Opponent's Bet</label>
            <textarea class="form-textarea" name="better2Bet" placeholder="e.g. Knicks lose" required></textarea>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Your Stake (€)</label>
            <input type="number" class="form-input" name="better1Reward" min="1" step="0.01" placeholder="20.00" required />
          </div>
          <div class="form-group">
            <label class="form-label">Opponent's Stake (€)</label>
            <input type="number" class="form-input" name="better2Reward" min="1" step="0.01" placeholder="20.00" required />
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn--secondary" id="cancelBetBtn">Cancel</button>
          <button type="submit" class="btn btn--primary" ${isSubmitting ? 'disabled' : ''}>
            ${isSubmitting ? 'Submitting...' : 'Place Bet'}
          </button>
        </div>
      </form>
    </div>
    </div>
  `;
}
