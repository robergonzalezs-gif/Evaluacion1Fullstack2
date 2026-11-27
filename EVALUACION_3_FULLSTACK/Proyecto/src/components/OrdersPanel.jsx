import { useState } from 'react';
import { formatPrice } from '../utils/validation.js';

export default function OrdersPanel({ orders = [], admin = false, error = '', onReload, onUpdate, onDelete }) {
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const current = orders.find(o => o.id === selected);
  async function action(order, status) {
    if (busy || !window.confirm(status ? `¿Cambiar la orden a ${status}?` : '¿Eliminar esta orden cancelada?')) return;
    setBusy(true); setFailure('');
    try { if (status) await onUpdate(order.id,status); else { await onDelete(order.id); setSelected(null); } }
    catch (e) { setFailure(e.message); }
    finally { setBusy(false); }
  }
  return <section>
    <div className="d-flex justify-content-between align-items-center mb-3"><h2 className="h3">Órdenes</h2>{onReload && <button className="btn btn-outline-success" disabled={busy} onClick={onReload}>Actualizar órdenes</button>}</div>
    {(error || failure) && <p className="alert alert-danger" role="alert">{error || failure}</p>}
    {!orders.length ? <p className="alert alert-info">Todavía no hay órdenes registradas.</p> : <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Número</th><th>Fecha</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Detalle</th>{admin && <th>Gestión</th>}</tr></thead><tbody>{orders.map(o => <tr key={o.id}><td className="text-break">{o.id}</td><td>{new Date(o.createdAt).toLocaleString('es-CL')}</td><td>{o.customer}</td><td>{formatPrice(o.total)}</td><td>{o.status}</td><td><button className="btn btn-sm btn-outline-success" onClick={() => setSelected(o.id)}>Ver detalle</button></td>{admin && <td>{o.status==='CONFIRMADA' && <><button className="btn btn-sm btn-success me-1" disabled={busy} onClick={() => action(o,'ENTREGADA')}>Entregar</button><button className="btn btn-sm btn-outline-danger" disabled={busy} onClick={() => action(o,'CANCELADA')}>Cancelar orden</button></>}{o.status==='CANCELADA' && <button className="btn btn-sm btn-outline-danger" disabled={busy} onClick={() => action(o,null)}>Eliminar orden</button>}</td>}</tr>)}</tbody></table></div>}
    {current && <div className="card card-body"><div className="d-flex justify-content-between"><h3 className="h5 text-break">Detalle {current.id}</h3><button className="btn-close" aria-label="Cerrar detalle" onClick={() => setSelected(null)} /></div><ul>{current.items.map(i => <li key={i.id}>{i.name} · {i.quantity} × {formatPrice(i.price)}</li>)}</ul><strong>Total: {formatPrice(current.total)}</strong><p className="small text-secondary mt-2">Orden académica. No constituye una boleta tributaria ni un comprobante de pago.</p></div>}
  </section>;
}
