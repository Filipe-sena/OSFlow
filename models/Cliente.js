const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema({
    nome: {type:String, required: true},
    cpf: Number,
    descricao: String,
    telefone: {type: Number, required: true},
    endereco: String
})

module.exports = mongoose.model("Cliente", ClienteSchema)