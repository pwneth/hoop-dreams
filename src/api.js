// Google Apps Script Web App URL
// IMPORTANT: Replace this URL after deploying the Apps Script
// See /google-apps-script/Code.gs for deployment instructions
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbymbwZ6O1TC9JwqS561ryv3u1uAYSglllRfySUEGrExEtD37nzAklV50Bq5IQk_NPuu/exec';

// Known league members
export const LEAGUE_MEMBERS = ['Eleodoro', 'Michael', 'Pelos', 'Loukianos', 'Bastian'];

// Storage key for password
const PASSWORD_STORAGE_KEY = 'hoop_dreams_auth';

// Store password - load from localStorage on init
let currentPassword = localStorage.getItem(PASSWORD_STORAGE_KEY) || '';

/**
 * Set the current password for API requests (and persist to localStorage)
 */
export function setPassword(password) {
  currentPassword = password;
  if (password) {
    localStorage.setItem(PASSWORD_STORAGE_KEY, password);
  } else {
    localStorage.removeItem(PASSWORD_STORAGE_KEY);
  }
}

/**
 * Get current password
 */
export function getPassword() {
  return currentPassword;
}

/**
 * Verify password with Apps Script
 */
export async function verifyPassword(password) {
  try {
    const params = new URLSearchParams({
      action: 'verify',
      password: password
    });

    const url = `${APPS_SCRIPT_URL}?${params.toString()}`;
    const response = await fetch(url, { method: 'GET', redirect: 'follow' });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        setPassword(password); // Use setPassword to persist to localStorage
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Create a new bet via Apps Script (requires password)
 */
export async function createBet(betData) {
  if (!currentPassword) {
    throw new Error('Not authenticated');
  }

  try {
    const params = new URLSearchParams({
      action: 'addBet',
      password: currentPassword,
      better1: betData.better1,
      better2: betData.better2,
      better1Bet: betData.better1Bet,
      better2Bet: betData.better2Bet,
      better1Reward: betData.better1Reward.toString(),
      better2Reward: betData.better2Reward.toString()
    });

    const url = `${APPS_SCRIPT_URL}?${params.toString()}`;
    const response = await fetch(url, { method: 'GET', redirect: 'follow' });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error || 'Failed to create bet');
      }
    } else {
      throw new Error('Network error');
    }
  } catch (error) {
    console.error('Error creating bet:', error);
    throw error;
  }
}

/**
 * Fetch bets from Apps Script (requires password)
 */
export async function fetchBets() {
  if (!currentPassword) {
    throw new Error('Not authenticated');
  }

  try {
    const params = new URLSearchParams({
      password: currentPassword
    });

    const url = `${APPS_SCRIPT_URL}?${params.toString()}`;
    const response = await fetch(url, { method: 'GET', redirect: 'follow' });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        return parseBetsFromAPI(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch bets');
      }
    } else {
      throw new Error('Network error');
    }
  } catch (error) {
    console.error('Error fetching bets:', error);
    throw error;
  }
}

/**
 * Parse bets from API response
 */
function parseBetsFromAPI(data) {
  return data.map((row, index) => {
    // Column names from the sheet (note lowercase 'bet', 'reward', etc.)
    const better1Reward = parseCurrency(row['Better 1 reward'] || row['Reward 1'] || '');
    const better2Reward = parseCurrency(row['Better 2 reward'] || row['Reward 2'] || '');

    const rawStatus = row['Status'] || '';
    const winner = row['Winner'] || '';

    // Status logic based on Sheet data:
    // 1. If Status is "Paid" -> paid
    // 2. If Winner is set but not paid -> pending
    // 3. If no winner and not paid -> active
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
      status, // Normalized status
      winnerName: row['Winner name'] || row['Winner'] || '',
      amountWon: parseCurrency(row['Amount won'] || ''),
      loserName: row['Loser name'] || '',
      amountLost: parseCurrency(row['Amount lost'] || '')
    };
  }).filter(bet => bet.better1 && bet.better2);
}

// Column indices from the sheet
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

/**
 * Parse CSV text into array of arrays
 */
function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.length > 1 || currentRow[0] !== '') {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Parse currency string to number
 */
function parseCurrency(value) {
  if (!value && value !== 0) return 0;
  // Convert to string in case API returns a number
  const strValue = String(value);
  const cleaned = strValue.replace(/[€$,]/g, '').trim();
  return parseFloat(cleaned) || 0;
}

/**
 * Parse date string to Date object
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  // Convert to string in case API returns a different type
  const strDate = String(dateStr);

  // Try parsing as ISO date first (API returns: 2025-09-17T22:00:00.000Z)
  const isoDate = new Date(strDate);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Handle format: DD-MMM-YYYY (e.g., "18-Sep-2025") for manually added bets
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

/**
 * Convert a row to a bet object
 */
function rowToBet(row, index) {
  const date = parseDate(row[COLUMNS.DATE]);
  const status = row[COLUMNS.STATUS] || '';
  const winner = row[COLUMNS.WINNER] || '';

  let betStatus = 'active';
  if (status.toLowerCase() === 'paid') {
    betStatus = 'paid';
  } else if (winner && winner.toLowerCase().includes('better')) {
    betStatus = 'pending';
  }

  return {
    id: index,
    date: date,
    dateStr: row[COLUMNS.DATE] || '',
    better1: row[COLUMNS.BETTER_1] || '',
    better2: row[COLUMNS.BETTER_2] || '',
    better1Bet: row[COLUMNS.BETTER_1_BET] || '',
    better2Bet: row[COLUMNS.BETTER_2_BET] || '',
    better1Reward: parseCurrency(row[COLUMNS.BETTER_1_REWARD]),
    better2Reward: parseCurrency(row[COLUMNS.BETTER_2_REWARD]),
    winner: winner,
    status: betStatus,
    winnerName: row[COLUMNS.WINNER_NAME] || '',
    amountWon: parseCurrency(row[COLUMNS.AMOUNT_WON]),
    loserName: row[COLUMNS.LOSER_NAME] || '',
    amountLost: parseCurrency(row[COLUMNS.AMOUNT_LOST])
  };
}

/**
 * Calculate member statistics from bets
 */
export function calculateMemberStats(bets) {
  const stats = {};

  // Initialize stats for all unique members
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
            totalBets: 0
          };
        }
      }
    });
  });

  // Calculate stats from completed bets
  bets.forEach(bet => {
    // Count active bets
    if (bet.status === 'active') {
      if (stats[bet.better1]) stats[bet.better1].activeBets++;
      if (stats[bet.better2]) stats[bet.better2].activeBets++;
    }

    // Count total bets
    if (stats[bet.better1]) stats[bet.better1].totalBets++;
    if (stats[bet.better2]) stats[bet.better2].totalBets++;

    // Process completed bets
    if (bet.status === 'paid' && bet.winnerName && bet.loserName) {
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

  // Convert to array and calculate net profit
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

/**
 * Calculate overall statistics
 */
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
    totalVolume: totalVolume / 2 // Divide by 2 since we added both sides
  };
}
