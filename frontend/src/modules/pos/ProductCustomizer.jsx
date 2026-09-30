import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { getProductModifiers } from '../../services/api.js';

export function ProductCustomizer({ product, onClose, onAdd }) {
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProductModifiers(product.id)
      .then(setGroups)
      .catch(() => setError('No se pudieron cargar los modificadores.'))
      .finally(() => setLoading(false));
  }, [product.id]);

  const extra = useMemo(() => Object.values(selected)
    .flat()
    .reduce((sum, option) => sum + Number(option.price_delta), 0), [selected]);

  function toggle(group, option) {
    setSelected((current) => {
      const values = current[group.id] || [];
      const exists = values.some((item) => item.id === option.id);
      if (exists) return { ...current, [group.id]: values.filter((item) => item.id !== option.id) };
      if (Number(group.max_selections) === 1) return { ...current, [group.id]: [option] };
      if (values.length >= Number(group.max_selections)) return current;
      return { ...current, [group.id]: [...values, option] };
    });
  }

  function submit() {
    const invalid = groups.find((group) => {
      const count = (selected[group.id] || []).length;
      const minimum = Math.max(Number(group.min_selections || 0), group.required ? 1 : 0);
      return count < minimum || count > Number(group.max_selections);
    });
    if (invalid) {
      setError(`Completa ${invalid.name}.`);
      return;
    }
    onAdd({
      product,
      modifiers: groups
        .map((group) => ({
          modifier_id: group.id,
          option_ids: (selected[group.id] || []).map((option) => option.id),
          label: group.name,
          options: selected[group.id] || []
        }))
        .filter((group) => group.option_ids.length),
      unitPrice: Number(product.sale_price) + extra
    });
  }

  return <div className="modal-backdrop">
    <div className="modal-card">
      <div className="flex items-start justify-between">
        <div><p className="font-accent text-[10px] text-brand-blue">PERSONALIZAR</p><h2 className="font-display text-2xl">{product.name}</h2></div>
        <button onClick={onClose} className="rounded-xl p-2 hover:bg-brand-muted/50"><X /></button>
      </div>
      {loading && <p className="py-8 font-exo text-brand-dark/60">Cargando opciones...</p>}
      {!loading && groups.map((group) => <fieldset key={group.id} className="mt-6">
        <legend className="font-exo font-bold">{group.name} <span className="text-xs font-normal text-brand-dark/60">({group.required ? 'obligatorio' : 'opcional'})</span></legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {group.options.filter((option) => option.is_active).map((option) => {
            const active = (selected[group.id] || []).some((item) => item.id === option.id);
            return <button type="button" key={option.id} onClick={() => toggle(group, option)} className={`rounded-xl border p-3 text-left font-exo text-sm ${active ? 'border-brand-blue bg-brand-blue/10' : 'border-brand-muted'}`}>
              {option.name}<span className="float-right font-bold">{Number(option.price_delta) ? `+$${option.price_delta}` : 'Incluido'}</span>
            </button>;
          })}
        </div>
      </fieldset>)}
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 font-exo text-sm text-red-700">{error}</p>}
      <div className="mt-8 flex items-center justify-between gap-3">
        <p className="font-exo text-lg font-bold">${(Number(product.sale_price) + extra).toFixed(2)}</p>
        <button onClick={submit} disabled={loading} className="rounded-xl bg-brand-gold px-5 py-3 font-exo font-bold">Agregar al carrito</button>
      </div>
    </div>
  </div>;
}
