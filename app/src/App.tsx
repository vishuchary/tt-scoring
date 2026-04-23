import { useState, useEffect, useRef } from 'react';
import type { Tournament, Player } from './types';
import { subscribeTournaments, saveTournament, deleteTournament, subscribePlayers } from './store';
import TournamentSetup from './components/TournamentSetup';
import TournamentView from './components/TournamentView';
import PlayersScreen from './components/PlayersScreen';
import './index.css';

type View =
  | { type: 'home' }
  | { type: 'new' }
  | { type: 'tournament'; id: string }
  | { type: 'players' };

function getTournamentStatus(t: Tournament): 'not-started' | 'in-progress' | 'completed' {
  const allMatches = t.groups.flatMap(g => g.matches);
  if (allMatches.length === 0) return 'not-started';
  const completedCount = allMatches.filter(m => m.completed).length;
  if (completedCount === 0) return 'not-started';
  if (completedCount === allMatches.length) return 'completed';
  return 'in-progress';
}

function TournamentCard({ t, onClick }: { t: Tournament; onClick: () => void }) {
  const status = getTournamentStatus(t);
  const allMatches = t.groups.flatMap(g => g.matches);
  const completedCount = allMatches.filter(m => m.completed).length;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border p-5 cursor-pointer hover:shadow-sm transition-all ${
        status === 'in-progress' ? 'border-blue-300 hover:border-blue-400' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-semibold text-gray-900 truncate">{t.name}</h2>
            {status === 'in-progress' && (
              <span className="shrink-0 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Live</span>
            )}
            {status === 'completed' && (
              <span className="shrink-0 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Done</span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {t.groups.length} group{t.groups.length !== 1 ? 's' : ''} &middot;{' '}
            {t.format === 'sets' ? 'Best of 3 Sets' : '2 Games'} &middot;{' '}
            {new Date(t.createdAt).toLocaleDateString()}
          </p>
          {allMatches.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {completedCount} / {allMatches.length} matches played
            </p>
          )}
        </div>
        <span className="text-gray-400 text-xl ml-4">&rsaquo;</span>
      </div>
    </div>
  );
}

export default function App() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [view, setView] = useState<View>({ type: 'home' });
  const hasAutoNavigated = useRef(false);

  useEffect(() => {
    const unsubscribeTournaments = subscribeTournaments((list) => {
      setTournaments(list);
      if (!hasAutoNavigated.current && list.length > 0) {
        hasAutoNavigated.current = true;
        const inProgress = list.find(t => getTournamentStatus(t) === 'in-progress');
        if (inProgress) setView({ type: 'tournament', id: inProgress.id });
      }
    });
    const unsubscribePlayers = subscribePlayers(setPlayers);
    return () => {
      unsubscribeTournaments();
      unsubscribePlayers();
    };
  }, []);

  function handleCreate(t: Tournament) {
    setTournaments(prev => [t, ...prev]);
    saveTournament(t);
    setView({ type: 'tournament', id: t.id });
  }

  function handleUpdate(t: Tournament) {
    setTournaments(prev => prev.map(x => x.id === t.id ? t : x));
    saveTournament(t);
  }

  function handleDelete(id: string) {
    deleteTournament(id);
    setView({ type: 'home' });
  }

  if (view.type === 'new') {
    return (
      <TournamentSetup
        seq={tournaments.length + 1}
        players={players}
        onCreate={handleCreate}
        onCancel={() => setView({ type: 'home' })}
      />
    );
  }

  if (view.type === 'players') {
    return <PlayersScreen players={players} onBack={() => setView({ type: 'home' })} />;
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

  const inProgress = tournaments.filter(t => getTournamentStatus(t) === 'in-progress');
  const history = tournaments.filter(t => getTournamentStatus(t) !== 'in-progress');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🏓 TT Tournament</h1>
            <p className="text-gray-500 mt-1">Ping Pong Tournament Scoring</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView({ type: 'players' })}
              className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:border-gray-300 transition-colors text-sm"
            >
              Players {players.length > 0 && <span className="text-gray-400">({players.length})</span>}
            </button>
            <button
              onClick={() => setView({ type: 'new' })}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              + New
            </button>
          </div>
        </div>

        {tournaments.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-6xl mb-4">🏓</div>
            <p className="text-xl">No tournaments yet</p>
            <p className="mt-2">Create your first tournament to get started</p>
          </div>
        ) : (
          <div className="space-y-8">
            {inProgress.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">In Progress</h2>
                <div className="grid gap-3">
                  {inProgress.map(t => (
                    <TournamentCard key={t.id} t={t} onClick={() => setView({ type: 'tournament', id: t.id })} />
                  ))}
                </div>
              </section>
            )}
            {history.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">History</h2>
                <div className="grid gap-3">
                  {history.map(t => (
                    <TournamentCard key={t.id} t={t} onClick={() => setView({ type: 'tournament', id: t.id })} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
