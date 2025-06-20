const fs = require('fs');
const path = require('path');

const relatoriosDir = path.join(__dirname, '../relatorios');

exports.page = (req, res) => {
  res.render('relatorio');
};

exports.salvar = (req, res) => {
  const { quiosque, dados, separador } = req.body;

  if (!quiosque || !dados) {
    return res.status(400).json({ mensagem: "Quiosque e dados são obrigatórios." });
  }

  let texto = `Separador: ${separador || 'Não informado'}\nQuiosque: ${quiosque}\n\n`;
  texto += Object.entries(dados)
    .map(([sku, qtd]) => `${sku}\t${qtd}`)
    .join('\n');

  const nomeArquivo = `${Date.now()}_${quiosque.replace(/[^a-zA-Z0-9-_]/g, '-')}.txt`;
  const caminhoArquivo = path.join(relatoriosDir, nomeArquivo);

  try {
    fs.writeFileSync(caminhoArquivo, texto, 'utf-8');
    res.json({ mensagem: "Relatório salvo com sucesso!", arquivo: nomeArquivo });
  } catch (err) {
    console.error("Erro ao salvar relatório:", err);
    res.status(500).json({ mensagem: "Erro ao salvar relatório." });
  }
};

exports.listar = (req, res) => {
  fs.readdir(relatoriosDir, (err, files) => {
    if (err) {
      return res.status(500).json({ mensagem: 'Erro ao listar relatórios.' });
    }
    const txtFiles = files.filter(f => f.endsWith('.txt'));
    res.json(txtFiles);
  });
};

exports.ler = (req, res) => {
  const nomeArquivo = req.params.nomeArquivo;
  const caminhoArquivo = path.join(relatoriosDir, nomeArquivo);

  if (!nomeArquivo.endsWith('.txt') || nomeArquivo.includes('..')) {
    return res.status(400).json({ mensagem: 'Nome de arquivo inválido.' });
  }

  if (req.query.raw === 'true') {
    return res.download(caminhoArquivo, nomeArquivo);
  }

  fs.readFile(caminhoArquivo, 'utf-8', (err, data) => {
    if (err) {
      return res.status(404).json({ mensagem: 'Arquivo não encontrado.' });
    }
    res.json({ conteudo: data });
  });
};

exports.deletar = (req, res) => {
  const nomeArquivo = req.params.nomeArquivo;
  const caminhoArquivo = path.join(relatoriosDir, nomeArquivo);

  if (!nomeArquivo.endsWith('.txt') || nomeArquivo.includes('..')) {
    return res.status(400).json({ mensagem: 'Nome de arquivo inválido.' });
  }

  fs.unlink(caminhoArquivo, (err) => {
    if (err) {
      return res.status(404).json({ mensagem: 'Arquivo não encontrado ou erro ao apagar.' });
    }
    res.json({ mensagem: 'Arquivo apagado com sucesso.' });
  });
};
