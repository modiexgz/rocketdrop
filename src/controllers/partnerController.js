const db = require("../models/db");
const notificationService = require("../services/notificationService");
const { ORDER_STATUS_LABELS, PAYMENT_METHODS, PAYMENT_STATUS_LABELS } = require("../models/constants");

// ---- User-facing: apply to become a partner ----

exports.applyPage = (req, res) => {
  const existing = db.findOne("partners", (p) => p.userId === req.session.user.id);
  res.render("partner/apply", { title: "Become a Partner", application: existing });
};

exports.apply = (req, res) => {
  const { businessName, businessEmail, businessPhone, location, businessType } = req.body;

  const existing = db.findOne("partners", (p) => p.userId === req.session.user.id);
  if (existing && existing.status !== "rejected") {
    req.session.flash = { type: "error", message: "You already have a partner application." };
    return res.redirect("/partner/apply");
  }

  if (!businessName || !businessEmail || !businessPhone) {
    req.session.flash = { type: "error", message: "Business name, email and phone are required." };
    return res.redirect("/partner/apply");
  }

  if (existing && existing.status === "rejected") {
    db.update("partners", existing.id, {
      businessName: businessName.trim(),
      email: businessEmail.trim(),
      phone: businessPhone.trim(),
      location: (location || "").trim(),
      businessType: (businessType || "Restaurant").trim(),
      status: "pending"
    });
  } else {
    db.insert("partners", {
      userId: req.session.user.id,
      applicantName: req.session.user.fullName,
      businessName: businessName.trim(),
      email: businessEmail.trim(),
      phone: businessPhone.trim(),
      location: (location || "").trim(),
      businessType: (businessType || "Restaurant").trim(),
      status: "pending"
    });
  }

  notificationService.notify(req.session.user.id, {
    type: "partner",
    title: "Partner application received 🤝",
    message: `Thanks ${req.session.user.fullName}! Your application for "${businessName}" was submitted. Our team will review it and notify you once it is approved or declined.`
  });

  req.session.flash = { type: "success", message: "Application submitted! We will notify you after review." };
  res.redirect("/partner/apply");
};

// ---- Partner dashboard ----

function currentPartner(req) {
  return db.findOne("partners", (p) => p.userId === req.session.user.id && p.status === "approved");
}

exports.dashboard = (req, res) => {
  const partner = currentPartner(req);
  if (!partner) return res.redirect("/partner/apply");

  const categories = db.find("categories", (c) => c.ownerType === "partner" && c.ownerId === partner.id);
  const products = db.find("products", (p) => p.ownerType === "partner" && p.ownerId === partner.id);
  const orders = db
    .find("orders", (o) => o.ownerType === "partner" && o.ownerId === partner.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.render("partner/dashboard", {
    title: `${partner.businessName} — Partner Dashboard`,
    partner,
    categories,
    products,
    orders,
    stats: {
      categories: categories.length,
      products: products.length,
      orders: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      revenue: orders.filter((o) => o.status !== "rejected").reduce((s, o) => s + (o.total || 0), 0)
    },
    statusLabels: ORDER_STATUS_LABELS,
    paymentMethods: PAYMENT_METHODS,
    paymentStatusLabels: PAYMENT_STATUS_LABELS
  });
};

// ---- Partner category CRUD ----

exports.createCategory = (req, res) => {
  const partner = currentPartner(req);
  if (!partner) return res.redirect("/partner/apply");
  const { name, description, image } = req.body;
  if (!name) {
    req.session.flash = { type: "error", message: "Category name is required." };
    return res.redirect("/partner/dashboard#categories");
  }
  db.insert("categories", {
    name: name.trim(),
    description: (description || "").trim(),
    image: (image || "/images/welcomeFood.svg").trim(),
    ownerType: "partner",
    ownerId: partner.id
  });
  req.session.flash = { type: "success", message: `Category "${name}" created.` };
  res.redirect("/partner/dashboard#categories");
};

exports.updateCategory = (req, res) => {
  const partner = currentPartner(req);
  const category = db.findById("categories", req.params.id);
  if (!partner || !category || category.ownerId !== partner.id) {
    req.session.flash = { type: "error", message: "Category not found." };
    return res.redirect("/partner/dashboard#categories");
  }
  const { name, description, image } = req.body;
  db.update("categories", category.id, {
    name: (name || category.name).trim(),
    description: (description || "").trim(),
    image: (image || category.image).trim()
  });
  req.session.flash = { type: "success", message: "Category updated." };
  res.redirect("/partner/dashboard#categories");
};

exports.deleteCategory = (req, res) => {
  const partner = currentPartner(req);
  const category = db.findById("categories", req.params.id);
  if (partner && category && category.ownerId === partner.id) {
    db.remove("categories", category.id);
    req.session.flash = { type: "success", message: "Category deleted." };
  }
  res.redirect("/partner/dashboard#categories");
};

// ---- Partner product (order item) CRUD ----

exports.createProduct = (req, res) => {
  const partner = currentPartner(req);
  if (!partner) return res.redirect("/partner/apply");
  const { name, price, categoryId, image, description } = req.body;
  if (!name || !price) {
    req.session.flash = { type: "error", message: "Product name and price are required." };
    return res.redirect("/partner/dashboard#products");
  }
  db.insert("products", {
    name: name.trim(),
    price: Number(price),
    categoryId: Number(categoryId) || null,
    image: (image || "/images/welcomeFood.svg").trim(),
    description: (description || "").trim(),
    ownerType: "partner",
    ownerId: partner.id
  });
  req.session.flash = { type: "success", message: `Product "${name}" created.` };
  res.redirect("/partner/dashboard#products");
};

exports.updateProduct = (req, res) => {
  const partner = currentPartner(req);
  const product = db.findById("products", req.params.id);
  if (!partner || !product || product.ownerId !== partner.id) {
    req.session.flash = { type: "error", message: "Product not found." };
    return res.redirect("/partner/dashboard#products");
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
  res.redirect("/partner/dashboard#products");
};

exports.deleteProduct = (req, res) => {
  const partner = currentPartner(req);
  const product = db.findById("products", req.params.id);
  if (partner && product && product.ownerId === partner.id) {
    db.remove("products", product.id);
    req.session.flash = { type: "success", message: "Product deleted." };
  }
  res.redirect("/partner/dashboard#products");
};

// ---- Partner order management (advance stages on own orders) ----

exports.updateOrderStage = (req, res) => {
  const partner = currentPartner(req);
  const order = db.findById("orders", req.params.id);
  if (!partner || !order || order.ownerId !== partner.id) {
    req.session.flash = { type: "error", message: "Order not found." };
    return res.redirect("/partner/dashboard#orders");
  }
  const allowed = ["preparing", "out_for_delivery", "delivered"];
  const status = req.body.status;
  if (!allowed.includes(status) || order.status === "pending" || order.status === "rejected") {
    req.session.flash = { type: "error", message: "This stage change is not allowed." };
    return res.redirect("/partner/dashboard#orders");
  }
  db.update("orders", order.id, { status });
  notificationService.notify(order.userId, {
    type: "order",
    title: `Order #${order.id} update 📦`,
    message: `Your order for ${order.item} is now: ${status.replace(/_/g, " ")}.`,
    orderId: order.id
  });
  req.session.flash = { type: "success", message: `Order #${order.id} moved to "${status.replace(/_/g, " ")}".` };
  res.redirect("/partner/dashboard#orders");
};
