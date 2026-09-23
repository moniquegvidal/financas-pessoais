import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { pool } from './db.js';

import authRoutes from './routes/auth.js';
import catRoutes from './routes/categorias.js';
import despRoutes from './routes/despesas.js';
import rendaRoutes from './routes/renda.js';
import receitaRoutes from './routes/receitas.js';
import metaRoutes from './routes/metas.js';
import recorrenteRoutes from './routes/recorrentes.js';
import resumoRoutes from './routes/resumo.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api', authRoutes);
app.use('/api/categorias', catRoutes);
app.use('/api/despesas', despRoutes);
app.use('/api/renda', rendaRoutes);
app.use('/api/receitas', receitaRoutes);
app.use('/api/metas', metaRoutes);
app.use('/api/recorrentes', recorrenteRoutes);
app.use('/api/resumo', resumoRoutes);

async function prepareDatabase() {

  // 1. Usuários precisa existir primeiro
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(120) NOT NULL,
      email VARCHAR(180) NOT NULL UNIQUE,
      senha_hash VARCHAR(255) NOT NULL,
      data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Categorias
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categorias (
      id INT PRIMARY KEY,
      nome VARCHAR(60) NOT NULL UNIQUE
    )
  `);

  const categorias = [
    [1, 'Cartão'],
    [2, 'Mercado'],
    [3, 'Delivery'],
    [4, 'Restaurante'],
    [5, 'Assinaturas'],
    [6, 'Outros'],
    [7, 'Moradia'],
    [8, 'Contas da casa'],
    [9, 'Transporte'],
    [10, 'Saúde'],
    [11, 'Educação'],
    [12, 'Lazer'],
    [13, 'Compras'],
    [14, 'Dívidas/Empréstimos']
  ];

  for (const [id, nome] of categorias) {
    await pool.query(
      `INSERT INTO categorias (id, nome)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE nome = ?`,
      [id, nome, nome]
    );
  }

  // 3. Despesas
  await pool.query(`
    CREATE TABLE IF NOT EXISTS despesas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      categoria_id INT NOT NULL,
      nome VARCHAR(120) NOT NULL,
      valor DECIMAL(10,2) NOT NULL,
      data DATE NOT NULL,
      data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      INDEX idx_despesas_usuario_data (usuario_id, data),

      CONSTRAINT fk_despesa_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

      CONSTRAINT fk_despesa_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES categorias(id)
        ON DELETE RESTRICT
    )
  `);

  // 4. Renda antiga
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rendas (
      usuario_id INT PRIMARY KEY,
      valor DECIMAL(10,2) NOT NULL DEFAULT 0,
      atualizado_em TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

      CONSTRAINT fk_renda_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
    )
  `);

  // 5. Rendas mensais
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rendas_mensais (
      usuario_id INT NOT NULL,
      mes CHAR(7) NOT NULL,
      valor DECIMAL(10,2) NOT NULL DEFAULT 0,
      atualizado_em TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

      PRIMARY KEY (usuario_id, mes),

      CONSTRAINT fk_renda_mensal_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
    )
  `);

  // 6. Receitas extras
  await pool.query(`
    CREATE TABLE IF NOT EXISTS receitas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      nome VARCHAR(120) NOT NULL,
      valor DECIMAL(10,2) NOT NULL,
      data DATE NOT NULL,
      data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      INDEX idx_receitas_usuario_data (usuario_id, data),

      CONSTRAINT fk_receita_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
    )
  `);

  // 7. Metas por categoria
  await pool.query(`
    CREATE TABLE IF NOT EXISTS metas_categoria (
      usuario_id INT NOT NULL,
      mes CHAR(7) NOT NULL,
      categoria_id INT NOT NULL,
      limite DECIMAL(10,2) NOT NULL,

      PRIMARY KEY (usuario_id, mes, categoria_id),

      CONSTRAINT fk_meta_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

      CONSTRAINT fk_meta_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES categorias(id)
        ON DELETE CASCADE
    )
  `);

  // 8. Despesas recorrentes
  await pool.query(`
    CREATE TABLE IF NOT EXISTS despesas_recorrentes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      categoria_id INT NOT NULL,
      nome VARCHAR(120) NOT NULL,
      valor DECIMAL(10,2) NOT NULL,
      dia TINYINT NOT NULL,
      data_inicio DATE NOT NULL,
      ativa TINYINT(1) NOT NULL DEFAULT 1,
      data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT fk_rec_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

      CONSTRAINT fk_rec_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES categorias(id)
        ON DELETE RESTRICT
    )
  `);

  // Migra renda antiga para o mês atual, se houver
  const current = new Date().toISOString().slice(0, 7);

  await pool.query(
    `INSERT IGNORE INTO rendas_mensais (usuario_id, mes, valor)
     SELECT usuario_id, ?, valor
     FROM rendas`,
    [current]
  );

  console.log('Banco de dados preparado com sucesso.');
}

const port = Number(process.env.PORT || 3001);

prepareDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`API rodando na porta ${port}`);
    });
  })
  .catch((err) => {
    console.error('Erro ao preparar banco:', err);
    process.exit(1);
  });