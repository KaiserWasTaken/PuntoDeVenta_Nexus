import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bug, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { ConsoleCard } from '../../components/ConsoleCard.jsx';
import { FinishRentalModal } from '../../components/FinishRentalModal.jsx';
import { StartRentalModal } from '../../components/StartRentalModal.jsx';
import { useConsolas } from '../../hooks/useConsolas.js';
import { useServerClock } from '../../hooks/useServerClock.js';
import { clearAccessToken, finishSession, pauseSession, resumeSession, startSession } from '../../services/api.js';

function currentAmount(session, now) {
  const base = Number(session.segundos_acumulados) || 0;
  const live = session.estado === 'ACTIVA' ? Math.max(0, Math.floor((now - new Date(session.timestamp_inicio).getTime()) / 1000)) : 0;
  return ((base + live) * Number(session.precio_por_hora) / 3600).toFixed(2);
}

export function ConsolesPage({ onLogout }) {
  const { consoles, loading, error, connected, expiredSessionId, dismissExpired, refresh } = useConsolas();
  const now = useServerClock();
  const [startConsole, setStartConsole] = useState(null);
  const [finishData, setFinishData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [developerExpiredId, setDeveloperExpiredId] = useState(null);
  const stats = useMemo(() => ({
    total: consoles.length,
    occupied: consoles.filter((item) => item.status === 'occupied').length,
    available: consoles.filter((item) => item.status === 'available').length
  }), [consoles]);
  const expiringSession = consoles.flatMap((item) => item.session ? [item.session] : []).find((item) => item.id === expiredSessionId);
  useEffect(() => {
    if (!expiringSession) return undefined;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return undefined;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 660;
    gain.gain.setValueAtTime(0.08, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.2);
    return () => context.close();
  }, [expiringSession]);

  async function perform(action, close = true) {
    setBusy(true);
    setActionError('');
    try {
      await action();
      if (close) {
        setStartConsole(null);
        setFinishData(null);
      }
      await refresh();
    } catch (requestError) {
      setActionError(requestError.response?.data?.error || 'No se pudo completar la operación.');
    } finally {
      setBusy(false);
    }
  }

  return <>
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4"><div><p className="font-accent text-[10px] uppercase tracking-[0.2em] text-brand-blue">Operación en vivo</p><h1 className="font-display text-3xl sm:text-4xl">Centro de rentas</h1><p className="mt-2 text-brand-dark/60">Control de consolas y sesiones en tiempo real</p></div><div className="flex items-center gap-3 rounded-2xl bg-brand-light px-4 py-3 text-sm font-semibold shadow-sm"><button onClick={() => { const target = consoles.find((item) => item.session); setDeveloperExpiredId(target?.id || null); }} title="Modo developer: simular vencimiento"><Bug size={17} className="text-brand-dark/60" /></button>{connected ? <Wifi className="text-brand-blue" size={18} /> : <WifiOff className="text-brand-dark/40" size={18} />}{connected ? 'Sincronizado' : 'Conectando...'}<button onClick={onLogout} className="ml-2 text-xs underline">Salir</button></div></header>
    <section className="mb-8 grid gap-4 sm:grid-cols-3">{[['Consolas', stats.total, 'bg-brand-dark text-brand-light'], ['Disponibles', stats.available, 'bg-brand-blue text-brand-light'], ['Ocupadas', stats.occupied, 'bg-brand-gold text-brand-dark']].map(([label, value, style]) => <div key={label} className={`rounded-3xl p-5 shadow-sm ${style}`}><p className="font-accent text-[10px] uppercase opacity-75">{label}</p><p className="mt-1 font-changa text-3xl">{value}</p></div>)}</section>
    {(error || actionError) && <div className="mb-6 flex items-center gap-3 rounded-2xl border border-brand-gold bg-brand-dark p-4 text-sm font-semibold text-brand-light"><AlertTriangle className="text-brand-gold" size={18} />{error || actionError}<button className="ml-auto underline" onClick={refresh}>Reintentar</button></div>}
    {loading ? <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-brand-blue" /></div> : <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{consoles.map((consoleRecord) => <ConsoleCard key={consoleRecord.id} consoleRecord={consoleRecord} now={now} forceExpired={developerExpiredId === consoleRecord.id} busy={busy} onStart={setStartConsole} onPause={(id) => perform(() => pauseSession(id))} onResume={(id) => perform(() => resumeSession(id))} onFinish={(session) => setFinishData({ session, amount: currentAmount(session, now) })} />)}</section>}
    {startConsole && <StartRentalModal consoleRecord={startConsole} busy={busy} onClose={() => setStartConsole(null)} onSubmit={(payload) => perform(() => startSession(payload))} />}
    {finishData && <FinishRentalModal {...finishData} busy={busy} onClose={() => setFinishData(null)} onConfirm={() => perform(() => finishSession(finishData.session.id))} />}
    {expiringSession && <div className="fixed bottom-5 right-5 z-40 max-w-sm rounded-2xl border-2 border-red-400 bg-red-950 p-4 text-brand-light shadow-xl"><div className="flex gap-3"><AlertTriangle className="shrink-0 text-red-300" /><div><p className="font-changa text-xl text-red-200">TIEMPO AGOTADO</p><p className="text-sm text-red-100/80">{expiringSession.consola_nombre} alcanzó el límite de su renta.</p><button onClick={dismissExpired} className="mt-2 font-accent text-[10px] underline">DESCARTAR</button></div></div></div>}
  </>;
}
