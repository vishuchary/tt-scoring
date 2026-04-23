import { useState } from 'react';
import type { Tournament, Group, Team, MatchFormat } from '../types';
import { generateMatches } from '../rankings';

interface Props {
  onCreate: (t: Tournament) => void;
  onCancel: () => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function makeTeam(name: string, type: 'singles' | 'doubles', players: string[]): Team {
  return { id: uid(), name, type, players };
}

export default function TournamentSetup({ onCreate, onCancel }: Props) {
  const [name, setName] = useState('');
  const [format, setFormat] = useState<MatchFormat>('sets');
  const [groupCount, setGroupCount] = useState(1);
  const [step, setStep] = useState<'meta' | 'teams'>('meta');
  const [groups, setGroups] = useState<{ name: string; teams: { name: string; type: 'singles' | 'doubles'; p1: string; p2: string }[] }[]>([]);
  const [currentGroup, setCurrentGroup] = useState(0);

  function initGroups() {
    const g = Array.from({ length: groupCount }, (_, i) => ({
      name: `Group ${String.fromCharCode(65 + i)}`,
      teams: Array.from({ length: 10 }, (_, j) => ({
        name: `Team ${j + 1}`,
        type: 'singles' as const,
        p1: '',
        p2: '',
      })),
    }));
    setGroups(g);
    setStep('teams');
  }

  function updateTeam(gi: number, ti: number, field: string, value: string) {
    setGroups(prev => prev.map((g, i) =>
      i !== gi ? g : {
        ...g,
        teams: g.teams.map((t, j) =>
          j !== ti ? t : { ...t, [field]: value }
        ),
      }
    ));
  }

  function removeTeam(gi: number, ti: number) {
    setGroups(prev => prev.map((g, i) =>
      i !== gi ? g : { ...g, teams: g.teams.filter((_, j) => j !== ti) }
    ));
  }

  function addTeam(gi: number) {
    setGroups(prev => prev.map((g, i) =>
      i !== gi ? g : {
        ...g,
        teams: [...g.teams, { name: `Team ${g.teams.length + 1}`, type: 'singles', p1: '', p2: '' }],
      }
    ));
  }

  function handleCreate() {
    const builtGroups: Group[] = groups.map(g => {
      const teams: Team[] = g.teams.map(t =>
        makeTeam(t.name, t.type, t.type === 'doubles' ? [t.p1, t.p2].filter(Boolean) : [t.p1].filter(Boolean))
      );
      const matchPairs = generateMatches(teams);
      const matches = matchPairs.map(p => ({
        id: uid(),
        team1Id: p.team1Id,
        team2Id: p.team2Id,
        games: [],
        completed: false,
      }));
      return { id: uid(), name: g.name, teams, matches };
    });

    onCreate({
      id: uid(),
      name: name.trim() || 'Tournament',
      format,
      groups: builtGroups,
      createdAt: Date.now(),
    });
  }

  if (step === 'teams') {
    const g = groups[currentGroup];
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto p-6">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setStep('meta')} className="text-gray-500 hover:text-gray-700">← Back</button>
            <h1 className="text-2xl font-bold text-gray-900">Setup Teams</h1>
          </div>

          {/* Group tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {groups.map((grp, i) => (
              <button
                key={i}
                onClick={() => setCurrentGroup(i)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  i === currentGroup
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300'
                }`}
              >
                {grp.name}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <input
                className="font-semibold text-gray-900 bg-transparent outline-none w-32"
                value={g.name}
                onChange={e => setGroups(prev => prev.map((x, i) => i === currentGroup ? { ...x, name: e.target.value } : x))}
              />
              <span className="text-sm text-gray-500">{g.teams.length} teams</span>
            </div>
            <div className="divide-y divide-gray-100">
              {g.teams.map((t, ti) => (
                <div key={ti} className="px-5 py-3 flex gap-3 items-center">
                  <span className="text-gray-400 w-5 text-sm text-right">{ti + 1}</span>
                  <input
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-400"
                    value={t.name}
                    placeholder="Team name"
                    onChange={e => updateTeam(currentGroup, ti, 'name', e.target.value)}
                  />
                  <select
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-blue-400"
                    value={t.type}
                    onChange={e => updateTeam(currentGroup, ti, 'type', e.target.value)}
                  >
                    <option value="singles">Singles</option>
                    <option value="doubles">Doubles</option>
                  </select>
                  <input
                    className="w-28 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-400"
                    value={t.p1}
                    placeholder={t.type === 'doubles' ? 'Player 1' : 'Player'}
                    onChange={e => updateTeam(currentGroup, ti, 'p1', e.target.value)}
                  />
                  {t.type === 'doubles' && (
                    <input
                      className="w-28 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-400"
                      value={t.p2}
                      placeholder="Player 2"
                      onChange={e => updateTeam(currentGroup, ti, 'p2', e.target.value)}
                    />
                  )}
                  <button
                    onClick={() => removeTeam(currentGroup, ti)}
                    className="text-gray-300 hover:text-red-400 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-gray-100">
              <button
                onClick={() => addTeam(currentGroup)}
                className="text-blue-600 text-sm hover:underline"
              >
                + Add team
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleCreate}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create Tournament
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">← Back</button>
          <h1 className="text-2xl font-bold text-gray-900">New Tournament</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Name</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
              value={name}
              placeholder="e.g. Spring 2025"
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Match Format</label>
            <div className="grid grid-cols-2 gap-3">
              {(['sets', 'games'] as MatchFormat[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    format === f
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    {f === 'sets' ? 'Best of 3 Sets' : '2 Games'}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {f === 'sets'
                      ? 'Play 3 games, most sets wins the match'
                      : 'Play 2 games, most game wins ranks higher'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Groups</label>
            <input
              type="number"
              min={1}
              max={20}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
              value={groupCount}
              onChange={e => setGroupCount(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          <button
            onClick={initGroups}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Next: Add Teams →
          </button>
        </div>
      </div>
    </div>
  );
}
