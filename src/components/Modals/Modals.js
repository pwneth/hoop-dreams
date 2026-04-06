import { getState } from '../../lib/store/store.js';
import { LEAGUE_MEMBERS } from '../../api/api.js';

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
    <div class="modal modal--large" id="modalContainer">
        <!-- Loader Overlay -->
        <div class="modal-overlay-loader">
          <div class="basketball-loader">🏀</div>
          <p class="loader-text">LOCKING IN YOUR BET...</p>
        </div>

        <!-- Success Overlay -->
        <div class="modal-overlay-success">
          <div class="success-icon">🎯</div>
          <p class="success-text">BET LOCKED IN!</p>
          <p class="success-subtext">Good luck to both bettors. Use the bets tab to track status.</p>
          <button class="btn btn--primary" id="successCloseBtn" style="margin-top: var(--space-xl)">Done</button>
        </div>

        <!-- Header -->
        <div class="modal__header">
          <h2 class="modal__title">NEW BET</h2>
          <button class="modal__close" id="closeModalBtn">&times;</button>
        </div>

        <p id="newBetError" class="error-message" style="margin: 0 var(--space-xl) var(--space-md); display: none;"></p>

        <form class="modal__form" id="newBetForm">
          <div class="bet-slip-section">
            <div class="matchup-box">
              <div class="matchup-side">
                <div class="matchup-label">BETTOR 1</div>
                <div class="matchup-name">${me}</div>
                <input type="hidden" name="better1" value="${me}" />
              </div>
              <div class="matchup-vs">VS</div>
              <div class="matchup-side">
                <div class="matchup-label">BETTOR 2</div>
                <select class="form-select form-select--large" name="better2" id="better2Select" required>
                  <option value="">Select opponent...</option>
                  ${betterOptions}
                </select>
              </div>
            </div>
          </div>

          <div class="bet-slip-grid">
            <div class="bet-slip-section">
              <div class="form-group">
                <label class="form-label">Your Prediction</label>
                <textarea class="form-textarea" name="better1Bet" placeholder="e.g. Warriors win by 10+" required></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Your Stake (€)</label>
                <input type="number" class="form-input" name="better1Reward" min="0.5" step="0.5" placeholder="0.00" required />
              </div>
            </div>

            <div class="bet-slip-section">
              <div class="form-group">
                <label class="form-label">Opponent Prediction</label>
                <textarea class="form-textarea" name="better2Bet" placeholder="e.g. Warriors lose or win by <10" required></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Opponent Stake (€)</label>
                <input type="number" class="form-input" name="better2Reward" min="0.5" step="0.5" placeholder="0.00" required />
              </div>
            </div>
          </div>

          <div class="modal__footer">
            <button type="button" class="btn btn--outline" id="cancelBetBtn">Discard</button>
            <button type="submit" class="btn btn--primary btn--xl" ${isSubmitting ? 'disabled' : ''}>
              ${isSubmitting ? 'Locking in...' : 'PLACE WAGER'}
            </button>
          </div>
        </form>
      </div>
  </div >
    `;
}
