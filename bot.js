require('dotenv').config();
const mongoose = require('mongoose');
const Binance = require('binance-api-node').default;
const { RSI } = require('technicalindicators');

const Portofolio = require('./models/Portofolio');
const Config = require('./models/Config');
const Pocket = require('./models/Pocket');
const Transaction = require('./models/Transaction');

const client = new Binance({
    apiKey: process.env.BINANCE_API_KEY,
    apiSecret: process.env.BINANCE_API_SECRET
});

const marketData = {};
const activePositions = new Map();
let isScanning = false;
let debounceTimer = null;
const DEBOUNCE_DELAY = 500;
const ENABLE_VERBOSE_LOGS = true; // DEBUG MODE

// --- 1. CONECTARE ȘI PORNIRE ---
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("✅ Bot conectat la DB.");
        await initializeMarketData();
        await loadActivePositions();
        startPriceStreaming();
        console.log("🚀 Bot pornit - Aștept candle closes...\n");
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
                const candles = await client.candles({ symbol, interval: '1m', limit: 250 });

                if (candles && candles.length > 0) {
                    marketData[symbol] = {
                        prices: candles.map(c => parseFloat(c.close)),
                        rsi: 0,
                        currentPrice: parseFloat(candles[candles.length - 1].close)
                    };
                    updateRSI(symbol);
                    console.log(`   [${count}/${uniqueSymbols.length}] ✔️ ${symbol} configurat (RSI: ${marketData[symbol].rsi.toFixed(2)})`);
                }
            } catch (err) {
                console.log(`   [${count}/${uniqueSymbols.length}] ⚠️ ${symbol} sărit: ${err.message}`);
            }
            await new Promise(r => setTimeout(r, 50));
        }
        console.log("🚀 Cache complet!\n");
    } catch (err) {
        console.error("❌ Eroare la inițializare cache:", err);
    }
}

// --- 2.5 ÎNCARCĂ POZIȚII ACTIVE DIN DB ---
async function loadActivePositions() {
    try {
        const transactions = await Transaction.find({
            transaction_type: 'BUY',
            is_closed: { $ne: true }
        }).populate('pocket').exec();

        for (const tx of transactions) {
            if (tx.pocket && tx.pocket.status === 'Closed') {
                activePositions.set(tx.currency, {
                    pocket: tx.pocket._id,
                    transaction: tx._id,
                    buyPrice: tx.price_per_unit,
                    units: tx.units,
                    portfolio: tx.pocket.portofolio,
                    timestamp: tx.timestamp
                });
            }
        }

        console.log(`📍 Poziții active încărcate: ${activePositions.size}`);
        if (activePositions.size > 0) {
            const positions = Array.from(activePositions.keys());
            console.log(`   ${positions.join(', ')}\n`);
        }
    } catch (err) {
        console.error("❌ Eroare la încarcarea poziților:", err);
    }
}

// --- 3. CALCUL RSI ---
function updateRSI(symbol) {
    if (!marketData[symbol] || marketData[symbol].prices.length < 14) return;
    const rsiValues = RSI.calculate({ values: marketData[symbol].prices, period: 14 });
    if (rsiValues?.length > 0) marketData[symbol].rsi = rsiValues[rsiValues.length - 1];
}

// --- 4. WEBSOCKETS - CANDLE CLOSE TRIGGER ---
function startPriceStreaming() {
    const symbols = Object.keys(marketData);
    if (symbols.length === 0) {
        console.error("❌ Nu sunt simboluri în marketData!");
        return;
    }

    console.log(`📡 Conectare la WebSocket pentru ${symbols.length} monede\n`);

    const candleStream = client.ws.candles(symbols, '1m', (message) => {
        try {
            const { symbol, close, isFinal } = message;

            if (!symbol || !close) {
                return;
            }

            const closePrice = parseFloat(close);

            if (symbol && marketData[symbol] && !isNaN(closePrice)) {
                marketData[symbol].currentPrice = closePrice;
            }

            if (isFinal === true && marketData[symbol]) {
                if (ENABLE_VERBOSE_LOGS) {
                    console.log(`✅ ${symbol} CANDLE ÎNCHIS | RSI update...`);
                }

                marketData[symbol].prices.shift();
                marketData[symbol].prices.push(closePrice);
                updateRSI(symbol);

                if (ENABLE_VERBOSE_LOGS) {
                    console.log(`📊 ${symbol} | RSI: ${marketData[symbol].rsi.toFixed(2)} | Preț: $${closePrice}`);
                }

                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                }

                debounceTimer = setTimeout(async () => {
                    if (!isScanning) {
                        await runTradingLogic();
                    }
                }, DEBOUNCE_DELAY);
            }
        } catch (err) {
            console.error("❌ WebSocket Error:", err.message);
        }
    });

    if (candleStream.on) {
        candleStream.on('error', (err) => {
            console.error('❌ WebSocket connection error:', err);
            console.log('⏳ Reconectare în 5 secunde...');
            setTimeout(() => {
                startPriceStreaming();
            }, 5000);
        });
    }

    process.on('SIGINT', () => {
        console.log('\n🛑 Bot oprit gracefully.');
        candleStream();
        process.exit(0);
    });
}

