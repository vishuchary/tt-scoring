import { ref, set, remove, onValue, off } from 'firebase/database';
import { db } from './firebase';
import type { Tournament, Group, Match } from './types';

// Firebase drops empty arrays and converts arrays to objects with numeric keys.
// This normalizes them back to proper JS arrays on read.
function toArray<T>(val: unknown): T[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as T[];
  return Object.values(val as object) as T[];
}

function normalizeTournament(t: Tournament): Tournament {
  return {
    ...t,
    groups: toArray<Group>(t.groups).map(g => ({
      ...g,
      teams: toArray(g.teams),
      matches: toArray<Match>(g.matches).map(m => ({
        ...m,
        games: toArray(m.games),
      })),
    })),
  };
}

export function subscribeTournaments(callback: (tournaments: Tournament[]) => void): () => void {
  const tournamentsRef = ref(db, 'tournaments');
  const listener = onValue(tournamentsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const list = (Object.values(data) as Tournament[]).map(normalizeTournament);
    list.sort((a, b) => b.createdAt - a.createdAt);
    callback(list);
  });
  return () => off(tournamentsRef, 'value', listener);
}

export function saveTournament(t: Tournament): Promise<void> {
  return set(ref(db, `tournaments/${t.id}`), t)
    .catch(err => console.error('Firebase save failed:', err));
}

export function deleteTournament(id: string): Promise<void> {
  return remove(ref(db, `tournaments/${id}`))
    .catch(err => console.error('Firebase delete failed:', err));
}
