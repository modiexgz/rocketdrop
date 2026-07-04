const express = require("express");
const router = express.Router();
const admin = require("../controllers/adminController");
const report = require("../controllers/reportController");
const { ensureAuth, ensureAdmin } = require("../middleware/auth");

router.use(ensureAuth, ensureAdmin);

router.get("/", admin.dashboard);

// Categories
router.post("/categories", admin.createCategory);
router.post("/categories/:id/update", admin.updateCategory);
router.post("/categories/:id/delete", admin.deleteCategory);

// Products
router.post("/products", admin.createProduct);
router.post("/products/:id/update", admin.updateProduct);
router.post("/products/:id/delete", admin.deleteProduct);

// Orders
router.post("/orders", admin.createOrder);
router.post("/orders/:id/update", admin.updateOrder);
router.post("/orders/:id/delete", admin.deleteOrder);
router.post("/orders/:id/approve", admin.approveOrder);
router.post("/orders/:id/reject", admin.rejectOrder);
router.post("/orders/:id/stage", admin.updateOrderStage);
router.post("/orders/:id/confirm-payment", admin.confirmPayment);

// Partners
router.post("/partners/:id/approve", admin.approvePartner);
router.post("/partners/:id/reject", admin.rejectPartner);

// Reports
router.get("/reports/orders", report.ordersReportPage);
router.get("/reports/orders.pdf", report.ordersPdf);
router.get("/reports/orders.xlsx", report.ordersExcel);

module.exports = router;
