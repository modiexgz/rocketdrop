const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const db = require("../models/db");
const { ORDER_STATUS_LABELS, PAYMENT_METHODS, PAYMENT_STATUS_LABELS } = require("../models/constants");

function getOrders() {
  return db.readAll("orders").sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function paymentLabel(order) {
  if (!order.payment) return "—";
  const method = (PAYMENT_METHODS[order.payment.method] || {}).label || order.payment.method;
  const status = PAYMENT_STATUS_LABELS[order.payment.status] || order.payment.status;
  return `${method} (${status})`;
}

// Standalone report page — orders table only, no site header/navigation.
exports.ordersReportPage = (req, res) => {
  res.render("admin/report", {
    title: "Orders Report",
    orders: getOrders(),
    statusLabels: ORDER_STATUS_LABELS,
    paymentLabel,
    generatedAt: new Date().toLocaleString("en-UG")
  });
};

// PDF export — inline for print preview, attachment when ?download=1.
exports.ordersPdf = (req, res) => {
  const orders = getOrders();
  const download = req.query.download === "1";

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `${download ? "attachment" : "inline"}; filename="rocketdrop-orders-report.pdf"`
  );

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.pipe(res);

  doc.fontSize(18).fillColor("#111111").text("RocketDrop — Orders Report", { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(9).fillColor("#666666").text(`Generated: ${new Date().toLocaleString("en-UG")}  |  Total orders: ${orders.length}`, { align: "center" });
  doc.moveDown(1);

  const cols = [
    { key: "id", label: "#", width: 25 },
    { key: "item", label: "Item", width: 80 },
    { key: "customer", label: "Customer", width: 90 },
    { key: "qty", label: "Qty", width: 30 },
    { key: "total", label: "Total (UGX)", width: 70 },
    { key: "status", label: "Status", width: 80 },
    { key: "payment", label: "Payment", width: 90 },
    { key: "date", label: "Date", width: 60 }
  ];

  const startX = doc.page.margins.left;
  let y = doc.y;

  function drawRow(values, isHeader) {
    let x = startX;
    const rowHeight = 22;
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;
    }
    if (isHeader) {
      doc.rect(startX, y, cols.reduce((s, c) => s + c.width, 0), rowHeight).fill("#ff5722");
    } else {
      doc.rect(startX, y, cols.reduce((s, c) => s + c.width, 0), rowHeight).fillOpacity(1).fill(values.__odd ? "#faf5f2" : "#ffffff");
    }
    doc.fillColor(isHeader ? "#ffffff" : "#333333").fontSize(8);
    cols.forEach((c) => {
      doc.text(String(isHeader ? c.label : values[c.key] ?? ""), x + 4, y + 7, {
        width: c.width - 8,
        height: rowHeight,
        ellipsis: true
      });
      x += c.width;
    });
    y += rowHeight;
  }

  drawRow(null, true);
  orders.forEach((o, i) => {
    drawRow(
      {
        id: o.id,
        item: o.item,
        customer: o.userName || o.userEmail || "—",
        qty: o.quantity || 1,
        total: Number(o.total || 0).toLocaleString(),
        status: ORDER_STATUS_LABELS[o.status] || o.status,
        payment: paymentLabel(o),
        date: new Date(o.createdAt).toLocaleDateString("en-UG"),
        __odd: i % 2 === 1
      },
      false
    );
  });

  doc.end();
};

// Excel export via exceljs.
exports.ordersExcel = async (req, res) => {
  const orders = getOrders();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "RocketDrop";
  const sheet = workbook.addWorksheet("Orders");

  sheet.columns = [
    { header: "#", key: "id", width: 6 },
    { header: "Item", key: "item", width: 20 },
    { header: "Customer", key: "customer", width: 24 },
    { header: "Email", key: "email", width: 28 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "Qty", key: "qty", width: 6 },
    { header: "Unit Price (UGX)", key: "unitPrice", width: 16 },
    { header: "Total (UGX)", key: "total", width: 14 },
    { header: "Status", key: "status", width: 18 },
    { header: "Payment", key: "payment", width: 28 },
    { header: "Delivery Man", key: "deliveryMan", width: 26 },
    { header: "Date", key: "date", width: 20 }
  ];

  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF5722" } };

  orders.forEach((o) => {
    sheet.addRow({
      id: o.id,
      item: o.item,
      customer: o.userName || "—",
      email: o.userEmail || "—",
      phone: o.userPhone || "—",
      qty: o.quantity || 1,
      unitPrice: o.unitPrice || 0,
      total: o.total || 0,
      status: ORDER_STATUS_LABELS[o.status] || o.status,
      payment: paymentLabel(o),
      deliveryMan: o.deliveryMan ? `${o.deliveryMan.name} (${o.deliveryMan.phone})` : "—",
      date: new Date(o.createdAt).toLocaleString("en-UG")
    });
  });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="rocketdrop-orders-report.xlsx"');

  await workbook.xlsx.write(res);
  res.end();
};
