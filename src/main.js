import './style.css';
import { fetchBets, calculateMemberStats, calculateOverallStats, createBet, updateBet, markBetAsPaid, LEAGUE_MEMBERS, verifyPassword, setPassword, getPassword } from './api.js';

// Auth State - check if we have a stored password
let isAuthenticated = !!getPassword();

// App State
let currentView = 'dashboard';
let bets = [];
let memberStats = [];
let overallStats = {};
let statusFilter = 'all';
let bettorFilter = 'all'; // Filter bets by bettor name
let showNewBetModal = false;
let isSubmitting = false;
let submitSuccess = false;
let showResolveModal = false;
let resolveBetId = null;
let resolveIsSubmitting = false;
let confirmingResolution = null; // { id: number, winner: string }
let confirmingPaymentId = null; // id of bet being confirmed for payment
let selectedBetter1 = ''; // Track selected better 1 for dynamic labels
let selectedBetter2 = ''; // Track selected better 2 for dynamic labels
let customBetters = []; // Track custom betters added by user

// Theme State
const THEME_STORAGE_KEY = 'hd_bets_theme';
let isDarkMode = localStorage.getItem(THEME_STORAGE_KEY) === 'dark';

// Apply theme on load
function applyTheme() {
  document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
}
applyTheme();

// Toggle theme function
function toggleTheme() {
  isDarkMode = !isDarkMode;
  localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
  applyTheme();
  render();
}

// DOM Elements
const app = document.getElementById('app');

// Format currency
function formatCurrency(amount) {
  return `€${amount.toFixed(2)}`;
}

