// Google Apps Script Web App URL from environment variables
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

if (!APPS_SCRIPT_URL && import.meta.env.MODE !== 'test') {
  console.error('❌ APPS_SCRIPT_URL is not defined! Check your .env file or build settings.');
}

// Known league members (populated from server, fallback to hardcoded)
export let LEAGUE_MEMBERS = ['Eleodoro', 'Michael', 'Pelos', 'Loukianos', 'Bastian'];

// Storage key for user session
const USER_STORAGE_KEY = 'hd_bets_user';

// Store user session in memory
let currentUser = tryLoadUser();

function tryLoadUser() {
  try {
    const data = localStorage.getItem(USER_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Helper to make API calls with consistent error handling
 */
async function apiCall(paramsObj) {
  if (!APPS_SCRIPT_URL) {
    throw new Error('Backend URL is missing. Please check your VITE_APPS_SCRIPT_URL environment variable.');
  }

  const params = new URLSearchParams(paramsObj);
  const url = `${APPS_SCRIPT_URL}?${params.toString()}`;

  try {
    const response = await fetch(url, { method: 'GET', redirect: 'follow' });

    // Check if the response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Invalid API response:', text.substring(0, 200));
      throw new Error('API returned HTML instead of JSON. Check Apps Script permissions and deployment URL.');
    }

    return await response.json();
  } catch (error) {
    console.error(`API Call failed [${paramsObj.action}]:`, error);
    throw error;
  }
}

/**
 * Get current user
 */
export function getCurrentUser() {
  return currentUser;
}

/**
 * Set current user
 */
export function setCurrentUser(user) {
  currentUser = user;
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

/**
 * Logout
 */
export function logout() {
  setCurrentUser(null);
}

/**
 * Login
 */
export async function login(username, password) {
  const result = await apiCall({
    action: 'login',
    username,
    password
  });

  if (result.success && result.user) {
    const userWithAuth = { ...result.user, password };
    setCurrentUser(userWithAuth);
    return userWithAuth;
  } else {
    throw new Error(result.error || 'Login failed');
  }
}

/**
 * Register
 */
export async function register(username, password) {
  const result = await apiCall({
    action: 'register',
    username,
    password
  });

  if (result.success && result.user) {
    const userWithAuth = { ...result.user, password };
    setCurrentUser(userWithAuth);
    return userWithAuth;
  } else {
    throw new Error(result.error || 'Registration failed');
  }
}

/**
 * Change Password
 */
export async function changePassword(oldPassword, newPassword) {
  if (!currentUser) throw new Error('Not authenticated');

  const result = await apiCall({
    action: 'changePassword',
    username: currentUser.username,
    oldPassword,
    newPassword
  });

  if (result.success) {
    setCurrentUser({ ...currentUser, password: newPassword });
    return true;
  } else {
    throw new Error(result.error || 'Failed to change password');
  }
}

/**
 * Create a new bet
 */
export async function createBet(betData) {
  if (!currentUser) throw new Error('Not authenticated');

  return await apiCall({
    action: 'addBet',
    username: currentUser.username,
    password: currentUser.password,
    better1: betData.better1,
    better2: betData.better2,
    better1Bet: betData.better1Bet,
    better2Bet: betData.better2Bet,
    better1Reward: betData.better1Reward,
    better2Reward: betData.better2Reward
  });
}

/**
 * Fetch bets
 */
export async function fetchBets() {
  if (!currentUser) return [];

  const result = await apiCall({
    action: 'getBets',
    username: currentUser.username,
    password: currentUser.password
  });

  if (result.success && result.data) {
    return parseBetsFromAPI(result.data).reverse();
  } else {
    throw new Error(result.error || 'Failed to fetch bets');
  }
}

/**
 * Fetch users list from the server
 */
export async function fetchUsers() {
  if (!currentUser) return LEAGUE_MEMBERS;

  try {
    const result = await apiCall({
      action: 'getUsers',
      username: currentUser.username,
      password: currentUser.password
    });

    if (result.success && result.data) {
      LEAGUE_MEMBERS = result.data.map(item => {
        if (typeof item === 'object' && item !== null) {
          return item.username || item.name || String(item);
        }
        return String(item);
      }).filter(name => name && name.toLowerCase() !== 'pot');
      return LEAGUE_MEMBERS;
    }
  } catch (e) {
    console.error('Failed to fetch users:', e);
  }
  return LEAGUE_MEMBERS;
}

/**
 * Update bet status
 */
export async function updateBet(betId, winner) {
  if (!currentUser) throw new Error('Not authenticated');

  return await apiCall({
    action: 'updateBet',
    rowId: betId,
    winner,
    username: currentUser.username,
    password: currentUser.password
  });
}

/**
 * Confirm or decline a bet
 */
export async function confirmBet(betId, confirmAction) {
  if (!currentUser) throw new Error('Not authenticated');

  return await apiCall({
    action: 'confirmBet',
    rowId: betId,
    confirmAction,
    username: currentUser.username,
    password: currentUser.password
  });
}

/**
 * Mark a bet as paid
 */
export async function markBetAsPaid(betId) {
  if (!currentUser) throw new Error('Not authenticated');

  return await apiCall({
    action: 'markPaid',
    rowId: betId,
    username: currentUser.username,
    password: currentUser.password
  });
}

// ----------------------------------------------------------------------
// Parsing Logic (Unchanged)
// ----------------------------------------------------------------------

export function parseBetsFromAPI(data) {
  return data.map((row, index) => {
    const better1Reward = parseCurrency(row['Better 1 reward'] || row['Reward 1'] || row['Better1Reward'] || '');
    const better2Reward = parseCurrency(row['Better 2 reward'] || row['Reward 2'] || row['Better2Reward'] || '');
    const rawStatus = row['Status'] || '';
    const winnerLabel = row['Winner'] || row['WinnerLabel'] || '';
    const better1 = row['Better 1'] || row['Better1'] || '';
    const better2 = row['Better 2'] || row['Better2'] || '';

    let status = 'active';
    if (String(rawStatus).toLowerCase() === 'paid') {
      status = 'paid';
    } else if (String(rawStatus).toLowerCase() === 'pending confirmation') {
      status = 'confirming';
    } else if (winnerLabel) {
      status = 'pending';
    }

    const proposerWinner = row['proposerWinner'] || null;
    const proposedWinnerValue = row['proposedWinnerValue'] || null;
    const proposerPaid = row['proposerPaid'] || null;
    const proposedPaidValue = row['proposedPaidValue'] || null;

    let winnerName = row['Winner name'] || row['WinnerName'] || '';
    if (!winnerName && winnerLabel) {
      if (winnerLabel === 'Better 1') winnerName = better1;
      else if (winnerLabel === 'Better 2') winnerName = better2;
    }

    let loserName = row['Loser name'] || row['LoserName'] || '';
    if (!loserName && winnerLabel) {
      if (winnerLabel === 'Better 1') loserName = better2;
      else if (winnerLabel === 'Better 2') loserName = better1;
    }

    const amountWon = parseCurrency(row['Amount won'] || row['AmountWon']) ||
      ((winnerLabel === 'Better 1' || winnerLabel === better1) ? better1Reward :
        ((winnerLabel === 'Better 2' || winnerLabel === better2) ? better2Reward : 0));

    const amountLost = parseCurrency(row['Amount lost'] || row['AmountLost']) ||
      ((winnerLabel === 'Better 1' || winnerLabel === better1) ? better2Reward :
        ((winnerLabel === 'Better 2' || winnerLabel === better2) ? better1Reward : 0));

    return {
      id: row.id !== undefined ? row.id : index,
      date: parseDate(row['Date'] || ''),
      better1,
      better2,
      better1Bet: row['Better 1 bet'] || row['Bet 1'] || row['Better1Bet'] || '',
      better2Bet: row['Better 2 bet'] || row['Bet 2'] || row['Better2Bet'] || '',
      better1Reward,
      better2Reward,
      winnerLabel,
      status,
      winnerName,
      amountWon,
      loserName,
      amountLost,
      proposerWinner,
      proposedWinnerValue,
      proposerPaid,
      proposedPaidValue
    };
  }).filter(bet => bet.better1 && bet.better2);
}

export function parseCurrency(value) {
  if (!value && value !== 0) return 0;
  const strValue = String(value);
  const cleaned = strValue.replace(/[€$,]/g, '').trim();
  return parseFloat(cleaned) || 0;
}

export function parseDate(dateStr) {
  if (!dateStr) return null;
  const strDate = String(dateStr);
  const isoDate = new Date(strDate);
  if (!isNaN(isoDate.getTime())) return isoDate;
  const parts = strDate.split('-');
  if (parts.length === 3 && isNaN(parseInt(parts[1]))) {
    const months = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11 };
    const day = parseInt(parts[0]);
    const month = months[parts[1]];
    const year = parseInt(parts[2]);
    if (!isNaN(day) && month !== undefined && !isNaN(year)) return new Date(year, month, day);
  }
  return null;
}

export function calculateMemberStats(bets) {
  const stats = {};
  bets.forEach(bet => {
    [bet.better1, bet.better2].forEach(name => {
      if (name && name !== 'Pot' && !stats[name]) {
        stats[name] = { name, wins: 0, losses: 0, totalWon: 0, totalLost: 0, activeBets: 0, totalBets: 0, potentialGain: 0 };
      }
    });
  });

  bets.forEach(bet => {
    if (bet.status === 'confirming') return;
    if (stats[bet.better1]) stats[bet.better1].totalBets++;
    if (stats[bet.better2]) stats[bet.better2].totalBets++;
    if (bet.status === 'active') {
      if (stats[bet.better1]) { stats[bet.better1].activeBets++; stats[bet.better1].potentialGain += bet.better1Reward; }
      if (stats[bet.better2]) { stats[bet.better2].activeBets++; stats[bet.better2].potentialGain += bet.better2Reward; }
    } else {
      if (stats[bet.winnerName]) { stats[bet.winnerName].wins++; stats[bet.winnerName].totalWon += bet.amountWon; }
      if (stats[bet.loserName]) { stats[bet.loserName].losses++; stats[bet.loserName].totalLost += bet.amountLost; }
    }
  });

  return Object.values(stats).map(s => ({ ...s, netProfit: s.totalWon - s.totalLost, winRate: s.wins + s.losses > 0 ? Math.round((s.wins / (s.wins + s.losses)) * 100) : 0 })).sort((a, b) => b.netProfit - a.netProfit);
}

export function calculateOverallStats(bets) {
  const officialBets = bets.filter(b => b.status !== 'confirming');
  const activeBets = officialBets.filter(b => b.status === 'active').length;
  const completedBets = officialBets.filter(b => b.status === 'paid').length;
  const pendingBets = bets.filter(b => b.status === 'pending' || b.status === 'confirming').length;
  let totalVolume = 0;
  officialBets.forEach(bet => { totalVolume += (bet.better1Reward || 0) + (bet.better2Reward || 0); });
  return { totalBets: officialBets.length, activeBets, completedBets, pendingBets, totalVolume: totalVolume / 2 };
}
