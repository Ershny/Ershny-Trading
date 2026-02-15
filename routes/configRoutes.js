const express = require('express');
const router = express.Router();
const Config = require('../models/Config');
const Portofolio = require('../models/Portofolio');

// --- POST: Creează un profil nou de config ---
router.post('/', async (req, res) => {
    try {
        const newConfig = new Config(req.body);
        const savedConfig = await newConfig.save();
        res.status(201).json(savedConfig);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- GET: Preia TOATE configurațiile (pentru listă) ---
router.get('/all', async (req, res) => {
    try {
        const configs = await Config.find();
        res.json(configs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- GET: Preia o configurație specifică după ID ---
router.get('/:id', async (req, res) => {
    try {
        const config = await Config.findById(req.params.id);
        if (!config) return res.status(404).json({ message: "Archer: Strategy not found." });
        res.json(config);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- PUT: Actualizează o configurație specifică după ID ---
router.put('/:id', async (req, res) => {
    try {
        const updatedConfig = await Config.findByIdAndUpdate(
            req.params.id,
            req.body,
            { returnDocument: 'after' }
        );

        if (!updatedConfig) {
            return res.status(404).json({ message: "Archer: Strategy not found." });
        }

        res.json(updatedConfig);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const strategyId = req.params.id;

        // 1. Verificăm dacă strategia este folosită în vreun portofoliu
        const isAssigned = await Portofolio.findOne({ config: strategyId });

        if (isAssigned) {
            return res.status(409).json({
                message: "Archer: Mission Aborted. Strategy is currently deployed in an active Portfolio. Remove it from the portfolio first!"
            });
        }

        // 2. Dacă nu este asignată, o ștergem
        const deletedConfig = await Config.findByIdAndDelete(strategyId);

        if (!deletedConfig) {
            return res.status(404).json({ message: "Archer: Strategy not found." });
        }

        res.json({ message: "Strategy dismantled successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;