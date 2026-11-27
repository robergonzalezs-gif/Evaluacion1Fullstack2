import { useState } from 'react';
import { request } from '../services/productService.js';

const ruta = '/api/v1/encomienda';
const estados = { RECEPCION: 'En Recepción', DESPACHO: 'En Despacho', TRANSITO: 'En Tránsito', ENTREGADO: 'Entregado' };
const pasos = Object.keys(estados);
const detalle = codigo => ruta + '/' + encodeURIComponent(codigo.trim().toUpperCase());

function CamposEnvio() {
  return <>
    <label className="form-label">Comuna de origen<input className="form-control" name="origen" required maxLength="100" pattern=".*\S.*" /></label>
    <label className="form-label">Comuna de destino<input className="form-control" name="destino" required maxLength="100" pattern=".*\S.*" /></label>
    <label className="form-label">Contenido del paquete<input className="form-control" name="descripcion" required maxLength="200" pattern=".*\S.*" /></label>
  </>;
}

function Recorrido({ guia }) {
  return <section className="mt-4" aria-label="Seguimiento de la encomienda">
    <h2 className="h4">Estado de la encomienda</h2>
    <p>Código de seguimiento <strong data-testid="codigo">{guia.codigo}</strong></p>
    <ol className="row list-unstyled g-2">{pasos.map((paso) => {
      const evento = guia.historial.find(e => e.estado === paso);
      const actual = paso === guia.estado;
      return <li className="col-6 col-md-3" key={paso} aria-current={actual ? 'step' : undefined}>
        <div className={'card p-3 h-100 ' + (actual ? 'border-success bg-success-subtle' : '')}>
          <strong>{estados[paso]}</strong><span>{actual ? 'Estado actual' : evento ? 'Completado' : 'Pendiente'}</span>
          {evento && <small>{evento.ubicacion}</small>}
        </div></li>;
    })}</ol>
    <h3 className="h5 mt-4">Historial de viaje</h3>
    <ol className="list-group list-group-numbered">{guia.historial.map(e => <li className="list-group-item" key={e.estado}>
      <strong>{estados[e.estado]}</strong> · {e.ubicacion} · {new Date(e.fecha).toLocaleString('es-CL')}
    </li>)}</ol>
  </section>;
}

