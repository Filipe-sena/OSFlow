const expresss = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = expresss()

app.use(cors());
app.use(expresss.json());

mongoose.connect(process.env.MONGO_URI, {
    family: 4
})
    .then(() => console.log("conectado com sucesso ao mongodb atlas"))
    .catch(err => console.error('Erro na conexão', err))

app.get("/", (req, res) => {
    res.send("O backend do osflow está online e pronto")
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`)
})

const verificarToken = (req, res, next) => {
    // O token geralmente é enviado no cabeçalho 'Authorization'
    const token = req.header('Authorization');
    
    if (!token) return res.status(401).json({ message: "Acesso negado. Faça login." });

    try {
        // O servidor usa a chave secreta do .env para ler o token
        const verificado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = verificado; // Aqui o ID do seu usuário é guardado na requisição
        next(); // Libera para a rota
    } catch (err) {
        res.status(400).json({ message: "Token inválido." });
    }
};

const OrdemServico = require('./models/OrdemServico')
const Counter = require('./models/Counter')

app.post('/os', verificarToken, async (req, res) => {
    try {
        // 1. Vai no contador e soma +1 (ou cria o contador se ele não existir)
        const contadorAtualizado = await Counter.findOneAndUpdate(
            { nome : 'os_identificador' },
            { $inc: { valor : 1 } },
            { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true}
        );

        // 2. Pega o número novo (ex: 101) e coloca nos dados da nova OS
        const dadosDaOs = {
            ...req.body,
            numero_os: contadorAtualizado.valor, // <--- Carimba o número aqui
            usuario: req.usuario.id
        };

        const novaOs = new OrdemServico(dadosDaOs);
        const osSalva = await novaOs.save();

        res.status(201).json(osSalva);
    }
    catch (err) {
        res.status(400).json({ message: "Erro ao salvar OS", erro: err.message });
    }
});

app.get('/os', verificarToken,  async (req,res) =>{
    try{
        const todasOS = await OrdemServico.find({ usuario: req.usuario.id }).populate('cliente');
        res.status(200).json(todasOS)
    }
    catch (err){
        res.status(500).json({ message: "Erro ao buscar as OS", erro: err.message });
    }
})

app.delete('/os/:id', async (req,res) => {
    try{
        const id = req.params.id
        const osExcluida = await OrdemServico.findByIdAndDelete(id)
        if (!osExcluida){
            return res.status(400).json({message: "Erro ao encontrar OS"})
        }
        res.status(200).json({message: "OS excluída com sucesso"})
    }
    catch (err){
        res.status(500).json({message: "Erro ao excluir OS", erro: err.message})
    }
})

app.put('/os/:id', async (req,res) => {
    try{
        const id = req.params.id
        const dadosOs = req.body
        const osAtualizada = await OrdemServico.findByIdAndUpdate(id, dadosOs, {returnDocument: 'after'})

        if(!osAtualizada){
            return res.status(400).json({message:"Não foi possível encontrar esta OS"})
        }
        res.status(200).json(osAtualizada)
    }
    catch(err){
        res.status(500).json({message: "Não foi possível se conectar ao servidor"})
    }
})

app.get('/os/:id/pdf', async (req, res) => {
    try {
        // Busca a OS populando o cliente para exibir o nome dele no PDF
        const os = await OrdemServico.findById(req.params.id).populate('cliente');
        if (!os) return res.status(404).send("Ordem de serviço não encontrada");

        const doc = new PDFDocument({ 
            margin: 50,
            size: 'A4'
        });

        // Configura os cabeçalhos de resposta para download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=OS_${os.numero_os}.pdf`);

        doc.pipe(res);

        // --- Cores do Tema ---
        const azulEscuro = '#1e293b'; // Slate 800 (Elegante e moderno)
        const cinzaClaro = '#f8fafc'; // Fundo dos blocos
        const cinzaBorda = '#e2e8f0'; // Linhas divisórias
        const textoEscuro = '#0f172a'; // Cor principal do texto
        const textoMutado = '#64748b'; // Cor secundária para etiquetas

        // --- 1. CABEÇALHO COM DESIGN MODERNO ---
        // Faixa superior decorativa
        doc.rect(0, 0, 612, 110).fill(azulEscuro);

        // Título e Subtítulo dentro da faixa (Brancos)
        doc.fillColor('#ffffff')
           .font('Helvetica-Bold')
           .fontSize(22)
           .text('ORDEM DE SERVIÇO', 50, 40);

        doc.font('Helvetica')
           .fontSize(10)
           .fillColor('#94a3b8')
           .text(`SISTEMA OSFLOW - RELATÓRIO OFICIAL`, 50, 68);

        // Número da OS destacado no canto superior direito
        doc.fillColor('#ffffff')
           .font('Helvetica-Bold')
           .fontSize(24)
           .text(`Nº ${os.numero_os || '---'}`, 430, 45, { align: 'right', width: 130 });

        // Ajusta o cursor para começar abaixo da faixa azul do cabeçalho
        doc.y = 140;

        // --- 2. BLOCO: INFORMAÇÕES GERAIS (Fundo Cinza) ---
        doc.rect(50, doc.y, 512, 105).fill(cinzaClaro).stroke(cinzaBorda);
        
        // Dados dentro do bloco
        let yInfo = doc.y + 15;
        doc.fillColor(textoEscuro);

        // Coluna 1 (Esquerda)
        doc.font('Helvetica-Bold').fontSize(10).fillColor(textoMutado).text('CLIENTE:', 70, yInfo);
        doc.font('Helvetica').fontSize(11).fillColor(textoEscuro).text(os.cliente ? os.cliente.nome : 'Não informado', 70, yInfo + 15);

        doc.font('Helvetica-Bold').fontSize(10).fillColor(textoMutado).text('DATA DE RECEBIMENTO:', 70, yInfo + 45);
        const dataRec = os.dataRecebimento ? new Date(os.dataRecebimento).toLocaleDateString('pt-BR') : '---';
        doc.font('Helvetica').fontSize(11).fillColor(textoEscuro).text(dataRec, 70, yInfo + 60);

        // Coluna 2 (Direita)
        doc.font('Helvetica-Bold').fontSize(10).fillColor(textoMutado).text('TIPO DE SERVIÇO:', 330, yInfo);
        const tipoTexto = os.tipo === 'manutencao' ? 'Manutenção' : 'Instalação';
        doc.font('Helvetica').fontSize(11).fillColor(textoEscuro).text(tipoTexto, 330, yInfo + 15);

        doc.font('Helvetica-Bold').fontSize(10).fillColor(textoMutado).text('STATUS ATUAL:', 330, yInfo + 45);
        doc.font('Helvetica-Bold').fontSize(11).fillColor(azulEscuro).text(os.status.toUpperCase(), 330, yInfo + 60);

        // Empurra o cursor para baixo do bloco de Info
        doc.y = yInfo + 110;

        // --- 3. BLOCO: CAMPOS ESPECÍFICOS (Condicional) ---
        doc.font('Helvetica-Bold').fontSize(13).fillColor(azulEscuro).text('Informações Detalhadas', 50, doc.y);
        doc.moveDown(0.5);
        doc.lineWidth(1).moveTo(50, doc.y).lineTo(562, doc.y).stroke(cinzaBorda);
        doc.moveDown(1);

        doc.fillColor(textoEscuro);
        if (os.tipo === 'manutencao') {
            doc.font('Helvetica-Bold').fontSize(11).text('Aparelho / Produto:');
            doc.font('Helvetica').fontSize(11).fillColor('#334155').text(os.produto || 'Não informado');
            doc.moveDown(0.8);

            doc.font('Helvetica-Bold').fillColor(textoEscuro).text('Defeito Relatado:');
            doc.font('Helvetica').fillColor('#334155').text(os.relato || 'Não informado');
            doc.moveDown(0.8);

            doc.font('Helvetica-Bold').fillColor(textoEscuro).text('Laudo Técnico:');
            doc.font('Helvetica').fillColor('#334155').text(os.laudo || 'Sem laudo cadastrado');
            doc.moveDown(0.8);

            doc.font('Helvetica-Bold').fillColor(textoEscuro).text('Observações Adicionais:');
            doc.font('Helvetica').fillColor('#334155').text(os.observacao || 'Nenhuma');
            doc.moveDown(0.8);

            doc.font('Helvetica-Bold').fillColor(textoEscuro).text('Data de Entrega:');
            const dataEnt = os.dataEntrega ? new Date(os.dataEntrega).toLocaleDateString('pt-BR') : 'Não entregue';
            doc.font('Helvetica').fillColor('#334155').text(dataEnt);
        } else {
            // Instalação
            doc.font('Helvetica-Bold').fontSize(11).text('Descrição do Serviço de Instalação:');
            doc.font('Helvetica').fontSize(11).fillColor('#334155').text(os.instalacaoDescricao || 'Não informado');
            doc.moveDown(1);

            doc.font('Helvetica-Bold').fillColor(textoEscuro).text('Valor da Mão de Obra:');
            const maoObra = os.valorMaoDeObra ? `R$ ${os.valorMaoDeObra.toFixed(2).replace('.', ',')}` : 'R$ 0,00';
            doc.font('Helvetica').fillColor('#334155').text(maoObra);
        }

        // --- 4. RODAPÉ DE VALORES (Fixado na parte inferior da página) ---
        const yRodape = 700;
        doc.lineWidth(1.5).moveTo(50, yRodape).lineTo(562, yRodape).stroke(azulEscuro);

        // Valor Total destacado
        doc.font('Helvetica-Bold')
           .fontSize(12)
           .fillColor(textoMutado)
           .text('VALOR TOTAL:', 50, yRodape + 15);

        doc.fontSize(20)
           .fillColor(azulEscuro)
           .text(`R$ ${os.valor.toFixed(2).replace('.', ',')}`, 50, yRodape + 30);

        // Assinatura do Técnico/Responsável no lado direito
        doc.lineWidth(1)
           .moveTo(350, yRodape + 45)
           .lineTo(550, yRodape + 45)
           .stroke(textoMutado);

        doc.font('Helvetica')
           .fontSize(9)
           .fillColor(textoMutado)
           .text('Assinatura do Técnico / Responsável', 350, yRodape + 52, { align: 'center', width: 200 });

        doc.end();
    } catch (err) {
        res.status(500).json({ message: "Erro ao gerar PDF", erro: err.message });
    }
});

