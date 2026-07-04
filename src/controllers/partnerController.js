const db = require("../models/db");
const notificationService = require("../services/notificationService");
const { ORDER_STATUS_LABELS, PAYMENT_METHODS, PAYMENT_STATUS_LABELS } = require("../models/constants");
const { safeRedirect } = require("../utils/safeRedirect");

function partnerUrl(tab) {
  return tab ? `/partner/dashboard?tab=${tab}` : "/partner/dashboard";
}

function partnerPayload(body, user) {
  return {
    applicantName: user.fullName,
    businessName: (body.businessName || "").trim(),
    businessType: (body.businessType || "Restaurant").trim(),
    email: (body.businessEmail || "").trim(),
    phone: (body.businessPhone || "").trim(),
    ownerName: (body.ownerName || user.fullName).trim(),
    ownerPhone: (body.ownerPhone || user.phone || "").trim(),
    location: (body.location || "").trim(),
    district: (body.district || "").trim(),
    city: (body.city || "Kampala").trim(),
    registrationNumber: (body.registrationNumber || "").trim(),
    description: (body.description || "").trim(),
    openingHours: (body.openingHours || "").trim(),
    website: (body.website || "").trim(),
    status: "pending"
  };
}

exports.applyPage = (req, res) => {
  const existing = db.findOne("partners", (p) => p.userId === req.session.user.id);
  res.render("partner/apply", { title: "Become a Partner", application: existing });
};

exports.apply = (req, res) => {
  const existing = db.findOne("partners", (p) => p.userId === req.session.user.id);
  if (existing && existing.status !== "rejected") {
    req.session.flash = { type: "error", message: "You already have a partner application under review." };
    return safeRedirect(req, res, "/partner/apply");
  }

  const payload = partnerPayload(req.body, req.session.user);
  if (!payload.businessName || !payload.email || !payload.phone || !payload.location || !payload.ownerName || !payload.description || !payload.district || !payload.city) {
    req.session.flash = {
      type: "error",
      message: "Please fill in all required fields: business name, type, description, email, phone, owner name, city, district and address."
    };
    return safeRedirect(req, res, "/partner/apply");
  }

  if (existing && existing.status === "rejected") {
    db.update("partners", existing.id, payload);
  } else {
    db.insert("partners", { userId: req.session.user.id, ...payload });
  }

  notificationService.notify(req.session.user.id, {
    type: "partner",
    title: "Partner application received",
    message: `Thanks ${req.session.user.fullName}! Your application for "${payload.businessName}" was submitted. Our team will review it and notify you once it is approved or declined.`
  });

  req.session.flash = { type: "success", message: "Application submitted successfully. We will notify you after review." };
  safeRedirect(req, res, "/partner/apply");
};

function currentPartner(req) {
  return db.findOne("partners", (p) => p.userId === req.session.user.id && p.status === "approved");
}

exports.dashboard = (req, res) => {
  const partner = currentPartner(req);
  if (!partner) return safeRedirect(req, res, "/partner/apply");

  const tab = ["orders", "categories", "products"].includes(req.query.tab) ? req.query.tab : "orders";
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
    activeTab: tab,
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

exports.createCategory = (req, res) => {
  const partner = currentPartner(req);
  if (!partner) return safeRedirect(req, res, "/partner/apply");
  const { name, description, image } = req.body;
  if (!name || !name.trim()) {
    req.session.flash = { type: "error", message: "Category name is required." };
    return safeRedirect(req, res, partnerUrl("categories"));
  }
  db.insert("categories", {
    name: name.trim(),
    description: (description || "").trim(),
    image: (image || "/images/welcomeFood.svg").trim(),
    ownerType: "partner",
    ownerId: partner.id
  });
  req.session.flash = { type: "success", message: `Category "${name.trim()}" created.` };
  safeRedirect(req, res, partnerUrl("categories"));
};

exports.updateCategory = (req, res) => {
  const partner = currentPartner(req);
  const category = db.findById("categories", req.params.id);
  if (!partner || !category || category.ownerId !== partner.id) {
    req.session.flash = { type: "error", message: "Category not found." };
    return safeRedirect(req, res, partnerUrl("categories"));
  }
  const { name, description, image } = req.body;
  db.update("categories", category.id, {
    name: (name || category.name).trim(),
    description: (description || "").trim(),
    image: (image || category.image).trim()
  });
  req.session.flash = { type: "success", message: "Category updated." };
  safeRedirect(req, res, partnerUrl("categories"));
};

exports.deleteCategory = (req, res) => {
  const partner = currentPartner(req);
  const category = db.findById("categories", req.params.id);
  if (partner && category && category.ownerId === partner.id) {
    db.remove("categories", category.id);
    req.session.flash = { type: "success", message: "Category deleted." };
  }
  safeRedirect(req, res, partnerUrl("categories"));
};

exports.createProduct = (req, res) => {
  const partner = currentPartner(req);
  if (!partner) return safeRedirect(req, res, "/partner/apply");
  const { name, price, categoryId, image, description } = req.body;
  if (!name || !name.trim() || !price) {
    req.session.flash = { type: "error", message: "Product name and price are required." };
    return safeRedirect(req, res, partnerUrl("products"));
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
  req.session.flash = { type: "success", message: `Product "${name.trim()}" created.` };
  safeRedirect(req, res, partnerUrl("products"));
};

exports.updateProduct = (req, res) => {
  const partner = currentPartner(req);
  const product = db.findById("products", req.params.id);
  if (!partner || !product || product.ownerId !== partner.id) {
    req.session.flash = { type: "error", message: "Product not found." };
    return safeRedirect(req, res, partnerUrl("products"));
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
  safeRedirect(req, res, partnerUrl("products"));
};

exports.deleteProduct = (req, res) => {
  const partner = currentPartner(req);
  const product = db.findById("products", req.params.id);
  if (partner && product && product.ownerId === partner.id) {
    db.remove("products", product.id);
    req.session.flash = { type: "success", message: "Product deleted." };
  }
  safeRedirect(req, res, partnerUrl("products"));
};

exports.updateOrderStage = (req, res) => {
  const partner = currentPartner(req);
  const order = db.findById("orders", req.params.id);
  if (!partner || !order || order.ownerId !== partner.id) {
    req.session.flash = { type: "error", message: "Order not found." };
    return safeRedirect(req, res, partnerUrl("orders"));
  }
  const allowed = ["preparing", "out_for_delivery", "delivered"];
  const status = req.body.status;
  if (!allowed.includes(status) || order.status === "pending" || order.status === "rejected") {
    req.session.flash = { type: "error", message: "This stage change is not allowed." };
    return safeRedirect(req, res, partnerUrl("orders"));
  }
  db.update("orders", order.id, { status });
  notificationService.notify(order.userId, {
    type: "order",
    title: `Order #${order.id} update`,
    message: `Your order for ${order.item} is now: ${status.replace(/_/g, " ")}.`,
    orderId: order.id
  });
  req.session.flash = { type: "success", message: `Order #${order.id} updated.` };
  safeRedirect(req, res, partnerUrl("orders"));
};
