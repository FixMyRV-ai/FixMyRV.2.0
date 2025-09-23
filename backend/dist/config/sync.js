import sequelize from "../models/index.js";
const syncDatabase = async () => {
    try {
        // Force sync in production to create missing tables
        const shouldForceSync = process.env.NODE_ENV === 'production' && process.env.FORCE_DB_SYNC === 'true';
        await sequelize.sync({
            logging: console.log, // Enable logging to see what's happening
            alter: shouldForceSync, // Allow table alterations when force sync is enabled
            force: false // Never drop existing tables
        });
        console.log("✅ All models were synchronized successfully.");
        if (shouldForceSync) {
            console.log("🔄 Production database sync with table creation/alteration completed.");
        }
    }
    catch (error) {
        console.error("❌ Error syncing database:", error);
        throw error; // Re-throw to prevent app startup with broken database
    }
};
export default syncDatabase;
//# sourceMappingURL=sync.js.map