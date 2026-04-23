import { useState } from 'react';
import type { Player } from '../types';
import { savePlayer, deletePlayer } from '../store';

interface Props {
  players: Player[];
  onBack: () => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function PlayersScreen({ players, onBack }: Props) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    savePlayer({ id: uid(), name });
    setNewName('');
  }

  function startEdit(p: Player) {
    setEditingId(p.id);
    setEditName(p.name);
  }

  function handleSaveEdit(p: Player) {
    const name = editName.trim();
    if (name && name !== p.name) savePlayer({ ...p, name });
    setEditingId(null);
  }

  function handleDelete(id: string) {
    if (confirm('Remove this player?')) deletePlayer(id);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto p-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>
          <h1 className="text-xl font-bold text-gray-900">Players</h1>
        </div>

        {/* Add new player */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Add Player</label>
          <div className="flex gap-2">
            <input
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
              placeholder="Player name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Player list */}
        {players.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">👤</div>
            <p>No players yet</p>
            <p className="text-sm mt-1">Add players above to select them when creating tournaments</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {players.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                {editingId === p.id ? (
                  <>
                    <input
                      autoFocus
                      className="flex-1 border border-blue-400 rounded-lg px-3 py-1.5 text-sm outline-none"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveEdit(p);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                    <button onClick={() => handleSaveEdit(p)} className="text-blue-600 text-sm font-medium hover:underline">Save</button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 text-sm hover:underline">Cancel</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-gray-900">{p.name}</span>
                    <button onClick={() => startEdit(p)} className="text-gray-400 hover:text-blue-500 text-sm px-1">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-gray-300 hover:text-red-400 text-lg leading-none px-1">×</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
