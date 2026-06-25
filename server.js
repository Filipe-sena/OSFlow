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
        const todasOs = await OrdemServico.find({usuario: req.usuario.id})
        res.status(200).json(todasOs)
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
        const os = await OrdemServico.findById(req.params.id);
        if (!os) return res.status(404).send("Ordem de serviço não encontrada");

        const doc = new PDFDocument({ margin: 50 });

        // Cabeçalho da resposta para download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=OS_${os.numero_os}.pdf`);

        doc.pipe(res); // Envia o PDF para o navegador

        // --- Layout do PDF ---
        doc.fontSize(20).text('RELATÓRIO DE ORDEM DE SERVIÇO', { align: 'center' });
        doc.moveDown();
        doc.lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke(); // Linha divisória
        doc.moveDown();

        doc.fontSize(12).text(`Número da OS: ${os.numero_os}`, { bullet: true });
        doc.text(`Cliente: ${os.cliente}`);
        doc.text(`Produto: ${os.produto}`);
        doc.text(`Status: ${os.status.toUpperCase()}`);
        doc.text(`Valor: R$ ${os.valor.toFixed(2)}`);
        
        doc.moveDown();
        doc.fontSize(14).text('Descrição Técnica:', { underline: true });
        doc.fontSize(12).text(`Relato: ${os.relato || 'N/A'}`);
        doc.text(`Laudo: ${os.laudo || 'Pendente'}`);

        doc.end(); // Finaliza e envia
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

