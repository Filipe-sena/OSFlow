const mongoose = require('mongoose');

const OrdemServicoSchema = new mongoose.Schema({
    // Campo para identificar o tipo: 'manutencao' ou 'instalacao'
    tipo: { 
        type: String, 
        enum: ['manutencao', 'instalacao'], 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['orcamento', 'andamento', 'pagamento', 'concluido'], 
        default: 'orcamento',
        required: true 
    },
    cliente: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Cliente', 
        required: true 
    },
    dataRecebimento: { 
        type: Date, 
        required: true 
    },
    valor: { 
        type: Number, 
        required: true,
        default: 0 
    },
    usuario: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Usuario', 
        required: true 
    },

    // =======================================================================
    // CAMPOS EXCLUSIVOS DE MANUTENÇÃO
    // =======================================================================
    produto: { 
        type: String 
    },
    observacao: { 
        type: String 
    },
    relato: { 
        type: String 
    },
    laudo: { 
        type: String 
    },
    dataEntrega: { 
        type: Date 
    },

    // =======================================================================
    // CAMPOS EXCLUSIVOS DE INSTALAÇÃO
    // =======================================================================
    instalacaoDescricao: { 
        type: String 
    },
    valorMaoDeObra: { 
        type: Number,
        default: 0
    }
}, { 
    timestamps: true // Cria automaticamente os campos createdAt e updatedAt no banco
});

module.exports = mongoose.model('OrdemServico', OrdemServicoSchema);