export default function Dinobox({ user }) {
  const [vista, setVista] = useState('Rastrear');
  const [guia, setGuia] = useState(null);
  const [codigo, setCodigo] = useState('');
  const [lista, setLista] = useState([]);
  const [seleccion, setSeleccion] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const admin = user?.role === 'Administrador';
  const vistas = ['Rastrear', 'Solicitar envío', ...(admin ? ['Gestionar envíos'] : [])];
  async function ejecutar(fn) {
    if (ocupado) return;
    setOcupado(true); setError(''); setMensaje('');
    try { await fn(); } catch (e) { setError(e.message); }
    finally { setOcupado(false); }
  }
  async function cambiar(v) {
    setVista(v); setError(''); setMensaje(''); setSeleccion(null);
    if (v === 'Gestionar envíos') await ejecutar(async () => setLista(await request(ruta)));
  }
  function rastrear(event) {
    event.preventDefault(); setGuia(null);
    ejecutar(async () => setGuia(await request(detalle(codigo), { auth: null })));
  }
  function crear(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    ejecutar(async () => {
      const creada = await request(ruta, { method:'POST', body, auth:null });
      setCodigo(creada.codigo); setGuia(creada); setVista('Rastrear'); setMensaje('Encomienda registrada. Guarda tu código de seguimiento.');
    });
  }
  function actualizar(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    ejecutar(async () => {
      const guiaActualizada = await request(detalle(seleccion.codigo), { method:'PUT', body });
      setLista(prev => prev.map(e => e.codigo === seleccion.codigo ? {...e, ...guiaActualizada} : e));
      setGuia(guiaActualizada); setCodigo(guiaActualizada.codigo); setSeleccion(null); setMensaje('Estado actualizado.');
    });
  }
  function eliminar(e) {
    if (!window.confirm('¿Eliminar la encomienda ' + e.codigo + ' y su historial?')) return;
    ejecutar(async () => {
      await request(detalle(e.codigo), { method:'DELETE' });
      setLista(prev => prev.filter(x => x.codigo !== e.codigo)); setSeleccion(null);
      if (guia?.codigo === e.codigo) setGuia(null);
      setMensaje('Encomienda eliminada.');
    });
  }
  return <main className="container py-5">
    <h1>Dinobox · Encomiendas</h1>
    <nav className="d-flex flex-wrap gap-2 my-4" aria-label="Encomiendas">{vistas.map(v =>
      <button key={v} disabled={ocupado} aria-pressed={v === vista} className={'btn ' + (v === vista ? 'btn-success' : 'btn-outline-success')} onClick={() => cambiar(v)}>{v}</button>)}</nav>
    {error && <p className="alert alert-danger" role="alert">{error}</p>}
    {mensaje && <p className="alert alert-success" role="status">{mensaje}</p>}
    {vista === 'Rastrear' && <>
      <form onSubmit={rastrear} className="card p-4">
        <label className="form-label">Código de seguimiento<input className="form-control" placeholder="DB-…" value={codigo} required maxLength="19" pattern="[Dd][Bb]-[A-Fa-f0-9]{16}" title="DB- seguido de 16 caracteres hexadecimales" onChange={e => {setCodigo(e.target.value); setGuia(null);}} /></label>
        <button className="btn btn-success align-self-start" disabled={ocupado}>Buscar encomienda</button>
      </form>{guia && <Recorrido guia={guia} />}</>}
    {vista === 'Solicitar envío' && <form onSubmit={crear} className="card p-4 gap-2">
      <h2 className="h4">Nueva solicitud</h2><CamposEnvio />
      <button disabled={ocupado} className="btn btn-success align-self-start">Registrar encomienda</button></form>}
    {vista === 'Gestionar envíos' && admin && <section>
      <h2 className="h4">Solicitudes registradas</h2>
      {lista.length === 0 && !ocupado && !error && <p>Aún no hay encomiendas.</p>}
      <div className="table-responsive"><table className="table align-middle"><thead><tr>{['Código','Origen y destino','Contenido','Estado','Acciones'].map(t => <th key={t}>{t}</th>)}</tr></thead>
      <tbody>{lista.map(e => <tr key={e.codigo}><td>{e.codigo}</td><td>{e.origen} → {e.destino}</td><td>{e.descripcion}</td><td>{estados[e.estado]}</td><td>
        {e.estado !== 'ENTREGADO' && <button className="btn btn-sm btn-outline-success me-2" disabled={ocupado} onClick={() => setSeleccion(e)}>Actualizar</button>}
        <button className="btn btn-sm btn-outline-danger" disabled={ocupado} onClick={() => eliminar(e)}>Eliminar</button></td></tr>)}</tbody></table></div>
      {seleccion && <form key={seleccion.codigo} onSubmit={actualizar} className="card p-4 gap-2"><h3 className="h5">Actualizar {seleccion.codigo}</h3>
        <label>Siguiente estado<select className="form-select" name="estado"><option value={pasos[pasos.indexOf(seleccion.estado)+1]}>{estados[pasos[pasos.indexOf(seleccion.estado)+1]]}</option></select></label>
        <label>Ubicación actual<input className="form-control" name="ubicacion" required maxLength="100" pattern=".*\S.*" /></label>
        <div><button className="btn btn-success me-2" disabled={ocupado}>Guardar estado</button><button type="button" className="btn btn-outline-secondary" disabled={ocupado} onClick={() => setSeleccion(null)}>Cancelar</button></div>
      </form>}
    </section>}
  </main>;
}
