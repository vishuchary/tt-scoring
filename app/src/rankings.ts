import type { Group, Match, MatchFormat, Team, TeamStats } from './types';

function getMatchResult(match: Match, teamId: string, format: MatchFormat) {
  const isTeam1 = match.team1Id === teamId;
  let setsWon = 0, setsLost = 0, gameWins = 0, gameLosses = 0;
  let pointsFor = 0, pointsAgainst = 0;

  for (const game of match.games) {
    const myScore = isTeam1 ? game.team1Score : game.team2Score;
    const oppScore = isTeam1 ? game.team2Score : game.team1Score;
    pointsFor += myScore;
    pointsAgainst += oppScore;
    if (myScore > oppScore) { setsWon++; gameWins++; }
    else if (oppScore > myScore) { setsLost++; gameLosses++; }
  }

  // Match win: sets format = more sets; games format = more game wins
  const matchWon = format === 'sets'
    ? setsWon > setsLost
    : gameWins > gameLosses;

  return { matchWon, setsWon, setsLost, gameWins, gameLosses, pointsFor, pointsAgainst };
}

export function computeStandings(group: Group, format: MatchFormat): TeamStats[] {
  const statsMap = new Map<string, TeamStats>();

  for (const team of group.teams) {
    statsMap.set(team.id, {
      team,
      matchesPlayed: 0,
      matchWins: 0,
      matchLosses: 0,
      setWins: 0,
      setLosses: 0,
      gameWins: 0,
      gameLosses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDiff: 0,
      rank: 0,
    });
  }

  for (const match of group.matches) {
    if (!match.completed) continue;

    for (const teamId of [match.team1Id, match.team2Id]) {
      const s = statsMap.get(teamId);
      if (!s) continue;
      const r = getMatchResult(match, teamId, format);
      s.matchesPlayed++;
      if (r.matchWon) s.matchWins++; else s.matchLosses++;
      s.setWins += r.setsWon;
      s.setLosses += r.setsLost;
      s.gameWins += r.gameWins;
      s.gameLosses += r.gameLosses;
      s.pointsFor += r.pointsFor;
      s.pointsAgainst += r.pointsAgainst;
      s.pointDiff = s.pointsFor - s.pointsAgainst;
    }
  }

  const standings = Array.from(statsMap.values());

  standings.sort((a, b) => {
    // Primary: match wins
    if (b.matchWins !== a.matchWins) return b.matchWins - a.matchWins;
    // Tiebreaker: point differential
    return b.pointDiff - a.pointDiff;
  });

  standings.forEach((s, i) => { s.rank = i + 1; });
  return standings;
}

export function generateMatches(teams: Team[]): { team1Id: string; team2Id: string }[] {
  const pairs: { team1Id: string; team2Id: string }[] = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      pairs.push({ team1Id: teams[i].id, team2Id: teams[j].id });
    }
  }
  return pairs;
}
