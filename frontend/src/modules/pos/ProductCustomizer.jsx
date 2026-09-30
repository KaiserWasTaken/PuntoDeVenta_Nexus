import { useEffect, useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import { getProductModifiers } from '../../services/api.js';

function optionLabel(option) {
  return option.name === 'Mayo' ? 'Mayonesa' : option.name;
}

function defaultOptions(group) {
  const names = group.metadata?.default_options || (
    group.metadata?.default_option ? [group.metadata.default_option] : []
  );
  return group.options.filter((option) => names.includes(option.name));
}

function isNexuletaGroup(group) {
  return group.metadata?.banderilla;
}

export function ProductCustomizer({ product, onClose, onAdd }) {
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getProductModifiers(product.id)
      .then((data) => {
        if (!active) return;
        setGroups(data);
        setSelected(Object.fromEntries(
          data.map((group) => [group.id, defaultOptions(group)]).filter(([, options]) => options.length)
        ));
      })
      .catch(() => {
        if (active) setError('No se pudieron cargar los modificadores.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [product.id]);

  const extra = useMemo(() => groups.reduce((sum, group) => {
    const options = selected[group.id] || [];
    const optionTotal = options.reduce((subtotal, option) => subtotal + Number(option.price_delta), 0);
    const included = Number(group.metadata?.included_selections);
    const extraPrice = Number(group.metadata?.extra_price);
    const selectionExtra = Number.isFinite(included) && Number.isFinite(extraPrice) && options.length > included
      ? (options.length - included) * extraPrice
      : 0;
    const mediumExtra = Number(group.metadata?.medium_non_default_surcharge) &&
      product.name.toLowerCase().includes('mediana') &&
      options.some((option) => option.name !== 'Mantequilla')
      ? Number(group.metadata.medium_non_default_surcharge)
      : 0;
    return sum + optionTotal + selectionExtra + mediumExtra;
  }, 0), [groups, product.name, selected]);

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
      modifiers: groups.map((group) => ({
        modifier_id: group.id,
        option_ids: (selected[group.id] || []).map((option) => option.id),
        label: group.name,
        options: selected[group.id] || []
      })).filter((group) => group.option_ids.length),
      unitPrice: Number(product.sale_price) + extra
    });
  }

  function renderGroup(group) {
    const values = selected[group.id] || [];
    const isFixed = group.metadata?.fixed;
    return (
      <fieldset key={group.id} className="mt-5">
        <legend className="font-exo font-bold">
          {group.name}
          {!isFixed && <span className="ml-2 text-xs font-normal text-brand-dark/60">
            {group.required ? 'Obligatorio' : 'Opcional'}
          </span>}
        </legend>
        {isFixed ? (
          <p className="mt-2 rounded-xl bg-brand-muted/30 p-3 font-exo text-sm text-brand-dark/70">
            Perlas explosivas · Incluido
          </p>
        ) : (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {group.options.filter((option) => option.is_active).map((option) => {
              const checked = values.some((item) => item.id === option.id);
              const checkbox = group.name.includes('Aderezos') || group.metadata?.kind === 'dressing';
              return (
                <button
                  type="button"
                  key={option.id}
                  onClick={() => toggle(group, option)}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-left font-exo text-sm ${
                    checked ? 'border-brand-blue bg-brand-blue/10' : 'border-brand-muted'
                  }`}
                >
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${
                    checkbox ? 'border' : 'rounded-full border-2'
                  } ${checked ? 'border-brand-blue bg-brand-blue text-white' : 'border-brand-muted'}`}>
                    {checked && <Check size={13} />}
                  </span>
                  <span className="flex-1">{optionLabel(option)}</span>
                  <span className="font-bold">{Number(option.price_delta) ? `+$${option.price_delta}` : 'Incluido'}</span>
                </button>
              );
            })}
          </div>
        )}
      </fieldset>
    );
  }

  const banderillaGroups = groups.filter(isNexuletaGroup);
  const globalGroups = groups.filter((group) => !isNexuletaGroup(group));
  const banderillas = [...new Map(banderillaGroups.map((group) => [
    group.metadata.banderilla, banderillaGroups.filter((item) => item.metadata.banderilla === group.metadata.banderilla)
  ])).entries()];

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-h-[90vh] overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-accent text-[10px] text-brand-blue">PERSONALIZAR</p>
            <h2 className="font-display text-2xl">{product.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 hover:bg-brand-muted/50" aria-label="Cerrar">
            <X />
          </button>
        </div>
        {loading && <p className="py-8 font-exo text-brand-dark/60">Cargando opciones...</p>}
        {!loading && (
          <div className="mt-2 overflow-y-auto pr-1">
            {banderillas.length > 0 && (
              <div className="mt-4 max-h-[400px] overflow-y-auto rounded-2xl border border-brand-muted/50 bg-brand-muted/10 p-3">
                <p className="mb-2 font-accent text-xs text-brand-blue">CONFIGURA CADA NEXULETA</p>
                {banderillas.map(([number, banderilla]) => (
                  <section key={number} className="border-b border-brand-muted/40 pb-4 pt-2 last:border-0">
                    <h3 className="font-display text-xl">Nexuleta {number}</h3>
                    {banderilla.map(renderGroup)}
                  </section>
                ))}
              </div>
            )}
            {globalGroups.map(renderGroup)}
          </div>
        )}
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 font-exo text-sm text-red-700">{error}</p>}
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-brand-muted/40 pt-4">
          <div>
            <p className="text-xs font-exo text-brand-dark/60">Total del producto</p>
            <p className="font-exo text-lg font-bold">${(Number(product.sale_price) + extra).toFixed(2)}</p>
          </div>
          <button type="button" onClick={submit} disabled={loading} className="rounded-xl bg-brand-gold px-5 py-3 font-exo font-bold">
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  );
}
