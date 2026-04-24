# Mountain House TT Club — Scoring App

A real-time table tennis tournament scoring PWA for Mountain House TT Club. Players view live scores from any device. Admins create and manage tournaments via a PIN-protected admin mode.

**Live app:** https://app-iota-ashen.vercel.app

---

## Architecture

```
Browser / iPhone PWA
        │
        ▼
React 19 + Vite 8 (app/)
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
| `src/App.tsx` | Root — view routing, Firebase subscriptions, admin state |
| `src/types.ts` | TypeScript data model: Tournament, TournamentLevel, Group, Team, Match, Game, Player |
| `src/firebase.ts` | Firebase app init — exports `db` |
| `src/store.ts` | Firebase CRUD + `toArray()` normaliser for Firebase array serialisation |
| `src/rankings.ts` | Pure logic — `generateMatches`, `computeStandings`, `computePlayerRankings` |
| `src/components/TournamentSetup.tsx` | 3-step creation wizard: meta (+ mode) → select players → configure groups (random or custom) |
| `src/components/TournamentView.tsx` | Tournament detail — level tabs, lock/admin, advancement sheet |
| `src/components/GroupView.tsx` | Matches / Standings / Teams tabs within a group |
| `src/components/MatchEntry.tsx` | Score entry bottom sheet (readOnly prop for locked view) |
| `src/components/PlayerPicker.tsx` | Player selection modal with used-name exclusion |
| `src/components/PlayersScreen.tsx` | Player profile management (add/edit/delete) |
| `src/components/RankingsScreen.tsx` | IPL-style player leaderboard |
| `src/components/AdminLogin.tsx` | PIN entry modal |

### Data model

```
Tournament
  id, name, format ('sets'|'games'), matchType ('singles'|'doubles'), createdAt
  └── levels[]                          ← TournamentLevel
        id, name ('Level 1', 'Finals', …)
        └── groups[]
              id, name ('Group A', …)
              ├── teams[]    id, name, type, players: string[]
              └── matches[]  id, team1Id, team2Id, completed, games[]
                                                               team1Score, team2Score
```

Standings and rankings are computed on the fly — nothing is stored pre-aggregated.

### Scoring rules

- A game is won when a team reaches **≥ 11 points** with a **≥ 2 point lead**
- At deuce (10-10) play continues until one team leads by 2
- **Sets format** — match winner has more sets won; tiebreak by point differential
- **Games format** — match winner has more games won; tiebreak by point differential

### Player ranking scoring

| Event | Points |
|-------|--------|
| Participate in a level | +2 |
| Win an individual game | +2 |
| Tournament winner | +2 bonus |
| Tournament runner-up | +1 bonus |

Tied players get the same rank; next rank skips (1, 1, 3, …). Non-admins see top N players only (configurable via `VITE_PUBLIC_RANKINGS_LIMIT`, default 5). Score breakdown (P/G/B) visible to admins only.

### Real-time sync

```
User saves score → optimistic local state update (instant)
                 → saveTournament() → Firebase set()
                 → Firebase onValue() fires on all clients
                 → React re-renders with confirmed data
```

Firebase arrays are normalised on read because Firebase drops empty arrays and returns non-empty arrays as `{"0":a,"1":b}` objects (`store.ts: toArray()`).

---

## Development

```bash
cd app
npm install
npm run dev            # localhost:5173
npm run dev -- --host  # + network URL for iPhone testing (same Wi-Fi)
npm run build          # production build
```

**iPhone testing (local):** open the Network URL in Safari → Share → Add to Home Screen.

---

## Deployment

Hosted on Vercel. Manual deploy:

```bash
cd app
vercel --prod --yes
```

**Firebase project:** `tt-scoring-60039`
Database URL: `https://tt-scoring-60039-default-rtdb.firebaseio.com`

Firebase rules (set in Firebase console → Realtime Database → Rules):
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

---

## Environment variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_ADMIN_PIN` | Admin login PIN | `1234` |
| `VITE_PUBLIC_RANKINGS_LIMIT` | Max players shown in rankings for non-admins | `5` |

Set in Vercel: Project → Settings → Environment Variables.  
Local: edit `app/.env`.

---

## Key dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19 | UI |
| firebase | ^12 | Realtime Database |
| tailwindcss | ^4 | Styling |
| vite-plugin-pwa | ^1.2 | Service worker, offline, installable |
| vite | ^8 | Build tool |
| typescript | ~6 | Type safety |
