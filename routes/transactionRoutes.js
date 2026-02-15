const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// --- GET ALL TRANSACTIONS ---
router.get('/', async (req, res) => {
    try {
        const transactions = await Transaction.find()
            .populate('pocket')
            .sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- GET TRANSACTIONS FOR A SPECIFIC POCKET ---
router.get('/pocket/:pocketId', async (req, res) => {
    try {
        const transactions = await Transaction.find({ pocket: req.params.pocketId });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- POST NEW TRANSACTION ---
router.post('/', async (req, res) => {
    const tx = new Transaction({
        transaction_type: req.body.transaction_type,
        currency: req.body.currency,
        units: req.body.units,
        price_per_unit: req.body.price_per_unit,
        total_value: req.body.units * req.body.price_per_unit, // Calculăm automat aici
        pnl: req.body.pnl || 0,
        pocket: req.body.pocket
    });

    try {
        const savedTx = await tx.save();
        res.status(201).json(savedTx);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;