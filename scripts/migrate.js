require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Portofolio = require('../models/Portofolio');

const MONGO_URI = process.env.MONGO_URI;

const migrate = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB...");

        // Așteptăm confirmarea de la baza de date
        const result = await Portofolio.updateMany(
            { status: 'active' },
            { $set: { status: 'Active' } }
        );

        console.log("--------------------------------------");
        console.log(`Migration result:`);
        console.log(`- Documents found: ${result.matchedCount}`);
        console.log(`- Documents updated: ${result.modifiedCount}`);
        console.log("--------------------------------------");

        await mongoose.disconnect();
        console.log("Migration finished successfully.");
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

// Executăm funcția
migrate()
    .then(() => {
        console.log("Process exited cleanly.");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Fatal error during migration:", err);
        process.exit(1);
    });