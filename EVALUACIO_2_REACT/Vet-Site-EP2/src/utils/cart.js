export function addItem(cart, product, availableStock = Infinity) {
  if (!product || availableStock < 1) return cart;
  const found = cart.find((item) => item.id === product.id);
  if (found) {
    if (found.quantity >= availableStock) return cart;
    return cart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
  }
  return [...cart, { id: product.id, quantity: 1 }];
}

export function changeQuantity(cart, productId, delta, availableStock = Infinity) {
  return cart
    .map((item) => item.id === productId
      ? { ...item, quantity: Math.min(availableStock, item.quantity + delta) }
      : item)
    .filter((item) => item.quantity > 0);
}

export function cartSummary(cart, products) {
  return cart.reduce((summary, item) => {
    const product = products.find((candidate) => candidate.id === item.id);
    if (!product) return summary;
    summary.count += item.quantity;
    summary.total += Number(product.price) * item.quantity;
    return summary;
  }, { count: 0, total: 0 });
}
