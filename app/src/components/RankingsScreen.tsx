import type { Tournament } from '../types';
import { computePlayerRankings } from '../rankings';

interface Props {
  tournaments: Tournament[];
  onBack: () => void;
}

const MEDAL = ['🥇', '🥈', '🥉'];

export default function RankingsScreen({ tournaments, onBack }: Props) {
  const rankings = computePlayerRankings(tournaments);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto p-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>
          <h1 className="text-xl font-bold text-gray-900">Player Rankings</h1>
        </div>

        <p className="text-xs text-gray-400 mb-4">
          Win +2 pts &nbsp;·&nbsp; Loss −1 pt &nbsp;·&nbsp; All tournaments (completed matches)
        </p>

        {rankings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🏓</div>
            <p>No completed matches yet</p>
            <p className="text-sm mt-1">Rankings appear once matches are played</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-gray-500 font-medium w-10">#</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">Player</th>
                  <th className="px-4 py-3 text-center text-gray-500 font-medium">Pts</th>
                  <th className="px-4 py-3 text-center text-gray-500 font-medium">W</th>
                  <th className="px-4 py-3 text-center text-gray-500 font-medium">L</th>
                  <th className="px-4 py-3 text-center text-gray-500 font-medium">MP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rankings.map((r, i) => (
                  <tr key={r.name} className={i === 0 ? 'bg-yellow-50' : ''}>
                    <td className="px-4 py-3 text-center text-base">
                      {i < 3 ? MEDAL[i] : <span className="text-gray-400">{i + 1}</span>}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold text-base ${r.points > 0 ? 'text-green-600' : r.points < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {r.points > 0 ? '+' : ''}{r.points}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-green-600">{r.wins}</td>
                    <td className="px-4 py-3 text-center text-red-400">{r.losses}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{r.matchesPlayed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
