# Mountain House TT Club — Requirements & Recreation Guide

## What It Is

A Progressive Web App (PWA) for running table tennis tournaments at Mountain House TT Club. Players can view live scores in real time from any device. Admins create and manage tournaments via a PIN-protected admin mode. Hosted on Vercel, data synced via Firebase Realtime Database.

**Live URL:** https://app-iota-ashen.vercel.app

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 (Vite plugin) |
| Database | Firebase Realtime Database |
| Hosting | Vercel |
| PWA | vite-plugin-pwa (autoUpdate service worker) |

Key config files:
- `app/vite.config.ts` — Vite + Tailwind + PWA plugin
- `app/.npmrc` — `legacy-peer-deps=true` (vite-plugin-pwa peer conflict with Vite 8)
- `app/vercel.json` — Vercel build config (root: app/, SPA rewrites)
- `app/src/firebase.ts` — Firebase init with `firebaseConfig`

---

## Full Feature Requirements

### 1. Home Screen
- Club banner photo (`/public/banner.jpg`) as full-width header with gradient overlay
- Title: "🏓 Mountain House TT Club" overlaid on banner
- Two sections: **In Progress** (live tournaments) and **History** (completed)
- Auto-navigates to the active in-progress tournament on first load
- Completed tournaments show a 🔒 lock icon and "Done" badge
- **Admin mode**: 🔑 Admin button opens PIN modal; when active, "Admin ✓ · Exit" button shows on banner
- **+ New** button only visible in admin mode
- Rankings and Players buttons always visible

### 2. Player Profiles

Fields: Name (required), Age, Sex (Male/Female, default Male), Handedness (Right/Left, default Right), Place (default "Mountain House")

- Stored in Firebase at `/players/{id}`
- Listed alphabetically
- Editable and deletable at any time

### 3. Tournament Creation (3-step wizard)

**Step 1 — Meta:**
- Tournament name (default: `Tournament_N`)
- Match format: "Best of 3 Sets" or "2 Games"
- Match type: Singles or Doubles (applies to all teams in the tournament)

**Step 2 — Select Players:**
- Checkbox list of all registered players
- Selected players shown in an ordered list with ↑↓ reorder arrows and × remove
- **Singles**: each selected player becomes one team (team name = player name)
- **Doubles**: consecutive pairs in selection order become teams (1+2, 3+4, …); team name = `P1_P2`
- Warning if odd number selected in doubles mode
- "Next" disabled until ≥2 teams formed

**Step 3 — Configure Groups:**
- Number of groups input (clamped to 1…team count)
- Live preview: shows each group with its auto-assigned teams and match count
- Teams distributed via serpentine seeding (0→A, 1→B, 2→B, 3→A, …)
- "Create Tournament" button

### 4. Scoring

**Match entry (bottom sheet modal):**
- TT rules: win a game with ≥11 points AND ≥2 point lead
- Sets format: best of 3 sets
- Games format: 2 games, most game wins decides match winner
- Score input selects all text on focus (prevents 0-prepend bug)
- Save marks match as completed; Clear resets scores
- `readOnly` mode: shows scores without inputs or Save/Clear buttons (for locked tournaments)

### 5. Multi-Level Tournament

**Level 1:** Round-robin within each group (all vs all).

**When Level N is complete (all matches done):**
- Green "✅ Level N complete!" banner appears
- "Setup Level N+1 →" button opens the advancement sheet

**Advancement sheet:**
- Ranked team list (cross-group ranking: match wins → set wins → point diff)
- Checkbox per team; minimum 2 selected
- "Quick select top N" number input auto-checks top N
- "Groups in Level N+1" input
- Teams distributed via serpentine seeding across new groups
- Level name: "Finals" if 2 teams selected, else "Level N+1"

**Finals:** When a 1-group, 2-team level completes, shows 🏆 champion banner.

**Level tabs:** All levels accessible; completed levels show ✓.

### 6. Standings (within a group)

Columns: Rank, Team, MP, W, L, Sets W-L (sets format only), Pts +/-, Diff
Sort: match wins → point diff
Medal icons for top 3: 🥇🥈🥉

