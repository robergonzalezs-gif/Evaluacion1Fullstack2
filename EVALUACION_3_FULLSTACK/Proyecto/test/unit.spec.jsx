import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ProductCard from '../src/components/ProductCard.jsx';
import ProductCatalog from '../src/components/ProductCatalog.jsx';
import AdminPanel from '../src/components/AdminPanel.jsx';
import { ContactForm, LoginForm, RegisterForm } from '../src/components/AuthForms.jsx';
import { addItem, cartSummary, changeQuantity } from '../src/utils/cart.js';
import { createDemoOrder } from '../src/utils/orders.js';
import { formatPrice, isAllowedEmail, isValidRun, validateLogin, validateProduct, validateRegistration } from '../src/utils/validation.js';

const product = { id: 'p1', code: 'ALI-001', name: 'Alimento perro', description: 'Bolsa mediana', category: 'Alimentos', price: 1000, stock: 3, critical: 1 };

describe('Validaciones de negocio', () => {
  it('1. acepta los dominios de correo definidos en el ERS', () => {
    expect(isAllowedEmail('alguien@duoc.cl')).toBeTrue();
    expect(isAllowedEmail('persona@profesor.duoc.cl')).toBeTrue();
    expect(isAllowedEmail('persona@gmail.com')).toBeTrue();
  });

  it('2. rechaza correos mal formados y dominios no permitidos', () => {
    expect(isAllowedEmail('persona@outlook.com')).toBeFalse();
    expect(isAllowedEmail('no-es-correo')).toBeFalse();
  });

  it('3. valida el RUN con su dígito verificador', () => {
    expect(isValidRun('190110222')).toBeTrue();
    expect(isValidRun('19011022K')).toBeFalse();
    expect(isValidRun('12-3')).toBeFalse();
  });

  it('4. acepta inicio de sesión válido y reporta campos inválidos', () => {
    expect(validateLogin({ email: 'a@gmail.com', password: 'prueba123' })).toEqual({});
    expect(validateLogin({ email: 'a@outlook.com', password: '1' }).email).toBeDefined();
    expect(validateLogin({ email: 'a@gmail.com', password: '1' }).password).toBeDefined();
  });

  it('5. exige datos de registro y acepta el RUN válido con datos completos', () => {
    const valid = { run: '190110222', name: 'Ana', lastName: 'Pérez', email: 'ana@gmail.com', password: 'prueba123', region: 'O’Higgins', commune: 'Rancagua', address: 'Calle 1' };
    expect(validateRegistration({}).run).toBeDefined();
    expect(validateRegistration(valid)).toEqual({});
    expect(validateRegistration({ ...valid, password: 'Prueba12345' })).toEqual({});
    expect(validateRegistration({ ...valid, password: '1234' }).password).toBeDefined();
    expect(validateRegistration({ ...valid, password: 'á'.repeat(40) }).password).toBeDefined();
  });

  it('6. admite producto gratis con stock entero y detecta duplicados o stock inválido', () => {
    expect(validateProduct({ ...product, price: 0 }, [])).toEqual({});
    expect(validateProduct({ ...product, stock: 1.5 }, []).stock).toBeDefined();
    expect(validateProduct({ ...product, id: 'p2' }, [product]).code).toBeDefined();
  });

  it('7. formatea precio cero como FREE y otros precios como CLP', () => {
    expect(formatPrice(0)).toBe('FREE');
    expect(formatPrice(1000)).toContain('1.000');
  });
});

