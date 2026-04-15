-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: mision_emprende2
-- ------------------------------------------------------
-- Server version	8.0.42

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

--
-- Table structure for table `activities`
--

DROP TABLE IF EXISTS `activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activities` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` longtext,
  `order_number` int NOT NULL,
  `timer_duration` int DEFAULT NULL,
  `config_data` json DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `activity_type_id` bigint NOT NULL,
  `stage_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `activities_stage_id_order_number_55d59c0c_uniq` (`stage_id`,`order_number`),
  KEY `activities_stage_i_7425c6_idx` (`stage_id`),
  KEY `activities_activit_a33aa7_idx` (`activity_type_id`),
  KEY `activities_stage_i_f1817d_idx` (`stage_id`,`order_number`),
  CONSTRAINT `activities_activity_type_id_4b2a4435_fk_activity_types_id` FOREIGN KEY (`activity_type_id`) REFERENCES `activity_types` (`id`),
  CONSTRAINT `activities_stage_id_0c437802_fk_stages_id` FOREIGN KEY (`stage_id`) REFERENCES `stages` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activities`
--

LOCK TABLES `activities` WRITE;
/*!40000 ALTER TABLE `activities` DISABLE KEYS */;
INSERT INTO `activities` VALUES (1,'Personalización','Los equipos personalizan su nombre e indican si se conocen',3,180,NULL,1,'2025-11-04 03:58:18.797000','2025-12-01 21:46:01.908137',1,1),(2,'Presentación','Minijuego de anagramas: adivina las palabras desordenadas (3 palabras, 5 tokens cada una = 15 tokens total)',4,480,'{\"type\": \"anagram\", \"words\": [{\"word\": \"emprender\", \"anagram\": \"eprdenemr\"}, {\"word\": \"innovacion\", \"anagram\": \"ooivanicnn\"}, {\"word\": \"creatividad\", \"anagram\": \"edavitiacrd\"}], \"total_tokens\": 15, \"words_per_game\": 3, \"tokens_per_word\": 5}',1,'2025-11-04 16:03:58.105000','2025-12-01 21:46:01.923426',2,1),(3,'Seleccionar Tema','Elige un tema de interÃ©s relacionado con tu facultad',1,160,NULL,1,'2025-11-04 23:19:09.746000','2025-11-07 14:28:30.822001',3,2),(4,'Ver el DesafÃ­o','Lee y analiza el desafÃ­o asociado a tu tema',2,160,NULL,1,'2025-11-04 23:19:09.755000','2025-11-07 14:28:43.478728',3,2),(5,'Bubble Map','Crea un mapa mental con ideas y conceptos relacionados al desafÃ­o',3,480,NULL,1,'2025-11-04 23:19:09.756000','2025-11-07 14:28:58.964030',3,2),(6,'Subida de Prototipo Lego','Los equipos construyen físicamente un prototipo con legos y suben una foto del resultado',1,600,NULL,1,'2025-11-05 02:28:51.637000','2025-11-07 14:29:11.498568',4,3),(7,'Formulario de Pitch','Los equipos completan un formulario estructurado para crear el pitch: intro-problema (etapa 2), solución (etapa 3) y cierre',1,360,NULL,1,'2025-11-05 05:28:59.108000','2025-11-07 14:29:29.883250',5,4),(8,'Presentación del Pitch','Los equipos presentan su pitch siguiendo un orden de presentación. Después de cada presentación, los otros equipos pueden evaluar.',2,800,NULL,1,'2025-11-05 05:28:59.120000','2025-11-07 14:29:46.273248',6,4),(15,'Instructivo','Instructivo del juego - Instrucciones para los estudiantes',2,NULL,NULL,1,'2025-12-01 21:46:01.940058','2025-12-01 21:46:01.940058',7,1);
/*!40000 ALTER TABLE `activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity_duration_metrics`
--

DROP TABLE IF EXISTS `activity_duration_metrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_duration_metrics` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `total_completions` int NOT NULL,
  `total_duration_seconds` double NOT NULL,
  `avg_duration_seconds` double NOT NULL,
  `min_duration_seconds` double DEFAULT NULL,
  `max_duration_seconds` double DEFAULT NULL,
  `last_updated` datetime(6) NOT NULL,
  `activity_id` bigint NOT NULL,
  `stage_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `activity_duration_metrics_activity_id_stage_id_7574a410_uniq` (`activity_id`,`stage_id`),
  KEY `activity_du_activit_444351_idx` (`activity_id`),
  KEY `activity_du_stage_i_98cff4_idx` (`stage_id`),
  CONSTRAINT `activity_duration_metrics_activity_id_7dcea142_fk_activities_id` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`),
  CONSTRAINT `activity_duration_metrics_stage_id_6cb769df_fk_stages_id` FOREIGN KEY (`stage_id`) REFERENCES `stages` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_duration_metrics`
--

