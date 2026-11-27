import { useEffect, useMemo, useState } from 'react';
import { addItem, cartSummary } from './utils/cart.js';
import { ProductService, UserService, OrderService, clearApiSession, restoreSession, logoutUser } from './services/productService.js';
import OrdersPanel from './components/OrdersPanel.jsx';
import Dinobox from './components/Dinobox.jsx';
import ProductCatalog from './components/ProductCatalog.jsx';
import CartPanel from './components/CartPanel.jsx';
import SiteHeader from './components/SiteHeader.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import { ContactForm, LoginForm, RegisterForm } from './components/AuthForms.jsx';

const keys = { products: 'vet_products_v2', users: 'vet_users_v2', cart: 'vet_cart_v2', orders: 'vet_orders_v2', session: 'vet_session_v2' };
function load(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; } catch { return fallback; }
}

export default function App() {
  const [route, setRoute] = useState(window.location.hash.slice(1) || '/');
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [cart, setCartState] = useState(() => load(keys.cart, []));
  const [orders, setOrders] = useState([]);
  const [orderError, setOrderError] = useState('');
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutKey, setCheckoutKey] = useState(() => load('vet_checkout_key', null));
  const [user, setUser] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [notice, setNotice] = useState('');
  async function recoverSession() {
    setSessionLoading(true); setSessionError('');
    try { setUser(await restoreSession()); }
    catch (error) { if (error.status !== 401 && error.status !== 403) setSessionError(error.message); }
    finally { setSessionLoading(false); }
  }
  useEffect(() => {
    // Remove legacy demo credentials instead of silently migrating plaintext passwords.
    localStorage.removeItem(keys.users); localStorage.removeItem(keys.session);
    const changed = (event) => { setUser(event.detail); setUsers([]); if (!event.detail) { setCartOpen(false); setOrders([]); } };
    window.addEventListener('vet:session', changed);
    const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('vet-session') : null;
    if (channel) channel.onmessage = () => { clearApiSession(); setUser(null); setUsers([]); };
    recoverSession();
    return () => { window.removeEventListener('vet:session', changed); channel?.close(); };
  }, []);
  useEffect(() => {
    if (!user) return;
    const verify = () => restoreSession().catch(() => {});
    const timer = setInterval(verify, 10 * 60 * 1000);
    window.addEventListener('focus', verify);
    return () => { clearInterval(timer); window.removeEventListener('focus', verify); };
  }, [user?.id]);
  useEffect(() => {
    let active = true;
    if (user?.role === 'Administrador') UserService.list().then(list => { if (active) setUsers(list); }).catch(error => { if (active) setNotice(error.message); });
    else setUsers([]);
    return () => { active = false; };
  }, [user]);
  useEffect(() => {
    let active = true;
    setOrders([]); setOrderError('');
    if (user) OrderService.list().then(list => { if (active) setOrders(list); }).catch(error => { if (active) setOrderError(error.message); });
    return () => { active = false; };
  }, [user, route]);
  async function reloadOrders() {
    setOrderError('');
    try { setOrders(await OrderService.list()); } catch (error) { setOrderError(error.message); }
  }
  async function changeOrder(id, status) {
    await OrderService.update(id, status); await reloadOrders(); await loadProducts();
  }
  async function deleteOrder(id) { await OrderService.remove(id); await reloadOrders(); }
  const cartCount = useMemo(() => cartSummary(cart, products).count, [cart, products]);

  useEffect(() => {
    const onRoute = () => setRoute(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', onRoute);
    return () => window.removeEventListener('hashchange', onRoute);
  }, []);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  async function loadProducts() {
    setLoading(true);
    try { setProducts(await ProductService.getAll()); setApiError(''); }
    catch (error) { setApiError(error.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadProducts(); }, []);
  async function saveProduct(product, editing) {
    const saved = editing ? await ProductService.update(product.id, product) : await ProductService.create(product);
    setProducts(previous => editing ? previous.map(p => p.id === saved.id ? saved : p) : [...previous, saved]);
    await loadProducts();
  }
  async function deleteProduct(product) {
    await ProductService.remove(product.id);
    setProducts(previous => previous.filter(p => p.id !== product.id));
    setCartState(previous => previous.filter(p => p.id !== product.id));
    await loadProducts();
  }
  useEffect(() => { localStorage.setItem(keys.cart, JSON.stringify(cart)); }, [cart]);
  // Legacy local orders remain untouched but are never used as server records.
  useEffect(() => { localStorage.removeItem(keys.session); }, []);

  function addProduct(product) {
    const next = addItem(cart, product, product.stock);
    if (next === cart) setNotice(product.stock < 1 ? 'Este producto está agotado.' : 'No hay más unidades disponibles.');
    else updateCart(next);
  }
  async function register(newUser, adminMode) {
    if (adminMode) { await UserService.create(newUser); setUsers(await UserService.list()); }
    else await UserService.register(newUser);
  }
  async function changeUserRole(id, role) {
    await UserService.changeRole(id, role); setUsers(await UserService.list());
  }
  async function deleteUser(id) {
    await UserService.remove(id); setUsers(await UserService.list());
  }
  function login(selectedUser) { setUser({ id: selectedUser.id, name: selectedUser.name || `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim(), email: selectedUser.email, role: selectedUser.role }); window.location.hash = selectedUser.role === 'Cliente' ? '/' : '/admin'; }
  async function logout() {
    try { await logoutUser(); setUser(null); setUsers([]); window.location.hash = '/'; }
    catch (error) { setNotice(`No se pudo cerrar la sesión. ${error.message}`); }
  }
  function updateCart(next) {
    setCartState(next); setCheckoutKey(null); localStorage.removeItem('vet_checkout_key'); setCheckoutError('');
  }
  async function placeOrder() {
    if (checkoutBusy || !cart.length) return;
    if (!user) { setCartOpen(false); window.location.hash='/login'; return; }
    setCheckoutBusy(true); setCheckoutError('');
    const key=checkoutKey || crypto.randomUUID();
    setCheckoutKey(key); localStorage.setItem('vet_checkout_key',JSON.stringify(key));
    try {
      const order=await OrderService.create({ requestId:key, items:cart.map(({ id,quantity }) => ({ id,quantity })) });
      setOrders(previous => [order,...previous.filter(o => o.id!==order.id)]);
      updateCart([]); setCartOpen(false);
      setNotice(`Orden ${order.id} confirmada. Se actualizó el stock. No se realizó ningún cobro.`);
      await loadProducts();
    } catch (error) { setCheckoutError(error.message); }
    finally { setCheckoutBusy(false); }
  }

  let page;
  if (sessionLoading) page = <main className="container py-5" role="status">Comprobando sesión…</main>;
  else if (sessionError) page = <main className="container py-5"><p role="alert">{sessionError}</p><button className="btn btn-success" onClick={recoverSession}>Reintentar conexión</button></main>;
  else if (user?.role === 'Vendedor' && route !== '/admin') page = <main className="container py-5"><h1 className="h3">Acceso restringido</h1><a href="#/admin">Ir a productos y órdenes</a></main>;
  else if (route === '/mis-ordenes') page = user ? <main className="container py-5"><OrdersPanel orders={orders} error={orderError} onReload={reloadOrders} /></main> : <LoginForm onLogin={login} />;
  else if (route === '/dinobox') page = <Dinobox key={user?.id || 'public'} user={user} />;
  else if (route === '/login') page = <LoginForm users={users} onLogin={login} />;
  else if (route === '/registro') page = <RegisterForm users={users} onRegister={register} />;
  else if (route === '/registro-admin') page = user?.role === 'Administrador' ? <RegisterForm users={users} onRegister={register} adminMode /> : <AdminPanel key={user?.id || 'guest'} user={user} products={products} onSaveProduct={saveProduct} onDeleteProduct={deleteProduct} users={users} onChangeUserRole={changeUserRole} onDeleteUser={deleteUser} orders={orders} orderError={orderError} onReloadOrders={reloadOrders} onUpdateOrder={changeOrder} onDeleteOrder={deleteOrder} />;
  else if (route === '/contacto') page = <ContactForm />;
  else if (route === '/admin') page = <AdminPanel key={user?.id || 'guest'} user={user} products={products} onSaveProduct={saveProduct} onDeleteProduct={deleteProduct} users={users} onChangeUserRole={changeUserRole} onDeleteUser={deleteUser} orders={orders} orderError={orderError} onReloadOrders={reloadOrders} onUpdateOrder={changeOrder} onDeleteOrder={deleteOrder} />;
  else if (route === '/nosotros') page = <main className="container narrow py-5"><p className="eyebrow">Nuestra clínica</p><h1 className="display-5 fw-bold">Cuidamos a quienes hacen parte de tu familia.</h1><section className="card border-0 shadow-sm p-4 p-md-5 mt-4"><h2 className="h3">Veterinaria San Marcos</h2><p className="text-secondary">Somos un equipo veterinario de Rancagua comprometido con el bienestar de perros, gatos y otras mascotas. Combinamos atención cercana, prevención y orientación para sus familias.</p><h2 className="h3 mt-3">Nuestra misión</h2><p className="text-secondary">Acompañar a cada familia con atención responsable y productos confiables para cada etapa de vida.</p><h2 className="h3 mt-3">Cómo trabajamos</h2><p className="text-secondary">Escuchamos, evaluamos las necesidades de cada mascota y entregamos recomendaciones claras. Esta tienda es una demostración y no procesa pagos.</p></section></main>;
  else if (route === '/consejos') page = <main className="container py-5"><p className="eyebrow">Blog veterinario</p><h1 className="display-5 fw-bold mb-4">Consejos para su bienestar</h1><div className="row g-4">{[['💉','Vacunas al día','Conversa con tu veterinario para mantener el calendario adecuado para la edad y estilo de vida de tu mascota.'],['🥣','Alimentación','El alimento ideal depende de especie, edad, peso y salud. Haz cambios graduales y consulta si tienes dudas.'],['🦷','Higiene dental','La revisión periódica permite detectar molestias temprano. Pide orientación profesional sobre cuidados en casa.']].map(([icon,title,description])=><div className="col-md-4" key={title}><article className="card border-0 shadow-sm p-4 h-100"><span className="display-4">{icon}</span><h2 className="h4 mt-3">{title}</h2><p className="text-secondary">{description}</p></article></div>)}</div></main>;
  else page = <main className="container"><section className="hero-section row align-items-center g-4"><div className="col-lg-7"><p className="eyebrow">Cuidado para cada etapa</p><h1 className="display-3 fw-bold">Todo para una vida más sana y feliz.</h1><p className="lead text-secondary">Productos seleccionados por nuestro equipo veterinario para perros, gatos y más.</p><a className="btn btn-success btn-lg" href="#catalogo">Explorar productos</a></div><div className="col-lg-5 text-center hero-illustration" aria-hidden="true">🐕</div></section><ProductCatalog products={products} onAdd={addProduct} /><section className="promo-section p-4 p-md-5 rounded-4 my-5 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3"><div><p className="eyebrow mb-1">¿Aún no tienes cuenta?</p><h2 className="h3 fw-bold">Crea tu perfil para una experiencia más simple</h2><p className="mb-0">Crea tu cuenta para acceder a la tienda.</p></div><a className="btn btn-light text-success fw-semibold" href="#/registro">Crear cuenta</a></section></main>;

  return <><SiteHeader route={route} user={user} cartCount={cartCount} onOpenCart={() => setCartOpen(true)} onLogout={logout} />{loading && <p className="container mt-3" role="status">Cargando catálogo del servidor…</p>}{apiError && <div className="container mt-3"><div className="alert alert-danger" role="alert">{apiError} <button className="btn btn-outline-danger btn-sm" onClick={loadProducts} disabled={loading}>Reintentar</button></div></div>}{page}<SiteFooter /><CartPanel open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} setCart={updateCart} busy={checkoutBusy} error={checkoutError} user={user} products={products} onCheckout={placeOrder} />{notice && <div className="notice-backdrop" role="presentation" onClick={() => setNotice('')}><div className="alert alert-info notice-card shadow" role="alertdialog" aria-modal="true"><button type="button" className="btn-close float-end" aria-label="Cerrar" onClick={() => setNotice('')} /><h2 className="h5">Aviso</h2><p className="mb-0">{notice}</p></div></div>}</>;
}


