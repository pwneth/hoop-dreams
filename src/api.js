// Google Apps Script Web App URL
// IMPORTANT: Replace this URL after deploying the Apps Script
// See /google-apps-script/Code.gs for deployment instructions
// NOTE: You MUST deploy the new version of Code.gs for this to work!
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwyzOPbVaV-J2bPMEItv-FqrCtUBav2h48dUT3-qk7dqQG8126C2UM0Rgf5MthBvqYQ/exec';

// Known league members (for dropdowns)
export const LEAGUE_MEMBERS = ['Eleodoro', 'Michael', 'Pelos', 'Loukianos', 'Bastian'];

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
    // Store username and password (hashed/raw) locally for persistent login
    // In a real app, we'd store a token. Here we store the credentials 
    // to send with every request since GAS is stateless.
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
  try {
    const params = new URLSearchParams({
      action: 'login',
      username: username,
      password: password
    });

    const url = `${APPS_SCRIPT_URL}?${params.toString()}`;
    const response = await fetch(url, { method: 'GET', redirect: 'follow' });
    const result = await response.json();

    if (result.success && result.user) {
      // Store the password in the user object for future requests
      // This is necessary because the stateless API needs auth data for every write operation
      const userWithAuth = {
        ...result.user, // username, isAdmin
        password: password
      };
      setCurrentUser(userWithAuth);
      return userWithAuth;
    } else {
      throw new Error(result.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Register
 */
export async function register(username, password) {
  try {
    const params = new URLSearchParams({
      action: 'register',
      username: username,
      password: password
    });

    const url = `${APPS_SCRIPT_URL}?${params.toString()}`;
    const response = await fetch(url, { method: 'GET', redirect: 'follow' });
    const result = await response.json();

    if (result.success && result.user) {
      const userWithAuth = {
        ...result.user,
        password: password
      };
      setCurrentUser(userWithAuth);
      return userWithAuth;
    } else {
      throw new Error(result.error || 'Registration failed');
    }
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

/**
 * Change Password
 */
export async function changePassword(oldPassword, newPassword) {
  if (!currentUser) throw new Error('Not authenticated');

  try {
    const params = new URLSearchParams({
      action: 'changePassword',
      username: currentUser.username,
      oldPassword: oldPassword,
      newPassword: newPassword
    });

    const url = `${APPS_SCRIPT_URL}?${params.toString()}`;
    const response = await fetch(url, { method: 'GET', redirect: 'follow' });
    const result = await response.json();

    if (result.success) {
      // Update local storage with new password
      const updatedUser = { ...currentUser, password: newPassword };
      setCurrentUser(updatedUser);
      return true;
    } else {
      throw new Error(result.error || 'Failed to change password');
    }
  } catch (error) {
    console.error('Change password error:', error);
    throw error;
  }
}

/**
 * Create a new bet
 */
export async function createBet(betData) {
  if (!currentUser) throw new Error('Not authenticated');

  const params = new URLSearchParams({
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

  const url = `${APPS_SCRIPT_URL}?${params.toString()}`;
  const response = await fetch(url, { method: 'GET', redirect: 'follow' });
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to create bet');
  }
  return result;
}

/**
 * Fetch bets (now public read, but API structure might require params? No, doGet defaults to getBets)
 */
export async function fetchBets() {
  // We can fetch bets without auth if we want, but let's pass it if available
  // Actually, doGet requires auth in my new script?
  // "const user = authenticate..." is only for modify actions or if I strictly protected read.
  // In `handleRequest`: `if (action === 'getBets') return getBets(sheet);`
  // But before that: `const user = authenticate...`
  // Wait, I put `authenticate` check BEFORE `getBets`.
  // So READ IS PROTECTED.
  // I need to pass creds.

  if (!currentUser) return []; // Or throw error? Let's return empty if not logged in

  const params = new URLSearchParams({
    action: 'getBets',
    username: currentUser.username,
    password: currentUser.password
  });

  const url = `${APPS_SCRIPT_URL}?${params.toString()}`;
  const response = await fetch(url, { method: 'GET', redirect: 'follow' });
  const result = await response.json();

  if (result.success && result.data) {
    return parseBetsFromAPI(result.data).reverse();
  } else {
    throw new Error(result.error || 'Failed to fetch bets');
  }
}


/**
 * Update bet status
 */
export async function updateBet(betId, winner) {
  if (!currentUser) throw new Error('Not authenticated');

  const params = new URLSearchParams({
    action: 'updateBet',
    rowId: betId,
    winner: winner,
    username: currentUser.username,
    password: currentUser.password
  });

  const url = `${APPS_SCRIPT_URL}?${params.toString()}`;
  const response = await fetch(url, { method: 'GET', redirect: 'follow' });
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to update bet');
  }
  return result;
}

/**
 * Mark a bet as paid
 */
export async function markBetAsPaid(betId) {
  if (!currentUser) throw new Error('Not authenticated');

  const params = new URLSearchParams({
    action: 'markPaid',
    rowId: betId,
    username: currentUser.username,
    password: currentUser.password
  });

  const url = `${APPS_SCRIPT_URL}?${params.toString()}`;
  const response = await fetch(url, { method: 'GET', redirect: 'follow' });
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to mark bet as paid');
  }
  return result;
}

// ----------------------------------------------------------------------
// Parsing Logic (Unchanged)
// ----------------------------------------------------------------------

function parseBetsFromAPI(data) {
  return data.map((row, index) => {
    // Column names from the sheet (note lowercase 'bet', 'reward', etc.)
    const better1Reward = parseCurrency(row['Better 1 reward'] || row['Reward 1'] || '');
    const better2Reward = parseCurrency(row['Better 2 reward'] || row['Reward 2'] || '');

    const rawStatus = row['Status'] || '';
    const winner = row['Winner'] || '';

    let status = 'active';

    if (String(rawStatus).toLowerCase() === 'paid') {
      status = 'paid';
    } else if (winner) {
      status = 'pending';
    }

    return {
      id: index,
      date: parseDate(row['Date'] || ''),
      better1: row['Better 1'] || '',
      better2: row['Better 2'] || '',
      better1Bet: row['Better 1 bet'] || row['Bet 1'] || '',
      better2Bet: row['Better 2 bet'] || row['Bet 2'] || '',
      better1Reward,
      better2Reward,
      winner,
      status,
      winnerName: row['Winner name'] || row['Winner'] || '',
      amountWon: parseCurrency(row['Amount won'] || ''),
      loserName: row['Loser name'] || '',
      amountLost: parseCurrency(row['Amount lost'] || '')
    };
  }).filter(bet => bet.better1 && bet.better2);
}

const COLUMNS = {
  DATE: 0,
  BETTER_1: 1,
  BETTER_2: 2,
  BETTER_1_BET: 3,
  BETTER_2_BET: 4,
  BETTER_1_REWARD: 5,
  BETTER_2_REWARD: 6,
  WINNER: 7,
  STATUS: 8,
  WINNER_NAME: 9,
  AMOUNT_WON: 10,
  LOSER_NAME: 11,
  AMOUNT_LOST: 12
};

function parseCurrency(value) {
  if (!value && value !== 0) return 0;
  const strValue = String(value);
  const cleaned = strValue.replace(/[€$,]/g, '').trim();
  return parseFloat(cleaned) || 0;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const strDate = String(dateStr);
  const isoDate = new Date(strDate);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }
  const parts = strDate.split('-');
  if (parts.length === 3 && isNaN(parseInt(parts[1]))) {
    const months = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    const day = parseInt(parts[0]);
    const month = months[parts[1]];
    const year = parseInt(parts[2]);

    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  return null;
}

export function calculateMemberStats(bets) {
  const stats = {};
  bets.forEach(bet => {
    [bet.better1, bet.better2].forEach(name => {
      if (name && name !== 'Pot') {
        if (!stats[name]) {
          stats[name] = {
            name,
            wins: 0,
            losses: 0,
            totalWon: 0,
            totalLost: 0,
            activeBets: 0,
            totalBets: 0,
            potentialGain: 0
          };
        }
      }
    });
  });

  bets.forEach(bet => {
    if (bet.status === 'active') {
      if (stats[bet.better1]) {
        stats[bet.better1].activeBets++;
        stats[bet.better1].potentialGain += bet.better1Reward || 0;
      }
      if (stats[bet.better2]) {
        stats[bet.better2].activeBets++;
        stats[bet.better2].potentialGain += bet.better2Reward || 0;
      }
    }

    if (stats[bet.better1]) stats[bet.better1].totalBets++;
    if (stats[bet.better2]) stats[bet.better2].totalBets++;

    if ((bet.status === 'paid' || bet.status === 'pending') && bet.winnerName && bet.loserName) {
      if (stats[bet.winnerName]) {
        stats[bet.winnerName].wins++;
        stats[bet.winnerName].totalWon += bet.amountWon;
      }
      if (stats[bet.loserName]) {
        stats[bet.loserName].losses++;
        stats[bet.loserName].totalLost += bet.amountLost;
      }
    }
  });

  return Object.values(stats)
    .map(s => ({
      ...s,
      netProfit: s.totalWon - s.totalLost,
      winRate: s.wins + s.losses > 0
        ? Math.round((s.wins / (s.wins + s.losses)) * 100)
        : 0
    }))
    .sort((a, b) => b.netProfit - a.netProfit);
}

export function calculateOverallStats(bets) {
  const activeBets = bets.filter(b => b.status === 'active').length;
  const completedBets = bets.filter(b => b.status === 'paid').length;
  const pendingBets = bets.filter(b => b.status === 'pending').length;

  let totalVolume = 0;
  bets.forEach(bet => {
    totalVolume += bet.better1Reward + bet.better2Reward;
  });

  return {
    totalBets: bets.length,
    activeBets,
    completedBets,
    pendingBets,
    totalVolume: totalVolume / 2
  };
}
