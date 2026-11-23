import {
  Match,
  Player,
  PlayerAggregatedStats,
  PlayerRole,
  StandingRow,
  Team,
  TimeSlot,
  TournamentConfig,
  TournamentState,
} from '../types/tournament';

export const STORAGE_KEY = 'apc_turmero_bolas_criollas_v1';

export const DEFAULT_CONFIG: TournamentConfig = {
  tournamentName: 'Torneo Bolas Criollas · APC Turmero',
  roundsCount: 1,
  startDate: '2026-11-24',
  playDays: [1, 2, 3, 4, 5],
  targetPoints: 20,
  adminPin: '2026',
  isAdmin: false,
};

export const DEFAULT_STATE: TournamentState = {
  config: DEFAULT_CONFIG,
  teams: [],
  players: [],
  matches: [],
  playerLogs: [],
};

export function parseLocalDate(isoStr: string): Date {
  const [y, m, d] = isoStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatDateISO(dateObj: Date): string {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateHuman(isoStr: string): string {
  if (!isoStr) return 'Sin fecha';
  const d = parseLocalDate(isoStr);
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

export function parseTimeTo24h(timeStr: string): string {
  const trimmed = (timeStr || '').trim();
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hour = Number(match12[1]);
    const min = match12[2];
    const period = match12[3].toUpperCase();
    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${min}`;
  }
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return `${String(Number(match24[1])).padStart(2, '0')}:${match24[2]}`;
  }
  return '19:00';
}

export function format24hTo12h(hhmm: string): string {
  const match = (hhmm || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return hhmm || '07:00 PM';
  const h24 = Number(match[1]);
  const min = match[2];
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, '0')}:${min} ${period}`;
}

export function advanceToValidDay(dateObj: Date, allowedDays: number[]): Date {
  const d = new Date(dateObj);
  let guard = 0;
  while (!allowedDays.includes(d.getDay()) && guard < 14) {
    d.setDate(d.getDate() + 1);
    guard++;
  }
  return d;
}

export function addValidDays(dateObj: Date, steps: number, allowedDays: number[]): Date {
  const d = new Date(dateObj);
  let added = 0;
  let guard = 0;
  while (added < steps && guard < 60) {
    d.setDate(d.getDate() + 1);
    if (allowedDays.includes(d.getDay())) added++;
    guard++;
  }
  return d;
}

export function generateBalancedSchedule(teams: Team[], config: TournamentConfig): Match[] {
  const n = teams.length;
  if (n < 2) return [];

  const teamIds = teams.map((t) => t.id);
  const hasBye = n % 2 !== 0;
  if (hasBye) teamIds.push('BYE');

  const totalSlots = teamIds.length;
  const roundsPerLeg = totalSlots - 1;
  const matchesPerRound = totalSlots / 2;
  const rawRounds: Array<Array<{ homeId: string; awayId: string }>> = [];

  const fixed = teamIds[0];

  for (let leg = 0; leg < (config.roundsCount || 1); leg++) {
    const rotating = teamIds.slice(1);
    for (let r = 0; r < roundsPerLeg; r++) {
      const roundPairs: Array<{ homeId: string; awayId: string }> = [];
      const fullList = [fixed, ...rotating];

      for (let i = 0; i < matchesPerRound; i++) {
        const tA = fullList[i];
        const tB = fullList[totalSlots - 1 - i];
        if (tA !== 'BYE' && tB !== 'BYE') {
          const homeId = leg % 2 === 0 ? tA : tB;
          const awayId = leg % 2 === 0 ? tB : tA;
          roundPairs.push({ homeId, awayId });
        }
      }
      rawRounds.push(roundPairs);
      const last = rotating.pop();
      if (last !== undefined) rotating.unshift(last);
    }
  }

  const courtUsage: Record<string, Record<number, number>> = {};
  const timeUsage: Record<string, Record<TimeSlot, number>> = {};
  teams.forEach((t) => {
    courtUsage[t.id] = { 1: 0, 2: 0, 3: 0, 4: 0 };
    timeUsage[t.id] = { '07:00 PM': 0, '09:00 PM': 0 };
  });

  let currentDate = parseLocalDate(config.startDate || '2026-11-24');
  const allowedDays =
    config.playDays && config.playDays.length > 0 ? config.playDays : [1, 2, 3, 4, 5];
  currentDate = advanceToValidDay(currentDate, allowedDays);

  const generatedMatches: Match[] = [];
  let matchCounter = 1;

  rawRounds.forEach((pairs, rIndex) => {
    const roundNum = rIndex + 1;
    const totalInRound = pairs.length;
    const slot07Count = Math.min(4, Math.ceil(totalInRound / 2));

    const usedCourtsBySlot: Record<TimeSlot, Set<number>> = {
      '07:00 PM': new Set<number>(),
      '09:00 PM': new Set<number>(),
    };

    pairs.forEach((pair, pIdx) => {
      const dayOffset = Math.floor(pIdx / 8);
      const matchDateObj = addValidDays(currentDate, dayOffset, allowedDays);
      const dateStr = formatDateISO(matchDateObj);

      const slotIdxInDay = pIdx % 8;
      let chosenTime: TimeSlot = slotIdxInDay < slot07Count ? '07:00 PM' : '09:00 PM';
      if (usedCourtsBySlot[chosenTime].size >= 4) {
        chosenTime = chosenTime === '07:00 PM' ? '09:00 PM' : '07:00 PM';
      }

      let bestCourt = 1;
      let bestScore = Infinity;

      for (let c = 1; c <= 4; c++) {
        if (usedCourtsBySlot[chosenTime].has(c)) continue;
        const uHome = courtUsage[pair.homeId][c];
        const uAway = courtUsage[pair.awayId][c];
        const score = uHome * uHome + uAway * uAway + (uHome + uAway);
        if (score < bestScore) {
          bestScore = score;
          bestCourt = c;
        }
      }

      usedCourtsBySlot[chosenTime].add(bestCourt);
      courtUsage[pair.homeId][bestCourt]++;
      courtUsage[pair.awayId][bestCourt]++;
      timeUsage[pair.homeId][chosenTime]++;
      timeUsage[pair.awayId][chosenTime]++;

      generatedMatches.push({
        id: `m_${roundNum}_${matchCounter++}`,
        round: roundNum,
        date: dateStr,
        time: chosenTime,
        court: bestCourt,
        homeId: pair.homeId,
        awayId: pair.awayId,
        homeScore: null,
        awayScore: null,
        status: 'PENDING',
      });
    });

    const daysConsumed = Math.max(1, Math.ceil(totalInRound / 8));
    currentDate = addValidDays(currentDate, daysConsumed, allowedDays);
  });

  return generatedMatches;
}

export function initializeSeedData(): TournamentState {
  const initialTeams: Team[] = [
    { id: 't1', name: 'Equipo 1', delegate: 'Carlos Mendoza', color: '#16a34a' },
    { id: 't2', name: 'Equipo 2', delegate: 'José Gregorio Pérez', color: '#2563eb' },
    { id: 't3', name: 'Equipo 3', delegate: 'Luis Alberto Rojas', color: '#d97706' },
    { id: 't4', name: 'Equipo 4', delegate: 'Rafael Castillo', color: '#dc2626' },
    { id: 't5', name: 'Equipo 5', delegate: 'Miguel Ángel Silva', color: '#7c3aed' },
    { id: 't6', name: 'Equipo 6', delegate: 'Pedro Ramírez', color: '#0d9488' },
  ];

  const sampleNames: Array<[string, PlayerRole, string]> = [
    ['Juan Bolívar', 'Arrimador', '12'],
    ['Marco Antonio Díaz', 'Bochador', '08'],
    ['Héctor Gómez', 'Mixto', '05'],
    ['Víctor Morales', 'Bochador', '19'],
    ['Andrés Bello', 'Arrimador', '03'],
    ['Simón Rodríguez', 'Bochador', '10'],
    ['Félix Hernández', 'Mixto', '07'],
    ['Oscar Martínez', 'Arrimador', '21'],
    ['Ramón Velásquez', 'Arrimador', '04'],
    ['César Tovar', 'Bochador', '11'],
    ['Eduardo Blanco', 'Mixto', '15'],
    ['Jesús Briceño', 'Bochador', '22'],
    ['Antonio Sucre', 'Arrimador', '01'],
    ['Daniel Flores', 'Bochador', '09'],
    ['Wilmer Castro', 'Mixto', '14'],
    ['Gustavo León', 'Arrimador', '18'],
    ['Roberto Salas', 'Arrimador', '06'],
    ['Francisco Miranda', 'Bochador', '13'],
    ['Jorge Vargas', 'Mixto', '17'],
    ['Nelson Ortiz', 'Bochador', '20'],
    ['Ángel Aponte', 'Arrimador', '02'],
    ['Manuel Piar', 'Bochador', '16'],
    ['Henry Linares', 'Mixto', '23'],
    ['Raúl Paredes', 'Arrimador', '24'],
  ];

  const players: Player[] = [];
  let pIdx = 0;
  initialTeams.forEach((team) => {
    for (let i = 0; i < 4; i++) {
      const [pName, role, num] = sampleNames[pIdx++];
      players.push({
        id: `p_${team.id}_${i + 1}`,
        teamId: team.id,
        name: pName,
        cedula: `V-${14500000 + pIdx * 137}`,
        number: num,
        role,
      });
    }
  });

  const config: TournamentConfig = { ...DEFAULT_CONFIG };
  const matches = generateBalancedSchedule(initialTeams, config);

  const state: TournamentState = {
    config,
    teams: initialTeams,
    players,
    matches,
    playerLogs: [],
  };

  saveTournamentState(state);
  return state;
}

export function loadTournamentState(): TournamentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<TournamentState>;
      const mergedConfig: TournamentConfig = {
        ...DEFAULT_CONFIG,
        ...(parsed.config || {}),
        adminPin: parsed.config?.adminPin ? parsed.config.adminPin : '2026',
        isAdmin: false,
      };
      return {
        ...DEFAULT_STATE,
        ...parsed,
        config: mergedConfig,
        teams: parsed.teams || [],
        players: parsed.players || [],
        matches: parsed.matches || [],
        playerLogs: parsed.playerLogs || [],
      };
    }
  } catch (err) {
    console.error('Error leyendo localStorage:', err);
  }
  return initializeSeedData();
}