// Format date
function formatDate(date) {
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Get initials from name
function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Render Header
function renderHeader() {
  return `
    <header class="header">
      <div class="header__inner">
        <div class="header__brand">
          <span class="header__logo">🎲</span>
          <span class="header__title">HD Bets</span>
        </div>
        <button class="hamburger" id="hamburgerBtn" aria-label="Toggle menu">☰</button>
        <div class="nav-overlay" id="navOverlay"></div>
        <nav class="header__nav" id="mainNav">
          <button class="nav-btn ${currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard">
            Dashboard
          </button>
          <button class="nav-btn ${currentView === 'bets' ? 'active' : ''}" data-view="bets">
            All Bets
          </button>
          <button class="nav-btn ${currentView === 'members' ? 'active' : ''}" data-view="members">
            Members
          </button>
          <button class="nav-btn nav-btn--primary" id="newBetBtn">
            + New Bet
          </button>
          <button class="nav-btn" id="themeToggleBtn" title="Toggle theme" style="font-size: 1.25rem; padding: 0.5rem;">
            ${isDarkMode ? '☀️' : '🌙'}
          </button>
          <button class="nav-btn" id="logoutBtn" title="Logout" style="color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
            Logout ➜
          </button>
        </nav>
      </div>
    </header>
  `;
}

// Render Login Screen
function renderLoginScreen() {
  return `
    <div class="login-container">
      <div class="login-card">
        <div class="login-card__header">
          <span class="login-card__logo">🎲</span>
          <h1 class="login-card__title">HD Bets</h1>
          <p class="login-card__subtitle">Fantasy Basketball Betting</p>
        </div>
        <form class="login-form" id="loginForm">
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" name="password" placeholder="Enter password" required autofocus />
          </div>
          <div class="login-error" id="loginError" style="display: none;">
            Invalid password
          </div>
          <button type="submit" class="btn btn--primary btn--full">
            🎲 Enter the Game
          </button>
        </form>
      </div>
    </div>
  `;
}

// Render Stats Cards
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

// Render Leaderboard
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
      <div class="leaderboard__item">
        <div class="leaderboard__rank ${rankClass}">${rank}</div>
        <div class="leaderboard__name">${member.name}</div>
        <div class="leaderboard__stats">${member.wins}W - ${member.losses}L (${member.winRate}%)</div>
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

// Render Bet Card
function renderBetCard(bet) {
  const statusClass = `bet-card__status--${bet.status}`;
  const statusLabel = bet.status.charAt(0).toUpperCase() + bet.status.slice(1);

  const isWinner1 = bet.winnerName === bet.better1;
  const isWinner2 = bet.winnerName === bet.better2;

  const side1Class = isWinner1 ? 'bet-card__side--winner' : (isWinner2 ? 'bet-card__side--loser' : '');
  const side2Class = isWinner2 ? 'bet-card__side--winner' : (isWinner1 ? 'bet-card__side--loser' : '');

  const cardClass = isWinner1 ? 'bet-card--winner-1' : (isWinner2 ? 'bet-card--winner-2' : '');

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
      ${isAuthenticated && bet.status !== 'paid' ? `
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

// Render Filters
function renderFilters() {
  // Get unique bettors from all bets
  const allBettors = [...new Set(bets.flatMap(b => [b.better1, b.better2]))].filter(b => b !== 'Pot').sort();
  const bettorOptions = allBettors.map(b => `<option value="${b}" ${bettorFilter === b ? 'selected' : ''}>${b}</option>`).join('');

  // Calculate bettor stats if a specific bettor is selected
  let bettorStatsHtml = '';
  if (bettorFilter !== 'all') {
    const bettorBets = bets.filter(b => b.better1 === bettorFilter || b.better2 === bettorFilter);
    const totalBets = bettorBets.length;
    let wins = 0;
    let losses = 0;
    let moneyWon = 0;
    let moneyLost = 0;

    bettorBets.forEach(bet => {
      // winnerName contains the actual name, winner contains 'better1' or 'better2'
      if (bet.winnerName) {
        if (bet.winnerName === bettorFilter) {
          wins++;
          moneyWon += bet.amountWon || 0;
        } else if (bet.loserName === bettorFilter) {
          losses++;
          moneyLost += bet.amountLost || 0;
        }
      }
    });

    const netMoney = moneyWon - moneyLost;
    const netClass = netMoney >= 0 ? 'positive' : 'negative';
    const netSign = netMoney >= 0 ? '+' : '';

    bettorStatsHtml = `
      <div class="bettor-stats">
        <div class="bettor-stats__item">
          <span class="bettor-stats__label">Total Bets</span>
          <span class="bettor-stats__value">${totalBets}</span>
        </div>
        <div class="bettor-stats__item">
          <span class="bettor-stats__label">Won</span>
          <span class="bettor-stats__value" style="color: var(--status-active);">${wins}</span>
        </div>
        <div class="bettor-stats__item">
          <span class="bettor-stats__label">Lost</span>
          <span class="bettor-stats__value" style="color: var(--status-pending);">${losses}</span>
        </div>
        <div class="bettor-stats__item">
          <span class="bettor-stats__label">Net</span>
          <span class="bettor-stats__value bettor-stats__value--${netClass}">${netSign}€${netMoney.toFixed(2)}</span>
        </div>
      </div>
    `;
  }

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
    ${bettorStatsHtml}
  `;
}

// Render Bets List
function renderBetsList() {
  let filteredBets = bets;

  // Apply status filter
  if (statusFilter !== 'all') {
    filteredBets = filteredBets.filter(b => b.status === statusFilter);
  }

  // Apply bettor filter
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

// Render Member Card
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

// Render Members View
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

// Render Dashboard View
function renderDashboardView() {
  return `
    <div class="mobile-only-action">
      <button class="btn btn--primary btn--full" id="dashNewBetBtn">🎲 Place New Bet</button>
    </div>

    ${renderLeaderboard()}

    ${renderStatsCards()}

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

// Render All Bets View
function renderAllBetsView() {
  return `
    <section class="section">
      <div class="section__header">
        <h2 class="section__title"><span>🎲</span> All Bets</h2>
      </div>
      ${renderFilters()}
      ${renderBetsList()}
    </section>
  `;
}

// Render All Members View
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

// Render Loading State
function renderLoading() {
  return `
    <div class="loading">
      <div class="loading__spinner"></div>
      <p>Loading bets...</p>
    </div>
  `;
}

// Render New Bet Modal
function renderNewBetModal() {
  if (!showNewBetModal) return '';

  // Combine league members with any custom betters
  const allBetters = [...new Set([...LEAGUE_MEMBERS, ...customBetters])].filter(b => b !== 'Pot');
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

  // Dynamic labels based on selection
  const better1Label = selectedBetter1 || 'Bettor 1';
  const better2Label = selectedBetter2 || 'Bettor 2';

  return `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal" id="modalContainer">
        ${overlayContent}
        <div class="modal__header">
          <h2 class="modal__title">🎲 New Bet</h2>
          <button class="modal__close" id="closeModalBtn">&times;</button>
        </div>
        <p id="newBetError" class="error-message" style="margin: 0 var(--space-lg); display: none;"></p>
        <form class="modal__form" id="newBetForm">
          <div class="form-group" style="margin-bottom: var(--space-lg);">
            <label class="form-label" style="text-align: center; display: block; margin-bottom: var(--space-sm);">Who's Betting?</label>
            <div class="betters-row" style="display: flex; align-items: center; gap: var(--space-md);">
              <select class="form-select" name="better1" id="better1Select" style="flex: 1;" required>
                <option value="">Select better...</option>
                <option value="__new__">+ Add New Better</option>
                ${betterOptions}
              </select>
              <span style="font-weight: 700; color: var(--text-muted); flex-shrink: 0;">VS</span>
              <select class="form-select" name="better2" id="better2Select" style="flex: 1;" required>
                <option value="">Select better...</option>
                <option value="__new__">+ Add New Better</option>
                ${betterOptions}
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" id="better1BetLabel">${better1Label}'s Bet</label>
              <textarea class="form-textarea" name="better1Bet" placeholder="e.g. Knicks win the championship" required></textarea>
            </div>
            <div class="form-group">
              <label class="form-label" id="better2BetLabel">${better2Label}'s Bet</label>
              <textarea class="form-textarea" name="better2Bet" placeholder="e.g. Knicks don't win the championship" required></textarea>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" id="better1StakesLabel">${better1Label}'s Stakes (€)</label>
              <input type="number" class="form-input" name="better1Reward" min="1" step="0.01" placeholder="20.00" required />
            </div>
            <div class="form-group">
              <label class="form-label" id="better2StakesLabel">${better2Label}'s Stakes (€)</label>
              <input type="number" class="form-input" name="better2Reward" min="1" step="0.01" placeholder="20.00" required />
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn--secondary" id="cancelBetBtn">Cancel</button>
            <button type="submit" class="btn btn--primary" ${isSubmitting ? 'disabled' : ''}>
              ${isSubmitting ? 'Submitting...' : '🎯 Place Bet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// Main Render Function
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
    ${renderHeader()}
    <main class="main">
      ${mainContent}
    </main>
    ${renderNewBetModal()}
    ${renderResolveModal()}
  `;

  // Attach event listeners
  attachEventListeners();
}

// Handle form submission
// Helper to update only the labels without full re-render (no flicker)
function updateLabelsOnly() {
  const better1Label = selectedBetter1 || 'Bettor 1';
  const better2Label = selectedBetter2 || 'Bettor 2';

  const better1BetLabel = document.getElementById('better1BetLabel');
  const better2BetLabel = document.getElementById('better2BetLabel');
  const better1StakesLabel = document.getElementById('better1StakesLabel');
  const better2StakesLabel = document.getElementById('better2StakesLabel');

  if (better1BetLabel) better1BetLabel.textContent = `${better1Label}'s Bet`;
  if (better2BetLabel) better2BetLabel.textContent = `${better2Label}'s Bet`;
  if (better1StakesLabel) better1StakesLabel.textContent = `${better1Label}'s Stakes (€)`;
  if (better2StakesLabel) better2StakesLabel.textContent = `${better2Label}'s Stakes (€)`;
}

// Helper to update only the modal without full re-render
function updateModalOnly() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) {
    // Preserve form values before re-render
    const form = document.getElementById('newBetForm');
    const formValues = {};
    if (form) {
      const formData = new FormData(form);
      for (const [key, value] of formData.entries()) {
        formValues[key] = value;
      }
    }

    overlay.outerHTML = renderNewBetModal();

    // Restore form values after re-render
    const newForm = document.getElementById('newBetForm');
    if (newForm) {
      Object.entries(formValues).forEach(([key, value]) => {
        const el = newForm.elements[key];
        if (el && value) {
          el.value = value;
        }
      });
    }

    // Re-attach listeners
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        showNewBetModal = false;
        selectedBetter1 = '';
        selectedBetter2 = '';
        render();
      });
    }

    const cancelBetBtn = document.getElementById('cancelBetBtn');
    if (cancelBetBtn) {
      cancelBetBtn.addEventListener('click', () => {
        showNewBetModal = false;
        selectedBetter1 = '';
        selectedBetter2 = '';
        render();
      });
    }

    if (newForm) {
      newForm.addEventListener('submit', handleNewBetSubmit);
    }

    const newOverlay = document.getElementById('modalOverlay');
    if (newOverlay) {
      newOverlay.addEventListener('click', (e) => {
        if (e.target === newOverlay) {
          showNewBetModal = false;
          selectedBetter1 = '';
          selectedBetter2 = '';
          render();
        }
      });
    }

    // Attach better selection handlers
    const better1Select = document.getElementById('better1Select');
    const better2Select = document.getElementById('better2Select');

    if (better1Select) {
      better1Select.addEventListener('change', (e) => {
        if (e.target.value === '__new__') {
          const newName = prompt('Enter new better name:');
          if (newName && newName.trim()) {
            const trimmedName = newName.trim();
            if (!customBetters.includes(trimmedName)) {
              customBetters.push(trimmedName);
            }
            selectedBetter1 = trimmedName;
            updateModalOnly();
            const select = document.getElementById('better1Select');
            if (select) select.value = trimmedName;
          } else {
            e.target.value = selectedBetter1 || '';
          }
        } else {
          selectedBetter1 = e.target.value;
          updateLabelsOnly();
        }
      });
    }

    if (better2Select) {
      better2Select.addEventListener('change', (e) => {
        if (e.target.value === '__new__') {
          const newName = prompt('Enter new better name:');
          if (newName && newName.trim()) {
            const trimmedName = newName.trim();
            if (!customBetters.includes(trimmedName)) {
              customBetters.push(trimmedName);
            }
            selectedBetter2 = trimmedName;
            updateModalOnly();
            const select = document.getElementById('better2Select');
            if (select) select.value = trimmedName;
          } else {
            e.target.value = selectedBetter2 || '';
          }
        } else {
          selectedBetter2 = e.target.value;
          updateLabelsOnly();
        }
      });
    }
  }
}

