import { useState, useRef, useEffect } from 'react';
import type { Tournament, Group } from '../types';
import GroupView from './GroupView';

interface Props {
  tournament: Tournament;
  onUpdate: (t: Tournament) => void;
  onDelete: () => void;
  onBack: () => void;
}

export default function TournamentView({ tournament, onUpdate, onDelete, onBack }: Props) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(
    tournament.groups[0]?.id ?? null
  );
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(tournament.name);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingName) nameRef.current?.select();
  }, [editingName]);

  // Keep input in sync if tournament name changes via Firebase
  useEffect(() => {
    if (!editingName) setNameInput(tournament.name);
  }, [tournament.name, editingName]);

  function commitName() {
    const name = nameInput.trim() || tournament.name;
    setNameInput(name);
    setEditingName(false);
    if (name !== tournament.name) onUpdate({ ...tournament, name });
  }

  function handleGroupUpdate(group: Group) {
    onUpdate({
      ...tournament,
      groups: tournament.groups.map(g => g.id === group.id ? group : g),
    });
  }

  const group = tournament.groups.find(g => g.id === selectedGroup);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
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

        {/* Group tabs */}
        {tournament.groups.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {tournament.groups.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGroup(g.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  g.id === selectedGroup
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}

        {group && (
          <GroupView
            group={group}
            format={tournament.format}
            onUpdate={handleGroupUpdate}
          />
        )}
      </div>
    </div>
  );
}