export function saveTournamentState(state: TournamentState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.error('Error guardando en localStorage:', err);
    return false;
  }
}

export function calculateStandings(teams: Team[], matches: Match[]): StandingRow[] {
  const statsMap: Record<string, StandingRow> = {};
  teams.forEach((t) => {
    statsMap[t.id] = {
      teamId: t.id,
      name: t.name,
      delegate: t.delegate || '',
      color: t.color || '#16a34a',
      jj: 0,
      jg: 0,
      jp: 0,
      tf: 0,
      tc: 0,
      dif: 0,
      ave: 0,
      pts: 0,
      tieBreakerNote: '',
    };
  });

  const completedMatches = matches.filter(
    (m) => m.status === 'COMPLETED' && m.homeScore !== null && m.awayScore !== null
  );

  completedMatches.forEach((m) => {
    const h = statsMap[m.homeId];
    const a = statsMap[m.awayId];
    if (!h || !a) return;

    const hs = Number(m.homeScore);
    const as = Number(m.awayScore);

    h.jj++;
    a.jj++;
    h.tf += hs;
    h.tc += as;
    a.tf += as;
    a.tc += hs;

    if (hs > as) {
      h.jg++;
      h.pts += 2;
      a.jp++;
    } else if (as > hs) {
      a.jg++;
      a.pts += 2;
      h.jp++;
    } else {
      h.pts += 1;
      a.pts += 1;
    }
  });

  const list = Object.values(statsMap).map((item) => {
    const dif = item.tf - item.tc;
    const ave = item.tc === 0 ? (item.tf > 0 ? item.tf : 0) : item.tf / item.tc;
    return { ...item, dif, ave };
  });

  list.sort((a, b) => {
    if (b.jg !== a.jg) return b.jg - a.jg;
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.ave !== a.ave) return b.ave - a.ave;
    return b.dif - a.dif;
  });

  const finalStandings: StandingRow[] = [];
  let i = 0;
  while (i < list.length) {
    let j = i + 1;
    while (j < list.length && list[j].jg === list[i].jg && list[j].pts === list[i].pts) {
      j++;
    }

    const tiedGroup = list.slice(i, j);
    if (tiedGroup.length === 1) {
      tiedGroup[0].tieBreakerNote = '—';
      finalStandings.push(tiedGroup[0]);
    } else {
      const groupIds = new Set(tiedGroup.map((t) => t.teamId));
      const h2h: Record<string, { jg: number; tf: number; tc: number; played: number }> = {};
      tiedGroup.forEach((t) => {
        h2h[t.teamId] = { jg: 0, tf: 0, tc: 0, played: 0 };
      });

      completedMatches.forEach((m) => {
        if (groupIds.has(m.homeId) && groupIds.has(m.awayId)) {
          const hs = Number(m.homeScore);
          const as = Number(m.awayScore);
          h2h[m.homeId].played++;
          h2h[m.awayId].played++;
          h2h[m.homeId].tf += hs;
          h2h[m.homeId].tc += as;
          h2h[m.awayId].tf += as;
          h2h[m.awayId].tc += hs;
          if (hs > as) h2h[m.homeId].jg++;
          else if (as > hs) h2h[m.awayId].jg++;
        }
      });

      tiedGroup.sort((a, b) => {
        const ha = h2h[a.teamId];
        const hb = h2h[b.teamId];
        if (hb.jg !== ha.jg) return hb.jg - ha.jg;
        const aveHa = ha.tc === 0 ? ha.tf : ha.tf / ha.tc;
        const aveHb = hb.tc === 0 ? hb.tf : hb.tf / hb.tc;
        if (Math.abs(aveHb - aveHa) > 0.0001) return aveHb - aveHa;
        if (Math.abs(b.ave - a.ave) > 0.0001) return b.ave - a.ave;
        return b.dif - a.dif;
      });

      tiedGroup.forEach((teamItem) => {
        const rec = h2h[teamItem.teamId];
        if (rec.played > 0) {
          teamItem.tieBreakerNote = `Entre sí: ${rec.jg}G (${rec.tf}-${rec.tc})`;
        } else {
          teamItem.tieBreakerNote = `Por Average (${teamItem.ave.toFixed(3)})`;
        }
        finalStandings.push(teamItem);
      });
    }
    i = j;
  }

  return finalStandings;
}

