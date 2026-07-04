const fs = require("fs");
const path = require("path");
const config = require("../config");

const COLLECTIONS = ["users", "categories", "products", "orders", "partners", "notifications"];

function filePath(collection) {
  return path.join(config.dataDir, `${collection}.json`);
}

function ensureStore() {
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true });
  }
  COLLECTIONS.forEach((c) => {
    if (!fs.existsSync(filePath(c))) {
      fs.writeFileSync(filePath(c), "[]");
    }
  });
}

function readAll(collection) {
  ensureStore();
  return JSON.parse(fs.readFileSync(filePath(collection), "utf8"));
}

function writeAll(collection, rows) {
  ensureStore();
  fs.writeFileSync(filePath(collection), JSON.stringify(rows, null, 2));
}

function nextId(rows) {
  return rows.reduce((max, r) => Math.max(max, r.id || 0), 0) + 1;
}

function find(collection, predicate) {
  return readAll(collection).filter(predicate);
}

function findOne(collection, predicate) {
  return readAll(collection).find(predicate) || null;
}

function findById(collection, id) {
  return findOne(collection, (r) => r.id === Number(id));
}

function insert(collection, doc) {
  const rows = readAll(collection);
  const record = { id: nextId(rows), ...doc, createdAt: doc.createdAt || new Date().toISOString() };
  rows.push(record);
  writeAll(collection, rows);
  return record;
}

function update(collection, id, changes) {
  const rows = readAll(collection);
  const idx = rows.findIndex((r) => r.id === Number(id));
  if (idx === -1) return null;
  rows[idx] = { ...rows[idx], ...changes, updatedAt: new Date().toISOString() };
  writeAll(collection, rows);
  return rows[idx];
}

function remove(collection, id) {
  const rows = readAll(collection);
  const filtered = rows.filter((r) => r.id !== Number(id));
  writeAll(collection, filtered);
  return filtered.length !== rows.length;
}

module.exports = { readAll, writeAll, find, findOne, findById, insert, update, remove, ensureStore };
