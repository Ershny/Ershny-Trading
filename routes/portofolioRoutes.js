const express = require('express');
const router = express.Router();
// Importăm modelul Portofolio
const Portofolio = require('../models/Portofolio');


// --- GET: Vezi toate portofoliile (cu tot cu buzunare) ---
router.get('/', async (req, res) => {
    try {
        // 1. Luăm toate portofoliile
        const portofolios = await Portofolio.find().sort({ createdDate: -1 }).lean();
        const Pocket = require('../models/Pocket');

        // 2. Pentru fiecare portofolio, căutăm buzunarele lui
        const dataWithPockets = await Promise.all(portofolios.map(async (port) => {
            const pockets = await Pocket.find({ portofolio: port._id });
            return {
                ...port,
                total_pockets: pockets.length,
                pockets: pockets.map(p => ({
                    is_occupied: p.status === 'Closed', // Closed la tine înseamnă că e ocupat cu un trade
                    currency: p.currency
                }))
            };
        }));

        res.json(dataWithPockets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- GET: Vezi un singur portofolio după ID ---
router.get('/:id', async (req, res) => {
    try {
        const portofolio = await Portofolio.findById(req.params.id);
        if (!portofolio) {
            return res.status(404).json({ message: "Portofolio nu a fost găsit" });
        }
        res.json(portofolio);
    } catch (err) {
        res.status(400).json({ message: "ID invalid" });
    }
});

// --- POST: Creează un portofolio nou ---
router.post('/', async (req, res) => {
    const portofolio = new Portofolio({
        name: req.body.name,
        config: req.body.configId
    });

    try {
        const saved = await portofolio.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- DELETE: Șterge un portofolio ---
router.delete('/:id', async (req, res) => {
    try {
        await Portofolio.findByIdAndDelete(req.params.id);
        res.json({ message: "Portofolio șters" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;