export function calculatePlayerStats(state: TournamentState): PlayerAggregatedStats[] {
  const map: Record<
    string,
    Omit<
      PlayerAggregatedStats,
      | 'arrimeAvg'
      | 'rastreroAvg'
      | 'aereoAvg'
      | 'bocheTotalAtt'
      | 'bocheTotalGood'
      | 'bocheTotalAvg'
      | 'totalAtt'
      | 'totalGood'
      | 'totalAvg'
    >
  > = {};

  state.players.forEach((p) => {
    const team = state.teams.find((t) => t.id === p.teamId);
    map[p.id] = {
      playerId: p.id,
      name: p.name,
      number: p.number || '—',
      role: p.role || 'Mixto',
      teamId: p.teamId,
      teamName: team ? team.name : 'Sin Equipo',
      teamColor: team ? team.color : '#64748b',
      gamesLogged: 0,
      arrimeAtt: 0,
      arrimeGood: 0,
      rastreroAtt: 0,
      rastreroGood: 0,
      aereoAtt: 0,
      aereoGood: 0,
    };
  });

  state.playerLogs.forEach((log) => {
    const st = map[log.playerId];
    if (!st) return;
    st.gamesLogged++;
    st.arrimeAtt += Number(log.arrimeAtt || 0);
    st.arrimeGood += Number(log.arrimeGood || 0);
    st.rastreroAtt += Number(log.rastreroAtt || 0);
    st.rastreroGood += Number(log.rastreroGood || 0);
    st.aereoAtt += Number(log.aereoAtt || 0);
    st.aereoGood += Number(log.aereoGood || 0);
  });

  return Object.values(map).map((st) => {
    const arrimeAvg = st.arrimeAtt > 0 ? st.arrimeGood / st.arrimeAtt : 0;
    const rastreroAvg = st.rastreroAtt > 0 ? st.rastreroGood / st.rastreroAtt : 0;
    const aereoAvg = st.aereoAtt > 0 ? st.aereoGood / st.aereoAtt : 0;

    const bocheTotalAtt = st.rastreroAtt + st.aereoAtt;
    const bocheTotalGood = st.rastreroGood + st.aereoGood;
    const bocheTotalAvg = bocheTotalAtt > 0 ? bocheTotalGood / bocheTotalAtt : 0;

    const totalAtt = st.arrimeAtt + bocheTotalAtt;
    const totalGood = st.arrimeGood + bocheTotalGood;
    const totalAvg = totalAtt > 0 ? totalGood / totalAtt : 0;

    return {
      ...st,
      arrimeAvg,
      rastreroAvg,
      aereoAvg,
      bocheTotalAtt,
      bocheTotalGood,
      bocheTotalAvg,
      totalAtt,
      totalGood,
      totalAvg,
    };
  });
}

