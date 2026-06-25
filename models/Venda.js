const mongoose = require('mongoose')

const VendaSchema = new mongoose.Schema({
    data: { type: Date, default: Date.now },
    produto: String,           // Nome do produto ou serviço prestado
    valorDeCompra: Number,
    valorCobrado: Number,      // O valor final pago pelo cliente (com desconto)
    lucro: Number,             // valorCobrado - valorCompra
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true }
});

module.exports = mongoose.model('Venda', VendaSchema)