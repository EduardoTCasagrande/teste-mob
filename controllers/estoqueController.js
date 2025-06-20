const db = require('../models/db');



exports.estoque = (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.render('estoque');
};
exports.buscarEstoquePorSessao = (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }

  const quiosque = req.session.user.quiosque;

  db.all(
    `SELECT sku, quantidade FROM estoque_quiosque WHERE quiosque = ?`,
    [quiosque],
    (err, rows) => {
      if (err) {
        console.error("Erro ao consultar estoque:", err.message);
        return res.status(500).json({ erro: 'Erro ao consultar o estoque' });
      }

      res.json({ quiosque, skus: rows });
    }
  );
};