const Cliente = require('./models/Cliente');

app.post('/cliente', verificarToken, async (req,res) =>{
    try{
        const dadosCliente = {
            ...req.body,
            usuario: req.usuario.id
        }
        const novoCliente = new Cliente(dadosCliente)
        const ClienteSalvo = await novoCliente.save()
        res.status(201).json(ClienteSalvo);
    }
    catch(err){
        res.status(400).json({message: "Erro ao salvar OS", erro: err.message})
    }
})

app.get('/cliente', verificarToken, async (req,res) => {
    try{
        const listaClientes =  await Cliente.find({usuario: req.usuario.id})
        res.status(200).json(listaClientes)
    }
    catch(err){
        res.status(500).json({message:"Erro ao encontar Clientes", erro: err.message})
    }
})

app.delete('/cliente/:id', async (req,res) => {
    try{
        const id = req.params.id
        const ClienteExcluido = await Cliente.findByIdAndDelete(id)
        if(!ClienteExcluido){
            return res.status(400).json({message: "Cliente não encontrado"})
        }
        res.status(200).json({message: "Cliente Deletado"})
    }
    catch(err){
        res.status(500).json({message: "Não foi possível se conectar ao servidor"})
    }
})

app.put('/cliente/:id', async (req, res) => {
    try{
        const id = req.params.id
        const dadosCliente = req.body
        const clienteAtualizado = await Cliente.findByIdAndUpdate(id, dadosCliente, {returnDocument: 'after'})
        if (!clienteAtualizado){
            return res.status(400).json({message: "Não foi possível encontrar este cliente"})
        }
        res.status(200).json(clienteAtualizado)
    }
    catch(err){
        res.status(500).json({message: "Não foi possível se conectar ao servidor"})
    }
})

