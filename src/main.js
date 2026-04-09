import './styles/main.css';
import {
  getState,
  subscribe,
  setStatusFilter,
  setBettorFilter,
  setHistorySort,
  toggleTheme,
  setState
} from './lib/store/store.js';
import { navigateTo, handleRoute } from './lib/router/router.js';
import { logout } from './lib/auth/auth.js';
import { handleNewBetSubmit, handleResolveBet, handleConfirmBet, handleResolvePayment, handleAuthSubmit, handleChangePasswordSubmit, refreshData, stageUserPick, handleSaveAllPicks, stageAdminChange, handleAdminSaveAll, handleSetBracketBuyIn, fetchAndPopulateStandings, refreshBracketData } from './lib/actions/actions.js';

// Views
import { renderDashboardView } from './views/Dashboard/Dashboard.js';
import { renderMyBetsView } from './views/MyBets/MyBets.js';
import { renderAllBetsView } from './views/AllBets/AllBets.js';
import { renderMembersView } from './views/Members/Members.js';
import { renderBetHistoryView } from './views/BetHistory/BetHistory.js';
import { renderBracketView, renderBracketSavingOverlay, renderBracketConfirmModal, renderBracketHowModal } from './views/Bracket/Bracket.js';

// Components
import { renderHeader, renderMobileNav, renderStatsBar } from './components/Header/Header.js';
import { renderLoginScreen } from './components/Login/Login.js';
import { renderNewBetModal, renderChangePasswordModal } from './components/Modals/Modals.js';
import { renderLoading } from './components/Loader/Loader.js';

const app = document.getElementById('app');

// ==========================================
// RENDER
// ==========================================

