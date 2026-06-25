const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema({
    nome: {type:String, required: true},
    cpf: Number,
    descricao: String,
    telefone: {type: Number, required: true},
    endereco: String,
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true }
})

module.exports = mongoose.model("Cliente", ClienteSchema)