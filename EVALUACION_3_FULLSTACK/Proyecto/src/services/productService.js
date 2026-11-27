const defaultURL = import.meta.env?.DEV
  ? `${window.location.protocol}//${window.location.hostname}:8080`
  : window.location.origin;
const baseURL = (import.meta.env?.VITE_API_URL || defaultURL).replace(/\/$/, '');
let authorization = null;
let refreshPromise = null;
let generation = 0;

function sessionChanged(user) {
  window.dispatchEvent(new CustomEvent('vet:session', { detail: user }));
}

export function clearApiSession() { generation += 1; authorization = null; }

async function acceptSession(data, expectedGeneration) {
  if (expectedGeneration !== generation) throw new ApiError('La sesión cambió. Inicia sesión nuevamente.', 401);
  authorization = `Bearer ${data.accessToken}`;
  sessionChanged(data.user);
  return data.user;
}

export function restoreSession() {
  if (!refreshPromise) {
    const current = generation;
    const renew = async () => {
      try {
        const data = await request('/api/v1/auth/refresh', { method: 'POST', auth: null });
        return await acceptSession(data, current);
      } catch (error) {
        if (current === generation && (error.status === 401 || error.status === 403)) {
          clearApiSession(); sessionChanged(null);
        }
        throw error;
      }
    };
    // Serialize cookie rotation across tabs when Web Locks is available.
    refreshPromise = (globalThis.navigator?.locks
      ? navigator.locks.request('vet-refresh', renew) : renew()).finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export class ApiError extends Error {
  constructor(message, status = 0, fields = {}) {
    super(message); this.status = status; this.fields = fields;
  }
}

export async function request(path, { method = 'GET', body, auth = authorization, retry = true } = {}) {
  let response;
  try {
    response = await fetch(`${baseURL}${path}`, {
      method,
      credentials: path.startsWith('/api/v1/auth/') ? 'include' : 'omit',
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(auth ? { Authorization: auth } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new ApiError('No hubo respuesta del servidor. Comprueba que Spring Boot esté ejecutándose y que permita el origen del sitio (CORS).');
  }
  if (response.status === 401 && auth && retry) {
    await restoreSession();
    return request(path, { method, body, auth: authorization, retry: false });
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(data?.error || `El servidor respondió ${response.status}.`, response.status, data?.fields);
  return data;
}

export const ProductService = {
  getAll: () => request('/api/v1/products', { auth: null }),
  getById: (id) => request(`/api/v1/products/${encodeURIComponent(id)}`, { auth: null }),
  create: (product) => request('/api/v1/products', { method: 'POST', body: product }),
  update: (id, product) => request(`/api/v1/products/${encodeURIComponent(id)}`, { method: 'PUT', body: product }),
  remove: (id) => request(`/api/v1/products/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

export async function loginUser(email, password) {
  if (refreshPromise) await refreshPromise.catch(() => {});
  clearApiSession();
  const current = generation;
  const data = await request('/api/v1/auth/login', { method: 'POST', body: { email: email.trim().toLowerCase(), password }, auth: null });
  return acceptSession(data, current);
}
export async function logoutUser() {
  if (refreshPromise) await refreshPromise.catch(() => {});
  await request('/api/v1/auth/logout', { method: 'POST', auth: null });
  clearApiSession(); sessionChanged(null);
  const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('vet-session') : null;
  channel?.postMessage('logout'); channel?.close();
}
export const UserService = {
  register: (data) => request('/api/v1/auth/register', { method: 'POST', body: data, auth: null }),
  list: () => request('/api/v1/users'),
  create: (data) => request('/api/v1/users', { method: 'POST', body: data }),
  changeRole: (id, role) => request(`/api/v1/users/${encodeURIComponent(id)}/role`, { method: 'PUT', body: { role } }),
  remove: (id) => request(`/api/v1/users/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};


export const OrderService = {
  list: () => request('/api/v1/orders'),
  get: (id) => request(`/api/v1/orders/${encodeURIComponent(id)}`),
  create: (data) => request('/api/v1/orders', { method: 'POST', body: data }),
  update: (id, status) => request(`/api/v1/orders/${encodeURIComponent(id)}`, { method: 'PUT', body: { status } }),
  remove: (id) => request(`/api/v1/orders/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
