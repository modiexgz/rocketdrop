function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function jsonAttr(value) {
  return escapeHtml(JSON.stringify(value ?? {}));
}

module.exports = { escapeHtml, jsonAttr };