function render(target = 'all') {
  const state = getState();
  const { currentView, showNewBetModal, isSubmitting, submitSuccess, showChangePasswordModal, currentUser } = state;

  // If not logged in, show login screen
  if (!currentUser) {
    if (app.innerHTML !== renderLoginScreen()) {
      app.innerHTML = renderLoginScreen();
      attachLoginListeners();
    }
    return;
  }

  let mainContent = '';
  switch (currentView) {
    case 'dashboard':
      mainContent = renderDashboardView();
      break;
    case 'my-bets':
      mainContent = renderMyBetsView();
      break;
    case 'bets':
      mainContent = renderAllBetsView();
      break;
    case 'members':
      mainContent = renderMembersView();
      break;
    case 'history':
      mainContent = renderBetHistoryView();
      break;
    case 'bracket': {
      const { bracketMatchups, bracketLoading } = state;
      // Track which user's bracket data is loaded
      const bracketUser = window._bracketLoadedUser;
      const currentUsername = currentUser ? currentUser.username : null;
      if ((!bracketMatchups.length || bracketUser !== currentUsername) && !bracketLoading) {
        window._bracketLoadedUser = currentUsername;
        refreshBracketData();
        if (!localStorage.getItem('hd_bracket_seen')) {
          localStorage.setItem('hd_bracket_seen', '1');
          setState({ showBracketHowModal: true });
        }
      }
      mainContent = renderBracketView();
      break;
    }
    default:
      mainContent = renderDashboardView();
  }

  if (target === 'all' || target === 'app') {
    const hadBottomBar = !!document.querySelector('.bracket-bottom-bar');
    app.innerHTML = `
      <div class="nav-overlay" id="navOverlay"></div>
      ${renderMobileNav()}
      ${renderHeader()}
      <main class="main">
        ${mainContent}
      </main>
      <footer class="footer">
        <div class="footer__inner">
          <div class="footer__top">
            <div class="footer__brand">
              <img src="${import.meta.env.BASE_URL || '/'}header_logo.png" class="footer__logo" alt="HD Bets" />
              <div>
                <div class="footer__title">HD Bets!</div>
                <div class="footer__tagline">Fantasy Basketball Betting League</div>
              </div>
            </div>
            <div class="footer__links">
              <button class="footer__link nav-btn" data-path="/">Dashboard</button>
              <button class="footer__link nav-btn" data-path="/my-bets">My Bets</button>
              <button class="footer__link nav-btn" data-path="/bets">All Bets</button>
              <button class="footer__link nav-btn" data-path="/bracket">Bracket</button>
              <button class="footer__link nav-btn" data-path="/members">Members</button>
            </div>
          </div>
          <div class="footer__copy">&copy; ${new Date().getFullYear()} HD Bets. All rights reserved.</div>
        </div>
      </footer>
    `;
    // Only animate the bottom bar on first appearance
    const bottomBar = document.querySelector('.bracket-bottom-bar');
    if (bottomBar && !hadBottomBar) {
      bottomBar.classList.add('bracket-bottom-bar--entering');
    }
  }

  // Modals
  if (target === 'all' || target === 'modals') {
    const modalsEl = document.getElementById('modals');
    // If we have a modals container in index.html (we do)
    if (modalsEl) {
      if (showNewBetModal) {
        // Check if already rendered to avoid input lose?
        // For now unconditional re-render or smart update
        // Smart update for modals to keep form state while submitting
        const existingOverlay = document.getElementById('modalOverlay');
        if (existingOverlay) {
          existingOverlay.classList.toggle('is-loading', isSubmitting);
          existingOverlay.classList.toggle('is-success', submitSuccess);
          const submitBtn = existingOverlay.querySelector('button[type="submit"]');
          if (submitBtn) {
            submitBtn.disabled = isSubmitting;
            submitBtn.textContent = isSubmitting ? 'Submitting...' : 'Place Bet';
          }
        } else {
          modalsEl.innerHTML = renderNewBetModal();
        }
      } else if (showChangePasswordModal) {
        modalsEl.innerHTML = renderChangePasswordModal();
      } else {
        // Bracket modals
        const bracketHow = renderBracketHowModal();
        const bracketConfirm = renderBracketConfirmModal();
        const bracketOverlay = renderBracketSavingOverlay();
        if (bracketHow) {
          modalsEl.innerHTML = bracketHow;
        } else if (bracketConfirm) {
          modalsEl.innerHTML = bracketConfirm;
        } else if (bracketOverlay) {
          modalsEl.innerHTML = bracketOverlay;
        } else {
          modalsEl.innerHTML = '';
        }
      }
    }
  }

  attachEventListeners();
}

// Subscribe to store changes
subscribe(() => {
  // Determine what to re-render based on state changes if needed
  // For now, full re-render is safe enough for this size app
  // We can optimize 'modals' vs 'app' later if key is passed
  render();
});

// ==========================================
// LISTENERS
// ==========================================

function attachLoginListeners() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleAuthSubmit);
  }
}

// Global listener for auth mode change
window.addEventListener('auth-mode-changed', attachLoginListeners);

function attachEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-btn[data-path]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // prevent bubbling issues
      const path = e.target.closest('.nav-btn').dataset.path;
      if (path && window.location.pathname !== path) {
        navigateTo(path);
      }
    });
  });

  document.querySelectorAll('.js-logo-link').forEach(link => {
    link.addEventListener('click', () => {
      navigateTo('/');
    });
  });

  // Mobile Menu
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mainNav = document.getElementById('mainNav');
  const navOverlay = document.getElementById('navOverlay');

  if (hamburgerBtn && mainNav && navOverlay) {
    function toggleMenu(e) {
      e.stopPropagation();
      mainNav.classList.toggle('active');
      navOverlay.classList.toggle('active');
      hamburgerBtn.innerHTML = mainNav.classList.contains('active') ? '✕' : '☰';
    }
    // Use onclick to avoid duplicate listeners on re-render
    hamburgerBtn.onclick = toggleMenu;
    navOverlay.onclick = toggleMenu;
  }

  // Filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = e.target.dataset.filter;
      setStatusFilter(filter);
    });
  });

  const bettorFilterSelect = document.getElementById('bettorFilterSelect');
  if (bettorFilterSelect) {
    bettorFilterSelect.onchange = (e) => {
      setBettorFilter(e.target.value);
    };
  }

  // Sort columns (Bet History table)
  document.querySelectorAll('.js-sort-col').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      const { historySort } = getState();
      const dir = historySort.key === key && historySort.dir === 'desc' ? 'asc' : 'desc';
      setHistorySort({ key, dir });
    });
  });

  // Modals Triggers
  document.querySelectorAll('.js-new-bet-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setState({ showNewBetModal: true });
    });
  });

  document.querySelectorAll('.js-logout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      logout();
      navigateTo('/');
    });
  });

  document.querySelectorAll('.js-change-pw-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setState({ showChangePasswordModal: true });
    });
  });

  document.querySelectorAll('.js-theme-toggle').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });

  const dashNewBetBtn = document.getElementById('dashNewBetBtn');
  if (dashNewBetBtn) dashNewBetBtn.onclick = () => setState({ showNewBetModal: true });

  const toastViewBtn = document.getElementById('toastViewBtn');
  if (toastViewBtn) toastViewBtn.onclick = () => navigateTo('/my-bets');

  // Modals Actions
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelBetBtn = document.getElementById('cancelBetBtn');
  const modalOverlay = document.getElementById('modalOverlay');
  const newBetForm = document.getElementById('newBetForm');

  if (closeModalBtn) closeModalBtn.onclick = () => setState({ showNewBetModal: false });
  if (cancelBetBtn) cancelBetBtn.onclick = () => setState({ showNewBetModal: false });
  if (modalOverlay) modalOverlay.onclick = (e) => { if (e.target === modalOverlay) setState({ showNewBetModal: false }); };
  if (newBetForm) {
    // Avoid duplicate submission if re-attached
    newBetForm.onsubmit = handleNewBetSubmit;
  }

  const closePwBtn = document.getElementById('closePwModalBtn');
  const cancelPwBtn = document.getElementById('cancelPwBtn');
  const pwOverlay = document.getElementById('pwModalOverlay');
  const pwForm = document.getElementById('changePwForm');

  if (closePwBtn) closePwBtn.onclick = () => setState({ showChangePasswordModal: false });
  if (cancelPwBtn) cancelPwBtn.onclick = () => setState({ showChangePasswordModal: false });
  if (pwOverlay) pwOverlay.onclick = (e) => { if (e.target === pwOverlay) setState({ showChangePasswordModal: false }); };
  if (pwForm) pwForm.onsubmit = handleChangePasswordSubmit;

  // User Dropdown
  const userDropdownTrigger = document.getElementById('userDropdownTrigger');
  const userDropdownMenu = document.getElementById('userDropdownMenu');
  if (userDropdownTrigger && userDropdownMenu) {
    userDropdownTrigger.onclick = (e) => {
      e.stopPropagation();
      userDropdownMenu.classList.toggle('active');
    };
  }

  // Team selector: search filtering + open/close
  document.querySelectorAll('.team-selector__search').forEach(input => {
    function openDropdown() {
      const selector = input.closest('.team-selector');
      const dropdown = selector.querySelector('.team-selector__dropdown');
      selector.classList.add('team-selector--open');
      // Position dropdown below the input using fixed positioning
      const rect = input.getBoundingClientRect();
      dropdown.style.top = rect.bottom + 2 + 'px';
      dropdown.style.left = rect.left + 'px';
      // Show all options
      selector.querySelectorAll('.team-selector__option').forEach(opt => {
        opt.style.display = '';
      });
    }
    input.onfocus = openDropdown;
    input.oninput = () => {
      const query = input.value.toLowerCase();
      const selector = input.closest('.team-selector');
      if (!selector.classList.contains('team-selector--open')) openDropdown();
      selector.querySelectorAll('.team-selector__option').forEach(opt => {
        const name = opt.querySelector('.team-selector__option-name').textContent.toLowerCase();
        const id = opt.querySelector('.team-selector__option-id').textContent.toLowerCase();
        opt.style.display = (name.includes(query) || id.includes(query)) ? '' : 'none';
      });
    };
  });
}