export function downloadCSV(filename: string, rows: Array<Array<string | number>>): void {
  const BOM = '\uFEFF';
  const csvContent =
    BOM +
    rows
      .map((r) =>
        r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';')
      )
      .join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCalendarCSV(state: TournamentState): string {
  const rows: Array<Array<string | number>> = [
    [
      'Jornada',
      'Fecha',
      'Hora',
      'Cancha',
      'Equipo Local',
      'Tantos Local',
      'Tantos Visitante',
      'Equipo Visitante',
      'Estado',
    ],
  ];
  state.matches.forEach((m) => {
    const h = state.teams.find((t) => t.id === m.homeId)?.name || '';
    const a = state.teams.find((t) => t.id === m.awayId)?.name || '';
    rows.push([
      m.round,
      m.date,
      m.time,
      `Cancha ${m.court}`,
      h,
      m.homeScore ?? '',
      m.awayScore ?? '',
      a,
      m.status === 'COMPLETED' ? 'Finalizado' : 'Programado',
    ]);
  });
  const filename = 'Calendario_APC_Turmero.csv';
  downloadCSV(filename, rows);
  return filename;
}

export function exportStandingsCSV(state: TournamentState): string {
  const st = calculateStandings(state.teams, state.matches);
  const rows: Array<Array<string | number>> = [
    ['Pos', 'Equipo', 'Delegado', 'JJ', 'JG', 'JP', 'TF', 'TC', 'DIF', 'AVE', 'PTS', 'Criterio Desempate'],
  ];
  st.forEach((r, idx) => {
    rows.push([
      idx + 1,
      r.name,
      r.delegate,
      r.jj,
      r.jg,
      r.jp,
      r.tf,
      r.tc,
      r.dif,
      r.ave.toFixed(3),
      r.pts,
      r.tieBreakerNote,
    ]);
  });
  const filename = 'Clasificacion_APC_Turmero.csv';
  downloadCSV(filename, rows);
  return filename;
}

