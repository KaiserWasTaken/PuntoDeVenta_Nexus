import { useCallback, useEffect, useMemo, useState } from 'react';
import { CreditCard, DollarSign, RefreshCw, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { getActiveMetrics } from '../../services/api.js';

const cards = [
  { key: 'total_sales', label: 'Ventas cobradas', icon: DollarSign, style: 'bg-brand-dark text-brand-light' },
  { key: 'total_expenses', label: 'Gastos del día', icon: TrendingDown, style: 'bg-brand-blue text-brand-light' },
  { key: 'net_profit', label: 'Ganancia neta', icon: TrendingUp, style: 'bg-brand-gold text-brand-dark' }
];

function money(value) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value) || 0);
}

export function MonitorPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setMetrics(await getActiveMetrics());
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No se pudieron cargar las métricas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 30000);
    return () => window.clearInterval(interval);
  }, [load]);

  const netIsPositive = useMemo(() => Number(metrics?.net_profit) >= 0, [metrics]);

  return <section className="space-y-8">
    <header>
      <p className="font-accent text-[10px] uppercase tracking-[0.2em] text-brand-blue">Resumen financiero</p>
      <h1 className="font-display text-3xl text-brand-dark sm:text-4xl">Monitor del día</h1>
      <p className="mt-2 font-exo text-brand-dark/60">Ventas cobradas menos gastos activos del turno actual.</p>
    </header>
    {error && <div className="rounded-2xl bg-brand-dark p-4 font-exo text-sm text-brand-light">{error}</div>}
    {loading && !metrics ? <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-brand-blue" /></div> : <>
      <div className="grid gap-5 md:grid-cols-3">
        {cards.map(({ key, label, icon: Icon, style }) => <article key={key} className={`rounded-3xl p-6 shadow-panel ${style}`}><div className="flex items-center justify-between"><p className="font-accent text-[10px] uppercase opacity-75">{label}</p><Icon size={24} /></div><p className="mt-4 font-changa text-4xl">{money(metrics?.[key])}</p></article>)}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-3xl bg-white p-6 shadow-panel"><h2 className="font-display text-2xl">Ventas por método</h2><div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-brand-muted/40 p-5"><Wallet className="text-brand-blue" /><p className="mt-3 font-exo text-sm text-brand-dark/60">Efectivo</p><p className="font-changa text-3xl">{money(metrics?.cash_sales)}</p></div><div className="rounded-2xl bg-brand-muted/40 p-5"><CreditCard className="text-brand-blue" /><p className="mt-3 font-exo text-sm text-brand-dark/60">Tarjeta</p><p className="font-changa text-3xl">{money(metrics?.card_sales)}</p></div></div></article>
        <article className={`rounded-3xl p-6 shadow-panel ${netIsPositive ? 'bg-brand-dark text-brand-light' : 'bg-red-900 text-brand-light'}`}><p className="font-accent text-[10px] uppercase text-brand-gold">Balance actual</p><h2 className="mt-3 font-display text-3xl">{netIsPositive ? 'Ganancia del turno' : 'Gastos por encima de ventas'}</h2><p className="mt-5 font-changa text-5xl text-brand-gold">{money(metrics?.net_profit)}</p><p className="mt-3 font-exo text-sm text-brand-muted">Las órdenes pendientes no se incluyen hasta completar el cobro.</p></article>
      </div>
    </>}
  </section>;
}