describe('Carrito de compras', () => {
  it('8. añade un producto nuevo con una unidad', () => {
    expect(addItem([], product, 3)).toEqual([{ id: 'p1', quantity: 1 }]);
  });

  it('9. suma unidades existentes y no permite superar el stock', () => {
    const one = addItem([], product, 1);
    expect(addItem(one, product, 1)).toBe(one);
    expect(addItem([{ id: 'p1', quantity: 1 }], product, 3)).toEqual([{ id: 'p1', quantity: 2 }]);
  });

  it('10. actualiza cantidad, elimina al restar la última unidad y calcula total', () => {
    expect(changeQuantity([{ id: 'p1', quantity: 1 }], 'p1', -1, 3)).toEqual([]);
    expect(cartSummary([{ id: 'p1', quantity: 2 }], [product])).toEqual({ count: 2, total: 2000 });
  });

  it('11. crea una orden local con detalle y total, pero no para carrito vacío', () => {
    const order = createDemoOrder([{ id: 'p1', quantity: 2 }], [product], 'cliente@gmail.com', 0);
    expect(order.id).toBe('ORD-0');
    expect(order.customer).toBe('cliente@gmail.com');
    expect(order.items[0].name).toBe('Alimento perro');
    expect(order.total).toBe(2000);
    expect(createDemoOrder([], [product])).toBeNull();
  });
});

describe('Componente React ProductCard', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('12. muestra nombre, categoría y precio recibido por props', () => {
    act(() => root.render(<ProductCard product={product} onAdd={() => {}} />));
    expect(container.textContent).toContain('Alimento perro');
    expect(container.textContent).toContain('Alimentos');
    expect(container.textContent).toContain('1.000');
  });

  it('13. ejecuta el callback al añadir y bloquea productos agotados', () => {
    const onAdd = jasmine.createSpy('onAdd');
    act(() => root.render(<ProductCard product={product} onAdd={onAdd} />));
    act(() => container.querySelector('button').dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(onAdd).toHaveBeenCalledOnceWith(product);
    act(() => root.render(<ProductCard product={{ ...product, stock: 0 }} onAdd={onAdd} />));
    expect(container.querySelector('button').disabled).toBeTrue();
  });

  it('14. muestra la imagen configurada cuando el producto tiene URL', () => {
    act(() => root.render(<ProductCard product={{ ...product, image: 'https://example.test/product.png' }} onAdd={() => {}} />));
    expect(container.querySelector('.product-visual img').getAttribute('src')).toBe('https://example.test/product.png');
  });
});

