const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    // Tipul tranzacției
    transaction_type: {
        type: String,
        enum: ['BUY', 'SELL'],
        required: true
    },
    // Moneda (ex: BTC, ETH)
    currency: {
        type: String,
        required: true
    },
    // Cantitatea tranzacționată
    units: {
        type: Number,
        required: true
    },
    // Prețul la care s-a executat (per unitate)
    price_per_unit: {
        type: Number,
        required: true
    },
    // Valoarea totală (calculată: units * price_per_unit)
    total_value: {
        type: Number,
        required: true
    },
    pnl: {
        type: Number,
        default: 0
    },
    // Referință către Pocket-ul care a generat tranzacția
    pocket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pocket',
        required: true
    },
    is_closed: {
        type: Boolean,
        default: false
    }, // Devine true după ce se vinde
    related_sell_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    }, // Legătura cu Sell-ul
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);