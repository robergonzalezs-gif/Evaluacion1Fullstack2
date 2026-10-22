export default function SiteHeader({ route, user, cartCount, onOpenCart, onLogout }) {
  const links = [
    ['Tienda', '#/'], ['Nosotros', '#/nosotros'], ['Consejos', '#/consejos'], ['Contacto', '#/contacto'],
  ];
  return (
    <header className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top site-nav">
      <div className="container">
        <a className="navbar-brand fw-bold text-success" href="#/">🐾 San Marcos</a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#site-nav-links" aria-controls="site-nav-links" aria-expanded="false" aria-label="Abrir navegación"><span className="navbar-toggler-icon" /></button>
        <div className="collapse navbar-collapse" id="site-nav-links">
          <nav className="navbar-nav ms-auto align-items-lg-center gap-lg-2" aria-label="Navegación principal">
            {links.map(([label, href]) => <a key={href} className={`nav-link ${route === href.slice(1) ? 'active' : ''}`} href={href}>{label}</a>)}
            {user?.role !== 'Cliente' && <a className={`nav-link ${route === '/admin' ? 'active' : ''}`} href="#/admin">Panel</a>}
            {!user ? <a className="nav-link" href="#/login">Ingresar</a> : <span className="nav-link small text-secondary">{user.name} · {user.role}</span>}
            {user?.role === 'Cliente' && <a className="nav-link" href="#/admin" aria-label="Ir al panel">Panel</a>}
            {user && <button className="btn btn-link nav-link text-decoration-none" onClick={onLogout}>Salir</button>}
            <button className="btn btn-success rounded-pill ms-lg-2" onClick={onOpenCart}>Carrito <span className="badge text-bg-light ms-1">{cartCount}</span></button>
          </nav>
        </div>
      </div>
    </header>
  );
}
