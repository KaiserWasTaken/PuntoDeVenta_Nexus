import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, Gamepad2, PackageSearch, RefreshCw } from 'lucide-react';
import { getConsoles, getInventory, getOrders } from '../../services/api.js';

const cards = [
  { key: 'pending', label: 'Órdenes pendientes', icon: ClipboardList, style: 'bg-brand-dark text-brand-light' },
  { key: 'occupied', label: 'Consolas activas', icon: Gamepad2, style: 'bg-brand-blue text-brand-light' },
  { key: 'lowStock', label: 'Insumos con stock bajo', icon: PackageSearch, style: 'bg-brand-gold text-brand-dark' }
];

export function DashboardPage() {
  const [stats, setStats] = useState({ pending: 0, occupied: 0, lowStock: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const [orders, consoles, supplies] = await Promise.all([getOrders(), getConsoles(), getInventory()]);
      setStats({
        pending: orders.filter((order) => order.status === 'PENDING').length,
        occupied: consoles.filter((consoleRecord) => consoleRecord.status === 'occupied').length,
        lowStock: supplies.filter((supply) => Number(supply.current_quantity) <= Number(supply.minimum_quantity)).length
      });
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No se pudieron cargar los indicadores.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 30000);
    return () => window.clearInterval(interval);
  }, [load]);

  return <section className="space-y-8">
    <header><p className="font-accent text-[10px] uppercase tracking-[0.2em] text-brand-blue">Nexus POS</p><h1 className="font-display text-3xl sm:text-4xl">Inicio</h1><p className="mt-2 text-brand-dark/60">Resumen rápido de la operación actual.</p></header>
    {error && <div className="rounded-2xl bg-brand-dark p-4 text-sm text-brand-light">{error}</div>}
    {loading ? <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-brand-blue" /></div> : <div className="grid grid-cols-1 gap-5 md:grid-cols-3">{cards.map(({ key, label, icon: Icon, style }) => <article key={key} className={`rounded-3xl p-6 shadow-panel ${style}`}><div className="flex items-center justify-between"><p className="font-accent text-[10px] uppercase opacity-75">{label}</p><Icon size={24} /></div><p className="mt-5 font-changa text-5xl">{stats[key]}</p></article>)}</div>}
  </section>;
}
