const express = require("express");
const router = express.Router();
const partner = require("../controllers/partnerController");
const asyncHandler = require("../utils/asyncHandler");
const { ensureAuth, ensurePartner } = require("../middleware/auth");

router.get("/apply", ensureAuth, asyncHandler(partner.applyPage));
router.post("/apply", ensureAuth, asyncHandler(partner.apply));

router.get("/dashboard", ensureAuth, ensurePartner, asyncHandler(partner.dashboard));

router.post("/categories", ensureAuth, ensurePartner, asyncHandler(partner.createCategory));
router.post("/categories/:id/update", ensureAuth, ensurePartner, asyncHandler(partner.updateCategory));
router.post("/categories/:id/delete", ensureAuth, ensurePartner, asyncHandler(partner.deleteCategory));

router.post("/products", ensureAuth, ensurePartner, asyncHandler(partner.createProduct));
router.post("/products/:id/update", ensureAuth, ensurePartner, asyncHandler(partner.updateProduct));
router.post("/products/:id/delete", ensureAuth, ensurePartner, asyncHandler(partner.deleteProduct));

router.post("/orders/:id/stage", ensureAuth, ensurePartner, asyncHandler(partner.updateOrderStage));

module.exports = router;
