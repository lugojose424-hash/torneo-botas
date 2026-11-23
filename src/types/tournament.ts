export type PlayerRole = 'Arrimador' | 'Bochador' | 'Mixto';

export type TimeSlot = string;

export type MatchStatus = 'PENDING' | 'COMPLETED';

export type TabId = 'calendar' | 'standings' | 'teams' | 'stats';

export interface TournamentConfig {
  tournamentName: string;
  roundsCount: number;
  startDate: string;
  playDays: number[];
  targetPoints: number;
  adminPin: string;
  isAdmin: boolean;
}

export interface Team {
  id: string;
  name: string;
  delegate: string;
  color: string;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  cedula: string;
  number: string;
  role: PlayerRole;
}

export interface Match {
  id: string;
  round: number;
  date: string;
  time: TimeSlot;
  court: number;
  homeId: string;
  awayId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
}

export interface PlayerStatLog {
  id: string;
  matchId?: string;
  round: number;
  playerId: string;
  teamId: string;
  arrimeAtt: number;
  arrimeGood: number;
  rastreroAtt: number;
  rastreroGood: number;
  aereoAtt: number;
  aereoGood: number;
}

export interface TournamentState {
  config: TournamentConfig;
  teams: Team[];
  players: Player[];
  matches: Match[];
  playerLogs: PlayerStatLog[];
}

export interface StandingRow {
  teamId: string;
  name: string;
  delegate: string;
  color: string;
  jj: number;
  jg: number;
  jp: number;
  tf: number;
  tc: number;
  dif: number;
  ave: number;
  pts: number;
  tieBreakerNote: string;
}

export interface PlayerAggregatedStats {
  playerId: string;
  name: string;
  number: string;
  role: PlayerRole;
  teamId: string;
  teamName: string;
  teamColor: string;
  gamesLogged: number;
  arrimeAtt: number;
  arrimeGood: number;
  arrimeAvg: number;
  rastreroAtt: number;
  rastreroGood: number;
  rastreroAvg: number;
  aereoAtt: number;
  aereoGood: number;
  aereoAvg: number;
  bocheTotalAtt: number;
  bocheTotalGood: number;
  bocheTotalAvg: number;
  totalAtt: number;
  totalGood: number;
  totalAvg: number;
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}
