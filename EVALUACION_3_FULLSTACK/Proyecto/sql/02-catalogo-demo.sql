-- Datos académicos del catálogo; no contiene usuarios ni credenciales.
USE dinobox;
SET NAMES utf8mb4;
INSERT IGNORE INTO app_role(name) VALUES ('Administrador');
INSERT IGNORE INTO app_role(name) VALUES ('Vendedor');
INSERT IGNORE INTO app_role(name) VALUES ('Cliente');
INSERT IGNORE INTO categories(name) VALUES ('Accesorios');
INSERT IGNORE INTO categories(name) VALUES ('Alimentos');
INSERT IGNORE INTO categories(name) VALUES ('Higiene');
INSERT IGNORE INTO categories(name) VALUES ('Juguetes');
INSERT IGNORE INTO categories(name) VALUES ('Salud');
INSERT IGNORE INTO products(id,category,code,critical,description,icon,image,name,price,stock,category_name) VALUES ('demo-ALI-001','Alimentos','ALI-001',5,'Nutrición completa para perros adultos de tamaño mediano.','🥣','','Alimento adulto para perro',18990,18,'Alimentos');
INSERT IGNORE INTO products(id,category,code,critical,description,icon,image,name,price,stock,category_name) VALUES ('demo-ALI-002','Alimentos','ALI-002',4,'Fórmula equilibrada para el cuidado diario de gatos esterilizados.','🐈','','Alimento para gato esterilizado',15990,12,'Alimentos');
INSERT IGNORE INTO products(id,category,code,critical,description,icon,image,name,price,stock,category_name) VALUES ('demo-SAL-001','Salud','SAL-001',3,'Protección antiparasitaria. Consulta a tu veterinario por dosis y uso.','🩺','','Antiparasitario externo',8990,8,'Salud');
INSERT IGNORE INTO products(id,category,code,critical,description,icon,image,name,price,stock,category_name) VALUES ('demo-HIG-001','Higiene','HIG-001',4,'Limpieza suave para el baño de tu mascota.','🧴','','Shampoo piel sensible',6490,15,'Higiene');
INSERT IGNORE INTO products(id,category,code,critical,description,icon,image,name,price,stock,category_name) VALUES ('demo-ACC-001','Accesorios','ACC-001',5,'Correa resistente para paseos cómodos y seguros.','🦮','','Correa paseo mediana',7990,3,'Accesorios');
INSERT IGNORE INTO products(id,category,code,critical,description,icon,image,name,price,stock,category_name) VALUES ('demo-JUG-001','Juguetes','JUG-001',6,'Estímulo para el juego y el enriquecimiento ambiental.','🎾','','Juguete interactivo',4990,22,'Juguetes');
