export type MatchFormat = 'sets' | 'games';

export interface Player {
  id: string;
  name: string;
  age?: number;
  sex?: 'male' | 'female';
  hand?: 'right' | 'left';
  place?: string;
}

export interface Team {
  id: string;
  name: string;
  type: 'singles' | 'doubles';
  players: string[];
}

export interface Game {
  team1Score: number;
  team2Score: number;
}

export interface Match {
  id: string;
  team1Id: string;
  team2Id: string;
  games: Game[];
  completed: boolean;
}

export interface Group {
  id: string;
  name: string;
  teams: Team[];
  matches: Match[];
}

export interface TournamentLevel {
  id: string;
  name: string;
  groups: Group[];
}

export interface Tournament {
  id: string;
  name: string;
  format: MatchFormat;
  matchType?: 'singles' | 'doubles';
  levels: TournamentLevel[];
  createdAt: number;
}

export interface TeamStats {
  team: Team;
  matchesPlayed: number;
  matchWins: number;
  matchLosses: number;
  setWins: number;     // for 'sets' format
  setLosses: number;
  gameWins: number;    // individual game wins
  gameLosses: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  rank: number;
}
