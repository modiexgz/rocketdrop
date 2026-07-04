const app = require("./src/app");
const config = require("./src/config");
const { seedIfEmpty } = require("./src/models/seed");

seedIfEmpty();

app.listen(config.port, () => {
  console.log(`🚀 RocketDrop running on http://localhost:${config.port}`);
});
