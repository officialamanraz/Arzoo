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
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-02 11:50:43
