import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Download,
  KeyRound,
  LogOut,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import {
  PlayerRole,
  TabId,
  TimeSlot,
  ToastMessage,
  ToastType,
  TournamentConfig,
  TournamentState,
} from './types/tournament';
import {
  DEFAULT_STATE,
  calculateStandings,
  downloadJSONBackup,
  exportCalendarCSV,
  exportStandingsCSV,
  exportStatsCSV,
  format24hTo12h,
  generateBalancedSchedule,
  initializeSeedData,
  loadTournamentState,
  saveTournamentState,
} from './utils/tournamentLogic';
import { SummaryCards } from './components/SummaryCards';
import { CalendarTab } from './components/CalendarTab';
import { StandingsTab } from './components/StandingsTab';
import { TeamsTab } from './components/TeamsTab';
import { StatsTab } from './components/StatsTab';
import { Modal } from './components/Modal';
import { ToastContainer } from './components/ToastContainer';
import {
  AdminPinModalContent,
  BatchStatsModalContent,
  ChangeAdminPinModalContent,
  CourtBalanceModalContent,
  EditMatchModalContent,
  EditRoundScheduleModalContent,
  ExportImportModalContent,
  PlayerFormModalContent,
  ScoreModalContent,
  SettingsModalContent,
  SinglePlayerStatModalContent,
  TeamFormModalContent,
} from './components/TournamentModals';

type ActiveModal =
  | { type: 'none' }
  | { type: 'score'; matchId: string }
  | { type: 'editMatch'; matchId: string }
  | { type: 'editRound'; round: number }
  | { type: 'courtBalance' }
  | { type: 'regenerate' }
  | { type: 'addTeam' }
  | { type: 'editTeam'; teamId: string }
  | { type: 'deleteTeam'; teamId: string }
  | { type: 'addPlayer'; teamId: string }
  | { type: 'editPlayer'; playerId: string }
  | { type: 'singleStat'; playerId: string }
  | { type: 'batchStats' }
  | { type: 'settings' }
  | { type: 'adminPin' }
  | { type: 'changePin' }
  | { type: 'exportImport' };

const LOGO_APC = '/assets/aistudio/IMG_5464__1__0442a703.jpeg';
const LOGO_SINDICATO = '/assets/aistudio/IMG_5484_43f69097.jpeg';

const SPECTATOR_TABS: Array<{ id: TabId; label: string }> = [
  { id: 'calendar', label: 'Calendario' },
  { id: 'standings', label: 'Clasificación' },
  { id: 'stats', label: 'Estadísticas' },
];

const ADMIN_TABS: Array<{ id: TabId; label: string }> = [
  { id: 'calendar', label: 'Calendario' },
  { id: 'standings', label: 'Clasificación' },
  { id: 'teams', label: 'Equipos' },
  { id: 'stats', label: 'Estadísticas' },
];

