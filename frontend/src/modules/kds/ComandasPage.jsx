import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, CircleDot, Clock3, Coffee, Package, RefreshCw, UtensilsCrossed } from 'lucide-react';
import { getAccessToken, getKdsOrders, updateKdsItem } from '../../services/api.js';
import { socket } from '../../services/socket.js';

const groupConfig = {
  BEBIDAS: { label: 'BEBIDAS', icon: Coffee },
  COMIDAS: { label: 'COMIDAS', icon: UtensilsCrossed },
  COMBOS: { label: 'COMBOS', icon: Package }
};

function categoryFor(item) {
  if (item.item_type === 'COMBO' || item.item_type === 'COMBO_COMPONENT') return 'COMBOS';
  const category = String(item.category_name || '').toLowerCase();
  return category.includes('beb') ? 'BEBIDAS' : 'COMIDAS';
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getDetails(item) {
  return (item.modifiers || []).flatMap((group) => (group.options || []).map((option) => `${group.name}: ${option.name}`));
}

export function ComandasPage() {
  const [orders, setOrders] = useState([]);
  const [checked, setChecked] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const nextOrders = await getKdsOrders();
      setOrders(nextOrders.sort((left, right) => new Date(right.created_at) - new Date(left.created_at)));
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No se pudieron cargar las comandas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const token = getAccessToken();
    socket.auth = { token };
    socket.connect();
    const refresh = () => load();
    socket.on('kds:nueva_orden', refresh);
    socket.on('kds:actualizado', refresh);
    socket.on('kds:orden_lista', refresh);
    return () => {
      socket.off('kds:nueva_orden', refresh);
      socket.off('kds:actualizado', refresh);
      socket.off('kds:orden_lista', refresh);
      socket.disconnect();
    };
  }, [load]);

  const ticketCount = orders.length;
  const activeItems = useMemo(() => orders.flatMap((order) => order.items), [orders]);

  function toggle(orderId, itemId) {
    setChecked((current) => ({ ...current, [`${orderId}:${itemId}`]: !current[`${orderId}:${itemId}`] }));
  }

  function isChecked(orderId, itemId) {
    return Boolean(checked[`${orderId}:${itemId}`]);
  }

  async function deliver(order) {
    const unchecked = order.items.filter((item) => !isChecked(order.id, item.id));
    if (unchecked.length) return;
    setBusy(true);
    try {
      await Promise.all(order.items.map((item) => item.kds_status === 'READY' ? null : updateKdsItem(item.id, 'READY')));
      setChecked((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith(`${order.id}:`))));
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No se pudo marcar la comanda como entregada.');
    } finally {
      setBusy(false);
    }
  }

  return <section className="min-h-[calc(100vh-5rem)] rounded-3xl bg-brand-dark p-5 text-brand-light sm:p-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="font-accent text-[10px] uppercase tracking-[0.2em] text-brand-gold">Monitor de barra</p><h1 className="font-display text-4xl sm:text-5xl">COMANDAS</h1><p className="mt-2 font-exo text-brand-muted">Tickets activos en tiempo real</p></div>
      <div className="flex items-center gap-3 rounded-full bg-brand-gold px-5 py-3 font-changa text-xl text-brand-dark"><CircleDot size={18} />{ticketCount} {ticketCount === 1 ? 'Ticket' : 'Tickets'}<button onClick={load} className="ml-1 rounded-full p-1 hover:bg-brand-dark/10" title="Actualizar"><RefreshCw size={17} /></button></div>
    </header>
    {error && <div className="mt-5 rounded-2xl border border-red-400/60 bg-red-500/10 p-4 font-exo text-red-200">{error}</div>}
    {loading ? <div className="flex justify-center py-24"><RefreshCw className="animate-spin text-brand-gold" size={32} /></div> : !orders.length ? <div className="flex flex-col items-center justify-center py-28 text-center"><Check size={56} className="text-emerald-300" /><h2 className="mt-4 font-display text-3xl text-emerald-300">Todo entregado</h2><p className="mt-2 font-exo text-brand-muted">No hay tickets activos.</p></div> : <div className="mt-8 grid gap-5 lg:grid-cols-2">{orders.map((order) => {
      const groups = order.items.reduce((result, item) => { const group = categoryFor(item); result[group] = [...(result[group] || []), item]; return result; }, {});
      const ready = order.items.every((item) => isChecked(order.id, item.id) || item.kds_status === 'READY');
      return <article key={order.id} className={`rounded-3xl border bg-[#2A2942] p-5 shadow-xl transition-opacity ${ready ? 'border-emerald-400/80 ring-2 ring-emerald-400/20' : 'border-white/10'}`}>
        <div className="flex items-start justify-between border-b border-white/10 pb-4"><div><p className="font-accent text-xs text-brand-gold">TICKET</p><h2 className="font-changa text-4xl">#{order.order_number.slice(-4)}</h2></div><div className="flex items-center gap-2 text-right font-exo text-lg text-brand-muted"><Clock3 size={18} />{formatTime(order.created_at)}</div></div>
        <div className="mt-5 space-y-5">{Object.entries(groups).map(([group, items]) => { const { label, icon: Icon } = groupConfig[group]; return <section key={group}><h3 className="mb-2 flex items-center gap-2 font-accent text-xs text-brand-gold"><Icon size={17} />{label}</h3><div className="space-y-2">{items.map((item) => { const marked = isChecked(order.id, item.id) || item.kds_status === 'READY'; return <button type="button" key={item.id} onClick={() => toggle(order.id, item.id)} className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${marked ? 'border-emerald-400/50 bg-emerald-400/10' : 'border-white/10 bg-brand-dark/40 hover:border-brand-gold/50'}`}><span className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${marked ? 'border-emerald-300 bg-emerald-300 text-brand-dark' : 'border-brand-muted'}`}>{marked && <Check size={17} />}</span><span className="min-w-0 flex-1"><span className={`block font-exo text-xl font-bold ${marked ? 'text-emerald-200 line-through' : 'text-white'}`}>{item.quantity} × {item.name}</span>{getDetails(item).map((detail) => <span key={detail} className="mt-1 block font-exo text-sm font-semibold text-brand-gold">{detail}</span>)}</span></button>; })}</div></section>; })}</div>
        <button disabled={!ready || busy} onClick={() => deliver(order)} className="mt-6 w-full rounded-2xl bg-brand-blue px-5 py-4 font-accent text-sm text-white transition hover:bg-brand-blue/80 disabled:cursor-not-allowed disabled:opacity-40">ENTREGADO</button>
      </article>;
    })}</div>}
    <span className="sr-only">{activeItems.length} artículos activos</span>
  </section>;
}
