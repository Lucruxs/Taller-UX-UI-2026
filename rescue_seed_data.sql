-- =============================================================================
-- SCRIPT DE RESCATE DE DATOS — Misión Emprende
-- Fuente: Dump20251203 (1).sql
-- Destino: base de datos actual (Dump20260415)
-- Generado: 2026-04-15
--
-- ORDEN DE INSERCIÓN (respeta FKs):
--   1. activity_types      (sin dependencias)
--   2. stages              (sin dependencias)
--   3. activities          (→ activity_types, stages)
--   4. topics              (sin dependencias)
--   5. topics_faculties    (→ topics, faculties)
--   6. challenges          (→ topics)
--   7. anagram_words       (sin dependencias)
--   8. chaos_questions     (sin dependencias)
--   9. general_knowledge_questions (sin dependencias)
--  10. word_search_options (→ activities)
--
-- SEGURIDAD: Se usa INSERT IGNORE para saltar duplicados silenciosamente.
-- Ejecutar dentro de una transacción para poder hacer rollback si algo falla.
-- =============================================================================

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

START TRANSACTION;

-- -----------------------------------------------------------------------------
-- 1. activity_types
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `activity_types`
  (`id`, `code`, `name`, `description`, `is_active`, `created_at`, `updated_at`)
VALUES
  (1,'personalizacion','Personalización','Actividad de personalización de equipos',1,'2025-11-04 03:58:18.177000','2025-11-04 16:03:58.072000'),
  (2,'minijuego','Minijuego','Actividades de minijuegos y presentación',1,'2025-11-04 16:03:58.097000','2025-11-04 16:03:58.097000'),
  (3,'','Interactiva','Actividad interactiva',1,'2025-11-04 23:19:09.732000','2025-11-04 23:19:09.732000'),
  (4,'prototipo','Subida de Prototipo','Actividad para subir imagen del prototipo físico construido',1,'2025-11-05 02:28:51.612000','2025-11-05 02:28:51.612000'),
  (5,'formulario_pitch','Formulario de Pitch','Actividad para completar el formulario del pitch con intro-problema, solución y cierre',1,'2025-11-05 05:28:59.078000','2025-11-05 05:28:59.078000'),
  (6,'presentacion_pitch','Presentación del Pitch','Actividad para presentar el pitch y evaluar a otros equipos',1,'2025-11-05 05:28:59.089000','2025-11-05 05:28:59.089000'),
  (7,'instructivo','Instructivo','Instructivo del juego',1,'2025-12-01 21:09:26.521551','2025-12-01 21:09:26.521551'),
  (8,'video_institucional','Video Institucional','Video institucional de la universidad',1,'2025-12-01 21:30:26.175703','2025-12-01 21:30:26.175703');

-- -----------------------------------------------------------------------------
-- 2. stages
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `stages`
  (`id`, `number`, `name`, `description`, `objective`, `estimated_duration`, `is_active`, `created_at`, `updated_at`)
VALUES
  (1,1,'Trabajo en Equipo','Primera etapa del juego enfocada en trabajo colaborativo','Fomentar el trabajo en equipo y la colaboración',60,1,'2025-11-04 03:58:18.791000','2025-11-04 16:03:58.080000'),
  (2,2,'Empatía','Conocer problemas y abordar un caso o desafío',NULL,30,1,'2025-11-04 23:18:44.809000','2025-11-04 23:18:44.809000'),
  (3,3,'Creatividad','Tercera etapa del juego enfocada en la creatividad y construcción de prototipos','Crear una solución con legos',30,1,'2025-11-05 02:28:51.625000','2025-11-05 02:28:51.625000'),
  (4,4,'Comunicación','Cuarta etapa del juego enfocada en la comunicación y presentación del pitch','Crear y comunicar pitch',45,1,'2025-11-05 05:28:59.097000','2025-11-05 05:28:59.097000');

-- -----------------------------------------------------------------------------
-- 3. activities  (depende de: activity_types, stages)
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `activities`
  (`id`, `name`, `description`, `order_number`, `timer_duration`, `config_data`, `is_active`, `created_at`, `updated_at`, `activity_type_id`, `stage_id`)
