// controllers/caixaController.js
const db = require('../models/db');

exports.getCaixaTotal = (req, res) => {
  const { quiosque } = req.params;

  db.get(`
    SELECT SUM(valor) as total
    FROM caixa_movimentos
    WHERE quiosque = ?
  `, [quiosque], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ erro: 'Erro ao buscar caixa' });
    }

    res.json({ total: row.total ?? 0 });
  });
};

exports.getHistoricoCaixa = (req, res) => {
  const { quiosque } = req.params;

  db.all(`
    SELECT id, valor, forma_pagamento, data
    FROM caixa_movimentos
    WHERE quiosque = ?
    ORDER BY data DESC
  `, [quiosque], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar histórico do caixa:', err.message);
      return res.status(500).json({ erro: 'Erro ao buscar histórico do caixa.' });
    }

    res.json(rows);
  });
};

exports.registrarSangria = (req, res) => {
  const { quiosque, valor } = req.body;

  if (!quiosque || typeof valor !== 'number' || valor <= 0) {
    return res.status(400).json({ erro: 'Dados inválidos. Informe quiosque e valor numérico positivo.' });
  }

  const valorNegativo = -Math.abs(valor); // Garante que vai salvar como negativo

  db.run(`
    INSERT INTO caixa_movimentos (quiosque, valor, forma_pagamento)
    VALUES (?, ?, ?)
  `, [quiosque, valorNegativo, 'SANGRIA'], function(err) {
    if (err) {
      console.error('Erro ao registrar sangria:', err.message);
      return res.status(500).json({ erro: 'Erro ao registrar sangria.' });
    }

    res.json({ mensagem: 'Sangria registrada com sucesso!', id: this.lastID });
  });
};