export default function App() {
  const [state, setState] = useState<TournamentState>(() => loadTournamentState());
  const [activeTab, setActiveTab] = useState<TabId>('calendar');
  const [modal, setModal] = useState<ActiveModal>({ type: 'none' });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const isAdmin = state.config.isAdmin;
  const visibleTabs = isAdmin ? ADMIN_TABS : SPECTATOR_TABS;

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const ok = saveTournamentState(state);
    if (!ok) {
      addToast('Error al guardar en memoria local.', 'error');
    }
  }, [state, addToast]);

  useEffect(() => {
    if (!isAdmin && activeTab === 'teams') {
      setActiveTab('calendar');
    }
  }, [isAdmin, activeTab]);

  const standings = useMemo(
    () => calculateStandings(state.teams, state.matches),
    [state.teams, state.matches]
  );

  const leader = useMemo(() => {
    return standings.length > 0 && standings[0].jj > 0 ? standings[0] : null;
  }, [standings]);

  const completedCount = useMemo(
    () => state.matches.filter((m) => m.status === 'COMPLETED').length,
    [state.matches]
  );

  const roundsList = useMemo(
    () => [...new Set(state.matches.map((m) => m.round))].sort((a, b) => a - b),
    [state.matches]
  );

  const closeModal = () => setModal({ type: 'none' });

  /* Módulo Administrador oculto en el logo del Sindicato (SUTAPC) */
  const handleSindicatoLogoClick = () => {
    if (isAdmin) {
      setModal({ type: 'settings' });
    } else {
      setModal({ type: 'adminPin' });
    }
  };

  const handleExitAdmin = () => {
    setState((prev) => ({
      ...prev,
      config: { ...prev.config, isAdmin: false },
    }));
    if (activeTab === 'teams') {
      setActiveTab('calendar');
    }
    addToast('Sesión de administrador cerrada. Vista de espectadores activa.', 'info');
  };

  /* Acciones de Partidos (solo Admin) */
  const handleSaveScore = (matchId: string, homeScore: number, awayScore: number) => {
    if (!isAdmin) return;
    setState((prev) => ({
      ...prev,
      matches: prev.matches.map((m) =>
        m.id === matchId
          ? { ...m, homeScore, awayScore, status: 'COMPLETED' }
          : m
      ),
    }));
    closeModal();
    addToast('Marcador guardado y tabla de posiciones actualizada.', 'success');
  };

  const handleResetScore = (matchId: string) => {
    if (!isAdmin) return;
    setState((prev) => ({
      ...prev,
      matches: prev.matches.map((m) =>
        m.id === matchId
          ? { ...m, homeScore: null, awayScore: null, status: 'PENDING' }
          : m
      ),
    }));
    closeModal();
    addToast('Partido vuelto a estado programado.', 'info');
  };

  const handleSaveMatchSchedule = (
    matchId: string,
    date: string,
    time: TimeSlot,
    court: number
  ) => {
    if (!isAdmin) return;
    setState((prev) => ({
      ...prev,
      matches: prev.matches.map((m) =>
        m.id === matchId ? { ...m, date, time, court } : m
      ),
    }));
    closeModal();
    addToast('Fecha, hora y cancha actualizadas.', 'success');
  };

  const handleSaveRoundSchedule = (
    round: number,
    date: string,
    time24h: string | null
  ) => {
    if (!isAdmin) return;
    const formattedTime = time24h !== null ? format24hTo12h(time24h) : null;
    setState((prev) => ({
      ...prev,
      matches: prev.matches.map((m) =>
        m.round === round
          ? { ...m, date, time: formattedTime ?? m.time }
          : m
      ),
    }));
    closeModal();
    addToast(`Jornada ${round} actualizada manualmente.`, 'success');
  };

  const handleChangeAdminPin = (newPin: string) => {
    if (!isAdmin) return;
    setState((prev) => ({
      ...prev,
      config: { ...prev.config, adminPin: newPin },
    }));
    closeModal();
    addToast('Clave de administrador actualizada correctamente.', 'success');
  };

  const handleRegenerateSchedule = () => {
    if (!isAdmin) return;
    setState((prev) => ({
      ...prev,
      matches: generateBalancedSchedule(prev.teams, prev.config),
    }));
    closeModal();
    addToast('Nuevo calendario equilibrado generado con éxito.', 'success');
  };

  /* Acciones de Equipos (solo Admin) */
  const handleAddTeam = (
    name: string,
    delegate: string,
    color: string,
    regenerate: boolean
  ) => {
    if (!isAdmin) return;
    const newTeam = {
      id: `t_${Date.now()}`,
      name,
      delegate,
      color,
    };
    setState((prev) => {
      const nextTeams = [...prev.teams, newTeam];
      const nextMatches = regenerate
        ? generateBalancedSchedule(nextTeams, prev.config)
        : prev.matches;
      return {
        ...prev,
        teams: nextTeams,
        matches: nextMatches,
      };
    });
    closeModal();
    addToast(`"${name}" agregado al torneo.`, 'success');
  };

  const handleEditTeam = (
    teamId: string,
    name: string,
    delegate: string,
    color: string
  ) => {
    if (!isAdmin) return;
    setState((prev) => ({
      ...prev,
      teams: prev.teams.map((t) =>
        t.id === teamId ? { ...t, name, delegate, color } : t
      ),
    }));
    closeModal();
    addToast('Datos del equipo actualizados.', 'success');
  };

  const handleDeleteTeam = (teamId: string) => {
    if (!isAdmin) return;
    setState((prev) => {
      const nextTeams = prev.teams.filter((t) => t.id !== teamId);
      return {
        ...prev,
        teams: nextTeams,
        players: prev.players.filter((p) => p.teamId !== teamId),
        playerLogs: prev.playerLogs.filter((l) => l.teamId !== teamId),
        matches: generateBalancedSchedule(nextTeams, prev.config),
      };
    });
    closeModal();
    addToast('Equipo eliminado y calendario equilibrado actualizado.', 'info');
  };

  /* Acciones de Jugadores (solo Admin) */
  const handleAddPlayer = (
    teamId: string,
    name: string,
    number: string,
    cedula: string,
    role: PlayerRole
  ) => {
    if (!isAdmin) return;
    setState((prev) => ({
      ...prev,
      players: [
        ...prev.players,
        {
          id: `p_${Date.now()}`,
          teamId,
          name,
          number,
          cedula,
          role,
        },
      ],
    }));
    closeModal();
    addToast('Jugador incorporado a la planilla.', 'success');
  };

  const handleEditPlayer = (
    playerId: string,
    name: string,
    number: string,
    cedula: string,
    role: PlayerRole
  ) => {
    if (!isAdmin) return;
    setState((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.id === playerId ? { ...p, name, number, cedula, role } : p
      ),
    }));
    closeModal();
    addToast('Ficha del jugador actualizada.', 'success');
  };

  const handleDeletePlayer = (playerId: string) => {
    if (!isAdmin) return;
    setState((prev) => ({
      ...prev,
      players: prev.players.filter((p) => p.id !== playerId),
      playerLogs: prev.playerLogs.filter((l) => l.playerId !== playerId),
    }));
    addToast('Jugador retirado de la planilla.', 'info');
  };

  /* Acciones de Estadísticas Individuales (solo Admin) */
  const handleSaveSingleStat = (
    playerId: string,
    teamId: string,
    round: number,
    stats: {
      arrimeAtt: number;
      arrimeGood: number;
      rastreroAtt: number;
      rastreroGood: number;
      aereoAtt: number;
      aereoGood: number;
    }
  ) => {
    if (!isAdmin) return;
    const player = state.players.find((p) => p.id === playerId);
    setState((prev) => ({
      ...prev,
      playerLogs: [
        ...prev.playerLogs,
        {
          id: `log_${Date.now()}`,
          round,
          playerId,
          teamId,
          ...stats,
        },
      ],
    }));
    closeModal();
    addToast(`Actuación sumada a ${player?.name || 'jugador'}.`, 'success');
  };

  const handleSaveBatchStats = (
    teamId: string,
    round: number,
    entries: Array<{
      playerId: string;
      arrimeAtt: number;
      arrimeGood: number;
      rastreroAtt: number;
      rastreroGood: number;
      aereoAtt: number;
      aereoGood: number;
    }>
  ) => {
    if (!isAdmin) return;
    const timestamp = Date.now();
    const newLogs = entries.map((entry, idx) => ({
      id: `log_${timestamp}_${idx}`,
      round,
      teamId,
      ...entry,
    }));
    setState((prev) => ({
      ...prev,
      playerLogs: [...prev.playerLogs, ...newLogs],
    }));
    closeModal();
    addToast(`Se registraron actuaciones para ${entries.length} jugador(es).`, 'success');
  };

  /* Configuración y Respaldo (solo Admin) */
  const handleSaveSettings = (nextConfig: TournamentConfig, regenerateNow: boolean) => {
    if (!isAdmin) return;
    setState((prev) => ({
      ...prev,
      config: { ...nextConfig, isAdmin: true },
      matches: regenerateNow
        ? generateBalancedSchedule(prev.teams, nextConfig)
        : prev.matches,
    }));
    closeModal();
    addToast('Configuración del torneo guardada.', 'success');
  };

  const handleResetFactory = () => {
    if (!isAdmin) return;
    const fresh = initializeSeedData();
    setState({
      ...fresh,
      config: { ...fresh.config, isAdmin: true },
    });
    closeModal();
    addToast(
      'Torneo restaurado con los 6 equipos iniciales y calendario equilibrado.',
      'info'
    );
  };

  const handleRestoreBackup = (imported: TournamentState) => {
    if (!isAdmin) return;
    setState({
      ...DEFAULT_STATE,
      ...imported,
      config: {
        ...DEFAULT_STATE.config,
        ...(imported.config || {}),
        isAdmin: true,
      },
    });
    closeModal();
    addToast('Datos del torneo restaurados correctamente.', 'success');
  };

  /* Renderizado de Contenido del Modal Activo */
  const renderModal = () => {
    if (modal.type === 'none') return null;

    if (modal.type === 'adminPin') {
      return (
        <Modal open title="Acceso Administrador" onClose={closeModal}>
          <AdminPinModalContent
            expectedPin={state.config.adminPin}
            onUnlock={() => {
              setState((prev) => ({
                ...prev,
                config: { ...prev.config, isAdmin: true },
              }));
              closeModal();
              addToast('Módulo Administrador desbloqueado.', 'success');
            }}
            onCancel={closeModal}
            onToast={addToast}
          />
        </Modal>
      );
    }

    if (modal.type === 'courtBalance') {
      return (
        <Modal
          open
          title="Distribución Equitativa por Cancha y Horario"
          maxWidthClass="max-w-2xl"
          onClose={closeModal}
        >
          <CourtBalanceModalContent
            teams={state.teams}
            matches={state.matches}
            onClose={closeModal}
          />
        </Modal>
      );
    }

    if (!isAdmin) return null;

    if (modal.type === 'score') {
      const m = state.matches.find((x) => x.id === modal.matchId);
      if (!m) return null;
      return (
        <Modal
          open
          title={`Registrar Marcador · Jornada ${m.round}`}
          onClose={closeModal}
        >
          <ScoreModalContent
            match={m}
            homeTeam={state.teams.find((t) => t.id === m.homeId)}
            awayTeam={state.teams.find((t) => t.id === m.awayId)}
            targetPoints={state.config.targetPoints}
            onSave={handleSaveScore}
            onReset={handleResetScore}
            onCancel={closeModal}
            onToast={addToast}
          />
        </Modal>
      );
    }

    if (modal.type === 'editMatch') {
      const m = state.matches.find((x) => x.id === modal.matchId);
      if (!m) return null;
      return (
        <Modal
          open
          title={`Programación Manual · Jornada ${m.round}`}
          onClose={closeModal}
        >
          <EditMatchModalContent
            match={m}
            homeTeam={state.teams.find((t) => t.id === m.homeId)}
            awayTeam={state.teams.find((t) => t.id === m.awayId)}
            onSave={handleSaveMatchSchedule}
            onCancel={closeModal}
          />
        </Modal>
      );
    }

    if (modal.type === 'editRound') {
      const roundMatches = state.matches.filter((x) => x.round === modal.round);
      if (roundMatches.length === 0) return null;
      return (
        <Modal
          open
          title={`Fecha y Hora Manual · Jornada ${modal.round}`}
          onClose={closeModal}
        >
          <EditRoundScheduleModalContent
            roundNum={modal.round}
            currentDate={roundMatches[0].date}
            sampleTime={roundMatches[0].time}
            matchCount={roundMatches.length}
            onSave={handleSaveRoundSchedule}
            onCancel={closeModal}
          />
        </Modal>
      );
    }

    if (modal.type === 'changePin') {
      return (
        <Modal open title="Cambiar Clave de Administrador" onClose={closeModal}>
          <ChangeAdminPinModalContent
            expectedPin={state.config.adminPin}
            onSaveNewPin={handleChangeAdminPin}
            onCancel={closeModal}
            onToast={addToast}
          />
        </Modal>
      );
    }

    if (modal.type === 'regenerate') {
      return (
        <Modal open title="Regenerar Calendario Equilibrado" onClose={closeModal}>
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              Se generará un nuevo calendario Round Robin para los{' '}
              <strong>{state.teams.length} equipos</strong> distribuidos equitativamente entre las{' '}
              <strong>4 canchas</strong> en turnos de <strong>07:00 PM y 09:00 PM</strong>.
            </p>
            <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200 font-medium">
              Nota: Esto reiniciará los marcadores actuales de los partidos. Las planillas de
              jugadores se mantienen intactas.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRegenerateSchedule}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#1565A0] text-white hover:bg-[#115282]"
              >
                Sí, Regenerar
              </button>
            </div>
          </div>
        </Modal>
      );
    }

    if (modal.type === 'addTeam') {
      return (
        <Modal open title="Agregar Nuevo Equipo al Torneo" onClose={closeModal}>
          <TeamFormModalContent
            mode="add"
            nextNumber={state.teams.length + 1}
            onSaveAdd={handleAddTeam}
            onSaveEdit={handleEditTeam}
            onCancel={closeModal}
          />
        </Modal>
      );
    }

    if (modal.type === 'editTeam') {
      const team = state.teams.find((t) => t.id === modal.teamId);
      if (!team) return null;
      return (
        <Modal open title="Editar Datos del Equipo" onClose={closeModal}>
          <TeamFormModalContent
            mode="edit"
            initialTeam={team}
            nextNumber={state.teams.length + 1}
            onSaveAdd={handleAddTeam}
            onSaveEdit={handleEditTeam}
            onCancel={closeModal}
          />
        </Modal>
      );
    }

    if (modal.type === 'deleteTeam') {
      const team = state.teams.find((t) => t.id === modal.teamId);
      if (!team) return null;
      return (
        <Modal open title="Eliminar Equipo" onClose={closeModal}>
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              ¿Deseas eliminar a <strong>{team.name}</strong> y regenerar el calendario con los{' '}
              {state.teams.length - 1} equipos restantes?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTeam(team.id)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700"
              >
                Eliminar y Regenerar
              </button>
            </div>
          </div>
        </Modal>
      );
    }

    if (modal.type === 'addPlayer') {
      const team = state.teams.find((t) => t.id === modal.teamId);
      return (
        <Modal
          open
          title={`Agregar Jugador · ${team?.name || ''}`}
          onClose={closeModal}
        >
          <PlayerFormModalContent
            mode="add"
            teamId={modal.teamId}
            onSaveAdd={handleAddPlayer}
            onSaveEdit={handleEditPlayer}
            onCancel={closeModal}
          />
        </Modal>
      );
    }

    if (modal.type === 'editPlayer') {
      const player = state.players.find((p) => p.id === modal.playerId);
      if (!player) return null;
      return (
        <Modal open title="Editar Jugador" onClose={closeModal}>
          <PlayerFormModalContent
            mode="edit"
            initialPlayer={player}
            teamId={player.teamId}
            onSaveAdd={handleAddPlayer}
            onSaveEdit={handleEditPlayer}
            onCancel={closeModal}
          />
        </Modal>
      );
    }

    if (modal.type === 'singleStat') {
      const player = state.players.find((p) => p.id === modal.playerId);
      if (!player) return null;
      return (
        <Modal open title={`Registrar Actuación · ${player.name}`} onClose={closeModal}>
          <SinglePlayerStatModalContent
            player={player}
            team={state.teams.find((t) => t.id === player.teamId)}
            rounds={roundsList}
            onSave={handleSaveSingleStat}
            onCancel={closeModal}
            onToast={addToast}
          />
        </Modal>
      );
    }

    if (modal.type === 'batchStats') {
      return (
        <Modal
          open
          title="Carga Rápida de Estadísticas por Equipo"
          maxWidthClass="max-w-3xl"
          onClose={closeModal}
        >
          <BatchStatsModalContent
            teams={state.teams}
            players={state.players}
            rounds={roundsList}
            onSaveBatch={handleSaveBatchStats}
            onCancel={closeModal}
            onToast={addToast}
          />
        </Modal>
      );
    }

    if (modal.type === 'settings') {
      return (
        <Modal open title="Configuración General del Torneo" onClose={closeModal}>
          <SettingsModalContent
            config={state.config}
            onSave={handleSaveSettings}
            onResetFactory={handleResetFactory}
            onCancel={closeModal}
          />
        </Modal>
      );
    }

    if (modal.type === 'exportImport') {
      return (
        <Modal open title="Exportar Reportes Excel y Respaldo JSON" onClose={closeModal}>
          <ExportImportModalContent
            onExportCalendar={() => {
              const name = exportCalendarCSV(state);
              addToast(`Archivo ${name} descargado.`, 'success');
            }}
            onExportStandings={() => {
              const name = exportStandingsCSV(state);
              addToast(`Archivo ${name} descargado.`, 'success');
            }}
            onExportStats={() => {
              const name = exportStatsCSV(state);
              addToast(`Archivo ${name} descargado.`, 'success');
            }}
            onDownloadBackup={() => {
              const name = downloadJSONBackup(state);
              addToast(`Respaldo ${name} descargado.`, 'success');
            }}
            onRestoreBackup={handleRestoreBackup}
            onToast={addToast}
          />
        </Modal>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f3f6fa] text-[#0B213A]">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {renderModal()}

      {/* BARRA SUPERIOR (Limpia y tipográfica, sin duplicar logos) */}
      <header className="bg-[#0B213A] text-white border-b-2 border-[#D98A1A] sticky top-0 z-30 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zona 1: Marca */}
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#F59E0B] rounded-lg"
          >
            <svg className="w-6 h-6 text-[#F59E0B] shrink-0" viewBox="0 0 36 36" fill="none">
              <circle
                cx="15"
                cy="20"
                r="10"
                fill="currentColor"
                fillOpacity="0.18"
                stroke="currentColor"
                strokeWidth="2.2"
              />
              <path
                d="M9 15C12 13 18 13 21 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <circle cx="28" cy="11" r="4" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="1.5" />
            </svg>
            <span className="text-base font-bold tracking-tight text-white">
              APC Turmero
            </span>
          </button>

          {/* Zona 2: Navegación Principal en Desktop */}
          <nav
            aria-label="Secciones del torneo"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            {visibleTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    isActive
                      ? 'text-white border-[#F59E0B] font-semibold'
                      : 'text-sky-100/80 border-transparent hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Zona 3: Acción Primaria (Admin: Exportar; Espectadores: Horario oficial) */}
          <div className="flex items-center shrink-0">
            {isAdmin ? (
              <button
                type="button"
                onClick={() => setModal({ type: 'exportImport' })}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#F59E0B] hover:bg-amber-400 text-[#0B213A] transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel / Respaldo</span>
              </button>
            ) : (
              <span className="text-xs font-mono text-sky-200/90 whitespace-nowrap shrink-0">
                4 Canchas · 07 / 09 PM
              </span>
            )}
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Cabecera Institucional Simétrica con Ambos Emblemas */}
        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#0B213A] via-[#1565A0] to-[#D98A1A]" />

          <div className="px-5 py-6 sm:px-8 sm:py-7">
            {/* Diseño Desktop: Emblemas simétricos flanqueando el título central */}
            <div className="hidden lg:grid lg:grid-cols-[200px_1fr_200px] lg:items-center lg:gap-8">
              {/* Emblema Izquierdo: Delegados de Prevención APC Turmero */}
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-white ring-2 ring-[#1565A0]/25 shadow-sm">
                  <img
                    src={LOGO_APC}
                    alt="Delegados de Prevención APC Turmero"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover scale-[1.12]"
                  />
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-bold text-[#0B213A]">Delegados de Prevención</p>
                  <p className="text-[11px] text-slate-500">APC Turmero</p>
                </div>
              </div>

              {/* Bloque Central: Título y Datos del Campeonato */}
              <div className="text-center space-y-2 px-4 border-x border-slate-100">
                <p className="text-xs font-bold tracking-wide text-[#1565A0]">
                  Organización Conjunta · Complejo Deportivo APC Turmero
                </p>
                <h1 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-[#0B213A] text-balance">
                  {state.config.tournamentName}
                </h1>
                <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs text-slate-600">
                  <span>Bolas Criollas Oficial</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">4 Canchas</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">07:00 PM / 09:00 PM</span>
                </div>

                {isAdmin && (
                  <div className="pt-3 mt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-2.5 no-print">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2E8540] mr-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Admin SUTAPC</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setModal({ type: 'settings' })}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#1565A0] hover:bg-[#115282] text-white transition-colors whitespace-nowrap shrink-0"
                    >
                      <Sliders className="w-4 h-4" />
                      <span>Configurar Torneo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setModal({ type: 'changePin' })}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#0B213A] hover:bg-[#153558] text-amber-300 transition-colors whitespace-nowrap shrink-0"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Cambiar Clave</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExitAdmin}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-[#0B213A] border border-slate-300 transition-colors whitespace-nowrap shrink-0"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Salir de Admin</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Emblema Derecho: SUTAPC Planta Turmero (Acceso Admin Oculto) */}
              <div className="flex flex-col items-center text-center gap-2">
                <button
                  type="button"
                  onClick={handleSindicatoLogoClick}
                  aria-label="SUTAPC Planta Turmero"
                  className="w-24 h-24 rounded-2xl overflow-hidden bg-[#f7f6f2] ring-2 ring-[#D98A1A]/40 shadow-sm cursor-default focus:outline-none p-1"
                >
                  <img
                    src={LOGO_SINDICATO}
                    alt="SUTAPC Planta Turmero Sindicato Único de Trabajadores"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </button>
                <div className="leading-tight">
                  <p className="text-xs font-bold text-[#0B213A]">SUTAPC Planta Turmero</p>
                  <p className="text-[11px] text-slate-500">Sindicato Único</p>
                </div>
              </div>
            </div>

            {/* Diseño Móvil / Tablet: Par de Emblemas Centrados + Título */}
            <div className="lg:hidden flex flex-col items-center text-center gap-4">
              <div className="flex items-center justify-center gap-5">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-white ring-2 ring-[#1565A0]/25 shadow-sm shrink-0">
                  <img
                    src={LOGO_APC}
                    alt="Delegados de Prevención APC Turmero"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover scale-[1.12]"
                  />
                </div>

                <div className="w-px h-14 bg-slate-200" aria-hidden="true" />

                <button
                  type="button"
                  onClick={handleSindicatoLogoClick}
                  aria-label="SUTAPC Planta Turmero"
                  className="w-20 h-20 rounded-2xl overflow-hidden bg-[#f7f6f2] ring-2 ring-[#D98A1A]/40 shadow-sm shrink-0 cursor-default focus:outline-none p-1"
                >
                  <img
                    src={LOGO_SINDICATO}
                    alt="SUTAPC Planta Turmero Sindicato Único de Trabajadores"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </button>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-bold text-[#1565A0]">
                  Delegados de Prevención APC · SUTAPC Planta Turmero
                </p>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0B213A] text-balance">
                  {state.config.tournamentName}
                </h1>
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-slate-600 font-mono tabular-nums">
                  <span>4 Canchas</span>
                  <span aria-hidden="true">·</span>
                  <span>07:00 PM / 09:00 PM</span>
                </div>
              </div>

              {isAdmin && (
                <div className="w-full pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-2 no-print">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2E8540] mr-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin SUTAPC</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setModal({ type: 'settings' })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#1565A0] hover:bg-[#115282] text-white transition-colors whitespace-nowrap shrink-0"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Configurar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal({ type: 'changePin' })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#0B213A] hover:bg-[#153558] text-amber-300 transition-colors whitespace-nowrap shrink-0"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Cambiar Clave</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExitAdmin}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-[#0B213A] border border-slate-300 transition-colors whitespace-nowrap shrink-0"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Salir de Admin</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Navegación móvil (visible solo en < md) */}
        <nav
          aria-label="Secciones móviles"
          className="md:hidden flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl overflow-x-auto no-scrollbar no-print"
        >
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'bg-[#0B213A] text-white shadow-xs'
                    : 'text-slate-700 hover:text-[#0B213A]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Tarjetas de Resumen */}
        <SummaryCards
          totalTeams={state.teams.length}
          totalPlayers={state.players.length}
          completedMatches={completedCount}
          totalMatches={state.matches.length}
          leader={leader}
        />

        {/* Vista Activa */}
        {activeTab === 'calendar' && (
          <CalendarTab
            matches={state.matches}
            teams={state.teams}
            isAdmin={isAdmin}
            onOpenScoreModal={(matchId) => setModal({ type: 'score', matchId })}
            onOpenEditMatchModal={(matchId) => setModal({ type: 'editMatch', matchId })}
            onOpenEditRoundModal={(round) => setModal({ type: 'editRound', round })}
            onOpenCourtBalanceModal={() => setModal({ type: 'courtBalance' })}
            onOpenRegenerateModal={() => setModal({ type: 'regenerate' })}
          />
        )}

        {activeTab === 'standings' && (
          <StandingsTab
            teams={state.teams}
            matches={state.matches}
            isAdmin={isAdmin}
            onExportCSV={() => {
              const name = exportStandingsCSV(state);
              addToast(`Archivo ${name} descargado.`, 'success');
            }}
          />
        )}

        {activeTab === 'teams' && isAdmin && (
          <TeamsTab
            teams={state.teams}
            players={state.players}
            isAdmin={isAdmin}
            onAddTeam={() => setModal({ type: 'addTeam' })}
            onEditTeam={(teamId) => setModal({ type: 'editTeam', teamId })}
            onDeleteTeam={(teamId) => setModal({ type: 'deleteTeam', teamId })}
            onAddPlayer={(teamId) => setModal({ type: 'addPlayer', teamId })}
            onEditPlayer={(playerId) => setModal({ type: 'editPlayer', playerId })}
            onDeletePlayer={handleDeletePlayer}
          />
        )}

        {activeTab === 'stats' && (
          <StatsTab
            state={state}
            teams={state.teams}
            isAdmin={isAdmin}
            onOpenBatchStatsModal={() => setModal({ type: 'batchStats' })}
            onOpenSingleStatModal={(playerId) => setModal({ type: 'singleStat', playerId })}
            onExportCSV={() => {
              const name = exportStatsCSV(state);
              addToast(`Archivo ${name} descargado.`, 'success');
            }}
          />
        )}
      </main>

      {/* PIE DE PÁGINA CON SELLOS INSTITUCIONALES */}
      <footer className="bg-[#0B213A] text-sky-100/80 text-xs py-6 px-4 mt-12 border-t-2 border-[#D98A1A] no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-white ring-1 ring-white/25 shrink-0">
              <img
                src={LOGO_APC}
                alt="Delegados de Prevención APC Turmero"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover scale-[1.12]"
              />
            </div>
            <button
              type="button"
              onClick={handleSindicatoLogoClick}
              aria-label="SUTAPC Planta Turmero"
              className="w-9 h-9 rounded-lg overflow-hidden bg-[#f7f6f2] ring-1 ring-white/25 shrink-0 cursor-default focus:outline-none p-0.5"
            >
              <img
                src={LOGO_SINDICATO}
                alt="SUTAPC Planta Turmero"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </button>
            <div className="text-left">
              <p className="font-semibold text-white">
                Complejo Deportivo APC Turmero
              </p>
              <p className="text-[11px] text-sky-200/75">
                Delegados de Prevención &amp; SUTAPC Planta Turmero
              </p>
            </div>
          </div>

          <p className="font-mono text-[11px] text-sky-200/80">
            Canchas 1 a 4 · Horarios 07:00 PM y 09:00 PM
          </p>
        </div>
      </footer>
    </div>
  );
}
