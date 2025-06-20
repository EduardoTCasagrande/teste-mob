const path = require('path');
const db = require('../models/db');
const normalizeQuiosque = require('../helpers/normalizeQuiosque');

let reposicaoPlanejadaPorQuiosque = {};
let contagemAtualPorQuiosque = {};

function isMobile(req) {
  const ua = req.headers['user-agent'] || '';
  return /mobile|android|iphone|ipad/i.test(ua);
}

exports.renderReposicaoPage = (req, res) => {
  if (!req.session.user) return res.redirect('/');

  const userAgent = req.headers['user-agent'] || '';
  const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
  
  const quiosque = req.session.user.quiosque;  // pega o quiosque logado

  if (isMobile) {
    res.render('reposicao-mobile', { quiosqueLogado: quiosque });
  } else {
    res.render('reposicao', { quiosqueLogado: quiosque });
  }
};


exports.salvarReposicao = (req, res) => {
  const { dados } = req.body;
  const quiosque = req.session?.user?.quiosque;

  if (!quiosque || !dados) {
    return res.status(400).json({ status: 'erro', mensagem: 'Usuário não autenticado ou dados ausentes' });
  }

  const key = normalizeQuiosque(quiosque);
  reposicaoPlanejadaPorQuiosque[key] = dados;
  contagemAtualPorQuiosque[key] = {};

  res.json({
    status: 'ok',
    mensagem: `Reposição atualizada com sucesso para o quiosque ${quiosque}.`,
    atual: contagemAtualPorQuiosque[key],
    planejado: reposicaoPlanejadaPorQuiosque[key]
  });
};

exports.biparSku = (req, res) => {
  const { sku } = req.body;
  const quiosque = req.session?.user?.quiosque;
  const key = normalizeQuiosque(quiosque);

  if (!quiosque || !sku) {
    return res.status(400).json({ status: 'erro', mensagem: 'Quiosque ou SKU não enviados' });
  }

  if (!reposicaoPlanejadaPorQuiosque[key] || !reposicaoPlanejadaPorQuiosque[key][sku]) {
    return res.status(400).json({
      status: 'erro',
      mensagem: `SKU '${sku}' não está na lista de reposição para o quiosque '${quiosque}'.`
    });
  }

  contagemAtualPorQuiosque[key][sku] = (contagemAtualPorQuiosque[key][sku] || 0) + 1;

  db.run(`
    INSERT INTO estoque_quiosque (quiosque, sku, quantidade)
    VALUES (?, ?, 1)
    ON CONFLICT(quiosque, sku)
    DO UPDATE SET quantidade = quantidade + 1
  `, [quiosque, sku], (err) => {
    if (err) {
      console.error("Erro ao atualizar estoque:", err.message);
    }
  });

  res.json({
    status: 'ok',
    mensagem: `SKU '${sku}' registrado para o quiosque '${quiosque}'.`,
    atual: { ...contagemAtualPorQuiosque[key] }
  });
};
