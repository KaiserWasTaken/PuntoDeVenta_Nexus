import { useState } from 'react';
import { X } from 'lucide-react';

const durations = [30, 60, 120, 180];

export function StartRentalModal({ consoleRecord, onClose, onSubmit, busy }) {
  const [type, setType] = useState('FIJO');
  const [duration, setDuration] = useState(60);
  const [rate, setRate] = useState(Number(consoleRecord.hourly_rate) || 0);

  function submit(event) {
    event.preventDefault();
    onSubmit({
      consola_id: consoleRecord.id,
      tipo_renta: type,
      ...(type === 'FIJO' ? { duracion_minutos: duration } : {}),
      precio_por_hora: Number(rate)
    });
  }

  return (
    <div className="modal-backdrop">
      <form onSubmit={submit} className="modal-card">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-accent text-[10px] text-brand-dark/60">Nueva sesión</p>
            <h2 className="font-display text-2xl text-brand-dark">{consoleRecord.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-brand-dark/60 hover:bg-brand-muted/50"><X /></button>
        </div>
        <fieldset className="mt-6">
          <legend className="label">Tipo de renta</legend>
          <div className="grid grid-cols-2 gap-3">
            {['FIJO', 'LIBRE'].map((option) => (
              <button type="button" key={option} onClick={() => setType(option)} className={`rounded-2xl border px-4 py-3 font-exo font-bold ${type === option ? 'border-brand-blue bg-brand-dark text-brand-light' : 'border-brand-muted text-brand-dark/70'}`}>
                {option === 'FIJO' ? 'Tiempo fijo' : 'Tiempo libre'}
              </button>
            ))}
          </div>
        </fieldset>
        {type === 'FIJO' && (
          <label className="mt-5 block">
            <span className="label">Duración</span>
            <select className="input" value={duration} onChange={(event) => setDuration(Number(event.target.value))}>
              {durations.map((value) => <option key={value} value={value}>{value >= 60 ? `${value / 60} hora(s)` : `${value} minutos`}</option>)}
            </select>
          </label>
        )}
        <label className="mt-5 block">
          <span className="label">Precio por hora</span>
          <input className="input" type="number" min="0" step="0.01" value={rate} onChange={(event) => setRate(event.target.value)} />
        </label>
        <button disabled={busy} className="mt-7 w-full rounded-2xl bg-brand-gold px-4 py-3 font-exo font-bold text-brand-dark disabled:opacity-50">
          {busy ? 'Iniciando...' : 'Iniciar renta'}
        </button>
      </form>
    </div>
  );
}
