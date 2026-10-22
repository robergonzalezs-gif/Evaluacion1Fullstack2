export const seedProducts = [
  { id: 'p1', code: 'ALI-001', name: 'Alimento adulto para perro', description: 'Nutrición completa para perros adultos de tamaño mediano.', category: 'Alimentos', price: 18990, stock: 18, critical: 5, icon: '🥣' },
  { id: 'p2', code: 'ALI-002', name: 'Alimento para gato esterilizado', description: 'Fórmula equilibrada para el cuidado diario de gatos esterilizados.', category: 'Alimentos', price: 15990, stock: 12, critical: 4, icon: '🐈' },
  { id: 'p3', code: 'SAL-001', name: 'Antiparasitario externo', description: 'Protección antiparasitaria. Consulta a tu veterinario por dosis y uso.', category: 'Salud', price: 8990, stock: 8, critical: 3, icon: '🩺' },
  { id: 'p4', code: 'HIG-001', name: 'Shampoo piel sensible', description: 'Limpieza suave para el baño de tu mascota.', category: 'Higiene', price: 6490, stock: 15, critical: 4, icon: '🧴' },
  { id: 'p5', code: 'ACC-001', name: 'Correa paseo mediana', description: 'Correa resistente para paseos cómodos y seguros.', category: 'Accesorios', price: 7990, stock: 3, critical: 5, icon: '🦮' },
  { id: 'p6', code: 'JUG-001', name: 'Juguete interactivo', description: 'Estímulo para el juego y el enriquecimiento ambiental.', category: 'Juguetes', price: 4990, stock: 22, critical: 6, icon: '🎾' },
];

export const initialUsers = [
  { id: 'u-admin', name: 'Administración', email: 'admin@gmail.com', password: 'admin123', role: 'Administrador' },
  { id: 'u-seller', name: 'Vendedor', email: 'vendedor@gmail.com', password: 'venta123', role: 'Vendedor' },
];
