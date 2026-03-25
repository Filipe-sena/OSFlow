const mongoose = require('mongoose');

const OSSchema = new mongoose.Schema({
    cliente: { type: String, required: true },
    produto: { type: String, required: true },
    observacao: String,
    relato: String,
    laudo: String,
    valor: { type: Number, default: 0 },
    status: { 
        type: String, 
        enum: ['orcamento','andamento', 'pagamento', 'concluido'],
        default: 'orcamento' 
    },
    dataRecebimento: Date,
    dataEntrega: Date,
    dataCriacao: { type: Date, default: Date.now }
})

module.exports = mongoose.model('OrdemServico', OSSchema)