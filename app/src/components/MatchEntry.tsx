import { useState } from 'react';
import type { Match, Team, MatchFormat, Game } from '../types';

interface Props {
  match: Match;
  team1: Team;
  team2: Team;
  format: MatchFormat;
  onSave: (match: Match) => void;
  onCancel: () => void;
}

const GAME_COUNT = { sets: 3, games: 2 } as const;

export default function MatchEntry({ match, team1, team2, format, onSave, onCancel }: Props) {
  const count = GAME_COUNT[format];
  const initialGames: Game[] = Array.from({ length: count }, (_, i) => ({
    team1Score: match.games[i]?.team1Score ?? 0,
    team2Score: match.games[i]?.team2Score ?? 0,
  }));
  const [games, setGames] = useState<Game[]>(initialGames);

  function setScore(gameIdx: number, side: 'team1Score' | 'team2Score', val: string) {
    const n = Math.max(0, parseInt(val) || 0);
    setGames(prev => prev.map((g, i) => i !== gameIdx ? g : { ...g, [side]: n }));
  }

  function getWinner(): string | null {
    let t1wins = 0, t2wins = 0;
    for (const g of games) {
      if (g.team1Score > g.team2Score) t1wins++;
      else if (g.team2Score > g.team1Score) t2wins++;
    }
    if (t1wins > t2wins) return team1.name;
    if (t2wins > t1wins) return team2.name;
    return null;
  }

  const winner = getWinner();

  function handleSave() {
    onSave({ ...match, games, completed: true });
  }

  function handleClear() {
    onSave({ ...match, games: [], completed: false });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Enter Scores</h2>
          <p className="text-sm text-gray-500 mt-1">
            {format === 'sets' ? 'Best of 3 Sets' : '2 Games'}
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Team headers */}
          <div className="grid grid-cols-3 gap-2 text-sm font-medium text-gray-700">
            <div className="text-center truncate px-1">{team1.name}</div>
            <div className="text-center text-gray-400">
              {format === 'sets' ? 'Set' : 'Game'}
            </div>
            <div className="text-center truncate px-1">{team2.name}</div>
          </div>

          {/* Score rows */}
          {games.map((g, i) => {
            const t1w = g.team1Score > g.team2Score;
            const t2w = g.team2Score > g.team1Score;
            return (
              <div key={i} className="grid grid-cols-3 gap-2 items-center">
                <input
                  type="number"
                  min={0}
                  className={`text-center border rounded-lg py-2 text-lg font-mono outline-none focus:border-blue-400 transition-colors ${
                    t1w ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200'
                  }`}
                  value={g.team1Score}
                  onChange={e => setScore(i, 'team1Score', e.target.value)}
                />
                <div className="text-center text-gray-400 text-sm font-medium">
                  {format === 'sets' ? `Set ${i + 1}` : `G${i + 1}`}
                </div>
                <input
                  type="number"
                  min={0}
                  className={`text-center border rounded-lg py-2 text-lg font-mono outline-none focus:border-blue-400 transition-colors ${
                    t2w ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200'
                  }`}
                  value={g.team2Score}
                  onChange={e => setScore(i, 'team2Score', e.target.value)}
                />
              </div>
            );
          })}

          {/* Winner preview */}
          {winner && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-center text-green-700 font-medium text-sm">
              🏆 {winner} wins
            </div>
          )}
          {!winner && games.some(g => g.team1Score > 0 || g.team2Score > 0) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-center text-yellow-700 text-sm">
              Tie
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3 justify-between">
          <div className="flex gap-2">
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 text-sm px-3 py-2">
              Cancel
            </button>
            {match.completed && (
              <button onClick={handleClear} className="text-red-400 hover:text-red-600 text-sm px-3 py-2">
                Clear
              </button>
            )}
          </div>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Save Score
          </button>
        </div>
      </div>
    </div>
  );
}
