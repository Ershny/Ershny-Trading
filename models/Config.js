const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
    // Numele strategiei (ex: "Scalping RSI")
    strategy_name: {
        type: String,
        default: "Default Strategy"
    },
    watched_assets: [{
        type: String // Aici vei stoca array-ul de simboluri selectate din React: ["BTCUSDT", "ETHUSDT"]
    }],
    // --- INDICATORI TEHNICI ---
    rsi_period: {
        type: Number,
        default: 14
    },
    rsi_overbought: {
        type: Number,
        default: 70
    },
    rsi_oversold: {
        type: Number,
        default: 30
    },
    // --- MANAGEMENTUL RISCULUI ---
    profit_target_percent: {
        type: Number,
        default: 2.0 // Vinzi la +2%
    },
    stop_loss_percent: {
        type: Number,
        default: 1.5 // Vinzi la -1.5%
    },
    // --- SETĂRI BOT ---
    is_bot_active: {
        type: Boolean,
        default: false
    },
    check_interval_seconds: {
        type: Number,
        default: 60
    },
    last_updated: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Config', configSchema);