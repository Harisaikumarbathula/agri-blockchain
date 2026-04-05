require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const ensureAdminUser = require("./utils/ensureAdminUser");
const { syncProductsToBlockchain } = require("./services/blockchainSyncService");
const { startGpsSimulation } = require("./services/gpsSimulationService");

const port = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    await connectDB();
    await ensureAdminUser();
    await syncProductsToBlockchain();
    
    startGpsSimulation();

    app.listen(port, () => {
      console.log(`Backend server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error.message);
    process.exit(1);
  }
}

startServer();
