import { useEffect, useMemo, useState } from 'react';
import { seedProducts, initialUsers } from './data/products.js';
import { addItem, cartSummary } from './utils/cart.js';
import { createDemoOrder } from './utils/orders.js';
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
  const [products, setProducts] = useState(() => load(keys.products, seedProducts));
  const [users, setUsers] = useState(() => {
    const existing = load(keys.users, []);
    return existing.length ? existing : initialUsers;
  });
  const [cart, setCartState] = useState(() => load(keys.cart, []));
  const [orders, setOrders] = useState(() => load(keys.orders, []));
  const [user, setUser] = useState(() => load(keys.session, null));
  const [cartOpen, setCartOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const cartCount = useMemo(() => cartSummary(cart, products).count, [cart, products]);

  useEffect(() => {
    const onRoute = () => setRoute(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', onRoute);
    return () => window.removeEventListener('hashchange', onRoute);
  }, []);
  useEffect(() => { localStorage.setItem(keys.products, JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem(keys.users, JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem(keys.cart, JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem(keys.orders, JSON.stringify(orders)); }, [orders]);
  useEffect(() => { if (user) localStorage.setItem(keys.session, JSON.stringify(user)); else localStorage.removeItem(keys.session); }, [user]);

  function addProduct(product) {
    const next = addItem(cart, product, product.stock);
    if (next === cart) setNotice(product.stock < 1 ? 'Este producto está agotado.' : 'No hay más unidades disponibles.');
    else setCartState(next);
  }
  function register(newUser) { const { adminCreated, ...savedUser } = newUser; setUsers((previous) => [...previous, savedUser]); if (!adminCreated) window.location.hash = '/login'; }
  function login(selectedUser) { setUser({ id: selectedUser.id, name: selectedUser.name || `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim(), email: selectedUser.email, role: selectedUser.role }); window.location.hash = selectedUser.role === 'Cliente' ? '/' : '/admin'; }
  function logout() { setUser(null); window.location.hash = '/'; }
  function placeOrder() {
    const order = createDemoOrder(cart, products, user?.email || 'Invitado');
    if (!order) return;
    setOrders((previous) => [order, ...previous]);
    setCartState([]);
    setCartOpen(false);
    setNotice(`Solicitud ${order.id} registrada localmente. No se realizó ningún cobro.`);
  }

  let page;
  if (route === '/login') page = <LoginForm users={users} onLogin={login} />;
  else if (route === '/registro') page = <RegisterForm users={users} onRegister={register} />;
  else if (route === '/registro-admin') page = user?.role === 'Administrador' ? <RegisterForm users={users} onRegister={register} adminMode /> : <AdminPanel user={user} products={products} setProducts={setProducts} users={users} setUsers={setUsers} orders={orders} />;
  else if (route === '/contacto') page = <ContactForm />;
  else if (route === '/admin') page = <AdminPanel user={user} products={products} setProducts={setProducts} users={users} setUsers={setUsers} orders={orders} />;
  else if (route === '/nosotros') page = <main className="container narrow py-5"><p className="eyebrow">Nuestra clínica</p><h1 className="display-5 fw-bold">Cuidamos a quienes hacen parte de tu familia.</h1><section className="card border-0 shadow-sm p-4 p-md-5 mt-4"><h2 className="h3">Veterinaria San Marcos</h2><p className="text-secondary">Somos un equipo veterinario de Rancagua comprometido con el bienestar de perros, gatos y otras mascotas. Combinamos atención cercana, prevención y orientación para sus familias.</p><h2 className="h3 mt-3">Nuestra misión</h2><p className="text-secondary">Acompañar a cada familia con atención responsable y productos confiables para cada etapa de vida.</p><h2 className="h3 mt-3">Cómo trabajamos</h2><p className="text-secondary">Escuchamos, evaluamos las necesidades de cada mascota y entregamos recomendaciones claras. Esta tienda es una demostración y no procesa pagos.</p></section></main>;
  else if (route === '/consejos') page = <main className="container py-5"><p className="eyebrow">Blog veterinario</p><h1 className="display-5 fw-bold mb-4">Consejos para su bienestar</h1><div className="row g-4">{[['💉','Vacunas al día','Conversa con tu veterinario para mantener el calendario adecuado para la edad y estilo de vida de tu mascota.'],['🥣','Alimentación','El alimento ideal depende de especie, edad, peso y salud. Haz cambios graduales y consulta si tienes dudas.'],['🦷','Higiene dental','La revisión periódica permite detectar molestias temprano. Pide orientación profesional sobre cuidados en casa.']].map(([icon,title,description])=><div className="col-md-4" key={title}><article className="card border-0 shadow-sm p-4 h-100"><span className="display-4">{icon}</span><h2 className="h4 mt-3">{title}</h2><p className="text-secondary">{description}</p></article></div>)}</div></main>;
  else page = <main className="container"><section className="hero-section row align-items-center g-4"><div className="col-lg-7"><p className="eyebrow">Cuidado para cada etapa</p><h1 className="display-3 fw-bold">Todo para una vida más sana y feliz.</h1><p className="lead text-secondary">Productos seleccionados por nuestro equipo veterinario para perros, gatos y más.</p><a className="btn btn-success btn-lg" href="#catalogo">Explorar productos</a></div><div className="col-lg-5 text-center hero-illustration" aria-hidden="true">🐕</div></section><ProductCatalog products={products} onAdd={addProduct} /><section className="promo-section p-4 p-md-5 rounded-4 my-5 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3"><div><p className="eyebrow mb-1">¿Aún no tienes cuenta?</p><h2 className="h3 fw-bold">Crea tu perfil para una experiencia más simple</h2><p className="mb-0">Tus datos se guardan en este navegador para esta demostración.</p></div><a className="btn btn-light text-success fw-semibold" href="#/registro">Crear cuenta</a></section></main>;

  return <><SiteHeader route={route} user={user} cartCount={cartCount} onOpenCart={() => setCartOpen(true)} onLogout={logout} />{page}<SiteFooter /><CartPanel open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} setCart={setCartState} products={products} onCheckout={placeOrder} />{notice && <div className="notice-backdrop" role="presentation" onClick={() => setNotice('')}><div className="alert alert-info notice-card shadow" role="alertdialog" aria-modal="true"><button type="button" className="btn-close float-end" aria-label="Cerrar" onClick={() => setNotice('')} /><h2 className="h5">Aviso</h2><p className="mb-0">{notice}</p></div></div>}</>;
}
