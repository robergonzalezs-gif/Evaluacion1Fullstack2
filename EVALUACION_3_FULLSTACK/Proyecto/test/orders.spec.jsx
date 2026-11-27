import { act } from 'react';
import { createRoot } from 'react-dom/client';
import CartPanel from '../src/components/CartPanel.jsx';
import OrdersPanel from '../src/components/OrdersPanel.jsx';
import SiteHeader from '../src/components/SiteHeader.jsx';
import { OrderService, clearApiSession, loginUser } from '../src/services/productService.js';

describe('Compra y gestión de órdenes', () => {
  let host, root;
  beforeEach(() => { host=document.createElement('div'); document.body.appendChild(host); root=createRoot(host); });
  afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
  const product={id:'p1',name:'Alimento',price:1500,stock:2};
  const button=(text) => [...host.querySelectorAll('button')].find(b => b.textContent.includes(text));
  it('abre el menú móvil y lo cierra al cambiar de ruta', async () => {
    await act(async () => root.render(<SiteHeader route="/" cartCount={0} />));
    const toggle=host.querySelector('[aria-label="Abrir navegación"]');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    await act(async () => toggle.click());
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelector('#site-nav-links').classList.contains('show')).toBeTrue();
    await act(async () => root.render(<SiteHeader route="/login" cartCount={0} />));
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });
  it('permite quitar un producto eliminado y bloquea la confirmación', async () => {
    const setCart=jasmine.createSpy('setCart');
    await act(async () => root.render(<CartPanel open cart={[{id:'missing',quantity:1}]} products={[]} setCart={setCart} user={{role:'Cliente'}} />));
    expect(host.textContent).toContain('Producto ya no disponible');
    expect(button('Confirmar orden').disabled).toBeTrue();
    await act(async () => button('Quitar producto').click());
    expect(setCart).toHaveBeenCalledWith([]);
  });
  it('bloquea cantidades superiores al stock y permite corregirlas', async () => {
    const setCart=jasmine.createSpy('setCart');
    await act(async () => root.render(<CartPanel open cart={[{id:'p1',quantity:3}]} products={[product]} setCart={setCart} user={{role:'Cliente'}} />));
    expect(button('Confirmar orden').disabled).toBeTrue();
    await act(async () => host.querySelector('[aria-label="Restar"]').click());
    expect(setCart).toHaveBeenCalledWith([{id:'p1',quantity:2}]);
  });
  it('impide modificar o cerrar el carrito mientras se confirma', async () => {
    await act(async () => root.render(<CartPanel open busy cart={[{id:'p1',quantity:1}]} products={[product]} user={{role:'Cliente'}} />));
    expect([...host.querySelectorAll('button')].every(b => b.disabled)).toBeTrue();
  });
  it('mantiene la orden y muestra el error si falla la cancelación', async () => {
    spyOn(window,'confirm').and.returnValue(true);
    const onUpdate=jasmine.createSpy('update').and.rejectWith(new Error('Sin conexión'));
    await act(async () => root.render(<OrdersPanel admin orders={[{id:'ORD-1',createdAt:'2026-11-23',customer:'QA',total:1500,status:'CONFIRMADA',items:[]}]} onUpdate={onUpdate} />));
    await act(async () => button('Cancelar orden').click());
    expect(host.textContent).toContain('Sin conexión');
    expect(host.textContent).toContain('CONFIRMADA');
    expect(button('Cancelar orden').disabled).toBeFalse();
  });
  it('conserva el identificador del pedido al renovar la sesión y reintentar', async () => {
    const original=globalThis.fetch;
    const response=(status,data) => ({status,ok:status<400,json:async () => data});
    try {
      globalThis.fetch=jasmine.createSpy('fetch').and.resolveTo(response(200,{accessToken:'old',user:{role:'Cliente'}}));
      await loginUser('qa@gmail.com','test1234'); fetch.calls.reset();
      fetch.and.returnValues(Promise.resolve(response(401,{})),Promise.resolve(response(200,{accessToken:'new',user:{role:'Cliente'}})),Promise.resolve(response(201,{id:'ORD-1'})));
      const data={requestId:'request-key',items:[{id:'p1',quantity:1}]};
      expect((await OrderService.create(data)).id).toBe('ORD-1');
      expect(JSON.parse(fetch.calls.argsFor(0)[1].body)).toEqual(data);
      expect(JSON.parse(fetch.calls.argsFor(2)[1].body)).toEqual(data);
      expect(fetch.calls.argsFor(2)[1].headers.Authorization).toBe('Bearer new');
    } finally { globalThis.fetch=original; clearApiSession(); }
  });
});
