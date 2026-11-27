-- Consultas de revisión; no modifica registros.
USE dinobox;
SHOW TABLES;
SELECT code,name,category,price,stock FROM products ORDER BY code;
SELECT name FROM app_role;
SELECT codigo,origen,destino,descripcion FROM encomienda;
SELECT codigo,secuencia,estado,ubicacion,fecha FROM evento_encomienda ORDER BY codigo,secuencia;
SELECT id,status,total,created_at FROM shop_orders;
