import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { getOrders } from '../../services/api.js';

function money(value) { return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value) || 0); }
function date(value) { return value ? new Date(value).toLocaleString('es-MX') : '—'; }

export function OrdersHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => { try { setError(''); setOrders(await getOrders()); } catch (requestError) { setError(requestError.response?.data?.error || 'No se pudo cargar el historial.'); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  return <section className="space-y-8"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-accent text-[10px] uppercase tracking-[0.2em] text-brand-blue">Caja</p><h1 className="font-display text-3xl sm:text-4xl">Historial de órdenes</h1><p className="mt-2 text-brand-dark/60">Consulta las últimas órdenes creadas y cobradas.</p></div><button onClick={load} className="inline-flex items-center gap-2 rounded-2xl bg-brand-dark px-4 py-3 font-bold text-white"><RefreshCw size={17} /> Actualizar</button></header>{error && <div className="rounded-2xl bg-brand-dark p-4 text-sm text-white">{error}</div>}{loading ? <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-brand-blue" /></div> : <div className="overflow-x-auto rounded-3xl bg-white shadow-panel"><table className="w-full min-w-[760px] text-left"><thead className="bg-brand-dark text-brand-light"><tr>{['ID de orden', 'Fecha', 'Método de pago', 'Estado', 'Total'].map((heading) => <th key={heading} className="px-5 py-4 font-accent text-[10px] uppercase">{heading}</th>)}</tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-b border-brand-muted/50"><td className="px-5 py-4 font-semibold">{order.order_number}</td><td className="px-5 py-4 text-sm">{date(order.created_at)}</td><td className="px-5 py-4">{order.payment_method || 'Pendiente'}</td><td className="px-5 py-4"><span className="rounded-full bg-brand-muted px-3 py-1 text-xs font-bold">{order.status}</span></td><td className="px-5 py-4 font-bold">{money(order.total)}</td></tr>)}</tbody></table>{!orders.length && <p className="p-8 text-center text-brand-dark/60">No hay órdenes registradas.</p>}</div>}</section>;
}
