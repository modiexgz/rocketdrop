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

function ensurePartner(req, res, next) {
  if (!req.session.user || req.session.user.role !== "partner") {
    return res.status(403).render("error", {
      title: "Access Denied",
      code: 403,
      message: "You need an approved partner account for this page."
    });
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

module.exports = { ensureAuth, ensureAdmin, ensurePartner, ensureStaff };
