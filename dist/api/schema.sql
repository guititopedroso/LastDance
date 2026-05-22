-- LastDance Memorias Table
-- Copy and run this in the SQL tab of your phpMyAdmin database to create the table.

CREATE TABLE IF NOT EXISTS memorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigoEscola VARCHAR(50) NOT NULL,
  nif VARCHAR(20) NOT NULL,
  nomeAluno VARCHAR(100) NOT NULL,
  fotoURL VARCHAR(255) NOT NULL,
  legenda VARCHAR(150) DEFAULT '',
  emoji VARCHAR(10) DEFAULT '',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reportada TINYINT(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
