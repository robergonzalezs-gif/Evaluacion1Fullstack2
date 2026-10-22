export const allowedDomains = ['@duoc.cl', '@profesor.duoc.cl', '@gmail.com'];

export function isAllowedEmail(email = '') {
  const normalized = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
    && allowedDomains.some((domain) => normalized.endsWith(domain));
}

export function isValidRun(value = '') {
  const run = value.trim().toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(run)) return false;
  const body = run.slice(0, -1);
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  const verifier = remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder);
  return verifier === run.at(-1);
}

export function validateLogin({ email, password }) {
  const errors = {};
  if (!isAllowedEmail(email)) errors.email = 'Usa @duoc.cl, @profesor.duoc.cl o @gmail.com.';
  if (!password || password.length < 4 || password.length > 10) errors.password = 'La contraseña debe tener entre 4 y 10 caracteres.';
  return errors;
}

export function validateRegistration(form) {
  const errors = {};
  if (!isValidRun(form.run)) errors.run = 'RUN inválido; revisa formato y dígito verificador.';
  if (!form.name?.trim()) errors.name = 'Ingresa el nombre.';
  if (!form.lastName?.trim()) errors.lastName = 'Ingresa los apellidos.';
  if (!isAllowedEmail(form.email)) errors.email = 'Usa un correo @duoc.cl, @profesor.duoc.cl o @gmail.com.';
  if (!form.password || form.password.length < 4 || form.password.length > 10) errors.password = 'La contraseña debe tener entre 4 y 10 caracteres.';
  if (!form.region) errors.region = 'Selecciona una región.';
  if (!form.commune) errors.commune = 'Selecciona una comuna.';
  if (!form.address?.trim() || form.address.length > 300) errors.address = 'Ingresa una dirección de hasta 300 caracteres.';
  return errors;
}

export function validateProduct(product, products = []) {
  const errors = {};
  if (!product.code?.trim() || product.code.trim().length < 3) errors.code = 'El código debe tener al menos 3 caracteres.';
  if (!product.name?.trim() || product.name.length > 100) errors.name = 'El nombre es obligatorio (máximo 100 caracteres).';
  if (!product.category) errors.category = 'Selecciona una categoría.';
  if (product.description?.length > 500) errors.description = 'Máximo 500 caracteres.';
  if (!Number.isFinite(Number(product.price)) || Number(product.price) < 0) errors.price = 'El precio debe ser 0 o mayor.';
  if (!Number.isInteger(Number(product.stock)) || Number(product.stock) < 0) errors.stock = 'El stock debe ser un entero igual o mayor a 0.';
  if (product.critical !== '' && product.critical != null && (!Number.isInteger(Number(product.critical)) || Number(product.critical) < 0)) errors.critical = 'El stock crítico debe ser entero e igual o mayor a 0.';
  if (products.some((item) => item.code.toLowerCase() === product.code?.trim().toLowerCase() && item.id !== product.id)) errors.code = 'Ya existe un producto con ese código.';
  return errors;
}

export function formatPrice(value) {
  return Number(value) === 0 ? 'FREE' : new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(value) || 0);
}
