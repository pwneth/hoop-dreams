// NBA Teams data — logo URLs from the NBA CDN
const NBA_TEAMS = [
  { id: 'ATL', name: 'Hawks', city: 'Atlanta', conference: 'east', logo: 'https://cdn.nba.com/logos/nba/1610612737/global/L/logo.svg' },
  { id: 'BOS', name: 'Celtics', city: 'Boston', conference: 'east', logo: 'https://cdn.nba.com/logos/nba/1610612738/global/L/logo.svg' },
  { id: 'BKN', name: 'Nets', city: 'Brooklyn', conference: 'east', logo: 'https://cdn.nba.com/logos/nba/1610612751/global/L/logo.svg' },
  { id: 'CHA', name: 'Hornets', city: 'Charlotte', conference: 'east', logo: 'https://cdn.nba.com/logos/nba/1610612766/global/L/logo.svg' },
  { id: 'CHI', name: 'Bulls', city: 'Chicago', conference: 'east', logo: 'https://cdn.nba.com/logos/nba/1610612741/global/L/logo.svg' },
  { id: 'CLE', name: 'Cavaliers', city: 'Cleveland', conference: 'east', logo: 'https://cdn.nba.com/logos/nba/1610612739/global/L/logo.svg' },
  { id: 'DAL', name: 'Mavericks', city: 'Dallas', conference: 'west', logo: 'https://cdn.nba.com/logos/nba/1610612742/global/L/logo.svg' },
  { id: 'DEN', name: 'Nuggets', city: 'Denver', conference: 'west', logo: 'https://cdn.nba.com/logos/nba/1610612743/global/L/logo.svg' },
  { id: 'DET', name: 'Pistons', city: 'Detroit', conference: 'east', logo: 'https://cdn.nba.com/logos/nba/1610612765/global/L/logo.svg' },
  { id: 'GSW', name: 'Warriors', city: 'Golden State', conference: 'west', logo: 'https://cdn.nba.com/logos/nba/1610612744/global/L/logo.svg' },
  { id: 'HOU', name: 'Rockets', city: 'Houston', conference: 'west', logo: 'https://cdn.nba.com/logos/nba/1610612745/global/L/logo.svg' },
  { id: 'IND', name: 'Pacers', city: 'Indiana', conference: 'east', logo: 'https://cdn.nba.com/logos/nba/1610612754/global/L/logo.svg' },
  { id: 'LAC', name: 'Clippers', city: 'LA', conference: 'west', logo: 'https://cdn.nba.com/logos/nba/1610612746/global/L/logo.svg' },
  { id: 'LAL', name: 'Lakers', city: 'Los Angeles', conference: 'west', logo: 'https://cdn.nba.com/logos/nba/1610612747/global/L/logo.svg' },
  { id: 'MEM', name: 'Grizzlies', city: 'Memphis', conference: 'west', logo: 'https://cdn.nba.com/logos/nba/1610612763/global/L/logo.svg' },
  { id: 'MIA', name: 'Heat', city: 'Miami', conference: 'east', logo: 'https://cdn.nba.com/logos/nba/1610612748/global/L/logo.svg' },
  { id: 'MIL', name: 'Bucks', city: 'Milwaukee', conference: 'east', logo: 'https://cdn.nba.com/logos/nba/1610612749/global/L/logo.svg' },
  { id: 'MIN', name: 'Timberwolves', city: 'Minnesota', conference: 'west', logo: 'https://cdn.nba.com/logos/nba/1610612750/global/L/logo.svg' },
  { id: 'NOP', name: 'Pelicans', city: 'New Orleans', conference: 'west', logo: 'https://cdn.nba.com/logos/nba/1610612740/global/L/logo.svg' },
  { id: 'NYK', name: 'Knicks', city: 'New York', conference: 'east', logo: 'https://cdn.nba.com/logos/nba/1610612752/global/L/logo.svg' },
  { id: 'OKC', name: 'Thunder', city: 'Oklahoma City', conference: 'west', logo: 'https://cdn.nba.com/logos/nba/1610612760/global/L/logo.svg' },
  { id: 'ORL', name: 'Magic', city: 'Orlando', conference: 'east', logo: 'https://cdn.nba.com/logos/nba/1610612753/global/L/logo.svg' },
  { id: 'PHI', name: '76ers', city: 'Philadelphia', conference: 'east', logo: 'https://cdn.nba.com/logos/nba/1610612755/global/L/logo.svg' },
  { id: 'PHX', name: 'Suns', city: 'Phoenix', conference: 'west', logo: 'https://cdn.nba.com/logos/nba/1610612756/global/L/logo.svg' },
  { id: 'POR', name: 'Trail Blazers', city: 'Portland', conference: 'west', logo: 'https://cdn.nba.com/logos/nba/1610612757/global/L/logo.svg' },
  { id: 'SAC', name: 'Kings', city: 'Sacramento', conference: 'west', logo: 'https://cdn.nba.com/logos/nba/1610612758/global/L/logo.svg' },
  { id: 'SAS', name: 'Spurs', city: 'San Antonio', conference: 'west', logo: 'https://cdn.nba.com/logos/nba/1610612759/global/L/logo.svg' },
  { id: 'TOR', name: 'Raptors', city: 'Toronto', conference: 'east', logo: 'https://cdn.nba.com/logos/nba/1610612761/global/L/logo.svg' },
  { id: 'UTA', name: 'Jazz', city: 'Utah', conference: 'west', logo: 'https://cdn.nba.com/logos/nba/1610612762/global/L/logo.svg' },
  { id: 'WAS', name: 'Wizards', city: 'Washington', conference: 'east', logo: 'https://cdn.nba.com/logos/nba/1610612764/global/L/logo.svg' },
];

export function getTeamByAbbreviation(abbr) {
  if (!abbr) return null;
  return NBA_TEAMS.find(t => t.id.toLowerCase() === abbr.toLowerCase()) || null;
}

export function getTeamByName(teamName) {
  if (!teamName) return null;
  const lower = teamName.toLowerCase();
  return NBA_TEAMS.find(t =>
    t.name.toLowerCase() === lower ||
    t.city.toLowerCase() === lower ||
    `${t.city} ${t.name}`.toLowerCase() === lower ||
    t.id.toLowerCase() === lower
  ) || null;
}

export function getTeamLogo(teamName) {
  const team = getTeamByName(teamName);
  return team ? team.logo : '';
}

export function searchTeams(query) {
  if (!query) return NBA_TEAMS;
  const lower = query.toLowerCase();
  return NBA_TEAMS.filter(t =>
    t.name.toLowerCase().includes(lower) ||
    t.city.toLowerCase().includes(lower) ||
    t.id.toLowerCase().includes(lower) ||
    `${t.city} ${t.name}`.toLowerCase().includes(lower)
  );
}

export { NBA_TEAMS };
