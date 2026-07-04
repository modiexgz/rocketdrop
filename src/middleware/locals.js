const db = require("../models/db");
const notificationService = require("../services/notificationService");

module.exports = function locals(req, res, next) {
  try {
    if (req.session.user) {
      const fresh = db.findById("users", req.session.user.id);
      if (fresh) {
        req.session.user = {
          id: fresh.id,
          fullName: fresh.fullName,
          email: fresh.email,
          phone: fresh.phone,
          role: fresh.role,
          partnerId: fresh.partnerId || null
        };
      } else {
        req.session.user = null;
      }
    }

    res.locals.currentUser = req.session.user || null;
    res.locals.currentPath = req.path;
    res.locals.flash = req.session.flash || null;
    delete req.session.flash;

    res.locals.unreadNotifications = req.session.user
      ? notificationService.unreadCount(req.session.user.id)
      : 0;
  } catch (err) {
    console.error("[locals] middleware error:", err.message);
    res.locals.currentUser = req.session.user || null;
    res.locals.currentPath = req.path;
    res.locals.flash = null;
    res.locals.unreadNotifications = 0;
  }

  next();
};
