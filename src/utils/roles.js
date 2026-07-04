function canPlaceOrders(user) {
  return user && user.role === "user";
}

module.exports = { canPlaceOrders };
