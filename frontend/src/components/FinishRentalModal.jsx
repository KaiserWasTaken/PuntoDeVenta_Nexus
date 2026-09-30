import { X } from 'lucide-react';

export function FinishRentalModal({ session, amount, onClose, onConfirm, busy }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-accent text-[10px] text-brand-dark/60">Confirmar cierre</p>
            <h2 className="font-display text-2xl text-brand-dark">{session.consola_nombre}</h2>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-brand-dark/60 hover:bg-brand-muted/50"><X /></button>
        </div>
        <div className="my-8 rounded-2xl bg-brand-muted/30 p-5 text-center">
          <p className="font-exo text-sm font-semibold text-brand-dark/60">Total final estimado</p>
          <p className="mt-1 text-4xl font-bold text-brand-dark">${amount}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onClose} className="rounded-2xl border border-brand-muted px-4 py-3 font-exo font-bold text-brand-dark/70">Cancelar</button>
          <button disabled={busy} onClick={onConfirm} className="rounded-2xl bg-brand-blue px-4 py-3 font-exo font-bold text-brand-light disabled:opacity-50">{busy ? 'Cerrando...' : 'Terminar renta'}</button>
        </div>
      </div>
    </div>
  );
}
