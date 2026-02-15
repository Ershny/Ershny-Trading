require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');

// Importuri Rute
const portofolioRoutes = require('./routes/portofolioRoutes');
const pocketRoutes = require('./routes/pocketRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const configRoutes = require('./routes/configRoutes');
const Asset = require('./models/Asset'); // Importăm direct modelul pentru o rută rapidă

// Import Utilitare
const syncAssets = require('./utils/binanceSync');

const app = express();
app.use(cors());
app.use(express.json());

// --- CONEXIUNE DB ---
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("✅ MongoDB Conectat.");

        // SINCRONIZARE INIȚIALĂ
        try {
            const count = await syncAssets();
            console.log(`🚀 Catalogul de active este gata (${count} monede).`);
        } catch (syncErr) {
            console.error("⚠️ Serverul a pornit, dar sincronizarea activelor a eșuat:", syncErr.message);
        }
    })
    .catch(err => console.error("❌ Eroare critică DB:", err));

// --- RUTE ---
app.use('/api/portofolios', portofolioRoutes);
app.use('/api/pockets', pocketRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/configs', configRoutes);

// Rută rapidă pentru a lua lista de monede în React
app.get('/api/assets', async (req, res) => {
    try {
        const assets = await Asset.find().sort({ baseAsset: 1 });
        res.json(assets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- CRON JOB (În fiecare noapte la 00:00) ---
cron.schedule('0 0 * * *', async () => {
    try {
        await syncAssets();
    } catch (err) {
        console.error("❌ Eroare la rularea Cron-ului:");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`📡 API funcțional pe portul ${PORT}`));