VALUES
  (1,'Personalización','Los equipos personalizan su nombre e indican si se conocen',3,180,NULL,1,'2025-11-04 03:58:18.797000','2025-12-01 21:46:01.908137',1,1),
  (2,'Presentación','Minijuego de anagramas: adivina las palabras desordenadas (3 palabras, 5 tokens cada una = 15 tokens total)',4,480,'{"type": "anagram", "words": [{"word": "emprender", "anagram": "eprdenemr"}, {"word": "innovacion", "anagram": "ooivanicnn"}, {"word": "creatividad", "anagram": "edavitiacrd"}], "total_tokens": 15, "words_per_game": 3, "tokens_per_word": 5}',1,'2025-11-04 16:03:58.105000','2025-12-01 21:46:01.923426',2,1),
  (3,'Seleccionar Tema','Elige un tema de interés relacionado con tu facultad',1,160,NULL,1,'2025-11-04 23:19:09.746000','2025-11-07 14:28:30.822001',3,2),
  (4,'Ver el Desafío','Lee y analiza el desafío asociado a tu tema',2,160,NULL,1,'2025-11-04 23:19:09.755000','2025-11-07 14:28:43.478728',3,2),
  (5,'Bubble Map','Crea un mapa mental con ideas y conceptos relacionados al desafío',3,480,NULL,1,'2025-11-04 23:19:09.756000','2025-11-07 14:28:58.964030',3,2),
  (6,'Subida de Prototipo Lego','Los equipos construyen físicamente un prototipo con legos y suben una foto del resultado',1,600,NULL,1,'2025-11-05 02:28:51.637000','2025-11-07 14:29:11.498568',4,3),
  (7,'Formulario de Pitch','Los equipos completan un formulario estructurado para crear el pitch: intro-problema (etapa 2), solución (etapa 3) y cierre',1,360,NULL,1,'2025-11-05 05:28:59.108000','2025-11-07 14:29:29.883250',5,4),
  (8,'Presentación del Pitch','Los equipos presentan su pitch siguiendo un orden de presentación. Después de cada presentación, los otros equipos pueden evaluar.',2,800,NULL,1,'2025-11-05 05:28:59.120000','2025-11-07 14:29:46.273248',6,4),
  (15,'Instructivo','Instructivo del juego - Instrucciones para los estudiantes',2,NULL,NULL,1,'2025-12-01 21:46:01.940058','2025-12-01 21:46:01.940058',7,1);

-- -----------------------------------------------------------------------------
-- 4. topics
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `topics`
  (`id`, `name`, `description`, `image_url`, `category`, `is_active`, `created_at`, `updated_at`, `icon`)
VALUES
  (1,'Salud','Temas relacionados con salud, bienestar y calidad de vida',NULL,'health',1,'2025-11-04 23:30:45.694000','2025-11-06 18:30:01.831000','🏥'),
  (2,'Educación','Temas relacionados con educación, formación y desarrollo de habilidades',NULL,'education',1,'2025-11-04 23:30:45.741000','2025-11-06 18:30:01.835000','📚'),
  (3,'Sustentabilidad','Temas relacionados con sostenibilidad, medio ambiente y recursos naturales',NULL,'sustainability',1,'2025-11-04 23:30:45.775000','2025-11-06 18:30:01.835000','🌱');

-- -----------------------------------------------------------------------------
-- 5. topics_faculties  (depende de: topics, faculties)
--    NOTA: asume que faculty_id=1 existe en la tabla faculties de tu BD actual.
--    Si tu BD tiene IDs de faculties distintos, ajusta estos valores.
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `topics_faculties`
  (`id`, `topic_id`, `faculty_id`)
VALUES
  (1,1,1),
  (2,2,1),
  (3,3,1);

-- -----------------------------------------------------------------------------
-- 6. challenges  (depende de: topics)
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `challenges`
  (`id`, `title`, `difficulty_level`, `learning_objectives`, `additional_resources`, `is_active`, `created_at`, `updated_at`, `topic_id`, `icon`, `persona_age`, `persona_name`, `persona_story`, `description`, `persona_image`)
