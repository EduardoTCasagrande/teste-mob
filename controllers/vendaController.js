const db = require('../models/db');
const path = require('path');
const fs = require('fs');


exports.vendasPage = (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.render('vendas');
};



exports.vender = (req, res) => {
  const { quiosque, venda, pagamentos, total, desconto, operador } = req.body;

  if (!quiosque || !venda || typeof venda !== 'object' || !Array.isArray(pagamentos) || typeof total !== 'number') {
    return res.status(400).json({
      status: 'erro',
      mensagem: 'Dados da venda inválidos.'
    });
  }

  const stmt = db.prepare(`
    INSERT INTO estoque_quiosque (quiosque, sku, quantidade)
    VALUES (?, ?, ?)
    ON CONFLICT(quiosque, sku)
    DO UPDATE SET quantidade = quantidade - ?
  `);

  const historicoStmt = db.prepare(`
    INSERT INTO historico_transacoes (tipo, quiosque, sku, quantidade, valor, operador)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const getPreco = db.prepare(`SELECT preco FROM precos WHERE sku = ?`);

  const skus = Object.entries(venda).filter(([sku, quantidade]) => sku && quantidade && quantidade > 0);
  let pendentes = skus.length;

  let vendaDetalhada = [];

  skus.forEach(([sku, quantidade]) => {
    getPreco.get([sku], (err, row) => {
      const precoUnitario = row ? row.preco : 0;
      const valorTotalItem = precoUnitario * quantidade;

      vendaDetalhada.push({ sku, quantidade, precoUnitario, valorTotalItem });

      stmt.run([quiosque, sku, quantidade * -1, quantidade], (err) => {
        if (err) console.error("Erro ao atualizar estoque:", err.message);
      });

      historicoStmt.run(['venda', quiosque, sku, quantidade, valorTotalItem, operador || 'desconhecido'], (err) => {
        if (err) console.error("Erro ao salvar no histórico:", err.message);
      });

      pendentes--;
      if (pendentes === 0) finalizar();
    });
  });

  function finalizar() {
    stmt.finalize();
    historicoStmt.finalize();
    getPreco.finalize();

    const caixaStmt = db.prepare(`
      INSERT INTO caixa_movimentos (quiosque, valor, forma_pagamento)
      VALUES (?, ?, ?)
    `);

    pagamentos.forEach(({ forma, valor }) => {
      if (forma === 'dinheiro') {
        caixaStmt.run([quiosque, valor, forma], (err) => {
          if (err) console.error(`Erro ao registrar no caixa (forma: ${forma}):`, err.message);
        });
      }
    });

    caixaStmt.finalize();

    const nomeArquivo = gerarCupomESC(quiosque, vendaDetalhada, total, desconto, pagamentos, operador);

    res.json({
      status: 'ok',
      mensagem: 'Venda registrada com sucesso.',
      cupomUrl: `/cupons/${nomeArquivo}`
    });
  }

  function gerarCupomESC(quiosque, itens, total, desconto, pagamentos, operador) {
    const cuponsDir = path.join(__dirname, '../cupons');
    if (!fs.existsSync(cuponsDir)) {
      fs.mkdirSync(cuponsDir);
    }

    const data = new Date();
    const nomeArquivo = `cupom_${quiosque}_${data.getTime()}.esc`;
    const filePath = path.join(cuponsDir, nomeArquivo);

    let conteudo = '';
    conteudo += '*** CUPOM PDV ***\n';
    conteudo += `Quiosque: ${quiosque}\n`;
    conteudo += `Data: ${data.toLocaleString()}\n`;
    conteudo += `Operador: ${operador || 'desconhecido'}\n\n`;

    itens.forEach(item => {
      conteudo += `SKU: ${item.sku} | Qtd: ${item.quantidade} | R$: ${item.precoUnitario.toFixed(2)}\n`;
    });

    conteudo += `\nTotal: R$ ${total.toFixed(2)}\n`;
    if (desconto && desconto > 0) {
      conteudo += `Desconto: R$ ${desconto.toFixed(2)}\n`;
    }

    conteudo += '\nPagamentos:\n';
    pagamentos.forEach(p => {
      conteudo += `- ${p.forma}: R$ ${p.valor.toFixed(2)}\n`;
    });

    conteudo += '\nObrigado pela preferência!\n';

    fs.writeFileSync(filePath, conteudo, 'utf8');

    return nomeArquivo;
  }
};


exports.historico = (req, res) => {
  const { data_inicio, data_fim, quiosque } = req.query;

  if (!data_inicio || !data_fim) {
    return res.status(400).json({
      status: 'erro',
      mensagem: 'Parâmetros "data_inicio" e "data_fim" são obrigatórios.'
    });
  }

  let sql = `
    SELECT tipo, quiosque, sku, quantidade, valor, operador, data
    FROM historico_transacoes
    WHERE tipo = 'venda' AND date(data) BETWEEN date(?) AND date(?)
  `;
  const params = [data_inicio, data_fim];

  if (quiosque) {
    sql += ' AND quiosque = ?';
    params.push(quiosque);
  }

  sql += ' ORDER BY data ASC';

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Erro ao consultar histórico:', err.message);
      return res.status(500).json({
        status: 'erro',
        mensagem: 'Erro ao buscar histórico de vendas.'
      });
    }

    res.json({
      status: 'ok',
      historico: rows
    });
  });
};
function gerarCupomESC(venda, pagamentos, total, desconto, quiosque) {
  let cupom = '';

  cupom += '*** COMPROVANTE DE VENDA ***\n';
  cupom += `Quiosque: ${quiosque}\n`;
  cupom += '-----------------------------\n';

  for (const [sku, qtd] of Object.entries(venda)) {
    const precoUnit = vendaPrecos[sku] || 0;  // Pegue o preço do seu sistema
    const subtotal = precoUnit * qtd;
    cupom += `${sku} x${qtd} - R$ ${subtotal.toFixed(2)}\n`;
  }

  cupom += '-----------------------------\n';
  if (desconto > 0) cupom += `Desconto: -R$ ${desconto.toFixed(2)}\n`;

  cupom += `TOTAL: R$ ${total.toFixed(2)}\n`;

  cupom += '\nFormas de Pagamento:\n';
  pagamentos.forEach(p => {
    cupom += `${p.forma}: R$ ${p.valor.toFixed(2)}\n`;
  });

  cupom += '\nObrigado pela compra!\n\n\n\n\n';

  return cupom;
}
