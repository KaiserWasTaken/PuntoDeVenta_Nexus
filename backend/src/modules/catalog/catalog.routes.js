import { Router } from 'express';
import * as controller from './catalog.controller.js';
import { authenticate, authorize } from '../../shared/auth.js';

export const catalogRoutes = Router();
catalogRoutes.use(authenticate);
catalogRoutes.get('/categorias', controller.categories);
catalogRoutes.post('/categorias', authorize('admin', 'manager'), controller.createCategory);
catalogRoutes.post('/subcategorias', authorize('admin', 'manager'), controller.createSubcategory);
catalogRoutes.patch('/categorias/:id', authorize('admin', 'manager'), controller.updateCategory);
catalogRoutes.delete('/categorias/:id', authorize('admin', 'manager'), controller.deleteCategory);
catalogRoutes.get('/productos', controller.products);
catalogRoutes.get('/productos/:id', controller.product);
catalogRoutes.post('/productos', authorize('admin', 'manager'), controller.createProduct);
catalogRoutes.patch('/productos/:id', authorize('admin', 'manager'), controller.updateProduct);
catalogRoutes.delete('/productos/:id', authorize('admin', 'manager'), controller.deleteProduct);
catalogRoutes.get('/productos/:id/modificadores', controller.modifiers);
catalogRoutes.post('/modificadores', authorize('admin', 'manager'), controller.createModifier);
catalogRoutes.get('/combos/:id', controller.combo);
