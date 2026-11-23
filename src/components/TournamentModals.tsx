import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CalendarClock,
  Trophy,
  BarChart2,
  Download,
  Upload,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';
import {
  Match,
  Player,
  PlayerRole,
  Team,
  TimeSlot,
  ToastType,
  TournamentConfig,
  TournamentState,
} from '../types/tournament';
import {
  format24hTo12h,
  formatDateHuman,
  parseTimeTo24h,
} from '../utils/tournamentLogic';

/* 1. Modal Registrar / Editar Marcador */
interface ScoreModalProps {
  match: Match;
  homeTeam?: Team;
  awayTeam?: Team;
  targetPoints: number;
  onSave: (matchId: string, homeScore: number, awayScore: number) => void;
  onReset: (matchId: string) => void;
  onCancel: () => void;
  onToast: (msg: string, type: ToastType) => void;
}

export function ScoreModalContent({
  match,
  homeTeam,
  awayTeam,
  targetPoints,
  onSave,
  onReset,
  onCancel,
  onToast,
}: ScoreModalProps) {
  const [homeScore, setHomeScore] = useState<string>(
    match.homeScore !== null ? String(match.homeScore) : ''
  );
  const [awayScore, setAwayScore] = useState<string>(
    match.awayScore !== null ? String(match.awayScore) : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hs = Number(homeScore);
    const as = Number(awayScore);
    if (homeScore === '' || awayScore === '') {
      onToast('Ingresa ambos marcadores antes de guardar.', 'error');
      return;
    }
    if (hs === as) {
      onToast(
        'En Bolas Criollas debe haber un ganador (los tantos no pueden quedar empatados).',
        'error'
      );
      return;
    }
    onSave(match.id, hs, as);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 flex justify-between font-mono tabular-nums">
        <span>
          <strong>Cancha {match.court}</strong> · {match.time}
        </span>
        <span>{formatDateHuman(match.date)}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <label
            htmlFor="score-home"
            className="block text-xs font-bold text-slate-800 mb-2 truncate"
          >
            {homeTeam?.name || 'Local'}
          </label>
          <input
            id="score-home"
            type="number"
            min={0}
            max={50}
            required
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            placeholder={`0 - ${targetPoints}`}
            className="w-full text-center font-mono tabular-nums text-2xl font-bold py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <label
            htmlFor="score-away"
            className="block text-xs font-bold text-slate-800 mb-2 truncate"
          >
            {awayTeam?.name || 'Visitante'}
          </label>
          <input
            id="score-away"
            type="number"
            min={0}
            max={50}
            required
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            placeholder={`0 - ${targetPoints}`}
            className="w-full text-center font-mono tabular-nums text-2xl font-bold py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
        {match.status === 'COMPLETED' ? (
          <button
            type="button"
            onClick={() => onReset(match.id)}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
          >
            Limpiar Resultado
          </button>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            Guardar Tantos
          </button>
        </div>
      </div>
    </form>
  );
}

/* 2. Modal Editar Programación del Partido */
interface EditMatchModalProps {
  match: Match;
  homeTeam?: Team;
  awayTeam?: Team;
  onSave: (matchId: string, date: string, time: TimeSlot, court: number) => void;
  onCancel: () => void;
}

export function EditMatchModalContent({
  match,
  homeTeam,
  awayTeam,
  onSave,
  onCancel,
}: EditMatchModalProps) {
  const [date, setDate] = useState(match.date);
  const [time24h, setTime24h] = useState<string>(() => parseTimeTo24h(match.time));
  const [court, setCourt] = useState<number>(match.court);

  const displayTime12h = format24hTo12h(time24h);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(match.id, date, format24hTo12h(time24h), court);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center font-bold text-emerald-950 text-sm">
        {homeTeam?.name || 'Local'} <span className="text-emerald-600 mx-1">vs</span>{' '}
        {awayTeam?.name || 'Visitante'}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="edit-match-date" className="block text-xs font-semibold text-slate-600 mb-1">
            Fecha Manual
          </label>
          <input
            id="edit-match-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono font-medium"
          />
        </div>
        <div>
          <label htmlFor="edit-match-time" className="block text-xs font-semibold text-slate-600 mb-1">
            Hora Manual ({displayTime12h})
          </label>
          <input
            id="edit-match-time"
            type="time"
            required
            value={time24h}
            onChange={(e) => setTime24h(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono font-medium"
          />
          <div className="flex items-center gap-1.5 mt-1.5">
            <button
              type="button"
              onClick={() => setTime24h('19:00')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border transition-colors ${
                time24h === '19:00'
                  ? 'bg-[#0B213A] text-white border-[#0B213A]'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              07:00 PM
            </button>
            <button
              type="button"
              onClick={() => setTime24h('21:00')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border transition-colors ${
                time24h === '21:00'
                  ? 'bg-[#0B213A] text-white border-[#0B213A]'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              09:00 PM
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="edit-match-court" className="block text-xs font-semibold text-slate-600 mb-1">
            Cancha
          </label>
          <select
            id="edit-match-court"
            value={court}
            onChange={(e) => setCourt(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium"
          >
            {[1, 2, 3, 4].map((c) => (
              <option key={c} value={c}>
                Cancha {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
        >
          Guardar Cambios
        </button>
      </div>
    </form>
  );
}

/* 2B. Modal Editar Fecha y Hora Manual de Toda una Jornada */
interface EditRoundScheduleModalProps {
  roundNum: number;
  currentDate: string;
  sampleTime: string;
  matchCount: number;
  onSave: (roundNum: number, date: string, time24h: string | null) => void;
  onCancel: () => void;
}

export function EditRoundScheduleModalContent({
  roundNum,
  currentDate,
  sampleTime,
  matchCount,
  onSave,
  onCancel,
}: EditRoundScheduleModalProps) {
  const [date, setDate] = useState(currentDate);
  const [applyTime, setApplyTime] = useState(false);
  const [time24h, setTime24h] = useState(() => parseTimeTo24h(sampleTime));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    onSave(roundNum, date, applyTime ? time24h : null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-[#E6F2FA] border border-[#1565A0]/20">
        <CalendarClock className="w-5 h-5 text-[#1565A0] shrink-0" />
        <p className="text-xs text-[#0B213A]">
          Actualiza manualmente la fecha y, si lo deseas, unifica la hora de los{' '}
          <strong>{matchCount} partidos</strong> de la <strong>Jornada {roundNum}</strong>.
        </p>
      </div>

      <div>
        <label htmlFor="edit-round-date" className="block text-xs font-semibold text-slate-700 mb-1">
          Fecha Manual de la Jornada
        </label>
        <input
          id="edit-round-date"
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-mono font-medium"
        />
      </div>

      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
        <label className="flex items-center gap-2 text-xs font-semibold text-[#0B213A] cursor-pointer">
          <input
            type="checkbox"
            checked={applyTime}
            onChange={(e) => setApplyTime(e.target.checked)}
            className="rounded text-[#1565A0]"
          />
          <span>Cambiar también la hora de todos los partidos de esta jornada</span>
        </label>

        {applyTime && (
          <div className="space-y-2 pt-1">
            <label htmlFor="edit-round-time" className="block text-xs font-semibold text-slate-600">
              Nueva Hora Manual ({format24hTo12h(time24h)})
            </label>
            <input
              id="edit-round-time"
              type="time"
              required={applyTime}
              value={time24h}
              onChange={(e) => setTime24h(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-mono font-medium"
            />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setTime24h('19:00')}
                className={`px-2.5 py-1 rounded text-xs font-mono font-semibold border transition-colors ${
                  time24h === '19:00'
                    ? 'bg-[#0B213A] text-white border-[#0B213A]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                07:00 PM
              </button>
              <button
                type="button"
                onClick={() => setTime24h('21:00')}
                className={`px-2.5 py-1 rounded text-xs font-mono font-semibold border transition-colors ${
                  time24h === '21:00'
                    ? 'bg-[#0B213A] text-white border-[#0B213A]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                09:00 PM
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#1565A0] text-white hover:bg-[#115282] transition-colors"
        >
          Aplicar a Jornada {roundNum}
        </button>
      </div>
    </form>
  );
}

/* 3. Modal Balance de Canchas */
interface CourtBalanceModalProps {
  teams: Team[];
  matches: Match[];
  onClose: () => void;
}

export function CourtBalanceModalContent({ teams, matches, onClose }: CourtBalanceModalProps) {
  const matrix = teams.map((t) => {
    const counts: Record<number, number> & {
      t7: number;
      t9: number;
      other: number;
      total: number;
    } = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      t7: 0,
      t9: 0,
      other: 0,
      total: 0,
    };
    matches.forEach((m) => {
      if (m.homeId === t.id || m.awayId === t.id) {
        counts[m.court] = (counts[m.court] || 0) + 1;
        if (m.time === '07:00 PM') counts.t7++;
        else if (m.time === '09:00 PM') counts.t9++;
        else counts.other++;
        counts.total++;
      }
    });
    return { team: t, counts };
  });

  const hasCustomTimes = matrix.some((row) => row.counts.other > 0);

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-600">
        Verificación de igualdad de partidos por cada una de las{' '}
        <strong>4 Canchas del Complejo APC Turmero</strong> y horarios programados.
      </p>
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="p-2.5 font-semibold">Equipo</th>
              <th className="p-2.5 text-center font-semibold">Cancha 1</th>
              <th className="p-2.5 text-center font-semibold">Cancha 2</th>
              <th className="p-2.5 text-center font-semibold">Cancha 3</th>
              <th className="p-2.5 text-center font-semibold">Cancha 4</th>
              <th className="p-2.5 text-center bg-slate-800 font-semibold">07:00 PM</th>
              <th className="p-2.5 text-center bg-slate-800 font-semibold">09:00 PM</th>
              {hasCustomTimes && (
                <th className="p-2.5 text-center bg-slate-800 font-semibold">Manual</th>
              )}
              <th className="p-2.5 text-center bg-emerald-950 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
            {matrix.map(({ team, counts }) => (
              <tr key={team.id}>
                <td className="p-2.5 font-sans font-bold text-slate-900">{team.name}</td>
                <td className="p-2.5 text-center">{counts[1]}</td>
                <td className="p-2.5 text-center">{counts[2]}</td>
                <td className="p-2.5 text-center">{counts[3]}</td>
                <td className="p-2.5 text-center">{counts[4]}</td>
                <td className="p-2.5 text-center text-amber-700 font-bold bg-amber-50/40">
                  {counts.t7}
                </td>
                <td className="p-2.5 text-center text-indigo-700 font-bold bg-indigo-50/40">
                  {counts.t9}
                </td>
                {hasCustomTimes && (
                  <td className="p-2.5 text-center text-sky-700 font-bold bg-sky-50/40">
                    {counts.other}
                  </td>
                )}
                <td className="p-2.5 text-center font-bold bg-emerald-50 text-emerald-900">
                  {counts.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

/* 4. Modal Agregar / Editar Equipo */
interface TeamFormModalProps {
  mode: 'add' | 'edit';
  initialTeam?: Team;
  nextNumber: number;
  onSaveAdd: (name: string, delegate: string, color: string, regenerate: boolean) => void;
  onSaveEdit: (teamId: string, name: string, delegate: string, color: string) => void;
  onCancel: () => void;
}

export function TeamFormModalContent({
  mode,
  initialTeam,
  nextNumber,
  onSaveAdd,
  onSaveEdit,
  onCancel,
}: TeamFormModalProps) {
  const palette = [
    '#16a34a',
    '#2563eb',
    '#d97706',
    '#dc2626',
    '#7c3aed',
    '#0d9488',
    '#db2777',
    '#4f46e5',
    '#ea580c',
  ];
  const defaultColor = palette[(nextNumber - 1) % palette.length];

  const [name, setName] = useState(
    mode === 'edit' && initialTeam ? initialTeam.name : `Equipo ${nextNumber}`
  );
  const [delegate, setDelegate] = useState(
    mode === 'edit' && initialTeam ? initialTeam.delegate : ''
  );
  const [color, setColor] = useState(
    mode === 'edit' && initialTeam ? initialTeam.color : defaultColor
  );
  const [regenerate, setRegenerate] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (mode === 'add') {
      onSaveAdd(name.trim(), delegate.trim(), color, regenerate);
    } else if (initialTeam) {
      onSaveEdit(initialTeam.id, name.trim(), delegate.trim(), color);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="team-name-input" className="block text-xs font-semibold text-slate-700 mb-1">
          Nombre del Equipo
        </label>
        <input
          id="team-name-input"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-bold"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label
            htmlFor="team-delegate-input"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Delegado / Capitán
          </label>
          <input
            id="team-delegate-input"
            type="text"
            placeholder="Nombre del delegado"
            value={delegate}
            onChange={(e) => setDelegate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor="team-color-input" className="block text-xs font-semibold text-slate-700 mb-1">
            Color Distintivo
          </label>
          <input
            id="team-color-input"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full h-10 rounded-lg border border-slate-300 p-1 cursor-pointer"
          />
        </div>
      </div>

      {mode === 'add' && (
        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-amber-50 p-3 rounded-lg border border-amber-200 cursor-pointer">
          <input
            type="checkbox"
            checked={regenerate}
            onChange={(e) => setRegenerate(e.target.checked)}
            className="rounded text-emerald-600"
          />
          <span>Regenerar automáticamente el calendario equilibrado con este equipo</span>
        </label>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
        >
          {mode === 'add' ? 'Agregar Equipo' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  );
}

/* 5. Modal Agregar / Editar Jugador */
interface PlayerFormModalProps {
  mode: 'add' | 'edit';
  initialPlayer?: Player;
  teamId: string;
  onSaveAdd: (teamId: string, name: string, number: string, cedula: string, role: PlayerRole) => void;
  onSaveEdit: (
    playerId: string,
    name: string,
    number: string,
    cedula: string,
    role: PlayerRole
  ) => void;
  onCancel: () => void;
}

export function PlayerFormModalContent({
  mode,
  initialPlayer,
  teamId,
  onSaveAdd,
  onSaveEdit,
  onCancel,
}: PlayerFormModalProps) {
  const [name, setName] = useState(
    mode === 'edit' && initialPlayer ? initialPlayer.name : ''
  );
  const [number, setNumber] = useState(
    mode === 'edit' && initialPlayer ? initialPlayer.number : ''
  );
  const [cedula, setCedula] = useState(
    mode === 'edit' && initialPlayer ? initialPlayer.cedula : ''
  );
  const [role, setRole] = useState<PlayerRole>(
    mode === 'edit' && initialPlayer ? initialPlayer.role : 'Mixto'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (mode === 'add') {
      onSaveAdd(teamId, name.trim(), number.trim(), cedula.trim(), role);
    } else if (initialPlayer) {
      onSaveEdit(initialPlayer.id, name.trim(), number.trim(), cedula.trim(), role);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="pl-name" className="block text-xs font-semibold text-slate-700 mb-1">
          Nombre Completo del Jugador
        </label>
        <input
          id="pl-name"
          type="text"
          required
          placeholder="Ej. Roberto Zambrano"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-medium"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor="pl-number" className="block text-xs font-semibold text-slate-700 mb-1">
            N° Camisa
          </label>
          <input
            id="pl-number"
            type="text"
            placeholder="10"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
          />
        </div>
        <div>
          <label htmlFor="pl-cedula" className="block text-xs font-semibold text-slate-700 mb-1">
            Cédula / Ficha
          </label>
          <input
            id="pl-cedula"
            type="text"
            placeholder="V-18234567"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
          />
        </div>
        <div>
          <label htmlFor="pl-role" className="block text-xs font-semibold text-slate-700 mb-1">
            Especialidad
          </label>
          <select
            id="pl-role"
            value={role}
            onChange={(e) => setRole(e.target.value as PlayerRole)}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm font-medium"
          >
            <option value="Arrimador">Arrimador</option>
            <option value="Bochador">Bochador</option>
            <option value="Mixto">Mixto</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
        >
          {mode === 'add' ? 'Registrar Jugador' : 'Actualizar'}
        </button>
      </div>
    </form>
  );
}

/* 6. Modal Actuación Individual */
interface SinglePlayerStatModalProps {
  player: Player;
  team?: Team;
  rounds: number[];
  onSave: (
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
  ) => void;
  onCancel: () => void;
  onToast: (msg: string, type: ToastType) => void;
}

export function SinglePlayerStatModalContent({
  player,
  team,
  rounds,
  onSave,
  onCancel,
  onToast,
}: SinglePlayerStatModalProps) {
  const [round, setRound] = useState<number>(rounds[0] || 1);
  const [arrAtt, setArrAtt] = useState(0);
  const [arrGood, setArrGood] = useState(0);
  const [rasAtt, setRasAtt] = useState(0);
  const [rasGood, setRasGood] = useState(0);
  const [aerAtt, setAerAtt] = useState(0);
  const [aerGood, setAerGood] = useState(0);

  const calcAvg = (g: number, a: number) => (a > 0 ? (g / a).toFixed(3) : '0.000');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (arrGood > arrAtt || rasGood > rasAtt || aerGood > aerAtt) {
      onToast('Las jugadas efectivas no pueden superar los intentos realizados.', 'error');
      return;
    }
    onSave(player.id, player.teamId, round, {
      arrimeAtt: arrAtt,
      arrimeGood: arrGood,
      rastreroAtt: rasAtt,
      rastreroGood: rasGood,
      aereoAtt: aerAtt,
      aereoGood: aerGood,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between">
        <span>
          Equipo: <strong>{team?.name || 'Sin equipo'}</strong>
        </span>
        <span>
          Rol: <strong>{player.role}</strong>
        </span>
      </div>

      <div>
        <label htmlFor="sp-round" className="block text-xs font-semibold text-slate-700 mb-1">
          Jornada / Referencia
        </label>
        <select
          id="sp-round"
          value={round}
          onChange={(e) => setRound(Number(e.target.value))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium"
        >
          {(rounds.length > 0 ? rounds : [1]).map((r) => (
            <option key={r} value={r}>
              Jornada {r}
            </option>
          ))}
        </select>
      </div>

      {/* Arrimes */}
      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-emerald-900">1. Arrimes</p>
          <span className="text-xs font-mono tabular-nums font-bold text-emerald-700">
            AVG: {calcAvg(arrGood, arrAtt)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="sp-arr-att" className="block text-xs text-slate-600 mb-1">
              Intentos (A.I)
            </label>
            <input
              id="sp-arr-att"
              type="number"
              min={0}
              required
              value={arrAtt}
              onChange={(e) => setArrAtt(Number(e.target.value || 0))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-mono tabular-nums font-bold"
            />
          </div>
          <div>
            <label htmlFor="sp-arr-good" className="block text-xs text-slate-600 mb-1">
              Buenos / Efectivos (A.B)
            </label>
            <input
              id="sp-arr-good"
              type="number"
              min={0}
              required
              value={arrGood}
              onChange={(e) => setArrGood(Number(e.target.value || 0))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-mono tabular-nums font-bold"
            />
          </div>
        </div>
      </div>

      {/* Boches Rastreros */}
      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-amber-900">2. Boches Rastreros</p>
          <span className="text-xs font-mono tabular-nums font-bold text-amber-700">
            AVG: {calcAvg(rasGood, rasAtt)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="sp-ras-att" className="block text-xs text-slate-600 mb-1">
              Intentos (B.R.I)
            </label>
            <input
              id="sp-ras-att"
              type="number"
              min={0}
              required
              value={rasAtt}
              onChange={(e) => setRasAtt(Number(e.target.value || 0))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-mono tabular-nums font-bold"
            />
          </div>
          <div>
            <label htmlFor="sp-ras-good" className="block text-xs text-slate-600 mb-1">
              Efectivos (B.R.E)
            </label>
            <input
              id="sp-ras-good"
              type="number"
              min={0}
              required
              value={rasGood}
              onChange={(e) => setRasGood(Number(e.target.value || 0))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-mono tabular-nums font-bold"
            />
          </div>
        </div>
      </div>

      {/* Boches Aéreos */}
      <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-sky-900">3. Boches Aéreos (De aire / Mingo)</p>
          <span className="text-xs font-mono tabular-nums font-bold text-sky-700">
            AVG: {calcAvg(aerGood, aerAtt)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="sp-aer-att" className="block text-xs text-slate-600 mb-1">
              Intentos (B.A.I)
            </label>
            <input
              id="sp-aer-att"
              type="number"
              min={0}
              required
              value={aerAtt}
              onChange={(e) => setAerAtt(Number(e.target.value || 0))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-mono tabular-nums font-bold"
            />
          </div>
          <div>
            <label htmlFor="sp-aer-good" className="block text-xs text-slate-600 mb-1">
              Efectivos (B.A.E)
            </label>
            <input
              id="sp-aer-good"
              type="number"
              min={0}
              required
              value={aerGood}
              onChange={(e) => setAerGood(Number(e.target.value || 0))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-mono tabular-nums font-bold"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
        >
          Sumar Estadística
        </button>
      </div>
    </form>
  );
}

/* 7. Modal Carga Masiva por Equipo / Jornada */
interface BatchRowInput {
  arrimeAtt: number;
  arrimeGood: number;
  rastreroAtt: number;
  rastreroGood: number;
  aereoAtt: number;
  aereoGood: number;
}

interface BatchStatsModalProps {
  teams: Team[];
  players: Player[];
  rounds: number[];
  onSaveBatch: (
    teamId: string,
    round: number,
    entries: Array<{ playerId: string } & BatchRowInput>
  ) => void;
  onCancel: () => void;
  onToast: (msg: string, type: ToastType) => void;
}

export function BatchStatsModalContent({
  teams,
  players,
  rounds,
  onSaveBatch,
  onCancel,
  onToast,
}: BatchStatsModalProps) {
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id || '');
  const [selectedRound, setSelectedRound] = useState<number>(rounds[0] || 1);
  const [inputs, setInputs] = useState<Record<string, BatchRowInput>>({});

  const roster = players.filter((p) => p.teamId === selectedTeamId);

  useEffect(() => {
    const initial: Record<string, BatchRowInput> = {};
    roster.forEach((p) => {
      initial[p.id] = {
        arrimeAtt: 0,
        arrimeGood: 0,
        rastreroAtt: 0,
        rastreroGood: 0,
        aereoAtt: 0,
        aereoGood: 0,
      };
    });
    setInputs(initial);
  }, [selectedTeamId]);

  const updateCell = (playerId: string, field: keyof BatchRowInput, val: number) => {
    setInputs((prev) => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || {
          arrimeAtt: 0,
          arrimeGood: 0,
          rastreroAtt: 0,
          rastreroGood: 0,
          aereoAtt: 0,
          aereoGood: 0,
        }),
        [field]: Math.max(0, val),
      },
    }));
  };

  const handleSave = () => {
    const validEntries: Array<{ playerId: string } & BatchRowInput> = [];
    for (const p of roster) {
      const row = inputs[p.id];
      if (!row) continue;
      if (
        row.arrimeGood > row.arrimeAtt ||
        row.rastreroGood > row.rastreroAtt ||
        row.aereoGood > row.aereoAtt
      ) {
        onToast(`Error en ${p.name}: jugadas efectivas mayores a los intentos.`, 'error');
        return;
      }
      if (row.arrimeAtt > 0 || row.rastreroAtt > 0 || row.aereoAtt > 0) {
        validEntries.push({ playerId: p.id, ...row });
      }
    }
    onSaveBatch(selectedTeamId, selectedRound, validEntries);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="batch-team-select"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Seleccionar Equipo
          </label>
          <select
            id="batch-team-select"
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="batch-round-select"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Jornada
          </label>
          <select
            id="batch-round-select"
            value={selectedRound}
            onChange={(e) => setSelectedRound(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold"
          >
            {(rounds.length > 0 ? rounds : [1]).map((r) => (
              <option key={r} value={r}>
                Jornada {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        {roster.length === 0 ? (
          <p className="p-6 text-xs text-slate-500 text-center">
            Este equipo no tiene jugadores registrados.
          </p>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-2.5 font-semibold">Jugador</th>
                <th className="p-2 text-center bg-emerald-950 font-semibold">Arr. Int</th>
                <th className="p-2 text-center bg-emerald-900 font-semibold">Arr. Bue</th>
                <th className="p-2 text-center bg-amber-950 font-semibold">Ras. Int</th>
                <th className="p-2 text-center bg-amber-900 font-semibold">Ras. Efe</th>
                <th className="p-2 text-center bg-sky-950 font-semibold">Aér. Int</th>
                <th className="p-2 text-center bg-sky-900 font-semibold">Aér. Efe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
              {roster.map((p) => {
                const row = inputs[p.id] || {
                  arrimeAtt: 0,
                  arrimeGood: 0,
                  rastreroAtt: 0,
                  rastreroGood: 0,
                  aereoAtt: 0,
                  aereoGood: 0,
                };
                return (
                  <tr key={p.id}>
                    <td className="p-2.5 font-sans font-bold text-slate-900 whitespace-nowrap">
                      {p.name}
                    </td>
                    <td className="p-1.5 text-center">
                      <input
                        type="number"
                        min={0}
                        aria-label={`${p.name} Arrimes Intentos`}
                        value={row.arrimeAtt}
                        onChange={(e) => updateCell(p.id, 'arrimeAtt', Number(e.target.value))}
                        className="w-14 text-center border border-slate-300 rounded-lg py-1 font-bold"
                      />
                    </td>
                    <td className="p-1.5 text-center">
                      <input
                        type="number"
                        min={0}
                        aria-label={`${p.name} Arrimes Buenos`}
                        value={row.arrimeGood}
                        onChange={(e) => updateCell(p.id, 'arrimeGood', Number(e.target.value))}
                        className="w-14 text-center border border-emerald-300 bg-emerald-50 rounded-lg py-1 font-bold"
                      />
                    </td>
                    <td className="p-1.5 text-center">
                      <input
                        type="number"
                        min={0}
                        aria-label={`${p.name} Rastreros Intentos`}
                        value={row.rastreroAtt}
                        onChange={(e) => updateCell(p.id, 'rastreroAtt', Number(e.target.value))}
                        className="w-14 text-center border border-slate-300 rounded-lg py-1 font-bold"
                      />
                    </td>
                    <td className="p-1.5 text-center">
                      <input
                        type="number"
                        min={0}
                        aria-label={`${p.name} Rastreros Efectivos`}
                        value={row.rastreroGood}
                        onChange={(e) => updateCell(p.id, 'rastreroGood', Number(e.target.value))}
                        className="w-14 text-center border border-amber-300 bg-amber-50 rounded-lg py-1 font-bold"
                      />
                    </td>
                    <td className="p-1.5 text-center">
                      <input
                        type="number"
                        min={0}
                        aria-label={`${p.name} Aéreos Intentos`}
                        value={row.aereoAtt}
                        onChange={(e) => updateCell(p.id, 'aereoAtt', Number(e.target.value))}
                        className="w-14 text-center border border-slate-300 rounded-lg py-1 font-bold"
                      />
                    </td>
                    <td className="p-1.5 text-center">
                      <input
                        type="number"
                        min={0}
                        aria-label={`${p.name} Aéreos Efectivos`}
                        value={row.aereoGood}
                        onChange={(e) => updateCell(p.id, 'aereoGood', Number(e.target.value))}
                        className="w-14 text-center border border-sky-300 bg-sky-50 rounded-lg py-1 font-bold"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
        >
          Guardar Planilla de Actuación
        </button>
      </div>
    </div>
  );
}

/* 8. Modal Configuración del Torneo */
interface SettingsModalProps {
  config: TournamentConfig;
  onSave: (nextConfig: TournamentConfig, regenerateNow: boolean) => void;
  onResetFactory: () => void;
  onCancel: () => void;
}

export function SettingsModalContent({
  config,
  onSave,
  onResetFactory,
  onCancel,
}: SettingsModalProps) {
  const [tournamentName, setTournamentName] = useState(config.tournamentName);
  const [roundsCount, setRoundsCount] = useState(config.roundsCount);
  const [startDate, setStartDate] = useState(config.startDate);
  const [targetPoints, setTargetPoints] = useState(config.targetPoints);
  const [playDays, setPlayDays] = useState<number[]>(config.playDays);
  const [adminPin, setAdminPin] = useState(config.adminPin || '');
  const [regenerateNow, setRegenerateNow] = useState(false);

  const days = [
    { d: 1, label: 'Lun' },
    { d: 2, label: 'Mar' },
    { d: 3, label: 'Mié' },
    { d: 4, label: 'Jue' },
    { d: 5, label: 'Vie' },
    { d: 6, label: 'Sáb' },
    { d: 0, label: 'Dom' },
  ];

  const toggleDay = (d: number) => {
    setPlayDays((prev) =>
      prev.includes(d) ? prev.filter((item) => item !== d) : [...prev, d]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      {
        ...config,
        tournamentName: tournamentName.trim() || config.tournamentName,
        roundsCount,
        startDate,
        targetPoints,
        playDays: playDays.length > 0 ? playDays : [1, 2, 3, 4, 5],
        adminPin: adminPin.trim() || '2026',
      },
      regenerateNow
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="cfg-name" className="block text-xs font-semibold text-slate-700 mb-1">
          Nombre del Torneo / Sede
        </label>
        <input
          id="cfg-name"
          type="text"
          required
          value={tournamentName}
          onChange={(e) => setTournamentName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-bold"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="cfg-rounds" className="block text-xs font-semibold text-slate-700 mb-1">
            Vueltas Round Robin
          </label>
          <select
            id="cfg-rounds"
            value={roundsCount}
            onChange={(e) => setRoundsCount(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium"
          >
            <option value={1}>1 Vuelta</option>
            <option value={2}>2 Vueltas (Ida y Vuelta)</option>
          </select>
        </div>

        <div>
          <label htmlFor="cfg-start" className="block text-xs font-semibold text-slate-700 mb-1">
            Fecha de Inicio
          </label>
          <input
            id="cfg-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium"
          />
        </div>

        <div>
          <label htmlFor="cfg-points" className="block text-xs font-semibold text-slate-700 mb-1">
            Tantos por Juego
          </label>
          <input
            id="cfg-points"
            type="number"
            min={10}
            max={40}
            value={targetPoints}
            onChange={(e) => setTargetPoints(Number(e.target.value || 20))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums font-bold"
          />
        </div>
      </div>

      <div>
        <span className="block text-xs font-semibold text-slate-700 mb-1.5">
          Días Hábiles de Juego (Turnos 07:00 PM y 09:00 PM)
        </span>
        <div className="flex flex-wrap gap-2">
          {days.map((item) => (
            <label
              key={item.d}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-xs font-semibold cursor-pointer"
            >
              <input
                type="checkbox"
                checked={playDays.includes(item.d)}
                onChange={() => toggleDay(item.d)}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="cfg-pin" className="block text-xs font-semibold text-slate-700 mb-1">
          Clave / PIN Administrador SUTAPC
        </label>
        <input
          id="cfg-pin"
          type="text"
          maxLength={16}
          required
          value={adminPin}
          onChange={(e) => setAdminPin(e.target.value)}
          placeholder="Clave de acceso administrador"
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-mono"
        />
      </div>

      <label className="flex items-center gap-2 text-xs font-medium text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200 cursor-pointer">
        <input
          type="checkbox"
          checked={regenerateNow}
          onChange={(e) => setRegenerateNow(e.target.checked)}
        />
        <span>Regenerar calendario ahora aplicando estas fechas y vueltas</span>
      </label>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onResetFactory}
          className="text-xs font-semibold text-rose-600 hover:underline"
        >
          Restaurar Datos Iniciales
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#1565A0] text-white hover:bg-[#115282]"
          >
            Guardar Configuración
          </button>
        </div>
      </div>
    </form>
  );
}

/* 9. Modal PIN Administrador (Módulo Oculto SUTAPC) */
interface AdminPinModalProps {
  expectedPin: string;
  onUnlock: () => void;
  onCancel: () => void;
  onToast: (msg: string, type: ToastType) => void;
}

export function AdminPinModalContent({
  expectedPin,
  onUnlock,
  onCancel,
  onToast,
}: AdminPinModalProps) {
  const [pin, setPin] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === expectedPin) {
      onUnlock();
    } else {
      onToast('Clave de administrador incorrecta.', 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f3f6fa] border border-slate-200">
        <img
          src="/assets/aistudio/IMG_5484_43f69097.jpeg"
          alt="SUTAPC Planta Turmero"
          className="w-12 h-12 rounded-lg object-cover bg-white border border-slate-200 shrink-0"
        />
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#0B213A]">
            Módulo Administrador · SUTAPC Planta Turmero
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            Solo el administrador autorizado puede cargar resultados, equipos y estadísticas.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="admin-pin-input" className="block text-xs font-semibold text-slate-700 mb-1">
          Clave de Acceso
        </label>
        <input
          id="admin-pin-input"
          type="password"
          required
          autoFocus
          placeholder="Ingresa la clave"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="w-full text-center text-lg font-mono font-bold tracking-widest rounded-lg border border-slate-300 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1565A0]"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B213A] text-white hover:bg-[#1565A0] transition-colors"
        >
          Desbloquear Administrador
        </button>
      </div>
    </form>
  );
}

/* 9B. Modal Cambiar Clave de Administrador */
interface ChangeAdminPinModalProps {
  expectedPin: string;
  onSaveNewPin: (newPin: string) => void;
  onCancel: () => void;
  onToast: (msg: string, type: ToastType) => void;
}

export function ChangeAdminPinModalContent({
  expectedPin,
  onSaveNewPin,
  onCancel,
  onToast,
}: ChangeAdminPinModalProps) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPin !== expectedPin) {
      onToast('La clave actual no coincide.', 'error');
      return;
    }
    const cleanNew = newPin.trim();
    if (cleanNew.length < 4) {
      onToast('La nueva clave debe tener al menos 4 caracteres.', 'error');
      return;
    }
    if (cleanNew !== confirmPin.trim()) {
      onToast('La confirmación no coincide con la nueva clave.', 'error');
      return;
    }
    onSaveNewPin(cleanNew);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f3f6fa] border border-slate-200">
        <div className="w-10 h-10 rounded-lg bg-[#0B213A] text-[#F59E0B] flex items-center justify-center shrink-0">
          <KeyRound className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#0B213A]">
            Seguridad del Módulo Administrador
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            Actualiza la clave de acceso para el módulo oculto SUTAPC.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="pin-current" className="block text-xs font-semibold text-slate-700 mb-1">
          Clave Actual
        </label>
        <div className="relative">
          <input
            id="pin-current"
            type={showCurrent ? 'text' : 'password'}
            required
            autoFocus
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value)}
            placeholder="Ingresa la clave actual"
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 pr-10 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#1565A0]"
          />
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            aria-label={showCurrent ? 'Ocultar clave actual' : 'Mostrar clave actual'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
          >
            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="pin-new" className="block text-xs font-semibold text-slate-700 mb-1">
            Nueva Clave (mín. 4 caracteres)
          </label>
          <div className="relative">
            <input
              id="pin-new"
              type={showNew ? 'text' : 'password'}
              required
              minLength={4}
              maxLength={16}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="Nueva clave"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 pr-10 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#1565A0]"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              aria-label={showNew ? 'Ocultar nueva clave' : 'Mostrar nueva clave'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="pin-confirm" className="block text-xs font-semibold text-slate-700 mb-1">
            Confirmar Nueva Clave
          </label>
          <input
            id="pin-confirm"
            type={showNew ? 'text' : 'password'}
            required
            minLength={4}
            maxLength={16}
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            placeholder="Repetir clave"
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#1565A0]"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#1565A0] text-white hover:bg-[#115282] transition-colors"
        >
          Guardar Nueva Clave
        </button>
      </div>
    </form>
  );
}

/* 10. Modal Exportar Excel CSV / Respaldo JSON */
interface ExportImportModalProps {
  onExportCalendar: () => void;
  onExportStandings: () => void;
  onExportStats: () => void;
  onDownloadBackup: () => void;
  onRestoreBackup: (imported: TournamentState) => void;
  onToast: (msg: string, type: ToastType) => void;
}

export function ExportImportModalContent({
  onExportCalendar,
  onExportStandings,
  onExportStats,
  onDownloadBackup,
  onRestoreBackup,
  onToast,
}: ExportImportModalProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(String(evt.target?.result || ''));
        if (!parsed.teams || !parsed.matches) {
          throw new Error('Formato inválido');
        }
        onRestoreBackup(parsed as TournamentState);
      } catch {
        onToast('El archivo JSON no tiene un formato válido.', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={onExportCalendar}
          className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold flex flex-col items-center gap-1.5 transition-colors"
        >
          <Calendar className="w-5 h-5 text-emerald-700" />
          <span>Calendario (Excel)</span>
        </button>

        <button
          type="button"
          onClick={onExportStandings}
          className="p-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex flex-col items-center gap-1.5 transition-colors"
        >
          <Trophy className="w-5 h-5 text-amber-700" />
          <span>Clasificación (Excel)</span>
        </button>

        <button
          type="button"
          onClick={onExportStats}
          className="p-3 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-900 text-xs font-semibold flex flex-col items-center gap-1.5 transition-colors"
        >
          <BarChart2 className="w-5 h-5 text-sky-700" />
          <span>Estadísticas (Excel)</span>
        </button>
      </div>

      <div className="border-t border-slate-200 pt-4 space-y-3">
        <p className="text-xs font-bold text-slate-800">
          Respaldo Completo de Seguridad (.JSON)
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onDownloadBackup}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Respaldo JSON</span>
          </button>

          <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span>Restaurar desde JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
