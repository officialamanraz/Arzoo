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
d3d0292f-caa8-11f1-8116-da7bdc3337ad:1-3148,
e83dde18-94ba-11f1-91ac-7261d5f6cc0e:1-1933,
f878a9a0-7a1c-11f1-b4da-8e357cd95651:1-830';

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `addresses` (
  `address_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `alternate_phone` varchar(20) DEFAULT NULL,
  `pincode` varchar(10) NOT NULL,
  `state` varchar(100) NOT NULL,
  `city` varchar(100) NOT NULL,
  `house_no` varchar(255) NOT NULL,
  `road_area` varchar(255) NOT NULL,
  `landmark` varchar(255) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`address_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=123 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addresses`
--

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
INSERT INTO `addresses` VALUES (1,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','kota','house no 40','mavasha road','bnaa hotel',0,'2026-07-01 13:39:07'),(2,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','kota','house no 40','mavasha road','bnaa hotel',0,'2026-07-01 13:40:11'),(3,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','kota','house no 40','mavasha road','bnaa hotel',0,'2026-07-01 13:40:18'),(4,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','kota','house no 40','mavasha road',NULL,0,'2026-07-01 14:04:08'),(5,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','kota','house no 40','mavasha road',NULL,0,'2026-07-01 14:04:25'),(6,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','kota','house no 40','mavasha road',NULL,0,'2026-07-01 14:12:51'),(7,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','kota','house no 40','mavasha road',NULL,0,'2026-07-01 14:12:58'),(8,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','kota','house no 40','mavasha road',NULL,0,'2026-07-01 14:52:19'),(9,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','kota','house no 40','mavasha road',NULL,0,'2026-07-01 14:52:25'),(10,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kaithoon','house no 40','mavasha road',NULL,0,'2026-07-01 14:55:08'),(11,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kaithoon','house no 40','mavasha road',NULL,0,'2026-07-01 15:06:42'),(12,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','kota','house no 40','mavasha road',NULL,0,'2026-07-01 15:07:07'),(13,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','kota','house no 40','mavasha road',NULL,0,'2026-07-01 15:16:51'),(14,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','kota','house no 40','mavasha road',NULL,0,'2026-07-01 15:33:29'),(15,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','kota','house no 40','mavasha road',NULL,0,'2026-07-01 15:35:35'),(16,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','kota','house no 40','qufy',NULL,0,'2026-07-01 15:36:37'),(17,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kaithoon','house no 40','qufy',NULL,0,'2026-07-01 16:04:49'),(18,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kaithoon','house no 40','qufy',NULL,0,'2026-07-01 16:11:47'),(19,5,'Aman Raza','9530060288','8955491610','325001','Rajasthan','kota','house no 40','mavasha road','bnaa hotel',0,'2026-07-01 16:12:37'),(20,5,'Aman Raza','9530060288','9530060288','325001','Rajasthan','kota','house no 40','qufy','bnaa hotel',0,'2026-07-01 16:13:30'),(21,5,'Aman Raza','9530060288','9530060288','325001','Rajasthan','Kaithoon','house no 40','mavasha road','bnaa hotel',0,'2026-07-01 16:14:06'),(22,5,'Aman Raza','9530060288','9530060288','325001','Rajasthan','kota','house no 40','mavasha road','bnaa hotel',0,'2026-07-01 16:18:47'),(23,5,'Aman Raza','9530060288','9530060288','325001','Rajasthan','kota','house no 40','mavasha road','bnaa hotel',0,'2026-07-01 16:19:59'),(24,5,'Aman Raza','9530060288','9530060288','325001','Rajasthan','Kaithoon','house no 40','mavasha road','bnaa hotel',0,'2026-07-01 16:21:11'),(25,5,'Aman Raza','9530060288','9530060288','325001','Rajasthan','kota','house no 40','mavasha road','bnaa hotel',0,'2026-07-01 16:25:26'),(26,5,'Aman Raza','9530060288','9530060288','325001','Rajasthan','kota','house no 40','mavasha road','bnaa hotel',0,'2026-07-01 16:28:29'),(27,5,'Aman Raza','9530060288','9530060288','325001','Rajasthan','Kota','house no 40','mavasha road','bnaa hotel',0,'2026-07-01 16:30:08'),(28,5,'Aman Raza','9530060288','9530060288','325001','Rajasthan','Kota','house no 40','mavasha road','bnaa hotel',0,'2026-07-01 16:46:05'),(29,5,'Aman Raza','9530060288','9530060288','325001','Rajasthan','Kota','house no 40','mavasha road','bnaa hotel',0,'2026-07-01 18:43:02'),(30,5,'Aman Raza','9530060288','9530060288','325001','Rajasthan','Kota','house no 40','mavasha road','bnaa hotel',0,'2026-07-01 18:43:37'),(31,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kaithoon','house no 40','mavasha road',NULL,0,'2026-07-01 18:48:11'),(32,5,'Aman Raza','9530060288','9530060288','325001','Rajasthan','Kota','house no 40','mavasha road','bnaa hotel',0,'2026-07-02 04:29:07'),(33,5,'Aman Raza','9530060288','9530060288','325001','Rajasthan','Kota','house no 40','mavasha road','bnaa hotel',0,'2026-07-02 04:29:13'),(34,5,'Aman Raza','9530060288','9530060288','325001','Rajasthan','Kota','house no 40','mavasha road','bnaa hotel',0,'2026-07-02 04:32:27'),(35,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 04:32:46'),(36,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 04:33:54'),(37,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 04:37:40'),(38,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 04:38:36'),(39,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 05:12:12'),(40,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 05:13:58'),(41,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 05:13:59'),(42,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 05:13:59'),(43,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 05:13:59'),(44,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 05:13:59'),(45,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 05:14:37'),(46,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kaithoon','house no 40','mavasha road',NULL,0,'2026-07-02 05:15:33'),(47,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 05:19:25'),(48,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 05:31:21'),(49,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 05:38:47'),(50,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kaithoon','house no 40','mavasha road',NULL,0,'2026-07-02 05:39:52'),(51,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 05:42:49'),(52,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 05:43:10'),(53,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 05:47:16'),(54,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 05:49:50'),(55,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 05:55:10'),(56,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 06:08:21'),(57,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 06:08:27'),(58,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 06:08:27'),(59,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 06:11:51'),(60,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 06:57:21'),(61,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 06:59:38'),(62,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 08:41:07'),(63,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 08:41:12'),(64,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 08:53:42'),(65,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kaithoon','house no 40','mavasha road',NULL,0,'2026-07-02 08:55:43'),(66,5,'Aman Raza','9530060288',NULL,'324001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 09:38:50'),(67,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 13:48:51'),(68,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 14:05:47'),(69,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 14:06:18'),(70,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 14:20:52'),(71,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 15:31:20'),(72,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 15:32:02'),(73,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 15:48:40'),(74,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 16:06:00'),(75,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 16:10:24'),(76,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 16:10:48'),(77,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 16:19:25'),(78,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 16:32:42'),(79,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 16:39:16'),(80,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 17:11:13'),(81,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 17:22:01'),(82,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 17:41:58'),(83,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-02 17:58:06'),(84,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-03 05:38:41'),(85,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-03 05:41:42'),(86,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-03 06:02:00'),(87,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-03 06:08:10'),(88,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road','bnaa hotel',0,'2026-07-03 06:32:36'),(89,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-03 06:46:39'),(90,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-03 07:07:21'),(91,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-04 04:15:19'),(92,7,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-04 12:08:11'),(93,7,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-04 12:08:46'),(94,7,'shavez','9530060288',NULL,'324001','Rajasthan','Kota','house no 40','bus stand',NULL,0,'2026-07-04 12:09:45'),(95,7,'shavez','9530060288',NULL,'324001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-04 14:19:02'),(96,7,'shavez','9530060288',NULL,'325001','Rajasthan','Kaithoon','house no 40','bus stand',NULL,0,'2026-07-04 15:07:25'),(97,7,'shavez','9530060288',NULL,'324001','Rajasthan','Kota','house no 40','bus stand',NULL,0,'2026-07-04 15:16:08'),(98,7,'shavez','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','bus stand',NULL,0,'2026-07-05 05:36:34'),(99,7,'shavez','9530060288',NULL,'324001','Rajasthan','Kota','house no 40','bus stand',NULL,0,'2026-07-05 05:48:47'),(100,7,'shavez','9530060288',NULL,'324001','Rajasthan','Kota','house no 40','mavasha road',NULL,0,'2026-07-05 05:57:47'),(101,6,'Mohammed Shavez Ansari','7229943506',NULL,'326519','Rajasthan','Kota','44 abc','Abc road',NULL,0,'2026-07-23 15:44:58'),(102,6,'Mohammed Shavez Ansari','7229943506',NULL,'326519','Rajasthan','Kota','Abc ','Abc ',NULL,0,'2026-07-23 15:45:55'),(103,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kaithoon','house 40','near bna hotel ',NULL,0,'2026-07-23 15:50:01'),(104,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kaithoon','house 40','near bna hotel ',NULL,0,'2026-07-23 16:19:38'),(105,6,'Mohammed Shavez Ansari','7229943506',NULL,'325001','Rajasthan','Kaithoon','44 abc','Abc road',NULL,0,'2026-07-25 03:44:47'),(106,6,'Mohammed Shavez Ansari','7229943506',NULL,'325001','Rajasthan','Kaithoon','44 abc','Abc road',NULL,0,'2026-07-25 03:46:23'),(107,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kaithoon','house 40','near bna hotel ',NULL,0,'2026-07-25 04:22:57'),(108,8,'Ayan','9216899003',NULL,'325001','Rajasthan','Kota','189','Muasa road ','Near bnaa hotel',0,'2026-07-27 14:17:55'),(109,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kota','house no 40','mavasha road','bnaa hotel',0,'2026-08-16 08:42:55'),(110,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kaithoon','house 40','near bna hotel ',NULL,0,'2026-08-19 16:45:32'),(111,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kaithoon','house 40','near bna hotel ',NULL,0,'2026-08-19 18:51:03'),(112,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kaithoon','house 40','near bna hotel ',NULL,0,'2026-08-20 04:18:37'),(113,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kaithoon','house 40','near bna hotel ',NULL,0,'2026-08-20 04:41:05'),(114,6,'Mohammed Shavez Ansari','7229943506',NULL,'326519','Rajasthan','Kota','44 abc','Abc road',NULL,0,'2026-08-23 07:04:35'),(115,6,'Mohammed Shavez Ansari','7229943506',NULL,'326519','Rajasthan','Kota','44 abc','Abc road',NULL,0,'2026-08-23 07:06:09'),(116,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kaithoon','house 40','near bna hotel ',NULL,0,'2026-08-23 08:07:41'),(117,5,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kaithoon','house 40','near bna hotel ',NULL,0,'2026-08-23 08:13:22'),(118,6,'Mohammed Shavez Ansari','7229943506',NULL,'326519','Rajasthan','Kota','44 abc','Abc road',NULL,0,'2026-08-23 08:16:35'),(119,9,'Aman Raza','9530060288',NULL,'325001','Rajasthan','Kaithoon','house 40','near bna hotel ',NULL,0,'2026-09-13 06:36:30'),(120,9,'Aman Raza','9530060288',NULL,'324001','Rajasthan','Kota','house 40','near bna hotel ',NULL,0,'2026-10-03 06:54:08'),(121,5,'Aman','9530060288',NULL,'123586','Raj','Kota','Fhj','Xcjl',NULL,0,'2026-10-22 09:35:09'),(122,13,'Aman','9530060288',NULL,'325001','Rajasthan','लाडपुरा (कैथून)','Ghjkll','Vvjkll',NULL,0,'2026-10-24 18:47:54');
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `banners`
--

DROP TABLE IF EXISTS `banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `banners` (
  `banner_id` int NOT NULL AUTO_INCREMENT,
  `image_url` varchar(255) NOT NULL,
  `mobile_image_url` varchar(255) DEFAULT NULL,
  `title` varchar(150) DEFAULT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `button_text` varchar(50) DEFAULT NULL,
  `button_link` varchar(255) DEFAULT NULL,
  `display_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`banner_id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banners`
--

LOCK TABLES `banners` WRITE;
/*!40000 ALTER TABLE `banners` DISABLE KEYS */;
INSERT INTO `banners` VALUES (23,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/banners/desktop-1793178808510-banner1_uARWU3r2z.png','https://ik.imagekit.io/5gma4ap5d/arzoo-saree/banners/mobile-1793178812470-banner2_N9VjJ6Ei_.png',NULL,NULL,NULL,'/product/409',0,1,'2026-10-28 09:13:36'),(24,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/banners/desktop-1793181284215-banner3_Vr3n2DcJY5.png','https://ik.imagekit.io/5gma4ap5d/arzoo-saree/banners/mobile-1793181288731-banner4_cs0dUqqzM.png',NULL,NULL,NULL,'/product/413',0,1,'2026-10-28 09:54:51');
/*!40000 ALTER TABLE `banners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart`
--

DROP TABLE IF EXISTS `cart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart` (
  `cart_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`cart_id`),
  KEY `user_id` (`user_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart`
--

LOCK TABLES `cart` WRITE;
/*!40000 ALTER TABLE `cart` DISABLE KEYS */;
INSERT INTO `cart` VALUES (25,NULL,13,1,'2026-06-28 06:02:08','2026-06-28 06:02:08'),(29,NULL,13,1,'2026-06-28 08:11:17','2026-06-28 08:11:17'),(30,NULL,4,1,'2026-06-28 08:14:59','2026-06-28 08:14:59'),(31,NULL,13,1,'2026-06-28 08:19:17','2026-06-28 08:19:17'),(32,NULL,11,1,'2026-06-28 08:19:43','2026-06-28 08:19:43'),(33,NULL,11,1,'2026-06-28 08:33:30','2026-06-28 08:33:30'),(43,8,4,1,'2026-07-27 14:14:59','2026-07-27 14:14:59'),(44,5,7,1,'2026-08-21 18:52:35','2026-08-21 18:52:35'),(45,6,3,1,'2026-08-23 07:04:14','2026-08-23 07:04:14'),(58,9,7,3,'2026-09-27 14:00:19','2026-10-03 07:19:55'),(59,5,67,1,'2026-09-27 14:31:42','2026-09-27 14:31:42'),(60,9,12,1,'2026-10-01 17:41:03','2026-10-01 17:41:03'),(61,9,376,1,'2026-10-02 18:30:29','2026-10-02 18:30:29'),(62,5,4,1,'2026-10-05 11:58:41','2026-10-05 11:58:41'),(63,9,4,1,'2026-10-26 05:06:43','2026-10-26 05:06:43'),(64,9,397,1,'2026-10-27 06:08:20','2026-10-27 06:08:20'),(65,9,409,1,'2026-10-28 11:12:39','2026-10-28 11:12:39'),(66,9,417,2,'2026-10-28 11:13:29','2026-10-28 11:15:34'),(67,14,418,1,'2026-10-28 11:17:35','2026-10-28 11:17:35'),(68,9,420,1,'2026-10-29 17:00:56','2026-10-29 17:00:56'),(69,9,413,1,'2026-10-31 10:55:53','2026-10-31 10:55:53');
/*!40000 ALTER TABLE `cart` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `parent_id` int DEFAULT NULL,
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Kota Doria Saree','kota-doria-saree',NULL),(2,'Bnaarsi','kota-bnaarsi',NULL),(3,'Silk','kota-silk',NULL);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dealer_transfers`
--

DROP TABLE IF EXISTS `dealer_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dealer_transfers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transfer_id` varchar(100) NOT NULL,
  `dealer_id` int NOT NULL,
  `order_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','processed','failed') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transfer_id` (`transfer_id`),
  KEY `dealer_id` (`dealer_id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `dealer_transfers_ibfk_1` FOREIGN KEY (`dealer_id`) REFERENCES `dealers` (`dealer_id`) ON DELETE CASCADE,
  CONSTRAINT `dealer_transfers_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dealer_transfers`
--

LOCK TABLES `dealer_transfers` WRITE;
/*!40000 ALTER TABLE `dealer_transfers` DISABLE KEYS */;
/*!40000 ALTER TABLE `dealer_transfers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dealers`
--

DROP TABLE IF EXISTS `dealers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dealers` (
  `dealer_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `razorpay_linked_account_id` varchar(100) DEFAULT NULL,
  `commission_percentage` decimal(5,2) NOT NULL DEFAULT '10.00',
  `status` enum('pending','active','suspended') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `image_url` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`dealer_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dealers`
--

LOCK TABLES `dealers` WRITE;
/*!40000 ALTER TABLE `dealers` DISABLE KEYS */;
INSERT INTO `dealers` VALUES (1,'Aman saare','officialamanraz@gmail.com','+919530060288','acc_xyzd456',5.00,'suspended','2026-09-13 05:31:11','https://ik.imagekit.io/5gma4ap5d/arzoo-saree/dealers/dealer_update_1789280810036-Screenshot__3__30-QX2egH.png'),(2,'Amir','amiralii0611@gmail.com','9166293202',NULL,10.00,'active','2026-10-26 10:11:05',NULL);
/*!40000 ALTER TABLE `dealers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_status_history`
--

DROP TABLE IF EXISTS `order_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_status_history` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `status` varchar(50) NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `order_status_history_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_status_history`
--

LOCK TABLES `order_status_history` WRITE;
/*!40000 ALTER TABLE `order_status_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_status_history` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_tracking`
--

LOCK TABLES `order_tracking` WRITE;
/*!40000 ALTER TABLE `order_tracking` DISABLE KEYS */;
INSERT INTO `order_tracking` VALUES (43,43,'Order Placed','Your order has been received and is pending verification.','2026-10-28 11:17:20'),(44,44,'Order Placed','Your order has been received and is pending verification.','2026-10-28 12:01:20'),(45,45,'Order Placed','Your order has been received and is pending verification.','2026-10-28 15:43:27'),(46,46,'Order Placed','Your order has been received and is pending verification.','2026-10-28 15:48:28'),(47,47,'Order Placed','Your order has been received and is pending verification.','2026-10-29 04:03:24'),(48,48,'Order Placed','Your order has been received and is pending verification.','2026-10-29 09:15:57'),(49,49,'Order Placed','Your order has been received and is pending verification.','2026-10-29 09:42:43'),(50,50,'Order Placed','Your order has been received and is pending verification.','2026-10-29 10:06:01'),(51,51,'Order Placed','Your order has been received and is pending verification.','2026-10-29 10:07:05'),(52,52,'Order Placed','Your order has been received and is pending verification.','2026-10-29 10:09:55'),(53,53,'Order Placed','Your order has been received and is pending verification.','2026-10-29 10:13:18'),(54,54,'Order Placed','Your order has been received and is pending verification.','2026-10-29 10:29:23'),(55,55,'Order Placed','Your order has been received and is pending verification.','2026-10-29 10:33:00'),(56,56,'Order Placed','Your order is pending payment verification.','2026-10-29 16:11:00'),(57,57,'Order Placed','Your order is pending payment verification.','2026-10-29 16:11:11'),(58,58,'Order Placed','Your order is pending payment verification.','2026-10-29 16:23:53'),(59,59,'Order Placed','Your order has been received and is pending verification.','2026-10-29 16:56:14'),(60,60,'Order Placed','Your order has been received and is pending verification.','2026-11-01 15:39:30'),(61,61,'Order Placed','Your order has been received and is pending verification.','2026-11-02 19:00:39');
/*!40000 ALTER TABLE `order_tracking` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orderitems`
--

LOCK TABLES `orderitems` WRITE;
/*!40000 ALTER TABLE `orderitems` DISABLE KEYS */;
INSERT INTO `orderitems` VALUES (46,43,417,1,12200.00,9000.00,'Handcrafted Lime Green Kota Doria Saree with Floral Bootis, Swan Pallu, and Dark Green Blouse',NULL,'pending',0.00,'N/A'),(47,44,417,1,12200.00,9000.00,'Handcrafted Lime Green Kota Doria Saree with Floral Bootis, Swan Pallu, and Dark Green Blouse',NULL,'pending',0.00,'N/A'),(48,45,409,1,55000.00,45000.00,'Handcrafted Rich Magenta Kanjeevaram-Style Silk Saree with All-Over Zari Brocade and Floral Borders',NULL,'pending',0.00,'N/A'),(49,46,413,1,50000.00,40000.00,'Handcrafted Olive Green Kota Doria Saree with Silver-Gold Zari Brocade and Pink Blouse',NULL,'pending',0.00,'N/A'),(50,47,409,1,55000.00,45000.00,'Handcrafted Rich Magenta Kanjeevaram-Style Silk Saree with All-Over Zari Brocade and Floral Borders',NULL,'pending',0.00,'N/A'),(51,48,409,1,55000.00,45000.00,'Handcrafted Rich Magenta Kanjeevaram-Style Silk Saree with All-Over Zari Brocade and Floral Borders',NULL,'pending',0.00,'N/A'),(52,49,410,1,12500.00,10000.00,'Handcrafted Cream & Dark Brown Kota Doria Saree with Floral Bootis and Silver Zari Border',NULL,'pending',0.00,'N/A'),(53,50,399,1,5.00,23000.00,'Handcrafted Vibrant Orange and Yellow Kota Doria Saree with Silver Zari Weaving',NULL,'pending',0.00,'N/A'),(54,51,399,1,5.00,23000.00,'Handcrafted Vibrant Orange and Yellow Kota Doria Saree with Silver Zari Weaving',NULL,'pending',0.00,'N/A'),(55,52,399,1,5.00,23000.00,'Handcrafted Vibrant Orange and Yellow Kota Doria Saree with Silver Zari Weaving',NULL,'pending',0.00,'N/A'),(56,53,399,1,5.00,23000.00,'Handcrafted Vibrant Orange and Yellow Kota Doria Saree with Silver Zari Weaving',NULL,'pending',0.00,'N/A'),(57,54,399,1,5.00,23000.00,'Handcrafted Vibrant Orange and Yellow Kota Doria Saree with Silver Zari Weaving',NULL,'pending',0.00,'N/A'),(58,55,409,1,55000.00,45000.00,'Handcrafted Rich Magenta Kanjeevaram-Style Silk Saree with All-Over Zari Brocade and Floral Borders',NULL,'pending',0.00,'N/A'),(59,56,411,1,13000.00,10000.00,'Handcrafted Sky Blue Kota Doria Saree with White & Blue Floral Bootis and Silver Zari Pallu',NULL,'pending',0.00,'N/A'),(60,57,411,1,13000.00,10000.00,'Handcrafted Sky Blue Kota Doria Saree with White & Blue Floral Bootis and Silver Zari Pallu',NULL,'pending',0.00,'N/A'),(61,58,411,1,13000.00,10000.00,'Handcrafted Sky Blue Kota Doria Saree with White & Blue Floral Bootis and Silver Zari Pallu',NULL,'pending',0.00,'N/A'),(62,59,411,1,13000.00,10000.00,'Handcrafted Sky Blue Kota Doria Saree with White & Blue Floral Bootis and Silver Zari Pallu',NULL,'pending',0.00,'N/A'),(63,60,402,1,16500.00,13500.00,'Handcrafted Beige & Dark Brown Kota Doria Saree with Pichwai-Inspired Cow & Lotus Motifs',NULL,'pending',0.00,'N/A'),(64,61,397,1,44000.00,40000.00,'new product',NULL,'pending',0.00,'N/A');
/*!40000 ALTER TABLE `orderitems` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (43,9,12200.00,'cancelled','pay_TtJDpoTqDtFm0w','2026-10-28 11:17:20','online','paid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-10-31',12200.00,119,'KW-2026-000043','order_TtJCaZwlqhi5oI',NULL,244.00,2826.00,0,NULL,NULL,NULL,NULL),(44,9,12200.00,'cancelled','pay_TtJxBZAdaN0Da5','2026-10-28 12:01:20','online','paid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-10-31',12200.00,119,'KW-2026-000044','order_TtJx4fb4G03wTZ',NULL,244.00,2826.00,0,NULL,NULL,NULL,NULL),(45,9,55000.00,'cancelled','ORD-1793202207575','2026-10-28 15:43:27','online','unpaid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-10-31',55000.00,119,'KW-2026-000045','order_TtNjhZ1U9ikTvz',NULL,1100.00,8770.00,0,NULL,NULL,NULL,NULL),(46,9,50000.00,'cancelled','ORD-1793202508230','2026-10-28 15:48:28','online','unpaid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-10-31',50000.00,119,'KW-2026-000046','order_TtNozaj0XgGK3e',NULL,1000.00,8870.00,0,NULL,NULL,NULL,NULL),(47,9,55000.00,'cancelled','ORD-1793246603829','2026-10-29 04:03:23','online','unpaid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-11-01',55000.00,119,'KW-2026-000047','order_TtaLKChMArWpbR',NULL,1100.00,8770.00,0,NULL,NULL,NULL,NULL),(48,9,55000.00,'cancelled','ORD-1793265357282','2026-10-29 09:15:57','online','unpaid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-11-01',55000.00,119,'KW-2026-000048','order_TtffUJEdCvkhr3',NULL,1100.00,8770.00,0,NULL,NULL,NULL,NULL),(49,9,12500.00,'cancelled','pay_Ttg7uxVbblrxMx','2026-10-29 09:42:43','online','paid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-11-01',12500.00,119,'KW-2026-000049','order_Ttg7lTJx8cqawD',NULL,250.00,2120.00,0,NULL,NULL,NULL,NULL),(50,9,5.00,'pending','ORD-1793268361037','2026-10-29 10:06:01','online','unpaid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-11-01',5.00,119,'KW-2026-000050','order_TtgWN5aoBx4A9H',NULL,0.10,-23125.10,0,NULL,NULL,NULL,NULL),(51,9,5.00,'cancelled','ORD-1793268425103','2026-10-29 10:07:05','online','unpaid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-11-01',5.00,119,'KW-2026-000051','order_TtgXUn5en1kuzK',NULL,0.10,-23125.10,0,NULL,NULL,NULL,NULL),(52,9,5.00,'cancelled','ORD-1793268595151','2026-10-29 10:09:55','online','unpaid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-11-01',5.00,119,'KW-2026-000052','order_TtgaUaEFHJ3DtU',NULL,0.10,-23125.10,0,NULL,NULL,NULL,NULL),(53,9,5.00,'cancelled','ORD-1793268798750','2026-10-29 10:13:18','online','unpaid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-11-01',5.00,119,'KW-2026-000053','order_Ttge4lpcJIaavs',NULL,0.10,-23125.10,0,NULL,NULL,NULL,NULL),(54,9,5.00,'delivered','pay_TtgvNzCjgDhk2B','2026-10-29 10:29:23','online','paid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-11-01',5.00,119,'KW-2026-000054','order_Ttgv3xJ3SnH1k7',NULL,0.10,-23125.10,0,NULL,NULL,NULL,NULL),(55,9,55000.00,'pending','ORD-1793269980156','2026-10-29 10:33:00','online','unpaid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-11-01',55000.00,119,'KW-2026-000055','order_TtgysTpQOHOZk8',NULL,1100.00,8770.00,0,NULL,NULL,NULL,NULL),(56,9,13000.00,'pending','pending','2026-10-29 16:11:00','online','unpaid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-11-01',13000.00,119,'KW-2026-000056',NULL,NULL,306.80,2563.20,0,NULL,NULL,NULL,NULL),(57,9,13000.00,'cancelled','pending','2026-10-29 16:11:11','online','unpaid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-11-01',13000.00,119,'KW-2026-000057',NULL,NULL,306.80,2563.20,0,NULL,NULL,NULL,NULL),(58,9,13000.00,'cancelled','pending','2026-10-29 16:23:53','online','unpaid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-11-01',13000.00,119,'KW-2026-000058','order_TtmxWn8HI1FGqp',NULL,306.80,2563.20,0,NULL,NULL,NULL,NULL),(59,9,13000.00,'pending','ORD-1793292973799','2026-10-29 16:56:13','online','unpaid','house 40, near bna hotel , Kaithoon, Rajasthan - 325001, Phone: 9530060288','officialamanraza@gmail.com','2026-11-01',13000.00,119,'KW-2026-000059','order_TtnVgqwLsNylqA',NULL,306.80,2563.20,0,NULL,NULL,NULL,NULL),(60,5,16500.00,'pending','ORD-1793547570399','2026-11-01 15:39:30','online','unpaid','house no 40, mavasha road, bnaa hotel, kota, Rajasthan - 325001, Phone: 9530060288','officialamanraz@gmail.com','2026-11-04',16500.00,1,'KW-2026-000060','order_Tuxo0iNjxuHSjG',NULL,389.40,2480.60,0,NULL,NULL,NULL,NULL),(61,8,44000.00,'pending','ORD-1793646037731','2026-11-02 19:00:38','online','unpaid','189, Muasa road , Near bnaa hotel, Kota, Rajasthan - 325001, Phone: 9216899003','usachannelayan@gmail.com','2026-11-05',44000.00,108,'KW-2026-000061','order_TvPlcqxWzWkmvi',NULL,1038.40,2831.60,0,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_comments`
--

DROP TABLE IF EXISTS `product_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_comments` (
  `comment_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `comment_text` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`comment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_comments`
--

LOCK TABLES `product_comments` WRITE;
/*!40000 ALTER TABLE `product_comments` DISABLE KEYS */;
INSERT INTO `product_comments` VALUES (1,14,9,'gjyt','2026-09-13 05:26:30'),(2,417,9,',gjdd','2026-10-28 11:13:48');
/*!40000 ALTER TABLE `product_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_images` (
  `image_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `is_primary` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`image_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_images`
--

LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
INSERT INTO `product_images` VALUES (1,206,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1790678726315-saare_100_L7cRsIELI.png',0),(2,206,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1790678726315-saare_101_ey7uJFYTR.png',0),(3,4,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1790789257247-saare_2_CNavOVzhj.jpeg',0),(4,4,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1790789257249-saare_3_F2PwgN2BL.jpeg',0),(5,397,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793014425439-image4_UEUd-4OwV.jpeg',0),(6,397,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793014425439-image3_DwywOlrwi.jpeg',0),(7,397,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793014425439-image2_iy3ybmu5xx.jpeg',0),(8,398,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793016417918-image2_FqiSs72-d.jpeg',0),(9,398,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793016417918-image1_7edDMymv0.jpeg',0),(10,399,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793088881945-image5_6-1xuf7Hf.jpeg',0),(11,399,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793088881945-image6_nJ_XwYUZ5.jpeg',0),(12,399,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793088881945-image8_0KwTSooiZ.jpeg',0),(13,400,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793089945039-image12_fwE358mwC.jpeg',0),(14,400,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793089945039-image13_k_4FpxOtV.jpeg',0),(15,400,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793089945040-image15_VJlJbjc7-.jpeg',0),(16,401,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793090749149-image17_6Uk_07PFB.jpeg',0),(17,401,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793090749149-image18_lSDhg6swM.jpeg',0),(18,402,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793091336540-image20_70VNIxoiB.jpeg',0),(19,402,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793091336540-image21_Am4wjsdcrR.jpeg',0),(20,403,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793092008689-image23_mSvuJe3kl.jpeg',0),(21,403,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793092008689-image24_3ZbMtMO3T.jpeg',0),(22,404,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793092616378-image26_LJsz_AegU.jpeg',0),(23,404,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793092616379-image27_N1o61DlOj.jpeg',0),(24,404,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793092616380-image28_7CIhD8y1-.jpeg',0),(25,405,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793093052483-image32_KBxai1rtK.jpeg',0),(26,405,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793093052485-image30_Y2jQuIWzA.jpeg',0),(27,405,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793093052486-image33_WFKY01-tG.jpeg',0),(28,406,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793093622525-image34_pZ8TfcqKX.jpeg',0),(29,406,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793093622526-image35_pwZW75fKE.jpeg',0),(30,407,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793094390043-image37_uOcX7DraC.jpeg',0),(31,408,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793094948642-image40_TaFVRXQ2f.jpeg',0),(32,408,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793094948643-image41_w985bA_cI.jpeg',0),(33,408,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793094948643-image42_6pg6IgZJp.jpeg',0),(34,409,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793095545523-image44_zsu2YEIMn.jpeg',0),(35,409,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793095545524-image45_rWUs4aRSF.jpeg',0),(36,410,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793096250171-image48_jqSlcZoGb.jpeg',0),(37,410,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793096250171-image49_v6rKmrlas.jpeg',0),(38,410,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793096250171-image47_PMdx_AQFr.jpeg',0),(39,411,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793097151937-image51_kby2VkS_W.jpeg',0),(40,411,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793097151937-image52_ACNDqW5fO.jpeg',0),(41,412,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793097995159-image58_jaq9URU4g.jpeg',0),(42,412,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793097995160-image59_x3vITyMCr.jpeg',0),(43,413,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793099514279-image62_EUpqGqxPS.jpeg',0),(44,413,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793099514280-image63_mrvUeF5NR.jpeg',0),(45,413,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793099514280-image64_9_ST5jiWd8.jpeg',0),(46,413,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793100269557-66_NWR9V6QqU.jpeg',0),(47,413,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793100269558-image66_ghqhOtDMT.jpeg',0),(48,413,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793100269559-image67_K4BF8DgqR.jpeg',0),(49,414,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793101455728-image69_Y19EuVlDB.jpeg',0),(50,414,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793101455729-image70_Taq1laho4.jpeg',0),(51,415,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793101789118-image72_wnvDuyiw4.jpeg',0),(52,415,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793101789118-image73_5wzRo0JSa.jpeg',0),(53,416,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793102212297-image75_p54L_mwEr.jpeg',0),(54,416,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793102212297-image76_Di482MAss.jpeg',0),(55,417,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793102726837-image78_YJyO47IKz7.jpeg',0),(56,417,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793102726838-image79_qZxamvCfX.jpeg',0),(57,418,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793185126570-image81_6Censccmxz.jpeg',0),(58,418,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793185126570-image82_8pVLXU43Ua.jpeg',0),(59,419,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793264772833-image84_8ZDIhXiuBg.jpeg',0),(60,419,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793264772833-image85_gJirk-xyR.jpeg',0),(61,419,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793264772834-image87_htW_Rqud6.jpeg',0),(62,420,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793265266456-image90_Cl0Cq40me.jpeg',0),(63,420,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793265266457-image91_0r_2uechU.jpeg',0),(64,420,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793265266457-image89_p9PoS4l54.jpeg',0),(65,421,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793271184221-image94_GS37FT2Xq8.jpeg',0),(66,421,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793271184221-image92_W-HupvY262.jpeg',0),(67,421,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793271184223-image93_lHFQ-kV3k.jpeg',0);
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_likes`
--

DROP TABLE IF EXISTS `product_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_likes` (
  `like_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`like_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_likes`
--

LOCK TABLES `product_likes` WRITE;
/*!40000 ALTER TABLE `product_likes` DISABLE KEYS */;
INSERT INTO `product_likes` VALUES (1,14,9,'2026-09-13 05:26:27'),(2,12,9,'2026-09-13 07:59:46'),(3,4,9,'2026-09-13 08:49:12'),(4,32,9,'2026-09-13 14:25:52'),(6,76,9,'2026-09-15 14:21:10'),(9,417,9,'2026-10-28 11:13:41');
/*!40000 ALTER TABLE `product_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_reviews`
--

DROP TABLE IF EXISTS `product_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_reviews` (
  `review_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `user_id` int NOT NULL,
  `order_id` int DEFAULT NULL,
  `rating` tinyint NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `comment` text,
  `attributes_json` json DEFAULT NULL,
  `is_verified_buyer` tinyint(1) DEFAULT '0',
  `helpful_votes` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  KEY `product_id` (`product_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `product_reviews_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_reviews`
--

LOCK TABLES `product_reviews` WRITE;
/*!40000 ALTER TABLE `product_reviews` DISABLE KEYS */;
INSERT INTO `product_reviews` VALUES (1,32,9,38,5,'btr','ewihoqrt','[\"Value for Money\"]',1,0,'2026-10-25 11:46:58'),(2,32,9,38,5,'btr','ewihoqrt','[\"Value for Money\"]',1,19,'2026-10-25 11:58:21'),(3,3,5,22,5,'Rtuiiug','Setyhhgd','[\"Lightweight\"]',1,2,'2026-10-25 17:18:49');
/*!40000 ALTER TABLE `product_reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `product_id` int NOT NULL AUTO_INCREMENT,
  `category_id` int DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `pallu` varchar(255) DEFAULT NULL,
  `pallu_design` varchar(255) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock_qty` int DEFAULT '0',
  `image_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `base_color` varchar(50) DEFAULT NULL,
  `subcategory_id` int DEFAULT NULL,
  `primary_color` varchar(255) DEFAULT NULL,
  `other_color` varchar(255) DEFAULT NULL,
  `border_type` varchar(255) DEFAULT NULL,
  `pattern` varchar(255) DEFAULT NULL,
  `craft` varchar(255) DEFAULT NULL,
  `weave` varchar(255) DEFAULT NULL,
  `zari_type` varchar(255) DEFAULT NULL,
  `blouse` varchar(255) DEFAULT NULL,
  `border_motifs` varchar(255) DEFAULT NULL,
  `origin` varchar(255) DEFAULT 'proudly handcrafted in kaithoon kota raj. india',
  `fabric` varchar(255) DEFAULT NULL,
  `khats` varchar(255) DEFAULT NULL,
  `weight` varchar(100) DEFAULT NULL,
  `blouse_length` varchar(100) DEFAULT NULL,
  `producer` varchar(100) DEFAULT NULL,
  `maker` varchar(50) DEFAULT NULL,
  `hsn_code` varchar(20) DEFAULT NULL,
  `dealer_base_price` decimal(10,2) DEFAULT NULL,
  `packaging_cost` decimal(10,2) DEFAULT NULL,
  `dealer_id` int DEFAULT NULL,
  `mrp` decimal(10,2) DEFAULT NULL,
  `discount_percentage` int DEFAULT NULL,
  `is_returnable` tinyint(1) DEFAULT '0',
  `producer_address` text,
  `packer_address` text,
  `group_id` varchar(100) DEFAULT NULL,
  `video_url` varchar(500) DEFAULT NULL,
  `product_length` varchar(100) DEFAULT NULL,
  `subcategory_ids` json DEFAULT NULL,
  PRIMARY KEY (`product_id`),
  KEY `category_id` (`category_id`),
  KEY `subcategory_id` (`subcategory_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL,
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories` (`subcategory_id`)
) ENGINE=InnoDB AUTO_INCREMENT=422 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (397,1,'new product','Step into timeless elegance with this handcrafted Kota Doria saree, designed for subtle sophistication and all-day comfort. Woven on an airy, breathable base in a soft blush peach tone, the saree features an intricate garden-inspired floral pattern set within delicate geometric panels.   The pallu is accentuated with striking silver zari chevron (leheriya) patterns and floral medallion roundels that catch the light effortlessly. It comes paired with an unstitched contrast deep wine/maroon blouse piece detailed with silver zari borders, creating a striking traditional balance. Perfect for day weddings, festive poojas, and celebratory gatherings',NULL,NULL,44000.00,1,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793087697836-image2_e796aEV5f.jpeg',0,'2026-10-26 11:33:46',NULL,NULL,'pink',NULL,'flolar',NULL,NULL,NULL,'use Silver AND Gold','have it',NULL,'Kaithoon,kota','70%cotten and 30% silk','gold single tissue','500gm','38 inche','Royal Heritage',NULL,NULL,40000.00,130.00,2,45000.00,2,0,NULL,NULL,NULL,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793087699441-productvisoe_oVnonuSik.mp4','6 meter','[1, 3]'),(398,1,'new2 product','Apni ethnic wardrobe mein shamil karein yeh khubsurat handloom Kota Doria saree, jo ek serene lavender (halka jamuni) shade mein aati hai. Iska lightweight aur breathable fabric poore din aaram aur elegance deta hai. Saree par poori body mein naazuk floral buttis bani hui hain, jo iske look ko aur bhi graceful banati hain.\r\n\r\nIs saree ki sabse badi khasiyat iske rich contrasting magenta aur red borders hain, jinme classic chevron (leheriya) patterns aur fine zari lines di gayi hain. Iske sath ek contrast rich red unstitched blouse piece milta hai, jo iske traditional look ko mukammal karta hai. Yeh festive celebrations, poojas, aur elegant daytime events ke liye ek perfect choice hai.',NULL,NULL,11000.00,1,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793016416751-image_kw6Vy7W-R.jpeg',0,'2026-10-26 12:06:59',NULL,NULL,'purple','red','simple kota doriya',NULL,NULL,NULL,'use Silver','have',NULL,'Kaithoon,kota,rajsthaan','70% cotton and 30% silk',NULL,'350gm','38 inche','Amir',NULL,NULL,9000.00,100.00,2,NULL,0,0,NULL,NULL,NULL,NULL,'6 meter','[1, 2]'),(399,1,'Handcrafted Vibrant Orange and Yellow Kota Doria Saree with Silver Zari Weaving','Embrace timeless elegance with this stunning, handcrafted Kota Doria saree featuring a striking blend of vibrant orange and contrasting yellow borders. Celebrated for its signature checkered khat weave and feather-light feel, this piece is an exquisite masterpiece designed for festive occasions, weddings, and traditional celebrations.',NULL,NULL,26000.00,1,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793088880611-image7_4Qni0ngmU.jpeg',0,'2026-10-27 08:14:43',NULL,NULL,'orange',NULL,'Silver zari border',NULL,'Lehriya design',NULL,'SIlver and Gold','yellow',NULL,'Kaithoon,kota','70% cotten and silk 30%','cotten and silk khats','375gm','38 inche','Royal Heritage',NULL,NULL,23000.00,130.00,2,NULL,0,0,NULL,NULL,'1',NULL,'6 Meter','[1, 3]'),(400,1,'Handcrafted Off-White & Pink Kota Doria Saree with Silver-Gold Zari Floral Motifs','Exude grace and sophistication with this refreshing pastel green handloom Kota Doria saree. Known for its feather-light feel and signature checkered khat weave, this exquisite piece features graceful fan-shaped botanical motifs and elegant silver zari detailing, making it an ideal choice for graceful daytime events, festive gatherings, and traditional occasions.',NULL,NULL,30000.00,3,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793089943693-image16_vgyRIyS-Ui.jpeg',0,'2026-10-27 08:32:26',NULL,NULL,'off white','pink','silverwork kanchi border','thread work','silver and gold butaa`s',NULL,'Silver and gold','off white',NULL,'Kaithoon, Kota, Rajasthan','70% cotten and silk 30%',NULL,'400gm','38 inche','Royal Heritage',NULL,NULL,26000.00,130.00,2,NULL,0,0,NULL,NULL,NULL,NULL,'6 meter','[4, 3, 1]'),(401,1,'Handcrafted Cream & Brown Kota Doria Saree with Multi-Color Floral Bootis and Silver Zari Weaving','Add a touch of vibrant charm to your ethnic wardrobe with this cream handloom Kota Doria saree. Beautifully accented with contrasting brown borders and playful multi-colored floral bootis (red, yellow, and brown) set against a delicate silver zari checkered lattice, this saree is lightweight, breathable, and perfect for casual outings, family gatherings, and daytime celebrations.',NULL,NULL,29000.00,1,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793090747681-image19_uswZaIbVy.jpeg',0,'2026-10-27 08:45:50',NULL,NULL,'Dark cream',NULL,'simple siver border','flolar silver check ','checks and flowers',NULL,'Silver','dark brown blouse and butis design',NULL,'Kaithoon, Kota, Rajasthan','70%cotten and 30% silk','cotten and silk','400gm','38 inche','Royal Heritage',NULL,NULL,26000.00,130.00,2,NULL,0,0,NULL,NULL,NULL,NULL,'6 Meter','[4, 3, 1]'),(402,1,'Handcrafted Beige & Dark Brown Kota Doria Saree with Pichwai-Inspired Cow & Lotus Motifs','Celebrate rich heritage and traditional artistry with this elegant beige handloom Kota Doria saree. Beautifully adorned with Pichwai-inspired motifs of sacred cows and lotus flowers in vibrant tones of white, pink, and gold, alongside a rich dark brown border, this lightweight masterpiece is a timeless choice for cultural events, festive occasions, and traditional gatherings',NULL,NULL,16500.00,1,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793091335250-image22_m-G1XV_wB.jpeg',0,'2026-10-27 08:55:37',NULL,NULL,'cream',NULL,'thread border',NULL,' cow and flolar butaa`s',NULL,'silver','dark brown with deer design',NULL,'Kaithoon, Kota, Rajasthan','70%cotten and 30%silk',NULL,'350gm','38 inche','Royal Heritage',NULL,NULL,13500.00,130.00,2,NULL,0,0,NULL,NULL,NULL,NULL,'6 Meter','[2, 4]'),(403,1,'Handcrafted Magenta Pink Kota Doria Saree with Vibrant Floral Bootis and Silver Zari Brocade Pallu','Make a vibrant statement with this striking magenta pink handloom Kota Doria saree. Featuring stunning, colorful floral bunch motifs scattered across the body and an opulent broad silver zari brocade pallu, this lightweight and breezy masterpiece is a splendid choice for weddings, festive occasions, and vibrant celebrations.',NULL,NULL,12500.00,1,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793092004469-image25_JBlTdlmS9.jpeg',0,'2026-10-27 09:06:50',NULL,NULL,'pink',NULL,'kataan and zari border',NULL,'butaa`s',NULL,'silver','pink',NULL,'Kaithoon, Kota, Rajasthan','70%cotten and 30%silk',NULL,'350gm','38 inche','Royal Heritage',NULL,NULL,10200.00,150.00,2,NULL,0,0,NULL,NULL,NULL,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793092005677-productvidoe1_3KK4-rlR8.mp4','6 meter','[2, 4]'),(404,1,'Handcrafted Sky Blue & Pink Kota Doria Saree with Silver Zari Lattice and Floral Bootis','Elevate your ethnic collection with this graceful sky blue handloom Kota Doria saree. Featuring a delicate silver zari diamond lattice woven across the body, accented with vibrant multi-colored floral bootis (blue, yellow, and pink), and finished with a striking pink and silver zari border, this lightweight masterpiece is perfect for festive wear, family gatherings, and elegant daytime events.',NULL,NULL,30000.00,1,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793092615189-image29_vkOADAUxZ.jpeg',0,'2026-10-27 09:16:57',NULL,NULL,'ligth blue',NULL,'silver big border',NULL,'all over zaal',NULL,'pure silver','pink',NULL,'Kaithoon, Kota, Rajasthan','70%cotten and 30%silk',NULL,'350gm','38 inche','Royal Heritage',NULL,NULL,26000.00,130.00,2,NULL,0,0,NULL,NULL,NULL,NULL,'6 meter','[4, 3, 5]'),(405,1,'Handcrafted Lavender Kota Doria Saree with Diamond Buttas and Peacock Pallu','Embrace graceful elegance with this gorgeous lavender handloom Kota Doria saree. Beautifully patterned across the body with geometric diamond buttas and delicate zari accents, and paired with a magnificent peacock-motif pallu and rich purple borders, this lightweight and airy masterpiece is ideal for festive occasions, weddings, and traditional gatherings.',NULL,NULL,13000.00,3,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793093051257-image31_jkp_9Zm1q.jpeg',0,'2026-10-27 09:24:13',NULL,NULL,'purple',NULL,'simple thread border',NULL,'bootaa`s',NULL,'pure silver','running',NULL,'Kaithoon, Kota, Rajasthan','70%cotten and 30% silk',NULL,'350gm','80 inche','Royal Heritage',NULL,NULL,11000.00,130.00,2,NULL,0,0,NULL,NULL,NULL,NULL,'6 meter','[2, 4]'),(406,1,'Handcrafted Orange & Yellow Kota Doria Saree with Pichwai Cow-Lotus Motifs and Silver Zari Brocade Pallu','Celebrate rich Indian heritage with this vibrant orange handloom Kota Doria saree. Beautifully designed with traditional Pichwai-inspired motifs of sacred cows and lotus blooms woven into striking yellow borders, alongside an opulent silver zari brocade pallu, this lightweight and airy masterpiece is a splendid choice for weddings, cultural festivals, and traditional celebrations.',NULL,NULL,20000.00,1,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793093621295-image36_pepdvso7D.jpeg',0,'2026-10-27 09:33:43',NULL,NULL,'orange','yellow','cow and animal and floral bootaa`s',NULL,'birds design',NULL,'pure silver and gold zari','simple yellow',NULL,'kaithoon,kota','70%cotten and 30% silk',NULL,'350gm','38 inche','Royal Heritage',NULL,NULL,16000.00,130.00,2,NULL,0,0,NULL,NULL,NULL,NULL,'6meter','[2, 4, 5]'),(407,1,'Handcrafted Bright Yellow & Orange Kota Doria Saree with Floral Bootis and Parrot-Botanical Pallu','Handcrafted Bright Yellow & Orange Kota Doria Saree with Floral Bootis and Parrot-Botanical PalluBrighten up your celebrations with this cheerful yellow handloom Kota Doria saree. Featuring neat floral bootis scattered across the body and an exquisite broad pallu intricately woven with blooming botanical branches and colorful parrots, this lightweight and airy masterpiece is a splendid choice for haldi ceremonies, festive daytime wear, and traditional gatherings.',NULL,NULL,13000.00,1,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793094388823-image38_COmoxhHcb.jpeg',1,'2026-10-27 09:46:31',NULL,NULL,'yellow',NULL,' simple silver zari thread',NULL,'flolar flower',NULL,'pure silver','simple orange with silver ',NULL,'kaithoon, kota','70% cotten and 30% silk',NULL,'350gm','38 inche','Royal Heritage',NULL,NULL,10000.00,130.00,2,NULL,0,0,NULL,NULL,NULL,NULL,'6 meter','[2, 4, 5]'),(408,1,'Handcrafted Navy Blue Kota Doria Saree with Blooming Lotus Vines and Polka Dots','Exude timeless elegance with this deep navy blue handloom Kota Doria saree. Beautifully detailed with climbing floral vines, blooming multi-colored lotus motifs, and delicate white polka dots scattered across the body, this lightweight and airy masterpiece offers a sophisticated look for evening events, festive gatherings, and formal ethnic occasions.',NULL,NULL,9000.00,1,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793094947406-image39_NltMgD7fd.jpeg',0,'2026-10-27 09:55:50',NULL,NULL,'navy dark blue',NULL,'simpel thread border',NULL,'mix color flowers',NULL,'pure silver',NULL,NULL,'Kaithoon,kota','70%cotten and 30% silk',NULL,'350gm','38inche','Royal Heritage',NULL,NULL,7000.00,130.00,2,NULL,0,0,NULL,NULL,NULL,NULL,'5 meter','[2, 3]'),(409,1,'Handcrafted Rich Magenta Kanjeevaram-Style Silk Saree with All-Over Zari Brocade and Floral Borders','Make a breathtaking statement at weddings, grand celebrations, and festive events with this opulent magenta pink handloom saree. Fully blanketed in intricate gold zari geometric and floral brocade patterns across the entire body, and framed by vibrant floral-woven borders, this heavy yet graceful masterpiece exudes timeless royal elegance.',NULL,NULL,55000.00,1,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793095544320-image43_pGbdUNGqj.jpeg',0,'2026-10-27 10:05:46',NULL,NULL,'red',NULL,'flower boder',NULL,'zamaavar',NULL,'pure gold zari','running blouse',NULL,'kaithoon, kota','70% cotten and 30% silk',NULL,'450gm','38 inche','Royal Heritage',NULL,NULL,45000.00,130.00,2,NULL,0,0,NULL,NULL,NULL,NULL,'6 meter','[1, 5, 3]'),(410,1,'Handcrafted Cream & Dark Brown Kota Doria Saree with Floral Bootis and Silver Zari Border','Exude understated elegance with this cream handloom Kota Doria saree. Beautifully accented with a contrasting dark brown border and delicate floral bootis scattered across the body, this lightweight and airy masterpiece offers a sophisticated, graceful look for formal wear, casual daytime events, and intimate family gatherings.',NULL,NULL,12500.00,1,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793096249008-image46_4UpMw5mNk.jpeg',1,'2026-10-27 10:17:31',NULL,NULL,'cream',NULL,'silverwork flolar bootis',NULL,'floral boota`s',NULL,'pure silver','dark brown',NULL,'kaithoon','70%cotten and 30% silk',NULL,'350gm','38 inche','Royal Heritage',NULL,NULL,10000.00,130.00,2,NULL,0,0,NULL,NULL,NULL,NULL,'6 meter','[4, 3, 5]'),(411,1,'Handcrafted Sky Blue Kota Doria Saree with White & Blue Floral Bootis and Silver Zari Pallu','Bring a sense of calm and sophistication to your wardrobe with this breezy sky blue handloom Kota Doria saree. Beautifully accented with delicate white and blue floral bootis, striking silver zari chevron weave panels on the pallu, and contrasting royal blue borders, this lightweight and airy masterpiece is perfect for formal daytime wear, office ethnic days, and intimate gatherings.',NULL,NULL,13000.00,3,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793097150779-image50_QzHe41J9_G.jpeg',0,'2026-10-27 10:32:33',NULL,NULL,'sky blue',NULL,'simple thread',NULL,'flolar boota`s',NULL,'pure silver zari','sky blue',NULL,'kaithoon,kota','70%cotten and 30% silk',NULL,'350gm','38 inche','Royal Heritage',NULL,NULL,10000.00,130.00,2,NULL,0,0,NULL,NULL,'2',NULL,'6 meter','[4, 2, 3]'),(412,1,'Handcrafted Soft Pink Kota Doria Saree with Blooming Lotus Bootis and Silver Zari Pallu','Exude graceful charm with this delicate soft pink handloom Kota Doria saree. Beautifully detailed with vibrant pink and yellow lotus flower bootis, silver polka dots scattered across the body, and a magnificent broad silver-gold zari brocade pallu paired with a contrasting lime green blouse piece, this lightweight and airy masterpiece is a stunning choice for festive celebrations and daytime gatherings.',NULL,NULL,12500.00,1,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793097994000-image57_yB1wj76TkL.jpeg',1,'2026-10-27 10:46:36',NULL,NULL,'ligth yellow','Dark Green, White & Silver','simple thread',NULL,'floral boota`s',NULL,'pure silver zari','green',NULL,'Kaithoon,kota','70%cotten and silk',NULL,'350gm','38 inche','Royal Heritage',NULL,NULL,10000.00,140.00,2,NULL,0,0,NULL,NULL,'2',NULL,'6 metere','[2, 4, 3]'),(413,1,'Handcrafted Olive Green Kota Doria Saree with Silver-Gold Zari Brocade and Pink Blouse','Make a sophisticated statement with this rich olive green handloom Kota Doria saree. Beautifully covered all over with intricate silver and gold zari floral brocade patterns, paired with a magnificent broad textured zari border and a contrasting vibrant pink blouse piece, this lightweight yet grand masterpiece is ideal for weddings, receptions, and festive celebrations.',NULL,NULL,50000.00,1,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793100268349-image65_WBoyL7txC.jpeg',0,'2026-10-27 11:11:55',NULL,NULL,'Olive Green','Hot Pink, Silver & Gold','silverwork kanchi border',NULL,'silver and gold work flolar zaal',NULL,'pure gold and silver','red color with simple boota`s',NULL,'kaithoon,kota','70%cotten and 30%silk',NULL,NULL,'38 inche','Royal heritage',NULL,NULL,40000.00,130.00,2,NULL,0,0,NULL,NULL,NULL,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793099510504-productvisoe2_sf2kMVFHk.mp4','6 meter','[3, 5, 4]'),(414,1,'Handcrafted Pastel Pink Kota Doria Saree with Multi-Color Floral Vines, Parrots, and Silver Zari Pallu','Enchant everyone with this charming pastel pink handloom Kota Doria saree. Beautifully detailed all over with vibrant multi-colored floral vines, playful perched parrots, and a magnificent silver zari brocade pallu paired with a contrasting dark brown blouse piece, this lightweight and airy masterpiece is a wonderful choice for festive celebrations, garden parties, and daytime gatherings.',NULL,NULL,27000.00,1,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793101454513-image71_CHIn1DZqw.jpeg',1,'2026-10-27 11:44:17',NULL,NULL,'off white',NULL,'silverwork border',NULL,'all over zaal',NULL,'pure silver ','dark brown',NULL,'kaithoon,kota','70%cotten and 30% silk',NULL,'400gm','38 inche','Royal haritage',NULL,NULL,19500.00,130.00,2,NULL,0,0,NULL,NULL,NULL,NULL,'6 meter','[4, 3, 5]'),(415,1,'Handcrafted Lavender Kota Doria Saree with Silver-Orange Floral Bootis and Brocade Pallu','Bring a unique, graceful charm to your wardrobe with this soft lavender handloom Kota Doria saree. Beautifully patterned all over with delicate silver and orange floral bootis, paired with a striking orange contrasting blouse piece and an exquisite silver-and-coral brocade pallu, this lightweight and airy masterpiece is a wonderful choice for festive wear, daytime events, and traditional gatherings',NULL,NULL,10000.00,2,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793101787938-image74_MCWqOEe5a.jpeg',1,'2026-10-27 11:49:50',NULL,NULL,'Purple / Lavender',NULL,'silver zari border',NULL,'floral boota`s',NULL,'pure silver zari','orange',NULL,'kaithoon,kota','70%cotten and 30%silk',NULL,'350gm','38 inche','Royal haritage',NULL,NULL,8000.00,130.00,2,NULL,0,0,NULL,NULL,NULL,NULL,'6 meter','[4, 2]'),(416,1,'Handcrafted Off-White & Navy Blue Kota Doria Saree with Multi-Color Floral Bootis and Contrast Blouse','Add a touch of refreshing elegance to your ethnic wardrobe with this off-white handloom Kota Doria saree. Beautifully accented with charming multi-colored floral bootis (white, yellow, and brown) scattered across the body, a rich silver zari patterned pallu, and paired with a contrasting deep navy blue blouse piece, this lightweight and airy masterpiece is perfect for casual outings, family gatherings, and daytime celebrations',NULL,NULL,25000.00,1,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793102211141-image77_i07IOWxa0.jpeg',1,'2026-10-27 11:56:53',NULL,NULL,'Off-White',NULL,'simple thread bodre',NULL,'all over zaal',NULL,'pure silver','nevy blue',NULL,'kaithoon kota','70%cotten and 30% silk',NULL,'350gm','38 inche','Royal haritage',NULL,NULL,21000.00,130.00,2,NULL,0,0,NULL,NULL,NULL,NULL,'6 meter','[3, 4, 5]'),(417,1,'Handcrafted Lime Green Kota Doria Saree with Floral Bootis, Swan Pallu, and Dark Green Blouse','Bring a lively and refreshing charm to your ethnic wardrobe with this vibrant lime green handloom Kota Doria saree. Beautifully detailed all over with delicate floral and fan-motif bootis, paired with a magnificent swan-woven silver zari pallu and a contrasting dark green blouse piece, this lightweight and airy masterpiece is a wonderful choice for festive occasions, daytime celebrations, and traditional gatherings',NULL,NULL,12200.00,1,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793102725624-image80_RKxrj9IOP.jpeg',1,'2026-10-27 12:05:28',NULL,NULL,'Lime Green',NULL,'simple thread border',NULL,'floral boota`s',NULL,'pure silver','Dark Green',NULL,'kaithoon,kota','70%cotten and 30%silk',NULL,'350gm','38 inche','Royal haritage',NULL,NULL,9000.00,130.00,2,NULL,0,0,NULL,NULL,NULL,NULL,'6 meter','[3, 4]'),(418,1,'Handcrafted Vibrant Yellow Kota Doria Saree','Bring home the elegance of traditional Rajasthani craftsmanship with this stunning Handcrafted Vibrant Yellow Kota Doria Saree. Woven meticulously in the renowned handloom hub of Kaithoon, this saree features a bright yellow lightweight base adorned with intricate silver zari chevron patterns and delicate floral motifs. The rich silver zari border adds a touch of royal grace, making it a perfect choice for festive celebrations, weddings, and traditional gatherings.\r\n\r\nDesigned for both comfort and elegance, it comes with a contrasting vibrant orange unstitched blouse piece featuring a matching zari border. Experience the authentic blend of heritage and style with breathable fabric and flawless artistry—offering unmatched grace in every thread.',NULL,NULL,28000.00,1,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793185125311-image83_w0anfzs57.jpeg',1,'2026-10-28 10:58:48','Yellow',NULL,'Bright Yellow','Silver / Orange (Blouse)','simple silver thread boder','Star Lehriya chain','Handloom','Kota Doria Check Weave','pure silver','Unstitched Contrast Blouse','Traditional Floral & Zari Weave','Kaithoon, Kota','70%cotten and 30% silk',NULL,'500gm','38 inche','Royal Heritage',NULL,NULL,24000.00,130.00,2,NULL,0,0,NULL,NULL,NULL,NULL,'6 meter','[6, 4, 3, 7, 8]'),(419,1,'Handcrafted Orange Zari Striped Kota Doria Saree','Bring home the elegance of traditional Rajasthani craftsmanship with this stunning Handcrafted Orange Zari Striped Kota Doria Saree. Woven meticulously in the renowned handloom hub of Kaithoon, this saree features a vibrant orange lightweight base beautifully adorned with continuous silver zari stripes and delicate traditional motifs. The rich, solid silver zari border finished with bright yellow piping adds a touch of regal grace, making it a perfect choice for festive celebrations, daytime events, and cultural gatherings.\r\n\r\nDesigned for both comfort and elegance, it comes with a contrasting vibrant yellow unstitched blouse piece featuring a matching silver zari border. Experience the authentic blend of heritage and style with breathable fabric and flawless artistry—offering unmatched grace in every thread',NULL,NULL,22000.00,1,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793264771575-image86_TkD5stFPn.jpeg',1,'2026-10-29 09:06:14',NULL,NULL,'Bright Orange',NULL,'Broad Silver Zari Border','Lehriya',NULL,NULL,'pure silver cari','yellow',NULL,'kaithoon,kota','70% cotten and 30% silk',NULL,'375gm','38 inche','Royal Heritage',NULL,NULL,18500.00,130.00,2,NULL,0,0,'kaithoon,kota','kiathoon,koat','1',NULL,'6 meter','[2, 4, 5, 7]'),(420,1,'Radiant Orange Zari Striped Kota Doria Saree','Bring home the elegance of traditional Rajasthani craftsmanship with this stunning Radiant Orange Zari Striped Kota Doria Saree. Woven meticulously in the renowned handloom hub of Kaithoon, this saree features a vibrant orange lightweight base beautifully adorned with continuous silver zari stripes and delicate traditional floral motifs. The rich, solid silver zari border finished with bright yellow edging adds a touch of regal grace, making it a perfect choice for festive celebrations, daytime events, and cultural gatherings.\r\n\r\nDesigned for both comfort and elegance, it comes with a contrasting vibrant yellow unstitched blouse piece featuring a matching solid silver zari border. Experience the authentic blend of heritage and style with breathable fabric and flawless artistry—offering unmatched grace in every thread',NULL,NULL,24000.00,1,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793265264990-image88_Kl_Vskx3H.jpeg',1,'2026-10-29 09:14:27',NULL,NULL,'Vibrant Orange',NULL,'Broad Silver Zari Border','Lehriya',NULL,NULL,'pure Silver zari','Yellow',NULL,'Kaithoon,Kota','70%cotten and 30% silk',NULL,'375gm','38 inche','Royal Heritage',NULL,NULL,21000.00,130.00,2,NULL,0,0,'Kaithoon,kota','Kaithoon,kota','1',NULL,'6 meter','[2, 4, 5, 7]'),(421,1,'Earthy Beige Floral Woven Kota Doria Saree','Embrace the beauty of nature with this exquisite Earthy Beige Floral Woven Kota Doria Saree. Handwoven by the skilled artisans of Kaithoon, this lightweight masterpiece features a soothing beige base intricately decorated with vibrant pink, yellow, and green floral and tree motifs. The unique woven patterns are beautifully framed across the fabric, creating a picturesque and artistic charm. A contrasting solid brown border, accentuated with a crisp yellow stripe, perfectly anchors the design, making it an ideal choice for elegant day wear, cultural events, and festive gatherings.   Designed for both comfort and elegance, the saree is paired with a matching unstitched brown blouse piece. The blouse fabric features subtle woven buttis and a beautiful floral motif on the border, allowing you to tailor a graceful and complete look. Experience breathable comfort and authentic Rajasthani heritage with this flawless handloom creation',NULL,NULL,25000.00,1,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/products/1793271182905-image95_NE5_c34klO.jpeg',1,'2026-10-29 10:53:06',NULL,NULL,'Beige / Light Earthy Tone',NULL,'simple thread border','Woven Floral and Tree Motifs in Arch/Panel Patterns',NULL,NULL,'pure silver zari','Brown (Border & Blouse), with Pink, Yellow, and Green (Motifs)',NULL,'kaithoon,kota','70%cotten and 30% silk',NULL,'400gm','38 inche','Royal Heritage',NULL,NULL,21000.00,130.00,2,NULL,0,0,'Kaithoon,kota','Kaithoon,Kota',NULL,NULL,'6 meter','[6, 5, 3, 7, 8]');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `review_media`
--

DROP TABLE IF EXISTS `review_media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_media` (
  `media_id` int NOT NULL AUTO_INCREMENT,
  `review_id` int NOT NULL,
  `media_type` enum('image','video') DEFAULT 'image',
  `media_url` varchar(500) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`media_id`),
  KEY `review_id` (`review_id`),
  CONSTRAINT `review_media_ibfk_1` FOREIGN KEY (`review_id`) REFERENCES `product_reviews` (`review_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `review_media`
--

LOCK TABLES `review_media` WRITE;
/*!40000 ALTER TABLE `review_media` DISABLE KEYS */;
/*!40000 ALTER TABLE `review_media` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `review_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `user_id` int NOT NULL,
  `rating_type` enum('1','2','3','4','5') DEFAULT NULL,
  `comment` text,
  `image_url` varchar(255) DEFAULT NULL,
  `is_verified_buyer` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  KEY `user_id` (`user_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

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

--
-- Table structure for table `shipping_zones`
--

DROP TABLE IF EXISTS `shipping_zones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipping_zones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `state_name` varchar(100) NOT NULL,
  `min_days` int NOT NULL DEFAULT '3',
  `max_days` int NOT NULL DEFAULT '7',
  PRIMARY KEY (`id`),
  UNIQUE KEY `state_name` (`state_name`)
) ENGINE=InnoDB AUTO_INCREMENT=297 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipping_zones`
--

LOCK TABLES `shipping_zones` WRITE;
/*!40000 ALTER TABLE `shipping_zones` DISABLE KEYS */;
INSERT INTO `shipping_zones` VALUES (1,'Rajasthan',1,3),(2,'Delhi',1,3),(3,'Haryana',2,4),(4,'Punjab',2,4),(5,'Chandigarh',2,4),(6,'Uttar Pradesh',2,4),(7,'Uttarakhand',2,5),(8,'Himachal Pradesh',3,5),(9,'Jammu and Kashmir',3,6),(10,'Ladakh',4,7),(11,'Madhya Pradesh',2,4),(12,'Gujarat',2,5),(13,'Maharashtra',3,6),(14,'Goa',4,6),(15,'Chhattisgarh',3,5),(16,'Bihar',3,5),(17,'Jharkhand',3,5),(18,'West Bengal',4,6),(19,'Odisha',4,6),(20,'Sikkim',5,8),(21,'Assam',5,8),(22,'Meghalaya',5,8),(23,'Manipur',6,9),(24,'Mizoram',6,9),(25,'Nagaland',6,9),(26,'Tripura',6,9),(27,'Arunachal Pradesh',6,9),(28,'Karnataka',4,6),(29,'Telangana',3,6),(30,'Andhra Pradesh',4,6),(31,'Tamil Nadu',4,7),(32,'Kerala',5,7),(33,'Puducherry',5,7),(34,'Andaman and Nicobar Islands',7,10),(35,'Lakshadweep',7,10),(36,'Dadra and Nagar Haveli and Daman and Diu',3,5),(37,'Default',4,8);
/*!40000 ALTER TABLE `shipping_zones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subcategories`
--

DROP TABLE IF EXISTS `subcategories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subcategories` (
  `subcategory_id` int NOT NULL AUTO_INCREMENT,
  `subcategory_name` varchar(100) NOT NULL,
  `category_id` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`subcategory_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `subcategories_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subcategories`
--

LOCK TABLES `subcategories` WRITE;
/*!40000 ALTER TABLE `subcategories` DISABLE KEYS */;
INSERT INTO `subcategories` VALUES (1,'Bridal Wear',1,1,'2026-06-30 09:55:20'),(2,'Casual Sarees',1,1,'2026-06-30 09:55:20'),(3,'Party Wear',1,1,'2026-06-30 09:55:20'),(4,'office wear',1,1,'2026-06-30 09:55:20'),(5,'club party',1,1,'2026-06-30 09:55:20'),(6,'Wedding Wear',1,1,'2026-10-27 15:33:53'),(7,'Festival Wear',1,1,'2026-10-27 15:33:53'),(8,'Occasional Wear',1,1,'2026-10-27 15:33:53'),(9,'Wedding Wear',3,1,'2026-10-27 15:58:05'),(10,'Festival Wear',3,1,'2026-10-27 15:58:05'),(11,'Occasional Wear',3,1,'2026-10-27 15:58:05'),(12,'Bridal Wear',3,1,'2026-10-27 15:58:05'),(13,'Casual Sarees',3,1,'2026-10-27 15:58:05'),(14,'Party Wear',3,1,'2026-10-27 15:58:05'),(15,'office wear',3,1,'2026-10-27 15:58:05'),(16,'club party',3,1,'2026-10-27 15:58:05'),(17,'Wedding Wear',2,1,'2026-10-27 15:59:24'),(18,'Festival Wear',2,1,'2026-10-27 15:59:24'),(19,'Occasional Wear',2,1,'2026-10-27 15:59:24'),(20,'Bridal Wear',2,1,'2026-10-27 15:59:24'),(21,'Casual Sarees',2,1,'2026-10-27 15:59:24'),(22,'Party Wear',2,1,'2026-10-27 15:59:24'),(23,'office wear',2,1,'2026-10-27 15:59:24'),(24,'club party',2,1,'2026-10-27 15:59:24');
/*!40000 ALTER TABLE `subcategories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expiry` datetime DEFAULT NULL,
  `username` varchar(30) DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (5,'Aman Raza','officialamanraz@gmail.com','$2b$10$6Y16buLEarl7/ZHEhweNN.lKhbcVlk/e.gvZirUe6FhzjHL2MTJcC','9530060288',NULL,'admin','2026-06-24 16:11:03',NULL,NULL,NULL,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/profile-images/profile_5_1790519252912_-uZXfyspJ'),(6,'Shavez','shavezans1122@gmail.com','$2b$10$abZ1m4NfsBuTv42RAxbTFOrpMoOEfkLVGpTw7b0ebHo5csT9R0Hta','7229943506','Kaithoon, Kota, Rajasthan, Kota, Rajasthan','user','2026-06-26 15:35:42',NULL,NULL,NULL,NULL),(7,'Shavez','shavez@gmail.com','$2b$10$Gi/XVIuJiVGFD/NwtqhCg.kzxWofgBWINM6XRy90myGz5muxfJpEu','7229943506','df, Kota, Rajasthan','user','2026-06-27 15:31:33',NULL,NULL,NULL,NULL),(8,'Ayan','usachannelayan@gmail.com','$2b$10$QMQdHxWvDT2bfuFTjd0Q0.TaKXwAwG/Rx/7V9NbMGjxLc0N.X1UYK','9216899003','House no. 40, Kota, Rajasthan','user','2026-07-27 14:14:12',NULL,NULL,NULL,NULL),(9,'Aman Raza','officialamanraza@gmail.com','$2b$10$80ICj6K6zHAgFsq.he9Fre1AhuRdQmnErDmg2iXyY5MDQmFgPA5Q.','9530060288','house 40, Kota, Rajasthan','admin','2026-09-13 04:49:31',NULL,NULL,NULL,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/profile-images/profile_9_1790431738848_fTCcC4HjG'),(10,'mr.xyz','officialaman@gmail.com','$2b$10$jzLIsdrXemqdX0EcqISwNeeS33elsXsYhabCAYbz8Ai0KMS3ekQ9G','9530060288','South Goa, Goa','user','2026-09-21 15:03:39',NULL,NULL,NULL,NULL),(11,'mryfz','officialamana@gmail.com','$2b$10$xBjc8jPTYhQTZQUzU8WM1OUdlqVYzYxDqlG7st6kvi.JQlwayQ6bS','9530060288','Solan, Himachal Pradesh','user','2026-09-21 15:06:24',NULL,NULL,NULL,NULL),(12,'mynanw','officialamanaa@gmail.com','$2b$10$tiYlGJMtD0u/FCWhEzEkJ.5C0AgbpkOv7Gv.St9fbChO.Ku/0LKAa','9530060288','Una, Himachal Pradesh','user','2026-09-21 15:06:55',NULL,NULL,NULL,'https://ik.imagekit.io/5gma4ap5d/arzoo-saree/profile-images/profile_12_1790005461662_JAoeQalmg'),(13,'Aamir','officialaraz@gmail.com','$2b$10$O.za6WKFvBOhw092yJ9OgueD2VCbuqOvxyCtLwBVB2BVrJncrWIem','9530060288','South West Delhi, Delhi','user','2026-10-24 15:29:17',NULL,NULL,NULL,NULL),(14,'Amir Ali','amiralii0611@gmail.com','$2b$10$QC7pl77oPXVplu1AwaN9yeRsRgOB8wrkcIDpTv7t1opPGe/.oQDAq','9530060288','Kota, Rajasthan','admin','2026-10-28 07:20:39',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `webhook_events`
--

DROP TABLE IF EXISTS `webhook_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `webhook_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `event_id` (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `webhook_events`
--

LOCK TABLES `webhook_events` WRITE;
/*!40000 ALTER TABLE `webhook_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `webhook_events` ENABLE KEYS */;
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

-- Dump completed on 2026-11-03 11:20:43
