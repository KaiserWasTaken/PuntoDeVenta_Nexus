import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';

export function CartPanel({ cart, total, order, busy, onChangeQuantity, onRemove, onCreateOrder, onPay }) {
  return <aside className="flex min-h-[560px] flex-col rounded-3xl bg-brand-dark p-5 text-brand-light shadow-panel">
    <div className="flex items-center justify-between"><h2 className="font-display text-2xl">Caja</h2><ShoppingCart className="text-brand-gold" /></div>
    <div className="mt-5 flex-1 space-y-3 overflow-y-auto">
      {!cart.length && <p className="py-12 text-center font-exo text-brand-muted">Tu carrito está vacío.</p>}
      {cart.map((item) => <div key={item.key} className="rounded-2xl bg-white/10 p-3">
        <div className="flex justify-between gap-3"><div><p className="font-exo font-bold">{item.name}</p><p className="text-xs text-brand-muted">{item.modifierLabel}</p></div><button onClick={() => onRemove(item.key)}><Trash2 size={16} className="text-brand-muted" /></button></div>
        <div className="mt-3 flex items-center justify-between"><div className="flex items-center gap-2"><button onClick={() => onChangeQuantity(item.key, -1)} className="rounded-lg bg-white/10 p-1"><Minus size={14} /></button><span className="font-exo text-sm">{item.quantity}</span><button onClick={() => onChangeQuantity(item.key, 1)} className="rounded-lg bg-white/10 p-1"><Plus size={14} /></button></div><strong className="font-exo">${(item.unitPrice * item.quantity).toFixed(2)}</strong></div>
      </div>)}
    </div>
    <div className="border-t border-white/20 pt-4"><div className="flex justify-between font-exo text-xl font-bold"><span>Total</span><span className="text-brand-gold">${total.toFixed(2)}</span></div>
      {!order ? <button disabled={!cart.length || busy} onClick={onCreateOrder} className="mt-4 w-full rounded-xl bg-brand-blue px-4 py-3 font-exo font-bold disabled:opacity-40">Generar orden PENDING</button>
        : <div className="mt-4 space-y-2"><p className="font-accent text-[10px] text-brand-muted">{order.order_number} · PENDING</p><button disabled={busy} onClick={onPay} className="w-full rounded-xl bg-brand-gold px-4 py-3 font-exo font-bold text-brand-dark disabled:opacity-40">Pagar / Cobrar</button></div>}
    </div>
  </aside>;
}