// Close team selectors when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.team-selector')) {
    document.querySelectorAll('.team-selector--open').forEach(s => s.classList.remove('team-selector--open'));
  }
});

// Global Delegated Listeners (attached once)
if (app) {
  app.onclick = (e) => {
    // Leaderboard Click
    const leaderboardItem = e.target.closest('.leaderboard__item');
    if (leaderboardItem) {
      setStatusFilter('all');
      setBettorFilter(leaderboardItem.dataset.bettor);
      navigateTo('/bets');
      return;
    }

    // Resolve Winner
    const winnerBtn = e.target.closest('.resolve-winner-btn');
    if (winnerBtn) {
      const winner = winnerBtn.dataset.winner;
      const betId = winnerBtn.dataset.id;
      setState({ confirmingResolution: { id: betId, winner: winner } });
    }

    // Confirm Resolution
    if (e.target.matches('.confirm-resolve-btn')) {
      const { confirmingResolution } = getState();
      if (confirmingResolution) {
        setState({ resolveBetId: confirmingResolution.id, confirmingResolution: null });
        handleResolveBet(confirmingResolution.winner);
      }
    }

    // Cancel Resolution
    if (e.target.closest('.cancel-resolve-btn')) {
      setState({ confirmingResolution: null });
    }

    // Confirm Bet Action
    const confirmBetBtn = e.target.closest('.js-start-confirm-bet');
    if (confirmBetBtn) {
      setState({ confirmingBetId: confirmBetBtn.dataset.id });
    }

    const confirmActionBtn = e.target.closest('.js-confirm-bet-action');
    if (confirmActionBtn) {
      const betId = confirmActionBtn.dataset.id;
      const action = confirmActionBtn.dataset.action;
      setState({ confirmingBetId: null });
      handleConfirmBet(betId, action);
    }

    if (e.target.closest('.js-cancel-confirm-bet')) {
      setState({ confirmingBetId: null });
    }

    // Resolve Payment
    if (e.target.matches('.resolve-payment-btn')) {
      setState({ confirmingPaymentId: e.target.dataset.id });
    }

    // Confirm Payment
    if (e.target.matches('.confirm-payment-btn')) {
      const { confirmingPaymentId } = getState();
      if (confirmingPaymentId) {
        const betId = confirmingPaymentId;
        setState({ confirmingPaymentId: null });
        handleResolvePayment(betId);
      }
    }

    // Cancel Payment
    if (e.target.matches('.cancel-payment-btn')) {
      setState({ confirmingPaymentId: null });
    }

    // --- Bracket Events ---

    // User pick — step 1: select team
    const pickBtn = e.target.closest('.js-bracket-pick');
    if (pickBtn) {
      const matchupId = pickBtn.dataset.matchup;
      const pick = pickBtn.dataset.pick;
      const isSeries = pickBtn.dataset.series === 'true';
      // Get the team name from the card
      const card = pickBtn.closest('.bracket-matchup');
      const teamNames = card ? card.querySelectorAll('.bracket-team__name') : [];
      const pickedTeam = pick === 'top' ? (teamNames[0]?.textContent || '') : (teamNames[1]?.textContent || '');
      if (isSeries) {
        setState({ bracketPendingPick: { matchupId, pick, pickedTeam } });
      } else {
        stageUserPick(matchupId, pick, null, pickedTeam);
      }
      return;
    }

    // User pick — step 2: select games count
    const gamesPick = e.target.closest('.js-games-pick');
    if (gamesPick) {
      const { bracketPendingPick } = getState();
      const pickedTeam = bracketPendingPick ? bracketPendingPick.pickedTeam || '' : '';
      stageUserPick(gamesPick.dataset.matchup, gamesPick.dataset.pick, gamesPick.dataset.games, pickedTeam);
      return;
    }

    // Cancel pick
    if (e.target.closest('.js-cancel-pick')) {
      setState({ bracketPendingPick: null });
      return;
    }

    // Save all user picks — show confirmation modal
    const savePicksBtn = e.target.closest('.js-bracket-save-picks');
    if (savePicksBtn) {
      setState({ showBracketConfirmModal: true });
      return;
    }

    // Admin set winner — step 1: select team
    const bracketWinnerBtn = e.target.closest('.js-admin-set-winner');
    if (bracketWinnerBtn) {
      const matchupId = bracketWinnerBtn.dataset.matchup;
      const winner = bracketWinnerBtn.dataset.winner;
      const card = bracketWinnerBtn.closest('.bracket-matchup');
      const round = card.dataset.round;
      const isSeries = round !== 'playin';
      if (isSeries) {
        // Show games picker
        setState({ bracketAdminPendingWinner: { matchupId, winner } });
      } else {
        // Play-in: stage directly
        stageAdminChange(matchupId, { winner });
        setState({ bracketAdminPendingWinner: null });
      }
      return;
    }

    // Admin set winner — step 2: select games
    const adminGamesPick = e.target.closest('.js-admin-games-pick');
    if (adminGamesPick) {
      const matchupId = adminGamesPick.dataset.matchup;
      const winner = adminGamesPick.dataset.winner;
      const games = adminGamesPick.dataset.games;
      stageAdminChange(matchupId, { winner, gamesPlayed: games });
      setState({ bracketAdminPendingWinner: null });
      return;
    }

    // Admin cancel winner selection
    if (e.target.closest('.js-admin-cancel-winner')) {
      setState({ bracketAdminPendingWinner: null });
      return;
    }

    // Admin reset winner (stage locally)
    const resetWinnerBtn = e.target.closest('.js-admin-reset-winner');
    if (resetWinnerBtn) {
      const matchupId = resetWinnerBtn.dataset.matchup;
      stageAdminChange(matchupId, { winner: '', gamesPlayed: '' });
      setState({ bracketAdminPendingWinner: null });
      return;
    }

    // Admin: fetch latest standings
    const fetchStandingsBtn = e.target.closest('.js-fetch-standings');
    if (fetchStandingsBtn) {
      fetchAndPopulateStandings();
      return;
    }

    // Admin: team selector option click
    const teamOption = e.target.closest('.js-team-option');
    if (teamOption) {
      const matchupId = teamOption.dataset.matchup;
      const field = teamOption.dataset.field;
      const teamName = teamOption.dataset.team;
      stageAdminChange(matchupId, { [field]: teamName });
      // Close dropdown and update input display
      const selector = teamOption.closest('.team-selector');
      if (selector) {
        const input = selector.querySelector('.team-selector__search');
        if (input) input.value = teamName;
        selector.classList.remove('team-selector--open');
      }
      return;
    }

    // Admin save all changes
    const saveAllBtn = e.target.closest('.js-bracket-save-all');
    if (saveAllBtn) {
      handleAdminSaveAll();
      return;
    }

    // Admin set buy-in
    const buyInBtn = e.target.closest('.js-set-buyin');
    if (buyInBtn) {
      const input = document.getElementById('bracketBuyInInput');
      if (input) {
        handleSetBracketBuyIn(input.value);
      }
      return;
    }

    // Conference tab toggle
    const confTab = e.target.closest('.bracket-tabs__btn');
    if (confTab) {
      setState({ bracketConference: confTab.dataset.bracketConf });
      return;
    }
  };
}

