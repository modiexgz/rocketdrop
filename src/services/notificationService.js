const db = require("../models/db");

function notify(userId, { type = "info", title, message, orderId = null }) {
  return db.insert("notifications", {
    userId: Number(userId),
    type,
    title,
    message,
    orderId,
    read: false
  });
}

function forUser(userId) {
  return db
    .find("notifications", (n) => n.userId === Number(userId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function unreadCount(userId) {
  return db.find("notifications", (n) => n.userId === Number(userId) && !n.read).length;
}

function markAllRead(userId) {
  const rows = db.readAll("notifications");
  rows.forEach((n) => {
    if (n.userId === Number(userId)) n.read = true;
  });
  db.writeAll("notifications", rows);
}

function markRead(userId, id) {
  const n = db.findById("notifications", id);
  if (n && n.userId === Number(userId)) {
    db.update("notifications", id, { read: true });
  }
}

module.exports = { notify, forUser, unreadCount, markAllRead, markRead };
