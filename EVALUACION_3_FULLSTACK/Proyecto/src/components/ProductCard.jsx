import { formatPrice } from '../utils/validation.js';

export default function ProductCard({ product, onAdd }) {
  const soldOut = Number(product.stock) < 1;
  return (
    <article className="card product-card h-100 shadow-sm border-0">
      <div className="product-visual" aria-hidden="true">{product.image ? <img src={product.image} alt="" loading="lazy" /> : (product.icon || '🐾')}</div>
      <div className="card-body d-flex flex-column">
        <span className="badge rounded-pill text-bg-light align-self-start mb-2">{product.category}</span>
        <h3 className="h5 card-title">{product.name}</h3>
        <p className="card-text text-secondary flex-grow-1">{product.description}</p>
        <div className="d-flex justify-content-between align-items-center">
          <strong className="fs-5">{formatPrice(product.price)}</strong>
          <small className={soldOut ? 'text-danger' : 'text-secondary'}>{soldOut ? 'Agotado' : `Stock: ${product.stock}`}</small>
        </div>
        <button className="btn btn-success mt-3" disabled={soldOut} onClick={() => onAdd(product)}>Añadir al carrito</button>
      </div>
    </article>
  );
}
