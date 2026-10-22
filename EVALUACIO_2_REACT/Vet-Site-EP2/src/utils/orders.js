import { cartSummary } from './cart.js';

export function createDemoOrder(cart, products, customer = 'Invitado', timestamp = Date.now()) {
  if (!cart.length) return null;
  const summary = cartSummary(cart, products);
  return {
    id: `ORD-${timestamp}`,
    createdAt: new Date(timestamp).toISOString(),
    customer,
    items: cart.map((item) => {
      const product = products.find((candidate) => candidate.id === item.id);
      return { id: item.id, name: product?.name || 'Producto', quantity: item.quantity, price: Number(product?.price) || 0 };
    }),
    total: summary.total,
    status: 'Solicitud de demostración',
  };
}
