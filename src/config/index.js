const path = require("path");

module.exports = {
  port: process.env.PORT || 3000,
  sessionSecret: process.env.SESSION_SECRET || "rocketdrop-dev-secret",
  dataDir: path.join(__dirname, "..", "..", "data"),
  admin: {
    fullName: "RocketDrop Admin",
    email: process.env.ADMIN_EMAIL || "admin@rocketdrop.com",
    phone: "0700000000",
    password: process.env.ADMIN_PASSWORD || "admin123"
  }
};
