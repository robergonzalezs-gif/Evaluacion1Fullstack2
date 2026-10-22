import { useState } from 'react';
import { isAllowedEmail, validateLogin, validateRegistration } from '../utils/validation.js';

const regions = {
  'Región Metropolitana': ['Santiago', 'Puente Alto', 'Maipú', 'Las Condes'],
  'O’Higgins': ['Rancagua', 'Machalí', 'San Fernando', 'Graneros'],
  Valparaíso: ['Valparaíso', 'Viña del Mar', 'Quilpué'],
  Biobío: ['Concepción', 'Talcahuano', 'Los Ángeles'],
};

export function LoginForm({ users, onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  function submit(event) {
    event.preventDefault();
    const nextErrors = validateLogin(form);
    const user = users.find((candidate) => candidate.email.toLowerCase() === form.email.trim().toLowerCase() && candidate.password === form.password);
    if (!user && Object.keys(nextErrors).length === 0) nextErrors.email = 'Correo o contraseña incorrectos.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { setMessage('Revisa los datos e inténtalo nuevamente.'); return; }
    onLogin(user);
  }
  return (
    <section className="container auth-container py-5"><div className="card border-0 shadow-sm p-4 p-md-5"><p className="eyebrow">Bienvenido/a</p><h1 className="h2 fw-bold">Iniciar sesión</h1><p className="small text-secondary">Demo administrador: admin@gmail.com / admin123<br />Demo vendedor: vendedor@gmail.com / venta123</p>
      <form onSubmit={submit} noValidate><label className="form-label w-100">Correo<input className={`form-control ${errors.email ? 'is-invalid' : ''}`} type="email" maxLength="100" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />{errors.email && <span className="invalid-feedback">{errors.email}</span>}</label>
        <label className="form-label w-100 mt-2">Contraseña<input className={`form-control ${errors.password ? 'is-invalid' : ''}`} type="password" minLength="4" maxLength="10" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />{errors.password && <span className="invalid-feedback">{errors.password}</span>}</label>
        {message && <p className="text-danger" role="alert">{message}</p>}<button className="btn btn-success mt-2">Ingresar</button>
      </form><p className="mt-3 mb-0">¿No tienes cuenta? <a href="#/registro">Regístrate</a></p>
    </div></section>
  );
}

export function RegisterForm({ users, onRegister, adminMode = false }) {
  const [form, setForm] = useState({ run: '', name: '', lastName: '', email: '', password: '', birthDate: '', region: '', commune: '', address: '', role: 'Cliente' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  function update(field, value) { setForm((previous) => ({ ...previous, [field]: value, ...(field === 'region' ? { commune: '' } : {}) })); }
  function submit(event) {
    event.preventDefault();
    const nextErrors = validateRegistration(form);
    if (users.some((user) => user.email.toLowerCase() === form.email.trim().toLowerCase())) nextErrors.email = 'Ya existe una cuenta con ese correo.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { setMessage('Revisa los campos indicados.'); return; }
    onRegister({ ...form, id: crypto.randomUUID(), role: adminMode ? form.role : 'Cliente', adminCreated: adminMode });
    setMessage(adminMode ? 'Usuario creado correctamente.' : 'Cuenta creada. Ya puedes iniciar sesión.');
    setForm({ run: '', name: '', lastName: '', email: '', password: '', birthDate: '', region: '', commune: '', address: '', role: 'Cliente' });
  }
  const field = (id, label, props = {}) => <label className="form-label w-100" key={id}>{label}<input className={`form-control ${errors[id] ? 'is-invalid' : ''}`} value={form[id]} onChange={(event) => update(id, event.target.value)} {...props} />{errors[id] && <span className="invalid-feedback">{errors[id]}</span>}</label>;
  return (
    <section className="container auth-container py-5"><div className="card border-0 shadow-sm p-4 p-md-5"><p className="eyebrow">{adminMode ? 'Administración' : 'Cuenta de cliente'}</p><h1 className="h2 fw-bold">{adminMode ? 'Crear usuario' : 'Crear cuenta'}</h1>
      <form onSubmit={submit} noValidate><div className="row g-2">
        <div className="col-md-6">{field('run', 'RUN sin puntos ni guion', { required: true, minLength: 7, maxLength: 9, placeholder: '190110222' })}</div>
        <div className="col-md-6">{field('name', 'Nombre', { required: true, maxLength: 50 })}</div>
        <div className="col-md-6">{field('lastName', 'Apellidos', { required: true, maxLength: 100 })}</div>
        <div className="col-md-6">{field('email', 'Correo', { type: 'email', required: true, maxLength: 100, placeholder: 'nombre@gmail.com' })}</div>
        <div className="col-md-6">{field('password', 'Contraseña (4 a 10 caracteres)', { type: 'password', required: true, minLength: 4, maxLength: 10 })}</div>
        <div className="col-md-6">{field('birthDate', 'Fecha de nacimiento (opcional)', { type: 'date' })}</div>
        <div className="col-md-6"><label className="form-label w-100">Región<select className={`form-select ${errors.region ? 'is-invalid' : ''}`} value={form.region} onChange={(event) => update('region', event.target.value)} required><option value="">Selecciona</option>{Object.keys(regions).map((region) => <option key={region}>{region}</option>)}</select>{errors.region && <span className="invalid-feedback">{errors.region}</span>}</label></div>
        <div className="col-md-6"><label className="form-label w-100">Comuna<select className={`form-select ${errors.commune ? 'is-invalid' : ''}`} value={form.commune} disabled={!form.region} onChange={(event) => update('commune', event.target.value)} required><option value="">Selecciona</option>{(regions[form.region] || []).map((commune) => <option key={commune}>{commune}</option>)}</select>{errors.commune && <span className="invalid-feedback">{errors.commune}</span>}</label></div>
        <div className="col-12">{field('address', 'Dirección', { required: true, maxLength: 300 })}</div>
        {adminMode && <div className="col-md-6"><label className="form-label w-100">Tipo de usuario<select className="form-select" value={form.role} onChange={(event) => update('role', event.target.value)}><option>Administrador</option><option>Cliente</option><option>Vendedor</option></select></label></div>}
      </div>{message && <p className={Object.keys(errors).length ? 'text-danger' : 'text-success'} role="status">{message}</p>}<button className="btn btn-success">{adminMode ? 'Crear usuario' : 'Registrarme'}</button>{adminMode && <a className="btn btn-link ms-2" href="#/admin">Volver al panel</a>}</form>
    </div></section>
  );
}

export function ContactForm() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const comment = String(data.get('comment') || '').trim();
    if (!name || name.length > 100 || !isAllowedEmail(email) || !comment || comment.length > 500) { setError('Completa nombre y comentario e ingresa un correo permitido (@duoc.cl, @profesor.duoc.cl o @gmail.com).'); return; }
    setError(''); setMessage('Consulta registrada en esta demostración. No se envió a un servidor.'); event.currentTarget.reset();
  }
  return <section className="container auth-container py-5"><div className="card border-0 shadow-sm p-4 p-md-5"><p className="eyebrow">Estamos para ayudarte</p><h1 className="h2 fw-bold">Contacto</h1><form onSubmit={submit} noValidate><label className="form-label w-100">Nombre<input name="name" className="form-control" required maxLength="100" /></label><label className="form-label w-100">Correo<input name="email" className="form-control" type="email" required maxLength="100" /></label><label className="form-label w-100">Comentario<textarea name="comment" className="form-control" rows="5" required maxLength="500" /></label>{error && <p className="text-danger" role="alert">{error}</p>}{message && <p className="text-success" role="status">{message}</p>}<button className="btn btn-success">Enviar consulta</button></form></div></section>;
}
