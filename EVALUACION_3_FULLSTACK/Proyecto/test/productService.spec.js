import { ProductService, loginUser, clearApiSession, restoreSession, logoutUser } from '../src/services/productService.js';

describe('Contrato HTTP del servicio de productos', () => {
  let originalFetch;
  beforeEach(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = jasmine.createSpy('fetch');
    clearApiSession();
  });
  afterEach(() => { globalThis.fetch = originalFetch; clearApiSession(); });
  const response = (status, data) => ({ status, ok: status < 400, json: async () => data });

  it('consulta el catálogo sin enviar credenciales', async () => {
    fetch.and.resolveTo(response(200, [{ id: 'p1' }]));
    expect(await ProductService.getAll()).toEqual([{ id: 'p1' }]);
    expect(fetch.calls.mostRecent().args[0]).toContain('/api/v1/products');
    expect(fetch.calls.mostRecent().args[1].headers.Authorization).toBeUndefined();
  });
  it('envía POST y PUT con JSON y autorización después de validar la sesión', async () => {
    fetch.and.resolveTo(response(200, { accessToken: 'signed-token', user: { role: 'Administrador' } }));
    await loginUser('admin@gmail.com', 'admin123');
    fetch.and.resolveTo(response(201, { id: 'p1' }));
    await ProductService.create({ name: 'Producto' });
    const options = fetch.calls.mostRecent().args[1];
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ name: 'Producto' });
    expect(options.headers.Authorization).toBe('Bearer signed-token');
    await ProductService.update('p1', { name: 'Editado' });
    expect(fetch.calls.mostRecent().args[1].method).toBe('PUT');
  });
  it('acepta DELETE 204 sin intentar leer JSON', async () => {
    const json = jasmine.createSpy('json');
    fetch.and.resolveTo({ status: 204, ok: true, json });
    expect(await ProductService.remove('p1')).toBeNull();
    expect(json).not.toHaveBeenCalled();
  });
  it('conserva el estado HTTP y errores por campo', async () => {
    fetch.and.resolveTo(response(400, { error: 'Datos inválidos', fields: { stock: 'No negativo' } }));
    try { await ProductService.create({}); fail('Debió rechazar'); }
    catch (error) { expect(error.status).toBe(400); expect(error.fields.stock).toBe('No negativo'); }
  });
  it('distingue una caída de red de un error HTTP', async () => {
    fetch.and.rejectWith(new TypeError('Failed to fetch'));
    await expectAsync(ProductService.getAll()).toBeRejectedWithError(/No hubo respuesta/);
  });
  it('borra las credenciales al cerrar sesión', async () => {
    fetch.and.resolveTo(response(200, { accessToken: 'signed-token', user: { role: 'Administrador' } }));
    await loginUser('admin@gmail.com', 'admin123'); clearApiSession();
    await ProductService.create({});
    expect(fetch.calls.mostRecent().args[1].headers.Authorization).toBeUndefined();
  });
  it('restaura la sesión con cookie sin persistir tokens ni contraseñas en localStorage', async () => {
    const write = spyOn(Storage.prototype, 'setItem');
    fetch.and.resolveTo(response(200, { accessToken: 'restored', user: { id: 'u1', role: 'Cliente' } }));
    expect((await restoreSession()).id).toBe('u1');
    const [url, options] = fetch.calls.mostRecent().args;
    expect(url).toContain('/api/v1/auth/refresh');
    expect(options.credentials).toBe('include'); expect(options.headers.Authorization).toBeUndefined();
    expect(write).not.toHaveBeenCalled();
  });
  it('renueva una sola vez y reintenta la escritura cuando vence el JWT', async () => {
    fetch.and.resolveTo(response(200, { accessToken: 'old', user: { role: 'Administrador' } }));
    await loginUser('admin@gmail.com', 'admin123');
    fetch.calls.reset();
    fetch.and.returnValues(Promise.resolve(response(401, {})),
      Promise.resolve(response(200, { accessToken: 'new', user: { role: 'Administrador' } })),
      Promise.resolve(response(201, { id: 'p1' })));
    expect((await ProductService.create({ name: 'Producto' })).id).toBe('p1');
    expect(fetch.calls.count()).toBe(3);
    expect(fetch.calls.mostRecent().args[1].headers.Authorization).toBe('Bearer new');
  });
  it('no reintenta una operación prohibida por rol', async () => {
    fetch.and.resolveTo(response(403, { error: 'Sin permisos' }));
    await expectAsync(ProductService.create({})).toBeRejectedWithError('Sin permisos');
    expect(fetch.calls.count()).toBe(1);
  });
  it('rechaza renovación vencida y limpia el estado autenticado', async () => {
    fetch.and.resolveTo(response(200, { accessToken: 'old', user: { role: 'Administrador' } }));
    await loginUser('admin@gmail.com', 'admin123');
    fetch.and.resolveTo(response(401, { error: 'Sesión vencida' }));
    await expectAsync(restoreSession()).toBeRejected();
    fetch.and.resolveTo(response(201, {})); await ProductService.create({});
    expect(fetch.calls.mostRecent().args[1].headers.Authorization).toBeUndefined();
  });
  it('cierra la sesión en el servidor antes de limpiar el token', async () => {
    fetch.and.resolveTo(response(200, { accessToken: 'old', user: { role: 'Administrador' } }));
    await loginUser('admin@gmail.com', 'admin123');
    fetch.and.resolveTo(response(204, null)); await logoutUser();
    expect(fetch.calls.mostRecent().args[0]).toContain('/api/v1/auth/logout');
    expect(fetch.calls.mostRecent().args[1].credentials).toBe('include');
    fetch.and.resolveTo(response(201, {})); await ProductService.create({});
    expect(fetch.calls.mostRecent().args[1].headers.Authorization).toBeUndefined();
  });
});

