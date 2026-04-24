import type { Group, Match, MatchFormat, Team, TeamStats, Tournament } from './types';

export interface PlayerRanking {
  name: string;
  points: number;
  wins: number;
  losses: number;
  matchesPlayed: number;
}

function gameWinner(s1: number, s2: number): 'team1' | 'team2' | null {
  if (s1 >= 11 && s1 - s2 >= 2) return 'team1';
  if (s2 >= 11 && s2 - s1 >= 2) return 'team2';
  return null;
}

function getMatchResult(match: Match, teamId: string, format: MatchFormat) {
  const isTeam1 = match.team1Id === teamId;
  let setsWon = 0, setsLost = 0, gameWins = 0, gameLosses = 0;
  let pointsFor = 0, pointsAgainst = 0;

  for (const game of match.games) {
    const myScore = isTeam1 ? game.team1Score : game.team2Score;
    const oppScore = isTeam1 ? game.team2Score : game.team1Score;
    pointsFor += myScore;
    pointsAgainst += oppScore;
    const w = gameWinner(game.team1Score, game.team2Score);
    const iWon = isTeam1 ? w === 'team1' : w === 'team2';
    const iLost = isTeam1 ? w === 'team2' : w === 'team1';
    if (iWon) { setsWon++; gameWins++; }
    else if (iLost) { setsLost++; gameLosses++; }
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

export function computeCrossGroupRankings(groups: Group[], format: MatchFormat): TeamStats[] {
  const all = groups.flatMap(g => computeStandings(g, format));
  all.sort((a, b) => {
    if (b.matchWins !== a.matchWins) return b.matchWins - a.matchWins;
    if (b.setWins !== a.setWins) return b.setWins - a.setWins;
    return b.pointDiff - a.pointDiff;
  });
  all.forEach((s, i) => { s.rank = i + 1; });
  return all;
}

export function computePlayerRankings(tournaments: Tournament[]): PlayerRanking[] {
  const map = new Map<string, PlayerRanking>();

  function get(name: string): PlayerRanking {
    if (!map.has(name)) map.set(name, { name, points: 0, wins: 0, losses: 0, matchesPlayed: 0 });
    return map.get(name)!;
  }

  for (const t of tournaments) {
    for (const level of t.levels) {
      for (const group of level.groups) {
        const teamMap = new Map(group.teams.map(tm => [tm.id, tm]));
        for (const match of group.matches) {
          if (!match.completed || match.games.length === 0) continue;

          let t1wins = 0, t2wins = 0, pointDiff = 0;
          for (const g of match.games) {
            const w = gameWinner(g.team1Score, g.team2Score);
            if (w === 'team1') t1wins++;
            else if (w === 'team2') t2wins++;
            pointDiff += g.team1Score - g.team2Score;
          }

          let team1Wins: boolean;
          if (t1wins !== t2wins) team1Wins = t1wins > t2wins;
          else if (pointDiff !== 0) team1Wins = pointDiff > 0;
          else continue; // true draw

          const winTeam = teamMap.get(team1Wins ? match.team1Id : match.team2Id);
          const loseTeam = teamMap.get(team1Wins ? match.team2Id : match.team1Id);

          for (const name of (winTeam?.players ?? [])) {
            if (!name) continue;
            const s = get(name);
            s.wins++;
            s.points += 2;
            s.matchesPlayed++;
          }
          for (const name of (loseTeam?.players ?? [])) {
            if (!name) continue;
            const s = get(name);
            s.losses++;
            s.points -= 1;
            s.matchesPlayed++;
          }
        }
      }
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    b.points !== a.points ? b.points - a.points : b.wins - a.wins
  );
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
