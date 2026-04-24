import { useState, useRef, useEffect } from 'react';
import type { Tournament, TournamentLevel, Group, Match, Team, MatchFormat, Player } from '../types';
import { computeCrossGroupRankings, generateMatches } from '../rankings';
import GroupView from './GroupView';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

interface Props {
  tournament: Tournament;
  players: Player[];
  onUpdate: (t: Tournament) => void;
  onDelete: () => void;
  onBack: () => void;
}

function AdvanceSetup({
  levelGroups,
  format,
  nextLevelNum,
  onCreate,
  onCancel,
}: {
  levelGroups: Group[];
  format: MatchFormat;
  nextLevelNum: number;
  onCreate: (selectedTeamIds: string[], groupCount: number) => void;
  onCancel: () => void;
}) {
  const allStats = computeCrossGroupRankings(levelGroups, format);
  const totalTeams = allStats.length;
  const defaultN = Math.min(Math.max(2, Math.ceil(totalTeams / 2)), totalTeams);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(allStats.slice(0, defaultN).map(s => s.team.id))
  );
  const [quickN, setQuickN] = useState(defaultN);
  const [groupCount, setGroupCount] = useState(1);

  const selectedCount = selectedIds.size;
  const nextLevelName = selectedCount <= 2 ? 'Finals' : `Level ${nextLevelNum}`;
  const maxGroups = Math.max(1, Math.floor(selectedCount / 2));

  const teamGroupMap = new Map<string, string>();
  if (levelGroups.length > 1) {
    levelGroups.forEach(g => g.teams.forEach(t => teamGroupMap.set(t.id, g.name)));
  }

  function selectTop(n: number) {
    const v = Math.min(totalTeams, Math.max(2, n));
    setQuickN(v);
    setSelectedIds(new Set(allStats.slice(0, v).map(s => s.team.id)));
  }

  function toggleTeam(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 2) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex flex-col justify-end sm:justify-center sm:items-center sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Setup {nextLevelName}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="overflow-y-auto px-5 pb-3 space-y-5 flex-1">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Quick select top N</label>
              <input
                type="number"
                inputMode="numeric"
                min={2}
                max={totalTeams}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"
                value={quickN}
                onChange={e => selectTop(parseInt(e.target.value) || 2)}
              />
            </div>
            <p className="text-sm text-gray-500 pb-2 shrink-0">{selectedCount} selected</p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Tap to select / deselect
            </p>
            <div className="space-y-1.5">
              {allStats.map((s, i) => {
                const selected = selectedIds.has(s.team.id);
                const grpName = teamGroupMap.get(s.team.id);
                return (
                  <button
                    key={s.team.id}
                    onClick={() => toggleTeam(s.team.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm border transition-colors ${
                      selected
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <span className="w-5 text-center text-xs font-semibold text-gray-500">{i + 1}</span>
                    <div className="flex-1 min-w-0 text-left">
                      <span className="font-medium text-gray-900">{s.team.name}</span>
                      {grpName && <span className="text-xs text-gray-400 ml-1.5">{grpName}</span>}
                    </div>
                    <span className="text-gray-500 text-xs">{s.matchWins}W-{s.matchLosses}L</span>
                    <span className={`text-xs font-medium w-10 text-right ${s.pointDiff > 0 ? 'text-green-600' : s.pointDiff < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                      {s.pointDiff > 0 ? '+' : ''}{s.pointDiff}
                    </span>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                      selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}>
                      {selected && <span className="text-white text-xs leading-none">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Groups in {nextLevelName}
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={maxGroups}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              value={groupCount}
              onChange={e => setGroupCount(Math.min(maxGroups, Math.max(1, parseInt(e.target.value) || 1)))}
            />
            {groupCount > 1 && (
              <p className="text-xs text-gray-400 mt-1">Teams will be seeded across {groupCount} groups</p>
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={() => onCreate([...selectedIds], groupCount)}
            disabled={selectedCount < 2}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            Create {nextLevelName} ({selectedCount} teams) →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TournamentView({ tournament, players, onUpdate, onDelete, onBack }: Props) {
  const [viewLevel, setViewLevel] = useState(tournament.levels.length - 1);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    tournament.levels[tournament.levels.length - 1]?.groups[0]?.id ?? null
  );
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(tournament.name);
  const [showAdvance, setShowAdvance] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const prevLevelsLength = useRef(tournament.levels.length);

  useEffect(() => {
    if (editingName) nameRef.current?.select();
  }, [editingName]);

  useEffect(() => {
    if (!editingName) setNameInput(tournament.name);
  }, [tournament.name, editingName]);

  useEffect(() => {
    if (tournament.levels.length > prevLevelsLength.current) {
      const newIdx = tournament.levels.length - 1;
      setViewLevel(newIdx);
      setSelectedGroupId(tournament.levels[newIdx]?.groups[0]?.id ?? null);
    }
    prevLevelsLength.current = tournament.levels.length;
  }, [tournament.levels.length]);

  const level = tournament.levels[viewLevel];
  const isLatestLevel = viewLevel === tournament.levels.length - 1;
  const allLevelMatches = level?.groups.flatMap(g => g.matches) ?? [];
  const levelComplete = allLevelMatches.length > 0 && allLevelMatches.every(m => m.completed);
  const isFinals = level?.groups.length === 1 && level.groups[0].teams.length === 2;

  function commitName() {
    const name = nameInput.trim() || tournament.name;
    setNameInput(name);
    setEditingName(false);
    if (name !== tournament.name) onUpdate({ ...tournament, name });
  }

  function handleGroupUpdate(levelIdx: number, group: Group) {
    onUpdate({
      ...tournament,
      levels: tournament.levels.map((l, i) =>
        i !== levelIdx ? l : { ...l, groups: l.groups.map(g => g.id === group.id ? group : g) }
      ),
    });
  }

  function handleCreateNextLevel(selectedTeamIds: string[], groupCount: number) {
    const allStats = computeCrossGroupRankings(level.groups, tournament.format);
    const advancing = allStats.filter(s => selectedTeamIds.includes(s.team.id));
    const nextLevelNum = tournament.levels.length + 1;
    const newLevelName = advancing.length <= 2 ? 'Finals' : `Level ${nextLevelNum}`;

    const groupTeamsList: Team[][] = Array.from({ length: groupCount }, () => []);
    advancing.forEach((s, i) => {
      const round = Math.floor(i / groupCount);
      const pos = round % 2 === 0 ? i % groupCount : groupCount - 1 - (i % groupCount);
      groupTeamsList[pos].push({ ...s.team });
    });

    const newGroups: Group[] = groupTeamsList
      .filter(gTeams => gTeams.length > 0)
      .map((gTeams, gi) => {
        const matchPairs = generateMatches(gTeams);
        const matches: Match[] = matchPairs.map(p => ({
          id: uid(),
          team1Id: p.team1Id,
          team2Id: p.team2Id,
          games: [],
          completed: false,
        }));
        return {
          id: uid(),
          name: groupCount > 1 ? `Group ${String.fromCharCode(65 + gi)}` : newLevelName,
          teams: gTeams,
          matches,
        };
      });

    const newLevel: TournamentLevel = { id: uid(), name: newLevelName, groups: newGroups };
    onUpdate({ ...tournament, levels: [...tournament.levels, newLevel] });
    setShowAdvance(false);
  }

  const selectedGroup =
    level?.groups.find(g => g.id === selectedGroupId) ?? level?.groups[0] ?? null;

  let winner: Team | null = null;
  if (isFinals && levelComplete && level) {
    winner = computeCrossGroupRankings(level.groups, tournament.format)[0]?.team ?? null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showAdvance && level && (
        <AdvanceSetup
          levelGroups={level.groups}
          format={tournament.format}
          nextLevelNum={tournament.levels.length + 1}
          onCreate={handleCreateNextLevel}
          onCancel={() => setShowAdvance(false)}
        />
      )}

      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button onClick={onBack} className="text-gray-500 hover:text-gray-700 shrink-0">← Back</button>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <input
                  ref={nameRef}
                  className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-400 outline-none w-full"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onBlur={commitName}
                  onKeyDown={e => e.key === 'Enter' && commitName()}
                />
              ) : (
                <h1
                  className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors truncate"
                  title="Tap to rename"
                  onClick={() => setEditingName(true)}
                >
                  {tournament.name}
                </h1>
              )}
              <p className="text-sm text-gray-500">
                {tournament.format === 'sets' ? 'Best of 3 Sets' : '2 Games'} format
              </p>
            </div>
          </div>
          <button
            onClick={() => { if (confirm('Delete this tournament?')) onDelete(); }}
            className="text-red-400 hover:text-red-600 text-sm shrink-0 ml-4"
          >
            Delete
          </button>
        </div>

        {tournament.levels.length > 1 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {tournament.levels.map((l, i) => {
              const lMatches = l.groups.flatMap(g => g.matches);
              const lDone = lMatches.length > 0 && lMatches.every(m => m.completed);
              return (
                <button
                  key={l.id}
                  onClick={() => {
                    setViewLevel(i);
                    setSelectedGroupId(l.groups[0]?.id ?? null);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                    i === viewLevel
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300'
                  }`}
                >
                  {l.name}{lDone ? ' ✓' : ''}
                </button>
              );
            })}
          </div>
        )}

        {level && level.groups.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {level.groups.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGroupId(g.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  g.id === selectedGroupId
                    ? 'bg-gray-800 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}

        {selectedGroup && (
          <GroupView
            group={selectedGroup}
            allGroups={level?.groups}
            format={tournament.format}
            players={players}
            onUpdate={g => handleGroupUpdate(viewLevel, g)}
          />
        )}

        {isLatestLevel && levelComplete && (
          <div className={`mt-6 rounded-xl p-5 border ${
            isFinals ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
          }`}>
            {isFinals && winner ? (
              <div className="text-center py-2">
                <p className="text-5xl mb-3">🏆</p>
                <p className="text-2xl font-bold text-yellow-800">{winner.name}</p>
                <p className="text-sm text-yellow-700 mt-1">Tournament Champion!</p>
              </div>
            ) : (
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-green-800 font-semibold">✅ {level.name} complete!</p>
                  <p className="text-sm text-green-700 mt-0.5">All {allLevelMatches.length} matches played</p>
                </div>
                <button
                  onClick={() => setShowAdvance(true)}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  Setup Level {tournament.levels.length + 1} →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
