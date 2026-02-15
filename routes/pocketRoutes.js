const express = require('express');
const router = express.Router();
const Pocket = require('../models/Pocket');

// --- GET ALL POCKETS ---
router.get('/', async (req, res) => {
    try {
        const pockets = await Pocket.find().populate('portofolio');
        res.json(pockets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- GET SINGLE POCKET ---
router.get('/:id', async (req, res) => {
    try {
        const pocket = await Pocket.findById(req.params.id).populate('portfolio');
        if (!pocket) return res.status(404).json({ message: "Pocket-ul nu a fost găsit" });
        res.json(pocket);
    } catch (err) {
        res.status(400).json({ message: "ID invalid" });
    }
});

router.get('/byportofolio/:id', async (req, res) => {
   try {
       const pockets = await Pocket.find({portofolio: req.params.id});
       res.json(pockets);
   } catch (err) {
       res.status(400).json({ message: "ID invalid" });
   }
});

// --- POST NEW POCKET ---
router.post('/', async (req, res) => {
    const pocket = new Pocket({
        name: req.body.name,
        initial_funds: req.body.initial_funds,
        currency: req.body.currency,
        units: req.body.units,
        portfolio: req.body.portfolio
    });

    try {
        const savedPocket = await pocket.save();
        res.status(201).json(savedPocket);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * --- PUT: UPDATE POCKET ---
 * Aceasta este ruta pe care o va apela botul la fiecare tranzacție.
 * Permite modificarea statusului, monedei, unităților și a datei de activitate.
 */
router.put('/:id', async (req, res) => {
    try {
        // Extragem datele trimise pentru update
        const updates = req.body;

        // Dacă botul face un update pe pocket, înseamnă că e activ "acum"
        // Setăm automat last_active la data curentă dacă nu e trimisă specific
        if (!updates.last_active) {
            updates.last_active = Date.now();
        }

        const updatedPocket = await Pocket.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true } // Această opțiune returnează obiectul nou, modificat
        );

        if (!updatedPocket) {
            return res.status(404).json({ message: "Pocket-ul nu a fost găsit pentru update" });
        }

        res.json(updatedPocket);
    } catch (err) {
        res.status(400).json({ message: "Eroare la actualizarea pocket-ului", error: err.message });
    }
});

// --- DELETE POCKET ---
router.delete('/:id', async (req, res) => {
    try {
        await Pocket.findByIdAndDelete(req.params.id);
        res.json({ message: "Pocket eliminat cu succes" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;