import { useState, useEffect } from 'react';
import type { Tournament } from './types';
import { subscribeTournaments, saveTournament, deleteTournament } from './store';
import TournamentSetup from './components/TournamentSetup';
import TournamentView from './components/TournamentView';
import './index.css';

type View =
  | { type: 'home' }
  | { type: 'new' }
  | { type: 'tournament'; id: string };

export default function App() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [view, setView] = useState<View>({ type: 'home' });

  useEffect(() => {
    const unsubscribe = subscribeTournaments(setTournaments);
    return unsubscribe;
  }, []);

  function handleCreate(t: Tournament) {
    saveTournament(t);
    setView({ type: 'tournament', id: t.id });
  }

  function handleUpdate(t: Tournament) {
    saveTournament(t);
  }

  function handleDelete(id: string) {
    deleteTournament(id);
    setView({ type: 'home' });
  }

  if (view.type === 'new') {
    return <TournamentSetup onCreate={handleCreate} onCancel={() => setView({ type: 'home' })} />;
  }

  if (view.type === 'tournament') {
    const t = tournaments.find(x => x.id === view.id);
    if (!t) return null;
    return (
      <TournamentView
        tournament={t}
        onUpdate={handleUpdate}
        onDelete={() => handleDelete(t.id)}
        onBack={() => setView({ type: 'home' })}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🏓 TT Tournament</h1>
            <p className="text-gray-500 mt-1">Ping Pong Tournament Scoring</p>
          </div>
          <button
            onClick={() => setView({ type: 'new' })}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            + New Tournament
          </button>
        </div>

        {tournaments.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-6xl mb-4">🏓</div>
            <p className="text-xl">No tournaments yet</p>
            <p className="mt-2">Create your first tournament to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tournaments.map(t => (
              <div
                key={t.id}
                onClick={() => setView({ type: 'tournament', id: t.id })}
                className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{t.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {t.groups.length} group{t.groups.length !== 1 ? 's' : ''} &middot;{' '}
                      {t.format === 'sets' ? 'Best of 3 Sets' : '2 Games'} &middot;{' '}
                      {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-gray-400 text-xl">&rsaquo;</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