export function exportStatsCSV(state: TournamentState): string {
  const st = calculatePlayerStats(state);
  const rows: Array<Array<string | number>> = [
    [
      'Jugador',
      'Numero',
      'Rol',
      'Equipo',
      'Arrimes Intentos',
      'Arrimes Buenos',
      'AVG Arrime',
      'Rastreros Intentos',
      'Rastreros Efectivos',
      'AVG Rastrero',
      'Aereos Intentos',
      'Aereos Efectivos',
      'AVG Aereo',
      'Total Boches Int',
      'Total Boches Efec',
      'AVG Boche General',
      'AVG General',
    ],
  ];
  st.forEach((s) => {
    rows.push([
      s.name,
      s.number,
      s.role,
      s.teamName,
      s.arrimeAtt,
      s.arrimeGood,
      s.arrimeAvg.toFixed(3),
      s.rastreroAtt,
      s.rastreroGood,
      s.rastreroAvg.toFixed(3),
      s.aereoAtt,
      s.aereoGood,
      s.aereoAvg.toFixed(3),
      s.bocheTotalAtt,
      s.bocheTotalGood,
      s.bocheTotalAvg.toFixed(3),
      s.totalAvg.toFixed(3),
    ]);
  });
  const filename = 'Estadisticas_Individuales_APC_Turmero.csv';
  downloadCSV(filename, rows);
  return filename;
}

export function downloadJSONBackup(state: TournamentState): string {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const filename = `Respaldo_Torneo_APC_Turmero_${formatDateISO(new Date())}.json`;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return filename;
}
