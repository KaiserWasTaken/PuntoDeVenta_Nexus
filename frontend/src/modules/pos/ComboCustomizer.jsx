import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getCombo, getProducts } from '../../services/api.js';

export function ComboCustomizer({ product, onClose, onAdd }) {
  const [combo, setCombo] = useState(null);
  const [products, setProducts] = useState([]);
  const [choices, setChoices] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getCombo(product.id), getProducts({ is_active: 'true' })])
      .then(([comboData, productData]) => { setCombo(comboData); setProducts(productData); })
      .catch(() => setError('No se pudo cargar el combo.'));
  }, [product.id]);

  function addCombo() {
    if (!combo) return;
    const selectedComponents = combo.items.map((item) => {
      const choice = choices[item.id];
      const selectedProduct = choice?.product_id || item.component_product_id;
      return {
        combo_item_id: item.id,
        product_id: selectedProduct || undefined,
        quantity: item.quantity,
        modifiers: [],
        rental: choice?.rental
      };
    });
    const missing = combo.items.some((item) => item.component_type === 'PRODUCT' && !choices[item.id] && !item.component_product_id);
    if (missing) {
      setError('Selecciona todos los componentes configurables.');
      return;
    }
    onAdd({ product, comboId: product.id, selectedComponents, unitPrice: Number(combo.sale_price) });
  }

  return <div className="modal-backdrop">
    <div className="modal-card">
      <div className="flex items-start justify-between">
        <div><p className="font-accent text-[10px] text-brand-blue">CONFIGURAR COMBO</p><h2 className="font-display text-2xl">{product.name}</h2></div>
        <button onClick={onClose} className="rounded-xl p-2 hover:bg-brand-muted/50"><X /></button>
      </div>
      {!combo && !error && <p className="py-8 font-exo text-brand-dark/60">Cargando componentes...</p>}
      {combo?.items.map((item) => {
        const allowed = Array.isArray(item.metadata?.allowed_product_ids)
          ? products.filter((candidate) => item.metadata.allowed_product_ids.includes(candidate.id))
          : products.filter((candidate) => candidate.id === item.component_product_id);
        const categoryAllowed = item.metadata?.allowed_subcategory
          ? products.filter((candidate) => candidate.subcategory_name === item.metadata.allowed_subcategory)
          : allowed;
        const candidates = item.metadata?.allowed_subcategory ? categoryAllowed : allowed;
        return <div key={item.id} className="mt-5">
          <p className="font-exo font-bold">{item.component_name || (item.component_type === 'RENTAL' ? 'Renta' : 'Componente')}</p>
          {item.component_type === 'RENTAL'
            ? <input className="input mt-2" placeholder="UUID de sesión de renta" onChange={(event) => setChoices((current) => ({ ...current, [item.id]: { rental: { session_id: event.target.value, name: 'Renta incluida' } } }))} />
            : <select className="input mt-2" value={choices[item.id]?.product_id || item.component_product_id || ''} onChange={(event) => setChoices((current) => ({ ...current, [item.id]: { product_id: event.target.value } }))}>
              <option value="">Selecciona una opción</option>
              {candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
            </select>}
        </div>;
      })}
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 font-exo text-sm text-red-700">{error}</p>}
      <button onClick={addCombo} disabled={!combo} className="mt-8 w-full rounded-xl bg-brand-gold px-5 py-3 font-exo font-bold">Agregar combo · ${Number(product.sale_price).toFixed(2)}</button>
    </div>
  </div>;
}
