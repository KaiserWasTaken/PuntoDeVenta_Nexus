import { CreditCard, Wallet, X } from 'lucide-react';

export function PaymentModal({ busy, onClose, onConfirm }) {
  return <div className="modal-backdrop">
    <div className="modal-card max-w-md">
      <div className="flex items-center justify-between"><h2 className="font-display text-2xl">Confirmar pago</h2><button onClick={onClose}><X /></button></div>
      <p className="mt-2 font-exo text-brand-dark/60">Selecciona el método de pago para cerrar la orden.</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button disabled={busy} onClick={() => onConfirm('CASH')} className="rounded-2xl border border-brand-muted p-5 font-exo font-bold hover:border-brand-blue"><Wallet className="mx-auto mb-2 text-brand-blue" />Efectivo</button>
        <button disabled={busy} onClick={() => onConfirm('CARD')} className="rounded-2xl border border-brand-muted p-5 font-exo font-bold hover:border-brand-blue"><CreditCard className="mx-auto mb-2 text-brand-blue" />Tarjeta</button>
      </div>
    </div>
  </div>;
}
