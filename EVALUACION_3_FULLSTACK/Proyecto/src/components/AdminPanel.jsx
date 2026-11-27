import { useState } from 'react';
import OrdersPanel from './OrdersPanel.jsx';
import { formatPrice, validateProduct } from '../utils/validation.js';

const blankProduct = { id: '', code: '', name: '', description: '', category: 'Alimentos', price: '', stock: '', critical: '5', icon: '🐾' };

export default function AdminPanel({ user, products, onSaveProduct, onDeleteProduct, users, onChangeUserRole, onDeleteUser, orders = [], orderError, onReloadOrders, onUpdateOrder, onDeleteOrder }) {
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [tab, setTab] = useState('products');
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const isAdmin = user?.role === 'Administrador';
  if (!user || !['Administrador', 'Vendedor'].includes(user.role)) return <main className="container py-5"><div className="alert alert-warning"><h1 className="h3">Acceso restringido</h1><p>El panel está disponible para Administradores y Vendedores.</p><a className="btn btn-success" href="#/login">Iniciar sesión</a></div></main>;
  async function saveProduct(event) {
    event.preventDefault();
    if (busy) return;
    setNotice(''); setFailure('');
    const data = new FormData(event.currentTarget);
    const product = Object.fromEntries(data.entries());
    product.price = Number(product.price); product.stock = Number(product.stock); product.critical = Number(product.critical);
    product.id = editing?.id;
    product.icon = editing?.icon || '🐾';
    const nextErrors = validateProduct(product, products);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    try {
      await onSaveProduct(product, Boolean(editing?.id));
      setEditing(null); setNotice('Producto guardado en el servidor.');
    } catch (error) { setFailure(error.message); setErrors(error.fields || {}); }
    finally { setBusy(false); }
  }
  async function removeProduct() {
    if (busy || !deleting) return;
    setBusy(true); setFailure(''); setNotice('');
    try { await onDeleteProduct(deleting); if (editing?.id === deleting.id) setEditing(null); setDeleting(null); setNotice('Producto eliminado del servidor.'); }
    catch (error) { setFailure(error.message); }
    finally { setBusy(false); }
  }
  async function changeRole(id, role) {
    setBusy(true); setFailure('');
    try { await onChangeUserRole(id, role); } catch (error) { setFailure(error.message); }
    finally { setBusy(false); }
  }
  async function removeUser(id) {
    if (!window.confirm('¿Eliminar esta cuenta y cerrar sus sesiones?')) return;
    setBusy(true); setFailure('');
    try { await onDeleteUser(id); } catch (error) { setFailure(error.message); }
    finally { setBusy(false); }
  }

  return (
    <main className="container py-5">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4"><div><p className="eyebrow mb-1">Gestión interna</p><h1 className="display-6 fw-bold mb-1">Panel administrativo</h1><p className="text-secondary mb-0">Sesión: {user.name} · Rol: {user.role}</p></div></div>
      {failure && <div className="alert alert-danger" role="alert">{failure}</div>}
      {deleting && <div className="alert alert-warning" role="alert"><p>¿Eliminar «{deleting.name}» del catálogo?</p><button className="btn btn-danger me-2" disabled={busy} onClick={removeProduct}>Confirmar eliminación</button><button className="btn btn-outline-secondary" disabled={busy} onClick={() => setDeleting(null)}>Cancelar eliminación</button></div>}
      <ul className="nav nav-tabs mb-4" role="tablist"><li className="nav-item"><button className={`nav-link ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>Productos</button></li>{isAdmin && <li className="nav-item"><button className={`nav-link ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>Usuarios</button></li>}<li className="nav-item"><button className={`nav-link ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>Órdenes</button></li></ul>
      {tab === 'products' && <section><div className="d-flex justify-content-between align-items-center mb-3"><h2 className="h3">Productos</h2>{isAdmin && <button className="btn btn-success" disabled={busy} onClick={() => { setEditing(blankProduct); setErrors({}); }}>Agregar producto</button>}</div>{notice && <p className="text-success" role="status">{notice}</p>}
        {selectedProduct && <article className="card card-body mb-3"><h3 className="h5">Detalle de {selectedProduct.name}</h3><p>{selectedProduct.description}</p><p>{selectedProduct.category} · {formatPrice(selectedProduct.price)} · Stock: {selectedProduct.stock}</p><button className="btn btn-outline-secondary" onClick={() => setSelectedProduct(null)}>Cerrar detalle de producto</button></article>}
        <div className="table-responsive"><table className="table table-hover align-middle"><thead className="table-light"><tr><th>Código</th><th>Producto</th><th>Precio</th><th>Stock</th><th>Estado</th>{isAdmin && <th>Acciones</th>}</tr></thead><tbody>{products.map((product) => <tr key={product.id}><td>{product.code}</td><td><button className="btn btn-link p-0" onClick={() => setSelectedProduct(product)}>{product.name}</button><small className="d-block text-secondary">{product.category}</small></td><td>{formatPrice(product.price)}</td><td>{product.stock}</td><td>{product.stock <= product.critical ? <span className="badge text-bg-warning">Stock crítico</span> : <span className="badge text-bg-success">Disponible</span>}</td>{isAdmin && <td><button className="btn btn-sm btn-outline-success me-2" disabled={busy} onClick={() => { setEditing(product); setErrors({}); }}>Editar</button><button className="btn btn-sm btn-outline-danger" disabled={busy} onClick={() => setDeleting(product)}>Eliminar</button></td>}</tr>)}</tbody></table></div>
        {isAdmin && editing && <form key={editing.id || "new"} className="card card-body mt-4" onSubmit={saveProduct} noValidate><h3 className="h4">{editing.id ? 'Editar producto' : 'Nuevo producto'}</h3><div className="row g-3">{[['code','Código'],['name','Nombre'],['description','Descripción'],['category','Categoría'],['image','Imagen (URL opcional)'],['price','Precio'],['stock','Stock'],['critical','Stock crítico']].map(([name,label])=><div key={name} className={name==='description'?'col-12':'col-md-6'}><label className="form-label w-100">{label}{name==='category'?<select name={name} defaultValue={editing[name]} className="form-select"><option>Alimentos</option><option>Salud</option><option>Higiene</option><option>Accesorios</option><option>Juguetes</option></select>:name==='description'?<textarea name={name} maxLength="500" defaultValue={editing[name]} className={`form-control ${errors[name]?'is-invalid':''}`} />:<input name={name} required={name!=='critical'&&name!=='image'} maxLength={name==='name'?100:undefined} min={name==='stock'||name==='critical'||name==='price'?0:undefined} step={name==='price'?'0.01':name==='stock'||name==='critical'?'1':undefined} type={name==='price'||name==='stock'||name==='critical'?'number':name==='image'?'url':'text'} defaultValue={editing[name]} className={`form-control ${errors[name]?'is-invalid':''}`} />}{errors[name]&&<span className="invalid-feedback">{errors[name]}</span>}</label></div>)}</div><div className="mt-3"><button disabled={busy} className="btn btn-success me-2">{busy ? "Guardando…" : "Guardar producto"}</button><button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={()=>setEditing(null)}>Cancelar</button></div></form>}
      </section>}
      {tab === 'users' && isAdmin && <section><div className="d-flex justify-content-between align-items-center mb-3"><h2 className="h3">Usuarios registrados</h2><a className="btn btn-success" href="#/registro-admin">Crear usuario</a></div><div className="table-responsive"><table className="table align-middle"><thead className="table-light"><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Acciones</th></tr></thead><tbody>{users.map((item)=><tr key={item.id}><td>{item.name} {item.lastName || ''}</td><td>{item.email}</td><td><select disabled={busy || item.id === user.id} className="form-select form-select-sm" value={item.role} onChange={(event)=>changeRole(item.id,event.target.value)}><option>Cliente</option><option>Vendedor</option><option>Administrador</option></select></td><td><button className="btn btn-sm btn-outline-danger" disabled={busy || item.id === user.id} onClick={()=>removeUser(item.id)}>Eliminar</button></td></tr>)}</tbody></table></div></section>}
      {tab === 'orders' && <OrdersPanel orders={orders} admin={isAdmin} error={orderError} onReload={onReloadOrders} onUpdate={onUpdateOrder} onDelete={onDeleteOrder} />}
    </main>
  );
}


