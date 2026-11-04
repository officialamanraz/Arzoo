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
-- Table structure for table `orderitems`
--

DROP TABLE IF EXISTS `orderitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orderitems` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `locked_dealer_payout` decimal(10,2) DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `product_sku` varchar(100) DEFAULT NULL,
  `item_status` enum('pending','packed','shipped','delivered','cancelled','returned','refunded') NOT NULL DEFAULT 'pending',
  `discount` decimal(10,2) DEFAULT '0.00',
  `hsn_code` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`item_id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `orderitems_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `orderitems_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orderitems`
--

LOCK TABLES `orderitems` WRITE;
/*!40000 ALTER TABLE `orderitems` DISABLE KEYS */;
INSERT INTO `orderitems` VALUES (46,43,417,1,12200.00,9000.00,'Handcrafted Lime Green Kota Doria Saree with Floral Bootis, Swan Pallu, and Dark Green Blouse',NULL,'pending',0.00,'N/A'),(47,44,417,1,12200.00,9000.00,'Handcrafted Lime Green Kota Doria Saree with Floral Bootis, Swan Pallu, and Dark Green Blouse',NULL,'pending',0.00,'N/A'),(48,45,409,1,55000.00,45000.00,'Handcrafted Rich Magenta Kanjeevaram-Style Silk Saree with All-Over Zari Brocade and Floral Borders',NULL,'pending',0.00,'N/A'),(49,46,413,1,50000.00,40000.00,'Handcrafted Olive Green Kota Doria Saree with Silver-Gold Zari Brocade and Pink Blouse',NULL,'pending',0.00,'N/A'),(50,47,409,1,55000.00,45000.00,'Handcrafted Rich Magenta Kanjeevaram-Style Silk Saree with All-Over Zari Brocade and Floral Borders',NULL,'pending',0.00,'N/A'),(51,48,409,1,55000.00,45000.00,'Handcrafted Rich Magenta Kanjeevaram-Style Silk Saree with All-Over Zari Brocade and Floral Borders',NULL,'pending',0.00,'N/A'),(52,49,410,1,12500.00,10000.00,'Handcrafted Cream & Dark Brown Kota Doria Saree with Floral Bootis and Silver Zari Border',NULL,'pending',0.00,'N/A'),(53,50,399,1,5.00,23000.00,'Handcrafted Vibrant Orange and Yellow Kota Doria Saree with Silver Zari Weaving',NULL,'pending',0.00,'N/A'),(54,51,399,1,5.00,23000.00,'Handcrafted Vibrant Orange and Yellow Kota Doria Saree with Silver Zari Weaving',NULL,'pending',0.00,'N/A'),(55,52,399,1,5.00,23000.00,'Handcrafted Vibrant Orange and Yellow Kota Doria Saree with Silver Zari Weaving',NULL,'pending',0.00,'N/A'),(56,53,399,1,5.00,23000.00,'Handcrafted Vibrant Orange and Yellow Kota Doria Saree with Silver Zari Weaving',NULL,'pending',0.00,'N/A'),(57,54,399,1,5.00,23000.00,'Handcrafted Vibrant Orange and Yellow Kota Doria Saree with Silver Zari Weaving',NULL,'pending',0.00,'N/A'),(58,55,409,1,55000.00,45000.00,'Handcrafted Rich Magenta Kanjeevaram-Style Silk Saree with All-Over Zari Brocade and Floral Borders',NULL,'pending',0.00,'N/A'),(59,56,411,1,13000.00,10000.00,'Handcrafted Sky Blue Kota Doria Saree with White & Blue Floral Bootis and Silver Zari Pallu',NULL,'pending',0.00,'N/A'),(60,57,411,1,13000.00,10000.00,'Handcrafted Sky Blue Kota Doria Saree with White & Blue Floral Bootis and Silver Zari Pallu',NULL,'pending',0.00,'N/A'),(61,58,411,1,13000.00,10000.00,'Handcrafted Sky Blue Kota Doria Saree with White & Blue Floral Bootis and Silver Zari Pallu',NULL,'pending',0.00,'N/A'),(62,59,411,1,13000.00,10000.00,'Handcrafted Sky Blue Kota Doria Saree with White & Blue Floral Bootis and Silver Zari Pallu',NULL,'pending',0.00,'N/A'),(63,60,402,1,16500.00,13500.00,'Handcrafted Beige & Dark Brown Kota Doria Saree with Pichwai-Inspired Cow & Lotus Motifs',NULL,'pending',0.00,'N/A');
/*!40000 ALTER TABLE `orderitems` ENABLE KEYS */;
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

-- Dump completed on 2026-11-02 11:51:20
