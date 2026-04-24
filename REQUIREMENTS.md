# Mountain House TT Club — Requirements & Recreation Guide

## What It Is

A Progressive Web App (PWA) for running table tennis tournaments at Mountain House TT Club. Players can view live scores in real time from any device. Admins create and manage tournaments. Hosted on Vercel, data synced via Firebase Realtime Database.

Live URL: https://app-iota-ashen.vercel.app

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
- `app/src/firebase.ts` — Firebase init with `firebaseConfig`

---

## Full Feature Requirements

### 1. Home Screen
- Club banner photo (`/public/banner.jpg`) as full-width header with gradient overlay
- Title: "🏓 Mountain House TT Club" overlaid on banner
- Two sections: **In Progress** (live tournaments) and **History** (completed)
- Auto-navigates to the active in-progress tournament on first load
- Completed tournaments show a 🔒 lock icon
- **Admin mode**: 🔑 Admin button opens PIN modal; when active, "Admin ✓ · Exit" shows on banner
- **+ New** button only visible in admin mode
- Players button always visible

### 2. Player Profiles
Fields: Name (required), Age, Sex (Male/Female, default Male), Handedness (Right/Left, default Right), Place (default "Mountain House")

- Stored in Firebase at `/players/{id}`
- Listed alphabetically
- Editable / deletable at any time

### 3. Tournament Creation (2 steps)

**Step 1 — Meta:**
- Tournament name (default: `Tournament_N`)
- Match format: "Best of 3 Sets" or "2 Games"
- Match type: Singles or Doubles (applies to all teams)
- Number of groups (min 1)
- Teams per group (min 2)

**Step 2 — Teams:**
- Tab per group (Group A, Group B, …)
- Each team: Team Name (auto: `Team_<player>` or `Team_<p1>_<p2>`), Player 1 (required), Player 2 (doubles only)
- Players selected via picker (shows registered players, excludes already-assigned players across ALL groups)
- Can type a custom name (not in registry)
- Team name auto-updates when player name changes (if still matching auto pattern)
- Add / remove teams

### 4. Scoring

**Match entry (bottom sheet modal):**
- TT rules: win a game with ≥11 points AND ≥2 point lead
- Sets format: best of 3 sets (each set is one game)
- Games format: 2 games, most game wins ranks higher
- Score input selects on focus (prevents 0-prepend)
- Save marks match as completed

### 5. Multi-Level Tournament

**Level 1:** Round-robin within each group (all vs all).

**When Level N is complete (all matches done):**
- Green "✅ Level N complete!" banner appears
- "Setup Level N+1 →" button opens an advancement sheet

**Advancement sheet:**
- Ranked team list (cross-group ranking: match wins → set wins → point diff)
- Checkbox per team (tap to select/deselect); minimum 2 selected
- "Quick select top N" number input auto-checks the top N
- "Groups in Level N+1" input
- Teams distributed via serpentine seeding across groups
- Level name: "Finals" if 2 teams selected, else "Level N+1"

**Finals:** When 1 group with 2 teams completes, shows 🏆 champion banner.

**Level tabs:** All levels accessible; completed levels show ✓.

### 6. Standings (within a group)

Columns: Rank, Team, MP (matches played), W, L, Sets W-L (sets format), Pts +/-, Diff  
Sort: match wins → point diff  
Medal icons for top 3: 🥇🥈🥉

### 7. Editing After Creation

All names are editable at any time (while tournament is unlocked):
- Tournament name: tap to edit inline in header
- Team name: InlineInput in Teams tab
- Player name: tap to open PlayerPicker (with registry + custom name option)
- Player picker excludes names used in ANY team/group in the same level

### 8. Admin / Lock System

- Completed tournaments are automatically **locked** (view-only for all users)
- Lock indicator: 🔒 on tournament cards and in tournament header
- "Admin Login" link appears in the lock banner inside TournamentView
- Admin PIN entry modal (PIN configurable via `VITE_ADMIN_PIN` env var, default `1234`)
- Admin mode is session-only (resets on page refresh)
- When admin: Delete button visible, names editable, matches clickable, + New button visible
- Non-admin: everything read-only for locked tournaments