// Handle New Bet Submission
async function handleNewBetSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const betData = {
    better1: formData.get('better1'),
    better2: formData.get('better2'),
    better1Bet: formData.get('better1Bet'),
    better2Bet: formData.get('better2Bet'),
    better1Reward: parseFloat(formData.get('better1Reward')),
    better2Reward: parseFloat(formData.get('better2Reward'))
  };

  // Clear previous errors
  const errorEl = document.getElementById('newBetError');
  if (errorEl) errorEl.style.display = 'none';

  // Validate different bettors
  if (betData.better1 === betData.better2) {
    if (errorEl) {
      errorEl.textContent = 'Please select two different betters for the bet!';
      errorEl.style.display = 'block';
    }
    return;
  }

  isSubmitting = true;
  updateModalOnly(); // Prevent flickering by updating only modal

  try {
    await createBet(betData);

    // Show success animation
    isSubmitting = false;
    submitSuccess = true;
    updateModalOnly(); // Update only modal

    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 2000));

    submitSuccess = false;
    showNewBetModal = false;

    // Refresh bets
    bets = await fetchBets();
    memberStats = calculateMemberStats(bets);
    overallStats = calculateOverallStats(bets);
    render();

    // Animate the new bet (first one)
    const newBetCard = document.querySelector('.bet-card');
    if (newBetCard) {
      newBetCard.classList.add('animate-new-bet');
    }

  } catch (error) {
    isSubmitting = false;
    updateModalOnly(); // Reset modal state
    const errorEl = document.getElementById('newBetError');
    if (errorEl) {
      errorEl.textContent = 'Failed to create bet: ' + error.message;
      errorEl.style.display = 'block';
    }
  }
}