VALUES
  (1,'Autogestión de tratamientos','medium','','',1,'2025-11-04 23:30:45.718000','2025-11-17 08:07:58.153589',1,'🏥',50,'Humberto','Fue dado de alta con indicaciones médicas complejas, pero no entendió qué debía seguir tomando ni a quién acudir si se sentía mal.','Muchos errores médicos y complicaciones surgen al cambiar de un centro de salud a otro, por falta de continuidad y seguimiento personalizado.','personas/perfil-ia-1763366872037.png'),
  (2,'Obesidad','medium','','',1,'2025-11-04 23:30:45.727000','2025-11-17 08:03:35.132286',1,'⚖️',27,'Simona','Tiene una hija pequeña y trabaja tiempo completo. Sabe que la alimentación es clave, pero no ha podido organizar ni aprender a darle una nutrición buena a su hija.','Más de un 70% de la población en Chile presenta sobrepeso u obesidad (MINSAL). Esta situación se debe múltiples factores, entre ellos la falta de ejercicio y educación nutricional, disponibilidad de productos ultraprocesados y la desinformación.','personas/perfil-ia-1763366608710.png'),
  (3,'Envejecimiento activo','medium','','',1,'2025-11-04 23:30:45.734000','2025-11-17 07:55:32.568298',1,'👴',72,'Juana','Vive sola desde que sus hijos se independizaron. Le gustaría mantenerse activa, pero no conoce programas accesibles que la motiven a hacer ejercicio, socializar y prevenir enfermedades.','La población chilena está envejeciendo rápidamente y muchos adultos mayores enfrentan soledad, pérdida de movilidad y falta de programas de prevención.','personas/persona-profile_6.jpg'),
  (4,'Educación financiera accesible','medium','','',1,'2025-11-04 23:30:45.753000','2025-11-17 07:53:31.801716',2,'💰',22,'Martina','Joven emprendedora de 22 años, vende productos por redes sociales. Aunque gana dinero, no sabe cómo organizarlo ni cuánto debe ahorrar o invertir, lo que lo mantiene en constante inestabilidad.','La ausencia de educación financiera en realidades económicas inestables dificulta la planificación y el uso responsable del dinero.','personas/persona-profile_5.jpg'),
  (5,'Inicio de vida laboral','medium','','',1,'2025-11-04 23:30:45.760000','2025-11-17 07:51:08.129717',2,'💼',23,'Andrés','Acaba de egresar de odontología. Le preocupa no poder trabajar pronto, pero ninguna clínica lo ha llamado porque no tiene experiencia previa.','Muchos estudiantes recién titulados enfrentan barreras para conseguir su primer empleo, ya que se les exige experiencia previa que aún no han podido adquirir.','personas/persona-profile_4.jpg'),
  (6,'Tecnología adultos mayores','medium','','',1,'2025-11-04 23:30:45.766000','2025-11-17 07:47:53.283466',2,'📱',70,'Osvaldo','Es un adulto mayor de 70 años y debe pedir ayuda a sus hijos o nietos cada vez que debe hacer tramites.','El avance tecnológico en los últimos años ha sido incremental. Esto ha beneficiado a múltiples sectores, sin embargo el conocimiento y adaptación para los adultos mayores ha sido una gran dificultad.','personas/persona-profile_3.jpg'),
  (7,'Contaminación por fast fashion','medium','','',1,'2025-11-04 23:30:45.791000','2025-11-17 07:46:31.242909',3,'👗',18,'Gabriela','Estudiante de 18 años que vive cerca de esta zona y debe pasar a diario por lugares con desagradables olores.','La moda rápida ha traído graves consecuencias al medio ambiente. Especialmente en sectores del norte de Chile en donde los vertederos y basurales están afectando el diario vivir de las personas.','personas/persona-profile_2.jpg'),
  (8,'Acceso al agua en la agricultura','medium','','',1,'2025-11-04 23:30:45.798000','2025-11-17 07:44:09.892309',3,'💧',50,'Camila','Agricultora de 50 años que cultiva paltas de exportación, ella está complicada de perder su negocio por la cantidad de agua que debe utilizar.','El agua dulce es un recurso natural fundamental para la vida. Hay zonas rurales en que el agua se ha hecho escasa.','personas/persona-profile_1.jpg'),
  (9,'Gestión de residuos electrónicos','medium','','',1,'2025-11-04 23:30:45.804000','2025-11-17 07:41:19.185456',3,'♻️',29,'Francisco','Cambió su celular y computador el año pasado, pero no sabe dónde llevar los antiguos dispositivos. Terminó guardándolos en un cajón, como millones de personas que desconocen alternativas de reciclaje.','El aumento del consumo tecnológico ha generado toneladas de desechos electrónicos difíciles de reciclar.','personas/persona-profile.jpg');

-- -----------------------------------------------------------------------------
-- 7. anagram_words
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `anagram_words`
  (`id`, `word`, `scrambled_word`, `is_active`, `created_at`, `updated_at`)
