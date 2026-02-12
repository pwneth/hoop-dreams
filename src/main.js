import './style.css';
import {
  fetchBets,
  calculateMemberStats,
  calculateOverallStats,
  createBet,
  updateBet,
  markBetAsPaid,
  LEAGUE_MEMBERS,
  login,
  register,
  getCurrentUser,
  logout,
  changePassword
} from './api.js';

// Auth State
let currentUser = getCurrentUser();
let authMode = 'login'; // 'login' or 'register'

// App State
let currentView = 'dashboard';
let bets = [];
let memberStats = [];
let overallStats = {};
let statusFilter = 'all';
let bettorFilter = 'all';

// UI State
let showNewBetModal = false;
let isSubmitting = false;
let submitSuccess = false;
let showResolveModal = false;
let resolveBetId = null;
let resolveIsSubmitting = false;
let confirmingResolution = null;
let confirmingPaymentId = null;
let showChangePasswordModal = false;

// Theme State
const THEME_STORAGE_KEY = 'hd_bets_theme';
let isDarkMode = localStorage.getItem(THEME_STORAGE_KEY) === 'dark';

// Apply theme on load
function applyTheme() {
  document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
}
applyTheme();

function toggleTheme() {
  isDarkMode = !isDarkMode;
  localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
  applyTheme();
  render();
}

// DOM Elements
const app = document.getElementById('app');

// Helpers
function formatCurrency(amount) {
  return `€${amount.toFixed(2)}`;
}