### 7. Editing After Creation

All names editable while tournament is unlocked:
- Tournament name: tap to edit inline in header
- Team name: InlineInput in Teams tab
- Player slot: tap to open PlayerPicker (registry + custom name option)
- PlayerPicker excludes names used in ANY team/group in the same level (cross-group exclusion)

### 8. Admin / Lock System

- Completed tournaments are automatically **locked** (view-only for all users)
- Lock indicator: 🔒 on tournament cards and in tournament header
- "Admin Login" link in lock banner inside TournamentView
- Admin PIN modal (`VITE_ADMIN_PIN` env var, default `1234`)
- Admin mode is session-only (resets on page refresh — by design)
- When admin: Delete button visible, names editable, scores enterable, + New button visible
- Non-admin: read-only for locked tournaments (scores still viewable)

### 9. Player Rankings

Scoring system (computed dynamically, not stored):

| Event | Points |
|---|---|
| Participate in a level | +2 |
| Win an individual game | +2 |
| Tournament winner (last level) | +2 bonus |
| Tournament runner-up (last level) | +1 bonus |

**Ranking rules:**
- Sorted by total points descending; game wins as tiebreaker
- Same score = same rank; next rank skips (1, 1, 3, 4, …)
- Point differential used as tiebreaker when game wins are tied in a match

**Rankings screen (IPL-style):**
- Top 3 ranks shown as gradient podium cards (gold/silver/bronze)
- Tied players at same rank shown together with "Tied — Rank N" label
- Remaining players as compact rows with progress bars
- Non-admins see only players ranked ≤ `VITE_PUBLIC_RANKINGS_LIMIT` (default 5); footer shows hidden count
- Score breakdown (P = participation, G = game wins, B = bonus) visible to admins only

### 10. Real-time Sync

- All data (tournaments + players) synced live via Firebase `onValue` listeners
- Optimistic UI: local state updated immediately, Firebase confirms async
- Multiple devices see live score changes instantly

### 11. PWA

- Installable on iPhone via Safari → Add to Home Screen
- Works offline (Workbox service worker caches all assets)
- `display: standalone`, portrait orientation
- `autoUpdate` — service worker updates silently in background

---

## Data Model (`src/types.ts`)

```typescript
type MatchFormat = 'sets' | 'games';

interface Player {
  id: string; name: string;
  age?: number; sex?: 'male' | 'female';
  hand?: 'right' | 'left'; place?: string;
}

interface Team {
  id: string; name: string;
  type: 'singles' | 'doubles'; players: string[];
}

interface Game { team1Score: number; team2Score: number; }

interface Match {
  id: string; team1Id: string; team2Id: string;
  games: Game[]; completed: boolean;
}

interface Group { id: string; name: string; teams: Team[]; matches: Match[]; }

interface TournamentLevel { id: string; name: string; groups: Group[]; }

interface Tournament {
  id: string; name: string;
  format: MatchFormat; matchType?: 'singles' | 'doubles';
  levels: TournamentLevel[]; createdAt: number;
}
```

**PlayerRanking** (computed, not stored):
```typescript
interface PlayerRanking {
  name: string; points: number;
  participationPts: number; gameWinPts: number; bonusPts: number;
  gameWins: number; matchesPlayed: number;
}
```

**Firebase gotcha:** Firebase drops empty arrays and serializes non-empty arrays as `{"0":x,"1":y}` objects. The `toArray<T>()` normalizer in `store.ts` handles both on read. Old tournaments that stored `groups` at the top level (before multi-level support) are auto-migrated to `levels[0].groups` on read.

---

## File Structure

