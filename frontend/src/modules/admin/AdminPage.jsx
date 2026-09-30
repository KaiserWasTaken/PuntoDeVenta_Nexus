import { useCallback, useEffect, useState } from 'react';
import { Archive, BarChart3, BookOpen, Gamepad2, Package, ReceiptText, RefreshCw, ShieldCheck, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { CatalogAdminPage } from '../catalog/CatalogAdminPage.jsx';
import { ConsolesPage } from '../consoles/ConsolesPage.jsx';
import { InventoryPage } from '../inventory/InventoryPage.jsx';
import { OrdersHistoryPage } from '../orders/OrdersHistoryPage.jsx';
import { MonitorPage } from '../reports/MonitorPage.jsx';
import { closeDay, getActiveMetrics, getDailyReports } from '../../services/api.js';

function money(value) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value) || 0);
}

const modules = [
  ['turno', 'Historial / Avance del Turno', 'Ventas activas en vivo', BarChart3],
  ['cierre', 'Cierre de Día y Reporte', 'Cierra el turno y prepara el resumen', Archive],
  ['inventario', 'Inventario e Insumos', 'Stock, compras y ajustes', Package],
  ['catalogo', 'Catálogo y Recetas', 'Productos, precios y modificadores', BookOpen],
  ['consolas', 'Consolas y Tarifas', 'Configuración de rentas', Gamepad2],
  ['reportes', 'Reportes Diarios', 'Historial de cierres', ReceiptText]
];

export function AdminPage({ onNavigate, onLogout }) {
  const [section, setSection] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const [metricData, reportData] = await Promise.all([getActiveMetrics(), getDailyReports()]);
      setMetrics(metricData);
      setReports(reportData);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No se pudo cargar el resumen administrativo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleClose() {
    if (!window.confirm('¿Deseas cerrar el turno de hoy? Esta acción asignará las ventas y gastos al reporte diario.')) return;
    try {
      const report = await closeDay(new Date().toISOString().slice(0, 10));
      setMessage(`Cierre creado para ${report.report_date}. Puedes imprimir esta vista como reporte.`);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No se pudo cerrar el turno.');
    }
  }

  if (section === 'turno') return <SubView title="Avance del turno" onBack={() => setSection(null)}><MonitorPage /></SubView>;
  if (section === 'inventario') return <SubView title="Inventario e insumos" onBack={() => setSection(null)}><InventoryPage /></SubView>;
  if (section === 'catalogo') return <SubView title="Catálogo y recetas" onBack={() => setSection(null)}><CatalogAdminPage /></SubView>;
  if (section === 'consolas') return <SubView title="Consolas y tarifas" onBack={() => setSection(null)}><ConsolesPage onLogout={onLogout} /></SubView>;
  if (section === 'reportes') return <SubView title="Reportes diarios" onBack={() => setSection(null)}><ReportsTable reports={reports} /></SubView>;

  return <section className="space-y-8">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-accent text-[10px] uppercase tracking-[0.2em] text-brand-blue">Centro de control</p><h1 className="font-display text-3xl sm:text-4xl">Administración</h1><p className="mt-2 text-brand-dark/60">Resumen del día y accesos de gestión.</p></div><div className="flex items-center gap-3"><button onClick={load} className="rounded-xl bg-brand-dark p-3 text-white" title="Actualizar"><RefreshCw size={18} /></button><button onClick={onLogout} className="rounded-xl border border-brand-muted px-4 py-3 text-sm font-bold">Salir</button></div></header>
    <div className="rounded-3xl bg-brand-dark p-6 text-brand-light shadow-panel"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="font-accent text-[10px] text-brand-gold">RESUMEN DEL DÍA</p><h2 className="mt-2 font-display text-3xl">Estado financiero</h2></div><div className="rounded-2xl bg-white/10 px-4 py-3 font-accent text-xs text-brand-gold">EFE: {money(metrics?.cash_sales)} &nbsp; TAR: {money(metrics?.card_sales)}</div></div></div>
    {error && <div className="rounded-2xl bg-red-900 p-4 text-sm text-white">{error}</div>}
    {message && <div className="rounded-2xl bg-emerald-700 p-4 text-sm text-white">{message}</div>}
    {loading ? <div className="flex justify-center py-16"><RefreshCw className="animate-spin text-brand-blue" /></div> : <div className="grid gap-5 md:grid-cols-3">{[['Total ventas', metrics?.total_sales, TrendingUp, 'bg-brand-blue text-white'], ['Total gastos', metrics?.total_expenses, TrendingDown, 'bg-brand-gold text-brand-dark'], ['Ganancia neta', metrics?.net_profit, Wallet, 'bg-brand-dark text-white']].map(([label, value, Icon, style]) => <article key={label} className={`rounded-3xl p-6 shadow-panel ${style}`}><div className="flex items-center justify-between"><p className="font-accent text-[10px] uppercase opacity-80">{label}</p><Icon size={25} /></div><p className="mt-5 font-changa text-4xl">{money(value)}</p></article>)}</div>}
    <section><div className="mb-4 flex items-end justify-between"><div><p className="font-accent text-[10px] uppercase text-brand-blue">MÓDULOS DE GESTIÓN</p><h2 className="font-display text-3xl">Accesos rápidos</h2></div><span className="text-sm text-brand-dark/50">{reports.length} cierres registrados</span></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{modules.map(([id, label, description, Icon]) => <button key={id} onClick={() => id === 'cierre' ? handleClose() : setSection(id)} className="group rounded-3xl bg-white p-5 text-left shadow-panel transition hover:-translate-y-1 hover:bg-brand-light"><Icon className="text-brand-blue transition group-hover:text-brand-gold" size={27} /><h3 className="mt-4 font-display text-xl">{label}</h3><p className="mt-1 text-sm text-brand-dark/60">{description}</p></button>)}</div></section>
  </section>;
}

function SubView({ title, onBack, children }) {
  return <section className="space-y-5"><button onClick={onBack} className="rounded-xl bg-brand-dark px-4 py-2 text-sm font-bold text-white">← Administración</button><div>{children}</div></section>;
}

function ReportsTable({ reports }) {
  return <div className="space-y-4"><div className="flex justify-end"><button onClick={() => window.print()} className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-bold text-white">Imprimir / Guardar PDF</button></div><div className="overflow-x-auto rounded-3xl bg-white shadow-panel"><table className="w-full min-w-[700px] text-left"><thead className="bg-brand-dark text-brand-light"><tr>{['Fecha', 'Ventas', 'Gastos', 'Ganancia', 'Efectivo', 'Tarjeta'].map((heading) => <th key={heading} className="px-5 py-4 font-accent text-[10px] uppercase">{heading}</th>)}</tr></thead><tbody>{reports.map((report) => <tr key={report.id} className="border-b border-brand-muted/50"><td className="px-5 py-4 font-semibold">{report.report_date}</td><td className="px-5 py-4">{money(report.total_sales)}</td><td className="px-5 py-4">{money(report.total_expenses)}</td><td className="px-5 py-4 font-bold">{money(report.net_profit)}</td><td className="px-5 py-4">{money(report.cash_sales)}</td><td className="px-5 py-4">{money(report.card_sales)}</td></tr>)}</tbody></table>{!reports.length && <p className="p-8 text-center text-brand-dark/60">No hay reportes diarios.</p>}</div></div>;
}