LOCK TABLES `activity_duration_metrics` WRITE;
/*!40000 ALTER TABLE `activity_duration_metrics` DISABLE KEYS */;
INSERT INTO `activity_duration_metrics` VALUES (8,21,15127.970741999996,720.3795591428569,43.071676,3593.493888,'2025-12-03 17:43:56.305663',1,1),(9,115,199472.21369399986,1734.540988643477,13.600077,6236.303408,'2025-12-03 17:53:17.082330',2,1),(10,18,28451.300393999998,1580.6277996666665,16.536107,4996.595644,'2025-12-03 17:54:52.976475',3,2),(11,6,2754.8825159999997,459.14708599999994,21.613911,896.658219,'2025-12-03 07:23:48.813283',5,2),(12,6,3808.6203820000005,634.7700636666667,20.580495,1248.960302,'2025-12-03 07:26:15.867773',6,3),(13,11,7894.643349000001,717.694849909091,282.313148,889.867152,'2025-12-03 07:32:13.132590',7,4),(14,9,40848.459813,4538.717757,108.608477,6804.709422,'2025-12-03 07:34:01.786029',8,4);
/*!40000 ALTER TABLE `activity_duration_metrics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity_types`
--

DROP TABLE IF EXISTS `activity_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_types` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` longtext,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `activity_ty_code_0cb432_idx` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_types`
--

LOCK TABLES `activity_types` WRITE;
/*!40000 ALTER TABLE `activity_types` DISABLE KEYS */;
INSERT INTO `activity_types` VALUES (1,'personalizacion','Personalización','Actividad de personalización de equipos',1,'2025-11-04 03:58:18.177000','2025-11-04 16:03:58.072000'),(2,'minijuego','Minijuego','Actividades de minijuegos y presentación',1,'2025-11-04 16:03:58.097000','2025-11-04 16:03:58.097000'),(3,'','Interactiva','Actividad interactiva',1,'2025-11-04 23:19:09.732000','2025-11-04 23:19:09.732000'),(4,'prototipo','Subida de Prototipo','Actividad para subir imagen del prototipo físico construido',1,'2025-11-05 02:28:51.612000','2025-11-05 02:28:51.612000'),(5,'formulario_pitch','Formulario de Pitch','Actividad para completar el formulario del pitch con intro-problema, solución y cierre',1,'2025-11-05 05:28:59.078000','2025-11-05 05:28:59.078000'),(6,'presentacion_pitch','Presentación del Pitch','Actividad para presentar el pitch y evaluar a otros equipos',1,'2025-11-05 05:28:59.089000','2025-11-05 05:28:59.089000'),(7,'instructivo','Instructivo','Instructivo del juego',1,'2025-12-01 21:09:26.521551','2025-12-01 21:09:26.521551'),(8,'video_institucional','Video Institucional','Video institucional de la universidad',1,'2025-12-01 21:30:26.175703','2025-12-01 21:30:26.175703');
/*!40000 ALTER TABLE `activity_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `administrators`
--

DROP TABLE IF EXISTS `administrators`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `administrators` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `is_super_admin` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `administrat_user_id_20df6f_idx` (`user_id`),
  CONSTRAINT `administrators_user_id_5ff75f06_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `administrators`
--

LOCK TABLES `administrators` WRITE;
/*!40000 ALTER TABLE `administrators` DISABLE KEYS */;
INSERT INTO `administrators` VALUES (11,0,'2025-11-30 20:15:29.930751','2025-11-30 20:15:29.930751',23);
/*!40000 ALTER TABLE `administrators` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `anagram_words`
--

DROP TABLE IF EXISTS `anagram_words`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `anagram_words` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `word` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scrambled_word` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `anagram_wor_is_acti_e5207d_idx` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `anagram_words`
--

LOCK TABLES `anagram_words` WRITE;
/*!40000 ALTER TABLE `anagram_words` DISABLE KEYS */;
INSERT INTO `anagram_words` VALUES (1,'EMPRENDIMIENTO','MEIEDNTREINMOP',1,'2025-11-26 14:17:12.882500','2025-11-26 14:17:12.892739'),(2,'INNOVACION','CNIONIAVON',1,'2025-11-26 14:17:12.901740','2025-11-26 14:17:12.906922'),(3,'CREATIVIDAD','DCDARIVTIEA',1,'2025-11-26 14:17:12.913096','2025-11-26 14:17:12.917096'),(4,'LIDERAZGO','ODZIGREAL',1,'2025-11-26 14:17:12.922281','2025-11-26 14:17:12.926277'),(5,'EQUIPO','PIQOUE',1,'2025-11-26 14:17:12.930279','2025-11-26 14:17:12.934521'),(6,'NEGOCIO','GCONEIO',1,'2025-11-26 14:17:12.938525','2025-11-26 14:17:12.942684'),(7,'CLIENTE','NILTECE',1,'2025-11-26 14:17:12.947682','2025-11-26 14:17:12.951685'),(8,'PRODUCTO','TUOCROPD',1,'2025-11-26 14:17:12.957865','2025-11-26 14:17:12.961865'),(9,'VENTA','TENVA',1,'2025-11-26 14:17:12.966099','2025-11-26 14:17:12.970099'),(10,'MARKETING','EGRMIAKNT',1,'2025-11-26 14:17:12.974290','2025-11-26 14:17:12.978290'),(11,'ESTRATEGIA','ATIEEAGSRT',1,'2025-11-26 14:17:12.983454','2025-11-26 14:17:12.987456'),(12,'PLANIFICACION','FNNPOICCAILAI',1,'2025-11-26 14:17:12.992455','2025-11-26 14:17:12.996459'),(13,'OBJETIVO','VIOBEJTO',1,'2025-11-26 14:17:13.002454','2025-11-26 14:17:13.006110'),(14,'META','ETAM',1,'2025-11-26 14:17:13.012458','2025-11-26 14:17:13.016457'),(15,'RESULTADO','TRUDLESOA',1,'2025-11-26 14:17:13.021455','2025-11-26 14:17:13.024717'),(16,'COMPETENCIA','TIEAEMOCCNP',1,'2025-11-26 14:17:13.029717','2025-11-26 14:17:13.033311'),(17,'MERCADO','DEROMAC',1,'2025-11-26 14:17:13.038304','2025-11-26 14:17:13.042486'),(18,'OPORTUNIDAD','DRNOIPOTUDA',1,'2025-11-26 14:17:13.048486','2025-11-26 14:17:13.053688'),(19,'RIESGO','RSOEIG',1,'2025-11-26 14:17:13.058687','2025-11-26 14:17:13.063091'),(20,'EXITO','IETXO',1,'2025-11-26 14:17:13.069093','2025-11-26 14:17:13.073520'),(21,'FRACASO','FASCARO',1,'2025-11-26 14:17:13.078518','2025-11-26 14:17:13.082521'),(22,'APRENDIZAJE','RZANPEEJIDA',1,'2025-11-26 14:17:13.087534','2025-11-26 14:17:13.091968'),(23,'EXPERIENCIA','REAEXINCIPE',1,'2025-11-26 14:17:13.096968','2025-11-26 14:17:13.101971'),(24,'CONOCIMIENTO','NMCIOIONEOTC',1,'2025-11-26 14:17:13.106967','2025-11-26 14:17:13.110966'),(25,'HABILIDAD','AAILDHIDB',1,'2025-11-26 14:17:13.115172','2025-11-26 14:17:13.120172'),(26,'COMUNICACION','OMUICCNAINOC',1,'2025-11-26 14:17:13.124384','2025-11-26 14:17:13.128387'),(27,'COLABORACION','BROAAIOLCNCO',1,'2025-11-26 14:17:13.132791','2025-11-26 14:17:13.136785'),(28,'TRABAJO','JARTBAO',1,'2025-11-26 14:17:13.141785','2025-11-26 14:17:13.146136'),(29,'PROYECTO','CEORTYOP',1,'2025-11-26 14:17:13.150134','2025-11-26 14:17:13.154284'),(30,'SOLUCION','NLOUICSO',1,'2025-11-26 14:17:13.158285','2025-11-26 14:17:13.162432'),(31,'PROBLEMA','AMORLPBE',1,'2025-11-26 14:17:13.166441','2025-11-26 14:17:13.170443'),(32,'DESAFIO','DSEIOAF',1,'2025-11-26 14:17:13.174766','2025-11-26 14:17:13.178766'),(33,'RETO','REOT',1,'2025-11-26 14:17:13.183295','2025-11-26 14:17:13.187296'),(34,'MOTIVACION','TIIOOCMNAV',1,'2025-11-26 14:17:13.192457','2025-11-26 14:17:13.197459'),(35,'PASION','ISNAOP',1,'2025-11-26 14:17:13.201462','2025-11-26 14:17:13.206653'),(36,'VISION','NSIOVI',1,'2025-11-26 14:17:13.210653','2025-11-26 14:17:13.214651'),(37,'MISION','IISOMN',1,'2025-11-26 14:17:13.219654','2025-11-26 14:17:13.223651'),(38,'VALORES','ERSOLAV',1,'2025-11-26 14:17:13.228652','2025-11-26 14:17:13.232654'),(39,'CULTURA','LARCTUU',1,'2025-11-26 14:17:13.237654','2025-11-26 14:17:13.241652'),(40,'ORGANIZACION','ONCIANZAORGI',1,'2025-11-26 14:17:13.246653','2025-11-26 14:17:13.250654'),(41,'ADMINISTRACION','AMIOTNDNACIISR',1,'2025-11-26 14:17:13.255653','2025-11-26 14:17:13.258656'),(42,'GESTION','TNEISGO',1,'2025-11-26 14:17:13.263654','2025-11-26 14:17:13.267652'),(43,'DIRECCION','CRDCEOINI',1,'2025-11-26 14:17:13.272652','2025-11-26 14:17:13.276656'),(44,'SUPERVISION','SSINURIPVEO',1,'2025-11-26 14:17:13.281654','2025-11-26 14:17:13.285657'),(45,'COORDINACION','OODOINCIARNC',1,'2025-11-26 14:17:13.290653','2025-11-26 14:17:13.294651'),(46,'EJECUCION','UCNJEIOCE',1,'2025-11-26 14:17:13.299657','2025-11-26 14:17:13.303653'),(47,'EVALUACION','ACVNILAEUO',1,'2025-11-26 14:17:13.307654','2025-11-26 14:17:13.311654'),(48,'MEJORA','RMAOJE',1,'2025-11-26 14:17:13.316652','2025-11-26 14:17:13.319657'),(49,'OPTIMIZACION','ONCZPTIOIMAI',1,'2025-11-26 14:17:13.324651','2025-11-26 14:17:13.328654'),(50,'CAMALEON','OECMALNA',1,'2025-11-29 18:47:13.466192','2025-11-29 18:47:13.466192');
/*!40000 ALTER TABLE `anagram_words` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group`
--

LOCK TABLES `auth_group` WRITE;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group_permissions`
--

LOCK TABLES `auth_group_permissions` WRITE;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=189 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add log entry',1,'add_logentry'),(2,'Can change log entry',1,'change_logentry'),(3,'Can delete log entry',1,'delete_logentry'),(4,'Can view log entry',1,'view_logentry'),(5,'Can add permission',2,'add_permission'),(6,'Can change permission',2,'change_permission'),(7,'Can delete permission',2,'delete_permission'),(8,'Can view permission',2,'view_permission'),(9,'Can add group',3,'add_group'),(10,'Can change group',3,'change_group'),(11,'Can delete group',3,'delete_group'),(12,'Can view group',3,'view_group'),(13,'Can add user',4,'add_user'),(14,'Can change user',4,'change_user'),(15,'Can delete user',4,'delete_user'),(16,'Can view user',4,'view_user'),(17,'Can add content type',5,'add_contenttype'),(18,'Can change content type',5,'change_contenttype'),(19,'Can delete content type',5,'delete_contenttype'),(20,'Can view content type',5,'view_contenttype'),(21,'Can add session',6,'add_session'),(22,'Can change session',6,'change_session'),(23,'Can delete session',6,'delete_session'),(24,'Can view session',6,'view_session'),(25,'Can add access failure',7,'add_accessfailurelog'),(26,'Can change access failure',7,'change_accessfailurelog'),(27,'Can delete access failure',7,'delete_accessfailurelog'),(28,'Can view access failure',7,'view_accessfailurelog'),(29,'Can add access attempt',8,'add_accessattempt'),(30,'Can change access attempt',8,'change_accessattempt'),(31,'Can delete access attempt',8,'delete_accessattempt'),(32,'Can view access attempt',8,'view_accessattempt'),(33,'Can add access log',9,'add_accesslog'),(34,'Can change access log',9,'change_accesslog'),(35,'Can delete access log',9,'delete_accesslog'),(36,'Can view access log',9,'view_accesslog'),(37,'Can add Administrador',10,'add_administrator'),(38,'Can change Administrador',10,'change_administrator'),(39,'Can delete Administrador',10,'delete_administrator'),(40,'Can view Administrador',10,'view_administrator'),(41,'Can add Profesor',11,'add_professor'),(42,'Can change Profesor',11,'change_professor'),(43,'Can delete Profesor',11,'delete_professor'),(44,'Can view Profesor',11,'view_professor'),(45,'Can add Estudiante',12,'add_student'),(46,'Can change Estudiante',12,'change_student'),(47,'Can delete Estudiante',12,'delete_student'),(48,'Can view Estudiante',12,'view_student'),(49,'Can add Facultad',13,'add_faculty'),(50,'Can change Facultad',13,'change_faculty'),(51,'Can delete Facultad',13,'delete_faculty'),(52,'Can view Facultad',13,'view_faculty'),(53,'Can add Carrera',14,'add_career'),(54,'Can change Carrera',14,'change_career'),(55,'Can delete Carrera',14,'delete_career'),(56,'Can view Carrera',14,'view_career'),(57,'Can add Curso',15,'add_course'),(58,'Can change Curso',15,'change_course'),(59,'Can delete Curso',15,'delete_course'),(60,'Can view Curso',15,'view_course'),(61,'Can add Sesión de Juego',16,'add_gamesession'),(62,'Can change Sesión de Juego',16,'change_gamesession'),(63,'Can delete Sesión de Juego',16,'delete_gamesession'),(64,'Can view Sesión de Juego',16,'view_gamesession'),(65,'Can add Equipo',17,'add_team'),(66,'Can change Equipo',17,'change_team'),(67,'Can delete Equipo',17,'delete_team'),(68,'Can view Equipo',17,'view_team'),(69,'Can add team student',18,'add_teamstudent'),(70,'Can change team student',18,'change_teamstudent'),(71,'Can delete team student',18,'delete_teamstudent'),(72,'Can view team student',18,'view_teamstudent'),(73,'Can add Personalización del Equipo',19,'add_teampersonalization'),(74,'Can change Personalización del Equipo',19,'change_teampersonalization'),(75,'Can delete Personalización del Equipo',19,'delete_teampersonalization'),(76,'Can view Personalización del Equipo',19,'view_teampersonalization'),(77,'Can add Etapa de Sesión',20,'add_sessionstage'),(78,'Can change Etapa de Sesión',20,'change_sessionstage'),(79,'Can delete Etapa de Sesión',20,'delete_sessionstage'),(80,'Can view Etapa de Sesión',20,'view_sessionstage'),(81,'Can add Progreso de Actividad del Equipo',21,'add_teamactivityprogress'),(82,'Can change Progreso de Actividad del Equipo',21,'change_teamactivityprogress'),(83,'Can delete Progreso de Actividad del Equipo',21,'delete_teamactivityprogress'),(84,'Can view Progreso de Actividad del Equipo',21,'view_teamactivityprogress'),(85,'Can add Bubble Map del Equipo',22,'add_teambubblemap'),(86,'Can change Bubble Map del Equipo',22,'change_teambubblemap'),(87,'Can delete Bubble Map del Equipo',22,'delete_teambubblemap'),(88,'Can view Bubble Map del Equipo',22,'view_teambubblemap'),(89,'Can add Tablet',23,'add_tablet'),(90,'Can change Tablet',23,'change_tablet'),(91,'Can delete Tablet',23,'delete_tablet'),(92,'Can view Tablet',23,'view_tablet'),(93,'Can add Conexión de Tablet',24,'add_tabletconnection'),(94,'Can change Conexión de Tablet',24,'change_tabletconnection'),(95,'Can delete Conexión de Tablet',24,'delete_tabletconnection'),(96,'Can view Conexión de Tablet',24,'view_tabletconnection'),(97,'Can add Asignación de Reto de Ruleta',25,'add_teamrouletteassignment'),(98,'Can change Asignación de Reto de Ruleta',25,'change_teamrouletteassignment'),(99,'Can delete Asignación de Reto de Ruleta',25,'delete_teamrouletteassignment'),(100,'Can view Asignación de Reto de Ruleta',25,'view_teamrouletteassignment'),(101,'Can add Transacción de Tokens',26,'add_tokentransaction'),(102,'Can change Transacción de Tokens',26,'change_tokentransaction'),(103,'Can delete Transacción de Tokens',26,'delete_tokentransaction'),(104,'Can view Transacción de Tokens',26,'view_tokentransaction'),(105,'Can add Evaluación Peer',27,'add_peerevaluation'),(106,'Can change Evaluación Peer',27,'change_peerevaluation'),(107,'Can delete Evaluación Peer',27,'delete_peerevaluation'),(108,'Can view Evaluación Peer',27,'view_peerevaluation'),(109,'Can add Etapa',28,'add_stage'),(110,'Can change Etapa',28,'change_stage'),(111,'Can delete Etapa',28,'delete_stage'),(112,'Can view Etapa',28,'view_stage'),(113,'Can add Tipo de Actividad',29,'add_activitytype'),(114,'Can change Tipo de Actividad',29,'change_activitytype'),(115,'Can delete Tipo de Actividad',29,'delete_activitytype'),(116,'Can view Tipo de Actividad',29,'view_activitytype'),(117,'Can add Actividad',30,'add_activity'),(118,'Can change Actividad',30,'change_activity'),(119,'Can delete Actividad',30,'delete_activity'),(120,'Can view Actividad',30,'view_activity'),(121,'Can add Tema',31,'add_topic'),(122,'Can change Tema',31,'change_topic'),(123,'Can delete Tema',31,'delete_topic'),(124,'Can view Tema',31,'view_topic'),(125,'Can add Desafío',32,'add_challenge'),(126,'Can change Desafío',32,'change_challenge'),(127,'Can delete Desafío',32,'delete_challenge'),(128,'Can view Desafío',32,'view_challenge'),(129,'Can add Reto de Ruleta',33,'add_roulettechallenge'),(130,'Can change Reto de Ruleta',33,'change_roulettechallenge'),(131,'Can delete Reto de Ruleta',33,'delete_roulettechallenge'),(132,'Can view Reto de Ruleta',33,'view_roulettechallenge'),(133,'Can add Minijuego',34,'add_minigame'),(134,'Can change Minijuego',34,'change_minigame'),(135,'Can delete Minijuego',34,'delete_minigame'),(136,'Can view Minijuego',34,'view_minigame'),(137,'Can add Objetivo de Aprendizaje',35,'add_learningobjective'),(138,'Can change Objetivo de Aprendizaje',35,'change_learningobjective'),(139,'Can delete Objetivo de Aprendizaje',35,'delete_learningobjective'),(140,'Can view Objetivo de Aprendizaje',35,'view_learningobjective'),(141,'Can add Evaluación de Reflexión',36,'add_reflectionevaluation'),(142,'Can change Evaluación de Reflexión',36,'change_reflectionevaluation'),(143,'Can delete Evaluación de Reflexión',36,'delete_reflectionevaluation'),(144,'Can view Evaluación de Reflexión',36,'view_reflectionevaluation'),(145,'Can add Grupo de Sesiones',37,'add_sessiongroup'),(146,'Can change Grupo de Sesiones',37,'change_sessiongroup'),(147,'Can delete Grupo de Sesiones',37,'delete_sessiongroup'),(148,'Can view Grupo de Sesiones',37,'view_sessiongroup'),(149,'Can add Opción de Sopa de Letras',38,'add_wordsearchoption'),(150,'Can change Opción de Sopa de Letras',38,'change_wordsearchoption'),(151,'Can delete Opción de Sopa de Letras',38,'delete_wordsearchoption'),(152,'Can view Opción de Sopa de Letras',38,'view_wordsearchoption'),(153,'Can add Métrica de Duración de Actividad',39,'add_activitydurationmetric'),(154,'Can change Métrica de Duración de Actividad',39,'change_activitydurationmetric'),(155,'Can delete Métrica de Duración de Actividad',39,'delete_activitydurationmetric'),(156,'Can view Métrica de Duración de Actividad',39,'view_activitydurationmetric'),(157,'Can add Métrica de Selección de Desafío',40,'add_challengeselectionmetric'),(158,'Can change Métrica de Selección de Desafío',40,'change_challengeselectionmetric'),(159,'Can delete Métrica de Selección de Desafío',40,'delete_challengeselectionmetric'),(160,'Can view Métrica de Selección de Desafío',40,'view_challengeselectionmetric'),(161,'Can add Snapshot Diario de Métricas',41,'add_dailymetricssnapshot'),(162,'Can change Snapshot Diario de Métricas',41,'change_dailymetricssnapshot'),(163,'Can delete Snapshot Diario de Métricas',41,'delete_dailymetricssnapshot'),(164,'Can view Snapshot Diario de Métricas',41,'view_dailymetricssnapshot'),(165,'Can add Métrica de Duración de Etapa',42,'add_stagedurationmetric'),(166,'Can change Métrica de Duración de Etapa',42,'change_stagedurationmetric'),(167,'Can delete Métrica de Duración de Etapa',42,'delete_stagedurationmetric'),(168,'Can view Métrica de Duración de Etapa',42,'view_stagedurationmetric'),(169,'Can add Métrica de Selección de Tema',43,'add_topicselectionmetric'),(170,'Can change Métrica de Selección de Tema',43,'change_topicselectionmetric'),(171,'Can delete Métrica de Selección de Tema',43,'delete_topicselectionmetric'),(172,'Can view Métrica de Selección de Tema',43,'view_topicselectionmetric'),(173,'Can add Palabra de Anagrama',44,'add_anagramword'),(174,'Can change Palabra de Anagrama',44,'change_anagramword'),(175,'Can delete Palabra de Anagrama',44,'delete_anagramword'),(176,'Can view Palabra de Anagrama',44,'view_anagramword'),(177,'Can add Pregunta del Caos',45,'add_chaosquestion'),(178,'Can change Pregunta del Caos',45,'change_chaosquestion'),(179,'Can delete Pregunta del Caos',45,'delete_chaosquestion'),(180,'Can view Pregunta del Caos',45,'view_chaosquestion'),(181,'Can add Pregunta de Conocimiento General',46,'add_generalknowledgequestion'),(182,'Can change Pregunta de Conocimiento General',46,'change_generalknowledgequestion'),(183,'Can delete Pregunta de Conocimiento General',46,'delete_generalknowledgequestion'),(184,'Can view Pregunta de Conocimiento General',46,'view_generalknowledgequestion'),(185,'Can add Código de Acceso de Profesor',47,'add_professoraccesscode'),(186,'Can change Código de Acceso de Profesor',47,'change_professoraccesscode'),(187,'Can delete Código de Acceso de Profesor',47,'delete_professoraccesscode'),(188,'Can view Código de Acceso de Profesor',47,'view_professoraccesscode');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user`
--

DROP TABLE IF EXISTS `auth_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) NOT NULL,
  `first_name` varchar(150) NOT NULL,
  `last_name` varchar(150) NOT NULL,
  `email` varchar(254) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user`
--

LOCK TABLES `auth_user` WRITE;
/*!40000 ALTER TABLE `auth_user` DISABLE KEYS */;
INSERT INTO `auth_user` VALUES (23,'pbkdf2_sha256$720000$njRg9JCrr1YzN1pqFHIxMG$ip9vCiRJsRyPhfDwBAUH8tTNAoXD9XJh5pNCXdHvy+g=','2025-11-30 20:15:47.000000',1,'admin','','','admin@udd.cl',1,1,'2025-11-30 20:15:29.000000'),(24,'pbkdf2_sha256$720000$0JGPkMNB8CNQ0viA3UrXPc$0T7c6YRpQgKS+yYH5slz/lRIOFHRSWLYJ7UCe5v4iRQ=',NULL,0,'profe1','frf','rfrf','profe1@udd.cl',0,1,'2025-11-30 20:21:22.413410');
/*!40000 ALTER TABLE `auth_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user_groups`
--

DROP TABLE IF EXISTS `auth_user_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_groups_user_id_group_id_94350c0c_uniq` (`user_id`,`group_id`),
  KEY `auth_user_groups_group_id_97559544_fk_auth_group_id` (`group_id`),
  CONSTRAINT `auth_user_groups_group_id_97559544_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `auth_user_groups_user_id_6a12ed8b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user_groups`
--

LOCK TABLES `auth_user_groups` WRITE;
/*!40000 ALTER TABLE `auth_user_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user_user_permissions`
--

DROP TABLE IF EXISTS `auth_user_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user_user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_user_permissions_user_id_permission_id_14a6b632_uniq` (`user_id`,`permission_id`),
  KEY `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user_user_permissions`
--

LOCK TABLES `auth_user_user_permissions` WRITE;
/*!40000 ALTER TABLE `auth_user_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `axes_accessattempt`
--

DROP TABLE IF EXISTS `axes_accessattempt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `axes_accessattempt` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_agent` varchar(255) NOT NULL,
  `ip_address` char(39) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `http_accept` varchar(1025) NOT NULL,
  `path_info` varchar(255) NOT NULL,
  `attempt_time` datetime(6) NOT NULL,
  `get_data` longtext NOT NULL,
  `post_data` longtext NOT NULL,
  `failures_since_start` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `axes_accessattempt_username_ip_address_user_agent_8ea22282_uniq` (`username`,`ip_address`,`user_agent`),
  KEY `axes_accessattempt_ip_address_10922d9c` (`ip_address`),
  KEY `axes_accessattempt_user_agent_ad89678b` (`user_agent`),
  KEY `axes_accessattempt_username_3f2d4ca0` (`username`),
  CONSTRAINT `axes_accessattempt_chk_1` CHECK ((`failures_since_start` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `axes_accessattempt`
--

LOCK TABLES `axes_accessattempt` WRITE;
/*!40000 ALTER TABLE `axes_accessattempt` DISABLE KEYS */;
/*!40000 ALTER TABLE `axes_accessattempt` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `axes_accessfailurelog`
--

DROP TABLE IF EXISTS `axes_accessfailurelog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `axes_accessfailurelog` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_agent` varchar(255) NOT NULL,
  `ip_address` char(39) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `http_accept` varchar(1025) NOT NULL,
  `path_info` varchar(255) NOT NULL,
  `attempt_time` datetime(6) NOT NULL,
  `locked_out` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `axes_accessfailurelog_user_agent_ea145dda` (`user_agent`),
  KEY `axes_accessfailurelog_ip_address_2e9f5a7f` (`ip_address`),
  KEY `axes_accessfailurelog_username_a8b7e8a4` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `axes_accessfailurelog`
--

LOCK TABLES `axes_accessfailurelog` WRITE;
/*!40000 ALTER TABLE `axes_accessfailurelog` DISABLE KEYS */;
/*!40000 ALTER TABLE `axes_accessfailurelog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `axes_accesslog`
--

DROP TABLE IF EXISTS `axes_accesslog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `axes_accesslog` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_agent` varchar(255) NOT NULL,
  `ip_address` char(39) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `http_accept` varchar(1025) NOT NULL,
  `path_info` varchar(255) NOT NULL,
  `attempt_time` datetime(6) NOT NULL,
  `logout_time` datetime(6) DEFAULT NULL,
  `session_hash` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `axes_accesslog_ip_address_86b417e5` (`ip_address`),
  KEY `axes_accesslog_user_agent_0e659004` (`user_agent`),
  KEY `axes_accesslog_username_df93064b` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `axes_accesslog`
--

LOCK TABLES `axes_accesslog` WRITE;
/*!40000 ALTER TABLE `axes_accesslog` DISABLE KEYS */;
INSERT INTO `axes_accesslog` VALUES (1,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 OPR/123.0.0.0','127.0.0.1','mati','text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7','/admin/login/','2025-11-07 14:26:19.694722',NULL,'63ce48493c2bb19e3bf201f01120fa0bd9f932a0c22cdd4b2b50219801eae68a'),(2,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 OPR/123.0.0.0','127.0.0.1','mati','text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7','/admin/login/','2025-11-17 07:34:05.415189',NULL,'549a0cc7ef5af54718bfd16b957abc379abadfd9002a1dec358140c3ce3f1435'),(3,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0','127.0.0.1','mati','text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7','/admin/login/','2025-11-25 22:32:33.668242',NULL,'ccf04af6bdfd748fda202cae0422693cd83db6addcc8590c3469f110b5179193'),(4,'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0','127.0.0.1','mati','text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8','/admin/login/','2025-11-29 15:44:15.471073',NULL,'c2364186aa028b24aebe9497532903c4ccbaa9cbc42c7c606221372570a36730'),(5,'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0','127.0.0.1','admin','text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8','/admin/login/','2025-11-30 20:15:47.356913',NULL,'96e55aaf0b8f0ff4626a93a84d9df262f6e39553ab37a92debbb2194f64cdb05');
/*!40000 ALTER TABLE `axes_accesslog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `careers`
--

DROP TABLE IF EXISTS `careers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `careers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `faculty_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `careers_faculty_id_name_c4366f21_uniq` (`faculty_id`,`name`),
  UNIQUE KEY `code` (`code`),
  KEY `careers_faculty_58893f_idx` (`faculty_id`),
  KEY `careers_is_acti_c4cbef_idx` (`is_active`),
  CONSTRAINT `careers_faculty_id_ae4a8821_fk_faculties_id` FOREIGN KEY (`faculty_id`) REFERENCES `faculties` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `careers`
--

LOCK TABLES `careers` WRITE;
/*!40000 ALTER TABLE `careers` DISABLE KEYS */;
INSERT INTO `careers` VALUES (1,'Ingeniería civil informática e innovación tecnológica',NULL,1,'2025-11-04 00:41:26.488000','2025-11-04 00:41:26.488000',1);
/*!40000 ALTER TABLE `careers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `challenge_selection_metrics`
--

DROP TABLE IF EXISTS `challenge_selection_metrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `challenge_selection_metrics` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `selection_count` int NOT NULL,
  `avg_tokens_earned` double NOT NULL,
  `last_selected_at` datetime(6) DEFAULT NULL,
  `challenge_id` bigint NOT NULL,
  `topic_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `challenge_selection_metrics_challenge_id_0c601301_uniq` (`challenge_id`),
  KEY `challenge_selection_metrics_topic_id_3dc0c55d_fk_topics_id` (`topic_id`),
  CONSTRAINT `challenge_selection__challenge_id_0c601301_fk_challenge` FOREIGN KEY (`challenge_id`) REFERENCES `challenges` (`id`),
  CONSTRAINT `challenge_selection_metrics_topic_id_3dc0c55d_fk_topics_id` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `challenge_selection_metrics`
--

LOCK TABLES `challenge_selection_metrics` WRITE;
/*!40000 ALTER TABLE `challenge_selection_metrics` DISABLE KEYS */;
INSERT INTO `challenge_selection_metrics` VALUES (6,4,0,'2025-12-03 17:54:52.995564',7,3),(7,4,0,'2025-12-03 07:23:27.059699',3,1),(8,4,0,'2025-12-03 17:54:52.921873',2,1),(9,2,0,'2025-12-03 07:23:27.029536',8,3),(10,2,0,'2025-12-03 07:23:26.996660',9,3),(11,2,0,'2025-12-03 17:54:52.958473',6,2);
/*!40000 ALTER TABLE `challenge_selection_metrics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `challenges`
--

DROP TABLE IF EXISTS `challenges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `challenges` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `difficulty_level` varchar(20) NOT NULL,
  `learning_objectives` longtext,
  `additional_resources` longtext,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `topic_id` bigint NOT NULL,
  `icon` varchar(10) DEFAULT NULL,
  `persona_age` int DEFAULT NULL,
  `persona_name` varchar(100) DEFAULT NULL,
  `persona_story` longtext,
  `description` longtext,
  `persona_image` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `challenges_topic_i_f14e19_idx` (`topic_id`),
  KEY `challenges_difficu_238107_idx` (`difficulty_level`),
  KEY `challenges_is_acti_5318b2_idx` (`is_active`),
  CONSTRAINT `challenges_topic_id_f5b3d705_fk_topics_id` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `challenges`
--

LOCK TABLES `challenges` WRITE;
/*!40000 ALTER TABLE `challenges` DISABLE KEYS */;
INSERT INTO `challenges` VALUES (1,'Autogestión de tratamientos','medium','','',1,'2025-11-04 23:30:45.718000','2025-11-17 08:07:58.153589',1,'?',50,'Humberto','Fue dado de alta con indicaciones médicas complejas, pero no entendió qué debía seguir tomando ni a quién acudir si se sentía mal.','Muchos errores médicos y complicaciones surgen al cambiar de un centro de salud a otro, por falta de continuidad y seguimiento personalizado.','personas/perfil-ia-1763366872037.png'),(2,'Obesidad','medium','','',1,'2025-11-04 23:30:45.727000','2025-11-17 08:03:35.132286',1,'⚖️',27,'Simona','Tiene una hija pequeña y trabaja tiempo completo. Sabe que la alimentación es clave, pero no ha podido organizar ni aprender a darle una nutrición buena a su hija.','Más de un 70% de la población en Chile presenta sobrepeso u obesidad (MINSAL). Esta situación se debe múltiples factores, entre ellos la falta de ejercicio y educación nutricional, disponibilidad de productos ultraprocesados y la desinformación.','personas/perfil-ia-1763366608710.png'),(3,'Envejecimiento activo','medium','','',1,'2025-11-04 23:30:45.734000','2025-11-17 07:55:32.568298',1,'?',72,'Juana','Vive sola desde que sus hijos se independizaron. Le gustaría mantenerse activa, pero no conoce programas accesibles que la motiven a hacer ejercicio, socializar y prevenir enfermedades.','La población chilena está envejeciendo rápidamente y muchos adultos mayores enfrentan soledad, pérdida de movilidad y falta de programas de prevención.','personas/persona-profile_6.jpg'),(4,'Educación financiera accesible','medium','','',1,'2025-11-04 23:30:45.753000','2025-11-17 07:53:31.801716',2,'?',22,'Martina','Joven emprendedora de 22 años, vende productos por redes sociales. Aunque gana dinero, no sabe cómo organizarlo ni cuánto debe ahorrar o invertir, lo que lo mantiene en constante inestabilidad.','La ausencia de educación financiera en realidades económicas inestables dificulta la planificación y el uso responsable del dinero.','personas/persona-profile_5.jpg'),(5,'Inicio de vida laboral','medium','','',1,'2025-11-04 23:30:45.760000','2025-11-17 07:51:08.129717',2,'?',23,'Andrés','Acaba de egresar de odontología. Le preocupa no poder trabajar pronto, pero ninguna clínica lo ha llamado porque no tiene experiencia previa.','Muchos estudiantes recién titulados enfrentan barreras para conseguir su primer empleo, ya que se les exige experiencia previa que aún no han podido adquirir.','personas/persona-profile_4.jpg'),(6,'Tecnología adultos mayores','medium','','',1,'2025-11-04 23:30:45.766000','2025-11-17 07:47:53.283466',2,'?',70,'Osvaldo','Es un adulto mayor de 70 años y debe pedir ayuda a sus hijos o nietos cada vez que debe hacer tramites.','El avance tecnológico en los últimos años ha sido incremental. Esto ha beneficiado a múltiples sectores, sin embargo el conocimiento y adaptación para los adultos mayores ha sido una gran dificultad.','personas/persona-profile_3.jpg'),(7,'Contaminación por fast fashion','medium','','',1,'2025-11-04 23:30:45.791000','2025-11-17 07:46:31.242909',3,'?',18,'Gabriela','Estudiante de 18 años que vive cerca de esta zona y debe pasar a diario por lugares con desagradables olores.','La moda rápida ha traído graves consecuencias al medio ambiente. Especialmente en sectores del norte de Chile en donde los vertederos y basurales están afectando el diario vivir de las personas.','personas/persona-profile_2.jpg'),(8,'Acceso al agua en la agricultura','medium','','',1,'2025-11-04 23:30:45.798000','2025-11-17 07:44:09.892309',3,'?',50,'Camila','Agricultora de 50 años que cultiva paltas de exportación, ella está complicada de perder su negocio por la cantidad de agua que debe utilizar.','El agua dulce es un recurso natural fundamental para la vida. Hay zonas rurales en que el agua se ha hecho escasa.','personas/persona-profile_1.jpg'),(9,'Gestión de residuos electrónicos','medium','','',1,'2025-11-04 23:30:45.804000','2025-11-17 07:41:19.185456',3,'♻️',29,'Francisco','Cambió su celular y computador el año pasado, pero no sabe dónde llevar los antiguos dispositivos. Terminó guardándolos en un cajón, como millones de personas que desconocen alternativas de reciclaje.','El aumento del consumo tecnológico ha generado toneladas de desechos electrónicos difíciles de reciclar.','personas/persona-profile.jpg');
/*!40000 ALTER TABLE `challenges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chaos_questions`
--

DROP TABLE IF EXISTS `chaos_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chaos_questions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `question` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `chaos_quest_is_acti_ed3ea2_idx` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chaos_questions`
--

LOCK TABLES `chaos_questions` WRITE;
/*!40000 ALTER TABLE `chaos_questions` DISABLE KEYS */;
INSERT INTO `chaos_questions` VALUES (1,'¿Cuál es tu mayor miedo al emprender?',1,'2025-11-26 14:17:13.336652','2025-11-26 14:17:13.336652'),(2,'¿Qué te motiva más en la vida?',1,'2025-11-26 14:17:13.341654','2025-11-26 14:17:13.341654'),(3,'¿Cuál es tu superpoder oculto?',1,'2025-11-26 14:17:13.346653','2025-11-26 14:17:13.346653'),(4,'¿Qué harías si tuvieras un millón de dólares?',1,'2025-11-26 14:17:13.351653','2025-11-26 14:17:13.351653'),(5,'¿Cuál es tu comida favorita?',1,'2025-11-26 14:17:13.354901','2025-11-26 14:17:13.355899'),(6,'¿Qué animal te representa mejor y por qué?',1,'2025-11-26 14:17:13.359902','2025-11-26 14:17:13.359902'),(7,'¿Cuál es tu película favorita?',1,'2025-11-26 14:17:13.364085','2025-11-26 14:17:13.364085'),(8,'¿Qué lugar del mundo te gustaría visitar?',1,'2025-11-26 14:17:13.368086','2025-11-26 14:17:13.368086'),(9,'¿Cuál es tu hobby favorito?',1,'2025-11-26 14:17:13.372311','2025-11-26 14:17:13.372311'),(10,'¿Qué te hace reír?',1,'2025-11-26 14:17:13.376312','2025-11-26 14:17:13.376312'),(11,'¿Cuál es tu mayor fortaleza?',1,'2025-11-26 14:17:13.379306','2025-11-26 14:17:13.379306'),(12,'¿Qué te gustaría aprender?',1,'2025-11-26 14:17:13.383486','2025-11-26 14:17:13.383486'),(13,'¿Cuál es tu sueño más grande?',1,'2025-11-26 14:17:13.387641','2025-11-26 14:17:13.387641'),(14,'¿Qué te inspira?',1,'2025-11-26 14:17:13.391644','2025-11-26 14:17:13.391644'),(15,'¿Cuál es tu canción favorita?',1,'2025-11-26 14:17:13.395644','2025-11-26 14:17:13.395644'),(16,'¿Qué te relaja?',1,'2025-11-26 14:17:13.400643','2025-11-26 14:17:13.400643'),(17,'¿Cuál es tu libro favorito?',1,'2025-11-26 14:17:13.404644','2025-11-26 14:17:13.404644'),(18,'¿Qué te enoja?',1,'2025-11-26 14:17:13.408645','2025-11-26 14:17:13.408645'),(19,'¿Cuál es tu mayor logro?',1,'2025-11-26 14:17:13.412641','2025-11-26 14:17:13.412641'),(20,'¿Qué te da miedo?',1,'2025-11-26 14:17:13.416641','2025-11-26 14:17:13.416641'),(21,'¿Cuál es tu color favorito?',1,'2025-11-26 14:17:13.420640','2025-11-26 14:17:13.420640'),(22,'¿Qué te hace feliz?',1,'2025-11-26 14:17:13.424641','2025-11-26 14:17:13.424641'),(23,'¿Cuál es tu estación del año favorita?',1,'2025-11-26 14:17:13.428643','2025-11-26 14:17:13.428643'),(24,'¿Qué te sorprende?',1,'2025-11-26 14:17:13.433650','2025-11-26 14:17:13.433650'),(25,'¿Cuál es tu deporte favorito?',1,'2025-11-26 14:17:13.437644','2025-11-26 14:17:13.437644'),(26,'¿Qué te emociona?',1,'2025-11-26 14:17:13.442643','2025-11-26 14:17:13.442643'),(27,'¿Cuál es tu serie favorita?',1,'2025-11-26 14:17:13.446854','2025-11-26 14:17:13.446854'),(28,'¿Qué te frustra?',1,'2025-11-26 14:17:13.450851','2025-11-26 14:17:13.450851'),(29,'¿Cuál es tu juego favorito?',1,'2025-11-26 14:17:13.455013','2025-11-26 14:17:13.455013'),(30,'¿Qué te apasiona?',1,'2025-11-26 14:17:13.460011','2025-11-26 14:17:13.460011'),(31,'¿Tienes mascotas?',1,'2025-11-29 18:48:01.324585','2025-11-29 18:48:01.324585');
/*!40000 ALTER TABLE `chaos_questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `career_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `courses_career__131c4c_idx` (`career_id`),
  KEY `courses_is_acti_25e634_idx` (`is_active`),
  CONSTRAINT `courses_career_id_9d0a8719_fk_careers_id` FOREIGN KEY (`career_id`) REFERENCES `careers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` VALUES (1,'Ingeniería de software',NULL,1,'2025-11-04 00:47:23.162000','2025-11-04 00:47:23.162000',1);
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `daily_metrics_snapshots`
--

DROP TABLE IF EXISTS `daily_metrics_snapshots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_metrics_snapshots` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `games_completed` int NOT NULL,
  `new_professors` int NOT NULL,
  `new_students` int NOT NULL,
  `total_sessions` int NOT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `date` (`date`),
  KEY `daily_metri_date_3f4067_idx` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_metrics_snapshots`
--

LOCK TABLES `daily_metrics_snapshots` WRITE;
/*!40000 ALTER TABLE `daily_metrics_snapshots` DISABLE KEYS */;
/*!40000 ALTER TABLE `daily_metrics_snapshots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_auth_user_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=436 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
INSERT INTO `django_admin_log` VALUES (412,'2025-11-30 20:16:39.072719','23','admin',2,'[{\"changed\": {\"fields\": [\"Email address\"]}}]',4,23),(413,'2025-11-30 20:25:01.878638','235','Sesión UNI3C1 - Ingeniería de software',3,'',16,23),(414,'2025-11-30 20:25:11.389420','24','Profesor: frf rfrf',3,'',11,23),(415,'2025-11-30 20:25:21.705236','6','Código 679813 para profe1@udd.cl',3,'',47,23),(416,'2025-11-30 20:25:21.714736','5','Código 128086 para nuevoprodesor2@udd.cl',3,'',47,23),(417,'2025-11-30 20:25:21.714736','4','Código 931792 para nuevoprofesor@udd.cl',3,'',47,23),(418,'2025-11-30 20:25:35.521611','80','MATÍAS ALEJANDRO VERGARA FLORES (20914842)',3,'',12,23),(419,'2025-11-30 20:25:35.531047','79','RENATO IGNACIO VARELA ROJAS (21765535)',3,'',12,23),(420,'2025-11-30 20:25:35.532690','78','ÁLVARO FRANCISCO TORRES FERNÁNDEZ (21740840)',3,'',12,23),(421,'2025-11-30 20:25:35.539369','77','JOSE IGNACIO SAAVEDRA HANS (21551254)',3,'',12,23),(422,'2025-11-30 20:25:35.539369','76','SEBASTIAN FERNANDO RUIZ RIFFO (21675942)',3,'',12,23),(423,'2025-11-30 20:25:35.539369','75','DANIEL ANDRÉS ROMERO BELTRÁN (21439688)',3,'',12,23),(424,'2025-11-30 20:25:35.552517','74','LUCAS JEREMÍAS RIQUELME TORRES (21303074)',3,'',12,23),(425,'2025-11-30 20:25:35.557528','73','AGUSTÍN EDUARDO REYES PEREIRA (21150243)',3,'',12,23),(426,'2025-11-30 20:25:35.557528','72','SEBASTIÁN RAMORINO CARRILLO (21782154)',3,'',12,23),(427,'2025-11-30 20:25:35.566570','71','SANTIAGO ANDRÉS PAGE MUNITA (21612007)',3,'',12,23),(428,'2025-11-30 20:25:35.566570','70','MARTÍN ALEJANDRO OLIVARES ROJAS (21644638)',3,'',12,23),(429,'2025-11-30 20:25:35.575641','69','MARTÍN ISAIAS GUERRERO ANCAPICHÚN (21605843)',3,'',12,23),(430,'2025-11-30 20:25:35.578529','68','BASTIÁN IGNACIO FARIÑA LARA (21756083)',3,'',12,23),(431,'2025-11-30 20:25:35.579828','67','ALEJANDRO PATRICIO BARRIENTOS VILLALOBOS (21594003)',3,'',12,23),(432,'2025-11-30 20:25:35.584596','66','RAIMUNDO BARBOSA PETIT (21552660)',3,'',12,23),(433,'2025-11-30 20:25:35.584596','65','LEANDRO AÑASCO TELLERI (21793579)',3,'',12,23),(434,'2025-11-30 20:25:35.584596','64','JESUS ALEJANDRO AZUAJE PEREZ (26083316)',3,'',12,23),(435,'2025-11-30 20:26:06.879167','16','animales (Presentación)',3,'',38,23);
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (14,'academic','career'),(15,'academic','course'),(13,'academic','faculty'),(1,'admin','logentry'),(39,'admin_dashboard','activitydurationmetric'),(40,'admin_dashboard','challengeselectionmetric'),(41,'admin_dashboard','dailymetricssnapshot'),(42,'admin_dashboard','stagedurationmetric'),(43,'admin_dashboard','topicselectionmetric'),(3,'auth','group'),(2,'auth','permission'),(4,'auth','user'),(8,'axes','accessattempt'),(7,'axes','accessfailurelog'),(9,'axes','accesslog'),(30,'challenges','activity'),(29,'challenges','activitytype'),(44,'challenges','anagramword'),(32,'challenges','challenge'),(45,'challenges','chaosquestion'),(46,'challenges','generalknowledgequestion'),(35,'challenges','learningobjective'),(34,'challenges','minigame'),(33,'challenges','roulettechallenge'),(28,'challenges','stage'),(31,'challenges','topic'),(38,'challenges','wordsearchoption'),(5,'contenttypes','contenttype'),(16,'game_sessions','gamesession'),(27,'game_sessions','peerevaluation'),(36,'game_sessions','reflectionevaluation'),(37,'game_sessions','sessiongroup'),(20,'game_sessions','sessionstage'),(23,'game_sessions','tablet'),(24,'game_sessions','tabletconnection'),(17,'game_sessions','team'),(21,'game_sessions','teamactivityprogress'),(22,'game_sessions','teambubblemap'),(19,'game_sessions','teampersonalization'),(25,'game_sessions','teamrouletteassignment'),(18,'game_sessions','teamstudent'),(26,'game_sessions','tokentransaction'),(6,'sessions','session'),(10,'users','administrator'),(11,'users','professor'),(47,'users','professoraccesscode'),(12,'users','student');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'academic','0001_initial','2025-11-07 11:18:50.379498'),(2,'contenttypes','0001_initial','2025-11-07 11:18:50.445360'),(3,'auth','0001_initial','2025-11-07 11:18:51.391086'),(4,'admin','0001_initial','2025-11-07 11:18:51.573167'),(5,'admin','0002_logentry_remove_auto_add','2025-11-07 11:18:51.573167'),(6,'admin','0003_logentry_add_action_flag_choices','2025-11-07 11:18:51.597177'),(7,'contenttypes','0002_remove_content_type_name','2025-11-07 11:18:51.750732'),(8,'auth','0002_alter_permission_name_max_length','2025-11-07 11:18:51.843983'),(9,'auth','0003_alter_user_email_max_length','2025-11-07 11:18:51.875687'),(10,'auth','0004_alter_user_username_opts','2025-11-07 11:18:51.881266'),(11,'auth','0005_alter_user_last_login_null','2025-11-07 11:18:51.965334'),(12,'auth','0006_require_contenttypes_0002','2025-11-07 11:18:51.968298'),(13,'auth','0007_alter_validators_add_error_messages','2025-11-07 11:18:51.979752'),(14,'auth','0008_alter_user_username_max_length','2025-11-07 11:18:52.056842'),(15,'auth','0009_alter_user_last_name_max_length','2025-11-07 11:18:52.158767'),(16,'auth','0010_alter_group_name_max_length','2025-11-07 11:18:52.181613'),(17,'auth','0011_update_proxy_permissions','2025-11-07 11:18:52.197385'),(18,'auth','0012_alter_user_first_name_max_length','2025-11-07 11:18:52.291638'),(19,'axes','0001_initial','2025-11-07 11:18:52.374330'),(20,'axes','0002_auto_20151217_2044','2025-11-07 11:18:52.557407'),(21,'axes','0003_auto_20160322_0929','2025-11-07 11:18:52.579574'),(22,'axes','0004_auto_20181024_1538','2025-11-07 11:18:52.595128'),(23,'axes','0005_remove_accessattempt_trusted','2025-11-07 11:18:52.741237'),(24,'axes','0006_remove_accesslog_trusted','2025-11-07 11:18:52.881329'),(25,'axes','0007_alter_accessattempt_unique_together','2025-11-07 11:18:52.925243'),(26,'axes','0008_accessfailurelog','2025-11-07 11:18:53.051456'),(27,'axes','0009_add_session_hash','2025-11-07 11:18:53.126104'),(28,'challenges','0001_initial','2025-11-07 11:18:54.205720'),(29,'challenges','0002_add_challenge_icon_and_persona','2025-11-07 11:18:54.558015'),(30,'challenges','0003_remove_user_story_field','2025-11-07 11:18:54.628065'),(31,'challenges','0004_add_challenge_description','2025-11-07 11:18:54.698822'),(32,'challenges','0005_add_topic_icon','2025-11-07 11:18:54.780506'),(33,'users','0001_initial','2025-11-07 11:18:55.141011'),(34,'game_sessions','0001_initial','2025-11-07 11:18:59.542900'),(35,'game_sessions','0002_remove_duplicate_progress','2025-11-07 11:18:59.582185'),(36,'game_sessions','0003_alter_teamactivityprogress_unique_together','2025-11-07 11:18:59.628524'),(37,'game_sessions','0004_teambubblemap','2025-11-07 11:18:59.890476'),(38,'game_sessions','0005_sessionstage_current_presentation_team_id_and_more','2025-11-07 11:19:00.107282'),(39,'game_sessions','0006_sessionstage_presentation_state','2025-11-07 11:19:00.223904'),(40,'game_sessions','0007_sessionstage_presentation_timestamps','2025-11-07 11:19:00.339952'),(41,'sessions','0001_initial','2025-11-07 11:19:00.390621'),(42,'game_sessions','0008_reflectionevaluation','2025-11-14 06:31:16.913363'),(43,'game_sessions','0009_reflectionevaluation_faculty_and_more','2025-11-14 06:39:16.895203'),(44,'game_sessions','0010_sessiongroup_gamesession_session_group_and_more','2025-11-14 12:05:36.087470'),(45,'game_sessions','0011_teamactivityprogress_pitch_value_and_pitch_impact','2025-11-15 22:05:36.320616'),(46,'game_sessions','0012_alter_teamactivityprogress_pitch_intro_problem','2025-11-15 23:34:58.092335'),(47,'challenges','0006_wordsearchoption','2025-11-16 19:13:29.503264'),(48,'challenges','0007_challenge_persona_image','2025-11-17 07:35:33.887503'),(49,'game_sessions','0013_gamesession_cancellation_reason_and_more','2025-11-18 05:12:55.461861'),(50,'game_sessions','0014_gamesession_game_sessio_created_7179a2_idx_and_more','2025-11-23 16:57:36.631764'),(51,'admin_dashboard','0001_initial','2025-11-26 01:56:16.881349'),(52,'admin_dashboard','0002_rename_activity_du_activit_idx_activity_du_activit_444351_idx_and_more','2025-11-26 01:56:16.962653'),(53,'challenges','0008_wordsearchoption_grid_wordsearchoption_seed_and_more','2025-11-26 13:57:36.060588'),(54,'users','0002_professoraccesscode','2025-11-29 14:39:55.411036'),(55,'users','0003_create_professor_for_existing_administrators','2025-11-29 15:42:06.894399'),(56,'users','0004_professoraccesscode_prof_access_code_lookup_idx','2025-11-29 15:42:07.186940'),(57,'users','0005_create_administrator_for_existing_superusers','2025-11-29 16:09:10.832996'),(58,'users','0006_create_admin_and_professor_for_existing_staff','2025-11-29 16:09:10.847497'),(59,'game_sessions','0015_add_logo_to_team_personalization','2025-12-02 02:12:58.788665'),(60,'game_sessions','0016_remove_logo_from_team_personalization','2025-12-02 02:19:06.317729');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_session`
--

LOCK TABLES `django_session` WRITE;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
INSERT INTO `django_session` VALUES ('fnvinfw3ocvpwho63vrkhwsy15uidjtk','.eJxVjDsOwyAQRO9CHSEMrGFTpvcZ0PILTiKQjF1FuXtsyUUy5bw382aOtrW4rafFzZFdmWKX385TeKZ6gPigem88tLous-eHwk_a-dRiet1O9--gUC_7OmQLqJSOniJkDDIrm0aBEgdrUkaNMA4mSwFoNKCNXghLJPZkCDawzxfW5zcw:1vO1aL:3Hx4378yXV4ZIUlO8WtYvAdm4lLURIvzhhzCfGT2y0k','2025-12-09 22:32:33.674250'),('k17x8ob20bhs6gfi7f2yqa8j9bvgxxgn','.eJxVjDsOwyAQRO9CHSEMrGFTpvcZ0PILTiKQjF1FuXtsyUUy5bw382aOtrW4rafFzZFdmWKX385TeKZ6gPigem88tLous-eHwk_a-dRiet1O9--gUC_7OmQLqJSOniJkDDIrm0aBEgdrUkaNMA4mSwFoNKCNXghLJPZkCDawzxfW5zcw:1vKtkT:B1fPQ6E1T6NRYbCKcKFQ8Mer5zCKczky3Podec5iSqM','2025-12-01 07:34:05.501190'),('qqerggmnmyrilvfuxf8z2r37nvwsb79i','.eJxVjDsOwjAQBe_iGln-4piSPmewdr1rHECOFCcV4u4QKQW0b2beSyTY1pq2zkuaSFyEseL0OyLkB7ed0B3abZZ5busyodwVedAux5n4eT3cv4MKvX7rM3BQbHUg44dYrOdQ2EUEVug4F2IMKiCTBo0IxWRFzkccHFqDJYr3BzM4OYE:1vPnpj:t2Fsau5iAxHWXFt8TPkGmDCugVKPXOsCgdbNTdiIbp0','2025-12-14 20:15:47.371188'),('wra90wm6vxaly2an4y0mmn9cu2uzm7ie','.eJxVjDsOwyAQRO9CHSEMrGFTpvcZ0PILTiKQjF1FuXtsyUUy5bw382aOtrW4rafFzZFdmWKX385TeKZ6gPigem88tLous-eHwk_a-dRiet1O9--gUC_7OmQLqJSOniJkDDIrm0aBEgdrUkaNMA4mSwFoNKCNXghLJPZkCDawzxfW5zcw:1vHNPv:nEs0BoM9sqSCs00TAfUvJ6sX7NcZTboQ23E6L9cApms','2025-11-21 14:26:19.704717');
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faculties`
--

DROP TABLE IF EXISTS `faculties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faculties` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`),
  KEY `faculties_is_acti_5069b3_idx` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faculties`
--

LOCK TABLES `faculties` WRITE;
/*!40000 ALTER TABLE `faculties` DISABLE KEYS */;
INSERT INTO `faculties` VALUES (1,'Ingeniería',NULL,1,'2025-11-04 00:40:34.190000','2025-11-04 00:40:34.190000');
/*!40000 ALTER TABLE `faculties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `game_sessions`
--

DROP TABLE IF EXISTS `game_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `game_sessions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `room_code` varchar(50) NOT NULL,
  `qr_code` longtext,
  `status` varchar(20) NOT NULL,
  `started_at` datetime(6) DEFAULT NULL,
  `ended_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `course_id` bigint NOT NULL,
  `current_activity_id` bigint DEFAULT NULL,
  `current_stage_id` bigint DEFAULT NULL,
  `professor_id` bigint NOT NULL,
  `session_group_id` bigint DEFAULT NULL,
  `cancellation_reason` varchar(50) DEFAULT NULL,
  `cancellation_reason_other` longtext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `room_code` (`room_code`),
  KEY `game_sessio_profess_2d4bd5_idx` (`professor_id`),
  KEY `game_sessio_room_co_529049_idx` (`room_code`),
  KEY `game_sessio_status_381f09_idx` (`status`),
  KEY `game_sessio_status_972612_idx` (`status`,`started_at`),
  KEY `game_sessions_current_activity_id_0a0772c5_fk_activities_id` (`current_activity_id`),
  KEY `game_sessions_current_stage_id_445084f8_fk_stages_id` (`current_stage_id`),
  KEY `game_sessions_session_group_id_836e533a_fk_session_groups_id` (`session_group_id`),
  KEY `game_sessio_created_7179a2_idx` (`created_at`),
  KEY `game_sessio_course__601678_idx` (`course_id`),
  CONSTRAINT `game_sessions_course_id_9d225134_fk_courses_id` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`),
  CONSTRAINT `game_sessions_current_activity_id_0a0772c5_fk_activities_id` FOREIGN KEY (`current_activity_id`) REFERENCES `activities` (`id`),
  CONSTRAINT `game_sessions_current_stage_id_445084f8_fk_stages_id` FOREIGN KEY (`current_stage_id`) REFERENCES `stages` (`id`),
  CONSTRAINT `game_sessions_professor_id_698ca57b_fk_professors_id` FOREIGN KEY (`professor_id`) REFERENCES `professors` (`id`),
  CONSTRAINT `game_sessions_session_group_id_836e533a_fk_session_groups_id` FOREIGN KEY (`session_group_id`) REFERENCES `session_groups` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=245 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game_sessions`
--

LOCK TABLES `game_sessions` WRITE;
/*!40000 ALTER TABLE `game_sessions` DISABLE KEYS */;
INSERT INTO `game_sessions` VALUES (236,'HBGTM9','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYYAAAGGAQAAAABX+xtIAAAChElEQVR4nO2bS26kMBCGvxqQsjRSDjBHMTeYI41yMzhKbmCWkUD/LGwDkygLpNC0UNWiX+aTyrKqXK82cUyWXwcBcMIJJ5xwwgknnHDiFGK0IjCZmXWLAWA9S13qHq6VE6cSQZI0AzQivreYmZneOpAkabhAKydOJZbNkoEw53frIXuBa7Ry4iFE+DBGayFqRkrPoZUTZxLTizTQSG8dMHbPoZUTP0e09UMjYIGxxwRgMSEjAHFfrHvOfThxnJjMzKylXOXhw/TWLaYBcjRn/QVaOXEGYd/W2w3g66rX2+9CjB1YP5kxdkvNz4PEaC3WX6SVE6cQNfnO+XlJwyVJQCMpgZSa9ZH5OffhxHFiWutw+WuLBhYz+z2Tbf9verxWTpxBlLg9pg6gmW23FhLG9CL7j3jOfThxQIpLT/uvdW3v29fy7HPuw4kDolVy0JZfAA1BIqYmF+LrU37mdyHGbjFiWqobD1K91ClRvffV7kJs9kv23gPkKrsGGhE1Q0yNiG7nNyF2tVeLw9LWaA4spldgehVMD9bKiTOJXQyX0/DV7HNCPoSZbOKen9+F2NVkIGzN03r6+cw9br8TwSfDruMSjbZVYo3q/czvQOztPKbttxLSlR+C52o3Inb5eTl91gI77C91t/ObEdvca0yNrKf21WAx8lxkerhWTpxC1FwtJIClZfzzYWJq8hCkEfIAzZrTPek+nDggu/B8i9ujytxrmXAOm+93334/YszN07XbEmZyp7W/UisnziTi+77KXsZgg8oY7FVaOfGDxJe5V8Lc5ls8vhsqF30eg32YVk6cSXz6Y1LtoGpfffMey72I7+devxGfe3XCCSeccMIJJ5y4nPgHPjjoSrIumhUAAAAASUVORK5CYII=','cancelled','2025-12-01 21:05:30.107088','2025-12-01 21:34:41.833249','2025-12-01 21:04:46.012662','2025-12-01 21:34:41.833249',1,NULL,1,23,NULL,'Problemas técnicos',NULL),(237,'670RVP','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYYAAAGGAQAAAABX+xtIAAACMElEQVR4nO2cUY6rMAxFrx+V5jPsYJaSLj0shQU8iX4+CeT5iB0CrTTqPNEp0c0HIsCRgi52HDutKJ5ry58nAYAECRIkSJAgQYLEIcQg1gAsgqEHRHpArlj8Vv/yUZE4hICqqmoKqqo6w86mzuP5MO8eec/3IPEDYjFLjqOIXMM/QdQZiBOyF/idUZE4gLg8uqiDABj6v3iwen/P9yDxH8TQd4qomtUus/gvj4rEEUSnqhOAOC0iVwCI44dm314+gZePisQBhAdopZvCvD9YYwzXCGGaVy2H7J19B3F/m5qfnigLMTds1dmVnjpdl2muPjU/PeF2PgGIGxM3zSc/4/q8FaJoXiuNWOROwbwA5/NmiNq3WzTXVYesfj6jb2+E2Odec7I1BTUvX3w77bw9YhHg9pGVRhxF7BPwu2U59+bvQeL7tvr23E0AEEu1JcFMnHbeDFHFcC7tjM0sbl3O580Qmxhu8mtm9mU+V9p5Q0TJw7l1rzmZBOtqVVin5ucn6rg9BZPb1S/XGLe3RGzycKo2gSNoKalxPm+N2OTb4XE7fH1uDwUtjZqfnrirq63pmATmXpsk7urnFqPP9VlZpFPzlojgwTtuIojjBRjkAmQHH3w35ItHReIIYpOHKxtjom7ScpzPmyLuNM8VVMALLcFzc/TtzRLDZ6ms3C5QHW03NGsszRB3v2OxBOxuzwT3RjVEPNj3uu5r7urcHH17K4TwfyZIkCBBggQJEiROR3wBM97LAx6vzXQAAAAASUVORK5CYII=','cancelled','2025-12-01 21:35:13.492573','2025-12-02 00:07:52.630216','2025-12-01 21:34:50.967655','2025-12-02 00:07:52.630216',1,1,1,23,NULL,'Faltó tiempo',NULL),(238,'N0VEAX','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYYAAAGGAQAAAABX+xtIAAACVklEQVR4nO2cTY7bMAyFHysDs5Ru0KMoN+iVraP0AAHk5QAW2AUlR06KoinGTio8LozYygfQYPgjiogonpPy7UkAIEGCBAkSJEiQIHEIkaQKUgBEZAJSAACUthRO14rEIQRUVVVnr6qqK1QzgKhVEHW9+8p7vgeJfyDK5slO7509ichrtCJxBpFCEcRcBFE/BTG/hVYkvpCYHp746wQswW40hesLtCJxJLHZ3CmAAmD5UKTgVgCAwAOIfbPuPd+DxPPEImIJHP5T7JICoDMAK9svL9CKxBEE9E5muFat58dV1u3jEFaeh9LceflQucCpXLYAULfr7/0eJP5Geu/OTgGvlr119qtdqnB/PgjRNVz6p161Nmayq5/YkxmFaBk7OwXg1Ppw8CtUc72tvwjafBCiq9KscpubuS3Ux+y2Vdp8DKKP7ftgjpix5XNHPx+H2MV2v+KWu/tVCwC0+RjEZnPUBD4DqD69C+v082GIfdel+rmtdPl8K95p8wGILZ9vx+TYsrhfcXN7+vkwRF+3m/ga6q2Gs70awHw+DrGr0lqrvXbk2irz+VhE13u9a8dYKp/tW459uHGIx3M1r33xPu8vtPk4xG3uFctUi/f4U0QuKAIsnIcbiGhzMj4DQJnaTEyZFItbkX5YI361iZmTtCJxJNHt1W6bs1vd3oT5fGQiamuwpwC0M5b1D8QZWpH4QuJx7nUJEJjbXydN36u5GdvHI3Z7tRmAzssEuaAIkky/Ic7QisQBRNdxtVs7Vc27UanIfvtIhPB/JkiQIEGCBAkSJP474hdAHnNk+0tsHQAAAABJRU5ErkJggg==','cancelled','2025-12-02 01:15:06.155414','2025-12-02 15:59:23.488566','2025-12-02 00:08:12.595039','2025-12-02 15:59:23.493445',1,1,1,23,NULL,'Faltó tiempo',NULL),(239,'2GT14F','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYYAAAGGAQAAAABX+xtIAAACY0lEQVR4nO2cQW7jMAxFH8cGspSBHki5QY806JHmBs5RcoAB5GUBC5yFKNtJu0kxTl2BWiVWHiCBpvhJERHlsZF/PQiAE0444YQTTjjhhBO7EBexAYCc67ScyXVqePqqnNiFQFVVdQyqqjqjqjMQZogJdAzz3U+OuQ8nvkDk6slTj2rqSg4nZyinwPesyonnEJ1yGQDCjGo6yKqc2JPIUpz9bQCz/gFW5cR/I/r6oVMgw+V17gWyEBMqBCBui3XH3IcTjxOTiIjYG1CU29uQRUegyPbzN6zKiT0IE+XbYbpdx89nj7kPJx4YayJmyVk55Tsz8UinRLd5S0T15ATE1C2GpyRsqql+8vy8FaL6+fI9Fkt39Vk95auzu81/PFF1e/jbmzifshD/ZFFCQphOKjfEMffhxANjU1gdyxML4JSgnqhlOT/bGyEWZW5ldaLO2CtQdF23mXWbt0Asfl5vVlbvHlkie5l1m7dFTKeal6UsIsNyxxLeRX5fT0XQP3tVTuxBmIaLmoV4XdVaFmJ6AaYXhenJq3JiT2Ibz9cAPoY1qM+Wpnl+3gpxE8+xUntVbovNXbe3RGwq6tjlGtXIddZSN7d5I8TGz+2Ap1NT8EHrHWrwXK0h4sPN2Qh2to+wDeru540Ra99rqcmQpfp5FkptLj19VU7sSpgTw2XodJufWwON90C2Q9zX4UzNrTIeqG+En+2NEhcRIV77G+tP3hvVEPGJn1e9ZndttV3CazKtEB/6XgEUcq/xKighlWfiGq4V4r5PZm2AW6tv1jTl8bwRQvx/JpxwwgknnHDCCSd+HPEPxJ5nI2hkbe4AAAAASUVORK5CYII=','completed','2025-12-03 00:17:07.111577','2025-12-03 05:56:21.453713','2025-12-02 15:59:54.712245','2025-12-03 05:56:21.453713',1,NULL,4,23,36,NULL,NULL),(240,'WG36JA','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYYAAAGGAQAAAABX+xtIAAACi0lEQVR4nO2cTarjMAyAP00Cb+nAHKBHcW8wR5ozzQ3io7wDFJxlwUazsJ3ktTPQwkt/grxK7Xwgo0iyZFFR7hv5x50AGGGEEUYYYYQRRhixCRGkjjo99RCkB8htaXi4VEZsSjhVVU1F01W/LkEYQFVVdXyCVEZsSuTFktHRnaXMHaF4gedIZcRjiCz4zx6YPv6VvL/NPoy4lfCxU8IhIUd3Fnx8CamM+Eaibw+dAhlwCYEeDb+gGLpf2/tr7sOI+4lJRER6CEMWHV2q82GAcmw/PkEqI7Yg6qF8GUXdTrWd5S9Ges19GHE3EQYAspTU3Mf2VI7sk9n5jog5nudew7FT8XFAmQa0fAIuIrg0v/ei+zDijlFddgS8JlRjp6qx07oaQUdnvn1HxCqe40s8r6EcXGK1YDrfGVHi+SSCj1l0nHp0pFM5kmX9yovvw4gbRovTk6CgCO6E4CLiP1vBNQynHtzjpDJiS2KO51115iNd9e3VoycWL2++fUdEGKjO/HesJzcgC0E+6pWa+fa9EEuuJszOXHARZfqp4CL4mJkr76+5DyNuH03n7tTXeE4WDcc+Ce58+R08SiojtiTmhohu7oroWuq2JOktibN4vgdirdDRqeIjrTDTijVWk9kXMes8sdj5UpGrL7V7F9P5Hoj/3asl8Nou10Zmszedvz9x0eBIS8i/FGBHsPx8f4Sb6y+lCy6XHshaoqHTK+IRUhmxBcGFR2/3arBqlqkx3ux8H8S1zrV69LJaQnlcDu+m8x0SU0/pdS75uTuLyEFLUfZ5UhnxfcR132v9mSQcElK0/0fQMMSHSWXElsTVuX2Vl80dMyVdt3i+E0LsfyaMMMIII4wwwggj3o74C7dkJFas9kibAAAAAElFTkSuQmCC','cancelled','2025-12-02 16:00:48.640148','2025-12-02 19:07:44.069067','2025-12-02 15:59:54.852488','2025-12-02 19:07:44.069067',1,NULL,1,23,36,'Faltó tiempo',NULL),(241,'B20D4N','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYYAAAGGAQAAAABX+xtIAAACZUlEQVR4nO2cT27yMBDF33yJxNKReoAexblBj/SpN8NH6QGQnH2i14XtxEA3SA2h1ssCQcxPTDTMmz8OGPHYsfx7EABEiBAhQoQIESJE/C4BkiTP28sIwJMEHAnPuSw5kuT8mtch4nEiOxSAW508mfFzuP1avPZ1iHiAWMxsuFu2EQCCmR1jlYgdiP6nkwwGAO7SE1gOsErE0wkbAcBHAGHY6TNEHE90TOVbsBN5RkcAHW0ESkl3hFUidiCKtk9rwnYXI9zFGIZLz/AB5CX3PKtE7Enkorw+ZvDscqH+w+prXoeIh4kwADZOZjmBTz1Sfx6sh40HWSViF6JqvlMW97Fk9jXHk7Fjin3FeQNEpd7wEciDGXRlCONmpGde2t4IcZux07DVR6SkDqQKHvJ5O0TRdrd5eq7cvWm75u3NENfantM2kra7co6c1/fJ53+e2HxZQryIOc8pzrusAorzVoha25G68q56KOm9o/J5M8Q6hzsRYTSkEZyPg8HHNwDTG4HpyVaJ2JMo2l5VaWTu0Nxa3CUpUJy3QVTaXkq1OQ9h6oJedXtDRN2fr0Ub1q689OyUz9shbuP86i6pdQfVqVdriLjbOavrdtRJXXHeGBEsH/BxMfsfFytxvhiQNl+ebpWIXYjSq7kIAEuPMHYzwtClu18NrmNaeKZVIvYkrmcypW4/lxuey+bapv3S9vaIMABlVzV36sBkZuORVonYk/BfPWyc+nLL63TK45jP4UCrRPwisebplLYBOALhnYD/MjAnesBUw7VC3P1ebe3Ltumb9ljaIkz/MyFChAgRIkSIEPHniG+dO2xArv3qTQAAAABJRU5ErkJggg==','cancelled','2025-12-03 05:58:52.527835','2025-12-03 06:43:42.127627','2025-12-03 05:58:19.870960','2025-12-03 06:43:42.127627',1,2,1,23,NULL,'Probando el juego',NULL),(242,'0QH06B','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYYAAAGGAQAAAABX+xtIAAACd0lEQVR4nO2cS6rrMAyGP90EztCBLqBLcXZ2t9Ys5Syg4AwLNroDO4+2d9DCSZpjpEHI6wMZY1n6lVaU9yz9eRMAI4wwwggjjDDCCCM2IQYpBoD0JJF+bAHS9Kjb3SsjNiFQVVW9OFVVjegFyJflEB9eOeY4jHjd2ukkteCugLu2+ADiQ2rBAUMPc013zHEY8bq1T3fGFgFQxpPKZ7wyYlfCh0bBRUTON8GHQ3hlxA8S8zpvFEiAi6vLHNH9Wqw75jiMeJ8YRUSkhaFLoheSMHTA0EFO2/sPeGXEFkRJyhe7uAi4x9uzWd5eCzF0ACSB8Uvx3y1l2YtIjgL9/l4ZsQmxqtWU8aT40IkO5wi4q4ALCC4u+f0xx2HEG7ZE9CLHPDwNk0Rjsb0W4m4/D81KeIP5zNt+XiExSNHW834+SIteaFR6UtFlypZ/7HEY8YqtU3YaVQ2AV9Usx3iNlJrd9PZKiCk3GzvI69wpwniK4NZSjOnttRHDWRWcKv5bBNxNgCQM8qU5r7PYXgtxr8mUEF6StpzSTU1Wy+FqIaZajabM9MXFVaNl3WOx/bwSYp5zWIqzUqGFRtev2JxXQqw0GUo3rRymmt00mdqI1TcTWvL2kM+U8RQFQHCpBRd288qILYn/99W8xlKk4+bC3dZ5XcTy3WtJ2hpd99pmMW5fr4zYlJhKMhhb8jcTkCQn9GWP398rI7Yg7nK4nLfHuZsW57eaudFisf3XE89zHqCseGDR4K1Wq5uQHmZh5iYiZ1X5Gz7slRE/RDz9jmVWXIsKG8hinK3zaog7HY4SzEtKF5p8wJveXhMh9j8TRhhhhBFGGGGEEb+O+AfV504JfKqYjgAAAABJRU5ErkJggg==','completed','2025-12-03 06:44:16.241911','2025-12-03 08:13:15.989462','2025-12-03 06:43:52.933623','2025-12-03 08:13:15.990460',1,NULL,4,23,NULL,NULL,NULL),(243,'KNOWIQ','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYYAAAGGAQAAAABX+xtIAAACY0lEQVR4nO2cS66jMBBF722QMgSpF5Cl+O2gl9TqncFS2IGZG90euExM3uRFytcqRhjnSIUq9XUlFG67tl83AoATTjjhhBNOOOGEE/clIEnStC+nQQLQCRgkYEhla5Akpfd8DyduJ0yh1Y60kFK8/lq893s4cQOxkRwBhIVEiBv5NUiYRwAzyddI5cQDiP76wfwn9ZrPqRfW34khbi+QyomnEmE5iX9jV0x8fAupnLgjUYJ1iedlaXcI1TPP4doiVpJkD8zjZrF7Hjfq3wiQJPn1AqmceARh8TxUbfdOCBFiWHpbPl0qJx5JVM4cIQII0kHJQ4IUrVx3394YoQmdgLUHQlZyAsLSgzwneH3eDHFI2uL+dEi5I2cOQCk7ALfzFoi9ydZZxzVIqrx8yL25zvP2dgjTuUoUN2MvUdw0HS+fc51/PFEV3+a9S75m2dxeqXsO1wpR2Xk25wnYTTxZNhci4DpvhqgOzerInnO4hNybq7yA6/zziWLnsSu91whYmaa6NHedN0cMCZh5Ejnulfreggtx87PUdoi6D5eXEagDeInnnre3RuSCPHbiV9mRFtKOXIb0jXiGVE48hDjE82hu/dKRqwbl3M5bIQ612lUGP5SqfALgtVprxEy7ih/fCKyk3WEv0t/8PZz4wVXm4YYIAFteEgAYBNCmniM0j/FpUjnxSOKQtx+aMJe2nNm++/ZWiZmnfIhOniU7SV9PPt/eNLHlKK5pZZl5j6+Xyom7Eft8eycAW56MYxDszgI9QM/hWiG+/15t3wm6DMt4v70hgv4/E0444YQTTjjhhBMfR/wHvdND4of2UvAAAAAASUVORK5CYII=','cancelled','2025-12-03 14:32:26.746790','2025-12-03 17:40:25.193006','2025-12-03 14:31:43.077985','2025-12-03 17:40:25.193152',1,2,1,23,NULL,'Faltó tiempo',NULL),(244,'RLKVBS','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYYAAAGGAQAAAABX+xtIAAACQUlEQVR4nO2cTY7jIBCFH2NLWdpSHyBHIVeeG+Cj9A3wciSi1wsKg+NedGvkdAc9FijC+SSsSv08CsUR3xv3P98EABEiRIgQIUKECBGnEIuzYcurfXI33Muj+em7EnEqMZEkE7DMAJYr6W6rc1hmgCTJ8AO7EnEGUQw6JQBTQjZ8/Ql4JjAAYLC13/keIr4+xsPK+kbn/zoQAD5R77/zPUT8B7Fc/zlgYrb2lsV/eFciziAGkhGAjwMB3J27rRfCRwCe5JF4xq5EnEA8FGhgmNLjZEP5vBPCbN6MOGwTsovvhmz+8kRTt+eJJM3ScWB5uq3J5q9PFD+PsFRu+dwmMgLZ+tJqvRBNPs9TVuURyOYOU1XvsnkfRNHnUwSAITkA4DIPCcttSM6/jwlYL3Q+PG9XIs4kHvM5fInj2Md2+Xl3xDoCWC/Eck0AVufsFDaPu9N5ezfEptVq3V7yeU7lMBeXn3dDNPocNZgHANncnqkU9NJqnRBt3f7QUmvyOeXnHRGNPi+6rNg3YLCgb5FfNu+DaPvnvqZy1CO4Etvl570QRz8va6WlpnzeG7H5+a543/S5fWmqlZ5s/vLEoa+WBVsc2NyI0tlrV8Shf15vwVm1nlBFumzeE1EV2jqCYR2BxY1ADvCTFXfP3pWIM4jDvdeAgfV2jAUA5fOeiM/vOntuhdxkAV6xvV9imYHSchlBvlu3VT2WboiDVmtuwcXd2Zz0eS/E8d4rdnej7IBO5+0dEU7/MyFChAgRIkSIEPFyxAcjUdHslHlMSQAAAABJRU5ErkJggg==','cancelled','2025-12-03 17:42:13.013803','2025-12-03 17:55:50.654890','2025-12-03 17:41:11.316325','2025-12-03 17:55:50.655102',1,5,2,23,NULL,'Probando el juego',NULL);
/*!40000 ALTER TABLE `game_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `general_knowledge_questions`
--

DROP TABLE IF EXISTS `general_knowledge_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `general_knowledge_questions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `question` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `option_a` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `option_b` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `option_c` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `option_d` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `correct_answer` int NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `general_kno_is_acti_092043_idx` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `general_knowledge_questions`
--

LOCK TABLES `general_knowledge_questions` WRITE;
/*!40000 ALTER TABLE `general_knowledge_questions` DISABLE KEYS */;
INSERT INTO `general_knowledge_questions` VALUES (1,'¿Cuál es la capital de Francia?','Londres','París','Madrid','Roma',1,1,'2025-11-26 14:17:13.468245','2025-11-26 14:17:13.468245'),(2,'¿En qué año llegó el hombre a la Luna?','1965','1969','1972','1975',1,1,'2025-11-26 14:17:13.473535','2025-11-26 14:17:13.473535'),(3,'¿Cuál es el océano más grande del mundo?','Atlántico','Índico','Pacífico','Ártico',2,1,'2025-11-26 14:17:13.479535','2025-11-26 14:17:13.479535'),(4,'¿Quién pintó la Mona Lisa?','Picasso','Van Gogh','Leonardo da Vinci','Miguel Ángel',2,1,'2025-11-26 14:17:13.484767','2025-11-26 14:17:13.484767'),(5,'¿Cuál es el planeta más cercano al Sol?','Venus','Tierra','Mercurio','Marte',2,1,'2025-11-26 14:17:13.488731','2025-11-26 14:17:13.488731'),(6,'¿Cuántos continentes hay en el mundo?','5','6','7','8',2,1,'2025-11-26 14:17:13.492941','2025-11-26 14:17:13.492941'),(7,'¿Cuál es el río más largo del mundo?','Amazonas','Nilo','Misisipi','Yangtsé',0,1,'2025-11-26 14:17:13.497941','2025-11-26 14:17:13.497941'),(8,'¿En qué continente está Egipto?','Asia','Europa','África','América',2,1,'2025-11-26 14:17:13.503150','2025-11-26 14:17:13.503150'),(9,'¿Cuál es la montaña más alta del mundo?','K2','Kilimanjaro','Everest','Aconcagua',2,1,'2025-11-26 14:17:13.507150','2025-11-26 14:17:13.507150'),(10,'¿Quién escribió \'Don Quijote de la Mancha\'?','Gabriel García Márquez','Miguel de Cervantes','Pablo Neruda','Mario Vargas Llosa',1,1,'2025-11-26 14:17:13.512328','2025-11-26 14:17:13.512328'),(11,'¿Cuál es el elemento químico más abundante en el universo?','Oxígeno','Hidrógeno','Helio','Carbono',1,1,'2025-11-26 14:17:13.516369','2025-11-26 14:17:13.516369'),(12,'¿En qué año comenzó la Segunda Guerra Mundial?','1937','1939','1941','1943',1,1,'2025-11-26 14:17:13.521334','2025-11-26 14:17:13.521334'),(13,'¿Cuál es el país más grande del mundo?','China','Estados Unidos','Rusia','Canadá',2,1,'2025-11-26 14:17:13.525598','2025-11-26 14:17:13.525598'),(14,'¿Qué instrumento tocaba Mozart?','Violín','Piano','Flauta','Todos los anteriores',3,1,'2025-11-26 14:17:13.530092','2025-11-26 14:17:13.530092'),(15,'¿Cuál es el animal más rápido del mundo?','Guepardo','León','Águila','Pez vela',0,1,'2025-11-26 14:17:13.535339','2025-11-26 14:17:13.535339'),(16,'¿Cuántos huesos tiene el cuerpo humano adulto?','196','206','216','226',1,1,'2025-11-26 14:17:13.541372','2025-11-26 14:17:13.541372'),(17,'¿Cuál es la velocidad de la luz?','300,000 km/s','150,000 km/s','450,000 km/s','600,000 km/s',0,1,'2025-11-26 14:17:13.548591','2025-11-26 14:17:13.549593'),(18,'¿En qué país está la Torre Eiffel?','Italia','España','Francia','Alemania',2,1,'2025-11-26 14:17:13.559018','2025-11-26 14:17:13.559018'),(20,'¿Qué es la fotosíntesis?','Proceso de respiración de las plantas','Proceso por el cual las plantas producen su alimento','Proceso de reproducción de las plantas','Proceso de crecimiento de las plantas',1,1,'2025-11-26 14:17:13.573460','2025-11-26 14:17:13.573460');
/*!40000 ALTER TABLE `general_knowledge_questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `learning_objectives`
--

DROP TABLE IF EXISTS `learning_objectives`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `learning_objectives` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` longtext,
  `evaluation_criteria` longtext,
  `pedagogical_recommendations` longtext,
  `estimated_time` int DEFAULT NULL,
  `associated_resources` longtext,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `stage_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `learning_ob_stage_i_1b85ec_idx` (`stage_id`),
  KEY `learning_ob_is_acti_0b73ef_idx` (`is_active`),
  CONSTRAINT `learning_objectives_stage_id_9248a876_fk_stages_id` FOREIGN KEY (`stage_id`) REFERENCES `stages` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `learning_objectives`
--

LOCK TABLES `learning_objectives` WRITE;
/*!40000 ALTER TABLE `learning_objectives` DISABLE KEYS */;
/*!40000 ALTER TABLE `learning_objectives` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `minigames`
--

DROP TABLE IF EXISTS `minigames`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `minigames` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `type` varchar(20) NOT NULL,
  `config` json DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `minigames_is_acti_7fdda0_idx` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `minigames`
--

LOCK TABLES `minigames` WRITE;
/*!40000 ALTER TABLE `minigames` DISABLE KEYS */;
/*!40000 ALTER TABLE `minigames` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `peer_evaluations`
--

DROP TABLE IF EXISTS `peer_evaluations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `peer_evaluations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `criteria_scores` json NOT NULL,
  `total_score` int NOT NULL,
  `tokens_awarded` int NOT NULL,
  `feedback` longtext,
  `submitted_at` datetime(6) NOT NULL,
  `game_session_id` bigint NOT NULL,
  `evaluated_team_id` bigint NOT NULL,
  `evaluator_team_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `peer_evaluations_evaluator_team_id_evalua_6adfd797_uniq` (`evaluator_team_id`,`evaluated_team_id`,`game_session_id`),
  KEY `peer_evalua_evaluat_41ec08_idx` (`evaluator_team_id`),
  KEY `peer_evalua_evaluat_813a7f_idx` (`evaluated_team_id`),
  KEY `peer_evalua_game_se_cf2369_idx` (`game_session_id`),
  CONSTRAINT `peer_evaluations_evaluated_team_id_c19f8124_fk_teams_id` FOREIGN KEY (`evaluated_team_id`) REFERENCES `teams` (`id`),
  CONSTRAINT `peer_evaluations_evaluator_team_id_248009cc_fk_teams_id` FOREIGN KEY (`evaluator_team_id`) REFERENCES `teams` (`id`),
  CONSTRAINT `peer_evaluations_game_session_id_fd7c8f42_fk_game_sessions_id` FOREIGN KEY (`game_session_id`) REFERENCES `game_sessions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=319 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `peer_evaluations`
--

LOCK TABLES `peer_evaluations` WRITE;
/*!40000 ALTER TABLE `peer_evaluations` DISABLE KEYS */;
INSERT INTO `peer_evaluations` VALUES (313,'{\"clarity\": 1, \"solution\": 1, \"presentation\": 1}',3,3,'','2025-12-03 05:38:11.242148',239,716,717),(314,'{\"clarity\": 1, \"solution\": 1, \"presentation\": 1}',3,3,'','2025-12-03 05:48:44.776268',239,716,715),(315,'{\"clarity\": 10, \"solution\": 10, \"presentation\": 10}',30,30,'','2025-12-03 05:49:22.855048',239,715,717),(316,'{\"clarity\": 10, \"solution\": 10, \"presentation\": 10}',30,30,'','2025-12-03 05:49:31.984962',239,715,716),(317,'{\"clarity\": 5, \"solution\": 5, \"presentation\": 5}',15,15,'','2025-12-03 05:50:23.299138',239,717,715),(318,'{\"clarity\": 5, \"solution\": 5, \"presentation\": 5}',15,15,'','2025-12-03 05:50:24.789690',239,717,716);
/*!40000 ALTER TABLE `peer_evaluations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `professor_access_codes`
--

DROP TABLE IF EXISTS `professor_access_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `professor_access_codes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL,
  `access_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_used` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `used_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `access_code` (`access_code`),
  KEY `professor_a_email_a5c55d_idx` (`email`),
  KEY `professor_a_access__60970d_idx` (`access_code`),
  KEY `professor_a_is_used_157546_idx` (`is_used`),
  KEY `prof_access_code_lookup_idx` (`access_code`,`is_used`,`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `professor_access_codes`
--

LOCK TABLES `professor_access_codes` WRITE;
/*!40000 ALTER TABLE `professor_access_codes` DISABLE KEYS */;
/*!40000 ALTER TABLE `professor_access_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `professors`
--

DROP TABLE IF EXISTS `professors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `professors` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `access_code` varchar(20) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `access_code` (`access_code`),
  KEY `professors_user_id_88fbd9_idx` (`user_id`),
  KEY `professors_access__6616cd_idx` (`access_code`),
  CONSTRAINT `professors_user_id_5d848ad9_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `professors`
--

LOCK TABLES `professors` WRITE;
/*!40000 ALTER TABLE `professors` DISABLE KEYS */;
INSERT INTO `professors` VALUES (23,NULL,'2025-11-30 20:15:29.930751','2025-11-30 20:15:29.930751',23);
/*!40000 ALTER TABLE `professors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reflection_evaluations`
--

DROP TABLE IF EXISTS `reflection_evaluations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reflection_evaluations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `student_name` varchar(200) NOT NULL,
  `student_email` varchar(254) NOT NULL,
  `career` varchar(200) DEFAULT NULL,
  `value_areas` json NOT NULL,
  `satisfaction` varchar(50) DEFAULT NULL,
  `entrepreneurship_interest` varchar(50) DEFAULT NULL,
  `comments` longtext,
  `created_at` datetime(6) NOT NULL,
  `game_session_id` bigint NOT NULL,
  `faculty` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reflection__game_se_728398_idx` (`game_session_id`),
  KEY `reflection__student_836c1c_idx` (`student_email`),
  CONSTRAINT `reflection_evaluatio_game_session_id_22c4e282_fk_game_sess` FOREIGN KEY (`game_session_id`) REFERENCES `game_sessions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reflection_evaluations`
--

LOCK TABLES `reflection_evaluations` WRITE;
/*!40000 ALTER TABLE `reflection_evaluations` DISABLE KEYS */;
/*!40000 ALTER TABLE `reflection_evaluations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roulette_challenges`
--

DROP TABLE IF EXISTS `roulette_challenges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roulette_challenges` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `description` longtext NOT NULL,
  `challenge_type` varchar(20) NOT NULL,
  `difficulty_estimated` int NOT NULL,
  `token_reward_min` int NOT NULL,
  `token_reward_max` int NOT NULL,
  `stages_applicable` json DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `roulette_ch_challen_ddbd15_idx` (`challenge_type`),
  KEY `roulette_ch_is_acti_977e2a_idx` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roulette_challenges`
--

LOCK TABLES `roulette_challenges` WRITE;
/*!40000 ALTER TABLE `roulette_challenges` DISABLE KEYS */;
/*!40000 ALTER TABLE `roulette_challenges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `session_groups`
--

DROP TABLE IF EXISTS `session_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `session_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `total_students` int NOT NULL,
  `number_of_sessions` int NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `course_id` bigint NOT NULL,
  `professor_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `session_gro_profess_20eb21_idx` (`professor_id`),
  KEY `session_gro_course__2145cd_idx` (`course_id`),
  CONSTRAINT `session_groups_course_id_b808e141_fk_courses_id` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`),
  CONSTRAINT `session_groups_professor_id_2d33326a_fk_professors_id` FOREIGN KEY (`professor_id`) REFERENCES `professors` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `session_groups`
--

LOCK TABLES `session_groups` WRITE;
/*!40000 ALTER TABLE `session_groups` DISABLE KEYS */;
INSERT INTO `session_groups` VALUES (36,46,2,'2025-12-02 15:59:54.467256','2025-12-02 15:59:54.467256',1,23);
/*!40000 ALTER TABLE `session_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `session_stages`
--

DROP TABLE IF EXISTS `session_stages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `session_stages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `status` varchar(20) NOT NULL,
  `started_at` datetime(6) DEFAULT NULL,
  `completed_at` datetime(6) DEFAULT NULL,
  `game_session_id` bigint NOT NULL,
  `stage_id` bigint NOT NULL,
  `current_presentation_team_id` int DEFAULT NULL,
  `presentation_order` json DEFAULT NULL,
  `presentation_state` varchar(20) NOT NULL,
  `presentation_timestamps` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_stages_game_session_id_stage_id_36ac96ff_uniq` (`game_session_id`,`stage_id`),
  KEY `session_sta_game_se_80d31a_idx` (`game_session_id`),
  KEY `session_sta_stage_i_9da390_idx` (`stage_id`),
  KEY `session_sta_status_9dc993_idx` (`status`),
  CONSTRAINT `session_stages_game_session_id_fd63e682_fk_game_sessions_id` FOREIGN KEY (`game_session_id`) REFERENCES `game_sessions` (`id`),
  CONSTRAINT `session_stages_stage_id_61fec690_fk_stages_id` FOREIGN KEY (`stage_id`) REFERENCES `stages` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=479 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `session_stages`
--

LOCK TABLES `session_stages` WRITE;
/*!40000 ALTER TABLE `session_stages` DISABLE KEYS */;
INSERT INTO `session_stages` VALUES (464,'in_progress','2025-12-01 21:46:01.954849',NULL,237,1,NULL,NULL,'not_started',NULL),(465,'in_progress','2025-12-02 01:22:44.400950',NULL,238,1,NULL,NULL,'not_started',NULL),(466,'completed','2025-12-02 16:00:52.959375','2025-12-02 18:45:29.286597',240,1,NULL,NULL,'not_started',NULL),(467,'completed','2025-12-03 00:17:48.796749','2025-12-03 00:34:52.103586',239,1,NULL,NULL,'not_started',NULL),(468,'completed','2025-12-03 00:40:39.832663','2025-12-03 02:36:12.093822',239,2,NULL,NULL,'not_started',NULL),(469,'completed','2025-12-03 03:12:47.556083','2025-12-03 03:33:36.556334',239,3,NULL,NULL,'not_started',NULL),(470,'completed','2025-12-03 03:42:02.888075','2025-12-03 05:50:38.005352',239,4,717,'[716, 715, 717]','evaluating','{\"715\": \"2025-12-03T05:49:01.477789+00:00\", \"716\": \"2025-12-03T04:39:28.944606+00:00\", \"717\": \"2025-12-03T05:49:54.947131+00:00\", \"_reflection\": true, \"_reflection_started_at\": \"2025-12-03T05:56:21.439027+00:00\"}'),(471,'in_progress','2025-12-03 05:59:01.925085',NULL,241,1,NULL,NULL,'not_started',NULL),(472,'completed','2025-12-03 06:44:20.619807','2025-12-03 07:20:34.312808',242,1,NULL,NULL,'not_started',NULL),(473,'completed','2025-12-03 07:22:53.868240','2025-12-03 07:23:48.827321',242,2,NULL,NULL,'not_started',NULL),(474,'completed','2025-12-03 07:25:55.217902','2025-12-03 07:26:15.873289',242,3,NULL,NULL,'not_started',NULL),(475,'completed','2025-12-03 07:27:30.766438','2025-12-03 07:34:01.738032',242,4,726,'[725, 724, 726]','evaluating','{\"724\": \"2025-12-03T07:33:30.787501+00:00\", \"725\": \"2025-12-03T07:32:34.275314+00:00\", \"726\": \"2025-12-03T07:33:52.873442+00:00\", \"_reflection\": true, \"_reflection_started_at\": \"2025-12-03T08:13:15.977275+00:00\"}'),(476,'in_progress','2025-12-03 14:32:31.418722',NULL,243,1,NULL,NULL,'not_started',NULL),(477,'completed','2025-12-03 17:42:55.646127','2025-12-03 17:53:17.086362',244,1,NULL,NULL,'not_started',NULL),(478,'in_progress','2025-12-03 17:53:35.304668',NULL,244,2,NULL,NULL,'not_started',NULL);
/*!40000 ALTER TABLE `session_stages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stage_duration_metrics`
--

DROP TABLE IF EXISTS `stage_duration_metrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stage_duration_metrics` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `total_completions` int NOT NULL,
  `total_duration_seconds` double NOT NULL,
  `avg_duration_seconds` double NOT NULL,
  `last_updated` datetime(6) NOT NULL,
  `stage_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stage_duration_metrics_stage_id_d473df5f_uniq` (`stage_id`),
  CONSTRAINT `stage_duration_metrics_stage_id_d473df5f_fk_stages_id` FOREIGN KEY (`stage_id`) REFERENCES `stages` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stage_duration_metrics`
--

LOCK TABLES `stage_duration_metrics` WRITE;
/*!40000 ALTER TABLE `stage_duration_metrics` DISABLE KEYS */;
INSERT INTO `stage_duration_metrics` VALUES (5,4,13694.767295,3423.69182375,'2025-12-03 17:53:17.098703',1),(6,2,6987.22024,3493.61012,'2025-12-03 07:23:48.862320',2),(7,2,1269.655638,634.827819,'2025-12-03 07:26:15.879328',3),(8,4,16212.177742000002,4053.0444355000004,'2025-12-03 08:13:15.985461',4);
/*!40000 ALTER TABLE `stage_duration_metrics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stages`
--

DROP TABLE IF EXISTS `stages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `number` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` longtext,
  `objective` longtext,
  `estimated_duration` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `number` (`number`),
  KEY `stages_number_09a69d_idx` (`number`),
  KEY `stages_is_acti_aa6986_idx` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stages`
--

LOCK TABLES `stages` WRITE;
/*!40000 ALTER TABLE `stages` DISABLE KEYS */;
INSERT INTO `stages` VALUES (1,1,'Trabajo en Equipo','Primera etapa del juego enfocada en trabajo colaborativo','Fomentar el trabajo en equipo y la colaboración',60,1,'2025-11-04 03:58:18.791000','2025-11-04 16:03:58.080000'),(2,2,'EmpatÃ­a','Conocer problemas y abordar un caso o desafÃ­o',NULL,30,1,'2025-11-04 23:18:44.809000','2025-11-04 23:18:44.809000'),(3,3,'Creatividad','Tercera etapa del juego enfocada en la creatividad y construcción de prototipos','Crear una solución con legos',30,1,'2025-11-05 02:28:51.625000','2025-11-05 02:28:51.625000'),(4,4,'Comunicación','Cuarta etapa del juego enfocada en la comunicación y presentación del pitch','Crear y comunicar pitch',45,1,'2025-11-05 05:28:59.097000','2025-11-05 05:28:59.097000');
/*!40000 ALTER TABLE `stages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `full_name` varchar(200) NOT NULL,
  `email` varchar(254) NOT NULL,
  `rut` varchar(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `rut` (`rut`),
  KEY `students_email_b942ac_idx` (`email`),
  KEY `students_rut_b476d2_idx` (`rut`)
) ENGINE=InnoDB AUTO_INCREMENT=144 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (81,'JESUS ALEJANDRO AZUAJE PEREZ','j.azuajep@udd.cl','26083316','2025-12-01 21:04:43.263274','2025-12-01 21:04:43.263274'),(82,'LEANDRO AÑASCO TELLERI','lanascot@udd.cl','21793579','2025-12-01 21:04:43.462535','2025-12-01 21:04:43.462535'),(83,'RAIMUNDO BARBOSA PETIT','r.barbosap@udd.cl','21552660','2025-12-01 21:04:43.646447','2025-12-01 21:04:43.646447'),(84,'ALEJANDRO PATRICIO BARRIENTOS VILLALOBOS','a.barrientosv@udd.cl','21594003','2025-12-01 21:04:43.721596','2025-12-01 21:04:43.721596'),(85,'BASTIÁN IGNACIO FARIÑA LARA','b.farinal@udd.cl','21756083','2025-12-01 21:04:43.746321','2025-12-01 21:04:43.746321'),(86,'MARTÍN ISAIAS GUERRERO ANCAPICHÚN','m.guerreroa@udd.cl','21605843','2025-12-01 21:04:43.818976','2025-12-01 21:04:43.818976'),(87,'MARTÍN ALEJANDRO OLIVARES ROJAS','m.olivaresr@udd.cl','21644638','2025-12-01 21:04:43.845864','2025-12-01 21:04:43.845864'),(88,'SANTIAGO ANDRÉS PAGE MUNITA','spagem@udd.cl','21612007','2025-12-01 21:04:43.922081','2025-12-01 21:04:43.922081'),(89,'SEBASTIÁN RAMORINO CARRILLO','sramorinoc@udd.cl','21782154','2025-12-01 21:04:43.948026','2025-12-01 21:04:43.948026'),(90,'AGUSTÍN EDUARDO REYES PEREIRA','a.reyesp@udd.cl','21150243','2025-12-01 21:04:43.995939','2025-12-01 21:04:43.995939'),(91,'LUCAS JEREMÍAS RIQUELME TORRES','l.riquelmet@udd.cl','21303074','2025-12-01 21:04:44.095876','2025-12-01 21:04:44.095876'),(92,'DANIEL ANDRÉS ROMERO BELTRÁN','d.romerob@udd.cl','21439688','2025-12-01 21:04:44.158549','2025-12-01 21:04:44.158549'),(93,'SEBASTIAN FERNANDO RUIZ RIFFO','s.ruizr@udd.cl','21675942','2025-12-01 21:04:44.195873','2025-12-01 21:04:44.195873'),(94,'JOSE IGNACIO SAAVEDRA HANS','jsaavedrah@udd.cl','21551254','2025-12-01 21:04:44.248106','2025-12-01 21:04:44.248106'),(95,'ÁLVARO FRANCISCO TORRES FERNÁNDEZ','a.torresf@udd.cl','21740840','2025-12-01 21:04:44.294925','2025-12-01 21:04:44.294925'),(96,'RENATO IGNACIO VARELA ROJAS','r.varelar@udd.cl','21765535','2025-12-01 21:04:44.345815','2025-12-01 21:04:44.345815'),(97,'MATÍAS ALEJANDRO VERGARA FLORES','matvergaraf@udd.cl','20914842','2025-12-01 21:04:44.422133','2025-12-01 21:04:44.422133'),(98,'Paz Vásquez Vera','paz.vásquez0@mail.udd.cl','20000000-8','2025-12-02 15:59:38.445061','2025-12-02 15:59:38.445061'),(99,'Trinidad Cortés Muñoz','trinidad.cortés1@mail.udd.cl','20000001-5','2025-12-02 15:59:38.460381','2025-12-02 15:59:38.460381'),(100,'Lucas Contreras Vargas','lucas.contreras2@mail.udd.cl','20000002-6','2025-12-02 15:59:38.469721','2025-12-02 15:59:38.469721'),(101,'Trinidad López Herrera','trinidad.lópez3@mail.udd.cl','20000003-9','2025-12-02 15:59:38.479743','2025-12-02 15:59:38.479743'),(102,'Nicolás Vidal Ruiz','nicolás.vidal4@mail.udd.cl','20000004-8','2025-12-02 15:59:38.486741','2025-12-02 15:59:38.486741'),(103,'Camila Vásquez Contreras','camila.vásquez5@mail.udd.cl','20000005-7','2025-12-02 15:59:38.497093','2025-12-02 15:59:38.497093'),(104,'Magdalena Herrera Vera','magdalena.herrera6@mail.udd.cl','20000006-4','2025-12-02 15:59:38.497093','2025-12-02 15:59:38.497093'),(105,'Felipe Sepúlveda Torres','felipe.sepúlveda7@mail.udd.cl','20000007-8','2025-12-02 15:59:38.517177','2025-12-02 15:59:38.517177'),(106,'Carlos Fernández Silva','carlos.fernández8@mail.udd.cl','20000008-4','2025-12-02 15:59:38.523230','2025-12-02 15:59:38.523230'),(107,'Dominga Pizarro Pérez','dominga.pizarro9@mail.udd.cl','20000009-7','2025-12-02 15:59:38.531865','2025-12-02 15:59:38.531865'),(108,'Francisco Martínez Fernández','francisco.martínez10@mail.udd.cl','20000010-6','2025-12-02 15:59:38.531865','2025-12-02 15:59:38.531865'),(109,'Sebastián Hernández Pérez','sebastián.hernández11@mail.udd.cl','20000011-7','2025-12-02 15:59:38.547939','2025-12-02 15:59:38.547939'),(110,'Diego Muñoz Muñoz','diego.muñoz12@mail.udd.cl','20000012-4','2025-12-02 15:59:38.555944','2025-12-02 15:59:38.555944'),(111,'Fernando Gutiérrez Vega','fernando.gutiérrez13@mail.udd.cl','20000013-9','2025-12-02 15:59:38.564822','2025-12-02 15:59:38.564822'),(112,'Francisca Reyes Martínez','francisca.reyes14@mail.udd.cl','20000014-9','2025-12-02 15:59:38.565710','2025-12-02 15:59:38.565710'),(113,'Matías Herrera Ortiz','matías.herrera15@mail.udd.cl','20000015-4','2025-12-02 15:59:38.565710','2025-12-02 15:59:38.565710'),(114,'Ricardo Herrera Romero','ricardo.herrera16@mail.udd.cl','20000016-9','2025-12-02 15:59:38.581190','2025-12-02 15:59:38.581190'),(115,'Ignacio Espinoza Herrera','ignacio.espinoza17@mail.udd.cl','20000017-6','2025-12-02 15:59:38.581190','2025-12-02 15:59:38.581190'),(116,'Sebastián Díaz Fernández','sebastián.díaz18@mail.udd.cl','20000018-2','2025-12-02 15:59:38.602199','2025-12-02 15:59:38.603196'),(117,'Rafaela Mendoza Contreras','rafaela.mendoza19@mail.udd.cl','20000019-7','2025-12-02 15:59:38.615202','2025-12-02 15:59:38.615202'),(118,'Tomás Tapia Pérez','tomás.tapia20@mail.udd.cl','20000020-3','2025-12-02 15:59:38.634200','2025-12-02 15:59:38.634200'),(119,'Constanza Guerrero Sánchez','constanza.guerrero21@mail.udd.cl','20000021-6','2025-12-02 15:59:38.647196','2025-12-02 15:59:38.647196'),(120,'Emilia Moreno Díaz','emilia.moreno22@mail.udd.cl','20000022-1','2025-12-02 15:59:38.657196','2025-12-02 15:59:38.657196'),(121,'Ana Fuentes Herrera','ana.fuentes23@mail.udd.cl','20000023-9','2025-12-02 15:59:38.664195','2025-12-02 15:59:38.664195'),(122,'Martina Soto Medina','martina.soto24@mail.udd.cl','20000024-1','2025-12-02 15:59:38.672195','2025-12-02 15:59:38.672195'),(123,'Martina Ramos Muñoz','martina.ramos25@mail.udd.cl','20000025-1','2025-12-02 15:59:38.683423','2025-12-02 15:59:38.683423'),(124,'Paz Ramírez Chávez','paz.ramírez26@mail.udd.cl','20000026-8','2025-12-02 15:59:38.700342','2025-12-02 15:59:38.700342'),(125,'Cristóbal Pérez Navarro','cristóbal.pérez27@mail.udd.cl','20000027-4','2025-12-02 15:59:38.707341','2025-12-02 15:59:38.707341'),(126,'Tomás Muñoz Pizarro','tomás.muñoz28@mail.udd.cl','20000028-7','2025-12-02 15:59:38.718059','2025-12-02 15:59:38.718059'),(127,'Cristóbal Gutiérrez Fuentes','cristóbal.gutiérrez29@mail.udd.cl','20000029-2','2025-12-02 15:59:38.723060','2025-12-02 15:59:38.724057'),(128,'Trinidad Contreras Castro','trinidad.contreras30@mail.udd.cl','20000030-1','2025-12-02 15:59:38.731759','2025-12-02 15:59:38.731759'),(129,'Isabella González Martínez','isabella.gonzález31@mail.udd.cl','20000031-6','2025-12-02 15:59:38.739757','2025-12-02 15:59:38.739757'),(130,'Valentina Díaz Gutiérrez','valentina.díaz32@mail.udd.cl','20000032-1','2025-12-02 15:59:38.753254','2025-12-02 15:59:38.753254'),(131,'Francisca Araya Morales','francisca.araya33@mail.udd.cl','20000033-6','2025-12-02 15:59:38.766066','2025-12-02 15:59:38.766066'),(132,'Antonia Fernández Pérez','antonia.fernández34@mail.udd.cl','20000034-3','2025-12-02 15:59:38.772066','2025-12-02 15:59:38.772066'),(133,'Rosario Silva Araya','rosario.silva35@mail.udd.cl','20000035-3','2025-12-02 15:59:38.780695','2025-12-02 15:59:38.780695'),(134,'Vicente Contreras Fernández','vicente.contreras36@mail.udd.cl','20000036-6','2025-12-02 15:59:38.786686','2025-12-02 15:59:38.786686'),(135,'Diego Herrera Morales','diego.herrera37@mail.udd.cl','20000037-1','2025-12-02 15:59:38.790685','2025-12-02 15:59:38.790685'),(136,'Agustina López Pérez','agustina.lópez38@mail.udd.cl','20000038-8','2025-12-02 15:59:38.801334','2025-12-02 15:59:38.801334'),(137,'Antonia Gutiérrez Vera','antonia.gutiérrez39@mail.udd.cl','20000039-3','2025-12-02 15:59:38.811586','2025-12-02 15:59:38.811586'),(138,'Antonia Peña Muñoz','antonia.peña40@mail.udd.cl','20000040-4','2025-12-02 15:59:38.820181','2025-12-02 15:59:38.820181'),(139,'Emilia Soto Vera','emilia.soto41@mail.udd.cl','20000041-3','2025-12-02 15:59:38.830666','2025-12-02 15:59:38.830666'),(140,'Matías Reyes Soto','matías.reyes42@mail.udd.cl','20000042-5','2025-12-02 15:59:38.837664','2025-12-02 15:59:38.837664'),(141,'Ignacio Sánchez Castro','ignacio.sánchez43@mail.udd.cl','20000043-1','2025-12-02 15:59:38.841664','2025-12-02 15:59:38.841664'),(142,'Ricardo Torres Ramírez','ricardo.torres44@mail.udd.cl','20000044-1','2025-12-02 15:59:38.850665','2025-12-02 15:59:38.850665'),(143,'Laura Hernández Ruiz','laura.hernández45@mail.udd.cl','20000045-5','2025-12-02 15:59:38.861670','2025-12-02 15:59:38.861670');
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tablet_connections`
--

DROP TABLE IF EXISTS `tablet_connections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tablet_connections` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `connected_at` datetime(6) NOT NULL,
  `disconnected_at` datetime(6) DEFAULT NULL,
  `last_seen` datetime(6) NOT NULL,
  `game_session_id` bigint NOT NULL,
  `tablet_id` bigint NOT NULL,
  `team_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `tablet_conn_tablet__aebeaa_idx` (`tablet_id`),
  KEY `tablet_conn_team_id_842e97_idx` (`team_id`),
  KEY `tablet_conn_game_se_380fa9_idx` (`game_session_id`),
  KEY `tablet_conn_last_se_be9684_idx` (`last_seen`),
  CONSTRAINT `tablet_connections_game_session_id_91f1926c_fk_game_sessions_id` FOREIGN KEY (`game_session_id`) REFERENCES `game_sessions` (`id`),
  CONSTRAINT `tablet_connections_tablet_id_7ddc0d0f_fk_tablets_id` FOREIGN KEY (`tablet_id`) REFERENCES `tablets` (`id`),
  CONSTRAINT `tablet_connections_team_id_dffc7a3d_fk_teams_id` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=667 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tablet_connections`
--

LOCK TABLES `tablet_connections` WRITE;
/*!40000 ALTER TABLE `tablet_connections` DISABLE KEYS */;
INSERT INTO `tablet_connections` VALUES (640,'2025-12-01 21:05:15.501285','2025-12-01 21:34:41.823692','2025-12-01 21:34:41.823692',236,1,707),(641,'2025-12-01 21:05:19.046382','2025-12-01 21:34:41.823692','2025-12-01 21:34:41.831741',236,2,708),(642,'2025-12-01 21:05:22.131245','2025-12-01 21:34:41.823692','2025-12-01 21:34:41.833249',236,3,706),(643,'2025-12-01 21:34:59.990281','2025-12-02 00:07:52.547752','2025-12-02 00:07:52.548751',237,1,710),(644,'2025-12-01 21:35:02.870143','2025-12-02 00:07:52.547752','2025-12-02 00:07:52.610309',237,3,711),(645,'2025-12-01 21:35:07.550489','2025-12-02 00:07:52.547752','2025-12-02 00:07:52.618699',237,2,709),(646,'2025-12-02 00:08:56.638150','2025-12-02 15:59:23.414689','2025-12-02 15:59:23.414689',238,1,713),(647,'2025-12-02 00:21:22.594805','2025-12-02 15:59:23.414689','2025-12-02 15:59:23.485571',238,2,714),(648,'2025-12-02 00:21:27.469825','2025-12-02 15:59:23.414689','2025-12-02 15:59:23.488566',238,3,712),(649,'2025-12-02 16:00:04.768094','2025-12-02 19:07:43.912457','2025-12-02 19:07:43.912457',240,1,719),(650,'2025-12-02 16:00:08.139254','2025-12-02 19:07:43.912457','2025-12-02 19:07:44.025125',240,2,720),(651,'2025-12-02 16:00:18.597236','2025-12-02 19:07:43.912457','2025-12-02 19:07:44.048767',240,3,718),(652,'2025-12-02 19:08:06.213683',NULL,'2025-12-02 19:08:06.213683',239,1,716),(653,'2025-12-02 19:08:11.492293',NULL,'2025-12-02 19:08:11.492293',239,2,717),(654,'2025-12-02 19:08:16.174478',NULL,'2025-12-02 19:08:16.174478',239,3,715),(655,'2025-12-03 05:58:29.617911','2025-12-03 06:43:42.107453','2025-12-03 06:43:42.108454',241,1,722),(656,'2025-12-03 05:58:33.681467','2025-12-03 06:43:42.107453','2025-12-03 06:43:42.118044',241,2,723),(657,'2025-12-03 05:58:36.638085','2025-12-03 06:43:42.107453','2025-12-03 06:43:42.122628',241,3,721),(658,'2025-12-03 06:44:04.403721',NULL,'2025-12-03 06:44:04.403721',242,1,725),(659,'2025-12-03 06:44:07.293350',NULL,'2025-12-03 06:44:07.293350',242,2,726),(660,'2025-12-03 06:44:10.620424',NULL,'2025-12-03 06:44:10.620424',242,3,724),(661,'2025-12-03 14:31:50.746445','2025-12-03 17:40:20.938797','2025-12-03 17:40:20.946501',243,1,728),(662,'2025-12-03 14:31:57.859113','2025-12-03 17:40:20.938797','2025-12-03 17:40:22.721606',243,2,729),(663,'2025-12-03 14:32:03.219991','2025-12-03 17:40:20.938797','2025-12-03 17:40:23.455972',243,3,727),(664,'2025-12-03 17:41:44.317962','2025-12-03 17:55:50.635360','2025-12-03 17:55:50.639776',244,1,731),(665,'2025-12-03 17:41:47.449049','2025-12-03 17:55:50.635360','2025-12-03 17:55:50.645941',244,2,732),(666,'2025-12-03 17:41:50.448753','2025-12-03 17:55:50.635360','2025-12-03 17:55:50.649962',244,3,730);
/*!40000 ALTER TABLE `tablet_connections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tablets`
--

DROP TABLE IF EXISTS `tablets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tablets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tablet_code` varchar(50) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tablet_code` (`tablet_code`),
  KEY `tablets_tablet__9cb635_idx` (`tablet_code`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tablets`
--

LOCK TABLES `tablets` WRITE;
/*!40000 ALTER TABLE `tablets` DISABLE KEYS */;
INSERT INTO `tablets` VALUES (1,'TAB1',1,'2025-11-04 01:45:10.245000','2025-11-04 01:45:36.080000'),(2,'TAB2',1,'2025-11-04 01:45:36.094000','2025-11-04 01:45:36.094000'),(3,'TAB3',1,'2025-11-04 01:45:36.102000','2025-11-04 01:45:36.102000'),(4,'TAB4',1,'2025-11-04 01:45:36.109000','2025-11-04 01:45:36.109000'),(5,'TAB5',1,'2025-11-04 01:45:36.117000','2025-11-04 01:45:36.117000'),(6,'TAB6',1,'2025-11-04 01:45:36.124000','2025-11-04 01:45:36.124000'),(7,'TAB7',1,'2025-11-04 01:45:36.132000','2025-11-04 01:45:36.132000'),(8,'TAB8',1,'2025-11-04 01:45:36.138000','2025-11-04 01:45:36.138000');
/*!40000 ALTER TABLE `tablets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_activity_progress`
--

DROP TABLE IF EXISTS `team_activity_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_activity_progress` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `status` varchar(20) NOT NULL,
  `started_at` datetime(6) DEFAULT NULL,
  `completed_at` datetime(6) DEFAULT NULL,
  `progress_percentage` int NOT NULL,
  `response_data` json DEFAULT NULL,
  `prototype_image_url` varchar(500) DEFAULT NULL,
  `pitch_intro_problem` longtext,
  `pitch_solution` longtext,
  `pitch_closing` longtext,
  `activity_id` bigint NOT NULL,
  `selected_challenge_id` bigint DEFAULT NULL,
  `selected_topic_id` bigint DEFAULT NULL,
  `session_stage_id` bigint NOT NULL,
  `team_id` bigint NOT NULL,
  `pitch_value` longtext,
  `pitch_impact` longtext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `team_activity_progress_team_id_activity_id_sess_b25a7a5c_uniq` (`team_id`,`activity_id`,`session_stage_id`),
  KEY `team_activi_team_id_2c8afb_idx` (`team_id`),
  KEY `team_activi_session_0d2b15_idx` (`session_stage_id`),
  KEY `team_activi_activit_e95388_idx` (`activity_id`),
  KEY `team_activi_status_00750a_idx` (`status`),
  KEY `team_activi_team_id_d1bada_idx` (`team_id`,`activity_id`),
  KEY `team_activi_session_1a4ca1_idx` (`session_stage_id`,`activity_id`),
  KEY `team_activity_progre_selected_challenge_i_b972b61d_fk_challenge` (`selected_challenge_id`),
  KEY `team_activity_progress_selected_topic_id_6bb5e15b_fk_topics_id` (`selected_topic_id`),
  CONSTRAINT `team_activity_progre_selected_challenge_i_b972b61d_fk_challenge` FOREIGN KEY (`selected_challenge_id`) REFERENCES `challenges` (`id`),
  CONSTRAINT `team_activity_progre_session_stage_id_b07378b9_fk_session_s` FOREIGN KEY (`session_stage_id`) REFERENCES `session_stages` (`id`),
  CONSTRAINT `team_activity_progress_activity_id_8a7df130_fk_activities_id` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`),
  CONSTRAINT `team_activity_progress_selected_topic_id_6bb5e15b_fk_topics_id` FOREIGN KEY (`selected_topic_id`) REFERENCES `topics` (`id`),
  CONSTRAINT `team_activity_progress_team_id_692cd6e6_fk_teams_id` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2685 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_activity_progress`
--

LOCK TABLES `team_activity_progress` WRITE;
/*!40000 ALTER TABLE `team_activity_progress` DISABLE KEYS */;
INSERT INTO `team_activity_progress` VALUES (2604,'pending','2025-12-01 21:46:01.954849',NULL,0,NULL,NULL,NULL,NULL,NULL,15,NULL,NULL,464,710,NULL,NULL),(2605,'pending','2025-12-01 21:46:01.954849',NULL,0,NULL,NULL,NULL,NULL,NULL,15,NULL,NULL,464,711,NULL,NULL),(2606,'pending','2025-12-01 21:46:01.954849',NULL,0,NULL,NULL,NULL,NULL,NULL,15,NULL,NULL,464,709,NULL,NULL),(2607,'pending','2025-12-01 22:11:57.057365',NULL,0,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,464,710,NULL,NULL),(2608,'pending','2025-12-01 22:11:57.057365',NULL,0,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,464,711,NULL,NULL),(2609,'pending','2025-12-01 22:11:57.057365',NULL,0,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,464,709,NULL,NULL),(2610,'pending','2025-12-02 01:22:44.400950',NULL,0,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,465,713,NULL,NULL),(2611,'pending','2025-12-02 01:22:44.400950',NULL,0,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,465,714,NULL,NULL),(2612,'pending','2025-12-02 01:22:44.400950',NULL,0,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,465,712,NULL,NULL),(2613,'completed','2025-12-02 16:00:52.959375','2025-12-02 17:00:46.328958',100,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,466,719,NULL,NULL),(2614,'completed','2025-12-02 16:00:52.959375','2025-12-02 17:00:46.427991',100,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,466,720,NULL,NULL),(2615,'completed','2025-12-02 16:00:52.959375','2025-12-02 17:00:46.453263',100,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,466,718,NULL,NULL),(2616,'completed','2025-12-02 17:00:46.530195','2025-12-02 17:47:21.412903',100,'{\"answers\": [{\"word\": \"PLANIFICACION\", \"answer\": \"PLANIFICACION\"}, {\"word\": \"OPORTUNIDAD\", \"answer\": \"OPORTUNIDAD\"}], \"found_words\": [\"LIDER\", \"EQUIPO\", \"META\", \"PITCH\", \"IDEA\"], \"total_words\": 5, \"anagram_words\": [{\"word\": \"PLANIFICACION\", \"anagram\": \"FNNPOICCAILAI\"}, {\"word\": \"OPORTUNIDAD\", \"anagram\": \"DRNOIPOTUDA\"}, {\"word\": \"DIRECCION\", \"anagram\": \"CRDCEOINI\"}, {\"word\": \"DESAFIO\", \"anagram\": \"DSEIOAF\"}, {\"word\": \"ORGANIZACION\", \"anagram\": \"ONCIANZAORGI\"}], \"minigame_part\": \"anagram\", \"minigame_type\": \"anagrama\", \"tokens_earned\": 7, \"correct_answers\": 2, \"general_knowledge\": {\"questions\": [16, 13, 20, 15, 14], \"questions_data\": [{\"id\": 16, \"options\": [{\"text\": \"196\", \"label\": \"A\"}, {\"text\": \"206\", \"label\": \"B\"}, {\"text\": \"216\", \"label\": \"C\"}, {\"text\": \"226\", \"label\": \"D\"}], \"option_a\": \"196\", \"option_b\": \"206\", \"option_c\": \"216\", \"option_d\": \"226\", \"question\": \"¿Cuántos huesos tiene el cuerpo humano adulto?\", \"correct_answer\": 1}, {\"id\": 13, \"options\": [{\"text\": \"China\", \"label\": \"A\"}, {\"text\": \"Estados Unidos\", \"label\": \"B\"}, {\"text\": \"Rusia\", \"label\": \"C\"}, {\"text\": \"Canadá\", \"label\": \"D\"}], \"option_a\": \"China\", \"option_b\": \"Estados Unidos\", \"option_c\": \"Rusia\", \"option_d\": \"Canadá\", \"question\": \"¿Cuál es el país más grande del mundo?\", \"correct_answer\": 2}, {\"id\": 20, \"options\": [{\"text\": \"Proceso de respiración de las plantas\", \"label\": \"A\"}, {\"text\": \"Proceso por el cual las plantas producen su alimento\", \"label\": \"B\"}, {\"text\": \"Proceso de reproducción de las plantas\", \"label\": \"C\"}, {\"text\": \"Proceso de crecimiento de las plantas\", \"label\": \"D\"}], \"option_a\": \"Proceso de respiración de las plantas\", \"option_b\": \"Proceso por el cual las plantas producen su alimento\", \"option_c\": \"Proceso de reproducción de las plantas\", \"option_d\": \"Proceso de crecimiento de las plantas\", \"question\": \"¿Qué es la fotosíntesis?\", \"correct_answer\": 1}, {\"id\": 15, \"options\": [{\"text\": \"Guepardo\", \"label\": \"A\"}, {\"text\": \"León\", \"label\": \"B\"}, {\"text\": \"Águila\", \"label\": \"C\"}, {\"text\": \"Pez vela\", \"label\": \"D\"}], \"option_a\": \"Guepardo\", \"option_b\": \"León\", \"option_c\": \"Águila\", \"option_d\": \"Pez vela\", \"question\": \"¿Cuál es el animal más rápido del mundo?\", \"correct_answer\": 0}, {\"id\": 14, \"options\": [{\"text\": \"Violín\", \"label\": \"A\"}, {\"text\": \"Piano\", \"label\": \"B\"}, {\"text\": \"Flauta\", \"label\": \"C\"}, {\"text\": \"Todos los anteriores\", \"label\": \"D\"}], \"option_a\": \"Violín\", \"option_b\": \"Piano\", \"option_c\": \"Flauta\", \"option_d\": \"Todos los anteriores\", \"question\": \"¿Qué instrumento tocaba Mozart?\", \"correct_answer\": 3}]}, \"anagram_total_words\": 5, \"anagram_words_found\": 2, \"anagram_current_index\": 2, \"word_search_total_words\": 5, \"word_search_words_found\": 5}',NULL,NULL,NULL,NULL,2,NULL,NULL,466,719,NULL,NULL),(2617,'completed','2025-12-02 17:00:46.530195','2025-12-02 18:31:27.160957',100,'{\"answers\": [], \"found_words\": [\"MERCADO\", \"PRODUCTO\", \"VENTA\", \"NEGOCIO\", \"CLIENTE\"], \"total_words\": 5, \"anagram_words\": [{\"word\": \"MOTIVACION\", \"anagram\": \"TIIOOCMNAV\"}, {\"word\": \"APRENDIZAJE\", \"anagram\": \"RZANPEEJIDA\"}, {\"word\": \"MISION\", \"anagram\": \"IISOMN\"}, {\"word\": \"COORDINACION\", \"anagram\": \"OODOINCIARNC\"}, {\"word\": \"META\", \"anagram\": \"ETAM\"}], \"correct_words\": [\"MERCADO\", \"PRODUCTO\", \"VENTA\", \"NEGOCIO\", \"CLIENTE\"], \"minigame_part\": \"word_search\", \"minigame_type\": \"word_search\", \"tokens_earned\": 5, \"correct_answers\": 5, \"general_knowledge\": {\"questions\": [3, 1, 17, 8, 2], \"questions_data\": [{\"id\": 3, \"options\": [{\"text\": \"Atlántico\", \"label\": \"A\"}, {\"text\": \"Índico\", \"label\": \"B\"}, {\"text\": \"Pacífico\", \"label\": \"C\"}, {\"text\": \"Ártico\", \"label\": \"D\"}], \"option_a\": \"Atlántico\", \"option_b\": \"Índico\", \"option_c\": \"Pacífico\", \"option_d\": \"Ártico\", \"question\": \"¿Cuál es el océano más grande del mundo?\", \"correct_answer\": 2}, {\"id\": 1, \"options\": [{\"text\": \"Londres\", \"label\": \"A\"}, {\"text\": \"París\", \"label\": \"B\"}, {\"text\": \"Madrid\", \"label\": \"C\"}, {\"text\": \"Roma\", \"label\": \"D\"}], \"option_a\": \"Londres\", \"option_b\": \"París\", \"option_c\": \"Madrid\", \"option_d\": \"Roma\", \"question\": \"¿Cuál es la capital de Francia?\", \"correct_answer\": 1}, {\"id\": 17, \"options\": [{\"text\": \"300,000 km/s\", \"label\": \"A\"}, {\"text\": \"150,000 km/s\", \"label\": \"B\"}, {\"text\": \"450,000 km/s\", \"label\": \"C\"}, {\"text\": \"600,000 km/s\", \"label\": \"D\"}], \"option_a\": \"300,000 km/s\", \"option_b\": \"150,000 km/s\", \"option_c\": \"450,000 km/s\", \"option_d\": \"600,000 km/s\", \"question\": \"¿Cuál es la velocidad de la luz?\", \"correct_answer\": 0}, {\"id\": 8, \"options\": [{\"text\": \"Asia\", \"label\": \"A\"}, {\"text\": \"Europa\", \"label\": \"B\"}, {\"text\": \"África\", \"label\": \"C\"}, {\"text\": \"América\", \"label\": \"D\"}], \"option_a\": \"Asia\", \"option_b\": \"Europa\", \"option_c\": \"África\", \"option_d\": \"América\", \"question\": \"¿En qué continente está Egipto?\", \"correct_answer\": 2}, {\"id\": 2, \"options\": [{\"text\": \"1965\", \"label\": \"A\"}, {\"text\": \"1969\", \"label\": \"B\"}, {\"text\": \"1972\", \"label\": \"C\"}, {\"text\": \"1975\", \"label\": \"D\"}], \"option_a\": \"1965\", \"option_b\": \"1969\", \"option_c\": \"1972\", \"option_d\": \"1975\", \"question\": \"¿En qué año llegó el hombre a la Luna?\", \"correct_answer\": 1}]}, \"anagram_total_words\": 5, \"anagram_words_found\": 0, \"word_search_total_words\": 5, \"word_search_words_found\": 5}',NULL,NULL,NULL,NULL,2,NULL,NULL,466,720,NULL,NULL),(2618,'completed','2025-12-02 17:00:46.530195','2025-12-02 18:44:42.833603',100,'{\"type\": \"presentation\", \"chaos\": {\"completed\": true, \"questions_answered\": 5, \"shown_question_ids\": [31, 28, 8, 6, 1], \"current_question_id\": 1, \"current_question_text\": \"¿Cuál es tu mayor miedo al emprender?\"}, \"part1_completed\": true, \"general_knowledge\": {\"answers\": [{\"correct\": true, \"selected\": 2, \"question_id\": 9}, {\"correct\": false, \"selected\": 1, \"question_id\": 7}, {\"correct\": true, \"selected\": 2, \"question_id\": 3}, {\"correct\": false, \"selected\": 3, \"question_id\": 20}, {\"correct\": true, \"selected\": 2, \"question_id\": 5}], \"completed\": true, \"questions\": [7, 3, 20, 5, 9], \"correct_count\": 3, \"questions_data\": [{\"id\": 7, \"options\": [{\"text\": \"Amazonas\", \"label\": \"A\"}, {\"text\": \"Nilo\", \"label\": \"B\"}, {\"text\": \"Misisipi\", \"label\": \"C\"}, {\"text\": \"Yangtsé\", \"label\": \"D\"}], \"option_a\": \"Amazonas\", \"option_b\": \"Nilo\", \"option_c\": \"Misisipi\", \"option_d\": \"Yangtsé\", \"question\": \"¿Cuál es el río más largo del mundo?\", \"correct_answer\": 0}, {\"id\": 3, \"options\": [{\"text\": \"Atlántico\", \"label\": \"A\"}, {\"text\": \"Índico\", \"label\": \"B\"}, {\"text\": \"Pacífico\", \"label\": \"C\"}, {\"text\": \"Ártico\", \"label\": \"D\"}], \"option_a\": \"Atlántico\", \"option_b\": \"Índico\", \"option_c\": \"Pacífico\", \"option_d\": \"Ártico\", \"question\": \"¿Cuál es el océano más grande del mundo?\", \"correct_answer\": 2}, {\"id\": 20, \"options\": [{\"text\": \"Proceso de respiración de las plantas\", \"label\": \"A\"}, {\"text\": \"Proceso por el cual las plantas producen su alimento\", \"label\": \"B\"}, {\"text\": \"Proceso de reproducción de las plantas\", \"label\": \"C\"}, {\"text\": \"Proceso de crecimiento de las plantas\", \"label\": \"D\"}], \"option_a\": \"Proceso de respiración de las plantas\", \"option_b\": \"Proceso por el cual las plantas producen su alimento\", \"option_c\": \"Proceso de reproducción de las plantas\", \"option_d\": \"Proceso de crecimiento de las plantas\", \"question\": \"¿Qué es la fotosíntesis?\", \"correct_answer\": 1}, {\"id\": 5, \"options\": [{\"text\": \"Venus\", \"label\": \"A\"}, {\"text\": \"Tierra\", \"label\": \"B\"}, {\"text\": \"Mercurio\", \"label\": \"C\"}, {\"text\": \"Marte\", \"label\": \"D\"}], \"option_a\": \"Venus\", \"option_b\": \"Tierra\", \"option_c\": \"Mercurio\", \"option_d\": \"Marte\", \"question\": \"¿Cuál es el planeta más cercano al Sol?\", \"correct_answer\": 2}, {\"id\": 9, \"options\": [{\"text\": \"K2\", \"label\": \"A\"}, {\"text\": \"Kilimanjaro\", \"label\": \"B\"}, {\"text\": \"Everest\", \"label\": \"C\"}, {\"text\": \"Aconcagua\", \"label\": \"D\"}], \"option_a\": \"K2\", \"option_b\": \"Kilimanjaro\", \"option_c\": \"Everest\", \"option_d\": \"Aconcagua\", \"question\": \"¿Cuál es la montaña más alta del mundo?\", \"correct_answer\": 2}], \"total_questions\": 5}}',NULL,NULL,NULL,NULL,2,NULL,NULL,466,718,NULL,NULL),(2619,'completed','2025-12-03 00:17:48.796749','2025-12-03 00:25:13.627495',100,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,467,716,NULL,NULL),(2620,'completed','2025-12-03 00:17:48.796749','2025-12-03 00:25:13.688081',100,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,467,717,NULL,NULL),(2621,'completed','2025-12-03 00:17:48.796749','2025-12-03 00:25:13.700483',100,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,467,715,NULL,NULL),(2622,'completed','2025-12-03 00:25:13.716996','2025-12-03 00:26:23.739053',100,'{\"answers\": [], \"found_words\": [\"NEGOCIO\", \"MERCADO\", \"VENTA\", \"CLIENTE\", \"PRODUCTO\"], \"total_words\": 5, \"correct_words\": [\"NEGOCIO\", \"MERCADO\", \"VENTA\", \"CLIENTE\", \"PRODUCTO\"], \"minigame_part\": \"word_search\", \"minigame_type\": \"word_search\", \"tokens_earned\": 5, \"correct_answers\": 5, \"anagram_total_words\": 5, \"anagram_words_found\": 0, \"word_search_total_words\": 5, \"word_search_words_found\": 5}',NULL,NULL,NULL,NULL,2,NULL,NULL,467,716,NULL,NULL),(2623,'completed','2025-12-03 00:25:13.716996','2025-12-03 00:30:01.235050',100,'{\"type\": \"presentation\", \"chaos\": {\"completed\": true, \"questions_answered\": 5, \"shown_question_ids\": [29, 28, 25, 11, 13], \"current_question_id\": 13, \"current_question_text\": \"¿Cuál es tu sueño más grande?\"}, \"part1_completed\": true, \"general_knowledge\": {\"answers\": [{\"correct\": true, \"selected\": 2, \"question_id\": 9}, {\"correct\": false, \"selected\": 1, \"question_id\": 7}, {\"correct\": true, \"selected\": 2, \"question_id\": 3}, {\"correct\": true, \"selected\": 1, \"question_id\": 20}, {\"correct\": true, \"selected\": 2, \"question_id\": 5}], \"completed\": true, \"questions\": [7, 3, 20, 5, 9], \"correct_count\": 4, \"questions_data\": [{\"id\": 7, \"options\": [{\"text\": \"Amazonas\", \"label\": \"A\"}, {\"text\": \"Nilo\", \"label\": \"B\"}, {\"text\": \"Misisipi\", \"label\": \"C\"}, {\"text\": \"Yangtsé\", \"label\": \"D\"}], \"option_a\": \"Amazonas\", \"option_b\": \"Nilo\", \"option_c\": \"Misisipi\", \"option_d\": \"Yangtsé\", \"question\": \"¿Cuál es el río más largo del mundo?\", \"correct_answer\": 0}, {\"id\": 3, \"options\": [{\"text\": \"Atlántico\", \"label\": \"A\"}, {\"text\": \"Índico\", \"label\": \"B\"}, {\"text\": \"Pacífico\", \"label\": \"C\"}, {\"text\": \"Ártico\", \"label\": \"D\"}], \"option_a\": \"Atlántico\", \"option_b\": \"Índico\", \"option_c\": \"Pacífico\", \"option_d\": \"Ártico\", \"question\": \"¿Cuál es el océano más grande del mundo?\", \"correct_answer\": 2}, {\"id\": 20, \"options\": [{\"text\": \"Proceso de respiración de las plantas\", \"label\": \"A\"}, {\"text\": \"Proceso por el cual las plantas producen su alimento\", \"label\": \"B\"}, {\"text\": \"Proceso de reproducción de las plantas\", \"label\": \"C\"}, {\"text\": \"Proceso de crecimiento de las plantas\", \"label\": \"D\"}], \"option_a\": \"Proceso de respiración de las plantas\", \"option_b\": \"Proceso por el cual las plantas producen su alimento\", \"option_c\": \"Proceso de reproducción de las plantas\", \"option_d\": \"Proceso de crecimiento de las plantas\", \"question\": \"¿Qué es la fotosíntesis?\", \"correct_answer\": 1}, {\"id\": 5, \"options\": [{\"text\": \"Venus\", \"label\": \"A\"}, {\"text\": \"Tierra\", \"label\": \"B\"}, {\"text\": \"Mercurio\", \"label\": \"C\"}, {\"text\": \"Marte\", \"label\": \"D\"}], \"option_a\": \"Venus\", \"option_b\": \"Tierra\", \"option_c\": \"Mercurio\", \"option_d\": \"Marte\", \"question\": \"¿Cuál es el planeta más cercano al Sol?\", \"correct_answer\": 2}, {\"id\": 9, \"options\": [{\"text\": \"K2\", \"label\": \"A\"}, {\"text\": \"Kilimanjaro\", \"label\": \"B\"}, {\"text\": \"Everest\", \"label\": \"C\"}, {\"text\": \"Aconcagua\", \"label\": \"D\"}], \"option_a\": \"K2\", \"option_b\": \"Kilimanjaro\", \"option_c\": \"Everest\", \"option_d\": \"Aconcagua\", \"question\": \"¿Cuál es la montaña más alta del mundo?\", \"correct_answer\": 2}], \"total_questions\": 5}}',NULL,NULL,NULL,NULL,2,NULL,NULL,467,717,NULL,NULL),(2624,'completed','2025-12-03 00:25:13.716996','2025-12-03 00:30:30.733869',100,'{\"answers\": [{\"word\": \"LIDERAZGO\", \"answer\": \"LIDERAZGO\"}], \"found_words\": [\"EQUIPO\", \"LIDER\", \"PITCH\", \"IDEA\", \"META\"], \"total_words\": 5, \"anagram_words\": [\"LIDERAZGO\", \"ESTRATEGIA\", \"OPTIMIZACION\", \"CAMALEON\", \"OPORTUNIDAD\"], \"minigame_part\": \"anagram\", \"minigame_type\": \"anagrama\", \"tokens_earned\": 6, \"correct_answers\": 1, \"anagram_total_words\": 5, \"anagram_words_found\": 1, \"anagram_current_index\": 1, \"word_search_total_words\": 5, \"word_search_words_found\": 5}',NULL,NULL,NULL,NULL,2,NULL,NULL,467,715,NULL,NULL),(2625,'completed','2025-12-03 00:40:39.836254','2025-12-03 02:03:56.431898',100,NULL,NULL,NULL,NULL,NULL,3,2,1,468,716,NULL,NULL),(2626,'completed','2025-12-03 00:40:39.836254','2025-12-03 01:54:03.787440',100,NULL,NULL,NULL,NULL,NULL,3,7,3,468,717,NULL,NULL),(2627,'completed','2025-12-03 00:40:39.853066','2025-12-03 01:56:53.330759',100,NULL,NULL,NULL,NULL,NULL,3,3,1,468,715,NULL,NULL),(2628,'completed','2025-12-03 02:21:15.420580','2025-12-03 02:36:12.028241',100,NULL,NULL,NULL,NULL,NULL,5,NULL,NULL,468,716,NULL,NULL),(2629,'completed','2025-12-03 02:21:15.420580','2025-12-03 02:36:12.055638',100,NULL,NULL,NULL,NULL,NULL,5,NULL,NULL,468,717,NULL,NULL),(2630,'completed','2025-12-03 02:21:15.420580','2025-12-03 02:36:12.078799',100,NULL,NULL,NULL,NULL,NULL,5,NULL,NULL,468,715,NULL,NULL),(2631,'completed','2025-12-03 03:12:47.564841','2025-12-03 03:33:36.495524',100,NULL,NULL,NULL,NULL,NULL,6,NULL,NULL,469,716,NULL,NULL),(2632,'completed','2025-12-03 03:12:47.573394','2025-12-03 03:33:36.527762',100,NULL,NULL,NULL,NULL,NULL,6,NULL,NULL,469,717,NULL,NULL),(2633,'completed','2025-12-03 03:12:47.582116','2025-12-03 03:33:36.542418',100,NULL,NULL,NULL,NULL,NULL,6,NULL,NULL,469,715,NULL,NULL),(2634,'completed','2025-12-03 03:42:02.896112','2025-12-03 03:56:45.115605',100,NULL,NULL,'wefw','fwf','fwefwe',7,NULL,NULL,470,716,'fwef','fwefw'),(2635,'completed','2025-12-03 03:42:02.903072','2025-12-03 03:56:36.662161',100,NULL,NULL,'fwefw','wfwe','fwefwe',7,NULL,NULL,470,717,'wefwefwefe','fwefwewe'),(2636,'completed','2025-12-03 03:42:02.912076','2025-12-03 03:56:52.779228',100,NULL,NULL,'efwef','efwef','efwef',7,NULL,NULL,470,715,'wefwe','wfwef'),(2637,'completed','2025-12-03 03:57:00.113269','2025-12-03 05:48:44.808272',100,NULL,NULL,NULL,NULL,NULL,8,NULL,NULL,470,716,NULL,NULL),(2638,'completed','2025-12-03 03:57:00.113269','2025-12-03 05:50:24.822691',100,NULL,NULL,NULL,NULL,NULL,8,NULL,NULL,470,717,NULL,NULL),(2639,'completed','2025-12-03 03:57:00.113269','2025-12-03 05:49:32.009036',100,NULL,NULL,NULL,NULL,NULL,8,NULL,NULL,470,715,NULL,NULL),(2640,'completed','2025-12-03 05:59:01.925085','2025-12-03 06:02:17.952126',100,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,471,722,NULL,NULL),(2641,'completed','2025-12-03 05:59:01.925085','2025-12-03 06:02:17.969760',100,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,471,723,NULL,NULL),(2642,'completed','2025-12-03 05:59:01.925085','2025-12-03 06:02:17.989114',100,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,471,721,NULL,NULL),(2643,'pending','2025-12-03 06:02:18.013859',NULL,0,'{\"general_knowledge\": {\"questions\": [13, 12, 18, 15, 4], \"questions_data\": [{\"id\": 13, \"options\": [{\"text\": \"China\", \"label\": \"A\"}, {\"text\": \"Estados Unidos\", \"label\": \"B\"}, {\"text\": \"Rusia\", \"label\": \"C\"}, {\"text\": \"Canadá\", \"label\": \"D\"}], \"option_a\": \"China\", \"option_b\": \"Estados Unidos\", \"option_c\": \"Rusia\", \"option_d\": \"Canadá\", \"question\": \"¿Cuál es el país más grande del mundo?\", \"correct_answer\": 2}, {\"id\": 12, \"options\": [{\"text\": \"1937\", \"label\": \"A\"}, {\"text\": \"1939\", \"label\": \"B\"}, {\"text\": \"1941\", \"label\": \"C\"}, {\"text\": \"1943\", \"label\": \"D\"}], \"option_a\": \"1937\", \"option_b\": \"1939\", \"option_c\": \"1941\", \"option_d\": \"1943\", \"question\": \"¿En qué año comenzó la Segunda Guerra Mundial?\", \"correct_answer\": 1}, {\"id\": 18, \"options\": [{\"text\": \"Italia\", \"label\": \"A\"}, {\"text\": \"España\", \"label\": \"B\"}, {\"text\": \"Francia\", \"label\": \"C\"}, {\"text\": \"Alemania\", \"label\": \"D\"}], \"option_a\": \"Italia\", \"option_b\": \"España\", \"option_c\": \"Francia\", \"option_d\": \"Alemania\", \"question\": \"¿En qué país está la Torre Eiffel?\", \"correct_answer\": 2}, {\"id\": 15, \"options\": [{\"text\": \"Guepardo\", \"label\": \"A\"}, {\"text\": \"León\", \"label\": \"B\"}, {\"text\": \"Águila\", \"label\": \"C\"}, {\"text\": \"Pez vela\", \"label\": \"D\"}], \"option_a\": \"Guepardo\", \"option_b\": \"León\", \"option_c\": \"Águila\", \"option_d\": \"Pez vela\", \"question\": \"¿Cuál es el animal más rápido del mundo?\", \"correct_answer\": 0}, {\"id\": 4, \"options\": [{\"text\": \"Picasso\", \"label\": \"A\"}, {\"text\": \"Van Gogh\", \"label\": \"B\"}, {\"text\": \"Leonardo da Vinci\", \"label\": \"C\"}, {\"text\": \"Miguel Ángel\", \"label\": \"D\"}], \"option_a\": \"Picasso\", \"option_b\": \"Van Gogh\", \"option_c\": \"Leonardo da Vinci\", \"option_d\": \"Miguel Ángel\", \"question\": \"¿Quién pintó la Mona Lisa?\", \"correct_answer\": 2}]}}',NULL,NULL,NULL,NULL,2,NULL,NULL,471,722,NULL,NULL),(2644,'pending','2025-12-03 06:02:18.013859',NULL,0,'{\"general_knowledge\": {\"questions\": [4, 6, 13, 1, 12], \"questions_data\": [{\"id\": 4, \"options\": [{\"text\": \"Picasso\", \"label\": \"A\"}, {\"text\": \"Van Gogh\", \"label\": \"B\"}, {\"text\": \"Leonardo da Vinci\", \"label\": \"C\"}, {\"text\": \"Miguel Ángel\", \"label\": \"D\"}], \"option_a\": \"Picasso\", \"option_b\": \"Van Gogh\", \"option_c\": \"Leonardo da Vinci\", \"option_d\": \"Miguel Ángel\", \"question\": \"¿Quién pintó la Mona Lisa?\", \"correct_answer\": 2}, {\"id\": 6, \"options\": [{\"text\": \"5\", \"label\": \"A\"}, {\"text\": \"6\", \"label\": \"B\"}, {\"text\": \"7\", \"label\": \"C\"}, {\"text\": \"8\", \"label\": \"D\"}], \"option_a\": \"5\", \"option_b\": \"6\", \"option_c\": \"7\", \"option_d\": \"8\", \"question\": \"¿Cuántos continentes hay en el mundo?\", \"correct_answer\": 2}, {\"id\": 13, \"options\": [{\"text\": \"China\", \"label\": \"A\"}, {\"text\": \"Estados Unidos\", \"label\": \"B\"}, {\"text\": \"Rusia\", \"label\": \"C\"}, {\"text\": \"Canadá\", \"label\": \"D\"}], \"option_a\": \"China\", \"option_b\": \"Estados Unidos\", \"option_c\": \"Rusia\", \"option_d\": \"Canadá\", \"question\": \"¿Cuál es el país más grande del mundo?\", \"correct_answer\": 2}, {\"id\": 1, \"options\": [{\"text\": \"Londres\", \"label\": \"A\"}, {\"text\": \"París\", \"label\": \"B\"}, {\"text\": \"Madrid\", \"label\": \"C\"}, {\"text\": \"Roma\", \"label\": \"D\"}], \"option_a\": \"Londres\", \"option_b\": \"París\", \"option_c\": \"Madrid\", \"option_d\": \"Roma\", \"question\": \"¿Cuál es la capital de Francia?\", \"correct_answer\": 1}, {\"id\": 12, \"options\": [{\"text\": \"1937\", \"label\": \"A\"}, {\"text\": \"1939\", \"label\": \"B\"}, {\"text\": \"1941\", \"label\": \"C\"}, {\"text\": \"1943\", \"label\": \"D\"}], \"option_a\": \"1937\", \"option_b\": \"1939\", \"option_c\": \"1941\", \"option_d\": \"1943\", \"question\": \"¿En qué año comenzó la Segunda Guerra Mundial?\", \"correct_answer\": 1}]}}',NULL,NULL,NULL,NULL,2,NULL,NULL,471,723,NULL,NULL),(2645,'pending','2025-12-03 06:02:18.013859',NULL,0,'{\"general_knowledge\": {\"questions\": [12, 11, 14, 16, 18], \"questions_data\": [{\"id\": 12, \"options\": [{\"text\": \"1937\", \"label\": \"A\"}, {\"text\": \"1939\", \"label\": \"B\"}, {\"text\": \"1941\", \"label\": \"C\"}, {\"text\": \"1943\", \"label\": \"D\"}], \"option_a\": \"1937\", \"option_b\": \"1939\", \"option_c\": \"1941\", \"option_d\": \"1943\", \"question\": \"¿En qué año comenzó la Segunda Guerra Mundial?\", \"correct_answer\": 1}, {\"id\": 11, \"options\": [{\"text\": \"Oxígeno\", \"label\": \"A\"}, {\"text\": \"Hidrógeno\", \"label\": \"B\"}, {\"text\": \"Helio\", \"label\": \"C\"}, {\"text\": \"Carbono\", \"label\": \"D\"}], \"option_a\": \"Oxígeno\", \"option_b\": \"Hidrógeno\", \"option_c\": \"Helio\", \"option_d\": \"Carbono\", \"question\": \"¿Cuál es el elemento químico más abundante en el universo?\", \"correct_answer\": 1}, {\"id\": 14, \"options\": [{\"text\": \"Violín\", \"label\": \"A\"}, {\"text\": \"Piano\", \"label\": \"B\"}, {\"text\": \"Flauta\", \"label\": \"C\"}, {\"text\": \"Todos los anteriores\", \"label\": \"D\"}], \"option_a\": \"Violín\", \"option_b\": \"Piano\", \"option_c\": \"Flauta\", \"option_d\": \"Todos los anteriores\", \"question\": \"¿Qué instrumento tocaba Mozart?\", \"correct_answer\": 3}, {\"id\": 16, \"options\": [{\"text\": \"196\", \"label\": \"A\"}, {\"text\": \"206\", \"label\": \"B\"}, {\"text\": \"216\", \"label\": \"C\"}, {\"text\": \"226\", \"label\": \"D\"}], \"option_a\": \"196\", \"option_b\": \"206\", \"option_c\": \"216\", \"option_d\": \"226\", \"question\": \"¿Cuántos huesos tiene el cuerpo humano adulto?\", \"correct_answer\": 1}, {\"id\": 18, \"options\": [{\"text\": \"Italia\", \"label\": \"A\"}, {\"text\": \"España\", \"label\": \"B\"}, {\"text\": \"Francia\", \"label\": \"C\"}, {\"text\": \"Alemania\", \"label\": \"D\"}], \"option_a\": \"Italia\", \"option_b\": \"España\", \"option_c\": \"Francia\", \"option_d\": \"Alemania\", \"question\": \"¿En qué país está la Torre Eiffel?\", \"correct_answer\": 2}]}}',NULL,NULL,NULL,NULL,2,NULL,NULL,471,721,NULL,NULL),(2646,'completed','2025-12-03 06:44:20.619807','2025-12-03 06:55:19.613500',100,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,472,725,NULL,NULL),(2647,'completed','2025-12-03 06:44:20.619807','2025-12-03 06:55:19.629462',100,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,472,726,NULL,NULL),(2648,'completed','2025-12-03 06:44:20.619807','2025-12-03 06:55:19.644462',100,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,472,724,NULL,NULL),(2649,'completed','2025-12-03 06:55:19.664509','2025-12-03 07:20:16.616233',100,'{\"type\": \"presentation\", \"chaos\": {\"completed\": true, \"questions_answered\": 5, \"shown_question_ids\": [21, 8, 13, 7, 19], \"current_question_id\": 19, \"current_question_text\": \"¿Cuál es tu mayor logro?\"}, \"part1_completed\": true, \"general_knowledge\": {\"answers\": [{\"correct\": true, \"selected\": 1, \"question_id\": 11}, {\"correct\": true, \"selected\": 0, \"question_id\": 15}, {\"correct\": true, \"selected\": 1, \"question_id\": 1}, {\"correct\": true, \"selected\": 0, \"question_id\": 17}, {\"correct\": true, \"selected\": 2, \"question_id\": 3}], \"completed\": true, \"questions\": [15, 1, 17, 3, 11], \"correct_count\": 5, \"questions_data\": [{\"id\": 15, \"options\": [{\"text\": \"Guepardo\", \"label\": \"A\"}, {\"text\": \"León\", \"label\": \"B\"}, {\"text\": \"Águila\", \"label\": \"C\"}, {\"text\": \"Pez vela\", \"label\": \"D\"}], \"option_a\": \"Guepardo\", \"option_b\": \"León\", \"option_c\": \"Águila\", \"option_d\": \"Pez vela\", \"question\": \"¿Cuál es el animal más rápido del mundo?\", \"correct_answer\": 0}, {\"id\": 1, \"options\": [{\"text\": \"Londres\", \"label\": \"A\"}, {\"text\": \"París\", \"label\": \"B\"}, {\"text\": \"Madrid\", \"label\": \"C\"}, {\"text\": \"Roma\", \"label\": \"D\"}], \"option_a\": \"Londres\", \"option_b\": \"París\", \"option_c\": \"Madrid\", \"option_d\": \"Roma\", \"question\": \"¿Cuál es la capital de Francia?\", \"correct_answer\": 1}, {\"id\": 17, \"options\": [{\"text\": \"300,000 km/s\", \"label\": \"A\"}, {\"text\": \"150,000 km/s\", \"label\": \"B\"}, {\"text\": \"450,000 km/s\", \"label\": \"C\"}, {\"text\": \"600,000 km/s\", \"label\": \"D\"}], \"option_a\": \"300,000 km/s\", \"option_b\": \"150,000 km/s\", \"option_c\": \"450,000 km/s\", \"option_d\": \"600,000 km/s\", \"question\": \"¿Cuál es la velocidad de la luz?\", \"correct_answer\": 0}, {\"id\": 3, \"options\": [{\"text\": \"Atlántico\", \"label\": \"A\"}, {\"text\": \"Índico\", \"label\": \"B\"}, {\"text\": \"Pacífico\", \"label\": \"C\"}, {\"text\": \"Ártico\", \"label\": \"D\"}], \"option_a\": \"Atlántico\", \"option_b\": \"Índico\", \"option_c\": \"Pacífico\", \"option_d\": \"Ártico\", \"question\": \"¿Cuál es el océano más grande del mundo?\", \"correct_answer\": 2}, {\"id\": 11, \"options\": [{\"text\": \"Oxígeno\", \"label\": \"A\"}, {\"text\": \"Hidrógeno\", \"label\": \"B\"}, {\"text\": \"Helio\", \"label\": \"C\"}, {\"text\": \"Carbono\", \"label\": \"D\"}], \"option_a\": \"Oxígeno\", \"option_b\": \"Hidrógeno\", \"option_c\": \"Helio\", \"option_d\": \"Carbono\", \"question\": \"¿Cuál es el elemento químico más abundante en el universo?\", \"correct_answer\": 1}], \"total_questions\": 5}}',NULL,NULL,NULL,NULL,2,NULL,NULL,472,725,NULL,NULL),(2650,'completed','2025-12-03 06:55:19.664509','2025-12-03 07:12:13.562738',100,'{\"answers\": [], \"found_words\": [\"NEGOCIO\", \"CLIENTE\", \"VENTA\", \"PRODUCTO\", \"MERCADO\"], \"total_words\": 5, \"correct_words\": [\"NEGOCIO\", \"CLIENTE\", \"VENTA\", \"PRODUCTO\", \"MERCADO\"], \"minigame_part\": \"word_search\", \"minigame_type\": \"word_search\", \"tokens_earned\": 5, \"correct_answers\": 5, \"anagram_total_words\": 5, \"anagram_words_found\": 0, \"word_search_total_words\": 5, \"word_search_words_found\": 5}',NULL,NULL,NULL,NULL,2,NULL,NULL,472,726,NULL,NULL),(2651,'completed','2025-12-03 06:55:19.664509','2025-12-03 07:12:48.483514',100,'{\"type\": \"presentation\", \"chaos\": {\"completed\": true, \"questions_answered\": 5, \"shown_question_ids\": [12, 13, 25, 7, 9], \"current_question_id\": 9, \"current_question_text\": \"¿Cuál es tu hobby favorito?\"}, \"part1_completed\": true, \"general_knowledge\": {\"answers\": [{\"correct\": true, \"selected\": 2, \"question_id\": 9}, {\"correct\": true, \"selected\": 1, \"question_id\": 1}, {\"correct\": true, \"selected\": 1, \"question_id\": 12}, {\"correct\": true, \"selected\": 1, \"question_id\": 16}, {\"correct\": true, \"selected\": 0, \"question_id\": 17}], \"completed\": true, \"questions\": [1, 12, 16, 17, 9], \"correct_count\": 5, \"questions_data\": [{\"id\": 1, \"options\": [{\"text\": \"Londres\", \"label\": \"A\"}, {\"text\": \"París\", \"label\": \"B\"}, {\"text\": \"Madrid\", \"label\": \"C\"}, {\"text\": \"Roma\", \"label\": \"D\"}], \"option_a\": \"Londres\", \"option_b\": \"París\", \"option_c\": \"Madrid\", \"option_d\": \"Roma\", \"question\": \"¿Cuál es la capital de Francia?\", \"correct_answer\": 1}, {\"id\": 12, \"options\": [{\"text\": \"1937\", \"label\": \"A\"}, {\"text\": \"1939\", \"label\": \"B\"}, {\"text\": \"1941\", \"label\": \"C\"}, {\"text\": \"1943\", \"label\": \"D\"}], \"option_a\": \"1937\", \"option_b\": \"1939\", \"option_c\": \"1941\", \"option_d\": \"1943\", \"question\": \"¿En qué año comenzó la Segunda Guerra Mundial?\", \"correct_answer\": 1}, {\"id\": 16, \"options\": [{\"text\": \"196\", \"label\": \"A\"}, {\"text\": \"206\", \"label\": \"B\"}, {\"text\": \"216\", \"label\": \"C\"}, {\"text\": \"226\", \"label\": \"D\"}], \"option_a\": \"196\", \"option_b\": \"206\", \"option_c\": \"216\", \"option_d\": \"226\", \"question\": \"¿Cuántos huesos tiene el cuerpo humano adulto?\", \"correct_answer\": 1}, {\"id\": 17, \"options\": [{\"text\": \"300,000 km/s\", \"label\": \"A\"}, {\"text\": \"150,000 km/s\", \"label\": \"B\"}, {\"text\": \"450,000 km/s\", \"label\": \"C\"}, {\"text\": \"600,000 km/s\", \"label\": \"D\"}], \"option_a\": \"300,000 km/s\", \"option_b\": \"150,000 km/s\", \"option_c\": \"450,000 km/s\", \"option_d\": \"600,000 km/s\", \"question\": \"¿Cuál es la velocidad de la luz?\", \"correct_answer\": 0}, {\"id\": 9, \"options\": [{\"text\": \"K2\", \"label\": \"A\"}, {\"text\": \"Kilimanjaro\", \"label\": \"B\"}, {\"text\": \"Everest\", \"label\": \"C\"}, {\"text\": \"Aconcagua\", \"label\": \"D\"}], \"option_a\": \"K2\", \"option_b\": \"Kilimanjaro\", \"option_c\": \"Everest\", \"option_d\": \"Aconcagua\", \"question\": \"¿Cuál es la montaña más alta del mundo?\", \"correct_answer\": 2}], \"total_questions\": 5}}',NULL,NULL,NULL,NULL,2,NULL,NULL,472,724,NULL,NULL),(2652,'completed','2025-12-03 07:22:53.878241','2025-12-03 07:23:22.188258',100,NULL,NULL,NULL,NULL,NULL,3,9,3,473,725,NULL,NULL),(2653,'completed','2025-12-03 07:22:53.884163','2025-12-03 07:23:17.601457',100,NULL,NULL,NULL,NULL,NULL,3,8,3,473,726,NULL,NULL),(2654,'completed','2025-12-03 07:22:53.891921','2025-12-03 07:23:10.428028',100,NULL,NULL,NULL,NULL,NULL,3,3,1,473,724,NULL,NULL),(2655,'completed','2025-12-03 07:23:27.079699','2025-12-03 07:23:48.693610',100,NULL,NULL,NULL,NULL,NULL,5,NULL,NULL,473,725,NULL,NULL),(2656,'completed','2025-12-03 07:23:27.079699','2025-12-03 07:23:48.734777',100,NULL,NULL,NULL,NULL,NULL,5,NULL,NULL,473,726,NULL,NULL),(2657,'completed','2025-12-03 07:23:27.079699','2025-12-03 07:23:48.792288',100,NULL,NULL,NULL,NULL,NULL,5,NULL,NULL,473,724,NULL,NULL),(2658,'completed','2025-12-03 07:25:55.228907','2025-12-03 07:26:15.809402',100,NULL,NULL,NULL,NULL,NULL,6,NULL,NULL,474,725,NULL,NULL),(2659,'completed','2025-12-03 07:25:55.241114','2025-12-03 07:26:15.832061',100,NULL,NULL,NULL,NULL,NULL,6,NULL,NULL,474,726,NULL,NULL),(2660,'completed','2025-12-03 07:25:55.246077','2025-12-03 07:26:15.849664',100,NULL,NULL,NULL,NULL,NULL,6,NULL,NULL,474,724,NULL,NULL),(2661,'completed','2025-12-03 07:27:30.773440','2025-12-03 07:32:13.086588',100,NULL,NULL,NULL,NULL,NULL,7,NULL,NULL,475,725,NULL,NULL),(2662,'completed','2025-12-03 07:27:30.780031','2025-12-03 07:32:13.105586',100,NULL,NULL,NULL,NULL,NULL,7,NULL,NULL,475,726,NULL,NULL),(2663,'completed','2025-12-03 07:27:30.785999','2025-12-03 07:32:13.120595',100,NULL,NULL,NULL,NULL,NULL,7,NULL,NULL,475,724,NULL,NULL),(2664,'completed','2025-12-03 07:32:13.146587','2025-12-03 07:34:01.755064',100,NULL,NULL,NULL,NULL,NULL,8,NULL,NULL,475,725,NULL,NULL),(2665,'completed','2025-12-03 07:32:13.146587','2025-12-03 07:34:01.766064',100,NULL,NULL,NULL,NULL,NULL,8,NULL,NULL,475,726,NULL,NULL),(2666,'completed','2025-12-03 07:32:13.146587','2025-12-03 07:34:01.778062',100,NULL,NULL,NULL,NULL,NULL,8,NULL,NULL,475,724,NULL,NULL),(2667,'completed','2025-12-03 14:32:31.418722','2025-12-03 14:33:14.490398',100,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,476,728,NULL,NULL),(2668,'completed','2025-12-03 14:32:31.418722','2025-12-03 14:33:14.520210',100,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,476,729,NULL,NULL),(2669,'completed','2025-12-03 14:32:31.418722','2025-12-03 14:33:14.537964',100,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,476,727,NULL,NULL),(2670,'completed','2025-12-03 14:33:14.563431','2025-12-03 14:33:54.683539',100,'{\"type\": \"presentation\", \"chaos\": {\"completed\": true, \"questions_answered\": 5, \"shown_question_ids\": [1, 26, 21, 27, 5], \"current_question_id\": 5, \"current_question_text\": \"¿Cuál es tu comida favorita?\"}, \"part1_completed\": true, \"general_knowledge\": {\"answers\": [{\"correct\": false, \"selected\": 0, \"question_id\": 10}, {\"correct\": true, \"selected\": 0, \"question_id\": 15}, {\"correct\": true, \"selected\": 2, \"question_id\": 5}, {\"correct\": true, \"selected\": 2, \"question_id\": 8}, {\"correct\": true, \"selected\": 2, \"question_id\": 13}], \"completed\": true, \"questions\": [15, 5, 8, 13, 10], \"correct_count\": 4, \"questions_data\": [{\"id\": 15, \"options\": [{\"text\": \"Guepardo\", \"label\": \"A\"}, {\"text\": \"León\", \"label\": \"B\"}, {\"text\": \"Águila\", \"label\": \"C\"}, {\"text\": \"Pez vela\", \"label\": \"D\"}], \"option_a\": \"Guepardo\", \"option_b\": \"León\", \"option_c\": \"Águila\", \"option_d\": \"Pez vela\", \"question\": \"¿Cuál es el animal más rápido del mundo?\", \"correct_answer\": 0}, {\"id\": 5, \"options\": [{\"text\": \"Venus\", \"label\": \"A\"}, {\"text\": \"Tierra\", \"label\": \"B\"}, {\"text\": \"Mercurio\", \"label\": \"C\"}, {\"text\": \"Marte\", \"label\": \"D\"}], \"option_a\": \"Venus\", \"option_b\": \"Tierra\", \"option_c\": \"Mercurio\", \"option_d\": \"Marte\", \"question\": \"¿Cuál es el planeta más cercano al Sol?\", \"correct_answer\": 2}, {\"id\": 8, \"options\": [{\"text\": \"Asia\", \"label\": \"A\"}, {\"text\": \"Europa\", \"label\": \"B\"}, {\"text\": \"África\", \"label\": \"C\"}, {\"text\": \"América\", \"label\": \"D\"}], \"option_a\": \"Asia\", \"option_b\": \"Europa\", \"option_c\": \"África\", \"option_d\": \"América\", \"question\": \"¿En qué continente está Egipto?\", \"correct_answer\": 2}, {\"id\": 13, \"options\": [{\"text\": \"China\", \"label\": \"A\"}, {\"text\": \"Estados Unidos\", \"label\": \"B\"}, {\"text\": \"Rusia\", \"label\": \"C\"}, {\"text\": \"Canadá\", \"label\": \"D\"}], \"option_a\": \"China\", \"option_b\": \"Estados Unidos\", \"option_c\": \"Rusia\", \"option_d\": \"Canadá\", \"question\": \"¿Cuál es el país más grande del mundo?\", \"correct_answer\": 2}, {\"id\": 10, \"options\": [{\"text\": \"Gabriel García Márquez\", \"label\": \"A\"}, {\"text\": \"Miguel de Cervantes\", \"label\": \"B\"}, {\"text\": \"Pablo Neruda\", \"label\": \"C\"}, {\"text\": \"Mario Vargas Llosa\", \"label\": \"D\"}], \"option_a\": \"Gabriel García Márquez\", \"option_b\": \"Miguel de Cervantes\", \"option_c\": \"Pablo Neruda\", \"option_d\": \"Mario Vargas Llosa\", \"question\": \"¿Quién escribió \'Don Quijote de la Mancha\'?\", \"correct_answer\": 1}], \"total_questions\": 5}}',NULL,NULL,NULL,NULL,2,NULL,NULL,476,728,NULL,NULL),(2671,'in_progress','2025-12-03 14:33:14.563431','2025-12-03 14:34:22.322946',70,'{\"answers\": [{\"word\": \"OPORTUNIDAD\", \"answer\": \"OPORTUNIDAD\"}, {\"word\": \"VALORES\", \"answer\": \"VALORES\"}], \"found_words\": [\"MISION\", \"MOTIVACION\", \"LIDERAZGO\", \"VISION\", \"PASION\"], \"total_words\": 5, \"anagram_words\": [\"OPORTUNIDAD\", \"VALORES\", \"EXPERIENCIA\", \"RESULTADO\", \"ADMINISTRACION\"], \"minigame_part\": \"anagram\", \"minigame_type\": \"anagrama\", \"tokens_earned\": 7, \"correct_answers\": 2, \"anagram_total_words\": 5, \"anagram_words_found\": 2, \"anagram_current_index\": 2, \"word_search_total_words\": 5, \"word_search_words_found\": 5}',NULL,NULL,NULL,NULL,2,NULL,NULL,476,729,NULL,NULL),(2672,'completed','2025-12-03 14:33:14.563431','2025-12-03 14:34:47.384961',100,'{\"type\": \"presentation\", \"chaos\": {\"completed\": true, \"questions_answered\": 5, \"shown_question_ids\": [8, 27, 17, 20, 12], \"current_question_id\": 12, \"current_question_text\": \"¿Qué te gustaría aprender?\"}, \"part1_completed\": true, \"general_knowledge\": {\"questions\": [16, 13, 20, 15, 14], \"questions_data\": [{\"id\": 16, \"options\": [{\"text\": \"196\", \"label\": \"A\"}, {\"text\": \"206\", \"label\": \"B\"}, {\"text\": \"216\", \"label\": \"C\"}, {\"text\": \"226\", \"label\": \"D\"}], \"option_a\": \"196\", \"option_b\": \"206\", \"option_c\": \"216\", \"option_d\": \"226\", \"question\": \"¿Cuántos huesos tiene el cuerpo humano adulto?\", \"correct_answer\": 1}, {\"id\": 13, \"options\": [{\"text\": \"China\", \"label\": \"A\"}, {\"text\": \"Estados Unidos\", \"label\": \"B\"}, {\"text\": \"Rusia\", \"label\": \"C\"}, {\"text\": \"Canadá\", \"label\": \"D\"}], \"option_a\": \"China\", \"option_b\": \"Estados Unidos\", \"option_c\": \"Rusia\", \"option_d\": \"Canadá\", \"question\": \"¿Cuál es el país más grande del mundo?\", \"correct_answer\": 2}, {\"id\": 20, \"options\": [{\"text\": \"Proceso de respiración de las plantas\", \"label\": \"A\"}, {\"text\": \"Proceso por el cual las plantas producen su alimento\", \"label\": \"B\"}, {\"text\": \"Proceso de reproducción de las plantas\", \"label\": \"C\"}, {\"text\": \"Proceso de crecimiento de las plantas\", \"label\": \"D\"}], \"option_a\": \"Proceso de respiración de las plantas\", \"option_b\": \"Proceso por el cual las plantas producen su alimento\", \"option_c\": \"Proceso de reproducción de las plantas\", \"option_d\": \"Proceso de crecimiento de las plantas\", \"question\": \"¿Qué es la fotosíntesis?\", \"correct_answer\": 1}, {\"id\": 15, \"options\": [{\"text\": \"Guepardo\", \"label\": \"A\"}, {\"text\": \"León\", \"label\": \"B\"}, {\"text\": \"Águila\", \"label\": \"C\"}, {\"text\": \"Pez vela\", \"label\": \"D\"}], \"option_a\": \"Guepardo\", \"option_b\": \"León\", \"option_c\": \"Águila\", \"option_d\": \"Pez vela\", \"question\": \"¿Cuál es el animal más rápido del mundo?\", \"correct_answer\": 0}, {\"id\": 14, \"options\": [{\"text\": \"Violín\", \"label\": \"A\"}, {\"text\": \"Piano\", \"label\": \"B\"}, {\"text\": \"Flauta\", \"label\": \"C\"}, {\"text\": \"Todos los anteriores\", \"label\": \"D\"}], \"option_a\": \"Violín\", \"option_b\": \"Piano\", \"option_c\": \"Flauta\", \"option_d\": \"Todos los anteriores\", \"question\": \"¿Qué instrumento tocaba Mozart?\", \"correct_answer\": 3}]}}',NULL,NULL,NULL,NULL,2,NULL,NULL,476,727,NULL,NULL),(2673,'completed','2025-12-03 17:42:55.646127','2025-12-03 17:43:56.027492',100,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,477,731,NULL,NULL),(2674,'completed','2025-12-03 17:42:55.646127','2025-12-03 17:43:56.104220',100,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,477,732,NULL,NULL),(2675,'completed','2025-12-03 17:42:55.646127','2025-12-03 17:43:56.256083',100,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,477,730,NULL,NULL),(2676,'completed','2025-12-03 17:43:56.448936','2025-12-03 17:52:29.928658',100,'{\"answers\": [{\"word\": \"APRENDIZAJE\", \"answer\": \"APRENDIZAJE\"}, {\"word\": \"OBJETIVO\", \"answer\": \"OBJETIVO\"}, {\"word\": \"COMUNICACION\", \"answer\": \"COMUNICACION\"}, {\"word\": \"RIESGO\", \"answer\": \"RIESGO\"}, {\"word\": \"ORGANIZACION\", \"answer\": \"ORGANIZACION\"}], \"found_words\": [\"MOTIVACION\", \"PASION\", \"VISION\", \"MISION\", \"LIDERAZGO\"], \"total_words\": 5, \"anagram_words\": [\"APRENDIZAJE\", \"OBJETIVO\", \"COMUNICACION\", \"RIESGO\", \"ORGANIZACION\"], \"minigame_part\": \"anagram\", \"minigame_type\": \"anagrama\", \"tokens_earned\": 10, \"correct_answers\": 5, \"anagram_completed\": true, \"general_knowledge\": {\"answers\": [{\"correct\": true, \"selected\": 2, \"question_id\": 6}, {\"correct\": true, \"selected\": 1, \"question_id\": 1}, {\"correct\": false, \"selected\": 1, \"question_id\": 13}, {\"correct\": true, \"selected\": 2, \"question_id\": 3}, {\"correct\": true, \"selected\": 0, \"question_id\": 17}], \"completed\": true, \"correct_count\": 4, \"total_questions\": 5}, \"anagram_total_words\": 5, \"anagram_words_found\": 5, \"anagram_current_index\": 5, \"word_search_total_words\": 5, \"word_search_words_found\": 5}',NULL,NULL,NULL,NULL,2,NULL,NULL,477,731,NULL,NULL),(2677,'completed','2025-12-03 17:43:56.448936','2025-12-03 17:52:57.619945',100,'{\"type\": \"presentation\", \"chaos\": {\"completed\": true, \"questions_answered\": 5, \"shown_question_ids\": [29, 17, 5, 24, 27], \"current_question_id\": 27, \"current_question_text\": \"¿Cuál es tu serie favorita?\"}, \"part1_completed\": true, \"general_knowledge\": {\"answers\": [{\"correct\": false, \"selected\": 3, \"question_id\": 9}, {\"correct\": true, \"selected\": 1, \"question_id\": 1}, {\"correct\": false, \"selected\": 3, \"question_id\": 11}, {\"correct\": false, \"selected\": 3, \"question_id\": 6}, {\"correct\": false, \"selected\": 3, \"question_id\": 10}], \"completed\": true, \"questions\": [1, 11, 6, 10, 9], \"correct_count\": 1, \"questions_data\": [{\"id\": 1, \"options\": [{\"text\": \"Londres\", \"label\": \"A\"}, {\"text\": \"París\", \"label\": \"B\"}, {\"text\": \"Madrid\", \"label\": \"C\"}, {\"text\": \"Roma\", \"label\": \"D\"}], \"option_a\": \"Londres\", \"option_b\": \"París\", \"option_c\": \"Madrid\", \"option_d\": \"Roma\", \"question\": \"¿Cuál es la capital de Francia?\", \"correct_answer\": 1}, {\"id\": 11, \"options\": [{\"text\": \"Oxígeno\", \"label\": \"A\"}, {\"text\": \"Hidrógeno\", \"label\": \"B\"}, {\"text\": \"Helio\", \"label\": \"C\"}, {\"text\": \"Carbono\", \"label\": \"D\"}], \"option_a\": \"Oxígeno\", \"option_b\": \"Hidrógeno\", \"option_c\": \"Helio\", \"option_d\": \"Carbono\", \"question\": \"¿Cuál es el elemento químico más abundante en el universo?\", \"correct_answer\": 1}, {\"id\": 6, \"options\": [{\"text\": \"5\", \"label\": \"A\"}, {\"text\": \"6\", \"label\": \"B\"}, {\"text\": \"7\", \"label\": \"C\"}, {\"text\": \"8\", \"label\": \"D\"}], \"option_a\": \"5\", \"option_b\": \"6\", \"option_c\": \"7\", \"option_d\": \"8\", \"question\": \"¿Cuántos continentes hay en el mundo?\", \"correct_answer\": 2}, {\"id\": 10, \"options\": [{\"text\": \"Gabriel García Márquez\", \"label\": \"A\"}, {\"text\": \"Miguel de Cervantes\", \"label\": \"B\"}, {\"text\": \"Pablo Neruda\", \"label\": \"C\"}, {\"text\": \"Mario Vargas Llosa\", \"label\": \"D\"}], \"option_a\": \"Gabriel García Márquez\", \"option_b\": \"Miguel de Cervantes\", \"option_c\": \"Pablo Neruda\", \"option_d\": \"Mario Vargas Llosa\", \"question\": \"¿Quién escribió \'Don Quijote de la Mancha\'?\", \"correct_answer\": 1}, {\"id\": 9, \"options\": [{\"text\": \"K2\", \"label\": \"A\"}, {\"text\": \"Kilimanjaro\", \"label\": \"B\"}, {\"text\": \"Everest\", \"label\": \"C\"}, {\"text\": \"Aconcagua\", \"label\": \"D\"}], \"option_a\": \"K2\", \"option_b\": \"Kilimanjaro\", \"option_c\": \"Everest\", \"option_d\": \"Aconcagua\", \"question\": \"¿Cuál es la montaña más alta del mundo?\", \"correct_answer\": 2}], \"total_questions\": 5}}',NULL,NULL,NULL,NULL,2,NULL,NULL,477,732,NULL,NULL),(2678,'completed','2025-12-03 17:43:56.448936','2025-12-03 17:53:16.128189',100,'{\"type\": \"presentation\", \"chaos\": {\"completed\": true, \"questions_answered\": 5, \"shown_question_ids\": [5, 11, 10, 26, 29], \"current_question_id\": 29, \"current_question_text\": \"¿Cuál es tu juego favorito?\"}, \"part1_completed\": true, \"general_knowledge\": {\"answers\": [{\"correct\": false, \"selected\": 3, \"question_id\": 17}, {\"correct\": false, \"selected\": 1, \"question_id\": 5}, {\"correct\": false, \"selected\": 3, \"question_id\": 1}, {\"correct\": false, \"selected\": 3, \"question_id\": 18}, {\"correct\": false, \"selected\": 3, \"question_id\": 20}], \"completed\": true, \"correct_count\": 0, \"total_questions\": 5}}',NULL,NULL,NULL,NULL,2,NULL,NULL,477,730,NULL,NULL),(2679,'completed','2025-12-03 17:53:35.317889','2025-12-03 17:54:25.087141',100,NULL,NULL,NULL,NULL,NULL,3,2,1,478,731,NULL,NULL),(2680,'completed','2025-12-03 17:53:35.329357','2025-12-03 17:54:33.549820',100,NULL,NULL,NULL,NULL,NULL,3,6,2,478,732,NULL,NULL),(2681,'completed','2025-12-03 17:53:35.337739','2025-12-03 17:54:50.410280',100,NULL,NULL,NULL,NULL,NULL,3,7,3,478,730,NULL,NULL),(2682,'pending','2025-12-03 17:54:53.005950',NULL,0,NULL,NULL,NULL,NULL,NULL,5,NULL,NULL,478,731,NULL,NULL),(2683,'pending','2025-12-03 17:54:53.005950',NULL,0,NULL,NULL,NULL,NULL,NULL,5,NULL,NULL,478,732,NULL,NULL),(2684,'pending','2025-12-03 17:54:53.005950',NULL,0,NULL,NULL,NULL,NULL,NULL,5,NULL,NULL,478,730,NULL,NULL);
/*!40000 ALTER TABLE `team_activity_progress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_bubble_maps`
--

DROP TABLE IF EXISTS `team_bubble_maps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_bubble_maps` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `map_data` json NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `session_stage_id` bigint NOT NULL,
  `team_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `team_bubble_maps_team_id_session_stage_id_17b57cd0_uniq` (`team_id`,`session_stage_id`),
  KEY `team_bubble_team_id_9bb24e_idx` (`team_id`),
  KEY `team_bubble_session_86d871_idx` (`session_stage_id`),
  CONSTRAINT `team_bubble_maps_session_stage_id_49de9bcb_fk_session_stages_id` FOREIGN KEY (`session_stage_id`) REFERENCES `session_stages` (`id`),
  CONSTRAINT `team_bubble_maps_team_id_fbae9ea2_fk_teams_id` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=191 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_bubble_maps`
--

LOCK TABLES `team_bubble_maps` WRITE;
/*!40000 ALTER TABLE `team_bubble_maps` DISABLE KEYS */;
INSERT INTO `team_bubble_maps` VALUES (187,'{\"central\": {\"personName\": \"Simona\", \"profileImage\": \"/media/personas/perfil-ia-1763366608710.png\"}, \"questions\": [{\"id\": 1, \"answers\": [], \"question\": \"¿Qué le gusta?\", \"isOptional\": false}, {\"id\": 2, \"answers\": [], \"question\": \"¿Qué no le gusta?\", \"isOptional\": false}, {\"id\": 3, \"answers\": [], \"question\": \"¿Qué obstáculos está enfrentando?\", \"isOptional\": false}, {\"id\": 4, \"answers\": [], \"question\": \"¿Qué le dicen los demás?\", \"isOptional\": false}, {\"id\": 5, \"answers\": [], \"question\": \"¿Cuáles son sus hobbies?\", \"isOptional\": false}]}','2025-12-03 02:23:09.374664','2025-12-03 02:29:40.309745',468,716),(188,'{\"central\": {\"personName\": \"Gabriela\", \"profileImage\": \"/media/personas/persona-profile_2.jpg\"}, \"questions\": [{\"id\": 1, \"answers\": [], \"question\": \"¿Qué le gusta?\", \"isOptional\": false}, {\"id\": 2, \"answers\": [], \"question\": \"¿Qué no le gusta?\", \"isOptional\": false}, {\"id\": 3, \"answers\": [], \"question\": \"¿Qué obstáculos está enfrentando?\", \"isOptional\": false}, {\"id\": 4, \"answers\": [], \"question\": \"¿Qué le dicen los demás?\", \"isOptional\": false}, {\"id\": 5, \"answers\": [], \"question\": \"¿Cuáles son sus hobbies?\", \"isOptional\": false}]}','2025-12-03 02:29:40.327363','2025-12-03 02:29:40.327363',468,717),(189,'{\"central\": {\"personName\": \"Juana\", \"profileImage\": \"/media/personas/persona-profile_6.jpg\"}, \"questions\": [{\"id\": 1, \"answers\": [], \"question\": \"¿Qué le gusta?\", \"isOptional\": false}, {\"id\": 2, \"answers\": [], \"question\": \"¿Qué no le gusta?\", \"isOptional\": false}, {\"id\": 3, \"answers\": [], \"question\": \"¿Qué obstáculos está enfrentando?\", \"isOptional\": false}, {\"id\": 4, \"answers\": [], \"question\": \"¿Qué le dicen los demás?\", \"isOptional\": false}, {\"id\": 5, \"answers\": [], \"question\": \"¿Cuáles son sus hobbies?\", \"isOptional\": false}]}','2025-12-03 02:29:40.329363','2025-12-03 02:29:40.329363',468,715),(190,'{\"central\": {\"personName\": \"Simona\", \"profileImage\": \"/media/personas/perfil-ia-1763366608710.png\"}, \"questions\": [{\"id\": 1, \"answers\": [{\"id\": 1, \"text\": \"trabajar\"}, {\"id\": 2, \"text\": \"ver anime comiendo pizza\"}], \"question\": \"¿Qué le gusta?\", \"isOptional\": false}, {\"id\": 2, \"answers\": [], \"question\": \"¿Qué no le gusta?\", \"isOptional\": false}, {\"id\": 3, \"answers\": [], \"question\": \"¿Qué obstáculos está enfrentando?\", \"isOptional\": false}, {\"id\": 4, \"answers\": [], \"question\": \"¿Qué le dicen los demás?\", \"isOptional\": false}, {\"id\": 5, \"answers\": [], \"question\": \"¿Cuáles son sus hobbies?\", \"isOptional\": false}]}','2025-12-03 17:55:21.471738','2025-12-03 17:55:27.870878',478,731);
/*!40000 ALTER TABLE `team_bubble_maps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_personalization`
--

DROP TABLE IF EXISTS `team_personalization`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_personalization` (
  `team_id` bigint NOT NULL,
  `team_name` varchar(100) DEFAULT NULL,
  `team_members_know_each_other` tinyint(1) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`team_id`),
  CONSTRAINT `team_personalization_team_id_711bccdd_fk_teams_id` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_personalization`
--

LOCK TABLES `team_personalization` WRITE;
/*!40000 ALTER TABLE `team_personalization` DISABLE KEYS */;
INSERT INTO `team_personalization` VALUES (712,'efwef',1,'2025-12-02 02:25:27.901150','2025-12-02 02:25:27.901150'),(713,'fwef',0,'2025-12-02 02:25:24.387791','2025-12-02 02:25:24.387791'),(714,'b',1,'2025-12-02 02:25:19.879059','2025-12-02 02:25:19.879059'),(715,'dedwedewde',1,'2025-12-03 00:25:08.050410','2025-12-03 00:25:08.050410'),(716,'roket lab',1,'2025-12-03 00:18:40.502282','2025-12-03 00:18:40.502282'),(717,'Alpha solutions',0,'2025-12-03 00:23:51.817047','2025-12-03 00:23:51.817047'),(718,'ede',0,'2025-12-02 17:00:24.595586','2025-12-02 17:00:24.595586'),(719,'fwefwe',1,'2025-12-02 17:00:22.044724','2025-12-02 17:00:22.044724'),(720,'dew',1,'2025-12-02 17:00:31.284448','2025-12-02 17:00:31.284448'),(721,'ewfwef',1,'2025-12-03 06:02:08.752606','2025-12-03 06:02:08.752606'),(722,'efwef',0,'2025-12-03 06:02:12.501107','2025-12-03 06:02:12.501107'),(723,'fewfwe',0,'2025-12-03 06:02:05.037364','2025-12-03 06:02:05.037364'),(724,'fewf',0,'2025-12-03 06:55:07.975323','2025-12-03 06:55:07.975323'),(725,'fwef',0,'2025-12-03 06:55:13.744384','2025-12-03 06:55:13.744384'),(726,'wefwef',1,'2025-12-03 06:55:10.856865','2025-12-03 06:55:10.856865'),(727,'efwefw',0,'2025-12-03 14:33:03.621217','2025-12-03 14:33:03.621245'),(728,'wefw',0,'2025-12-03 14:33:09.531475','2025-12-03 14:33:09.531502'),(729,'fwef',1,'2025-12-03 14:33:06.369540','2025-12-03 14:33:06.369569'),(730,'Bobby',0,'2025-12-03 17:43:50.757716','2025-12-03 17:43:50.757743'),(731,'Kali',1,'2025-12-03 17:43:37.200998','2025-12-03 17:43:37.201054'),(732,'Rocky',0,'2025-12-03 17:43:44.460102','2025-12-03 17:43:44.460132');
/*!40000 ALTER TABLE `team_personalization` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_roulette_assignments`
--

DROP TABLE IF EXISTS `team_roulette_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_roulette_assignments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `status` varchar(20) NOT NULL,
  `token_reward` int NOT NULL,
  `assigned_at` datetime(6) NOT NULL,
  `accepted_at` datetime(6) DEFAULT NULL,
  `rejected_at` datetime(6) DEFAULT NULL,
  `completed_at` datetime(6) DEFAULT NULL,
  `roulette_challenge_id` bigint NOT NULL,
  `session_stage_id` bigint NOT NULL,
  `team_id` bigint NOT NULL,
  `validated_by_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `team_roulet_team_id_af552c_idx` (`team_id`),
  KEY `team_roulet_roulett_8c9155_idx` (`roulette_challenge_id`),
  KEY `team_roulet_status_d5a38d_idx` (`status`),
  KEY `team_roulette_assign_session_stage_id_c5a1861e_fk_session_s` (`session_stage_id`),
  KEY `team_roulette_assign_validated_by_id_8dad8bd1_fk_professor` (`validated_by_id`),
  CONSTRAINT `team_roulette_assign_roulette_challenge_i_1483d73e_fk_roulette_` FOREIGN KEY (`roulette_challenge_id`) REFERENCES `roulette_challenges` (`id`),
  CONSTRAINT `team_roulette_assign_session_stage_id_c5a1861e_fk_session_s` FOREIGN KEY (`session_stage_id`) REFERENCES `session_stages` (`id`),
  CONSTRAINT `team_roulette_assign_validated_by_id_8dad8bd1_fk_professor` FOREIGN KEY (`validated_by_id`) REFERENCES `professors` (`id`),
  CONSTRAINT `team_roulette_assignments_team_id_6bae2cdf_fk_teams_id` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_roulette_assignments`
--

LOCK TABLES `team_roulette_assignments` WRITE;
/*!40000 ALTER TABLE `team_roulette_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `team_roulette_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_students`
--

DROP TABLE IF EXISTS `team_students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_students` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `student_id` bigint NOT NULL,
  `team_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `team_students_team_id_student_id_1fd980a1_uniq` (`team_id`,`student_id`),
  KEY `team_studen_student_28cbe0_idx` (`student_id`),
  CONSTRAINT `team_students_student_id_c1a42457_fk_students_id` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `team_students_team_id_b4fd8642_fk_teams_id` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5319 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_students`
--

LOCK TABLES `team_students` WRITE;
/*!40000 ALTER TABLE `team_students` DISABLE KEYS */;
INSERT INTO `team_students` VALUES (5157,85,706),(5158,86,706),(5154,88,706),(5155,91,706),(5159,92,706),(5156,97,706),(5160,83,707),(5163,84,707),(5161,87,707),(5165,89,707),(5164,93,707),(5162,94,707),(5168,81,708),(5167,82,708),(5166,90,708),(5169,95,708),(5170,96,708),(5171,87,709),(5175,88,709),(5176,90,709),(5174,93,709),(5173,96,709),(5172,97,709),(5180,84,710),(5179,85,710),(5181,86,710),(5182,89,710),(5178,91,710),(5177,95,710),(5185,81,711),(5184,82,711),(5183,83,711),(5187,92,711),(5186,94,711),(5191,81,712),(5193,82,712),(5189,88,712),(5190,95,712),(5192,96,712),(5188,97,712),(5196,84,713),(5198,86,713),(5194,87,713),(5199,90,713),(5195,93,713),(5197,94,713),(5203,83,714),(5204,85,714),(5202,89,714),(5201,91,714),(5200,92,714),(5205,101,715),(5209,102,715),(5208,104,715),(5206,105,715),(5207,108,715),(5211,114,715),(5210,119,715),(5212,120,715),(5218,98,716),(5215,99,716),(5217,109,716),(5219,112,716),(5220,115,716),(5216,116,716),(5214,117,716),(5213,118,716),(5227,100,717),(5222,103,717),(5226,106,717),(5223,107,717),(5225,110,717),(5224,111,717),(5221,113,717),(5232,122,718),(5235,125,718),(5234,127,718),(5230,129,718),(5231,136,718),(5233,137,718),(5229,142,718),(5228,143,718),(5241,121,719),(5243,126,719),(5240,128,719),(5238,130,719),(5237,132,719),(5236,135,719),(5242,140,719),(5239,141,719),(5247,123,720),(5244,124,720),(5249,131,720),(5245,133,720),(5246,134,720),(5250,138,720),(5248,139,720),(5251,83,721),(5253,84,721),(5254,87,721),(5255,88,721),(5252,92,721),(5256,93,721),(5260,82,722),(5259,86,722),(5257,94,722),(5261,95,722),(5262,96,722),(5258,97,722),(5265,81,723),(5266,85,723),(5264,89,723),(5263,90,723),(5267,91,723),(5270,86,724),(5272,87,724),(5268,89,724),(5269,92,724),(5271,95,724),(5273,97,724),(5279,81,725),(5274,82,725),(5276,84,725),(5278,85,725),(5275,93,725),(5277,96,725),(5284,83,726),(5280,88,726),(5281,90,726),(5282,91,726),(5283,94,726),(5287,85,727),(5289,87,727),(5290,90,727),(5286,92,727),(5285,93,727),(5288,97,727),(5295,81,728),(5291,82,728),(5293,83,728),(5296,84,728),(5292,89,728),(5294,95,728),(5301,86,729),(5297,88,729),(5299,91,729),(5300,94,729),(5298,96,729),(5305,81,730),(5303,82,730),(5304,88,730),(5302,92,730),(5306,96,730),(5307,97,730),(5312,83,731),(5313,84,731),(5309,86,731),(5308,89,731),(5311,90,731),(5310,94,731),(5316,85,732),(5315,87,732),(5318,91,732),(5317,93,732),(5314,95,732);
/*!40000 ALTER TABLE `team_students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teams`
--

DROP TABLE IF EXISTS `teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teams` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `color` varchar(50) NOT NULL,
  `tokens_total` int NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `game_session_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `teams_game_session_id_name_c9e89b99_uniq` (`game_session_id`,`name`),
  KEY `teams_game_se_7d8aab_idx` (`game_session_id`),
  KEY `teams_color_56beec_idx` (`color`),
  CONSTRAINT `teams_game_session_id_d946ac99_fk_game_sessions_id` FOREIGN KEY (`game_session_id`) REFERENCES `game_sessions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=733 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teams`
--

LOCK TABLES `teams` WRITE;
/*!40000 ALTER TABLE `teams` DISABLE KEYS */;
INSERT INTO `teams` VALUES (706,'Equipo Verde','Verde',0,'2025-12-01 21:04:46.046267','2025-12-01 21:04:46.046267',236),(707,'Equipo Azul','Azul',0,'2025-12-01 21:04:46.363048','2025-12-01 21:04:46.363048',236),(708,'Equipo Rojo','Rojo',0,'2025-12-01 21:04:46.697136','2025-12-01 21:04:46.697136',236),(709,'Equipo Verde','Verde',0,'2025-12-01 21:34:50.967655','2025-12-01 21:34:50.967655',237),(710,'Equipo Azul','Azul',0,'2025-12-01 21:34:50.998491','2025-12-01 21:34:50.998491',237),(711,'Equipo Rojo','Rojo',0,'2025-12-01 21:34:51.019606','2025-12-01 21:34:51.019606',237),(712,'Equipo Verde','Verde',0,'2025-12-02 00:08:12.609560','2025-12-02 00:08:12.610832',238),(713,'Equipo Azul','Azul',0,'2025-12-02 00:08:12.652237','2025-12-02 00:08:12.652237',238),(714,'Equipo Rojo','Rojo',0,'2025-12-02 00:08:12.679644','2025-12-02 00:08:12.679644',238),(715,'Equipo Verde','Verde',71,'2025-12-02 15:59:54.712245','2025-12-03 05:49:31.999998',239),(716,'Equipo Azul','Azul',16,'2025-12-02 15:59:54.762051','2025-12-03 05:48:44.796239',239),(717,'Equipo Rojo','Rojo',49,'2025-12-02 15:59:54.812421','2025-12-03 05:50:24.808655',239),(718,'Equipo Verde','Verde',13,'2025-12-02 15:59:54.856662','2025-12-02 18:44:41.676983',240),(719,'Equipo Azul','Azul',7,'2025-12-02 15:59:54.880876','2025-12-02 18:12:22.455125',240),(720,'Equipo Rojo','Rojo',5,'2025-12-02 15:59:54.914167','2025-12-02 18:31:19.610842',240),(721,'Equipo Verde','Verde',0,'2025-12-03 05:58:19.877956','2025-12-03 05:58:19.877956',241),(722,'Equipo Azul','Azul',0,'2025-12-03 05:58:19.905961','2025-12-03 05:58:19.905961',241),(723,'Equipo Rojo','Rojo',0,'2025-12-03 05:58:19.931958','2025-12-03 05:58:19.931958',241),(724,'Equipo Verde','Verde',15,'2025-12-03 06:43:52.940818','2025-12-03 07:12:47.429511',242),(725,'Equipo Azul','Azul',14,'2025-12-03 06:43:52.971945','2025-12-03 07:20:15.532276',242),(726,'Equipo Rojo','Rojo',5,'2025-12-03 06:43:52.997653','2025-12-03 07:12:12.353842',242),(727,'Equipo Verde','Verde',10,'2025-12-03 14:31:43.143945','2025-12-03 14:34:47.395414',243),(728,'Equipo Azul','Azul',14,'2025-12-03 14:31:43.180992','2025-12-03 14:33:48.472029',243),(729,'Equipo Rojo','Rojo',7,'2025-12-03 14:31:43.209437','2025-12-03 14:34:36.861084',243),(730,'Equipo Verde','Verde',10,'2025-12-03 17:41:11.326606','2025-12-03 17:53:06.210991',244),(731,'Equipo Azul','Azul',14,'2025-12-03 17:41:11.393249','2025-12-03 17:52:28.883845',244),(732,'Equipo Rojo','Rojo',11,'2025-12-03 17:41:11.452101','2025-12-03 17:52:56.568787',244);
/*!40000 ALTER TABLE `teams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `token_transactions`
--

DROP TABLE IF EXISTS `token_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `token_transactions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `amount` int NOT NULL,
  `source_type` varchar(30) NOT NULL,
  `source_id` int DEFAULT NULL,
  `reason` longtext,
  `created_at` datetime(6) NOT NULL,
  `awarded_by_id` bigint DEFAULT NULL,
  `game_session_id` bigint NOT NULL,
  `session_stage_id` bigint DEFAULT NULL,
  `team_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `token_trans_team_id_901680_idx` (`team_id`),
  KEY `token_trans_game_se_6b0306_idx` (`game_session_id`),
  KEY `token_trans_source__621a3e_idx` (`source_type`,`source_id`),
  KEY `token_trans_created_4c5cdd_idx` (`created_at`),
  KEY `token_transactions_awarded_by_id_115120a7_fk_professors_id` (`awarded_by_id`),
  KEY `token_transactions_session_stage_id_6212aa59_fk_session_s` (`session_stage_id`),
  CONSTRAINT `token_transactions_awarded_by_id_115120a7_fk_professors_id` FOREIGN KEY (`awarded_by_id`) REFERENCES `professors` (`id`),
  CONSTRAINT `token_transactions_game_session_id_6bfe21bc_fk_game_sessions_id` FOREIGN KEY (`game_session_id`) REFERENCES `game_sessions` (`id`),
  CONSTRAINT `token_transactions_session_stage_id_6212aa59_fk_session_s` FOREIGN KEY (`session_stage_id`) REFERENCES `session_stages` (`id`),
  CONSTRAINT `token_transactions_team_id_f387a4f1_fk_teams_id` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1560 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `token_transactions`
--

LOCK TABLES `token_transactions` WRITE;
/*!40000 ALTER TABLE `token_transactions` DISABLE KEYS */;
INSERT INTO `token_transactions` VALUES (1457,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-02 17:47:05.454351',NULL,240,466,719),(1458,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-02 17:47:08.203209',NULL,240,466,719),(1459,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-02 17:47:12.197405',NULL,240,466,719),(1460,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-02 17:47:16.247682',NULL,240,466,719),(1461,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-02 17:47:19.479574',NULL,240,466,719),(1462,1,'activity',2,'Actividad \"Presentación\": Palabra \"PLANIFICACION\" correcta en anagrama','2025-12-02 18:12:06.219129',NULL,240,466,719),(1463,1,'activity',2,'Actividad \"Presentación\": Palabra \"OPORTUNIDAD\" correcta en anagrama','2025-12-02 18:12:22.447135',NULL,240,466,719),(1464,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-02 18:16:17.457955',NULL,240,466,720),(1465,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-02 18:16:53.903223',NULL,240,466,720),(1466,5,'activity',2,'Actividad \"Presentación\": Parte 1 completada','2025-12-02 18:18:34.239208',NULL,240,466,718),(1467,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-02 18:31:11.761453',NULL,240,466,720),(1468,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-02 18:31:16.296671',NULL,240,466,720),(1469,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-02 18:31:19.595956',NULL,240,466,720),(1470,5,'activity',2,'Actividad \"Presentación\": Preguntas del caos completadas','2025-12-02 18:37:22.260748',NULL,240,466,718),(1471,1,'activity',2,'Actividad \"Presentación\": Pregunta 3 de conocimiento general respondida correctamente','2025-12-02 18:39:44.113733',NULL,240,466,718),(1472,1,'activity',2,'Actividad \"Presentación\": Pregunta 5 de conocimiento general respondida correctamente','2025-12-02 18:42:38.882373',NULL,240,466,718),(1473,1,'activity',2,'Actividad \"Presentación\": Pregunta 9 de conocimiento general respondida correctamente','2025-12-02 18:44:41.666330',NULL,240,466,718),(1474,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-03 00:25:29.389214',NULL,239,467,716),(1475,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-03 00:25:32.455834',NULL,239,467,716),(1476,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-03 00:25:35.570093',NULL,239,467,716),(1477,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-03 00:25:37.702542',NULL,239,467,716),(1478,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-03 00:26:22.679791',NULL,239,467,716),(1479,5,'activity',2,'Actividad \"Presentación\": Parte 1 completada','2025-12-03 00:28:52.197677',NULL,239,467,717),(1480,5,'activity',2,'Actividad \"Presentación\": Preguntas del caos completadas','2025-12-03 00:29:26.270460',NULL,239,467,717),(1481,1,'activity',2,'Actividad \"Presentación\": Pregunta 3 de conocimiento general respondida correctamente','2025-12-03 00:29:42.967156',NULL,239,467,717),(1482,1,'activity',2,'Actividad \"Presentación\": Pregunta 3 de conocimiento general respondida correctamente','2025-12-03 00:29:42.967156',NULL,239,467,717),(1483,1,'activity',2,'Actividad \"Presentación\": Pregunta 20 de conocimiento general respondida correctamente','2025-12-03 00:30:00.133814',NULL,239,467,717),(1484,1,'activity',2,'Actividad \"Presentación\": Pregunta 5 de conocimiento general respondida correctamente','2025-12-03 00:30:00.153622',NULL,239,467,717),(1485,1,'activity',2,'Actividad \"Presentación\": Pregunta 9 de conocimiento general respondida correctamente','2025-12-03 00:30:00.164132',NULL,239,467,717),(1486,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-03 00:30:11.302292',NULL,239,467,715),(1487,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-03 00:30:13.051378',NULL,239,467,715),(1488,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-03 00:30:23.140552',NULL,239,467,715),(1489,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-03 00:30:26.445935',NULL,239,467,715),(1490,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-03 00:30:29.932541',NULL,239,467,715),(1491,1,'activity',2,'Actividad \"Presentación\": Palabra \"LIDERAZGO\" correcta en anagrama','2025-12-03 00:30:36.549471',NULL,239,467,715),(1492,5,'activity',188,'Bubble Map: 5 burbujas (5 preguntas + 0 respuestas)','2025-12-03 02:29:40.985148',NULL,239,468,717),(1493,5,'activity',189,'Bubble Map: 5 burbujas (5 preguntas + 0 respuestas)','2025-12-03 02:29:41.041312',NULL,239,468,715),(1494,5,'activity',187,'Bubble Map: 5 burbujas (5 preguntas + 0 respuestas)','2025-12-03 02:29:41.074321',NULL,239,468,716),(1495,3,'peer_evaluation',313,'Evaluación peer: Equipo Rojo → Equipo Azul','2025-12-03 05:38:11.267491',NULL,239,470,716),(1496,3,'peer_evaluation',314,'Evaluación peer: Equipo Verde → Equipo Azul','2025-12-03 05:48:44.792236',NULL,239,470,716),(1497,30,'peer_evaluation',315,'Evaluación peer: Equipo Rojo → Equipo Verde','2025-12-03 05:49:22.871011',NULL,239,470,715),(1498,30,'peer_evaluation',316,'Evaluación peer: Equipo Azul → Equipo Verde','2025-12-03 05:49:31.997009',NULL,239,470,715),(1499,15,'peer_evaluation',317,'Evaluación peer: Equipo Verde → Equipo Rojo','2025-12-03 05:50:23.318136',NULL,239,470,717),(1500,15,'peer_evaluation',318,'Evaluación peer: Equipo Azul → Equipo Rojo','2025-12-03 05:50:24.804691',NULL,239,470,717),(1501,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-03 07:07:39.305306',NULL,242,472,726),(1502,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-03 07:07:41.156083',NULL,242,472,726),(1503,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-03 07:07:45.109818',NULL,242,472,726),(1504,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-03 07:07:48.859994',NULL,242,472,726),(1505,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-03 07:12:12.344843',NULL,242,472,726),(1506,5,'activity',2,'Actividad \"Presentación\": Parte 1 completada','2025-12-03 07:12:22.359023',NULL,242,472,724),(1507,5,'activity',2,'Actividad \"Presentación\": Preguntas del caos completadas','2025-12-03 07:12:26.624592',NULL,242,472,724),(1508,1,'activity',2,'Actividad \"Presentación\": Pregunta 1 de conocimiento general respondida correctamente','2025-12-03 07:12:39.961007',NULL,242,472,724),(1509,1,'activity',2,'Actividad \"Presentación\": Pregunta 12 de conocimiento general respondida correctamente','2025-12-03 07:12:47.385278',NULL,242,472,724),(1510,1,'activity',2,'Actividad \"Presentación\": Pregunta 16 de conocimiento general respondida correctamente','2025-12-03 07:12:47.403397',NULL,242,472,724),(1511,1,'activity',2,'Actividad \"Presentación\": Pregunta 17 de conocimiento general respondida correctamente','2025-12-03 07:12:47.414021',NULL,242,472,724),(1512,1,'activity',2,'Actividad \"Presentación\": Pregunta 9 de conocimiento general respondida correctamente','2025-12-03 07:12:47.424913',NULL,242,472,724),(1513,5,'activity',2,'Actividad \"Presentación\": Parte 1 completada','2025-12-03 07:19:39.558604',NULL,242,472,725),(1514,5,'activity',2,'Actividad \"Presentación\": Preguntas del caos completadas','2025-12-03 07:19:45.085484',NULL,242,472,725),(1515,1,'activity',2,'Actividad \"Presentación\": Pregunta 15 de conocimiento general respondida correctamente','2025-12-03 07:19:50.110400',NULL,242,472,725),(1516,1,'activity',2,'Actividad \"Presentación\": Pregunta 15 de conocimiento general respondida correctamente','2025-12-03 07:19:50.115763',NULL,242,472,725),(1517,1,'activity',2,'Actividad \"Presentación\": Pregunta 17 de conocimiento general respondida correctamente','2025-12-03 07:20:04.207650',NULL,242,472,725),(1518,1,'activity',2,'Actividad \"Presentación\": Pregunta 17 de conocimiento general respondida correctamente','2025-12-03 07:20:04.213695',NULL,242,472,725),(1519,1,'activity',2,'Actividad \"Presentación\": Pregunta 3 de conocimiento general respondida correctamente','2025-12-03 07:20:09.900265',NULL,242,472,725),(1520,1,'activity',2,'Actividad \"Presentación\": Pregunta 3 de conocimiento general respondida correctamente','2025-12-03 07:20:09.906266',NULL,242,472,725),(1521,1,'activity',2,'Actividad \"Presentación\": Pregunta 11 de conocimiento general respondida correctamente','2025-12-03 07:20:15.526380',NULL,242,472,725),(1522,5,'activity',2,'Actividad \"Presentación\": Parte 1 completada','2025-12-03 14:33:21.949851',NULL,243,476,728),(1523,5,'activity',2,'Actividad \"Presentación\": Preguntas del caos completadas','2025-12-03 14:33:28.170156',NULL,243,476,728),(1524,1,'activity',2,'Actividad \"Presentación\": Pregunta 15 de conocimiento general respondida correctamente','2025-12-03 14:33:33.256910',NULL,243,476,728),(1525,1,'activity',2,'Actividad \"Presentación\": Pregunta 15 de conocimiento general respondida correctamente','2025-12-03 14:33:33.257829',NULL,243,476,728),(1526,1,'activity',2,'Actividad \"Presentación\": Pregunta 5 de conocimiento general respondida correctamente','2025-12-03 14:33:38.920770',NULL,243,476,728),(1527,1,'activity',2,'Actividad \"Presentación\": Pregunta 8 de conocimiento general respondida correctamente','2025-12-03 14:33:43.305788',NULL,243,476,728),(1528,1,'activity',2,'Actividad \"Presentación\": Pregunta 8 de conocimiento general respondida correctamente','2025-12-03 14:33:43.306217',NULL,243,476,728),(1529,1,'activity',2,'Actividad \"Presentación\": Pregunta 13 de conocimiento general respondida correctamente','2025-12-03 14:33:48.466406',NULL,243,476,728),(1530,1,'activity',2,'Actividad \"Presentación\": Pregunta 13 de conocimiento general respondida correctamente','2025-12-03 14:33:48.467631',NULL,243,476,728),(1531,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-03 14:34:03.440576',NULL,243,476,729),(1532,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-03 14:34:05.253356',NULL,243,476,729),(1533,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-03 14:34:12.700815',NULL,243,476,729),(1534,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-03 14:34:15.629391',NULL,243,476,729),(1535,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-03 14:34:21.498506',NULL,243,476,729),(1536,1,'activity',2,'Actividad \"Presentación\": Palabra \"OPORTUNIDAD\" correcta en anagrama','2025-12-03 14:34:29.065547',NULL,243,476,729),(1537,1,'activity',2,'Actividad \"Presentación\": Palabra \"VALORES\" correcta en anagrama','2025-12-03 14:34:36.851812',NULL,243,476,729),(1538,5,'activity',2,'Actividad \"Presentación\": Parte 1 completada','2025-12-03 14:34:44.389732',NULL,243,476,727),(1539,5,'activity',2,'Actividad \"Presentación\": Preguntas del caos completadas','2025-12-03 14:34:47.389898',NULL,243,476,727),(1540,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-03 17:44:18.993520',NULL,244,477,731),(1541,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-03 17:44:23.243212',NULL,244,477,731),(1542,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-03 17:44:31.028257',NULL,244,477,731),(1543,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-03 17:44:37.967960',NULL,244,477,731),(1544,1,'activity',2,'Actividad \"Presentación\": +1 palabra(s) encontrada(s) en sopa de letras','2025-12-03 17:44:43.395895',NULL,244,477,731),(1545,1,'activity',2,'Actividad \"Presentación\": Palabra \"APRENDIZAJE\" correcta en anagrama','2025-12-03 17:47:36.158852',NULL,244,477,731),(1546,1,'activity',2,'Actividad \"Presentación\": Palabra \"OBJETIVO\" correcta en anagrama','2025-12-03 17:50:30.483838',NULL,244,477,731),(1547,1,'activity',2,'Actividad \"Presentación\": Palabra \"COMUNICACION\" correcta en anagrama','2025-12-03 17:50:46.699707',NULL,244,477,731),(1548,1,'activity',2,'Actividad \"Presentación\": Palabra \"RIESGO\" correcta en anagrama','2025-12-03 17:50:55.802273',NULL,244,477,731),(1549,1,'activity',2,'Actividad \"Presentación\": Palabra \"ORGANIZACION\" correcta en anagrama','2025-12-03 17:51:18.239822',NULL,244,477,731),(1550,1,'activity',2,'Actividad \"Presentación\": Pregunta 1 de conocimiento general respondida correctamente','2025-12-03 17:51:29.646968',NULL,244,477,731),(1551,1,'activity',2,'Actividad \"Presentación\": Pregunta 1 de conocimiento general respondida correctamente','2025-12-03 17:51:29.647289',NULL,244,477,731),(1552,1,'activity',2,'Actividad \"Presentación\": Pregunta 3 de conocimiento general respondida correctamente','2025-12-03 17:52:22.260997',NULL,244,477,731),(1553,1,'activity',2,'Actividad \"Presentación\": Pregunta 17 de conocimiento general respondida correctamente','2025-12-03 17:52:28.865229',NULL,244,477,731),(1554,1,'activity',2,'Actividad \"Presentación\": Pregunta 6 de conocimiento general respondida correctamente','2025-12-03 17:52:28.879269',NULL,244,477,731),(1555,5,'activity',2,'Actividad \"Presentación\": Parte 1 completada','2025-12-03 17:52:33.074734',NULL,244,477,732),(1556,5,'activity',2,'Actividad \"Presentación\": Preguntas del caos completadas','2025-12-03 17:52:49.666411',NULL,244,477,732),(1557,1,'activity',2,'Actividad \"Presentación\": Pregunta 1 de conocimiento general respondida correctamente','2025-12-03 17:52:56.560377',NULL,244,477,732),(1558,5,'activity',2,'Actividad \"Presentación\": Parte 1 completada','2025-12-03 17:52:59.015303',NULL,244,477,730),(1559,5,'activity',2,'Actividad \"Presentación\": Preguntas del caos completadas','2025-12-03 17:53:06.200594',NULL,244,477,730);
/*!40000 ALTER TABLE `token_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `topic_selection_metrics`
--

DROP TABLE IF EXISTS `topic_selection_metrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `topic_selection_metrics` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `selection_count` int NOT NULL,
  `last_selected_at` datetime(6) DEFAULT NULL,
  `topic_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `topic_selection_metrics_topic_id_32a24333_uniq` (`topic_id`),
  CONSTRAINT `topic_selection_metrics_topic_id_32a24333_fk_topics_id` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `topic_selection_metrics`
--

LOCK TABLES `topic_selection_metrics` WRITE;
/*!40000 ALTER TABLE `topic_selection_metrics` DISABLE KEYS */;
INSERT INTO `topic_selection_metrics` VALUES (4,18,'2025-12-03 17:54:52.911680',1),(5,8,'2025-12-03 17:54:52.947067',2),(6,14,'2025-12-03 17:54:52.984139',3);
/*!40000 ALTER TABLE `topic_selection_metrics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `topics`
--

DROP TABLE IF EXISTS `topics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `topics` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `description` longtext,
  `image_url` varchar(500) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `icon` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `topics_is_acti_45fe00_idx` (`is_active`),
  KEY `topics_categor_7de43b_idx` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `topics`
--

LOCK TABLES `topics` WRITE;
/*!40000 ALTER TABLE `topics` DISABLE KEYS */;
INSERT INTO `topics` VALUES (1,'Salud','Temas relacionados con salud, bienestar y calidad de vida',NULL,'health',1,'2025-11-04 23:30:45.694000','2025-11-06 18:30:01.831000','?'),(2,'Educación','Temas relacionados con educación, formación y desarrollo de habilidades',NULL,'education',1,'2025-11-04 23:30:45.741000','2025-11-06 18:30:01.835000','?'),(3,'Sustentabilidad','Temas relacionados con sostenibilidad, medio ambiente y recursos naturales',NULL,'sustainability',1,'2025-11-04 23:30:45.775000','2025-11-06 18:30:01.835000','?');
/*!40000 ALTER TABLE `topics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `topics_faculties`
--

DROP TABLE IF EXISTS `topics_faculties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `topics_faculties` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `topic_id` bigint NOT NULL,
  `faculty_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `topics_faculties_topic_id_faculty_id_1e55427d_uniq` (`topic_id`,`faculty_id`),
  KEY `topics_faculties_faculty_id_c3ce4990_fk_faculties_id` (`faculty_id`),
  CONSTRAINT `topics_faculties_faculty_id_c3ce4990_fk_faculties_id` FOREIGN KEY (`faculty_id`) REFERENCES `faculties` (`id`),
  CONSTRAINT `topics_faculties_topic_id_b46cd624_fk_topics_id` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `topics_faculties`
--

LOCK TABLES `topics_faculties` WRITE;
/*!40000 ALTER TABLE `topics_faculties` DISABLE KEYS */;
INSERT INTO `topics_faculties` VALUES (1,1,1),(2,2,1),(3,3,1);
/*!40000 ALTER TABLE `topics_faculties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `word_search_options`
--

DROP TABLE IF EXISTS `word_search_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `word_search_options` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `words` json NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `activity_id` bigint NOT NULL,
  `grid` json DEFAULT NULL,
  `seed` int DEFAULT NULL,
  `word_positions` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `word_search_activit_21d157_idx` (`activity_id`,`is_active`),
  CONSTRAINT `word_search_options_activity_id_0d3f5a64_fk_activities_id` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `word_search_options`
--

LOCK TABLES `word_search_options` WRITE;
/*!40000 ALTER TABLE `word_search_options` DISABLE KEYS */;
INSERT INTO `word_search_options` VALUES (1,'Sopa de Letras 1','[\"IDEA\", \"META\", \"EQUIPO\", \"PITCH\", \"LIDER\"]',1,'2025-11-26 14:23:06.489580','2025-11-26 14:23:06.489580',2,'[[\"I\", \"E\", \"F\", \"G\", \"H\", \"I\", \"J\", \"K\", \"L\", \"M\", \"N\", \"P\"], [\"P\", \"D\", \"R\", \"S\", \"T\", \"U\", \"V\", \"W\", \"X\", \"Y\", \"I\", \"B\"], [\"C\", \"D\", \"E\", \"F\", \"G\", \"H\", \"I\", \"J\", \"K\", \"T\", \"M\", \"N\"], [\"O\", \"P\", \"Q\", \"A\", \"S\", \"T\", \"U\", \"V\", \"C\", \"X\", \"E\", \"Z\"], [\"A\", \"B\", \"C\", \"E\", \"E\", \"G\", \"H\", \"H\", \"J\", \"K\", \"T\", \"M\"], [\"N\", \"O\", \"P\", \"Q\", \"R\", \"Q\", \"T\", \"U\", \"V\", \"W\", \"A\", \"Y\"], [\"Z\", \"A\", \"B\", \"C\", \"D\", \"E\", \"U\", \"H\", \"I\", \"J\", \"K\", \"L\"], [\"M\", \"N\", \"O\", \"P\", \"Q\", \"R\", \"S\", \"I\", \"U\", \"V\", \"W\", \"X\"], [\"Y\", \"Z\", \"A\", \"B\", \"C\", \"D\", \"E\", \"F\", \"P\", \"I\", \"J\", \"K\"], [\"L\", \"I\", \"D\", \"E\", \"R\", \"Q\", \"R\", \"S\", \"T\", \"O\", \"V\", \"W\"], [\"X\", \"Y\", \"Z\", \"A\", \"B\", \"C\", \"D\", \"E\", \"F\", \"G\", \"H\", \"I\"], [\"K\", \"L\", \"M\", \"N\", \"O\", \"P\", \"Q\", \"R\", \"S\", \"T\", \"U\", \"V\"]]',955440,'[{\"word\": \"IDEA\", \"cells\": [{\"col\": 0, \"row\": 0}, {\"col\": 1, \"row\": 1}, {\"col\": 2, \"row\": 2}, {\"col\": 3, \"row\": 3}], \"direction\": \"diagonal\"}, {\"word\": \"EQUIPO\", \"cells\": [{\"col\": 4, \"row\": 4}, {\"col\": 5, \"row\": 5}, {\"col\": 6, \"row\": 6}, {\"col\": 7, \"row\": 7}, {\"col\": 8, \"row\": 8}, {\"col\": 9, \"row\": 9}], \"direction\": \"diagonal\"}, {\"word\": \"PITCH\", \"cells\": [{\"col\": 11, \"row\": 0}, {\"col\": 10, \"row\": 1}, {\"col\": 9, \"row\": 2}, {\"col\": 8, \"row\": 3}, {\"col\": 7, \"row\": 4}], \"direction\": \"diagonal\"}, {\"word\": \"META\", \"cells\": [{\"col\": 10, \"row\": 2}, {\"col\": 10, \"row\": 3}, {\"col\": 10, \"row\": 4}, {\"col\": 10, \"row\": 5}], \"direction\": \"vertical\"}, {\"word\": \"LIDER\", \"cells\": [{\"col\": 0, \"row\": 9}, {\"col\": 1, \"row\": 9}, {\"col\": 2, \"row\": 9}, {\"col\": 3, \"row\": 9}, {\"col\": 4, \"row\": 9}], \"direction\": \"horizontal\"}]'),(2,'Sopa de Letras 2','[\"NEGOCIO\", \"CLIENTE\", \"VENTA\", \"PRODUCTO\", \"MERCADO\"]',1,'2025-11-26 14:23:06.507805','2025-11-26 14:23:06.507805',2,'[[\"N\", \"J\", \"K\", \"L\", \"V\", \"E\", \"N\", \"T\", \"A\", \"R\", \"S\", \"P\"], [\"U\", \"E\", \"W\", \"X\", \"Y\", \"Z\", \"A\", \"B\", \"C\", \"D\", \"R\", \"G\"], [\"H\", \"I\", \"G\", \"K\", \"L\", \"M\", \"N\", \"O\", \"P\", \"O\", \"R\", \"S\"], [\"T\", \"U\", \"V\", \"O\", \"X\", \"Y\", \"Z\", \"A\", \"D\", \"C\", \"D\", \"E\"], [\"F\", \"G\", \"H\", \"J\", \"C\", \"L\", \"M\", \"U\", \"O\", \"P\", \"Q\", \"R\"], [\"S\", \"T\", \"U\", \"V\", \"W\", \"I\", \"C\", \"Z\", \"A\", \"B\", \"C\", \"D\"], [\"E\", \"F\", \"G\", \"H\", \"I\", \"T\", \"O\", \"M\", \"N\", \"O\", \"P\", \"Q\"], [\"R\", \"S\", \"T\", \"U\", \"O\", \"M\", \"E\", \"R\", \"C\", \"A\", \"D\", \"O\"], [\"D\", \"C\", \"L\", \"I\", \"E\", \"N\", \"T\", \"E\", \"L\", \"N\", \"O\", \"P\"], [\"Q\", \"R\", \"S\", \"T\", \"U\", \"V\", \"W\", \"X\", \"Y\", \"Z\", \"A\", \"B\"], [\"C\", \"D\", \"E\", \"F\", \"G\", \"H\", \"I\", \"J\", \"K\", \"L\", \"M\", \"N\"], [\"P\", \"Q\", \"R\", \"S\", \"T\", \"U\", \"V\", \"W\", \"X\", \"Y\", \"Z\", \"A\"]]',748174,'[{\"word\": \"NEGOCIO\", \"cells\": [{\"col\": 0, \"row\": 0}, {\"col\": 1, \"row\": 1}, {\"col\": 2, \"row\": 2}, {\"col\": 3, \"row\": 3}, {\"col\": 4, \"row\": 4}, {\"col\": 5, \"row\": 5}, {\"col\": 6, \"row\": 6}], \"direction\": \"diagonal\"}, {\"word\": \"PRODUCTO\", \"cells\": [{\"col\": 11, \"row\": 0}, {\"col\": 10, \"row\": 1}, {\"col\": 9, \"row\": 2}, {\"col\": 8, \"row\": 3}, {\"col\": 7, \"row\": 4}, {\"col\": 6, \"row\": 5}, {\"col\": 5, \"row\": 6}, {\"col\": 4, \"row\": 7}], \"direction\": \"diagonal\"}, {\"word\": \"CLIENTE\", \"cells\": [{\"col\": 1, \"row\": 8}, {\"col\": 2, \"row\": 8}, {\"col\": 3, \"row\": 8}, {\"col\": 4, \"row\": 8}, {\"col\": 5, \"row\": 8}, {\"col\": 6, \"row\": 8}, {\"col\": 7, \"row\": 8}], \"direction\": \"horizontal\"}, {\"word\": \"VENTA\", \"cells\": [{\"col\": 4, \"row\": 0}, {\"col\": 5, \"row\": 0}, {\"col\": 6, \"row\": 0}, {\"col\": 7, \"row\": 0}, {\"col\": 8, \"row\": 0}], \"direction\": \"horizontal\"}, {\"word\": \"MERCADO\", \"cells\": [{\"col\": 5, \"row\": 7}, {\"col\": 6, \"row\": 7}, {\"col\": 7, \"row\": 7}, {\"col\": 8, \"row\": 7}, {\"col\": 9, \"row\": 7}, {\"col\": 10, \"row\": 7}, {\"col\": 11, \"row\": 7}], \"direction\": \"horizontal\"}]'),(5,'Sopa de Letras 5','[\"LIDERAZGO\", \"MOTIVACION\", \"PASION\", \"VISION\", \"MISION\"]',1,'2025-11-26 14:23:06.525124','2025-11-26 14:23:06.525124',2,'[[\"L\", \"C\", \"D\", \"E\", \"F\", \"G\", \"H\", \"I\", \"J\", \"K\", \"L\", \"V\"], [\"N\", \"I\", \"P\", \"Q\", \"R\", \"S\", \"T\", \"U\", \"P\", \"W\", \"I\", \"Y\"], [\"Z\", \"B\", \"D\", \"D\", \"E\", \"F\", \"G\", \"A\", \"I\", \"S\", \"K\", \"L\"], [\"M\", \"N\", \"O\", \"E\", \"Q\", \"R\", \"S\", \"T\", \"I\", \"V\", \"W\", \"X\"], [\"Y\", \"Z\", \"A\", \"B\", \"R\", \"I\", \"F\", \"O\", \"H\", \"I\", \"J\", \"K\"], [\"L\", \"M\", \"N\", \"O\", \"O\", \"A\", \"N\", \"S\", \"T\", \"U\", \"V\", \"W\"], [\"X\", \"Y\", \"Z\", \"N\", \"B\", \"C\", \"Z\", \"F\", \"G\", \"H\", \"I\", \"J\"], [\"K\", \"L\", \"M\", \"N\", \"O\", \"P\", \"Q\", \"G\", \"S\", \"T\", \"U\", \"V\"], [\"M\", \"O\", \"T\", \"I\", \"V\", \"A\", \"C\", \"I\", \"O\", \"N\", \"H\", \"I\"], [\"J\", \"K\", \"L\", \"M\", \"N\", \"O\", \"P\", \"Q\", \"R\", \"S\", \"T\", \"U\"], [\"V\", \"W\", \"X\", \"Y\", \"Z\", \"A\", \"B\", \"C\", \"D\", \"E\", \"F\", \"G\"], [\"H\", \"I\", \"K\", \"L\", \"M\", \"I\", \"S\", \"I\", \"O\", \"N\", \"S\", \"T\"]]',307190,'[{\"word\": \"LIDERAZGO\", \"cells\": [{\"col\": 0, \"row\": 0}, {\"col\": 1, \"row\": 1}, {\"col\": 2, \"row\": 2}, {\"col\": 3, \"row\": 3}, {\"col\": 4, \"row\": 4}, {\"col\": 5, \"row\": 5}, {\"col\": 6, \"row\": 6}, {\"col\": 7, \"row\": 7}, {\"col\": 8, \"row\": 8}], \"direction\": \"diagonal\"}, {\"word\": \"VISION\", \"cells\": [{\"col\": 11, \"row\": 0}, {\"col\": 10, \"row\": 1}, {\"col\": 9, \"row\": 2}, {\"col\": 8, \"row\": 3}, {\"col\": 7, \"row\": 4}, {\"col\": 6, \"row\": 5}], \"direction\": \"diagonal\"}, {\"word\": \"MOTIVACION\", \"cells\": [{\"col\": 0, \"row\": 8}, {\"col\": 1, \"row\": 8}, {\"col\": 2, \"row\": 8}, {\"col\": 3, \"row\": 8}, {\"col\": 4, \"row\": 8}, {\"col\": 5, \"row\": 8}, {\"col\": 6, \"row\": 8}, {\"col\": 7, \"row\": 8}, {\"col\": 8, \"row\": 8}, {\"col\": 9, \"row\": 8}], \"direction\": \"horizontal\"}, {\"word\": \"PASION\", \"cells\": [{\"col\": 8, \"row\": 1}, {\"col\": 7, \"row\": 2}, {\"col\": 6, \"row\": 3}, {\"col\": 5, \"row\": 4}, {\"col\": 4, \"row\": 5}, {\"col\": 3, \"row\": 6}], \"direction\": \"diagonal\"}, {\"word\": \"MISION\", \"cells\": [{\"col\": 4, \"row\": 11}, {\"col\": 5, \"row\": 11}, {\"col\": 6, \"row\": 11}, {\"col\": 7, \"row\": 11}, {\"col\": 8, \"row\": 11}, {\"col\": 9, \"row\": 11}], \"direction\": \"horizontal\"}]'),(17,'daniela','[\"LOCURA\", \"KALI\", \"BOBBY\", \"ROCKY\", \"PRINCESA\"]',1,'2025-12-03 17:46:04.500799','2025-12-03 17:46:04.500823',2,'[[\"E\", \"F\", \"G\", \"H\", \"P\", \"R\", \"I\", \"N\", \"C\", \"E\", \"S\", \"A\"], [\"Q\", \"R\", \"S\", \"T\", \"L\", \"V\", \"W\", \"X\", \"Y\", \"K\", \"B\", \"C\"], [\"D\", \"E\", \"F\", \"G\", \"H\", \"O\", \"J\", \"K\", \"A\", \"M\", \"N\", \"O\"], [\"P\", \"Q\", \"R\", \"S\", \"T\", \"U\", \"C\", \"L\", \"X\", \"Y\", \"Z\", \"A\"], [\"B\", \"C\", \"E\", \"F\", \"G\", \"H\", \"I\", \"U\", \"K\", \"L\", \"M\", \"N\"], [\"O\", \"P\", \"Q\", \"R\", \"S\", \"T\", \"U\", \"V\", \"R\", \"X\", \"Y\", \"Z\"], [\"A\", \"B\", \"C\", \"D\", \"O\", \"G\", \"H\", \"I\", \"J\", \"A\", \"L\", \"M\"], [\"N\", \"O\", \"P\", \"Q\", \"R\", \"C\", \"T\", \"U\", \"V\", \"W\", \"X\", \"Y\"], [\"Z\", \"A\", \"B\", \"C\", \"D\", \"E\", \"K\", \"G\", \"I\", \"J\", \"K\", \"L\"], [\"M\", \"N\", \"O\", \"P\", \"Q\", \"R\", \"S\", \"Y\", \"U\", \"V\", \"W\", \"X\"], [\"Y\", \"Z\", \"A\", \"B\", \"C\", \"D\", \"E\", \"F\", \"G\", \"H\", \"I\", \"J\"], [\"B\", \"O\", \"B\", \"B\", \"Y\", \"Q\", \"R\", \"S\", \"T\", \"U\", \"V\", \"W\"]]',526578,'[{\"word\": \"LOCURA\", \"cells\": [{\"col\": 4, \"row\": 1}, {\"col\": 5, \"row\": 2}, {\"col\": 6, \"row\": 3}, {\"col\": 7, \"row\": 4}, {\"col\": 8, \"row\": 5}, {\"col\": 9, \"row\": 6}], \"direction\": \"diagonal\"}, {\"word\": \"KALI\", \"cells\": [{\"col\": 9, \"row\": 1}, {\"col\": 8, \"row\": 2}, {\"col\": 7, \"row\": 3}, {\"col\": 6, \"row\": 4}], \"direction\": \"diagonal\"}, {\"word\": \"BOBBY\", \"cells\": [{\"col\": 0, \"row\": 11}, {\"col\": 1, \"row\": 11}, {\"col\": 2, \"row\": 11}, {\"col\": 3, \"row\": 11}, {\"col\": 4, \"row\": 11}], \"direction\": \"horizontal\"}, {\"word\": \"ROCKY\", \"cells\": [{\"col\": 3, \"row\": 5}, {\"col\": 4, \"row\": 6}, {\"col\": 5, \"row\": 7}, {\"col\": 6, \"row\": 8}, {\"col\": 7, \"row\": 9}], \"direction\": \"diagonal\"}, {\"word\": \"PRINCESA\", \"cells\": [{\"col\": 4, \"row\": 0}, {\"col\": 5, \"row\": 0}, {\"col\": 6, \"row\": 0}, {\"col\": 7, \"row\": 0}, {\"col\": 8, \"row\": 0}, {\"col\": 9, \"row\": 0}, {\"col\": 10, \"row\": 0}, {\"col\": 11, \"row\": 0}], \"direction\": \"horizontal\"}]');
/*!40000 ALTER TABLE `word_search_options` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-03 16:09:35
