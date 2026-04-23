# TT Tournament Scoring

A real-time ping pong tournament scoring app. Runs as a PWA installable on iPhone, with live score sync across all players via Firebase.

**Live app:** https://app-iota-ashen.vercel.app

---

## Architecture

```
Browser / iPhone PWA
        │
        ▼
React + Vite (app/)
        │
        ▼
Firebase Realtime Database
        │
        ▼
All connected clients update instantly
```

### Source files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root component — manages view routing (home / new / tournament), Firebase subscription, CRUD handlers |
| `src/types.ts` | TypeScript data model: Tournament, Group, Team, Match, Game, TeamStats |
| `src/firebase.ts` | Firebase app initialisation — exports `db` |
| `src/store.ts` | Database API — `subscribeTournaments`, `saveTournament`, `deleteTournament`; normalises Firebase array serialisation on read |
| `src/rankings.ts` | Pure logic — `generateMatches` (round-robin), `computeStandings`, `gameWinner` |
| `src/components/TournamentSetup.tsx` | Multi-step tournament creation form (name/format/groups → teams/players) |
| `src/components/TournamentView.tsx` | Tournament detail — group tabs, delegates to GroupView |
| `src/components/GroupView.tsx` | Match list + standings table for a group; opens MatchEntry modal |
| `src/components/MatchEntry.tsx` | Score entry bottom sheet; highlights winning scores in real time |

### Data model

```
Tournament
  id, name, format ('sets' | 'games'), createdAt
  └── groups[]
        id, name
        ├── teams[]   id, name, type ('singles'|'doubles'), players[]
        └── matches[] id, team1Id, team2Id, completed, games[]
                                                           team1Score, team2Score
```

Standings are computed on the fly from match data — nothing is stored pre-aggregated.

### Scoring rules

- A game is won when a team reaches **≥ 11 points** with a **≥ 2 point lead**
- At deuce (10-10) play continues until one team leads by 2 (12-10, 13-11, …)
- **Sets format** — match winner has more sets won; tiebreak by point differential
- **Games format** — match winner has more games won; tiebreak by point differential

### Real-time sync flow

```
User saves score
      │
      ▼
Optimistic local state update (instant UI)
      │
      ▼
saveTournament() → Firebase set()
      │
      ▼
Firebase onValue() fires on all clients
      │
      ▼
subscribeTournaments callback → setTournaments()
      │
      ▼
React re-renders with confirmed data
```

Firebase arrays are normalised on read because Firebase drops empty arrays and returns non-empty arrays as objects with numeric keys (`store.ts: toArray()`).

### Home screen behaviour

- On load, auto-navigates to the most recent **in-progress** tournament (has at least one completed match but not all)
- Otherwise shows the home screen split into **In Progress** and **History** sections

---

## Development

```bash
cd app
npm install
npm run dev          # localhost:5173
npm run dev -- --host  # + network URL for iPhone testing (same Wi-Fi)
npm run build        # production build
```

**iPhone testing (local):** open the Network URL in Safari → Share → Add to Home Screen.

---

## Deployment

Hosted on Vercel, connected to the GitHub repo. Every push to `main` auto-deploys.

**Manual deploy:**
```bash
cd app
vercel --prod
```

**Firebase project:** `tt-scoring-60039`  
Database URL: `https://tt-scoring-60039-default-rtdb.firebaseio.com`

Firebase rules must allow read/write (set in the Firebase console under Realtime Database → Rules):
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

---

## Key dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19 | UI |
| firebase | ^12 | Realtime Database |
| tailwindcss | ^4 | Styling |
| vite-plugin-pwa | ^1.2 | Service worker, offline support, installable |
| vite | ^8 | Build tool |
| typescript | ~6 | Type safety |
