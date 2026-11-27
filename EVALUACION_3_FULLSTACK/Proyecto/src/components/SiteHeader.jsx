import { useEffect, useState } from 'react';

export default function SiteHeader({ route, user, cartCount, onOpenCart, onLogout }) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => { setExpanded(false); }, [route, user?.id]);
  const links = [
    ['Tienda', '#/'], ['Encomiendas Dinobox', '#/dinobox'], ['Nosotros', '#/nosotros'], ['Consejos', '#/consejos'], ['Contacto', '#/contacto'],
  ];
  return (
    <header className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top site-nav">
      <div className="container">
        <a className="navbar-brand fw-bold text-success" href="#/">🐾 San Marcos</a>
        <button className="navbar-toggler" type="button" onClick={() => setExpanded(value => !value)} aria-controls="site-nav-links" aria-expanded={expanded} aria-label="Abrir navegación"><span className="navbar-toggler-icon" /></button>
        <div className={`collapse navbar-collapse${expanded ? ' show' : ''}`} id="site-nav-links">
          <nav className="navbar-nav ms-auto align-items-lg-center gap-lg-2" aria-label="Navegación principal">
            {(user?.role === 'Vendedor' ? [] : links).map(([label, href]) => <a key={href} className={`nav-link ${route === href.slice(1) ? 'active' : ''}`} href={href}>{label}</a>)}
            {['Administrador', 'Vendedor'].includes(user?.role) && <a className={`nav-link ${route === '/admin' ? 'active' : ''}`} href="#/admin">Panel</a>}
            {!user ? <a className="nav-link" href="#/login">Ingresar</a> : <span className="nav-link small text-secondary">{user.name} · {user.role}</span>}

            {user?.role === 'Cliente' && <a className="nav-link" href="#/mis-ordenes">Mis órdenes</a>}{user && <button className="btn btn-link nav-link text-decoration-none" onClick={onLogout}>Salir</button>}
            {user?.role !== 'Vendedor' && <button className="btn btn-success rounded-pill ms-lg-2" onClick={onOpenCart}>Carrito <span className="badge text-bg-light ms-1">{cartCount}</span></button>}
          </nav>
        </div>
      </div>
    </header>
  );
}


