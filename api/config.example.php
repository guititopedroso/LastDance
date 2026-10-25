<?php
// LastDance · configuração da base de dados.
// 1. Copia este ficheiro para FORA do public_html, com o nome lastdance-config.php
//    (ex.: /home/u123456789/domains/lastdance.pt/lastdance-config.php).
// 2. Preenche com os dados da base de dados que criaste no hPanel (Bases de Dados → MySQL).
// Nunca envies este ficheiro preenchido para o Git nem por mensagem.
return [
  'driver' => 'mysql',
  'db_host' => 'localhost',
  'db_port' => 3306,
  'db_name' => 'u123456789_lastdance',
  'db_user' => 'u123456789_lastdance',
  'db_pass' => 'A_PALAVRA_PASSE_DA_BASE_DE_DADOS',
  // Endereços autorizados a usar a API a partir de outro domínio (só para testes locais).
  'allowed_origins' => [],
];
