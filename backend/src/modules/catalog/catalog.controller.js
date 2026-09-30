import { z } from 'zod';
import { asyncHandler } from '../../shared/asyncHandler.js';
import * as repository from './catalog.repository.js';

const id = z.string().uuid();
const categorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  sort_order: z.number().int().nonnegative().default(0)
});
const subcategorySchema = z.object({
  category_id: id,
  name: z.string().trim().min(1).max(120),
  sort_order: z.number().int().nonnegative().default(0)
});
const productSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).nullable().optional(),
  product_type: z.enum(['individual', 'combo']).default('individual'),
  sale_price: z.number().nonnegative(),
  category_id: id.nullable().optional(),
  subcategory_id: id.nullable().optional(),
  sku: z.string().trim().max(80).nullable().optional()
});
const modifierSchema = z.object({
  product_id: id,
  name: z.string().trim().min(1).max(120),
  required: z.boolean().default(false),
  min_selections: z.number().int().nonnegative().default(0),
  max_selections: z.number().int().positive().default(1),
  sort_order: z.number().int().nonnegative().default(0),
  options: z.array(z.object({
    name: z.string().trim().min(1).max(120),
    price_delta: z.number().nonnegative()
  })).min(1)
}).superRefine((data, context) => {
  if (data.min_selections > data.max_selections) {
    context.addIssue({ code: 'custom', path: ['min_selections'], message: 'No puede superar max_selections.' });
  }
});

export const categories = asyncHandler(async (_request, response) => {
  response.json({ data: await repository.listCategories() });
});
export const createCategory = asyncHandler(async (request, response) => {
  response.status(201).json({ data: await repository.createCategory(categorySchema.parse(request.body)) });
});
export const createSubcategory = asyncHandler(async (request, response) => {
  response.status(201).json({
    data: await repository.createSubcategory(subcategorySchema.parse(request.body))
  });
});
export const updateCategory = asyncHandler(async (request, response) => {
  const result = await repository.updateCategory(id.parse(request.params.id), categorySchema.partial().parse(request.body));
  if (!result) return response.status(404).json({ error: 'Categoría no encontrada.' });
  return response.json({ data: result });
});
export const deleteCategory = asyncHandler(async (request, response) => {
  const result = await repository.deactivateCategory(id.parse(request.params.id));
  if (!result) return response.status(404).json({ error: 'Categoría no encontrada.' });
  return response.json({ data: result });
});
export const products = asyncHandler(async (request, response) => {
  const query = z.object({
    category_id: id.optional(),
    subcategory_id: id.optional(),
    is_active: z.enum(['true', 'false']).transform((value) => value === 'true').optional()
  }).parse(request.query);
  response.json({ data: await repository.listProducts(query) });
});
export const product = asyncHandler(async (request, response) => {
  const productId = id.parse(request.params.id);
  const result = await repository.findProduct(productId);
  if (!result) return response.status(404).json({ error: 'Producto no encontrado.' });
  const [modifiers, recipe] = await Promise.all([
    repository.findModifiers(productId),
    repository.findRecipe(productId)
  ]);
  return response.json({ data: { ...result, modifiers, recipe } });
});
export const createProduct = asyncHandler(async (request, response) => {
  response.status(201).json({ data: await repository.createProduct(productSchema.parse(request.body)) });
});
export const updateProduct = asyncHandler(async (request, response) => {
  const result = await repository.updateProduct(id.parse(request.params.id), productSchema.partial().parse(request.body));
  if (!result) return response.status(404).json({ error: 'Producto no encontrado.' });
  return response.json({ data: result });
});
export const deleteProduct = asyncHandler(async (request, response) => {
  const result = await repository.deactivateProduct(id.parse(request.params.id));
  if (!result) return response.status(404).json({ error: 'Producto no encontrado.' });
  return response.json({ data: result });
});
export const modifiers = asyncHandler(async (request, response) => {
  response.json({ data: await repository.findModifiers(id.parse(request.params.id)) });
});
export const createModifier = asyncHandler(async (request, response) => {
  response.status(201).json({ data: await repository.createModifier(modifierSchema.parse(request.body)) });
});
export const combo = asyncHandler(async (request, response) => {
  const result = await repository.findCombo(id.parse(request.params.id));
  if (!result) return response.status(404).json({ error: 'Combo no encontrado.' });
  return response.json({ data: result });
});
