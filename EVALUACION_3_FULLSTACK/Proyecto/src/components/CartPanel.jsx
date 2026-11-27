import { cartSummary, changeQuantity } from '../utils/cart.js';
import { formatPrice } from '../utils/validation.js';

export default function CartPanel({ open, onClose, cart, setCart, products, onCheckout, busy = false, error = '', user }) {
  if (!open) return null;
  const summary = cartSummary(cart, products);
  const cartProducts = cart.map((item) => ({ ...item, product: products.find((product) => product.id === item.id) }));
  const unavailable = cartProducts.some(item => !item.product || item.quantity > item.product.stock);
  function update(item, delta) {
    setCart(changeQuantity(cart, item.id, delta, item.product.stock));
  }
  return (
    <div className="cart-backdrop" role="presentation" onMouseDown={(event) => { if (!busy && event.target === event.currentTarget) onClose(); }}>
      <section className="cart-panel bg-white shadow-lg" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3"><h2 id="cart-title" className="h3 mb-0">Tu carrito</h2><button className="btn-close" disabled={busy} aria-label="Cerrar carrito" onClick={onClose} /></div>
        {cartProducts.length === 0 ? <p className="text-secondary py-4">Tu carrito está vacío.</p> : <ul className="list-group list-group-flush my-3">{cartProducts.map((item) => !item.product ? <li className="list-group-item px-0" key={item.id}><span>Producto ya no disponible</span><button className="btn btn-outline-danger btn-sm ms-2" disabled={busy} onClick={() => setCart(cart.filter(entry => entry.id !== item.id))}>Quitar producto</button></li> : <li className="list-group-item px-0" key={item.id}><div className="d-flex justify-content-between gap-2"><div><strong>{item.product.name}</strong><div className="small text-secondary">{formatPrice(item.product.price)} c/u</div><div className="btn-group btn-group-sm mt-2" aria-label={`Cantidad ${item.product.name}`}><button className="btn btn-outline-secondary" aria-label="Restar" disabled={busy} onClick={() => update(item, -1)}>−</button><span className="btn btn-light disabled">{item.quantity}</span><button className="btn btn-outline-secondary" aria-label="Sumar" disabled={busy} onClick={() => update(item, 1)}>+</button><button className="btn btn-outline-danger" disabled={busy} aria-label="Eliminar" onClick={() => setCart(cart.filter((entry) => entry.id !== item.id))}>×</button></div></div><strong>{formatPrice(item.product.price * item.quantity)}</strong></div></li>)}</ul>}
        <div className="d-flex justify-content-between fs-5 border-top pt-3"><span>Total</span><strong>{formatPrice(summary.total)}</strong></div>
        {unavailable && <p className="text-danger mt-2" role="alert">Hay productos sin stock suficiente o que ya no están disponibles. Ajusta las cantidades o quítalos para continuar.</p>}
        <button className="btn btn-success w-100 mt-3" disabled={busy || cart.length === 0 || unavailable} onClick={onCheckout}>{busy ? 'Confirmando…' : user ? 'Confirmar orden' : 'Iniciar sesión para comprar'}</button>{error && <p className="text-danger mt-2" role="alert">{error}</p>}
        <p className="small text-secondary mt-3">Demostración académica: registra la orden y actualiza el stock; no procesa pagos.</p>
      </section>
    </div>
  );
}

