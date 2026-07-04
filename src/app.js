const path = require("path");
const express = require("express");
const session = require("express-session");

const config = require("./config");
const locals = require("./middleware/locals");
const routes = require("./routes");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "public")));

app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
  })
);

app.use(locals);
app.use(routes);

// 404
app.use((req, res) => {
  res.status(404).render("error", {
    title: "Page Not Found",
    code: 404,
    message: "The page you are looking for does not exist."
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render("error", {
    title: "Server Error",
    code: 500,
    message: "Something went wrong. Please try again."
  });
});

module.exports = app;