const Produto = require('./models/Produtos')
app.post('/produto', verificarToken, async (req,res) => {
    try{
        const dadosProduto = {
            ...req.body,
            usuario: req.usuario.id
        }
        const novoProduto = new Produto(dadosProduto)
        const produtoSalvo = await novoProduto.save()
        res.status(201).json(produtoSalvo)        
    } catch (err){
        res.status(400).json({message: "Erro ao salvar produto", erro: err.message})
    }
})

app.get('/produto', verificarToken, async (req,res) => {
    try{
        const listaProdutos = await Produto.find({usuario: req.usuario.id})
        res.status(200).json(listaProdutos)
    }
    catch(err){
        res.status(500).json({message: "Erro ao encontrar produtos", erro: err.message})
    }
})

app.delete('/produto/:id', async (req,res) => {
    try{
        const id = req.params.id
        const produtoExcluido = Produto.findByIdAndDelete(id)
        if(!produtoExcluido){
            return res.status(400).json({message: "Produto não encontrado"})
        }
        res.status(200).json({message: "Produto Deletado"})
    }
    catch(err){
        res.status(500).json({message: "Não foi possível se conectar ao servidor"})
    }
})

app.put('/produto/:id', async (req,res) => {
    try{
        const id = req.params.id
        const dadosProduto = req.body
        const produtoAtualizado = await Produto.findByIdAndUpdate(id, dadosProduto, {returnDocument: 'after'})

        if(!produtoAtualizado){
            return res.status(400).json({message:"Não foi possível encontrar este Produto"})
        }
        res.status(200).json(produtoAtualizado)
    }
    catch(err){
        res.status(500).json({message: "Não foi possível se conectar ao servidor"})
    }
})

