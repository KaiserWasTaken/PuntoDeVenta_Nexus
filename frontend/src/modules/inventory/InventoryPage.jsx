import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Edit3, RefreshCw, X } from 'lucide-react';
import { getInventory, updateInventory } from '../../services/api.js';

export function InventoryPage() {
  const [supplies, setSupplies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [minimum, setMinimum] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setError(''); setSupplies(await getInventory()); } catch (requestError) { setError(requestError.response?.data?.error || 'No se pudo cargar el inventario.'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function openEditor(supply) {
    setSelected(supply);
    setQuantity(supply.current_quantity);
    setMinimum(supply.minimum_quantity);
  }
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    try { await updateInventory(selected.id, { current_quantity: Number(quantity), minimum_quantity: Number(minimum) }); setSelected(null); await load(); } catch (requestError) { setError(requestError.response?.data?.error || 'No se pudo ajustar el stock.'); } finally { setBusy(false); }
  }

  return <section className="space-y-8">
    <header><p className="font-accent text-[10px] uppercase tracking-[0.2em] text-brand-blue">Administración</p><h1 className="font-display text-3xl sm:text-4xl">Inventario</h1><p className="mt-2 text-brand-dark/60">Control de insumos y niveles mínimos.</p></header>
    {error && <div className="rounded-2xl bg-brand-dark p-4 text-sm text-brand-light">{error}</div>}
    {loading ? <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-brand-blue" /></div> : <div className="overflow-x-auto rounded-3xl bg-white shadow-panel"><table className="w-full min-w-[680px] text-left"><thead className="bg-brand-dark text-brand-light"><tr>{['Nombre', 'Unidad', 'Stock actual', 'Stock mínimo', 'Estado', 'Acciones'].map((heading) => <th key={heading} className="px-5 py-4 font-accent text-[10px] uppercase">{heading}</th>)}</tr></thead><tbody>{supplies.map((supply) => { const low = Number(supply.current_quantity) <= Number(supply.minimum_quantity); return <tr key={supply.id} className={`border-b border-brand-muted/50 ${low ? 'bg-red-50' : ''}`}><td className="px-5 py-4 font-semibold">{supply.name}</td><td className="px-5 py-4">{supply.unit}</td><td className="px-5 py-4">{supply.current_quantity}</td><td className="px-5 py-4">{supply.minimum_quantity}</td><td className="px-5 py-4">{low ? <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700"><AlertTriangle size={14} /> Bajo</span> : <span className="text-sm text-green-700">Normal</span>}</td><td className="px-5 py-4"><button onClick={() => openEditor(supply)} className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-3 py-2 text-xs font-bold text-white"><Edit3 size={14} /> Ajustar</button></td></tr>; })}</tbody></table>{!supplies.length && <p className="p-8 text-center text-brand-dark/60">No hay insumos activos registrados.</p>}</div>}
    {selected && <div className="modal-backdrop"><form onSubmit={save} className="modal-card"><div className="flex items-start justify-between"><div><p className="font-accent text-[10px] text-brand-dark/60">Ajuste manual</p><h2 className="font-display text-2xl">{selected.name}</h2></div><button type="button" onClick={() => setSelected(null)}><X /></button></div><label className="mt-6 block"><span className="label">Stock actual ({selected.unit})</span><input className="input" type="number" min="0" step="0.001" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label><label className="mt-4 block"><span className="label">Stock mínimo ({selected.unit})</span><input className="input" type="number" min="0" step="0.001" value={minimum} onChange={(event) => setMinimum(event.target.value)} /></label><button disabled={busy} className="mt-6 w-full rounded-2xl bg-brand-gold px-4 py-3 font-bold disabled:opacity-50">{busy ? 'Guardando...' : 'Guardar ajuste'}</button></form></div>}
  </section>;
}
