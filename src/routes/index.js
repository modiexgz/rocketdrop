const express = require("express");
const router = express.Router();

router.use("/auth", require("./authRoutes"));
router.use("/admin", require("./adminRoutes"));
router.use("/partner", require("./partnerRoutes"));
router.use("/", require("./shopRoutes"));

module.exports = router;