// --- 5. LOGICA SELL ---
async function checkSellSignals(portofolio) {
    for (const [symbol, position] of activePositions.entries()) {
        if (position.portfolio.toString() !== portofolio._id.toString()) {
            continue;
        }

        const currentPrice = marketData[symbol]?.currentPrice;
        if (!currentPrice || isNaN(currentPrice)) continue;

        const priceChangePct = ((currentPrice - position.buyPrice) / position.buyPrice) * 100;

        if (priceChangePct >= portofolio.config.profit_target_percent || priceChangePct <= -portofolio.config.stop_loss_percent) {
            const finalValue = position.units * currentPrice;
            const saleType = priceChangePct >= portofolio.config.profit_target_percent ? 'PROFIT' : 'STOP LOSS';

            console.log(`💰 [SELL - ${saleType}] ${symbol} | Portofoliu: ${portofolio.name} | Profit: ${priceChangePct.toFixed(2)}%`);

            try {
                const sellTx = await Transaction.create({
                    pocket: position.pocket,
                    transaction_type: 'SELL',
                    currency: symbol,
                    price_per_unit: currentPrice,
                    units: position.units,
                    total_value: finalValue,
                    rsi_at_transaction: marketData[symbol].rsi,
                    timestamp: new Date()
                });

                await Transaction.findByIdAndUpdate(position.transaction, {
                    is_closed: true,
                    related_sell_id: sellTx._id
                });

                await Pocket.findByIdAndUpdate(position.pocket, {
                    status: 'Open',
                    currency: 'USDC',
                    current_funds: finalValue,
                    units: 0
                });

                activePositions.delete(symbol);

                console.log(`✅ [SUCCESS] Poziție închisă: ${symbol}`);

                const remainingOccupied = await Pocket.countDocuments({
                    portofolio: portofolio._id,
                    status: 'Closed'
                });

                if (remainingOccupied === 0 && portofolio.status === 'Paused') {
                    console.log(`📴 [STATUS UPDATE] ${portofolio.name} este gol și era pe pauză. Devine INACTIVE.`);
                    await Portofolio.findByIdAndUpdate(portofolio._id, { status: 'Inactive' });
                }
            } catch (err) {
                console.error("❌ Sell Error:", err.message);
            }
        }
    }
}

