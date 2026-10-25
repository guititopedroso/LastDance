-- LastDance · estrutura da base de dados (MySQL / MariaDB da Hostinger)
-- Importar no phpMyAdmin OU deixar o api/install.php criar tudo sozinho.
-- Os nomes das colunas são iguais aos do site (src/data/types.ts).

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(40) NOT NULL PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `email` VARCHAR(200) NOT NULL,
  `password` VARCHAR(255) NULL,
  `role` VARCHAR(30) NOT NULL,
  `isPartner` TINYINT(1) NULL,
  `eventId` VARCHAR(40) NULL,
  `staffEventIds` TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `events` (
  `id` VARCHAR(40) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(60) NOT NULL,
  `venueId` VARCHAR(40) NULL,
  `location` VARCHAR(255) NULL,
  `category` VARCHAR(10) NOT NULL,
  `date` VARCHAR(10) NOT NULL,
  `start` VARCHAR(5) NULL,
  `end` VARCHAR(5) NULL,
  `hasClasses` TINYINT(1) NULL,
  `classes` TEXT NULL,
  `installments` TEXT NULL,
  `commission` DECIMAL(10,2) NULL,
  `capacity` INT NULL,
  `partners` TEXT NULL,
  `comercial1` VARCHAR(40) NULL,
  `comercial2` VARCHAR(40) NULL,
  `share1` DECIMAL(5,2) NULL,
  `archived` TINYINT(1) NULL,
  `votingMode` VARCHAR(10) NULL,
  `awards` TEXT NULL,
  `announced` TINYINT(1) NULL,
  `tables` MEDIUMTEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `participants` (
  `id` VARCHAR(40) NOT NULL PRIMARY KEY,
  `eventId` VARCHAR(40) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `birth` VARCHAR(10) NULL,
  `phone` VARCHAR(30) NULL,
  `email` VARCHAR(200) NULL,
  `password` VARCHAR(255) NULL,
  `type` VARCHAR(20) NULL,
  `turma` VARCHAR(40) NULL,
  `diet` VARCHAR(60) NULL,
  `health` TEXT NULL,
  `consent` TINYINT(1) NULL,
  `createdAt` VARCHAR(30) NULL,
  `offer` TINYINT(1) NULL,
  `tableId` VARCHAR(40) NULL,
  `enteredAt` VARCHAR(30) NULL,
  `enteredBy` VARCHAR(40) NULL,
  `qr` VARCHAR(120) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payments` (
  `id` VARCHAR(40) NOT NULL PRIMARY KEY,
  `participantId` VARCHAR(40) NOT NULL,
  `installment` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `receivedBy` VARCHAR(40) NULL,
  `at` VARCHAR(30) NULL,
  `kind` VARCHAR(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `votes` (
  `id` VARCHAR(90) NOT NULL PRIMARY KEY,
  `eventId` VARCHAR(40) NOT NULL,
  `awardId` VARCHAR(40) NOT NULL,
  `voterId` VARCHAR(40) NOT NULL,
  `candidateId` VARCHAR(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `venues` (
  `id` VARCHAR(40) NOT NULL PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `costPerPerson` DECIMAL(10,2) NULL,
  `minimum` INT NULL,
  `capacity` INT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `partners` (
  `id` VARCHAR(40) NOT NULL PRIMARY KEY,
  `type` VARCHAR(30) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `baseCost` DECIMAL(10,2) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `expenses` (
  `id` VARCHAR(40) NOT NULL PRIMARY KEY,
  `description` VARCHAR(255) NOT NULL,
  `category` VARCHAR(40) NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `date` VARCHAR(10) NULL,
  `paidBy` VARCHAR(40) NULL,
  `reimbursed` TINYINT(1) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tokens` (
  `token` CHAR(64) NOT NULL PRIMARY KEY,
  `kind` VARCHAR(12) NOT NULL,
  `subjectId` VARCHAR(40) NOT NULL,
  `expiresAt` INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `login_attempts` (
  `ip` VARCHAR(64) NOT NULL,
  `at` INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `meta` (
  `k` VARCHAR(40) NOT NULL PRIMARY KEY,
  `v` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE UNIQUE INDEX `uq_users_email` ON `users` (`email`);
CREATE UNIQUE INDEX `uq_events_code` ON `events` (`code`);
CREATE UNIQUE INDEX `uq_participants_qr` ON `participants` (`qr`);
CREATE INDEX `ix_participants_event` ON `participants` (`eventId`);
CREATE INDEX `ix_participants_email` ON `participants` (`email`);
CREATE INDEX `ix_payments_participant` ON `payments` (`participantId`);
CREATE INDEX `ix_votes_event` ON `votes` (`eventId`);
CREATE INDEX `ix_attempts_ip` ON `login_attempts` (`ip`, `at`);
INSERT INTO `meta` (`k`, `v`) VALUES ('version', '1');
