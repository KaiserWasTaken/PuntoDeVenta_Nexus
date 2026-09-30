import { useCallback, useEffect, useMemo, useState } from 'react';
import { BellRing, Check, ChefHat, RefreshCw, UtensilsCrossed } from 'lucide-react';
import { getKdsOrders, updateKdsItem } from '../../services/api.js';
import { socket } from '../../services/socket.js';

function playAlert() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 880;
  oscillator.type = 'square';
  gain.gain.setValueAtTime(0.08, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.18);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.18);
}

function ageLabel(createdAt, now) {
  const minutes = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60000));
  return minutes === 0 ? 'Ahora' : `Hace ${minutes} min`;
}

const nextStatus = {
  PENDING: 'PREPARING',
  PREPARING: 'READY'
};

function statusStyle(status) {
  return {
    PENDING: 'border-brand-gold/60 bg-brand-gold/10 text-brand-gold',
    PREPARING: 'border-brand-blue/60 bg-brand-blue/10 text-blue-200'
  }[status] || 'border-emerald-400/60 bg-emerald-400/10 text-emerald-300';
}

export function KDSPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyItem, setBusyItem] = useState(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    try {
      setError('');
      setOrders(await getKdsOrders());
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No se pudo cargar el KDS.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    const handleNewOrder = () => {
      playAlert();
      load();
    };
    const handleUpdate = () => load();
    socket.on('kds:nueva_orden', handleNewOrder);
    socket.on('kds:actualizado', handleUpdate);
    socket.on('kds:orden_lista', handleUpdate);
    return () => {
      window.clearInterval(timer);
      socket.off('kds:nueva_orden', handleNewOrder);
      socket.off('kds:actualizado', handleUpdate);
      socket.off('kds:orden_lista', handleUpdate);
    };
  }, [load]);

  const pendingItems = useMemo(
    () => orders.reduce((sum, order) => sum + order.items.length, 0),
    [orders]
  );

  async function advance(item) {
    const status = nextStatus[item.kds_status];
    if (!status) return;
    setBusyItem(item.id);
    try {
      await updateKdsItem(item.id, status);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No se pudo actualizar el ítem.');
    } finally {
      setBusyItem(null);
    }
  }

  return <section className="min-h-[calc(100vh-5rem)] rounded-3xl bg-brand-dark p-5 text-brand-light sm:p-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="font-accent text-[10px] uppercase tracking-[0.2em] text-brand-gold">Operación de cocina</p>
        <h1 className="font-display text-4xl text-brand-light sm:text-5xl">Monitor KDS</h1>
        <p className="mt-2 font-exo text-brand-muted">Comandas activas y preparación en tiempo real</p>
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 font-exo font-bold">
        <BellRing className="text-brand-gold" size={20} />
        {pendingItems} {pendingItems === 1 ? 'pendiente' : 'pendientes'}
        <button onClick={load} className="ml-2 rounded-lg p-1 hover:bg-white/10" title="Actualizar"><RefreshCw size={17} /></button>
      </div>
    </header>
    {error && <div className="mt-5 rounded-2xl border border-red-400/60 bg-red-500/10 p-4 font-exo text-red-200">{error}</div>}
    {loading ? <div className="flex justify-center py-24"><RefreshCw className="animate-spin text-brand-gold" size={32} /></div>
      : !orders.length ? <div className="flex flex-col items-center justify-center py-28 text-center"><Check size={56} className="text-emerald-300" /><h2 className="mt-4 font-display text-3xl text-emerald-300">¡Todo listo!</h2><p className="mt-2 font-exo text-brand-muted">No hay comandas pendientes.</p></div>
        : <div className="mt-8 grid gap-5 lg:grid-cols-2">{orders.map((order) => <article key={order.id} className="rounded-3xl border border-white/10 bg-[#2A2942] p-5 shadow-xl">
          <div className="flex items-start justify-between border-b border-white/10 pb-4"><div><p className="font-accent text-xs text-brand-gold">ORDEN</p><h2 className="font-changa text-3xl">{order.order_number.slice(-8)}</h2></div><div className="text-right font-exo text-sm text-brand-muted"><p>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p><p>{ageLabel(order.created_at, now)}</p></div></div>
          <div className="mt-4 space-y-3">{order.items.map((item) => <div key={item.id} className={`rounded-2xl border p-4 ${statusStyle(item.kds_status)}`}><div className="flex items-start gap-3"><UtensilsCrossed className="mt-1 shrink-0" size={22} /><div className="min-w-0 flex-1"><p className="font-exo text-xl font-bold">{item.quantity} × {item.name}</p>{item.modifiers?.map((group) => <p key={group.modifier_id} className="mt-1 font-exo text-base font-semibold text-brand-gold">{group.name}: {group.options?.map((option) => option.name).join(', ')}</p>)}</div><button disabled={busyItem === item.id} onClick={() => advance(item)} className="shrink-0 rounded-xl bg-brand-light px-3 py-2 font-exo text-sm font-bold text-brand-dark disabled:opacity-40">{busyItem === item.id ? '...' : nextStatus[item.kds_status] === 'PREPARING' ? 'Preparar' : 'Listo'}</button></div></div>)}</div>
        </article>)}</div>}
  </section>;
}
