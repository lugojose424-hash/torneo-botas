import { PlusCircle, Pencil, UserPlus, Trash2, Edit2, XCircle } from 'lucide-react';
import { Player, Team, TournamentCategory } from '../types/tournament';

interface TeamsTabProps {
  category?: TournamentCategory;
  teams: Team[];
  players: Player[];
  isAdmin: boolean;
  onAddTeam: () => void;
  onEditTeam: (teamId: string) => void;
  onDeleteTeam: (teamId: string) => void;
  onAddPlayer: (teamId: string) => void;
  onEditPlayer: (playerId: string) => void;
  onDeletePlayer: (playerId: string) => void;
}

export function TeamsTab({
  category = 'MASCULINO',
  teams,
  players,
  isAdmin,
  onAddTeam,
  onEditTeam,
  onDeleteTeam,
  onAddPlayer,
  onEditPlayer,
  onDeletePlayer,
}: TeamsTabProps) {
  const isFemenino = category === 'FEMENINO';
  const categoryTitle = isFemenino ? 'Categoría Femenina' : 'Categoría Masculina';

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#0B213A]">
            Equipos y Planillas · {categoryTitle}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isFemenino
              ? 'Administra los equipos femeninos inscritos y la nómina oficial de arrimadoras y bochadoras.'
              : 'Administra los equipos inscritos y la nómina oficial de arrimadores y bochadores.'}
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={onAddTeam}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold bg-[#1565A0] hover:bg-[#115282] text-white transition-colors whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Agregar Equipo</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {teams.map((team) => {
          const roster = players.filter((p) => p.teamId === team.id);
          return (
            <div
              key={team.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col"
            >
              <div
                className="h-1.5 w-full"
                style={{ backgroundColor: team.color || '#1565A0' }}
              />
              <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-[#0B213A] truncate">
                    {team.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {isFemenino ? 'Delegada' : 'Delegado'}:{' '}
                    <strong className="text-slate-700">
                      {team.delegate || 'No registrado'}
                    </strong>{' '}
                    · <span className="font-mono tabular-nums">{roster.length}</span>{' '}
                    {isFemenino ? 'jugadoras' : 'jugadores'}
                  </p>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditTeam(team.id)}
                      title="Editar Equipo"
                      aria-label={`Editar ${team.name}`}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddPlayer(team.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#1565A0] hover:bg-[#115282] text-white transition-colors whitespace-nowrap shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{isFemenino ? 'Jugadora' : 'Jugador'}</span>
                    </button>
                    {teams.length > 2 && (
                      <button
                        type="button"
                        onClick={() => onDeleteTeam(team.id)}
                        title="Eliminar Equipo"
                        aria-label={`Eliminar ${team.name}`}
                        className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 flex-1">
                {roster.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <p className="text-xs text-slate-400">
                      {isFemenino
                        ? 'No hay jugadoras registradas en esta planilla.'
                        : 'No hay jugadores registrados en esta planilla.'}
                    </p>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => onAddPlayer(team.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        {isFemenino ? 'Registrar Primera Jugadora' : 'Registrar Primer Jugador'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-200">
                          <th className="pb-2 font-semibold">N°</th>
                          <th className="pb-2 font-semibold">{isFemenino ? 'Jugadora' : 'Jugador'}</th>
                          <th className="pb-2 font-semibold">Cédula</th>
                          <th className="pb-2 font-semibold">Especialidad</th>
                          {isAdmin && (
                            <th className="pb-2 font-semibold text-right">Acciones</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {roster.map((p) => {
                          const roleColor =
                            p.role === 'Arrimador'
                              ? 'text-emerald-700'
                              : p.role === 'Bochador'
                                ? 'text-amber-700'
                                : 'text-sky-700';

                          return (
                            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2.5 font-mono tabular-nums font-bold text-slate-500">
                                #{p.number || '0'}
                              </td>
                              <td className="py-2.5 font-semibold text-slate-900">
                                {p.name}
                              </td>
                              <td className="py-2.5 font-mono tabular-nums text-slate-500">
                                {p.cedula || '—'}
                              </td>
                              <td className={`py-2.5 font-semibold ${roleColor}`}>
                                {p.role}
                              </td>
                              {isAdmin && (
                                <td className="py-2.5 text-right whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => onEditPlayer(p.id)}
                                    title="Editar Jugador"
                                    aria-label={`Editar ${p.name}`}
                                    className="p-1.5 text-slate-500 hover:text-emerald-700 transition-colors"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 inline" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onDeletePlayer(p.id)}
                                    title="Eliminar Jugador"
                                    aria-label={`Eliminar ${p.name}`}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 ml-0.5 transition-colors"
                                  >
                                    <XCircle className="w-3.5 h-3.5 inline" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
