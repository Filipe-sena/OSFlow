const mongoose = require('mongoose');

const OSSchema = new mongoose.Schema({
    cliente:{
        type: String,
        required : true
    },
    produto:{
        type: String,
        required: true
    },
    descricao: String,
    valor: { 
        type: Number, 
        default: 0 
    },
    status: { 
        type: String, 
        enum: ['orcamento','andamento', 'pagamento', 'concluido'], // Só aceita esses valores
        default: 'Aberto' 
    },
    dataCriacao: { 
        type: Date, 
        default: Date.now 
    }
})

module.exports = mongoose.model('OrdemServico', OSSchema)