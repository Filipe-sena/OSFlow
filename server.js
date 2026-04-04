const expresss = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
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
    console.log(`Servidor rodando em https://localhost:${PORT}`)
})

const OrdemServico = require('./models/OrdemServico')

app.post('/os', async (req,res) =>{
    try{
        const novaOs = new OrdemServico(req.body);
        const osSalva = await novaOs.save();

        res.status(201).json(osSalva);
    }
    catch (err){
        res.status(400).json({ message: "Erro ao salvar OS", erro: err.message });
    }
})

app.get('/os', async (req,res) =>{
    try{
        const todasOs = await OrdemServico.find()
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

const Cliente = require('./models/Cliente');

app.post('/cliente', async (req,res) =>{
    try{
        const novoCliente = new Cliente(req.body)
        const ClienteSalvo = await novoCliente.save()
        res.status(201).json(ClienteSalvo);
    }
    catch(err){
        res.status(400).json({message: "Erro ao buscar OS", erro: err.message})
    }
})

app.get('/cliente', async (req,res) => {
    try{
        const listaClientes =  await Cliente.find()
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