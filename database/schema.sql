CREATE DATABASE IF NOT EXISTS financas_pessoais CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE financas_pessoais;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categorias (
  id INT PRIMARY KEY,
  nome VARCHAR(60) NOT NULL UNIQUE
);

INSERT INTO categorias (id, nome) VALUES
(1,'Cartão'),(2,'Mercado'),(3,'Delivery'),(4,'Restaurante'),(5,'Assinaturas'),(6,'Outros'),
(7,'Moradia'),(8,'Contas da casa'),(9,'Transporte'),(10,'Saúde'),(11,'Educação'),(12,'Lazer'),
(13,'Compras'),(14,'Dívidas/Empréstimos')
ON DUPLICATE KEY UPDATE nome=VALUES(nome);

CREATE TABLE IF NOT EXISTS despesas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  categoria_id INT NOT NULL,
  nome VARCHAR(150) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data DATE NOT NULL,
  data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_despesa_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_despesa_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT,
  INDEX idx_despesa_usuario (usuario_id),
  INDEX idx_despesa_categoria (categoria_id)
);

CREATE TABLE IF NOT EXISTS rendas (
  usuario_id INT PRIMARY KEY,
  valor DECIMAL(10,2) NOT NULL DEFAULT 0,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_renda_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