```
app/
  .env                           # VITE_PUBLIC_RANKINGS_LIMIT=5
  vercel.json                    # Vercel build + SPA rewrite config
  src/
    App.tsx                      # Home screen, admin state, routing
    types.ts                     # All TypeScript interfaces
    store.ts                     # Firebase CRUD + normalisation
    rankings.ts                  # computeStandings, computePlayerRankings, generateMatches
    firebase.ts                  # Firebase app init
    components/
      TournamentSetup.tsx        # 3-step tournament creation wizard
      TournamentView.tsx         # Tournament view + level tabs + AdvanceSetup sheet
      GroupView.tsx              # Matches / Standings / Teams tabs
      MatchEntry.tsx             # Score entry bottom sheet (supports readOnly)
      PlayerPicker.tsx           # Player selection modal with usedNames exclusion
      PlayersScreen.tsx          # Player profile management
      RankingsScreen.tsx         # IPL-style player rankings leaderboard
      AdminLogin.tsx             # PIN entry modal
  public/
    banner.jpg                   # Club group photo
    pwa-192.png / pwa-512.png    # PWA icons
```

---

## Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `VITE_ADMIN_PIN` | Admin login PIN | `1234` |
| `VITE_PUBLIC_RANKINGS_LIMIT` | Max players shown in rankings for non-admins | `5` |

Set in Vercel: Project → Settings → Environment Variables.
Local: edit `app/.env`.

---

## Prompts to Recreate (Step by Step)

Use these prompts with Claude Code in sequence. Each builds on the previous.

---

### Prompt 1 — Project Scaffold

```
Create a React 19 + TypeScript + Vite 8 app in a folder called `app/`.
Add Tailwind CSS 4 (use @tailwindcss/vite plugin, not postcss).
Add Firebase 11 (firebase/app, firebase/database).
Add vite-plugin-pwa for PWA support.
Add an .npmrc with legacy-peer-deps=true to handle peer dep conflicts.

Create src/firebase.ts that initializes Firebase with a placeholder firebaseConfig.
Export `db` as the Realtime Database instance.

Create src/types.ts with these interfaces:
- MatchFormat = 'sets' | 'games'
- Player { id, name, age?, sex?, hand?, place? }
- Team { id, name, type: 'singles'|'doubles', players: string[] }
- Game { team1Score, team2Score }
- Match { id, team1Id, team2Id, games: Game[], completed }
- Group { id, name, teams, matches }
- TournamentLevel { id, name, groups }
- Tournament { id, name, format, matchType?, levels: TournamentLevel[], createdAt }
- TeamStats (matchesPlayed, matchWins, matchLosses, setWins, setLosses,
             gameWins, gameLosses, pointsFor, pointsAgainst, pointDiff, rank)
- PlayerRanking { name, points, participationPts, gameWinPts, bonusPts, gameWins, matchesPlayed }

Create src/store.ts with Firebase CRUD:
- IMPORTANT: Firebase drops empty arrays and converts arrays to {0: x, 1: y} objects.
  Write toArray<T>() to normalize both cases.
  normalizeTournament(raw) handles old format (groups at top level, before multi-level)
  and new format (levels array); calls toArray on all nested arrays including team.players.
- subscribeTournaments(callback) — onValue listener, sorted by createdAt desc
- saveTournament(t), deleteTournament(id)
- subscribePlayers(callback) — onValue listener, sorted alphabetically
- savePlayer(p), deletePlayer(id)

Create src/rankings.ts:
- gameWinner(s1, s2): win requires >=11 pts AND >=2 pt lead
- computeStandings(group, format): TeamStats[] sorted by matchWins then pointDiff
- computeCrossGroupRankings(groups, format): flatMap standings, re-sort by matchWins→setWins→pointDiff
- generateMatches(teams): round-robin pairs
- computePlayerRankings(tournaments): PlayerRanking[]
  Scoring per tournament:
    +2 per level participated (any team in any group of that level)
    +2 per individual game won
    +2 winner bonus / +1 runner-up bonus from last completed level
  When game wins are tied in a match, use point differential as tiebreaker.
  Sort by points desc, then gameWins desc.
```

---

### Prompt 2 — Home Screen & App Shell