### 9. Real-time Sync

- All data (tournaments + players) synced live via Firebase `onValue` listeners
- Optimistic UI: local state updated immediately, Firebase confirms async
- Multiple devices see live score changes instantly

### 10. PWA

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

**Firebase gotcha:** Firebase drops empty arrays and serializes non-empty arrays as `{0: x, 1: y}` objects. The `toArray<T>()` normalizer in `store.ts` handles both on read. Old tournaments that stored `groups` at the top level (before multi-level support) are auto-migrated to `levels[0]` on read.

---

## File Structure

```
app/
  src/
    App.tsx                    # Home screen, admin state, routing
    types.ts                   # All TypeScript interfaces
    store.ts                   # Firebase CRUD + normalization
    rankings.ts                # computeStandings, computeCrossGroupRankings, generateMatches
    firebase.ts                # Firebase app init
    components/
      TournamentSetup.tsx      # 2-step tournament creation wizard
      TournamentView.tsx       # Tournament view + level tabs + AdvanceSetup sheet
      GroupView.tsx            # Matches / Standings / Teams tabs
      MatchEntry.tsx           # Score entry bottom sheet
      PlayerPicker.tsx         # Player selection modal
      PlayersScreen.tsx        # Player profile management
      AdminLogin.tsx           # PIN entry modal
  public/
    banner.jpg                 # Club group photo
    pwa-192.png / pwa-512.png  # PWA icons
```

---

## Prompts to Recreate (Step by Step)

Use these prompts with Claude Code (or similar AI coding assistant) in sequence. Each builds on the previous.

---

### Prompt 1 — Project Scaffold

```
Create a React 19 + TypeScript + Vite 8 app in a folder called `app/`.
Add Tailwind CSS 4 (use @tailwindcss/vite plugin, not postcss).
Add Firebase 11 (firebase/app, firebase/database).
Add vite-plugin-pwa for PWA support.
Add an .npmrc with legacy-peer-deps=true to handle peer dep conflicts.

Create src/firebase.ts that initializes Firebase with a placeholder firebaseConfig object
(I'll fill in real values). Export `db` as the Realtime Database instance.

Create src/types.ts with these interfaces:
- MatchFormat = 'sets' | 'games'
- Player { id, name, age?, sex?, hand?, place? }
- Team { id, name, type: 'singles'|'doubles', players: string[] }
- Game { team1Score, team2Score }
- Match { id, team1Id, team2Id, games: Game[], completed }
- Group { id, name, teams, matches }
- TournamentLevel { id, name, groups }
- Tournament { id, name, format, matchType?, levels: TournamentLevel[], createdAt }
- TeamStats (for standings: matchesPlayed, matchWins, matchLosses, setWins, setLosses, gameWins, gameLosses, pointsFor, pointsAgainst, pointDiff, rank)

Create src/store.ts with Firebase CRUD:
- IMPORTANT: Firebase drops empty arrays and converts arrays to {0: x, 1: y} objects.
  Write a toArray<T>() helper that handles both cases on read.
  Write a normalizeTournament(raw) that handles old format (groups at top level) and
  new format (levels array), calling toArray on all nested arrays.
- subscribeTournaments(callback) — onValue listener, sorts by createdAt desc
- saveTournament(t), deleteTournament(id)
- subscribePlayers(callback) — onValue listener, sorts alphabetically
- savePlayer(p), deletePlayer(id)

Create src/rankings.ts:
- gameWinner(s1, s2): win requires >=11 pts AND >=2 pt lead
- computeStandings(group, format): returns TeamStats[] sorted by matchWins then pointDiff
- computeCrossGroupRankings(groups, format): flatMap computeStandings across groups, re-sort
- generateMatches(teams): round-robin pairs
```

---

### Prompt 2 — Home Screen & App Shell

