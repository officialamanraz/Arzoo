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
-- Table structure for table `order_tracking`
--

DROP TABLE IF EXISTS `order_tracking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_tracking` (
  `tracking_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `status` varchar(50) NOT NULL,
  `status_message` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`tracking_id`),
  KEY `fk_order_tracking_order` (`order_id`),
  CONSTRAINT `fk_order_tracking_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_tracking`
--

LOCK TABLES `order_tracking` WRITE;
/*!40000 ALTER TABLE `order_tracking` DISABLE KEYS */;
INSERT INTO `order_tracking` VALUES (43,43,'Order Placed','Your order has been received and is pending verification.','2026-10-28 11:17:20'),(44,44,'Order Placed','Your order has been received and is pending verification.','2026-10-28 12:01:20'),(45,45,'Order Placed','Your order has been received and is pending verification.','2026-10-28 15:43:27'),(46,46,'Order Placed','Your order has been received and is pending verification.','2026-10-28 15:48:28'),(47,47,'Order Placed','Your order has been received and is pending verification.','2026-10-29 04:03:24'),(48,48,'Order Placed','Your order has been received and is pending verification.','2026-10-29 09:15:57'),(49,49,'Order Placed','Your order has been received and is pending verification.','2026-10-29 09:42:43'),(50,50,'Order Placed','Your order has been received and is pending verification.','2026-10-29 10:06:01'),(51,51,'Order Placed','Your order has been received and is pending verification.','2026-10-29 10:07:05'),(52,52,'Order Placed','Your order has been received and is pending verification.','2026-10-29 10:09:55'),(53,53,'Order Placed','Your order has been received and is pending verification.','2026-10-29 10:13:18'),(54,54,'Order Placed','Your order has been received and is pending verification.','2026-10-29 10:29:23'),(55,55,'Order Placed','Your order has been received and is pending verification.','2026-10-29 10:33:00'),(56,56,'Order Placed','Your order is pending payment verification.','2026-10-29 16:11:00'),(57,57,'Order Placed','Your order is pending payment verification.','2026-10-29 16:11:11'),(58,58,'Order Placed','Your order is pending payment verification.','2026-10-29 16:23:53'),(59,59,'Order Placed','Your order has been received and is pending verification.','2026-10-29 16:56:14'),(60,60,'Order Placed','Your order has been received and is pending verification.','2026-11-01 15:39:30');
/*!40000 ALTER TABLE `order_tracking` ENABLE KEYS */;
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

-- Dump completed on 2026-11-02 11:51:43