```
Create src/App.tsx with:
- State: tournaments[], players[], view (home/new/tournament/players/rankings),
  isAdmin, showAdminLogin
- useEffect: subscribeTournaments + subscribePlayers on mount
- Auto-navigate to in-progress tournament on first load (use a ref)
- getTournamentStatus(t): not-started / in-progress / completed
- TournamentCard: name, status badge (Live/Done), 🔒 for completed,
  level/group count, format, date, match progress
- Home layout:
  - Full-width banner with gradient overlay, title overlaid
  - "Admin ✓ · Exit" on banner when admin
  - Header row: 🔑 Admin (when not admin), Rankings, Players, + New (admin only)
  - In Progress section + History section
- Rankings view → RankingsScreen with isAdmin prop
- Pass isAdmin + onRequestAdmin to TournamentView
```

---

### Prompt 3 — Admin Login

```
Create src/components/AdminLogin.tsx:
- Bottom sheet modal (fixed, bottom on mobile, centered on sm+)
- Password input (type=password, inputMode=numeric)
- Compare to import.meta.env.VITE_ADMIN_PIN || '1234'
- Show "Incorrect PIN" on failure, clear input
- Props: onSuccess(), onCancel()
```

---

### Prompt 4 — Player Management

```
Create src/components/PlayersScreen.tsx:
- Header with back + "+ Add Player" button
- Player list: name + summary (Age · Sex · Handedness · Place)
- Edit/delete per player
- PlayerForm bottom sheet: Name, Age, Place, Sex toggle, Handedness toggle
- Uses savePlayer / deletePlayer from store

Create src/components/PlayerPicker.tsx:
- Bottom sheet with search/filter input (autofocus)
- Props: players, current, usedNames?: Set<string>, onSelect, onCancel
- Filter out players in usedNames (unless name === current)
- Highlight current with ✓
- "Use '...'" option for custom names not in registry
```

---

### Prompt 5 — Tournament Setup (3-step wizard)

```
Create src/components/TournamentSetup.tsx with 3 steps:

Step 1 (meta):
- Tournament name input (default Tournament_N)
- Match format card toggle: "Best of 3 Sets" / "2 Games"
- Match type card toggle: "Singles" / "Doubles"

Step 2 (players):
- Checkbox list of registered players (unselected shown at bottom)
- Selected players shown at top in order with ↑↓ arrows and × remove
- Singles: each player = 1 team (name = player name)
- Doubles: consecutive pairs = 1 team (name = P1_P2); show pairs in blue boxes,
  unpaired player shown in amber with "needs a partner" label
- "Next" disabled until ≥2 teams formed and no odd doubles

Step 3 (groups):
- Number of groups input (1 to team count)
- Live preview: each group card shows assigned teams, team count, match count
- Teams distributed via serpentine seeding (0→A, 1→B, 2→B, 3→A, …)
- "Create Tournament" button

On create: build Group[] from preview, wrap in TournamentLevel 'Level 1', call onCreate.
```

---

### Prompt 6 — Match Scoring

```
Create src/components/MatchEntry.tsx:
- Bottom sheet modal; Props: match, team1, team2, format, readOnly?, onSave, onCancel
- Sets format: 3 score rows; Games format: 2 score rows
- onFocus selects all text (prevents 0-prepend)
- Visual winner highlight per game (bold winning score)
- Save marks completed, Clear resets scores
- readOnly mode: title = "Match Scores", no inputs (just display), no Save/Clear,
  shows "🔒 View only" footer
```

---

### Prompt 7 — Group View

```
Create src/components/GroupView.tsx:
Props: group, allGroups?, format, players?, isLocked?, onUpdate

Three tabs: Matches | Standings | Teams

Matches tab:
- Progress bar (completed / total matches)
- Match cards: team names, game scores when done, Done/Pending badge
- Click opens MatchEntry; when isLocked passes readOnly=true (still opens)

Standings tab:
- Table: # | Team | MP | W | L | Sets W-L (sets format) | Pts +/- | Diff
- 🥇🥈🥉 for top 3, yellow highlight rank 1

Teams tab:
- Per team: InlineInput for team name, PlayerPicker button per player slot
- PlayerPicker usedNames = all players across ALL groups in allGroups (except current slot)
- When isLocked: team name and players shown as plain text, no editing
```

---

### Prompt 8 — Tournament View (Multi-level)

