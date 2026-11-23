import { useMemo } from 'react';
import { Trophy, FileSpreadsheet, GitCompare } from 'lucide-react';
import { Match, Team } from '../types/tournament';
import { calculateStandings } from '../utils/tournamentLogic';

interface StandingsTabProps {
  teams: Team[];
  matches: Match[];
  isAdmin: boolean;
  onExportCSV: () => void;
}

export function StandingsTab({ teams, matches, isAdmin, onExportCSV }: StandingsTabProps) {
  const standings = useMemo(() => calculateStandings(teams, matches), [teams, matches]);

  return (
    <div className="space-y-6">
      {/* Tabla Oficial de Clasificación */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#0B213A] flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#D98A1A] shrink-0" />
              <span>Tabla de Clasificación Oficial</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Desempate: <strong className="text-slate-700">1° Juegos Ganados (JG)</strong> ·{' '}
              <strong className="text-slate-700">2° Juegos entre sí</strong> ·{' '}
              <strong className="text-slate-700">3° Average (TF / TC)</strong> ·{' '}
              <strong className="text-slate-700">4° Diferencia (DIF)</strong>
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#E6F2FA] hover:bg-[#d5e8f7] text-[#0B213A] border border-[#1565A0]/25 transition-colors self-start sm:self-auto whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#1565A0]" />
              <span>Exportar Tabla (CSV)</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B213A] text-white text-xs tracking-wide">
                <th className="py-3 px-4 font-semibold text-center w-14">Pos</th>
                <th className="py-3 px-4 font-semibold">Equipo / Delegado</th>
                <th className="py-3 px-3 font-semibold text-center" title="Juegos Jugados">
                  JJ
                </th>
                <th
                  className="py-3 px-3 font-semibold text-center text-emerald-300"
                  title="Juegos Ganados"
                >
                  JG
                </th>
                <th
                  className="py-3 px-3 font-semibold text-center text-rose-300"
                  title="Juegos Perdidos"
                >
                  JP
                </th>
                <th className="py-3 px-3 font-semibold text-center" title="Tantos a Favor">
                  TF
                </th>
                <th className="py-3 px-3 font-semibold text-center" title="Tantos en Contra">
                  TC
                </th>
                <th className="py-3 px-3 font-semibold text-center" title="Diferencia de Tantos">
                  DIF
                </th>
                <th
                  className="py-3 px-3 font-semibold text-center text-[#FBBF24]"
                  title="Average (TF / TC)"
                >
                  AVE
                </th>
                <th
                  className="py-3 px-4 font-semibold text-center bg-[#1565A0]"
                  title="Puntos Oficiales"
                >
                  PTS
                </th>
                <th className="py-3 px-4 font-semibold text-center">Desempate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {standings.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400">
                    No hay equipos registrados en el torneo.
                  </td>
                </tr>
              ) : (
                standings.map((row, idx) => {
                  const pos = idx + 1;
                  const isTop = pos <= 4;
                  return (
                    <tr
                      key={row.teamId}
                      className={`hover:bg-slate-50 transition-colors ${
                        pos === 1 ? 'bg-amber-50/45' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-mono tabular-nums font-bold text-xs ${
                            pos === 1
                              ? 'bg-[#D98A1A] text-white'
                              : isTop
                                ? 'bg-[#E6F2FA] text-[#1565A0]'
                                : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {pos}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 rounded-xs shrink-0"
                            style={{ backgroundColor: row.color }}
                          />
                          <div>
                            <p className="font-bold text-[#0B213A]">{row.name}</p>
                            <p className="text-xs text-slate-500">
                              Del: {row.delegate || 'Sin asignar'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono tabular-nums font-semibold text-slate-700">
                        {row.jj}
                      </td>
                      <td className="py-3 px-3 text-center font-mono tabular-nums font-bold text-[#2E8540]">
                        {row.jg}
                      </td>
                      <td className="py-3 px-3 text-center font-mono tabular-nums font-semibold text-rose-600">
                        {row.jp}
                      </td>
                      <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-700">
                        {row.tf}
                      </td>
                      <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-700">
                        {row.tc}
                      </td>
                      <td
                        className={`py-3 px-3 text-center font-mono tabular-nums font-semibold ${
                          row.dif > 0
                            ? 'text-[#2E8540]'
                            : row.dif < 0
                              ? 'text-rose-600'
                              : 'text-slate-500'
                        }`}
                      >
                        {row.dif > 0 ? `+${row.dif}` : row.dif}
                      </td>
                      <td className="py-3 px-3 text-center font-mono tabular-nums font-bold text-[#B45309] bg-amber-50/50">
                        {row.ave.toFixed(3)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums font-bold text-base text-[#0B213A] bg-[#E6F2FA]">
                        {row.pts}
                      </td>
                      <td className="py-3 px-4 text-center text-xs font-medium text-slate-500 whitespace-nowrap">
                        {row.tieBreakerNote}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Matriz de Enfrentamientos Directos */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-base font-bold text-[#0B213A] mb-1 flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-[#1565A0] shrink-0" />
          <span>Matriz de Enfrentamientos Directos (Juegos entre sí)</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Resultados cruzados entre cada pareja de equipos para verificación directa de desempates.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-[#0B213A]">
                <th className="p-2.5 border border-slate-200 text-left font-bold">
                  Equipo \ Rival
                </th>
                {teams.map((t) => (
                  <th
                    key={t.id}
                    className="p-2.5 border border-slate-200 text-center font-bold whitespace-nowrap"
                  >
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teams.map((rowT) => (
                <tr key={rowT.id}>
                  <td className="p-2.5 border border-slate-200 font-bold text-[#0B213A] bg-slate-50 whitespace-nowrap">
                    {rowT.name}
                  </td>
                  {teams.map((colT) => {
                    if (rowT.id === colT.id) {
                      return (
                        <td
                          key={colT.id}
                          className="p-2.5 border border-slate-200 bg-slate-200/70 text-center text-slate-400"
                        >
                          —
                        </td>
                      );
                    }
                    const vsMatches = matches.filter(
                      (m) =>
                        m.status === 'COMPLETED' &&
                        ((m.homeId === rowT.id && m.awayId === colT.id) ||
                          (m.homeId === colT.id && m.awayId === rowT.id))
                    );
                    if (vsMatches.length === 0) {
                      return (
                        <td
                          key={colT.id}
                          className="p-2.5 border border-slate-200 text-center text-slate-400"
                        >
                          Pend.
                        </td>
                      );
                    }
                    return (
                      <td
                        key={colT.id}
                        className="p-2.5 border border-slate-200 text-center font-mono tabular-nums"
                      >
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {vsMatches.map((m) => {
                            const myScore = m.homeId === rowT.id ? m.homeScore : m.awayScore;
                            const oppScore = m.homeId === rowT.id ? m.awayScore : m.homeScore;
                            const won = Number(myScore) > Number(oppScore);
                            return (
                              <span
                                key={m.id}
                                className={`inline-block px-2 py-0.5 rounded font-bold ${
                                  won
                                    ? 'bg-[#E6F2FA] text-[#0B213A]'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {myScore}-{oppScore}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
