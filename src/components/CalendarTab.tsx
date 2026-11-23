import { useMemo, useState } from 'react';
import {
  CalendarClock,
  Clock,
  CheckCircle2,
  Edit3,
  LayoutGrid,
  RefreshCw,
} from 'lucide-react';
import { Match, Team } from '../types/tournament';
import { formatDateHuman, parseTimeTo24h } from '../utils/tournamentLogic';

interface CalendarTabProps {
  matches: Match[];
  teams: Team[];
  isAdmin: boolean;
  onOpenScoreModal: (matchId: string) => void;
  onOpenEditMatchModal: (matchId: string) => void;
  onOpenEditRoundModal: (roundNum: number) => void;
  onOpenCourtBalanceModal: () => void;
  onOpenRegenerateModal: () => void;
}

export function CalendarTab({
  matches,
  teams,
  isAdmin,
  onOpenScoreModal,
  onOpenEditMatchModal,
  onOpenEditRoundModal,
  onOpenCourtBalanceModal,
  onOpenRegenerateModal,
}: CalendarTabProps) {
  const [filterRound, setFilterRound] = useState<string>('ALL');
  const [filterTeam, setFilterTeam] = useState<string>('ALL');
  const [filterCourt, setFilterCourt] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const rounds = useMemo(() => {
    return [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
  }, [matches]);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (filterRound !== 'ALL' && String(m.round) !== filterRound) return false;
      if (filterTeam !== 'ALL' && m.homeId !== filterTeam && m.awayId !== filterTeam) return false;
      if (filterCourt !== 'ALL' && String(m.court) !== filterCourt) return false;
      if (filterStatus !== 'ALL' && m.status !== filterStatus) return false;
      return true;
    });
  }, [matches, filterRound, filterTeam, filterCourt, filterStatus]);

  const groupedRounds = useMemo(() => {
    const grouped: Record<number, Match[]> = {};
    filteredMatches.forEach((m) => {
      if (!grouped[m.round]) grouped[m.round] = [];
      grouped[m.round].push(m);
    });
    return Object.keys(grouped)
      .map(Number)
      .sort((a, b) => a - b)
      .map((roundNum) => ({
        roundNum,
        matches: grouped[roundNum].slice().sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          const ta = parseTimeTo24h(a.time);
          const tb = parseTimeTo24h(b.time);
          if (ta !== tb) return ta.localeCompare(tb);
          return a.court - b.court;
        }),
      }));
  }, [filteredMatches]);

  const courtTextStyle: Record<number, string> = {
    1: 'text-[#1565A0]',
    2: 'text-[#2E8540]',
    3: 'text-[#B45309]',
    4: 'text-[#0B213A]',
  };

  return (
    <div className="space-y-5">
      {/* Barra de Filtros y Acciones */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3">
          <div>
            <label
              htmlFor="filter-round"
              className="block text-xs font-semibold text-slate-600 mb-1"
            >
              Jornada
            </label>
            <select
              id="filter-round"
              value={filterRound}
              onChange={(e) => setFilterRound(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-[#0B213A] focus:outline-none focus:ring-2 focus:ring-[#1565A0]"
            >
              <option value="ALL">Todas las Jornadas ({rounds.length})</option>
              {rounds.map((r) => (
                <option key={r} value={String(r)}>
                  Jornada {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-team"
              className="block text-xs font-semibold text-slate-600 mb-1"
            >
              Equipo
            </label>
            <select
              id="filter-team"
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-[#0B213A] focus:outline-none focus:ring-2 focus:ring-[#1565A0]"
            >
              <option value="ALL">Todos los Equipos</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-court"
              className="block text-xs font-semibold text-slate-600 mb-1"
            >
              Cancha
            </label>
            <select
              id="filter-court"
              value={filterCourt}
              onChange={(e) => setFilterCourt(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-[#0B213A] focus:outline-none focus:ring-2 focus:ring-[#1565A0]"
            >
              <option value="ALL">Las 4 Canchas</option>
              <option value="1">Cancha 1</option>
              <option value="2">Cancha 2</option>
              <option value="3">Cancha 3</option>
              <option value="4">Cancha 4</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-status"
              className="block text-xs font-semibold text-slate-600 mb-1"
            >
              Estado
            </label>
            <select
              id="filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-[#0B213A] focus:outline-none focus:ring-2 focus:ring-[#1565A0]"
            >
              <option value="ALL">Todos</option>
              <option value="PENDING">Programados</option>
              <option value="COMPLETED">Finalizados</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenCourtBalanceModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-[#E6F2FA] hover:bg-[#d5e8f7] text-[#0B213A] border border-[#1565A0]/25 transition-colors whitespace-nowrap shrink-0"
          >
            <LayoutGrid className="w-4 h-4 text-[#1565A0]" />
            <span>Balance de Canchas</span>
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenRegenerateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-[#1565A0] hover:bg-[#115282] text-white transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Regenerar Calendario</span>
            </button>
          )}
        </div>
      </div>

      {/* Lista de Jornadas */}
      {groupedRounds.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-3">
          <p className="text-slate-600 font-medium text-sm">
            No hay partidos que coincidan con los filtros seleccionados.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterRound('ALL');
              setFilterTeam('ALL');
              setFilterCourt('ALL');
              setFilterStatus('ALL');
            }}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B213A] text-white hover:bg-[#153558] transition-colors"
          >
            Limpiar Filtros
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedRounds.map(({ roundNum, matches: roundMatches }) => {
            const playingIds = new Set<string>();
            matches
              .filter((m) => m.round === roundNum)
              .forEach((m) => {
                playingIds.add(m.homeId);
                playingIds.add(m.awayId);
              });
            const restingTeams = teams.filter((t) => !playingIds.has(t.id));

            return (
              <div
                key={roundNum}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <div className="bg-[#0B213A] text-white px-5 py-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#D98A1A]">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-bold text-[#F59E0B]">Jornada {roundNum}</span>
                    <span className="text-sky-300/50" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-xs font-mono text-sky-100">
                      {formatDateHuman(roundMatches[0].date)}
                    </span>
                    {restingTeams.length > 0 && (
                      <>
                        <span className="text-sky-300/50 hidden sm:inline" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-xs text-amber-200 font-medium">
                          Descansa: {restingTeams.map((t) => t.name).join(', ')}
                        </span>
                      </>
                    )}
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => onOpenEditRoundModal(roundNum)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-amber-200 border border-white/15 transition-colors whitespace-nowrap shrink-0"
                    >
                      <CalendarClock className="w-3.5 h-3.5" />
                      <span>Fecha / Hora Jornada</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 sm:p-5 bg-[#f7f9fc]">
                  {roundMatches.map((m) => {
                    const home = teams.find((t) => t.id === m.homeId) || {
                      id: m.homeId,
                      name: 'Equipo ?',
                      delegate: '',
                      color: '#64748b',
                    };
                    const away = teams.find((t) => t.id === m.awayId) || {
                      id: m.awayId,
                      name: 'Equipo ?',
                      delegate: '',
                      color: '#64748b',
                    };
                    const isDone = m.status === 'COMPLETED';
                    const homeWon = isDone && Number(m.homeScore) > Number(m.awayScore);
                    const awayWon = isDone && Number(m.awayScore) > Number(m.homeScore);

                    return (
                      <article
                        key={m.id}
                        className={`bg-white rounded-xl border p-4 flex flex-col justify-between transition-colors ${
                          isDone ? 'border-[#1565A0]/35' : 'border-slate-200'
                        }`}
                      >
                        <div>
                          {/* Metadata unboxed de cancha, turno y fecha */}
                          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 text-xs">
                            <span
                              className={`font-bold ${
                                courtTextStyle[m.court] || 'text-[#0B213A]'
                              }`}
                            >
                              Cancha {m.court}
                            </span>
                            <div className="flex items-center gap-1.5 text-slate-500 font-mono tabular-nums">
                              <span>{m.time}</span>
                              <span aria-hidden="true">·</span>
                              <span>{formatDateHuman(m.date)}</span>
                            </div>
                          </div>

                          {/* Marcador */}
                          <div className="space-y-2">
                            <div
                              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg ${
                                homeWon
                                  ? 'bg-[#E6F2FA] border border-[#1565A0]/25'
                                  : 'bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className="w-2.5 h-2.5 rounded-xs shrink-0"
                                  style={{ backgroundColor: home.color }}
                                />
                                <span
                                  className={`text-sm font-bold truncate ${
                                    homeWon ? 'text-[#0B213A]' : 'text-slate-800'
                                  }`}
                                >
                                  {home.name}
                                </span>
                              </div>
                              <span
                                className={`font-mono tabular-nums text-base font-bold px-2.5 py-0.5 rounded-md ${
                                  isDone
                                    ? homeWon
                                      ? 'bg-[#0B213A] text-[#F59E0B]'
                                      : 'bg-slate-200 text-slate-700'
                                    : 'text-slate-400'
                                }`}
                              >
                                {isDone ? m.homeScore : '—'}
                              </span>
                            </div>

                            <div
                              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg ${
                                awayWon
                                  ? 'bg-[#E6F2FA] border border-[#1565A0]/25'
                                  : 'bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className="w-2.5 h-2.5 rounded-xs shrink-0"
                                  style={{ backgroundColor: away.color }}
                                />
                                <span
                                  className={`text-sm font-bold truncate ${
                                    awayWon ? 'text-[#0B213A]' : 'text-slate-800'
                                  }`}
                                >
                                  {away.name}
                                </span>
                              </div>
                              <span
                                className={`font-mono tabular-nums text-base font-bold px-2.5 py-0.5 rounded-md ${
                                  isDone
                                    ? awayWon
                                      ? 'bg-[#0B213A] text-[#F59E0B]'
                                      : 'bg-slate-200 text-slate-700'
                                    : 'text-slate-400'
                                }`}
                              >
                                {isDone ? m.awayScore : '—'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Pie de tarjeta */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                              isDone ? 'text-[#2E8540]' : 'text-[#B45309]'
                            }`}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <Clock className="w-3.5 h-3.5" />
                            )}
                            <span>{isDone ? 'Finalizado' : 'Programado'}</span>
                          </span>

                          {isAdmin && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onOpenEditMatchModal(m.id)}
                                title="Editar Cancha, Hora y Fecha"
                                aria-label="Editar programación"
                                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenScoreModal(m.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1565A0] hover:bg-[#115282] text-white transition-colors whitespace-nowrap shrink-0"
                              >
                                {isDone ? 'Editar Tantos' : 'Cargar Resultado'}
                              </button>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