VALUES
  (1,'EMPRENDIMIENTO','MEIEDNTREINMOP',1,'2025-11-26 14:17:12.882500','2025-11-26 14:17:12.892739'),
  (2,'INNOVACION','CNIONIAVON',1,'2025-11-26 14:17:12.901740','2025-11-26 14:17:12.906922'),
  (3,'CREATIVIDAD','DCDARIVTIEA',1,'2025-11-26 14:17:12.913096','2025-11-26 14:17:12.917096'),
  (4,'LIDERAZGO','ODZIGREAL',1,'2025-11-26 14:17:12.922281','2025-11-26 14:17:12.926277'),
  (5,'EQUIPO','PIQOUE',1,'2025-11-26 14:17:12.930279','2025-11-26 14:17:12.934521'),
  (6,'NEGOCIO','GCONEIO',1,'2025-11-26 14:17:12.938525','2025-11-26 14:17:12.942684'),
  (7,'CLIENTE','NILTECE',1,'2025-11-26 14:17:12.947682','2025-11-26 14:17:12.951685'),
  (8,'PRODUCTO','TUOCROPD',1,'2025-11-26 14:17:12.957865','2025-11-26 14:17:12.961865'),
  (9,'VENTA','TENVA',1,'2025-11-26 14:17:12.966099','2025-11-26 14:17:12.970099'),
  (10,'MARKETING','EGRMIAKNT',1,'2025-11-26 14:17:12.974290','2025-11-26 14:17:12.978290'),
  (11,'ESTRATEGIA','ATIEEAGSRT',1,'2025-11-26 14:17:12.983454','2025-11-26 14:17:12.987456'),
  (12,'PLANIFICACION','FNNPOICCAILAI',1,'2025-11-26 14:17:12.992455','2025-11-26 14:17:12.996459'),
  (13,'OBJETIVO','VIOBEJTO',1,'2025-11-26 14:17:13.002454','2025-11-26 14:17:13.006110'),
  (14,'META','ETAM',1,'2025-11-26 14:17:13.012458','2025-11-26 14:17:13.016457'),
  (15,'RESULTADO','TRUDLESOA',1,'2025-11-26 14:17:13.021455','2025-11-26 14:17:13.024717'),
  (16,'COMPETENCIA','TIEAEMOCCNP',1,'2025-11-26 14:17:13.029717','2025-11-26 14:17:13.033311'),
  (17,'MERCADO','DEROMAC',1,'2025-11-26 14:17:13.038304','2025-11-26 14:17:13.042486'),
  (18,'OPORTUNIDAD','DRNOIPOTUDA',1,'2025-11-26 14:17:13.048486','2025-11-26 14:17:13.053688'),
  (19,'RIESGO','RSOEIG',1,'2025-11-26 14:17:13.058687','2025-11-26 14:17:13.063091'),
  (20,'EXITO','IETXO',1,'2025-11-26 14:17:13.069093','2025-11-26 14:17:13.073520'),
  (21,'FRACASO','FASCARO',1,'2025-11-26 14:17:13.078518','2025-11-26 14:17:13.082521'),
  (22,'APRENDIZAJE','RZANPEEJIDA',1,'2025-11-26 14:17:13.087534','2025-11-26 14:17:13.091968'),
  (23,'EXPERIENCIA','REAEXINCIPE',1,'2025-11-26 14:17:13.096968','2025-11-26 14:17:13.101971'),
  (24,'CONOCIMIENTO','NMCIOIONEOTC',1,'2025-11-26 14:17:13.106967','2025-11-26 14:17:13.110966'),
  (25,'HABILIDAD','AAILDHIDB',1,'2025-11-26 14:17:13.115172','2025-11-26 14:17:13.120172'),
  (26,'COMUNICACION','OMUICCNAINOC',1,'2025-11-26 14:17:13.124384','2025-11-26 14:17:13.128387'),
  (27,'COLABORACION','BROAAIOLCNCO',1,'2025-11-26 14:17:13.132791','2025-11-26 14:17:13.136785'),
  (28,'TRABAJO','JARTBAO',1,'2025-11-26 14:17:13.141785','2025-11-26 14:17:13.146136'),
  (29,'PROYECTO','CEORTYOP',1,'2025-11-26 14:17:13.150134','2025-11-26 14:17:13.154284'),
  (30,'SOLUCION','NLOUICSO',1,'2025-11-26 14:17:13.158285','2025-11-26 14:17:13.162432'),
  (31,'PROBLEMA','AMORLPBE',1,'2025-11-26 14:17:13.166441','2025-11-26 14:17:13.170443'),
  (32,'DESAFIO','DSEIOAF',1,'2025-11-26 14:17:13.174766','2025-11-26 14:17:13.178766'),
  (33,'RETO','REOT',1,'2025-11-26 14:17:13.183295','2025-11-26 14:17:13.187296'),
  (34,'MOTIVACION','TIIOOCMNAV',1,'2025-11-26 14:17:13.192457','2025-11-26 14:17:13.197459'),
  (35,'PASION','ISNAOP',1,'2025-11-26 14:17:13.201462','2025-11-26 14:17:13.206653'),
  (36,'VISION','NSIOVI',1,'2025-11-26 14:17:13.210653','2025-11-26 14:17:13.214651'),
  (37,'MISION','IISOMN',1,'2025-11-26 14:17:13.219654','2025-11-26 14:17:13.223651'),
  (38,'VALORES','ERSOLAV',1,'2025-11-26 14:17:13.228652','2025-11-26 14:17:13.232654'),
  (39,'CULTURA','LARCTUU',1,'2025-11-26 14:17:13.237654','2025-11-26 14:17:13.241652'),
  (40,'ORGANIZACION','ONCIANZAORGI',1,'2025-11-26 14:17:13.246653','2025-11-26 14:17:13.250654'),
  (41,'ADMINISTRACION','AMIOTNDNACIISR',1,'2025-11-26 14:17:13.255653','2025-11-26 14:17:13.258656'),
  (42,'GESTION','TNEISGO',1,'2025-11-26 14:17:13.263654','2025-11-26 14:17:13.267652'),
  (43,'DIRECCION','CRDCEOINI',1,'2025-11-26 14:17:13.272652','2025-11-26 14:17:13.276656'),
  (44,'SUPERVISION','SSINURIPVEO',1,'2025-11-26 14:17:13.281654','2025-11-26 14:17:13.285657'),
  (45,'COORDINACION','OODOINCIARNC',1,'2025-11-26 14:17:13.290653','2025-11-26 14:17:13.294651'),
  (46,'EJECUCION','UCNJEIOCE',1,'2025-11-26 14:17:13.299657','2025-11-26 14:17:13.303653'),
  (47,'EVALUACION','ACVNILAEUO',1,'2025-11-26 14:17:13.307654','2025-11-26 14:17:13.311654'),
  (48,'MEJORA','RMAOJE',1,'2025-11-26 14:17:13.316652','2025-11-26 14:17:13.319657'),
  (49,'OPTIMIZACION','ONCZPTIOIMAI',1,'2025-11-26 14:17:13.324651','2025-11-26 14:17:13.328654'),
  (50,'CAMALEON','OECMALNA',1,'2025-11-29 18:47:13.466192','2025-11-29 18:47:13.466192');