// Bracket modals listener (modals container is outside #app)
document.addEventListener('click', (e) => {
  // Confirm save modal
  if (e.target.closest('.js-bracket-confirm-save')) {
    setState({ showBracketConfirmModal: false });
    handleSaveAllPicks();
    return;
  }
  if (e.target.closest('.js-bracket-cancel-save')) {
    setState({ showBracketConfirmModal: false });
    return;
  }
  // How it works modal
  if (e.target.closest('.js-show-how-it-works')) {
    setState({ showBracketHowModal: true });
    return;
  }
  if (e.target.closest('.js-close-how-modal-btn') || e.target.matches('.js-close-how-modal')) {
    setState({ showBracketHowModal: false });
    return;
  }
  // Close any bracket overlay on backdrop click
  if (e.target.matches('.bracket-confirm-overlay')) {
    setState({ showBracketConfirmModal: false, showBracketHowModal: false });
    return;
  }
});

// Global click listener to close dropdowns
document.addEventListener('click', (e) => {
  const menu = document.getElementById('userDropdownMenu');
  const trigger = document.getElementById('userDropdownTrigger');

  if (menu && menu.classList.contains('active') && trigger && !trigger.contains(e.target)) {
    menu.classList.remove('active');
  }
});

// ==========================================
// STATS BAR SCROLL HIDE
// ==========================================

