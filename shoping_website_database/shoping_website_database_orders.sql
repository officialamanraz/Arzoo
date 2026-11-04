-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: mysql-11274c71-officialamanraz-0e97.h.aivencloud.com    Database: shoping_website_database
-- ------------------------------------------------------
-- Server version	8.4.11

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '29132eda-7930-11f1-8823-42238db411f9:1-65,
a331ba05-784c-11f1-ab9e-be2a0fc14c24:1-152,
ca04cfac-b434-11f1-a867-fa592adf6086:1-2369,
d3d0292f-caa8-11f1-8116-da7bdc3337ad:1-3072,
e83dde18-94ba-11f1-91ac-7261d5f6cc0e:1-1933,
f878a9a0-7a1c-11f1-b4da-8e357cd95651:1-830';

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('pending','processing','shipped','out_for_delivery','delivery_attempt_failed','delivered','cancelled','rto_initiated') DEFAULT 'pending',
  `payment_id` varchar(255) DEFAULT NULL,
  `ordered_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `payment_method` enum('cod','online') NOT NULL DEFAULT 'cod',
  `payment_status` enum('unpaid','paid') NOT NULL DEFAULT 'unpaid',
  `shipping_address` text NOT NULL,
  `customer_email` varchar(255) NOT NULL,
  `estimated_delivery` date DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `address_id` int DEFAULT NULL,
  `invoice_number` varchar(50) DEFAULT NULL,
  `razorpay_order_id` varchar(100) DEFAULT NULL,
  `tracking_ref` varchar(50) DEFAULT NULL,
  `gateway_fee` decimal(10,2) DEFAULT NULL,
  `net_admin_profit` decimal(10,2) DEFAULT NULL,
  `delivery_attempts_count` int DEFAULT '0',
  `delivered_at` datetime DEFAULT NULL,
  `courier_partner` varchar(100) DEFAULT NULL,
  `tracking_awb_number` varchar(100) DEFAULT NULL,
  `shipping_label_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`order_id`),
  KEY `user_id` (`user_id`),
  KEY `fk_orders_address` (`address_id`),
  CONSTRAINT `fk_orders_address` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`address_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (43,9,12200.00,'cancelled','pay_TtJDpoTqDtFm0w','2026-10-28 11:17:20','online','paid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-10-31',12200.00,119,'KW-2026-000043','order_TtJCaZwlqhi5oI',NULL,244.00,2826.00,0,NULL,NULL,NULL,NULL),(44,9,12200.00,'pending','pay_TtJxBZAdaN0Da5','2026-10-28 12:01:20','online','paid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-10-31',12200.00,119,'KW-2026-000044','order_TtJx4fb4G03wTZ',NULL,244.00,2826.00,0,NULL,NULL,NULL,NULL),(45,9,55000.00,'cancelled','ORD-1793202207575','2026-10-28 15:43:27','online','unpaid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-10-31',55000.00,119,'KW-2026-000045','order_TtNjhZ1U9ikTvz',NULL,1100.00,8770.00,0,NULL,NULL,NULL,NULL),(46,9,50000.00,'cancelled','ORD-1793202508230','2026-10-28 15:48:28','online','unpaid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-10-31',50000.00,119,'KW-2026-000046','order_TtNozaj0XgGK3e',NULL,1000.00,8870.00,0,NULL,NULL,NULL,NULL),(47,9,55000.00,'cancelled','ORD-1793246603829','2026-10-29 04:03:23','online','unpaid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-11-01',55000.00,119,'KW-2026-000047','order_TtaLKChMArWpbR',NULL,1100.00,8770.00,0,NULL,NULL,NULL,NULL),(48,9,55000.00,'cancelled','ORD-1793265357282','2026-10-29 09:15:57','online','unpaid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-11-01',55000.00,119,'KW-2026-000048','order_TtffUJEdCvkhr3',NULL,1100.00,8770.00,0,NULL,NULL,NULL,NULL),(49,9,12500.00,'cancelled','pay_Ttg7uxVbblrxMx','2026-10-29 09:42:43','online','paid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-11-01',12500.00,119,'KW-2026-000049','order_Ttg7lTJx8cqawD',NULL,250.00,2120.00,0,NULL,NULL,NULL,NULL),(50,9,5.00,'pending','ORD-1793268361037','2026-10-29 10:06:01','online','unpaid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-11-01',5.00,119,'KW-2026-000050','order_TtgWN5aoBx4A9H',NULL,0.10,-23125.10,0,NULL,NULL,NULL,NULL),(51,9,5.00,'cancelled','ORD-1793268425103','2026-10-29 10:07:05','online','unpaid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-11-01',5.00,119,'KW-2026-000051','order_TtgXUn5en1kuzK',NULL,0.10,-23125.10,0,NULL,NULL,NULL,NULL),(52,9,5.00,'cancelled','ORD-1793268595151','2026-10-29 10:09:55','online','unpaid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-11-01',5.00,119,'KW-2026-000052','order_TtgaUaEFHJ3DtU',NULL,0.10,-23125.10,0,NULL,NULL,NULL,NULL),(53,9,5.00,'cancelled','ORD-1793268798750','2026-10-29 10:13:18','online','unpaid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-11-01',5.00,119,'KW-2026-000053','order_Ttge4lpcJIaavs',NULL,0.10,-23125.10,0,NULL,NULL,NULL,NULL),(54,9,5.00,'delivered','pay_TtgvNzCjgDhk2B','2026-10-29 10:29:23','online','paid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-11-01',5.00,119,'KW-2026-000054','order_Ttgv3xJ3SnH1k7',NULL,0.10,-23125.10,0,NULL,NULL,NULL,NULL),(55,9,55000.00,'pending','ORD-1793269980156','2026-10-29 10:33:00','online','unpaid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-11-01',55000.00,119,'KW-2026-000055','order_TtgysTpQOHOZk8',NULL,1100.00,8770.00,0,NULL,NULL,NULL,NULL),(56,9,13000.00,'pending','pending','2026-10-29 16:11:00','online','unpaid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-11-01',13000.00,119,'KW-2026-000056',NULL,NULL,306.80,2563.20,0,NULL,NULL,NULL,NULL),(57,9,13000.00,'cancelled','pending','2026-10-29 16:11:11','online','unpaid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-11-01',13000.00,119,'KW-2026-000057',NULL,NULL,306.80,2563.20,0,NULL,NULL,NULL,NULL),(58,9,13000.00,'cancelled','pending','2026-10-29 16:23:53','online','unpaid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-11-01',13000.00,119,'KW-2026-000058','order_TtmxWn8HI1FGqp',NULL,306.80,2563.20,0,NULL,NULL,NULL,NULL),(59,9,13000.00,'pending','ORD-1793292973799','2026-10-29 16:56:13','online','unpaid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-11-01',13000.00,119,'KW-2026-000059','order_TtnVgqwLsNylqA',NULL,306.80,2563.20,0,NULL,NULL,NULL,NULL),(60,5,16500.00,'pending','ORD-1793547570399','2026-11-01 15:39:30','online','unpaid','house no 40, mavasha road, bnaa hotel, kota, Rajasthan - 325001, Phone: 9530060288','officialamanraz@gmail.com','2026-11-04',16500.00,1,'KW-2026-000060','order_Tuxo0iNjxuHSjG',NULL,389.40,2480.60,0,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-02 11:50:38
