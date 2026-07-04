const db = require("../models/db");
const notificationService = require("../services/notificationService");
const { ORDER_STAGES, ORDER_STATUS_LABELS, PAYMENT_METHODS, PAYMENT_STATUS_LABELS, stageIndex } = require("../models/constants");

exports.home = (req, res) => {
  const categories = db.readAll("categories");
  const products = db.readAll("products");
  const q = (req.query.q || "").toLowerCase().trim();

  const filtered = q
    ? products.filter((p) => {
        const cat = categories.find((c) => c.id === p.categoryId);
        return (
          p.name.toLowerCase().includes(q) ||
          (cat && cat.name.toLowerCase().includes(q))
        );
      })
    : products;

  res.render("shop/home", {
    title: "Fast Delivery To Your Door",
    categories,
    products: filtered,
    query: req.query.q || ""
  });
};

exports.category = (req, res) => {
  const category = db.findById("categories", req.params.id);
  if (!category) return res.redirect("/");
  const products = db.find("products", (p) => p.categoryId === category.id);
  res.render("shop/category", { title: category.name, category, products });
};

exports.orderPage = (req, res) => {
  const product = db.findById("products", req.params.id);
  if (!product) return res.redirect("/");
  const category = db.findById("categories", product.categoryId);
  res.render("shop/order", {
    title: `Order ${product.name}`,
    product,
    category,
    paymentMethods: Object.values(PAYMENT_METHODS)
  });
};

exports.placeOrder = (req, res) => {
  const product = db.findById("products", req.params.id);
  if (!product) return res.redirect("/");

  const quantity = Math.max(1, parseInt(req.body.quantity, 10) || 1);
  const method = PAYMENT_METHODS[req.body.paymentMethod] ? req.body.paymentMethod : "cod";
  const address = (req.body.address || "").trim();
  const paymentPhone = (req.body.paymentPhone || "").trim();

  const order = db.insert("orders", {
    userId: req.session.user.id,
    userName: req.session.user.fullName,
    userEmail: req.session.user.email,
    userPhone: req.session.user.phone,
    productId: product.id,
    item: product.name,
    unitPrice: product.price,
    quantity,
    total: product.price * quantity,
    address,
    status: "pending",
    deliveryMan: null,
    payment: {
      method,
      phone: method === "cod" ? null : paymentPhone,
      status: method === "cod" ? "unpaid" : "awaiting_confirmation"
    },
    ownerType: product.ownerType || "admin",
    ownerId: product.ownerId || null
  });

  notificationService.notify(req.session.user.id, {
    type: "order",
    title: "Order placed 🚀",
    message: `Your order #${order.id} for ${product.name} (x${quantity}) has been received and is waiting for approval.`,
    orderId: order.id
  });

  req.session.flash = { type: "success", message: `Order #${order.id} placed! We will notify you once it is approved.` };
  res.redirect("/orders/my");
};

exports.myOrders = (req, res) => {
  const orders = db
    .find("orders", (o) => o.userId === req.session.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.render("shop/my-orders", {
    title: "My Orders",
    orders,
    stages: ORDER_STAGES,
    statusLabels: ORDER_STATUS_LABELS,
    paymentMethods: PAYMENT_METHODS,
    paymentStatusLabels: PAYMENT_STATUS_LABELS,
    stageIndex
  });
};

// ---- Notifications ----

exports.notificationsPage = (req, res) => {
  const notifications = notificationService.forUser(req.session.user.id);
  notificationService.markAllRead(req.session.user.id);
  res.render("shop/notifications", { title: "Notifications", notifications });
};

exports.notificationsApi = (req, res) => {
  const notifications = notificationService.forUser(req.session.user.id);
  res.json({
    unread: notifications.filter((n) => !n.read).length,
    notifications: notifications.slice(0, 15)
  });
};

exports.markNotificationsRead = (req, res) => {
  notificationService.markAllRead(req.session.user.id);
  res.json({ success: true });
};
