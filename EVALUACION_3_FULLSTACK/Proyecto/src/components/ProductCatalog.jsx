import { useMemo, useState } from 'react';
import ProductCard from './ProductCard.jsx';

export default function ProductCatalog({ products, onAdd }) {
  const [category, setCategory] = useState('Todas');
  const [query, setQuery] = useState('');
  const categories = useMemo(() => ['Todas', ...new Set(products.map((product) => product.category))], [products]);
  const visible = products.filter((product) => (category === 'Todas' || product.category === category)
    && `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <section id="catalogo" className="py-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-3">
        <div><p className="eyebrow mb-1">Nuestra tienda</p><h2 className="display-6 fw-bold mb-0">Catálogo de productos</h2></div>
        <label className="form-label mb-0 search-label">Buscar productos<input className="form-control mt-1" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre o categoría" /></label>
      </div>
      <div className="d-flex flex-wrap gap-2 mb-4" role="group" aria-label="Filtrar por categoría">
        {categories.map((item) => <button key={item} className={`btn btn-sm rounded-pill ${item === category ? 'btn-success' : 'btn-outline-success'}`} onClick={() => setCategory(item)} aria-pressed={item === category}>{item}</button>)}
      </div>
      <div className="row g-4">
        {visible.map((product) => <div className="col-12 col-sm-6 col-lg-4" key={product.id}><ProductCard product={product} onAdd={onAdd} /></div>)}
        {visible.length === 0 && <p className="text-secondary py-4">No encontramos productos con esos filtros.</p>}
      </div>
    </section>
  );
}
