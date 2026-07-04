const db = require("../models/db");

function ensureAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/auth/login");
  }
  next();
}

function ensureAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).render("error", {
      title: "Access Denied",
      code: 403,
      message: "You need administrator access for this page."
    });
  }
  next();
}

function syncPartnerSession(req, partner) {
  if (!req.session.user || !partner) return;
  req.session.user.role = "partner";
  req.session.user.partnerId = partner.id;
  req.partner = partner;
}

function ensurePartner(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/auth/login");
  }

  const partner = db.findOne(
    "partners",
    (p) => p.userId === req.session.user.id && p.status === "approved"
  );

  if (!partner) {
    return res.redirect("/partner/apply");
  }

  syncPartnerSession(req, partner);

  const user = db.findById("users", req.session.user.id);
  if (user && user.role !== "partner") {
    db.update("users", user.id, { role: "partner", partnerId: partner.id });
  }

  next();
}

function ensureStaff(req, res, next) {
  const role = req.session.user && req.session.user.role;
  if (role !== "admin" && role !== "partner") {
    return res.status(403).render("error", {
      title: "Access Denied",
      code: 403,
      message: "You need administrator or partner access for this page."
    });
  }
  next();
}

module.exports = { ensureAuth, ensureAdmin, ensurePartner, ensureStaff, syncPartnerSession };
