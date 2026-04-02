const User = require("../models/User");

async function ensureAdminUser() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@agri.local").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (existingAdmin) {
    return;
  }

  await User.create({
    name: process.env.ADMIN_NAME || "Platform Admin",
    email: adminEmail,
    password: adminPassword,
    role: "admin",
  });

  console.log(`Default admin created: ${adminEmail}`);
}

module.exports = ensureAdminUser;

