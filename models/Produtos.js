const mongoose = require('mongoose')

const ProdutoSchema = new mongoose.Schema({
    produto: {type: String, required: true},
    descricao: String,
    valorCompra: {type: Number, default: 0},
    valorVenda: {type: Number, default: 0},
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    estoque: { type: Number, default: 0 }
})

module.exports = mongoose.model('Produtos', ProdutoSchema)