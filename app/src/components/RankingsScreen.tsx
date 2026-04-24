import type { Tournament } from '../types';
import { computePlayerRankings, type PlayerRanking } from '../rankings';

interface Props {
  tournaments: Tournament[];
  onBack: () => void;
}

const TOP_STYLE = [
  {
    border: 'border-yellow-400',
    bg: 'bg-gradient-to-r from-yellow-50 to-amber-50',
    badge: 'bg-yellow-400 text-white',
    pts: 'text-yellow-600',
    bar: 'bg-yellow-400',
    icon: '👑',
    label: '1st',
  },
  {
    border: 'border-gray-300',
    bg: 'bg-gradient-to-r from-gray-50 to-slate-50',
    badge: 'bg-gray-400 text-white',
    pts: 'text-gray-600',
    bar: 'bg-gray-400',
    icon: '🥈',
    label: '2nd',
  },
  {
    border: 'border-orange-300',
    bg: 'bg-gradient-to-r from-orange-50 to-amber-50',
    badge: 'bg-orange-400 text-white',
    pts: 'text-orange-600',
    bar: 'bg-orange-400',
    icon: '🥉',
    label: '3rd',
  },
];

function ScoreBreakdown({ r }: { r: PlayerRanking }) {
  return (
    <div className="flex gap-1.5 mt-1 flex-wrap">
      {r.participationPts > 0 && (
        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md text-xs font-medium" title="Level participation">
          P +{r.participationPts}
        </span>
      )}
      {r.gameWinPts > 0 && (
        <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md text-xs font-medium" title="Game wins">
          G +{r.gameWinPts}
        </span>
      )}
      {r.bonusPts > 0 && (
        <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-md text-xs font-medium" title="Winner/Runner-up bonus">
          B +{r.bonusPts}
        </span>
      )}
      <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md text-xs" title="Games won">
        {r.gameWins}G · {r.matchesPlayed}MP
      </span>
    </div>
  );
}

function TopCard({ r, rank, maxPts }: { r: PlayerRanking; rank: number; maxPts: number }) {
  const s = TOP_STYLE[rank];
  const pct = maxPts > 0 ? Math.max(4, (r.points / maxPts) * 100) : 0;

  return (
    <div className={`rounded-2xl border-2 ${s.border} ${s.bg} p-4 shadow-sm`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${s.badge} flex items-center justify-center font-bold text-sm shrink-0`}>
          {s.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-gray-900 text-base truncate">{r.name}</p>
            <span className={`font-extrabold text-xl shrink-0 ${s.pts}`}>
              {r.points} pts
            </span>
          </div>
          <ScoreBreakdown r={r} />
          <div className="mt-2 h-1.5 bg-black/10 rounded-full overflow-hidden">
            <div className={`h-full ${s.bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function RowCard({ r, rank, maxPts }: { r: PlayerRanking; rank: number; maxPts: number }) {
  const pct = maxPts > 0 ? Math.max(2, (r.points / maxPts) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
      <span className="text-sm font-bold text-gray-400 w-6 shrink-0 text-center">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-gray-900 text-sm truncate">{r.name}</p>
          <span className="font-bold text-sm shrink-0 text-gray-800">
            {r.points} pts
          </span>
        </div>
        <ScoreBreakdown r={r} />
        <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function RankingsScreen({ tournaments, onBack }: Props) {
  const rankings = computePlayerRankings(tournaments);
  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);
  const maxPts = rankings[0]?.points ?? 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto p-4">

        <div className="flex items-center gap-3 mb-1">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-700 text-sm shrink-0">← Back</button>
          <h1 className="text-xl font-bold text-gray-900">Player Rankings</h1>
        </div>
        <p className="text-xs text-gray-400 mb-2 ml-10">Score = P (participation) + G (game wins) + B (bonus)</p>
        <div className="flex gap-3 ml-10 mb-6 text-xs text-gray-400">
          <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md font-medium">P +2/level</span>
          <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md font-medium">G +2/game win</span>
          <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-md font-medium">B +2 winner · +1 runner-up</span>
        </div>

        {rankings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🏓</div>
            <p className="font-medium">No rankings yet</p>
            <p className="text-sm mt-1">Rankings appear once matches are played</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-5">
              {top3.map((r, i) => (
                <TopCard key={r.name} r={r} rank={i} maxPts={maxPts} />
              ))}
            </div>

            {rest.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">All Players</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="space-y-2">
                  {rest.map((r, i) => (
                    <RowCard key={r.name} r={r} rank={i + 4} maxPts={maxPts} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
