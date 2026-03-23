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
