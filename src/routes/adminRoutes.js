const express = require("express");
const router = express.Router();
const admin = require("../controllers/adminController");
const report = require("../controllers/reportController");
const asyncHandler = require("../utils/asyncHandler");
const { ensureAuth, ensureAdmin } = require("../middleware/auth");

router.use(ensureAuth, ensureAdmin);

router.get("/", asyncHandler(admin.dashboard));

router.post("/categories", asyncHandler(admin.createCategory));
router.post("/categories/:id/update", asyncHandler(admin.updateCategory));
router.post("/categories/:id/delete", asyncHandler(admin.deleteCategory));

router.post("/products", asyncHandler(admin.createProduct));
router.post("/products/:id/update", asyncHandler(admin.updateProduct));
router.post("/products/:id/delete", asyncHandler(admin.deleteProduct));

router.post("/orders", asyncHandler(admin.createOrder));
router.post("/orders/:id/update", asyncHandler(admin.updateOrder));
router.post("/orders/:id/delete", asyncHandler(admin.deleteOrder));
router.post("/orders/:id/approve", asyncHandler(admin.approveOrder));
router.post("/orders/:id/reject", asyncHandler(admin.rejectOrder));
router.post("/orders/:id/stage", asyncHandler(admin.updateOrderStage));
router.post("/orders/:id/confirm-payment", asyncHandler(admin.confirmPayment));

router.post("/partners/:id/approve", asyncHandler(admin.approvePartner));
router.post("/partners/:id/reject", asyncHandler(admin.rejectPartner));

router.get("/reports/orders", asyncHandler(report.ordersReportPage));
router.get("/reports/orders.pdf", asyncHandler(report.ordersPdf));
router.get("/reports/orders.xlsx", asyncHandler(report.ordersExcel));

module.exports = router;