```
Create src/components/TournamentView.tsx:
Props: tournament, players, isAdmin, onUpdate, onDelete, onBack, onRequestAdmin

State: viewLevel, selectedGroupId, editingName, showAdvance

Lock logic:
- tournamentComplete = all matches in all levels done
- isLocked = tournamentComplete && !isAdmin
- When locked: 🔒 in title, lock banner with "Admin Login" link
- Tournament name editable only when !isLocked; Delete only when isAdmin

Level tabs (>1 level): "Level 1 ✓", "Finals", etc.
Group tabs: shown when current level has >1 group

GroupView rendered for selected group; pass allGroups, players, isLocked.

Level complete logic (latest level):
- isFinals = 1 group with 2 teams
- Finals complete → 🏆 champion banner (team name + players)
- Non-finals complete → green banner + "Setup Level N+1 →"

AdvanceSetup bottom sheet:
- computeCrossGroupRankings for ranked list
- Checkbox per team, min 2, "Quick select top N" shortcut
- "Groups in Level N+1" input (max floor(selectedCount/2))
- Level name = 'Finals' if 2 teams, else 'Level N+1'
- Serpentine seeding; create new TournamentLevel; call onUpdate
```

---

### Prompt 9 — Player Rankings Screen

```
Create src/components/RankingsScreen.tsx:
Props: tournaments, isAdmin?, onBack

Compute rankings via computePlayerRankings(tournaments).

Rank assignment: same points = same rank; next rank skips (1,1,3,4,…).
Use assignRanks() that finds first index with same points.

Non-admin visibility:
- Read VITE_PUBLIC_RANKINGS_LIMIT (default 5)
- Filter to players whose rank <= limit
- Show "+N more · login as admin to see all" footer

Display:
- Top 3 ranks as podium cards (gold/silver/bronze based on rank, not position)
  When multiple players share a rank, show "Tied — Rank N" label above the group
- Remaining players as compact rows with rank number
- Progress bar relative to leader's points (min 4% width)
- Score breakdown (P + G + B chips) shown only when isAdmin
- Admin footer: "P = participation · G = game wins · B = winner/runner-up bonus"
```

---

### Prompt 10 — Deployment

```
Deploy to Vercel:
- Create app/vercel.json: { buildCommand: "npm run build", outputDirectory: "dist",
  rewrites: [{ source: "/(.*)", destination: "/index.html" }] }
- cd app && vercel --prod --yes

Set environment variables in Vercel dashboard (Settings → Environment Variables):
- VITE_ADMIN_PIN = your chosen PIN
- VITE_PUBLIC_RANKINGS_LIMIT = 5 (or desired number)

Firebase setup:
1. Create project at console.firebase.google.com
2. Enable Realtime Database (start in test mode)
3. Copy firebaseConfig into src/firebase.ts
4. Set database rules:
   { "rules": { ".read": true, ".write": true } }
   (test mode rules expire after 30 days — set permanent rules)

PWA install on iPhone:
- Open app URL in Safari → Share → Add to Home Screen
- Hard refresh after updates: close app fully and reopen
```

---

## Known Gotchas

1. **Firebase array serialization**: Firebase serializes `[a,b]` as `{"0":a,"1":b}` and drops `[]` entirely. Always use `toArray<T>()` when reading from Firebase. This applies to `team.players` too — easy to miss on nested objects.

2. **Peer dep conflict**: `vite-plugin-pwa` 1.x doesn't declare Vite 8 compatibility. Requires `legacy-peer-deps=true` in `app/.npmrc`.

3. **PWA cache on iPhone**: After deploying, users need to close and fully reopen the app to get the new service worker. `autoUpdate` handles this silently but requires a restart.

4. **Firebase test mode expiry**: Expires after 30 days. Set permanent rules in the Firebase console.

5. **Admin mode is session-only**: Refreshing the page logs out of admin mode (React state, not localStorage — by design).

6. **Point differential tiebreaker**: When two teams are tied on game wins in a match, total point differential determines the winner. This applies in both `computeStandings` and `computePlayerRankings` — both must be consistent.