// Attach Event Listeners
function attachEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-btn:not(#newBetBtn)').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.target.dataset.view;
      if (view && view !== currentView) {
        currentView = view;
        render();
      }
    });
  });

  // Mobile Menu Toggle
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

    // Close menu when any nav button is clicked
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (mainNav.classList.contains('active')) {
          toggleMenu();
        }
      });
    });
  }

  // Filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = e.target.dataset.filter;
      if (filter && filter !== statusFilter) {
        statusFilter = filter;
        render();
      }
    });
  });

  // Bettor Filter
  const bettorFilterSelect = document.getElementById('bettorFilterSelect');
  if (bettorFilterSelect) {
    bettorFilterSelect.addEventListener('change', (e) => {
      bettorFilter = e.target.value;
      render();
    });
  }

  // New Bet Button
  const newBetBtn = document.getElementById('newBetBtn');
  if (newBetBtn) {
    newBetBtn.addEventListener('click', () => {
      showNewBetModal = true;
      selectedBetter1 = '';
      selectedBetter2 = '';
      render();
    });
  }

  // Dashboard specific buttons
  const dashNewBetBtn = document.getElementById('dashNewBetBtn');
  if (dashNewBetBtn) {
    dashNewBetBtn.addEventListener('click', () => {
      showNewBetModal = true;
      selectedBetter1 = '';
      selectedBetter2 = '';
      render();
    });
  }

  const dashViewAllBtn = document.getElementById('dashViewAllBtn');
  if (dashViewAllBtn) {
    dashViewAllBtn.addEventListener('click', () => {
      currentView = 'bets';
      render();
    });
  }

  // Modal controls
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelBetBtn = document.getElementById('cancelBetBtn');
  const modalOverlay = document.getElementById('modalOverlay');
  const newBetForm = document.getElementById('newBetForm');
  const better1Select = document.getElementById('better1Select');
  const better2Select = document.getElementById('better2Select');

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      showNewBetModal = false;
      selectedBetter1 = '';
      selectedBetter2 = '';
      render();
    });
  }

  if (cancelBetBtn) {
    cancelBetBtn.addEventListener('click', () => {
      showNewBetModal = false;
      selectedBetter1 = '';
      selectedBetter2 = '';
      render();
    });
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        showNewBetModal = false;
        selectedBetter1 = '';
        selectedBetter2 = '';
        render();
      }
    });
  }

  if (newBetForm) {
    newBetForm.addEventListener('submit', handleNewBetSubmit);
  }

  // Handle better selection changes
  if (better1Select) {
    better1Select.addEventListener('change', (e) => {
      if (e.target.value === '__new__') {
        const newName = prompt('Enter new better name:');
        if (newName && newName.trim()) {
          const trimmedName = newName.trim();
          if (!customBetters.includes(trimmedName)) {
            customBetters.push(trimmedName);
          }
          selectedBetter1 = trimmedName;
          // Need full re-render to add new option to dropdown
          updateModalOnly();
          const select = document.getElementById('better1Select');
          if (select) select.value = trimmedName;
        } else {
          e.target.value = selectedBetter1 || '';
        }
      } else {
        selectedBetter1 = e.target.value;
        // Just update labels, no re-render needed
        updateLabelsOnly();
      }
    });
  }

  if (better2Select) {
    better2Select.addEventListener('change', (e) => {
      if (e.target.value === '__new__') {
        const newName = prompt('Enter new better name:');
        if (newName && newName.trim()) {
          const trimmedName = newName.trim();
          if (!customBetters.includes(trimmedName)) {
            customBetters.push(trimmedName);
          }
          selectedBetter2 = trimmedName;
          // Need full re-render to add new option to dropdown
          updateModalOnly();
          const select = document.getElementById('better2Select');
          if (select) select.value = trimmedName;
        } else {
          e.target.value = selectedBetter2 || '';
        }
      } else {
        selectedBetter2 = e.target.value;
        // Just update labels, no re-render needed
        updateLabelsOnly();
      }
    });
  }

  // Logout handler
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Theme toggle handler
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }
}

