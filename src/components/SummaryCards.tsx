import { Shield, CalendarCheck, Clock, Crown } from 'lucide-react';
import { StandingRow } from '../types/tournament';

interface SummaryCardsProps {
  categoryLabel?: string;
  totalTeams: number;
  totalPlayers: number;
  completedMatches: number;
  totalMatches: number;
  leader: StandingRow | null;
}

export function SummaryCards({
  categoryLabel,
  totalTeams,
  totalPlayers,
  completedMatches,
  totalMatches,
  leader,
}: SummaryCardsProps) {
  return (
    <section
      aria-label="Resumen del torneo"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
    >
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-[#0B213A] text-[#F59E0B] flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 truncate">
            {categoryLabel || 'Equipos y Nómina'}
          </p>
          <p className="text-lg sm:text-xl font-bold text-[#0B213A] font-mono tabular-nums">
            {totalTeams}{' '}
            <span className="text-xs font-sans font-medium text-slate-500">
              eq · {totalPlayers} jug
            </span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 p-4 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-[#E6F2FA] text-[#1565A0] border border-[#1565A0]/20 flex items-center justify-center shrink-0">
          <CalendarCheck className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 truncate">Progreso del Torneo</p>
          <p className="text-lg sm:text-xl font-bold text-[#0B213A] font-mono tabular-nums">
            {completedMatches}{' '}
            <span className="text-xs font-sans font-medium text-slate-500">
              / {totalMatches} juegos
            </span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 p-4 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-amber-50 text-[#B45309] border border-[#D98A1A]/30 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 truncate">Canchas y Turnos</p>
          <p className="text-sm font-bold text-[#0B213A] truncate">4 Canchas APC</p>
          <p className="text-xs text-slate-500 font-mono tabular-nums truncate">
            07:00 PM · 09:00 PM
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 p-4 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#2E8540] border border-[#2E8540]/25 flex items-center justify-center shrink-0">
          <Crown className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 truncate">Líder Actual</p>
          <p className="text-sm sm:text-base font-bold text-[#0B213A] truncate">
            {leader ? leader.name : 'Por definir'}
          </p>
          <p className="text-xs font-semibold text-[#2E8540] font-mono tabular-nums truncate">
            {leader
              ? `${leader.jg}G-${leader.jp}P · Ave ${leader.ave.toFixed(2)}`
              : 'Sin resultados aún'}
          </p>
        </div>
      </div>
    </section>
  );
}
