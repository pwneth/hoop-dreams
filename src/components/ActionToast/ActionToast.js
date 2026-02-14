import { getPendingActionCount } from '../../lib/store/store.js';

export function renderActionToast() {
  const pendingCount = getPendingActionCount();
  if (pendingCount === 0) return '';

  return `
    <div class="action-toast" id="actionToast">
      <div class="action-toast__content">
        <span class="action-toast__icon">⚠️</span>
        <span class="action-toast__text">You have <strong>${pendingCount}</strong> action${pendingCount > 1 ? 's' : ''} required</span>
      </div>
      <button class="btn btn--xs btn--primary" id="toastViewBtn">View Tasks</button>
    </div>
  `;
}
