const ORDER_STAGES = [
  { key: "pending", label: "Order Placed", icon: "receipt" },
  { key: "approved", label: "Approved", icon: "check" },
  { key: "preparing", label: "Preparing", icon: "box" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: "truck" },
  { key: "delivered", label: "Delivered", icon: "home" }
];

const ORDER_STATUS_LABELS = {
  pending: "Pending Approval",
  approved: "Approved",
  preparing: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  rejected: "Rejected"
};

const PAYMENT_METHODS = {
  airtel: { key: "airtel", label: "Airtel Money", color: "#e40000" },
  mtn: { key: "mtn", label: "MTN Mobile Money", color: "#ffcc00" },
  cod: { key: "cod", label: "Cash on Delivery", color: "#34c759" }
};

const PAYMENT_STATUS_LABELS = {
  unpaid: "Unpaid",
  awaiting_confirmation: "Awaiting Confirmation",
  confirmed: "Payment Confirmed"
};

function stageIndex(status) {
  return ORDER_STAGES.findIndex((s) => s.key === status);
}

module.exports = { ORDER_STAGES, ORDER_STATUS_LABELS, PAYMENT_METHODS, PAYMENT_STATUS_LABELS, stageIndex };
