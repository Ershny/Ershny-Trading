require('dotenv').config();
const mongoose = require('mongoose');
const Config = require('./models/Config');
const Portofolio = require('./models/Portofolio');
const Pocket = require('./models/Pocket');
const Transaction = require('./models/Transaction');

const MONGO_URI = process.env.MONGO_URI;

async function seedDB() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("🚀 Conectat la DB...");

        await Config.deleteMany({});
        await Portofolio.deleteMany({});
        await Pocket.deleteMany({});
        await Transaction.deleteMany({});
        console.log("🧹 Baza de date a fost curățată.");

        const WATCHLIST = [
            "BTCUSDC", "ETHUSDC", "BNBUSDC", "SOLUSDC", "XRPUSDC", "ADAUSDC",
            "AVAXUSDC", "DOTUSDC", "MATICUSDC", "NEARUSDC", "LTCUSDC", "ATOMUSDC",
            "LINKUSDC", "APTUSDC", "ARBUSDC", "OPUSDC", "SUIUSDC", "INJUSDC",
            "FETUSDC", "RENDERUSDC", "TAOUSDC",
            "IMXUSDC", "GALAUSDC", "SANDUSDC", "AXSUSDC",
            "DOGEUSDC", "SHIBUSDC", "PEPEUSDC", "BONKUSDC", "FLOKIUSDC", "WIFUSDC",
            "MEMEUSDC", "JUPUSDC", "PYTHUSDC", "TIAUSDC", "SEIUSDC"
        ];

        // 1. Configuri
        const cSafe = await Config.create({
            strategy_name: "Safe RSI Strategy",
            rsi_threshold: 14, rsi_oversold: 30, rsi_overbought: 70,
            profit_target_percent: 3.0, stop_loss_percent: 2.0,
            watched_assets: WATCHLIST
        });

        const cMedium = await Config.create({
            strategy_name: "Balanced RSI Strategy",
            rsi_threshold: 14, rsi_oversold: 40, rsi_overbought: 70,
            profit_target_percent: 2.0, stop_loss_percent: 2.0,
            watched_assets: WATCHLIST
        });

        const cAggressive = await Config.create({
            strategy_name: "Aggressive RSI Strategy",
            rsi_threshold: 14, rsi_oversold: 48, rsi_overbought: 70,
            profit_target_percent: 1.0, stop_loss_percent: 2.0,
            watched_assets: WATCHLIST
        });

        const portfolioData = [
            { name: "Portofoliu Conservator", config: cSafe._id },
            { name: "Portofoliu Mediu", config: cMedium._id },
            { name: "Portofoliu Agresiv", config: cAggressive._id }
        ];

        for (const p of portfolioData) {
            const createdPortfolio = await Portofolio.create(p);
            console.log(`✅ Portofoliu Creat: ${createdPortfolio.name}`);

            for (let i = 1; i <= 4; i++) {
                await Pocket.create({
                    name: `Buzunar ${i} - ${createdPortfolio.name}`,
                    portofolio: createdPortfolio._id,
                    initial_funds: 250,
                    current_funds: 250,
                    currency: "USDC",
                    status: "Open"
                });
            }
        }

        console.log("\n✨ Seeding finalizat!");
    } catch (err) {
        console.error("❌ Eroare Seeding:", err);
    } finally {
        // Închidem conexiunea elegant
        await mongoose.disconnect();
        process.exit();
    }
}

// APELUL CORECT care nu mai ignoră promisiunea:
seedDB().then(() => console.log("Script terminat."));