require('dotenv').config();
const mongoose = require('mongoose');
const Binance = require('node-binance-api');
const { RSI } = require('technicalindicators');

const Portofolio = require('./models/Portofolio');
const Config = require('./models/Config');
const Pocket = require('./models/Pocket');
const Transaction = require('./models/Transaction');

const binance = new Binance().options({
    APIKEY: process.env.BINANCE_API_KEY,
    APISECRET: process.env.BINANCE_API_SECRET,
    family: 4
});

const marketData = {};

// --- 1. CONECTARE ȘI PORNIRE ---
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("✅ Bot conectat la DB.");
        await initializeMarketData();
        startPriceStreaming();

        setInterval(async () => { await runTradingLogic(); }, 60000);
        await runTradingLogic();
    })
    .catch(err => console.error("❌ Eroare critică DB Bot:", err));

// --- 2. INIȚIALIZARE CACHE ---
async function initializeMarketData() {
    try {
        const configs = await Config.find({}).exec();
        const allAssets = configs.reduce((acc, c) => acc.concat(c.watched_assets || []), []);
        const uniqueSymbols = [...new Set(allAssets)];

        console.log(`\n📦 Inițializez buffer pentru ${uniqueSymbols.length} monede...`);

        let count = 0;
        for (const symbol of uniqueSymbols) {
            count++;
            try {
                const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=250`);
                if (!response.ok) throw new Error(`Status ${response.status}`);

                const ticks = await response.json();

                if (ticks && Array.isArray(ticks) && ticks.length > 0) {
                    marketData[symbol] = {
                        prices: ticks.map(t => parseFloat(t[4])),
                        rsi: 0,
                        currentPrice: parseFloat(ticks[ticks.length - 1][4])
                    };
                    updateRSI(symbol);
                    console.log(`   [${count}/${uniqueSymbols.length}] ✔️ ${symbol} configurat (RSI: ${marketData[symbol].rsi.toFixed(2)})`);
                }
            } catch (err) {
                console.log(`   [${count}/${uniqueSymbols.length}] ⚠️ ${symbol} sărit: ${err.message}`);
            }
            await new Promise(r => setTimeout(r, 50));
        }
        console.log("🚀 Cache complet! Pornesc scanarea live.\n");
    } catch (err) {
        console.error("❌ Eroare la inițializare cache:", err);
    }
}

// --- 3. CALCUL RSI ---
function updateRSI(symbol) {
    if (!marketData[symbol] || marketData[symbol].prices.length < 14) return;
    const rsiValues = RSI.calculate({ values: marketData[symbol].prices, period: 14 });
    if (rsiValues?.length > 0) marketData[symbol].rsi = rsiValues[rsiValues.length - 1];
}

// --- 4. WEBSOCKETS ---
function startPriceStreaming() {
    const symbols = Object.keys(marketData);
    if (symbols.length === 0) return;
    binance.websockets.prevDay(symbols, (error, response) => {
        const symbol = response?.symbol;
        const closePrice = parseFloat(response?.close);
        if (symbol && marketData[symbol] && !isNaN(closePrice)) marketData[symbol].currentPrice = closePrice;
    });
    setInterval(() => {
        for (const symbol in marketData) {
            const lastPrice = marketData[symbol].currentPrice;
            if(!isNaN(lastPrice)) {
                marketData[symbol].prices.shift();
                marketData[symbol].prices.push(lastPrice);
                updateRSI(symbol);
            }
        }
    }, 60000);
}

// --- 5. LOGICA SELL ---
async function checkSellSignals(portofolio) {
    // Luăm buzunarele ocupate
    let closedPockets = await Pocket.find({ portofolio: portofolio._id, status: 'Closed' }).exec();

    for (const pocket of closedPockets) {
        const lastBuy = await Transaction.findOne({
            pocket: pocket._id,
            transaction_type: 'BUY',
            is_closed: { $ne: true }
        }).sort({ timestamp: -1 }).exec();

        if (!lastBuy) continue;

        const symbol = lastBuy.currency;
        const currentPrice = marketData[symbol]?.currentPrice;
        if (!currentPrice || isNaN(currentPrice)) continue;

        const priceChangePct = ((currentPrice - lastBuy.price_per_unit) / lastBuy.price_per_unit) * 100;

        // Verificare Target Profit sau Stop Loss
        if (priceChangePct >= portofolio.config.profit_target_percent || priceChangePct <= -portofolio.config.stop_loss_percent) {
            const finalValue = lastBuy.units * currentPrice;
            console.log(`💰 [SELL] ${symbol} | Portofoliu: ${portofolio.name} | Profit: ${priceChangePct.toFixed(2)}%`);

            try {
                const sellTx = await Transaction.create({
                    pocket: pocket._id,
                    transaction_type: 'SELL',
                    currency: symbol,
                    price_per_unit: currentPrice,
                    units: lastBuy.units,
                    total_value: finalValue,
                    timestamp: new Date()
                });

                lastBuy.is_closed = true;
                lastBuy.related_sell_id = sellTx._id;
                await lastBuy.save();

                pocket.status = 'Open';
                pocket.currency = 'USDC';
                pocket.current_funds = finalValue;
                pocket.units = 0;
                await pocket.save();
                console.log(`✅ [SUCCESS] Poziție închisă: ${symbol}`);
            } catch (err) {
                console.error("❌ Sell Error:", err.message);
            }
        }
    }

    // --- TRANZIȚIA PAUSED -> INACTIVE ---
    // Verificăm dacă mai există buzunare ocupate după ce am procesat vânzările
    const remainingOccupied = await Pocket.countDocuments({ portofolio: portofolio._id, status: 'Closed' });
    if (remainingOccupied === 0 && portofolio.status === 'Paused') {
        console.log(`📴 [STATUS UPDATE] ${portofolio.name} este gol și era pe pauză. Devine INACTIVE.`);
        portofolio.status = 'Inactive';
        await portofolio.save();
    }
}

// --- 6. LOGICA BUY ---
async function checkBuySignals(portofolio) {
    // Dublă verificare pentru siguranță
    if (portofolio.status !== 'Active') return;

    const openPockets = await Pocket.find({ portofolio: portofolio._id, status: 'Open' }).exec();
    if (openPockets.length === 0) return;

    for (const symbol of portofolio.config.watched_assets) {
        const data = marketData[symbol];
        if (!data || !data.currentPrice || isNaN(data.currentPrice) || data.rsi === 0) continue;

        if (data.rsi <= portofolio.config.rsi_oversold) {
            // Verificăm să nu deținem deja această monedă în acest portofoliu
            const alreadyOwned = await Pocket.findOne({ portofolio: portofolio._id, currency: symbol, status: 'Closed' }).exec();
            if (alreadyOwned) continue;

            const targetPocket = openPockets[0];
            const amount = targetPocket.current_funds || 250;
            const units = amount / data.currentPrice;

            if (isNaN(units) || units <= 0) continue;

            console.log(`🚀 [BUY] ${symbol} | Portofoliu: ${portofolio.name} | RSI: ${data.rsi.toFixed(2)}`);
            try {
                await Transaction.create({
                    pocket: targetPocket._id,
                    transaction_type: 'BUY',
                    currency: symbol,
                    price_per_unit: data.currentPrice,
                    units: units,
                    total_value: amount,
                    timestamp: new Date()
                });

                targetPocket.status = 'Closed';
                targetPocket.currency = symbol;
                targetPocket.units = units;
                targetPocket.current_funds = 0;
                targetPocket.last_active = new Date();
                await targetPocket.save();

                // Break pentru a cumpăra o singură monedă per ciclu (evită "all-in" instant)
                break;
            } catch (err) {
                console.error("❌ Buy Error:", err.message);
            }
        }
    }
}

// --- 7. RUN LOGIC ---
async function runTradingLogic() {
    try {
        // Luăm doar portofoliile care nu sunt Inactive pentru a economisi resurse
        const portofolios = await Portofolio.find({ status: { $ne: 'Inactive' } }).populate('config').exec();
        console.log(`\n--- 🔍 Scanare (${new Date().toLocaleTimeString()}) ---`);
        for (const p of portofolios) {
            if (!p.config) continue;
            const signals = p.config.watched_assets
                .map(s => ({ s, r: marketData[s]?.rsi || 0 }))
                .sort((a,b) => a.r - b.r).slice(0, 2);
            // 1. Verificăm vânzările (Atât pentru Active cât și pentru Paused)
            await checkSellSignals(p);
            // 2. Verificăm cumpărările (Strict pentru Active)
            if (p.status === 'Active') {
                await checkBuySignals(p);
            }
        }
    } catch (err) {
        console.error("❌ Logic Error:", err);
    }
}