// Handle Login
async function handleLogin(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const password = formData.get('password');

  // Show loading state
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = 'Verifying...';
  submitBtn.disabled = true;

  try {
    const valid = await verifyPassword(password);

    if (valid) {
      isAuthenticated = true;
      init(); // Reload the app
    } else {
      const errorEl = document.getElementById('loginError');
      if (errorEl) {
        errorEl.style.display = 'block';
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    const errorEl = document.getElementById('loginError');
    if (errorEl) {
      errorEl.textContent = 'Connection error. Please try again.';
      errorEl.style.display = 'block';
    }
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

// Handle Logout
function handleLogout() {
  isAuthenticated = false;
  setPassword(''); // Clear password from api.js
  init(); // Show login screen
}

// Initialize App
async function init() {
  // Check authentication first
  if (!isAuthenticated) {
    app.innerHTML = renderLoginScreen();
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
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
          <p>Failed to load betting data</p>
          <p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 0.5rem;">
            Make sure your Google Sheet is published to the web
          </p>
        </div>
      </main>
    `;
  }
}

// Start the app
// Render Resolve Modal
function renderResolveModal() {
  if (!showResolveModal) return '';

  const bet = bets.find(b => b.id == resolveBetId);
  if (!bet) return '';

  return `
    <div class="modal-overlay" id="resolveOverlay">
      <div class="modal">
        <div class="modal__header">
          <h2 class="modal__title">Resolve Bet</h2>
          <button class="modal__close" id="closeResolveBtn">&times;</button>
        </div>
        <div class="modal__body">
          <p style="margin-bottom: var(--space-md); color: var(--text-muted);">Who won this bet?</p>
          
          <div class="bet-card" style="margin-bottom: var(--space-lg); border: 1px solid var(--border-color);">
            <div class="bet-card__bettor">${bet.better1} vs ${bet.better2}</div>
            <div class="bet-card__bet">${bet.better1Bet} vs ${bet.better2Bet}</div>
          </div>

          ${resolveIsSubmitting ? `
            <div class="loading">
                <div class="loading__spinner"></div>
                <p>Updating...</p>
            </div>
          ` : `
          <div class="resolve-actions" style="display: grid; gap: var(--space-md); grid-template-columns: 1fr 1fr;">
            <button class="btn btn--outline resolve-winner-btn" data-winner="better1" style="height: auto; padding: 1rem;">
              <span style="display: block; font-weight: bold; margin-bottom: 0.25rem;">${bet.better1}</span>
              <span style="font-size: 0.8rem; opacity: 0.8;">Won ${formatCurrency(bet.better1Reward)}</span>
            </button>
            <button class="btn btn--outline resolve-winner-btn" data-winner="better2" style="height: auto; padding: 1rem;">
              <span style="display: block; font-weight: bold; margin-bottom: 0.25rem;">${bet.better2}</span>
              <span style="font-size: 0.8rem; opacity: 0.8;">Won ${formatCurrency(bet.better2Reward)}</span>
            </button>
          </div>
          `}
        </div>
      </div>
    </div>
  `;
}

// Handle Resolve Bet
async function handleResolveBet(winnerKey) {
  if (!resolveBetId && resolveBetId !== 0) return;

  resolveIsSubmitting = true;
  render();

  try {
    // Convert internal key to Sheet value (Title Case)
    const sheetValue = winnerKey === 'better1' ? 'Better 1' : 'Better 2';
    await updateBet(resolveBetId, sheetValue);

    // Close and refresh
    showResolveModal = false;
    resolveBetId = null;
    resolveIsSubmitting = false;

    // Refresh
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

// Handle Resolve Payment
async function handleResolvePayment(betId) {
  resolveBetId = betId;
  resolveIsSubmitting = true;
  render();

  try {
    await markBetAsPaid(betId);

    resolveBetId = null;
    resolveIsSubmitting = false;

    // Refresh
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

// Global Event Delegation (Singleton to prevent duplicates)
if (app) {

  app.onclick = (e) => {
    // Open Modal
    if (e.target.matches('.resolve-btn')) {
      resolveBetId = e.target.dataset.id;
      showResolveModal = true;
      render();
    }

    // Close Modal
    if (e.target.matches('#closeResolveBtn') || e.target === document.getElementById('resolveOverlay')) {
      showResolveModal = false;
      render();
    }

    // Select Winner (Trigger Inline Confirmation)
    const winnerBtn = e.target.closest('.resolve-winner-btn');
    if (winnerBtn) {
      const winner = winnerBtn.dataset.winner;
      const betId = winnerBtn.dataset.id;
      confirmingResolution = { id: betId, winner: winner };
      render();
    }

    // Confirm Resolution Action
    if (e.target.matches('.confirm-resolve-btn')) {
      if (confirmingResolution) {
        resolveBetId = confirmingResolution.id;
        const winner = confirmingResolution.winner;
        confirmingResolution = null;
        handleResolveBet(winner);
      }
    }

    // Cancel Resolution Action
    if (e.target.matches('.cancel-resolve-btn')) {
      confirmingResolution = null;
      render();
    }

    // Resolve Payment (Initial Click)
    if (e.target.matches('.resolve-payment-btn')) {
      confirmingPaymentId = e.target.dataset.id;
      render();
    }

    // Confirm Payment Action
    if (e.target.matches('.confirm-payment-btn')) {
      if (confirmingPaymentId) {
        const betId = confirmingPaymentId;
        confirmingPaymentId = null;
        handleResolvePayment(betId);
      }
    }

    // Cancel Payment Action
    if (e.target.matches('.cancel-payment-btn')) {
      confirmingPaymentId = null;
      render();
    }
  };
}

// Start the app
init();

