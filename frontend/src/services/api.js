import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 8000
});

export function getAccessToken() {
  return window.localStorage.getItem('nexus_access_token');
}

export function saveAccessToken(token) {
  window.localStorage.setItem('nexus_access_token', token);
}

export function clearAccessToken() {
  window.localStorage.removeItem('nexus_access_token');
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function login(credentials) {
  const { data } = await api.post('/auth/login', credentials);
  saveAccessToken(data.data.token);
  return data.data.user;
}

export async function getConsoles() {
  const { data } = await api.get('/consolas');
  return data.data;
}

export async function getActiveSessions() {
  const { data } = await api.get('/sesiones/activas');
  return data.data;
}

export async function startSession(payload) {
  const { data } = await api.post('/sesiones/iniciar', payload);
  return data.data;
}

export async function pauseSession(id) {
  const { data } = await api.post(`/sesiones/${id}/pausar`);
  return data.data;
}

export async function resumeSession(id) {
  const { data } = await api.post(`/sesiones/${id}/reanudar`);
  return data.data;
}

export async function extendSession(id, minutes) {
  const { data } = await api.post(`/sesiones/${id}/extender`, { minutos: minutes });
  return data.data;
}

export async function finishSession(id) {
  const { data } = await api.post(`/sesiones/${id}/finalizar`);
  return data.data;
}

export async function getCategories() {
  const { data } = await api.get('/catalogo/categorias');
  return data.data;
}

export async function getProducts(filters = {}) {
  const { data } = await api.get('/catalogo/productos', { params: filters });
  return data.data;
}

export async function getProductModifiers(id) {
  const { data } = await api.get(`/catalogo/productos/${id}/modificadores`);
  return data.data;
}

export async function getCombo(id) {
  const { data } = await api.get(`/catalogo/combos/${id}`);
  return data.data;
}

export async function createOrder(payload) {
  const { data } = await api.post('/ordenes', payload);
  return data.data;
}

export async function payOrder(id, paymentMethod) {
  const { data } = await api.post(`/ordenes/${id}/pagar`, {
    payment_method: paymentMethod
  });
  return data.data;
}

export async function getKdsOrders() {
  const { data } = await api.get('/ordenes/kds');
  return data.data;
}

export async function updateKdsItem(id, status) {
  const { data } = await api.patch(`/ordenes/kds/${id}`, { status });
  return data.data;
}

export async function getActiveMetrics() {
  const { data } = await api.get('/reportes/metricas-activas');
  return data.data;
}

export async function closeDay(reportDate) {
  const { data } = await api.post('/reportes/cerrar', { report_date: reportDate });
  return data.data;
}

export async function getDailyReports() {
  const { data } = await api.get('/reportes/historial');
  return data.data;
}

export async function getOrders() {
  const { data } = await api.get('/ordenes');
  return data.data;
}

export async function getInventory() {
  const { data } = await api.get('/inventario/insumos');
  return data.data;
}

export async function updateInventory(id, payload) {
  const { data } = await api.patch(`/inventario/insumos/${id}`, payload);
  return data.data;
}

export async function createProduct(payload) {
  const { data } = await api.post('/catalogo/productos', payload);
  return data.data;
}

export async function updateProduct(id, payload) {
  const { data } = await api.patch(`/catalogo/productos/${id}`, payload);
  return data.data;
}
