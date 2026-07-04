const db = require("../models/db");
const notificationService = require("../services/notificationService");
const { ORDER_STATUS_LABELS, PAYMENT_METHODS, PAYMENT_STATUS_LABELS } = require("../models/constants");
const { safeRedirect } = require("../utils/safeRedirect");

function adminUrl(tab) {
  return tab ? `/admin?tab=${tab}` : "/admin";
}

function dashboardData() {
  const categories = db.readAll("categories");
  const products = db.readAll("products");
  const orders = db.readAll("orders").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const partners = db.readAll("partners").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const users = db.readAll("users");

  return {
    categories,
    products,
    orders,
    partners,
    users,
    activeTab: "orders",
    stats: {
      orders: orders.length,
      pendingOrders: orders.filter((o) => o.status === "pending").length,
      pendingPayments: orders.filter((o) => o.payment && o.payment.status === "awaiting_confirmation").length,
      pendingPartners: partners.filter((p) => p.status === "pending").length,
      products: products.length,
      categories: categories.length,
      users: users.filter((u) => u.role === "user").length,
      revenue: orders.filter((o) => o.status !== "rejected").reduce((s, o) => s + (o.total || 0), 0)
    },
    statusLabels: ORDER_STATUS_LABELS,
    paymentMethods: PAYMENT_METHODS,
    paymentStatusLabels: PAYMENT_STATUS_LABELS
  };
}

exports.dashboard = (req, res) => {
  const tab = ["orders", "categories", "products", "partners", "users"].includes(req.query.tab)
    ? req.query.tab
    : "orders";
  res.render("admin/dashboard", { title: "Admin Dashboard", ...dashboardData(), activeTab: tab });
};

exports.createCategory = (req, res) => {
  const { name, description, image } = req.body;
  if (!name || !name.trim()) {
    req.session.flash = { type: "error", message: "Category name is required." };
    return safeRedirect(req, res, adminUrl("categories"));
  }
  db.insert("categories", {
    name: name.trim(),
    description: (description || "").trim(),
    image: (image || "/images/welcomeFood.svg").trim(),
    ownerType: "admin",
    ownerId: null
  });
  req.session.flash = { type: "success", message: `Category "${name.trim()}" created successfully.` };
  safeRedirect(req, res, adminUrl("categories"));
};

exports.updateCategory = (req, res) => {
  const category = db.findById("categories", req.params.id);
  if (!category) {
    req.session.flash = { type: "error", message: "Category not found." };
    return safeRedirect(req, res, adminUrl("categories"));
  }
  const { name, description, image } = req.body;
  db.update("categories", category.id, {
    name: (name || category.name).trim(),
    description: (description || "").trim(),
    image: (image || category.image).trim()
  });
  req.session.flash = { type: "success", message: "Category updated." };
  safeRedirect(req, res, adminUrl("categories"));
};

exports.deleteCategory = (req, res) => {
  db.remove("categories", req.params.id);
  req.session.flash = { type: "success", message: "Category deleted." };
  safeRedirect(req, res, adminUrl("categories"));
};

exports.createProduct = (req, res) => {
  const { name, price, categoryId, image, description } = req.body;
  if (!name || !name.trim() || !price) {
    req.session.flash = { type: "error", message: "Product name and price are required." };
    return safeRedirect(req, res, adminUrl("products"));
  }
  db.insert("products", {
    name: name.trim(),
    price: Number(price),
    categoryId: Number(categoryId) || null,
    image: (image || "/images/welcomeFood.svg").trim(),
    description: (description || "").trim(),
    ownerType: "admin",
    ownerId: null
  });
  req.session.flash = { type: "success", message: `Product "${name.trim()}" created.` };
  safeRedirect(req, res, adminUrl("products"));
};

exports.updateProduct = (req, res) => {
  const product = db.findById("products", req.params.id);
  if (!product) {
    req.session.flash = { type: "error", message: "Product not found." };
    return safeRedirect(req, res, adminUrl("products"));
  }
  const { name, price, categoryId, image, description } = req.body;
  db.update("products", product.id, {
    name: (name || product.name).trim(),
    price: Number(price) || product.price,
    categoryId: Number(categoryId) || product.categoryId,
    image: (image || product.image).trim(),
    description: (description || "").trim()
  });
  req.session.flash = { type: "success", message: "Product updated." };
  safeRedirect(req, res, adminUrl("products"));
};

