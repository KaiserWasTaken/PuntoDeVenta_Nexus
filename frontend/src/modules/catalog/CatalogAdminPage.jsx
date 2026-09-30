import { useCallback, useEffect, useState } from 'react';
import { Edit3, Plus, RefreshCw, X } from 'lucide-react';
import { createProduct, getCategories, getProducts, updateProduct } from '../../services/api.js';

const emptyForm = { name: '', sale_price: '', category_id: '', product_type: 'individual' };

export function CatalogAdminPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setError(''); const [productData, categoryData] = await Promise.all([getProducts(), getCategories()]); setProducts(productData); setCategories(categoryData.filter((category) => category.is_active)); } catch (requestError) { setError(requestError.response?.data?.error || 'No se pudo cargar el catálogo.'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditing(false); setForm(emptyForm); }
  function openEdit(product) { setEditing(product); setForm({ name: product.name, sale_price: product.sale_price, category_id: product.category_id || '', product_type: product.product_type }); }
  function change(field, value) { setForm((current) => ({ ...current, [field]: value })); }
  async function save(event) {
    event.preventDefault(); setBusy(true);
    try { const payload = { name: form.name, sale_price: Number(form.sale_price), category_id: form.category_id || null, product_type: form.product_type }; if (editing) await updateProduct(editing.id, payload); else await createProduct(payload); setEditing(null); setForm(emptyForm); await load(); } catch (requestError) { setError(requestError.response?.data?.error || 'No se pudo guardar el producto.'); } finally { setBusy(false); }
  }

  return <section className="space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-accent text-[10px] uppercase tracking-[0.2em] text-brand-blue">Administración</p><h1 className="font-display text-3xl sm:text-4xl">Catálogo</h1><p className="mt-2 text-brand-dark/60">Productos activos y disponibles para el POS.</p></div><button onClick={openCreate} className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-3 font-bold text-white"><Plus size={18} /> Nuevo producto</button></header>
    {error && <div className="rounded-2xl bg-brand-dark p-4 text-sm text-brand-light">{error}</div>}
    {loading ? <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-brand-blue" /></div> : <div className="overflow-x-auto rounded-3xl bg-white shadow-panel"><table className="w-full min-w-[680px] text-left"><thead className="bg-brand-dark text-brand-light"><tr>{['Nombre', 'Categoría', 'Precio base', 'Estado', 'Acciones'].map((heading) => <th key={heading} className="px-5 py-4 font-accent text-[10px] uppercase">{heading}</th>)}</tr></thead><tbody>{products.map((product) => <tr key={product.id} className="border-b border-brand-muted/50"><td className="px-5 py-4 font-semibold">{product.name}</td><td className="px-5 py-4">{product.category_name || 'Sin categoría'}</td><td className="px-5 py-4">${Number(product.sale_price).toFixed(2)}</td><td className="px-5 py-4">{product.is_active ? 'Activo' : 'Inactivo'}</td><td className="px-5 py-4"><button onClick={() => openEdit(product)} className="inline-flex items-center gap-2 rounded-xl bg-brand-muted px-3 py-2 text-xs font-bold"><Edit3 size={14} /> Editar</button></td></tr>)}</tbody></table>{!products.length && <p className="p-8 text-center text-brand-dark/60">No hay productos registrados.</p>}</div>}
    {form && <div className="modal-backdrop"><form onSubmit={save} className="modal-card"><div className="flex items-start justify-between"><div><p className="font-accent text-[10px] text-brand-dark/60">{editing ? 'Editar producto' : 'Alta de producto'}</p><h2 className="font-display text-2xl">{editing ? 'Actualizar' : 'Nuevo producto'}</h2></div><button type="button" onClick={() => { setForm(null); setEditing(false); }}><X /></button></div><label className="mt-6 block"><span className="label">Nombre</span><input required className="input" value={form.name} onChange={(event) => change('name', event.target.value)} /></label><label className="mt-4 block"><span className="label">Precio base</span><input required min="0" step="0.01" type="number" className="input" value={form.sale_price} onChange={(event) => change('sale_price', event.target.value)} /></label><label className="mt-4 block"><span className="label">Categoría</span><select className="input" value={form.category_id} onChange={(event) => change('category_id', event.target.value)}><option value="">Sin categoría</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><button disabled={busy} className="mt-6 w-full rounded-2xl bg-brand-gold px-4 py-3 font-bold disabled:opacity-50">{busy ? 'Guardando...' : 'Guardar producto'}</button></form></div>}
  </section>;
}
