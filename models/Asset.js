const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
    symbol: { type: String, required: true, unique: true }, // ex: "BTCUSDT"
    baseAsset: { type: String, required: true },           // ex: "BTC"
    quoteAsset: { type: String, required: true },          // ex: "USDT"
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Asset', assetSchema);