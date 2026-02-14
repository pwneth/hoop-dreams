export function renderLoading() {
    return `
    <div style="max-width: 1400px; margin: 0 auto;">
      <div class="skeleton-section-title skeleton"></div>
      <div class="skeleton-leaderboard">
        ${Array(5).fill(0).map(() => `
          <div class="skeleton-lb-row">
            <div class="skeleton-lb-rank skeleton"></div>
            <div class="skeleton-lb-name skeleton"></div>
            <div class="skeleton-lb-stats skeleton"></div>
            <div class="skeleton-lb-potential skeleton"></div>
            <div class="skeleton-lb-profit skeleton"></div>
          </div>
        `).join('')}
      </div>
      <div class="skeleton-section-title skeleton" style="margin-top: var(--space-2xl);"></div>
      <div class="bets-grid">
        ${Array(3).fill(0).map(() => `
          <div class="skeleton-bet-card">
            <div class="skeleton-card-header">
              <div class="skeleton-date skeleton"></div>
              <div class="skeleton-status skeleton"></div>
            </div>
            <div class="skeleton-matchup">
              <div class="skeleton-side-box skeleton"></div>
              <div class="skeleton-vs"></div>
              <div class="skeleton-side-box skeleton"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