exports.deleteProduct = (req, res) => {
  db.remove("products", req.params.id);
  req.session.flash = { type: "success", message: "Product deleted." };
  safeRedirect(req, res, adminUrl("products"));
};

exports.createOrder = (req, res) => {
  const { userEmail, productId, quantity, address, paymentMethod } = req.body;
  const product = db.findById("products", productId);
  const user = db.findOne("users", (u) => u.email.toLowerCase() === (userEmail || "").toLowerCase());

  if (!product || !user) {
    req.session.flash = { type: "error", message: "Valid customer email and product are required." };
    return safeRedirect(req, res, adminUrl("orders"));
  }

  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const method = PAYMENT_METHODS[paymentMethod] ? paymentMethod : "cod";

  const order = db.insert("orders", {
    userId: user.id,
    userName: user.fullName,
    userEmail: user.email,
    userPhone: user.phone,
    productId: product.id,
    item: product.name,
    unitPrice: product.price,
    quantity: qty,
    total: product.price * qty,
    address: (address || "").trim(),
    status: "pending",
    deliveryMan: null,
    payment: {
      method,
      phone: null,
      status: method === "cod" ? "unpaid" : "awaiting_confirmation"
    },
    ownerType: product.ownerType || "admin",
    ownerId: product.ownerId || null
  });

  notificationService.notify(user.id, {
    type: "order",
    title: "Order created",
    message: `An order #${order.id} for ${product.name} (x${qty}) was created for your account and is waiting for approval.`,
    orderId: order.id
  });

  req.session.flash = { type: "success", message: `Order #${order.id} created.` };
  safeRedirect(req, res, adminUrl("orders"));
};

exports.updateOrder = (req, res) => {
  const order = db.findById("orders", req.params.id);
  if (!order) {
    req.session.flash = { type: "error", message: "Order not found." };
    return safeRedirect(req, res, adminUrl("orders"));
  }
  const { quantity, address } = req.body;
  const qty = Math.max(1, parseInt(quantity, 10) || order.quantity);
  db.update("orders", order.id, {
    quantity: qty,
    total: order.unitPrice * qty,
    address: address !== undefined ? address.trim() : order.address
  });
  req.session.flash = { type: "success", message: `Order #${order.id} updated.` };
  safeRedirect(req, res, adminUrl("orders"));
};

exports.deleteOrder = (req, res) => {
  db.remove("orders", req.params.id);
  req.session.flash = { type: "success", message: "Order deleted." };
  safeRedirect(req, res, adminUrl("orders"));
};

exports.approveOrder = (req, res) => {
  const order = db.findById("orders", req.params.id);
  if (!order) {
    req.session.flash = { type: "error", message: "Order not found." };
    return safeRedirect(req, res, adminUrl("orders"));
  }

  const payment = order.payment || { method: "cod", status: "unpaid" };
  if (
    payment.method !== "cod" &&
    payment.status === "awaiting_confirmation"
  ) {
    req.session.flash = {
      type: "error",
      message: `Confirm the ${payment.method.toUpperCase()} payment for order #${order.id} before approving it.`
    };
    return safeRedirect(req, res, adminUrl("orders"));
  }

  const { deliveryName, deliveryPhone, deliveryLocation } = req.body;
  if (!deliveryName || !deliveryName.trim() || !deliveryPhone || !deliveryPhone.trim()) {
    req.session.flash = { type: "error", message: "Delivery man name and contact are required to approve an order." };
    return safeRedirect(req, res, adminUrl("orders"));
  }

  const deliveryMan = {
    name: deliveryName.trim(),
    phone: deliveryPhone.trim(),
    location: (deliveryLocation || "").trim()
  };

  db.update("orders", order.id, { status: "approved", deliveryMan });

  notificationService.notify(order.userId, {
    type: "order",
    title: `Order #${order.id} approved`,
    message: `Your order for ${order.item} has been approved. Delivery man: ${deliveryMan.name}, contact: ${deliveryMan.phone}${deliveryMan.location ? ", location: " + deliveryMan.location : ""}.`,
    orderId: order.id
  });

  req.session.flash = { type: "success", message: `Order #${order.id} approved and customer notified.` };
  safeRedirect(req, res, adminUrl("orders"));
};