```
Create src/App.tsx with:
- State: tournaments[], players[], view (home/new/tournament/players), isAdmin, showAdminLogin
- useEffect: subscribeTournaments + subscribePlayers on mount
- Auto-navigate to in-progress tournament on first load (use a ref to avoid re-triggering)
- getTournamentStatus(t): not-started / in-progress / completed based on t.levels matches
- TournamentCard component: shows name, status badge (Live/Done), 🔒 for completed,
  group/level count, format, date, match progress
- Home layout:
  - Full-width banner image (/public/banner.jpg) with gradient overlay
  - Title "🏓 Mountain House TT Club" overlaid on banner
  - "Admin ✓ · Exit" button on banner when admin mode active
  - Header row with: 🔑 Admin button (when not admin), Players button, + New button (admin only)
  - "In Progress" section and "History" section
- Import AdminLogin component (to be created later), show when showAdminLogin=true
- Pass isAdmin to TournamentView; pass onRequestAdmin callback
```

---

### Prompt 3 — Admin Login

```
Create src/components/AdminLogin.tsx:
- Bottom sheet modal (fixed, justify-end on mobile, centered on sm+)
- PIN input (type=password, inputMode=numeric, large centered text)
- On submit: compare to import.meta.env.VITE_ADMIN_PIN || '1234'
- Show "Incorrect PIN" error in red on failure, clear input
- Props: onSuccess(), onCancel()
```

---

### Prompt 4 — Player Management

```
Create src/components/PlayersScreen.tsx:
- Header with back button and "+ Add Player" button
- Player list: name + summary line (Age X · Male · Right-handed · Mountain House)
- Edit/delete per player
- PlayerForm as a bottom sheet modal with fields:
  - Name (required, Enter key saves)
  - Age (number input) and Place (default "Mountain House") side by side
  - Sex toggle: Male / Female (default Male)
  - Handedness toggle: Right-handed / Left-handed (default Right-handed)
- ToggleGroup component for sex and hand
- playerToDraft / draftToPlayer converters
- Uses savePlayer / deletePlayer from store

Create src/components/PlayerPicker.tsx:
- Bottom sheet modal showing registered players
- Search/filter input (autofocus)
- Props: players, current (currently selected name), usedNames?: Set<string>, onSelect, onCancel
- Filter out players whose name is in usedNames (unless name === current)
- Highlight current selection with ✓
- "Use '...'" button when typing a name not in registry (for custom names)
```

---

### Prompt 5 — Tournament Setup (2-step wizard)

```
Create src/components/TournamentSetup.tsx:

Step 1 (meta):
- Tournament name input (default Tournament_N)
- Match format toggle: "Best of 3 Sets" / "2 Games" (card style)
- Match type toggle: "Singles" / "Doubles" (card style, applies to all teams)
- Number of groups input (min 1)
- Teams per group input (min 2, default 2)
- "Next: Add Teams →" button

Step 2 (teams):
- Group tabs at top (Group A, Group B, …)
- Clear picker when switching groups (useEffect on currentGroup)
- Per team card: Team Name input, Player 1 button (opens PlayerPicker), Player 2 button if doubles
- Auto team name: Team_<p1> for singles, Team_<p1>_<p2> for doubles (updates if not manually changed)
- Add/remove team buttons
- Player picker excludes names used in ANY group (not just current group)
- "Create Tournament" button

On create:
- Wrap groups in TournamentLevel: { id, name: 'Level 1', groups }
- Store matchType on Tournament
- Call onCreate with full Tournament object
```

---

### Prompt 6 — Match Scoring

```
Create src/components/MatchEntry.tsx:
- Bottom sheet modal for entering scores
- Props: match, team1, team2, format, onSave, onCancel
- Sets format: 3 set score rows (team1 score | team2 score per row)
- Games format: 2 game score rows
- gameWinner(s1, s2): win = >=11 pts AND >=2 pt lead
- Score inputs: onFocus selects all text (prevents 0-prepend)
- Visual winner indicator per game (highlight winning score)
- Save button: marks match completed, stores games array
- TT rules enforced: show invalid state when scores don't satisfy win condition
```

---

### Prompt 7 — Group View (Matches / Standings / Teams)

