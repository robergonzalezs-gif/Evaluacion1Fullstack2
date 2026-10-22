import { useState } from 'react';
import { formatPrice, validateProduct } from '../utils/validation.js';

const blankProduct = { id: '', code: '', name: '', description: '', category: 'Alimentos', price: '', stock: '', critical: '5', icon: '🐾' };

export default function AdminPanel({ user, products, setProducts, users, setUsers, orders = [] }) {
  const [tab, setTab] = useState('products');
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const isAdmin = user?.role === 'Administrador';
  if (!user || !['Administrador', 'Vendedor'].includes(user.role)) return <main className="container py-5"><div className="alert alert-warning"><h1 className="h3">Acceso restringido</h1><p>El panel está disponible para Administradores y Vendedores.</p><a className="btn btn-success" href="#/login">Iniciar sesión</a></div></main>;
  function saveProduct(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const product = Object.fromEntries(data.entries());
    product.price = Number(product.price); product.stock = Number(product.stock); product.critical = Number(product.critical);
    product.id = editing?.id || crypto.randomUUID();
    const nextErrors = validateProduct(product, products);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setProducts((previous) => editing?.id
      ? previous.map((item) => item.id === product.id ? product : item)
      : [...previous, product]);
    setEditing(null); setNotice('Producto guardado.');
  }
  function changeRole(id, role) { setUsers((previous) => previous.map((item) => item.id === id ? { ...item, role } : item)); }
  return (
    <main className="container py-5">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4"><div><p className="eyebrow mb-1">Gestión interna</p><h1 className="display-6 fw-bold mb-1">Panel administrativo</h1><p className="text-secondary mb-0">Sesión: {user.name} · Rol: {user.role}</p></div></div>
      <ul className="nav nav-tabs mb-4" role="tablist"><li className="nav-item"><button className={`nav-link ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>Productos</button></li>{isAdmin && <li className="nav-item"><button className={`nav-link ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>Usuarios</button></li>}<li className="nav-item"><button className={`nav-link ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>Órdenes</button></li></ul>
      {tab === 'products' && <section><div className="d-flex justify-content-between align-items-center mb-3"><h2 className="h3">Productos</h2>{isAdmin && <button className="btn btn-success" onClick={() => { setEditing(blankProduct); setErrors({}); }}>Agregar producto</button>}</div>{notice && <p className="text-success" role="status">{notice}</p>}
        <div className="table-responsive"><table className="table table-hover align-middle"><thead className="table-light"><tr><th>Código</th><th>Producto</th><th>Precio</th><th>Stock</th><th>Estado</th>{isAdmin && <th>Acciones</th>}</tr></thead><tbody>{products.map((product) => <tr key={product.id}><td>{product.code}</td><td>{product.name}<small className="d-block text-secondary">{product.category}</small></td><td>{formatPrice(product.price)}</td><td>{product.stock}</td><td>{product.stock <= product.critical ? <span className="badge text-bg-warning">Stock crítico</span> : <span className="badge text-bg-success">Disponible</span>}</td>{isAdmin && <td><button className="btn btn-sm btn-outline-success me-2" onClick={() => { setEditing(product); setErrors({}); }}>Editar</button><button className="btn btn-sm btn-outline-danger" onClick={() => setProducts((previous) => previous.filter((item) => item.id !== product.id))}>Eliminar</button></td>}</tr>)}</tbody></table></div>
        {isAdmin && editing && <form className="card card-body mt-4" onSubmit={saveProduct} noValidate><h3 className="h4">{editing.id ? 'Editar producto' : 'Nuevo producto'}</h3><div className="row g-3">{[['code','Código'],['name','Nombre'],['description','Descripción'],['category','Categoría'],['image','Imagen (URL opcional)'],['price','Precio'],['stock','Stock'],['critical','Stock crítico']].map(([name,label])=><div key={name} className={name==='description'?'col-12':'col-md-6'}><label className="form-label w-100">{label}{name==='category'?<select name={name} defaultValue={editing[name]} className="form-select"><option>Alimentos</option><option>Salud</option><option>Higiene</option><option>Accesorios</option><option>Juguetes</option></select>:name==='description'?<textarea name={name} maxLength="500" defaultValue={editing[name]} className={`form-control ${errors[name]?'is-invalid':''}`} />:<input name={name} required={name!=='critical'&&name!=='image'} maxLength={name==='name'?100:undefined} min={name==='stock'||name==='critical'||name==='price'?0:undefined} step={name==='price'?'0.01':name==='stock'||name==='critical'?'1':undefined} type={name==='price'||name==='stock'||name==='critical'?'number':name==='image'?'url':'text'} defaultValue={editing[name]} className={`form-control ${errors[name]?'is-invalid':''}`} />}{errors[name]&&<span className="invalid-feedback">{errors[name]}</span>}</label></div>)}</div><div className="mt-3"><button className="btn btn-success me-2">Guardar producto</button><button type="button" className="btn btn-outline-secondary" onClick={()=>setEditing(null)}>Cancelar</button></div></form>}
      </section>}
      {tab === 'users' && isAdmin && <section><div className="d-flex justify-content-between align-items-center mb-3"><h2 className="h3">Usuarios y permisos</h2><a className="btn btn-success" href="#/registro-admin">Crear usuario</a></div><div className="table-responsive"><table className="table align-middle"><thead className="table-light"><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Acciones</th></tr></thead><tbody>{users.map((item)=><tr key={item.id}><td>{item.name} {item.lastName || ''}</td><td>{item.email}</td><td><select className="form-select form-select-sm" value={item.role} onChange={(event)=>changeRole(item.id,event.target.value)}><option>Cliente</option><option>Vendedor</option><option>Administrador</option></select></td><td><button className="btn btn-sm btn-outline-danger" onClick={()=>setUsers((previous)=>previous.filter((candidate)=>candidate.id!==item.id))}>Eliminar</button></td></tr>)}</tbody></table></div></section>}
      {tab === 'orders' && <section><h2 className="h3 mb-3">Órdenes de demostración</h2>{orders.length === 0 ? <div className="alert alert-info">Todavía no hay solicitudes registradas. El checkout genera órdenes locales de demostración y no procesa pagos.</div> : <div className="table-responsive"><table className="table align-middle"><thead className="table-light"><tr><th>Número</th><th>Fecha</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Detalle</th></tr></thead><tbody>{orders.map((order)=><tr key={order.id}><td>{order.id}</td><td>{new Date(order.createdAt).toLocaleString('es-CL')}</td><td>{order.customer}</td><td>{formatPrice(order.total)}</td><td>{order.status}</td><td><button className="btn btn-sm btn-outline-success" onClick={()=>setSelectedOrder(order)}>Ver detalle</button></td></tr>)}</tbody></table></div>}{selectedOrder && <div className="card card-body mt-3"><div className="d-flex justify-content-between align-items-center"><h3 className="h5">Detalle {selectedOrder.id}</h3><button className="btn-close" aria-label="Cerrar detalle" onClick={()=>setSelectedOrder(null)} /></div><ul>{selectedOrder.items.map((item)=><li key={item.id}>{item.name} · {item.quantity} × {formatPrice(item.price)}</li>)}</ul><strong>Total: {formatPrice(selectedOrder.total)}</strong></div>}</section>}
    </main>
  );
}
