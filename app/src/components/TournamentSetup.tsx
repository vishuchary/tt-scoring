import { useState } from 'react';
import type { Tournament, TournamentLevel, Group, Team, MatchFormat, Player } from '../types';
import { generateMatches } from '../rankings';

interface Props {
  seq: number;
  players: Player[];
  onCreate: (t: Tournament) => void;
  onCancel: () => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

type Step = 'meta' | 'players' | 'groups';

// Serpentine seeding: team index → group index (0,1,2,2,1,0,0,1,2,...)
function serpentineGroupIndex(teamIdx: number, groupCount: number): number {
  const round = Math.floor(teamIdx / groupCount);
  const pos = teamIdx % groupCount;
  return round % 2 === 0 ? pos : groupCount - 1 - pos;
}

export default function TournamentSetup({ seq, players, onCreate, onCancel }: Props) {
  const [step, setStep] = useState<Step>('meta');
  const [name, setName] = useState(`Tournament_${seq}`);
  const [format, setFormat] = useState<MatchFormat>('sets');
  const [matchType, setMatchType] = useState<'singles' | 'doubles'>('singles');
  const [selected, setSelected] = useState<string[]>([]); // ordered player names
  const [groupCount, setGroupCount] = useState(1);

  function getTeams(): { name: string; players: string[] }[] {
    if (matchType === 'singles') return selected.map(p => ({ name: p, players: [p] }));
    const teams = [];
    for (let i = 0; i + 1 < selected.length; i += 2) {
      teams.push({ name: `${selected[i]}_${selected[i + 1]}`, players: [selected[i], selected[i + 1]] });
    }
    return teams;
  }

  function getGroupDist() {
    const teams = getTeams();
    const groups = Array.from({ length: groupCount }, (_, i) => ({
      name: `Group ${String.fromCharCode(65 + i)}`,
      teams: [] as { name: string; players: string[] }[],
    }));
    teams.forEach((t, i) => groups[serpentineGroupIndex(i, groupCount)].teams.push(t));
    return groups;
  }

  function togglePlayer(playerName: string) {
    setSelected(prev =>
      prev.includes(playerName) ? prev.filter(p => p !== playerName) : [...prev, playerName]
    );
  }

  function movePlayer(idx: number, dir: -1 | 1) {
    const next = idx + dir;
    if (next < 0 || next >= selected.length) return;
    setSelected(prev => {
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  }

  function handleCreate() {
    const builtGroups: Group[] = getGroupDist().map(gd => {
      const teams: Team[] = gd.teams.map(t => ({ id: uid(), name: t.name, type: matchType, players: t.players }));
      const matches = generateMatches(teams).map(p => ({
        id: uid(), team1Id: p.team1Id, team2Id: p.team2Id, games: [], completed: false,
      }));
      return { id: uid(), name: gd.name, teams, matches };
    });
    const level1: TournamentLevel = { id: uid(), name: 'Level 1', groups: builtGroups };
    onCreate({ id: uid(), name: name.trim() || `Tournament_${seq}`, format, matchType, levels: [level1], createdAt: Date.now() });
  }

  const teams = getTeams();
  const hasOddDoubles = matchType === 'doubles' && selected.length % 2 !== 0;
  const canAdvance = teams.length >= 2 && !hasOddDoubles;

  // ── Step 1: Meta ──────────────────────────────────────────────────────────
  if (step === 'meta') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-xl mx-auto p-4">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>
            <h1 className="text-xl font-bold text-gray-900">New Tournament</h1>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Name</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
                value={name} placeholder="e.g. Spring 2025"
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Match Format</label>
              <div className="grid grid-cols-2 gap-3">
                {(['sets', 'games'] as MatchFormat[]).map(f => (
                  <button key={f} onClick={() => setFormat(f)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${format === f ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}
                  >
                    <div className="font-medium text-gray-900 text-sm">{f === 'sets' ? 'Best of 3 Sets' : '2 Games'}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{f === 'sets' ? 'Most sets wins the match' : 'Most game wins ranks higher'}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Match Type</label>
              <div className="grid grid-cols-2 gap-3">
                {(['singles', 'doubles'] as const).map(mt => (
                  <button key={mt} onClick={() => setMatchType(mt)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${matchType === mt ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}
                  >
                    <div className="font-medium text-gray-900 text-sm capitalize">{mt}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{mt === 'singles' ? '1 player per team' : '2 players per team'}</div>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setStep('players')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Next: Select Players →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Select Players ────────────────────────────────────────────────
  if (step === 'players') {
    const unselected = players.filter(p => !selected.includes(p.name));

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-xl mx-auto p-4">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => setStep('meta')} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>
            <h1 className="text-xl font-bold text-gray-900">Select Players</h1>
          </div>

          {/* Selected list with reorder */}
          {selected.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Selected · {selected.length} player{selected.length !== 1 ? 's' : ''}
                {matchType === 'doubles' && ` → ${teams.length} team${teams.length !== 1 ? 's' : ''}`}
                {hasOddDoubles && <span className="ml-2 text-amber-500">⚠ need even count</span>}
              </p>

              {matchType === 'singles' ? (
                <div className="space-y-1">
                  {selected.map((p, i) => (
                    <div key={p} className="flex items-center gap-2 py-1">
                      <span className="text-xs text-gray-400 w-5 text-center">{i + 1}</span>
                      <span className="flex-1 text-sm text-gray-800">{p}</span>
                      <button onClick={() => movePlayer(i, -1)} disabled={i === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 px-1 text-base leading-none">↑</button>
                      <button onClick={() => movePlayer(i, 1)} disabled={i === selected.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 px-1 text-base leading-none">↓</button>
                      <button onClick={() => togglePlayer(p)} className="text-gray-300 hover:text-red-400 px-1 text-xl leading-none">×</button>
                    </div>
                  ))}
                </div>
              ) : (
                // Doubles: show pairs
                <div className="space-y-2">
                  {Array.from({ length: Math.ceil(selected.length / 2) }, (_, pi) => {
                    const p1 = selected[pi * 2];
                    const p2 = selected[pi * 2 + 1];
                    const isPaired = !!p2;
                    return (
                      <div key={pi} className={`rounded-lg p-2.5 ${isPaired ? 'bg-blue-50 border border-blue-100' : 'bg-amber-50 border border-amber-100'}`}>
                        <p className="text-xs font-medium text-gray-500 mb-1.5">Team {pi + 1}{!isPaired && ' — needs a partner'}</p>
                        {[p1, p2].filter(Boolean).map((p, ri) => {
                          const idx = pi * 2 + ri;
                          return (
                            <div key={p} className="flex items-center gap-2 py-0.5">
                              <span className="text-xs text-gray-400 w-5 text-center">{idx + 1}</span>
                              <span className="flex-1 text-sm text-gray-800">{p}</span>
                              <button onClick={() => movePlayer(idx, -1)} disabled={idx === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 px-1 text-base leading-none">↑</button>
                              <button onClick={() => movePlayer(idx, 1)} disabled={idx === selected.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 px-1 text-base leading-none">↓</button>
                              <button onClick={() => togglePlayer(p!)} className="text-gray-300 hover:text-red-400 px-1 text-xl leading-none">×</button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Available players */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Available Players</p>
            {players.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No players yet — add them in the Players screen</p>
            )}
            {players.length > 0 && unselected.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">All players selected</p>
            )}
            <div className="space-y-0.5">
              {unselected.map(p => (
                <button key={p.id} onClick={() => togglePlayer(p.name)}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-blue-50 transition-colors text-left"
                >
                  <span className="w-5 h-5 rounded-full border-2 border-gray-200 shrink-0" />
                  <span className="text-sm text-gray-800">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => setStep('groups')} disabled={!canAdvance}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            Next: Set Groups →
          </button>
        </div>
      </div>
    );
  }

  // ── Step 3: Groups preview ────────────────────────────────────────────────
  const groupDist = getGroupDist();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto p-4">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setStep('players')} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>
          <h1 className="text-xl font-bold text-gray-900">Configure Groups</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Groups</label>
          <input
            type="number" min={1} max={teams.length}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
            value={groupCount}
            onChange={e => setGroupCount(Math.max(1, Math.min(teams.length, parseInt(e.target.value) || 1)))}
          />
          <p className="text-xs text-gray-400 mt-1">
            {teams.length} team{teams.length !== 1 ? 's' : ''} distributed across {groupCount} group{groupCount !== 1 ? 's' : ''} — ~{Math.ceil(teams.length / groupCount)} per group
          </p>
        </div>

        {/* Groups preview */}
        <div className="space-y-3 mb-5">
          {groupDist.map(g => (
            <div key={g.name} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {g.name} · {g.teams.length} team{g.teams.length !== 1 ? 's' : ''} · {g.teams.length * (g.teams.length - 1) / 2} match{g.teams.length * (g.teams.length - 1) / 2 !== 1 ? 'es' : ''}
              </p>
              <div className="space-y-1.5">
                {g.teams.map(t => (
                  <div key={t.name} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    <span className="text-sm font-medium text-gray-800">{t.name}</span>
                    {matchType === 'doubles' && (
                      <span className="text-xs text-gray-400">({t.players.join(' + ')})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleCreate}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          Create Tournament
        </button>
      </div>
    </div>
  );
}
