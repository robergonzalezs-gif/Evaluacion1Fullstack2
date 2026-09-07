/* =========================================================
   Veterinaria San Marcos — validacion.js
   - Menú de navegación (hamburguesa)
   - Botón "volver arriba"
   - Validación de formularios (Citas y Contacto)
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Menú móvil ---------- */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  /* ---------- Botón volver arriba ---------- */
  const toTopBtn = document.querySelector('.to-top');
  if (toTopBtn) {
    window.addEventListener('scroll', () => {
      toTopBtn.classList.toggle('is-visible', window.scrollY > 480);
    });
    toTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Filtro de catálogo (servicios.html) ---------- */
  const filterButtons = document.querySelectorAll('.filter-btn');
  const serviceCards = document.querySelectorAll('.service-card');
  if (filterButtons.length && serviceCards.length) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', 'true');
        const cat = btn.dataset.filter;
        serviceCards.forEach(card => {
          const show = cat === 'todos' || card.dataset.category === cat;
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* =========================================================
     Motor de validación reutilizable
     ========================================================= */

  const validators = {
    required(value) {
      return value.trim().length > 0;
    },
    email(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    },
    phone(value) {
      // Acepta formatos chilenos: +56 9 1234 5678, 912345678, 9 1234 5678
      const digits = value.replace(/\D/g, '');
      return digits.length >= 9 && digits.length <= 11;
    },
    minLength(value, len) {
      return value.trim().length >= len;
    },
    notPast(value) {
      if (!value) return false;
      const chosen = new Date(value + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return chosen >= today;
    },
  };

  const messages = {
    required: 'Este campo es obligatorio.',
    email: 'Ingresa un correo válido, por ejemplo nombre@dominio.cl',
    phone: 'Ingresa un teléfono válido (9 a 11 dígitos), ej: +56 9 1234 5678',
    minLength: (len) => `Debe tener al menos ${len} caracteres.`,
    notPast: 'La fecha no puede ser anterior a hoy.',
    select: 'Selecciona una opción.',
  };

  function setFieldError(field, errorEl, message) {
    field.closest('.field')?.classList.add('has-error');
    field.setAttribute('aria-invalid', 'true');
    if (errorEl) errorEl.textContent = message;
  }

  function clearFieldError(field, errorEl) {
    field.closest('.field')?.classList.remove('has-error');
    field.setAttribute('aria-invalid', 'false');
    if (errorEl) errorEl.textContent = '';
  }

  /**
   * Valida un campo según las reglas indicadas en su atributo data-rules.
   * data-rules="required,email"  |  data-rules="required,minLength:10"
   */
  function validateField(field) {
    const errorEl = document.getElementById(field.id + '-error');
    const rules = (field.dataset.rules || '').split(',').map(r => r.trim()).filter(Boolean);
    const value = field.value;

    if (field.tagName === 'SELECT' && rules.includes('required')) {
      if (!value) {
        setFieldError(field, errorEl, messages.select);
        return false;
      }
    }

    for (const rule of rules) {
      const [name, arg] = rule.split(':');
      if (name === 'required' && !validators.required(value)) {
        setFieldError(field, errorEl, messages.required);
        return false;
      }
      if (name === 'email' && value && !validators.email(value)) {
        setFieldError(field, errorEl, messages.email);
        return false;
      }
      if (name === 'phone' && value && !validators.phone(value)) {
        setFieldError(field, errorEl, messages.phone);
        return false;
      }
      if (name === 'minLength' && value && !validators.minLength(value, Number(arg))) {
        setFieldError(field, errorEl, messages.minLength(Number(arg)));
        return false;
      }
      if (name === 'notPast' && value && !validators.notPast(value)) {
        setFieldError(field, errorEl, messages.notPast);
        return false;
      }
    }

    clearFieldError(field, errorEl);
    return true;
  }

  function wireForm(formId, statusId, onValidSuccessText) {
    const form = document.getElementById(formId);
    if (!form) return;
    const status = document.getElementById(statusId);
    const fields = Array.from(form.querySelectorAll('[data-rules]'));

    fields.forEach(field => {
      const evt = (field.tagName === 'SELECT' || field.type === 'date') ? 'change' : 'blur';
      field.addEventListener(evt, () => validateField(field));
      field.addEventListener('input', () => {
        if (field.closest('.field')?.classList.contains('has-error')) {
          validateField(field);
        }
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let allValid = true;
      fields.forEach(field => {
        const valid = validateField(field);
        if (!valid) allValid = false;
      });

      if (!allValid) {
        status.textContent = 'Revisa los campos marcados en rojo antes de continuar.';
        status.className = 'form-status is-visible err';
        const firstError = form.querySelector('.has-error input, .has-error select, .has-error textarea');
        firstError?.focus();
        return;
      }

      status.textContent = onValidSuccessText;
      status.className = 'form-status is-visible ok';
      form.reset();
      fields.forEach(field => clearFieldError(field, document.getElementById(field.id + '-error')));
    });
  }

  wireForm(
    'form-citas',
    'form-citas-status',
    'Solicitud enviada. La recepcionista confirmará tu hora por correo o teléfono en las próximas 24 horas.'
  );

  wireForm(
    'form-contacto',
    'form-contacto-status',
    'Mensaje enviado. Te responderemos a la brevedad.'
  );

  /* ---------- Fecha mínima = hoy en el input de citas ---------- */
  const fechaInput = document.getElementById('fecha');
  if (fechaInput) {
    const today = new Date().toISOString().split('T')[0];
    fechaInput.setAttribute('min', today);
  }
});
