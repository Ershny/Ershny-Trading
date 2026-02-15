const Binance = require('node-binance-api');
const Asset = require('../models/Asset');

const binance = new Binance().options({
    APIKEY: process.env.BINANCE_API_KEY,
    APISECRET: process.env.BINANCE_API_SECRET
});

const syncAssets = async () => {
    try {
        console.log("🔄 Se accesează Binance pentru lista de simboluri...");
        const exchangeInfo = await binance.exchangeInfo();

        // Filtrăm: doar perechi cu USDC și care sunt active la trading
        const usdcPairs = exchangeInfo.symbols.filter(s =>
            s.quoteAsset === 'USDC' && s.status === 'TRADING'
        );

        // Folosim Promise.all pentru viteză, sau un loop dacă vrem să fim blânzi cu DB-ul
        // Aici mergem pe un loop for-of pentru a evita suprasolicitarea conexiunii la pornire
        for (const s of usdcPairs) {
            await Asset.findOneAndUpdate(
                { symbol: s.symbol },
                {
                    symbol: s.symbol,
                    baseAsset: s.baseAsset,
                    quoteAsset: s.quoteAsset,
                    lastUpdated: Date.now()
                },
                {
                    upsert: true,
                    returnDocument: 'after' // Aici am făcut schimbarea pentru a scăpa de warning
                }
            );
        }

        console.log(`✅ Sincronizare reușită: ${usdcPairs.length} monede salvate în DB.`);
        return usdcPairs.length; // Returnăm numărul de monede pentru log-uri
    } catch (err) {
        console.error("❌ Eroare în binanceSync.js:", err.message);
        throw err; // Esențial: aruncăm eroarea mai departe
    }
};

module.exports = syncAssets;