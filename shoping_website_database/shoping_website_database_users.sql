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
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-02 11:50:11