const Venda = require('./models/Venda')
app.post('/venda', verificarToken, async (req,res) => {
    try{
        const dadosVenda = {
            ...req.body,
            usuario: req.usuario.id
        }
        const novaVenda = new Venda(dadosVenda)
        const vendaSalva = await novaVenda.save()
        res.status(201).json(vendaSalva)
    } 
    catch(err){
        res.status(400).json({message: "Erro ao registrar venda", erro: err.message})
    }
})

app.get('/venda', verificarToken, async (req,res) =>{
    try{
        const listaVendas = await Venda.find({usuario: req.usuario.id}).sort({ data: -1 });
        res.status(200).json(listaVendas)
    }
    catch(err){
        res.status(500).json({message: "Erro ao encontrar vendas", erro: err.message})
    }
})

const Usuario = require('./models/Usuario');
app.post('/auth/register', async (req, res) => {
    try {
        const { username, senha } = req.body;
        
        // Criptografa a senha antes de salvar
        const salt = await bcrypt.genSalt(10);
        const senhaCriptografada = await bcrypt.hash(senha, salt);

        const novoUsuario = new Usuario({
            username: username,
            senha: senhaCriptografada
        });
        await novoUsuario.save();

        res.status(201).json({ message: "Usuário criado com sucesso!" });
    } catch (err) {
        res.status(400).json({ message: "Erro ao criar usuário", erro: err.message });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { username, senha } = req.body;
        const usuario = await Usuario.findOne({ username });

        if (!usuario) return res.status(400).json({ message: "Username ou senha incorretos" });

        // Compara a senha digitada com a criptografada no banco
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) return res.status(400).json({ message: "Username ou senha incorretos" });

        // Cria o Token (o "crachá") que expira em 1 dia
        const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, nome: usuario.username });
    } catch (err) {
        res.status(500).json({ message: "Erro no servidor" });
    }
});