function formatDate(date) {
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ==========================================
// RENDER COMPONENTS
// ==========================================

function renderHeader() {
  const user = currentUser || { username: 'Guest' };

  return `
    <header class="header">
      <div class="header__inner">
        <div class="header__brand">
          <img src="header_logo.png" class="header__logo-img" alt="HD Bets" />
          <span class="header__title">HD Bets!</span>
        </div>
        <button class="hamburger" id="hamburgerBtn" aria-label="Toggle menu">☰</button>
        
        <!-- Desktop Nav -->
        <nav class="header__nav desktop-only">
          <button class="nav-btn ${currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard">
            Dashboard
          </button>
          <button class="nav-btn ${currentView === 'bets' ? 'active' : ''}" data-view="bets">
            All Bets
          </button>
          <button class="nav-btn ${currentView === 'members' ? 'active' : ''}" data-view="members">
            Members
          </button>
          <button class="nav-btn nav-btn--primary js-new-bet-btn">
            + New Bet
          </button>
          
          <div class="header__user">
             <div class="user-dropdown" id="userDropdownTrigger">
               <div class="user-badge" title="Logged in as ${user.username}">
                 <div class="user-badge__icon">${getInitials(user.username)}</div>
                 <span>${user.username}</span>
                 ${user.isAdmin ? '<span class="admin-tag">ADMIN</span>' : ''}
                 <span style="font-size: 0.7em; margin-left: 4px; opacity: 0.5;">▼</span>
               </div>
               
               <div class="user-dropdown-menu" id="userDropdownMenu">
                 <button class="user-dropdown-item js-change-pw-btn">
                   <span>🔑</span> Change Password
                 </button>
                 <button class="user-dropdown-item js-theme-toggle">
                   <span>${isDarkMode ? '☀️' : '🌙'}</span> ${isDarkMode ? 'Light Mode' : 'Dark Mode'}
                 </button>
                 <button class="user-dropdown-item js-logout-btn" style="color: #ff4757;">
                   <span>➜</span> Logout
                 </button>
               </div>
             </div>
          </div>
        </nav>
      </div>
    </header>
  `;
}

function renderMobileNav() {
  const user = currentUser || { username: 'Guest' };
  return `
    <nav class="header__nav mobile-only" id="mainNav">
      <div style="padding: var(--space-md); border-bottom: 1px solid var(--border-subtle); margin-bottom: var(--space-md); display: flex; justify-content: center;">
        <div class="user-badge">
           <div class="user-badge__icon">${getInitials(user.username)}</div>
           <span>${user.username}</span>
           ${user.isAdmin ? '<span class="admin-tag">ADMIN</span>' : ''}
        </div>
      </div>
      
      <button class="nav-btn ${currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard">
        Dashboard
      </button>
      <button class="nav-btn ${currentView === 'bets' ? 'active' : ''}" data-view="bets">
        All Bets
      </button>
      <button class="nav-btn ${currentView === 'members' ? 'active' : ''}" data-view="members">
        Members
      </button>
      <button class="nav-btn nav-btn--primary js-new-bet-btn">
        + New Bet
      </button>
      
      <div style="margin-top: auto; padding-top: var(--space-md); border-top: 1px solid var(--border-subtle);">
        <button class="nav-btn js-change-pw-btn">
          Change Password
        </button>
        <button class="nav-btn js-theme-toggle">
          ${isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        </button>
        <button class="nav-btn js-logout-btn" style="color: var(--text-muted);">
          Logout ➜
        </button>
      </div>
    </nav>
  `;
}

function renderLoginScreen() {
  return `
    <div class="login-container">
      <div class="login-card">
        <div class="login-card__header">
          <img src="header_logo.png" class="login-card__logo-img" alt="HD Bets" />
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

// Window global for inline onclick (simplified)
window.setAuthMode = (mode) => {
  authMode = mode;
  const loginApp = document.getElementById('app');
  if (loginApp) loginApp.innerHTML = renderLoginScreen();
  // Re-attach listener
  const form = document.getElementById('loginForm');
  if (form) form.addEventListener('submit', handleAuthSubmit);
};

function renderStatsCards() {
  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card__label">Total Bets</div>
        <div class="stat-card__value">${overallStats.totalBets || 0}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Active Bets</div>
        <div class="stat-card__value">${overallStats.activeBets || 0}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Completed</div>
        <div class="stat-card__value">${overallStats.completedBets || 0}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Total Volume</div>
        <div class="stat-card__value">${formatCurrency(overallStats.totalVolume || 0)}</div>
      </div>
    </div>
  `;
}

function renderLeaderboard() {
  if (memberStats.length === 0) {
    return '<div class="empty-state"><div class="empty-state__icon">📊</div>No data available</div>';
  }

  const items = memberStats.map((member, index) => {
    const rank = index + 1;
    const rankClass = rank <= 3 ? `leaderboard__rank--${rank}` : 'leaderboard__rank--other';
    const profitClass = member.netProfit > 0 ? 'leaderboard__profit--positive' :
      member.netProfit < 0 ? 'leaderboard__profit--negative' :
        'leaderboard__profit--neutral';
    const profitSign = member.netProfit > 0 ? '+' : '';

    return `
      <div class="leaderboard__item" data-bettor="${member.name}" role="button" tabindex="0">
        <div class="leaderboard__rank ${rankClass}">${rank}</div>
        <div class="leaderboard__name">${member.name}</div>
        <div class="leaderboard__stats">${member.wins}W - ${member.losses}L (${member.winRate}%)</div>
        <div class="leaderboard__potential">${member.potentialGain > 0 ? formatCurrency(member.potentialGain) : '-'}</div>
        <div class="leaderboard__profit ${profitClass}">${profitSign}${formatCurrency(member.netProfit)}</div>
      </div>
    `;
  }).join('');

  return `
    <section class="section">
      <div class="section__header">
        <h2 class="section__title"><span>🏆</span> Leaderboard</h2>
      </div>
      <div class="leaderboard">
        ${items}
      </div>
    </section>
  `;
}

function renderBetCard(bet) {
  const statusClass = `bet-card__status--${bet.status}`;
  const statusLabel = bet.status.charAt(0).toUpperCase() + bet.status.slice(1);
  const isWinner1 = bet.winnerName === bet.better1;
  const isWinner2 = bet.winnerName === bet.better2;
  const side1Class = isWinner1 ? 'bet-card__side--winner' : (isWinner2 ? 'bet-card__side--loser' : '');
  const side2Class = isWinner2 ? 'bet-card__side--winner' : (isWinner1 ? 'bet-card__side--loser' : '');
  const cardClass = isWinner1 ? 'bet-card--winner-1' : (isWinner2 ? 'bet-card--winner-2' : '');

  // Authorization Check
  const isAdmin = currentUser && currentUser.isAdmin;
  const isParticipant = currentUser && (currentUser.username === bet.better1 || currentUser.username === bet.better2);
  const canModify = isAdmin || isParticipant;

  return `
    <div class="bet-card ${cardClass}">
      <div class="bet-card__header">
        <span class="bet-card__date">${bet.date ? bet.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
        <span class="bet-card__status ${statusClass}">${statusLabel}</span>
      </div>
      <div class="bet-card__matchup">
        <div class="bet-card__side ${side1Class}">
          <div class="bet-card__bettor">
            ${bet.better1}
            ${isWinner1 ? '<span class="winner-badge">👑</span>' : ''}
          </div>
          <div class="bet-card__bet">${bet.better1Bet}</div>
          <div class="bet-card__stake">${formatCurrency(bet.better1Reward)}</div>
        </div>
        <div class="bet-card__vs">VS</div>
        <div class="bet-card__side ${side2Class}">
          <div class="bet-card__bettor">
            ${bet.better2}
            ${isWinner2 ? '<span class="winner-badge">👑</span>' : ''}
          </div>
          <div class="bet-card__bet">${bet.better2Bet}</div>
          <div class="bet-card__stake">${formatCurrency(bet.better2Reward)}</div>
        </div>
      </div>
      ${canModify && bet.status !== 'paid' ? `
        <div style="margin-top: var(--space-md); border-top: 1px solid var(--glass-border); padding-top: 20px; padding-bottom: 20px; display: flex; justify-content: flex-end; align-items: center; gap: var(--space-md);">
          ${resolveIsSubmitting && resolveBetId == bet.id ? `
            <div style="display: flex; align-items: center; gap: var(--space-sm);">
              <div class="loading__spinner loading__spinner--sm"></div>
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Updating...</span>
            </div>
          ` : (bet.status === 'pending' ? `
            ${confirmingPaymentId == bet.id ? `
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Confirm payment received?</span>
              <div style="display: flex; gap: var(--space-xs);">
                <button class="btn btn--xs btn--success confirm-payment-btn">Yes</button>
                <button class="btn btn--xs btn--outline cancel-payment-btn">Cancel</button>
              </div>
            ` : `
              <button class="btn btn--xs btn--primary resolve-payment-btn" data-id="${bet.id}">Resolve Payment</button>
            `}
          ` : (confirmingResolution && confirmingResolution.id == bet.id ? `
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">
              Confirm <b>${bet[confirmingResolution.winner]}</b> won?
            </span>
            <div style="display: flex; gap: var(--space-xs);">
              <button class="btn btn--xs btn--primary confirm-resolve-btn">Yes</button>
              <button class="btn btn--xs btn--outline cancel-resolve-btn">Cancel</button>
            </div>
          ` : `
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Resolve Winner:</span>
            <div style="display: flex; gap: var(--space-xs);">
              <button class="btn btn--xs btn--outline resolve-winner-btn" data-id="${bet.id}" data-winner="better1">${bet.better1}</button>
              <button class="btn btn--xs btn--outline resolve-winner-btn" data-id="${bet.id}" data-winner="better2">${bet.better2}</button>
            </div>
          `))}
        </div>
      ` : ''}
    </div>
  `;
}

function renderFilters() {
  const allBettors = [...new Set(bets.flatMap(b => [b.better1, b.better2]))].filter(b => b !== 'Pot').sort();
  const bettorOptions = allBettors.map(b => `<option value="${b}" ${bettorFilter === b ? 'selected' : ''}>${b}</option>`).join('');

  return `
    <div class="filters">
      <button class="filter-btn ${statusFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
      <button class="filter-btn ${statusFilter === 'active' ? 'active' : ''}" data-filter="active">🟢 Active</button>
      <button class="filter-btn ${statusFilter === 'paid' ? 'active' : ''}" data-filter="paid">✅ Paid</button>
      <button class="filter-btn ${statusFilter === 'pending' ? 'active' : ''}" data-filter="pending">⏳ Pending</button>
      <select class="form-select" id="bettorFilterSelect" style="min-width: 150px;">
        <option value="all" ${bettorFilter === 'all' ? 'selected' : ''}>All Bettors</option>
        ${bettorOptions}
      </select>
    </div>
  `;
}

function renderBetsList() {
  let filteredBets = bets;
  if (statusFilter !== 'all') {
    filteredBets = filteredBets.filter(b => b.status === statusFilter);
  }
  if (bettorFilter !== 'all') {
    filteredBets = filteredBets.filter(b => b.better1 === bettorFilter || b.better2 === bettorFilter);
  }

  if (filteredBets.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state__icon">🎲</div>
        <p>No bets found</p>
      </div>
    `;
  }

  return `
    <div class="bets-grid">
      ${filteredBets.map(bet => renderBetCard(bet)).join('')}
    </div>
  `;
}

function renderMemberCard(member) {
  const profitClass = member.netProfit > 0 ? 'leaderboard__profit--positive' :
    member.netProfit < 0 ? 'leaderboard__profit--negative' :
      'leaderboard__profit--neutral';
  const profitSign = member.netProfit > 0 ? '+' : '';

  return `
    <div class="member-card">
      <div class="member-card__header">
        <div class="member-card__avatar">${getInitials(member.name)}</div>
        <div>
          <div class="member-card__name">${member.name}</div>
          <div class="member-card__record">${member.wins}W - ${member.losses}L</div>
        </div>
      </div>
      <div class="member-card__stats">
        <div class="member-card__stat">
          <div class="member-card__stat-value ${profitClass}">${profitSign}${formatCurrency(member.netProfit)}</div>
          <div class="member-card__stat-label">Net P/L</div>
        </div>
        <div class="member-card__stat">
          <div class="member-card__stat-value">${member.winRate}%</div>
          <div class="member-card__stat-label">Win Rate</div>
        </div>
        <div class="member-card__stat">
          <div class="member-card__stat-value">${member.activeBets}</div>
          <div class="member-card__stat-label">Active</div>
        </div>
      </div>
    </div>
  `;
}

function renderMembersView() {
  if (memberStats.length === 0) {
    return '<div class="empty-state"><div class="empty-state__icon">👥</div>No members found</div>';
  }
  return `
    <div class="member-grid">
      ${memberStats.map(member => renderMemberCard(member)).join('')}
    </div>
  `;
}

function renderDashboardView() {
  return `
    <div class="mobile-only-action">
      <button class="btn btn--primary btn--full" id="dashNewBetBtn">Place New Bet</button>
    </div>
    ${renderLeaderboard()}
    <section class="section">
      <div class="section__header">
        <h2 class="section__title"><span>🔥</span> Recent Bets</h2>
      </div>
      <div class="bets-grid">
        ${bets.slice(0, 5).map(bet => renderBetCard(bet)).join('')}
      </div>
      <div style="margin-top: var(--space-lg); text-align: center;">
        <button class="btn btn--secondary btn--full" id="dashViewAllBtn">See All Bets</button>
      </div>
    </section>
  `;
}

function renderIndividualStats(name) {
  const member = memberStats.find(m => m.name === name);
  if (!member) return '';
  const totalBets = (member.wins || 0) + (member.losses || 0) + (member.activeBets || 0);
  const profitSign = member.netProfit > 0 ? '+' : '';
  const netColor = member.netProfit >= 0 ? 'var(--status-active)' : '#ff4757';

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card__label">Total Bets</div>
        <div class="stat-card__value">${totalBets}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Won</div>
        <div class="stat-card__value" style="color: var(--status-active);">${member.wins}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Lost</div>
        <div class="stat-card__value" style="color: #ff4757;">${member.losses}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Potential</div>
        <div class="stat-card__value" style="color: var(--text-secondary);">${formatCurrency(member.potentialGain || 0)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Net</div>
        <div class="stat-card__value" style="color: ${netColor};">${profitSign}${formatCurrency(member.netProfit)}</div>
      </div>
    </div>
  `;
}

function renderAllBetsView() {
  const statsHtml = bettorFilter === 'all' ? renderStatsCards() : renderIndividualStats(bettorFilter);
  return `
    <section class="section">
      <div class="section__header">
        <h2 class="section__title">All Bets</h2>
      </div>
      ${renderFilters()}
      ${statsHtml}
      ${renderBetsList()}
    </section>
  `;
}

function renderAllMembersView() {
  return `
    <section class="section">
      <div class="section__header">
        <h2 class="section__title"><span>👥</span> Member Statistics</h2>
      </div>
      ${renderMembersView()}
    </section>
  `;
}

function renderLoading() {
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

function renderChangePasswordModal() {
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

function renderNewBetModal() {
  if (!showNewBetModal) return '';

  const allBetters = [...new Set([...LEAGUE_MEMBERS])].filter(b => b !== 'Pot' && b !== currentUser.username);
  const betterOptions = allBetters.map(m => `<option value="${m}">${m}</option>`).join('');

  let overlayContent = '';
  if (isSubmitting) {
    overlayContent = `
      <div class="modal-overlay-loader">
        <div class="loading__spinner"></div>
        <p style="margin-top: var(--space-md);">Saving bet...</p>
      </div>
    `;
  } else if (submitSuccess) {
    overlayContent = `
      <div class="modal-overlay-success">
        <div class="success-icon">✓</div>
        <p class="success-text">Bet Placed Successfully!</p>
      </div>
    `;
  }

  // Pre-selected self
  const me = currentUser.username;

  return `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal" id="modalContainer">
        ${overlayContent}
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
             <!-- Shared Stakes for now, or assume equal stakes? -->
             <!-- The user said: "people cannot make bets for other people" -->
             <!-- We'll keep separate stakes inputs but label them clearly -->
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

function render() {
  let mainContent = '';

  switch (currentView) {
    case 'dashboard':
      mainContent = renderDashboardView();
      break;
    case 'bets':
      mainContent = renderAllBetsView();
      break;
    case 'members':
      mainContent = renderAllMembersView();
      break;
  }

  app.innerHTML = `
    <div class="nav-overlay" id="navOverlay"></div>
    ${renderMobileNav()}
    ${renderHeader()}
    <main class="main">
      ${mainContent}
    </main>
    ${renderNewBetModal()}
    ${renderChangePasswordModal()}
  `;

  attachEventListeners();
}

async function handleNewBetSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);

  const betData = {
    better1: currentUser.username, // Force self
    better2: formData.get('better2'),
    better1Bet: formData.get('better1Bet'),
    better2Bet: formData.get('better2Bet'),
    better1Reward: parseFloat(formData.get('better1Reward')),
    better2Reward: parseFloat(formData.get('better2Reward'))
  };

  const errorEl = document.getElementById('newBetError');
  if (errorEl) errorEl.style.display = 'none';

  if (!betData.better2) {
    if (errorEl) {
      errorEl.textContent = 'Please select an opponent!';
      errorEl.style.display = 'block';
    }
    return;
  }

  isSubmitting = true;
  render();

  try {
    await createBet(betData);
    isSubmitting = false;
    submitSuccess = true;
    render();

    await new Promise(resolve => setTimeout(resolve, 2000));

    submitSuccess = false;
    showNewBetModal = false;

    bets = await fetchBets();
    memberStats = calculateMemberStats(bets);
    overallStats = calculateOverallStats(bets);
    render();

    const newBetCard = document.querySelector('.bet-card');
    if (newBetCard) {
      newBetCard.classList.add('animate-new-bet');
    }

  } catch (error) {
    isSubmitting = false;
    render();
    const errorEl = document.getElementById('newBetError');
    if (errorEl) {
      errorEl.textContent = 'Failed to create bet: ' + error.message;
      errorEl.style.display = 'block';
    }
  }
}

async function handleResolveBet(winnerKey) {
  if (!resolveBetId && resolveBetId !== 0) return;

  resolveIsSubmitting = true;
  render();

  try {
    // Convert internal key to Sheet value logic 
    // Wait, the API now handles 'better1' or 'better2' internally based on row data
    // so we can just pass 'better1' or 'better2' string
    await updateBet(resolveBetId, winnerKey);

    showResolveModal = false;
    resolveBetId = null;
    resolveIsSubmitting = false;

    bets = await fetchBets();
    memberStats = calculateMemberStats(bets);
    overallStats = calculateOverallStats(bets);
    render();

  } catch (error) {
    resolveIsSubmitting = false;
    alert('Failed to update bet: ' + error.message);
    render();
  }
}

async function handleResolvePayment(betId) {
  resolveBetId = betId;
  resolveIsSubmitting = true;
  render();

  try {
    await markBetAsPaid(betId);
    resolveBetId = null;
    resolveIsSubmitting = false;

    bets = await fetchBets();
    memberStats = calculateMemberStats(bets);
    overallStats = calculateOverallStats(bets);
    render();

  } catch (error) {
    resolveIsSubmitting = false;
    alert('Failed to mark as paid: ' + error.message);
    render();
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  let username = formData.get('username') ? formData.get('username').trim() : '';

  // Capitalize first letter logic
  if (username) {
    username = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
  }

  const password = formData.get('password');
  const errorEl = document.getElementById('loginError');
  const submitBtn = e.target.querySelector('button[type="submit"]');

  if (submitBtn) {
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;
  }

  if (errorEl) errorEl.style.display = 'none';

  try {
    if (authMode === 'login') {
      await login(username, password);
    } else {
      await register(username, password);
    }

    // Auth successful, reload state
    currentUser = getCurrentUser();
    init();

  } catch (error) {
    if (errorEl) {
      errorEl.textContent = error.message;
      errorEl.style.display = 'block';
    }
    if (submitBtn) {
      submitBtn.textContent = authMode === 'login' ? 'Login' : 'Create Account';
      submitBtn.disabled = false;
    }
  }
}

async function handleChangePasswordSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const oldPassword = formData.get('oldPassword');
  const newPassword = formData.get('newPassword');
  const errorEl = document.getElementById('pwError');

  if (errorEl) errorEl.style.display = 'none';

  try {
    await changePassword(oldPassword, newPassword);
    alert('Password changed successfully!');
    showChangePasswordModal = false;
    render();
  } catch (error) {
    if (errorEl) {
      errorEl.textContent = error.message;
      errorEl.style.display = 'block';
    }
  }
}

function attachEventListeners() {
  document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.target.dataset.view;
      if (view && view !== currentView) {
        currentView = view;
        render();
      }
    });
  });

  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mainNav = document.getElementById('mainNav');
  const navOverlay = document.getElementById('navOverlay');

  if (hamburgerBtn && mainNav && navOverlay) {
    function toggleMenu() {
      mainNav.classList.toggle('active');
      navOverlay.classList.toggle('active');
      hamburgerBtn.innerHTML = mainNav.classList.contains('active') ? '✕' : '☰';
    }
    hamburgerBtn.addEventListener('click', toggleMenu);
    navOverlay.addEventListener('click', toggleMenu);
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (mainNav.classList.contains('active')) toggleMenu();
      });
    });
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = e.target.dataset.filter;
      if (filter && filter !== statusFilter) {
        statusFilter = filter;
        render();
      }
    });
  });

  const bettorFilterSelect = document.getElementById('bettorFilterSelect');
  if (bettorFilterSelect) {
    bettorFilterSelect.addEventListener('change', (e) => {
      bettorFilter = e.target.value;
      render();
    });
  }

  document.querySelectorAll('.js-new-bet-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showNewBetModal = true;
      render();
    });
  });

  document.querySelectorAll('.js-logout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      logout();
      currentUser = null;
      init();
    });
  });

  document.querySelectorAll('.js-change-pw-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showChangePasswordModal = true;
      render();
    });
  });

  document.querySelectorAll('.js-theme-toggle').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });

  // Modals
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelBetBtn = document.getElementById('cancelBetBtn');
  const modalOverlay = document.getElementById('modalOverlay');
  const newBetForm = document.getElementById('newBetForm');

  if (closeModalBtn) closeModalBtn.addEventListener('click', () => { showNewBetModal = false; render(); });
  if (cancelBetBtn) cancelBetBtn.addEventListener('click', () => { showNewBetModal = false; render(); });
  if (modalOverlay) modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) { showNewBetModal = false; render(); } });
  if (newBetForm) newBetForm.addEventListener('submit', handleNewBetSubmit);

  // Password Modal
  const closePwBtn = document.getElementById('closePwModalBtn');
  const cancelPwBtn = document.getElementById('cancelPwBtn');
  const pwOverlay = document.getElementById('pwModalOverlay');
  const pwForm = document.getElementById('changePwForm');

  if (closePwBtn) closePwBtn.addEventListener('click', () => { showChangePasswordModal = false; render(); });
  if (cancelPwBtn) cancelPwBtn.addEventListener('click', () => { showChangePasswordModal = false; render(); });
  if (pwOverlay) pwOverlay.addEventListener('click', (e) => { if (e.target === pwOverlay) { showChangePasswordModal = false; render(); } });
  if (pwForm) pwForm.addEventListener('submit', handleChangePasswordSubmit);

  const dashNewBetBtn = document.getElementById('dashNewBetBtn');
  if (dashNewBetBtn) dashNewBetBtn.addEventListener('click', () => { showNewBetModal = true; render(); });

  const dashViewAllBtn = document.getElementById('dashViewAllBtn');
  if (dashViewAllBtn) dashViewAllBtn.addEventListener('click', () => { currentView = 'bets'; render(); });

  // User Dropdown
  const userDropdownTrigger = document.getElementById('userDropdownTrigger');
  const userDropdownMenu = document.getElementById('userDropdownMenu');
  if (userDropdownTrigger && userDropdownMenu) {
    userDropdownTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdownMenu.classList.toggle('active');
    });
  }
}

async function init() {
  if (!currentUser) {
    app.innerHTML = renderLoginScreen();
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', handleAuthSubmit);
    }
    return;
  }

  app.innerHTML = `
    ${renderHeader()}
    <main class="main">
      ${renderLoading()}
    </main>
  `;

  try {
    bets = await fetchBets();
    memberStats = calculateMemberStats(bets);
    overallStats = calculateOverallStats(bets);
    render();
  } catch (error) {
    console.error('Failed to load bets:', error);
    app.innerHTML = `
      ${renderHeader()}
      <main class="main">
        <div class="empty-state">
          <div class="empty-state__icon">❌</div>
          <p>Failed to load betting data. Please try again later.</p>
        </div>
      </main>
    `;
    // Re-attach logout listeners even on error
    document.querySelectorAll('.js-logout-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        logout();
        currentUser = null;
        init();
      });
    });
  }
}

// Global click delegation for dynamic elements
if (app) {
  app.onclick = (e) => {
    // Leaderboard Click
    const leaderboardItem = e.target.closest('.leaderboard__item');
    if (leaderboardItem) {
      currentView = 'bets';
      statusFilter = 'all';
      bettorFilter = leaderboardItem.dataset.bettor;
      render();
      window.scrollTo(0, 0);
      return;
    }

    // Resolve Winner
    const winnerBtn = e.target.closest('.resolve-winner-btn');
    if (winnerBtn) {
      const winner = winnerBtn.dataset.winner;
      const betId = winnerBtn.dataset.id;
      confirmingResolution = { id: betId, winner: winner };
      render();
    }

    // Confirm Resolution
    if (e.target.matches('.confirm-resolve-btn')) {
      if (confirmingResolution) {
        resolveBetId = confirmingResolution.id;
        const winner = confirmingResolution.winner;
        confirmingResolution = null;
        handleResolveBet(winner);
      }
    }

    // Cancel Resolution
    if (e.target.matches('.cancel-resolve-btn')) {
      confirmingResolution = null;
      render();
    }

    // Resolve Payment
    if (e.target.matches('.resolve-payment-btn')) {
      confirmingPaymentId = e.target.dataset.id;
      render();
    }

    // Confirm Payment
    if (e.target.matches('.confirm-payment-btn')) {
      if (confirmingPaymentId) {
        const betId = confirmingPaymentId;
        confirmingPaymentId = null;
        handleResolvePayment(betId);
      }
    }

    // Cancel Payment
    if (e.target.matches('.cancel-payment-btn')) {
      confirmingPaymentId = null;
      render();
    }
  };
}

// Global click listener to close dropdowns
document.addEventListener('click', (e) => {
  const menu = document.getElementById('userDropdownMenu');
  const trigger = document.getElementById('userDropdownTrigger');

  if (menu && menu.classList.contains('active') && trigger && !trigger.contains(e.target)) {
    menu.classList.remove('active');
  }
});

// Start
init();
