// Seeds the database if it is empty (does not delete existing data).
// Usage: npm run seed
const { init } = require("./index");

init()
  .then(() => console.log("Seed check complete."))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  });
