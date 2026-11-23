import { useMemo, useState } from 'react';
import { Award, ClipboardEdit, FileSpreadsheet } from 'lucide-react';
import { PlayerAggregatedStats, Team, TournamentState } from '../types/tournament';
import { calculatePlayerStats } from '../utils/tournamentLogic';

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
  const [minAttempts, setMinAttempts] = useState<number>(3);
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortField>('totalAvg');

  const allStats = useMemo(() => calculatePlayerStats(state), [state]);

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
    const list = allStats.filter((s) => teamFilter === 'ALL' || s.teamId === teamFilter);
    return list.sort(
      (a: PlayerAggregatedStats, b: PlayerAggregatedStats) =>
        (b[sortBy] || 0) - (a[sortBy] || 0) || b.totalGood - a.totalGood
    );
  }, [allStats, teamFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Líderes Individuales */}
      <div>
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
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-3 py-1.5">
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
                className="w-14 text-center font-mono tabular-nums font-bold text-sm text-[#0B213A] bg-[#E6F2FA] rounded border border-[#1565A0]/25 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#1565A0]"
              />
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenBatchStatsModal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#1565A0] hover:bg-[#115282] text-white transition-colors whitespace-nowrap shrink-0"
              >
                <ClipboardEdit className="w-4 h-4" />
                <span>Cargar Actuación por Jornada</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {leaders.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between"
            >
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <span className={`text-xs font-bold ${card.accent}`}>{card.title}</span>
                <span className={`text-xl font-bold font-mono tabular-nums ${card.accent}`}>
                  {card.metric}
                </span>
              </div>
              <div>
                <p className="font-bold text-[#0B213A] text-sm truncate">
                  {card.player ? card.player.name : 'Sin calificar'}
                </p>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {card.player ? `${card.player.teamName} · ${card.sub}` : card.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla General de Estadísticas */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="Filtrar estadísticas por equipo"
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs sm:text-sm font-medium text-[#0B213A] focus:outline-none focus:ring-2 focus:ring-[#1565A0]"
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
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs sm:text-sm font-medium text-[#0B213A] focus:outline-none focus:ring-2 focus:ring-[#1565A0]"
            >
              <option value="totalAvg">Ordenar: AVG General</option>
              <option value="arrimeAvg">Ordenar: AVG Arrimes</option>
              <option value="arrimeGood">Ordenar: Arrimes Buenos (A.B)</option>
              <option value="rastreroAvg">Ordenar: AVG Boche Rastrero</option>
              <option value="rastreroGood">Ordenar: Boches Rastreros (B.R.E)</option>
              <option value="aereoAvg">Ordenar: AVG Boche Aéreo</option>
              <option value="aereoGood">Ordenar: Boches Aéreos (B.A.E)</option>
              <option value="bocheTotalAvg">Ordenar: AVG Boche General</option>
            </select>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#E6F2FA] hover:bg-[#d5e8f7] text-[#0B213A] border border-[#1565A0]/25 transition-colors self-start sm:self-auto whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#1565A0]" />
              <span>Exportar Estadísticas (CSV)</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
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
    </div>
  );
}