exports.rejectOrder = (req, res) => {
  const order = db.findById("orders", req.params.id);
  if (!order) {
    req.session.flash = { type: "error", message: "Order not found." };
    return safeRedirect(req, res, adminUrl("orders"));
  }
  const reason = (req.body.reason || "").trim();
  db.update("orders", order.id, { status: "rejected", deliveryMan: null });

  notificationService.notify(order.userId, {
    type: "order",
    title: `Order #${order.id} declined`,
    message: `Sorry, your order for ${order.item} was not approved.${reason ? " Reason: " + reason : ""} Please try again or contact support.`,
    orderId: order.id
  });

  req.session.flash = { type: "success", message: `Order #${order.id} rejected and customer notified.` };
  safeRedirect(req, res, adminUrl("orders"));
};

exports.updateOrderStage = (req, res) => {
  const order = db.findById("orders", req.params.id);
  if (!order) {
    req.session.flash = { type: "error", message: "Order not found." };
    return safeRedirect(req, res, adminUrl("orders"));
  }
  const allowed = ["preparing", "out_for_delivery", "delivered"];
  const status = req.body.status;
  if (!allowed.includes(status) || order.status === "pending" || order.status === "rejected") {
    req.session.flash = { type: "error", message: "Approve the order before changing its delivery stage." };
    return safeRedirect(req, res, adminUrl("orders"));
  }
  db.update("orders", order.id, { status });

  const labels = {
    preparing: "being prepared",
    out_for_delivery: "out for delivery",
    delivered: "delivered"
  };
  notificationService.notify(order.userId, {
    type: "order",
    title: `Order #${order.id} update`,
    message: `Your order for ${order.item} is now ${labels[status]}.`,
    orderId: order.id
  });

  req.session.flash = { type: "success", message: `Order #${order.id} moved to "${ORDER_STATUS_LABELS[status]}".` };
  safeRedirect(req, res, adminUrl("orders"));
};

exports.confirmPayment = (req, res) => {
  const order = db.findById("orders", req.params.id);
  if (!order) {
    req.session.flash = { type: "error", message: "Order not found." };
    return safeRedirect(req, res, adminUrl("orders"));
  }

  const payment = order.payment || { method: "cod", status: "unpaid", phone: null };
  db.update("orders", order.id, { payment: { ...payment, status: "confirmed" } });

  const methodLabel = (PAYMENT_METHODS[payment.method] || {}).label || "payment";
  notificationService.notify(order.userId, {
    type: "payment",
    title: "Payment confirmed",
    message: `Your ${methodLabel} payment of UGX ${Number(order.total).toLocaleString()} for order #${order.id} (${order.item}) has been confirmed. Thank you!`,
    orderId: order.id
  });

  req.session.flash = { type: "success", message: `Payment for order #${order.id} confirmed and customer notified.` };
  safeRedirect(req, res, adminUrl("orders"));
};

exports.approvePartner = (req, res) => {
  const partner = db.findById("partners", req.params.id);
  if (!partner) {
    req.session.flash = { type: "error", message: "Partner application not found." };
    return safeRedirect(req, res, adminUrl("partners"));
  }

  db.update("partners", partner.id, { status: "approved" });
  db.update("users", partner.userId, { role: "partner", partnerId: partner.id });

  notificationService.notify(partner.userId, {
    type: "partner",
    title: "Partner application approved",
    message: `Congratulations! "${partner.businessName}" is now an official RocketDrop partner. Your Partner Dashboard is ready — manage your own categories, products and orders.`
  });

  req.session.flash = { type: "success", message: `"${partner.businessName}" approved as a partner and notified.` };
  safeRedirect(req, res, adminUrl("partners"));
};

exports.rejectPartner = (req, res) => {
  const partner = db.findById("partners", req.params.id);
  if (!partner) {
    req.session.flash = { type: "error", message: "Partner application not found." };
    return safeRedirect(req, res, adminUrl("partners"));
  }
  const reason = (req.body.reason || "").trim();

  db.update("partners", partner.id, { status: "rejected" });
  const user = db.findById("users", partner.userId);
  if (user && user.role === "partner") {
    db.update("users", partner.userId, { role: "user", partnerId: null });
  }

  notificationService.notify(partner.userId, {
    type: "partner",
    title: "Partner application declined",
    message: `We are sorry — your partner application for "${partner.businessName}" was not approved.${reason ? " Reason: " + reason : ""} You may update your details and apply again.`
  });

  req.session.flash = { type: "success", message: `"${partner.businessName}" application declined and applicant notified.` };
  safeRedirect(req, res, adminUrl("partners"));
};
