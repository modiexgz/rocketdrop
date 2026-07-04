const path = require("path");
const express = require("express");
const session = require("express-session");
const FileStore = require("session-file-store")(session);

const config = require("./config");
const locals = require("./middleware/locals");
const routes = require("./routes");
const { escapeHtml, jsonAttr } = require("./utils/escape");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));
app.locals.escapeHtml = escapeHtml;
app.locals.jsonAttr = jsonAttr;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "public")));

const sessionsDir = path.join(config.dataDir, "sessions");
if (!require("fs").existsSync(sessionsDir)) {
  require("fs").mkdirSync(sessionsDir, { recursive: true });
}

app.use(
  session({
    store: new FileStore({
      path: sessionsDir,
      ttl: 60 * 60 * 24 * 7,
      retries: 1,
      logFn: () => {}
    }),
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "lax"
    }
  })
);

app.use(locals);
app.use(routes);

app.use((req, res) => {
  res.status(404).render("error", {
    title: "Page Not Found",
    code: 404,
    message: "The page you are looking for does not exist."
  });
});

app.use((err, req, res, next) => {
  console.error("[error]", err.stack || err.message || err);
  if (res.headersSent) return next(err);
  const message = process.env.NODE_ENV === "production"
    ? "Something went wrong. Please try again."
    : (err.message || "Something went wrong. Please try again.");
  res.status(err.status || 500).render("error", {
    title: "Server Error",
    code: err.status || 500,
    message
  });
});

module.exports = app;
