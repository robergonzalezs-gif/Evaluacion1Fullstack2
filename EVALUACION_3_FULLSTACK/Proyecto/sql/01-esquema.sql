-- Estructura sin datos exportada del despliegue AWS.
CREATE DATABASE IF NOT EXISTS dinobox CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE dinobox;
-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: dinobox
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `app_role`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_role` (
  `name` varchar(20) NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `app_user`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_user` (
  `id` varchar(36) NOT NULL,
  `address` varchar(300) DEFAULT NULL,
  `birth_date` varchar(10) DEFAULT NULL,
  `commune` varchar(100) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `name` varchar(50) NOT NULL,
  `password_hash` varchar(100) NOT NULL,
  `region` varchar(100) DEFAULT NULL,
  `run` varchar(9) DEFAULT NULL,
  `role_name` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK1j9d9a06i600gd43uu3km82jw` (`email`),
  KEY `FKliporcgyk034w4j2f9oyt9n7d` (`role_name`),
  CONSTRAINT `FKliporcgyk034w4j2f9oyt9n7d` FOREIGN KEY (`role_name`) REFERENCES `app_role` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auth_session`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_session` (
  `id` varchar(36) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `refresh_hash` varchar(64) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKiu6iwyq1s0n2no3wmqm31m5r6` (`refresh_hash`),
  KEY `FKk7lyfqcj9aocielf2s2uwmgi9` (`user_id`),
  CONSTRAINT `FKk7lyfqcj9aocielf2s2uwmgi9` FOREIGN KEY (`user_id`) REFERENCES `app_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `categories`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `encomienda`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `encomienda` (
  `codigo` varchar(20) NOT NULL,
  `descripcion` varchar(200) NOT NULL,
  `destino` varchar(100) NOT NULL,
  `origen` varchar(100) NOT NULL,
  PRIMARY KEY (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `evento_encomienda`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evento_encomienda` (
  `codigo` varchar(20) NOT NULL,
  `estado` enum('DESPACHO','ENTREGADO','RECEPCION','TRANSITO') NOT NULL,
  `fecha` datetime(6) NOT NULL,
  `ubicacion` varchar(100) NOT NULL,
  `secuencia` int NOT NULL,
  PRIMARY KEY (`codigo`,`secuencia`),
  CONSTRAINT `FKpbbro62nkmo9cnpl0vglr9qdl` FOREIGN KEY (`codigo`) REFERENCES `encomienda` (`codigo`),
  CONSTRAINT `evento_encomienda_chk_1` CHECK ((`secuencia` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_items`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `quantity` int NOT NULL,
  `order_id` varchar(40) NOT NULL,
  `product_id` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKniod2astktfpyce1blv6nrtc8` (`order_id`),
  KEY `FKocimc7dtr037rh4ls4l95nlfi` (`product_id`),
  CONSTRAINT `FKniod2astktfpyce1blv6nrtc8` FOREIGN KEY (`order_id`) REFERENCES `shop_orders` (`id`),
  CONSTRAINT `FKocimc7dtr037rh4ls4l95nlfi` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `products`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` varchar(255) NOT NULL,
  `category` varchar(255) NOT NULL,
  `code` varchar(50) NOT NULL,
  `critical` int NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `icon` varchar(20) DEFAULT NULL,
  `image` varchar(2000) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `stock` int NOT NULL,
  `category_name` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK57ivhy5aj3qfmdvl6vxdfjs4p` (`code`),
  KEY `FKrsuf2sx349vulworir690vw2x` (`category_name`),
  CONSTRAINT `FKrsuf2sx349vulworir690vw2x` FOREIGN KEY (`category_name`) REFERENCES `categories` (`name`),
  CONSTRAINT `products_chk_1` CHECK ((`critical` >= 0)),
  CONSTRAINT `products_chk_2` CHECK ((`stock` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shop_orders`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop_orders` (
  `id` varchar(40) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `request_hash` varchar(64) NOT NULL,
  `request_key` varchar(80) NOT NULL,
  `status` varchar(20) NOT NULL,
  `total` decimal(16,2) NOT NULL,
  `customer_id` varchar(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKkp1j9l035oc3kmaynseqnw7la` (`request_key`),
  KEY `FK6d4i57fhni49c40l4ody8v1yi` (`customer_id`),
  CONSTRAINT `FK6d4i57fhni49c40l4ody8v1yi` FOREIGN KEY (`customer_id`) REFERENCES `app_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-24  0:37:06