describe('Componentes React de navegación y formularios', () => {
  let container;
  let root;
  const demoProducts = [product, { ...product, id: 'p2', name: 'Alimento gato', category: 'Salud' }];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('15. ProductCatalog filtra tarjetas por categoría', () => {
    act(() => root.render(<ProductCatalog products={demoProducts} onAdd={() => {}} />));
    expect(container.querySelectorAll('.product-card').length).toBe(2);
    const health = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Salud');
    act(() => health.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(container.querySelectorAll('.product-card').length).toBe(1);
    expect(container.textContent).toContain('Alimento gato');
  });

  it('16. LoginForm muestra mensajes cuando se envían datos vacíos', () => {
    act(() => root.render(<LoginForm users={[]} onLogin={() => {}} />));
    act(() => container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(container.querySelector('[role="alert"]').textContent).toContain('Revisa los datos');
    expect(container.textContent).toContain('Revisa los datos');
  });

  it('17. RegisterForm conecta comunas disponibles a la región elegida', () => {
    act(() => root.render(<RegisterForm users={[]} onRegister={() => {}} />));
    const selects = container.querySelectorAll('select');
    expect(selects[1].disabled).toBeTrue();
    act(() => { selects[0].value = 'O’Higgins'; selects[0].dispatchEvent(new Event('change', { bubbles: true })); });
    expect(selects[1].disabled).toBeFalse();
    expect([...selects[1].options].map((option) => option.textContent)).toContain('Rancagua');
  });

  it('18. AdminPanel niega el acceso al rol Cliente', () => {
    act(() => root.render(<AdminPanel user={{ name: 'Ana', role: 'Cliente' }} products={[]} setProducts={() => {}} users={[]} setUsers={() => {}} />));
    expect(container.textContent).toContain('Acceso restringido');
    expect(container.querySelector('table')).toBeNull();
  });

  it('19. ContactForm valida y muestra el estado de error accesible', () => {
    act(() => root.render(<ContactForm />));
    act(() => container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(container.querySelector('[role="alert"]').textContent).toContain('correo permitido');
  });
});

describe('Pruebas adicionales EP2: administración y búsqueda', () => {
  let container;
  let root;
  let setProducts;
  let setUsers;
  let deleteProduct;
  const admin = { id: 'u-admin', name: 'Administración', role: 'Administrador' };
  const seller = { id: 'u-seller', name: 'Vendedor', role: 'Vendedor' };
  const demoProducts = [product, { ...product, id: 'p2', code: 'ALI-002', name: 'Alimento gato', description: 'Bolsa pequeña', category: 'Salud' }];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    setProducts = jasmine.createSpy('saveProduct').and.resolveTo();
    deleteProduct = jasmine.createSpy('deleteProduct').and.resolveTo();
    setUsers = jasmine.createSpy('setUsers');
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function renderPanel({ user = admin, products = [product], users = [], orders = [] } = {}) {
    act(() => root.render(<AdminPanel user={user} products={products} onSaveProduct={setProducts} onDeleteProduct={deleteProduct} users={users} onChangeUserRole={setUsers} onDeleteUser={setUsers} orders={orders} />));
  }

  function clickButton(label) {
    const button = [...container.querySelectorAll('button')].find((item) => item.textContent.trim() === label);
    if (!button) throw new Error(`No se encontró el botón ${label}`);
    act(() => button.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  }

  function fillProductForm(form, overrides = {}) {
    const values = {
      code: 'ALI-NEW', name: 'Snack para gato', description: 'Premios de entrenamiento', category: 'Alimentos',
      image: '', price: '2500', stock: '8', critical: '2', ...overrides,
    };
    for (const [name, value] of Object.entries(values)) form.elements.namedItem(name).value = value;
  }

  function changeInputValue(input, value) {
    const setter = Object.getOwnPropertyDescriptor(input.constructor.prototype, 'value').set;
    setter.call(input, value);
    act(() => input.dispatchEvent(new Event('input', { bubbles: true })));
  }

  it('20. espera la confirmación del servidor antes de cerrar el formulario', async () => {
    renderPanel();
    clickButton('Agregar producto');
    const form = container.querySelector('form');
    fillProductForm(form);
    act(() => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));

    await act(async () => {});
    expect(setProducts).toHaveBeenCalledOnceWith(jasmine.objectContaining({ code: 'ALI-NEW', name: 'Snack para gato', price: 2500, stock: 8 }), false);
    expect(container.querySelector('[role="status"]').textContent).toBe('Producto guardado en el servidor.');
  });

  it('21. impide guardar un producto con código demasiado corto', () => {
    renderPanel();
    clickButton('Agregar producto');
    const form = container.querySelector('form');
    fillProductForm(form, { code: 'X' });
    act(() => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));

    expect(setProducts).not.toHaveBeenCalled();
    expect(container.textContent).toContain('El código debe tener al menos 3 caracteres.');
  });

  it('22. envía la actualización con el id existente', async () => {
    renderPanel();
    clickButton('Editar');
    const form = container.querySelector('form');
    fillProductForm(form, { code: product.code, name: 'Alimento perro actualizado' });
    act(() => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));

    await act(async () => {});
    expect(setProducts).toHaveBeenCalledOnceWith(jasmine.objectContaining({ id: product.id, name: 'Alimento perro actualizado' }), true);
  });

  it('23. pide confirmación antes de eliminar en el servidor', async () => {
    renderPanel({ products: demoProducts });
    clickButton('Eliminar');

    expect(deleteProduct).not.toHaveBeenCalled();
    clickButton('Confirmar eliminación');
    await act(async () => {});
    expect(deleteProduct).toHaveBeenCalledOnceWith(product);
  });

  it('24. permite al vendedor consultar productos, pero oculta controles de edición', () => {
    renderPanel({ user: seller });

    expect(container.textContent).toContain(product.code);
    expect(container.textContent).toContain(product.name);
    expect(container.textContent).not.toContain('Acciones');
    expect([...container.querySelectorAll('button')].some((button) => ['Agregar producto', 'Editar', 'Eliminar'].includes(button.textContent.trim()))).toBeFalse();
  });

  it('25. permite al vendedor abrir el detalle de una orden', () => {
    const order = {
      id: 'ORD-101', createdAt: '2026-10-20T10:00:00.000Z', customer: 'cliente@gmail.com',
      items: [{ id: product.id, name: product.name, quantity: 2, price: product.price }], total: 2000, status: 'Pendiente',
    };
    renderPanel({ user: seller, orders: [order] });
    clickButton('Órdenes');
    clickButton('Ver detalle');

    expect(container.textContent).toContain('Detalle ORD-101');
    expect(container.textContent).toContain('Alimento perro');
    expect(container.textContent).toContain('Total:');
  });

  it('26. cambia el rol de un usuario desde la tabla administrativa', async () => {
    const users = [{ id: 'u1', name: 'Ana', email: 'ana@gmail.com', role: 'Cliente' }];
    renderPanel({ users });
    clickButton('Usuarios');
    const select = container.querySelector('select');
    act(() => { select.value = 'Vendedor'; select.dispatchEvent(new Event('change', { bubbles: true })); });

    await act(async () => {});
    expect(setUsers).toHaveBeenCalledOnceWith('u1', 'Vendedor');
  });

  it('27. elimina un usuario desde la tabla administrativa', async () => {
    const users = [{ id: 'u1', name: 'Ana', email: 'ana@gmail.com', role: 'Cliente' }];
    renderPanel({ users });
    clickButton('Usuarios');
    spyOn(window, 'confirm').and.returnValue(true);
    clickButton('Eliminar');
    await act(async () => {});
    expect(setUsers).toHaveBeenCalledOnceWith('u1');
  });

  it('28. busca productos por texto incluido en su descripción', () => {
    act(() => root.render(<ProductCatalog products={demoProducts} onAdd={() => {}} />));
    const search = container.querySelector('input[type="search"]');
    changeInputValue(search, 'Bolsa pequeña');

    expect(container.querySelectorAll('.product-card').length).toBe(1);
    expect(container.textContent).toContain('Alimento gato');
  });

  it('29. informa cuando la búsqueda no encuentra productos', () => {
    act(() => root.render(<ProductCatalog products={demoProducts} onAdd={() => {}} />));
    const search = container.querySelector('input[type="search"]');
    changeInputValue(search, 'producto inexistente');

    expect(container.querySelectorAll('.product-card').length).toBe(0);
    expect(container.textContent).toContain('No encontramos productos con esos filtros.');
  });
});

// A rejected write must keep the draft available for retry.
describe('Errores del CRUD remoto', () => {
  it('conserva el formulario cuando el backend rechaza un guardado', async () => {
    const host = document.createElement('div'); document.body.appendChild(host);
    const root = createRoot(host);
    try {
      await act(async () => root.render(<AdminPanel user={{ role: 'Administrador' }} products={[]} users={[]} setUsers={() => {}} onSaveProduct={() => Promise.reject(new Error('Servidor no disponible'))} />));
      await act(async () => [...host.querySelectorAll('button')].find(b => b.textContent === 'Agregar producto').click());
      const form = host.querySelector('form');
      for (const [key, value] of Object.entries({ code: 'NEW', name: 'Prueba', price: '10', stock: '2', critical: '1' })) form.elements.namedItem(key).value = value;
      await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
      expect(host.querySelector('[role="alert"]').textContent).toContain('Servidor no disponible');
      expect(host.querySelector('form').elements.namedItem('name').value).toBe('Prueba');
      expect(host.querySelector('button[type="button"]').disabled).toBeFalse();
    } finally { await act(async () => root.unmount()); host.remove(); }
  });
});

