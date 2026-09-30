import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Coffee, RefreshCw, ShoppingCart } from 'lucide-react';
import { createOrder, getCategories, getProducts, payOrder } from '../../services/api.js';
import { CartPanel } from './CartPanel.jsx';
import { ComboCustomizer } from './ComboCustomizer.jsx';
import { PaymentModal } from './PaymentModal.jsx';
import { ProductCustomizer } from './ProductCustomizer.jsx';

export function POSPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [order, setOrder] = useState(null);
  const [customizing, setCustomizing] = useState(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  async function load() {
    setError('');
    try {
      const [categoryData, productData] = await Promise.all([getCategories(), getProducts({ is_active: 'true' })]);
      setCategories(categoryData);
      setProducts(productData);
      if (!categoryId && categoryData[0]) setCategoryId(categoryData[0].id);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No se pudo cargar el catálogo.');
    }
  }
  useEffect(() => { load(); }, []);
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') setIsCartOpen(false);
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const category = categories.find((item) => item.id === categoryId);
  const visibleProducts = products.filter((product) => (
    (!categoryId || product.category_id === categoryId) &&
    (!subcategoryId || product.subcategory_id === subcategoryId)
  ));
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [cart]);

  function addItem(item) {
    const key = item.comboId ? `combo-${item.comboId}-${JSON.stringify(item.selectedComponents)}` : `${item.product.id}-${JSON.stringify(item.modifiers)}`;
    setCart((current) => {
      const existing = current.find((entry) => entry.key === key);
      if (existing) return current.map((entry) => entry.key === key ? { ...entry, quantity: entry.quantity + 1 } : entry);
      return [...current, { ...item, key, name: cleanProductName(item.product.name), modifierLabel: item.modifiers?.flatMap((group) => group.options.map((option) => option.name)).join(' • ') || (item.comboId ? 'Combo configurado' : 'Sin extras'), quantity: 1 }];
    });
    setCustomizing(null);
    setToast(`✓ ${cleanProductName(item.product.name)}`);
    window.setTimeout(() => setToast(''), 2200);
  }
  function changeQuantity(key, delta) {
    setCart((current) => current.map((item) => item.key === key ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  }
  function remove(key) { setCart((current) => current.filter((item) => item.key !== key)); }
  async function generateOrder() {
    setBusy(true); setError('');
    try {
      const data = await createOrder({ items: cart.map((item) => item.comboId ? { combo_id: item.comboId, quantity: item.quantity, selected_components: item.selectedComponents } : { product_id: item.product.id, quantity: item.quantity, modifiers: item.modifiers.map((group) => ({ modifier_id: group.modifier_id, option_ids: group.option_ids })) }) });
      setOrder(data);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No se pudo generar la orden.');
    } finally { setBusy(false); }
  }
  async function pay(method) {
    setBusy(true); setError('');
    try {
      await payOrder(order.id, method);
      setCart([]); setOrder(null); setPaymentOpen(false); setIsCartOpen(false);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No se pudo registrar el pago.');
    } finally { setBusy(false); }
  }

  return <section className="space-y-5">
    <div><p className="font-accent text-[10px] uppercase tracking-[0.2em] text-brand-blue">Punto de venta</p><h1 className="font-display text-3xl sm:text-4xl">Cafetería y caja</h1><p className="font-exo text-brand-dark/60">Configura productos, genera la orden y cobra cuando esté lista.</p></div>
    {error && <div className="flex items-center gap-2 rounded-2xl bg-brand-dark p-4 font-exo text-sm text-brand-light"><AlertTriangle size={18} className="text-brand-gold" />{error}<button className="ml-auto underline" onClick={load}>Reintentar</button></div>}
    <div>
      <div>
        {subcategoryId ? <div className="mb-4 flex items-center gap-3"><button onClick={() => setSubcategoryId('')} className="rounded-xl bg-brand-dark p-2 text-brand-light" aria-label="Volver a subcategorías"><ArrowLeft size={18} /></button><h2 className="font-display text-2xl">{category?.subcategories?.find((item) => item.id === subcategoryId)?.name}</h2></div> : <><p className="mb-2 font-accent text-[10px] uppercase text-brand-blue">Categorías</p><div className="flex gap-2 overflow-x-auto pb-3">{categories.map((item) => <button key={item.id} onClick={() => { setCategoryId(item.id); setSubcategoryId(''); }} className={`whitespace-nowrap rounded-xl px-4 py-2 font-exo font-bold ${item.id === categoryId ? 'bg-brand-blue text-brand-light' : 'bg-white text-brand-dark'}`}>{item.name}</button>)}</div><div className="mb-4 flex gap-2 overflow-x-auto">{category?.subcategories?.filter((item) => item.is_active).map((item) => <button key={item.id} onClick={() => setSubcategoryId(item.id)} className="whitespace-nowrap rounded-lg bg-brand-muted/50 px-3 py-1 font-exo text-sm">{item.name}</button>)}</div></>}
        {!products.length ? <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-brand-blue" /></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visibleProducts.map((product) => <button key={product.id} onClick={() => setCustomizing(product)} className="rounded-2xl bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-panel"><div className="flex h-28 items-center justify-center rounded-xl bg-brand-dark text-brand-gold"><Coffee size={38} /></div><div className="mt-3 flex items-start justify-between gap-2"><h3 className="font-exo font-bold">{product.name}</h3><span className="font-exo font-bold text-brand-blue">${product.sale_price}</span></div><p className="mt-2 font-accent text-[9px] uppercase text-brand-dark/50">{product.product_type === 'combo' ? 'Combo dinámico' : 'Disponible'}</p></button>)}</div>}
      </div>
    </div>
    <button
      type="button"
      onClick={() => setIsCartOpen(true)}
      aria-label={`Abrir carrito con ${cart.reduce((sum, item) => sum + item.quantity, 0)} artículos`}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full bg-brand-gold px-5 py-4 text-brand-dark shadow-2xl transition-all hover:scale-105"
    >
      <span className="relative"><ShoppingCart size={25} /><span className="absolute -right-3 -top-3 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-blue px-1.5 font-accent text-[10px] text-white">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span></span>
      <span className="font-exo font-bold">${total.toFixed(2)}</span>
    </button>
    <CartPanel open={isCartOpen} cart={cart} total={total} order={order} busy={busy} onClose={() => setIsCartOpen(false)} onChangeQuantity={changeQuantity} onRemove={remove} onCreateOrder={generateOrder} onPay={() => setPaymentOpen(true)} />
    {customizing && (customizing.product_type === 'combo' ? <ComboCustomizer product={customizing} onClose={() => setCustomizing(null)} onAdd={addItem} /> : <ProductCustomizer product={customizing} onClose={() => setCustomizing(null)} onAdd={addItem} />)}
    {paymentOpen && <PaymentModal busy={busy} onClose={() => setPaymentOpen(false)} onConfirm={pay} />}
    {toast && <div className="fixed bottom-24 right-6 z-40 rounded-2xl bg-brand-dark px-4 py-3 font-exo font-bold text-brand-light shadow-2xl">{toast}</div>}
  </section>;
}

function cleanProductName(name) {
  return String(name || '').replace(/^(bubble tea|combo|bebida|producto)\s+/i, '').trim();
}