-- -----------------------------------------------------------------------------
-- 8. chaos_questions
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `chaos_questions`
  (`id`, `question`, `is_active`, `created_at`, `updated_at`)
VALUES
  (1,'¿Cuál es tu mayor miedo al emprender?',1,'2025-11-26 14:17:13.336652','2025-11-26 14:17:13.336652'),
  (2,'¿Qué te motiva más en la vida?',1,'2025-11-26 14:17:13.341654','2025-11-26 14:17:13.341654'),
  (3,'¿Cuál es tu superpoder oculto?',1,'2025-11-26 14:17:13.346653','2025-11-26 14:17:13.346653'),
  (4,'¿Qué harías si tuvieras un millón de dólares?',1,'2025-11-26 14:17:13.351653','2025-11-26 14:17:13.351653'),
  (5,'¿Cuál es tu comida favorita?',1,'2025-11-26 14:17:13.354901','2025-11-26 14:17:13.355899'),
  (6,'¿Qué animal te representa mejor y por qué?',1,'2025-11-26 14:17:13.359902','2025-11-26 14:17:13.359902'),
  (7,'¿Cuál es tu película favorita?',1,'2025-11-26 14:17:13.364085','2025-11-26 14:17:13.364085'),
  (8,'¿Qué lugar del mundo te gustaría visitar?',1,'2025-11-26 14:17:13.368086','2025-11-26 14:17:13.368086'),
  (9,'¿Cuál es tu hobby favorito?',1,'2025-11-26 14:17:13.372311','2025-11-26 14:17:13.372311'),
  (10,'¿Qué te hace reír?',1,'2025-11-26 14:17:13.376312','2025-11-26 14:17:13.376312'),
  (11,'¿Cuál es tu mayor fortaleza?',1,'2025-11-26 14:17:13.379306','2025-11-26 14:17:13.379306'),
  (12,'¿Qué te gustaría aprender?',1,'2025-11-26 14:17:13.383486','2025-11-26 14:17:13.383486'),
  (13,'¿Cuál es tu sueño más grande?',1,'2025-11-26 14:17:13.387641','2025-11-26 14:17:13.387641'),
  (14,'¿Qué te inspira?',1,'2025-11-26 14:17:13.391644','2025-11-26 14:17:13.391644'),
  (15,'¿Cuál es tu canción favorita?',1,'2025-11-26 14:17:13.395644','2025-11-26 14:17:13.395644'),
  (16,'¿Qué te relaja?',1,'2025-11-26 14:17:13.400643','2025-11-26 14:17:13.400643'),
  (17,'¿Cuál es tu libro favorito?',1,'2025-11-26 14:17:13.404644','2025-11-26 14:17:13.404644'),
  (18,'¿Qué te enoja?',1,'2025-11-26 14:17:13.408645','2025-11-26 14:17:13.408645'),
  (19,'¿Cuál es tu mayor logro?',1,'2025-11-26 14:17:13.412641','2025-11-26 14:17:13.412641'),
  (20,'¿Qué te da miedo?',1,'2025-11-26 14:17:13.416641','2025-11-26 14:17:13.416641'),
  (21,'¿Cuál es tu color favorito?',1,'2025-11-26 14:17:13.420640','2025-11-26 14:17:13.420640'),
  (22,'¿Qué te hace feliz?',1,'2025-11-26 14:17:13.424641','2025-11-26 14:17:13.424641'),
  (23,'¿Cuál es tu estación del año favorita?',1,'2025-11-26 14:17:13.428643','2025-11-26 14:17:13.428643'),
  (24,'¿Qué te sorprende?',1,'2025-11-26 14:17:13.433650','2025-11-26 14:17:13.433650'),
  (25,'¿Cuál es tu deporte favorito?',1,'2025-11-26 14:17:13.437644','2025-11-26 14:17:13.437644'),
  (26,'¿Qué te emociona?',1,'2025-11-26 14:17:13.442643','2025-11-26 14:17:13.442643'),
  (27,'¿Cuál es tu serie favorita?',1,'2025-11-26 14:17:13.446854','2025-11-26 14:17:13.446854'),
  (28,'¿Qué te frustra?',1,'2025-11-26 14:17:13.450851','2025-11-26 14:17:13.450851'),
  (29,'¿Cuál es tu juego favorito?',1,'2025-11-26 14:17:13.455013','2025-11-26 14:17:13.455013'),
  (30,'¿Qué te apasiona?',1,'2025-11-26 14:17:13.460011','2025-11-26 14:17:13.460011'),
  (31,'¿Tienes mascotas?',1,'2025-11-29 18:48:01.324585','2025-11-29 18:48:01.324585');

