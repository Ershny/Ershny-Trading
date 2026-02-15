const mongoose = require('mongoose');

const portofolioSchema = new mongoose.Schema({
    // Numele portofoliului (ex: "Main Binace", "Test Bot")
    name: {
        type: String,
        required: true
    },
    // Legătura către setările acestui portofoliu
    config: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Config',
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Paused', 'Inactive'],
        default: 'Inactive'
    },
    // Data creării (generată automat)
    createdDate: {
        type: Date,
        default: Date.now
    }
});

// Exportăm folosind numele "Portofolio"
module.exports = mongoose.model('Portofolio', portofolioSchema);