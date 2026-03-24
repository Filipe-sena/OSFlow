const expresss = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = expresss()

app.use(cors());
app.use(expresss.json());

mongoose.connect(process.env.MONGO_URI)
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