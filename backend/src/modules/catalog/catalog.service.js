import { AppError } from '../../shared/errors.js';
import * as repository from './catalog.repository.js';

function unique(values) {
  return [...new Set(values)];
}

export async function validateProductModifiers(productId, selectedModifiersArray = [], client) {
  const selected = selectedModifiersArray.map((group) => ({
    modifier_id: group.modifier_id,
    option_ids: unique(group.option_ids || [])
  }));
  const groups = await repository.findModifiers(productId, client);
  const selectedGroupIds = new Set(selected.map((group) => group.modifier_id));
  const validated = [];
  let additionalTotal = 0;

  for (const group of groups.filter((item) => item.is_active)) {
    const selection = selected.find((item) => item.modifier_id === group.id);
    const optionIds = selection?.option_ids || [];
    const min = Math.max(Number(group.min_selections), group.required ? 1 : 0);
    if (optionIds.length < min || optionIds.length > Number(group.max_selections)) {
      throw new AppError(
        `El modificador ${group.name} requiere entre ${min} y ${group.max_selections} opciones.`,
        400
      );
    }
    if (!optionIds.length) continue;

    const options = await repository.findSelectedOptions(productId, optionIds, client);
    const groupOptions = options.filter((option) => option.modifier_id === group.id);
    if (groupOptions.length !== optionIds.length) {
      throw new AppError(`Una opción seleccionada no pertenece al modificador ${group.name}.`, 400);
    }
    additionalTotal += groupOptions.reduce((sum, option) => sum + Number(option.price_delta), 0);
    validated.push({
      modifier_id: group.id,
      name: group.name,
      options: groupOptions.map((option) => ({
        id: option.option_id,
        name: option.option_name,
        price_delta: Number(option.price_delta)
      }))
    });
  }

  if (selected.some((selection) => !groups.some((group) => group.id === selection.modifier_id))) {
    throw new AppError('Se recibió un modificador no permitido para este producto.', 400);
  }
  return { modifiers: validated, additionalTotal };
}

export async function processComboSelection(comboId, selectedComponentsArray = [], client) {
  const combo = await repository.findCombo(comboId);
  if (!combo) throw new AppError('Combo no encontrado o inactivo.', 404);
  const selections = selectedComponentsArray.map((item) => item);
  const componentIds = new Set(combo.items.map((item) => item.id));
  if (selections.some((item) => !componentIds.has(item.combo_item_id))) {
    throw new AppError('La selección contiene un componente que no pertenece al combo.', 400);
  }
  const lines = [];
  let total = Number(combo.sale_price);

  for (const component of combo.items) {
    const selected = selections.find((item) => item.combo_item_id === component.id);
    const productId = selected?.product_id || component.component_product_id;
    if (component.component_type === 'RENTAL') {
      if (!selected?.rental?.session_id) {
        throw new AppError('Falta seleccionar una sesión para el componente de renta.', 400);
      }
      lines.push({
        product_id: null,
        rental_session_id: selected.rental.session_id,
        item_type: 'COMBO_COMPONENT',
        name_snapshot: selected.rental.name || 'Renta incluida',
        quantity: component.quantity,
        unit_price: 0,
        line_total: 0,
        kds_status: 'NOT_REQUIRED',
        is_kds_visible: false,
        modifiers: []
      });
      continue;
    }
    const allowedProductIds = Array.isArray(component.metadata?.allowed_product_ids)
      ? component.metadata.allowed_product_ids
      : [component.component_product_id];
    if (!productId || !allowedProductIds.includes(productId)) {
      throw new AppError('El producto seleccionado no está permitido en este componente del combo.', 400);
    }
    const product = await repository.findProductForOrder(productId, client);
    if (!product) throw new AppError('Un componente del combo no existe o está inactivo.', 400);
    const modifierResult = await validateProductModifiers(
      product.id, selected?.modifiers || [], client
    );
    const quantity = Number(selected?.quantity || component.quantity);
    const extra = modifierResult.additionalTotal * quantity;
    total += extra;
    lines.push({
      product_id: product.id,
      item_type: 'COMBO_COMPONENT',
      name_snapshot: product.name,
      quantity,
      unit_price: 0,
      line_total: 0,
      kds_status: 'PENDING',
      is_kds_visible: true,
      modifiers: modifierResult.modifiers
    });
  }

  return {
    combo,
    total: Number(total.toFixed(2)),
    lines: [{
      product_id: combo.id,
      item_type: 'COMBO',
      name_snapshot: combo.name,
      quantity: 1,
      unit_price: Number(total.toFixed(2)),
      line_total: Number(total.toFixed(2)),
      kds_status: 'NOT_REQUIRED',
      is_kds_visible: false,
      modifiers: []
    }, ...lines]
  };
}
