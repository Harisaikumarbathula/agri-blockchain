const mongoose = require("mongoose");
const connectDB = require("./src/config/db");

async function clear() {
  await connectDB();
  console.log("Dropping database...");
  await mongoose.connection.dropDatabase();
  console.log("Database cleared.");
  process.exit(0);
}

clear();