-- -----------------------------------------------------------------------------
-- 9. general_knowledge_questions
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `general_knowledge_questions`
  (`id`, `question`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_answer`, `is_active`, `created_at`, `updated_at`)
VALUES
  (1,'¿Cuál es la capital de Francia?','Londres','París','Madrid','Roma',1,1,'2025-11-26 14:17:13.468245','2025-11-26 14:17:13.468245'),
  (2,'¿En qué año llegó el hombre a la Luna?','1965','1969','1972','1975',1,1,'2025-11-26 14:17:13.473535','2025-11-26 14:17:13.473535'),
  (3,'¿Cuál es el océano más grande del mundo?','Atlántico','Índico','Pacífico','Ártico',2,1,'2025-11-26 14:17:13.479535','2025-11-26 14:17:13.479535'),
  (4,'¿Quién pintó la Mona Lisa?','Picasso','Van Gogh','Leonardo da Vinci','Miguel Ángel',2,1,'2025-11-26 14:17:13.484767','2025-11-26 14:17:13.484767'),
  (5,'¿Cuál es el planeta más cercano al Sol?','Venus','Tierra','Mercurio','Marte',2,1,'2025-11-26 14:17:13.488731','2025-11-26 14:17:13.488731'),
  (6,'¿Cuántos continentes hay en el mundo?','5','6','7','8',2,1,'2025-11-26 14:17:13.492941','2025-11-26 14:17:13.492941'),
  (7,'¿Cuál es el río más largo del mundo?','Amazonas','Nilo','Misisipi','Yangtsé',0,1,'2025-11-26 14:17:13.497941','2025-11-26 14:17:13.497941'),
  (8,'¿En qué continente está Egipto?','Asia','Europa','África','América',2,1,'2025-11-26 14:17:13.503150','2025-11-26 14:17:13.503150'),
  (9,'¿Cuál es la montaña más alta del mundo?','K2','Kilimanjaro','Everest','Aconcagua',2,1,'2025-11-26 14:17:13.507150','2025-11-26 14:17:13.507150'),
  (10,'¿Quién escribió \'Don Quijote de la Mancha\'?','Gabriel García Márquez','Miguel de Cervantes','Pablo Neruda','Mario Vargas Llosa',1,1,'2025-11-26 14:17:13.512328','2025-11-26 14:17:13.512328'),
  (11,'¿Cuál es el elemento químico más abundante en el universo?','Oxígeno','Hidrógeno','Helio','Carbono',1,1,'2025-11-26 14:17:13.516369','2025-11-26 14:17:13.516369'),
  (12,'¿En qué año comenzó la Segunda Guerra Mundial?','1937','1939','1941','1943',1,1,'2025-11-26 14:17:13.521334','2025-11-26 14:17:13.521334'),
  (13,'¿Cuál es el país más grande del mundo?','China','Estados Unidos','Rusia','Canadá',2,1,'2025-11-26 14:17:13.525598','2025-11-26 14:17:13.525598'),
  (14,'¿Qué instrumento tocaba Mozart?','Violín','Piano','Flauta','Todos los anteriores',3,1,'2025-11-26 14:17:13.530092','2025-11-26 14:17:13.530092'),
  (15,'¿Cuál es el animal más rápido del mundo?','Guepardo','León','Águila','Pez vela',0,1,'2025-11-26 14:17:13.535339','2025-11-26 14:17:13.535339'),
  (16,'¿Cuántos huesos tiene el cuerpo humano adulto?','196','206','216','226',1,1,'2025-11-26 14:17:13.541372','2025-11-26 14:17:13.541372'),
  (17,'¿Cuál es la velocidad de la luz?','300,000 km/s','150,000 km/s','450,000 km/s','600,000 km/s',0,1,'2025-11-26 14:17:13.548591','2025-11-26 14:17:13.549593'),
  (18,'¿En qué país está la Torre Eiffel?','Italia','España','Francia','Alemania',2,1,'2025-11-26 14:17:13.559018','2025-11-26 14:17:13.559018'),
  (20,'¿Qué es la fotosíntesis?','Proceso de respiración de las plantas','Proceso por el cual las plantas producen su alimento','Proceso de reproducción de las plantas','Proceso de crecimiento de las plantas',1,1,'2025-11-26 14:17:13.573460','2025-11-26 14:17:13.573460');

-- -----------------------------------------------------------------------------
-- 10. word_search_options  (depende de: activities)
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `word_search_options`
  (`id`, `name`, `words`, `is_active`, `created_at`, `updated_at`, `activity_id`, `grid`, `seed`, `word_positions`)
VALUES
  (1,'Sopa de Letras 1','["IDEA", "META", "EQUIPO", "PITCH", "LIDER"]',1,'2025-11-26 14:23:06.489580','2025-11-26 14:23:06.489580',2,'[["I","E","F","G","H","I","J","K","L","M","N","P"],["P","D","R","S","T","U","V","W","X","Y","I","B"],["C","D","E","F","G","H","I","J","K","T","M","N"],["O","P","Q","A","S","T","U","V","C","X","E","Z"],["A","B","C","E","E","G","H","H","J","K","T","M"],["N","O","P","Q","R","Q","T","U","V","W","A","Y"],["Z","A","B","C","D","E","U","H","I","J","K","L"],["M","N","O","P","Q","R","S","I","U","V","W","X"],["Y","Z","A","B","C","D","E","F","P","I","J","K"],["L","I","D","E","R","Q","R","S","T","O","V","W"],["X","Y","Z","A","B","C","D","E","F","G","H","I"],["K","L","M","N","O","P","Q","R","S","T","U","V"]]',955440,'[{"word":"IDEA","cells":[{"col":0,"row":0},{"col":1,"row":1},{"col":2,"row":2},{"col":3,"row":3}],"direction":"diagonal"},{"word":"EQUIPO","cells":[{"col":4,"row":4},{"col":5,"row":5},{"col":6,"row":6},{"col":7,"row":7},{"col":8,"row":8},{"col":9,"row":9}],"direction":"diagonal"},{"word":"PITCH","cells":[{"col":11,"row":0},{"col":10,"row":1},{"col":9,"row":2},{"col":8,"row":3},{"col":7,"row":4}],"direction":"diagonal"},{"word":"META","cells":[{"col":10,"row":2},{"col":10,"row":3},{"col":10,"row":4},{"col":10,"row":5}],"direction":"vertical"},{"word":"LIDER","cells":[{"col":0,"row":9},{"col":1,"row":9},{"col":2,"row":9},{"col":3,"row":9},{"col":4,"row":9}],"direction":"horizontal"}]'),
  (2,'Sopa de Letras 2','["NEGOCIO", "CLIENTE", "VENTA", "PRODUCTO", "MERCADO"]',1,'2025-11-26 14:23:06.507805','2025-11-26 14:23:06.507805',2,'[["N","J","K","L","V","E","N","T","A","R","S","P"],["U","E","W","X","Y","Z","A","B","C","D","R","G"],["H","I","G","K","L","M","N","O","P","O","R","S"],["T","U","V","O","X","Y","Z","A","D","C","D","E"],["F","G","H","J","C","L","M","U","O","P","Q","R"],["S","T","U","V","W","I","C","Z","A","B","C","D"],["E","F","G","H","I","T","O","M","N","O","P","Q"],["R","S","T","U","O","M","E","R","C","A","D","O"],["D","C","L","I","E","N","T","E","L","N","O","P"],["Q","R","S","T","U","V","W","X","Y","Z","A","B"],["C","D","E","F","G","H","I","J","K","L","M","N"],["P","Q","R","S","T","U","V","W","X","Y","Z","A"]]',748174,'[{"word":"NEGOCIO","cells":[{"col":0,"row":0},{"col":1,"row":1},{"col":2,"row":2},{"col":3,"row":3},{"col":4,"row":4},{"col":5,"row":5},{"col":6,"row":6}],"direction":"diagonal"},{"word":"PRODUCTO","cells":[{"col":11,"row":0},{"col":10,"row":1},{"col":9,"row":2},{"col":8,"row":3},{"col":7,"row":4},{"col":6,"row":5},{"col":5,"row":6},{"col":4,"row":7}],"direction":"diagonal"},{"word":"CLIENTE","cells":[{"col":1,"row":8},{"col":2,"row":8},{"col":3,"row":8},{"col":4,"row":8},{"col":5,"row":8},{"col":6,"row":8},{"col":7,"row":8}],"direction":"horizontal"},{"word":"VENTA","cells":[{"col":4,"row":0},{"col":5,"row":0},{"col":6,"row":0},{"col":7,"row":0},{"col":8,"row":0}],"direction":"horizontal"},{"word":"MERCADO","cells":[{"col":5,"row":7},{"col":6,"row":7},{"col":7,"row":7},{"col":8,"row":7},{"col":9,"row":7},{"col":10,"row":7},{"col":11,"row":7}],"direction":"horizontal"}]'),
  (5,'Sopa de Letras 5','["LIDERAZGO", "MOTIVACION", "PASION", "VISION", "MISION"]',1,'2025-11-26 14:23:06.525124','2025-11-26 14:23:06.525124',2,'[["L","C","D","E","F","G","H","I","J","K","L","V"],["N","I","P","Q","R","S","T","U","P","W","I","Y"],["Z","B","D","D","E","F","G","A","I","S","K","L"],["M","N","O","E","Q","R","S","T","I","V","W","X"],["Y","Z","A","B","R","I","F","O","H","I","J","K"],["L","M","N","O","O","A","N","S","T","U","V","W"],["X","Y","Z","N","B","C","Z","F","G","H","I","J"],["K","L","M","N","O","P","Q","G","S","T","U","V"],["M","O","T","I","V","A","C","I","O","N","H","I"],["J","K","L","M","N","O","P","Q","R","S","T","U"],["V","W","X","Y","Z","A","B","C","D","E","F","G"],["H","I","K","L","M","I","S","I","O","N","S","T"]]',307190,'[{"word":"LIDERAZGO","cells":[{"col":0,"row":0},{"col":1,"row":1},{"col":2,"row":2},{"col":3,"row":3},{"col":4,"row":4},{"col":5,"row":5},{"col":6,"row":6},{"col":7,"row":7},{"col":8,"row":8}],"direction":"diagonal"},{"word":"VISION","cells":[{"col":11,"row":0},{"col":10,"row":1},{"col":9,"row":2},{"col":8,"row":3},{"col":7,"row":4},{"col":6,"row":5}],"direction":"diagonal"},{"word":"MOTIVACION","cells":[{"col":0,"row":8},{"col":1,"row":8},{"col":2,"row":8},{"col":3,"row":8},{"col":4,"row":8},{"col":5,"row":8},{"col":6,"row":8},{"col":7,"row":8},{"col":8,"row":8},{"col":9,"row":8}],"direction":"horizontal"},{"word":"PASION","cells":[{"col":8,"row":1},{"col":7,"row":2},{"col":6,"row":3},{"col":5,"row":4},{"col":4,"row":5},{"col":3,"row":6}],"direction":"diagonal"},{"word":"MISION","cells":[{"col":4,"row":11},{"col":5,"row":11},{"col":6,"row":11},{"col":7,"row":11},{"col":8,"row":11},{"col":9,"row":11}],"direction":"horizontal"}]'),
  (17,'daniela','["LOCURA", "KALI", "BOBBY", "ROCKY", "PRINCESA"]',1,'2025-12-03 17:46:04.500799','2025-12-03 17:46:04.500823',2,'[["E","F","G","H","P","R","I","N","C","E","S","A"],["Q","R","S","T","L","V","W","X","Y","K","B","C"],["D","E","F","G","H","O","J","K","A","M","N","O"],["P","Q","R","S","T","U","C","L","X","Y","Z","A"],["B","C","E","F","G","H","I","U","K","L","M","N"],["O","P","Q","R","S","T","U","V","R","X","Y","Z"],["A","B","C","D","O","G","H","I","J","A","L","M"],["N","O","P","Q","R","C","T","U","V","W","X","Y"],["Z","A","B","C","D","E","K","G","I","J","K","L"],["M","N","O","P","Q","R","S","Y","U","V","W","X"],["Y","Z","A","B","C","D","E","F","G","H","I","J"],["B","O","B","B","Y","Q","R","S","T","U","V","W"]]',526578,'[{"word":"LOCURA","cells":[{"col":4,"row":1},{"col":5,"row":2},{"col":6,"row":3},{"col":7,"row":4},{"col":8,"row":5},{"col":9,"row":6}],"direction":"diagonal"},{"word":"KALI","cells":[{"col":9,"row":1},{"col":8,"row":2},{"col":7,"row":3},{"col":6,"row":4}],"direction":"diagonal"},{"word":"BOBBY","cells":[{"col":0,"row":11},{"col":1,"row":11},{"col":2,"row":11},{"col":3,"row":11},{"col":4,"row":11}],"direction":"horizontal"},{"word":"ROCKY","cells":[{"col":3,"row":5},{"col":4,"row":6},{"col":5,"row":7},{"col":6,"row":8},{"col":7,"row":9}],"direction":"diagonal"},{"word":"PRINCESA","cells":[{"col":4,"row":0},{"col":5,"row":0},{"col":6,"row":0},{"col":7,"row":0},{"col":8,"row":0},{"col":9,"row":0},{"col":10,"row":0},{"col":11,"row":0}],"direction":"horizontal"}]');

-- =============================================================================
COMMIT;

SET foreign_key_checks = 1;

-- Verificación rápida post-ejecución:
-- SELECT COUNT(*) AS activity_types   FROM activity_types;           -- esperado: >= 8
-- SELECT COUNT(*) AS stages           FROM stages;                   -- esperado: >= 4
-- SELECT COUNT(*) AS activities       FROM activities;               -- esperado: >= 9
-- SELECT COUNT(*) AS topics           FROM topics;                   -- esperado: >= 3
-- SELECT COUNT(*) AS challenges       FROM challenges;               -- esperado: >= 9
-- SELECT COUNT(*) AS anagram_words    FROM anagram_words;            -- esperado: >= 50
-- SELECT COUNT(*) AS chaos_questions  FROM chaos_questions;          -- esperado: >= 31
-- SELECT COUNT(*) AS gk_questions     FROM general_knowledge_questions; -- esperado: >= 19
-- SELECT COUNT(*) AS word_search      FROM word_search_options;      -- esperado: >= 4
