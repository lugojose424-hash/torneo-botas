import { useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  ClipboardEdit,
  FileSpreadsheet,
  History,
  MapPin,
  Search,
  X,
} from 'lucide-react';
import { Match, PlayerAggregatedStats, Team, TournamentState } from '../types/tournament';
import {
  calculatePlayerStats,
  formatDateHuman,
  parseTimeTo24h,
} from '../utils/tournamentLogic';

type SortField =
  | 'totalAvg'
  | 'arrimeAvg'
  | 'arrimeGood'
  | 'rastreroAvg'
  | 'rastreroGood'
  | 'aereoAvg'
  | 'aereoGood'
  | 'bocheTotalAvg';

interface StatsTabProps {
  state: TournamentState;
  teams: Team[];
  isAdmin: boolean;
  onOpenBatchStatsModal: () => void;
  onOpenSingleStatModal: (playerId: string) => void;
  onExportCSV: () => void;
}

export function StatsTab({
  state,
  teams,
  isAdmin,
  onOpenBatchStatsModal,
  onOpenSingleStatModal,
  onExportCSV,
}: StatsTabProps) {
  const [mobileSection, setMobileSection] = useState<'all' | 'players' | 'history'>('all');
  const [minAttempts, setMinAttempts] = useState<number>(3);
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  const [playerSearch, setPlayerSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortField>('totalAvg');
  const [historyCourtFilter, setHistoryCourtFilter] = useState<number | 'ALL'>('ALL');
  const [historyTeamFilter, setHistoryTeamFilter] = useState<string>('ALL');

  const allStats = useMemo(() => calculatePlayerStats(state), [state]);

  const teamMap = useMemo(() => {
    const map = new Map<string, Team>();
    teams.forEach((t) => map.set(t.id, t));
    return map;
  }, [teams]);

  const completedMatches = useMemo(() => {
    return state.matches
      .filter(
        (m) =>
          m.status === 'COMPLETED' &&
          m.homeScore !== null &&
          m.awayScore !== null
      )
      .slice()
      .sort((a, b) => {
        if (b.round !== a.round) return b.round - a.round;
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        const ta = parseTimeTo24h(a.time);
        const tb = parseTimeTo24h(b.time);
        if (tb !== ta) return tb.localeCompare(ta);
        return a.court - b.court;
      });
  }, [state.matches]);

  const courtSummaries = useMemo(() => {
    const courts = [1, 2, 3, 4];
    return courts.map((courtNum) => {
      const totalScheduled = state.matches.filter((m) => m.court === courtNum).length;
      const courtCompleted = completedMatches.filter((m) => m.court === courtNum);
      const filteredCourtCompleted = courtCompleted.filter(
        (m) =>
          historyTeamFilter === 'ALL' ||
          m.homeId === historyTeamFilter ||
          m.awayId === historyTeamFilter
      );
      const totalPoints = filteredCourtCompleted.reduce(
        (sum, m) => sum + Number(m.homeScore || 0) + Number(m.awayScore || 0),
        0
      );
      const totalDiff = filteredCourtCompleted.reduce(
        (sum, m) => sum + Math.abs(Number(m.homeScore || 0) - Number(m.awayScore || 0)),
        0
      );
      const avgTotalPoints =
        filteredCourtCompleted.length > 0
          ? (totalPoints / filteredCourtCompleted.length).toFixed(1)
          : '—';
      const avgMargin =
        filteredCourtCompleted.length > 0
          ? (totalDiff / filteredCourtCompleted.length).toFixed(1)
          : '—';

      return {
        courtNum,
        totalScheduled,
        completedCount: courtCompleted.length,
        matches: filteredCourtCompleted,
        totalPoints,
        avgTotalPoints,
        avgMargin,
      };
    });
  }, [state.matches, completedMatches, historyTeamFilter]);

  const visibleCourtGroups = useMemo(() => {
    if (historyCourtFilter === 'ALL') {
      return courtSummaries;
    }
    return courtSummaries.filter((c) => c.courtNum === historyCourtFilter);
  }, [courtSummaries, historyCourtFilter]);

  const filteredCompletedTotal = useMemo(() => {
    return courtSummaries.reduce((sum, c) => sum + c.matches.length, 0);
  }, [courtSummaries]);

  const leaders = useMemo(() => {
    const topArrime = [...allStats]
      .filter((s) => s.arrimeAtt >= minAttempts && s.arrimeAtt > 0)
      .sort((a, b) => b.arrimeAvg - a.arrimeAvg || b.arrimeGood - a.arrimeGood)[0];

    const topRastrero = [...allStats]
      .filter((s) => s.rastreroAtt >= minAttempts && s.rastreroAtt > 0)
      .sort((a, b) => b.rastreroAvg - a.rastreroAvg || b.rastreroGood - a.rastreroGood)[0];

    const topAereo = [...allStats]
      .filter((s) => s.aereoAtt >= minAttempts && s.aereoAtt > 0)
      .sort((a, b) => b.aereoAvg - a.aereoAvg || b.aereoGood - a.aereoGood)[0];

    const topBocheGen = [...allStats]
      .filter((s) => s.bocheTotalAtt >= minAttempts && s.bocheTotalAtt > 0)
      .sort((a, b) => b.bocheTotalAvg - a.bocheTotalAvg || b.bocheTotalGood - a.bocheTotalGood)[0];

    return [
      {
        title: 'Líder Arrimador',
        accent: 'text-[#2E8540]',
        player: topArrime,
        metric: topArrime ? topArrime.arrimeAvg.toFixed(3) : '—',
        sub: topArrime
          ? `${topArrime.arrimeGood} buenos de ${topArrime.arrimeAtt} int.`
          : `Mín. ${minAttempts} intentos`,
      },
      {
        title: 'Bochador Rastrero',
        accent: 'text-[#B45309]',
        player: topRastrero,
        metric: topRastrero ? topRastrero.rastreroAvg.toFixed(3) : '—',
        sub: topRastrero
          ? `${topRastrero.rastreroGood} efec. de ${topRastrero.rastreroAtt} int.`
          : `Mín. ${minAttempts} intentos`,
      },
      {
        title: 'Bochador Aéreo',
        accent: 'text-[#1565A0]',
        player: topAereo,
        metric: topAereo ? topAereo.aereoAvg.toFixed(3) : '—',
        sub: topAereo
          ? `${topAereo.aereoGood} efec. de ${topAereo.aereoAtt} int.`
          : `Mín. ${minAttempts} intentos`,
      },
      {
        title: 'Bochador General',
        accent: 'text-[#0B213A]',
        player: topBocheGen,
        metric: topBocheGen ? topBocheGen.bocheTotalAvg.toFixed(3) : '—',
        sub: topBocheGen
          ? `${topBocheGen.bocheTotalGood} efec. de ${topBocheGen.bocheTotalAtt} int.`
          : `Mín. ${minAttempts} intentos`,
      },
    ];
  }, [allStats, minAttempts]);

  const filteredStats = useMemo(() => {
    const query = playerSearch.trim().toLowerCase();
    const list = allStats.filter((s) => {
      if (teamFilter !== 'ALL' && s.teamId !== teamFilter) return false;
      if (
        query &&
        !s.name.toLowerCase().includes(query) &&
        !s.number.toLowerCase().includes(query) &&
        !s.teamName.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });
    return list.sort(
      (a: PlayerAggregatedStats, b: PlayerAggregatedStats) =>
        (b[sortBy] || 0) - (a[sortBy] || 0) || b.totalGood - a.totalGood
    );
  }, [allStats, teamFilter, playerSearch, sortBy]);

  const showPlayersSection = mobileSection === 'all' || mobileSection === 'players';
  const showHistorySection = mobileSection === 'all' || mobileSection === 'history';

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Selector rápido en móvil para consulta en cancha */}
      <div
        role="group"
        aria-label="Vista rápida en móvil"
        className="md:hidden grid grid-cols-3 gap-1 p-1 bg-slate-200/80 rounded-xl"
      >
        <button
          type="button"
          onClick={() => setMobileSection('all')}
          className={`min-h-[44px] px-2 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
            mobileSection === 'all'
              ? 'bg-[#0B213A] text-white shadow-xs'
              : 'text-slate-700 hover:text-[#0B213A]'
          }`}
        >
          Ver Todo
        </button>
        <button
          type="button"
          onClick={() => setMobileSection('players')}
          className={`min-h-[44px] px-2 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
            mobileSection === 'players'
              ? 'bg-[#0B213A] text-white shadow-xs'
              : 'text-slate-700 hover:text-[#0B213A]'
          }`}
        >
          Jugadores ({allStats.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileSection('history')}
          className={`min-h-[44px] px-2 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
            mobileSection === 'history'
              ? 'bg-[#0B213A] text-white shadow-xs'
              : 'text-slate-700 hover:text-[#0B213A]'
          }`}
        >
          Canchas ({completedMatches.length})
        </button>
      </div>

      {/* Líderes Individuales */}
      <div className={showPlayersSection ? 'block' : 'hidden md:block'}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div>
            <h2 className="text-lg font-bold text-[#0B213A] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#D98A1A] shrink-0" />
              <span>Cuadro de Líderes Individuales</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Líderes por Average (AVG) en Arrimes, Boche Rastrero, Boche Aéreo y Boche General.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="min-h-[44px] flex items-center justify-between sm:justify-start gap-2 bg-white border border-slate-300 rounded-lg px-3 py-1.5">
              <label
                htmlFor="min-attempts-filter"
                className="text-xs font-semibold text-slate-600 whitespace-nowrap"
              >
                Mín. Intentos:
              </label>
              <input
                id="min-attempts-filter"
                type="number"
                min={0}
                max={200}
                value={minAttempts}
                onChange={(e) => setMinAttempts(Math.max(0, Number(e.target.value || 0)))}
                className="w-16 text-center font-mono tabular-nums font-bold text-sm text-[#0B213A] bg-[#E6F2FA] rounded border border-[#1565A0]/25 py-1 focus:outline-none focus:ring-2 focus:ring-[#1565A0]"
              />
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenBatchStatsModal}
                className="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#1565A0] hover:bg-[#115282] text-white transition-colors whitespace-nowrap shrink-0"
              >
                <ClipboardEdit className="w-4 h-4" />
                <span>Cargar Actuación por Jornada</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {leaders.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 flex flex-col justify-between min-w-0"
            >
              <div className="flex items-baseline justify-between gap-1.5 mb-1.5 sm:mb-2">
                <span className={`text-[11px] sm:text-xs font-bold leading-tight ${card.accent}`}>
                  {card.title}
                </span>
                <span className={`text-lg sm:text-xl font-bold font-mono tabular-nums shrink-0 ${card.accent}`}>
                  {card.metric}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[#0B213A] text-xs sm:text-sm truncate">
                  {card.player ? card.player.name : 'Sin calificar'}
                </p>
                <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">
                  {card.player ? `${card.player.teamName} · ${card.sub}` : card.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rendimiento de Jugadores (Tarjetas en móvil + Tabla completa en escritorio) */}
      <div
        className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${
          showPlayersSection ? 'block' : 'hidden md:block'
        }`}
      >
        <div className="p-3.5 sm:p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 sm:gap-3">
          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2.5">
            <div className="relative sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="Buscar jugador por nombre o camiseta"
                placeholder="Buscar jugador o #..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-9 py-2 text-sm text-[#0B213A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565A0]"
              />
              {playerSearch && (
                <button
                  type="button"
                  onClick={() => setPlayerSearch('')}
                  aria-label="Limpiar búsqueda de jugador"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:flex items-center gap-2">
              <select
                aria-label="Filtrar estadísticas por equipo"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="w-full sm:w-auto min-h-[44px] rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs sm:text-sm font-medium text-[#0B213A] focus:outline-none focus:ring-2 focus:ring-[#1565A0]"
              >
                <option value="ALL">Todos los Equipos</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <select
                aria-label="Ordenar estadísticas por"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortField)}
                className="w-full sm:w-auto min-h-[44px] rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs sm:text-sm font-medium text-[#0B213A] focus:outline-none focus:ring-2 focus:ring-[#1565A0]"
              >
                <option value="totalAvg">AVG General</option>
                <option value="arrimeAvg">AVG Arrimes</option>
                <option value="arrimeGood">Arrimes Buenos</option>
                <option value="rastreroAvg">AVG Rastrero</option>
                <option value="rastreroGood">Boches Rastreros</option>
                <option value="aereoAvg">AVG Aéreo</option>
                <option value="aereoGood">Boches Aéreos</option>
                <option value="bocheTotalAvg">AVG Boche Gen.</option>
              </select>
            </div>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={onExportCSV}
              className="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#E6F2FA] hover:bg-[#d5e8f7] text-[#0B213A] border border-[#1565A0]/25 transition-colors whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#1565A0]" />
              <span>Exportar Estadísticas (CSV)</span>
            </button>
          )}
        </div>

        {/* Vista Móvil (< md): Fichas de consulta rápida sin desplazamiento horizontal */}
        <div className="md:hidden divide-y divide-slate-200">
          {filteredStats.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-sm font-medium text-slate-500">
                No hay jugadores que coincidan con el filtro.
              </p>
              {(teamFilter !== 'ALL' || playerSearch) && (
                <button
                  type="button"
                  onClick={() => {
                    setTeamFilter('ALL');
                    setPlayerSearch('');
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B213A] text-white"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          ) : (
            filteredStats.map((st, idx) => (
              <div key={st.playerId} className="p-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums text-xs font-bold text-slate-400">
                        {idx + 1}.
                      </span>
                      <p className="font-bold text-sm text-[#0B213A] truncate">
                        {st.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 flex-wrap">
                      <span
                        className="w-2 h-2 rounded-xs shrink-0"
                        style={{ backgroundColor: st.teamColor }}
                      />
                      <span className="font-medium text-slate-700 truncate">
                        {st.teamName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">#{st.number}</span>
                      <span aria-hidden="true">·</span>
                      <span>{st.role}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                      AVG Gen
                    </p>
                    <p className="text-lg font-extrabold font-mono tabular-nums text-[#0B213A] leading-tight">
                      {st.totalAvg.toFixed(3)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 divide-x divide-slate-200 bg-[#f7f9fc] rounded-lg py-2 text-center">
                  <div className="px-1">
                    <p className="text-[10px] font-semibold text-slate-500">Arrimes</p>
                    <p className="text-xs font-bold font-mono tabular-nums text-[#2E8540] mt-0.5">
                      {st.arrimeAvg.toFixed(3)}
                    </p>
                    <p className="text-[10px] font-mono tabular-nums text-slate-500">
                      {st.arrimeGood}/{st.arrimeAtt}
                    </p>
                  </div>
                  <div className="px-1">
                    <p className="text-[10px] font-semibold text-slate-500">Rastrero</p>
                    <p className="text-xs font-bold font-mono tabular-nums text-[#B45309] mt-0.5">
                      {st.rastreroAvg.toFixed(3)}
                    </p>
                    <p className="text-[10px] font-mono tabular-nums text-slate-500">
                      {st.rastreroGood}/{st.rastreroAtt}
                    </p>
                  </div>
                  <div className="px-1">
                    <p className="text-[10px] font-semibold text-slate-500">Aéreo</p>
                    <p className="text-xs font-bold font-mono tabular-nums text-[#1565A0] mt-0.5">
                      {st.aereoAvg.toFixed(3)}
                    </p>
                    <p className="text-[10px] font-mono tabular-nums text-slate-500">
                      {st.aereoGood}/{st.aereoAtt}
                    </p>
                  </div>
                  <div className="px-1">
                    <p className="text-[10px] font-semibold text-slate-500">B. Gen</p>
                    <p className="text-xs font-bold font-mono tabular-nums text-[#0B213A] mt-0.5">
                      {st.bocheTotalAvg.toFixed(3)}
                    </p>
                    <p className="text-[10px] font-mono tabular-nums text-slate-500">
                      {st.bocheTotalGood}/{st.bocheTotalAtt}
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => onOpenSingleStatModal(st.playerId)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#1565A0] hover:bg-[#115282] text-white text-xs font-semibold transition-colors"
                  >
                    + Registrar Actuación Individual
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Vista Escritorio (>= md): Tabla Estadística Completa */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#0B213A] text-white text-xs">
                <th className="py-3 px-3 font-semibold">#</th>
                <th className="py-3 px-3 font-semibold">Jugador</th>
                <th className="py-3 px-3 font-semibold">Equipo</th>
                <th
                  className="py-3 px-2.5 font-semibold text-center bg-[#143d27] whitespace-nowrap"
                  title="Arrimes Buenos / Intentos"
                >
                  Arrimes (B/I)
                </th>
                <th
                  className="py-3 px-2.5 font-semibold text-center bg-[#1e5c3a] text-emerald-200 whitespace-nowrap"
                  title="Average de Arrimes"
                >
                  AVG Arr
                </th>
                <th
                  className="py-3 px-2.5 font-semibold text-center bg-[#5c360b] whitespace-nowrap"
                  title="Boches Rastreros Efectivos / Intentos"
                >
                  B. Rastrero (E/I)
                </th>
                <th
                  className="py-3 px-2.5 font-semibold text-center bg-[#7c4a0f] text-amber-200 whitespace-nowrap"
                  title="Average de Boche Rastrero"
                >
                  AVG Ras
                </th>
                <th
                  className="py-3 px-2.5 font-semibold text-center bg-[#0f446b] whitespace-nowrap"
                  title="Boches Aéreos Efectivos / Intentos"
                >
                  B. Aéreo (E/I)
                </th>
                <th
                  className="py-3 px-2.5 font-semibold text-center bg-[#1565A0] text-sky-100 whitespace-nowrap"
                  title="Average de Boche Aéreo"
                >
                  AVG Aér
                </th>
                <th
                  className="py-3 px-2.5 font-semibold text-center bg-slate-800 whitespace-nowrap"
                  title="Total Boches Efectivos / Intentos"
                >
                  Tot. Boches
                </th>
                <th
                  className="py-3 px-2.5 font-semibold text-center bg-slate-800 text-[#FBBF24] whitespace-nowrap"
                  title="Average de Boche General"
                >
                  AVG Boch
                </th>
                <th
                  className="py-3 px-3 font-semibold text-center bg-[#071627] text-sky-200 whitespace-nowrap"
                  title="Average General"
                >
                  AVG Gen
                </th>
                {isAdmin && (
                  <th className="py-3 px-3 font-semibold text-center">Acción</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStats.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 13 : 12}
                    className="py-10 text-center text-slate-400"
                  >
                    No hay jugadores registrados para este filtro.
                  </td>
                </tr>
              ) : (
                filteredStats.map((st, idx) => (
                  <tr key={st.playerId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono tabular-nums font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-[#0B213A]">{st.name}</p>
                      <p className="text-xs text-slate-500">
                        <span className="font-mono tabular-nums">#{st.number}</span> · {st.role}
                      </p>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700 whitespace-nowrap">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-xs mr-1.5 align-middle"
                        style={{ backgroundColor: st.teamColor }}
                      />
                      {st.teamName}
                    </td>
                    <td className="py-3 px-2.5 text-center font-mono tabular-nums font-medium bg-emerald-50/40 whitespace-nowrap">
                      {st.arrimeGood} / {st.arrimeAtt}
                    </td>
                    <td className="py-3 px-2.5 text-center font-mono tabular-nums font-bold text-[#2E8540] bg-emerald-50/70">
                      {st.arrimeAvg.toFixed(3)}
                    </td>
                    <td className="py-3 px-2.5 text-center font-mono tabular-nums font-medium bg-amber-50/40 whitespace-nowrap">
                      {st.rastreroGood} / {st.rastreroAtt}
                    </td>
                    <td className="py-3 px-2.5 text-center font-mono tabular-nums font-bold text-[#B45309] bg-amber-50/70">
                      {st.rastreroAvg.toFixed(3)}
                    </td>
                    <td className="py-3 px-2.5 text-center font-mono tabular-nums font-medium bg-[#E6F2FA]/40 whitespace-nowrap">
                      {st.aereoGood} / {st.aereoAtt}
                    </td>
                    <td className="py-3 px-2.5 text-center font-mono tabular-nums font-bold text-[#1565A0] bg-[#E6F2FA]/70">
                      {st.aereoAvg.toFixed(3)}
                    </td>
                    <td className="py-3 px-2.5 text-center font-mono tabular-nums font-medium whitespace-nowrap">
                      {st.bocheTotalGood} / {st.bocheTotalAtt}
                    </td>
                    <td className="py-3 px-2.5 text-center font-mono tabular-nums font-bold text-[#0B213A]">
                      {st.bocheTotalAvg.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono tabular-nums font-bold text-[#0B213A] bg-slate-100">
                      {st.totalAvg.toFixed(3)}
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onOpenSingleStatModal(st.playerId)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#1565A0] hover:bg-[#115282] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                        >
                          + Actuación
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial de Encuentros · Vista Detallada por Cancha */}
      <section
        aria-labelledby="historial-encuentros-heading"
        className={`space-y-4 ${showHistorySection ? 'block' : 'hidden md:block'}`}
      >
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <h2
              id="historial-encuentros-heading"
              className="text-lg font-bold text-[#0B213A] flex items-center gap-2"
            >
              <History className="w-5 h-5 text-[#1565A0] shrink-0" />
              <span>Historial de Encuentros por Cancha</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Resultados oficiales de partidos finalizados organizados detalladamente por cada
              cancha del Complejo Deportivo APC Turmero.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <select
              aria-label="Filtrar historial por equipo"
              value={historyTeamFilter}
              onChange={(e) => setHistoryTeamFilter(e.target.value)}
              className="w-full sm:w-auto min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-[#0B213A] focus:outline-none focus:ring-2 focus:ring-[#1565A0]"
            >
              <option value="ALL">Todos los Equipos</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <div
              role="group"
              aria-label="Filtrar por cancha"
              className="grid grid-cols-5 sm:inline-flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl w-full sm:w-auto"
            >
              <button
                type="button"
                onClick={() => setHistoryCourtFilter('ALL')}
                className={`min-h-[44px] sm:min-h-0 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-colors whitespace-nowrap ${
                  historyCourtFilter === 'ALL'
                    ? 'bg-[#0B213A] text-white shadow-xs'
                    : 'text-slate-700 hover:text-[#0B213A]'
                }`}
              >
                Todas ({filteredCompletedTotal})
              </button>
              {courtSummaries.map((c) => (
                <button
                  key={c.courtNum}
                  type="button"
                  onClick={() => setHistoryCourtFilter(c.courtNum)}
                  className={`min-h-[44px] sm:min-h-0 px-1.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-colors whitespace-nowrap font-mono tabular-nums ${
                    historyCourtFilter === c.courtNum
                      ? 'bg-[#1565A0] text-white shadow-xs'
                      : 'text-slate-700 hover:text-[#0B213A]'
                  }`}
                >
                  C{c.courtNum} ({c.matches.length})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Resumen Rápido por Cancha */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {courtSummaries.map((c) => {
            const courtAccent: Record<number, { text: string; border: string; bg: string }> = {
              1: { text: 'text-[#1565A0]', border: 'border-[#1565A0]/40', bg: 'bg-[#E6F2FA]/60' },
              2: { text: 'text-[#2E8540]', border: 'border-[#2E8540]/40', bg: 'bg-emerald-50/70' },
              3: { text: 'text-[#B45309]', border: 'border-[#D98A1A]/40', bg: 'bg-amber-50/70' },
              4: { text: 'text-[#0B213A]', border: 'border-[#0B213A]/35', bg: 'bg-slate-100/80' },
            };
            const style = courtAccent[c.courtNum] || courtAccent[1];
            const isSelected = historyCourtFilter === c.courtNum;

            return (
              <button
                key={c.courtNum}
                type="button"
                onClick={() =>
                  setHistoryCourtFilter((prev) =>
                    prev === c.courtNum ? 'ALL' : c.courtNum
                  )
                }
                className={`min-h-[44px] text-left rounded-xl border p-3 sm:p-4 transition-all ${
                  isSelected
                    ? `${style.bg} ${style.border} ring-2 ring-[#1565A0]/30`
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <span className={`text-xs font-bold flex items-center gap-1 ${style.text}`}>
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>Cancha {c.courtNum}</span>
                  </span>
                  <span className="text-xs font-mono tabular-nums font-bold text-[#0B213A]">
                    {c.matches.length}/{c.totalScheduled}
                  </span>
                </div>
                <p className="text-lg sm:text-xl font-extrabold font-mono tabular-nums text-[#0B213A]">
                  {c.matches.length}{' '}
                  <span className="text-[11px] sm:text-xs font-sans font-semibold text-slate-500">
                    {c.matches.length === 1 ? 'finalizado' : 'finalizados'}
                  </span>
                </p>
                <p className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5 truncate">
                  Prom: <strong className="text-slate-700">{c.avgTotalPoints}</strong> · Dif.{' '}
                  <strong className="text-slate-700">{c.avgMargin}</strong>
                </p>
              </button>
            );
          })}
        </div>

        {/* Bloques Detallados por Cancha */}
        {completedMatches.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-1.5">
            <p className="text-sm font-semibold text-[#0B213A]">
              Aún no hay encuentros finalizados registrados.
            </p>
            <p className="text-xs text-slate-500">
              Cuando se carguen resultados en el Calendario, aquí se mostrará el historial
              detallado por cada cancha.
            </p>
          </div>
        ) : filteredCompletedTotal === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-[#0B213A]">
              No hay encuentros finalizados para los filtros seleccionados.
            </p>
            <button
              type="button"
              onClick={() => {
                setHistoryCourtFilter('ALL');
                setHistoryTeamFilter('ALL');
              }}
              className="min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B213A] text-white hover:bg-[#153558] transition-colors"
            >
              Ver Todas las Canchas
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleCourtGroups.map((group) => {
              if (group.matches.length === 0 && historyCourtFilter === 'ALL') {
                return null;
              }

              return (
                <div
                  key={group.courtNum}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                >
                  <div className="bg-[#0B213A] text-white px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#D98A1A]">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#F59E0B] shrink-0" />
                      <h3 className="text-sm font-bold tracking-tight">
                        Cancha {group.courtNum} · APC Turmero
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-mono tabular-nums text-sky-100">
                      <span>
                        <strong className="text-[#F59E0B]">{group.matches.length}</strong>{' '}
                        {group.matches.length === 1 ? 'partido' : 'partidos'}
                      </span>
                      <span className="text-sky-300/40" aria-hidden="true">
                        ·
                      </span>
                      <span>
                        Tantos: <strong className="text-white">{group.totalPoints}</strong>
                      </span>
                      <span className="text-sky-300/40 hidden sm:inline" aria-hidden="true">
                        ·
                      </span>
                      <span className="hidden sm:inline">
                        Margen prom.: <strong className="text-white">{group.avgMargin}</strong>
                      </span>
                    </div>
                  </div>

                  {group.matches.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      Aún no se registran encuentros finalizados en la Cancha {group.courtNum} con
                      el filtro actual.
                    </div>
                  ) : (
                    <>
                      {/* Vista Móvil (< md): Marcadores compactos sin scroll lateral */}
                      <div className="md:hidden divide-y divide-slate-200">
                        {group.matches.map((m: Match) => {
                          const home = teamMap.get(m.homeId);
                          const away = teamMap.get(m.awayId);
                          const hs = Number(m.homeScore ?? 0);
                          const as = Number(m.awayScore ?? 0);
                          const homeWon = hs > as;
                          const winnerName = homeWon
                            ? home?.name || 'Local'
                            : away?.name || 'Visitante';
                          const diff = Math.abs(hs - as);

                          return (
                            <div key={m.id} className="p-3.5 space-y-2">
                              <div className="flex items-center justify-between gap-2 text-[11px]">
                                <span className="font-mono tabular-nums text-slate-500">
                                  <strong className="text-[#1565A0]">J{m.round}</strong> ·{' '}
                                  {formatDateHuman(m.date)} · {m.time}
                                </span>
                                <span className="inline-flex items-center gap-1 font-semibold text-[#2E8540] shrink-0">
                                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                                  <span className="truncate max-w-[115px]">{winnerName}</span>
                                  <span className="font-mono tabular-nums">(+{diff})</span>
                                </span>
                              </div>

                              <div className="space-y-1.5">
                                <div
                                  className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg ${
                                    homeWon ? 'bg-[#E6F2FA]/70' : 'bg-slate-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                                      style={{ backgroundColor: home?.color || '#64748b' }}
                                    />
                                    <span
                                      className={`text-sm truncate ${
                                        homeWon
                                          ? 'font-bold text-[#0B213A]'
                                          : 'font-medium text-slate-600'
                                      }`}
                                    >
                                      {home?.name || 'Equipo ?'}
                                    </span>
                                  </div>
                                  <span
                                    className={`min-w-8 px-2 py-0.5 rounded-md text-center font-mono tabular-nums text-sm font-bold ${
                                      homeWon
                                        ? 'bg-[#0B213A] text-[#F59E0B]'
                                        : 'bg-slate-200/80 text-slate-700'
                                    }`}
                                  >
                                    {hs}
                                  </span>
                                </div>

                                <div
                                  className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg ${
                                    !homeWon ? 'bg-[#E6F2FA]/70' : 'bg-slate-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                                      style={{ backgroundColor: away?.color || '#64748b' }}
                                    />
                                    <span
                                      className={`text-sm truncate ${
                                        !homeWon
                                          ? 'font-bold text-[#0B213A]'
                                          : 'font-medium text-slate-600'
                                      }`}
                                    >
                                      {away?.name || 'Equipo ?'}
                                    </span>
                                  </div>
                                  <span
                                    className={`min-w-8 px-2 py-0.5 rounded-md text-center font-mono tabular-nums text-sm font-bold ${
                                      !homeWon
                                        ? 'bg-[#0B213A] text-[#F59E0B]'
                                        : 'bg-slate-200/80 text-slate-700'
                                    }`}
                                  >
                                    {as}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Vista Escritorio (>= md): Tabla completa por cancha */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs sm:text-sm">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                              <th className="py-2.5 px-4 font-bold">Jornada / Fecha</th>
                              <th className="py-2.5 px-3 font-bold">Equipo Local</th>
                              <th className="py-2.5 px-3 font-bold text-center">Marcador Final</th>
                              <th className="py-2.5 px-3 font-bold">Equipo Visitante</th>
                              <th className="py-2.5 px-4 font-bold text-right">Resultado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {group.matches.map((m: Match) => {
                              const home = teamMap.get(m.homeId);
                              const away = teamMap.get(m.awayId);
                              const hs = Number(m.homeScore ?? 0);
                              const as = Number(m.awayScore ?? 0);
                              const homeWon = hs > as;
                              const winnerName = homeWon
                                ? home?.name || 'Local'
                                : away?.name || 'Visitante';
                              const diff = Math.abs(hs - as);

                              return (
                                <tr key={m.id} className="hover:bg-[#f7f9fc] transition-colors">
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono tabular-nums font-bold text-xs text-[#1565A0]">
                                        J{m.round}
                                      </span>
                                      <span className="text-slate-300" aria-hidden="true">
                                        ·
                                      </span>
                                      <div className="font-mono tabular-nums text-xs">
                                        <p className="font-semibold text-[#0B213A]">
                                          {formatDateHuman(m.date)}
                                        </p>
                                        <p className="text-[11px] text-slate-500">{m.time}</p>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="py-3 px-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                                        style={{ backgroundColor: home?.color || '#64748b' }}
                                      />
                                      <span
                                        className={
                                          homeWon
                                            ? 'font-bold text-[#0B213A]'
                                            : 'font-medium text-slate-600'
                                        }
                                      >
                                        {home?.name || 'Equipo ?'}
                                      </span>
                                    </div>
                                  </td>

                                  <td className="py-3 px-3 text-center whitespace-nowrap">
                                    <div className="inline-flex items-center gap-1.5 font-mono tabular-nums text-sm font-bold">
                                      <span
                                        className={`min-w-8 px-2 py-1 rounded-md text-center ${
                                          homeWon
                                            ? 'bg-[#0B213A] text-[#F59E0B]'
                                            : 'bg-slate-100 text-slate-600'
                                        }`}
                                      >
                                        {hs}
                                      </span>
                                      <span className="text-slate-400 text-xs">-</span>
                                      <span
                                        className={`min-w-8 px-2 py-1 rounded-md text-center ${
                                          !homeWon
                                            ? 'bg-[#0B213A] text-[#F59E0B]'
                                            : 'bg-slate-100 text-slate-600'
                                        }`}
                                      >
                                        {as}
                                      </span>
                                    </div>
                                  </td>

                                  <td className="py-3 px-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                                        style={{ backgroundColor: away?.color || '#64748b' }}
                                      />
                                      <span
                                        className={
                                          !homeWon
                                            ? 'font-bold text-[#0B213A]'
                                            : 'font-medium text-slate-600'
                                        }
                                      >
                                        {away?.name || 'Equipo ?'}
                                      </span>
                                    </div>
                                  </td>

                                  <td className="py-3 px-4 text-right whitespace-nowrap">
                                    <div className="inline-flex items-center justify-end gap-1.5 text-xs">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2E8540] shrink-0" />
                                      <span className="font-bold text-[#0B213A]">{winnerName}</span>
                                      <span className="font-mono tabular-nums font-bold text-[#2E8540]">
                                        (+{diff})
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
