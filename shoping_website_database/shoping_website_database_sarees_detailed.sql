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
-- Table structure for table `sarees_detailed`
--

DROP TABLE IF EXISTS `sarees_detailed`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sarees_detailed` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `thumbnail` varchar(500) DEFAULT NULL,
  `primary_color` varchar(100) DEFAULT 'none',
  `other_color` varchar(100) DEFAULT 'none',
  `border_type` varchar(100) DEFAULT 'none',
  `pattern` varchar(100) DEFAULT 'none',
  `craft` varchar(100) DEFAULT 'none',
  `weave` varchar(100) DEFAULT 'none',
  `zari_type` varchar(100) DEFAULT 'none',
  `blouse` varchar(100) DEFAULT 'none',
  `border_motifs` varchar(100) DEFAULT 'none',
  `origin` varchar(100) DEFAULT 'none',
  `fabric_material` varchar(100) DEFAULT 'none',
  `khats` varchar(100) DEFAULT 'none',
  `product_weight` varchar(100) DEFAULT 'none',
  `blouse_length` varchar(100) DEFAULT 'none',
  `saree_length` varchar(100) DEFAULT 'none',
  `saree_width` varchar(100) DEFAULT 'none',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sarees_detailed`
--

LOCK TABLES `sarees_detailed` WRITE;
/*!40000 ALTER TABLE `sarees_detailed` DISABLE KEYS */;
/*!40000 ALTER TABLE `sarees_detailed` ENABLE KEYS */;
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

-- Dump completed on 2026-11-02 11:51:14
