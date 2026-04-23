import { useState } from 'react';
import type { Group, Match, MatchFormat } from '../types';
import { computeStandings } from '../rankings';
import MatchEntry from './MatchEntry';

interface Props {
  group: Group;
  format: MatchFormat;
  onUpdate: (g: Group) => void;
}

export default function GroupView({ group, format, onUpdate }: Props) {
  const [tab, setTab] = useState<'matches' | 'standings'>('matches');
  const [editMatch, setEditMatch] = useState<Match | null>(null);

  const standings = computeStandings(group, format);
  const teamMap = Object.fromEntries(group.teams.map(t => [t.id, t]));

  function handleMatchSave(match: Match) {
    onUpdate({
      ...group,
      matches: group.matches.map(m => m.id === match.id ? match : m),
    });
    setEditMatch(null);
  }

  const completedCount = group.matches.filter(m => m.completed).length;

  return (
    <div>
      {editMatch && (
        <MatchEntry
          match={editMatch}
          team1={teamMap[editMatch.team1Id]}
          team2={teamMap[editMatch.team2Id]}
          format={format}
          onSave={handleMatchSave}
          onCancel={() => setEditMatch(null)}
        />
      )}

      {/* Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Matches completed</span>
            <span>{completedCount} / {group.matches.length}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${group.matches.length ? (completedCount / group.matches.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['matches', 'standings'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors capitalize ${
              tab === t
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'matches' && (
        <div className="space-y-2">
          {group.matches.map(match => {
            const t1 = teamMap[match.team1Id];
            const t2 = teamMap[match.team2Id];
            return (
              <div
                key={match.id}
                className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-sm transition-all ${
                  match.completed ? 'border-green-200' : 'border-gray-200'
                }`}
                onClick={() => setEditMatch(match)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <span className="font-medium text-gray-900 flex-1 text-right">{t1?.name}</span>
                    {match.completed ? (
                      <div className="text-center min-w-[100px]">
                        <div className="text-sm font-mono text-gray-700">
                          {match.games.map((g, i) => (
                            <span key={i} className="mx-1">
                              {g.team1Score}-{g.team2Score}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-300 text-xl font-light min-w-[100px] text-center">vs</span>
                    )}
                    <span className="font-medium text-gray-900 flex-1">{t2?.name}</span>
                  </div>
                  <div className="ml-4">
                    {match.completed ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Done</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Pending</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'standings' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-gray-500 font-medium w-8">#</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">Team</th>
                <th className="px-4 py-3 text-center text-gray-500 font-medium">MP</th>
                <th className="px-4 py-3 text-center text-gray-500 font-medium">W</th>
                <th className="px-4 py-3 text-center text-gray-500 font-medium">L</th>
                {format === 'sets' && (
                  <th className="px-4 py-3 text-center text-gray-500 font-medium">Sets W-L</th>
                )}
                <th className="px-4 py-3 text-center text-gray-500 font-medium">Pts +/-</th>
                <th className="px-4 py-3 text-center text-gray-500 font-medium">Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {standings.map((s, i) => (
                <tr key={s.team.id} className={i === 0 ? 'bg-yellow-50' : ''}>
                  <td className="px-4 py-3 text-center">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{s.team.name}</div>
                    {s.team.players.length > 0 && (
                      <div className="text-xs text-gray-400">{s.team.players.join(' / ')}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{s.matchesPlayed}</td>
                  <td className="px-4 py-3 text-center font-medium text-green-600">{s.matchWins}</td>
                  <td className="px-4 py-3 text-center text-red-400">{s.matchLosses}</td>
                  {format === 'sets' && (
                    <td className="px-4 py-3 text-center text-gray-600">{s.setWins}-{s.setLosses}</td>
                  )}
                  <td className="px-4 py-3 text-center text-gray-600">{s.pointsFor}-{s.pointsAgainst}</td>
                  <td className={`px-4 py-3 text-center font-medium ${s.pointDiff > 0 ? 'text-green-600' : s.pointDiff < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {s.pointDiff > 0 ? '+' : ''}{s.pointDiff}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
