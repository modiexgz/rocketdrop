const fs = require("fs");
const path = require("path");
const config = require("../config");

const COLLECTIONS = ["users", "categories", "products", "orders", "partners", "notifications"];

function filePath(collection) {
  return path.join(config.dataDir, `${collection}.json`);
}

function backupPath(collection) {
  return path.join(config.dataDir, `${collection}.json.bak`);
}

function ensureStore() {
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true });
  }
  COLLECTIONS.forEach((c) => {
    const fp = filePath(c);
    if (!fs.existsSync(fp)) {
      atomicWrite(fp, "[]");
    }
  });
}

function atomicWrite(fp, content) {
  const tmp = `${fp}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, content, "utf8");
  fs.renameSync(tmp, fp);
}

function safeParse(raw, collection) {
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error("Root value is not an array");
    return data;
  } catch (err) {
    const bak = backupPath(collection);
    if (fs.existsSync(bak)) {
      try {
        const recovered = JSON.parse(fs.readFileSync(bak, "utf8"));
        console.error(`[db] Recovered ${collection}.json from backup after parse error:`, err.message);
        atomicWrite(filePath(collection), JSON.stringify(recovered, null, 2));
        return recovered;
      } catch (bakErr) {
        console.error(`[db] Backup for ${collection}.json also invalid:`, bakErr.message);
      }
    }
    console.error(`[db] Resetting ${collection}.json to [] after parse error:`, err.message);
    atomicWrite(filePath(collection), "[]");
    return [];
  }
}

function readAll(collection) {
  ensureStore();
  const fp = filePath(collection);
  const raw = fs.readFileSync(fp, "utf8");
  return safeParse(raw, collection);
}

function writeAll(collection, rows) {
  ensureStore();
  const fp = filePath(collection);
  const payload = JSON.stringify(rows, null, 2);
  if (fs.existsSync(fp)) {
    try {
      fs.copyFileSync(fp, backupPath(collection));
    } catch (err) {
      console.error(`[db] Could not backup ${collection}.json:`, err.message);
    }
  }
  atomicWrite(fp, payload);
}

function nextId(rows) {
  return rows.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0) + 1;
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
  const record = {
    id: nextId(rows),
    ...doc,
    createdAt: doc.createdAt || new Date().toISOString()
  };
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
  if (filtered.length === rows.length) return false;
  writeAll(collection, filtered);
  return true;
}

module.exports = { readAll, writeAll, find, findOne, findById, insert, update, remove, ensureStore };
