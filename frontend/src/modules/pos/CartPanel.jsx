import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';

export function CartPanel({ open, cart, total, order, busy, onClose, onChangeQuantity, onRemove, onCreateOrder, onPay }) {
  return <>
    <div
      aria-hidden={!open}
      onClick={onClose}
      className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    />
    <aside
      aria-label="Carrito de compras"
      aria-hidden={!open}
      className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-brand-muted/20 bg-brand-dark p-5 text-brand-light shadow-2xl transform transition-transform duration-300 ease-in-out sm:w-[450px] md:w-[40%] ${open ? 'translate-x-0' : 'pointer-events-none translate-x-full'}`}
    >
      <div className="flex items-center justify-between border-b border-white/20 pb-4"><h2 className="font-display text-2xl">Tu Pedido</h2><button type="button" onClick={onClose} aria-label="Cerrar carrito" className="rounded-xl p-2 text-brand-muted transition hover:bg-white/10 hover:text-brand-gold"><X size={24} /></button></div>
      <div className="mt-5 flex-1 space-y-3 overflow-y-auto">
      {!cart.length && <p className="py-12 text-center font-exo text-brand-muted">Tu carrito está vacío.</p>}
      {cart.map((item) => <div key={item.key} className="rounded-2xl bg-white/10 p-3">
        <div className="flex justify-between gap-3"><div><p className="font-exo font-bold">{item.name}</p><p className="text-xs text-brand-gold">{item.modifierLabel}</p>{item.comboId && <p className="mt-1 text-xs text-brand-muted">Componentes configurados incluidos</p>}</div><button onClick={() => onRemove(item.key)}><Trash2 size={16} className="text-brand-muted" /></button></div>
        <div className="mt-3 flex items-center justify-between"><div className="flex items-center gap-2"><button onClick={() => onChangeQuantity(item.key, -1)} className="rounded-lg bg-white/10 p-1"><Minus size={14} /></button><span className="font-exo text-sm">{item.quantity}</span><button onClick={() => onChangeQuantity(item.key, 1)} className="rounded-lg bg-white/10 p-1"><Plus size={14} /></button></div><strong className="font-exo">${(item.unitPrice * item.quantity).toFixed(2)}</strong></div>
      </div>)}
    </div>
    <div className="border-t border-white/20 pt-4"><div className="flex justify-between font-exo text-xl font-bold"><span>Total</span><span className="text-brand-gold">${total.toFixed(2)}</span></div>
      {!order ? <button disabled={!cart.length || busy} onClick={onCreateOrder} className="mt-4 w-full rounded-xl bg-brand-blue px-4 py-3 font-exo font-bold disabled:opacity-40">Generar orden PENDING</button>
        : <div className="mt-4 space-y-2"><p className="font-accent text-[10px] text-brand-muted">{order.order_number} · PENDING</p><button disabled={busy} onClick={onPay} className="w-full rounded-xl bg-brand-gold px-4 py-3 font-exo font-bold text-brand-dark disabled:opacity-40">Pagar / Cobrar</button></div>}
    </div>
    </aside>
  </>;
}
