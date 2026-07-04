const app = require("./src/app");
const config = require("./src/config");
const { seedIfEmpty } = require("./src/models/seed");

process.on("uncaughtException", (err) => {
  console.error("[fatal] uncaughtException:", err.stack || err.message);
});

process.on("unhandledRejection", (reason) => {
  console.error("[fatal] unhandledRejection:", reason);
});

seedIfEmpty();

const server = app.listen(config.port, () => {
  console.log(`RocketDrop running on http://localhost:${config.port}`);
});

server.on("error", (err) => {
  console.error("[server] listen error:", err.message);
});
