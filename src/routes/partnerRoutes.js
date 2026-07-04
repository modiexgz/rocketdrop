const express = require("express");
const router = express.Router();
const partner = require("../controllers/partnerController");
const { ensureAuth, ensurePartner } = require("../middleware/auth");

// Any signed-in user can apply to become a partner.
router.get("/apply", ensureAuth, partner.applyPage);
router.post("/apply", ensureAuth, partner.apply);

// Approved partners only.
router.get("/dashboard", ensureAuth, ensurePartner, partner.dashboard);

router.post("/categories", ensureAuth, ensurePartner, partner.createCategory);
router.post("/categories/:id/update", ensureAuth, ensurePartner, partner.updateCategory);
router.post("/categories/:id/delete", ensureAuth, ensurePartner, partner.deleteCategory);

router.post("/products", ensureAuth, ensurePartner, partner.createProduct);
router.post("/products/:id/update", ensureAuth, ensurePartner, partner.updateProduct);
router.post("/products/:id/delete", ensureAuth, ensurePartner, partner.deleteProduct);

router.post("/orders/:id/stage", ensureAuth, ensurePartner, partner.updateOrderStage);

module.exports = router;