window.addEventListener('scroll', () => {
  const bar = document.querySelector('.stats-bar');
  if (!bar) return;
  if (window.scrollY > 30) {
    bar.classList.add('stats-bar--hidden');
  } else {
    bar.classList.remove('stats-bar--hidden');
  }
});

// ==========================================
// TOOLTIP
// ==========================================

let tooltipEl = null;
let tooltipTarget = null;
let tooltipHideTimer = null;

function showTooltip(target) {
  const text = target.getAttribute('data-tooltip');
  if (!text) return;
  clearTimeout(tooltipHideTimer);
  if (tooltipTarget === target && tooltipEl) return;
  if (tooltipEl) tooltipEl.remove();
  tooltipTarget = target;

  tooltipEl = document.createElement('div');
  tooltipEl.className = 'bracket-tooltip';
  tooltipEl.textContent = text;
  document.body.appendChild(tooltipEl);

  const rect = target.getBoundingClientRect();
  const tipRect = tooltipEl.getBoundingClientRect();

  let left = rect.left + rect.width / 2 - tipRect.width / 2;
  let top = rect.top - tipRect.height - 8;

  if (left < 8) left = 8;
  if (left + tipRect.width > window.innerWidth - 8) left = window.innerWidth - tipRect.width - 8;
  if (top < 8) {
    top = rect.bottom + 8;
    tooltipEl.classList.add('bracket-tooltip--below');
  }

  tooltipEl.style.left = left + 'px';
  tooltipEl.style.top = top + 'px';
}

function hideTooltip() {
  if (tooltipEl) {
    tooltipEl.remove();
    tooltipEl = null;
  }
  tooltipTarget = null;
}

document.addEventListener('mousemove', (e) => {
  const target = e.target.closest('[data-tooltip]');
  if (target) {
    clearTimeout(tooltipHideTimer);
    if (target !== tooltipTarget) showTooltip(target);
  } else if (tooltipTarget) {
    clearTimeout(tooltipHideTimer);
    tooltipHideTimer = setTimeout(hideTooltip, 50);
  }
});

// ==========================================
// INIT
// ==========================================

async function init() {
  window.addEventListener('popstate', handleRoute);

  const { currentUser } = getState();
  if (currentUser) {
    // Render initial shell with skeleton loader
    app.innerHTML = `
      <div class="nav-overlay" id="navOverlay"></div>
      ${renderMobileNav()}
      ${renderHeader()}
      <main class="main">
        ${renderLoading()}
      </main>
    `;
    attachEventListeners();

    try {
      await refreshData();
      handleRoute(); // Set initial view
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load betting data. Please try again.');
    }
  } else {
    render();
  }
}

init();
