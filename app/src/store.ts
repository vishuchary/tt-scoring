import { ref, set, remove, onValue, off } from 'firebase/database';
import { db } from './firebase';
import type { Tournament } from './types';

export function subscribeTournaments(callback: (tournaments: Tournament[]) => void): () => void {
  const tournamentsRef = ref(db, 'tournaments');
  const listener = onValue(tournamentsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const list = Object.values(data) as Tournament[];
    list.sort((a, b) => b.createdAt - a.createdAt);
    callback(list);
  });
  return () => off(tournamentsRef, 'value', listener);
}

export function saveTournament(t: Tournament): Promise<void> {
  return set(ref(db, `tournaments/${t.id}`), t);
}

export function deleteTournament(id: string): Promise<void> {
  return remove(ref(db, `tournaments/${id}`));
}
