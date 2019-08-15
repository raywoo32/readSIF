/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- initial
CREATE DATABASE /*!32312 IF NOT EXISTS*/ `interactions_vincent` /*!40100 DEFAULT CHARACTER SET latin1 */;
USE `interactions_vincent`;


-- drops
DROP TABLE IF EXISTS `algorithms_lookup_table`;
DROP TABLE IF EXISTS `external_source`;
DROP TABLE IF EXISTS `interaction_lookup_table`;
DROP TABLE IF EXISTS `modes_of_action_lookup_table`;
DROP TABLE IF EXISTS `interactions`;
DROP TABLE IF EXISTS `interactions_algo_score_join_table`;
DROP TABLE IF EXISTS `interolog_confidence_subset_table`;
DROP TABLE IF EXISTS `interactions_source_mi_join_table`;
DROP TABLE IF EXISTS `source_tag_join_table`;
DROP TABLE IF EXISTS `tag_lookup_table`;

-- algorithms_lookup_table
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `algorithms_lookup_table` (
  `algo_name` varchar(100) NOT NULL COMMENT 'Algorithm name to be used in place of a surrogate key, assume they’re going to be unique. Like “FIMO”.',
  `algo_desc` varchar(500) NOT NULL COMMENT 'Describe the named algorithm in algo_name.',
  `algo_ranges` varchar(200) NOT NULL COMMENT 'Briefly describe the range of values',
  PRIMARY KEY (`algo_name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `algorithms_lookup_table` WRITE;
/*!40000 ALTER TABLE `algorithms_lookup_table` DISABLE KEYS */;
INSERT INTO `algorithms_lookup_table` VALUES ('FIMO-Yu','Yu et al (PMID: 27117388) used the FIMO tool to predict TFBSs (multiple source, see paper) at a promoter.','Values represent p-values, the lower the better should be all smaller than < 10^-4 and non-negative'),('Interolog-Geiser-Lee','Geiser-Lee et al (PMID: 17675552) used a pipeline (including tools such as INPARANOID) to predict PPIs via interologs','Number represents confidence value where the greater the number, the greater the confidence'),('S-PPI-Dong','Dong et al (PMID: 30679268) used the HEX tool to predict protein-pairs','9065 PPI pairs were predicted, 1 is the best ranked protein pair and 9065 is the worst');
/*!40000 ALTER TABLE `algorithms_lookup_table` ENABLE KEYS */;
UNLOCK TABLES;


-- external_source
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `external_source` (
  `source_id` int(12) NOT NULL AUTO_INCREMENT COMMENT 'surrogate key',
  `source_name` varchar(500) NOT NULL COMMENT 'name of the source, can be a pubmed identifier like “PMIDXXXXXXX” or “Asher’s sql dump”',
  `comments` text NOT NULL COMMENT 'Comments regarding the source',
  `date_uploaded` date NOT NULL,
  `url` varchar(350) DEFAULT NULL COMMENT 'URL if available to paper/source (does not have to be a DOI, can be a link to a databases’ source)',
  `tags` varchar(300) DEFAULT NULL COMMENT 'Specific to GRN project, have tags which describe features of a GRN which are relevant. For example, the condition or tissue of Arabidopsis when GRN was constructed, master regulators, what technique used',
  `image_url` varchar(300) DEFAULT NULL,
  `grn_title` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`source_id`),
  UNIQUE KEY `source_name_UNIQUE` (`source_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `external_source` WRITE;
/*!40000 ALTER TABLE `external_source` DISABLE KEYS */;
INSERT INTO `external_source` VALUES (1,'21245844','initial DB migration nodejs script - vincent','2019-06-12',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `external_source` ENABLE KEYS */;
UNLOCK TABLES;


-- interaction_lookup_table
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `interaction_lookup_table` (
  `interaction_type_id` int(2) NOT NULL AUTO_INCREMENT COMMENT 'Surrogate key',
  `description` varchar(100) NOT NULL COMMENT 'Describe the binary interaction of the entities. For example ‘ppi - protein interaction where entity_1_alias and entity_2_alias represent proteins’',
  `entity_1_alias` varchar(50) NOT NULL COMMENT 'Can be a protein, miRNA, etc.',
  `entity_2_alias` varchar(50) NOT NULL COMMENT 'Can be a protein, miRNA, etc.',
  PRIMARY KEY (`interaction_type_id`),
  UNIQUE KEY `description_UNIQUE` (`description`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `interaction_lookup_table` WRITE;
/*!40000 ALTER TABLE `interaction_lookup_table` DISABLE KEYS */;
INSERT INTO `interaction_lookup_table` VALUES (1,'protein-protein interaction (ppi)','protein','protein'),(2,'protein-dna interaction (pdi)','protein','dna'),(3,'mirna-mrna interaction (mimi)','mirna','mrna');
/*!40000 ALTER TABLE `interaction_lookup_table` ENABLE KEYS */;
UNLOCK TABLES;


-- interactions
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `interactions` (
  `interaction_id` int(15) NOT NULL AUTO_INCREMENT COMMENT 'surrogate key',
  `pearson_correlation_coeff` decimal(6,5) DEFAULT NULL COMMENT 'PCC score imported from interactions table',
  `entity_1` varchar(50) NOT NULL COMMENT 'Following the interaction_type_id (referencing the lookup table), define the first entity. For example if it is a PPI relationship than the entity 1 shall be a protein with an AGI (ex AT5G01010).',
  `entity_2` varchar(50) NOT NULL COMMENT 'Following the interaction_type_id (referencing the lookup table), define the first entity. For example if it is a PPI relationship than the entity 2 shall be a protein with an AGI (ex AT5G01010).',
  `interaction_type_id` int(2) NOT NULL COMMENT 'Reference to the lookup of a interactions_lookup_table. Define what type of interaction these two genes are. For example if the value were ‘3’ and it looksup to a PPI, then both members are proteins.',
  PRIMARY KEY (`interaction_id`),
  UNIQUE KEY `unique_interaction_index` (`entity_1`,`entity_2`,`interaction_type_id`),
  KEY `interaction_type_id_idx` (`interaction_type_id`),
  CONSTRAINT `interaction_type_id` FOREIGN KEY (`interaction_type_id`) REFERENCES `interaction_lookup_table` (`interaction_type_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `interactions` WRITE;
/*!40000 ALTER TABLE `interactions` DISABLE KEYS */;
INSERT INTO `interactions` VALUES (1,NULL,'at2g44940','at5g60200',2), (2,NULL,'at3g60490','at5g60200',2);
/*!40000 ALTER TABLE `interactions` ENABLE KEYS */;
UNLOCK TABLES;


-- interactions_algo_score_join_table
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `interactions_algo_score_join_table` (
  `algo_score` varchar(30) NOT NULL COMMENT 'Score for that specific algorithm referenced in ‘algo_name’ for a particular binary interaction',
  `interaction_id` int(15) NOT NULL COMMENT 'The interaction we are looking at when we are referring to an algorithm score',
  `algo_name` varchar(100) NOT NULL COMMENT 'algo_name which will reference the lookup table',
  PRIMARY KEY (`algo_name`,`interaction_id`,`algo_score`),
  KEY `interaction_id_idx` (`interaction_id`),
  CONSTRAINT `algo_name` FOREIGN KEY (`algo_name`) REFERENCES `algorithms_lookup_table` (`algo_name`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `interaction_id` FOREIGN KEY (`interaction_id`) REFERENCES `interactions` (`interaction_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `interactions_algo_score_join_table` WRITE;
/*!40000 ALTER TABLE `interactions_algo_score_join_table` DISABLE KEYS */;
INSERT INTO `interactions_algo_score_join_table` VALUES ('1176.0',13,'Interolog-Geiser-Lee');
/*!40000 ALTER TABLE `interactions_algo_score_join_table` ENABLE KEYS */;
UNLOCK TABLES;


-- interactions_source_mi_join_table
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `interactions_source_mi_join_table` (
  `interaction_id` int(15) NOT NULL COMMENT 'reference the interaction pair via id',
  `source_id` int(12) NOT NULL COMMENT 'reference the paper/source where this interaction came from',
  `external_db_id` varchar(30) NOT NULL COMMENT 'For the given external_database, like BIOGRID; what is it’s ID?',
  `mode_of_action` tinyint(1) NOT NULL COMMENT 'Repression or activation? Reference it here to the lookup.',
  `mi_detection_method` varchar(10) NOT NULL,
  `mi_detection_type` varchar(10) NOT NULL,
  PRIMARY KEY (`mi_detection_method`,`mi_detection_type`,`external_db_id`,`interaction_id`,`source_id`),
  KEY `source_id_idx` (`source_id`),
  KEY `m_o_a_db_FK_idx` (`mode_of_action`),
  KEY `int_id_FK_on_mi_int_src` (`interaction_id`),
  CONSTRAINT `int_id_FK_on_mi_int_src` FOREIGN KEY (`interaction_id`) REFERENCES `interactions` (`interaction_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `m_o_a_db_FK` FOREIGN KEY (`mode_of_action`) REFERENCES `modes_of_action_lookup_table` (`m_of_a_pk`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `source_id_FK` FOREIGN KEY (`source_id`) REFERENCES `external_source` (`source_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `interactions_source_mi_join_table` WRITE;
/*!40000 ALTER TABLE `interactions_source_mi_join_table` DISABLE KEYS */;
INSERT INTO `interactions_source_mi_join_table` VALUES (1,1,'',1,'407','432');
/*!40000 ALTER TABLE `interactions_source_mi_join_table` ENABLE KEYS */;
UNLOCK TABLES;


-- interolog_confidence_subset_table
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `interolog_confidence_subset_table` (
  `interaction_id` int(15) NOT NULL COMMENT 'surrogate key',
  `s_cerevisiae` tinyint(4) NOT NULL COMMENT 'species score… repeat for all other species',
  `s_pombe` tinyint(4) NOT NULL,
  `worm` tinyint(4) NOT NULL,
  `fly` tinyint(4) NOT NULL,
  `human` tinyint(4) NOT NULL,
  `mouse` tinyint(4) NOT NULL,
  `e_coli` tinyint(4) NOT NULL,
  `total_hits` smallint(6) NOT NULL,
  `num_species` tinyint(4) NOT NULL,
  PRIMARY KEY (`interaction_id`),
  KEY `pdi_interaction_id_idx` (`interaction_id`),
  CONSTRAINT `interolog_int_id_FK` FOREIGN KEY (`interaction_id`) REFERENCES `interactions` (`interaction_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `interolog_confidence_subset_table` WRITE;
/*!40000 ALTER TABLE `interolog_confidence_subset_table` DISABLE KEYS */;
INSERT INTO `interolog_confidence_subset_table` VALUES (40573,1,0,0,0,0,0,0,1,1);
/*!40000 ALTER TABLE `interolog_confidence_subset_table` ENABLE KEYS */;
UNLOCK TABLES;


-- modes_of_action_lookup_table
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `modes_of_action_lookup_table` (
  `m_of_a_pk` tinyint(1) NOT NULL AUTO_INCREMENT COMMENT 'surrogate key',
  `description` varchar(20) NOT NULL COMMENT 'Describe the mode of action of the interaction, is it repression or activation for example?',
  PRIMARY KEY (`m_of_a_pk`),
  UNIQUE KEY `description_UNIQUE` (`description`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `modes_of_action_lookup_table` WRITE;
/*!40000 ALTER TABLE `modes_of_action_lookup_table` DISABLE KEYS */;
INSERT INTO `modes_of_action_lookup_table` VALUES (2,'activation'),(3,'repression'),(1,'unknown');
/*!40000 ALTER TABLE `modes_of_action_lookup_table` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

CREATE TABLE IF NOT EXISTS `interactions_vincent`.`tag_lookup_table` (
  `tag_name` VARCHAR(20) NOT NULL,
  `tag_group` ENUM("Gene", "Experiment", "Condition", "Misc") NOT NULL,
  PRIMARY KEY (`tag_name`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `interactions_vincent`.`source_tag_join_table`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `interactions_vincent`.`source_tag_join_table` (
  `source_id` INT(12) NOT NULL,
  `tag_name` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`source_id`, `tag_name`),
  INDEX `tag_join_tag_names_FK_idx` (`tag_name` ASC),
  CONSTRAINT `tag_join_source_id_FK`
    FOREIGN KEY (`source_id`)
    REFERENCES `interactions_vincent`.`external_source` (`source_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `tag_join_tag_names_FK`
    FOREIGN KEY (`tag_name`)
    REFERENCES `interactions_vincent`.`tag_lookup_table` (`tag_name`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- TESTING AID
-- SELECT * FROM interactions; 
-- SELECT * FROM interactions_source_mi_join_table;
-- SELECT * FROM external_source;