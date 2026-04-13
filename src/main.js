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
import { handleNewBetSubmit, handleResolveBet, handleConfirmBet, handleResolvePayment, handleAuthSubmit, handleChangePasswordSubmit, refreshData, stageUserPick, handleSaveAllPicks, stageAdminChange, handleAdminSaveAll, handleSetBracketBuyIn, fetchAndPopulateStandings, refreshBracketData, loadUserSettings, handleSaveSettings, handleOnboardingSave } from './lib/actions/actions.js';

// Views
import { renderDashboardView } from './views/Dashboard/Dashboard.js';
import { renderBracketView, renderBracketSavingOverlay, renderBracketConfirmModal, renderBracketHowModal } from './views/Bracket/Bracket.js';

// Components
import { renderHeader, renderMobileNav, renderStatsBar } from './components/Header/Header.js';
import { renderLoginScreen } from './components/Login/Login.js';
import { renderBetActionModal } from './components/BetTable/BetTable.js';
import { renderNewBetModal, renderChangePasswordModal, renderSettingsModal, renderOnboardingModal } from './components/Modals/Modals.js';
import { renderLoading } from './components/Loader/Loader.js';

const app = document.getElementById('app');

// ==========================================
// RENDER
// ==========================================

function render(target = 'all') {
  const state = getState();
  const { currentView, showNewBetModal, isSubmitting, submitSuccess, showChangePasswordModal, currentUser } = state;

  // If not logged in, show login inside normal layout (except bracket which has its own handling)
  if (!currentUser && currentView !== 'bracket') {
    if (target === 'all' || target === 'app') {
      const BASE = import.meta.env.BASE_URL || '/';
      app.innerHTML = `
        <div class="nav-overlay" id="navOverlay"></div>
        ${renderMobileNav()}
        ${renderHeader()}
        <main class="main">
          ${renderLoginScreen()}
        </main>
        <footer class="footer">
          <div class="footer__inner">
            <div class="footer__top">
              <div class="footer__brand">
                <img src="${BASE}header_logo.png" class="footer__logo" alt="HD Bets" />
                <div>
                  <div class="footer__title">HD Bets!</div>
                  <div class="footer__tagline">Fantasy Basketball Betting League</div>
                </div>
              </div>
              <div class="footer__links">
                <button class="footer__link nav-btn" data-path="/">Bets</button>
                <button class="footer__link nav-btn" data-path="/bracket">Bracket</button>
              </div>
            </div>
            <div class="footer__copy">&copy; ${new Date().getFullYear()} HD Bets. All rights reserved.</div>
          </div>
        </footer>
      `;
      attachEventListeners();
      attachLoginListeners();
    }
    return;
  }

  // Show loader until data is loaded (except bracket which loads its own data)
  if (currentUser && !state.dataLoaded && currentView !== 'bracket') {
    if (target === 'all' || target === 'app') {
      app.innerHTML = `
        <div class="nav-overlay" id="navOverlay"></div>
        ${renderMobileNav()}
        ${renderHeader()}
        <main class="main">
          ${renderLoading()}
        </main>
      `;
      attachEventListeners();
    }
    return;
  }

  let mainContent = '';
  switch (currentView) {
    case 'dashboard':
      mainContent = renderDashboardView();
      break;
    case 'bracket': {
      const { bracketMatchups, bracketLoading } = state;
      const bracketUser = window._bracketLoadedUser;
      const currentUsername = currentUser ? currentUser.username : '_guest';
      if ((!bracketMatchups.length || bracketUser !== currentUsername) && !bracketLoading) {
        window._bracketLoadedUser = currentUsername;
        refreshBracketData();
        if (currentUser && !localStorage.getItem('hd_bracket_seen')) {
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
    const hadFab = !!document.querySelector('.fab');
    app.innerHTML = `
      <div class="nav-overlay" id="navOverlay"></div>
      ${renderMobileNav()}
      ${renderHeader()}
      <main class="main">
        ${mainContent}
      </main>
      ${state.currentUser && (state.currentView === 'dashboard') ? `
        <button class="fab js-new-bet-btn ${hadFab ? 'fab--visible' : ''}" id="newBetFab" aria-label="New Bet">
          <span class="fab__icon">+</span>
          <span class="fab__label">New Bet</span>
        </button>
      ` : ''}
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
              <button class="footer__link nav-btn" data-path="/">Bets</button>
              <button class="footer__link nav-btn" data-path="/bracket">Bracket</button>
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
    const fab = document.getElementById('newBetFab');
    if (fab && !hadFab) {
      requestAnimationFrame(() => fab.classList.add('fab--visible'));
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
      } else if (state.showOnboardingModal) {
        modalsEl.innerHTML = renderOnboardingModal();
      } else if (showChangePasswordModal) {
        modalsEl.innerHTML = renderChangePasswordModal();
      } else if (state.showSettingsModal) {
        modalsEl.innerHTML = renderSettingsModal();
      } else if (state.showBetActionModal) {
        modalsEl.innerHTML = renderBetActionModal();
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

function attachEventListeners() {
  // Login form (if visible)
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.onsubmit = handleAuthSubmit;
  }
  const authLoginBtn = document.getElementById('authLoginBtn');
  const authRegisterBtn = document.getElementById('authRegisterBtn');
  if (authLoginBtn) authLoginBtn.onclick = () => window.setAuthMode('login');
  if (authRegisterBtn) authRegisterBtn.onclick = () => window.setAuthMode('register');

  // Navigation
  document.querySelectorAll('[data-path]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const el = e.target.closest('[data-path]');
      const path = el.dataset.path;
      // Close mobile nav if open
      const nav = document.getElementById('mainNav');
      if (nav && nav.classList.contains('active')) {
        nav.classList.remove('active');
        const hamburger = document.getElementById('hamburgerBtn');
        if (hamburger) hamburger.innerHTML = '☰';
      }
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
  function closeMobileNav() {
    const nav = document.getElementById('mainNav');
    const btn = document.getElementById('hamburgerBtn');
    if (nav) nav.classList.remove('active');
    if (btn) btn.innerHTML = '☰';
  }

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
    const closeNavBtn = document.getElementById('closeNavBtn');
    if (closeNavBtn) closeNavBtn.onclick = toggleMenu;
  }

  // Filters
  document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = e.target.dataset.filter;
      setStatusFilter(filter);
    });
  });


  document.querySelectorAll('.js-show-my-bets').forEach(btn => {
    btn.addEventListener('click', () => {
      const { currentUser } = getState();
      if (currentUser) setBettorFilter(currentUser.username);
    });
  });

  document.querySelectorAll('.js-show-all-bets').forEach(btn => {
    btn.addEventListener('click', () => {
      setBettorFilter('all');
    });
  });

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

  document.querySelectorAll('.js-settings-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setState({ showSettingsModal: true });
    });
  });

  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
  const settingsOverlay = document.getElementById('settingsModalOverlay');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');

  if (closeSettingsBtn) closeSettingsBtn.onclick = () => setState({ showSettingsModal: false });
  if (cancelSettingsBtn) cancelSettingsBtn.onclick = () => setState({ showSettingsModal: false });
  if (settingsOverlay) settingsOverlay.onclick = (e) => { if (e.target === settingsOverlay) setState({ showSettingsModal: false }); };
  if (saveSettingsBtn) saveSettingsBtn.onclick = async () => {
    const paypalInput = document.getElementById('paypalInput');
    const emailInput = document.getElementById('emailInput');
    const avatarInput = document.getElementById('avatarInput');
    const nameInput = document.getElementById('displayNameInput');
    const values = {
      paypal: paypalInput ? paypalInput.value.trim() : undefined,
      email: emailInput ? emailInput.value.trim() : undefined,
      avatar: avatarInput ? avatarInput.value.trim() : undefined
    };
    const newName = nameInput ? nameInput.value.trim() : '';
    saveSettingsBtn.disabled = true;
    saveSettingsBtn.textContent = 'Saving...';
    if (cancelSettingsBtn) cancelSettingsBtn.disabled = true;

    // Update name if changed
    const { currentUser: cu } = getState();
    if (newName && cu && newName !== cu.username) {
      try {
        const { updateDisplayName } = await import('./api/api.js');
        await updateDisplayName(newName);
        setState({ currentUser: { ...cu, username: newName } });
      } catch (err) {
        alert('Failed to update name: ' + err.message);
        saveSettingsBtn.disabled = false;
        saveSettingsBtn.textContent = 'Save';
        if (cancelSettingsBtn) cancelSettingsBtn.disabled = false;
        return;
      }
    }
    handleSaveSettings(values);
  };

  document.querySelectorAll('.js-theme-toggle').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });


  const toastViewBtn = document.getElementById('toastViewBtn');
  if (toastViewBtn) toastViewBtn.onclick = () => {
    const { currentUser } = getState();
    if (currentUser) setBettorFilter(currentUser.username);
    navigateTo('/');
  };

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

// User select dropdowns (open/close/select)
document.addEventListener('click', (e) => {
  // Toggle open
  const trigger = e.target.closest('.user-select__trigger');
  if (trigger) {
    const select = trigger.closest('.user-select');
    // Close all other open selects
    document.querySelectorAll('.user-select--open').forEach(s => {
      if (s !== select) s.classList.remove('user-select--open');
    });
    select.classList.toggle('user-select--open');
    return;
  }

  // Bettor filter select
  const bettorOption = e.target.closest('.js-bettor-select-option');
  if (bettorOption) {
    setBettorFilter(bettorOption.dataset.value);
    bettorOption.closest('.user-select').classList.remove('user-select--open');
    return;
  }

  // New bet opponent select
  const userOption = e.target.closest('.js-user-select-option');
  if (userOption) {
    const value = userOption.dataset.value;
    const hiddenInput = document.getElementById(userOption.dataset.target);
    const triggerEl = userOption.closest('.user-select').querySelector('.user-select__trigger');
    if (hiddenInput) hiddenInput.value = value;
    if (triggerEl) {
      triggerEl.innerHTML = userOption.innerHTML;
    }
    userOption.closest('.user-select').classList.remove('user-select--open');
    return;
  }

  // Close all selects on outside click
  document.querySelectorAll('.user-select--open').forEach(s => s.classList.remove('user-select--open'));
});

// Close team selectors when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.team-selector')) {
    document.querySelectorAll('.team-selector--open').forEach(s => s.classList.remove('team-selector--open'));
  }
});

// Global Delegated Listeners (attached once)
if (app) {
  app.onclick = (e) => {
    // Dashboard mobile tabs
    const dashTab = e.target.closest('[data-dash-tab]');
    if (dashTab) {
      const tab = dashTab.dataset.dashTab;
      // Silent state update — avoid full re-render, just swap DOM
      getState().dashboardMobileTab = tab;
      document.querySelectorAll('.dash-tabs__btn').forEach(b => b.classList.remove('dash-tabs__btn--active'));
      dashTab.classList.add('dash-tabs__btn--active');
      const layout = document.querySelector('.dashboard-layout');
      if (layout) layout.dataset.dashActive = tab;
      return;
    }

    // Open bet action modal
    const openBetAction = e.target.closest('.js-open-bet-action');
    if (openBetAction) {
      setState({ showBetActionModal: openBetAction.dataset.betId });
      return;
    }

    // Export CSV
    const exportBtn = e.target.closest('.js-export-csv') || e.target.closest('.js-export-csv-trigger');
    if (exportBtn) {
      const { bets: allBets, statusFilter: sf, bettorFilter: bf } = getState();
      let filtered = [...allBets];
      if (sf !== 'all') {
        if (sf === 'pending') filtered = filtered.filter(b => b.status === 'pending' || b.status === 'confirming');
        else filtered = filtered.filter(b => b.status === sf);
      }
      if (bf !== 'all') filtered = filtered.filter(b => b.better1 === bf || b.better2 === bf);
      const headers = ['Date','Better 1','Better 2','Bet 1','Bet 2','Stake 1','Stake 2','Winner','Status'];
      const rows = filtered.map(b => [
        b.date ? new Date(b.date).toLocaleDateString('en-GB') : '',
        b.better1, b.better2, b.better1Bet, b.better2Bet,
        b.better1Reward, b.better2Reward, b.winnerName || '', b.status
      ].map(v => { const s = String(v||''); return s.includes(',') || s.includes('"') ? '"'+s.replace(/"/g,'""')+'"' : s; }).join(','));
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hd-bets.csv';
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // Leaderboard Click
    const leaderboardItem = e.target.closest('.leaderboard__item');
    if (leaderboardItem) {
      setStatusFilter('all');
      setBettorFilter(leaderboardItem.dataset.bettor);
      navigateTo('/');
      return;
    }

    // Pick Winner — select card inline
    const pickWinnerBtn = e.target.closest('.js-pick-winner');
    if (pickWinnerBtn) {
      const allPicks = document.querySelectorAll('.js-pick-winner');
      allPicks.forEach(p => p.classList.remove('bet-modal__pick--selected'));
      pickWinnerBtn.classList.add('bet-modal__pick--selected');
      const bar = document.getElementById('winnerConfirmBar');
      const nameEl = document.getElementById('winnerConfirmName');
      const confirmBtn = document.getElementById('confirmResolveBtn');
      if (bar && nameEl && confirmBtn) {
        nameEl.textContent = pickWinnerBtn.dataset.name;
        confirmBtn.dataset.id = pickWinnerBtn.dataset.id;
        confirmBtn.dataset.winner = pickWinnerBtn.dataset.winner;
        bar.style.display = '';
      }
    }

    // Confirm Resolution
    if (e.target.closest('.confirm-resolve-btn')) {
      const btn = e.target.closest('.confirm-resolve-btn');
      const betId = btn.dataset.id;
      const winner = btn.dataset.winner;
      if (betId && winner) {
        setState({ resolveBetId: betId, showBetActionModal: null });
        handleResolveBet(winner);
      }
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

    // --- Bracket View Other User ---
    const viewBracketBtn = e.target.closest('[data-view-bracket]');
    if (viewBracketBtn) {
      const username = viewBracketBtn.dataset.viewBracket;
      setState({ bracketViewingUser: username });
      return;
    }

    if (e.target.closest('.js-bracket-view-own')) {
      setState({ bracketViewingUser: null });
      return;
    }

    // Edit picks — load saved picks into staged so they become editable
    if (e.target.closest('.js-bracket-edit-picks')) {
      const { bracketPicks } = getState();
      const staged = {};
      bracketPicks.forEach(p => {
        staged[p.matchupId] = { pick: p.pick, games: p.games, pickedTeam: p.pickedTeam };
      });
      setState({ bracketStagedPicks: staged, bracketPicks: [] });
      return;
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

// Bet action modal listener (modals container is outside #app)
document.addEventListener('click', (e) => {
  // Close modal
  if (e.target.closest('.js-close-bet-modal-btn')) {
    setState({ showBetActionModal: null });
    return;
  }
  if (e.target.classList.contains('js-close-bet-modal')) {
    setState({ showBetActionModal: null });
    return;
  }

  // Confirm bet (accept/decline)
  const confirmBetAction = e.target.closest('.js-confirm-bet-action');
  if (confirmBetAction) {
    const betId = confirmBetAction.dataset.id;
    const action = confirmBetAction.dataset.action;
    setState({ confirmingBetId: null, showBetActionModal: null });
    handleConfirmBet(betId, action);
    return;
  }

  // Start confirm bet
  const startConfirm = e.target.closest('.js-start-confirm-bet');
  if (startConfirm) {
    setState({ confirmingBetId: startConfirm.dataset.id });
    return;
  }

  // Cancel confirm bet
  if (e.target.closest('.js-cancel-confirm-bet')) {
    setState({ confirmingBetId: null });
    return;
  }

  // Pick Winner — select card inline
  const pickWinnerBtn = e.target.closest('.js-pick-winner');
  if (pickWinnerBtn) {
    const allPicks = document.querySelectorAll('.js-pick-winner');
    allPicks.forEach(p => p.classList.remove('bet-modal__pick--selected'));
    pickWinnerBtn.classList.add('bet-modal__pick--selected');
    const bar = document.getElementById('winnerConfirmBar');
    const nameEl = document.getElementById('winnerConfirmName');
    const confirmBtn = document.getElementById('confirmResolveBtn');
    if (bar && nameEl && confirmBtn) {
      nameEl.textContent = pickWinnerBtn.dataset.name;
      confirmBtn.dataset.id = pickWinnerBtn.dataset.id;
      confirmBtn.dataset.winner = pickWinnerBtn.dataset.winner;
      bar.style.display = '';
    }
    return;
  }

  // Confirm resolution
  if (e.target.closest('.confirm-resolve-btn')) {
    const btn = e.target.closest('.confirm-resolve-btn');
    const betId = btn.dataset.id;
    const winner = btn.dataset.winner;
    if (betId && winner) {
      setState({ resolveBetId: betId, showBetActionModal: null });
      handleResolveBet(winner);
    }
    return;
  }

  // Resolve payment — directly call API
  if (e.target.matches('.resolve-payment-btn')) {
    const betId = e.target.dataset.id;
    setState({ showBetActionModal: null });
    handleResolvePayment(betId);
    return;
  }
});

// Onboarding modal save
document.addEventListener('click', (e) => {
  if (e.target.id === 'closeOnboardingBtn') {
    setState({ showOnboardingModal: false });
    return;
  }
  if (e.target.id === 'onboardSaveBtn') {
    const name = document.getElementById('onboardName')?.value.trim();
    const paypal = document.getElementById('onboardPaypal')?.value.trim();
    const avatar = document.getElementById('onboardAvatar')?.value.trim();
    e.target.disabled = true;
    e.target.textContent = 'Saving...';
    handleOnboardingSave(name, paypal, avatar);
    return;
  }
});

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
  if (e.target.closest('.js-close-how-modal-btn')) {
    setState({ showBracketHowModal: false });
    return;
  }
  // Close any bracket overlay on backdrop click
  if (e.target.matches('.app-modal-overlay')) {
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
// BRACKET COUNTDOWN TIMER
// ==========================================

setInterval(() => {
  const el = document.getElementById('bracketCountdown');
  if (!el) return;
  const target = new Date(el.dataset.target);
  const now = new Date();
  if (now >= target) { el.closest('.bracket-countdown')?.remove(); return; }
  const diff = target - now;
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);
  const nums = el.querySelectorAll('.bracket-countdown__num');
  if (nums.length === 4) {
    nums[0].textContent = d;
    nums[1].textContent = String(h).padStart(2, '0');
    nums[2].textContent = String(m).padStart(2, '0');
    nums[3].textContent = String(s).padStart(2, '0');
  }

  // Confirm modal countdown
  const confirmEl = document.getElementById('confirmCountdown');
  if (confirmEl) {
    const ct = new Date(confirmEl.dataset.target);
    const cd = ct - now;
    if (cd <= 0) { confirmEl.textContent = 'Picks are now locked!'; return; }
    const cd_d = Math.floor(cd / (1000 * 60 * 60 * 24));
    const cd_h = Math.floor((cd / (1000 * 60 * 60)) % 24);
    const cd_m = Math.floor((cd / (1000 * 60)) % 60);
    const cd_s = Math.floor((cd / 1000) % 60);
    confirmEl.textContent = (cd_d > 0 ? cd_d + 'd ' : '') + String(cd_h).padStart(2, '0') + 'h ' + String(cd_m).padStart(2, '0') + 'm ' + String(cd_s).padStart(2, '0') + 's remaining';
  }
}, 1000);

// ==========================================
// PROFILE HOVER CARD
// ==========================================

let profileCardEl = null;
let profileCardTarget = null;
let profileHideTimer = null;

document.addEventListener('mousemove', (e) => {
  const tag = e.target.closest('.user-tag');
  if (tag && !tag.closest('.user-select__dropdown') && !tag.closest('.user-select__trigger') && !tag.classList.contains('user-tag--nav')) {
    clearTimeout(profileHideTimer);
    if (tag === profileCardTarget) return;
    profileCardTarget = tag;

    if (profileCardEl) profileCardEl.remove();

    const name = tag.dataset.profileName || '';
    if (!name) { profileCardTarget = null; return; }
    const avatar = tag.dataset.profileAvatar || '';
    const paypal = tag.dataset.profilePaypal || '';
    const net = tag.dataset.profileNet || '';
    const record = tag.dataset.profileRecord || '';
    const color = tag.style.getPropertyValue('--tag-color') || tag.style.background;

    profileCardEl = document.createElement('div');
    profileCardEl.className = 'profile-card';
    profileCardEl.innerHTML = `
      <div class="profile-card__header">
        ${avatar ? `<img class="profile-card__avatar" src="${avatar}" />` : `<div class="profile-card__initial" style="background:${color}">${name.charAt(0)}</div>`}
        <div class="profile-card__name">${name}</div>
      </div>
      <div class="profile-card__details">
        ${record ? `<div class="profile-card__detail"><span class="profile-card__detail-icon">&#127942;</span>${record}</div>` : ''}
        ${paypal ? `<div class="profile-card__detail"><span class="profile-card__detail-icon">&#128179;</span>${paypal}</div>` : ''}
      </div>
      ${net ? `<div class="profile-card__net ${net.startsWith('+') ? 'profile-card__net--positive' : 'profile-card__net--negative'}">${net}</div>` : ''}
    `;
    document.body.appendChild(profileCardEl);

    const rect = tag.getBoundingClientRect();
    const cardRect = profileCardEl.getBoundingClientRect();
    let left = rect.left;
    let top = rect.bottom + 6;
    if (left + cardRect.width > window.innerWidth - 8) left = window.innerWidth - cardRect.width - 8;
    if (top + cardRect.height > window.innerHeight - 8) top = rect.top - cardRect.height - 6;
    profileCardEl.style.left = left + 'px';
    profileCardEl.style.top = top + 'px';
  } else if (profileCardTarget) {
    clearTimeout(profileHideTimer);
    profileHideTimer = setTimeout(() => {
      if (profileCardEl) profileCardEl.remove();
      profileCardEl = null;
      profileCardTarget = null;
    }, 100);
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
      await Promise.all([refreshData(), loadUserSettings()]);
      handleRoute(); // Set initial view
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load betting data. Please try again.');
    }
  } else {
    handleRoute();
    render();
  }
}

init();
