import { Gamepad2, Pause, Play, Square } from 'lucide-react';
import { StatusBadge } from './StatusBadge.jsx';

function formatDuration(seconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const rest = safeSeconds % 60;
  return [hours, minutes, rest].map((part) => String(part).padStart(2, '0')).join(':');
}

function liveSession(session, now) {
  if (!session) return null;
  const base = Number(session.segundos_acumulados) || 0;
  const elapsed = session.estado === 'ACTIVA'
    ? Math.max(0, Math.floor((now - new Date(session.timestamp_inicio).getTime()) / 1000))
    : 0;
  const elapsedTotal = base + elapsed;
  const remaining = session.tipo_renta === 'FIJO'
    ? Math.max(0, Number(session.duracion_segundos) - elapsedTotal)
    : null;
  return {
    elapsed: elapsedTotal,
    remaining,
    amount: (elapsedTotal * Number(session.precio_por_hora) / 3600).toFixed(2)
  };
}

export function ConsoleCard({ consoleRecord, now, onStart, onPause, onResume, onFinish, busy }) {
  const session = liveSession(consoleRecord.session, now);
  const isOccupied = consoleRecord.status === 'occupied' && session;
  const isExpired = session?.remaining === 0 && session?.remaining !== null;

  return (
    <article className={`flex min-h-[290px] flex-col rounded-3xl border bg-brand-light p-5 shadow-panel transition ${
      isExpired ? 'animate-pulse border-red-500 ring-4 ring-brand-gold/50' : 'border-brand-muted'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-brand-dark p-3 text-brand-gold">
            <Gamepad2 size={24} />
          </div>
          <div>
            <h3 className="font-display text-xl text-brand-dark">{consoleRecord.name}</h3>
            <p className="font-exo text-sm text-brand-dark/60">Game Center · ${consoleRecord.hourly_rate}/hr</p>
          </div>
        </div>
        <StatusBadge status={consoleRecord.status} />
      </div>

      {isOccupied ? (
        <div className="mt-6 flex flex-1 flex-col">
          <div className="rounded-2xl bg-brand-dark p-4 text-brand-light">
            <p className="font-accent text-[10px] uppercase tracking-wider text-brand-muted">
              {session.remaining === null ? 'Tiempo transcurrido' : 'Tiempo restante'}
            </p>
            <p className={`mt-1 font-mono text-4xl font-bold ${isExpired ? 'text-red-300' : 'text-brand-gold'}`}>
              {formatDuration(session.remaining === null ? session.elapsed : session.remaining)}
            </p>
            <p className="mt-2 font-exo text-sm text-brand-muted">Acumulado: <strong className="text-brand-light">${session.amount}</strong></p>
          </div>
          <div className="mt-auto grid grid-cols-3 gap-2 pt-4">
            {session && consoleRecord.session.estado === 'ACTIVA' ? (
              <button className="control-button" disabled={busy} onClick={() => onPause(consoleRecord.session.id)}>
                <Pause size={16} /> Pausar
              </button>
            ) : (
              <button className="control-button" disabled={busy} onClick={() => onResume(consoleRecord.session.id)}>
                <Play size={16} /> Reanudar
              </button>
            )}
            <button className="control-button col-span-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100" disabled={busy} onClick={() => onFinish(consoleRecord.session)}>
              <Square size={16} /> Terminar renta
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="font-exo text-sm text-brand-dark/60">Disponible para una nueva sesión</p>
          <button className="mt-5 w-full rounded-2xl bg-brand-gold px-4 py-3 font-exo font-bold text-brand-dark transition hover:brightness-95" onClick={() => onStart(consoleRecord)}>
            Iniciar renta
          </button>
        </div>
      )}
    </article>
  );
}
