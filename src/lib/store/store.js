import { getCurrentUser } from '../../api/api.js';

// Initial state
const initialState = {
    currentUser: getCurrentUser(),
    authMode: 'login',
    currentView: 'dashboard',
    dashboardMobileTab: 'overview',
    dataLoaded: false,
    bets: [],
    memberStats: [],
    overallStats: {},
    statusFilter: 'all',
    bettorFilter: 'all',

    // UI State
    showNewBetModal: false,
    isSubmitting: false,
    submitSuccess: false,
    showResolveModal: false,
    resolveBetId: null,
    resolveIsSubmitting: false,
    confirmingResolution: null,
    confirmingPaymentId: null,
    confirmingBetId: null,
    showChangePasswordModal: false,

    // History sort
    historySort: { key: 'date', dir: 'desc' },

    // Bracket State
    bracketMatchups: [],
    bracketPicks: [],
    bracketAllPicks: {}, // { username: [picks] } — all users' picks after lock
    bracketViewingUser: null, // username to view, null = own picks
    bracketScores: [],
    bracketBuyIn: 0,
    bracketLoading: false,
    bracketSaving: false,
    bracketConference: 'all',
    bracketPendingPick: null, // { matchupId, pick } — for games picker UI
    bracketStagedPicks: {}, // { [matchupId]: { pick, games } } — unsaved user picks
    bracketAdminChanges: {}, // { [matchupId]: { teamTop, teamBottom, winner, gamesPlayed } }
    bracketAdminPendingWinner: null, // { matchupId, winner }
    showBetActionModal: null, // bet id to show actions for
    showSettingsModal: false,
    showOnboardingModal: false,
    settingsSaving: false,
    userPaypal: '',
    userEmail: '',
    userAvatar: '',
    allPaypals: {},
    allAvatars: {},
    showBracketConfirmModal: false,
    showBracketHowModal: false,

    // Theme State
    isDarkMode: localStorage.getItem('hd_bets_theme') === 'dark'
};

let state = { ...initialState };
const listeners = new Set();
// To allow selective re-rendering if needed, store keys. For now, simple.

export function getState() {
    return state;
}

export function setState(newState) {
    state = { ...state, ...newState };
    notify();
}

export function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function notify() {
    listeners.forEach(listener => listener(state));
}

// Convenience setters
export function setAuthMode(mode) { setState({ authMode: mode }); }
export function setCurrentView(view) { setState({ currentView: view }); }
export function setBets(bets) { setState({ bets }); }
export function setMemberStats(stats) { setState({ memberStats: stats }); }
export function setOverallStats(stats) { setState({ overallStats: stats }); }
export function setStatusFilter(filter) { setState({ statusFilter: filter }); }
export function setBettorFilter(filter) { setState({ bettorFilter: filter }); }
export function setHistorySort(sort) { setState({ historySort: sort }); }
export function toggleTheme() {
    const newMode = !state.isDarkMode;
    setState({ isDarkMode: newMode });
    localStorage.setItem('hd_bets_theme', newMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
}

// Initialize theme immediately
if (state.isDarkMode) {
    document.documentElement.setAttribute('data-theme', 'dark');
} else {
    document.documentElement.setAttribute('data-theme', 'light');
}

export function getPendingBets() {
    const { bets, currentUser } = state;
    if (!currentUser || !bets) return [];

    return bets.filter(bet => {
        if (bet.better1 !== currentUser.username && bet.better2 !== currentUser.username) return false;

        const isWaitingForPayment = !!bet.winnerLabel && bet.status !== 'paid';
        const isWinner = bet.winnerName === currentUser.username;

        if (isWaitingForPayment) {
            // Loser claimed paid — winner needs to confirm receipt
            if (bet.proposerPaid && bet.proposerPaid !== currentUser.username && isWinner) return true;
            // I lost and haven't marked paid yet
            const loser = bet.winnerName === bet.better1 ? bet.better2 : bet.better1;
            if (loser === currentUser.username && !bet.proposerPaid) return true;
        }
        return false;
    });
}

export function getPendingActionCount() {
    return getPendingBets().length;
}
