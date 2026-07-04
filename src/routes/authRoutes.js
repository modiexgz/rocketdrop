const express = require("express");
const router = express.Router();
const auth = require("../controllers/authController");

router.get("/login", auth.loginPage);
router.post("/login", auth.login);
router.get("/register", auth.registerPage);
router.post("/register", auth.register);
router.get("/logout", auth.logout);
router.post("/logout", auth.logout);

module.exports = router;
