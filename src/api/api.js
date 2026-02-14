// Google Apps Script Web App URL from environment variables
// IMPORTANT: Add VITE_APPS_SCRIPT_URL to your .env file
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

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
 * Fetch users list from the server
 */
export async function fetchUsers() {
  if (!currentUser) return LEAGUE_MEMBERS;

  const params = new URLSearchParams({
    action: 'getUsers',
    username: currentUser.username,
    password: currentUser.password
  });

  try {
    const url = `${APPS_SCRIPT_URL}?${params.toString()}`;
    const response = await fetch(url, { method: 'GET', redirect: 'follow' });
    const result = await response.json();

    if (result.success && result.data) {
      // Ensure we only have an array of strings (usernames)
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
 * Confirm or decline a bet
 */
export async function confirmBet(betId, confirmAction) {
  if (!currentUser) throw new Error('Not authenticated');

  const params = new URLSearchParams({
    action: 'confirmBet',
    rowId: betId,
    confirmAction: confirmAction, // 'confirm' or 'decline'
    username: currentUser.username,
    password: currentUser.password
  });

  const url = `${APPS_SCRIPT_URL}?${params.toString()}`;
  const response = await fetch(url, { method: 'GET', redirect: 'follow' });
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to ' + confirmAction + ' bet');
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

export function parseBetsFromAPI(data) {
  return data.map((row, index) => {
    // Keys might be from headers (with spaces) or hardcoded in Code.gs (CamelCase)
    // We check both.

    // Rewards
    const better1Reward = parseCurrency(
      row['Better 1 reward'] || row['Reward 1'] || row['Better1Reward'] || ''
    );
    const better2Reward = parseCurrency(
      row['Better 2 reward'] || row['Reward 2'] || row['Better2Reward'] || ''
    );

    const rawStatus = row['Status'] || '';
    // Winner Label (Better 1 / Better 2)
    const winnerLabel = row['Winner'] || row['WinnerLabel'] || '';

    const better1 = row['Better 1'] || row['Better1'] || '';
    const better2 = row['Better 2'] || row['Better2'] || '';

    // Determine Logic Status
    let status = 'active';
    if (String(rawStatus).toLowerCase() === 'paid') {
      status = 'paid';
    } else if (String(rawStatus).toLowerCase() === 'pending confirmation') {
      status = 'confirming';
    } else if (winnerLabel) {
      status = 'pending'; // Winner determined, but not paid
    }

    // New Proposal Fields
    const proposerWinner = row['proposerWinner'] || null;
    const proposedWinnerValue = row['proposedWinnerValue'] || null;
    const proposerPaid = row['proposerPaid'] || null;
    const proposedPaidValue = row['proposedPaidValue'] || null;

    // Winner Name Logic
    let winnerName = row['Winner name'] || row['WinnerName'] || '';
    if (!winnerName && winnerLabel) {
      if (winnerLabel === 'Better 1') winnerName = better1;
      else if (winnerLabel === 'Better 2') winnerName = better2;
    }

    // Loser Name Logic
    let loserName = row['Loser name'] || row['LoserName'] || '';
    if (!loserName && winnerLabel) {
      if (winnerLabel === 'Better 1') loserName = better2;
      else if (winnerLabel === 'Better 2') loserName = better1;
    }

    // Amount Logic
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
      winnerLabel, // Store the raw label 'Better 1' etc
      status,
      winnerName,
      amountWon,
      loserName,
      amountLost,

      // Proposals
      proposerWinner,
      proposedWinnerValue,
      proposerPaid,
      proposedPaidValue
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
    if (bet.status === 'confirming') return; // Skip these bets for stats calculation

    // Increment totalBets for official bets
    if (stats[bet.better1]) stats[bet.better1].totalBets++;
    if (stats[bet.better2]) stats[bet.better2].totalBets++;

    if (bet.status === 'active') {
      if (stats[bet.better1]) {
        stats[bet.better1].activeBets++;
        stats[bet.better1].potentialGain += bet.better1Reward || 0;
      }
      if (stats[bet.better2]) {
        stats[bet.better2].activeBets++;
        stats[bet.better2].potentialGain += bet.better2Reward || 0;
      }
    } else if (bet.status === 'pending' || bet.status === 'paid') {
      const winner = bet.winnerName;
      const loser = bet.loserName;

      if (stats[winner]) {
        stats[winner].wins++;
        stats[winner].totalWon += bet.amountWon || 0;
      }
      if (stats[loser]) {
        stats[loser].losses++;
        stats[loser].totalLost += bet.amountLost || 0;
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
  const officialBets = bets.filter(b => b.status !== 'confirming');

  const activeBets = officialBets.filter(b => b.status === 'active').length;
  const completedBets = officialBets.filter(b => b.status === 'paid').length;
  // 'Pending' now includes both unpaid official bets AND unconfirmed proposals
  const pendingBets = bets.filter(b => b.status === 'pending' || b.status === 'confirming').length;

  let totalVolume = 0;
  officialBets.forEach(bet => {
    totalVolume += (bet.better1Reward || 0) + (bet.better2Reward || 0);
  });

  return {
    totalBets: officialBets.length,
    activeBets,
    completedBets,
    pendingBets,
    totalVolume: totalVolume / 2
  };
}