// --- 6. LOGICA BUY ---
async function checkBuySignals(portofolio) {
    console.log(`\n🔍 Checking BUY for: ${portofolio.name}`);
    console.log(`   Status: ${portofolio.status}`);

    if (portofolio.status !== 'Active') {
        console.log(`   ❌ Portfolio NOT Active, skipping`);
        return;
    }

    const openPockets = await Pocket.find({ portofolio: portofolio._id, status: 'Open' }).exec();
    console.log(`   Open Pockets: ${openPockets.length}`);

    if (openPockets.length === 0) {
        console.log(`   ❌ No open pockets available`);
        return;
    }

    console.log(`   Watched assets: ${portofolio.config.watched_assets.join(', ')}`);
    console.log(`   RSI Oversold threshold: ${portofolio.config.rsi_oversold}`);

    for (const symbol of portofolio.config.watched_assets) {
        const data = marketData[symbol];
        console.log(`\n   📍 ${symbol}:`);

        if (!data) {
            console.log(`      ❌ No market data`);
            continue;
        }

        console.log(`      Current Price: $${data.currentPrice}`);
        console.log(`      RSI: ${data.rsi.toFixed(2)}`);
        console.log(`      RSI valid: ${!isNaN(data.currentPrice) && data.rsi !== 0}`);

        if (!data || !data.currentPrice || isNaN(data.currentPrice) || data.rsi === 0) {
            console.log(`      ❌ Invalid data (price: ${data?.currentPrice}, rsi: ${data?.rsi})`);
            continue;
        }

        console.log(`      Comparing: ${data.rsi.toFixed(2)} <= ${portofolio.config.rsi_oversold}?`);

        if (activePositions.has(symbol)) {
            console.log(`      ❌ Already owned (in cache)`);
            continue;
        }

        if (data.rsi <= portofolio.config.rsi_oversold) {
            console.log(`      ✅ RSI SIGNAL TRIGGERED!`);

            const alreadyOwned = await Pocket.findOne({
                portofolio: portofolio._id,
                currency: symbol,
                status: 'Closed'
            }).exec();

            if (alreadyOwned) {
                console.log(`      ❌ Already owned (in DB)`);
                continue;
            }

            console.log(`      ✅ Ready to BUY!`);

            const targetPocket = openPockets[0];
            const amount = targetPocket.current_funds || 250;
            const units = amount / data.currentPrice;

            console.log(`      Pocket funds: $${targetPocket.current_funds}`);
            console.log(`      Amount to invest: $${amount}`);
            console.log(`      Units to buy: ${units.toFixed(4)}`);

            if (isNaN(units) || units <= 0) {
                console.log(`      ❌ Invalid units`);
                continue;
            }

            console.log(`🚀 [BUY] ${symbol} | Portofoliu: ${portofolio.name} | RSI: ${data.rsi.toFixed(2)}`);
            try {
                const tx = await Transaction.create({
                    pocket: targetPocket._id,
                    transaction_type: 'BUY',
                    currency: symbol,
                    price_per_unit: data.currentPrice,
                    units: units,
                    total_value: amount,
                    rsi_at_transaction: data.rsi,
                    timestamp: new Date()
                });

                await Pocket.findByIdAndUpdate(targetPocket._id, {
                    status: 'Closed',
                    currency: symbol,
                    units: units,
                    current_funds: 0,
                    last_active: new Date()
                });

                activePositions.set(symbol, {
                    pocket: targetPocket._id,
                    transaction: tx._id,
                    buyPrice: data.currentPrice,
                    units: units,
                    portfolio: portofolio._id,
                    timestamp: new Date()
                });

                console.log(`✅ BUY creat: ${symbol} (${units.toFixed(4)} units @ $${data.currentPrice.toFixed(4)})`);
                break;
            } catch (err) {
                console.error("❌ Buy Error:", err.message);
            }
        } else {
            console.log(`      ❌ RSI too high (${data.rsi.toFixed(2)} > ${portofolio.config.rsi_oversold})`);
        }
    }
}

// --- 7. RUN TRADING LOGIC ---
async function runTradingLogic() {
    if (isScanning) {
        if (ENABLE_VERBOSE_LOGS) {
            console.log("⏳ Scanare în curs...");
        }
        return;
    }

    try {
        isScanning = true;
        const portofolios = await Portofolio.find({ status: { $ne: 'Inactive' } }).populate('config').exec();

        console.log(`\n--- 🔍 SCANARE PE CANDLE CLOSE (${new Date().toLocaleTimeString()}) ---`);
        console.log(`📊 Portofolii active: ${portofolios.length} | Poziții deschise: ${activePositions.size}`);

        for (const p of portofolios) {
            if (!p.config) continue;

            const signals = p.config.watched_assets
                .map(s => ({ s, r: marketData[s]?.rsi || 0 }))
                .sort((a, b) => a.r - b.r)
                .slice(0, 5);

            const buySignals = signals.filter(sg => sg.r <= p.config.rsi_oversold);

            console.log(`\n📈 ${p.name}:`);
            console.log(`   RSI Threshold: ${p.config.rsi_oversold} | Target: ${p.config.profit_target_percent}% | Stop: ${p.config.stop_loss_percent}%`);
            console.log(`   Top 5 lowest RSI: ${signals.map(sg => `${sg.s}(${sg.r.toFixed(1)})`).join(', ')}`);
            if (buySignals.length > 0) {
                console.log(`   🟢 Buy opportunities: ${buySignals.map(sg => sg.s).join(', ')}`);
            }

            await checkSellSignals(p);

            if (p.status === 'Active') {
                await checkBuySignals(p);
            }
        }

        console.log(`\n--- ✅ Scanare finalizată ---`);
    } catch (err) {
        console.error("❌ Logic Error:", err);
    } finally {
        isScanning = false;
    }
}