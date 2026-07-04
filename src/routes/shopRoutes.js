const express = require("express");
const router = express.Router();
const shop = require("../controllers/shopController");
const { ensureAuth, ensureCustomer } = require("../middleware/auth");

router.get("/", shop.home);
router.get("/categories/:id", shop.category);

router.get("/orders/new/:id", ensureAuth, ensureCustomer, shop.orderPage);
router.post("/orders/new/:id", ensureAuth, ensureCustomer, shop.placeOrder);
router.get("/orders/my", ensureAuth, ensureCustomer, shop.myOrders);

router.get("/notifications", ensureAuth, shop.notificationsPage);
router.get("/api/notifications", ensureAuth, shop.notificationsApi);
router.post("/api/notifications/read", ensureAuth, shop.markNotificationsRead);
router.get("/api/search", shop.searchApi);

module.exports = router;
