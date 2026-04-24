import { useState, useEffect } from 'react';
import type { Tournament, TournamentLevel, Group, Team, MatchFormat, Player } from '../types';
import { generateMatches } from '../rankings';
import PlayerPicker from './PlayerPicker';

interface Props {
  seq: number;
  players: Player[];
  onCreate: (t: Tournament) => void;
  onCancel: () => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function makeTeam(name: string, type: 'singles' | 'doubles', players: string[]): Team {
  return { id: uid(), name, type, players };
}

type TeamDraft = { name: string; p1: string; p2: string };
type GroupDraft = { name: string; teams: TeamDraft[] };

function autoTeamName(p1: string, p2: string, type: 'singles' | 'doubles'): string {
  const n1 = p1.trim();
  const n2 = p2.trim();
  if (type === 'doubles' && n2) return `Team_${n1}_${n2}`;
  return `Team_${n1}`;
}

function makeTeams(count: number, type: 'singles' | 'doubles', startIndex = 0): TeamDraft[] {
  return Array.from({ length: count }, (_, i) => {
    const p1 = `Player_${startIndex + i + 1}`;
    const p2 = type === 'doubles' ? `Player_${startIndex + count + i + 1}` : '';
    return { name: autoTeamName(p1, p2, type), p1, p2 };
  });
}

type PickerTarget = { gi: number; ti: number; field: 'p1' | 'p2' };

export default function TournamentSetup({ seq, players, onCreate, onCancel }: Props) {
  const [name, setName] = useState(`Tournament_${seq}`);
  const [format, setFormat] = useState<MatchFormat>('sets');
  const [matchType, setMatchType] = useState<'singles' | 'doubles'>('singles');
  const [groupCount, setGroupCount] = useState(1);
  const [teamCount, setTeamCount] = useState(2);
  const [step, setStep] = useState<'meta' | 'teams'>('meta');
  const [groups, setGroups] = useState<GroupDraft[]>([]);
  const [currentGroup, setCurrentGroup] = useState(0);
  const [picker, setPicker] = useState<PickerTarget | null>(null);

  // Fix issue 3: clear picker when switching groups so it doesn't get stuck
  useEffect(() => { setPicker(null); }, [currentGroup]);

  function initGroups() {
    setGroups(
      Array.from({ length: groupCount }, (_, i) => ({
        name: `Group ${String.fromCharCode(65 + i)}`,
        teams: makeTeams(teamCount, matchType),
      }))
    );
    setCurrentGroup(0);
    setStep('teams');
  }

  function updateTeam(gi: number, ti: number, field: keyof TeamDraft, value: string) {
    setGroups(prev => prev.map((g, i) => {
      if (i !== gi) return g;
      return {
        ...g,
        teams: g.teams.map((t, j) => {
          if (j !== ti) return t;
          const updated = { ...t, [field]: value };
          // Auto-update team name if it still matches the auto-generated pattern
          const wasAuto = t.name === autoTeamName(t.p1, t.p2, matchType);
          if (wasAuto && (field === 'p1' || field === 'p2')) {
            updated.name = autoTeamName(updated.p1, updated.p2, matchType);
          }
          return updated;
        }),
      };
    }));
  }

  function removeTeam(gi: number, ti: number) {
    setGroups(prev => prev.map((g, i) =>
      i !== gi ? g : { ...g, teams: g.teams.filter((_, j) => j !== ti) }
    ));
  }

  function addTeam(gi: number) {
    setGroups(prev => prev.map((g, i) => {
      if (i !== gi) return g;
      const p1 = `Player_${g.teams.length + 1}`;
      const p2 = matchType === 'doubles' ? `Player_${g.teams.length + 2}` : '';
      return {
        ...g,
        teams: [...g.teams, { name: autoTeamName(p1, p2, matchType), p1, p2 }],
      };
    }));
  }

  function handleCreate() {
    const builtGroups: Group[] = groups.map(g => {
      const teams: Team[] = g.teams.map((t, i) =>
        makeTeam(
          t.name.trim() || `Team ${i + 1}`,
          matchType,
          matchType === 'doubles' ? [t.p1, t.p2].filter(Boolean) : [t.p1].filter(Boolean)
        )
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

    const level1: TournamentLevel = { id: uid(), name: 'Level 1', groups: builtGroups };
    onCreate({
      id: uid(),
      name: name.trim() || `Tournament_${seq}`,
      format,
      matchType,
      levels: [level1],
      createdAt: Date.now(),
    });
  }

  function openPicker(gi: number, ti: number, field: 'p1' | 'p2') {
    setPicker({ gi, ti, field });
  }

  function handlePickerSelect(playerName: string) {
    if (!picker) return;
    updateTeam(picker.gi, picker.ti, picker.field, playerName);
    setPicker(null);
  }

  if (step === 'teams') {
    const g = groups[currentGroup];
    const currentPickerValue = picker
      ? (picker.field === 'p1' ? g.teams[picker.ti]?.p1 : g.teams[picker.ti]?.p2) ?? ''
      : '';

    // Collect all assigned player names across ALL groups, except the current picker slot
    const usedNames = new Set(
      groups.flatMap((grp, gi) =>
        grp.teams.flatMap((t, ti) => {
          const isCurrent = gi === currentGroup && ti === (picker?.ti ?? -1);
          const names: string[] = [];
          if (!(isCurrent && picker?.field === 'p1') && t.p1) names.push(t.p1);
          if (!(isCurrent && picker?.field === 'p2') && t.p2) names.push(t.p2);
          return names;
        })
      )
    );

    return (
      <div className="min-h-screen bg-gray-50">
        {picker && (
          <PlayerPicker
            players={players}
            current={currentPickerValue}
            usedNames={usedNames}
            onSelect={handlePickerSelect}
            onCancel={() => setPicker(null)}
          />
        )}

        <div className="max-w-2xl mx-auto p-4">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => setStep('meta')} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>
            <h1 className="text-xl font-bold text-gray-900">Add Teams</h1>
          </div>

          {groups.length > 1 && (
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
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
          )}

          <div className="space-y-3 mb-5">
            {g.teams.map((t, ti) => (
              <div key={ti} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Team {ti + 1}</span>
                  <button onClick={() => removeTeam(currentGroup, ti)} className="text-gray-300 hover:text-red-400 text-xl leading-none">×</button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Team Name</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                      value={t.name}
                      placeholder={`Team ${ti + 1}`}
                      onChange={e => updateTeam(currentGroup, ti, 'name', e.target.value)}
                    />
                  </div>

                  <div className={`grid gap-2 ${matchType === 'doubles' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        {matchType === 'doubles' ? 'Player 1' : 'Player Name'}
                      </label>
                      <button
                        onClick={() => openPicker(currentGroup, ti, 'p1')}
                        className="w-full text-left border border-gray-200 rounded-lg px-3 py-2 text-sm hover:border-blue-400 transition-colors truncate"
                      >
                        {t.p1 || <span className="text-gray-400">Select player…</span>}
                      </button>
                    </div>
                    {matchType === 'doubles' && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Player 2</label>
                        <button
                          onClick={() => openPicker(currentGroup, ti, 'p2')}
                          className="w-full text-left border border-gray-200 rounded-lg px-3 py-2 text-sm hover:border-blue-400 transition-colors truncate"
                        >
                          {t.p2 || <span className="text-gray-400">Select player…</span>}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => addTeam(currentGroup)}
              className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-sm hover:border-blue-300 hover:text-blue-500 transition-colors"
            >
              + Add Team
            </button>
          </div>

          <button
            onClick={handleCreate}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Create Tournament
          </button>
        </div>
      </div>
    );
  }

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
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    format === f ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <div className="font-medium text-gray-900 text-sm">
                    {f === 'sets' ? 'Best of 3 Sets' : '2 Games'}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {f === 'sets' ? 'Most sets wins the match' : 'Most game wins ranks higher'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Match Type</label>
            <div className="grid grid-cols-2 gap-3">
              {(['singles', 'doubles'] as const).map(mt => (
                <button
                  key={mt}
                  onClick={() => setMatchType(mt)}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    matchType === mt ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <div className="font-medium text-gray-900 text-sm">
                    {mt.charAt(0).toUpperCase() + mt.slice(1)}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {mt === 'singles' ? '1 player per team' : '2 players per team'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Groups</label>
              <input
                type="number" min={1} max={20}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
                value={groupCount}
                onChange={e => setGroupCount(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teams per Group</label>
              <input
                type="number" min={2} max={50}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
                value={teamCount}
                onChange={e => setTeamCount(Math.max(2, parseInt(e.target.value) || 2))}
              />
            </div>
          </div>

          <button
            onClick={initGroups}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Next: Add Teams →
          </button>
        </div>
      </div>
    </div>
  );
}
