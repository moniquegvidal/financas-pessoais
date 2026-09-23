# Finanças Pessoais

Aplicação web para cadastro de conta, renda mensal e despesas por categoria.

## Novidades desta versão
- Renda mensal por usuário.
- Saldo disponível = renda mensal - despesas.
- Gráfico de despesas com uma cor por categoria e legenda.
- Categorias ampliadas: Cartão, Mercado, Delivery, Restaurante, Assinaturas, Outros, Moradia, Contas da casa, Transporte, Saúde, Educação, Lazer, Compras e Dívidas/Empréstimos.
- Dicas de educação financeira com links para fontes oficiais do Banco Central do Brasil e Portal do Investidor/CVM.
- O backend cria automaticamente a tabela de renda e atualiza as categorias ao iniciar.

## Executar
### Backend
1. Copie `.env.example` para `.env` e informe a senha do MySQL e um JWT_SECRET.
2. No terminal: `cd backend`
3. `npm install`
4. `npm run dev`

### Frontend
1. Em outro terminal: `cd frontend`
2. `npm install`
3. `npm run dev`
4. Abra `http://localhost:5173/`

## Banco novo
Para uma instalação do zero, execute `database/schema.sql` no MySQL Workbench antes de iniciar o backend.

## Segurança
O arquivo `.env` não deve ser enviado para GitHub ou compartilhado. Ele não está incluído no pacote distribuído.

## Recursos avançados desta versão
- Limites mensais de gastos por categoria, com barra de progresso e aviso de estouro.
- Despesas recorrentes mensais (criar, editar, pausar, ativar e excluir).
- Histórico visual de receitas e despesas dos últimos 6 meses.
- Mantém renda mensal, receitas extras, despesas por mês, gráfico por categoria e dicas financeiras.

As tabelas novas (`metas_categoria` e `despesas_recorrentes`) são criadas automaticamente quando o backend inicia. Não é necessário executar novamente o schema.sql em um banco já existente.
