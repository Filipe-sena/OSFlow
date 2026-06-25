const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({
    nome: String,
    valor: {type: Number, default: 200}
})

module.exports = mongoose.model('Counter', CounterSchema)