```
Create src/components/GroupView.tsx:
Props: group, allGroups?, format, players?, isLocked?, onUpdate

Three tabs: Matches | Standings | Teams

Matches tab:
- Progress bar (completed / total)
- Match cards: team1 name vs team2 name, game scores when completed, Done/Pending badge
- Click opens MatchEntry (disabled when isLocked)

Standings tab:
- Table: # | Team | MP | W | L | Sets W-L (sets format) | Pts +/- | Diff
- Medal icons 🥇🥈🥉 for top 3, yellow highlight for rank 1
- computeStandings from rankings.ts

Teams tab:
- Per team: InlineInput for team name, PlayerPicker button for each player slot
- PlayerPicker excludes players used in ANY group in allGroups (except current slot)
- When isLocked: team name and player name are read-only text (no editing)
```

---

### Prompt 8 — Tournament View (Multi-level)

```
Create src/components/TournamentView.tsx:
Props: tournament, players, isAdmin, onUpdate, onDelete, onBack, onRequestAdmin

State: viewLevel (index), selectedGroupId, editingName, showAdvance

Level tabs (show when >1 level):
- "Level 1 ✓", "Level 2", etc. — clicking switches viewLevel and resets selectedGroupId
- Auto-switch to new level when tournament.levels.length increases (track with ref)

Group tabs (show when current level has >1 group):
- Gray style (distinct from blue level tabs)

GroupView rendered for selected group; pass isLocked.

Lock logic:
- isLocked = all matches across ALL levels are done AND !isAdmin
- When locked: 🔒 in title, lock banner with "Admin Login" link, no editing
- Tournament name only editable when !isLocked
- Delete button only shown when isAdmin

Level complete banner (latest level only):
- isFinals: 1 group with exactly 2 teams
- Finals complete: 🏆 champion display
- Otherwise: green banner + "Setup Level N+1 →" button

AdvanceSetup (bottom sheet):
- computeCrossGroupRankings to get ranked list
- Checkbox list: tap to select/deselect teams (min 2 selected enforced)
- "Quick select top N" input auto-checks top N
- "Groups in Level N+1" input (max = floor(selectedCount/2))
- Level name = 'Finals' if 2 selected, else 'Level N+1'
- Serpentine seeding across groups
- Create new TournamentLevel and call onUpdate
```

---

### Prompt 9 — PWA & Deployment

```
Configure vite-plugin-pwa in vite.config.ts:
- registerType: 'autoUpdate'
- manifest: name 'Mountain House TT Club', short_name 'MH TT Club',
  theme_color '#2563eb', display 'standalone', orientation 'portrait'
- Workbox: precache all assets, NetworkFirst for https:// URLs

Deploy to Vercel:
- cd app && vercel --prod
- Set environment variable VITE_ADMIN_PIN in Vercel dashboard (Settings → Environment Variables)

Firebase setup:
1. Create project at console.firebase.google.com
2. Enable Realtime Database (start in test mode)
3. Copy firebaseConfig into src/firebase.ts
4. Set database rules: { ".read": true, ".write": true } for club use
   (Note: test mode rules expire after 30 days — update them)

PWA install on iPhone:
- Open app URL in Safari
- Share → Add to Home Screen
- Hard refresh after updates: close app fully and reopen
```

---

## Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `VITE_ADMIN_PIN` | Admin login PIN | `1234` |

Set in Vercel: Project → Settings → Environment Variables.

---

## Known Gotchas

1. **Firebase arrays**: Firebase serializes `[]` as nothing, `[a,b]` as `{"0":a,"1":b}`. Always use `toArray<T>()` when reading from Firebase.

2. **Peer dep conflict**: `vite-plugin-pwa` 1.x doesn't declare Vite 8 compatibility. Requires `legacy-peer-deps=true` in `.npmrc` for both local and Vercel builds.

3. **PWA cache**: After deploying, users on iPhone need to close and reopen the app to get the new service worker. `autoUpdate` handles this silently but requires an app restart.

4. **Firebase test mode**: Expires after 30 days. Set permanent rules:
   ```json
   { "rules": { ".read": true, ".write": true } }
   ```

5. **Admin mode is session-only**: Refreshing the page logs out of admin mode (by design — it's React state, not localStorage).
