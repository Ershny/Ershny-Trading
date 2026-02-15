const mongoose = require('mongoose');

const pocketSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    initial_funds: {
        type: Number,
        default: 0
    },
    current_funds:{
        type: Number,
        default: 0
    },
    // Status cu validare pentru valorile permise
    status: {
        type: String,
        enum: ['Open', 'Closed'],
        default: 'Open'
    },
    currency: {
        type: String,
        default: null
    },
    units: {
        type: Number,
        default: 0
    },
    // LINK-UL CĂTRE PORTOFOLIU
    portofolio: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Portofolio', // Identic cu numele din module.exports de mai sus
        required: true
    },
    created_date: {
        type: Date,
        default: Date.now
    },
    // Data ultimei activități (achiziție/vânzare)
    last_active: {
        type: Date,
        default: null
    }
});

module.exports = mongoose.model('Pocket', pocketSchema);